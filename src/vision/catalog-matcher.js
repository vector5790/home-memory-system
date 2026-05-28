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
      metric: entry.metric || index?.metric || getCatalogIndexMetric(index),
      dimension: Array.isArray(entry.embedding) ? entry.embedding.length : 0,
      sampleId: entry.sampleId || "",
      matchedSampleIds: Array.isArray(entry.matchedSampleIds)
        ? entry.matchedSampleIds
        : (entry.sampleId ? [entry.sampleId] : []),
      indexVersion: index?.version || "",
    };
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

  async function embedImageDataUrl(dataUrl) {
    const extractor = await getCatalogFeatureExtractor();
    if (!extractor) return null;
    const output = await extractor(dataUrl);
    const values = output?.data || output?.[0]?.data;
    return values ? normalizeVector(values) : null;
  }

  async function matchCatalogFromEmbeddingIndex(source, box) {
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
    const rankedLeaves = aggregateCatalogMatchesByLeaf(rankedEntries);
    const best = rankedLeaves[0];
    const runnerUp = rankedLeaves.find((entry) => entry.categoryId !== best?.categoryId);
    const margin = best ? best.score - (runnerUp?.score ?? 0) : 0;
    const threshold = Number(index.threshold) || visionConfig.catalogThreshold;
    const marginThreshold = Number(index.marginThreshold) || visionConfig.catalogMarginThreshold;
    const catalogCandidates = rankedLeaves.slice(0, 3).map((leaf) => ({
      categoryId: leaf.categoryId,
      displayName: leaf.displayName,
      appCategory: leaf.appCategory,
      categoryPath: leaf.categoryPath,
      score: roundNumber(leaf.score, 4),
      bestScore: roundNumber(leaf.bestScore, 4),
      averageScore: roundNumber(leaf.averageScore, 4),
      hitCount: leaf.hitCount,
      matchedSampleIds: leaf.matchedSampleIds,
      representativeImages: leaf.representativeImages,
    }));
    const rejectionReason = !best
      ? "no-catalog-candidate"
      : best.score < threshold
        ? "below-threshold"
        : margin < marginThreshold
          ? "low-margin"
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

  function aggregateCatalogMatchesByLeaf(entries) {
    const leaves = new Map();
    for (const entry of entries) {
      const current = leaves.get(entry.categoryId);
      const sampleIds = entry.matchedSampleIds?.length ? entry.matchedSampleIds : [entry.sampleId].filter(Boolean);
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
          bestScore: entry.score,
          scores: [entry.score],
          matchedSampleIds: [...sampleIds],
          representativeImages: [image],
        });
      } else {
        current.bestScore = Math.max(current.bestScore, entry.score);
        current.scores.push(entry.score);
        current.representativeImages.push(image);
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
