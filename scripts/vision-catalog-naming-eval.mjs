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

function quantiles(values) {
  const sorted = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return { count: 0, min: 0, p50: 0, p90: 0, p95: 0, max: 0, mean: 0 };
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * q)))];
  return {
    count: sorted.length,
    min: round(sorted[0], 4),
    p50: round(at(0.5), 4),
    p90: round(at(0.9), 4),
    p95: round(at(0.95), 4),
    max: round(sorted[sorted.length - 1], 4),
    mean: round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length, 4),
  };
}

function categoryClusterId(categoryId = "") {
  const text = String(categoryId || "");
  const [first, second] = text.split("-");
  if (!second) return first || "unknown";
  const highConfusionPrefixes = new Set([
    "audio",
    "speaker",
    "projector",
    "television",
    "tv",
    "storage",
    "shoe",
    "cable",
    "charger",
    "bottle",
    "cup",
    "plate",
    "bowl",
    "cleaner",
    "toy",
  ]);
  if (highConfusionPrefixes.has(first)) return first;
  return `${first}-${second}`;
}

function boxQuality(sample) {
  const value = sample.boxQuality || sample.subjectBoxQuality || sample.boxStatus || "";
  if (["invalid", "ambiguous", "bad", "not-nameable"].includes(String(value))) return "invalid";
  return "valid";
}

function attributeError(result, options) {
  if (boxQuality(result) === "invalid") return "subject-box-error";
  if (result.rejected && result.rejectionReason === "below-threshold") return "threshold-policy-error";
  if (result.rejected && result.rejectionReason === "low-margin") return "threshold-policy-error";
  if (result.top1CategoryId === result.categoryId) return "correct";
  const top3Rank = result.top3CategoryIds.indexOf(result.categoryId);
  if (top3Rank >= 0) return "candidate-display-gap";
  const topKRank = (result.categoryCandidates || []).findIndex((candidate) => candidate.categoryId === result.categoryId);
  if (topKRank >= 0) return "candidate-display-gap";
  const expectedCluster = categoryClusterId(result.categoryId);
  const predictedCluster = categoryClusterId(result.top1CategoryId);
  if (expectedCluster === predictedCluster && expectedCluster !== "unknown") return "fine-grained-visual-confusion";
  if (result.top1Score >= options.threshold && result.margin >= options.margin) return "category-granularity-gap";
  if (!result.top3CategoryIds.includes(result.categoryId)) return "index-coverage-gap";
  return "unknown";
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
  const candidateCorrectable = results.filter((result) => (
    result.top1CategoryId !== result.categoryId && result.top3CategoryIds.includes(result.categoryId)
  )).length;
  const falseAccept = accepted.filter((result) => result.predictedCategoryId !== result.categoryId).length;
  const unresolved = results.filter((result) => result.rejected || !result.predictedCategoryId).length;
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
    candidateCorrectableRate: round(candidateCorrectable / total, 4),
    falseAcceptRate: round(falseAccept / Math.max(1, accepted.length), 4),
    unresolvedRate: round(unresolved / total, 4),
    acceptedAccuracy: round(acceptedCorrect / Math.max(1, accepted.length), 4),
    rejectionRate: round(results.filter((result) => result.rejected).length / total, 4),
    lowConfidenceRate: round(results.filter((result) => result.rejectionReason === "low-margin" || result.rejectionReason === "below-threshold").length / total, 4),
    scoreDistribution: {
      correctTop1: quantiles(results.filter((result) => result.top1CategoryId === result.categoryId).map((result) => result.top1Score)),
      incorrectTop1: quantiles(results.filter((result) => result.top1CategoryId !== result.categoryId).map((result) => result.top1Score)),
      accepted: quantiles(accepted.map((result) => result.top1Score)),
      rejected: quantiles(results.filter((result) => result.rejected).map((result) => result.top1Score)),
    },
    marginDistribution: {
      correctTop1: quantiles(results.filter((result) => result.top1CategoryId === result.categoryId).map((result) => result.margin)),
      incorrectTop1: quantiles(results.filter((result) => result.top1CategoryId !== result.categoryId).map((result) => result.margin)),
    },
    confusions: [...confusions.entries()].map(([key, count]) => {
      const [expectedCategoryId, predictedCategoryId] = key.split("=>");
      return { expectedCategoryId, predictedCategoryId, count };
    }).sort((a, b) => b.count - a.count),
  };
}

