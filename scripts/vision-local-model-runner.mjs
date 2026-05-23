#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AutoModelForZeroShotObjectDetection,
  AutoProcessor,
  RawImage,
  SamModel,
  env,
  pipeline,
} from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODEL_IDS = {
  groundingDino: "onnx-community/grounding-dino-tiny-ONNX",
  owlvit: "Xenova/owlvit-base-patch32",
  sam: "Xenova/slimsam-77-uniform",
  clip: "Xenova/clip-vit-base-patch32",
};
const DETECTOR_PROVIDERS = new Set(["grounding-dino", "grounding-dino-sam", "owlvit", "owlvit-sam"]);
const TOP_K = 3;

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = path.join(ROOT, "vendor", "models") + path.sep;
env.useBrowserCache = false;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function requireArg(args, key) {
  const value = args[key];
  if (!value) throw new Error(`missing --${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`);
  return value;
}

function resolveRootPath(value) {
  const text = String(value || "");
  return path.isAbsolute(text) ? text : path.join(ROOT, text);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(resolveRootPath(filePath), "utf8"));
}

async function writeJson(filePath, payload) {
  const resolved = resolveRootPath(filePath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function elapsedMs(start) {
  return Math.round((performance.now() - start) * 1000) / 1000;
}

function round(value, digits = 6) {
  if (!Number.isFinite(Number(value))) return 0;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[.\-_/\\()（）·\s　]+/g, "");
}

function normalizePromptLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[。]+/g, ".")
    .replace(/\.+$/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildCategoryLookup(categoriesPayload, allowedCategoryIds = null) {
  const entries = [];
  const labelMap = new Map();
  for (const category of categoriesPayload.categories || []) {
    if (!category || category.active === false || !category.id) continue;
    if (allowedCategoryIds && !allowedCategoryIds.has(category.id)) continue;
    const rawLabels = [
      ...(category.detectorLabels || []),
      ...(category.aliases || []),
      category.id.replace(/-/g, " "),
      category.displayName,
    ];
    const labels = unique(rawLabels.map(normalizePromptLabel)).filter((label) => label.length >= 2);
    const entry = {
      id: category.id,
      displayName: category.displayName || category.id,
      appCategory: category.appCategory || "daily",
      categoryPath: Array.isArray(category.displayPath) ? category.displayPath : [],
      labels,
    };
    entries.push(entry);
    for (const label of labels) {
      labelMap.set(normalizeText(label), entry);
    }
  }
  return {
    entries,
    labels: unique(entries.flatMap((entry) => entry.labels)),
    labelMap,
  };
}

function categoryForLabel(label, lookup) {
  const normalized = normalizeText(label);
  if (lookup.labelMap.has(normalized)) return lookup.labelMap.get(normalized);
  for (const [key, category] of lookup.labelMap.entries()) {
    if (normalized.includes(key) || key.includes(normalized)) return category;
  }
  return null;
}

function tensorValues(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (ArrayBuffer.isView(value)) return Array.from(value);
  if (Array.isArray(value.data)) return value.data;
  if (ArrayBuffer.isView(value.data)) return Array.from(value.data);
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function normalizePercentBox(box) {
  if (!box) return null;
  const width = clamp(box.w, 0.1, 100);
  const height = clamp(box.h, 0.1, 100);
  return {
    x: round(clamp(box.x, 0, 100 - width), 4),
    y: round(clamp(box.y, 0, 100 - height), 4),
    w: round(width, 4),
    h: round(height, 4),
  };
}

function percentBoxFromPixels(box, width, height) {
  const [x1, y1, x2, y2] = Array.isArray(box)
    ? box
    : [
        box.xmin ?? box.x_min ?? box.left ?? box.x ?? 0,
        box.ymin ?? box.y_min ?? box.top ?? box.y ?? 0,
        box.xmax ?? box.x_max ?? box.right ?? ((box.xmin ?? box.x ?? 0) + (box.width ?? box.w ?? 1)),
        box.ymax ?? box.y_max ?? box.bottom ?? ((box.ymin ?? box.y ?? 0) + (box.height ?? box.h ?? 1)),
      ];
  return normalizePercentBox({
    x: (Number(x1) / width) * 100,
    y: (Number(y1) / height) * 100,
    w: ((Number(x2) - Number(x1)) / width) * 100,
    h: ((Number(y2) - Number(y1)) / height) * 100,
  });
}

function pixelBoxFromPercent(box, width, height, paddingPct = 0) {
  const normalized = normalizePercentBox(box) || { x: 0, y: 0, w: 100, h: 100 };
  const padX = (normalized.w * paddingPct) / 100;
  const padY = (normalized.h * paddingPct) / 100;
  const x1 = clamp(((normalized.x - padX) / 100) * width, 0, width - 1);
  const y1 = clamp(((normalized.y - padY) / 100) * height, 0, height - 1);
  const x2 = clamp(((normalized.x + normalized.w + padX) / 100) * width, x1 + 1, width);
  const y2 = clamp(((normalized.y + normalized.h + padY) / 100) * height, y1 + 1, height);
  return [Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)];
}

function normalizeVector(values) {
  const vector = Array.from(values || [], Number);
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => round(value / norm, 8));
}

