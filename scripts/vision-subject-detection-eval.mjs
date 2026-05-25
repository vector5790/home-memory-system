#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  AutoModelForZeroShotObjectDetection,
  AutoProcessor,
  RawImage,
  env,
  pipeline,
} from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_CATEGORIES = "data/vision-categories.household.json";
const DEFAULT_SELECTION = "data/vision-embedding-category-selection.household.tsv";
const DEFAULT_EXCLUDE_MANIFEST = "data/vision-household-image-manifest.cn.json";
const DEFAULT_MANIFEST = "data/vision-subject-detection-manifest.cn.json";
const DEFAULT_VARIANTS = "data/vision-subject-detection-manifest.variants.json";
const DEFAULT_DETECTION_RUN = "data/generated/vision-subject-detection-run.json";
const DEFAULT_REVIEW = "data/generated/vision-subject-detection-review.json";
const DEFAULT_REPORT_BASE = "data/generated/vision-subject-detection-eval";
const DEFAULT_SUBJECT_RECALL_REPORT_BASE = "data/generated/vision-subject-recall-eval";
const DEFAULT_NAMING_RETRIEVAL_REPORT_BASE = "data/generated/vision-naming-retrieval-eval";
const DEFAULT_NAMING_REPORT = "data/generated/vision-model-eval-report.household-index.cn.json";
const DEFAULT_EXPORT = "data/generated/vision-subject-primary-boxes.reviewed.json";
const DEFAULT_IMAGE_DIR = "fixtures/vision-subject-detection/cn";
const DEFAULT_VARIANT_DIR = "fixtures/vision-subject-detection/variants";
const DEFAULT_RAW_DIR = "data/generated/vision-subject-detection-raw";
const DEFAULT_SIM_REPORT = "data/generated/vision-subject-detection-simulator-checks.json";
const MODEL_IDS = {
  "grounding-dino": "onnx-community/grounding-dino-tiny-ONNX",
  owlvit: "Xenova/owlvit-base-patch32",
};
const CN_SOURCE_DOMAINS = [
  "1688.com",
  "alicdn.com",
  "baidu.com",
  "dangdang.com",
  "jd.com",
  "pinduoduo.com",
  "smzdm.com",
  "suning.com",
  "taobao.com",
  "tmall.com",
  "xiaohongshu.com",
];

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = path.join(ROOT, "vendor", "models") + path.sep;
env.useBrowserCache = false;

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const [rawKey, rawValue] = token.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    if (rawValue !== undefined) {
      args[key] = rawValue;
      continue;
    }
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

function resolveRootPath(value) {
  const text = String(value || "");
  return path.isAbsolute(text) ? text : path.join(ROOT, text);
}

function relativeRootPath(value) {
  const resolved = resolveRootPath(value);
  return path.relative(ROOT, resolved).split(path.sep).join("/");
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(resolveRootPath(filePath), "utf8"));
  } catch (error) {
    if (fallback !== null && error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(filePath, payload) {
  const resolved = resolveRootPath(filePath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`wrote ${relativeRootPath(resolved)}`);
}

async function writeText(filePath, text) {
  const resolved = resolveRootPath(filePath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, text, "utf8");
  console.log(`wrote ${relativeRootPath(resolved)}`);
}

async function fileExists(filePath) {
  try {
    await stat(resolveRootPath(filePath));
    return true;
  } catch {
    return false;
  }
}

async function sha256File(filePath) {
  const buffer = await readFile(resolveRootPath(filePath));
  return createHash("sha256").update(buffer).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function round(value, digits = 3) {
  if (!Number.isFinite(Number(value))) return 0;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function elapsedMs(start) {
  return round(performance.now() - start, 3);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function unique(values) {
  return [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))];
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

function boxArea(box) {
  return Math.max(0, Number(box?.w) || 0) * Math.max(0, Number(box?.h) || 0);
}

function areaPct(box) {
  return round(boxArea(box) / 100, 4);
}

function boxIntersectionOverUnion(left, right) {
  if (!left || !right) return 0;
  const leftX2 = left.x + left.w;
  const leftY2 = left.y + left.h;
  const rightX2 = right.x + right.w;
  const rightY2 = right.y + right.h;
  const x1 = Math.max(left.x, right.x);
  const y1 = Math.max(left.y, right.y);
  const x2 = Math.min(leftX2, rightX2);
  const y2 = Math.min(leftY2, rightY2);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = boxArea(left) + boxArea(right) - intersection;
  return union > 0 ? intersection / union : 0;
}

function parseCsvList(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return String(value || "");
  }
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function sourceHost(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function absoluteUrl(value, protocol = "https:") {
  const text = String(value || "").trim().replace(/\\\//g, "/");
  if (!text) return "";
  if (text.startsWith("//")) return `${protocol}${text}`;
  if (text.startsWith("http://") || text.startsWith("https://")) return text;
  return "";
}

function isMainlandChinaCandidate(...urls) {
  return urls.some((url) => {
    const host = sourceHost(url);
    return host && CN_SOURCE_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  });
}

function extensionForUrl(url, mime = "") {
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  const match = String(url || "").split("?")[0].match(/\.(jpe?g|png|webp)$/i);
  return match ? `.${match[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function categoryMap(categoriesPayload) {
  return new Map((categoriesPayload.categories || []).map((category) => [category.id, category]));
}

function detectorLabelsForCategory(category) {
  return unique([
    ...(category.detectorLabels || []),
    ...(category.aliases || []),
    category.lineage?.level4,
    category.id?.replace(/-/g, " "),
    category.displayName,
  ].map(normalizePromptLabel)).filter((label) => label.length >= 2);
}

function detectorLabelsForSample(sample, category) {
  if (Array.isArray(sample.promptLabels) && sample.promptLabels.length) {
    return unique(sample.promptLabels.map(normalizePromptLabel)).filter((label) => label.length >= 2);
  }
  return detectorLabelsForCategory(category);
}

function canonicalSubjectLabel(label) {
  const text = normalizePromptLabel(label)
    .replace(/\btvs\b/g, "tv")
    .replace(/\btelevisions\b/g, "television")
    .replace(/\blunch boxes\b/g, "lunch box")
    .replace(/\bboxes\b/g, "box")
    .replace(/\bcabinets\b/g, "cabinet")
    .replace(/\bspeakers\b/g, "speaker")
    .replace(/\blamps\b/g, "lamp")
    .replace(/\bcables\b/g, "cable")
    .replace(/\bcords\b/g, "cord")
    .replace(/\s+/g, " ")
    .trim();
  const synonymGroups = [
    [/^(tv|television|flat screen tv)$/, "television"],
    [/^(lunch box|bento box|food container|meal prep container)$/, "lunch-box"],
    [/^(audio speaker|bluetooth speaker|portable speaker|speaker stand|speaker)$/, "speaker"],
    [/^(extension cord|power cable|charging cable|cable)$/, "cable"],
    [/^(sofa|couch)$/, "sofa"],
    [/^(pillow|cushion)$/, "pillow-cushion"],
  ];
  for (const [pattern, key] of synonymGroups) {
    if (pattern.test(text)) return key;
  }
  return text;
}

function detectionCategoryKey(detection, sample, category) {
  const labelKey = normalizeText(detection.label);
  const labels = detectorLabelsForCategory(category).map(normalizeText);
  const isCategorySample = !Array.isArray(sample.promptLabels) || sample.promptLabels.length === 0;
  if (isCategorySample && category?.id && labels.some((label) => label === labelKey || label.includes(labelKey) || labelKey.includes(label))) {
    return category.id;
  }
  return canonicalSubjectLabel(detection.label);
}

function dedupeOwlVitDetections(rawDetections, { sample, category, iouThreshold, maxBoxes }) {
  const groups = new Map();
  for (const detection of rawDetections) {
    const box = normalizePercentBox(detection.box);
    if (!box) continue;
    const categoryKey = detectionCategoryKey(detection, sample, category);
    if (!groups.has(categoryKey)) groups.set(categoryKey, []);
    groups.get(categoryKey).push({ ...detection, box, categoryKey });
  }
  const categoryKept = [];
  for (const detections of groups.values()) {
    const kept = [];
    for (const detection of detections.sort((left, right) => right.score - left.score)) {
      if (kept.some((existing) => boxIntersectionOverUnion(existing.box, detection.box) >= iouThreshold)) continue;
      kept.push(detection);
    }
    categoryKept.push(...kept);
  }
  const globallyKept = [];
  for (const detection of categoryKept.sort((left, right) => right.score - left.score)) {
    if (globallyKept.some((existing) => boxIntersectionOverUnion(existing.box, detection.box) >= 0.92)) continue;
    globallyKept.push(detection);
  }
  return globallyKept
    .sort((left, right) => right.score - left.score)
    .slice(0, maxBoxes)
    .map(({ categoryKey, ...detection }) => ({ ...detection, categoryKey }));
}

function nmsDetections(rawDetections, { iouThreshold, maxBoxes }) {
  const kept = [];
  const sorted = rawDetections
    .map((detection) => ({ ...detection, box: normalizePercentBox(detection.box) }))
    .filter((detection) => detection.box)
    .sort((left, right) => right.score - left.score);
  for (const detection of sorted) {
    if (kept.some((existing) => boxIntersectionOverUnion(existing.box, detection.box) >= iouThreshold)) continue;
    kept.push(detection);
    if (kept.length >= maxBoxes) break;
  }
  return kept;
}

async function readSelectionRows(filePath) {
  if (!filePath || !(await fileExists(filePath))) return null;
  if (filePath.endsWith(".json")) {
    const payload = await readJson(filePath);
    const rows = new Map();
    for (const row of payload.rows || payload.categories || []) {
      const id = row.categoryId || row.id;
      if (id) rows.set(id, row);
    }
    return rows;
  }
  const text = await readFile(resolveRootPath(filePath), "utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
  if (!lines.length) return new Map();
  const header = lines[0].split(/\t|,/).map((cell) => cell.trim());
  const rows = new Map();
  for (const line of lines.slice(1)) {
    const cells = line.split(/\t|,/);
    const row = Object.fromEntries(header.map((name, index) => [name, (cells[index] || "").trim()]));
    const id = row.categoryId || row.id;
    if (id) rows.set(id, row);
  }
  return rows;
}

function truthySelection(value) {
  const text = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "y", "include", "selected"].includes(text);
}

function prioritySelection(value) {
  const text = String(value || "").trim().toLowerCase();
  return ["p0", "p1", "p2"].includes(text);
}

function selectionIncludes(row) {
  if (!row) return false;
  const explicitDetection = [row.includeForSubjectDetection, row.includeForDetection]
    .filter((value) => String(value || "").trim());
  if (explicitDetection.length) return explicitDetection.some((value) => truthySelection(value) || prioritySelection(value));
  if (String(row.includeForEmbedding || "").trim()) return truthySelection(row.includeForEmbedding);
  return [row.subjectDetectionPriority, row.embeddingPriority].some(prioritySelection);
}

function categoriesInManifest(manifest) {
  return new Set((manifest.samples || [])
    .map((sample) => sample.categoryId)
    .filter(Boolean));
}

async function selectCategories(categoriesPayload, args) {
  const requested = new Set(parseCsvList(args.categoryIds));
  const selectionPath = args.categorySelection || args.embeddingSelection || "";
  const rows = await readSelectionRows(selectionPath);
  const selected = rows
    ? new Set([...rows.entries()].filter(([, row]) => selectionIncludes(row)).map(([id]) => id))
    : null;
  let excluded = new Set();
  if (args.onlyWithoutExistingSamples || args.excludeManifest) {
    const excludePath = args.excludeManifest || DEFAULT_EXCLUDE_MANIFEST;
    const existing = await readJson(excludePath, { samples: [] });
    excluded = categoriesInManifest(existing);
  }
  const limit = Number(args.categoryLimit || 0);
  const categories = (categoriesPayload.categories || [])
    .filter((category) => category.active !== false)
    .filter((category) => !requested.size || requested.has(category.id))
    .filter((category) => !selected || requested.size || selected.has(category.id))
    .filter((category) => !excluded.has(category.id));
  return limit > 0 ? categories.slice(0, limit) : categories;
}

function cnQueriesForCategory(category) {
  const display = category.displayName || category.id;
  const pathParts = Array.isArray(category.displayPath) ? category.displayPath.slice(0, -1) : [];
  const terms = unique([
    display,
    ...(category.aliases || []).filter((alias) => /[\u4e00-\u9fff]/.test(alias)),
    ...(category.searchQueries || []).filter((query) => /[\u4e00-\u9fff]/.test(query)),
  ]);
  const queries = [];
  for (const term of terms) {
    queries.push(
      `${term} site:taobao.com`,
      `${term} site:tmall.com`,
      `${term} site:1688.com`,
      `${term} 淘宝 商品图`,
      `${term} 天猫 商品图`,
      `${term} 1688 商品图`,
      `${term} 家用 实物图`,
      `${term} 白底图`,
      `${term} ${pathParts.at(-1) || pathParts[0] || "家用"}`,
    );
  }
  return unique(queries);
}

function chineseTerms(value) {
  return Array.from(String(value || "").matchAll(/[\u4e00-\u9fff]{2,}/g)).map((match) => match[0]);
}

function categoryMatchTerms(category) {
  const suffixPattern = /(盒|箱|袋|篮|架|柜|器|机|线|瓶|杯|碗|盘|刷|巾|桶|锅|剪|刀|笔|卡|本|垫|套|罩|膜|灯|表|钟|枕|被|毯|椅|凳|桌|纸|包|格)$/;
  const rawTerms = [
    category.displayName,
    ...(Array.isArray(category.displayPath) ? category.displayPath.slice(-1) : []),
    ...(Array.isArray(category.aliases) ? category.aliases : []),
  ].filter(Boolean);
  const terms = new Set();
  for (const raw of rawTerms) {
    const text = String(raw).trim().toLowerCase();
    if (!text) continue;
    terms.add(text);
    for (const term of chineseTerms(text)) {
      terms.add(term);
      const core = term.replace(suffixPattern, "");
      if (core.length >= 2) terms.add(core);
    }
  }
  return [...terms].filter((term) => term.length >= 2);
}

function assessResultForCategory(result, category, query, rank) {
  const title = safeDecodeURIComponent(result.title || "").toLowerCase();
  const sourceUrl = safeDecodeURIComponent(result.sourceUrl || "").toLowerCase();
  const imageUrl = safeDecodeURIComponent(result.imageUrl || "").toLowerCase();
  const haystack = [title, sourceUrl, imageUrl].join(" ");
  const display = String(category.displayName || "").toLowerCase();
  const termHits = categoryMatchTerms(category).filter((term) => haystack.includes(term));
  const mainland = isMainlandChinaCandidate(result.sourceUrl, result.imageUrl);
  const commerce = [result.sourceHost, result.imageHost].some((host) => /taobao|tmall|alicdn|1688|jd|pinduoduo|suning/.test(host || ""));
  const blacklist = /设计图|海报|banner|psd|矢量|简笔画|手绘|教程|尺寸图|招聘|租房|软件|app/.test(haystack);
  let score = 0;
  if (mainland) score += 2;
  if (commerce) score += 2;
  if (display && haystack.includes(display)) score += 4;
  score += Math.min(3, termHits.length);
  if (rank <= 8 && String(query).toLowerCase().includes(display)) score += 1;
  if (blacklist) score -= 5;
  const strictMatch = score >= 4 && !blacklist && (termHits.length > 0 || haystack.includes(display));
  const trustedTopResult = rank <= 3 && !blacklist && (mainland || commerce);
  return {
    accepted: strictMatch || trustedTopResult,
    score,
    termHits,
    mainland,
    commerce,
    blacklist,
    rank,
    relevanceMode: strictMatch ? "category-term-match" : trustedTopResult ? "trusted-top-search-result" : "rejected",
  };
}

function extractTaobaoSearchResults(html, query, limit) {
  const normalizedHtml = decodeHtmlEntities(html)
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/");
  const results = [];
  const seen = new Set();
  const imageRegex = /(?:https?:)?\/\/(?:img|gw)\.alicdn\.com\/[^"'<>\\\s]+?\.(?:jpe?g|png|webp)(?:_[^"'<>\\\s]+)?/gi;
  for (const match of normalizedHtml.matchAll(imageRegex)) {
    const imageUrl = absoluteUrl(match[0]);
    if (!imageUrl || seen.has(imageUrl)) continue;
    if (/-tps-|favicon|logo|icon|\.gif/i.test(imageUrl)) continue;
    seen.add(imageUrl);
    const around = normalizedHtml.slice(Math.max(0, match.index - 500), match.index + 500);
    const titleMatch = around.match(/(?:raw_title|title|item_title|name)["']?\s*[:=]\s*["']([^"']{2,120})["']/i);
    const itemMatch = around.match(/(?:item_id|nid|itemId)["']?\s*[:=]\s*["']?(\d{6,})/i);
    const sourceUrl = itemMatch
      ? `https://item.taobao.com/item.htm?id=${itemMatch[1]}`
      : `https://s.taobao.com/search?q=${encodeURIComponent(query)}`;
    results.push({
      title: titleMatch?.[1] || `${query} 淘宝商品图`,
      sourceUrl,
      imageUrl,
      sourceProvider: "Taobao search",
      sourceHost: sourceHost(sourceUrl),
      imageHost: sourceHost(imageUrl),
      license: {
        name: "Unverified Taobao product image",
        usage: "For local subject-detection evaluation only. Check Taobao/Tmall item rights before production or redistribution.",
      },
    });
    if (results.length >= limit) break;
  }
  return results;
}

async function taobaoImageSearch(query, limit) {
  const url = new URL("https://s.taobao.com/search");
  url.searchParams.set("q", query);
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.4",
    },
  }, 12000);
  if (!response.ok) throw new Error(`Taobao search failed ${response.status}: ${query}`);
  return extractTaobaoSearchResults(await response.text(), query, limit);
}

function extractBingImageResults(html) {
  const results = [];
  const seen = new Set();
  const regex = /<a\b[^>]*class="[^"]*\biusc\b[^"]*"[^>]*\bm="([^"]+)"/g;
  for (const match of html.matchAll(regex)) {
    try {
      const metadata = JSON.parse(decodeHtmlEntities(match[1]));
      const imageUrl = metadata.murl || metadata.turl;
      const sourceUrl = metadata.purl || metadata.surl || "";
      if (!imageUrl || seen.has(imageUrl)) continue;
      seen.add(imageUrl);
      results.push({
        title: metadata.t || metadata.desc || "image",
        sourceUrl,
        imageUrl,
        sourceProvider: "Bing Images",
        sourceHost: sourceHost(sourceUrl || imageUrl),
        imageHost: sourceHost(imageUrl),
        license: {
          name: "Unverified Chinese mainland web image",
          usage: "For local subject-detection evaluation only. Check source rights before production or redistribution.",
        },
      });
    } catch {
      // Ignore malformed metadata blocks.
    }
  }
  return results;
}