function summarizeAttribution(results) {
  const counts = new Map();
  for (const result of results) {
    const key = result.errorAttribution || "unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}

function summarizeClusters(results, options) {
  const clusters = new Map();
  for (const result of results) {
    const id = categoryClusterId(result.categoryId);
    const cluster = clusters.get(id) || {
      id,
      sampleCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      scoresCorrect: [],
      scoresIncorrect: [],
      marginsCorrect: [],
      marginsIncorrect: [],
      confusions: new Map(),
    };
    const correct = result.top1CategoryId === result.categoryId;
    cluster.sampleCount += 1;
    if (correct) {
      cluster.correctCount += 1;
      cluster.scoresCorrect.push(result.top1Score);
      cluster.marginsCorrect.push(result.margin);
    } else {
      cluster.incorrectCount += 1;
      cluster.scoresIncorrect.push(result.top1Score);
      cluster.marginsIncorrect.push(result.margin);
      const key = `${result.categoryId}=>${result.top1CategoryId || "REJECTED"}`;
      cluster.confusions.set(key, (cluster.confusions.get(key) || 0) + 1);
    }
    clusters.set(id, cluster);
  }
  return [...clusters.values()].map((cluster) => {
    const enough = cluster.correctCount >= 3 && cluster.incorrectCount >= 3;
    const scoreCorrect = quantiles(cluster.scoresCorrect);
    const scoreIncorrect = quantiles(cluster.scoresIncorrect);
    const marginCorrect = quantiles(cluster.marginsCorrect);
    const marginIncorrect = quantiles(cluster.marginsIncorrect);
    const recommendedScore = enough ? round(Math.max(options.threshold, scoreIncorrect.p95), 4) : null;
    const recommendedMargin = enough ? round(Math.max(options.margin, marginIncorrect.p95), 4) : null;
    return {
      id: cluster.id,
      sampleCount: cluster.sampleCount,
      correctCount: cluster.correctCount,
      incorrectCount: cluster.incorrectCount,
      top1Accuracy: round(cluster.correctCount / Math.max(1, cluster.sampleCount), 4),
      scoreDistribution: { correct: scoreCorrect, incorrect: scoreIncorrect },
      marginDistribution: { correct: marginCorrect, incorrect: marginIncorrect },
      thresholdRecommendation: enough
        ? {
          score: recommendedScore,
          margin: recommendedMargin,
          note: "样本足够，建议先作为离线候选阈值验证，暂不直接上线。",
        }
        : {
          score: null,
          margin: null,
          note: "样本不足，只记录数据缺口，不推荐生产阈值。",
        },
      confusions: [...cluster.confusions.entries()].map(([key, count]) => {
        const [expectedCategoryId, predictedCategoryId] = key.split("=>");
        return { expectedCategoryId, predictedCategoryId, count };
      }).sort((a, b) => b.count - a.count).slice(0, 10),
    };
  }).sort((a, b) => b.sampleCount - a.sampleCount);
}

function generateIndexRecommendations(results) {
  const byCategory = new Map();
  for (const result of results) {
    if (result.top1CategoryId === result.categoryId) continue;
    const category = byCategory.get(result.categoryId) || {
      categoryId: result.categoryId,
      displayName: result.displayName || result.categoryId,
      sampleCount: 0,
      failures: 0,
      attributions: new Map(),
      missingTopK: 0,
      topConfusions: new Map(),
      representativeQueryImages: [],
    };
    category.sampleCount += 1;
    category.failures += 1;
    category.attributions.set(result.errorAttribution, (category.attributions.get(result.errorAttribution) || 0) + 1);
    if (!(result.categoryCandidates || []).some((candidate) => candidate.categoryId === result.categoryId)) category.missingTopK += 1;
    const confusion = result.top1CategoryId || "REJECTED";
    category.topConfusions.set(confusion, (category.topConfusions.get(confusion) || 0) + 1);
    if (category.representativeQueryImages.length < 3) category.representativeQueryImages.push(result.imagePath);
    byCategory.set(result.categoryId, category);
  }
  return [...byCategory.values()].map((category) => {
    const dominant = [...category.attributions.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";
    const action = dominant === "category-granularity-gap"
      ? "优先拆细类目，补充别名、品牌/型号/形态字段，再补代表图。"
      : dominant === "fine-grained-visual-confusion"
        ? "补充同类细粒度正负样本，并评估图文 reranker 或类目簇阈值。"
        : dominant === "candidate-display-gap"
          ? "Top3 可纠正，优先优化候选展示和用户反馈，不必立即扩大索引。"
          : "优先补真实代表索引图，覆盖不同品牌、材质、视角、使用场景。";
    return {
      categoryId: category.categoryId,
      displayName: category.displayName,
      priorityScore: category.failures + category.missingTopK * 2,
      failures: category.failures,
      missingTopK: category.missingTopK,
      dominantAttribution: dominant,
      action,
      attributions: Object.fromEntries(category.attributions),
      topConfusions: [...category.topConfusions.entries()].map(([categoryId, count]) => ({ categoryId, count })).sort((a, b) => b.count - a.count),
      representativeQueryImages: category.representativeQueryImages,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
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
    <span>Top3 可纠正 ${Math.round(report.summary.candidateCorrectableRate * 100)}%</span>
    <span>误接受 ${Math.round(report.summary.falseAcceptRate * 100)}%</span>
    <span>未命名 ${Math.round(report.summary.unresolvedRate * 100)}%</span>
    <span>接受后准确率 ${Math.round(report.summary.acceptedAccuracy * 100)}%</span>
    <span>拒识率 ${Math.round(report.summary.rejectionRate * 100)}%</span>
  </div>
  <h2>错误归因</h2>
  <ul>
    ${report.attributionSummary.map((item) => `<li>${escapeHtml(item.type)}: ${item.count}</li>`).join("")}
  </ul>
  <h2>补索引优先级</h2>
  <ol>
    ${report.indexRecommendations.slice(0, 20).map((item) => `
      <li>
        <strong>${escapeHtml(item.displayName)} (${escapeHtml(item.categoryId)})</strong>
        <div class="small">${escapeHtml(item.dominantAttribution)} · failures ${item.failures} · missingTopK ${item.missingTopK}</div>
        <div>${escapeHtml(item.action)}</div>
      </li>
    `).join("")}
  </ol>
  ${report.results.map((result) => {
    const correct = result.top1CategoryId === result.categoryId;
    return `<section class="case">
      <div class="case-head">
        <strong>${escapeHtml(result.id)} · 期望 ${escapeHtml(result.displayName || result.categoryId)}</strong>
        <span class="${correct ? "ok" : "bad"}">${correct ? "Top1 命中" : result.rejected ? `拒识 ${escapeHtml(result.rejectionReason)}` : `Top1 ${escapeHtml(result.top1Name)}`} · ${escapeHtml(result.errorAttribution)}</span>
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
    `- Top3 可纠正率: ${report.summary.candidateCorrectableRate}`,
    `- 误接受率: ${report.summary.falseAcceptRate}`,
    `- 未命名率: ${report.summary.unresolvedRate}`,
    `- 接受后准确率: ${report.summary.acceptedAccuracy}`,
    `- 拒识率: ${report.summary.rejectionRate}`,
    `- 正确 Top1 score: ${JSON.stringify(report.summary.scoreDistribution.correctTop1)}`,
    `- 错误 Top1 score: ${JSON.stringify(report.summary.scoreDistribution.incorrectTop1)}`,
    "",
    "## 错误归因",
    "",
    ...report.attributionSummary.map((item) => `- ${item.type}: ${item.count}`),
    "",
    "## Cluster 阈值建议",
    "",
    ...report.clusterSummaries.map((item) => `- ${item.id}: samples=${item.sampleCount}, top1=${item.top1Accuracy}, score=${item.thresholdRecommendation.score ?? "n/a"}, margin=${item.thresholdRecommendation.margin ?? "n/a"} (${item.thresholdRecommendation.note})`),
    "",
    "## 补索引优先级",
    "",
    ...report.indexRecommendations.slice(0, 30).map((item) => `- ${item.displayName} (${item.categoryId}): ${item.dominantAttribution}, failures=${item.failures}, missingTopK=${item.missingTopK}. ${item.action}`),
    "",
    "## 混淆",
    "",
    ...report.summary.confusions.map((item) => `- ${item.expectedCategoryId} -> ${item.predictedCategoryId}: ${item.count}`),
    "",
    "## 样例",
    "",
    ...report.results.map((result) => `- ${result.id}: expected=${result.categoryId}, top1=${result.top1CategoryId}, rejected=${result.rejected}, attribution=${result.errorAttribution}, top3=${result.top3CategoryIds.join(",")}`),
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
    const evaluated = evaluateSample({ ...sample, ...embedded }, entries, options);
    evaluated.errorAttribution = attributeError(evaluated, options);
    evaluated.subjectBoxQuality = boxQuality(sample);
    delete evaluated.embedding;
    results.push(evaluated);
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
    attributionSummary: summarizeAttribution(results),
    clusterSummaries: summarizeClusters(results, options),
    indexRecommendations: generateIndexRecommendations(results),
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
