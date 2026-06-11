#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as ort from "onnxruntime-web";
import { RawImage, env, pipeline } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SIGLIP_MODEL = "Xenova/siglip-base-patch16-224";
const DEFAULT_INDEX_PACKAGE = "data/vision-index-packages/household-cn-grounding-dino-siglip/";
const DEFAULT_INDEX = "data/vision-index.household-cn.grounding-dino-siglip.json";
const DEFAULT_LEAF_CLASSIFIER = "data/vision-leaf-classifier.debug.json";
const DEFAULT_YOLOX = "vendor/models/home-memory/yolox-household-subject/model.onnx";

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = path.join(ROOT, "vendor", "models") + path.sep;
env.useBrowserCache = false;
ort.env.wasm.wasmPaths = path.join(ROOT, "node_modules", "onnxruntime-web", "dist") + path.sep;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function resolveRoot(value) {
  const text = String(value || "");
  return path.isAbsolute(text) ? text : path.join(ROOT, text);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(resolveRoot(filePath), "utf8"));
}

async function writeJson(filePath, payload) {
  const resolved = resolveRoot(filePath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`wrote ${path.relative(ROOT, resolved)}`);
}

function round(value, digits = 4) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function elapsedMs(startedAt) {
  return round(performance.now() - startedAt, 3);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function boxAreaPixels(box) {
  return Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
}

function boxIouPixels(a, b) {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]);
  const y2 = Math.min(a[3], b[3]);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = boxAreaPixels(a) + boxAreaPixels(b) - intersection;
  return union > 0 ? intersection / union : 0;
}

function percentBoxFromPixels(box, width, height) {
  const [x1, y1, x2, y2] = box;
  return {
    x: round((x1 / width) * 100, 4),
    y: round((y1 / height) * 100, 4),
    w: round(((x2 - x1) / width) * 100, 4),
    h: round(((y2 - y1) / height) * 100, 4),
  };
}

function pixelBoxFromPercent(box, width, height, paddingPct = 0) {
  const padX = ((Number(box.w) || 0) * paddingPct) / 100;
  const padY = ((Number(box.h) || 0) * paddingPct) / 100;
  const x1 = clamp(((Number(box.x) - padX) / 100) * width, 0, width - 1);
  const y1 = clamp(((Number(box.y) - padY) / 100) * height, 0, height - 1);
  const x2 = clamp(((Number(box.x) + Number(box.w) + padX) / 100) * width, x1 + 1, width);
  const y2 = clamp(((Number(box.y) + Number(box.h) + padY) / 100) * height, y1 + 1, height);
  return [Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)];
}