async function bingImageSearch(query, limit) {
  const url = new URL("https://cn.bing.com/images/search");
  url.searchParams.set("q", query);
  url.searchParams.set("first", "1");
  url.searchParams.set("count", String(limit));
  url.searchParams.set("mkt", "zh-CN");
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 home-memory-system/0.1",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.4",
    },
  }, 12000);
  if (!response.ok) throw new Error(`Bing image search failed ${response.status}: ${query}`);
  return extractBingImageResults(await response.text())
    .filter((result) => isMainlandChinaCandidate(result.sourceUrl, result.imageUrl))
    .slice(0, limit);
}

function extractDuckDuckGoVqd(html) {
  return html.match(/vqd=([\d-]+)&/)?.[1]
    || html.match(/"vqd":"([^"]+)"/)?.[1]
    || html.match(/vqd='([^']+)'/)?.[1]
    || "";
}

async function duckDuckGoImageSearch(query, limit) {
  const initUrl = new URL("https://duckduckgo.com/");
  initUrl.searchParams.set("q", query);
  initUrl.searchParams.set("iax", "images");
  initUrl.searchParams.set("ia", "images");
  const initResponse = await fetchWithTimeout(initUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 home-memory-system/0.1",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.4",
    },
  }, 12000);
  if (!initResponse.ok) throw new Error(`DuckDuckGo init failed ${initResponse.status}: ${query}`);
  const vqd = extractDuckDuckGoVqd(await initResponse.text());
  if (!vqd) return [];
  const url = new URL("https://duckduckgo.com/i.js");
  url.searchParams.set("l", "cn-zh");
  url.searchParams.set("o", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("vqd", vqd);
  url.searchParams.set("f", ",,,");
  url.searchParams.set("p", "1");
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 home-memory-system/0.1",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.4",
      Referer: initUrl.toString(),
    },
  }, 12000);
  if (!response.ok) throw new Error(`DuckDuckGo image search failed ${response.status}: ${query}`);
  const payload = await response.json();
  return (payload.results || [])
    .map((result) => {
      const imageUrl = absoluteUrl(result.image || result.thumbnail || "");
      const sourceUrl = absoluteUrl(result.url || "");
      return {
        title: result.title || query,
        sourceUrl,
        imageUrl,
        sourceProvider: "DuckDuckGo Images",
        sourceHost: sourceHost(sourceUrl || imageUrl),
        imageHost: sourceHost(imageUrl),
        license: {
          name: "Unverified Chinese mainland web image",
          usage: "For local subject-detection evaluation only. Check source rights before production or redistribution.",
        },
      };
    })
    .filter((result) => result.imageUrl && isMainlandChinaCandidate(result.sourceUrl, result.imageUrl))
    .slice(0, limit);
}

async function searchImages(query, limit, providers) {
  const providerFns = {
    taobao: taobaoImageSearch,
    bing: bingImageSearch,
    duckduckgo: duckDuckGoImageSearch,
  };
  const results = [];
  const failures = [];
  for (const provider of providers) {
    const fn = providerFns[provider];
    if (!fn) continue;
    try {
      results.push(...await fn(query, limit));
    } catch (error) {
      failures.push({ provider, query, reason: String(error.message || error) });
    }
  }
  return { results, failures };
}

