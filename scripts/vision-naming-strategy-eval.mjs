#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { visionConfig } from "../src/config/app-config.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function resolveRoot(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
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

function round(value, digits = 4) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim();
}

function tokenize(value) {
  const text = normalizeText(value);
  const tokens = text.split(/\s+/).filter((token) => token.length > 1);
  const chinese = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
  return [...new Set([...tokens, ...chinese])];
}

function tokenOverlapScore(query, candidate) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return 0;
  const candidateTokens = new Set(tokenize(candidate));
  const hits = queryTokens.filter((token) => candidateTokens.has(token)).length;
  return hits / queryTokens.length;
}

function getCluster(categoryId) {
  return (visionConfig.catalogClusterThresholds || []).find((cluster) => (
    Array.isArray(cluster.categoryIds) && cluster.categoryIds.includes(categoryId)
  )) || null;
}

function clusterPolicy(categoryId) {
  const cluster = getCluster(categoryId);
  return {
    clusterId: cluster?.id || "",
    clusterLabel: cluster?.label || "",
    score: Number(cluster?.acceptScore ?? visionConfig.catalogThreshold),
    margin: Number(cluster?.acceptMargin ?? visionConfig.catalogMarginThreshold),
    candidateByDefault: Boolean(cluster?.candidateByDefault),
    rerankTextScore: Number(cluster?.rerankTextScore ?? visionConfig.catalogRerankMinTextScore ?? 0),
  };
}

function distinctCandidates(matches = []) {
  const seen = new Set();
  const candidates = [];
  for (const match of matches) {
    if (!match?.categoryId || seen.has(match.categoryId)) continue;
    seen.add(match.categoryId);
    candidates.push({
      categoryId: match.categoryId,
      displayName: match.displayName || match.name || match.categoryId,
      score: Number(match.score ?? match.confidence) || 0,
      sourceTitle: match.sourceTitle || match.image?.sourceTitle || "",
      categoryPath: Array.isArray(match.categoryPath) ? match.categoryPath : [],
    });
  }
  return candidates;
}

function rowsFromModelEval(report, source) {
  const rows = [];
  for (const image of report.images || []) {
    for (const row of image.rows || []) {
      const truth = row.truth || {};
      const prediction = row.prediction || {};
      const candidates = distinctCandidates(prediction.matches || []);
      rows.push({
        source,
        id: truth.id || image.imageId,
        expectedCategoryId: truth.categoryId,
        expectedName: truth.name,
        queryText: [truth.name, truth.sourceTitle, image.sourceTitle].filter(Boolean).join(" "),
        candidates,
      });
    }
  }
  return rows;
}

function rowsFromCatalogEval(report, source) {
  return (report.results || []).map((result) => ({
    source,
    id: result.id,
    expectedCategoryId: result.categoryId,
    expectedName: result.displayName,
    queryText: [result.displayName, result.sourceTitle, result.ocrText].filter(Boolean).join(" "),
    candidates: (result.categoryCandidates || []).map((candidate) => ({
      categoryId: candidate.categoryId,
      displayName: candidate.displayName || candidate.categoryId,
      score: Number(candidate.score) || 0,
      sourceTitle: (candidate.representativeImages || []).map((image) => image.sourceTitle).join(" "),
      categoryPath: candidate.categoryPath || [],
    })),
  }));
}

function normalizeRows(report, source) {
  if (Array.isArray(report.images)) return rowsFromModelEval(report, source);
  if (Array.isArray(report.results)) return rowsFromCatalogEval(report, source);
  return [];
}

function embeddingOnly(row) {
  return {
    strategy: "embedding-only",
    accepted: Boolean(row.candidates[0]),
    predictedCategoryId: row.candidates[0]?.categoryId || "",
  };
}

function thresholdStrategy(row, score = 0.74, margin = 0.03) {
  const best = row.candidates[0];
  const runnerUp = row.candidates.find((candidate) => candidate.categoryId !== best?.categoryId);
  const delta = best ? best.score - (runnerUp?.score || 0) : 0;
  const accepted = Boolean(best && best.score >= score && delta >= margin);
  return {
    strategy: `global-threshold-${score}-${margin}`,
    accepted,
    predictedCategoryId: accepted ? best.categoryId : "",
    rejectionReason: accepted ? "" : "candidate",
  };
}

function clusterThresholdStrategy(row) {
  const best = row.candidates[0];
  const runnerUp = row.candidates.find((candidate) => candidate.categoryId !== best?.categoryId);
  const policy = clusterPolicy(best?.categoryId);
  const delta = best ? best.score - (runnerUp?.score || 0) : 0;
  const accepted = Boolean(best && best.score >= policy.score && delta >= policy.margin && !policy.candidateByDefault);
  return {
    strategy: "cluster-threshold",
    accepted,
    predictedCategoryId: accepted ? best.categoryId : "",
    rejectionReason: accepted ? "" : policy.clusterId || "candidate",
  };
}

