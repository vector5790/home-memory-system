export function createRecordDomain({
  categoryLabels,
  clampBox,
  clampNumber,
  createId,
  normalizeCropMeta,
  normalizeReminderList,
  repeatLabels,
  seedState,
}) {
  function normalizeItem(item = {}, index = 0) {
    const reminders = normalizeReminderList(item);
    const primaryReminder = reminders[0] || null;
    return {
      ...item,
      id: item.id || createId("item", item.name || `物品${index + 1}`),
      name: String(item.name || `物品${index + 1}`).trim(),
      aliases: Array.isArray(item.aliases) ? item.aliases : [],
      category: categoryLabels[item.category] ? item.category : "daily",
      qty: Math.max(1, Math.round(Number(item.qty) || 1)),
      roomId: item.roomId || seedState.capture.roomId,
      placeId: item.placeId || null,
      container: item.container || "",
      box: clampBox(item.box),
      expireAt: item.expireAt || null,
      reminders,
      nextAt: item.nextAt || primaryReminder?.date || null,
      nextTime: item.nextTime || primaryReminder?.time || null,
      nextRepeat: item.nextRepeat || primaryReminder?.repeat || null,
      nextLabel: item.nextLabel || primaryReminder?.title || null,
      confidence: clampNumber(item.confidence ?? 0.75, 0, 1),
    };
  }

  function normalizeItems(items) {
    return Array.isArray(items)
      ? items.map((item, index) => normalizeItem(item, index)).filter((item) => item.name)
      : [];
  }

  function normalizeCandidate(candidate = {}, index = 0, provider = "local-image") {
    const name = String(candidate.name || `候选物品 ${index + 1}`).trim();
    const category = categoryLabels[candidate.category] ? candidate.category : "daily";
    const qty = Math.max(1, Math.round(Number(candidate.qty) || 1));
    const confidence = clampNumber(candidate.confidence ?? 0.75, 0, 1);
    const reminders = normalizeReminderList(candidate);
    const primaryReminder = reminders[0] || null;

    return {
      id: candidate.id || `candidate-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      name,
      aliases: Array.isArray(candidate.aliases) ? candidate.aliases : [],
      category,
      qty,
      expireAt: candidate.expireAt || "",
      reminders,
      nextAt: candidate.nextAt || primaryReminder?.date || "",
      nextTime: candidate.nextTime || primaryReminder?.time || "09:00",
      nextRepeat: repeatLabels[candidate.nextRepeat] ? candidate.nextRepeat : (primaryReminder?.repeat || "none"),
      nextLabel: candidate.nextLabel || primaryReminder?.title || "",
      container: candidate.container || "",
      box: clampBox(candidate.box),
      confidence,
      selected: candidate.selected !== false,
      deletedAt: candidate.deletedAt || null,
      source: candidate.source || provider,
      namingStatus: candidate.namingStatus || "done",
      detectionLabel: candidate.detectionLabel || "",
      suggestedName: candidate.suggestedName || "",
      catalogId: candidate.catalogId || "",
      categoryId: candidate.categoryId || candidate.catalogId || "",
      categoryPath: Array.isArray(candidate.categoryPath) ? candidate.categoryPath : [],
      categoryScore: Number.isFinite(Number(candidate.categoryScore)) ? Number(candidate.categoryScore) : null,
      categoryMargin: Number.isFinite(Number(candidate.categoryMargin)) ? Number(candidate.categoryMargin) : null,
      categoryCluster: candidate.categoryCluster || null,
      categoryClusterId: candidate.categoryClusterId || candidate.categoryCluster?.id || "",
      categoryClusterLabel: candidate.categoryClusterLabel || candidate.categoryCluster?.label || "",
      catalogCandidates: Array.isArray(candidate.catalogCandidates) ? candidate.catalogCandidates : [],
      namingRejectionReason: candidate.namingRejectionReason || "",
      namingAcceptancePolicy: candidate.namingAcceptancePolicy || null,
      ocrText: candidate.ocrText || "",
      matchedSampleIds: Array.isArray(candidate.matchedSampleIds) ? candidate.matchedSampleIds : [],
      categoryIndexVersion: candidate.categoryIndexVersion || "",
      cropImage: candidate.cropImage || "",
      cropMeta: normalizeCropMeta(candidate.cropMeta),
      cropVersion: candidate.cropVersion || "",
      edited: Boolean(candidate.edited),
      detailsOpen: Boolean(candidate.detailsOpen),
      boxOpen: Boolean(candidate.boxOpen),
    };
  }

  function normalizeRecognitionResults(results, provider = "local-image") {
    if (!Array.isArray(results)) {
      throw new Error("Recognition provider returned invalid data");
    }
    return results
      .map((candidate, index) => normalizeCandidate(candidate, index, provider))
      .filter((candidate) => candidate.name);
  }

  function isCandidateDeleted(candidate) {
    return Boolean(candidate?.deletedAt);
  }

  function getUnknownObjectName(index) {
    let number = index + 1;
    let suffix = "";
    while (number > 0) {
      number -= 1;
      suffix = String.fromCharCode(65 + (number % 26)) + suffix;
      number = Math.floor(number / 26);
    }
    return `物品${suffix}`;
  }

  function isUnknownObjectName(name) {
    return /^物品[A-Z]+$/.test(String(name || ""));
  }

  function renumberUnknownCandidates(candidates) {
    let unknownIndex = 0;
    return candidates.map((candidate) => {
      if (candidate.edited) return candidate;
      const shouldRename = !candidate.name || isUnknownObjectName(candidate.name) || String(candidate.name).startsWith("候选区域");
      if (!shouldRename) return candidate;
      const name = getUnknownObjectName(unknownIndex);
      unknownIndex += 1;
      return { ...candidate, name };
    });
  }

  return {
    getUnknownObjectName,
    isCandidateDeleted,
    isUnknownObjectName,
    normalizeCandidate,
    normalizeItem,
    normalizeItems,
    normalizeRecognitionResults,
    renumberUnknownCandidates,
  };
}
