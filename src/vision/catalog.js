import { normalizeText } from "../domain/text.js";

export function createVisionCatalog({ genericDetectionLabels, visionCatalog }) {
  function isStorageDetectionLabel(label) {
    return /cabinet|drawer|cupboard|shelf|compartment|storage|door|tv stand|entertainment/i.test(String(label || ""));
  }

  function getCatalogLabelEntries() {
    return visionCatalog.flatMap((item) => item.labels.map((label) => ({ ...item, label, isCatalogItem: true })));
  }

  function getCatalogPromptEntries() {
    return visionCatalog.flatMap((item) => item.prompts.map((prompt) => ({ ...item, prompt })));
  }

  function getDetectionLabelEntries() {
    return [...getCatalogLabelEntries(), ...genericDetectionLabels.map((entry) => ({ ...entry, isCatalogItem: false }))];
  }

  function normalizeDetectionLabel(label) {
    return normalizeText(label)
      .replace(/^(a|an|the)\s+/, "")
      .replace(/[.。]+$/g, "");
  }

  function uniqueLabelEntries(entries) {
    const seen = new Set();
    return entries.filter((entry) => {
      const label = normalizeDetectionLabel(entry.label);
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    });
  }

  function getFastGroundingLabelEntries() {
    const primaryCatalogLabels = visionCatalog.flatMap((item) => {
      if (["speaker", "amplifier", "turntable", "remote-control", "media-player", "tv-cabinet", "drawer", "cabinet", "cabinet-door", "storage-compartment"].includes(item.id)) {
        return item.labels.slice(0, 2).map((label) => ({ ...item, label, isCatalogItem: true }));
      }
      return item.labels.slice(0, 1).map((label) => ({ ...item, label, isCatalogItem: true }));
    });
    const genericKeep = new Set([
      "television cabinet drawer",
      "tv stand drawer",
      "white drawer front",
      "cabinet drawer",
      "cabinet door",
      "shelf",
      "storage compartment",
      "box",
      "bag",
      "bottle",
      "food package",
      "document",
      "book",
      "cable",
    ]);
    const primaryGenericLabels = genericDetectionLabels
      .filter((entry) => genericKeep.has(entry.label))
      .map((entry) => ({ ...entry, isCatalogItem: false }));
    return uniqueLabelEntries([...primaryCatalogLabels, ...primaryGenericLabels]);
  }

  function getDetectionLabelMeta(label) {
    const normalized = normalizeDetectionLabel(label);
    return getDetectionLabelEntries().find((entry) => normalizeDetectionLabel(entry.label) === normalized)
      || { label, name: "", category: "daily", isCatalogItem: false };
  }

  return {
    getCatalogLabelEntries,
    getCatalogPromptEntries,
    getDetectionLabelEntries,
    getDetectionLabelMeta,
    getFastGroundingLabelEntries,
    isStorageDetectionLabel,
    normalizeDetectionLabel,
  };
}
