#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env, pipeline, RawImage } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODEL_IDS = {
  owlvit: "Xenova/owlvit-base-patch32",
  clip: "Xenova/clip-vit-base-patch32",
};
const DEFAULT_CATEGORIES = "data/vision-categories.household.json";
const DEFAULT_REAL_INDEX = "data/vision-index.real.json";
const DEFAULT_REAL_DATASET = "data/vision-model-eval.real.json";
const DEFAULT_MANIFEST = "data/vision-household-image-manifest.smoke.json";
const DEFAULT_DATASET = "data/vision-model-eval.household-index.json";
const DEFAULT_INDEX = "data/vision-index.household.owlvit-clip.json";
const DEFAULT_REPORT = "data/generated/vision-household-index-build-report.json";
const DEFAULT_READINESS = "data/generated/vision-household-index-readiness.json";
const DEFAULT_EXTENDED_MANIFEST = "data/vision-household-image-manifest.smoke-50.json";
const DEFAULT_EXTENDED_IMAGE_DIR = "fixtures/vision-household/smoke-50";
const DEFAULT_CN_MANIFEST = "data/vision-household-image-manifest.cn.json";
const DEFAULT_CN_IMAGE_DIR = "fixtures/vision-household/cn";
const CN_SOURCE_DOMAINS = [
  ".cn",
  "1688.com",
  "alicdn.com",
  "baidu.com",
  "bcebos.com",
  "bdimg.com",
  "china.com",
  "dangdang.com",
  "gome.com.cn",
  "gtimg.com",
  "haier.com",
  "huawei.com",
  "jd.com",
  "jdliving.cn",
  "lenovo.com.cn",
  "meituan.net",
  "mi.com",
  "pinduoduo.com",
  "qq.com",
  "sinaimg.cn",
  "suning.com",
  "taobao.com",
  "tmall.com",
  "xiaohongshu.com",
  "xiaomi.com",
  "youzan.com",
  "zhihu.com",
];
const COMMONS_SEARCH_QUERIES = {
  "storage-box": ["plastic storage box", "storage container", "storage bin"],
  "charging-cable": ["USB cable", "USB C cable", "charging cable"],
  charger: ["USB charger", "phone charger", "power adapter"],
  "remote-control": ["remote control", "TV remote control", "television remote"],
  "medicine-box": ["pill box", "medicine box", "pill organizer"],
  battery: ["AA battery", "alkaline battery", "battery cell"],
};

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
  console.log(`wrote ${path.relative(ROOT, resolved)}`);
}

