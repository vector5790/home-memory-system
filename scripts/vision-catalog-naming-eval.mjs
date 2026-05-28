#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env, pipeline, RawImage } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLIP_MODEL = "Xenova/clip-vit-base-patch32";

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

async function writeJson(filePath, payload) {
  await writeText(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function relative(filePath) {
  if (!filePath) return "";
  const resolved = resolveRoot(filePath);
  return path.relative(ROOT, resolved);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function dot(left, right) {
  let score = 0;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) score += left[index] * right[index];
  return score;
}

function pixelBoxFromPercent(box, width, height, paddingPct = 0) {
  const x = Number(box.x) || 0;
  const y = Number(box.y) || 0;
  const w = Number(box.w) || 100;
  const h = Number(box.h) || 100;
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
  const crop = await image.crop(pixelBoxFromPercent(sample.box, image.width, image.height, 4));
  const start = performance.now();
  const output = await extractor(crop);
  return {
    embedding: normalizeVector(output?.data || []),
    embeddingMs: round(performance.now() - start, 3),
  };
}

function normalizeEntry(entry, indexVersion) {
  if (!Array.isArray(entry.embedding) || !entry.embedding.length) return null;
  return {
    ...entry,
    displayName: entry.displayName || entry.name || entry.categoryId,
    score: 0,
    indexVersion,
  };
}

function aggregate(rankedEntries) {
  const byCategory = new Map();
  for (const entry of rankedEntries) {
    const current = byCategory.get(entry.categoryId) || {
      categoryId: entry.categoryId,
      displayName: entry.displayName,
      scores: [],
      bestScore: -Infinity,
      matchedSampleIds: [],
      representativeImages: [],
    };
    current.scores.push(entry.score);
    current.bestScore = Math.max(current.bestScore, entry.score);
    for (const sampleId of entry.matchedSampleIds || [entry.sampleId]) {
      if (sampleId && !current.matchedSampleIds.includes(sampleId)) current.matchedSampleIds.push(sampleId);
    }
    current.representativeImages.push({
      id: entry.id,
      sampleId: entry.sampleId,
      score: round(entry.score, 4),
      sourceImagePath: entry.sourceImagePath,
      normalizedImagePath: entry.normalizedImagePath,
      sourceTitle: entry.sourceTitle,
    });
    byCategory.set(entry.categoryId, current);
  }
  return [...byCategory.values()].map((category) => {
    const topScores = [...category.scores].sort((a, b) => b - a).slice(0, 3);
    const averageScore = topScores.reduce((sum, score) => sum + score, 0) / Math.max(1, topScores.length);
    const hitCount = category.scores.length;
    return {
      ...category,
      averageScore,
      hitCount,
      score: (category.bestScore * 0.8) + (averageScore * 0.2) + Math.min(hitCount, 3) * 0.002,
      representativeImages: category.representativeImages.sort((a, b) => b.score - a.score).slice(0, 3),
    };
  }).sort((a, b) => b.score - a.score);
}

function evaluateSample(sample, entries, options) {
  const rankedEntries = entries
    .filter((entry) => entry.sampleId !== sample.excludeSampleId)
    .map((entry) => ({ ...entry, score: dot(sample.embedding, entry.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.entryTopK);
  const candidates = aggregate(rankedEntries).slice(0, 5);
  const best = candidates[0] || null;
  const runnerUp = candidates.find((candidate) => candidate.categoryId !== best?.categoryId) || null;
  const margin = best ? best.score - (runnerUp?.score || 0) : 0;
  const rejectionReason = !best
    ? "no-candidate"
    : best.score < options.threshold
      ? "below-threshold"
      : margin < options.margin
        ? "low-margin"
        : "";
  return {
    ...sample,
    predictedCategoryId: rejectionReason ? "" : best.categoryId,
    predictedName: rejectionReason ? "" : best.displayName,
    rejected: Boolean(rejectionReason),
    rejectionReason,
    top1CategoryId: best?.categoryId || "",
    top1Name: best?.displayName || "",
    top1Score: round(best?.score || 0, 4),
    margin: round(margin, 4),
    top3CategoryIds: candidates.slice(0, 3).map((candidate) => candidate.categoryId),
    categoryCandidates: candidates.map((candidate) => ({
      categoryId: candidate.categoryId,
      displayName: candidate.displayName,
      score: round(candidate.score, 4),
      bestScore: round(candidate.bestScore, 4),
      averageScore: round(candidate.averageScore, 4),
      hitCount: candidate.hitCount,
      matchedSampleIds: candidate.matchedSampleIds,
      representativeImages: candidate.representativeImages,
    })),
  };
}

function summarize(results) {
  const total = results.length || 1;
  const accepted = results.filter((result) => !result.rejected);
  const top1 = results.filter((result) => result.top1CategoryId === result.categoryId).length;
  const top3 = results.filter((result) => result.top3CategoryIds.includes(result.categoryId)).length;
  const acceptedCorrect = accepted.filter((result) => result.predictedCategoryId === result.categoryId).length;
  const confusions = new Map();
  for (const result of results) {
    const key = `${result.categoryId}=>${result.rejected ? "REJECTED" : result.predictedCategoryId || result.top1CategoryId}`;
    confusions.set(key, (confusions.get(key) || 0) + 1);
  }
  return {
    sampleCount: results.length,
    top1Accuracy: round(top1 / total, 4),
    top3Accuracy: round(top3 / total, 4),
    acceptedAccuracy: round(acceptedCorrect / Math.max(1, accepted.length), 4),
    rejectionRate: round(results.filter((result) => result.rejected).length / total, 4),
    lowConfidenceRate: round(results.filter((result) => result.rejectionReason === "low-margin" || result.rejectionReason === "below-threshold").length / total, 4),
    confusions: [...confusions.entries()].map(([key, count]) => {
      const [expectedCategoryId, predictedCategoryId] = key.split("=>");
      return { expectedCategoryId, predictedCategoryId, count };
    }).sort((a, b) => b.count - a.count),
  };
}

function renderHtml(report) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #1f2933; background: #f7f5ef; }
    h1 { margin-bottom: 8px; }
    .summary { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 24px; }
    .summary span { background: white; border: 1px solid #ddd6c8; padding: 8px 10px; border-radius: 8px; }
    .case { background: white; border: 1px solid #ddd6c8; border-radius: 8px; padding: 14px; margin: 14px 0; }
    .case-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
    .ok { color: #16794c; } .bad { color: #b42318; } .muted { color: #667085; }
    .media { display: grid; grid-template-columns: minmax(220px, 1fr) 2fr; gap: 14px; margin-top: 10px; }
    img.query { width: 100%; max-height: 260px; object-fit: contain; background: #eee; }
    .matches { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap: 10px; }
    .match { border: 1px solid #e5dfd1; border-radius: 6px; padding: 8px; }
    .match img { width: 100%; height: 130px; object-fit: contain; background: #f2f1ee; }
    .small { font-size: 12px; color: #667085; }
    @media (max-width: 760px) { .media { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <p class="muted">${escapeHtml(report.description)}</p>
  <div class="summary">
    <span>样本 ${report.summary.sampleCount}</span>
    <span>Top1 ${Math.round(report.summary.top1Accuracy * 100)}%</span>
    <span>Top3 ${Math.round(report.summary.top3Accuracy * 100)}%</span>
    <span>接受后准确率 ${Math.round(report.summary.acceptedAccuracy * 100)}%</span>
    <span>拒识率 ${Math.round(report.summary.rejectionRate * 100)}%</span>
  </div>
  ${report.results.map((result) => {
    const correct = result.top1CategoryId === result.categoryId;
    return `<section class="case">
      <div class="case-head">
        <strong>${escapeHtml(result.id)} · 期望 ${escapeHtml(result.displayName || result.categoryId)}</strong>
        <span class="${correct ? "ok" : "bad"}">${correct ? "Top1 命中" : result.rejected ? `拒识 ${escapeHtml(result.rejectionReason)}` : `Top1 ${escapeHtml(result.top1Name)}`}</span>
      </div>
      <div class="small">Top1: ${escapeHtml(result.top1Name)} (${result.top1Score}) · margin ${result.margin} · embedding ${result.embeddingMs}ms</div>
      <div class="media">
        <img class="query" src="../../${escapeHtml(relative(result.imagePath))}" />
        <div class="matches">
          ${result.categoryCandidates.slice(0, 3).map((candidate) => {
            const image = candidate.representativeImages[0] || {};
            return `<div class="match">
              <img src="../../${escapeHtml(relative(image.normalizedImagePath || image.sourceImagePath))}" />
              <strong>${escapeHtml(candidate.displayName)}</strong>
              <div class="small">${escapeHtml(candidate.categoryId)} · ${candidate.score}</div>
            </div>`;
          }).join("")}
        </div>
      </div>
    </section>`;
  }).join("")}
</body>
</html>
`;
}

function renderMarkdown(report) {
  const lines = [
    `# ${report.title}`,
    "",
    report.description,
    "",
    `- 样本数: ${report.summary.sampleCount}`,
    `- Top1: ${report.summary.top1Accuracy}`,
    `- Top3: ${report.summary.top3Accuracy}`,
    `- 接受后准确率: ${report.summary.acceptedAccuracy}`,
    `- 拒识率: ${report.summary.rejectionRate}`,
    "",
    "## 混淆",
    "",
    ...report.summary.confusions.map((item) => `- ${item.expectedCategoryId} -> ${item.predictedCategoryId}: ${item.count}`),
    "",
    "## 样例",
    "",
    ...report.results.map((result) => `- ${result.id}: expected=${result.categoryId}, top1=${result.top1CategoryId}, rejected=${result.rejected}, top3=${result.top3CategoryIds.join(",")}`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataset = await readJson(args.dataset);
  const index = await readJson(args.index || "data/vision-index.household-cn.grounding-dino-clip.json");
  const entries = (index.entries || []).map((entry) => normalizeEntry(entry, index.version)).filter(Boolean);
  const extractor = await pipeline("image-feature-extraction", CLIP_MODEL, { dtype: "q8" });
  const options = {
    threshold: Number(args.threshold ?? index.thresholds?.acceptScore ?? index.threshold ?? 0.26),
    margin: Number(args.margin ?? index.thresholds?.acceptMargin ?? index.marginThreshold ?? 0.03),
    entryTopK: Number(args.entryTopK || index.topK || 15),
  };
  const results = [];
  for (const sample of dataset.samples || []) {
    const embedded = await embedCrop(extractor, sample);
    results.push(evaluateSample({ ...sample, ...embedded }, entries, options));
    console.log(`evaluated ${results.length}/${dataset.samples.length} ${sample.id}`);
  }
  const report = {
    kind: "vision-catalog-naming-eval-report",
    version: args.version || "20260528-electronics-naming-eval",
    title: args.title || "电子影音命名检索评测",
    description: dataset.description || "",
    datasetVersion: dataset.version,
    indexVersion: index.version,
    options,
    summary: summarize(results),
    results,
  };
  await writeJson(args.outputJson, report);
  await writeText(args.outputHtml, renderHtml(report));
  await writeText(args.outputMd, renderMarkdown(report));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