async function downloadFile(url, outputPath) {
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 home-memory-system/0.1 subject detection eval",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  }, 20000);
  if (!response.ok) throw new Error(`download failed ${response.status}: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const resolved = resolveRootPath(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, buffer);
  return buffer.length;
}

async function imageMetadata(filePath) {
  const resolved = resolveRootPath(filePath);
  const raw = await RawImage.read(resolved);
  const info = await stat(resolved);
  return {
    width: raw.width,
    height: raw.height,
    bytes: info.size,
    sha256: await sha256File(resolved),
  };
}

async function commandCreateManifest(args) {
  const categoriesPayload = await readJson(args.categories || DEFAULT_CATEGORIES);
  const selectedCategories = await selectCategories(categoriesPayload, args);
  const samplesPerCategory = Number(args.samplesPerCategory || 3);
  const searchLimit = Number(args.searchLimit || 30);
  const queriesPerCategory = Number(args.queriesPerCategory || 4);
  const output = args.output || DEFAULT_MANIFEST;
  const imageDir = args.imageDir || DEFAULT_IMAGE_DIR;
  const providers = parseCsvList(args.providers, ["taobao", "bing", "duckduckgo"]);
  const version = args.version || `${new Date().toISOString().slice(0, 10)}-subject-detection-cn`;
  const samples = [];
  const sourceReport = {
    kind: "vision-subject-detection-source-report",
    version,
    generatedAt: nowIso(),
    taxonomyVersion: categoriesPayload.version || "",
    providerOrder: providers,
    categoryCount: selectedCategories.length,
    categories: [],
  };
  const seenUrls = new Set();

  for (const category of selectedCategories) {
    const categoryReport = {
      categoryId: category.id,
      displayName: category.displayName || category.id,
      requestedSamples: samplesPerCategory,
      collectedSamples: 0,
      queries: [],
      failures: [],
      insufficientSamples: false,
    };
    console.log(`collecting ${category.id} (${category.displayName || category.id})`);
    for (const query of cnQueriesForCategory(category).slice(0, queriesPerCategory)) {
      if (categoryReport.collectedSamples >= samplesPerCategory) break;
      console.log(`  search: ${query}`);
      const { results, failures } = await searchImages(query, searchLimit, providers);
      categoryReport.failures.push(...failures);
      let rank = 0;
      for (const result of results) {
        rank += 1;
        if (categoryReport.collectedSamples >= samplesPerCategory) break;
        if (!result.imageUrl || seenUrls.has(result.imageUrl)) continue;
        const assessment = assessResultForCategory(result, category, query, rank);
        if (!assessment.accepted) continue;
        seenUrls.add(result.imageUrl);
        const sampleNo = categoryReport.collectedSamples + 1;
        const ext = extensionForUrl(result.imageUrl, result.mime || "");
        const sampleId = `${category.id}-subject-cn-${String(sampleNo).padStart(2, "0")}`;
        const localPath = path.join(imageDir, slug(category.id), `${sampleId}${ext}`);
        try {
          await downloadFile(result.imageUrl, localPath);
          const meta = await imageMetadata(localPath);
          const sample = {
            id: sampleId,
            categoryId: category.id,
            displayName: category.displayName || category.id,
            categoryPath: Array.isArray(category.displayPath) ? category.displayPath : [],
            split: "subject-detection-eval",
            role: "query",
            localPath: relativeRootPath(localPath),
            sourceUrl: result.sourceUrl,
            sourceTitle: result.title || "",
            sourceHost: result.sourceHost || sourceHost(result.sourceUrl),
            imageUrl: result.imageUrl,
            imageHost: result.imageHost || sourceHost(result.imageUrl),
            sourceProvider: result.sourceProvider || "unknown",
            searchQuery: query,
            searchRank: rank,
            matchAssessment: assessment,
            license: result.license || {},
            sha256: meta.sha256,
            width: meta.width,
            height: meta.height,
            bytes: meta.bytes,
            reviewStatus: "pending-human-review",
            nonProductionReady: true,
          };
          samples.push(sample);
          categoryReport.collectedSamples += 1;
        } catch (error) {
          categoryReport.failures.push({
            stage: "download-or-decode",
            provider: result.sourceProvider || "unknown",
            query,
            imageUrl: result.imageUrl,
            reason: String(error.message || error),
          });
        }
      }
      categoryReport.queries.push({ query, candidateCount: results.length });
    }
    categoryReport.insufficientSamples = categoryReport.collectedSamples < samplesPerCategory;
    console.log(`  collected ${categoryReport.collectedSamples}/${samplesPerCategory}`);
    sourceReport.categories.push(categoryReport);
  }

  const selectedSummary = selectedCategories.map((category) => ({
    id: category.id,
    displayName: category.displayName || category.id,
    displayPath: Array.isArray(category.displayPath) ? category.displayPath : [],
    detectorLabels: detectorLabelsForCategory(category),
    source: category.source || "",
    sourceId: category.sourceId || "",
  }));
  const manifest = {
    kind: "vision-subject-detection-manifest",
    version,
    generatedAt: nowIso(),
    taxonomyVersion: categoriesPayload.version || "",
    categorySelection: {
      categoryIds: selectedSummary.map((category) => category.id),
      selectionFile: args.categorySelection || args.embeddingSelection || "",
      onlyWithoutExistingSamples: Boolean(args.onlyWithoutExistingSamples),
      excludeManifest: args.excludeManifest || (args.onlyWithoutExistingSamples ? DEFAULT_EXCLUDE_MANIFEST : ""),
    },
    sourcePolicy: {
      productionReady: false,
      usage: "Local evaluation only. Images are collected from Chinese mainland commerce/search sources and need rights review before production use.",
      preferredSource: "Taobao/Tmall/1688 product images",
    },
    categories: selectedSummary,
    samples,
  };
  await writeJson(output, manifest);
  await writeJson(args.report || "data/generated/vision-subject-detection-source-report.cn.json", sourceReport);
}

async function createVariantsForManifest(manifest, args = {}) {
  const targetLongSide = Number(args.targetLongSide || 1024);
  const variantDir = args.variantDir || DEFAULT_VARIANT_DIR;
  const samples = [];
  for (const sample of manifest.samples || []) {
    const imagePath = sample.localPath || sample.imagePath;
    const originalMeta = await imageMetadata(imagePath);
    const originalVariant = {
      id: "original",
      path: relativeRootPath(imagePath),
      width: originalMeta.width,
      height: originalMeta.height,
      bytes: originalMeta.bytes,
      sha256: originalMeta.sha256,
      generationMs: 0,
      transform: "none",
      upscaled: false,
    };
    const start = performance.now();
    let normalizedVariant;
    const longSide = Math.max(originalMeta.width, originalMeta.height);
    if (longSide <= targetLongSide) {
      normalizedVariant = {
        ...originalVariant,
        id: `normalized-${targetLongSide}`,
        generationMs: elapsedMs(start),
        transform: "reuse-original-no-upscale",
      };
    } else {
      const scale = targetLongSide / longSide;
      const width = Math.max(1, Math.round(originalMeta.width * scale));
      const height = Math.max(1, Math.round(originalMeta.height * scale));
      const outputPath = path.join(variantDir, slug(sample.categoryId), `${sample.id}-normalized-${targetLongSide}.png`);
      const raw = await RawImage.read(resolveRootPath(imagePath));
      const resized = await raw.resize(width, height);
      await mkdir(path.dirname(resolveRootPath(outputPath)), { recursive: true });
      await resized.save(resolveRootPath(outputPath));
      const normalizedMeta = await imageMetadata(outputPath);
      normalizedVariant = {
        id: `normalized-${targetLongSide}`,
        path: relativeRootPath(outputPath),
        width: normalizedMeta.width,
        height: normalizedMeta.height,
        bytes: normalizedMeta.bytes,
        sha256: normalizedMeta.sha256,
        generationMs: elapsedMs(start),
        transform: `long-side-${targetLongSide}`,
        upscaled: false,
      };
    }
    samples.push({
      ...sample,
      imageVariants: [originalVariant, normalizedVariant],
    });
  }
  return {
    ...manifest,
    kind: "vision-subject-detection-manifest-with-variants",
    variantVersion: `${manifest.version || "manifest"}-variants-${targetLongSide}`,
    variantGeneratedAt: nowIso(),
    variantPolicy: {
      targetLongSide,
      keepAspectRatio: true,
      noUpscale: true,
      variants: ["original", `normalized-${targetLongSide}`],
    },
    samples,
  };
}

async function commandCreateVariants(args) {
  const manifest = await readJson(args.manifest || DEFAULT_MANIFEST);
  const payload = await createVariantsForManifest(manifest, args);
  await writeJson(args.output || DEFAULT_VARIANTS, payload);
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

async function loadGroundingDino() {
  const start = performance.now();
  const processor = await AutoProcessor.from_pretrained(MODEL_IDS["grounding-dino"]);
  const model = await AutoModelForZeroShotObjectDetection.from_pretrained(MODEL_IDS["grounding-dino"], { dtype: "q8" });
  return { modelId: "grounding-dino", processor, model, modelLoadMs: elapsedMs(start) };
}

async function loadOwlVit() {
  const start = performance.now();
  const detector = await pipeline("zero-shot-object-detection", MODEL_IDS.owlvit, { dtype: "q8" });
  return { modelId: "owlvit", detector, modelLoadMs: elapsedMs(start) };
}

async function runGroundingDinoDetector(rawImage, detector, labels, threshold) {
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
  return boxes.map((box, index) => ({
    label: String(resultLabels[index] || ""),
    score: Number(scores[index]) || 0,
    box: percentBoxFromPixels(box, rawImage.width, rawImage.height),
  })).filter((detection) => detection.box && detection.score >= threshold);
}

async function runOwlVitDetector(imagePath, detector, labels, threshold, rawImage, chunkSize = 32) {
  const detections = [];
  for (let index = 0; index < labels.length; index += chunkSize) {
    const chunk = labels.slice(index, index + chunkSize);
    const output = await detector.detector(resolveRootPath(imagePath), chunk, { threshold, percentage: false });
    detections.push(...(Array.isArray(output) ? output : []).map((result) => ({
      label: String(result.label || ""),
      score: Number(result.score) || 0,
      box: percentBoxFromPixels(result.box, rawImage.width, rawImage.height),
    })).filter((detection) => detection.box && detection.score >= threshold));
  }
  return detections;
}

function finalizeDetections(rawDetections, context) {
  const scoreSorted = [...rawDetections].sort((left, right) => right.score - left.score);
  const areaSorted = [...rawDetections].sort((left, right) => boxArea(right.box) - boxArea(left.box));
  const scoreRank = new Map(scoreSorted.map((detection, index) => [detection, index + 1]));
  const areaRank = new Map(areaSorted.map((detection, index) => [detection, index + 1]));
  const detections = rawDetections.map((detection, index) => ({
    id: `${context.imageId}:${context.variantId}:${context.modelId}:d${String(index + 1).padStart(2, "0")}`,
    label: detection.label || "",
    categoryKey: detection.categoryKey || "",
    score: round(detection.score || 0, 6),
    box: normalizePercentBox(detection.box),
    areaPct: areaPct(detection.box),
    rankByScore: scoreRank.get(detection) || index + 1,
    rankByArea: areaRank.get(detection) || index + 1,
  })).sort((left, right) => left.rankByScore - right.rankByScore);
  return {
    detections,
    primaryBoxAId: detections.find((detection) => detection.rankByArea === 1)?.id || "",
    primaryBoxBId: detections.find((detection) => detection.rankByScore === 1)?.id || "",
  };
}

async function runModelOnVariant({ sample, variant, category, modelId, modelResource, threshold, rawDir, runVersion, owlvitNms, groundingDinoPolicy }) {
  const labels = detectorLabelsForSample(sample, category);
  const imagePath = variant.path || sample.localPath;
  const resultId = `${sample.id}:${variant.id}:${modelId}`;
  const result = {
    id: resultId,
    imageId: sample.id,
    categoryId: sample.categoryId,
    expectedDisplayName: sample.displayName || category.displayName || category.id,
    sourceProvider: sample.sourceProvider || "",
    sourceUrl: sample.sourceUrl || "",
    imageVariant: variant.id,
    image: {
      path: imagePath,
      width: variant.width,
      height: variant.height,
      bytes: variant.bytes,
    },
    modelId,
    modelName: MODEL_IDS[modelId],
    threshold,
    promptedLabels: labels,
    status: "ok",
    failureReason: "",
    detections: [],
    primaryBoxAId: "",
    primaryBoxBId: "",
    primaryBoxesSame: false,
    postProcessing: {},
    timings: {
      modelLoadMs: modelResource?.modelLoadMs ?? null,
      detectionMs: null,
      endToEndMs: null,
    },
    rawOutputPath: "",
  };
  const runStart = performance.now();
  let rawDetections = [];
  try {
    const rawImage = await RawImage.read(resolveRootPath(imagePath));
    const detectionStart = performance.now();
    if (modelId === "grounding-dino") {
      rawDetections = await runGroundingDinoDetector(rawImage, modelResource, labels, threshold);
    } else if (modelId === "owlvit") {
      rawDetections = await runOwlVitDetector(imagePath, modelResource, labels, threshold, rawImage);
    } else {
      throw new Error(`unsupported model: ${modelId}`);
    }
    result.timings.detectionMs = elapsedMs(detectionStart);
    const finalRawDetections = modelId === "owlvit"
      ? dedupeOwlVitDetections(rawDetections, {
        sample,
        category,
        iouThreshold: owlvitNms.iouThreshold,
        maxBoxes: owlvitNms.maxBoxes,
      })
      : nmsDetections(rawDetections, {
        iouThreshold: groundingDinoPolicy.iouThreshold,
        maxBoxes: groundingDinoPolicy.maxBoxes,
      });
    if (modelId === "owlvit") {
      result.postProcessing.owlvitCategoryNms = {
        applied: true,
        inputCount: rawDetections.length,
        outputCount: finalRawDetections.length,
        iouThreshold: owlvitNms.iouThreshold,
        maxSubjects: owlvitNms.maxBoxes,
      };
    } else if (modelId === "grounding-dino") {
      result.postProcessing.groundingDinoNms = {
        applied: true,
        inputCount: rawDetections.length,
        outputCount: finalRawDetections.length,
        iouThreshold: groundingDinoPolicy.iouThreshold,
        maxSubjects: groundingDinoPolicy.maxBoxes,
      };
    }
    const finalized = finalizeDetections(finalRawDetections, {
      imageId: sample.id,
      variantId: variant.id,
      modelId,
    });
    Object.assign(result, finalized);
    result.primaryBoxesSame = Boolean(result.primaryBoxAId && result.primaryBoxAId === result.primaryBoxBId);
  } catch (error) {
    result.status = "failed";
    result.failureReason = String(error.message || error);
  }
  result.timings.endToEndMs = elapsedMs(runStart);
  const rawOutputPath = path.join(rawDir, runVersion, `${slug(sample.id)}__${slug(variant.id)}__${slug(modelId)}.json`);
  await writeJson(rawOutputPath, {
    resultId,
    rawDetections,
    normalizedDetections: result.detections,
    postProcessing: result.postProcessing,
    failureReason: result.failureReason,
  });
  result.rawOutputPath = relativeRootPath(rawOutputPath);
  return result;
}

async function commandRunDetection(args) {
  const manifest = await readJson(args.manifest || DEFAULT_VARIANTS);
  const categoriesPayload = await readJson(args.categories || DEFAULT_CATEGORIES);
  const categories = categoryMap(categoriesPayload);
  const modelIds = parseCsvList(args.models, ["grounding-dino", "owlvit"]);
  const variantIds = new Set(parseCsvList(args.variants, ["original", "normalized-1024"]));
  const thresholds = {
    "grounding-dino": Number(args.groundingDinoThreshold ?? args.threshold ?? 0),
    owlvit: Number(args.owlvitThreshold ?? args.threshold ?? 0),
  };
  const owlvitNms = {
    iouThreshold: Number(args.owlvitNmsIou || 0.5),
    maxBoxes: Number(args.owlvitMaxBoxes || args.maxSubjects || 10),
  };
  const groundingDinoPolicy = {
    thresholdMode: "zero-threshold-nms-top-k",
    iouThreshold: Number(args.groundingDinoNmsIou || args.nmsIou || 0.85),
    maxBoxes: Number(args.groundingDinoMaxBoxes || args.maxSubjects || 10),
  };
  const runVersion = args.version || `${new Date().toISOString().slice(0, 10)}-subject-detection-run`;
  const modelResources = new Map();
  const modelLoadFailures = new Map();

  for (const modelId of modelIds) {
    try {
      modelResources.set(modelId, modelId === "grounding-dino" ? await loadGroundingDino() : await loadOwlVit());
    } catch (error) {
      modelLoadFailures.set(modelId, String(error.message || error));
    }
  }

  const results = [];
  for (const sample of manifest.samples || []) {
    const category = categories.get(sample.categoryId) || sample;
    const variants = (sample.imageVariants || [{
      id: "original",
      path: sample.localPath || sample.imagePath,
      width: sample.width,
      height: sample.height,
      bytes: sample.bytes,
    }]).filter((variant) => variantIds.has(variant.id));
    for (const variant of variants) {
      for (const modelId of modelIds) {
        if (modelLoadFailures.has(modelId)) {
          results.push({
            id: `${sample.id}:${variant.id}:${modelId}`,
            imageId: sample.id,
            categoryId: sample.categoryId,
            expectedDisplayName: sample.displayName || category.displayName || category.id,
            sourceProvider: sample.sourceProvider || "",
            sourceUrl: sample.sourceUrl || "",
            imageVariant: variant.id,
            image: { path: variant.path || sample.localPath, width: variant.width, height: variant.height, bytes: variant.bytes },
            modelId,
            modelName: MODEL_IDS[modelId],
            threshold: thresholds[modelId],
            promptedLabels: detectorLabelsForSample(sample, category),
            status: "failed",
            failureReason: `model load failed: ${modelLoadFailures.get(modelId)}`,
            detections: [],
            primaryBoxAId: "",
            primaryBoxBId: "",
            primaryBoxesSame: false,
            postProcessing: {},
            timings: { modelLoadMs: null, detectionMs: null, endToEndMs: null },
            rawOutputPath: "",
          });
          continue;
        }
        results.push(await runModelOnVariant({
          sample,
          variant,
          category,
          modelId,
          modelResource: modelResources.get(modelId),
          threshold: thresholds[modelId],
          rawDir: args.rawDir || DEFAULT_RAW_DIR,
          runVersion,
          owlvitNms,
          groundingDinoPolicy,
        }));
      }
    }
  }

  const payload = {
    kind: "vision-subject-detection-run",
    version: runVersion,
    generatedAt: nowIso(),
    manifestVersion: manifest.version || "",
    variantVersion: manifest.variantVersion || "",
    taxonomyVersion: manifest.taxonomyVersion || categoriesPayload.version || "",
    modelIds,
    modelNames: Object.fromEntries(modelIds.map((modelId) => [modelId, MODEL_IDS[modelId]])),
    thresholds,
    owlvitNms,
    groundingDinoPolicy,
    imageVariants: [...variantIds],
    modelLoadFailures: Object.fromEntries(modelLoadFailures),
    resultCount: results.length,
    results,
  };
  await writeJson(args.output || DEFAULT_DETECTION_RUN, payload);
}

function reviewArtifact(existing = {}, detectionRun = null) {
  return {
    kind: "vision-subject-detection-review",
    version: existing.version || `${new Date().toISOString().slice(0, 10)}-subject-detection-review`,
    generatedAt: existing.generatedAt || nowIso(),
    updatedAt: nowIso(),
    detectionRunVersion: existing.detectionRunVersion || detectionRun?.version || "",
    imageManifestVersion: existing.imageManifestVersion || detectionRun?.manifestVersion || "",
    taxonomyVersion: existing.taxonomyVersion || detectionRun?.taxonomyVersion || "",
    reviews: Array.isArray(existing.reviews) ? existing.reviews : Object.values(existing.reviews || {}),
  };
}

function upsertReview(reviewPayload, review) {
  const reviews = new Map((reviewPayload.reviews || []).map((item) => [item.imageId, item]));
  reviews.set(review.imageId, {
    ...reviews.get(review.imageId),
    ...review,
    timestamp: review.timestamp || nowIso(),
  });
  return {
    ...reviewPayload,
    updatedAt: nowIso(),
    reviews: [...reviews.values()].sort((left, right) => String(left.imageId).localeCompare(String(right.imageId))),
  };
}

function indexReviews(reviewPayload) {
  return new Map((reviewPayload.reviews || []).map((review) => [review.imageId, review]));
}

function serveFile(response, filePath) {
  const resolved = resolveRootPath(filePath);
  if (!resolved.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("forbidden");
    return;
  }
  const ext = path.extname(resolved).toLowerCase();
  const type = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  response.writeHead(200, { "Content-Type": type });
  createReadStream(resolved).on("error", () => {
    response.writeHead(404);
    response.end("missing file");
  }).pipe(response);
}

function reviewPageHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>主体检测评估</title>
  <style>
    :root { color-scheme: light; --line:#d8dde6; --ink:#182230; --muted:#667085; --a:#169b62; --b:#d97706; --o:#2563eb; --bad:#b42318; }
    * { box-sizing: border-box; }
    body { margin:0; font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--ink); background:#f6f7f9; }
    header { height:56px; display:flex; align-items:center; justify-content:space-between; padding:0 18px; border-bottom:1px solid var(--line); background:white; position:sticky; top:0; z-index:5; }
    main { display:grid; grid-template-columns:280px 1fr; min-height:calc(100vh - 56px); }
    nav { border-right:1px solid var(--line); background:white; overflow:auto; max-height:calc(100vh - 56px); }
    .item { display:block; width:100%; text-align:left; border:0; border-bottom:1px solid #edf0f5; padding:10px 12px; background:white; color:var(--ink); cursor:pointer; }
    .item.active { background:#edf4ff; }
    .item small { display:block; color:var(--muted); }
    .content { padding:18px; overflow:auto; }
    .toolbar { display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
    select, input, textarea, button { font:inherit; }
    button, select, input { border:1px solid var(--line); background:white; border-radius:6px; padding:7px 9px; }
    button.primary { background:#1d4ed8; color:white; border-color:#1d4ed8; }
    button.good { border-color:var(--a); color:var(--a); }
    button.bad { border-color:var(--bad); color:var(--bad); }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(360px,1fr)); gap:14px; }
    .panel { background:white; border:1px solid var(--line); border-radius:8px; overflow:hidden; }
    .panel h3 { margin:0; padding:10px 12px; border-bottom:1px solid var(--line); font-size:15px; display:flex; justify-content:space-between; gap:8px; }
    .meta { padding:8px 12px; color:var(--muted); display:flex; gap:12px; flex-wrap:wrap; }
    .stage { background:#111827; display:flex; justify-content:center; align-items:center; min-height:260px; overflow:auto; }
    .canvas { position:relative; display:inline-block; line-height:0; max-width:100%; }
    .canvas img { max-width:100%; max-height:70vh; display:block; }
    .box { position:absolute; border:2px solid var(--o); pointer-events:none; }
    .box.a { border-color:var(--a); box-shadow:0 0 0 2px rgba(22,155,98,.25); }
    .box.b { border-color:var(--b); box-shadow:0 0 0 2px rgba(217,119,6,.25); }
    .box.ab { border-color:var(--a); outline:2px solid var(--b); outline-offset:2px; }
    .tag { position:absolute; left:0; top:-22px; padding:2px 5px; color:white; background:var(--o); font-size:12px; white-space:nowrap; }
    .a .tag { background:var(--a); } .b .tag { background:var(--b); } .ab .tag { background:#394150; }
    .review { padding:10px 12px; display:grid; gap:8px; }
    .row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .query-invalid { display:none; }
    .query-invalid.visible { display:block; }
    .box-list { display:grid; gap:6px; max-height:320px; overflow:auto; overflow-x:hidden; }
    .box-row { display:grid; grid-template-columns:64px minmax(0,1fr); grid-template-areas:"thumb head" "thumb actions"; gap:6px 8px; align-items:center; border:1px solid #edf0f5; border-radius:6px; padding:7px; background:#fbfcff; min-width:0; }
    .box-row.selected { border-color:#1d4ed8; background:#edf4ff; }
    .box-thumb { grid-area:thumb; width:64px; height:58px; border:1px solid #d8dde6; border-radius:6px; background-color:#111827; background-repeat:no-repeat; justify-self:center; box-shadow:inset 0 0 0 1px rgba(255,255,255,.24); }
    .box-row-head { grid-area:head; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; align-items:center; min-width:0; }
    .box-actions { grid-area:actions; display:flex; gap:8px; align-items:center; flex-wrap:wrap; min-width:0; }
    .box-actions select { max-width:150px; }
    .box-title { display:grid; gap:2px; min-width:0; }
    .box-title-line { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:6px; align-items:center; min-width:0; }
    .box-title strong { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; line-height:1.25; min-width:0; }
    .box-row.expanded .box-title strong { overflow:visible; white-space:normal; text-overflow:clip; overflow-wrap:anywhere; }
    .box-row:not(.expanded) .box-title small { display:none; }
    .box-title small, .score { color:var(--muted); }
    .mini { padding:5px 7px; }
    textarea { width:100%; min-height:64px; border:1px solid var(--line); border-radius:6px; padding:8px; resize:vertical; }
    .status { color:var(--muted); }
  </style>
</head>
<body>
  <header>
    <strong>主体检测评估</strong>
    <span id="status" class="status"></span>
  </header>
  <main>
    <nav id="list"></nav>
    <section class="content">
      <div class="toolbar">
        <label>Reviewer <input id="reviewer" value="local-reviewer" /></label>
        <button class="primary" id="save">保存当前图片标注</button>
        <button id="noBox">无可用主体框</button>
      </div>
      <div id="summary"></div>
      <div class="grid" id="cards"></div>
      <div class="panel" style="margin-top:14px">
        <h3>当前图片结论</h3>
        <div class="review">
          <div class="row">
            <label>效果更好的模型 <select id="bestModel"></select></label>
            <label>最终主框 <select id="selectedBox"></select></label>
            <label>Query 图 <select id="queryValidity"><option value="valid">有效</option><option value="invalid">无效，需要重采</option><option value="unknown">未判断</option></select></label>
          </div>
          <textarea id="queryInvalidReason" class="query-invalid" placeholder="无效原因 / 重新采集提示，例如：不是该类目、图太糊、主体被遮挡、只有包装没有物品"></textarea>
          <textarea id="notes" placeholder="备注"></textarea>
        </div>
      </div>
    </section>
  </main>
  <script>
    let state, currentIndex = 0, draft = {}, isolatedBoxId = '', expandedBoxIds = new Set();
    const $ = (id) => document.getElementById(id);
    const keyFor = (r) => r.modelId + ':' + r.imageVariant;
    async function load() {
      state = await fetch('/api/state').then((r) => r.json());
      renderList();
      select(0);
    }
    function imageResults() {
      const sample = state.manifest.samples[currentIndex];
      return state.detection.results.filter((r) => r.imageId === sample.id);
    }
    function bestResultKey(result) {
      return result.modelId + ':' + result.imageVariant;
    }
    function normalizedBestResultKey(review) {
      if (!review.bestModel) return '';
      const results = imageResults();
      if (results.some((result) => bestResultKey(result) === review.bestModel)) return review.bestModel;
      const legacy = results.find((result) => result.modelId === review.bestModel);
      return legacy ? bestResultKey(legacy) : review.bestModel;
    }
    function reviewFor(sample) {
      const existing = draft[sample.id] || state.reviews[sample.id] || {};
      const review = {
        imageId: sample.id,
        categoryId: sample.categoryId,
        reviewStatus: 'needs-review',
        modelVerdicts: {},
        boxVerdicts: {},
        bestModel: '',
        selectedPrimaryBox: null,
        noUsableBox: false,
        queryImageValidity: 'valid',
        queryInvalidReason: '',
        notes: '',
        ...existing,
        modelVerdicts: existing.modelVerdicts || {},
        boxVerdicts: existing.boxVerdicts || {},
      };
      if (review.selectedPrimaryBox?.detectionId && !review.boxVerdicts[review.selectedPrimaryBox.detectionId]) {
        review.boxVerdicts[review.selectedPrimaryBox.detectionId] = 'accurate';
      }
      return review;
    }
    function renderList() {
      $('list').innerHTML = state.manifest.samples.map((sample, index) => {
        const reviewed = state.reviews[sample.id] ? '已标注' : '未标注';
        return '<button class="item ' + (index === currentIndex ? 'active' : '') + '" onclick="select(' + index + ')"><strong>' +
          sample.displayName + '</strong><small>' + sample.id + ' · ' + reviewed + '</small></button>';
      }).join('');
    }
    function select(index) {
      currentIndex = index;
      isolatedBoxId = '';
      const sample = state.manifest.samples[currentIndex];
      const review = reviewFor(sample);
      $('summary').innerHTML = '<p><strong>' + sample.displayName + '</strong> · ' + sample.categoryId + ' · ' + (sample.sourceProvider || '') + '</p>';
      $('bestModel').innerHTML = '<option value="">未选择</option>' + imageResults()
        .map((result) => '<option value="' + bestResultKey(result) + '">' + result.modelId + ' / ' + result.imageVariant + '</option>').join('');
      $('bestModel').value = normalizedBestResultKey(review);
      renderCards(review);
      renderSelectedBox(review);
      $('queryValidity').value = review.queryImageValidity || 'valid';
      $('queryInvalidReason').value = review.queryInvalidReason || '';
      renderQueryValidity(review);
      $('notes').value = review.notes || '';
      renderList();
    }
    function roleClass(result, detection) {
      const a = detection.id === result.primaryBoxAId;
      const b = detection.id === result.primaryBoxBId;
      return a && b ? 'ab' : a ? 'a' : b ? 'b' : 'o';
    }
    function roleText(result, detection) {
      const a = detection.id === result.primaryBoxAId;
      const b = detection.id === result.primaryBoxBId;
      return a && b ? 'A+B' : a ? 'A' : b ? 'B' : '普通';
    }
    function findDetectionById(detectionId) {
      for (const result of imageResults()) {
        const detection = result.detections.find((item) => item.id === detectionId);
        if (detection) return { result, detection };
      }
      return null;
    }
    function setSelectedPrimary(review, detectionId) {
      const picked = findDetectionById(detectionId);
      if (!picked) {
        review.selectedPrimaryBox = null;
        return;
      }
      review.bestModel = bestResultKey(picked.result);
      review.noUsableBox = false;
      review.boxVerdicts[picked.detection.id] = 'accurate';
      review.selectedPrimaryBox = {
        modelId: picked.result.modelId,
        imageVariant: picked.result.imageVariant,
        detectionId: picked.detection.id,
        box: picked.detection.box,
        label: picked.detection.label,
        score: picked.detection.score,
      };
      $('bestModel').value = review.bestModel;
      $('selectedBox').value = detectionId;
    }
    function captureScrollState() {
      const lists = {};
      document.querySelectorAll('[data-box-list-key]').forEach((node) => {
        lists[node.dataset.boxListKey] = node.scrollTop;
      });
      return { windowY: window.scrollY, lists };
    }
    function restoreScrollState(state, focusBoxId) {
      requestAnimationFrame(() => {
        for (const [key, top] of Object.entries(state?.lists || {})) {
          const node = document.querySelector('[data-box-list-key="' + key + '"]');
          if (node) node.scrollTop = top;
        }
        if (focusBoxId) {
          const row = document.querySelector('[data-box-row="' + focusBoxId + '"]');
          row?.scrollIntoView({ block: 'nearest' });
        }
        window.scrollTo({ top: state?.windowY || 0 });
      });
    }
    function thumbStyle(result, detection) {
      const src = '/file/' + encodeURIComponent(result.image.path);
      const box = detection.box || {};
      const width = Math.max(0.1, Number(box.w) || 100);
      const height = Math.max(0.1, Number(box.h) || 100);
      const x = Math.max(0, Number(box.x) || 0);
      const y = Math.max(0, Number(box.y) || 0);
      const sizeX = Math.round((10000 / width) * 1000) / 1000;
      const sizeY = Math.round((10000 / height) * 1000) / 1000;
      const posX = width >= 99.9 ? 50 : Math.round((x / Math.max(0.1, 100 - width)) * 100000) / 1000;
      const posY = height >= 99.9 ? 50 : Math.round((y / Math.max(0.1, 100 - height)) * 100000) / 1000;
      return 'background-image:url(&quot;' + src + '&quot;);background-size:' + sizeX + '% ' + sizeY + '%;background-position:' + posX + '% ' + posY + '%';
    }
    function rowHtml(result, detection, review) {
      const role = roleText(result, detection);
      const verdict = review.boxVerdicts[detection.id] || 'accurate';
      const selected = review.selectedPrimaryBox?.detectionId === detection.id;
      const canPick = verdict === 'accurate';
      const expanded = expandedBoxIds.has(detection.id);
      const title = '#' + detection.rankByScore + ' ' + role + ' · ' + detection.label;
      return '<div class="box-row ' + (selected ? 'selected ' : '') + (expanded ? 'expanded' : '') + '" data-box-row="' + detection.id + '">' +
        '<div class="box-thumb" style="' + thumbStyle(result, detection) + '" title="主体框缩略图"></div>' +
        '<div class="box-row-head"><div class="box-title"><div class="box-title-line"><strong title="' + title.replace(/"/g, '&quot;') + '">' + title + '</strong><button class="mini" data-toggle-title="' + detection.id + '">' + (expanded ? '收起' : '展开') + '</button></div><small>' + detection.id + '</small></div><div class="score">' + detection.score.toFixed(6) + '</div></div>' +
        '<div class="box-actions"><select data-box-verdict="' + detection.id + '"><option value="accurate">准确</option><option value="inaccurate">不准确</option><option value="">未标注</option></select>' +
        '<label><input type="radio" name="primary-box" data-pick-box="' + detection.id + '"' + (selected ? ' checked' : '') + (canPick ? '' : ' disabled title="先标为准确后可设为主框"') + ' /> 主框</label>' +
        '<button class="mini" data-isolate-box="' + detection.id + '">只看此框</button></div>' +
      '</div>';
    }
    function renderCards(review) {
      $('cards').innerHTML = imageResults().map((result) => {
        const visibleDetections = isolatedBoxId ? result.detections.filter((d) => d.id === isolatedBoxId) : result.detections;
        const boxes = visibleDetections.map((d) => {
          const role = roleClass(result, d);
          return '<div class="box ' + role + '" style="left:' + d.box.x + '%;top:' + d.box.y + '%;width:' + d.box.w + '%;height:' + d.box.h + '%"><span class="tag">' +
            '#' + d.rankByScore + ' ' + roleText(result, d) + '</span></div>';
        }).join('');
        const src = '/file/' + encodeURIComponent(result.image.path);
        return '<article class="panel"><h3><span>' + result.modelId + ' · ' + result.imageVariant + '</span><span>' +
          (result.timings.detectionMs ?? '-') + ' ms</span></h3><div class="meta"><span>框 ' + result.detections.length + '</span><span>' +
          (result.status === 'ok' ? 'ok' : result.failureReason) + '</span>' +
          (isolatedBoxId ? '<button class="mini" data-clear-isolate="1">显示全部框</button>' : '') +
          '</div><div class="stage"><div class="canvas"><img src="' + src + '" />' + boxes +
          '</div></div><div class="review"><div class="box-list" data-box-list-key="' + keyFor(result) + '">' + result.detections.map((d) => rowHtml(result, d, review)).join('') + '</div></div></article>';
      }).join('');
      document.querySelectorAll('select[data-box-verdict]').forEach((node) => {
        node.value = review.boxVerdicts[node.dataset.boxVerdict] || 'accurate';
        node.onchange = () => {
          const scrollState = captureScrollState();
          if (node.value === 'inaccurate') review.boxVerdicts[node.dataset.boxVerdict] = 'inaccurate';
          else delete review.boxVerdicts[node.dataset.boxVerdict];
          if (node.value !== 'accurate' && review.selectedPrimaryBox?.detectionId === node.dataset.boxVerdict) {
            review.selectedPrimaryBox = null;
          }
          draft[review.imageId] = review;
          renderSelectedBox(review);
          renderCards(review);
          restoreScrollState(scrollState, node.dataset.boxVerdict);
        };
      });
      document.querySelectorAll('input[data-pick-box]').forEach((node) => {
        node.onchange = () => {
          const scrollState = captureScrollState();
          setSelectedPrimary(review, node.dataset.pickBox);
          draft[review.imageId] = review;
          renderSelectedBox(review);
          renderCards(review);
          restoreScrollState(scrollState, node.dataset.pickBox);
        };
      });
      document.querySelectorAll('button[data-isolate-box]').forEach((node) => {
        node.onclick = () => {
          const scrollState = captureScrollState();
          isolatedBoxId = node.dataset.isolateBox;
          renderCards(review);
          restoreScrollState(scrollState, node.dataset.isolateBox);
        };
      });
      document.querySelectorAll('button[data-toggle-title]').forEach((node) => {
        node.onclick = () => {
          const scrollState = captureScrollState();
          const id = node.dataset.toggleTitle;
          if (expandedBoxIds.has(id)) expandedBoxIds.delete(id);
          else expandedBoxIds.add(id);
          renderCards(review);
          restoreScrollState(scrollState, id);
        };
      });
      document.querySelectorAll('button[data-clear-isolate]').forEach((node) => {
        node.onclick = () => {
          const scrollState = captureScrollState();
          isolatedBoxId = '';
          renderCards(review);
          restoreScrollState(scrollState);
        };
      });
    }
    function renderSelectedBox(review) {
      const options = imageResults().flatMap((result) => result.detections
        .filter((detection) => (review.boxVerdicts?.[detection.id] || 'accurate') === 'accurate')
        .map((detection) => {
        const role = roleText(result, detection);
        return { value: detection.id, label: result.modelId + ' / ' + result.imageVariant + ' / ' + role + ' / ' + detection.label };
      }));
      const emptyLabel = options.length ? '未选择' : '没有可选准确框';
      $('selectedBox').innerHTML = '<option value="">' + emptyLabel + '</option>' + options.map((o) => '<option value="' + o.value + '">' + o.label + '</option>').join('');
      $('selectedBox').value = review.selectedPrimaryBox?.detectionId || '';
    }
    function renderQueryValidity(review) {
      const invalid = (review.queryImageValidity || 'valid') === 'invalid';
      $('queryInvalidReason').classList.toggle('visible', invalid);
      $('selectedBox').disabled = invalid;
      document.querySelectorAll('input[data-pick-box]').forEach((node) => {
        node.disabled = invalid || (review.boxVerdicts[node.dataset.pickBox] || 'accurate') !== 'accurate';
      });
    }
    function applyQueryValidityToReview(review) {
      review.queryImageValidity = $('queryValidity').value || 'valid';
      review.queryInvalidReason = $('queryInvalidReason').value.trim();
      if (review.queryImageValidity === 'invalid') {
        if (!review.queryInvalidReason) {
          alert('Query 图标为无效时，需要填写无效原因/重新采集提示。');
          return false;
        }
        review.noUsableBox = true;
        review.selectedPrimaryBox = null;
      } else {
        review.queryInvalidReason = '';
      }
      return true;
    }
    $('save').onclick = async () => {
      const sample = state.manifest.samples[currentIndex];
      const review = reviewFor(sample);
      const selectedId = $('selectedBox').value;
      const result = imageResults().find((r) => r.detections.some((d) => d.id === selectedId));
      const detection = result?.detections.find((d) => d.id === selectedId);
      review.reviewer = $('reviewer').value || 'local-reviewer';
      review.timestamp = new Date().toISOString();
      review.bestModel = $('bestModel').value;
      review.notes = $('notes').value;
      review.reviewStatus = 'approved';
      review.noUsableBox = false;
      if (!applyQueryValidityToReview(review)) return;
      review.selectedPrimaryBox = detection ? {
        modelId: result.modelId,
        imageVariant: result.imageVariant,
        detectionId: detection.id,
        box: detection.box,
        label: detection.label,
        score: detection.score,
      } : null;
      if (review.queryImageValidity === 'invalid') review.selectedPrimaryBox = null;
      const payload = await fetch('/api/review', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(review) }).then((r) => r.json());
      state.reviews = payload.reviewsByImage;
      draft = {};
      $('status').textContent = '已保存 ' + sample.id;
      renderList();
    };
    $('noBox').onclick = async () => {
      const sample = state.manifest.samples[currentIndex];
      const review = reviewFor(sample);
      review.reviewer = $('reviewer').value || 'local-reviewer';
      review.timestamp = new Date().toISOString();
      review.reviewStatus = 'approved';
      review.noUsableBox = true;
      review.selectedPrimaryBox = null;
      review.notes = $('notes').value;
      if (!applyQueryValidityToReview(review)) return;
      const payload = await fetch('/api/review', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(review) }).then((r) => r.json());
      state.reviews = payload.reviewsByImage;
      draft = {};
      $('status').textContent = '已保存无框 ' + sample.id;
      renderList();
    };
    $('bestModel').onchange = () => { const sample = state.manifest.samples[currentIndex]; const review = reviewFor(sample); review.bestModel = $('bestModel').value; draft[sample.id] = review; };
    $('queryValidity').onchange = () => {
      const sample = state.manifest.samples[currentIndex];
      const review = reviewFor(sample);
      review.queryImageValidity = $('queryValidity').value || 'valid';
      if (review.queryImageValidity === 'invalid') {
        review.noUsableBox = true;
        review.selectedPrimaryBox = null;
      } else {
        review.queryInvalidReason = '';
        $('queryInvalidReason').value = '';
      }
      draft[sample.id] = review;
      renderSelectedBox(review);
      renderCards(review);
      renderQueryValidity(review);
    };
    $('queryInvalidReason').oninput = () => {
      const sample = state.manifest.samples[currentIndex];
      const review = reviewFor(sample);
      review.queryInvalidReason = $('queryInvalidReason').value;
      draft[sample.id] = review;
    };
    $('selectedBox').onchange = () => {
      const sample = state.manifest.samples[currentIndex];
      const review = reviewFor(sample);
      setSelectedPrimary(review, $('selectedBox').value);
      draft[sample.id] = review;
      renderCards(review);
    };
    $('notes').oninput = () => { const sample = state.manifest.samples[currentIndex]; const review = reviewFor(sample); review.notes = $('notes').value; draft[sample.id] = review; };
    load();
  </script>
</body>
</html>`;
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function commandServeReview(args) {
  const detection = await readJson(args.detection || DEFAULT_DETECTION_RUN);
  const manifest = await readJson(args.manifest || DEFAULT_VARIANTS);
  const reviewPath = args.review || DEFAULT_REVIEW;
  let review = reviewArtifact(await readJson(reviewPath, {}), detection);
  const port = Number(args.port || 4188);
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://localhost:${port}`);
      if (request.method === "GET" && url.pathname === "/") {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(reviewPageHtml());
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/state") {
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({
          manifest,
          detection,
          review,
          reviews: Object.fromEntries(indexReviews(review)),
        }));
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/review") {
        const payload = JSON.parse(await readRequestBody(request));
        review = upsertReview(review, payload);
        await writeJson(reviewPath, review);
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ ok: true, review, reviewsByImage: Object.fromEntries(indexReviews(review)) }));
        return;
      }
      if (request.method === "GET" && url.pathname.startsWith("/file/")) {
        serveFile(response, decodeURIComponent(url.pathname.slice("/file/".length)));
        return;
      }
      response.writeHead(404);
      response.end("not found");
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(String(error.stack || error));
    }
  });
  server.listen(port, () => {
    console.log(`subject detection review server: http://127.0.0.1:${port}`);
    console.log(`review artifact: ${reviewPath}`);
  });
}

