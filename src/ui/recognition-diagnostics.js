function sumTiming(candidates, key) {
  return candidates.reduce((total, candidate) => total + (Number(candidate.timings?.[key]) || 0), 0);
}

function maxTiming(candidates, key) {
  return Math.max(...candidates.map((candidate) => Number(candidate.timings?.[key]) || 0), 0);
}

function firstTiming(candidates, key) {
  return candidates.find((candidate) => candidate.timings?.[key])?.timings?.[key] || "";
}

export function summarizeNamingDiagnostics({
  candidates,
  catalogNamingConcurrency,
  getUnknownObjectName,
  isUnknownObjectName,
}) {
  const namedCandidates = Array.isArray(candidates) ? candidates : [];
  const maxEmbeddingCropLongSide = Math.max(...namedCandidates.map((candidate) => Math.max(
    Number(candidate.timings?.embeddingCropWidth) || 0,
    Number(candidate.timings?.embeddingCropHeight) || 0,
  )), 0);
  const catalogCandidateCount = namedCandidates.reduce((total, candidate) => (
    total + (Array.isArray(candidate.catalogCandidates) ? candidate.catalogCandidates.length : 0)
  ), 0);
  const namingRejectionReasons = Object.entries(namedCandidates.reduce((counts, candidate) => {
    const reason = candidate.namingRejectionReason || "";
    if (reason) counts[reason] = (counts[reason] || 0) + 1;
    return counts;
  }, {})).map(([reason, count]) => `${reason}:${count}`).join(",");
  return {
    embeddingMs: sumTiming(namedCandidates, "embeddingMs"),
    embeddingModelReadyMs: sumTiming(namedCandidates, "embeddingModelReadyMs"),
    embeddingExtractorMs: sumTiming(namedCandidates, "embeddingExtractorMs"),
    embeddingPostprocessMs: sumTiming(namedCandidates, "embeddingPostprocessMs"),
    embeddingInputBytes: sumTiming(namedCandidates, "embeddingInputBytes"),
    embeddingBatchSize: maxTiming(namedCandidates, "embeddingBatchSize"),
    embeddingBatchExtractorMs: maxTiming(namedCandidates, "embeddingBatchExtractorMs"),
    embeddingBatchTotalMs: maxTiming(namedCandidates, "embeddingBatchTotalMs"),
    embeddingBatchMode: firstTiming(namedCandidates, "embeddingBatchMode"),
    embeddingExtractorMode: firstTiming(namedCandidates, "embeddingExtractorMode"),
    embeddingNativeIndexFormat: firstTiming(namedCandidates, "embeddingNativeIndexFormat"),
    embeddingProcessorMs: sumTiming(namedCandidates, "embeddingProcessorMs"),
    embeddingModelMs: sumTiming(namedCandidates, "embeddingModelMs"),
    embeddingBatchProcessorMs: maxTiming(namedCandidates, "embeddingBatchProcessorMs"),
    embeddingBatchModelMs: maxTiming(namedCandidates, "embeddingBatchModelMs"),
    maxEmbeddingInputBytes: maxTiming(namedCandidates, "embeddingInputBytes"),
    maxEmbeddingCropLongSide,
    catalogCropMs: sumTiming(namedCandidates, "catalogCropMs"),
    catalogSearchMs: sumTiming(namedCandidates, "catalogSearchMs"),
    catalogTotalMs: sumTiming(namedCandidates, "catalogTotalMs"),
    catalogIndexLoadMs: maxTiming(namedCandidates, "catalogIndexLoadMs"),
    perCandidateNamingMs: namedCandidates.reduce((max, candidate) => Math.max(max, Number(candidate.timings?.namingMs) || 0), 0),
    embeddingNamedCount: namedCandidates.filter((candidate) => String(candidate.source || "").includes("embedding")).length,
    unresolvedNamingCount: namedCandidates.filter((candidate, index) => (
      !candidate.name || isUnknownObjectName(candidate.name) || candidate.name === getUnknownObjectName(index)
    )).length,
    catalogCandidateCount,
    namingRejectionReasons,
    catalogNamingConcurrency,
  };
}
