import { createCatalogMatcher } from "./catalog-matcher.js";

export function createVisionRecognitionPipeline({
  boxIou,
  clampBox,
  clampNumber,
  dedupeCandidates,
  fetchJsonIndex,
  getCatalogPromptEntries,
  getCapturePromptRoomType,
  getDetectionLabelEntries,
  getDetectionLabelMeta,
  getGroundingLabelEntries,
  getGroundingPromptShards,
  getUnknownObjectName,
  isStorageDetectionLabel,
  isUnknownObjectName,
  loadImage,
  mapDisplayBoxToModelBox,
  normalizeCandidate,
  normalizeCropMeta,
  normalizeDetectionLabel,
  normalizeImageMeta,
  platform,
  recognizeWithHeuristicRegions,
  renumberUnknownCandidates,
  visionCatalog,
  visionConfig,
}) {
  let visionAssetModePromise = null;
  let transformersModulePromise = null;
  let onnxRuntimeModulePromise = null;
  let yoloxDetectorPromise = null;
  let groundingDinoDetectorPromise = null;
  let smallModelDetectorPromise = null;
  let samSegmenterPromise = null;
  async function getVisionAssetMode() {
    if (!visionAssetModePromise) {
      visionAssetModePromise = fetch(`${visionConfig.localManifest}?v=${visionConfig.assetVersion}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((manifest) => {
          const models = new Set(Array.isArray(manifest?.models) ? manifest.models : []);
          const hasLocalRuntime = Boolean(manifest?.transformers);
          const owlReady = models.has(visionConfig.detectionModel);
          const groundingReady = models.has(visionConfig.groundingDinoModel);
          return {
            local: hasLocalRuntime && (groundingReady || owlReady),
            hasLocalRuntime,
            owlReady,
            groundingReady,
            samReady: models.has(visionConfig.samModel),
            catalogReady: models.has(visionConfig.catalogModel),
            manifest,
          };
        })
        .catch(() => ({
          local: false,
          hasLocalRuntime: false,
          owlReady: false,
          groundingReady: false,
          samReady: false,
          catalogReady: false,
          manifest: null,
        }));
    }
    return visionAssetModePromise;
  }

  async function loadTransformersRuntime() {
    if (!transformersModulePromise) {
      transformersModulePromise = (async () => {
        const assetMode = await getVisionAssetMode();
        let module = null;
        let runtimeMode = assetMode;
        if (assetMode.hasLocalRuntime) {
          try {
            module = await import(`${visionConfig.localTransformersModule}?v=${visionConfig.assetVersion}`);
          } catch (error) {
            console.info("Local Transformers.js asset unavailable, using CDN fallback.", error);
            runtimeMode = {
              ...assetMode,
              local: false,
              hasLocalRuntime: false,
              manifest: null,
            };
          }
        }
        if (!module) {
          if (!visionConfig.allowRemoteVisionModels) {
            throw new Error("本地视觉模型资产未安装，请先运行 python3 scripts/download-vision-assets.py");
          }
          module = await import(visionConfig.remoteTransformersModule);
        }

        module.env.allowLocalModels = runtimeMode.hasLocalRuntime;
        module.env.allowRemoteModels = Boolean(visionConfig.allowRemoteVisionModels);
        module.env.localModelPath = visionConfig.localModelPath;
        module.env.useBrowserCache = false;
        configureTransformersRuntime(module);

        return { ...module, runtimeMode };
      })();
    }
    return transformersModulePromise;
  }

  function getVisionWasmThreadCount() {
    if (!window.crossOriginIsolated || typeof SharedArrayBuffer === "undefined") return 1;
    const cores = Number(navigator.hardwareConcurrency) || 2;
    return Math.max(1, Math.min(visionConfig.maxWasmThreads, Math.max(1, cores - 1)));
  }

  function configureTransformersRuntime(module) {
    try {
      const wasmBackend = module.env?.backends?.onnx?.wasm;
      if (!wasmBackend) return;
      wasmBackend.numThreads = getVisionWasmThreadCount();
      wasmBackend.wasmPaths = "/vendor/transformers/";
    } catch (error) {
      console.info("Vision runtime thread tuning skipped.", error);
    }
  }

  async function loadOnnxRuntime() {
    if (!onnxRuntimeModulePromise) {
      onnxRuntimeModulePromise = import(`${visionConfig.localOnnxRuntimeModule}?v=${visionConfig.appVersion}`)
        .then((module) => {
          if (module.env?.wasm) {
            module.env.wasm.wasmPaths = "/vendor/onnxruntime/";
            module.env.wasm.numThreads = getVisionWasmThreadCount();
          }
          return module;
        })
        .catch((error) => {
          onnxRuntimeModulePromise = null;
          throw error;
        });
    }
    return onnxRuntimeModulePromise;
  }

  async function getYoloxDetector() {
    if (!yoloxDetectorPromise) {
      yoloxDetectorPromise = loadOnnxRuntime()
        .then(async (ort) => {
          const session = await ort.InferenceSession.create(`${visionConfig.yoloxModelPath}?v=${visionConfig.appVersion}`, {
            executionProviders: ["wasm"],
            graphOptimizationLevel: "all",
          });
          return {
            kind: "yolox-household-subject",
            modelId: visionConfig.yoloxModelPath,
            session,
            ort,
            inputName: session.inputNames?.[0] || "images",
            outputName: session.outputNames?.[0] || "output",
            inputSize: Math.max(32, Number(visionConfig.yoloxInputSize) || 416),
          };
        })
        .catch((error) => {
          yoloxDetectorPromise = null;
          throw error;
        });
    }
    return yoloxDetectorPromise;
  }

  async function getGroundingDinoDetector() {
    if (!groundingDinoDetectorPromise) {
      groundingDinoDetectorPromise = loadTransformersRuntime()
        .then(async ({ AutoModelForZeroShotObjectDetection, AutoProcessor, RawImage, load_image }) => {
          if (!AutoModelForZeroShotObjectDetection || !AutoProcessor) {
            throw new Error("当前 Transformers.js 运行时不支持 Grounding DINO");
          }
          const processor = await AutoProcessor.from_pretrained(visionConfig.groundingDinoModel);
          const model = await AutoModelForZeroShotObjectDetection.from_pretrained(visionConfig.groundingDinoModel, { dtype: "q8" });
          return {
            kind: "grounding-dino",
            processor,
            model,
            RawImage,
            loadImage: load_image,
          };
        })
        .catch((error) => {
          groundingDinoDetectorPromise = null;
          throw error;
        });
    }
    return groundingDinoDetectorPromise;
  }

  async function getSmallModelDetector() {
    if (!smallModelDetectorPromise) {
      smallModelDetectorPromise = loadTransformersRuntime()
        .then(({ pipeline }) => pipeline("zero-shot-object-detection", visionConfig.detectionModel, { quantized: true }))
        .catch((error) => {
          smallModelDetectorPromise = null;
          throw error;
        });
    }
    return smallModelDetectorPromise;
  }

  async function getSamSegmenter() {
    if (!samSegmenterPromise) {
      samSegmenterPromise = (async () => {
        const assetMode = await getVisionAssetMode();
        if (!assetMode.samReady) return null;
        const { AutoProcessor, RawImage, SamModel, runtimeMode } = await loadTransformersRuntime();
        if (!AutoProcessor || !RawImage || !SamModel) return null;
        const processor = await AutoProcessor.from_pretrained(visionConfig.samModel, { quantized: true });
        const model = await SamModel.from_pretrained(visionConfig.samModel, { quantized: true });
        return {
          processor,
          model,
          RawImage,
          provider: runtimeMode.samReady ? "local-sam" : "browser-sam",
        };
      })().catch((error) => {
        console.info("SAM refinement unavailable.", error);
        samSegmenterPromise = null;
        return null;
      });
    }
    return samSegmenterPromise;
  }

  function warmVisionModels() {
    window.setTimeout(async () => {
      const assetMode = await getVisionAssetMode();
      if (!assetMode.hasLocalRuntime) return;
      loadTransformersRuntime().then(() => {
        getGroundingLabelEntries();
        warmCaptureDetectionModel();
        window.setTimeout(() => {
          getCatalogEmbeddingIndex().catch(() => null);
          if (assetMode.catalogReady) {
            getCatalogFeatureExtractor().catch((error) => {
              console.info("Catalog naming prewarm skipped.", error);
            });
          }
        }, 1000);
      }).catch((error) => {
        console.info("Vision runtime prewarm skipped.", error);
      });
    }, 250);
  }

  function warmCaptureDetectionModel() {
    window.setTimeout(async () => {
      const assetMode = await getVisionAssetMode();
      if (!assetMode.local) return;
      const attempt = getDetectorAttempts(assetMode)[0];
      if (!attempt) return;
      attempt.getDetector().catch((error) => {
        console.info(`${attempt.provider} prewarm skipped.`, error);
      });
    }, 80);
  }

  function detectionBoxToPercent(box, imageWidth, imageHeight) {
    if (Array.isArray(box)) {
      const [xMin = 0, yMin = 0, xMax = 1, yMax = 1] = box;
      return clampBox({
        x: (xMin / imageWidth) * 100,
        y: (yMin / imageHeight) * 100,
        w: ((xMax - xMin) / imageWidth) * 100,
        h: ((yMax - yMin) / imageHeight) * 100,
      }, { minWidth: 0.2, minHeight: 0.2 });
    }
    const xMin = box.xmin ?? box.x_min ?? box.left ?? box.x ?? 0;
    const yMin = box.ymin ?? box.y_min ?? box.top ?? box.y ?? 0;
    const xMax = box.xmax ?? box.x_max ?? box.right ?? (xMin + (box.width ?? box.w ?? 1));
    const yMax = box.ymax ?? box.y_max ?? box.bottom ?? (yMin + (box.height ?? box.h ?? 1));
    return clampBox({
      x: (xMin / imageWidth) * 100,
      y: (yMin / imageHeight) * 100,
      w: ((xMax - xMin) / imageWidth) * 100,
      h: ((yMax - yMin) / imageHeight) * 100,
    }, { minWidth: 0.2, minHeight: 0.2 });
  }

  function detectionToCandidate(detection, index, source, provider, threshold, labelEntries = null) {
    const meta = getDetectionLabelMeta(detection.label, labelEntries || getDetectionLabelEntries());
    const box = detectionBoxToPercent(detection.box, source.naturalWidth, source.naturalHeight);
    const rawScore = Number(detection.score) || threshold;
    const score = clampNumber(rawScore + (isStorageDetectionLabel(detection.label) ? 0.035 : 0), threshold, 0.99);
    const canUseLabelName = isStorageDetectionLabel(detection.label) && meta.name && score >= visionConfig.detectionNameThreshold;
    return {
      name: getUnknownObjectName(index),
      category: meta.category,
      qty: 1,
      expireAt: "",
      nextAt: "",
      nextLabel: "",
      container: "",
      box,
      confidence: score,
      detectionLabel: detection.label,
      suggestedName: canUseLabelName ? meta.name : "",
      catalogId: "",
      namingStatus: "loading",
      source: provider,
      providerId: provider,
      providerClass: provider.startsWith("local-") ? "real-local-model" : "fallback",
      modelId: provider.startsWith("local-yolox") ? visionConfig.yoloxModelPath : (provider.startsWith("local-grounding-dino") ? visionConfig.groundingDinoModel : visionConfig.detectionModel),
      assetVersion: visionConfig.assetVersion,
      timings: detection.timings || {},
    };
  }

  function nmsDetections(detections, source, iouThreshold, maxItems) {
    const selected = [];
    const limit = Number.isFinite(Number(maxItems)) ? Math.max(1, Number(maxItems)) : Infinity;
    const sorted = (Array.isArray(detections) ? detections : [])
      .filter((detection) => detection?.box)
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
    for (const detection of sorted) {
      const box = detectionBoxToPercent(detection.box, source.naturalWidth, source.naturalHeight);
      if (selected.some((existing) => boxIou(existing.box, box) >= iouThreshold)) continue;
      selected.push({ detection, box });
      if (selected.length >= limit) break;
    }
    return selected.map((entry) => entry.detection);
  }

  function createDetectionStatsReader(source, maxSide = 512) {
    const sourceWidth = source.naturalWidth || source.width || 1;
    const sourceHeight = source.naturalHeight || source.height || 1;
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    return (box) => {
      const x1 = Math.max(0, Math.min(width - 1, Math.floor(box[0] * scale)));
      const y1 = Math.max(0, Math.min(height - 1, Math.floor(box[1] * scale)));
      const x2 = Math.max(x1 + 1, Math.min(width, Math.ceil(box[2] * scale)));
      const y2 = Math.max(y1 + 1, Math.min(height, Math.ceil(box[3] * scale)));
      let sum = 0;
      let count = 0;
      for (let y = y1; y < y2; y += 1) {
        for (let x = x1; x < x2; x += 1) {
          const offset = (y * width + x) * 4;
          sum += 0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2];
          count += 1;
        }
      }
      return { meanLuma: count ? sum / count : 255 };
    };
  }

  function getBoxArea(box) {
    return Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
  }

  function getBoxContainment(inner, outer) {
    const x1 = Math.max(inner[0], outer[0]);
    const y1 = Math.max(inner[1], outer[1]);
    const x2 = Math.min(inner[2], outer[2]);
    const y2 = Math.min(inner[3], outer[3]);
    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const innerArea = getBoxArea(inner);
    return innerArea > 0 ? intersection / innerArea : 0;
  }

  function getYoloxBoxShape(detection, source) {
    const sourceWidth = source.naturalWidth || source.width || 1;
    const sourceHeight = source.naturalHeight || source.height || 1;
    const imageArea = sourceWidth * sourceHeight;
    const [x1, y1, x2, y2] = detection.box;
    const width = Math.max(1, x2 - x1);
    const height = Math.max(1, y2 - y1);
    return {
      width,
      height,
      aspect: width / height,
      areaRatio: getBoxArea(detection.box) / Math.max(1, imageArea),
    };
  }

  function isLowValueYoloxDetection(detection, source, topScore) {
    const score = Number(detection?.score || 0);
    const shape = getYoloxBoxShape(detection, source);
    if (shape.areaRatio <= 0.00035) return true;
    if (shape.areaRatio <= 0.0008 && score < 0.32) return true;
    if (shape.areaRatio >= 0.92) return true;
    if ((shape.aspect >= 10 || shape.aspect <= 0.1) && score < 0.45) return true;
    if (topScore >= 0.5 && score < Math.max(visionConfig.yoloxThreshold, topScore * 0.18)) return true;
    return false;
  }

  function suppressYoloxNearDuplicates(detections) {
    const selected = [];
    const sorted = (Array.isArray(detections) ? detections : [])
      .filter((detection) => detection?.box)
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
    for (const detection of sorted) {
      const area = getBoxArea(detection.box);
      const duplicate = selected.some((existing) => {
        const existingArea = getBoxArea(existing.box);
        const smaller = Math.min(area, existingArea);
        const larger = Math.max(area, existingArea);
        const areaSimilarity = smaller / Math.max(1, larger);
        if (boxIou(existing.box, detection.box) >= 0.78) return true;
        return areaSimilarity >= 0.68
          && (getBoxContainment(detection.box, existing.box) >= 0.92 || getBoxContainment(existing.box, detection.box) >= 0.92);
      });
      if (!duplicate) selected.push(detection);
    }
    return selected;
  }

  function getYoloxDynamicDetectionLimit(detections, source) {
    const simpleMax = Math.max(1, Number(visionConfig.yoloxSimpleMaxDetections) || 5);
    const baseMax = Math.max(simpleMax, Number(visionConfig.yoloxBaseMaxDetections) || 10);
    const denseMax = Math.max(baseMax, Number(visionConfig.yoloxDenseMaxDetections) || 15);
    const candidates = (Array.isArray(detections) ? detections : []).filter((detection) => detection?.box);
    const useful = candidates.filter((detection) => {
      const shape = getYoloxBoxShape(detection, source);
      return Number(detection.score || 0) >= 0.2 && shape.areaRatio >= 0.001 && shape.areaRatio <= 0.75;
    });
    const strong = useful.filter((detection) => Number(detection.score || 0) >= 0.35);
    if (useful.length <= 6 && strong.length <= 2) return simpleMax;
    if (useful.length >= 12 || strong.length >= 7) return denseMax;
    return baseMax;
  }

  function postprocessYoloxDetections(detections, source) {
    const nmsLimit = Math.max(Number(visionConfig.yoloxDenseMaxDetections) || 15, Number(visionConfig.maxDetectedObjects) || 15) * 2;
    const nms = nmsDetections(detections, source, visionConfig.yoloxNmsIou, nmsLimit);
    const topScore = Math.max(0, ...nms.map((detection) => Number(detection.score || 0)));
    const filtered = suppressYoloxNearDuplicates(
      nms.filter((detection) => !isLowValueYoloxDetection(detection, source, topScore)),
    );
    const visible = suppressDarkDisplayInnerDetections(filtered, source);
    const limit = getYoloxDynamicDetectionLimit(visible, source);
    return visible
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
      .slice(0, limit);
  }

  function suppressDarkDisplayInnerDetections(detections, source) {
    if (!Array.isArray(detections) || detections.length < 2) return detections;
    const sourceWidth = source.naturalWidth || source.width || 1;
    const sourceHeight = source.naturalHeight || source.height || 1;
    const imageArea = sourceWidth * sourceHeight;
    let readStats = null;
    const getStats = (detection) => {
      if (!readStats) readStats = createDetectionStatsReader(source);
      if (!detection._displayStats) detection._displayStats = readStats(detection.box);
      return detection._displayStats;
    };
    const displayParents = detections.filter((detection) => {
      const [x1, y1, x2, y2] = detection.box;
      const width = x2 - x1;
      const height = y2 - y1;
      const areaRatio = getBoxArea(detection.box) / imageArea;
      const aspect = width / Math.max(1, height);
      return detection.score >= 0.55 && areaRatio >= 0.06 && aspect >= 1.2 && aspect <= 3.2 && getStats(detection).meanLuma <= 75;
    });
    if (!displayParents.length) return detections;
    return detections.filter((detection) => {
      const area = getBoxArea(detection.box);
      const stats = getStats(detection);
      return !displayParents.some((parent) => {
        if (parent === detection) return false;
        const parentArea = getBoxArea(parent.box);
        const areaRatio = area / Math.max(1, parentArea);
        return areaRatio >= 0.04
          && areaRatio <= 0.35
          && getBoxContainment(detection.box, parent.box) >= 0.9
          && stats.meanLuma <= 70;
      });
    }).map((detection) => {
      if (detection && typeof detection === "object") delete detection._displayStats;
      return detection;
    });
  }

  function preprocessYoloxImage(source, inputSize) {
    const sourceWidth = source.naturalWidth || source.width || 1;
    const sourceHeight = source.naturalHeight || source.height || 1;
    const ratio = Math.min(inputSize / sourceWidth, inputSize / sourceHeight);
    const resizedWidth = Math.max(1, Math.round(sourceWidth * ratio));
    const resizedHeight = Math.max(1, Math.round(sourceHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = inputSize;
    canvas.height = inputSize;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.fillStyle = "rgb(114,114,114)";
    context.fillRect(0, 0, inputSize, inputSize);
    context.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, resizedWidth, resizedHeight);
    const pixels = context.getImageData(0, 0, inputSize, inputSize).data;
    const planeSize = inputSize * inputSize;
    const data = new Float32Array(planeSize * 3);
    for (let pixelIndex = 0; pixelIndex < planeSize; pixelIndex += 1) {
      const offset = pixelIndex * 4;
      data[pixelIndex] = pixels[offset + 2];
      data[planeSize + pixelIndex] = pixels[offset + 1];
      data[(planeSize * 2) + pixelIndex] = pixels[offset];
    }
    return { data, ratio, resizedWidth, resizedHeight, sourceWidth, sourceHeight, inputSize };
  }

  function yoloxCenterBoxToDetection(row, ratio, sourceWidth, sourceHeight) {
    const cx = Number(row[0]);
    const cy = Number(row[1]);
    const width = Number(row[2]);
    const height = Number(row[3]);
    const objectness = Number(row[4]);
    const classScores = row.slice(5).map(Number).filter(Number.isFinite);
    const classScore = classScores.length ? Math.max(...classScores) : Number(row[5] ?? 1);
    const score = objectness * classScore;
    if (![cx, cy, width, height, score].every(Number.isFinite) || width <= 1 || height <= 1) return null;
    const x1 = clampNumber((cx - width / 2) / ratio, 0, sourceWidth - 1);
    const y1 = clampNumber((cy - height / 2) / ratio, 0, sourceHeight - 1);
    const x2 = clampNumber((cx + width / 2) / ratio, x1 + 1, sourceWidth);
    const y2 = clampNumber((cy + height / 2) / ratio, y1 + 1, sourceHeight);
    return {
      label: "household subject",
      score,
      box: [x1, y1, x2, y2],
    };
  }

  function getYoloxScore(objectness, classScore) {
    const objectValue = Number(objectness);
    const classValue = Number(classScore);
    if (![objectValue, classValue].every(Number.isFinite)) return 0;
    const normalize = (value) => (value >= 0 && value <= 1 ? value : 1 / (1 + Math.exp(-value)));
    return normalize(objectValue) * normalize(classValue);
  }

  function getYoloxGridSpec(rowCount, inputSize) {
    const strides = [8, 16, 32];
    const grids = strides.map((stride) => ({
      stride,
      size: Math.round(inputSize / stride),
    }));
    const expected = grids.reduce((total, grid) => total + grid.size * grid.size, 0);
    return expected === rowCount ? grids : null;
  }

  function isRawYoloxHead(values, stride, rowCount, inputSize) {
    if (!getYoloxGridSpec(rowCount, inputSize)) return false;
    const sampleRows = Math.min(rowCount, 64);
    let maxCoordinate = 0;
    for (let rowIndex = 0; rowIndex < sampleRows; rowIndex += 1) {
      const offset = rowIndex * stride;
      for (let field = 0; field < 4; field += 1) {
        maxCoordinate = Math.max(maxCoordinate, Math.abs(Number(values[offset + field]) || 0));
      }
    }
    return maxCoordinate < Math.max(16, inputSize * 0.08);
  }

  function yoloxRawHeadRowToDetection(row, gridX, gridY, stride, ratio, sourceWidth, sourceHeight) {
    const rawX = Number(row[0]);
    const rawY = Number(row[1]);
    const rawWidth = Number(row[2]);
    const rawHeight = Number(row[3]);
    const classScores = row.slice(5).map(Number).filter(Number.isFinite);
    const classScore = classScores.length ? Math.max(...classScores) : Number(row[5] ?? 1);
    const score = getYoloxScore(row[4], classScore);
    if (![rawX, rawY, rawWidth, rawHeight, score].every(Number.isFinite)) return null;

    const cx = (rawX + gridX) * stride;
    const cy = (rawY + gridY) * stride;
    const width = Math.exp(Math.min(rawWidth, 10)) * stride;
    const height = Math.exp(Math.min(rawHeight, 10)) * stride;
    if (width <= 1 || height <= 1) return null;

    const x1 = clampNumber((cx - width / 2) / ratio, 0, sourceWidth - 1);
    const y1 = clampNumber((cy - height / 2) / ratio, 0, sourceHeight - 1);
    const x2 = clampNumber((cx + width / 2) / ratio, x1 + 1, sourceWidth);
    const y2 = clampNumber((cy + height / 2) / ratio, y1 + 1, sourceHeight);
    return {
      label: "household subject",
      score,
      box: [x1, y1, x2, y2],
    };
  }

  function postprocessRawYoloxHead(values, stride, meta, threshold) {
    const rowCount = Math.floor(values.length / stride);
    const grids = getYoloxGridSpec(rowCount, meta.inputSize);
    if (!grids) return [];

    const detections = [];
    let rowIndex = 0;
    for (const grid of grids) {
      for (let gridY = 0; gridY < grid.size; gridY += 1) {
        for (let gridX = 0; gridX < grid.size; gridX += 1) {
          const offset = rowIndex * stride;
          rowIndex += 1;
          const row = values.slice(offset, offset + stride);
          const detection = yoloxRawHeadRowToDetection(
            row,
            gridX,
            gridY,
            grid.stride,
            meta.ratio,
            meta.sourceWidth,
            meta.sourceHeight,
          );
          if (!detection || detection.score < threshold) continue;
          detections.push(detection);
        }
      }
    }
    return detections;
  }

  function postprocessYoloxOutput(output, meta, threshold) {
    const values = Array.from(output?.data || []);
    const dims = Array.isArray(output?.dims) ? output.dims : [];
    const stride = dims.length >= 3 ? dims[dims.length - 1] : 6;
    const rowCount = Math.floor(values.length / stride);
    if (isRawYoloxHead(values, stride, rowCount, meta.inputSize)) {
      return postprocessRawYoloxHead(values, stride, meta, threshold);
    }
    const detections = [];
    for (let index = 0; index + stride <= values.length; index += stride) {
      const row = values.slice(index, index + stride);
      const detection = yoloxCenterBoxToDetection(row, meta.ratio, meta.sourceWidth, meta.sourceHeight);
      if (!detection || detection.score < threshold) continue;
      detections.push(detection);
    }
    return detections;
  }

  async function runYoloxDetector({ source, detector, threshold }) {
    const startedAt = performance.now();
    const input = preprocessYoloxImage(source, detector.inputSize);
    const tensor = new detector.ort.Tensor("float32", input.data, [1, 3, detector.inputSize, detector.inputSize]);
    const outputs = await detector.session.run({ [detector.inputName]: tensor });
    const output = outputs[detector.outputName] || Object.values(outputs)[0];
    const rawDetections = postprocessYoloxOutput(output, input, threshold);
    const detectionMs = Math.round((performance.now() - startedAt) * 1000) / 1000;
    return rawDetections.map((detection) => ({
      ...detection,
      timings: {
        detectionMs,
        promptStrategy: "yolox-household-subject",
        promptCount: 0,
        promptBatches: 0,
        rawDetectionCount: rawDetections.length,
        filteredDetectionCount: rawDetections.length,
      },
    }));
  }

  async function runZeroShotDetector({ image, source, detector, provider, threshold, roomType = null }) {
    if (detector?.kind === "yolox-household-subject") {
      const detections = await runYoloxDetector({ source, detector, threshold });
      return postprocessYoloxDetections(detections, source)
        .map((detection, index) => detectionToCandidate(detection, index, source, provider, threshold, null));
    }
    const isGroundingDino = detector?.kind === "grounding-dino";
    const promptShards = isGroundingDino ? getGroundingPromptShards(roomType) : [];
    const labelEntries = isGroundingDino ? getGroundingSubjectLabelEntries(roomType) : getOwlVitSubjectLabelEntries(roomType);
    const labels = labelEntries.map((entry) => entry.label);
    const promptBatchSize = isGroundingDino
      ? Math.max(1, Math.min(labels.length || 1, Number(visionConfig.groundingPromptBatchSize) || labels.length || 1))
      : Math.max(1, Math.min(labels.length || 1, Number(visionConfig.owlVitPromptBatchSize) || labels.length || 1));
    const detectionStart = performance.now();
    const detectionOutput = isGroundingDino
      ? await runGroundingDinoDetector({ image, source, detector, promptShards, threshold })
      : { detections: await runPipelineObjectDetector({ image, detector, labels, threshold }) };
    const detections = Array.isArray(detectionOutput) ? detectionOutput : (detectionOutput.detections || []);
    const detectionMs = Math.round((performance.now() - detectionStart) * 1000) / 1000;
    const promptBatches = isGroundingDino
      ? (detectionOutput.promptBatches || 0)
      : Math.ceil((labels.length || 1) / promptBatchSize);
    const promptCount = isGroundingDino
      ? (detectionOutput.promptCount || 0)
      : labels.length;
    const filtered = (Array.isArray(detections) ? detections : [])
      .filter((detection) => detection?.box && Number(detection.score) >= threshold)
      .sort((a, b) => Number(b.score) - Number(a.score));
    return nmsDetections(filtered, source, visionConfig.detectionNmsIou, visionConfig.maxModelDetections)
      .map((detection, index) => detectionToCandidate({
        ...detection,
        timings: {
          detectionMs,
          promptRoomType: roomType,
          promptStrategy: isGroundingDino ? "coarse-shards" : "owlvit-subjects",
          promptShardNames: detectionOutput.promptShardNames || "",
          promptCount,
          promptBatchSize,
          promptBatches,
          rawDetectionCount: detections.length,
          filteredDetectionCount: filtered.length,
        },
      }, index, source, provider, threshold, labelEntries));
  }

  function chunkArray(values, chunkSize) {
    const chunks = [];
    for (let index = 0; index < values.length; index += chunkSize) {
      chunks.push(values.slice(index, index + chunkSize));
    }
    return chunks;
  }

  async function runPipelineObjectDetector({ image, detector, labels, threshold }) {
    const detections = [];
    const promptBatchSize = Math.max(1, Math.min(labels.length || 1, Number(visionConfig.owlVitPromptBatchSize) || labels.length || 1));
    for (const labelChunk of chunkArray(labels, promptBatchSize)) {
      const chunkDetections = await detector(image, labelChunk, { threshold, percentage: false });
      if (Array.isArray(chunkDetections)) detections.push(...chunkDetections);
    }
    return detections;
  }

  function tensorValues(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.data)) return value.data;
    if (value.data) return Array.from(value.data);
    return [];
  }

  function tensorRows(value, width) {
    const values = tensorValues(value);
    if (Array.isArray(values[0])) return values;
    const rows = [];
    for (let index = 0; index < values.length; index += width) {
      rows.push(values.slice(index, index + width));
    }
    return rows;
  }

  async function readRawVisionImage(detector, image) {
    if (detector.loadImage) return detector.loadImage(image);
    if (detector.RawImage?.fromURL) return detector.RawImage.fromURL(image);
    if (detector.RawImage?.read) return detector.RawImage.read(image);
    return image;
  }

  async function runGroundingDinoDetector({ image, source, detector, promptShards, threshold }) {
    const rawImage = await readRawVisionImage(detector, image);
    const targetWidth = Number(rawImage?.width || source.naturalWidth || source.width || 1);
    const targetHeight = Number(rawImage?.height || source.naturalHeight || source.height || 1);
    const detections = [];
    const pseudoSource = { naturalWidth: targetWidth, naturalHeight: targetHeight };
    const shardTimings = [];
    const seenLabels = new Set();
    const startedAt = performance.now();
    let promptCount = 0;

    for (const shard of promptShards || []) {
      const labelBatch = (shard.entries || [])
        .map((entry) => normalizeDetectionLabel(entry.label))
        .filter((label) => {
          if (!label || seenLabels.has(label)) return false;
          seenLabels.add(label);
          return true;
        })
        .slice(0, visionConfig.groundingPromptBatchSize);
      if (!labelBatch.length) continue;
      const shardStartedAt = performance.now();
      const text = `${labelBatch.join(". ")}.`;
      const inputs = await detector.processor(rawImage, text);
      const outputs = await detector.model(inputs);
      let processed = detector.processor.post_process_grounded_object_detection
        ? detector.processor.post_process_grounded_object_detection(outputs, inputs.input_ids, {
          box_threshold: threshold,
          text_threshold: threshold,
          target_sizes: [[targetHeight, targetWidth]],
        })
        : [];
      if (processed instanceof Promise) processed = await processed;
      const shardMs = Math.round((performance.now() - shardStartedAt) * 1000) / 1000;
      const first = Array.isArray(processed) ? processed[0] : processed;
      const scores = tensorValues(first?.scores);
      const boxes = tensorRows(first?.boxes, 4);
      const resultLabels = tensorValues(first?.labels).length
        ? tensorValues(first.labels)
        : (Array.isArray(first?.labels) ? first.labels : []);
      for (let index = 0; index < boxes.length; index += 1) {
        detections.push({
          label: resultLabels[index] || labelBatch[0],
          score: Number(scores[index]) || threshold,
          box: boxes[index],
          promptShard: shard.id || shard.label || "prompt",
        });
      }
      promptCount += labelBatch.length;
      shardTimings.push({
        id: shard.id || shard.label || "prompt",
        labels: labelBatch.length,
        raw: boxes.length,
        ms: shardMs,
      });

      const selectedCount = nmsDetections(
        detections.filter((detection) => detection?.box && Number(detection.score) >= threshold),
        pseudoSource,
        visionConfig.detectionNmsIou,
        visionConfig.maxModelDetections,
      ).length;
      const elapsed = performance.now() - startedAt;
      const targetCount = Math.max(1, Number(visionConfig.groundingShortPromptTargetCount) || 7);
      const budgetMs = Math.max(1, Number(visionConfig.groundingPromptBudgetMs) || 2600);
      if (selectedCount >= targetCount || elapsed >= budgetMs) break;
    }
    return {
      detections,
      promptCount,
      promptBatches: shardTimings.length,
      promptShardNames: shardTimings.map((shard) => `${shard.id}:${shard.labels}/${Math.round(shard.ms)}ms`).join(", "),
      promptShardTimings: shardTimings,
    };
  }

  function hashStringFast(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `${value.length}-${(hash >>> 0).toString(36)}`;
  }

  function cloneRecognitionResult(result, extra = {}) {
    return {
      provider: result.provider,
      candidates: (result.candidates || []).map((candidate) => ({
        ...candidate,
        box: { ...(candidate.box || {}) },
        modelBox: candidate.modelBox ? { ...candidate.modelBox } : null,
        modelImageMeta: normalizeImageMeta(candidate.modelImageMeta),
        timings: candidate.timings && typeof candidate.timings === "object" ? { ...candidate.timings } : {},
        cropMeta: normalizeCropMeta(candidate.cropMeta),
        aliases: Array.isArray(candidate.aliases) ? [...candidate.aliases] : [],
      })),
      timings: result.timings && typeof result.timings === "object" ? { ...result.timings } : null,
      ...extra,
    };
  }

  function percentBoxToPixels(box, source) {
    return {
      x1: Math.round((box.x / 100) * source.naturalWidth),
      y1: Math.round((box.y / 100) * source.naturalHeight),
      x2: Math.round(((box.x + box.w) / 100) * source.naturalWidth),
      y2: Math.round(((box.y + box.h) / 100) * source.naturalHeight),
    };
  }

  function maskTensorToBox(mask, source) {
    const data = mask?.data || mask?.mask?.data || mask?.array || null;
    const dims = mask?.dims || mask?.mask?.dims || mask?.shape || null;
    if (!data || !dims?.length) return null;

    const width = Number(dims[dims.length - 1]);
    const height = Number(dims[dims.length - 2]);
    if (!width || !height) return null;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let pixels = 0;
    const planeSize = width * height;
    const offset = data.length > planeSize ? data.length - planeSize : 0;
    for (let index = 0; index < planeSize; index += 1) {
      if (Number(data[offset + index]) <= 0.5) continue;
      const x = index % width;
      const y = Math.floor(index / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      pixels += 1;
    }
    if (pixels < 16 || minX > maxX || minY > maxY) return null;

    return clampBox({
      x: (minX / width) * 100,
      y: (minY / height) * 100,
      w: ((maxX - minX + 1) / width) * 100,
      h: ((maxY - minY + 1) / height) * 100,
    });
  }

  function findMaskBox(output, source) {
    const queue = [output];
    const visited = new Set();
    while (queue.length) {
      const value = queue.shift();
      if (!value || visited.has(value)) continue;
      if (typeof value === "object") visited.add(value);
      const box = maskTensorToBox(value, source);
      if (box) return box;
      if (Array.isArray(value)) {
        queue.push(...value);
      } else if (typeof value === "object") {
        queue.push(...Object.values(value));
      }
    }
    return null;
  }

  function isPlausibleRefinedBox(original, refined) {
    const originalCenter = {
      x: original.x + original.w / 2,
      y: original.y + original.h / 2,
    };
    const containsCenter = originalCenter.x >= refined.x
      && originalCenter.x <= refined.x + refined.w
      && originalCenter.y >= refined.y
      && originalCenter.y <= refined.y + refined.h;
    const areaRatio = boxArea(refined) / Math.max(1, boxArea(original));
    return containsCenter && areaRatio >= 0.12 && areaRatio <= 3.8;
  }

  async function refineCandidateWithSam(segmenter, rawImage, source, candidate) {
    const { x1, y1, x2, y2 } = percentBoxToPixels(candidate.box, source);
    const centerPoint = [
      Math.round((x1 + x2) / 2),
      Math.round((y1 + y2) / 2),
    ];
    const inputs = await segmenter.processor(rawImage, {
      input_points: [[centerPoint]],
      input_labels: [[1]],
    });
    const outputs = await segmenter.model(inputs);
    const masks = segmenter.processor.post_process_masks
      ? await segmenter.processor.post_process_masks(outputs.pred_masks, inputs.original_sizes, inputs.reshaped_input_sizes)
      : outputs;
    const refinedBox = findMaskBox(masks, source);
    if (!refinedBox || !isPlausibleRefinedBox(candidate.box, refinedBox)) return candidate;
    return {
      ...candidate,
      box: refinedBox,
      source: `${candidate.source}+sam`,
    };
  }

  async function refineCandidatesWithSam(image, source, candidates, provider) {
    if (visionConfig.maxSamRefinements <= 0) {
      return { provider, candidates };
    }
    const segmenter = await getSamSegmenter();
    if (!segmenter || !candidates.length) {
      return { provider, candidates };
    }

    try {
      const rawImage = segmenter.RawImage.fromURL
        ? await segmenter.RawImage.fromURL(image)
        : await segmenter.RawImage.read(image);
      const refineTargets = candidates
        .filter((candidate) => boxArea(candidate.box) >= visionConfig.samMinBoxArea)
        .map((candidate, index) => ({
          candidate,
          index,
          priority: (isStorageDetectionLabel(candidate.detectionLabel) ? 1 : 0) + clampNumber(candidate.confidence, 0, 1),
        }))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, visionConfig.maxSamRefinements);
      const refinedById = new Map();
      for (const { candidate } of refineTargets) {
        // SAM runs after detection and only tightens regions; a failure must not replace detector geometry.
        const refined = await refineCandidateWithSam(segmenter, rawImage, source, candidate).catch(() => candidate);
        refinedById.set(candidate.id, refined);
      }
      return {
        provider: `${provider}+sam`,
        candidates: candidates.map((candidate) => refinedById.get(candidate.id) || candidate),
      };
    } catch (error) {
      console.info("SAM refinement skipped.", error);
      return { provider, candidates };
    }
  }

  function getSourcePixelSize(source) {
    const sourceWidth = source.naturalWidth || source.width || 1;
    const sourceHeight = source.naturalHeight || source.height || 1;
    return { sourceWidth, sourceHeight };
  }

  function getCropPixelRect(source, box, options = {}) {
    const { sourceWidth, sourceHeight } = getSourcePixelSize(source);
    const paddingPct = Number(options.paddingPct) || 0;
    const padX = ((box.w * paddingPct) / 100);
    const padY = ((box.h * paddingPct) / 100);
    const x1Pct = clampNumber(box.x - padX, 0, 100);
    const y1Pct = clampNumber(box.y - padY, 0, 100);
    const x2Pct = clampNumber(box.x + box.w + padX, x1Pct + 0.01, 100);
    const y2Pct = clampNumber(box.y + box.h + padY, y1Pct + 0.01, 100);
    const x = Math.max(0, Math.round((x1Pct / 100) * sourceWidth));
    const y = Math.max(0, Math.round((y1Pct / 100) * sourceHeight));
    const width = Math.max(1, Math.round(((x2Pct - x1Pct) / 100) * sourceWidth));
    const height = Math.max(1, Math.round(((y2Pct - y1Pct) / 100) * sourceHeight));
    return {
      x,
      y,
      width: Math.max(1, Math.min(width, sourceWidth - x)),
      height: Math.max(1, Math.min(height, sourceHeight - y)),
    };
  }

  function cropImageToDataUrl(source, box, options = {}) {
    const rect = getCropPixelRect(source, box, options);
    const maxDimension = Number(options.maxDimension) || Math.max(rect.width, rect.height);
    const scale = Math.min(1, maxDimension / Math.max(rect.width, rect.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(rect.width * scale));
    canvas.height = Math.max(1, Math.round(rect.height * scale));
    const context = canvas.getContext("2d");
    context.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", options.quality || 0.86);
  }

  function createCandidateCropSnapshot(source, box) {
    if (!source || !box) return null;
    try {
      const rect = getCropPixelRect(source, box);
      return {
        cropImage: cropImageToDataUrl(source, box, {
          maxDimension: visionConfig.candidateCropMaxDimension,
          quality: visionConfig.candidateCropQuality,
        }),
        cropMeta: { width: rect.width, height: rect.height },
        cropVersion: visionConfig.candidateCropVersion,
      };
    } catch (error) {
      console.info("Candidate crop thumbnail skipped.", error);
      return null;
    }
  }

  function createCandidateCropImage(source, box) {
    return createCandidateCropSnapshot(source, box)?.cropImage || "";
  }

  function shouldRefreshCandidateCrop(candidate) {
    return !candidate.cropImage
      || !normalizeCropMeta(candidate.cropMeta)
      || candidate.cropVersion !== visionConfig.candidateCropVersion;
  }

  const {
    getCatalogClassifier,
    getCatalogEmbeddingIndex,
    getCatalogFeatureExtractor,
    matchCatalogFromEmbeddingIndex,
  } = createCatalogMatcher({
    clampNumber,
    cropImageToDataUrl,
    fetchJsonIndex,
    getCatalogPromptEntries,
    loadTransformersRuntime,
    visionCatalog,
    visionConfig,
  });

  async function matchCatalogForCrop(source, box) {
    const indexedMatch = await matchCatalogFromEmbeddingIndex(source, box);
    if (indexedMatch) return indexedMatch;

    const classifier = await getCatalogClassifier();
    if (!classifier) return null;

    const promptEntries = getCatalogPromptEntries();
    const results = await classifier(cropImageToDataUrl(source, box), promptEntries.map((entry) => entry.prompt));
    const best = (Array.isArray(results) ? results : [])
      .map((result) => ({
        ...result,
        meta: promptEntries.find((entry) => entry.prompt === result.label),
      }))
      .filter((result) => result.meta)
      .sort((a, b) => Number(b.score) - Number(a.score))[0];

    if (!best || Number(best.score) < visionConfig.catalogThreshold) return null;
    return {
      name: best.meta.name,
      category: best.meta.category,
      confidence: clampNumber(Number(best.score), 0, 1),
      catalogId: best.meta.id,
    };
  }

  async function recognizeWithSmallModel(image, options = {}) {
    const source = await loadImage(image);
    const assetMode = await getVisionAssetMode();
    const detectorAttempts = getDetectorAttempts(assetMode);
    const roomType = getCapturePromptRoomType(options.roomType);

    let lastError = null;
    for (const attempt of detectorAttempts) {
      try {
        const detectorLoadStart = performance.now();
        const detector = await attempt.getDetector();
        const detectorLoadMs = Math.round((performance.now() - detectorLoadStart) * 1000) / 1000;
        const candidates = await runZeroShotDetector({
          image,
          source,
          detector,
          provider: attempt.provider,
          threshold: attempt.threshold,
          roomType,
        });
        const detected = dedupeCandidates(candidates, visionConfig.maxDetectedObjects, 0.34);
        if (!detected.length) continue;
        const refined = await refineCandidatesWithSam(image, source, detected, attempt.provider);
        const firstTiming = refined.candidates[0]?.timings || detected[0]?.timings || {};
        return {
          provider: refined.provider,
          candidates: renumberUnknownCandidates(refined.candidates),
          timings: {
            detectorLoadMs,
            detectionMs: firstTiming.detectionMs || 0,
            promptCount: firstTiming.promptCount || 0,
            promptRoomType: firstTiming.promptRoomType || roomType,
            promptStrategy: firstTiming.promptStrategy || "",
            promptShardNames: firstTiming.promptShardNames || "",
            promptBatchSize: firstTiming.promptBatchSize || 0,
            promptBatches: firstTiming.promptBatches || 0,
            rawDetectionCount: firstTiming.rawDetectionCount || 0,
            filteredDetectionCount: firstTiming.filteredDetectionCount || 0,
            resultCount: refined.candidates.length,
          },
        };
      } catch (error) {
        lastError = error;
        console.info(`${attempt.provider} unavailable.`, error);
      }
    }

    throw lastError || new Error("本地主体识别暂不可用");
  }

  function getOwlVitDetectorAttempt(assetMode) {
    return {
      getDetector: getSmallModelDetector,
      provider: assetMode.owlReady ? "local-owlvit" : "browser-owlvit",
      threshold: visionConfig.detectionThreshold,
    };
  }

  function getGroundingDinoDetectorAttempt(assetMode) {
    return {
      getDetector: getGroundingDinoDetector,
      provider: assetMode.groundingReady ? "local-grounding-dino" : "browser-grounding-dino",
      threshold: visionConfig.groundingThreshold,
    };
  }

  function getYoloxDetectorAttempt() {
    return {
      getDetector: getYoloxDetector,
      provider: "local-yolox-household-subject",
      threshold: visionConfig.yoloxThreshold,
    };
  }

  function shouldAttemptGroundingDino(assetMode) {
    if (!assetMode.groundingReady) return false;
    if (!assetMode.owlReady) return true;
    return visionConfig.preferredDetector === "grounding-dino" || visionConfig.enableGroundingDinoFallback;
  }

  function getDetectorAttempts(assetMode) {
    if (visionConfig.preferredDetector === "yolox") {
      return [
        getYoloxDetectorAttempt(),
        ...(visionConfig.enableGroundingDinoFallback && assetMode.groundingReady ? [getGroundingDinoDetectorAttempt(assetMode)] : []),
      ];
    }

    const preferOwlVit = visionConfig.preferredDetector === "owlvit";
    if (preferOwlVit) {
      return [
        ...(assetMode.owlReady || !assetMode.groundingReady ? [getOwlVitDetectorAttempt(assetMode)] : []),
        ...(shouldAttemptGroundingDino(assetMode) ? [getGroundingDinoDetectorAttempt(assetMode)] : []),
      ];
    }

    return [
      ...(assetMode.groundingReady ? [getGroundingDinoDetectorAttempt(assetMode)] : []),
      ...(!assetMode.groundingReady && assetMode.owlReady ? [getOwlVitDetectorAttempt(assetMode)] : []),
    ];
  }

  async function recognizeWithSmallModelUncached(image, options = {}) {
    const result = await recognizeWithSmallModel(image, options);
    return result;
  }

  async function recognizeWithCloudApi(context) {
    const endpoint = visionConfig.cloudRecognitionEndpoint || (platform.isNative ? "" : "/api/recognize");
    if (!endpoint) {
      throw new Error("iOS 未配置云端识别端点，默认只使用本地识别。");
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        image: context.image,
        room: context.room?.name,
        place: context.place?.name,
        placeNote: context.place?.note,
        existingItems: context.existingItems.map((item) => ({
          name: item.name,
          category: item.category,
          container: item.container,
        })),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "云端大模型识别失败");
    }
    return {
      provider: payload.provider || "cloud-vlm",
      candidates: payload.candidates || [],
    };
  }

  async function recognizeWithLocalImage({ image }) {
    let smallModelResult = null;
    try {
      smallModelResult = await recognizeWithSmallModel(image);
    } catch (error) {
      console.info("Small model unavailable, falling back to local image analysis.", error);
    }

    if (smallModelResult?.candidates.length) {
      return smallModelResult;
    }

    const regionResult = await recognizeWithHeuristicRegions(image);
    return {
      ...regionResult,
      candidates: regionResult.candidates.map((candidate) => ({ ...candidate, namingStatus: "loading" })),
    };
  }

  function refineNameByPosition(name, box) {
    return name;
  }

  async function resolveCandidateName(candidate, index, source, options = {}) {
    if (candidate.edited && !options.force) return { ...candidate, namingStatus: "done" };

    const embeddingIndex = await getCatalogEmbeddingIndex();
    if (embeddingIndex.entries?.length) {
      const embeddingBox = options.box || candidate.modelBox || candidate.box;
      const catalogMatch = source ? await matchCatalogFromEmbeddingIndex(source, embeddingBox).catch(() => null) : null;
      if (catalogMatch?.accepted) {
        return {
          ...candidate,
          name: refineNameByPosition(catalogMatch.name, candidate.box),
          category: catalogMatch.category,
          confidence: Math.max(candidate.confidence, catalogMatch.confidence),
          catalogId: catalogMatch.catalogId,
          categoryId: catalogMatch.categoryId || catalogMatch.catalogId || "",
          categoryPath: catalogMatch.categoryPath || [],
          categoryScore: catalogMatch.categoryScore,
          categoryMargin: catalogMatch.categoryMargin,
          catalogCandidates: catalogMatch.catalogCandidates || [],
          namingRejectionReason: "",
          categoryIndexVersion: catalogMatch.categoryIndexVersion || "",
          matchedSampleIds: catalogMatch.matchedSampleIds || [],
          timings: {
            ...(candidate.timings || {}),
            ...(catalogMatch.timings || {}),
          },
          source: `${candidate.source}+embedding`,
          namingStatus: "done",
        };
      }
      if (catalogMatch) {
        return {
          ...candidate,
          name: candidate.name && !candidate.name.startsWith("候选区域") && !isUnknownObjectName(candidate.name)
            ? candidate.name
            : getUnknownObjectName(index),
          confidence: Math.max(candidate.confidence || 0, catalogMatch.confidence || 0),
          categoryScore: catalogMatch.categoryScore,
          categoryMargin: catalogMatch.categoryMargin,
          catalogCandidates: catalogMatch.catalogCandidates || [],
          namingRejectionReason: catalogMatch.namingRejectionReason || "low-confidence",
          categoryIndexVersion: catalogMatch.categoryIndexVersion || "",
          matchedSampleIds: catalogMatch.matchedSampleIds || [],
          timings: {
            ...(candidate.timings || {}),
            ...(catalogMatch.timings || {}),
          },
          source: `${candidate.source}+embedding-candidates`,
          namingStatus: "done",
        };
      }
    }

    return {
      ...candidate,
      name: candidate.name && !candidate.name.startsWith("候选区域") && !isUnknownObjectName(candidate.name)
        ? candidate.name
        : getUnknownObjectName(index),
      namingStatus: "done",
    };
  }

  async function nameDetectedCandidates(input, candidates, onProgress) {
    const context = typeof input === "object" && input
      ? input
      : { displayImage: input, modelImage: input, modelContext: null };
    const displayImage = context.displayImage || context.image || context.modelImage;
    const modelImage = context.modelImage || displayImage;
    const modelContext = context.modelContext || null;
    const minimumAnimation = new Promise((resolve) => setTimeout(resolve, 360));
    const displaySourcePromise = displayImage ? loadImage(displayImage).catch(() => null) : Promise.resolve(null);
    const modelSourcePromise = modelImage && modelImage !== displayImage
      ? loadImage(modelImage).catch(() => null)
      : displaySourcePromise;
    const [displaySource, modelSource] = await Promise.all([displaySourcePromise, modelSourcePromise]);
    await minimumAnimation;
    const preparedCandidates = displaySource
      ? candidates.map((candidate) => (
        shouldRefreshCandidateCrop(candidate)
          ? { ...candidate, ...(createCandidateCropSnapshot(displaySource, candidate.box) || {}) }
          : candidate
      ))
      : candidates;
    const named = Array(preparedCandidates.length).fill(null);
    onProgress?.(preparedCandidates);
    const namingTasks = preparedCandidates.map(async (candidate, index) => {
      const modelBox = candidate.modelBox || (modelContext ? mapDisplayBoxToModelBox(candidate.box, modelContext) : candidate.box);
      const candidateNamingStart = performance.now();
      const resolved = await resolveCandidateName(candidate, index, modelSource || displaySource, { box: modelBox });
      const candidateNamingMs = Math.round((performance.now() - candidateNamingStart) * 1000) / 1000;
      named[index] = {
        ...resolved,
        timings: {
          ...(candidate.timings || {}),
          ...(resolved.timings || {}),
          namingMs: candidateNamingMs,
        },
      };
      onProgress?.(preparedCandidates.map((entry, entryIndex) => named[entryIndex] || entry));
    });
    await Promise.all(namingTasks);
    return named.filter(Boolean);
  }

  return {
    createCandidateCropSnapshot,
    getVisionAssetMode,
    getVisionWasmThreadCount,
    nameDetectedCandidates,
    recognizeWithLocalImage,
    recognizeWithSmallModelUncached,
    shouldRefreshCandidateCrop,
    warmCaptureDetectionModel,
    warmVisionModels,
  };
}