async function sha256File(filePath) {
  const buffer = await readFile(resolveRootPath(filePath));
  return createHash("sha256").update(buffer).digest("hex");
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

function round(value, digits = 6) {
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

function categoryMap(categoriesPayload) {
  return new Map((categoriesPayload.categories || []).map((category) => [category.id, category]));
}

function detectorLabelsFor(category) {
  return [
    ...(category?.detectorLabels || []),
    ...(category?.aliases || []),
    category?.id?.replace(/-/g, " "),
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase())
    .filter((value, index, array) => value.length >= 2 && array.indexOf(value) === index)
    .slice(0, 8);
}

function activeCategories(categoriesPayload, args) {
  const requested = new Set(String(args.categoryIds || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean));
  const limit = Number(args.categoryLimit || 0);
  const categories = (categoriesPayload.categories || [])
    .filter((category) => category.active)
    .filter((category) => !requested.size || requested.has(category.id));
  return limit > 0 ? categories.slice(0, limit) : categories;
}

function cnQueriesForCategory(category) {
  const display = category.displayName || category.id;
  const pathParts = Array.isArray(category.displayPath) ? category.displayPath.slice(0, -1) : [];
  return [
    `${display} site:detail.tmall.com`,
    `${display} site:1688.com`,
    `${display} site:taobao.com`,
    `${display} site:jdliving.cn`,
    `${display} 家用 实物图`,
    `${display} 商品图`,
    `${display} 京东`,
    `${display} 天猫`,
    `${display} 淘宝`,
    `${display} 1688`,
    `${display} 白底图`,
    `${display} ${pathParts.at(-1) || pathParts[0] || "家用"}`,
  ].filter((value, index, array) => value && array.indexOf(value) === index);
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return String(value || "");
  }
}

function chineseTerms(value) {
  return Array.from(String(value || "").matchAll(/[\u4e00-\u9fff]{2,}/g))
    .map((match) => match[0]);
}

function chineseNgrams(value, size = 2) {
  const chars = Array.from(String(value || ""));
  if (chars.length < size) return [];
  return chars
    .slice(0, chars.length - size + 1)
    .map((_, index) => chars.slice(index, index + size).join(""));
}

function categoryMatchTerms(category) {
  const suffixPattern = /(盒|箱|袋|篮|架|柜|器|机|线|瓶|杯|碗|盘|刷|巾|桶|锅|剪|刀|笔|卡|本|垫|套|罩|膜|灯|表|钟|枕|被|毯|椅|凳|桌|纸|包|格)$/;
  const rawTerms = [
    category.displayName,
    ...(Array.isArray(category.displayPath) ? category.displayPath.slice(-1) : []),
    ...(Array.isArray(category.aliases) ? category.aliases : []),
  ].filter(Boolean);
  const terms = new Set();
  for (const rawTerm of rawTerms) {
    const text = String(rawTerm).trim().toLowerCase();
    if (!text) continue;
    terms.add(text);
    for (const term of chineseTerms(text)) {
      terms.add(term);
      const core = term.replace(suffixPattern, "");
      if (core.length >= 2) terms.add(core);
      for (const ngram of chineseNgrams(term, 2)) {
        if (ngram.length >= 2) terms.add(ngram);
      }
    }
  }
  return [...terms].filter((term) => term.length >= 2);
}

function isCommerceHost(host) {
  return [
    "1688.com",
    "alicdn.com",
    "dangdang.com",
    "gome.com.cn",
    "jd.com",
    "pinduoduo.com",
    "suning.com",
    "taobao.com",
    "tmall.com",
    "youzan.com",
  ].some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function isBlockedDesignAssetHost(host) {
  return [
    "699pic.com",
    "design006.com",
    "huaban.com",
    "nipic.com",
    "photophoto.cn",
    "pic.ntimg.cn",
    "sheji58.com",
    "sucai999.com",
  ].some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function resultMatchAssessment(result, category, query, rank) {
  const title = safeDecodeURIComponent(result.title || "").toLowerCase();
  const sourceUrl = safeDecodeURIComponent(result.sourceUrl || "").toLowerCase();
  const imageUrl = safeDecodeURIComponent(result.imageUrl || "").toLowerCase();
  const haystack = [title, sourceUrl, imageUrl].join(" ");
  const display = String(category.displayName || "").trim().toLowerCase();
  const terms = categoryMatchTerms(category);
  const exact = display && haystack.includes(display);
  const termHits = terms.filter((term) => haystack.includes(term));
  const hosts = [result.sourceHost, result.imageHost].filter(Boolean);
  const commerce = hosts.some(isCommerceHost);
  const blockedDesignAssetHost = hosts.some(isBlockedDesignAssetHost);
  const mainland = isMainlandChinaCandidate(result.sourceUrl, result.imageUrl);
  const queryDisplay = display && String(query || "").toLowerCase().includes(display);
  const softRelated = /商品|产品|家用|实物|白底|厨房|居家|收纳|清洁|电器|文具|玩具|母婴|护理|药|食品|饮料|餐具|品牌|旗舰店|批发/.test(haystack);
  const blacklist = blockedDesignAssetHost || /螺纹|螺距|尺寸图|设计图|设计图库|广告设计|淘宝界面设计|主图设计|海报|banner|psd|图纸|cad|ppt|模板|素材|图标|矢量|简笔画|手绘|卡通|壁纸|头像|表情包|新闻|教程|怎么|是什么|什么意思|招聘|租房|股票|论文|作文|试题|答案|下载|软件|app/.test(haystack);
  let score = 0;
  if (mainland) score += 2;
  if (commerce) score += 2;
  if (exact) score += 4;
  score += Math.min(3, termHits.length);
  if (softRelated) score += 1;
  if (rank <= 5 && queryDisplay) score += 2;
  else if (rank <= 10 && queryDisplay) score += 1;
  if (blacklist && !exact) score -= 5;
  return {
    accepted: score >= 4 && !blacklist && (exact || termHits.length >= 2),
    score,
    exact,
    termHits,
    commerce,
    mainland,
    blacklist,
    blockedDesignAssetHost,
    rank,
  };
}

function sanitizeFilePart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

function extensionForUrl(url, mime = "") {
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  const match = String(url || "").split("?")[0].match(/\.(jpe?g|png|webp)$/i);
  return match ? `.${match[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

function commonsPageUrl(title) {
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(title || "").replace(/ /g, "_"))}`;
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
    return host && CN_SOURCE_DOMAINS.some((domain) => host === domain || host.endsWith(domain));
  });
}

function extractBingImageResults(html) {
  const results = [];
  const seen = new Set();
  const regex = /<a\b[^>]*class="[^"]*\biusc\b[^"]*"[^>]*\bm="([^"]+)"/g;
  for (const match of html.matchAll(regex)) {
    const decoded = decodeHtmlEntities(match[1]);
    try {
      const metadata = JSON.parse(decoded);
      const imageUrl = metadata.murl || metadata.turl;
      const sourceUrl = metadata.purl || metadata.surl || "";
      if (!imageUrl || seen.has(imageUrl)) continue;
      seen.add(imageUrl);
      results.push({
        title: metadata.t || metadata.desc || metadata.mid || "image",
        sourceUrl,
        imageUrl,
        thumbnailUrl: metadata.turl || "",
        sourceProvider: "Bing Images",
        sourceHost: sourceHost(sourceUrl || imageUrl),
        imageHost: sourceHost(imageUrl),
        license: {
          name: "Unverified Chinese mainland web image",
          usage: "For local smoke evaluation only. Check the source page rights before production or redistribution.",
        },
      });
    } catch {
      // Ignore non-JSON metadata blocks.
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
  const html = await response.text();
  return extractBingImageResults(html).filter((result) => isMainlandChinaCandidate(result.sourceUrl, result.imageUrl));
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
      thumbnailUrl: imageUrl,
      sourceProvider: "Taobao search",
      sourceHost: sourceHost(sourceUrl),
      imageHost: sourceHost(imageUrl),
      license: {
        name: "Unverified Taobao product image",
        usage: "For local smoke evaluation only. Check Taobao/Tmall item rights before production or redistribution.",
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
  const html = await response.text();
  return extractTaobaoSearchResults(html, query, limit);
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
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.4",
    },
  }, 12000);
  if (!initResponse.ok) throw new Error(`DuckDuckGo image init failed ${initResponse.status}: ${query}`);
  const vqd = extractDuckDuckGoVqd(await initResponse.text());
  if (!vqd) return [];
  const imageUrl = new URL("https://duckduckgo.com/i.js");
  imageUrl.searchParams.set("l", "cn-zh");
  imageUrl.searchParams.set("o", "json");
  imageUrl.searchParams.set("q", query);
  imageUrl.searchParams.set("vqd", vqd);
  imageUrl.searchParams.set("f", ",,,");
  imageUrl.searchParams.set("p", "1");
  const response = await fetchWithTimeout(imageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.4",
      "Referer": initUrl.toString(),
    },
  }, 12000);
  if (!response.ok) throw new Error(`DuckDuckGo image search failed ${response.status}: ${query}`);
  const payload = await response.json();
  return (payload.results || [])
    .map((result) => {
      const candidateImageUrl = absoluteUrl(result.image || result.thumbnail || "");
      const sourceUrl = absoluteUrl(result.url || "");
      return {
        title: result.title || query,
        sourceUrl,
        imageUrl: candidateImageUrl,
        thumbnailUrl: absoluteUrl(result.thumbnail || ""),
        sourceProvider: "DuckDuckGo Images",
        sourceHost: sourceHost(sourceUrl || candidateImageUrl),
        imageHost: sourceHost(candidateImageUrl),
        license: {
          name: "Unverified Taobao ecosystem image",
          usage: "For local smoke evaluation only. Check Taobao/Tmall/1688 source rights before production or redistribution.",
        },
      };
    })
    .filter((result) => result.imageUrl && isMainlandChinaCandidate(result.sourceUrl, result.imageUrl))
    .slice(0, limit);
}