function detectionById(results) {
  const map = new Map();
  for (const result of results || []) {
    for (const detection of result.detections || []) {
      map.set(detection.id, { result, detection });
    }
  }
  return map;
}

function percentile(values, pct) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1));
  return round(sorted[index], 3);
}

function rate(numerator, denominator) {
  if (!denominator) return null;
  return round(numerator / denominator, 4);
}

function groupKey(result, fields) {
  return fields.map((field) => result[field] || "").join(" | ");
}

function reviewBestModelMatches(bestModel, result) {
  if (!bestModel) return false;
  const text = String(bestModel);
  return text === result.modelId
    || text === `${result.modelId}:${result.imageVariant}`
    || text === `${result.modelId} | ${result.imageVariant}`
    || text === `${result.modelId} / ${result.imageVariant}`;
}

function normalizedQueryImageValidity(review) {
  if (!review) return "missing";
  return review.queryImageValidity === "invalid" ? "invalid" : "valid";
}

function boxVerdictForReview(review, detectionId) {
  if (!review || !detectionId) return "";
  const explicit = review.boxVerdicts?.[detectionId];
  if (explicit) return explicit;
  if (review.reviewStatus === "approved" && review.noUsableBox && normalizedQueryImageValidity(review) === "valid") return "inaccurate";
  if (review.reviewStatus === "approved" && normalizedQueryImageValidity(review) === "valid") return "accurate";
  return "";
}

