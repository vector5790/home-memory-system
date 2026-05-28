#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { AutoModelForZeroShotObjectDetection, AutoProcessor, RawImage, env } from "@huggingface/transformers";

const DEFAULT_SOURCE = "/tmp/home-memory-openimages-household-scenes-v2-non-eval/COCO";
const DEFAULT_OUTPUT = "/tmp/home-memory-yolox-household-scenes-dino-assisted/COCO";
const DEFAULT_MODEL_ROOT = "/Users/guzeyu/workspace/home-memory-system/vendor/models";
const DEFAULT_EXCLUDE = [
  "/tmp/home-memory-yolox-fixed-eval-gold-v1/COCO",
  "/tmp/home-memory-yolox-fixed-eval-expanded-v1-filtered/COCO",
];
const MODEL_ID = "onnx-community/grounding-dino-tiny-ONNX";

const PROMPT_ALIASES = new Map([
  ["Bathroom cabinet", ["bathroom cabinet", "cabinet", "cupboard", "cabinet door"]],
  ["Bed", ["bed"]],
  ["Bookcase", ["bookcase", "bookshelf", "shelf"]],
  ["Cabinetry", ["cabinet", "cupboard", "storage cabinet", "cabinet door"]],
  ["Chair", ["chair"]],
  ["Chest of drawers", ["chest of drawers", "drawer cabinet", "drawer"]],
  ["Closet", ["closet", "wardrobe", "cabinet"]],
  ["Coffee table", ["coffee table", "table"]],
  ["Computer monitor", ["computer monitor", "monitor", "screen"]],
  ["Couch", ["couch", "sofa"]],
  ["Cupboard", ["cupboard", "cabinet", "cabinet door"]],
  ["Desk", ["desk", "table"]],
  ["Door", ["door"]],
  ["Drawer", ["drawer", "cabinet drawer"]],
  ["Filing cabinet", ["filing cabinet", "cabinet", "drawer"]],
  ["Houseplant", ["houseplant", "plant"]],
  ["Kitchen & dining room table", ["dining table", "kitchen table", "table"]],
  ["Kitchen appliance", ["kitchen appliance", "appliance"]],
  ["Lamp", ["lamp"]],
  ["Microwave oven", ["microwave oven", "microwave"]],
  ["Oven", ["oven"]],
  ["Refrigerator", ["refrigerator", "fridge"]],
  ["Remote control", ["remote control"]],
  ["Shelf", ["shelf", "shelving unit", "storage shelf"]],
  ["Sink", ["sink"]],
  ["Sofa bed", ["sofa bed", "couch", "sofa"]],
  ["Studio couch", ["studio couch", "couch", "sofa"]],
  ["Table", ["table"]],
  ["Television", ["television", "tv", "screen"]],
  ["Toilet", ["toilet"]],
  ["Vase", ["vase"]],
  ["Wardrobe", ["wardrobe", "closet", "cabinet"]],
  ["Washing machine", ["washing machine", "washer"]],
  ["Window", ["window"]],
  ["Window blind", ["window blind", "blind"]],
]);

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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
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
  for (let index = 0; index < values.length; index += width) rows.push(values.slice(index, index + width));
  return rows;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function xyxyFromDino(box, width, height) {
  const [x1, y1, x2, y2] = box;
  return [
    Math.round(clamp(x1, 0, width - 1)),
    Math.round(clamp(y1, 0, height - 1)),
    Math.round(clamp(x2, 1, width)),
    Math.round(clamp(y2, 1, height)),
  ];
}

function xyxyFromCoco(box) {
  const [x, y, w, h] = box.map(Number);
  return [x, y, x + w, y + h];
}

function cocoFromXyxy(box, width, height) {
  const x1 = clamp(box[0], 0, width - 1);
  const y1 = clamp(box[1], 0, height - 1);
  const x2 = clamp(box[2], x1 + 1, width);
  const y2 = clamp(box[3], y1 + 1, height);
  return [
    Math.round(x1 * 1000) / 1000,
    Math.round(y1 * 1000) / 1000,
    Math.round((x2 - x1) * 1000) / 1000,
    Math.round((y2 - y1) * 1000) / 1000,
  ];
}

function boxArea(box) {
  return Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
}

function iou(left, right) {
  const x1 = Math.max(left[0], right[0]);
  const y1 = Math.max(left[1], right[1]);
  const x2 = Math.min(left[2], right[2]);
  const y2 = Math.min(left[3], right[3]);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = boxArea(left) + boxArea(right) - intersection;
  return union > 0 ? intersection / union : 0;
}