async function commonsSearch(query, limit) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", String(limit));
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|extmetadata");
  url.searchParams.set("iiurlwidth", "900");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "home-memory-system/0.1 household vision index evaluation",
    },
  }, 15000);
  if (!response.ok) throw new Error(`Commons search failed ${response.status}: ${query}`);
  const payload = await response.json();
  return Object.values(payload.query?.pages || {})
    .map((page) => {
      const info = page.imageinfo?.[0] || {};
      const metadata = info.extmetadata || {};
      return {
        title: page.title,
        pageId: page.pageid,
        sourceUrl: commonsPageUrl(page.title),
        imageUrl: info.thumburl || info.url,
        mime: info.mime || "",
        license: {
          name: metadata.LicenseShortName?.value || metadata.UsageTerms?.value || "Wikimedia Commons media",
          usage: metadata.UsageTerms?.value || "See the source file page for exact license and attribution requirements.",
          artist: metadata.Artist?.value || "",
          credit: metadata.Credit?.value || "",
        },
      };
    })
    .filter((item) => item.imageUrl && /^image\/(jpeg|png|webp)$/i.test(item.mime));
}

async function downloadFile(url, outputPath) {
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 home-memory-system/0.1 household vision index evaluation",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  }, 20000);
  if (!response.ok) throw new Error(`download failed ${response.status}: ${url}`);
  const resolved = resolveRootPath(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(resolved, buffer);
  return buffer.length;
}

async function commandCreateManifest(args) {
  const categories = categoryMap(await readJson(args.categories || DEFAULT_CATEGORIES));
  const realIndex = await readJson(args.realIndex || DEFAULT_REAL_INDEX);
  const realDataset = await readJson(args.realDataset || DEFAULT_REAL_DATASET);
  const samples = [];

  for (const entry of realIndex.entries || []) {
    const category = categories.get(entry.categoryId);
    if (!category) continue;
    samples.push({
      id: entry.sampleId,
      categoryId: entry.categoryId,
      split: "gallery",
      role: "gallery",
      imagePath: entry.sourceImagePath,
      sourceUrl: entry.sourceUrl || "",
      sourceTitle: entry.sourceTitle || entry.displayName || entry.sampleId,
      sourceProvider: "Wikimedia Commons",
      license: entry.license || {
        name: "Wikimedia Commons media",
        usage: "See the source file page for exact license and attribution requirements.",
      },
      variant: entry.sourceTitle || entry.sampleId,
      reviewStatus: "reviewed",
      sha256: await sha256File(entry.sourceImagePath),
      gtBox: normalizePercentBox(entry.box),
    });
  }

  for (const image of realDataset.images || []) {
    const truth = image.groundTruth?.[0];
    if (!truth || !categories.has(truth.categoryId)) continue;
    samples.push({
      id: image.id,
      categoryId: truth.categoryId,
      split: "eval",
      role: "query",
      imagePath: image.imagePath,
      sourceUrl: image.sourceUrl || truth.sourceUrl || "",
      sourceTitle: image.sourceTitle || truth.sourceTitle || image.id,
      sourceProvider: image.sourceProvider || "Wikimedia Commons",
      license: {
        name: "Wikimedia Commons media",
        usage: "See the source file page for exact license and attribution requirements.",
      },
      variant: image.sourceTitle || image.id,
      reviewStatus: "reviewed",
      sha256: await sha256File(image.imagePath),
      gtBox: normalizePercentBox(truth.box),
    });
  }

  const payload = {
    kind: "vision-household-image-manifest",
    version: "20260523-household-smoke-images",
    description: "Smoke manifest using reviewed Wikimedia household photos from the existing real-photo evaluation set.",
    taxonomyVersion: (await readJson(args.categories || DEFAULT_CATEGORIES)).version,
    sourcePolicy: {
      provider: "Wikimedia Commons",
      productionReady: false,
      note: "License metadata points to Commons file pages and must be reviewed per file before production use.",
    },
    samples,
  };
  await writeJson(args.output || DEFAULT_MANIFEST, payload);
}

async function commandExpandEvalManifest(args) {
  const inputManifest = await readJson(args.input || DEFAULT_MANIFEST);
  const categoriesPayload = await readJson(args.categories || DEFAULT_CATEGORIES);
  const categories = categoryMap(categoriesPayload);
  const targetEval = Number(args.targetEval || 50);
  const perCategory = Math.ceil(targetEval / Object.keys(COMMONS_SEARCH_QUERIES).length);
  const searchLimit = Number(args.searchLimit || 40);
  const threshold = Number(args.threshold || 0.005);
  const imageDir = args.imageDir || DEFAULT_EXTENDED_IMAGE_DIR;
  const samples = [...(inputManifest.samples || [])];
  const seenUrls = new Set(samples.map((sample) => sample.sourceUrl).filter(Boolean));
  const seenTitles = new Set(samples.map((sample) => sample.sourceTitle).filter(Boolean));
  const detectorLoadStart = performance.now();
  const detector = await pipeline("zero-shot-object-detection", MODEL_IDS.owlvit, { dtype: "q8" });
  const additions = [];
  const failures = [];

  for (const [categoryId, queries] of Object.entries(COMMONS_SEARCH_QUERIES)) {
    const category = categories.get(categoryId);
    if (!category) continue;
    let existingEval = samples.filter((sample) => sample.categoryId === categoryId && sample.split === "eval").length;
    let serial = existingEval + 1;
    for (const query of queries) {
      if (samples.filter((sample) => sample.split === "eval").length >= targetEval) break;
      if (existingEval >= perCategory) break;
      let results = [];
      try {
        results = await commonsSearch(query, searchLimit);
      } catch (error) {
        failures.push({ categoryId, query, stage: "search", reason: String(error?.message || error) });
        continue;
      }
      for (const result of results) {
        if (samples.filter((sample) => sample.split === "eval").length >= targetEval) break;
        if (existingEval >= perCategory) break;
        if (seenUrls.has(result.sourceUrl) || seenTitles.has(result.title)) continue;
        const id = `${categoryId}-commons-eval-${String(serial).padStart(2, "0")}`;
        const extension = extensionForUrl(result.imageUrl, result.mime);
        const imagePath = path.join(imageDir, categoryId, `${id}-${sanitizeFilePart(result.title)}${extension}`);
        try {
          await downloadFile(result.imageUrl, imagePath);
          const sha256 = await sha256File(imagePath);
          const candidate = {
            id,
            categoryId,
            split: "eval",
            role: "query",
            imagePath,
            sourceUrl: result.sourceUrl,
            sourceTitle: result.title,
            sourceProvider: "Wikimedia Commons",
            license: result.license,
            variant: result.title,
            reviewStatus: "reviewed",
            sha256,
          };
          const detected = await detectRegion(detector, candidate, category, threshold);
          if (!detected.best) {
            failures.push({ categoryId, sampleId: id, stage: "gt-region", reason: "no owlvit-assisted gt region", sourceUrl: result.sourceUrl });
            continue;
          }
          candidate.gtBox = detected.best.region;
          candidate.gtAnnotation = {
            method: "owlvit-assisted",
            modelId: MODEL_IDS.owlvit,
            label: detected.best.label,
            score: round(detected.best.score, 6),
            note: "Auto-assisted GT box for scaling the smoke evaluation set; should be human-reviewed before production gating.",
          };
          samples.push(candidate);
          additions.push(candidate);
          seenUrls.add(result.sourceUrl);
          seenTitles.add(result.title);
          existingEval += 1;
          serial += 1;
        } catch (error) {
          failures.push({ categoryId, sampleId: id, stage: "download-or-annotate", reason: String(error?.message || error), sourceUrl: result.sourceUrl });
        }
      }
    }
  }

  const outputManifest = {
    ...inputManifest,
    version: "20260523-household-smoke-50-images",
    description: "Extended smoke manifest with 50 Wikimedia Commons query images. Additional GT boxes are OWL-ViT assisted and marked for later human review.",
    taxonomyVersion: categoriesPayload.version,
    sourcePolicy: {
      ...(inputManifest.sourcePolicy || {}),
      provider: "Wikimedia Commons",
      productionReady: false,
      note: "Additional query images are Commons media. OWL-ViT-assisted GT boxes are for scale testing and require human review before production gates.",
    },
    samples,
    generation: {
      targetEval,
      detectorModelId: MODEL_IDS.owlvit,
      detectorLoadMs: elapsedMs(detectorLoadStart),
      addedEvalSamples: additions.length,
      failures: failures.length,
    },
  };
  await writeJson(args.output || DEFAULT_EXTENDED_MANIFEST, outputManifest);
  await writeJson(args.report || "data/generated/vision-household-query-expansion-report.json", {
    kind: "vision-household-query-expansion-report",
    version: outputManifest.version,
    targetEval,
    evalCount: samples.filter((sample) => sample.split === "eval").length,
    addedEvalSamples: additions.length,
    additions: additions.map((sample) => ({
      id: sample.id,
      categoryId: sample.categoryId,
      imagePath: sample.imagePath,
      sourceUrl: sample.sourceUrl,
      gtBox: sample.gtBox,
      gtAnnotation: sample.gtAnnotation,
    })),
    failures,
  });
}

async function commandCreateCnManifest(args) {
  const categoriesPayload = await readJson(args.categories || DEFAULT_CATEGORIES);
  const categories = activeCategories(categoriesPayload, args);
  const galleryPerCategory = Number(args.galleryPerCategory || 3);
  const evalTotal = Number(args.evalTotal || 50);
  const searchLimit = Number(args.searchLimit || 35);
  const threshold = Number(args.threshold || 0.005);
  const imageDir = args.imageDir || DEFAULT_CN_IMAGE_DIR;
  const samples = [];
  const failures = [];
  const seenUrls = new Set();
  const detectorLoadStart = performance.now();
  const detector = evalTotal > 0
    ? await pipeline("zero-shot-object-detection", MODEL_IDS.owlvit, { dtype: "q8" })
    : null;
  let evalCount = 0;
  const evalPerCategory = evalTotal > 0 ? Math.ceil(evalTotal / Math.max(1, categories.length)) : 0;

  for (const category of categories) {
    let galleryCount = 0;
    let categoryEvalCount = 0;
    let serial = 1;
    const display = category.displayName || category.id;
    const searches = [
      { provider: "taobao", query: display },
      { provider: "duckduckgo-cn", query: `${display} 淘宝 商品图` },
      { provider: "duckduckgo-cn", query: `${display} 天猫 商品图` },
      { provider: "duckduckgo-cn", query: `${display} 1688 商品图` },
      { provider: "duckduckgo-cn", query: `${display} site:tao.hooos.com` },
      { provider: "duckduckgo-cn", query: `${display} site:goods.taobao.com` },
      { provider: "duckduckgo-cn", query: `${display} site:bk.taobao.com` },
      { provider: "duckduckgo-cn", query: `${display} 实物图 购买` },
      ...cnQueriesForCategory(category).map((query) => ({ provider: "bing-cn", query })),
    ];
    for (const search of searches) {
      if (galleryCount >= galleryPerCategory && (evalCount >= evalTotal || categoryEvalCount >= evalPerCategory)) break;
      let results = [];
      try {
        if (search.provider === "taobao") {
          results = await taobaoImageSearch(search.query, searchLimit);
        } else if (search.provider === "duckduckgo-cn") {
          results = await duckDuckGoImageSearch(search.query, searchLimit);
        } else {
          results = await bingImageSearch(search.query, searchLimit);
        }
      } catch (error) {
        failures.push({ categoryId: category.id, query: search.query, provider: search.provider, stage: "search", reason: String(error?.message || error) });
        continue;
      }
      for (const [rankIndex, result] of results.entries()) {
        if (galleryCount >= galleryPerCategory && (evalCount >= evalTotal || categoryEvalCount >= evalPerCategory)) break;
        if (seenUrls.has(result.imageUrl) || seenUrls.has(result.sourceUrl)) continue;
        const matchAssessment = resultMatchAssessment(result, category, search.query, rankIndex + 1);
        if (!matchAssessment.accepted) continue;
        const split = galleryCount < galleryPerCategory ? "gallery" : "eval";
        if (split === "eval" && (evalCount >= evalTotal || categoryEvalCount >= evalPerCategory)) continue;
        const id = `${category.id}-cn-${split}-${String(serial).padStart(3, "0")}`;
        const extension = extensionForUrl(result.imageUrl);
        const imagePath = path.join(imageDir, category.id, `${id}-${sanitizeFilePart(result.title)}${extension}`);
        try {
          await downloadFile(result.imageUrl, imagePath);
          const rawImage = await RawImage.read(resolveRootPath(imagePath));
          if (rawImage.width < 80 || rawImage.height < 80) {
            failures.push({ categoryId: category.id, sampleId: id, stage: "image-size", reason: "image too small", sourceUrl: result.sourceUrl });
            continue;
          }
          const sample = {
            id,
            categoryId: category.id,
            split,
            role: split === "gallery" ? "gallery" : "query",
            imagePath,
            sourceUrl: result.sourceUrl,
            sourceTitle: result.title,
            sourceProvider: result.sourceProvider,
            sourceSearchProvider: search.provider,
            sourceRegion: "CN-mainland-web-candidate",
            sourceHost: result.sourceHost,
            imageHost: result.imageHost,
            license: result.license,
            variant: result.title,
            reviewStatus: "pending",
            sourceMatch: matchAssessment,
            sha256: await sha256File(imagePath),
          };
          if (split === "eval") {
            const detected = await detectRegion(detector, sample, category, threshold);
            if (!detected.best) {
              failures.push({ categoryId: category.id, sampleId: id, stage: "gt-region", reason: "no owlvit-assisted gt region", sourceUrl: result.sourceUrl });
              continue;
            }
            sample.gtBox = detected.best.region;
            sample.gtAnnotation = {
              method: "owlvit-assisted",
              modelId: MODEL_IDS.owlvit,
              label: detected.best.label,
              score: round(detected.best.score, 6),
              note: "Auto-assisted GT box for scaling mainland-China-sourced smoke evaluation; human review required before production gates.",
            };
            evalCount += 1;
            categoryEvalCount += 1;
          } else {
            galleryCount += 1;
          }
          samples.push(sample);
          seenUrls.add(result.imageUrl);
          seenUrls.add(result.sourceUrl);
          serial += 1;
        } catch (error) {
          failures.push({ categoryId: category.id, sampleId: id, stage: "download-or-annotate", reason: String(error?.message || error), sourceUrl: result.sourceUrl });
        }
      }
    }
  }

  const payload = {
    kind: "vision-household-image-manifest",
    version: args.version || "20260523-household-cn-images",
    description: "Chinese-mainland-source candidate image manifest generated from Bing China image results. Samples require human source/license/category review before production use.",
    taxonomyVersion: categoriesPayload.version,
    sourcePolicy: {
      provider: "Taobao search first, DuckDuckGo Taobao/Tmall/1688 product-image search second, then Bing Images over Chinese mainland web candidates",
      sourceRegion: "CN-mainland-web-candidate",
      productionReady: false,
      note: "Images are downloaded from candidate mainland China web sources. Source rights and category correctness must be manually reviewed before production or redistribution.",
    },
    generation: {
      categoryCount: categories.length,
      galleryPerCategory,
      evalTotal,
      searchLimit,
      sourceStrategy: [
        "Direct Taobao search at https://s.taobao.com/search?q=<category>",
        "DuckDuckGo image search using '<category> 淘宝/天猫/1688 商品图' and mainland/Taobao ecosystem source filtering",
        "Bing China image search constrained toward Taobao/Tmall/1688 and other mainland web candidates",
      ],
      detectorModelId: MODEL_IDS.owlvit,
      detectorLoadMs: detector ? elapsedMs(detectorLoadStart) : 0,
      failures: failures.length,
    },
    samples,
  };
  await writeJson(args.output || DEFAULT_CN_MANIFEST, payload);
  await writeJson(args.report || "data/generated/vision-household-cn-source-report.json", {
    kind: "vision-household-cn-source-report",
    version: payload.version,
    categoryCount: categories.length,
    gallerySamples: samples.filter((sample) => sample.split === "gallery").length,
    evalSamples: samples.filter((sample) => sample.split === "eval").length,
    samplesByCategory: categories.map((category) => ({
      categoryId: category.id,
      displayName: category.displayName,
      gallery: samples.filter((sample) => sample.categoryId === category.id && sample.split === "gallery").length,
      eval: samples.filter((sample) => sample.categoryId === category.id && sample.split === "eval").length,
    })),
    failures,
  });
}

async function loadModels() {
  const detectorStart = performance.now();
  const detector = await pipeline("zero-shot-object-detection", MODEL_IDS.owlvit, { dtype: "q8" });
  const detectorModelLoadMs = elapsedMs(detectorStart);
  const clipStart = performance.now();
  const clip = await pipeline("image-feature-extraction", MODEL_IDS.clip, { dtype: "q8" });
  return {
    detector,
    clip,
    detectorModelLoadMs,
    clipModelLoadMs: elapsedMs(clipStart),
  };
}

async function detectRegion(detector, sample, category, threshold) {
  const labels = detectorLabelsFor(category);
  const imagePath = resolveRootPath(sample.imagePath);
  const rawImage = await RawImage.read(imagePath);
  const start = performance.now();
  const output = await detector(imagePath, labels, { threshold, percentage: false });
  const detections = (Array.isArray(output) ? output : [])
    .map((result) => ({
      label: String(result.label || ""),
      score: Number(result.score) || 0,
      region: percentBoxFromPixels(result.box, rawImage.width, rawImage.height),
    }))
    .filter((result) => result.region && result.score >= threshold)
    .sort((left, right) => right.score - left.score);
  return {
    rawImage,
    labels,
    detections,
    best: detections[0] || null,
    detectionMs: elapsedMs(start),
  };
}

async function embedCrop(clip, rawImage, region) {
  const cropStart = performance.now();
  const crop = await rawImage.crop(pixelBoxFromPercent(region, rawImage.width, rawImage.height, 4));
  const cropMs = elapsedMs(cropStart);
  const embeddingStart = performance.now();
  const output = await clip(crop);
  return {
    embedding: normalizeVector(output?.data || []),
    cropMs,
    embeddingMs: elapsedMs(embeddingStart),
  };
}

async function commandBuildIndex(args) {
  const manifest = await readJson(args.manifest || DEFAULT_MANIFEST);
  const categoriesPayload = await readJson(args.categories || DEFAULT_CATEGORIES);
  const categories = categoryMap(categoriesPayload);
  const threshold = Number(args.threshold || 0.01);
  const limit = Number(args.limit || 0);
  const { detector, clip, detectorModelLoadMs, clipModelLoadMs } = await loadModels();
  const entries = [];
  const failures = [];
  const timings = [];
  const gallerySamples = (manifest.samples || [])
    .filter((sample) => sample.split === "gallery" && sample.reviewStatus !== "rejected")
    .slice(0, limit > 0 ? limit : undefined);

  for (const sample of gallerySamples) {
    const category = categories.get(sample.categoryId);
    if (!category) {
      failures.push({ sampleId: sample.id, categoryId: sample.categoryId, stage: "category", reason: "unknown category" });
      continue;
    }
    try {
      const detected = await detectRegion(detector, sample, category, threshold);
      if (!detected.best) {
        failures.push({ sampleId: sample.id, categoryId: sample.categoryId, stage: "region", reason: "no owlvit region above threshold" });
        continue;
      }
      const embedded = await embedCrop(clip, detected.rawImage, detected.best.region);
      if (!embedded.embedding.length) {
        failures.push({ sampleId: sample.id, categoryId: sample.categoryId, stage: "embedding", reason: "empty clip embedding" });
        continue;
      }
      const entryId = `${sample.categoryId}:${sample.id}:r0`;
      entries.push({
        id: entryId,
        categoryId: sample.categoryId,
        itemId: sample.categoryId,
        displayName: category.displayName || sample.categoryId,
        name: category.displayName || sample.categoryId,
        appCategory: category.appCategory || "daily",
        categoryPath: category.displayPath || [],
        lineage: category.lineage || {},
        sampleId: sample.id,
        matchedSampleIds: [sample.id],
        sourceImagePath: sample.imagePath,
        image: {
          path: sample.imagePath,
          sourceUrl: sample.sourceUrl || "",
          sourceTitle: sample.sourceTitle || "",
          sha256: sample.sha256,
        },
        sourceUrl: sample.sourceUrl || "",
        sourceTitle: sample.sourceTitle || "",
        license: sample.license || {},
        region: detected.best.region,
        box: detected.best.region,
        crop: {
          type: "owlvit-region",
          paddingPct: 4,
          box: detected.best.region,
        },
        detector: {
          modelId: MODEL_IDS.owlvit,
          label: detected.best.label,
          score: round(detected.best.score, 6),
          promptedLabels: detected.labels,
        },
        embedding: embedded.embedding,
        embeddingModel: MODEL_IDS.clip,
        buildVersion: args.buildVersion || "20260523-household-owlvit-clip-smoke",
      });
      timings.push({
        sampleId: sample.id,
        detectionMs: detected.detectionMs,
        cropMs: embedded.cropMs,
        embeddingMs: embedded.embeddingMs,
      });
    } catch (error) {
      failures.push({ sampleId: sample.id, categoryId: sample.categoryId, stage: "exception", reason: String(error?.message || error) });
    }
  }

  const categoriesWithEntries = new Set(entries.map((entry) => entry.categoryId));
  const index = {
    kind: "vision-category-index",
    version: args.buildVersion || "20260523-household-owlvit-clip-smoke",
    description: "Actual local OWL-ViT region + CLIP crop embedding household smoke index.",
    algorithm: "flat-inner-product",
    metric: "max-inner-product",
    normalized: true,
    embeddingModel: MODEL_IDS.clip,
    embedding: {
      modelId: MODEL_IDS.clip,
      dimension: entries[0]?.embedding?.length || 0,
      normalized: true,
      adapter: "transformers-js-local-clip-crop",
    },
    detector: {
      modelId: MODEL_IDS.owlvit,
      adapter: "transformers-js-local-owlvit",
      threshold,
    },
    thresholds: {
      acceptScore: Number(args.acceptScore || 0.2),
      acceptMargin: Number(args.acceptMargin || 0.04),
    },
    threshold: Number(args.acceptScore || 0.2),
    marginThreshold: Number(args.acceptMargin || 0.04),
    topK: 3,
    taxonomy: categoriesPayload.taxonomy,
    taxonomyVersion: categoriesPayload.version,
    imageManifestVersion: manifest.version,
    buildTimestamp: new Date().toISOString(),
    productionReady: false,
    entryCount: entries.length,
    failureCount: failures.length,
    entries,
    failures,
  };
  const report = {
    kind: "vision-household-index-build-report",
    version: index.version,
    passed: entries.length > 0 && failures.length < gallerySamples.length,
    productionReady: false,
    modelIds: MODEL_IDS,
    timings: {
      detectorModelLoadMs,
      clipModelLoadMs,
      samples: timings,
    },
    summary: {
      manifestSamples: manifest.samples?.length || 0,
      processedGallerySamples: gallerySamples.length,
      indexEntries: entries.length,
      failures: failures.length,
      categoriesWithEntries: categoriesWithEntries.size,
    },
    failures,
  };
  await writeJson(args.output || DEFAULT_INDEX, index);
  await writeJson(args.report || DEFAULT_REPORT, report);
}

async function commandCreateEvalDataset(args) {
  const manifest = await readJson(args.manifest || DEFAULT_MANIFEST);
  const categories = categoryMap(await readJson(args.categories || DEFAULT_CATEGORIES));
  const images = [];
  for (const sample of manifest.samples || []) {
    if (sample.split !== "eval" || sample.reviewStatus === "rejected") continue;
    const category = categories.get(sample.categoryId);
    if (!category) continue;
    images.push({
      id: sample.id,
      imagePath: sample.imagePath,
      sourceTitle: sample.sourceTitle || "",
      sourceUrl: sample.sourceUrl || "",
      sourceProvider: sample.sourceProvider || "",
      groundTruth: [{
        id: `gt-${sample.id}`,
        name: category.displayName || sample.categoryId,
        categoryId: sample.categoryId,
        categoryPath: category.displayPath || [],
        box: sample.gtBox,
        aliases: category.aliases || [],
        activeCategory: true,
        sourceTitle: sample.sourceTitle || "",
        sourceUrl: sample.sourceUrl || "",
      }],
    });
  }
  await writeJson(args.output || DEFAULT_DATASET, {
    kind: "vision-model-eval-dataset",
    version: args.version || (manifest.version?.includes("50") ? "20260523-household-index-smoke-50-eval" : "20260523-household-index-smoke-eval"),
    description: manifest.version?.includes("50")
      ? "Household smoke eval dataset with 50 query images generated from the extended real-photo manifest."
      : "Household smoke eval dataset generated from the real-photo manifest.",
    sourceProvider: "Wikimedia Commons",
    images,
  });
}

async function commandReadiness(args) {
  const categoriesPayload = await readJson(args.categories || DEFAULT_CATEGORIES);
  const manifest = await readJson(args.manifest || DEFAULT_MANIFEST);
  const index = await readJson(args.index || DEFAULT_INDEX);
  const entriesByCategory = new Map();
  for (const entry of index.entries || []) {
    if (!entriesByCategory.has(entry.categoryId)) entriesByCategory.set(entry.categoryId, []);
    entriesByCategory.get(entry.categoryId).push(entry);
  }
  const samplesByCategory = new Map();
  for (const sample of manifest.samples || []) {
    if (!samplesByCategory.has(sample.categoryId)) samplesByCategory.set(sample.categoryId, []);
    samplesByCategory.get(sample.categoryId).push(sample);
  }
  const leaves = (categoriesPayload.categories || [])
    .filter((category) => category.active)
    .map((category) => {
      const samples = samplesByCategory.get(category.id) || [];
      const entries = entriesByCategory.get(category.id) || [];
      const gallery = samples.filter((sample) => sample.split === "gallery").length;
      const evalCount = samples.filter((sample) => sample.split === "eval").length;
      return {
        categoryId: category.id,
        displayName: category.displayName,
        taxonomyReady: true,
        indexReady: entries.length >= 2 && evalCount >= 1,
        gallerySamples: gallery,
        evalSamples: evalCount,
        regionCount: entries.length,
        embeddingCount: entries.filter((entry) => Array.isArray(entry.embedding) && entry.embedding.length > 0).length,
        missingStage: entries.length >= 2 && evalCount >= 1 ? "" : (gallery ? "insufficient-index-or-eval" : "no-gallery-images"),
      };
    });
  await writeJson(args.output || DEFAULT_READINESS, {
    kind: "vision-household-index-readiness",
    version: "20260523-household-index-readiness",
    taxonomyVersion: categoriesPayload.version,
    indexVersion: index.version,
    summary: {
      leafCount: leaves.length,
      indexReadyLeafCount: leaves.filter((leaf) => leaf.indexReady).length,
      notIndexReadyLeafCount: leaves.filter((leaf) => !leaf.indexReady).length,
    },
    leaves,
  });
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (command === "create-smoke-manifest") return commandCreateManifest(args);
  if (command === "expand-eval-manifest") return commandExpandEvalManifest(args);
  if (command === "create-cn-manifest") return commandCreateCnManifest(args);
  if (command === "build-index") return commandBuildIndex(args);
  if (command === "create-eval-dataset") return commandCreateEvalDataset(args);
  if (command === "readiness") return commandReadiness(args);
  throw new Error(`unknown command: ${command || "(missing)"}`);
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
