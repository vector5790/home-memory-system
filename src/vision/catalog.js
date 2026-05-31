export function createVisionCatalog({
  fetchJsonIndex,
  furnitureByRoom,
  genericDetectionLabels,
  getRoomContext,
  normalizeText,
  visionCatalog,
  visionConfig,
}) {
  let detectionTaxonomyPromise = null;
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

  function getOwlVitSubjectLabelEntries(roomContext = null) {
    const coreSubjectLabels = [
      ["box", "daily"],
      ["package", "daily"],
      ["product package", "daily"],
      ["paper carton", "daily"],
      ["cardboard box", "daily"],
      ["plastic container", "daily"],
      ["storage box", "daily"],
      ["basket", "daily"],
      ["bag", "daily"],
      ["plastic bag", "daily"],
      ["pouch", "daily"],
      ["bottle", "daily"],
      ["jar", "daily"],
      ["can", "food"],
      ["cup", "daily"],
      ["mug", "daily"],
      ["cabinet", "daily"],
      ["cabinet door", "daily"],
      ["drawer", "daily"],
      ["drawer front", "daily"],
      ["shelf", "daily"],
      ["storage compartment", "daily"],
      ["food package", "food"],
      ["medicine box", "medicine"],
      ["blister pack", "medicine"],
      ["power bank", "tool"],
      ["charger", "tool"],
      ["charging cable", "tool"],
      ["remote control", "tool"],
      ["shoe box", "daily"],
      ["shoe", "daily"],
      ["book", "daily"],
      ["document", "document"],
      ["small electronic device", "tool"],
    ];

    const roomType = getCapturePromptRoomType(roomContext);
    const roomSubjectLabels = {
      living: [
        ["speaker", "appliance"],
        ["audio speaker", "appliance"],
        ["speaker grille", "appliance"],
        ["amplifier", "appliance"],
        ["turntable", "appliance"],
        ["media player", "appliance"],
        ["television", "appliance"],
        ["tv cabinet", "daily"],
        ["photo frame", "daily"],
        ["decorative figurine", "daily"],
        ["vase", "daily"],
        ["cable", "tool"],
        ["cable organizer box", "daily"],
        ["storage drawer unit", "daily"],
        ["pillow", "daily"],
        ["tissue box", "daily"],
      ],
      kitchen: [
        ["spice jar", "food"],
        ["seasoning bottle", "food"],
        ["condiment pouch", "food"],
        ["sauce pouch", "food"],
        ["rice bag", "food"],
        ["flour bag", "food"],
        ["snack bag", "food"],
        ["food can", "food"],
        ["cooking oil bottle", "food"],
        ["soy sauce bottle", "food"],
        ["vinegar bottle", "food"],
        ["salt container", "food"],
        ["sugar jar", "food"],
        ["coffee jar", "food"],
        ["cereal box", "food"],
        ["food storage container", "daily"],
      ],
      bedroom: [
        ["clothing", "daily"],
        ["jacket", "daily"],
        ["sweater", "daily"],
        ["pajamas", "daily"],
        ["underwear", "daily"],
        ["pillow", "daily"],
        ["quilt", "daily"],
        ["blanket", "daily"],
        ["cosmetic organizer", "daily"],
        ["jewelry box", "daily"],
        ["bandage box", "medicine"],
        ["pill bottle", "medicine"],
        ["medicine package", "medicine"],
        ["storage basket", "daily"],
        ["suitcase", "daily"],
        ["backpack", "daily"],
      ],
      balcony: [
        ["plant pot", "daily"],
        ["flower pot", "daily"],
        ["watering can", "daily"],
        ["plant vase", "daily"],
        ["detergent bottle", "daily"],
        ["laundry detergent bottle", "daily"],
        ["cleaning spray bottle", "daily"],
        ["cleaning brush", "daily"],
        ["mop", "daily"],
        ["broom", "daily"],
        ["bucket", "daily"],
        ["tool box", "tool"],
        ["screw box", "tool"],
        ["folding storage crate", "daily"],
        ["trash bag roll", "daily"],
        ["hanger", "daily"],
      ],
      default: [
        ["snack bag", "food"],
        ["rice bag", "food"],
        ["spice jar", "food"],
        ["pet food bag", "pet"],
        ["jump rope", "daily"],
        ["screw box", "tool"],
        ["speaker", "appliance"],
        ["television", "appliance"],
        ["photo frame", "daily"],
        ["vase", "daily"],
        ["bandage box", "medicine"],
        ["pill bottle", "medicine"],
        ["clothing", "daily"],
        ["plant pot", "daily"],
        ["detergent bottle", "daily"],
        ["tool box", "tool"],
      ],
    };
    const subjectLabels = [
      ...coreSubjectLabels,
      ...(roomSubjectLabels[roomType] || roomSubjectLabels.default),
      ...roomSubjectLabels.default,
    ];
    return uniqueLabelEntries(
      subjectLabels.map(([label, category]) => ({
        label,
        name: "",
        category,
        isCatalogItem: false,
      })),
      { englishOnly: true },
    ).slice(0, visionConfig.owlVitLabelLimit);
  }

  function getCapturePromptRoomType(roomContext = null) {
    if (typeof roomContext === "string" && roomContext) return roomContext;
    const room = roomContext || getRoomContext?.();
    const normalizedType = String(room?.type || "").toLowerCase();
    if (["living", "kitchen", "bedroom", "balcony"].includes(normalizedType)) return normalizedType;
    const name = String(room?.name || "");
    if (/厨/.test(name)) return "kitchen";
    if (/卧|衣|床/.test(name)) return "bedroom";
    if (/阳台|晾|洗衣/.test(name)) return "balcony";
    if (/客|厅|电视/.test(name)) return "living";
    return "default";
  }

  function isLikelyEnglishDetectionLabel(label) {
    const text = String(label || "").trim();
    return /[a-z]/i.test(text) && !/[\u4e00-\u9fff]/.test(text);
  }

  function uniqueLabelEntries(entries, options = {}) {
    const seen = new Set();
    return entries.filter((entry) => {
      const label = normalizeDetectionLabel(entry.label);
      if (options.englishOnly && !isLikelyEnglishDetectionLabel(label)) return false;
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    });
  }

  function labelTupleEntries(labelTuples, options = {}) {
    return uniqueLabelEntries(
      labelTuples.map(([label, category]) => ({
        label,
        name: "",
        category,
        isCatalogItem: false,
      })),
      { englishOnly: true, ...options },
    );
  }

  function getGroundingBaseSubjectEntries() {
    return labelTupleEntries([
      ["box", "daily"],
      ["container", "daily"],
      ["bottle", "daily"],
      ["bag", "daily"],
      ["package", "daily"],
      ["pouch", "daily"],
      ["carton", "daily"],
      ["jar", "daily"],
      ["can", "food"],
      ["tube", "daily"],
      ["cable", "tool"],
      ["remote control", "tool"],
      ["tool", "tool"],
      ["utensil", "daily"],
      ["bowl", "daily"],
      ["cup", "daily"],
      ["book", "daily"],
      ["document", "document"],
      ["clothing", "daily"],
      ["shoe", "daily"],
      ["appliance", "appliance"],
      ["toy", "daily"],
      ["medicine package", "medicine"],
      ["blister pack", "medicine"],
      ["drawer", "daily"],
      ["cabinet door", "daily"],
      ["shelf", "daily"],
      ["storage compartment", "daily"],
    ]);
  }

  function getGroundingRoomSubjectEntries(roomContext = null) {
    const roomType = getCapturePromptRoomType(roomContext);
    const roomLabels = {
      living: [
        ["speaker", "appliance"],
        ["speaker grille", "appliance"],
        ["amplifier", "appliance"],
        ["turntable", "appliance"],
        ["media player", "appliance"],
        ["television", "appliance"],
        ["tv cabinet", "daily"],
        ["photo frame", "daily"],
        ["decorative figurine", "daily"],
        ["vase", "daily"],
        ["pillow", "daily"],
        ["tissue box", "daily"],
      ],
      kitchen: [
        ["spice jar", "food"],
        ["seasoning bottle", "food"],
        ["condiment pouch", "food"],
        ["sauce pouch", "food"],
        ["rice bag", "food"],
        ["flour bag", "food"],
        ["snack bag", "food"],
        ["food can", "food"],
        ["cooking oil bottle", "food"],
        ["soy sauce bottle", "food"],
        ["vinegar bottle", "food"],
        ["food storage container", "daily"],
      ],
      bedroom: [
        ["medicine box", "medicine"],
        ["pill bottle", "medicine"],
        ["bandage box", "medicine"],
        ["storage basket", "daily"],
        ["cosmetic organizer", "daily"],
        ["jewelry box", "daily"],
        ["pillow", "daily"],
        ["blanket", "daily"],
        ["backpack", "daily"],
        ["suitcase", "daily"],
        ["shoe box", "daily"],
        ["storage box", "daily"],
      ],
      balcony: [
        ["plant pot", "daily"],
        ["flower pot", "daily"],
        ["watering can", "daily"],
        ["detergent bottle", "daily"],
        ["cleaning spray bottle", "daily"],
        ["cleaning brush", "daily"],
        ["mop", "daily"],
        ["broom", "daily"],
        ["bucket", "daily"],
        ["tool box", "tool"],
        ["screw box", "tool"],
        ["hanger", "daily"],
      ],
      default: [
        ["storage box", "daily"],
        ["shoe box", "daily"],
        ["snack bag", "food"],
        ["pet food bag", "pet"],
        ["power bank", "tool"],
        ["charger", "tool"],
        ["jump rope", "daily"],
        ["screw box", "tool"],
        ["medicine box", "medicine"],
        ["pill bottle", "medicine"],
        ["photo frame", "daily"],
        ["plant pot", "daily"],
      ],
    };
    return labelTupleEntries([
      ...(roomLabels[roomType] || roomLabels.default),
      ...roomLabels.default,
    ]);
  }

  function getGroundingPromptShards(roomContext = null) {
    const base = getGroundingBaseSubjectEntries();
    const room = getGroundingRoomSubjectEntries(roomContext)
      .filter((entry) => !base.some((baseEntry) => normalizeDetectionLabel(baseEntry.label) === normalizeDetectionLabel(entry.label)));
    const maxLabels = Math.max(1, Number(visionConfig.groundingMaxTaxonomyLabels) || 60);
    const roomLimit = Math.max(0, maxLabels - base.length);
    return [
      { id: "base", label: "base", entries: base },
      { id: getCapturePromptRoomType(roomContext), label: getCapturePromptRoomType(roomContext), entries: room.slice(0, roomLimit) },
    ].filter((shard) => shard.entries.length);
  }

  function getGroundingSubjectLabelEntries(roomContext = null) {
    return uniqueLabelEntries(getGroundingPromptShards(roomContext).flatMap((shard) => shard.entries), { englishOnly: true });
  }

  function getCoreGroundingLabelEntries() {
    const coreLabels = [
      "object",
      "item",
      "household item",
      "package",
      "product package",
      "cardboard box",
      "paper carton",
      "plastic container",
      "storage box",
      "storage basket",
      "organizer box",
      "medicine package",
      "medicine box",
      "pill box",
      "blister pack",
      "tube",
      "plastic bag",
      "paper box",
      "small device",
      "electronic device",
      "remote control",
      "power adapter",
      "charger",
      "usb cable",
      "cable",
      "battery",
      "storage container",
      "television cabinet drawer",
      "tv stand drawer",
      "white drawer front",
      "cabinet drawer",
      "cabinet door",
      "cabinet",
      "drawer",
      "drawer front",
      "shelf",
      "shelf compartment",
      "storage compartment",
      "speaker",
      "speaker grille",
      "amplifier",
      "media player",
      "turntable",
      "television",
      "air conditioner",
      "lamp",
      "light",
      "bottle",
      "spray bottle",
      "jar",
      "can",
      "food can",
      "snack bag",
      "food pouch",
      "box",
      "bag",
      "food package",
      "document",
      "folder",
      "book",
      "notebook",
      "toy",
      "tool",
      "cloth",
      "towel",
      "pillow",
      "cushion",
      "basket",
      "bowl",
      "cup",
      "mug",
      "plate",
      "pan",
      "pot",
      "kitchen utensil",
      "cleaning brush",
      "cleaning bottle",
      "hanger",
      "shoe box",
    ];
    return uniqueLabelEntries(coreLabels.map((label) => ({ label, category: "daily", isCatalogItem: false })), { englishOnly: true });
  }

  async function getDetectionTaxonomy() {
    if (!detectionTaxonomyPromise) {
      detectionTaxonomyPromise = fetchJsonIndex(visionConfig.detectionTaxonomy).catch(() => null);
    }
    return detectionTaxonomyPromise;
  }

  function taxonomyCategoryToGroundingEntry(category) {
    const detectorLabels = Array.isArray(category?.detectorLabels) ? category.detectorLabels : [];
    const label = detectorLabels.find(isLikelyEnglishDetectionLabel)
      || String(category?.id || "").replace(/-/g, " ");
    if (!isLikelyEnglishDetectionLabel(label)) return null;
    return {
      id: category.id,
      name: category.displayName || category.id,
      category: categoryLabels[category.appCategory] ? category.appCategory : "daily",
      label,
      isCatalogItem: true,
    };
  }

  async function getTaxonomyGroundingLabelEntries() {
    const taxonomy = await getDetectionTaxonomy();
    const categories = Array.isArray(taxonomy?.categories) ? taxonomy.categories : [];
    return uniqueLabelEntries(
      categories
        .filter((category) => category?.active !== false)
        .map(taxonomyCategoryToGroundingEntry)
        .filter(Boolean),
      { englishOnly: true },
    ).slice(0, visionConfig.groundingMaxTaxonomyLabels);
  }

  function getFastGroundingLabelEntries() {
    const primaryCatalogLabels = visionCatalog.flatMap((item) => {
      if (["speaker", "amplifier", "turntable", "remote-control", "media-player", "tv-cabinet", "drawer", "cabinet", "cabinet-door", "storage-compartment"].includes(item.id)) {
        return item.labels.slice(0, 2).map((label) => ({ ...item, label, isCatalogItem: true }));
      }
      return item.labels.slice(0, 1).map((label) => ({ ...item, label, isCatalogItem: true }));
    });
    return uniqueLabelEntries([...getCoreGroundingLabelEntries(), ...primaryCatalogLabels], { englishOnly: true });
  }

  function getGroundingLabelEntries(roomContext = null) {
    return getGroundingSubjectLabelEntries(roomContext);
  }

  function normalizeDetectionLabel(label) {
    return normalizeText(label)
      .replace(/^(a|an|the)\s+/, "")
      .replace(/[.。]+$/g, "");
  }

  function getDetectionLabelMeta(label, labelEntries = getDetectionLabelEntries()) {
    const normalized = normalizeDetectionLabel(label);
    return labelEntries.find((entry) => normalizeDetectionLabel(entry.label) === normalized)
      || { label, name: "", category: "daily", isCatalogItem: false };
  }

  return {
    getCatalogLabelEntries,
    getCatalogPromptEntries,
    getCapturePromptRoomType,
    getCoreGroundingLabelEntries,
    getDetectionLabelEntries,
    getDetectionLabelMeta,
    getFastGroundingLabelEntries,
    getGroundingLabelEntries,
    getGroundingPromptShards,
    getGroundingSubjectLabelEntries,
    getOwlVitSubjectLabelEntries,
    isLikelyEnglishDetectionLabel,
    isStorageDetectionLabel,
    labelTupleEntries,
    normalizeDetectionLabel,
    taxonomyCategoryToGroundingEntry,
    uniqueLabelEntries,
  };
}