function promptLabels(sourceLabels) {
  const labels = [];
  const seen = new Set();
  for (const label of sourceLabels) {
    const aliases = PROMPT_ALIASES.get(label) || [String(label || "").toLowerCase()];
    for (const alias of aliases) {
      const text = String(alias || "").trim().toLowerCase();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      labels.push(text);
    }
  }
  return labels.slice(0, 32);
}

async function fileSha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function collectExcludeHashes(roots) {
  const hashes = new Set();
  for (const root of roots) {
    for (const split of ["train", "val"]) {
      const annotationPath = path.join(root, "annotations", `instances_${split}2017.json`);
      let payload;
      try {
        payload = await readJson(annotationPath);
      } catch {
        continue;
      }
      for (const image of payload.images || []) {
        const imagePath = path.join(root, `${split}2017`, image.file_name);
        hashes.add(await fileSha256(imagePath));
      }
    }
  }
  return hashes;
}

async function runDino(rawImage, detector, labels, threshold) {
  const text = `${labels.join(". ")}.`;
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
    .map((box, index) => ({
      label: String(resultLabels[index] || ""),
      score: Math.round((Number(scores[index]) || 0) * 10000) / 10000,
      box: xyxyFromDino(box, rawImage.width, rawImage.height),
    }))
    .filter((item) => item.score >= threshold && boxArea(item.box) >= 64)
    .sort((left, right) => right.score - left.score);
}

function refineAnnotations(image, annotations, detections, options) {
  const usedDetections = new Set();
  const refined = [];
  const decisions = [];
  for (const ann of annotations) {
    const sourceBox = xyxyFromCoco(ann.bbox);
    let best = null;
    for (let index = 0; index < detections.length; index += 1) {
      if (usedDetections.has(index)) continue;
      const detection = detections[index];
      const overlap = iou(sourceBox, detection.box);
      if (!best || overlap > best.overlap) best = { index, detection, overlap };
    }
    const sourceArea = boxArea(sourceBox);
    const dinoArea = best ? boxArea(best.detection.box) : 0;
    const areaRatio = dinoArea / Math.max(1, sourceArea);
    const canReplace = best
      && best.overlap >= options.replaceIou
      && best.detection.score >= options.replaceScore
      && areaRatio >= 0.45
      && areaRatio <= 2.25;
    const finalBox = canReplace ? best.detection.box : sourceBox;
    if (canReplace) usedDetections.add(best.index);
    const bbox = cocoFromXyxy(finalBox, image.width, image.height);
    refined.push({
      bbox,
      sourceLabel: ann.sourceLabel || "household_subject",
      quality: canReplace ? "dino-assisted-refined" : "openimages-strong-kept",
      note: canReplace
        ? `dino score ${best.detection.score}; iou ${Math.round(best.overlap * 1000) / 1000}`
        : "kept original strong box",
    });
    decisions.push({
      sourceLabel: ann.sourceLabel || "",
      sourceBox: ann.bbox,
      finalBox: bbox,
      action: canReplace ? "replace-with-dino" : "keep-openimages",
      bestDino: best ? { score: best.detection.score, label: best.detection.label, box: best.detection.box, iou: Math.round(best.overlap * 1000) / 1000 } : null,
    });
  }
  for (let index = 0; index < detections.length; index += 1) {
    if (usedDetections.has(index)) continue;
    const detection = detections[index];
    const areaRatio = boxArea(detection.box) / Math.max(1, image.width * image.height);
    const overlapsExisting = refined.some((ann) => iou(xyxyFromCoco(ann.bbox), detection.box) >= 0.25);
    if (detection.score < options.addScore || areaRatio < 0.006 || areaRatio > 0.55 || overlapsExisting) continue;
    const bbox = cocoFromXyxy(detection.box, image.width, image.height);
    refined.push({
      bbox,
      sourceLabel: detection.label || "dino subject",
      quality: "dino-assisted-added",
      note: `added high-confidence dino box score ${detection.score}`,
    });
    decisions.push({
      sourceLabel: detection.label || "",
      sourceBox: null,
      finalBox: bbox,
      action: "add-dino-high-confidence",
      bestDino: { score: detection.score, label: detection.label, box: detection.box, iou: null },
    });
  }
  return { refined, decisions };
}