function dot(left, right) {
  let score = 0;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) score += left[index] * right[index];
  return score;
}

async function loadClipResources(index, outputPath) {
  const loadStart = performance.now();
  const extractor = await pipeline("image-feature-extraction", MODEL_IDS.clip, { dtype: "q8" });
  const modelLoadMs = elapsedMs(loadStart);
  const cachePath = path.join(path.dirname(resolveRootPath(outputPath)), "clip-gallery-cache.json");
  const signature = JSON.stringify({
    indexVersion: index.version,
    entries: (index.entries || []).map((entry) => [entry.id, entry.sourceImagePath, entry.box]),
  });
  let cached = null;
  try {
    cached = JSON.parse(await readFile(cachePath, "utf8"));
  } catch {
    cached = null;
  }
  if (cached?.signature === signature && Array.isArray(cached.entries)) {
    return {
      extractor,
      entries: cached.entries,
      timings: { clipModelLoadMs: modelLoadMs, galleryEmbeddingMs: 0, galleryCacheHit: true },
    };
  }

  const galleryStart = performance.now();
  const entries = [];
  for (const entry of index.entries || []) {
    if (!entry?.sourceImagePath) continue;
    if (Array.isArray(entry.embedding) && entry.embedding.length > 0) {
      entries.push({ ...entry, clipEmbedding: normalizeVector(entry.embedding) });
      continue;
    }
    const image = await RawImage.read(resolveRootPath(entry.sourceImagePath));
    const embedding = await embedRawImage(extractor, image, entry.box || entry.region);
    entries.push({ ...entry, clipEmbedding: embedding.vector });
  }
  const galleryEmbeddingMs = elapsedMs(galleryStart);
  await writeJson(cachePath, { signature, entries });
  return {
    extractor,
    entries,
    timings: { clipModelLoadMs: modelLoadMs, galleryEmbeddingMs, galleryCacheHit: false },
  };
}

async function embedRawImage(extractor, rawImage, box) {
  const cropStart = performance.now();
  const input = box
    ? await rawImage.crop(pixelBoxFromPercent(box, rawImage.width, rawImage.height, 4))
    : rawImage;
  const cropMs = elapsedMs(cropStart);
  const embeddingStart = performance.now();
  const output = await extractor(input);
  return {
    vector: normalizeVector(output?.data || []),
    cropMs,
    embeddingMs: elapsedMs(embeddingStart),
  };
}

