#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * (p / 100);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function distinctTopCategories(matches = []) {
  const seen = new Set();
  const categories = [];
  for (const match of matches) {
    if (!match?.categoryId || seen.has(match.categoryId)) continue;
    seen.add(match.categoryId);
    categories.push(match);
  }
  return categories;
}

function rowsFromCatalogReport(report, source) {
  return (report.results || []).map((result) => ({
    source,
    id: result.id,
    expectedCategoryId: result.categoryId,
    expectedName: result.displayName,
    top1CategoryId: result.top1CategoryId,
    top1Name: result.top1Name,
    top1Score: Number(result.top1Score) || 0,
    margin: Number(result.margin) || 0,
    top3CategoryIds: result.top3CategoryIds || [],
  }));
}

function rowsFromModelEvalReport(report, source) {
  const rows = [];
  for (const image of report.images || []) {
    for (const row of image.rows || []) {
      const truth = row.truth || {};
      const prediction = row.prediction || {};
      const matches = distinctTopCategories(prediction.matches || []);
      const top1 = matches[0] || {};
      const runnerUp = matches.find((match) => match.categoryId !== top1.categoryId) || {};
      rows.push({
        source,
        id: truth.id || image.imageId,
        expectedCategoryId: truth.categoryId,
        expectedName: truth.name,
        top1CategoryId: top1.categoryId || prediction.categoryId || "",
        top1Name: top1.displayName || prediction.name || "",
        top1Score: Number(top1.score ?? prediction.confidence) || 0,
        margin: Number(top1.score) - (Number(runnerUp.score) || 0),
        top3CategoryIds: matches.slice(0, 3).map((match) => match.categoryId),
      });
    }
  }
  return rows;
}

function normalizeRows(report, source) {
  if (Array.isArray(report.results)) return rowsFromCatalogReport(report, source);
  if (Array.isArray(report.images)) return rowsFromModelEvalReport(report, source);
  return [];
}

function summarizeScores(rows) {
  const correct = rows.filter((row) => row.top1CategoryId === row.expectedCategoryId);
  const wrong = rows.filter((row) => row.top1CategoryId !== row.expectedCategoryId);
  const metric = (items, field) => {
    const values = items.map((item) => Number(item[field])).filter(Number.isFinite);
    return {
      min: values.length ? round(Math.min(...values), 4) : null,
      p10: values.length ? round(percentile(values, 10), 4) : null,
      p50: values.length ? round(percentile(values, 50), 4) : null,
      p90: values.length ? round(percentile(values, 90), 4) : null,
      max: values.length ? round(Math.max(...values), 4) : null,
    };
  };
  return {
    sampleCount: rows.length,
    top1Accuracy: round(correct.length / Math.max(1, rows.length), 4),
    top3Accuracy: round(rows.filter((row) => row.top3CategoryIds.includes(row.expectedCategoryId)).length / Math.max(1, rows.length), 4),
    correctCount: correct.length,
    wrongCount: wrong.length,
    correctScore: metric(correct, "top1Score"),
    wrongScore: metric(wrong, "top1Score"),
    correctMargin: metric(correct, "margin"),
    wrongMargin: metric(wrong, "margin"),
  };
}

function sweep(rows, scoreThresholds, marginThresholds) {
  const all = [];
  for (const scoreThreshold of scoreThresholds) {
    for (const marginThreshold of marginThresholds) {
      const accepted = rows.filter((row) => row.top1Score >= scoreThreshold && row.margin >= marginThreshold);
      const acceptedCorrect = accepted.filter((row) => row.top1CategoryId === row.expectedCategoryId);
      all.push({
        scoreThreshold: round(scoreThreshold, 4),
        distanceThreshold: round(1 - scoreThreshold, 4),
        marginThreshold: round(marginThreshold, 4),
        acceptedCount: accepted.length,
        coverage: round(accepted.length / Math.max(1, rows.length), 4),
        precision: round(acceptedCorrect.length / Math.max(1, accepted.length), 4),
      });
    }
  }
  return all.sort((a, b) => {
    if (b.precision !== a.precision) return b.precision - a.precision;
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    return a.scoreThreshold - b.scoreThreshold;
  });
}