async function buildSplit({ source, output, split, detector, excludeHashes, options, summary }) {
  const sourceAnnotations = await readJson(path.join(source, "annotations", `instances_${split}2017.json`));
  const sourceImageDir = path.join(source, `${split}2017`);
  const outputImageDir = path.join(output, `${split}2017`);
  await mkdir(outputImageDir, { recursive: true });
  const annotationsByImage = new Map();
  for (const annotation of sourceAnnotations.annotations || []) {
    if (!annotationsByImage.has(annotation.image_id)) annotationsByImage.set(annotation.image_id, []);
    annotationsByImage.get(annotation.image_id).push(annotation);
  }
  const images = [];
  const annotations = [];
  const reviewRows = [];
  for (const image of sourceAnnotations.images || []) {
    const sourceImagePath = path.join(sourceImageDir, image.file_name);
    const digest = await fileSha256(sourceImagePath);
    if (excludeHashes.has(digest)) {
      summary.skippedEvalLeaks += 1;
      continue;
    }
    if (options.maxImages && images.length >= options.maxImages) break;
    const rawImage = await RawImage.read(sourceImagePath);
    const sourceRows = annotationsByImage.get(image.id) || [];
    const labels = promptLabels(sourceRows.map((ann) => ann.sourceLabel || ""));
    const detections = labels.length ? await runDino(rawImage, detector, labels, options.dinoThreshold) : [];
    const newImage = {
      ...image,
      id: images.length + 1,
      dinoPromptLabels: labels,
      sourceImageId: image.id,
      sourceDataset: source,
    };
    await copyFile(sourceImagePath, path.join(outputImageDir, image.file_name));
    const { refined, decisions } = refineAnnotations(newImage, sourceRows, detections, options);
    for (const item of refined) {
      annotations.push({
        id: annotations.length + 1,
        image_id: newImage.id,
        category_id: 1,
        bbox: item.bbox,
        area: Math.round(item.bbox[2] * item.bbox[3] * 1000) / 1000,
        iscrowd: 0,
        sourceLabel: item.sourceLabel,
        quality: item.quality,
        note: item.note,
      });
      summary.quality[item.quality] = (summary.quality[item.quality] || 0) + 1;
    }
    reviewRows.push({
      split,
      imageId: newImage.id,
      fileName: newImage.file_name,
      promptLabels: labels,
      sourceAnnotationCount: sourceRows.length,
      dinoDetectionCount: detections.length,
      finalAnnotationCount: refined.length,
      decisions,
      dinoDetections: detections.slice(0, 60),
    });
    images.push(newImage);
    summary.images += 1;
    summary.annotations += refined.length;
    if (summary.images === 1 || summary.images % 10 === 0) {
      console.log(JSON.stringify({ split, images: summary.images, annotations: summary.annotations, file: image.file_name }));
    }
  }
  const payload = {
    info: {
      description: "DINO-assisted non-eval household large-scene training set for Home Memory YOLOX.",
      source,
      policy: "Single class household_subject. Final item names remain embedding-retrieved, never detector-label based.",
    },
    licenses: sourceAnnotations.licenses || [],
    categories: [{ id: 1, name: "household_subject", supercategory: "household" }],
    images,
    annotations,
  };
  await mkdir(path.join(output, "annotations"), { recursive: true });
  await writeFile(path.join(output, "annotations", `instances_${split}2017.json`), JSON.stringify(payload, null, 2), "utf8");
  await mkdir(path.join(output, "review"), { recursive: true });
  await writeFile(path.join(output, "review", `dino-decisions-${split}.json`), JSON.stringify(reviewRows, null, 2), "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = path.resolve(args.source || DEFAULT_SOURCE);
  const output = path.resolve(args.output || DEFAULT_OUTPUT);
  const modelRoot = path.resolve(args.modelRoot || DEFAULT_MODEL_ROOT);
  const excludeRoots = String(args.exclude || DEFAULT_EXCLUDE.join(","))
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const options = {
    dinoThreshold: Number(args.dinoThreshold || 0.08),
    replaceIou: Number(args.replaceIou || 0.35),
    replaceScore: Number(args.replaceScore || 0.12),
    addScore: Number(args.addScore || 0.42),
    maxImages: Number(args.maxImages || 0),
  };
  await rm(output, { recursive: true, force: true });
  env.allowLocalModels = true;
  env.allowRemoteModels = false;
  env.localModelPath = `${modelRoot}${path.sep}`;
  env.useBrowserCache = false;
  const excludeHashes = await collectExcludeHashes(excludeRoots);
  console.log(JSON.stringify({ stage: "load-dino", modelRoot, excludeHashes: excludeHashes.size, options }));
  const processor = await AutoProcessor.from_pretrained(MODEL_ID);
  const model = await AutoModelForZeroShotObjectDetection.from_pretrained(MODEL_ID, { dtype: "q8" });
  const detector = { processor, model };
  const summary = {
    output,
    source,
    excludeRoots,
    skippedEvalLeaks: 0,
    images: 0,
    annotations: 0,
    quality: {},
    options,
  };
  await buildSplit({ source, output, split: "train", detector, excludeHashes, options, summary });
  await buildSplit({ source, output, split: "val", detector, excludeHashes, options, summary });
  await writeFile(path.join(output, "dataset-summary.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
