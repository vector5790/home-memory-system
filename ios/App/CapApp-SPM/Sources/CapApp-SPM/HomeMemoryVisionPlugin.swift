import Capacitor
import Accelerate
import CoreGraphics
import Foundation
import OnnxRuntimeBindings
import UIKit

@objc(HomeMemoryVisionPlugin)
public class HomeMemoryVisionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HomeMemoryVisionPlugin"
    public let jsName = "HomeMemoryVision"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "warmUpImageEmbedding", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "embedImageDataUrls", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "embedImageRegions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "benchmarkImageRegions", returnType: CAPPluginReturnPromise)
    ]

    private let modelId = "Xenova/siglip-base-patch16-224"
    private let inputName = "pixel_values"
    private let outputName = "last_hidden_state"
    private let imageSize = 224
    private let outputDimension = 768
    private let imageMean: [Float] = [0.5, 0.5, 0.5]
    private let imageStd: [Float] = [0.5, 0.5, 0.5]
    private let queue = DispatchQueue(label: "home-memory.native-vision.embedding", qos: .userInitiated)

    private var env: ORTEnv?
    private var session: ORTSession?
    private var catalogIndexes: [String: NativeCatalogIndex] = [:]

    @objc func warmUpImageEmbedding(_ call: CAPPluginCall) {
        let requestedModel = call.getString("model") ?? modelId
        guard requestedModel == modelId else {
            call.reject("native embedding only supports \(modelId), got \(requestedModel)", "MODEL_MISMATCH")
            return
        }
        queue.async {
            let startedAt = CFAbsoluteTimeGetCurrent()
            do {
                _ = try self.getSession()
                let indexPath = call.getString("indexPath") ?? ""
                if !indexPath.isEmpty {
                    _ = try self.getCatalogIndex(indexPath)
                }
                call.resolve([
                    "model": self.modelId,
                    "mode": "native-onnxruntime-ios",
                    "ready": true,
                    "dimension": self.outputDimension,
                    "indexReady": !indexPath.isEmpty,
                    "timings": [
                        "loadMs": self.round(self.elapsedMs(since: startedAt))
                    ]
                ])
            } catch {
                call.reject(error.localizedDescription, "NATIVE_EMBEDDING_WARMUP_FAILED")
            }
        }
    }

    @objc func embedImageDataUrls(_ call: CAPPluginCall) {
        let requestedModel = call.getString("model") ?? modelId
        guard requestedModel == modelId else {
            call.reject("native embedding only supports \(modelId), got \(requestedModel)", "MODEL_MISMATCH")
            return
        }
        guard let images = call.getArray("images", String.self), !images.isEmpty else {
            call.reject("images must be a non-empty string array", "INVALID_IMAGES")
            return
        }

        queue.async {
            let totalStartedAt = CFAbsoluteTimeGetCurrent()
            do {
                let loadStartedAt = CFAbsoluteTimeGetCurrent()
                let session = try self.getSession()
                let loadMs = self.elapsedMs(since: loadStartedAt)

                var preprocessMs = 0.0
                var postprocessMs = 0.0
                var batchValues: [Float] = []
                batchValues.reserveCapacity(images.count * 3 * self.imageSize * self.imageSize)

                for image in images {
                    let preprocessStartedAt = CFAbsoluteTimeGetCurrent()
                    let tensorValues = try self.pixelValues(from: image)
                    preprocessMs += self.elapsedMs(since: preprocessStartedAt)
                    batchValues.append(contentsOf: tensorValues)
                }

                let tensorData = NSMutableData(
                    bytes: &batchValues,
                    length: batchValues.count * MemoryLayout<Float>.size
                )
                let input = try ORTValue(
                    tensorData: tensorData,
                    elementType: ORTTensorElementDataType.float,
                    shape: [
                        NSNumber(value: images.count),
                        NSNumber(value: 3),
                        NSNumber(value: self.imageSize),
                        NSNumber(value: self.imageSize)
                    ]
                )

                let inferenceStartedAt = CFAbsoluteTimeGetCurrent()
                let outputs = try session.run(
                    withInputs: [self.inputName: input],
                    outputNames: [self.outputName],
                    runOptions: nil
                )
                let inferenceMs = self.elapsedMs(since: inferenceStartedAt)

                let postprocessStartedAt = CFAbsoluteTimeGetCurrent()
                guard let output = outputs[self.outputName] else {
                    throw NativeVisionError.runtime("missing output \(self.outputName)")
                }
                let vectors = try self.normalizedVectors(from: output, expectedCount: images.count)
                for vector in vectors {
                    guard vector.count == self.outputDimension else {
                        throw NativeVisionError.runtime("unexpected output dimension \(vector.count), expected \(self.outputDimension)")
                    }
                }
                postprocessMs += self.elapsedMs(since: postprocessStartedAt)

                call.resolve([
                    "model": self.modelId,
                    "mode": "native-onnxruntime-ios",
                    "dimension": self.outputDimension,
                    "vectors": vectors,
                    "timings": [
                        "loadMs": self.round(loadMs),
                        "preprocessMs": self.round(preprocessMs),
                        "inferenceMs": self.round(inferenceMs),
                        "postprocessMs": self.round(postprocessMs),
                        "totalMs": self.round(self.elapsedMs(since: totalStartedAt))
                    ]
                ])
            } catch {
                call.reject(error.localizedDescription, "NATIVE_EMBEDDING_FAILED")
            }
        }
    }

    @objc func embedImageRegions(_ call: CAPPluginCall) {
        let requestedModel = call.getString("model") ?? modelId
        guard requestedModel == modelId else {
            call.reject("native embedding only supports \(modelId), got \(requestedModel)", "MODEL_MISMATCH")
            return
        }
        guard let image = call.getString("image"), !image.isEmpty else {
            call.reject("image must be a non-empty data url or local file path", "INVALID_IMAGE")
            return
        }
        guard let regions = call.getArray("regions", JSObject.self), !regions.isEmpty else {
            call.reject("regions must be a non-empty array", "INVALID_REGIONS")
            return
        }

        queue.async {
            do {
                let indexPath = call.getString("indexPath") ?? ""
                let topK = max(1, call.getInt("topK") ?? 0)
                let result = try self.runRegionEmbedding(
                    image: image,
                    regions: regions,
                    indexPath: indexPath,
                    topK: topK,
                    includeVectors: indexPath.isEmpty
                )
                call.resolve(result)
            } catch {
                call.reject(error.localizedDescription, "NATIVE_REGION_EMBEDDING_FAILED")
            }
        }
    }

    @objc func benchmarkImageRegions(_ call: CAPPluginCall) {
        let requestedModel = call.getString("model") ?? modelId
        guard requestedModel == modelId else {
            call.reject("native embedding only supports \(modelId), got \(requestedModel)", "MODEL_MISMATCH")
            return
        }
        guard let image = call.getString("image"), !image.isEmpty else {
            call.reject("image must be a non-empty data url or local file path", "INVALID_IMAGE")
            return
        }
        guard let regions = call.getArray("regions", JSObject.self), !regions.isEmpty else {
            call.reject("regions must be a non-empty array", "INVALID_REGIONS")
            return
        }
        let batchSizes = (call.getArray("batchSizes", NSNumber.self) ?? [1, 2, 4, 8, 12, 16])
            .map { max(1, $0.intValue) }
        let repeats = max(1, call.getInt("repeats") ?? 3)
        let indexPath = call.getString("indexPath") ?? ""
        let topK = max(1, call.getInt("topK") ?? 5)

        queue.async {
            let benchmarkStartedAt = CFAbsoluteTimeGetCurrent()
            do {
                let loadStartedAt = CFAbsoluteTimeGetCurrent()
                _ = try self.getSession()
                if !indexPath.isEmpty {
                    _ = try self.getCatalogIndex(indexPath)
                }
                let loadMs = self.elapsedMs(since: loadStartedAt)
                var rows: [JSObject] = []
                for batchSize in batchSizes {
                    let batchRegions = (0..<batchSize).map { regions[$0 % regions.count] }
                    for repeatIndex in 0..<repeats {
                        let result = try self.runRegionEmbedding(
                            image: image,
                            regions: batchRegions,
                            indexPath: indexPath,
                            topK: topK,
                            includeVectors: false
                        )
                        let timings = result["timings"] as? JSObject ?? [:]
                        let totalMs = self.number(from: timings["totalMs"])
                        rows.append([
                            "batchSize": batchSize,
                            "repeat": repeatIndex + 1,
                            "decodeMs": timings["decodeMs"] ?? 0,
                            "preprocessMs": timings["preprocessMs"] ?? 0,
                            "inferenceMs": timings["inferenceMs"] ?? 0,
                            "postprocessMs": timings["postprocessMs"] ?? 0,
                            "searchMs": timings["searchMs"] ?? 0,
                            "totalMs": timings["totalMs"] ?? 0,
                            "perItemMs": self.round(totalMs / Double(max(1, batchSize))),
                            "indexFormat": timings["indexFormat"] ?? "",
                        ] as JSObject)
                    }
                }
                call.resolve([
                    "model": self.modelId,
                    "mode": "native-onnxruntime-ios-regions-benchmark",
                    "dimension": self.outputDimension,
                    "loadMs": self.round(loadMs),
                    "rows": rows,
                    "timings": [
                        "totalMs": self.round(self.elapsedMs(since: benchmarkStartedAt))
                    ]
                ])
            } catch {
                call.reject(error.localizedDescription, "NATIVE_REGION_BENCHMARK_FAILED")
            }
        }
    }

    private func runRegionEmbedding(image: String, regions: [JSObject], indexPath: String, topK: Int, includeVectors: Bool) throws -> JSObject {
        let totalStartedAt = CFAbsoluteTimeGetCurrent()
        let loadStartedAt = CFAbsoluteTimeGetCurrent()
        let session = try getSession()
        let loadMs = elapsedMs(since: loadStartedAt)

        let decodeStartedAt = CFAbsoluteTimeGetCurrent()
        let data = try decodeImageData(image)
        guard let uiImage = UIImage(data: data), let cgImage = uiImage.cgImage else {
            throw NativeVisionError.runtime("failed to decode source image")
        }
        let decodeMs = elapsedMs(since: decodeStartedAt)

        var preprocessMs = 0.0
        var batchValues: [Float] = []
        batchValues.reserveCapacity(regions.count * 3 * imageSize * imageSize)
        for region in regions {
            let preprocessStartedAt = CFAbsoluteTimeGetCurrent()
            let rect = try pixelRect(from: region, imageWidth: cgImage.width, imageHeight: cgImage.height)
            let tensorValues = try pixelValues(from: cgImage, cropRect: rect)
            preprocessMs += elapsedMs(since: preprocessStartedAt)
            batchValues.append(contentsOf: tensorValues)
        }

        let tensorData = NSMutableData(
            bytes: &batchValues,
            length: batchValues.count * MemoryLayout<Float>.size
        )
        let input = try ORTValue(
            tensorData: tensorData,
            elementType: ORTTensorElementDataType.float,
            shape: [
                NSNumber(value: regions.count),
                NSNumber(value: 3),
                NSNumber(value: imageSize),
                NSNumber(value: imageSize)
            ]
        )

        let inferenceStartedAt = CFAbsoluteTimeGetCurrent()
        let outputs = try session.run(
            withInputs: [inputName: input],
            outputNames: [outputName],
            runOptions: nil
        )
        let inferenceMs = elapsedMs(since: inferenceStartedAt)

        let postprocessStartedAt = CFAbsoluteTimeGetCurrent()
        guard let output = outputs[outputName] else {
            throw NativeVisionError.runtime("missing output \(outputName)")
        }
        let vectors = try normalizedVectors(from: output, expectedCount: regions.count)
        let postprocessMs = elapsedMs(since: postprocessStartedAt)

        let searchStartedAt = CFAbsoluteTimeGetCurrent()
        let matches = indexPath.isEmpty ? [] : try rankCatalogVectors(vectors, indexPath: indexPath, topK: topK)
        let searchMs = elapsedMs(since: searchStartedAt)

        var payload: JSObject = [
            "model": modelId,
            "mode": "native-onnxruntime-ios-regions",
            "dimension": outputDimension,
            "matches": matches,
            "timings": [
                "loadMs": round(loadMs),
                "decodeMs": round(decodeMs),
                "preprocessMs": round(preprocessMs),
                "inferenceMs": round(inferenceMs),
                "postprocessMs": round(postprocessMs),
                "searchMs": round(searchMs),
                "indexFormat": catalogIndexes[indexPath]?.format ?? "",
                "totalMs": round(elapsedMs(since: totalStartedAt))
            ] as JSObject
        ]
        if includeVectors {
            payload["vectors"] = vectors
        }
        return payload
    }

    private func getSession() throws -> ORTSession {
        if let session = session {
            return session
        }

        let env = try ORTEnv(loggingLevel: ORTLoggingLevel.warning)
        let options = try ORTSessionOptions()
        try options.setGraphOptimizationLevel(ORTGraphOptimizationLevel.all)
        let processorCount = max(2, ProcessInfo.processInfo.processorCount)
        try options.setIntraOpNumThreads(Int32(min(4, max(2, processorCount - 1))))

        guard let modelPath = findVisionModelPath() else {
            throw NativeVisionError.runtime("missing SigLIP vision model in app bundle")
        }
        let session = try ORTSession(env: env, modelPath: modelPath, sessionOptions: options)
        self.env = env
        self.session = session
        return session
    }

    private func findVisionModelPath() -> String? {
        let relativePath = "public/vendor/models/Xenova/siglip-base-patch16-224/onnx/vision_model_quantized.onnx"
        if let resourcePath = Bundle.main.resourcePath {
            let fullPath = (resourcePath as NSString).appendingPathComponent(relativePath)
            if FileManager.default.fileExists(atPath: fullPath) {
                return fullPath
            }
        }
        return Bundle.main.path(
            forResource: "vision_model_quantized",
            ofType: "onnx",
            inDirectory: "public/vendor/models/Xenova/siglip-base-patch16-224/onnx"
        )
    }

    private func pixelValues(from dataUrl: String) throws -> [Float] {
        let data = try decodeImageData(dataUrl)
        guard let image = UIImage(data: data), let cgImage = image.cgImage else {
            throw NativeVisionError.runtime("failed to decode image")
        }
        return try pixelValues(from: cgImage)
    }

    private func pixelValues(from image: CGImage, cropRect: CGRect? = nil) throws -> [Float] {
        let renderImage: CGImage
        if let cropRect = cropRect {
            let bounded = cropRect.integral.intersection(CGRect(x: 0, y: 0, width: image.width, height: image.height))
            guard bounded.width >= 1, bounded.height >= 1, let cropped = image.cropping(to: bounded) else {
                throw NativeVisionError.runtime("failed to crop image region")
            }
            renderImage = cropped
        } else {
            renderImage = image
        }
        guard let rgba = resizeToRGBA(renderImage) else {
            throw NativeVisionError.runtime("failed to render image pixels")
        }

        let planeSize = imageSize * imageSize
        var values = Array(repeating: Float(0), count: planeSize * 3)
        for index in 0..<planeSize {
            let offset = index * 4
            let red = Float(rgba[offset]) / 255.0
            let green = Float(rgba[offset + 1]) / 255.0
            let blue = Float(rgba[offset + 2]) / 255.0
            values[index] = (red - imageMean[0]) / imageStd[0]
            values[planeSize + index] = (green - imageMean[1]) / imageStd[1]
            values[(planeSize * 2) + index] = (blue - imageMean[2]) / imageStd[2]
        }
        return values
    }

    private func pixelRect(from region: JSObject, imageWidth: Int, imageHeight: Int) throws -> CGRect {
        let xPct = number(from: region["x"])
        let yPct = number(from: region["y"])
        let wPct = number(from: region["w"])
        let hPct = number(from: region["h"])
        guard wPct > 0, hPct > 0 else {
            throw NativeVisionError.runtime("invalid region dimensions")
        }
        let sourceWidth = CGFloat(imageWidth)
        let sourceHeight = CGFloat(imageHeight)
        let x1 = max(0, min(sourceWidth, CGFloat(xPct / 100.0) * sourceWidth))
        let y1 = max(0, min(sourceHeight, CGFloat(yPct / 100.0) * sourceHeight))
        let x2 = max(x1 + 1, min(sourceWidth, CGFloat((xPct + wPct) / 100.0) * sourceWidth))
        let y2 = max(y1 + 1, min(sourceHeight, CGFloat((yPct + hPct) / 100.0) * sourceHeight))
        return CGRect(x: x1, y: y1, width: x2 - x1, height: y2 - y1)
    }

    private func number(from value: Any?) -> Double {
        if let number = value as? NSNumber {
            return number.doubleValue
        }
        if let double = value as? Double {
            return double
        }
        if let string = value as? String {
            return Double(string) ?? 0
        }
        return 0
    }

    private func decodeImageData(_ dataUrl: String) throws -> Data {
        if dataUrl.hasPrefix("data:") {
            guard let commaIndex = dataUrl.firstIndex(of: ",") else {
                throw NativeVisionError.runtime("invalid data url")
            }
            let base64 = String(dataUrl[dataUrl.index(after: commaIndex)...])
            guard let data = Data(base64Encoded: base64) else {
                throw NativeVisionError.runtime("invalid base64 image data")
            }
            return data
        }
        if dataUrl.hasPrefix("file://"), let url = URL(string: dataUrl) {
            return try Data(contentsOf: url)
        }
        if FileManager.default.fileExists(atPath: dataUrl) {
            return try Data(contentsOf: URL(fileURLWithPath: dataUrl))
        }
        throw NativeVisionError.runtime("native embedding expects data url or local file path")
    }

    private func resizeToRGBA(_ image: CGImage) -> [UInt8]? {
        let width = imageSize
        let height = imageSize
        var pixels = Array(repeating: UInt8(0), count: width * height * 4)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
        guard let context = CGContext(
            data: &pixels,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width * 4,
            space: colorSpace,
            bitmapInfo: bitmapInfo
        ) else {
            return nil
        }
        context.interpolationQuality = .high
        let sourceWidth = CGFloat(image.width)
        let sourceHeight = CGFloat(image.height)
        let targetSize = CGFloat(imageSize)
        let scale = max(targetSize / sourceWidth, targetSize / sourceHeight)
        let drawWidth = sourceWidth * scale
        let drawHeight = sourceHeight * scale
        let drawX = (targetSize - drawWidth) / 2.0
        let drawY = (targetSize - drawHeight) / 2.0
        context.draw(image, in: CGRect(x: drawX, y: drawY, width: drawWidth, height: drawHeight))
        return pixels
    }

    private func rankCatalogVectors(_ vectors: [[Float]], indexPath: String, topK: Int) throws -> [[JSObject]] {
        let index = try getCatalogIndex(indexPath)
        return vectors.map { vector in
            guard vector.count == index.dimension else { return [] }
            var scores = Array(repeating: Float(0), count: index.ids.count)
            index.values.withUnsafeBufferPointer { valuesPointer in
                vector.withUnsafeBufferPointer { vectorPointer in
                    scores.withUnsafeMutableBufferPointer { scoresPointer in
                        cblas_sgemv(
                            CblasRowMajor,
                            CblasNoTrans,
                            Int32(index.ids.count),
                            Int32(index.dimension),
                            1.0,
                            valuesPointer.baseAddress!,
                            Int32(index.dimension),
                            vectorPointer.baseAddress!,
                            1,
                            0.0,
                            scoresPointer.baseAddress!,
                            1
                        )
                    }
                }
            }
            var top: [(id: String, score: Float)] = []
            top.reserveCapacity(topK)
            for entryIndex in scores.indices {
                let score = scores[entryIndex]
                insertTopMatch(&top, id: index.ids[entryIndex], score: score, limit: topK)
            }
            return top.map { item in
                [
                    "id": item.id,
                    "score": Double(item.score)
                ] as JSObject
            }
        }
    }

    private func insertTopMatch(_ top: inout [(id: String, score: Float)], id: String, score: Float, limit: Int) {
        if top.count >= limit, let last = top.last, score <= last.score {
            return
        }
        var insertAt = top.count
        while insertAt > 0, score > top[insertAt - 1].score {
            insertAt -= 1
        }
        top.insert((id: id, score: score), at: insertAt)
        if top.count > limit {
            top.removeLast()
        }
    }

    private func getCatalogIndex(_ indexPath: String) throws -> NativeCatalogIndex {
        if let cached = catalogIndexes[indexPath] {
            return cached
        }
        if let packageIndex = try loadPackageCatalogIndex(indexPath) {
            catalogIndexes[indexPath] = packageIndex
            return packageIndex
        }
        if let binaryIndex = try loadBinaryCatalogIndex(indexPath) {
            catalogIndexes[indexPath] = binaryIndex
            return binaryIndex
        }
        guard let path = findCatalogIndexPath(indexPath) else {
            throw NativeVisionError.runtime("missing catalog index \(indexPath)")
        }
        let data = try Data(contentsOf: URL(fileURLWithPath: path))
        guard
            let root = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let entries = root["entries"] as? [[String: Any]]
        else {
            throw NativeVisionError.runtime("invalid catalog index JSON")
        }
        var ids: [String] = []
        var values: [Float] = []
        var dimension = 0
        for entry in entries {
            guard
                let id = entry["id"] as? String,
                let embeddingNumbers = entry["embedding"] as? [NSNumber]
            else {
                continue
            }
            if dimension == 0 {
                dimension = embeddingNumbers.count
            }
            guard embeddingNumbers.count == dimension else {
                continue
            }
            ids.append(id)
            values.append(contentsOf: normalize(Array(embeddingNumbers.map { $0.floatValue })))
        }
        guard dimension > 0, !ids.isEmpty else {
            throw NativeVisionError.runtime("catalog index has no compatible embeddings")
        }
        let index = NativeCatalogIndex(ids: ids, values: values, dimension: dimension, format: "json")
        catalogIndexes[indexPath] = index
        return index
    }

    private func loadPackageCatalogIndex(_ indexPath: String) throws -> NativeCatalogIndex? {
        guard let manifestPath = findPackageManifestPath(indexPath) else {
            return nil
        }
        let manifestData = try Data(contentsOf: URL(fileURLWithPath: manifestPath))
        guard
            let manifest = try JSONSerialization.jsonObject(with: manifestData) as? [String: Any],
            let assets = manifest["assets"] as? [String: Any],
            let metadataName = assets["metadata"] as? String,
            let vectorsName = assets["vectors"] as? String,
            let dimensionNumber = manifest["dimension"] as? NSNumber,
            let entryCountNumber = manifest["entryCount"] as? NSNumber
        else {
            throw NativeVisionError.runtime("invalid package catalog manifest")
        }
        let packageDir = (manifestPath as NSString).deletingLastPathComponent
        let metadataPath = (packageDir as NSString).appendingPathComponent(metadataName)
        let vectorsPath = (packageDir as NSString).appendingPathComponent(vectorsName)
        let metadataData = try Data(contentsOf: URL(fileURLWithPath: metadataPath))
        guard
            let metadata = try JSONSerialization.jsonObject(with: metadataData) as? [String: Any],
            let entries = metadata["entries"] as? [[String: Any]]
        else {
            throw NativeVisionError.runtime("invalid package catalog metadata")
        }
        let dimension = dimensionNumber.intValue
        let entryCount = entryCountNumber.intValue
        guard dimension > 0, entries.count == entryCount else {
            throw NativeVisionError.runtime("invalid package catalog shape \(entries.count)x\(dimension), expected \(entryCount)")
        }
        let ids = entries.compactMap { $0["id"] as? String }
        guard ids.count == entryCount else {
            throw NativeVisionError.runtime("package catalog metadata has missing ids")
        }
        let valuesData = try Data(contentsOf: URL(fileURLWithPath: vectorsPath))
        let expectedBytes = entryCount * dimension * MemoryLayout<Float>.size
        guard valuesData.count == expectedBytes else {
            throw NativeVisionError.runtime("invalid package catalog vectors size \(valuesData.count), expected \(expectedBytes)")
        }
        let values = valuesData.withUnsafeBytes { bytes in
            Array(bytes.bindMemory(to: Float.self))
        }
        return NativeCatalogIndex(ids: ids, values: values, dimension: dimension, format: "package-binary")
    }

    private func findPackageManifestPath(_ indexPath: String) -> String? {
        let trimmed = indexPath.hasPrefix("/") ? String(indexPath.dropFirst()) : indexPath
        if trimmed.hasSuffix("manifest.json") {
            return findBundledPath(trimmed)
        }
        if trimmed.hasSuffix("vectors.f32") || trimmed.hasSuffix("metadata.json") {
            let directory = (trimmed as NSString).deletingLastPathComponent
            return findBundledPath("\(directory)/manifest.json")
        }
        return findBundledPath("\(trimmed.trimmingCharacters(in: CharacterSet(charactersIn: "/")))/manifest.json")
    }

    private func loadBinaryCatalogIndex(_ indexPath: String) throws -> NativeCatalogIndex? {
        guard
            let idsPath = findNativeIdsPath(indexPath),
            let idsData = try? Data(contentsOf: URL(fileURLWithPath: idsPath)),
            let manifest = try JSONSerialization.jsonObject(with: idsData) as? [String: Any],
            let ids = manifest["ids"] as? [String],
            let dimensionNumber = manifest["dimension"] as? NSNumber,
            let countNumber = manifest["count"] as? NSNumber,
            let valuesPathValue = manifest["valuesPath"] as? String,
            let valuesPath = findBundledPath(valuesPathValue)
        else {
            return nil
        }
        let dimension = dimensionNumber.intValue
        let count = countNumber.intValue
        guard dimension > 0, count == ids.count else {
            throw NativeVisionError.runtime("invalid native catalog index manifest")
        }
        let valuesData = try Data(contentsOf: URL(fileURLWithPath: valuesPath))
        let expectedBytes = count * dimension * MemoryLayout<Float>.size
        guard valuesData.count == expectedBytes else {
            throw NativeVisionError.runtime("invalid native catalog matrix size \(valuesData.count), expected \(expectedBytes)")
        }
        let values = valuesData.withUnsafeBytes { bytes in
            Array(bytes.bindMemory(to: Float.self))
        }
        return NativeCatalogIndex(ids: ids, values: values, dimension: dimension, format: "binary")
    }

    private func findNativeIdsPath(_ indexPath: String) -> String? {
        let trimmed = indexPath.hasPrefix("/") ? String(indexPath.dropFirst()) : indexPath
        let nsPath = trimmed as NSString
        let directory = nsPath.deletingLastPathComponent
        let base = (nsPath.lastPathComponent as NSString).deletingPathExtension
        let relativePath = directory.isEmpty
            ? "\(base).native-ids.json"
            : "\(directory)/\(base).native-ids.json"
        return findBundledPath(relativePath)
    }

    private func findCatalogIndexPath(_ indexPath: String) -> String? {
        findBundledPath(indexPath)
    }

    private func findBundledPath(_ relativeOrAbsolutePath: String) -> String? {
        if FileManager.default.fileExists(atPath: relativeOrAbsolutePath) {
            return relativeOrAbsolutePath
        }
        let indexPath = relativeOrAbsolutePath
        let trimmed = indexPath.hasPrefix("/") ? String(indexPath.dropFirst()) : indexPath
        let candidates = [
            "public/\(trimmed)",
            trimmed
        ]
        if let resourcePath = Bundle.main.resourcePath {
            for candidate in candidates {
                let fullPath = (resourcePath as NSString).appendingPathComponent(candidate)
                if FileManager.default.fileExists(atPath: fullPath) {
                    return fullPath
                }
            }
        }
        return nil
    }

    private func normalize(_ values: [Float]) -> [Float] {
        let norm = sqrt(values.reduce(Float(0)) { sum, value in sum + value * value })
        guard norm.isFinite, norm > 0 else { return values }
        return values.map { $0 / norm }
    }

    private func normalizedVectors(from value: ORTValue, expectedCount: Int) throws -> [[Float]] {
        let tensorData = try value.tensorData()
        let count = tensorData.length / MemoryLayout<Float>.size
        let pointer = tensorData.bytes.bindMemory(to: Float.self, capacity: count)
        if count == expectedCount * outputDimension {
            return (0..<expectedCount).map { index in
                let start = index * outputDimension
                var vector = Array(repeating: Float(0), count: outputDimension)
                var normSquared = Float(0)
                for dimensionIndex in 0..<outputDimension {
                    let value = pointer[start + dimensionIndex]
                    vector[dimensionIndex] = value
                    normSquared += value * value
                }
                return normalizeVectorInPlace(vector, normSquared: normSquared)
            }
        }
        guard count % (expectedCount * outputDimension) == 0 else {
            throw NativeVisionError.runtime("unexpected output element count \(count), expected \(expectedCount * outputDimension) or pooled patch tensor")
        }
        let tokenCount = count / (expectedCount * outputDimension)
        return (0..<expectedCount).map { index in
            let batchStart = index * tokenCount * outputDimension
            var pooled = Array(repeating: Float(0), count: outputDimension)
            for token in 0..<tokenCount {
                let tokenStart = batchStart + token * outputDimension
                for dimensionIndex in 0..<outputDimension {
                    pooled[dimensionIndex] += pointer[tokenStart + dimensionIndex]
                }
            }
            var normSquared = Float(0)
            for dimensionIndex in 0..<outputDimension {
                let value = pooled[dimensionIndex] / Float(tokenCount)
                pooled[dimensionIndex] = value
                normSquared += value * value
            }
            return normalizeVectorInPlace(pooled, normSquared: normSquared)
        }
    }

    private func normalizeVectorInPlace(_ vector: [Float], normSquared: Float) -> [Float] {
        var vector = vector
        let norm = sqrt(normSquared)
        guard norm.isFinite, norm > 0 else { return vector }
        for index in vector.indices {
            vector[index] = vector[index] / norm
        }
        return vector
    }

    private func normalizedVector(_ values: [Float]) -> [Float] {
        var values = values
        let norm = sqrt(values.reduce(Float(0)) { sum, value in sum + value * value })
        guard norm.isFinite, norm > 0 else { return values }
        for index in values.indices {
            values[index] = values[index] / norm
        }
        return values
    }

    private func elapsedMs(since start: CFAbsoluteTime) -> Double {
        (CFAbsoluteTimeGetCurrent() - start) * 1000.0
    }

    private func round(_ value: Double) -> Double {
        (value * 1000.0).rounded() / 1000.0
    }
}

private struct NativeCatalogIndex {
    let ids: [String]
    let values: [Float]
    let dimension: Int
    let format: String
}

private enum NativeVisionError: LocalizedError {
    case runtime(String)

    var errorDescription: String? {
        switch self {
        case .runtime(let message):
            return message
        }
    }
}
