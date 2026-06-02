import { createCatalogMatcher } from "../src/vision/catalog-matcher.js";

const dimension = 512;

function makeVector(seed) {
  return Array.from({ length: dimension }, (_, index) => (index === seed ? 1 : 0));
}

const mockIndex = {
  metric: "cosine",
  dimension,
  threshold: 0.2,
  marginThreshold: 0.01,
  topK: 5,
  entries: [
    {
      id: "sample-a",
      categoryId: "cat-a",
      displayName: "测试物品A",
      appCategory: "daily",
      embedding: makeVector(3),
      sampleId: "a1",
    },
    {
      id: "sample-b",
      categoryId: "cat-b",
      displayName: "测试物品B",
      appCategory: "daily",
      embedding: makeVector(7),
      sampleId: "b1",
    },
  ],
};

let extractorInputs = null;

const matcher = createCatalogMatcher({
  clampNumber: (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0)),
  cropImageToCanvas: (_source, _box, options) => ({ width: options.maxDimension, height: options.maxDimension }),
  cropImageToDataUrl: () => "data:image/jpeg;base64,AA==",
  fetchJsonIndex: async () => mockIndex,
  getCatalogPromptEntries: () => [],
  getCropPixelRect: () => ({ x: 0, y: 0, width: 640, height: 360 }),
  loadTransformersRuntime: async () => ({
    runtimeMode: { catalogReady: true },
    pipeline: async () => async (inputs) => {
      extractorInputs = inputs;
      const count = Array.isArray(inputs) ? inputs.length : 1;
      const data = new Float32Array(count * dimension);
      for (let batchIndex = 0; batchIndex < count; batchIndex += 1) {
        data[(batchIndex * dimension) + (batchIndex === 0 ? 3 : 7)] = 1;
      }
      return { data, dims: [count, dimension] };
    },
  }),
  nativeEmbedImageDataUrls: null,
  visionCatalog: [],
  visionConfig: {
    catalogIndex: "/mock-index.json",
    catalogIndexFallback: "",
    catalogThreshold: 0.2,
    catalogMarginThreshold: 0.01,
    catalogTopK: 5,
    catalogRetrievalTopK: 5,
    embeddingCropPaddingPct: 4,
    embeddingCropMaxDimension: 224,
    embeddingCropQuality: 0.82,
    catalogOcrRerankerEnabled: false,
    catalogRerankerEnabled: false,
    nativeCatalogEmbeddingEnabled: false,
  },
});

const results = await matcher.matchCatalogBatchFromEmbeddingIndex(
  { naturalWidth: 1280, naturalHeight: 720 },
  [
    { x: 0, y: 0, w: 10, h: 10 },
    { x: 20, y: 20, w: 10, h: 10 },
  ],
);

if (!Array.isArray(extractorInputs) || extractorInputs.length !== 2) {
  throw new Error("Batch image inputs were not passed to the extractor.");
}

if (results[0]?.name !== "测试物品A" || results[1]?.name !== "测试物品B") {
  throw new Error(`Unexpected batch names: ${results.map((item) => item.name).join(",")}`);
}

if (results.some((item) => item.timings?.embeddingBatchMode !== "batch")) {
  throw new Error("Batch timing metadata is missing.");
}

console.log(`Vision embedding batch check passed: ${results.map((item) => item.name).join(", ")}`);