function metadataRerankStrategy(row) {
  const reranked = row.candidates.map((candidate) => {
    const textScore = tokenOverlapScore(row.queryText, [
      candidate.displayName,
      candidate.sourceTitle,
      candidate.categoryPath.join(" "),
    ].join(" "));
    return {
      ...candidate,
      textScore,
      rerankScore: (candidate.score * 0.82) + (textScore * 0.18),
    };
  }).sort((a, b) => b.rerankScore - a.rerankScore);
  const best = reranked[0];
  const runnerUp = reranked.find((candidate) => candidate.categoryId !== best?.categoryId);
  const policy = clusterPolicy(best?.categoryId);
  const delta = best ? best.rerankScore - (runnerUp?.rerankScore || 0) : 0;
  const accepted = Boolean(best && best.rerankScore >= policy.score && delta >= policy.margin && (!policy.candidateByDefault || best.textScore >= policy.rerankTextScore));
  return {
    strategy: "metadata-ocr-rerank",
    accepted,
    predictedCategoryId: accepted ? best.categoryId : "",
    top1CategoryId: best?.categoryId || "",
    top1Score: round(best?.rerankScore || 0, 4),
    textScore: round(best?.textScore || 0, 4),
    rejectionReason: accepted ? "" : "candidate",
  };
}

function summarize(rows, decisions) {
  const accepted = decisions.filter((decision) => decision.accepted);
  const acceptedCorrect = accepted.filter((decision) => decision.predictedCategoryId === decision.expectedCategoryId);
  return {
    sampleCount: rows.length,
    acceptedCount: accepted.length,
    coverage: round(accepted.length / Math.max(1, rows.length)),
    acceptedPrecision: round(acceptedCorrect.length / Math.max(1, accepted.length)),
    top1Accuracy: round(decisions.filter((decision) => (decision.top1CategoryId || decision.predictedCategoryId) === decision.expectedCategoryId).length / Math.max(1, rows.length)),
  };
}

function renderMarkdown(report) {
  return [
    "# 视觉命名策略评测",
    "",
    `生成时间：${report.generatedAt}`,
    "",
    "## 策略对比",
    "",
    "| 策略 | 样本 | 接受数 | 覆盖率 | 接受后准确率 | Top1/候选准确率 |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...report.strategies.map((item) => `| ${item.strategy} | ${item.summary.sampleCount} | ${item.summary.acceptedCount} | ${item.summary.coverage} | ${item.summary.acceptedPrecision} | ${item.summary.top1Accuracy} |`),
    "",
    "## 说明",
    "",
    "- `embedding-only` 表示旧的 Top1 直接命名。",
    "- `global-threshold` 表示全局 score/margin 阈值。",
    "- `cluster-threshold` 表示按高混淆类目 cluster 使用独立阈值，并对家庭影音等 cluster 默认候选展示。",
    "- `metadata-ocr-rerank` 使用 query 文本/OCR 文本/标题词对 TopK 候选做规则重排；若没有真实 OCR，则它代表文本信号可用时的离线上界。",
    "",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputs = String(args.inputs || [
    "data/generated/vision-model-eval-report.gt-crop-clip-naming-cn-1000.json",
    "data/generated/vision-catalog-naming-eval.electronics.json",
  ].join(",")).split(",").map((item) => item.trim()).filter(Boolean);
  const rows = [];
  for (const input of inputs) {
    const report = await readJson(input);
    rows.push(...normalizeRows(report, path.basename(input, ".json")));
  }
  const strategies = [
    ["embedding-only", embeddingOnly],
    ["global-threshold", (row) => thresholdStrategy(row, 0.74, 0.03)],
    ["cluster-threshold", clusterThresholdStrategy],
    ["metadata-ocr-rerank", metadataRerankStrategy],
  ].map(([strategy, fn]) => {
    const decisions = rows.map((row) => ({ ...fn(row), expectedCategoryId: row.expectedCategoryId, id: row.id }));
    return { strategy, summary: summarize(rows, decisions), decisions };
  });
  const report = {
    kind: "vision-naming-strategy-eval",
    version: "20260528-vision-naming-strategy-eval",
    generatedAt: new Date().toISOString(),
    inputCount: inputs.length,
    strategies,
  };
  await writeText(args.outputJson || "data/generated/vision-naming-strategy-eval.json", `${JSON.stringify(report, null, 2)}\n`);
  await writeText(args.outputMd || "data/generated/vision-naming-strategy-eval.md", renderMarkdown(report));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