function computeMetrics(detectionRun, reviewPayload) {
  const reviews = indexReviews(reviewPayload);
  const resultGroups = new Map();
  for (const result of detectionRun.results || []) {
    const key = `${result.modelId} | ${result.imageVariant}`;
    if (!resultGroups.has(key)) resultGroups.set(key, []);
    resultGroups.get(key).push(result);
  }
  const selected = detectionById(detectionRun.results);
  const byModelVariant = {};
  for (const [key, results] of resultGroups.entries()) {
    const [modelId, imageVariant] = key.split(" | ");
    const times = results.map((result) => result.timings?.detectionMs).filter((value) => Number.isFinite(value));
    let ordinaryOk = 0;
    let ordinaryTotal = 0;
    let primaryAOk = 0;
    let primaryATotal = 0;
    let primaryBOk = 0;
    let primaryBTotal = 0;
    let imageSuccess = 0;
    let imageTotal = 0;
    let modelWins = 0;
    let modelWinTotal = 0;
    const accurateScores = [];
    const inaccurateScores = [];
    for (const result of results) {
      const review = reviews.get(result.imageId);
      if (!review) continue;
      if (normalizedQueryImageValidity(review) === "invalid") continue;
      const verdict = review.modelVerdicts?.[`${result.modelId}:${result.imageVariant}`] || {};
      let resultOrdinaryReviewed = false;
      for (const detection of result.detections || []) {
        const boxVerdict = boxVerdictForReview(review, detection.id);
        if (boxVerdict === "accurate") accurateScores.push(detection.score);
        if (boxVerdict === "inaccurate") inaccurateScores.push(detection.score);
        const isPrimary = detection.id === result.primaryBoxAId || detection.id === result.primaryBoxBId;
        if (!isPrimary && boxVerdict) {
          resultOrdinaryReviewed = true;
          ordinaryTotal += 1;
          if (boxVerdict === "accurate") ordinaryOk += 1;
        }
      }
      const primaryAVerdict = boxVerdictForReview(review, result.primaryBoxAId) || verdict.primaryA;
      const primaryBVerdict = boxVerdictForReview(review, result.primaryBoxBId) || verdict.primaryB;
      if (!resultOrdinaryReviewed && verdict.ordinary) {
        ordinaryTotal += 1;
        if (verdict.ordinary === "accurate" || verdict.ordinary === "mixed") ordinaryOk += 1;
      }
      if (primaryAVerdict) {
        primaryATotal += 1;
        if (primaryAVerdict === "accurate") primaryAOk += 1;
      }
      if (primaryBVerdict) {
        primaryBTotal += 1;
        if (primaryBVerdict === "accurate") primaryBOk += 1;
      }
      if (review.bestModel) {
        modelWinTotal += 1;
        if (reviewBestModelMatches(review.bestModel, result)) modelWins += 1;
      }
      if (review.selectedPrimaryBox?.detectionId) {
        imageTotal += 1;
        const picked = selected.get(review.selectedPrimaryBox.detectionId);
        if (picked?.result.modelId === result.modelId && picked.result.imageVariant === result.imageVariant) imageSuccess += 1;
      } else if (review.noUsableBox) {
        imageTotal += 1;
      }
    }
    byModelVariant[key] = {
      modelId,
      imageVariant,
      resultCount: results.length,
      reviewedImageCount: [...new Set(results.map((result) => result.imageId).filter((id) => reviews.has(id)))].length,
      ordinaryPrecision: rate(ordinaryOk, ordinaryTotal),
      primaryAAccuracy: rate(primaryAOk, primaryATotal),
      primaryBAccuracy: rate(primaryBOk, primaryBTotal),
      imageSuccessRate: rate(imageSuccess, imageTotal),
      modelWinRate: rate(modelWins, modelWinTotal),
      averageBoxCount: round(results.reduce((sum, result) => sum + (result.detections?.length || 0), 0) / Math.max(1, results.length), 3),
      failureRate: rate(results.filter((result) => result.status !== "ok").length, results.length),
      averageRecognitionMs: times.length ? round(times.reduce((sum, value) => sum + value, 0) / times.length, 3) : null,
      detectionP50Ms: percentile(times, 50),
      detectionP95Ms: percentile(times, 95),
      accurateBoxMinScore: accurateScores.length ? round(Math.min(...accurateScores), 6) : null,
      inaccurateBoxMaxScore: inaccurateScores.length ? round(Math.max(...inaccurateScores), 6) : null,
    };
  }

  const modelSummary = {};
  for (const modelId of [...new Set((detectionRun.results || []).map((result) => result.modelId))]) {
    const rows = Object.values(byModelVariant).filter((row) => row.modelId === modelId);
    const weighted = (field) => {
      const valid = rows.filter((row) => row[field] !== null);
      const total = valid.reduce((sum, row) => sum + row.resultCount, 0);
      if (!total) return null;
      return round(valid.reduce((sum, row) => sum + row[field] * row.resultCount, 0) / total, 4);
    };
    const times = (detectionRun.results || [])
      .filter((result) => result.modelId === modelId)
      .map((result) => result.timings?.detectionMs)
      .filter((value) => Number.isFinite(value));
    modelSummary[modelId] = {
      resultCount: rows.reduce((sum, row) => sum + row.resultCount, 0),
      ordinaryPrecision: weighted("ordinaryPrecision"),
      primaryAAccuracy: weighted("primaryAAccuracy"),
      primaryBAccuracy: weighted("primaryBAccuracy"),
      imageSuccessRate: weighted("imageSuccessRate"),
      modelWinRate: weighted("modelWinRate"),
      averageBoxCount: weighted("averageBoxCount"),
      failureRate: weighted("failureRate"),
      averageRecognitionMs: times.length ? round(times.reduce((sum, value) => sum + value, 0) / times.length, 3) : null,
      detectionP50Ms: percentile(times, 50),
      detectionP95Ms: percentile(times, 95),
      accurateBoxMinScore: Math.min(...rows.map((row) => row.accurateBoxMinScore).filter((value) => value !== null)),
      inaccurateBoxMaxScore: Math.max(...rows.map((row) => row.inaccurateBoxMaxScore).filter((value) => value !== null)),
    };
    if (!Number.isFinite(modelSummary[modelId].accurateBoxMinScore)) modelSummary[modelId].accurateBoxMinScore = null;
    if (!Number.isFinite(modelSummary[modelId].inaccurateBoxMaxScore)) modelSummary[modelId].inaccurateBoxMaxScore = null;
  }

  const grouped = {};
  for (const fields of [["categoryId"], ["sourceProvider"]]) {
    grouped[fields.join("+")] = {};
    const groups = new Map();
    for (const result of detectionRun.results || []) {
      const key = groupKey(result, fields);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(result);
    }
    for (const [key, rows] of groups.entries()) {
      grouped[fields.join("+")][key] = {
        resultCount: rows.length,
        imageCount: new Set(rows.map((row) => row.imageId)).size,
        averageBoxCount: round(rows.reduce((sum, row) => sum + (row.detections?.length || 0), 0) / Math.max(1, rows.length), 3),
        failureRate: rate(rows.filter((row) => row.status !== "ok").length, rows.length),
      };
    }
  }

  return { byModelVariant, modelSummary, grouped };
}

