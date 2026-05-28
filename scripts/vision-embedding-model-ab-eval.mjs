#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env, pipeline, RawImage } from "@huggingface/transformers";
import { visionConfig } from "../src/config/app-config.js";

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

async function writeText(filePath, text) {
  const resolved = resolveRoot(filePath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, text, "utf8");
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

function round(value, digits = 4) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function normalizeVector(values) {
  const vector = Array.from(values || [], Number);
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
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

function dot(left, right) {
  let score = 0;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) score += left[index] * right[index];
  return score;
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

async function embedCrop(extractor, sample) {
  const image = await RawImage.read(resolveRoot(sample.imagePath));
  const crop = await image.crop(pixelBoxFromPercent(sample.box || sample.region, image.width, image.height, 4));
  const startedAt = performance.now();
  const output = await extractor(crop);
  return {
    embedding: normalizeVector(poolFeature(output)),
    embeddingMs: round(performance.now() - startedAt, 3),
  };
}

function getClusterCategoryIds() {
  return new Set((visionConfig.catalogClusterThresholds || []).flatMap((cluster) => cluster.categoryIds || []));
}

function samplesFromCatalogDataset(dataset) {
  return (dataset.samples || []).map((sample) => ({
    id: sample.id,
    imagePath: sample.imagePath,
    box: sample.box,
    categoryId: sample.categoryId,
    displayName: sample.displayName,
    source: "catalog-dataset",
  }));
}

function samplesFromModelEvalReport(report) {
  const samples = [];
  for (const image of report.images || []) {
    for (const row of image.rows || []) {
      const truth = row.truth || {};
      if (!truth.box || !truth.categoryId) continue;
      samples.push({
        id: truth.id || image.imageId,
        imagePath: image.imagePath,
        box: truth.box,
        categoryId: truth.categoryId,
        displayName: truth.name,
        source: "model-eval-report",
      });
    }
  }
  return samples;
}

function normalizeIndexEntry(entry) {
  const imagePath = entry.normalizedImagePath || entry.sourceImagePath || entry.image?.normalizedPath || entry.image?.path;
  const box = entry.normalizedImagePath ? (entry.crop?.box || entry.box || entry.region) : (entry.box || entry.region || entry.crop?.box);
  return {
    id: entry.id,
    imagePath,
    box,
    categoryId: entry.categoryId,
    displayName: entry.displayName || entry.name || entry.categoryId,
    sourceTitle: entry.sourceTitle || entry.image?.sourceTitle || "",
  };
}

function aggregateByCategory(rankedEntries) {
  const byCategory = new Map();
  for (const entry of rankedEntries) {
    const current = byCategory.get(entry.categoryId) || {
      categoryId: entry.categoryId,
      displayName: entry.displayName,
      scores: [],
      bestScore: -Infinity,
      bestEntryId: "",
    };
    current.scores.push(entry.score);
    if (entry.score > current.bestScore) {
      current.bestScore = entry.score;
      current.bestEntryId = entry.id;
    }
    byCategory.set(entry.categoryId, current);
  }
  return [...byCategory.values()].map((item) => {
    const topScores = [...item.scores].sort((a, b) => b - a).slice(0, 3);
    const averageScore = topScores.reduce((sum, score) => sum + score, 0) / Math.max(1, topScores.length);
    return {
      ...item,
      score: (item.bestScore * 0.8) + (averageScore * 0.2) + Math.min(item.scores.length, 3) * 0.002,
    };
  }).sort((a, b) => b.score - a.score);
}

function evaluateSample(sample, indexEmbeddings) {
  const rankedEntries = indexEmbeddings
    .map((entry) => ({ ...entry, score: dot(sample.embedding, entry.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
  const candidates = aggregateByCategory(rankedEntries).slice(0, 5);
  const best = candidates[0] || null;
  const runnerUp = candidates.find((candidate) => candidate.categoryId !== best?.categoryId) || null;
  return {
    id: sample.id,
    expectedCategoryId: sample.categoryId,
    expectedName: sample.displayName,
    top1CategoryId: best?.categoryId || "",
    top1Name: best?.displayName || "",
    top1Score: round(best?.score || 0, 4),
    margin: round(best ? best.score - (runnerUp?.score || 0) : 0, 4),
    top3CategoryIds: candidates.slice(0, 3).map((candidate) => candidate.categoryId),
  };
}

function summarize(results) {
  const total = Math.max(1, results.length);
  return {
    sampleCount: results.length,
    top1Accuracy: round(results.filter((result) => result.top1CategoryId === result.expectedCategoryId).length / total),
    top3Accuracy: round(results.filter((result) => result.top3CategoryIds.includes(result.expectedCategoryId)).length / total),
    meanTop1Score: round(results.reduce((sum, result) => sum + result.top1Score, 0) / total),
    meanMargin: round(results.reduce((sum, result) => sum + result.margin, 0) / total),
  };
}

function renderMarkdown(report) {
  return [
    "# Embedding 模型 A/B 评测",
    "",
    `生成时间：${report.generatedAt}`,
    "",
    `索引候选条目：${report.indexEntryCount}`,
    `Query 样本：${report.sampleCount}`,
    "",
    "| 模型 | 维度 | Top1 | Top3 | 平均 Top1 score | 平均 margin | 查询耗时均值(ms) | 索引耗时均值(ms) |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.models.map((item) => `| ${item.modelId} | ${item.dimension} | ${item.summary.top1Accuracy} | ${item.summary.top3Accuracy} | ${item.summary.meanTop1Score} | ${item.summary.meanMargin} | ${item.timings.queryEmbeddingMeanMs} | ${item.timings.indexEmbeddingMeanMs} |`),
    "",
    "## 说明",
    "",
    "- SigLIP 输出 dense patch features，本脚本对 patch 维做 mean pooling 后再归一化。",
    "- 为避免首次 A/B 过慢，本评测只使用已有评测样本相关类目和高混淆 cluster 的索引条目，不是全量 3075 条索引。",
    "- 图片文件只从本地缓存读取，不进入 Git。",
    "",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const index = await readJson(args.index || "data/vision-index.household-cn.grounding-dino-clip.json");
  const catalogDataset = await readJson(args.catalogDataset || "data/vision-catalog-naming-eval.electronics.json");
  const modelEvalReport = await readJson(args.modelEval || "data/generated/vision-model-eval-report.gt-crop-clip-naming-cn-1000.json");
  const rawSamples = [...samplesFromCatalogDataset(catalogDataset), ...samplesFromModelEvalReport(modelEvalReport)];
  const samples = [];
  for (const sample of rawSamples) {
    if (sample.imagePath && sample.box && await exists(sample.imagePath)) samples.push(sample);
  }
  const categoryIds = new Set([...samples.map((sample) => sample.categoryId), ...getClusterCategoryIds()]);
  const indexEntries = [];
  for (const entry of index.entries || []) {
    if (!categoryIds.has(entry.categoryId)) continue;
    const normalized = normalizeIndexEntry(entry);
    if (normalized.imagePath && normalized.box && await exists(normalized.imagePath)) indexEntries.push(normalized);
  }
  const models = String(args.models || "Xenova/clip-vit-base-patch32,Xenova/siglip-base-patch16-224")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const modelReports = [];
  for (const modelId of models) {
    console.log(`loading ${modelId}`);
    const extractor = await pipeline("image-feature-extraction", modelId, { dtype: "q8" });
    const indexEmbeddings = [];
    let indexMs = 0;
    for (const [entryIndex, entry] of indexEntries.entries()) {
      const embedded = await embedCrop(extractor, entry);
      indexMs += embedded.embeddingMs;
      indexEmbeddings.push({ ...entry, embedding: embedded.embedding });
      if ((entryIndex + 1) % 25 === 0) console.log(`${modelId} index ${entryIndex + 1}/${indexEntries.length}`);
    }
    const results = [];
    let queryMs = 0;
    for (const [sampleIndex, sample] of samples.entries()) {
      const embedded = await embedCrop(extractor, sample);
      queryMs += embedded.embeddingMs;
      results.push(evaluateSample({ ...sample, embedding: embedded.embedding }, indexEmbeddings));
      if ((sampleIndex + 1) % 10 === 0) console.log(`${modelId} query ${sampleIndex + 1}/${samples.length}`);
    }
    modelReports.push({
      modelId,
      dimension: indexEmbeddings[0]?.embedding.length || 0,
      summary: summarize(results),
      timings: {
        indexEmbeddingMeanMs: round(indexMs / Math.max(1, indexEntries.length), 3),
        queryEmbeddingMeanMs: round(queryMs / Math.max(1, samples.length), 3),
      },
      results,
    });
  }
  const report = {
    kind: "vision-embedding-model-ab-eval",
    version: "20260528-embedding-model-ab-eval",
    generatedAt: new Date().toISOString(),
    sampleCount: samples.length,
    indexEntryCount: indexEntries.length,
    categoryCount: categoryIds.size,
    models: modelReports,
  };
  await writeText(args.outputJson || "data/generated/vision-embedding-model-ab-eval.json", `${JSON.stringify(report, null, 2)}\n`);
  await writeText(args.outputMd || "data/generated/vision-embedding-model-ab-eval.md", renderMarkdown(report));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
