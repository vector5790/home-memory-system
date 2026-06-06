#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RawImage, env, pipeline } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PACKAGE = "data/vision-index-packages/household-cn-grounding-dino-siglip";
const DEFAULT_MODEL = "Xenova/siglip-base-patch16-224";

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
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function resolveRoot(value) {
  return path.isAbsolute(String(value || "")) ? value : path.join(ROOT, String(value || ""));
}

function round(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function elapsedMs(startedAt) {
  return round(performance.now() - startedAt);
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

function pixelBoxFromPercent(box, width, height, paddingPct = 4) {
  const padX = ((Number(box.w) || 0) * paddingPct) / 100;
  const padY = ((Number(box.h) || 0) * paddingPct) / 100;
  const x1 = Math.max(0, Math.min(width - 1, ((Number(box.x) - padX) / 100) * width));
  const y1 = Math.max(0, Math.min(height - 1, ((Number(box.y) - padY) / 100) * height));
  const x2 = Math.max(x1 + 1, Math.min(width, ((Number(box.x) + Number(box.w) + padX) / 100) * width));
  const y2 = Math.max(y1 + 1, Math.min(height, ((Number(box.y) + Number(box.h) + padY) / 100) * height));
  return [Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)];
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

function poolFeatureBatchOutput(output, expectedCount) {
  const data = Array.from(output?.data || output?.[0]?.data || [], Number);
  const dims = Array.isArray(output?.dims) ? output.dims : (Array.isArray(output?.[0]?.dims) ? output[0].dims : []);
  if (dims.length === 2 && dims[0] > 0 && dims[1] > 0) {
    return Array.from({ length: Math.min(expectedCount, dims[0]) }, (_, index) => data.slice(index * dims[1], (index + 1) * dims[1]));
  }
  if (dims.length === 3 && dims[0] > 0 && dims[1] > 0 && dims[2] > 0) {
    return Array.from({ length: Math.min(expectedCount, dims[0]) }, (_, batchIndex) => {
      const pooled = Array(dims[2]).fill(0);
      const batchOffset = batchIndex * dims[1] * dims[2];
      for (let token = 0; token < dims[1]; token += 1) {
        for (let dim = 0; dim < dims[2]; dim += 1) pooled[dim] += data[batchOffset + (token * dims[2]) + dim];
      }
      return pooled.map((value) => value / dims[1]);
    });
  }
  return expectedCount === 1 ? [poolFeatureOutput(output)] : [];
}

function normalizeVector(values) {
  const vector = Array.from(values || [], Number);
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return Float32Array.from(vector.map((value) => value / norm));
}

async function loadPackage(packageDir) {
  const manifestPath = path.join(resolveRoot(packageDir), "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const metadataPath = path.join(path.dirname(manifestPath), manifest.assets.metadata);
  const vectorsPath = path.join(path.dirname(manifestPath), manifest.assets.vectors);
  const indexStartedAt = performance.now();
  const [metadata, buffer] = await Promise.all([
    readFile(metadataPath, "utf8").then(JSON.parse),
    readFile(vectorsPath),
  ]);
  const vectors = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  return {
    manifest,
    entries: metadata.entries || [],
    vectors,
    indexLoadMs: elapsedMs(indexStartedAt),
  };
}

function rankTopK(query, entries, values, dimension, topK) {
  const top = [];
  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const offset = entryIndex * dimension;
    let score = 0;
    for (let dim = 0; dim < dimension; dim += 1) score += query[dim] * values[offset + dim];
    if (top.length && score <= top[top.length - 1].score && top.length >= topK) continue;
    let insertAt = top.length;
    while (insertAt > 0 && score > top[insertAt - 1].score) insertAt -= 1;
    top.splice(insertAt, 0, { entry: entries[entryIndex], score });
    if (top.length > topK) top.length = topK;
  }
  return top;
}

async function makeCrops(rawImage, boxes, count) {
  const defaultBox = { x: 20, y: 20, w: 55, h: 45 };
  const sourceBoxes = boxes.length ? boxes : [defaultBox];
  const crops = [];
  for (let index = 0; index < count; index += 1) {
    const box = sourceBoxes[index % sourceBoxes.length];
    crops.push(await rawImage.crop(pixelBoxFromPercent(box, rawImage.width, rawImage.height, 4)));
  }
  return crops;
}

async function benchmarkBatch(extractor, crops, index, batchSize, repeats) {
  const rows = [];
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    const inputs = crops.slice(0, batchSize);
    const embedStartedAt = performance.now();
    const output = await extractor(inputs);
    const extractorMs = elapsedMs(embedStartedAt);
    const postStartedAt = performance.now();
    const vectors = poolFeatureBatchOutput(output, inputs.length).map(normalizeVector);
    const postprocessMs = elapsedMs(postStartedAt);
    const searchStartedAt = performance.now();
    const top = vectors.map((vector) => rankTopK(vector, index.entries, index.vectors, index.manifest.dimension, 5));
    const searchMs = elapsedMs(searchStartedAt);
    rows.push({
      repeat: repeat + 1,
      batchSize,
      extractorMs,
      postprocessMs,
      searchMs,
      totalMs: round(extractorMs + postprocessMs + searchMs),
      perItemMs: round((extractorMs + postprocessMs + searchMs) / Math.max(1, batchSize)),
      firstTop1: top[0]?.[0] ? {
        id: top[0][0].entry.id,
        name: top[0][0].entry.name,
        score: round(top[0][0].score, 4),
      } : null,
    });
  }
  return rows;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const image = args.image || "/Users/guzeyu/Downloads/客厅.PNG";
  const output = args.output || "data/generated/siglip-runtime-benchmark.json";
  const outputDir = path.dirname(output);
  const decodedImage = ensureDecodedImage(image, outputDir);
  const batchSizes = String(args.batchSizes || "1,2,4,8,12,16").split(",").map(Number).filter((value) => value > 0);
  const repeats = Math.max(1, Number(args.repeats || 3));
  const maxBatch = Math.max(...batchSizes);
  const boxes = args.boxes ? JSON.parse(args.boxes) : [];

  const index = await loadPackage(args.package || DEFAULT_PACKAGE);
  const rawImage = await RawImage.read(decodedImage);
  const crops = await makeCrops(rawImage, boxes, maxBatch);

  const modelStartedAt = performance.now();
  const extractor = await pipeline("image-feature-extraction", args.model || index.manifest.embeddingModel || DEFAULT_MODEL, { dtype: "q8" });
  const modelLoadMs = elapsedMs(modelStartedAt);

  const batches = [];
  for (const batchSize of batchSizes) {
    batches.push(...await benchmarkBatch(extractor, crops, index, batchSize, repeats));
  }
  const payload = {
    kind: "siglip-runtime-benchmark",
    generatedAt: new Date().toISOString(),
    image,
    decodedImage: path.relative(ROOT, decodedImage),
    model: args.model || index.manifest.embeddingModel || DEFAULT_MODEL,
    packageVersion: index.manifest.version,
    entries: index.entries.length,
    dimension: index.manifest.dimension,
    timings: {
      indexLoadMs: index.indexLoadMs,
      modelLoadMs,
    },
    batches,
  };
  const resolved = resolveRoot(output);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(payload, null, 2)}\n`);
  console.table(batches.map(({ batchSize, repeat, extractorMs, postprocessMs, searchMs, totalMs, perItemMs }) => ({
    batchSize,
    repeat,
    extractorMs,
    postprocessMs,
    searchMs,
    totalMs,
    perItemMs,
  })));
  console.log(`wrote ${path.relative(ROOT, resolved)}`);
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
