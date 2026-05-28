#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env, pipeline, RawImage } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

async function exists(filePath) {
  try {
    await access(resolveRoot(filePath));
    return true;
  } catch {
    return false;
  }
}

async function firstExistingPath(candidates) {
  for (const candidate of candidates) {
    if (candidate && await exists(candidate)) return candidate;
  }
  return "";
}

function round(value, digits = 6) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function normalizeVector(values) {
  const vector = Array.from(values || [], Number);
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => round(value / norm, 8));
}

function poolFeature(output) {
  const data = Array.from(output?.data || [], Number);
  const dims = Array.isArray(output?.dims) ? output.dims : [];
  if (dims.length === 3 && dims[1] > 1 && dims[2] > 0 && data.length === dims[1] * dims[2]) {
    const pooled = Array(dims[2]).fill(0);
    for (let token = 0; token < dims[1]; token += 1) {
      for (let dim = 0; dim < dims[2]; dim += 1) pooled[dim] += data[(token * dims[2]) + dim];
    }
    return pooled.map((value) => value / dims[1]);
  }
  return data;
}

function pixelBoxFromPercent(box, width, height, paddingPct = 0) {
  const x = Number(box?.x) || 0;
  const y = Number(box?.y) || 0;
  const w = Number(box?.w) || 100;
  const h = Number(box?.h) || 100;
  const padX = (w * paddingPct) / 100;
  const padY = (h * paddingPct) / 100;
  const x1 = Math.max(0, Math.round(((x - padX) / 100) * width));
  const y1 = Math.max(0, Math.round(((y - padY) / 100) * height));
  const x2 = Math.min(width, Math.round(((x + w + padX) / 100) * width));
  const y2 = Math.min(height, Math.round(((y + h + padY) / 100) * height));
  return [x1, y1, Math.max(x1 + 1, x2), Math.max(y1 + 1, y2)];
}

function imagePathCandidatesForEntry(entry) {
  return [
    entry.normalizedImagePath,
    entry.image?.normalizedPath,
    entry.crop?.imageVariant?.path,
    entry.sourceImagePath,
    entry.image?.path,
  ].filter(Boolean);
}

function boxForEntry(entry) {
  return entry.crop?.box || entry.box || entry.region;
}

async function embedEntry(extractor, entry, imagePath, paddingPct) {
  const box = boxForEntry(entry);
  if (!imagePath || !box) throw new Error(`entry ${entry.id || entry.categoryId} has no image path or box`);
  const image = await RawImage.read(resolveRoot(imagePath));
  const crop = await image.crop(pixelBoxFromPercent(box, image.width, image.height, paddingPct));
  const startedAt = performance.now();
  const output = await extractor(crop);
  return {
    embedding: normalizeVector(poolFeature(output)),
    embeddingMs: round(performance.now() - startedAt, 3),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.input || "data/vision-index.household-cn.grounding-dino-clip.json";
  const modelId = args.model || "Xenova/siglip-base-patch16-224";
  const outputPath = args.output || "data/vision-index.household-cn.grounding-dino-siglip.json";
  const index = await readJson(inputPath);
  const extractor = await pipeline("image-feature-extraction", modelId, { dtype: "q8" });
  const entries = [];
  const failures = [];
  let totalEmbeddingMs = 0;
  for (const [entryIndex, entry] of (index.entries || []).entries()) {
    const imagePath = await firstExistingPath(imagePathCandidatesForEntry(entry));
    if (!imagePath) {
      failures.push({
        id: entry.id,
        categoryId: entry.categoryId,
        reason: "missing-image",
        candidates: imagePathCandidatesForEntry(entry),
      });
      continue;
    }
    try {
      const embedded = await embedEntry(extractor, entry, imagePath, Number(args.paddingPct ?? index.embedding?.cropPaddingPct ?? 4));
      totalEmbeddingMs += embedded.embeddingMs;
      entries.push({
        ...entry,
        embedding: embedded.embedding,
        embeddingModel: modelId,
        embeddingMs: embedded.embeddingMs,
      });
    } catch (error) {
      failures.push({ id: entry.id, categoryId: entry.categoryId, reason: error?.message || String(error), imagePath });
    }
    if ((entryIndex + 1) % 100 === 0) console.log(`embedded ${entryIndex + 1}/${index.entries.length}`);
  }
  const dimension = entries[0]?.embedding?.length || 0;
  const output = {
    ...index,
    version: args.version || `20260528-household-cn-grounding-dino-siglip`,
    description: `${index.description || "Household vision index"} Re-embedded with ${modelId}.`,
    embeddingModel: modelId,
    embedding: {
      ...(index.embedding || {}),
      modelId,
      dimension,
      pooling: modelId.toLowerCase().includes("siglip") ? "mean-pool-patch-features" : (index.embedding?.pooling || "default"),
    },
    dimension,
    threshold: Number(args.acceptScore ?? 0.2),
    marginThreshold: Number(args.acceptMargin ?? 0.04),
    thresholds: {
      ...(index.thresholds || {}),
      acceptScore: Number(args.acceptScore ?? 0.2),
      acceptMargin: Number(args.acceptMargin ?? 0.04),
    },
    sourceIndexVersion: index.version,
    buildTimestamp: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entryCount: entries.length,
    failureCount: failures.length,
    embeddingTiming: {
      meanMs: round(totalEmbeddingMs / Math.max(1, entries.length), 3),
      totalMs: round(totalEmbeddingMs, 3),
    },
    entries,
    failures,
  };
  await writeJson(outputPath, output);
  await writeJson(args.report || "data/generated/vision-reembed-index-report.siglip.json", {
    kind: "vision-reembed-index-report",
    modelId,
    inputPath,
    outputPath,
    sourceIndexVersion: index.version,
    outputVersion: output.version,
    entryCount: entries.length,
    failureCount: failures.length,
    dimension,
    embeddingTiming: output.embeddingTiming,
    failures,
  });
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
