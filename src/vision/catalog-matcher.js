export function createCatalogMatcher({
  clampNumber,
  cropImageToCanvas,
  cropImageToDataUrl,
  fetchJsonIndex,
  getCatalogPromptEntries,
  getCropPixelRect,
  loadTransformersRuntime,
  nativeEmbedImageDataUrls,
  nativeEmbedImageRegions,
  visionCatalog,
  visionConfig,
}) {
  let catalogClassifierPromise = null;
  let catalogFeatureExtractorPromise = null;
  let catalogIndexPromise = null;
  let catalogIndexWarningShown = false;
  let catalogMaxSupportedBatchSize = Infinity;
  let catalogDirectExtractorUnsupported = false;
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

  async function extractTextWithBrowserDetector(imageInput) {
    if (!visionConfig.catalogOcrRerankerEnabled || typeof window === "undefined" || !("TextDetector" in window)) return "";
    try {
      const detector = new window.TextDetector();
      const bitmap = typeof imageInput === "string"
        ? await fetch(imageInput).then((response) => response.blob()).then((blob) => createImageBitmap(blob))
        : await createImageBitmap(imageInput);
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
    const canUseNativeMetadata = Boolean(
      visionConfig.nativeCatalogEmbeddingEnabled
      && typeof nativeEmbedImageRegions === "function"
    );
    const primaryUrl = canUseNativeMetadata
      ? nativeMetadataIndexPath(visionConfig.catalogIndex)
      : visionConfig.catalogIndex;
    const primary = await fetchJsonIndex(primaryUrl).catch(() => null);
    const normalizedPrimary = normalizeCatalogEmbeddingIndex(primary, primaryUrl, {
      nativeIndexPath: primary?.sourceIndex || visionConfig.catalogIndex,
      metadataOnly: canUseNativeMetadata,
    });
    if (normalizedPrimary.entries.length) {
      catalogIndexTiming = {
        source: primaryUrl === visionConfig.catalogIndex ? "primary" : "primary-metadata",
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

  function nativeMetadataIndexPath(indexPath = "") {
    return String(indexPath || "").replace(/\.json(?:\?.*)?$/i, ".native-meta.json");
  }

  function getCatalogIndexMetric(index) {
    if (index?.metric === "max-inner-product" || index?.metric === "cosine") return index.metric;
    if (index?.algorithm === "flat-cosine") return "cosine";
    if (index?.algorithm === "flat-inner-product") return "max-inner-product";
    return "cosine";
  }

  function normalizeCatalogEmbeddingIndex(index, url = "", options = {}) {
    const metric = getCatalogIndexMetric(index);
    const embeddingConfig = index?.embedding || {};
    const dimension = Number(embeddingConfig.dimension || index?.dimension || 0);
    const entries = Array.isArray(index?.entries)
      ? index.entries
        .filter((entry) => options.metadataOnly || (Array.isArray(entry.embedding) && entry.embedding.length))
        .map((entry) => normalizeCatalogIndexEntry(entry, index))
        .filter(Boolean)
      : [];
    const normalized = {
      ...(index || {}),
      sourceUrl: url,
      nativeIndexPath: options.nativeIndexPath || index?.sourceIndex || url,
      metadataOnly: Boolean(options.metadataOnly),
      metric,
      dimension,
      threshold: Number(index?.threshold ?? index?.thresholds?.acceptScore ?? visionConfig.catalogThreshold),
      marginThreshold: Number(index?.marginThreshold ?? index?.thresholds?.acceptMargin ?? visionConfig.catalogMarginThreshold),
      topK: Math.max(1, Math.round(Number(index?.topK || visionConfig.catalogTopK))),
      entries,
    };
    normalized.search = options.metadataOnly ? null : buildCatalogSearchMatrix(normalized);
    normalized.entryById = new Map(entries.map((entry) => [entry.id, entry]));
    return normalized;
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

  function buildCatalogSearchMatrix(index) {
    const dimension = Number(index.dimension || 0);
    const entries = Array.isArray(index.entries) ? index.entries : [];
    if (!dimension || !entries.length) return null;
    const compatibleEntries = [];
    for (const entry of entries) {
      if (
        entry.dimension === dimension
        && (entry.metric === index.metric || !entry.metric)
        && Array.isArray(entry.embedding)
        && entry.embedding.length === dimension
      ) {
        compatibleEntries.push(entry);
      }
    }
    if (!compatibleEntries.length) return null;
    const values = new Float32Array(compatibleEntries.length * dimension);
    for (let entryIndex = 0; entryIndex < compatibleEntries.length; entryIndex += 1) {
      const embedding = compatibleEntries[entryIndex].embedding;
      const offset = entryIndex * dimension;
      if (index.metric === "cosine") {
        let norm = 0;
        for (let dim = 0; dim < dimension; dim += 1) norm += embedding[dim] * embedding[dim];
        norm = Math.sqrt(norm) || 1;
        for (let dim = 0; dim < dimension; dim += 1) values[offset + dim] = embedding[dim] / norm;
      } else {
        for (let dim = 0; dim < dimension; dim += 1) values[offset + dim] = embedding[dim];
      }
    }
    return {
      dimension,
      entries: compatibleEntries,
      values,
      metric: index.metric,
    };
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

  function poolFeatureBatchOutput(output, expectedCount = 1) {
    const data = Array.from(output?.data || output?.[0]?.data || [], Number);
    const dims = Array.isArray(output?.dims) ? output.dims : (Array.isArray(output?.[0]?.dims) ? output[0].dims : []);
    if (dims.length === 2 && dims[0] > 0 && dims[1] > 0 && data.length === dims[0] * dims[1]) {
      return Array.from({ length: Math.min(expectedCount, dims[0]) }, (_, batchIndex) => (
        data.slice(batchIndex * dims[1], (batchIndex + 1) * dims[1])
      ));
    }
    if (dims.length === 3 && dims[0] > 0 && dims[1] > 0 && dims[2] > 0 && data.length === dims[0] * dims[1] * dims[2]) {
      return Array.from({ length: Math.min(expectedCount, dims[0]) }, (_, batchIndex) => {
        const pooled = Array(dims[2]).fill(0);
        const batchOffset = batchIndex * dims[1] * dims[2];
        for (let token = 0; token < dims[1]; token += 1) {
          for (let dim = 0; dim < dims[2]; dim += 1) {
            pooled[dim] += data[batchOffset + (token * dims[2]) + dim];
          }
        }
        return pooled.map((value) => value / dims[1]);
      });
    }
    if (expectedCount === 1) return [poolFeatureOutput(output)];
    return [];
  }

  function imageInputByteLength(input) {
    if (input && typeof input === "object" && Number.isFinite(input.width) && Number.isFinite(input.height)) {
      return Math.round(Number(input.width) * Number(input.height) * 4);
    }
    const text = String(input || "");
    const commaIndex = text.indexOf(",");
    if (commaIndex < 0) return text.length;
    const payloadLength = text.length - commaIndex - 1;
    return Math.round((payloadLength * 3) / 4);
  }

  function imageInputSize(input) {
    if (input && typeof input === "object" && Number.isFinite(input.width) && Number.isFinite(input.height)) {
      return { width: Math.round(Number(input.width)), height: Math.round(Number(input.height)) };
    }
    return { width: 0, height: 0 };
  }

  function paddedPercentRegion(box) {
    const paddingPct = Number(visionConfig.embeddingCropPaddingPct) || 0;
    const padX = ((Number(box?.w) || 0) * paddingPct) / 100;
    const padY = ((Number(box?.h) || 0) * paddingPct) / 100;
    const x1 = clampNumber((Number(box?.x) || 0) - padX, 0, 100);
    const y1 = clampNumber((Number(box?.y) || 0) - padY, 0, 100);
    const x2 = clampNumber((Number(box?.x) || 0) + (Number(box?.w) || 0) + padX, x1 + 0.01, 100);
    const y2 = clampNumber((Number(box?.y) || 0) + (Number(box?.h) || 0) + padY, y1 + 0.01, 100);
    return {
      x: roundNumber(x1, 4),
      y: roundNumber(y1, 4),
      w: roundNumber(x2 - x1, 4),
      h: roundNumber(y2 - y1, 4),
    };
  }

  async function runImageExtractor(extractor, inputs) {
    if (
      visionConfig.catalogEmbeddingDirectPathEnabled
      && !catalogDirectExtractorUnsupported
      && extractor?.processor
      && extractor?.model
    ) {
      try {
        const processorStartedAt = performance.now();
        const processed = await extractor.processor(Array.isArray(inputs) ? inputs : [inputs]);
        const processorMs = Math.round((performance.now() - processorStartedAt) * 1000) / 1000;
        const modelStartedAt = performance.now();
        const outputs = await extractor.model({ pixel_values: processed.pixel_values });
        const modelMs = Math.round((performance.now() - modelStartedAt) * 1000) / 1000;
        return {
          output: outputs.last_hidden_state ?? outputs.logits ?? outputs.image_embeds,
          mode: "direct",
          processorMs,
          modelMs,
        };
      } catch (error) {
        catalogDirectExtractorUnsupported = true;
        console.info("Catalog direct embedding path unavailable, using pipeline.", error);
      }
    }
    const pipelineStartedAt = performance.now();
    const output = await extractor(inputs);
    return {
      output,
      mode: "pipeline",
      processorMs: 0,
      modelMs: Math.round((performance.now() - pipelineStartedAt) * 1000) / 1000,
    };
  }

  async function embedImageInput(input) {
    const readyStartedAt = performance.now();
    const extractor = await getCatalogFeatureExtractor();
    const embeddingModelReadyMs = Math.round((performance.now() - readyStartedAt) * 1000) / 1000;
    if (!extractor) return { vector: null, timings: { embeddingModelReadyMs } };
    const extractorStartedAt = performance.now();
    const extracted = await runImageExtractor(extractor, input);
    const output = extracted.output;
    const embeddingExtractorMs = Math.round((performance.now() - extractorStartedAt) * 1000) / 1000;
    const postprocessStartedAt = performance.now();
    const values = poolFeatureOutput(output);
    const vector = values ? normalizeVector(values) : null;
    const embeddingPostprocessMs = Math.round((performance.now() - postprocessStartedAt) * 1000) / 1000;
    const inputSize = imageInputSize(input);
    return {
      vector,
      timings: {
        embeddingModelReadyMs,
        embeddingExtractorMs,
        embeddingPostprocessMs,
        embeddingExtractorMode: extracted.mode,
        embeddingProcessorMs: extracted.processorMs,
        embeddingModelMs: extracted.modelMs,
        embeddingInputBytes: imageInputByteLength(input),
        embeddingInputWidth: inputSize.width,
        embeddingInputHeight: inputSize.height,
      },
    };
  }

  async function embedImageInputs(imageInputs) {
    const inputs = Array.isArray(imageInputs) ? imageInputs : [];
    if (!inputs.length) return [];
    if (inputs.length > catalogMaxSupportedBatchSize) {
      throw new Error(`catalog-batch-embedding-unsupported:${inputs.length}>${catalogMaxSupportedBatchSize}`);
    }
    if (visionConfig.nativeCatalogEmbeddingEnabled && typeof nativeEmbedImageDataUrls === "function") {
      const nativeStartedAt = performance.now();
      try {
        const nativeResult = await nativeEmbedImageDataUrls({
          model: visionConfig.catalogModel,
          images: inputs.map((input) => (
            typeof input === "string" ? input : input.toDataURL("image/jpeg", visionConfig.embeddingCropQuality)
          )),
        });
        const vectors = Array.isArray(nativeResult?.vectors) ? nativeResult.vectors : [];
        if (vectors.length === inputs.length && vectors.every((vector) => Array.isArray(vector) && vector.length)) {
          const nativeMs = Math.round((performance.now() - nativeStartedAt) * 1000) / 1000;
          const nativeTimings = nativeResult?.timings && typeof nativeResult.timings === "object" ? nativeResult.timings : {};
          const nativeTotalMs = Number(nativeTimings.totalMs) || nativeMs;
          const nativeLoadMs = Number(nativeTimings.loadMs) || 0;
          const nativePreprocessMs = Number(nativeTimings.preprocessMs) || 0;
          const nativeInferenceMs = Number(nativeTimings.inferenceMs) || 0;
          const nativePostprocessMs = Number(nativeTimings.postprocessMs) || 0;
          const inputBytes = inputs.map(imageInputByteLength);
          return vectors.map((vector, index) => ({
            vector: normalizeVector(vector),
            timings: {
              embeddingModelReadyMs: roundNumber(nativeLoadMs / inputs.length, 3),
              embeddingExtractorMs: roundNumber(nativeTotalMs / inputs.length, 3),
              embeddingPostprocessMs: roundNumber(nativePostprocessMs / inputs.length, 3),
              embeddingBatchSize: inputs.length,
              embeddingBatchExtractorMs: nativeTotalMs,
              embeddingBatchPostprocessMs: nativePostprocessMs,
              embeddingBatchTotalMs: nativeTotalMs,
              embeddingBatchMode: nativeResult?.mode || "native",
              embeddingExtractorMode: nativeResult?.mode || "native",
              embeddingBatchProcessorMs: nativePreprocessMs,
              embeddingBatchModelMs: nativeInferenceMs,
              embeddingProcessorMs: roundNumber(nativePreprocessMs / inputs.length, 3),
              embeddingModelMs: roundNumber(nativeInferenceMs / inputs.length, 3),
              embeddingOutputDimension: Number(nativeResult?.dimension) || vector.length,
              embeddingInputBytes: inputBytes[index],
              embeddingInputWidth: imageInputSize(inputs[index]).width,
              embeddingInputHeight: imageInputSize(inputs[index]).height,
            },
          }));
        }
      } catch (error) {
        console.info("Native catalog embedding unavailable, using web extractor.", error);
      }
    }
    const readyStartedAt = performance.now();
    const extractor = await getCatalogFeatureExtractor();
    const embeddingModelReadyMs = Math.round((performance.now() - readyStartedAt) * 1000) / 1000;
    if (!extractor) {
      return inputs.map(() => ({ vector: null, timings: { embeddingModelReadyMs } }));
    }
    const inputBytes = inputs.map(imageInputByteLength);
    const extractorStartedAt = performance.now();
    try {
      const extracted = await runImageExtractor(extractor, inputs);
      const output = extracted.output;
      const embeddingExtractorMs = Math.round((performance.now() - extractorStartedAt) * 1000) / 1000;
      const postprocessStartedAt = performance.now();
      const vectors = poolFeatureBatchOutput(output, inputs.length).map((values) => normalizeVector(values));
      const embeddingPostprocessMs = Math.round((performance.now() - postprocessStartedAt) * 1000) / 1000;
      if (vectors.length !== inputs.length || vectors.some((vector) => !vector?.length)) {
        throw new Error(`batch-output-mismatch:${vectors.length}/${inputs.length}`);
      }
      return vectors.map((vector, index) => ({
        vector,
        timings: {
          embeddingModelReadyMs,
          embeddingExtractorMs: roundNumber(embeddingExtractorMs / inputs.length, 3),
          embeddingPostprocessMs: roundNumber(embeddingPostprocessMs / inputs.length, 3),
          embeddingBatchSize: inputs.length,
          embeddingBatchExtractorMs: embeddingExtractorMs,
          embeddingBatchPostprocessMs: embeddingPostprocessMs,
          embeddingBatchMode: extracted.mode === "direct" ? "direct-batch" : "batch",
          embeddingExtractorMode: extracted.mode,
          embeddingProcessorMs: roundNumber(extracted.processorMs / inputs.length, 3),
          embeddingModelMs: roundNumber(extracted.modelMs / inputs.length, 3),
          embeddingBatchProcessorMs: extracted.processorMs,
          embeddingBatchModelMs: extracted.modelMs,
          embeddingInputBytes: inputBytes[index],
          embeddingInputWidth: imageInputSize(inputs[index]).width,
          embeddingInputHeight: imageInputSize(inputs[index]).height,
        },
      }));
    } catch (error) {
      console.info("Catalog batch embedding failed, falling back to single-image embedding.", error);
      if (inputs.length > 1) {
        catalogMaxSupportedBatchSize = Math.min(catalogMaxSupportedBatchSize, inputs.length - 1);
        throw error;
      }
      return Promise.all(inputs.map(async (input) => {
        const single = await embedImageInput(input);
        return {
          ...single,
          timings: {
            ...(single.timings || {}),
            embeddingBatchSize: 1,
            embeddingBatchMode: "fallback-single",
          },
        };
      }));
    }
  }

  async function embedImageRegions(sourceImage, boxes, index = null, topK = 0) {
    const inputs = Array.isArray(boxes) ? boxes : [];
    if (
      !inputs.length
      || !visionConfig.nativeCatalogEmbeddingEnabled
      || typeof nativeEmbedImageRegions !== "function"
      || typeof sourceImage !== "string"
      || !sourceImage
    ) {
      return null;
    }
    const nativeStartedAt = performance.now();
    try {
      const nativeResult = await nativeEmbedImageRegions({
        model: visionConfig.catalogModel,
        image: sourceImage,
        regions: inputs.map(paddedPercentRegion),
        indexPath: index?.nativeIndexPath || index?.sourceUrl || visionConfig.catalogIndex || "",
        topK: Math.max(1, Math.round(Number(topK) || Number(index?.topK) || Number(visionConfig.catalogTopK) || 1)),
      });
      const vectors = Array.isArray(nativeResult?.vectors) ? nativeResult.vectors : [];
      if (vectors.length !== inputs.length || vectors.some((vector) => !Array.isArray(vector) || !vector.length)) return null;
      const nativeMatches = Array.isArray(nativeResult?.matches) ? nativeResult.matches : [];
      const nativeMs = Math.round((performance.now() - nativeStartedAt) * 1000) / 1000;
      const nativeTimings = nativeResult?.timings && typeof nativeResult.timings === "object" ? nativeResult.timings : {};
      const nativeTotalMs = Number(nativeTimings.totalMs) || nativeMs;
      const nativeLoadMs = Number(nativeTimings.loadMs) || 0;
      const nativeDecodeMs = Number(nativeTimings.decodeMs) || 0;
      const nativePreprocessMs = Number(nativeTimings.preprocessMs) || 0;
      const nativeInferenceMs = Number(nativeTimings.inferenceMs) || 0;
      const nativePostprocessMs = Number(nativeTimings.postprocessMs) || 0;
      const nativeSearchMs = Number(nativeTimings.searchMs) || 0;
      const nativeIndexFormat = nativeTimings.indexFormat || "";
      const sourceBytes = imageInputByteLength(sourceImage);
      return vectors.map((vector, indexInBatch) => ({
        vector: normalizeVector(vector),
        nativeMatches: Array.isArray(nativeMatches[indexInBatch]) ? nativeMatches[indexInBatch] : null,
        timings: {
          embeddingModelReadyMs: roundNumber(nativeLoadMs / inputs.length, 3),
          embeddingExtractorMs: roundNumber(nativeTotalMs / inputs.length, 3),
          embeddingPostprocessMs: roundNumber(nativePostprocessMs / inputs.length, 3),
          embeddingBatchSize: inputs.length,
          embeddingBatchExtractorMs: nativeTotalMs,
          embeddingBatchPostprocessMs: nativePostprocessMs,
          embeddingBatchTotalMs: nativeTotalMs,
          embeddingBatchMode: nativeResult?.mode || "native-regions",
          embeddingExtractorMode: nativeResult?.mode || "native-regions",
          embeddingBatchProcessorMs: nativePreprocessMs,
          embeddingBatchModelMs: nativeInferenceMs,
          embeddingBatchDecodeMs: nativeDecodeMs,
          embeddingBatchSearchMs: nativeSearchMs,
          embeddingProcessorMs: roundNumber(nativePreprocessMs / inputs.length, 3),
          embeddingModelMs: roundNumber(nativeInferenceMs / inputs.length, 3),
          embeddingDecodeMs: roundNumber(nativeDecodeMs / inputs.length, 3),
          embeddingNativeSearchMs: roundNumber(nativeSearchMs / inputs.length, 3),
          embeddingNativeIndexFormat: nativeIndexFormat,
          embeddingOutputDimension: Number(nativeResult?.dimension) || vector.length,
          embeddingInputBytes: roundNumber(sourceBytes / inputs.length, 0),
        },
      }));
    } catch (error) {
      console.info("Native catalog region embedding unavailable, using crop embedding.", error);
      return null;
    }
  }

  function createEmbeddingCrop(source, box) {
    const cropStartedAt = performance.now();
    const cropRect = getCropPixelRect(source, box, {
      paddingPct: visionConfig.embeddingCropPaddingPct,
    });
    const cropInput = typeof cropImageToCanvas === "function" ? cropImageToCanvas(source, box, {
      paddingPct: visionConfig.embeddingCropPaddingPct,
      maxDimension: visionConfig.embeddingCropMaxDimension,
      quality: visionConfig.embeddingCropQuality,
    }) : cropImageToDataUrl(source, box, {
      paddingPct: visionConfig.embeddingCropPaddingPct,
      maxDimension: visionConfig.embeddingCropMaxDimension,
      quality: visionConfig.embeddingCropQuality,
    });
    return {
      cropRect,
      cropInput,
      cropMs: Math.round((performance.now() - cropStartedAt) * 1000) / 1000,
    };
  }

  function createEmptyCatalogMatch(reason, startedAt, timings = {}) {
    return {
      accepted: false,
      name: "",
      category: "",
      confidence: 0,
      catalogCandidates: [],
      namingRejectionReason: reason,
      timings: {
        ...timings,
        catalogTotalMs: Math.round((performance.now() - startedAt) * 1000) / 1000,
        catalogIndexLoadMs: catalogIndexTiming?.loadMs || 0,
      },
    };
  }

  function getCompatibleEntries(index, embedding) {
    if (index.search?.dimension === embedding.length) {
      return {
        compatibleEntries: index.search.entries,
        expectedDimension: index.search.dimension,
        search: index.search,
      };
    }
    const expectedDimension = Number(index.dimension || embedding.length);
    const compatibleEntries = index.entries.filter((entry) => (
      entry.dimension === embedding.length
        && (!expectedDimension || entry.dimension === expectedDimension)
        && (entry.metric === index.metric || !entry.metric)
    ));
    const ignoredCount = index.entries.length - compatibleEntries.length;
    if (ignoredCount > 0 && !catalogIndexWarningShown) {
      catalogIndexWarningShown = true;
      console.info(`Vision category index ignored ${ignoredCount} entries with mismatched dimension or metric.`);
    }
    return { compatibleEntries, expectedDimension };
  }

  function insertTopEntry(topEntries, entry, score, limit) {
    if (topEntries.length && score <= topEntries[topEntries.length - 1].score && topEntries.length >= limit) return;
    let insertAt = topEntries.length;
    while (insertAt > 0 && score > topEntries[insertAt - 1].score) insertAt -= 1;
    topEntries.splice(insertAt, 0, { entry, score });
    if (topEntries.length > limit) topEntries.length = limit;
  }

  function findTopCatalogEntries(index, embedding, limit) {
    const search = index.search;
    if (!search || search.dimension !== embedding.length) {
      const { compatibleEntries } = getCompatibleEntries(index, embedding);
      return compatibleEntries
        .map((entry) => ({ ...entry, score: vectorSimilarity(embedding, entry.embedding, index.metric) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    const topEntries = [];
    const values = search.values;
    const entries = search.entries;
    const dimension = search.dimension;
    const query = embedding instanceof Float32Array ? embedding : Float32Array.from(embedding);
    for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
      const offset = entryIndex * dimension;
      let score = 0;
      for (let dim = 0; dim < dimension; dim += 1) score += query[dim] * values[offset + dim];
      insertTopEntry(topEntries, entries[entryIndex], score, limit);
    }
    return topEntries.map(({ entry, score }) => ({ ...entry, score }));
  }

  async function rankCatalogEmbedding({ index, embedding, cropImage, cropRect, cropMs, embeddingMs, embeddingTimings, startedAt, options = {} }) {
    const { compatibleEntries, expectedDimension } = getCompatibleEntries(index, embedding);
    if (!compatibleEntries.length) {
      return createEmptyCatalogMatch(`catalog-dimension-mismatch:${embedding.length}/${expectedDimension}`, startedAt, {
        catalogCropMs: cropMs,
        embeddingMs,
        ...embeddingTimings,
        embeddingCropWidth: cropRect.width,
        embeddingCropHeight: cropRect.height,
        catalogEntries: 0,
      });
    }

    const searchStartedAt = performance.now();
    const retrievalTopK = Math.max(
      Number(index.topK || 0),
      Number(visionConfig.catalogRetrievalTopK || 0),
      Number(visionConfig.catalogTopK || 0),
      1,
    );
    const rankedEntries = findTopCatalogEntries(index, embedding, retrievalTopK);
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
        ...embeddingTimings,
        embeddingCropWidth: cropRect.width,
        embeddingCropHeight: cropRect.height,
        catalogSearchMs: Math.round((performance.now() - searchStartedAt) * 1000) / 1000,
        catalogTotalMs: Math.round((performance.now() - startedAt) * 1000) / 1000,
        catalogEntries: compatibleEntries.length,
        catalogIndexLoadMs: catalogIndexTiming?.loadMs || 0,
      },
    };
  }

  async function rankCatalogNativeMatches({ index, nativeMatches, cropImage, cropRect, cropMs, embeddingMs, embeddingTimings, startedAt, options = {} }) {
    const entryById = index.entryById instanceof Map
      ? index.entryById
      : new Map((index.entries || []).map((entry) => [entry.id, entry]));
    const rankedEntries = (Array.isArray(nativeMatches) ? nativeMatches : [])
      .map((match) => {
        const entry = entryById.get(match?.id);
        if (!entry) return null;
        return { ...entry, score: Number(match.score) || 0 };
      })
      .filter(Boolean);
    if (!rankedEntries.length) {
      return createEmptyCatalogMatch("native-catalog-search-empty", startedAt, {
        catalogCropMs: cropMs,
        embeddingMs,
        ...embeddingTimings,
        embeddingCropWidth: cropRect.width,
        embeddingCropHeight: cropRect.height,
        catalogEntries: index.entries.length,
      });
    }

    const searchStartedAt = performance.now();
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
        ...embeddingTimings,
        embeddingCropWidth: cropRect.width,
        embeddingCropHeight: cropRect.height,
        catalogSearchMs: Math.round((performance.now() - searchStartedAt) * 1000) / 1000,
        catalogTotalMs: Math.round((performance.now() - startedAt) * 1000) / 1000,
        catalogEntries: index.entries.length,
        catalogIndexLoadMs: catalogIndexTiming?.loadMs || 0,
      },
    };
  }

  async function matchCatalogFromEmbeddingIndex(source, box, options = {}) {
    const startedAt = performance.now();
    const index = await getCatalogEmbeddingIndex();
    if (!index.entries?.length) {
      return createEmptyCatalogMatch("catalog-index-empty", startedAt, { catalogEntries: 0 });
    }
    const crop = createEmbeddingCrop(source, box);
    const embeddingStartedAt = performance.now();
    const embedded = await embedImageInput(crop.cropInput);
    const embedding = embedded?.vector || null;
    const embeddingMs = Math.round((performance.now() - embeddingStartedAt) * 1000) / 1000;
    const embeddingTimings = embedded?.timings || {};
    if (!embedding) {
      return createEmptyCatalogMatch("catalog-embedding-unavailable", startedAt, {
        catalogCropMs: crop.cropMs,
        embeddingMs,
        ...embeddingTimings,
        embeddingCropWidth: crop.cropRect.width,
        embeddingCropHeight: crop.cropRect.height,
        catalogEntries: index.entries.length,
      });
    }
    return rankCatalogEmbedding({
      index,
      embedding,
      cropImage: crop.cropInput,
      cropRect: crop.cropRect,
      cropMs: crop.cropMs,
      embeddingMs,
      embeddingTimings,
      startedAt,
      options,
    });
  }

  async function matchCatalogBatchFromEmbeddingIndex(source, boxes, optionsList = [], batchOptions = {}) {
    const startedAt = performance.now();
    const index = await getCatalogEmbeddingIndex();
    const inputs = Array.isArray(boxes) ? boxes : [];
    if (!inputs.length) return [];
    if (!index.entries?.length) {
      return inputs.map(() => createEmptyCatalogMatch("catalog-index-empty", startedAt, { catalogEntries: 0 }));
    }
    const retrievalTopK = Math.max(
      Number(index.topK || 0),
      Number(visionConfig.catalogRetrievalTopK || 0),
      Number(visionConfig.catalogTopK || 0),
      1,
    );
    const regionEmbedded = await embedImageRegions(batchOptions.sourceImage, inputs, index, retrievalTopK);
    if (regionEmbedded) {
      const cropRects = inputs.map((box) => getCropPixelRect(source, box, {
        paddingPct: visionConfig.embeddingCropPaddingPct,
      }));
      const batchEmbeddingMs = Math.max(...regionEmbedded.map((result) => (
        Number(result.timings?.embeddingBatchTotalMs) || 0
      )), 0);
      return Promise.all(inputs.map((box, indexInBatch) => {
        const result = regionEmbedded[indexInBatch] || {};
        const embedding = result.vector || null;
        const embeddingTimings = {
          ...(result.timings || {}),
          embeddingBatchTotalMs: batchEmbeddingMs,
        };
        const embeddingMs = roundNumber(batchEmbeddingMs / Math.max(1, inputs.length), 3);
        const cropRect = cropRects[indexInBatch] || { width: 0, height: 0 };
        if (!embedding) {
          return createEmptyCatalogMatch("catalog-embedding-unavailable", startedAt, {
            catalogCropMs: 0,
            embeddingMs,
            ...embeddingTimings,
            embeddingCropWidth: cropRect.width,
            embeddingCropHeight: cropRect.height,
            catalogEntries: index.entries.length,
          });
        }
        if (Array.isArray(result.nativeMatches) && result.nativeMatches.length) {
          return rankCatalogNativeMatches({
            index,
            nativeMatches: result.nativeMatches,
            cropImage: batchOptions.sourceImage || source,
            cropRect,
            cropMs: 0,
            embeddingMs,
            embeddingTimings,
            startedAt,
            options: optionsList[indexInBatch] || {},
          });
        }
        return rankCatalogEmbedding({
          index,
          embedding,
          cropImage: batchOptions.sourceImage || source,
          cropRect,
          cropMs: 0,
          embeddingMs,
          embeddingTimings,
          startedAt,
          options: optionsList[indexInBatch] || {},
        });
      }));
    }
    const crops = inputs.map((box) => createEmbeddingCrop(source, box));
    const embeddingStartedAt = performance.now();
    const embedded = await embedImageInputs(crops.map((crop) => crop.cropInput));
    const batchEmbeddingMs = Math.round((performance.now() - embeddingStartedAt) * 1000) / 1000;
    return Promise.all(crops.map((crop, indexInBatch) => {
      const result = embedded[indexInBatch] || {};
      const embedding = result.vector || null;
      const embeddingTimings = {
        ...(result.timings || {}),
        embeddingBatchTotalMs: batchEmbeddingMs,
      };
      const embeddingMs = roundNumber(batchEmbeddingMs / Math.max(1, inputs.length), 3);
      if (!embedding) {
        return createEmptyCatalogMatch("catalog-embedding-unavailable", startedAt, {
          catalogCropMs: crop.cropMs,
          embeddingMs,
          ...embeddingTimings,
          embeddingCropWidth: crop.cropRect.width,
          embeddingCropHeight: crop.cropRect.height,
          catalogEntries: index.entries.length,
        });
      }
      return rankCatalogEmbedding({
        index,
        embedding,
        cropImage: crop.cropInput,
        cropRect: crop.cropRect,
        cropMs: crop.cropMs,
        embeddingMs,
        embeddingTimings,
        startedAt,
        options: optionsList[indexInBatch] || {},
      });
    }));
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
    matchCatalogBatchFromEmbeddingIndex,
    matchCatalogFromEmbeddingIndex,
  };
}