function chooseOperatingPoints(points) {
  const withCoverage = points.filter((point) => point.acceptedCount > 0);
  const bestForPrecision = (target) => withCoverage
    .filter((point) => point.precision >= target)
    .sort((a, b) => b.coverage - a.coverage || a.scoreThreshold - b.scoreThreshold || a.marginThreshold - b.marginThreshold)[0] || null;
  return {
    precision90: bestForPrecision(0.9),
    precision80: bestForPrecision(0.8),
    precision70: bestForPrecision(0.7),
    bestCoverageAtMaxPrecision: withCoverage[0] || null,
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Embedding 命名高置信阈值评估",
    "",
    `生成时间：${report.generatedAt}`,
    "",
    "## 结论",
    "",
    "- 当前索引的 embedding 是归一化 CLIP 向量，运行时按 cosine / inner product 分数排序；分数越高越相似。",
    "- 可以把 cosine distance 理解为 `1 - score`，所以 `score >= 0.74` 等价于 `distance <= 0.26`。",
    "- 只用绝对距离不够，必须同时看 Top1 与第二个不同类目的 margin；电子影音这类 hard-negative 样本 margin 很小，强行命名会错。",
    "",
    "## 建议阈值",
    "",
    `- 保守高置信：score >= ${report.recommended.conservative.scoreThreshold}，distance <= ${report.recommended.conservative.distanceThreshold}，margin >= ${report.recommended.conservative.marginThreshold}`,
    `- 可用高置信：score >= ${report.recommended.practical.scoreThreshold}，distance <= ${report.recommended.practical.distanceThreshold}，margin >= ${report.recommended.practical.marginThreshold}`,
    "- 不满足高置信时：展示 Top3 候选，不自动写死物品名。",
    "",
    "## 数据集汇总",
    "",
    "| 数据集 | 样本数 | Top1 | Top3 | 正确 Top1 score p50 | 错误 Top1 score p50 | 正确 margin p50 | 错误 margin p50 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.datasets.map((dataset) => `| ${dataset.source} | ${dataset.summary.sampleCount} | ${dataset.summary.top1Accuracy} | ${dataset.summary.top3Accuracy} | ${dataset.summary.correctScore.p50 ?? ""} | ${dataset.summary.wrongScore.p50 ?? ""} | ${dataset.summary.correctMargin.p50 ?? ""} | ${dataset.summary.wrongMargin.p50 ?? ""} |`),
    "",
    "## 推荐操作点",
    "",
    "| 数据集 | precision>=0.8 最大覆盖 | precision>=0.7 最大覆盖 | 最高 precision 操作点 |",
    "| --- | --- | --- | --- |",
    ...report.datasets.map((dataset) => {
      const fmt = (point) => point ? `score ${point.scoreThreshold}, dist ${point.distanceThreshold}, margin ${point.marginThreshold}, precision ${point.precision}, coverage ${point.coverage}` : "无";
      return `| ${dataset.source} | ${fmt(dataset.operatingPoints.precision80)} | ${fmt(dataset.operatingPoints.precision70)} | ${fmt(dataset.operatingPoints.bestCoverageAtMaxPrecision)} |`;
    }),
    "",
    "## Combined 阈值扫描 Top 20",
    "",
    "| score | distance | margin | precision | coverage | accepted |",
    "| ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.combined.topPoints.map((point) => `| ${point.scoreThreshold} | ${point.distanceThreshold} | ${point.marginThreshold} | ${point.precision} | ${point.coverage} | ${point.acceptedCount} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputFiles = String(args.inputs || [
    "data/generated/vision-model-eval-report.gt-crop-clip-naming-cn-1000.json",
    "data/generated/vision-catalog-naming-eval.electronics.json",
  ].join(",")).split(",").map((item) => item.trim()).filter(Boolean);
  const scoreThresholds = [];
  for (let value = 0.5; value <= 0.82 + 1e-9; value += 0.01) scoreThresholds.push(round(value, 2));
  const marginThresholds = [0, 0.005, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08];
  const datasets = [];
  for (const filePath of inputFiles) {
    const report = await readJson(filePath);
    const source = path.basename(filePath, ".json");
    const rows = normalizeRows(report, source).filter((row) => row.expectedCategoryId && row.top1CategoryId);
    const points = sweep(rows, scoreThresholds, marginThresholds);
    datasets.push({
      source,
      rows,
      summary: summarizeScores(rows),
      operatingPoints: chooseOperatingPoints(points),
      topPoints: points.slice(0, 20),
    });
  }
  const combinedRows = datasets.flatMap((dataset) => dataset.rows);
  const combinedPoints = sweep(combinedRows, scoreThresholds, marginThresholds);
  const report = {
    kind: "vision-embedding-threshold-eval",
    version: args.version || "20260528-embedding-threshold-eval",
    generatedAt: new Date().toISOString(),
    metric: "cosine / normalized inner product",
    recommended: {
      conservative: { scoreThreshold: 0.74, distanceThreshold: 0.26, marginThreshold: 0.04 },
      practical: { scoreThreshold: 0.74, distanceThreshold: 0.26, marginThreshold: 0.03 },
    },
    datasets: datasets.map((dataset) => ({
      source: dataset.source,
      summary: dataset.summary,
      operatingPoints: dataset.operatingPoints,
      topPoints: dataset.topPoints,
    })),
    combined: {
      summary: summarizeScores(combinedRows),
      operatingPoints: chooseOperatingPoints(combinedPoints),
      topPoints: combinedPoints.slice(0, 20),
    },
  };
  const outputJson = args.outputJson || "data/generated/vision-embedding-threshold-eval.json";
  const outputMd = args.outputMd || "data/generated/vision-embedding-threshold-eval.md";
  await writeText(outputJson, `${JSON.stringify(report, null, 2)}\n`);
  await writeText(outputMd, renderMarkdown(report));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