function normalizeVector(values) {
  const vector = Array.from(values || [], Number);
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

function poolFeatureOutput(output) {
  const data = Array.from(output?.data || output?.[0]?.data || [], Number);
  const dims = Array.isArray(output?.dims) ? output.dims : (Array.isArray(output?.[0]?.dims) ? output[0].dims : []);
  if (dims.length === 3 && dims[1] > 1 && dims[2] > 0 && data.length === dims[1] * dims[2]) {
    const pooled = Array(dims[2]).fill(0);
    for (let token = 0; token < dims[1]; token += 1) {
      for (let dim = 0; dim < dims[2]; dim += 1) pooled[dim] += data[(token * dims[2]) + dim];
    }
    return pooled.map((value) => value / dims[1]);
  }
  return data;
}

function dot(left, right, rightOffset = 0, length = Math.min(left.length, right.length)) {
  let score = 0;
  for (let index = 0; index < length; index += 1) score += left[index] * right[rightOffset + index];
  return score;
}

function ensureDecodedImage(inputPath, outputDir) {
  const source = resolveRoot(inputPath);
  const probe = spawnSync("sips", ["-g", "format", source], { encoding: "utf8" });
  const format = `${probe.stdout || ""}${probe.stderr || ""}`.match(/format:\s*(\S+)/)?.[1]?.toLowerCase() || "";
  if (!["heic", "heif"].includes(format)) return source;
  const target = path.join(resolveRoot(outputDir), `${path.basename(source).replace(/\.[^.]+$/, "")}.decoded.jpg`);
  spawnSync("sips", ["-s", "format", "jpeg", source, "--out", target], { stdio: "ignore" });
  return target;
}

async function preprocessYoloxImage(rawImage, inputSize) {
  const ratio = Math.min(inputSize / rawImage.width, inputSize / rawImage.height);
  const resizedWidth = Math.max(1, Math.round(rawImage.width * ratio));
  const resizedHeight = Math.max(1, Math.round(rawImage.height * ratio));
  const resized = await rawImage.resize(resizedWidth, resizedHeight);
  const planeSize = inputSize * inputSize;
  const data = new Float32Array(planeSize * 3);
  data.fill(114);
  for (let y = 0; y < resizedHeight; y += 1) {
    for (let x = 0; x < resizedWidth; x += 1) {
      const srcOffset = ((y * resizedWidth) + x) * resized.channels;
      const dst = (y * inputSize) + x;
      data[dst] = resized.data[srcOffset + 2] ?? 114;
      data[planeSize + dst] = resized.data[srcOffset + 1] ?? 114;
      data[(planeSize * 2) + dst] = resized.data[srcOffset] ?? 114;
    }
  }
  return { data, ratio, sourceWidth: rawImage.width, sourceHeight: rawImage.height, inputSize };
}

function sigmoid(value) {
  const number = Number(value);
  return number >= 0 && number <= 1 ? number : 1 / (1 + Math.exp(-number));
}

function getYoloxGridSpec(rowCount, inputSize) {
  const strides = [8, 16, 32];
  const grids = strides.map((stride) => ({ stride, size: Math.round(inputSize / stride) }));
  return grids.reduce((total, grid) => total + grid.size * grid.size, 0) === rowCount ? grids : null;
}

function rawHeadRowToDetection(row, gridX, gridY, stride, meta) {
  const classScores = row.slice(5).map(Number).filter(Number.isFinite);
  const classScore = classScores.length ? Math.max(...classScores) : Number(row[5] ?? 1);
  const score = sigmoid(row[4]) * sigmoid(classScore);
  const cx = (Number(row[0]) + gridX) * stride;
  const cy = (Number(row[1]) + gridY) * stride;
  const width = Math.exp(Math.min(Number(row[2]), 10)) * stride;
  const height = Math.exp(Math.min(Number(row[3]), 10)) * stride;
  if (![cx, cy, width, height, score].every(Number.isFinite) || width <= 1 || height <= 1) return null;
  return {
    label: "household subject",
    score,
    box: [
      clamp((cx - width / 2) / meta.ratio, 0, meta.sourceWidth - 1),
      clamp((cy - height / 2) / meta.ratio, 0, meta.sourceHeight - 1),
      clamp((cx + width / 2) / meta.ratio, 1, meta.sourceWidth),
      clamp((cy + height / 2) / meta.ratio, 1, meta.sourceHeight),
    ],
  };
}

function centerRowToDetection(row, meta) {
  const classScores = row.slice(5).map(Number).filter(Number.isFinite);
  const classScore = classScores.length ? Math.max(...classScores) : Number(row[5] ?? 1);
  const score = Number(row[4]) * classScore;
  const cx = Number(row[0]);
  const cy = Number(row[1]);
  const width = Number(row[2]);
  const height = Number(row[3]);
  if (![cx, cy, width, height, score].every(Number.isFinite) || width <= 1 || height <= 1) return null;
  return {
    label: "household subject",
    score,
    box: [
      clamp((cx - width / 2) / meta.ratio, 0, meta.sourceWidth - 1),
      clamp((cy - height / 2) / meta.ratio, 0, meta.sourceHeight - 1),
      clamp((cx + width / 2) / meta.ratio, 1, meta.sourceWidth),
      clamp((cy + height / 2) / meta.ratio, 1, meta.sourceHeight),
    ],
  };
}

function postprocessYoloxOutput(output, meta, threshold) {
  const values = Array.from(output?.data || []);
  const dims = Array.isArray(output?.dims) ? output.dims : [];
  const stride = dims.length >= 3 ? dims[dims.length - 1] : 6;
  const rowCount = Math.floor(values.length / stride);
  const grids = getYoloxGridSpec(rowCount, meta.inputSize);
  const detections = [];
  if (grids) {
    let rowIndex = 0;
    for (const grid of grids) {
      for (let gridY = 0; gridY < grid.size; gridY += 1) {
        for (let gridX = 0; gridX < grid.size; gridX += 1) {
          const offset = rowIndex * stride;
          rowIndex += 1;
          const detection = rawHeadRowToDetection(values.slice(offset, offset + stride), gridX, gridY, grid.stride, meta);
          if (detection && detection.score >= threshold) detections.push(detection);
        }
      }
    }
    return detections;
  }
  for (let index = 0; index + stride <= values.length; index += stride) {
    const detection = centerRowToDetection(values.slice(index, index + stride), meta);
    if (detection && detection.score >= threshold) detections.push(detection);
  }
  return detections;
}

function nmsDetections(detections, iouThreshold, maxItems) {
  const selected = [];
  for (const detection of detections.sort((a, b) => b.score - a.score)) {
    if (selected.some((existing) => boxIouPixels(existing.box, detection.box) >= iouThreshold)) continue;
    selected.push(detection);
    if (selected.length >= maxItems) break;
  }
  return selected;
}

async function runYolox(imagePath, options) {
  const startedAt = performance.now();
  const rawImage = await RawImage.read(imagePath);
  const input = await preprocessYoloxImage(rawImage, options.inputSize);
  const session = await ort.InferenceSession.create(options.modelPath, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
  const tensor = new ort.Tensor("float32", input.data, [1, 3, options.inputSize, options.inputSize]);
  const inferenceStartedAt = performance.now();
  const outputs = await session.run({ [session.inputNames[0] || "images"]: tensor });
  const inferenceMs = elapsedMs(inferenceStartedAt);
  const raw = postprocessYoloxOutput(outputs[session.outputNames[0]] || Object.values(outputs)[0], input, options.threshold);
  const nms = nmsDetections(raw, options.nmsIou, options.maxDetections);
  return {
    rawImage,
    detections: nms.map((detection, index) => ({
      id: `subject-${index + 1}`,
      rank: index + 1,
      label: detection.label,
      score: round(detection.score, 6),
      box: percentBoxFromPixels(detection.box, rawImage.width, rawImage.height),
      pixelBox: detection.box.map((value) => round(value, 2)),
    })),
    timings: {
      detectionMs: elapsedMs(startedAt),
      yoloxInferenceMs: inferenceMs,
      rawDetectionCount: raw.length,
      filteredDetectionCount: nms.length,
    },
  };
}

async function embedCrop(extractor, rawImage, box) {
  const cropStartedAt = performance.now();
  const crop = await rawImage.crop(pixelBoxFromPercent(box, rawImage.width, rawImage.height, 4));
  const cropMs = elapsedMs(cropStartedAt);
  const embeddingStartedAt = performance.now();
  const output = await extractor(crop);
  return {
    embedding: normalizeVector(poolFeatureOutput(output)),
    cropMeta: { width: crop.width, height: crop.height },
    cropMs,
    embeddingMs: elapsedMs(embeddingStartedAt),
  };
}

function normalizeIndexEntry(entry, index) {
  return {
    ...entry,
    displayName: entry.displayName || entry.name || entry.categoryId,
    categoryId: entry.categoryId || entry.itemId || "",
    appCategory: entry.appCategory || entry.category || "daily",
    categoryPath: Array.isArray(entry.categoryPath) ? entry.categoryPath : (Array.isArray(entry.path) ? entry.path : []),
    dimension: Array.isArray(entry.embedding) ? entry.embedding.length : Number(index.dimension || 0),
    indexVersion: index.version || "",
  };
}

function resolveIndexFilePath(value, baseFile = "") {
  const text = String(value || "");
  if (!text) return "";
  if (path.isAbsolute(text)) return text;
  if (baseFile && !text.startsWith("data/") && !text.startsWith("./") && !text.startsWith("../")) {
    return path.join(path.dirname(resolveRoot(baseFile)), text);
  }
  if (baseFile && (text.startsWith("./") || text.startsWith("../"))) {
    return path.resolve(path.dirname(resolveRoot(baseFile)), text);
  }
  return resolveRoot(text);
}

async function loadCatalogIndexPackage(pointerPath) {
  const pointerFile = resolveRoot(String(pointerPath || "").endsWith(".json") ? pointerPath : path.join(pointerPath, "manifest.json"));
  const pointerOrManifest = JSON.parse(await readFile(pointerFile, "utf8"));
  const manifestFile = pointerOrManifest.kind === "vision-index-package-manifest"
    ? pointerFile
    : resolveRoot(pointerOrManifest.manifestPath || "");
  if (!manifestFile) throw new Error(`missing package manifest path in ${pointerPath}`);
  const manifest = pointerOrManifest.kind === "vision-index-package-manifest"
    ? pointerOrManifest
    : JSON.parse(await readFile(manifestFile, "utf8"));
  if (manifest.kind !== "vision-index-package-manifest") {
    throw new Error(`invalid package manifest: ${manifestFile}`);
  }
  const metadataFile = resolveIndexFilePath(manifest.assets?.metadata, manifestFile);
  const vectorsFile = resolveIndexFilePath(manifest.assets?.vectors, manifestFile);
  const metadata = JSON.parse(await readFile(metadataFile, "utf8"));
  const dimension = Number(manifest.dimension || 0);
  const rawEntries = Array.isArray(metadata.entries) ? metadata.entries : [];
  const buffer = await readFile(vectorsFile);
  const expectedBytes = rawEntries.length * dimension * 4;
  if (!dimension || !rawEntries.length || buffer.byteLength !== expectedBytes) {
    throw new Error(`catalog-package-shape-mismatch:${rawEntries.length}x${dimension}/${buffer.byteLength}`);
  }
  const index = {
    ...manifest,
    kind: "vision-index-package",
    sourcePath: path.relative(ROOT, manifestFile),
    metadataPath: path.relative(ROOT, metadataFile),
    vectorsPath: path.relative(ROOT, vectorsFile),
    metric: manifest.metric || manifest.search?.metric || "max-inner-product",
    threshold: Number(manifest.thresholds?.acceptScore ?? 0.2),
    marginThreshold: Number(manifest.thresholds?.acceptMargin ?? 0.04),
    topK: Math.max(1, Math.round(Number(manifest.search?.topK || 15))),
    dimension,
  };
  index.entries = rawEntries.map((entry) => normalizeIndexEntry(entry, index)).filter(Boolean);
  index.search = {
    dimension,
    metric: index.metric,
    entries: index.entries,
    values: new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4),
  };
  return index;
}

async function loadCatalogIndex(args) {
  if (args.index) {
    const legacy = await readJson(args.index);
    const entries = (legacy.entries || []).map((entry) => normalizeIndexEntry(entry, legacy)).filter((entry) => (
      Array.isArray(entry.embedding) && entry.embedding.length
    ));
    return {
      ...legacy,
      sourcePath: args.index,
      metric: legacy.metric || "cosine",
      threshold: Number(legacy.thresholds?.acceptScore ?? legacy.threshold ?? 0.26),
      marginThreshold: Number(legacy.thresholds?.acceptMargin ?? legacy.marginThreshold ?? 0.03),
      dimension: Number(legacy.embedding?.dimension || legacy.dimension || entries[0]?.embedding?.length || 0),
      entries,
      embeddingModel: legacy.embedding?.model || legacy.embeddingModel || SIGLIP_MODEL,
    };
  }
  return loadCatalogIndexPackage(args.indexPackage || args.package || DEFAULT_INDEX_PACKAGE);
}

function aggregateMatches(matches) {
  const byCategory = new Map();
  for (const entry of matches) {
    const current = byCategory.get(entry.categoryId) || {
      categoryId: entry.categoryId,
      displayName: entry.displayName,
      appCategory: entry.appCategory,
      categoryPath: entry.categoryPath || [],
      scores: [],
      representativeImages: [],
      matchedSampleIds: [],
    };
    current.scores.push(entry.score);
    current.representativeImages.push({
      id: entry.id,
      sampleId: entry.sampleId,
      score: round(entry.score, 4),
      sourceImagePath: entry.sourceImagePath || entry.image?.path || "",
      normalizedImagePath: entry.normalizedImagePath || entry.image?.normalizedPath || "",
      sourceTitle: entry.sourceTitle || entry.image?.sourceTitle || "",
    });
    for (const sampleId of entry.matchedSampleIds || [entry.sampleId]) {
      if (sampleId && !current.matchedSampleIds.includes(sampleId)) current.matchedSampleIds.push(sampleId);
    }
    byCategory.set(entry.categoryId, current);
  }
  return [...byCategory.values()].map((category) => {
    const sorted = category.scores.sort((a, b) => b - a);
    const topScores = sorted.slice(0, 3);
    const bestScore = topScores[0] || 0;
    const averageScore = topScores.reduce((sum, score) => sum + score, 0) / Math.max(1, topScores.length);
    return {
      ...category,
      score: round((bestScore * 0.8) + (averageScore * 0.2) + Math.min(topScores.length, 3) * 0.002, 4),
      bestScore: round(bestScore, 4),
      averageScore: round(averageScore, 4),
      hitCount: category.scores.length,
      representativeImages: category.representativeImages.sort((a, b) => b.score - a.score).slice(0, 3),
    };
  }).sort((a, b) => b.score - a.score);
}

async function loadLeafClassifier(filePath = DEFAULT_LEAF_CLASSIFIER) {
  if (!filePath) return null;
  const classifier = await readJson(filePath).catch(() => null);
  if (classifier?.kind !== "vision-leaf-category-classifier") return null;
  const dimension = Number(classifier.dimension || 0);
  const labels = (Array.isArray(classifier.prototypes) ? classifier.prototypes : [])
    .map((prototype, index) => {
      const vector = Array.isArray(prototype.vector) ? normalizeVector(prototype.vector) : null;
      const categoryId = String(prototype.categoryId || "");
      if (!dimension || !categoryId || !vector?.length || vector.length !== dimension) return null;
      return {
        labelId: prototype.labelId ?? index,
        categoryId,
        displayName: prototype.zhName || prototype.displayName || prototype.name || categoryId,
        appCategory: prototype.appCategory || "daily",
        categoryPath: Array.isArray(prototype.categoryPath) ? prototype.categoryPath : [],
        trainSampleCount: Number(prototype.trainSampleCount || 0),
        prototypeId: prototype.prototypeId || "",
        vector,
      };
    })
    .filter(Boolean);
  if (!labels.length) return null;
  return {
    kind: classifier.kind,
    version: classifier.version || "",
    modelType: classifier.modelType || "",
    embeddingModel: classifier.embeddingModel || "",
    dimension,
    labels,
    sourcePath: filePath,
  };
}

function rankLeafClassifier(classifier, embedding, topK) {
  if (!classifier || classifier.dimension !== embedding.length) return [];
  const limit = Math.max(3, Number(topK || 5));
  const top = [];
  for (const label of classifier.labels) {
    const score = dot(embedding, label.vector, 0, classifier.dimension);
    if (top.length && score <= top[top.length - 1].score && top.length >= limit) continue;
    let insertAt = top.length;
    while (insertAt > 0 && score > top[insertAt - 1].score) insertAt -= 1;
    top.splice(insertAt, 0, { label, score });
    if (top.length > limit) top.length = limit;
  }
  return top.map(({ label, score }) => ({
    categoryId: label.categoryId,
    displayName: label.displayName,
    appCategory: label.appCategory,
    categoryPath: label.categoryPath,
    score: round(score, 4),
    classifierScore: round(score, 4),
    embeddingScore: 0,
    bestScore: round(score, 4),
    averageScore: round(score, 4),
    hitCount: Math.max(1, Number(label.trainSampleCount || 1)),
    representativeImages: [],
    matchedSampleIds: [],
  }));
}

function combineFusionLeaves(nearestLeaves, classifierLeaves, options = {}) {
  const nearestWeight = Number(options.indexWeight ?? 0.42);
  const classifierWeight = Number(options.classifierWeight ?? 0.58);
  const byCategory = new Map();
  for (const leaf of nearestLeaves || []) {
    byCategory.set(leaf.categoryId, {
      ...leaf,
      embeddingScore: Number(leaf.score) || 0,
      classifierScore: 0,
    });
  }
  for (const leaf of classifierLeaves || []) {
    const current = byCategory.get(leaf.categoryId);
    if (current) current.classifierScore = Math.max(Number(current.classifierScore) || 0, Number(leaf.score) || 0);
    else byCategory.set(leaf.categoryId, { ...leaf, embeddingScore: 0, classifierScore: Number(leaf.score) || 0 });
  }
  return [...byCategory.values()]
    .map((leaf) => {
      const score = round(((Number(leaf.embeddingScore) || 0) * nearestWeight) + ((Number(leaf.classifierScore) || 0) * classifierWeight), 4);
      return { ...leaf, score, fusionScore: score };
    })
    .sort((a, b) => b.score - a.score);
}

function rankCatalog(embedding, entries, index, topK) {
  const retrievalLimit = Math.max(Number(index.topK || 0), 80, topK);
  let ranked = [];
  if (index.search?.dimension === embedding.length) {
    const { values, dimension } = index.search;
    const topEntries = [];
    for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
      const score = dot(embedding, values, entryIndex * dimension, dimension);
      if (topEntries.length && score <= topEntries[topEntries.length - 1].score && topEntries.length >= retrievalLimit) continue;
      let insertAt = topEntries.length;
      while (insertAt > 0 && score > topEntries[insertAt - 1].score) insertAt -= 1;
      topEntries.splice(insertAt, 0, { entry: entries[entryIndex], score });
      if (topEntries.length > retrievalLimit) topEntries.length = retrievalLimit;
    }
    ranked = topEntries.map(({ entry, score }) => ({ ...entry, score }));
  } else {
    ranked = entries
      .filter((entry) => Array.isArray(entry.embedding) && entry.embedding.length === embedding.length)
      .map((entry) => ({ ...entry, score: dot(embedding, normalizeVector(entry.embedding)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, retrievalLimit);
  }
  const leaves = aggregateMatches(ranked);
  const best = leaves[0] || null;
  const runnerUp = leaves.find((entry) => entry.categoryId !== best?.categoryId) || null;
  const margin = best ? best.score - (runnerUp?.score || 0) : 0;
  const rejectionReason = !best
    ? "no-catalog-candidate"
    : best.score < Number(index.threshold ?? index.thresholds?.acceptScore ?? 0.26)
      ? "below-threshold"
      : margin < Number(index.marginThreshold ?? index.thresholds?.acceptMargin ?? 0.03)
        ? "low-margin"
        : "";
  return {
    accepted: !rejectionReason,
    name: rejectionReason ? (best?.displayName || "") : best.displayName,
    categoryId: rejectionReason ? "" : best.categoryId,
    categoryScore: round(best?.score || 0, 4),
    categoryMargin: round(margin, 4),
    namingRejectionReason: rejectionReason,
    catalogTopK: leaves.slice(0, topK),
    catalogCandidates: leaves.slice(0, 3),
    nearestIndexTopK: leaves.slice(0, topK),
  };
}

async function nameDetections(rawImage, detections, index, options) {
  const loadStartedAt = performance.now();
  const embeddingModel = index.embeddingModel || SIGLIP_MODEL;
  const extractor = await pipeline("image-feature-extraction", embeddingModel, { dtype: "q8" });
  const modelLoadMs = elapsedMs(loadStartedAt);
  const entries = index.entries || [];
  const classifier = options.classifier || null;
  const namingMode = ["nearest-index", "classifier", "fusion"].includes(options.namingMode)
    ? options.namingMode
    : "nearest-index";
  const results = [];
  for (const detection of detections) {
    const subjectStartedAt = performance.now();
    const embedded = await embedCrop(extractor, rawImage, detection.box);
    const retrievalStartedAt = performance.now();
    const nearestMatch = rankCatalog(embedded.embedding, entries, index, options.topK);
    const classifierLeaves = rankLeafClassifier(classifier, embedded.embedding, options.topK);
    const fusionLeaves = combineFusionLeaves(nearestMatch.nearestIndexTopK, classifierLeaves, options);
    const activeLeaves = namingMode === "classifier"
      ? classifierLeaves
      : namingMode === "fusion"
        ? fusionLeaves
        : nearestMatch.nearestIndexTopK;
    const activeBest = activeLeaves[0] || nearestMatch.catalogTopK[0] || null;
    const activeRunnerUp = activeLeaves.find((entry) => entry.categoryId !== activeBest?.categoryId) || null;
    const activeMargin = activeBest ? round((activeBest.score || 0) - (activeRunnerUp?.score || 0), 4) : 0;
    const activeAccepted = Boolean(activeBest)
      && Number(activeBest.score || 0) >= Number(index.threshold ?? index.thresholds?.acceptScore ?? 0.26)
      && activeMargin >= Number(index.marginThreshold ?? index.thresholds?.acceptMargin ?? 0.03);
    const match = {
      ...nearestMatch,
      accepted: activeAccepted,
      name: activeBest?.displayName || nearestMatch.name || "",
      categoryId: activeAccepted ? (activeBest?.categoryId || "") : "",
      categoryScore: round(activeBest?.score || 0, 4),
      categoryMargin: activeMargin,
      namingRejectionReason: activeAccepted ? "" : (!activeBest ? "no-catalog-candidate" : "debug-mode-low-confidence"),
      catalogTopK: activeLeaves.slice(0, options.topK),
      catalogCandidates: activeLeaves.slice(0, 3),
      debugAb: {
        mode: namingMode,
        nearestIndexTopK: nearestMatch.nearestIndexTopK.slice(0, 5),
        classifierTopK: classifierLeaves.slice(0, 5),
        fusionTopK: fusionLeaves.slice(0, 5),
      },
    };
    const retrievalMs = elapsedMs(retrievalStartedAt);
    results.push({
      ...detection,
      name: match.name || `物品${detection.rank}`,
      categoryId: match.categoryId,
      categoryScore: match.categoryScore,
      categoryMargin: match.categoryMargin,
      catalogCandidates: match.catalogCandidates,
      catalogTopK: match.catalogTopK,
      namingOutcome: match.accepted ? "accepted" : (match.catalogCandidates.length ? "candidate-only" : "generic-fallback"),
      namingRejectionReason: match.namingRejectionReason,
      cropMeta: embedded.cropMeta,
      namingDiagnostics: {
        subjectId: detection.id,
        sourceImageId: options.sourceImageId,
        detectionProvider: "local-yolox-household-subject",
        namingProvider: `node-cli-${namingMode}`,
        embeddingModel,
        indexVersion: index.version || "",
        classifierVersion: classifier?.version || "",
        subjectBox: detection.box,
        debugAb: match.debugAb,
        top3: match.catalogCandidates,
        topK: match.catalogTopK,
        score: match.categoryScore,
        margin: match.categoryMargin,
        acceptancePolicy: {
          score: Number(index.threshold ?? index.thresholds?.acceptScore ?? 0.26),
          margin: Number(index.marginThreshold ?? index.thresholds?.acceptMargin ?? 0.03),
        },
        rejectionReason: match.namingRejectionReason,
        timings: {
          cropMs: embedded.cropMs,
          embeddingMs: embedded.embeddingMs,
          retrievalMs,
          namingMs: elapsedMs(subjectStartedAt),
        },
      },
    });
  }
  return { candidates: results, timings: { embeddingModelLoadMs: modelLoadMs } };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const image = args.image || args.input;
  if (!image) throw new Error("missing --image");
  const output = args.output || "data/generated/photo-analysis-interface.json";
  const outputDir = path.dirname(output);
  const decodedImage = ensureDecodedImage(image, outputDir);
  const index = await loadCatalogIndex(args);
  const classifier = await loadLeafClassifier(args.leafClassifier || DEFAULT_LEAF_CLASSIFIER);
  const startedAt = performance.now();
  const detection = await runYolox(decodedImage, {
    modelPath: resolveRoot(args.yoloxModel || DEFAULT_YOLOX),
    inputSize: Number(args.inputSize || 416),
    threshold: Number(args.threshold ?? 0.12),
    nmsIou: Number(args.nmsIou ?? 0.45),
    maxDetections: Number(args.maxDetections || 15),
  });
  const naming = await nameDetections(detection.rawImage, detection.detections, index, {
    topK: Number(args.topK || 5),
    sourceImageId: path.basename(image),
    classifier,
    namingMode: args.namingMode || "nearest-index",
    classifierWeight: Number(args.classifierWeight ?? 0.58),
    indexWeight: Number(args.indexWeight ?? 0.42),
  });
  const payload = {
    kind: "photo-analysis-interface-result",
    version: "20260606-yolox-siglip-package-node-interface",
    image: {
      inputPath: image,
      decodedPath: path.relative(ROOT, decodedImage),
      width: detection.rawImage.width,
      height: detection.rawImage.height,
    },
    provider: {
      detector: "local-yolox-household-subject",
      detectorModel: args.yoloxModel || DEFAULT_YOLOX,
      naming: index.kind === "vision-index-package" ? "siglip-crop-embedding-package" : "crop-embedding-index",
      embeddingModel: index.embeddingModel || SIGLIP_MODEL,
      index: index.sourcePath || args.index || args.indexPackage || DEFAULT_INDEX,
      packageId: index.packageId || "",
      indexVersion: index.version || "",
      indexDimension: index.dimension || 0,
      indexMetric: index.metric || "",
      classifier: classifier?.sourcePath || "",
      classifierVersion: classifier?.version || "",
      namingMode: args.namingMode || "nearest-index",
    },
    diagnostics: {
      ...detection.timings,
      ...naming.timings,
      totalMs: elapsedMs(startedAt),
      resultCount: naming.candidates.length,
    },
    candidates: naming.candidates,
  };
  await writeJson(output, payload);
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
