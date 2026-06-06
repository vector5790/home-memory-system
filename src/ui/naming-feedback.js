export function buildNamingFeedbackRecord({
  action,
  candidate,
  createId,
  customName = "",
  hashStringFast,
  image = "",
  imageRef = null,
  noCandidateMatch = false,
  normalizeCropMeta,
  provider = "",
  selectedCandidateId = "",
  selectedCategoryId = "",
  selectedName = "",
}) {
  const topK = Array.isArray(candidate.catalogTopK) && candidate.catalogTopK.length
    ? candidate.catalogTopK
    : (candidate.catalogCandidates || []);
  return {
    id: createId("naming-feedback", `${candidate.id}-${action}`),
    createdAt: new Date().toISOString(),
    action,
    subjectId: candidate.id,
    sourceImageId: imageRef?.uri || imageRef?.webPath || `capture-${hashStringFast(image || "")}`,
    detectionProvider: candidate.providerId || provider || candidate.source || "",
    namingProvider: candidate.namingDiagnostics?.namingProvider || "catalog-embedding-index",
    originalName: candidate.name,
    originalCategoryId: candidate.categoryId || candidate.catalogId || "",
    originalScore: candidate.categoryScore ?? candidate.catalogCandidates?.[0]?.score ?? null,
    originalMargin: candidate.categoryMargin ?? null,
    namingOutcome: candidate.namingOutcome || "",
    rejectionReason: candidate.namingRejectionReason || "",
    subjectBox: candidate.box || null,
    modelBox: candidate.modelBox || candidate.namingDiagnostics?.modelBox || null,
    cropMeta: normalizeCropMeta(candidate.cropMeta),
    topK: topK.slice(0, 10),
    top3: (candidate.catalogCandidates || []).slice(0, 3),
    selectedCandidateId,
    selectedCategoryId,
    selectedName,
    customName,
    noCandidateMatch,
  };
}