function recommendationFromMetrics(metrics) {
  const rows = Object.values(metrics.byModelVariant || {});
  const hasReviewSignal = rows.some((row) => [
    row.ordinaryPrecision,
    row.primaryAAccuracy,
    row.primaryBAccuracy,
    row.imageSuccessRate,
    row.modelWinRate,
  ].some((value) => value !== null));
  const variants = [...new Set(rows.map((row) => row.imageVariant))];
  let compressionRecommendation = "标注样本不足，暂不建议改变图片压缩策略。";
  if (variants.includes("original") && variants.some((variant) => variant.startsWith("normalized-"))) {
    const original = rows.filter((row) => row.imageVariant === "original" && row.averageRecognitionMs !== null);
    const normalized = rows.filter((row) => row.imageVariant.startsWith("normalized-") && row.averageRecognitionMs !== null);
    const avg = (items, field) => items.reduce((sum, item) => sum + Number(item[field] || 0), 0) / Math.max(1, items.length);
    const originalMs = avg(original, "averageRecognitionMs");
    const normalizedMs = avg(normalized, "averageRecognitionMs");
    const originalA = avg(original.filter((row) => row.primaryAAccuracy !== null), "primaryAAccuracy");
    const normalizedA = avg(normalized.filter((row) => row.primaryAAccuracy !== null), "primaryAAccuracy");
    if (!hasReviewSignal && normalizedMs > 0 && originalMs > 0) {
      compressionRecommendation = `人工标注不足，暂不判断压缩图是否影响准确性；未标注 smoke 中 normalized variant 平均耗时约为 original 的 ${round(normalizedMs / originalMs, 3)} 倍。`;
    } else if (normalizedMs > 0 && originalMs > 0 && normalizedMs <= originalMs * 0.85 && normalizedA >= originalA - 0.02) {
      compressionRecommendation = "建议主体检测前统一使用 normalized-1024：耗时明显下降，主框 A 准确率未显著下降。";
    } else if (normalizedMs > 0 && originalMs > 0) {
      compressionRecommendation = "暂不强制压缩：normalized-1024 的速度或准确性收益不够稳定，建议继续保留原图/压缩图对照评估。";
    }
  }
  const modelRows = Object.entries(metrics.modelSummary || {});
  const hasModelReviewSignal = modelRows.some(([, row]) => [
    row.ordinaryPrecision,
    row.primaryAAccuracy,
    row.primaryBAccuracy,
    row.imageSuccessRate,
    row.modelWinRate,
  ].some((value) => value !== null));
  let modelRecommendation = "没有足够的检测或标注结果生成模型推荐。";
  if (hasModelReviewSignal) {
    const scored = modelRows.map(([modelId, row]) => ({
      modelId,
      score: (row.modelWinRate ?? 0) * 4
        + (row.primaryAAccuracy ?? 0) * 2
        + (row.primaryBAccuracy ?? 0)
        + (1 - (row.failureRate ?? 1)) * 0.5
        + (1 - (row.averageRecognitionMs ?? 999999) / 999999) * 0.2,
      row,
    })).sort((left, right) => right.score - left.score);
    modelRecommendation = scored[0]
      ? `当前标注口径下建议优先使用 ${scored[0].modelId} 做主体检测；继续关注其主框 A/B 准确率和平均识别耗时。`
      : modelRecommendation;
  } else if (modelRows.length) {
    const smoke = modelRows
      .map(([modelId, row]) => `${modelId}: 平均 ${row.averageRecognitionMs ?? "-"}ms, 平均框数 ${row.averageBoxCount ?? "-"}, 失败率 ${row.failureRate ?? "-"}`)
      .join("；");
    modelRecommendation = `人工标注不足，暂不判断哪个模型更准确。未标注 smoke 仅供排障参考：${smoke}。`;
  }
  return { compressionRecommendation, modelRecommendation };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function boxDiv(result, detection) {
  const isA = detection.id === result.primaryBoxAId;
  const isB = detection.id === result.primaryBoxBId;
  const klass = isA && isB ? "ab" : isA ? "a" : isB ? "b" : "o";
  const label = isA && isB ? "A+B" : isA ? "A" : isB ? "B" : "普通";
  return `<div class="box ${klass}" style="left:${detection.box.x}%;top:${detection.box.y}%;width:${detection.box.w}%;height:${detection.box.h}%"><span>#${detection.rankByScore} ${label} ${escapeHtml(detection.label)}</span></div>`;
}

function renderHtmlReport({ manifest, detectionRun, reviewPayload, metrics, recommendations }) {
  const reviews = indexReviews(reviewPayload);
  const samples = manifest.samples || [];
  const sampleBlocks = samples.map((sample) => {
    const rows = (detectionRun.results || []).filter((result) => result.imageId === sample.id);
    const review = reviews.get(sample.id);
    const cards = rows.map((result) => {
      const src = pathToFileURL(resolveRootPath(result.image.path)).toString();
      return `<article class="card">
        <h3>${escapeHtml(result.modelId)} / ${escapeHtml(result.imageVariant)}</h3>
        <p>耗时 ${result.timings?.detectionMs ?? "-"} ms · 框 ${result.detections?.length || 0} · ${escapeHtml(result.status)}</p>
        <div class="stage"><div class="canvas"><img src="${src}" />${(result.detections || []).map((detection) => boxDiv(result, detection)).join("")}</div></div>
      </article>`;
    }).join("");
    return `<section>
      <h2>${escapeHtml(sample.displayName || sample.categoryId)} <small>${escapeHtml(sample.id)}</small></h2>
      <p>来源 ${escapeHtml(sample.sourceProvider || "")} · 标注 ${review ? escapeHtml(review.reviewStatus || "") : "未标注"} · 最佳模型 ${escapeHtml(review?.bestModel || "-")} · 采用框 ${escapeHtml(review?.selectedPrimaryBox?.detectionId || (review?.noUsableBox ? "无可用框" : "-"))}</p>
      <div class="grid">${cards}</div>
    </section>`;
  }).join("");
  const modelRows = Object.entries(metrics.modelSummary || {}).map(([modelId, row]) => `<tr>
    <td>${escapeHtml(modelId)}</td><td>${row.resultCount}</td><td>${row.averageRecognitionMs ?? "-"}</td><td>${row.detectionP50Ms ?? "-"}</td><td>${row.detectionP95Ms ?? "-"}</td>
    <td>${row.primaryAAccuracy ?? "-"}</td><td>${row.primaryBAccuracy ?? "-"}</td><td>${row.modelWinRate ?? "-"}</td><td>${row.accurateBoxMinScore ?? "-"}</td><td>${row.inaccurateBoxMaxScore ?? "-"}</td>
  </tr>`).join("");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>主体检测评估报告</title>
  <style>
    body { margin:0; font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#172033; background:#f7f8fb; }
    header { padding:22px 28px; background:white; border-bottom:1px solid #d8dde6; }
    main { padding:22px 28px; }
    h1 { margin:0 0 6px; font-size:24px; }
    h2 { margin-top:28px; font-size:18px; }
    h3 { margin:0 0 4px; font-size:15px; }
    table { border-collapse:collapse; background:white; border:1px solid #d8dde6; width:100%; margin:14px 0; }
    th, td { border-bottom:1px solid #e8ecf2; padding:8px 10px; text-align:left; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:12px; }
    .card { background:white; border:1px solid #d8dde6; border-radius:8px; padding:10px; }
    .card p { margin:0 0 8px; color:#667085; }
    .stage { background:#111827; display:flex; justify-content:center; align-items:center; overflow:auto; min-height:240px; }
    .canvas { position:relative; display:inline-block; line-height:0; max-width:100%; }
    .canvas img { max-width:100%; max-height:520px; display:block; }
    .box { position:absolute; border:2px solid #2563eb; pointer-events:none; }
    .box.a { border-color:#169b62; box-shadow:0 0 0 2px rgba(22,155,98,.25); }
    .box.b { border-color:#d97706; box-shadow:0 0 0 2px rgba(217,119,6,.25); }
    .box.ab { border-color:#169b62; outline:2px solid #d97706; outline-offset:2px; }
    .box span { position:absolute; left:0; top:-22px; padding:2px 5px; color:white; background:#2563eb; font-size:12px; white-space:nowrap; }
    .box.a span { background:#169b62; } .box.b span { background:#d97706; } .box.ab span { background:#394150; }
    small { color:#667085; font-weight:400; }
  </style>
</head>
<body>
  <header>
    <h1>主体检测评估报告</h1>
    <div>${escapeHtml(detectionRun.version)} · ${escapeHtml(detectionRun.generatedAt || "")}</div>
  </header>
  <main>
    <h2>结论</h2>
    <p>${escapeHtml(recommendations.modelRecommendation)}</p>
    <p>${escapeHtml(recommendations.compressionRecommendation)}</p>
    <h2>模型平均识别耗时</h2>
    <table><thead><tr><th>模型</th><th>结果数</th><th>平均识别耗时 ms</th><th>p50 ms</th><th>p95 ms</th><th>主框A准确率</th><th>主框B准确率</th><th>人工胜率</th><th>准确框最低分</th><th>不准确框最高分</th></tr></thead><tbody>${modelRows}</tbody></table>
    <h2>样本明细</h2>
    ${sampleBlocks}
  </main>
</body>
</html>`;
}

function renderMarkdownReport({ detectionRun, metrics, recommendations }) {
  const lines = [
    "# 主体检测评估报告",
    "",
    `- Run: ${detectionRun.version}`,
    `- Generated: ${detectionRun.generatedAt || ""}`,
    "",
    "## 结论",
    "",
    `- 模型建议：${recommendations.modelRecommendation}`,
    `- 压缩建议：${recommendations.compressionRecommendation}`,
    "",
    "## 模型平均识别耗时",
    "",
    "| 模型 | 结果数 | 平均识别耗时 ms | p50 ms | p95 ms | 主框A准确率 | 主框B准确率 | 人工胜率 | 准确框最低分 | 不准确框最高分 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const [modelId, row] of Object.entries(metrics.modelSummary || {})) {
    lines.push(`| ${modelId} | ${row.resultCount} | ${row.averageRecognitionMs ?? "-"} | ${row.detectionP50Ms ?? "-"} | ${row.detectionP95Ms ?? "-"} | ${row.primaryAAccuracy ?? "-"} | ${row.primaryBAccuracy ?? "-"} | ${row.modelWinRate ?? "-"} | ${row.accurateBoxMinScore ?? "-"} | ${row.inaccurateBoxMaxScore ?? "-"} |`);
  }
  return `${lines.join("\n")}\n`;
}

function formatReportValue(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function buildSubjectRecallReport({ manifest, detectionRun, reviewPayload, metrics, recommendations }) {
  const reviews = indexReviews(reviewPayload);
  const selectedDetections = detectionById(detectionRun.results || []);
  const resultsByImage = new Map();
  for (const result of detectionRun.results || []) {
    if (!resultsByImage.has(result.imageId)) resultsByImage.set(result.imageId, []);
    resultsByImage.get(result.imageId).push(result);
  }

  const aggregates = new Map();
  const ensureAggregate = (result) => {
    const key = `${result.modelId} | ${result.imageVariant}`;
    if (!aggregates.has(key)) {
      aggregates.set(key, {
        key,
        modelId: result.modelId,
        imageVariant: result.imageVariant,
        resultCount: 0,
        reviewedResultCount: 0,
        detectedBoxCount: 0,
        reviewedBoxCount: 0,
        accurateBoxCount: 0,
        inaccurateBoxCount: 0,
        imageRecallSuccessCount: 0,
        selectedPrimaryCount: 0,
        modelWinCount: 0,
        modelWinTotal: 0,
        detectionTimes: [],
        accurateScores: [],
        inaccurateScores: [],
      });
    }
    return aggregates.get(key);
  };

  for (const result of detectionRun.results || []) {
    const aggregate = ensureAggregate(result);
    aggregate.resultCount += 1;
    aggregate.detectedBoxCount += result.detections?.length || 0;
    if (Number.isFinite(result.timings?.detectionMs)) aggregate.detectionTimes.push(result.timings.detectionMs);
  }

  const sampleRows = [];
  const invalidImages = [];
  for (const sample of manifest.samples || []) {
    const review = reviews.get(sample.id);
    const reviewed = review?.reviewStatus === "approved";
    const queryValidity = reviewed ? normalizedQueryImageValidity(review) : "unreviewed";
    if (reviewed && queryValidity === "invalid") {
      invalidImages.push({
        imageId: sample.id,
        categoryId: sample.categoryId,
        displayName: sample.displayName,
        reason: review.queryInvalidReason || "",
      });
    }
    const resultRows = [];
    for (const result of resultsByImage.get(sample.id) || []) {
      let accurateBoxCount = 0;
      let inaccurateBoxCount = 0;
      let reviewedBoxCount = 0;
      if (reviewed && queryValidity === "valid") {
        for (const detection of result.detections || []) {
          const verdict = boxVerdictForReview(review, detection.id);
          if (!verdict) continue;
          reviewedBoxCount += 1;
          if (verdict === "accurate") {
            accurateBoxCount += 1;
            ensureAggregate(result).accurateScores.push(detection.score);
          }
          if (verdict === "inaccurate") {
            inaccurateBoxCount += 1;
            ensureAggregate(result).inaccurateScores.push(detection.score);
          }
        }
        const aggregate = ensureAggregate(result);
        aggregate.reviewedResultCount += 1;
        aggregate.reviewedBoxCount += reviewedBoxCount;
        aggregate.accurateBoxCount += accurateBoxCount;
        aggregate.inaccurateBoxCount += inaccurateBoxCount;
        if (accurateBoxCount > 0) aggregate.imageRecallSuccessCount += 1;
        if (review.bestModel) {
          aggregate.modelWinTotal += 1;
          if (reviewBestModelMatches(review.bestModel, result)) aggregate.modelWinCount += 1;
        }
        const picked = selectedDetections.get(review.selectedPrimaryBox?.detectionId);
        if (picked?.result.modelId === result.modelId && picked.result.imageVariant === result.imageVariant) {
          aggregate.selectedPrimaryCount += 1;
        }
      }
      resultRows.push({
        modelId: result.modelId,
        imageVariant: result.imageVariant,
        detectionCount: result.detections?.length || 0,
        accurateBoxCount,
        inaccurateBoxCount,
        reviewedBoxCount,
        hasAccurateBox: accurateBoxCount > 0,
        primaryAId: result.primaryBoxAId || "",
        primaryBId: result.primaryBoxBId || "",
        selectedPrimary: review?.selectedPrimaryBox?.detectionId
          ? reviewBestModelMatches(`${result.modelId}:${result.imageVariant}`, selectedDetections.get(review.selectedPrimaryBox.detectionId)?.result || {})
          : false,
        detectionMs: result.timings?.detectionMs ?? null,
      });
    }
    sampleRows.push({
      imageId: sample.id,
      categoryId: sample.categoryId,
      displayName: sample.displayName,
      sourceProvider: sample.sourceProvider || "",
      queryValidity,
      invalidReason: review?.queryInvalidReason || "",
      reviewStatus: review?.reviewStatus || "not-reviewed",
      bestModel: review?.bestModel || "",
      selectedPrimaryBox: review?.selectedPrimaryBox || null,
      resultRows,
    });
  }

  const modelVariantRows = [...aggregates.values()].map((row) => ({
    key: row.key,
    modelId: row.modelId,
    imageVariant: row.imageVariant,
    resultCount: row.resultCount,
    reviewedResultCount: row.reviewedResultCount,
    detectedBoxCount: row.detectedBoxCount,
    reviewedBoxCount: row.reviewedBoxCount,
    accurateBoxCount: row.accurateBoxCount,
    inaccurateBoxCount: row.inaccurateBoxCount,
    boxPrecision: rate(row.accurateBoxCount, row.reviewedBoxCount),
    imageRecallSuccessRate: rate(row.imageRecallSuccessCount, row.reviewedResultCount),
    selectedPrimaryCount: row.selectedPrimaryCount,
    modelWinRate: rate(row.modelWinCount, row.modelWinTotal),
    averageDetectedBoxes: row.resultCount ? round(row.detectedBoxCount / row.resultCount, 3) : null,
    averageAccurateBoxes: row.reviewedResultCount ? round(row.accurateBoxCount / row.reviewedResultCount, 3) : null,
    averageDetectionMs: row.detectionTimes.length ? round(row.detectionTimes.reduce((sum, value) => sum + value, 0) / row.detectionTimes.length, 3) : null,
    detectionP50Ms: percentile(row.detectionTimes, 50),
    detectionP95Ms: percentile(row.detectionTimes, 95),
    accurateBoxMinScore: row.accurateScores.length ? round(Math.min(...row.accurateScores), 6) : null,
    inaccurateBoxMaxScore: row.inaccurateScores.length ? round(Math.max(...row.inaccurateScores), 6) : null,
  })).sort((left, right) => left.key.localeCompare(right.key));

  const reviewedImages = sampleRows.filter((row) => row.reviewStatus === "approved");
  const validReviewedImages = reviewedImages.filter((row) => row.queryValidity === "valid");
  return {
    kind: "vision-subject-recall-eval-report",
    version: `${detectionRun.version}-subject-recall-report`,
    generatedAt: nowIso(),
    detectionRunVersion: detectionRun.version,
    reviewVersion: reviewPayload.version,
    manifestVersion: manifest.version || "",
    summary: {
      sampleCount: sampleRows.length,
      approvedReviewCount: reviewedImages.length,
      validReviewedImageCount: validReviewedImages.length,
      invalidReviewedImageCount: invalidImages.length,
      selectedPrimaryCount: validReviewedImages.filter((row) => row.selectedPrimaryBox?.detectionId).length,
      defaultVerdictPolicy: "query 图默认有效；候选框未显式标为不准确时按准确统计。",
      recommendation: recommendations.modelRecommendation,
    },
    metrics,
    modelVariantRows,
    invalidImages,
    sampleRows,
  };
}

function summarizeIndexCoverage(indexPayload) {
  const byCategory = new Map();
  for (const entry of indexPayload.entries || []) {
    if (!byCategory.has(entry.categoryId)) byCategory.set(entry.categoryId, { entries: 0, embeddings: 0 });
    const row = byCategory.get(entry.categoryId);
    row.entries += 1;
    if (Array.isArray(entry.embedding) && entry.embedding.length > 0) row.embeddings += 1;
  }
  return byCategory;
}

function buildNamingRetrievalReport({ manifest, detectionRun, reviewPayload, indexPayload, namingEvalReport }) {
  const reviews = indexReviews(reviewPayload);
  const selectedBoxes = exportApprovedBoxes({ manifest, detectionRun, reviewPayload });
  const samples = new Map((manifest.samples || []).map((sample) => [sample.id, sample]));
  const indexCoverage = summarizeIndexCoverage(indexPayload || {});
  const selectedRows = selectedBoxes.map((box) => {
    const sample = samples.get(box.imageId) || {};
    const coverage = indexCoverage.get(box.categoryId) || { entries: 0, embeddings: 0 };
    return {
      imageId: box.imageId,
      categoryId: box.categoryId,
      displayName: sample.displayName || "",
      selectedModel: `${box.modelId}:${box.imageVariant}`,
      detectionId: box.detectionId,
      detectionLabel: box.label,
      detectionScore: box.score,
      indexEntryCount: coverage.entries,
      embeddingCount: coverage.embeddings,
      retrievalEvaluable: coverage.embeddings > 0,
    };
  });

  const namingSummary = namingEvalReport?.summary || {};
  const namingCases = [];
  for (const image of namingEvalReport?.images || []) {
    for (const row of image.rows || []) {
      namingCases.push({
        imageId: image.imageId,
        expectedName: row.truth?.name || "",
        expectedCategoryId: row.truth?.categoryId || "",
        predictedName: row.prediction?.name || "",
        predictedCategoryId: row.prediction?.categoryId || "",
        iou: row.iou ?? null,
        boxMatch: Boolean(row.boxMatch),
        categoryMatch: Boolean(row.categoryMatch),
        nameMatch: Boolean(row.nameMatch),
        combinedMatch: Boolean(row.combinedMatch),
        top3: (row.prediction?.matches || row.prediction?.topIndexMatches || []).slice(0, 3).map((match) => ({
          entryId: match.entryId,
          categoryId: match.categoryId,
          displayName: match.displayName,
          score: match.score,
          imagePath: match.imagePath || match.sourceImagePath,
        })),
      });
    }
  }
  const subjectCategoriesMissingIndex = selectedRows
    .filter((row) => row.embeddingCount === 0)
    .map((row) => ({ imageId: row.imageId, categoryId: row.categoryId, displayName: row.displayName }));

  return {
    kind: "vision-naming-retrieval-eval-report",
    version: `${detectionRun.version}-naming-retrieval-report`,
    generatedAt: nowIso(),
    detectionRunVersion: detectionRun.version,
    reviewVersion: reviewPayload.version,
    manifestVersion: manifest.version || "",
    indexVersion: indexPayload?.version || "",
    existingNamingEvalVersion: namingEvalReport?.version || "",
    summary: {
      selectedPrimaryCount: selectedRows.length,
      selectedPrimaryWithIndexEmbeddingCount: selectedRows.filter((row) => row.retrievalEvaluable).length,
      subjectReviewRetrievalEvaluableRate: rate(selectedRows.filter((row) => row.retrievalEvaluable).length, selectedRows.length),
      existingEvalImageCount: namingSummary.imageCount ?? null,
      existingEvalObjectCount: namingSummary.objectCount ?? null,
      existingBoxRecallAtIoU: namingSummary.boxRecallAtIoU ?? null,
      existingTop1RetrievalAccuracy: namingSummary.top1RetrievalAccuracy ?? namingSummary.categoryAccuracy ?? null,
      existingTop3RetrievalAccuracy: namingSummary.top3RetrievalAccuracy ?? null,
      existingNameAccuracy: namingSummary.nameAccuracy ?? null,
      existingCombinedAccuracy: namingSummary.combinedAccuracy ?? null,
      existingAverageDetectionMs: namingSummary.timings?.detectionMs?.mean ?? null,
      existingAverageEmbeddingMs: namingSummary.timings?.embeddingMs?.mean ?? null,
      existingAverageRetrievalMs: namingSummary.timings?.retrievalMs?.mean ?? null,
      note: "主体标注集当前用于检查 selected crop 是否具备命名检索条件；实际 topK 命名准确率引用已有 50 张 household-index 本地 OWL-ViT + CLIP benchmark。",
    },
    selectedRows,
    subjectCategoriesMissingIndex,
    existingNamingCases: namingCases,
    existingNamingConfusions: namingSummary.confusions || [],
  };
}

function renderSubjectRecallMarkdown(report) {
  const lines = [
    "# 主体召回评测报告",
    "",
    `- Run: ${report.detectionRunVersion}`,
    `- Review: ${report.reviewVersion}`,
    `- Generated: ${report.generatedAt}`,
    `- 默认标注口径：${report.summary.defaultVerdictPolicy}`,
    "",
    "## Summary",
    "",
    `- 样本数：${report.summary.sampleCount}`,
    `- 已审核：${report.summary.approvedReviewCount}`,
    `- 有效 query：${report.summary.validReviewedImageCount}`,
    `- 无效 query：${report.summary.invalidReviewedImageCount}`,
    `- 已选最终主框：${report.summary.selectedPrimaryCount}`,
    `- 结论：${report.summary.recommendation}`,
    "",
    "## Model Variant",
    "",
    "| 模型 | Variant | 已审核结果 | 框准确率 | 图级召回成功率 | 平均准确框/图 | 被选主框数 | 人工最佳胜率 | 平均耗时 ms | p50 ms | p95 ms | 准确框最低分 | 不准确框最高分 |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const row of report.modelVariantRows) {
    lines.push(`| ${row.modelId} | ${row.imageVariant} | ${row.reviewedResultCount} | ${formatReportValue(row.boxPrecision)} | ${formatReportValue(row.imageRecallSuccessRate)} | ${formatReportValue(row.averageAccurateBoxes)} | ${row.selectedPrimaryCount} | ${formatReportValue(row.modelWinRate)} | ${formatReportValue(row.averageDetectionMs)} | ${formatReportValue(row.detectionP50Ms)} | ${formatReportValue(row.detectionP95Ms)} | ${formatReportValue(row.accurateBoxMinScore)} | ${formatReportValue(row.inaccurateBoxMaxScore)} |`);
  }
  if (report.invalidImages.length) {
    lines.push("", "## 无效 Query", "", "| Image | Category | Reason |", "| --- | --- | --- |");
    for (const row of report.invalidImages) {
      lines.push(`| ${row.imageId} | ${row.categoryId} | ${row.reason || "-"} |`);
    }
  }
  lines.push("", "## 样本明细", "", "| Image | 类目 | 有效性 | 最佳模型 | 最终主框 |", "| --- | --- | --- | --- | --- |");
  for (const row of report.sampleRows) {
    lines.push(`| ${row.imageId} | ${row.displayName || row.categoryId} | ${row.queryValidity} | ${row.bestModel || "-"} | ${row.selectedPrimaryBox?.detectionId || "-"} |`);
  }
  return `${lines.join("\n")}\n`;
}

function renderSubjectRecallHtml(report) {
  const modelRows = report.modelVariantRows.map((row) => `<tr><td>${escapeHtml(row.modelId)}</td><td>${escapeHtml(row.imageVariant)}</td><td>${row.reviewedResultCount}</td><td>${formatReportValue(row.boxPrecision)}</td><td>${formatReportValue(row.imageRecallSuccessRate)}</td><td>${formatReportValue(row.averageAccurateBoxes)}</td><td>${row.selectedPrimaryCount}</td><td>${formatReportValue(row.modelWinRate)}</td><td>${formatReportValue(row.averageDetectionMs)}</td><td>${formatReportValue(row.accurateBoxMinScore)}</td><td>${formatReportValue(row.inaccurateBoxMaxScore)}</td></tr>`).join("");
  const sampleRows = report.sampleRows.map((row) => `<tr><td>${escapeHtml(row.imageId)}</td><td>${escapeHtml(row.displayName || row.categoryId)}</td><td>${escapeHtml(row.queryValidity)}</td><td>${escapeHtml(row.bestModel || "-")}</td><td>${escapeHtml(row.selectedPrimaryBox?.detectionId || "-")}</td></tr>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>主体召回评测报告</title><style>
body{margin:0;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f7f8fb}header{padding:22px 28px;background:#fff;border-bottom:1px solid #d8dde6}main{padding:22px 28px}h1{margin:0 0 6px;font-size:24px}h2{font-size:18px;margin-top:26px}table{border-collapse:collapse;background:#fff;border:1px solid #d8dde6;width:100%;margin:14px 0}th,td{border-bottom:1px solid #e8ecf2;padding:8px 10px;text-align:left;vertical-align:top}p{max-width:1100px}.note{color:#667085}</style></head><body><header><h1>主体召回评测报告</h1><div>${escapeHtml(report.generatedAt)}</div></header><main>
<h2>结论</h2><p>${escapeHtml(report.summary.recommendation)}</p><p class="note">${escapeHtml(report.summary.defaultVerdictPolicy)}</p>
<h2>概览</h2><table><tbody><tr><th>样本数</th><td>${report.summary.sampleCount}</td></tr><tr><th>已审核</th><td>${report.summary.approvedReviewCount}</td></tr><tr><th>有效 query</th><td>${report.summary.validReviewedImageCount}</td></tr><tr><th>无效 query</th><td>${report.summary.invalidReviewedImageCount}</td></tr><tr><th>已选最终主框</th><td>${report.summary.selectedPrimaryCount}</td></tr></tbody></table>
<h2>模型 Variant</h2><table><thead><tr><th>模型</th><th>Variant</th><th>已审核结果</th><th>框准确率</th><th>图级召回成功率</th><th>平均准确框/图</th><th>被选主框数</th><th>人工最佳胜率</th><th>平均耗时 ms</th><th>准确框最低分</th><th>不准确框最高分</th></tr></thead><tbody>${modelRows}</tbody></table>
<h2>样本明细</h2><table><thead><tr><th>Image</th><th>类目</th><th>有效性</th><th>最佳模型</th><th>最终主框</th></tr></thead><tbody>${sampleRows}</tbody></table>
</main></body></html>`;
}

function renderNamingRetrievalMarkdown(report) {
  const lines = [
    "# 命名检索评测报告",
    "",
    `- Run: ${report.detectionRunVersion}`,
    `- Index: ${report.indexVersion || "-"}`,
    `- Existing naming eval: ${report.existingNamingEvalVersion || "-"}`,
    `- Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- 主体标注选中主框：${report.summary.selectedPrimaryCount}`,
    `- 具备 index embedding 覆盖的选中主框：${report.summary.selectedPrimaryWithIndexEmbeddingCount}`,
    `- 标注集命名检索可评估率：${formatReportValue(report.summary.subjectReviewRetrievalEvaluableRate)}`,
    `- 已有 50 图 Top1 命中率：${formatReportValue(report.summary.existingTop1RetrievalAccuracy)}`,
    `- 已有 50 图 Top3 命中率：${formatReportValue(report.summary.existingTop3RetrievalAccuracy)}`,
    `- 已有 50 图名称准确率：${formatReportValue(report.summary.existingNameAccuracy)}`,
    `- 已有 50 图 combined 准确率：${formatReportValue(report.summary.existingCombinedAccuracy)}`,
    `- 平均检测耗时：${formatReportValue(report.summary.existingAverageDetectionMs)} ms`,
    `- 平均 embedding 耗时：${formatReportValue(report.summary.existingAverageEmbeddingMs)} ms`,
    `- 平均检索耗时：${formatReportValue(report.summary.existingAverageRetrievalMs)} ms`,
    "",
    `> ${report.summary.note}`,
    "",
    "## 标注主框索引覆盖",
    "",
    "| Image | 类目 | 主框模型 | 检测分 | Index entries | Embeddings | 可评估 |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
  ];
  for (const row of report.selectedRows) {
    lines.push(`| ${row.imageId} | ${row.displayName || row.categoryId} | ${row.selectedModel} | ${formatReportValue(row.detectionScore)} | ${row.indexEntryCount} | ${row.embeddingCount} | ${row.retrievalEvaluable ? "yes" : "no"} |`);
  }
  lines.push("", "## 已有命名 Benchmark 明细", "", "| Image | GT | Pred | IoU | Box | Category | Name | Combined | Top3 |", "| --- | --- | --- | ---: | --- | --- | --- | --- | --- |");
  for (const row of report.existingNamingCases.slice(0, 80)) {
    const top3 = row.top3.map((match, index) => `#${index + 1} ${match.displayName || match.categoryId} ${formatReportValue(match.score)}`).join("<br>");
    lines.push(`| ${row.imageId} | ${row.expectedName} / ${row.expectedCategoryId} | ${row.predictedName || "-"} / ${row.predictedCategoryId || "-"} | ${formatReportValue(row.iou)} | ${row.boxMatch} | ${row.categoryMatch} | ${row.nameMatch} | ${row.combinedMatch} | ${top3 || "-"} |`);
  }
  return `${lines.join("\n")}\n`;
}

function renderNamingRetrievalHtml(report) {
  const selectedRows = report.selectedRows.map((row) => `<tr><td>${escapeHtml(row.imageId)}</td><td>${escapeHtml(row.displayName || row.categoryId)}</td><td>${escapeHtml(row.selectedModel)}</td><td>${formatReportValue(row.detectionScore)}</td><td>${row.indexEntryCount}</td><td>${row.embeddingCount}</td><td>${row.retrievalEvaluable ? "yes" : "no"}</td></tr>`).join("");
  const caseRows = report.existingNamingCases.slice(0, 80).map((row) => `<tr><td>${escapeHtml(row.imageId)}</td><td>${escapeHtml(`${row.expectedName} / ${row.expectedCategoryId}`)}</td><td>${escapeHtml(`${row.predictedName || "-"} / ${row.predictedCategoryId || "-"}`)}</td><td>${formatReportValue(row.iou)}</td><td>${row.boxMatch}</td><td>${row.categoryMatch}</td><td>${row.nameMatch}</td><td>${row.combinedMatch}</td><td>${row.top3.map((match, index) => `#${index + 1} ${escapeHtml(match.displayName || match.categoryId)} ${formatReportValue(match.score)}`).join("<br>") || "-"}</td></tr>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>命名检索评测报告</title><style>
body{margin:0;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f7f8fb}header{padding:22px 28px;background:#fff;border-bottom:1px solid #d8dde6}main{padding:22px 28px}h1{margin:0 0 6px;font-size:24px}h2{font-size:18px;margin-top:26px}table{border-collapse:collapse;background:#fff;border:1px solid #d8dde6;width:100%;margin:14px 0}th,td{border-bottom:1px solid #e8ecf2;padding:8px 10px;text-align:left;vertical-align:top}p{max-width:1100px}.note{color:#667085}</style></head><body><header><h1>命名检索评测报告</h1><div>${escapeHtml(report.generatedAt)}</div></header><main>
<h2>概览</h2><table><tbody><tr><th>主体标注选中主框</th><td>${report.summary.selectedPrimaryCount}</td></tr><tr><th>具备 index embedding 覆盖</th><td>${report.summary.selectedPrimaryWithIndexEmbeddingCount}</td></tr><tr><th>标注集命名检索可评估率</th><td>${formatReportValue(report.summary.subjectReviewRetrievalEvaluableRate)}</td></tr><tr><th>已有 50 图 Top1</th><td>${formatReportValue(report.summary.existingTop1RetrievalAccuracy)}</td></tr><tr><th>已有 50 图 Top3</th><td>${formatReportValue(report.summary.existingTop3RetrievalAccuracy)}</td></tr><tr><th>已有 50 图 combined</th><td>${formatReportValue(report.summary.existingCombinedAccuracy)}</td></tr><tr><th>平均检测耗时</th><td>${formatReportValue(report.summary.existingAverageDetectionMs)} ms</td></tr><tr><th>平均 embedding 耗时</th><td>${formatReportValue(report.summary.existingAverageEmbeddingMs)} ms</td></tr><tr><th>平均检索耗时</th><td>${formatReportValue(report.summary.existingAverageRetrievalMs)} ms</td></tr></tbody></table>
<p class="note">${escapeHtml(report.summary.note)}</p>
<h2>标注主框索引覆盖</h2><table><thead><tr><th>Image</th><th>类目</th><th>主框模型</th><th>检测分</th><th>Index entries</th><th>Embeddings</th><th>可评估</th></tr></thead><tbody>${selectedRows}</tbody></table>
<h2>已有命名 Benchmark 明细</h2><table><thead><tr><th>Image</th><th>GT</th><th>Pred</th><th>IoU</th><th>Box</th><th>Category</th><th>Name</th><th>Combined</th><th>Top3</th></tr></thead><tbody>${caseRows}</tbody></table>
</main></body></html>`;
}

async function commandSplitReports(args) {
  const detectionRun = await readJson(args.detection || DEFAULT_DETECTION_RUN);
  const manifest = await readJson(args.manifest || DEFAULT_VARIANTS);
  const reviewPayload = reviewArtifact(await readJson(args.review || DEFAULT_REVIEW, {}), detectionRun);
  const metrics = computeMetrics(detectionRun, reviewPayload);
  const recommendations = recommendationFromMetrics(metrics);
  const indexPayload = await readJson(args.index || "data/generated/vision-model-benchmark-raw-household-index-cn/index.json", { entries: [] });
  const namingEvalReport = await readJson(args.namingReport || DEFAULT_NAMING_REPORT, {});
  const commonBase = args.outputBase || "";
  const subjectBase = args.subjectOutputBase || (commonBase ? `${commonBase}.subject-recall` : DEFAULT_SUBJECT_RECALL_REPORT_BASE);
  const namingBase = args.namingOutputBase || (commonBase ? `${commonBase}.naming-retrieval` : DEFAULT_NAMING_RETRIEVAL_REPORT_BASE);
  const subjectReport = buildSubjectRecallReport({ manifest, detectionRun, reviewPayload, metrics, recommendations });
  const namingReport = buildNamingRetrievalReport({ manifest, detectionRun, reviewPayload, indexPayload, namingEvalReport });
  await writeJson(`${subjectBase}.json`, subjectReport);
  await writeText(`${subjectBase}.md`, renderSubjectRecallMarkdown(subjectReport));
  await writeText(`${subjectBase}.html`, renderSubjectRecallHtml(subjectReport));
  await writeJson(`${namingBase}.json`, namingReport);
  await writeText(`${namingBase}.md`, renderNamingRetrievalMarkdown(namingReport));
  await writeText(`${namingBase}.html`, renderNamingRetrievalHtml(namingReport));
}

async function commandReport(args) {
  const detectionRun = await readJson(args.detection || DEFAULT_DETECTION_RUN);
  const manifest = await readJson(args.manifest || DEFAULT_VARIANTS);
  const reviewPayload = reviewArtifact(await readJson(args.review || DEFAULT_REVIEW, {}), detectionRun);
  const metrics = computeMetrics(detectionRun, reviewPayload);
  const recommendations = recommendationFromMetrics(metrics);
  const base = args.outputBase || DEFAULT_REPORT_BASE;
  const jsonPayload = {
    kind: "vision-subject-detection-eval-report",
    version: `${detectionRun.version}-report`,
    generatedAt: nowIso(),
    detectionRunVersion: detectionRun.version,
    reviewVersion: reviewPayload.version,
    manifestVersion: manifest.version || "",
    taxonomyVersion: detectionRun.taxonomyVersion || manifest.taxonomyVersion || "",
    metrics,
    recommendations,
  };
  await writeJson(`${base}.json`, jsonPayload);
  await writeText(`${base}.md`, renderMarkdownReport({ detectionRun, metrics, recommendations }));
  await writeText(`${base}.html`, renderHtmlReport({ manifest, detectionRun, reviewPayload, metrics, recommendations }));
}

function exportApprovedBoxes({ manifest, detectionRun, reviewPayload }) {
  const selected = detectionById(detectionRun.results || []);
  const samples = new Map((manifest.samples || []).map((sample) => [sample.id, sample]));
  const boxes = [];
  for (const review of reviewPayload.reviews || []) {
    if (review.queryImageValidity === "invalid") continue;
    if (review.reviewStatus !== "approved" || review.noUsableBox || !review.selectedPrimaryBox?.detectionId) continue;
    const picked = selected.get(review.selectedPrimaryBox.detectionId);
    const sample = samples.get(review.imageId);
    if (!picked || !sample) continue;
    boxes.push({
      imageId: review.imageId,
      categoryId: review.categoryId || sample.categoryId,
      sourceImagePath: sample.localPath || sample.imagePath,
      modelId: picked.result.modelId,
      imageVariant: picked.result.imageVariant,
      detectionId: picked.detection.id,
      box: picked.detection.box,
      label: picked.detection.label,
      score: picked.detection.score,
      reviewStatus: review.reviewStatus,
      reviewer: review.reviewer || "",
      timestamp: review.timestamp || "",
    });
  }
  return boxes;
}

async function commandExportBoxes(args) {
  const detectionRun = await readJson(args.detection || DEFAULT_DETECTION_RUN);
  const manifest = await readJson(args.manifest || DEFAULT_VARIANTS);
  const reviewPayload = reviewArtifact(await readJson(args.review || DEFAULT_REVIEW, {}), detectionRun);
  const boxes = exportApprovedBoxes({ manifest, detectionRun, reviewPayload });
  await writeJson(args.output || DEFAULT_EXPORT, {
    kind: "vision-subject-primary-boxes-reviewed",
    version: args.version || `${new Date().toISOString().slice(0, 10)}-reviewed-primary-boxes`,
    generatedAt: nowIso(),
    taxonomyVersion: detectionRun.taxonomyVersion || manifest.taxonomyVersion || "",
    imageManifestVersion: manifest.version || "",
    detectionRunVersion: detectionRun.version || "",
    reviewVersion: reviewPayload.version || "",
    approvedCount: boxes.length,
    boxes,
  });
}

async function commandSimulatorChecks(args) {
  const fixture = args.fixture || "fixtures/vision/charger-eval-1.jpg";
  const categoriesPayload = await readJson(args.categories || DEFAULT_CATEGORIES);
  const category = (categoriesPayload.categories || []).find((item) => item.id === "charger") || (categoriesPayload.categories || [])[0];
  if (!category) throw new Error("no categories available for simulator checks");
  const meta = await imageMetadata(fixture);
  const manifest = {
    kind: "vision-subject-detection-manifest",
    version: "simulator-manifest",
    taxonomyVersion: categoriesPayload.version || "",
    categories: [{ id: category.id, displayName: category.displayName, detectorLabels: detectorLabelsForCategory(category) }],
    samples: [{
      id: "sim-subject-001",
      categoryId: category.id,
      displayName: category.displayName,
      localPath: relativeRootPath(fixture),
      sourceProvider: "simulator",
      sourceUrl: "",
      width: meta.width,
      height: meta.height,
      bytes: meta.bytes,
      sha256: meta.sha256,
      reviewStatus: "pending-human-review",
      nonProductionReady: true,
    }],
  };
  const withVariants = await createVariantsForManifest(manifest, { targetLongSide: 1024, variantDir: "data/generated/vision-subject-detection-sim/variants" });
  const fakeDetections = finalizeDetections([
    { label: detectorLabelsForCategory(category)[0] || category.id, score: 0.71, box: { x: 18, y: 20, w: 42, h: 48 } },
    { label: "background item", score: 0.33, box: { x: 2, y: 4, w: 88, h: 86 } },
  ], { imageId: "sim-subject-001", variantId: "original", modelId: "owlvit" });
  const detectionRun = {
    kind: "vision-subject-detection-run",
    version: "simulator-run",
    generatedAt: nowIso(),
    manifestVersion: withVariants.version,
    taxonomyVersion: categoriesPayload.version || "",
    results: [{
      id: "sim-subject-001:original:owlvit",
      imageId: "sim-subject-001",
      categoryId: category.id,
      expectedDisplayName: category.displayName,
      sourceProvider: "simulator",
      imageVariant: "original",
      image: withVariants.samples[0].imageVariants[0],
      modelId: "owlvit",
      status: "ok",
      failureReason: "",
      timings: { detectionMs: 12, endToEndMs: 15, modelLoadMs: 100 },
      ...fakeDetections,
    }],
  };
  const review = reviewArtifact({}, detectionRun);
  const reviewed = upsertReview(review, {
    imageId: "sim-subject-001",
    categoryId: category.id,
    reviewer: "simulator",
    timestamp: nowIso(),
    reviewStatus: "approved",
    modelVerdicts: { "owlvit:original": { ordinary: "mixed", primaryA: "accurate", primaryB: "inaccurate" } },
    boxVerdicts: Object.fromEntries(detectionRun.results[0].detections.map((detection) => [detection.id, detection.rankByArea === 1 ? "accurate" : "inaccurate"])),
    bestModel: "owlvit:original",
    selectedPrimaryBox: {
      modelId: "owlvit",
      imageVariant: "original",
      detectionId: detectionRun.results[0].primaryBoxAId,
      box: detectionRun.results[0].detections.find((detection) => detection.id === detectionRun.results[0].primaryBoxAId).box,
    },
    noUsableBox: false,
    notes: "simulator check",
  });
  const metrics = computeMetrics(detectionRun, reviewed);
  const boxes = exportApprovedBoxes({ manifest: withVariants, detectionRun, reviewPayload: reviewed });
  const checks = {
    manifestGenerated: manifest.samples.length === 1,
    variantsGenerated: withVariants.samples[0].imageVariants.length === 2,
    noUpscalePreserved: withVariants.samples[0].imageVariants.every((variant) => variant.upscaled === false),
    detectionSchemaGenerated: detectionRun.results[0].detections.length === 2,
    primaryADerived: Boolean(detectionRun.results[0].primaryBoxAId),
    primaryBDerived: Boolean(detectionRun.results[0].primaryBoxBId),
    reviewUpserted: reviewed.reviews.length === 1,
    metricsComputed: metrics.byModelVariant["owlvit | original"]?.primaryAAccuracy === 1,
    approvedBoxExported: boxes.length === 1,
  };
  const passed = Object.values(checks).every(Boolean);
  const output = args.output || DEFAULT_SIM_REPORT;
  await writeJson(output, {
    kind: "vision-subject-detection-simulator-checks",
    generatedAt: nowIso(),
    passed,
    checks,
    metrics,
    exportedBoxes: boxes,
  });
  if (!passed) throw new Error(`simulator checks failed: ${JSON.stringify(checks)}`);
}

function usage() {
  return `Usage: node scripts/vision-subject-detection-eval.mjs <command>

Commands:
  create-manifest    Collect Chinese mainland product images for selected household categories.
  create-variants    Add original and normalized-1024 image variants.
  run-detection      Run local Grounding DINO and OWL-ViT subject detection.
  serve-review       Start local review UI and save annotations.
  report             Generate JSON/Markdown/HTML evaluation report.
  split-reports      Generate separate subject-recall and naming-retrieval reports.
  export-boxes       Export approved selected primary boxes for later embedding.
  simulator-checks   Run script-level simulator checks without model inference.
`;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (!command || command === "help" || command === "--help") {
    console.log(usage());
    return;
  }
  const handlers = {
    "create-manifest": commandCreateManifest,
    "create-variants": commandCreateVariants,
    "run-detection": commandRunDetection,
    "serve-review": commandServeReview,
    report: commandReport,
    "split-reports": commandSplitReports,
    "export-boxes": commandExportBoxes,
    "simulator-checks": commandSimulatorChecks,
  };
  const handler = handlers[command];
  if (!handler) throw new Error(`unknown command: ${command}\n${usage()}`);
  await handler(args);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
