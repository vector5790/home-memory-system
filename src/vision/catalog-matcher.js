export function createCatalogMatcher({
  clampNumber,
  cropImageToDataUrl,
  fetchJsonIndex,
  getCatalogPromptEntries,
  loadTransformersRuntime,
  visionCatalog,
  visionConfig,
}) {
  let catalogClassifierPromise = null;
  let catalogFeatureExtractorPromise = null;
  let catalogIndexPromise = null;
  let catalogIndexWarningShown = false;
  let catalogIndexTiming = null;

  function roundNumber(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round((Number(value) || 0) * factor) / factor;
  }

  function normalizeTokenText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
      .trim();
  }

  function tokenizeText(value) {
    const text = normalizeTokenText(value);
    if (!text) return [];
    const parts = text.split(/\s+/).filter((token) => token.length > 1);
    const chineseChunks = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
    return [...new Set([...parts, ...chineseChunks])];
  }

  async function extractTextWithBrowserDetector(dataUrl) {
    if (!visionConfig.catalogOcrRerankerEnabled || typeof window === "undefined" || !("TextDetector" in window)) return "";
    try {
      const detector = new window.TextDetector();
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      const results = await detector.detect(bitmap);
      bitmap.close?.();
      return (results || [])
        .map((item) => item.rawValue || item.text || "")
        .filter(Boolean)
        .join(" ");
    } catch (error) {
      console.info("Browser OCR text detector skipped.", error);
      return "";
    }
  }

  function getConfiguredClusters() {
    return Array.isArray(visionConfig.catalogClusterThresholds)
      ? visionConfig.catalogClusterThresholds
      : [];
  }

  function getCatalogClusterForCategory(categoryId, categoryPath = [], lineage = null) {
    const id = String(categoryId || "");
    const pathText = normalizeTokenText([...categoryPath, ...Object.values(lineage || {})].join(" "));
    return getConfiguredClusters().find((cluster) => {
      if (Array.isArray(cluster.categoryIds) && cluster.categoryIds.includes(id)) return true;
      return Array.isArray(cluster.matchText) && cluster.matchText.some((text) => pathText.includes(normalizeTokenText(text)));
    }) || null;
  }

  function getClusterThresholds(cluster, index) {
    return {
      score: Number(cluster?.acceptScore ?? index.threshold ?? visionConfig.catalogThreshold),
      margin: Number(cluster?.acceptMargin ?? index.marginThreshold ?? visionConfig.catalogMarginThreshold),
      rerankTextScore: Number(cluster?.rerankTextScore ?? visionConfig.catalogRerankMinTextScore ?? 0),
      candidateByDefault: Boolean(cluster?.candidateByDefault),
      candidateReason: cluster?.candidateReason || "cluster-low-confidence",
    };
  }

  async function getCatalogClassifier() {
    if (!catalogClassifierPromise) {
      catalogClassifierPromise = loadTransformersRuntime()
        .then(async ({ pipeline, runtimeMode }) => {
          if (!runtimeMode.catalogReady) return null;
          return pipeline("zero-shot-image-classification", visionConfig.catalogModel, { quantized: true });
        })
        .catch((error) => {
          console.info("Catalog embedding classifier unavailable.", error);
          return null;
        });
    }
    return catalogClassifierPromise;
  }

  async function getCatalogFeatureExtractor() {
    if (!catalogFeatureExtractorPromise) {
      catalogFeatureExtractorPromise = loadTransformersRuntime()
        .then(async ({ pipeline, runtimeMode }) => {
          if (!runtimeMode.catalogReady) return null;
          return pipeline("image-feature-extraction", visionConfig.catalogModel, { quantized: true });
        })
        .catch((error) => {
          console.info("Catalog embedding extractor unavailable.", error);
          return null;
        });
    }
    return catalogFeatureExtractorPromise;
  }

  async function getCatalogEmbeddingIndex() {
    if (!catalogIndexPromise) {
      catalogIndexPromise = loadCatalogEmbeddingIndex().catch(() => ({ entries: [] }));
    }
    return catalogIndexPromise;
  }

  async function loadCatalogEmbeddingIndex() {
    const startedAt = performance.now();
    const primary = await fetchJsonIndex(visionConfig.catalogIndex).catch(() => null);
    const normalizedPrimary = normalizeCatalogEmbeddingIndex(primary, visionConfig.catalogIndex);
    if (normalizedPrimary.entries.length) {
      catalogIndexTiming = {
        source: "primary",
        entries: normalizedPrimary.entries.length,
        loadMs: Math.round((performance.now() - startedAt) * 1000) / 1000,
      };
      return normalizedPrimary;
    }

    const fallback = await fetchJsonIndex(visionConfig.catalogIndexFallback).catch(() => null);
    const normalizedFallback = normalizeCatalogEmbeddingIndex(fallback, visionConfig.catalogIndexFallback);
    catalogIndexTiming = {
      source: normalizedFallback.entries.length ? "fallback" : "empty",
      entries: normalizedFallback.entries.length,
      loadMs: Math.round((performance.now() - startedAt) * 1000) / 1000,
    };
    return normalizedFallback;
  }

  function getCatalogIndexMetric(index) {
    if (index?.metric === "max-inner-product" || index?.metric === "cosine") return index.metric;
    if (index?.algorithm === "flat-cosine") return "cosine";
    if (index?.algorithm === "flat-inner-product") return "max-inner-product";
    return "cosine";
  }

  function normalizeCatalogEmbeddingIndex(index, url = "") {
    const metric = getCatalogIndexMetric(index);
    const embeddingConfig = index?.embedding || {};
    const dimension = Number(embeddingConfig.dimension || index?.dimension || 0);
    const entries = Array.isArray(index?.entries)
      ? index.entries
        .filter((entry) => Array.isArray(entry.embedding) && entry.embedding.length)
        .map((entry) => normalizeCatalogIndexEntry(entry, index))
        .filter(Boolean)
      : [];
    return {
      ...(index || {}),
      sourceUrl: url,
      metric,
      dimension,
      threshold: Number(index?.threshold ?? index?.thresholds?.acceptScore ?? visionConfig.catalogThreshold),
      marginThreshold: Number(index?.marginThreshold ?? index?.thresholds?.acceptMargin ?? visionConfig.catalogMarginThreshold),
      topK: Math.max(1, Math.round(Number(index?.topK || visionConfig.catalogTopK))),
      entries,
    };
  }

  function normalizeCatalogIndexEntry(entry, index) {
    const legacyItem = entry.itemId ? visionCatalog.find((catalogItem) => catalogItem.id === entry.itemId) : null;
    const categoryId = entry.categoryId || entry.itemId || legacyItem?.id || "";
    const name = entry.displayName || entry.name || legacyItem?.name || "";
    if (!categoryId || !name) return null;
    return {
      ...entry,
      categoryId,
      itemId: entry.itemId || categoryId,
      displayName: name,
      name,
      appCategory: entry.appCategory || entry.category || legacyItem?.category || "daily",
      categoryPath: Array.isArray(entry.categoryPath) ? entry.categoryPath : [],
      lineage: entry.lineage || {},
      aliases: Array.isArray(entry.aliases) ? entry.aliases : [],
      entity: normalizeCatalogEntity(entry),
      metric: entry.metric || index?.metric || getCatalogIndexMetric(index),
      dimension: Array.isArray(entry.embedding) ? entry.embedding.length : 0,
      sampleId: entry.sampleId || "",
      matchedSampleIds: Array.isArray(entry.matchedSampleIds)
        ? entry.matchedSampleIds
        : (entry.sampleId ? [entry.sampleId] : []),
      indexVersion: index?.version || "",
    };
  }

  function normalizeCatalogEntity(entry) {
    const entity = entry.entity && typeof entry.entity === "object" ? entry.entity : {};
    const sourceTitle = entry.sourceTitle || entry.image?.sourceTitle || "";
    const titleTokens = tokenizeText(sourceTitle);
    return {
      brand: entity.brand || inferBrandFromTitle(sourceTitle),
      series: entity.series || "",
      model: entity.model || inferModelFromTitle(sourceTitle),
      formFactor: entity.formFactor || "",
      visualTags: Array.isArray(entity.visualTags) ? entity.visualTags : [],
      titleTokens,
      sourceTitle,
    };
  }

  function inferBrandFromTitle(title) {
    const text = String(title || "");
    const brandPattern = /\b(sony|索尼|samsung|三星|lg|tcl|hisense|海信|xiaomi|小米|redmi|红米|huawei|华为|yamaha|雅马哈|marantz|马兰士|denon|天龙|jbl|bose|sony|飞利浦|philips|美的|midea|格力|gree|海尔|haier)\b/i;
    return text.match(brandPattern)?.[1] || "";
  }

  function inferModelFromTitle(title) {
    const text = String(title || "");
    return text.match(/\b[A-Z]{1,5}[- ]?\d{2,5}[A-Z0-9-]{0,8}\b/i)?.[0] || "";
  }

  function cosineSimilarity(left, right) {
    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;
    for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
      dot += left[index] * right[index];
      leftNorm += left[index] * left[index];
      rightNorm += right[index] * right[index];
    }
    return leftNorm && rightNorm ? dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm)) : 0;
  }

  function innerProduct(left, right) {
    let score = 0;
    for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
      score += left[index] * right[index];
    }
    return score;
  }

  function vectorSimilarity(left, right, metric = "cosine") {
    return metric === "max-inner-product" ? innerProduct(left, right) : cosineSimilarity(left, right);
  }

  function normalizeVector(values) {
    const vector = Array.from(values || [], Number);
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => value / norm);
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

  async function embedImageDataUrl(dataUrl) {
    const extractor = await getCatalogFeatureExtractor();
    if (!extractor) return null;
    const output = await extractor(dataUrl);
    const values = poolFeatureOutput(output);
    return values ? normalizeVector(values) : null;
  }

  async function matchCatalogFromEmbeddingIndex(source, box, options = {}) {
    const startedAt = performance.now();
    const index = await getCatalogEmbeddingIndex();
    if (!index.entries?.length) return null;
    const cropStartedAt = performance.now();
    const cropImage = cropImageToDataUrl(source, box, {
      paddingPct: visionConfig.embeddingCropPaddingPct,
    });
    const cropMs = Math.round((performance.now() - cropStartedAt) * 1000) / 1000;
    const embeddingStartedAt = performance.now();
    const embedding = await embedImageDataUrl(cropImage);
    const embeddingMs = Math.round((performance.now() - embeddingStartedAt) * 1000) / 1000;
    if (!embedding) return null;

    const searchStartedAt = performance.now();
    const expectedDimension = Number(index.dimension || embedding.length);
    const compatibleEntries = index.entries.filter((entry) => {
      const isCompatible = entry.dimension === embedding.length
        && (!expectedDimension || entry.dimension === expectedDimension)
        && (entry.metric === index.metric || !entry.metric);
      return isCompatible;
    });
    const ignoredCount = index.entries.length - compatibleEntries.length;
    if (ignoredCount > 0 && !catalogIndexWarningShown) {
      catalogIndexWarningShown = true;
      console.info(`Vision category index ignored ${ignoredCount} entries with mismatched dimension or metric.`);
    }
    if (!compatibleEntries.length) return null;

    const rankedEntries = compatibleEntries
      .map((entry) => ({ ...entry, score: vectorSimilarity(embedding, entry.embedding, index.metric) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(index.topK || visionConfig.catalogTopK, 1));
    const ocrText = options.ocrText || await extractTextWithBrowserDetector(cropImage);
    const rankedLeaves = await rerankCatalogMatches({
      cropImage,
      leaves: aggregateCatalogMatchesByLeaf(rankedEntries, index),
      index,
      queryText: [
        options.name,
        options.detectionLabel,
        options.suggestedName,
        options.roomType,
        ocrText,
      ].filter(Boolean).join(" "),
    });
    const best = rankedLeaves[0];
    const runnerUp = rankedLeaves.find((entry) => entry.categoryId !== best?.categoryId);
    const margin = best ? best.score - (runnerUp?.score ?? 0) : 0;
    const policy = getAcceptancePolicy(best, runnerUp, index);
    const catalogCandidates = rankedLeaves.slice(0, 3).map((leaf) => ({
      categoryId: leaf.categoryId,
      displayName: leaf.displayName,
      appCategory: leaf.appCategory,
      categoryPath: leaf.categoryPath,
      categoryCluster: leaf.categoryCluster,
      score: roundNumber(leaf.score, 4),
      embeddingScore: roundNumber(leaf.embeddingScore ?? leaf.score, 4),
      rerankTextScore: roundNumber(leaf.rerankTextScore || 0, 4),
      rerankPrompt: leaf.rerankPrompt || "",
      bestScore: roundNumber(leaf.bestScore, 4),
      averageScore: roundNumber(leaf.averageScore, 4),
      hitCount: leaf.hitCount,
      entity: leaf.entity,
      matchedSampleIds: leaf.matchedSampleIds,
      representativeImages: leaf.representativeImages,
    }));
    const rejectionReason = !best
      ? "no-catalog-candidate"
      : best.score < policy.score
        ? "below-threshold"
        : margin < policy.margin
          ? "low-margin"
          : policy.candidateByDefault && (best.rerankTextScore || 0) < policy.rerankTextScore
            ? policy.candidateReason
          : "";
    const accepted = !rejectionReason;
    return {
      accepted,
      name: accepted ? best.displayName : "",
      category: accepted ? best.appCategory : "",
      confidence: clampNumber(best?.score || 0, 0, 1),
      catalogId: accepted ? best.categoryId : "",
      categoryId: accepted ? best.categoryId : "",
      categoryPath: accepted ? best.categoryPath : [],
      categoryScore: best?.score || 0,
      categoryMargin: margin,
      categoryCluster: best?.categoryCluster || null,
      ocrText,
      namingAcceptancePolicy: policy,
      catalogCandidates,
      namingRejectionReason: rejectionReason,
      categoryIndexVersion: index.version || "",
      matchedSampleIds: best?.matchedSampleIds || [],
      timings: {
        catalogCropMs: cropMs,
        embeddingMs,
        catalogSearchMs: Math.round((performance.now() - searchStartedAt) * 1000) / 1000,
        catalogTotalMs: Math.round((performance.now() - startedAt) * 1000) / 1000,
        catalogEntries: compatibleEntries.length,
        catalogIndexLoadMs: catalogIndexTiming?.loadMs || 0,
      },
    };
  }

  function buildRerankPrompt(leaf) {
    const englishLineage = Object.values(leaf.lineage || {}).filter(Boolean).join(" ");
    const aliases = Array.isArray(leaf.aliases) ? leaf.aliases.join(" ") : "";
    const promptedLabels = leaf.promptedLabels.join(" ");
    const sourceHints = leaf.entity?.sourceTitle || "";
    const text = [
      englishLineage,
      promptedLabels,
      aliases,
      sourceHints,
      leaf.displayName,
    ].filter(Boolean).join(" ");
    return normalizeTokenText(text).split(/\s+/).slice(0, 14).join(" ") || leaf.displayName || leaf.categoryId;
  }

  async function rerankCatalogMatches({ cropImage, leaves, index, queryText = "" }) {
    const candidateLimit = Math.max(1, Number(visionConfig.catalogRerankCandidateLimit) || 5);
    const limited = leaves.slice(0, candidateLimit);
    const rest = leaves.slice(candidateLimit);
    if (!visionConfig.catalogRerankerEnabled || limited.length <= 1) return leaves;

    const classifierScores = await scoreCandidatesWithImageTextReranker(cropImage, limited);
    const queryTokens = tokenizeText(queryText);
    const embeddingWeight = Number(visionConfig.catalogRerankEmbeddingWeight ?? 0.82);
    const textWeight = Number(visionConfig.catalogRerankTextWeight ?? 0.16);
    const clusterWeight = Number(visionConfig.catalogRerankClusterWeight ?? 0.02);

    const reranked = limited.map((leaf) => {
      const rerankTextScore = classifierScores.get(leaf.categoryId) || 0;
      const queryTextScore = queryMetadataScore(queryTokens, leaf);
      const clusterPrior = getClusterPrior(leaf, index);
      return {
        ...leaf,
        embeddingScore: leaf.score,
        rerankTextScore,
        queryTextScore,
        rerankPrompt: leaf.rerankPrompt || buildRerankPrompt(leaf),
        score: (leaf.score * embeddingWeight)
          + (rerankTextScore * textWeight)
          + (queryTextScore * clusterWeight)
          + clusterPrior,
      };
    }).sort((a, b) => b.score - a.score);
    return [...reranked, ...rest];
  }

  async function scoreCandidatesWithImageTextReranker(cropImage, leaves) {
    const scores = new Map();
    const labels = leaves.map((leaf) => buildRerankPrompt(leaf));
    try {
      const classifier = await getCatalogClassifier();
      if (!classifier) return scores;
      const output = await classifier(cropImage, labels);
      const results = Array.isArray(output) ? output : [];
      const byLabel = new Map(results.map((entry) => [entry.label, Number(entry.score) || 0]));
      leaves.forEach((leaf, index) => {
        scores.set(leaf.categoryId, byLabel.get(labels[index]) || 0);
      });
    } catch (error) {
      console.info("Catalog image-text reranker skipped.", error);
    }
    return scores;
  }

  function queryMetadataScore(queryTokens, leaf) {
    if (!queryTokens.length) return 0;
    const haystack = new Set(tokenizeText([
      leaf.categoryId,
      leaf.displayName,
      leaf.categoryPath.join(" "),
      Object.values(leaf.lineage || {}).join(" "),
      leaf.promptedLabels.join(" "),
      leaf.aliases.join(" "),
      leaf.entity?.sourceTitle,
    ].join(" ")));
    const hits = queryTokens.filter((token) => haystack.has(token)).length;
    return Math.min(1, hits / Math.max(1, queryTokens.length));
  }

  function getClusterPrior(leaf, index) {
    const cluster = leaf.categoryCluster;
    if (!cluster) return 0;
    const policy = getClusterThresholds(cluster, index);
    return policy.candidateByDefault ? -0.004 : 0;
  }

  function getAcceptancePolicy(best, runnerUp, index) {
    const cluster = best?.categoryCluster || null;
    const policy = getClusterThresholds(cluster, index);
    return {
      clusterId: cluster?.id || "",
      clusterLabel: cluster?.label || "",
      score: policy.score,
      margin: policy.margin,
      rerankTextScore: policy.rerankTextScore,
      candidateByDefault: policy.candidateByDefault,
      candidateReason: policy.candidateReason,
      runnerUpCategoryId: runnerUp?.categoryId || "",
    };
  }

  function aggregateCatalogMatchesByLeaf(entries, index) {
    const leaves = new Map();
    for (const entry of entries) {
      const current = leaves.get(entry.categoryId);
      const sampleIds = entry.matchedSampleIds?.length ? entry.matchedSampleIds : [entry.sampleId].filter(Boolean);
      const promptedLabels = entry.detector?.promptedLabels || [];
      const image = {
        id: entry.id,
        sampleId: entry.sampleId || "",
        score: entry.score,
        sourceImagePath: entry.sourceImagePath || entry.image?.path || "",
        normalizedImagePath: entry.normalizedImagePath || entry.image?.normalizedPath || "",
        sourceTitle: entry.sourceTitle || entry.image?.sourceTitle || "",
      };
      if (!current) {
        leaves.set(entry.categoryId, {
          categoryId: entry.categoryId,
          displayName: entry.displayName,
          appCategory: entry.appCategory,
          categoryPath: entry.categoryPath,
          lineage: entry.lineage || {},
          aliases: entry.aliases || [],
          promptedLabels: [...promptedLabels],
          entity: entry.entity,
          categoryCluster: getCatalogClusterForCategory(entry.categoryId, entry.categoryPath, entry.lineage),
          bestScore: entry.score,
          scores: [entry.score],
          matchedSampleIds: [...sampleIds],
          representativeImages: [image],
        });
      } else {
        current.bestScore = Math.max(current.bestScore, entry.score);
        current.scores.push(entry.score);
        current.representativeImages.push(image);
        for (const label of promptedLabels) {
          if (label && !current.promptedLabels.includes(label)) current.promptedLabels.push(label);
        }
        for (const sampleId of sampleIds) {
          if (sampleId && !current.matchedSampleIds.includes(sampleId)) current.matchedSampleIds.push(sampleId);
        }
      }
    }
    return [...leaves.values()]
      .map((leaf) => {
        const sortedScores = [...leaf.scores].sort((a, b) => b - a);
        const topScores = sortedScores.slice(0, 3);
        const averageScore = topScores.reduce((sum, score) => sum + score, 0) / Math.max(1, topScores.length);
        const hitCount = leaf.scores.length;
        return {
          ...leaf,
          averageScore,
          hitCount,
          score: (leaf.bestScore * 0.8) + (averageScore * 0.2) + Math.min(hitCount, 3) * 0.002,
          representativeImages: leaf.representativeImages
            .sort((a, b) => b.score - a.score)
            .slice(0, 3),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  return {
    getCatalogClassifier,
    getCatalogEmbeddingIndex,
    getCatalogFeatureExtractor,
    matchCatalogFromEmbeddingIndex,
  };
}
