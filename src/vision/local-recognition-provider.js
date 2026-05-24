export function createLocalRecognitionProvider({
  getAssetMode,
  getImageDimensions,
  getProvider,
  getWasmThreadCount,
  nameCandidates,
  normalizeRecognitionResults,
  prepareImageForDetection,
  recognizeWithHeuristicRegions,
  recognizeWithSmallModelCached,
  renumberUnknownCandidates,
}) {
  async function prepare(image) {
    return prepareImageForDetection(image).catch((error) => {
      console.info("Detection resize skipped.", error);
      return image;
    });
  }

  async function detect(image) {
    const requestedProvider = getProvider();
    const smallRecognition = await recognizeWithSmallModelCached(image)
      .catch((error) => {
        console.info("Small model unavailable, falling back to local image proposals.", error);
        return null;
      });

    let provider = smallRecognition?.provider || requestedProvider;
    const cacheHit = Boolean(smallRecognition?.cacheHit);
    let candidates = smallRecognition?.candidates?.length
      ? normalizeRecognitionResults(smallRecognition.candidates, provider)
      : [];

    if (!candidates.length) {
      const fallbackRecognition = await recognizeWithHeuristicRegions(image)
        .catch((error) => {
          console.info("Local proposal fallback failed.", error);
          return { provider: "local-image", candidates: [] };
        });
      provider = `${fallbackRecognition.provider || "local-image"}-fallback`;
      candidates = normalizeRecognitionResults(fallbackRecognition.candidates, provider);
    }

    return {
      provider,
      cacheHit,
      candidates: renumberUnknownCandidates(candidates),
    };
  }

  async function diagnostics({ image, provider, preprocessingMs, detectionMs, namingMs, totalMs, resultCount, cacheHit }) {
    return {
      provider,
      assetMode: await getAssetMode().catch(() => null),
      imageDimensions: await getImageDimensions(image).catch(() => null),
      preprocessingMs: preprocessingMs || null,
      detectionMs,
      namingMs,
      totalMs,
      resultCount,
      cacheHit,
      wasmThreads: getWasmThreadCount(),
    };
  }

  return {
    detect,
    diagnostics,
    nameCandidates,
    prepare,
  };
}
