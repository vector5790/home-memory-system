export function createVisionJsonFetcher(visionConfig) {
  return async function fetchJsonIndex(url) {
    if (!url) return null;
    const response = await fetch(`${url}?v=${visionConfig.assetVersion}`, { cache: "no-store" });
    return response.ok ? response.json() : null;
  };
}