function rankClipMatches(queryVector, clipEntries, index) {
  const matches = clipEntries
    .filter((entry) => Array.isArray(entry.clipEmbedding) && entry.clipEmbedding.length === queryVector.length)
    .map((entry) => ({
      entryId: entry.id,
      sampleId: entry.sampleId,
      categoryId: entry.categoryId,
      displayName: entry.displayName || entry.name,
      categoryPath: entry.categoryPath || [],
      imagePath: entry.sourceImagePath,
      sourceImagePath: entry.sourceImagePath,
      sourceUrl: entry.sourceUrl,
      sourceTitle: entry.sourceTitle,
      license: entry.license,
      box: entry.box,
      crop: entry.crop || {},
      matchedSampleIds: entry.matchedSampleIds || [],
      categoryIndexVersion: index.version,
      embeddingModel: MODEL_IDS.clip,
      metric: "cosine",
      score: round(dot(queryVector, entry.clipEmbedding), 6),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, TOP_K);
  if (matches[0]) {
    const runnerUp = matches.slice(1).find((match) => match.categoryId !== matches[0].categoryId);
    matches[0].margin = round(matches[0].score - (runnerUp?.score || 0), 6);
  }
  return matches;
}

async function loadGroundingDino() {
  const start = performance.now();
  const processor = await AutoProcessor.from_pretrained(MODEL_IDS.groundingDino);
  const model = await AutoModelForZeroShotObjectDetection.from_pretrained(MODEL_IDS.groundingDino, { dtype: "q8" });
  return { kind: "grounding-dino", processor, model, modelLoadMs: elapsedMs(start) };
}

async function loadOwlVit() {
  const start = performance.now();
  const detector = await pipeline("zero-shot-object-detection", MODEL_IDS.owlvit, { dtype: "q8" });
  return { kind: "owlvit", detector, modelLoadMs: elapsedMs(start) };
}

async function loadSam() {
  const start = performance.now();
  const processor = await AutoProcessor.from_pretrained(MODEL_IDS.sam);
  const model = await SamModel.from_pretrained(MODEL_IDS.sam, { dtype: "q8" });
  return { processor, model, modelLoadMs: elapsedMs(start) };
}

async function runGroundingDinoDetector(rawImage, detector, labels, lookup, threshold) {
  const text = `${labels.map(normalizePromptLabel).filter(Boolean).join(". ")}.`;
  const inputs = await detector.processor(rawImage, text);
  const outputs = await detector.model(inputs);
  let processed = detector.processor.post_process_grounded_object_detection(outputs, inputs.input_ids, {
    box_threshold: threshold,
    text_threshold: threshold,
    target_sizes: [[rawImage.height, rawImage.width]],
  });
  if (processed instanceof Promise) processed = await processed;
  const first = Array.isArray(processed) ? processed[0] : processed;
  const scores = tensorValues(first?.scores);
  const boxes = tensorRows(first?.boxes, 4);
  const resultLabels = tensorValues(first?.labels);
  return boxes
    .map((box, index) => {
      const label = String(resultLabels[index] || "");
      const category = categoryForLabel(label, lookup);
      return {
        label,
        category,
        categoryId: category?.id || "",
        score: Number(scores[index]) || 0,
        box: percentBoxFromPixels(box, rawImage.width, rawImage.height),
      };
    })
    .filter((detection) => detection.box && detection.score >= threshold)
    .sort((left, right) => right.score - left.score);
}

async function runOwlVitDetector(imagePath, detector, labels, lookup, threshold, rawImage) {
  const output = await detector(imagePath, labels, { threshold, percentage: false });
  return (Array.isArray(output) ? output : [])
    .map((result) => {
      const category = categoryForLabel(result.label, lookup);
      return {
        label: String(result.label || ""),
        category,
        categoryId: category?.id || "",
        score: Number(result.score) || 0,
        box: percentBoxFromPixels(result.box, rawImage.width, rawImage.height),
      };
    })
    .filter((detection) => detection.box && detection.score >= threshold)
    .sort((left, right) => right.score - left.score);
}

async function runOwlVitDetectorBatched(imagePath, detector, labels, lookup, threshold, rawImage, chunkSize = 32) {
  const detections = [];
  for (let index = 0; index < labels.length; index += chunkSize) {
    const chunk = labels.slice(index, index + chunkSize);
    detections.push(...await runOwlVitDetector(imagePath, detector, chunk, lookup, threshold, rawImage));
  }
  return detections.sort((left, right) => right.score - left.score);
}

function maskBoxFromTensor(mask, channelIndex, rawImage) {
  const dims = mask?.dims || [];
  const data = mask?.data || [];
  if (!dims.length || !data.length) return null;
  const width = Number(dims[dims.length - 1]);
  const height = Number(dims[dims.length - 2]);
  const channels = dims.length >= 3 ? Number(dims[dims.length - 3]) : 1;
  const channel = clamp(channelIndex, 0, Math.max(0, channels - 1));
  const planeSize = width * height;
  const offset = (data.length >= planeSize * (channel + 1) ? channel : 0) * planeSize;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let pixels = 0;
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
  return normalizePercentBox({
    x: (minX / width) * 100,
    y: (minY / height) * 100,
    w: ((maxX - minX + 1) / width) * 100,
    h: ((maxY - minY + 1) / height) * 100,
  });
}

function boxArea(box) {
  return Math.max(0, Number(box?.w) || 0) * Math.max(0, Number(box?.h) || 0);
}

function plausibleRefinement(original, refined) {
  if (!original || !refined) return false;
  const center = { x: original.x + original.w / 2, y: original.y + original.h / 2 };
  const containsCenter = center.x >= refined.x
    && center.x <= refined.x + refined.w
    && center.y >= refined.y
    && center.y <= refined.y + refined.h;
  const areaRatio = boxArea(refined) / Math.max(1, boxArea(original));
  return containsCenter && areaRatio >= 0.12 && areaRatio <= 3.8;
}

async function refineBoxWithSam(segmenter, rawImage, box) {
  const [x1, y1, x2, y2] = pixelBoxFromPercent(box, rawImage.width, rawImage.height, 0);
  const centerPoint = [Math.round((x1 + x2) / 2), Math.round((y1 + y2) / 2)];
  const inputs = await segmenter.processor(rawImage, {
    input_points: [[centerPoint]],
    input_labels: [[1]],
  });
  const outputs = await segmenter.model(inputs);
  const masks = await segmenter.processor.post_process_masks(
    outputs.pred_masks,
    inputs.original_sizes,
    inputs.reshaped_input_sizes,
  );
  const scores = tensorValues(outputs.iou_scores);
  const bestMaskIndex = scores.reduce((best, score, index) => (score > scores[best] ? index : best), 0);
  const refined = maskBoxFromTensor(masks[0], bestMaskIndex, rawImage);
  return plausibleRefinement(box, refined) ? refined : box;
}

function bestDetection(detections) {
  const withCategory = detections.filter((detection) => detection.categoryId);
  return (withCategory.length ? withCategory : detections)[0] || null;
}

async function buildPrediction({
  image,
  providerId,
  rawImage,
  detected,
  box,
  clip,
  index,
  timing,
  confidence,
  failureReason = "",
}) {
  const namingStart = performance.now();
  const embedding = box ? await embedRawImage(clip.extractor, rawImage, box) : null;
  const retrievalStart = performance.now();
  const matches = embedding ? rankClipMatches(embedding.vector, clip.entries, index) : [];
  const retrievalMs = elapsedMs(retrievalStart);
  const best = matches[0] || null;
  const categoryId = best?.categoryId || detected?.categoryId || "";
  const name = best?.displayName || detected?.category?.displayName || detected?.label || "";
  return {
    id: `${providerId}-pred-${image.id}`,
    providerId,
    providerClass: "real-local-model",
    name,
    categoryId,
    categoryPath: best?.categoryPath || detected?.category?.categoryPath || [],
    box,
    confidence: round(confidence ?? detected?.score ?? best?.score ?? 0, 4),
    detectionLabel: detected?.label || "",
    detectionCategoryId: detected?.categoryId || "",
    detectionScore: round(detected?.score || 0, 6),
    matches,
    source: providerId,
    failureReason,
    timings: {
      detectionMs: timing.detectionMs ?? null,
      segmentationMs: timing.segmentationMs ?? null,
      cropMs: embedding?.cropMs ?? 0,
      embeddingMs: embedding?.embeddingMs ?? null,
      retrievalMs,
      namingMs: elapsedMs(namingStart),
      modelLoadMs: timing.modelLoadMs ?? null,
      endToEndMs: elapsedMs(timing.start),
    },
    modelIds: timing.modelIds || [],
    assetVersion: timing.assetVersion || "",
  };
}

function failurePrediction(image, providerId, error, timing = {}) {
  return {
    id: `${providerId}-failed-${image.id}`,
    providerId,
    providerClass: "real-local-model",
    name: "",
    categoryId: "",
    box: null,
    confidence: 0,
    matches: [],
    source: providerId,
    failureReason: String(error?.message || error || "provider failed"),
    timings: {
      detectionMs: timing.detectionMs ?? null,
      segmentationMs: timing.segmentationMs ?? null,
      cropMs: null,
      embeddingMs: null,
      retrievalMs: null,
      namingMs: null,
      modelLoadMs: timing.modelLoadMs ?? null,
      endToEndMs: timing.start ? elapsedMs(timing.start) : null,
    },
    modelIds: timing.modelIds || [],
  };
}

async function runDetectorProvider(providerId, dataset, index, categories, outputPath) {
  const indexedCategoryIds = new Set((index.entries || []).map((entry) => entry.categoryId).filter(Boolean));
  const lookup = buildCategoryLookup(categories, indexedCategoryIds.size ? indexedCategoryIds : null);
  const modelIds = providerId.startsWith("grounding-dino")
    ? [MODEL_IDS.groundingDino, MODEL_IDS.clip]
    : [MODEL_IDS.owlvit, MODEL_IDS.clip];
  if (providerId.endsWith("-sam")) modelIds.push(MODEL_IDS.sam);

  const detector = providerId.startsWith("grounding-dino") ? await loadGroundingDino() : await loadOwlVit();
  const clip = await loadClipResources(index, outputPath);
  const segmenter = providerId.endsWith("-sam") ? await loadSam() : null;
  const modelLoadMs = round(detector.modelLoadMs + clip.timings.clipModelLoadMs + (segmenter?.modelLoadMs || 0), 3);

  const images = [];
  for (const image of dataset.images || []) {
    const imageStart = performance.now();
    try {
      const imagePath = resolveRootPath(image.imagePath);
      const rawImage = await RawImage.read(imagePath);
      const detectionStart = performance.now();
      const detections = detector.kind === "grounding-dino"
        ? await runGroundingDinoDetector(rawImage, detector, lookup.labels, lookup, 0.05)
        : await runOwlVitDetectorBatched(imagePath, detector.detector, lookup.labels, lookup, 0.05, rawImage);
      const detectionMs = elapsedMs(detectionStart);
      const detected = bestDetection(detections);

      let box = detected?.box || null;
      let segmentationMs = null;
      let segmentationStatus = "not-requested";
      if (segmenter && box) {
        const segmentationStart = performance.now();
        try {
          box = await refineBoxWithSam(segmenter, rawImage, box);
          segmentationStatus = "point-prompt-mask";
        } catch (error) {
          segmentationStatus = `failed: ${error.message || error}`;
        }
        segmentationMs = elapsedMs(segmentationStart);
      }

      const prediction = await buildPrediction({
        image,
        providerId,
        rawImage,
        detected,
        box,
        clip,
        index,
        confidence: detected ? Math.min(0.99, Math.max(0.05, detected.score)) : 0,
        failureReason: detected ? "" : "no detections above threshold",
        timing: {
          start: imageStart,
          detectionMs,
          segmentationMs,
          modelLoadMs,
          modelIds,
        },
      });
      prediction.segmentationStatus = segmentationStatus;
      prediction.detectionCount = detections.length;
      images.push({ imageId: image.id, imagePath: image.imagePath, predictions: [prediction] });
    } catch (error) {
      images.push({
        imageId: image.id,
        imagePath: image.imagePath,
        predictions: [failurePrediction(image, providerId, error, { start: imageStart, modelLoadMs, modelIds })],
      });
    }
  }

  return {
    provider: {
      id: providerId,
      displayName: providerId,
      providerClass: "real-local-model",
      status: "ok",
      modelIds,
      requiredModels: modelIds,
      timings: {
        detectorModelLoadMs: detector.modelLoadMs,
        clipModelLoadMs: clip.timings.clipModelLoadMs,
        samModelLoadMs: segmenter?.modelLoadMs || null,
        galleryEmbeddingMs: clip.timings.galleryEmbeddingMs,
        galleryCacheHit: clip.timings.galleryCacheHit,
        modelLoadMs,
      },
    },
    images,
  };
}

async function runClipNamingProvider(providerId, dataset, index, outputPath) {
  const clip = await loadClipResources(index, outputPath);
  const modelLoadMs = clip.timings.clipModelLoadMs;
  const images = [];
  for (const image of dataset.images || []) {
    const imageStart = performance.now();
    try {
      const rawImage = await RawImage.read(resolveRootPath(image.imagePath));
      const fullImageBox = { x: 0, y: 0, w: 100, h: 100 };
      const prediction = await buildPrediction({
        image,
        providerId,
        rawImage,
        detected: null,
        box: fullImageBox,
        clip,
        index,
        confidence: 0.5,
        timing: {
          start: imageStart,
          detectionMs: null,
          segmentationMs: null,
          modelLoadMs,
          modelIds: [MODEL_IDS.clip],
        },
      });
      images.push({ imageId: image.id, imagePath: image.imagePath, predictions: [prediction] });
    } catch (error) {
      images.push({
        imageId: image.id,
        imagePath: image.imagePath,
        predictions: [failurePrediction(image, providerId, error, { start: imageStart, modelLoadMs, modelIds: [MODEL_IDS.clip] })],
      });
    }
  }
  return {
    provider: {
      id: providerId,
      displayName: providerId,
      providerClass: "real-local-model",
      status: "ok",
      modelIds: [MODEL_IDS.clip],
      requiredModels: [MODEL_IDS.clip],
      timings: {
        clipModelLoadMs: clip.timings.clipModelLoadMs,
        galleryEmbeddingMs: clip.timings.galleryEmbeddingMs,
        galleryCacheHit: clip.timings.galleryCacheHit,
        modelLoadMs,
      },
    },
    images,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataset = await readJson(requireArg(args, "dataset"));
  const index = await readJson(requireArg(args, "index"));
  const categories = await readJson(args.categories || path.join(ROOT, "data", "vision-categories.seed.json"));
  const providerId = requireArg(args, "provider");
  const outputPath = requireArg(args, "output");

  if (!DETECTOR_PROVIDERS.has(providerId) && providerId !== "clip-naming") {
    throw new Error(`unsupported local provider: ${providerId}`);
  }

  const payload = DETECTOR_PROVIDERS.has(providerId)
    ? await runDetectorProvider(providerId, dataset, index, categories, outputPath)
    : await runClipNamingProvider(providerId, dataset, index, outputPath);

  await writeJson(outputPath, {
    kind: "vision-local-model-provider-output",
    version: "20260523-transformersjs-local",
    ...payload,
  });
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
