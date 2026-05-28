import { HOME_DATA_SCHEMA_VERSION, createHomeMemoryPlatform } from "./platform.js";

const STORAGE_KEY = "home-memory-system:v3";
const platform = createHomeMemoryPlatform({
  storageKey: STORAGE_KEY,
  schemaVersion: HOME_DATA_SCHEMA_VERSION,
});
const today = new Date();
const repeatLabels = {
  none: "无",
  daily: "每天",
  weekly: "每周",
  monthly: "每月",
  yearly: "每年",
};

const timedReminderOffsetLabels = {
  none: "无",
  "on-time": "准时",
  "before-5m": "提前5分钟",
  "before-30m": "提前30分钟",
  "before-1h": "提前1小时",
  "before-1d": "提前1天",
  custom: "自定义",
};

const allDayReminderOffsetLabels = {
  none: "无",
  "same-day": "当天",
  "before-1d": "提前1天",
  "before-2d": "提前2天",
  "before-3d": "提前3天",
  "before-1w": "提前1周",
  custom: "自定义",
};

const customOffsetUnitLabels = {
  minutes: "分钟",
  hours: "小时",
  days: "天",
  weeks: "周",
};

const icons = {
  home: '<svg class="icon" viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
  scan: '<svg class="icon" viewBox="0 0 24 24"><path d="M7 3H5a2 2 0 0 0-2 2v2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>',
  search: '<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  bell: '<svg class="icon" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  map: '<svg class="icon" viewBox="0 0 24 24"><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  camera: '<svg class="icon" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>',
  check: '<svg class="icon" viewBox="0 0 24 24"><path d="m20 6-11 11-5-5"/></svg>',
  rotate: '<svg class="icon" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/></svg>',
  box: '<svg class="icon" viewBox="0 0 24 24"><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  spark: '<svg class="icon" viewBox="0 0 24 24"><path d="M13 2 9 14l-7 2 7 2 4 4 2-7 7-4-7-2-2-7Z"/></svg>',
  edit: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>',
};

const categoryLabels = {
  food: "食品",
  medicine: "药品",
  pet: "宠物",
  document: "证件",
  tool: "工具",
  daily: "日用",
  appliance: "家电",
};

const visionConfig = {
  appVersion: "20260528-yolox-household-subject-v7-dynamic-postprocess",
  assetVersion: "20260519-grounded-sam",
  remoteTransformersModule: "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2",
  localTransformersModule: "/vendor/transformers/transformers.min.js",
  localOnnxRuntimeModule: "/vendor/onnxruntime/ort.wasm.min.mjs",
  localHeicConverterScript: "/vendor/heic2any/heic2any.min.js",
  localManifest: "/vendor/vision-manifest.json",
  localModelPath: "/vendor/models/",
  yoloxModelPath: "/vendor/models/home-memory/yolox-household-subject/model.onnx",
  yoloxInputSize: 416,
  yoloxThreshold: 0.12,
  yoloxNmsIou: 0.45,
  allowRemoteVisionModels: false,
  detectionTaxonomy: "/data/vision-categories.household.json",
  catalogIndex: "/data/vision-index.household-cn.grounding-dino-clip.json",
  catalogIndexFallback: "/data/vision-index.generated.json",
  groundingDinoModel: "onnx-community/grounding-dino-tiny-ONNX",
  detectionModel: "Xenova/owlvit-base-patch32",
  preferredDetector: "yolox",
  enableGroundingDinoFallback: false,
  samModel: "Xenova/slimsam-77-uniform",
  catalogModel: "Xenova/clip-vit-base-patch32",
  detectionThreshold: 0.05,
  groundingThreshold: 0,
  detectionNameThreshold: 0.11,
  catalogThreshold: 0.26,
  catalogMarginThreshold: 0.03,
  catalogTopK: 5,
  maxDetectedObjects: 15,
  maxModelDetections: 9,
  yoloxSimpleMaxDetections: 5,
  yoloxBaseMaxDetections: 10,
  yoloxDenseMaxDetections: 15,
  groundingPromptVersion: "coarse-shards-v1",
  groundingMaxTaxonomyLabels: 60,
  groundingShortPromptTargetCount: 7,
  groundingPromptBudgetMs: 2600,
  detectionNmsIou: 0.85,
  maxUploadDimension: 1024,
  detectionMaxDimension: 1024,
  maxUploadDataUrlLength: 850000,
  uploadJpegQuality: 0.82,
  uploadDecodeTimeoutMs: 18000,
  heicConversionTimeoutMs: 45000,
  maxSamRefinements: 0,
  samMinBoxArea: 0.42,
  groundingPromptBatchSize: 60,
  owlVitPromptBatchSize: 48,
  owlVitLabelLimit: 48,
  maxWasmThreads: 4,
  candidateCropVersion: "crop-640-v2",
  candidateCropMaxDimension: 640,
  candidateCropQuality: 0.9,
  embeddingCropPaddingPct: 4,
  cloudRecognitionEndpoint: "",
};

const unknownObjectNames = ["物品A", "物品B", "物品C", "物品D", "物品E", "物品F", "物品G", "物品H", "物品I", "物品J", "物品K", "物品L"];

const visionCatalog = [
  {
    id: "television",
    name: "电视",
    category: "appliance",
    labels: ["television", "tv", "flat screen tv", "black television screen"],
    prompts: ["television", "flat screen tv"],
    searchQueries: ["flat screen tv"],
  },
  {
    id: "pendant-light",
    name: "吊灯",
    category: "daily",
    labels: ["pendant light", "ceiling lamp", "hanging light"],
    prompts: ["pendant light", "ceiling lamp"],
    searchQueries: ["pendant light"],
  },
  {
    id: "wall-ornament",
    name: "挂饰",
    category: "daily",
    labels: ["wall ornament", "hanging decoration", "wall decoration"],
    prompts: ["wall ornament", "hanging decoration"],
    searchQueries: ["wall ornament"],
  },
  {
    id: "speaker",
    name: "音响",
    category: "appliance",
    labels: ["speaker", "audio speaker", "bookshelf speaker", "floor standing speaker", "floor speaker", "left speaker", "right speaker", "speaker with orange grille"],
    prompts: ["speaker", "audio speaker", "bookshelf speaker", "floor speaker"],
    searchQueries: ["bookshelf speaker", "home audio speaker"],
  },
  {
    id: "speaker-grille",
    name: "音箱面罩",
    category: "appliance",
    labels: ["speaker grille", "speaker cover", "orange speaker grille"],
    prompts: ["speaker grille", "speaker cover"],
    searchQueries: ["speaker grille"],
  },
  {
    id: "amplifier",
    name: "功放",
    category: "appliance",
    labels: ["amplifier", "audio amplifier", "stereo receiver", "stereo amplifier", "silver amplifier", "silver stereo receiver", "audio receiver"],
    prompts: ["amplifier", "audio amplifier", "stereo receiver", "silver amplifier"],
    searchQueries: ["stereo amplifier", "audio receiver"],
  },
  {
    id: "turntable",
    name: "唱片机",
    category: "appliance",
    labels: ["turntable", "record player", "black turntable", "record player on shelf"],
    prompts: ["turntable", "record player", "black turntable"],
    searchQueries: ["turntable record player"],
  },
  {
    id: "remote-control",
    name: "遥控器",
    category: "tool",
    labels: ["remote control", "tv remote", "black remote control", "small black remote", "remote control on shelf"],
    prompts: ["remote control", "tv remote", "small black remote"],
    searchQueries: ["tv remote control"],
  },
  {
    id: "media-player",
    name: "播放器",
    category: "appliance",
    labels: ["media player", "audio player", "dvd player", "black media player", "black electronic device", "audio component"],
    prompts: ["media player", "audio player", "dvd player", "black electronic device"],
    searchQueries: ["media player", "audio player"],
  },
  {
    id: "tv-cabinet",
    name: "电视柜",
    category: "daily",
    labels: ["tv cabinet", "television cabinet", "white tv stand", "media cabinet", "media console", "tv console", "entertainment center", "drawer under tv", "cabinet drawer front"],
    prompts: ["tv cabinet", "television cabinet", "media console", "tv console"],
    searchQueries: ["tv cabinet"],
  },
  {
    id: "cabinet",
    name: "柜子",
    category: "daily",
    labels: ["cabinet", "storage cabinet", "cupboard", "side cabinet", "wooden cabinet"],
    prompts: ["cabinet", "storage cabinet", "cupboard"],
    searchQueries: ["storage cabinet", "cupboard"],
  },
  {
    id: "drawer",
    name: "抽屉",
    category: "daily",
    labels: ["drawer", "open drawer", "drawer front", "cabinet drawer", "dresser drawer"],
    prompts: ["drawer", "cabinet drawer"],
    searchQueries: ["cabinet drawer", "drawer"],
  },
  {
    id: "cabinet-door",
    name: "柜门",
    category: "daily",
    labels: ["cabinet door", "cupboard door", "storage door", "drawer handle"],
    prompts: ["cabinet door", "cupboard door"],
    searchQueries: ["cabinet door"],
  },
  {
    id: "storage-compartment",
    name: "储物格",
    category: "daily",
    labels: ["storage compartment", "shelf compartment", "cubby", "cabinet compartment", "open shelf"],
    prompts: ["storage compartment", "shelf compartment"],
    searchQueries: ["storage compartment"],
  },
  {
    id: "small-speaker",
    name: "小音箱",
    category: "appliance",
    labels: ["small speaker", "mini speaker", "small audio speaker"],
    prompts: ["small speaker", "mini speaker"],
    searchQueries: ["small speaker"],
  },
  {
    id: "small-device",
    name: "小设备",
    category: "appliance",
    labels: ["small device", "small electronic device", "black device"],
    prompts: ["small electronic device", "black device"],
    searchQueries: ["small electronic device"],
  },
  {
    id: "pillow",
    name: "抱枕",
    category: "daily",
    labels: ["pillow", "cushion", "throw pillow"],
    prompts: ["pillow", "cushion"],
    searchQueries: ["throw pillow"],
  },
  {
    id: "air-conditioner",
    name: "空调",
    category: "appliance",
    labels: ["air conditioner", "floor air conditioner", "standing air conditioner"],
    prompts: ["air conditioner", "floor air conditioner"],
    searchQueries: ["floor air conditioner"],
  },
  {
    id: "data-cable",
    name: "数据线",
    category: "tool",
    labels: ["cable", "usb cable", "charging cable"],
    prompts: ["usb cable", "charging cable"],
    searchQueries: ["usb cable", "type c cable"],
  },
  {
    id: "charger",
    name: "充电器",
    category: "tool",
    labels: ["charger", "power adapter", "phone charger"],
    prompts: ["charger", "power adapter", "phone charger"],
    searchQueries: ["phone charger", "usb power adapter"],
  },
  {
    id: "battery",
    name: "电池",
    category: "tool",
    labels: ["battery", "aa battery", "aaa battery"],
    prompts: ["battery", "aa battery", "aaa battery"],
    searchQueries: ["aa battery", "aaa battery"],
  },
  {
    id: "medicine-box",
    name: "药盒",
    category: "medicine",
    labels: ["medicine box", "pill box", "pill bottle"],
    prompts: ["medicine box", "pill box", "pill bottle"],
    searchQueries: ["medicine box", "pill bottle"],
  },
  {
    id: "storage-box",
    name: "收纳盒",
    category: "daily",
    labels: ["storage box", "storage basket", "plastic bin"],
    prompts: ["storage box", "storage basket", "plastic bin"],
    searchQueries: ["storage box", "plastic storage bin"],
  },
  {
    id: "key",
    name: "钥匙",
    category: "tool",
    labels: ["key", "keys", "keychain"],
    prompts: ["key", "keys", "keychain"],
    searchQueries: ["house keys", "keychain"],
  },
];

const genericDetectionLabels = [
  { label: "window", name: "窗户", category: "daily" },
  { label: "curtain", name: "窗帘", category: "daily" },
  { label: "television cabinet drawer", name: "抽屉", category: "daily" },
  { label: "tv stand drawer", name: "抽屉", category: "daily" },
  { label: "tv console drawer", name: "抽屉", category: "daily" },
  { label: "media cabinet drawer", name: "抽屉", category: "daily" },
  { label: "white drawer front", name: "抽屉", category: "daily" },
  { label: "horizontal drawer", name: "抽屉", category: "daily" },
  { label: "cabinet drawer handle", name: "抽屉", category: "daily" },
  { label: "cabinet handle", name: "柜门", category: "daily" },
  { label: "cabinet shelf", name: "储物格", category: "daily" },
  { label: "shelf under television", name: "架子", category: "daily" },
  { label: "cabinet", name: "柜子", category: "daily" },
  { label: "storage cabinet", name: "柜子", category: "daily" },
  { label: "cupboard", name: "柜子", category: "daily" },
  { label: "drawer", name: "抽屉", category: "daily" },
  { label: "drawer front", name: "抽屉", category: "daily" },
  { label: "cabinet drawer", name: "抽屉", category: "daily" },
  { label: "cabinet door", name: "柜门", category: "daily" },
  { label: "shelf", name: "架子", category: "daily" },
  { label: "storage compartment", name: "储物格", category: "daily" },
  { label: "shelf compartment", name: "储物格", category: "daily" },
  { label: "cable", name: "线材", category: "tool" },
  { label: "black cable", name: "线材", category: "tool" },
  { label: "food package", name: "食品包装", category: "food" },
  { label: "bottle", name: "瓶装物", category: "daily" },
  { label: "spray bottle", name: "喷雾瓶", category: "daily" },
  { label: "detergent bottle", name: "清洁液", category: "daily" },
  { label: "filter cartridge", name: "滤芯", category: "appliance" },
  { label: "pet supplies", name: "宠物用品", category: "pet" },
  { label: "bag", name: "袋装物", category: "daily" },
  { label: "document", name: "文件", category: "document" },
  { label: "book", name: "书本", category: "daily" },
  { label: "cup", name: "杯子", category: "daily" },
  { label: "bowl", name: "碗", category: "daily" },
  { label: "box", name: "盒状物", category: "daily" },
];

const furnitureByRoom = {
  kitchen: [
    { x: 4, y: 8, w: 26, h: 68, cls: "slim" },
    { x: 34, y: 18, w: 25, h: 48, cls: "" },
    { x: 65, y: 12, w: 27, h: 62, cls: "slim" },
    { x: 22, y: 78, w: 54, h: 10, cls: "" },
  ],
  living: [
    { x: 9, y: 42, w: 32, h: 22, cls: "" },
    { x: 46, y: 50, w: 42, h: 24, cls: "" },
    { x: 12, y: 76, w: 70, h: 8, cls: "slim" },
  ],
  balcony: [
    { x: 6, y: 16, w: 26, h: 66, cls: "slim" },
    { x: 38, y: 52, w: 24, h: 20, cls: "" },
    { x: 68, y: 22, w: 20, h: 54, cls: "slim" },
  ],
  bedroom: [
    { x: 6, y: 13, w: 31, h: 67, cls: "slim" },
    { x: 43, y: 46, w: 42, h: 24, cls: "" },
    { x: 56, y: 20, w: 18, h: 18, cls: "" },
  ],
};

const seedState = {
  activeTab: "capture",
  activeRoomId: "living",
  activePlaceId: null,
  query: "",
  lastAnswer: null,
  capture: {
    roomId: "living",
    placeId: null,
    image: null,
    imageRef: null,
    candidates: [],
    activeCandidateId: null,
    recognitionStatus: "idle",
    recognitionError: "",
    recognitionDiagnostics: null,
    preprocessingMs: null,
    imageMeta: null,
    provider: "none",
  },
  cameraOn: false,
  rooms: [
    {
      id: "living",
      name: "客厅",
      type: "living",
      places: [],
    },
    {
      id: "kitchen",
      name: "厨房",
      type: "kitchen",
      places: [],
    },
    {
      id: "balcony",
      name: "阳台",
      type: "balcony",
      places: [],
    },
    {
      id: "bedroom",
      name: "卧室",
      type: "bedroom",
      places: [],
    },
  ],
  items: [],
};

let state = loadState();
let cameraStream = null;
let toastTimer = null;
let candidateDrag = null;
let candidateDatePickerState = null;
let recognitionRunId = 0;
let candidateEditRecognitionToken = 0;
let candidateCropHydrationKey = "";
let visionAssetModePromise = null;
let transformersModulePromise = null;
let onnxRuntimeModulePromise = null;
let yoloxDetectorPromise = null;
let groundingDinoDetectorPromise = null;
let smallModelDetectorPromise = null;
let samSegmenterPromise = null;
let catalogClassifierPromise = null;
let catalogFeatureExtractorPromise = null;
let catalogIndexPromise = null;
let catalogIndexWarningShown = false;
let catalogIndexTiming = null;
let detectionTaxonomyPromise = null;
let groundingLabelEntriesPromise = null;
let heicConverterPromise = null;
let persistWarningShown = false;

const app = document.querySelector("#app");
const primaryTabIds = new Set(["map", "capture", "reminders"]);

function normalizeActiveTab(tab) {
  return primaryTabIds.has(tab) ? tab : "capture";
}

function loadState() {
  try {
    const raw = platform.storage.readSnapshotSync();
    if (!raw) return structuredClone(seedState);
    const parsed = JSON.parse(raw);
    return normalizeLoadedState(parsed);
  } catch {
    return structuredClone(seedState);
  }
}

async function hydratePlatformState() {
  if (!platform.isNative) return;
  try {
    const raw = await platform.storage.readSnapshotAsync();
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const loaded = normalizeLoadedState(parsed);
    state = loaded;
    render();
    performSearch();
  } catch (error) {
    console.warn("Native state migration failed.", error);
    showToast("旧本地数据无法迁移，已使用空白状态");
  }
}

function normalizeLoadedState(parsed = {}) {
  const loaded = { ...structuredClone(seedState), ...parsed, cameraOn: false };
  loaded.activeTab = normalizeActiveTab(loaded.activeTab);
  loaded.query = "";
  loaded.lastAnswer = null;
  loaded.items = normalizeItems(loaded.items);
  loaded.rooms = pruneUnconfirmedCapturePlaces(normalizeRooms(loaded.rooms), loaded.items);
  loaded.capture = normalizeCaptureState(
    { ...structuredClone(seedState.capture), ...(parsed.capture || {}) },
    { clearTransientImage: true },
  );
  return loaded;
}

function createPersistSnapshot(options = {}) {
  const snapshot = structuredClone(state);
  snapshot.schemaVersion = HOME_DATA_SCHEMA_VERSION;
  snapshot.savedAt = new Date().toISOString();
  snapshot.cameraOn = false;
  snapshot.capture = getPersistableCaptureState(snapshot.capture);
  if (options.omitCaptureImage && snapshot.capture) {
    snapshot.capture.image = null;
  }
  if (options.usePhotoReferences && snapshot.capture) {
    snapshot.capture.image = getDurableImageValue(snapshot.capture.image, snapshot.capture.imageRef);
  }
  if (options.omitPlaceImages) {
    snapshot.rooms = snapshot.rooms.map((room) => ({
      ...room,
      places: (room.places || []).map((place) => ({ ...place, image: null })),
    }));
  } else if (options.usePhotoReferences) {
    snapshot.rooms = snapshot.rooms.map((room) => ({
      ...room,
      places: (room.places || []).map((place) => ({
        ...place,
        image: getDurableImageValue(place.image, place.imageRef),
      })),
    }));
  }
  return snapshot;
}

function getPersistableCaptureState(capture = {}) {
  return {
    ...structuredClone(seedState.capture),
    roomId: capture.roomId || state.activeRoomId || seedState.capture.roomId,
    placeId: capture.placeId || null,
  };
}

function persist() {
  const usePhotoReferences = Boolean(platform.isNative);
  const attempts = [
    createPersistSnapshot({ usePhotoReferences }),
    createPersistSnapshot({ usePhotoReferences, omitCaptureImage: true }),
    createPersistSnapshot({ usePhotoReferences, omitCaptureImage: true, omitPlaceImages: true }),
  ];
  let lastError = null;
  for (const snapshot of attempts) {
    try {
      if (platform.storage.writeSnapshot(JSON.stringify(snapshot))) return true;
    } catch (error) {
      lastError = error;
    }
  }
  if (!persistWarningShown) {
    persistWarningShown = true;
    console.warn("Local persistence skipped; current session state remains available.", lastError);
  }
  return false;
}

function getDurableImageValue(image, imageRef) {
  if (imageRef?.webPath) return imageRef.webPath;
  if (imageRef?.uri) return platform.convertFileSrc(imageRef.uri);
  if (typeof image === "string" && image.startsWith("data:image/")) return null;
  return image || null;
}

function setState(patch) {
  state = { ...state, ...patch };
  state.activeTab = normalizeActiveTab(state.activeTab);
  persist();
  render();
}

function getRoom(roomId = state.activeRoomId) {
  return state.rooms.find((room) => room.id === roomId) || state.rooms[0];
}

function normalizeRooms(rooms) {
  const fallbackRooms = structuredClone(seedState.rooms);
  const sourceRooms = Array.isArray(rooms) && rooms.length ? rooms : fallbackRooms;
  return sourceRooms.map((room, index) => {
    const fallback = fallbackRooms[index] || fallbackRooms[0];
    return {
      id: room.id || fallback.id || createId("room", room.name || "空间"),
      name: room.name || fallback.name || "空间",
      type: room.type || roomTypeForName(room.name || fallback.name || ""),
      places: Array.isArray(room.places)
        ? room.places.map((place) => normalizePlace(place))
        : [],
    };
  });
}

function normalizePlace(place = {}) {
  const name = String(place.name || "未命名储物点").trim();
  return {
    id: place.id || createId("place", name),
    name,
    shortName: place.shortName || name,
    kind: place.kind || "photo",
    parentId: place.parentId || null,
    sourceItemId: place.sourceItemId || null,
    box: clampBox(place.box || { x: 16, y: 18, w: 36, h: 24 }),
    image: place.image || null,
    imageRef: place.imageRef || null,
    imageMeta: normalizeImageMeta(place.imageMeta),
    note: place.note || "储物点",
  };
}

function getAllPlaces() {
  return state.rooms.flatMap((room) => (room.places || []).map((place) => ({
    ...normalizePlace(place),
    roomId: room.id,
    roomName: room.name,
    roomType: room.type,
  })));
}

function getPlaceById(placeId) {
  if (!placeId) return null;
  return getAllPlaces().find((place) => place.id === placeId) || null;
}

function getPlace(placeId = state.activePlaceId) {
  const matched = getPlaceById(placeId);
  if (matched || placeId) return matched || null;
  return getRootPlaces(state.activeRoomId)[0] || getAllPlaces().find((place) => place.roomId === state.activeRoomId) || null;
}

function getChildPlaces(parentId, roomId = null) {
  return getAllPlaces()
    .filter((place) => place.parentId === parentId && (!roomId || place.roomId === roomId))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

function getRootPlaces(roomId) {
  return getChildPlaces(null, roomId);
}

function getRoomPlacesInTree(roomId) {
  const rows = [];
  const visit = (place, depth, seen = new Set()) => {
    if (!place || seen.has(place.id)) return;
    rows.push({ place, depth });
    const nextSeen = new Set(seen);
    nextSeen.add(place.id);
    for (const child of getChildPlaces(place.id, roomId)) visit(child, depth + 1, nextSeen);
  };
  for (const root of getRootPlaces(roomId)) visit(root, 0);
  return rows;
}

function getPlacePath(placeId) {
  const path = [];
  const allPlaces = getAllPlaces();
  let current = allPlaces.find((place) => place.id === placeId) || null;
  const seen = new Set();
  while (current && !seen.has(current.id)) {
    path.unshift(current);
    seen.add(current.id);
    current = current.parentId ? allPlaces.find((place) => place.id === current.parentId) || null : null;
  }
  return path;
}

function getRootPlaceFor(placeId) {
  return getPlacePath(placeId)[0] || getPlaceById(placeId);
}

function getDescendantPlaceIds(placeId) {
  const ids = new Set();
  const visit = (id) => {
    if (!id || ids.has(id)) return;
    ids.add(id);
    for (const child of getChildPlaces(id)) visit(child.id);
  };
  visit(placeId);
  return ids;
}

function getItemsInPlaceTree(placeId) {
  const ids = getDescendantPlaceIds(placeId);
  return state.items.filter((item) => ids.has(item.placeId));
}

function buildPlacePathLabel(placeId) {
  return getPlacePath(placeId).map((place) => place.name).join(" > ");
}

function getItemsByPlace(placeId) {
  if (!placeId) return [];
  return state.items.filter((item) => item.placeId === placeId);
}

function getRoomItems(roomId) {
  return state.items.filter((item) => item.roomId === roomId);
}

function createId(prefix, name = "") {
  const slug = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "new";
  return `${prefix}-${slug}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;
}

async function persistPhotoDataUrl(dataUrl, source = "capture") {
  if (!platform.isNative || !platform.files.isAvailable() || !String(dataUrl || "").startsWith("data:image/")) {
    return null;
  }
  const extension = dataUrl.startsWith("data:image/png") ? "png" : "jpg";
  const id = createId("photo", source);
  const saved = await platform.files.writeDataUrl(`photos/${id}.${extension}`, dataUrl);
  return {
    id,
    source,
    ...saved,
  };
}

function roomTypeForName(name) {
  if (/厨/.test(name)) return "kitchen";
  if (/阳台|露台/.test(name)) return "balcony";
  if (/卧|睡|衣帽/.test(name)) return "bedroom";
  return "living";
}

function makeVirtualPlace(room) {
  return {
    id: null,
    roomId: room.id,
    roomName: room.name,
    roomType: room.type,
    name: `${room.name}照片`,
    shortName: `${room.name}照片`,
    kind: "photo",
    parentId: null,
    box: { x: 8, y: 12, w: 84, h: 72 },
    image: null,
    note: "上传照片后可保存为照片点",
    virtual: true,
  };
}

function getCaptureRoom() {
  return getRoom(state.capture.roomId || state.activeRoomId);
}

function getCapturePlace() {
  const room = getCaptureRoom();
  if (state.capture.placeId) return getPlaceById(state.capture.placeId);
  return getRootPlaces(room.id)[0] || getAllPlaces().find((place) => place.roomId === room.id) || null;
}

function ensureCapturePlace() {
  const room = getCaptureRoom();
  const existing = getCapturePlace();
  if (existing) return existing;

  const count = room.places.length + 1;
  const name = count === 1 ? `${room.name}照片` : `${room.name}照片 ${count}`;
  const place = {
    id: createId("place", name),
    name,
    shortName: name,
    kind: "photo",
    parentId: null,
    sourceItemId: null,
    box: { x: 8, y: 12, w: 84, h: 72 },
    image: state.capture.image || null,
    imageRef: state.capture.imageRef || null,
    note: "由上传照片保存",
  };
  state.rooms = state.rooms.map((entry) => (
    entry.id === room.id ? { ...entry, places: [...entry.places, place] } : entry
  ));
  state.capture.placeId = place.id;
  state.activeRoomId = room.id;
  state.activePlaceId = place.id;
  return { ...place, roomId: room.id, roomName: room.name, roomType: room.type };
}

function addRoom(name) {
  const cleanName = String(name || "").trim();
  if (!cleanName) {
    showToast("请输入空间名称");
    return;
  }
  if (state.rooms.some((room) => normalizeText(room.name) === normalizeText(cleanName))) {
    showToast("这个空间已经存在");
    return;
  }
  const room = {
    id: createId("room", cleanName),
    name: cleanName,
    type: roomTypeForName(cleanName),
    places: [],
  };
  state.rooms = [...state.rooms, room];
  state.activeRoomId = room.id;
  state.activePlaceId = null;
  resetCaptureRecognition({ roomId: room.id, placeId: null });
  persist();
  render();
  showToast(`已新增空间：${cleanName}`);
}

function promptAddRoom() {
  const name = window.prompt("新增家庭空间名称", "");
  if (name === null) return;
  addRoom(name);
}

function renameRoom(roomId, name) {
  const room = getRoom(roomId);
  const cleanName = String(name || "").trim();
  if (!room || !cleanName) {
    showToast("请输入空间名称");
    return;
  }
  if (state.rooms.some((entry) => entry.id !== room.id && normalizeText(entry.name) === normalizeText(cleanName))) {
    showToast("这个空间已经存在");
    return;
  }
  state.rooms = state.rooms.map((entry) => (
    entry.id === room.id
      ? { ...entry, name: cleanName, type: roomTypeForName(cleanName) }
      : entry
  ));
  if (state.capture.roomId === room.id) state.capture.roomId = room.id;
  state.activeRoomId = room.id;
  persist();
  render();
  showToast(`已重命名为空间：${cleanName}`);
}

function promptRenameRoom(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  const name = window.prompt("编辑空间名称", room.name);
  if (name === null) return;
  renameRoom(room.id, name);
}

function selectCaptureSpace(roomId) {
  const room = getRoom(roomId);
  const firstPlace = getRootPlaces(room.id)[0] || room.places[0] || null;
  state.activeRoomId = room.id;
  state.activePlaceId = firstPlace?.id || null;
  resetCaptureRecognition({ roomId: room.id, placeId: firstPlace?.id || null });
  persist();
  render();
}

function addPlace(roomId, name, parentId = null, options = {}) {
  const room = getRoom(roomId);
  const cleanName = String(name || "").trim();
  if (!cleanName) {
    showToast("请输入储物点名称");
    return;
  }
  const parent = parentId ? getPlaceById(parentId) : null;
  const normalizedParentId = parent?.roomId === room.id ? parent.id : null;
  if (room.places.some((place) => (place.parentId || null) === normalizedParentId && normalizeText(place.name) === normalizeText(cleanName))) {
    showToast("这个储物点已经存在");
    return;
  }
  const siblingCount = room.places.filter((place) => (place.parentId || null) === normalizedParentId).length;
  const place = {
    id: createId("place", cleanName),
    name: cleanName,
    shortName: cleanName,
    kind: options.kind || "photo",
    parentId: normalizedParentId,
    sourceItemId: options.sourceItemId || null,
    box: clampBox(options.box || {
      x: 12 + (siblingCount % 3) * 24,
      y: normalizedParentId ? 16 + (siblingCount % 4) * 16 : 18,
      w: normalizedParentId ? 22 : 36,
      h: normalizedParentId ? 16 : 24,
    }),
    image: options.image || null,
    imageRef: options.imageRef || null,
    note: options.note || (parent ? `隶属于 ${parent.name}` : "手动新增储物点"),
  };
  state.rooms = state.rooms.map((entry) => (
    entry.id === room.id ? { ...entry, places: [...entry.places, place] } : entry
  ));
  state.activeRoomId = room.id;
  state.activePlaceId = place.id;
  resetCaptureRecognition({ roomId: room.id, placeId: place.id });
  persist();
  render();
  showToast(`已新增储物点：${cleanName}`);
  return { ...place, roomId: room.id, roomName: room.name, roomType: room.type };
}

function updatePlaceImage(placeId, image, imageRef = null, imageMeta = null) {
  if (!placeId || !image) return;
  const normalizedMeta = normalizeImageMeta(imageMeta);
  state.rooms = state.rooms.map((room) => ({
    ...room,
    places: room.places.map((place) => (
      place.id === placeId
        ? { ...place, image, imageRef: imageRef || place.imageRef || null, imageMeta: normalizedMeta }
        : place
    )),
  }));
}

function normalizeCaptureState(capture, options = {}) {
  const hasUploadedImage = Boolean(capture.image);
  const provider = capture.provider === "real-image" ? "local-image" : capture.provider || "none";
  if (options.clearTransientImage) {
    return {
      ...structuredClone(seedState.capture),
      roomId: capture.roomId || seedState.capture.roomId,
      placeId: capture.placeId || null,
    };
  }
  const hasLegacyMockCapture = provider === "local-mock";
  if (hasLegacyMockCapture) {
    return {
      ...capture,
      candidates: [],
      activeCandidateId: null,
      recognitionStatus: "idle",
      recognitionError: "",
      provider: hasUploadedImage ? "local-image" : "none",
    };
  }

  const candidates = Array.isArray(capture.candidates)
    ? capture.candidates.map((candidate, index) => normalizeCandidate(candidate, index, provider))
    : [];
  const activeCandidates = candidates.filter((candidate) => !isCandidateDeleted(candidate));
  const activeCandidateId = activeCandidates.some((candidate) => candidate.id === capture.activeCandidateId)
    ? capture.activeCandidateId
    : null;

  return {
    ...capture,
    candidates,
    activeCandidateId,
      imageRef: capture.imageRef || null,
      imageMeta: normalizeImageMeta(capture.imageMeta),
      recognitionDiagnostics: capture.recognitionDiagnostics || null,
      preprocessingMs: capture.preprocessingMs || null,
      recognitionStatus: capture.recognitionStatus || "idle",
    recognitionError: capture.recognitionError || "",
    provider,
  };
}

function pruneUnconfirmedCapturePlaces(rooms, items) {
  const placesById = new Map();
  for (const room of rooms) {
    for (const place of room.places || []) {
      placesById.set(place.id, place);
    }
  }

  const keepPlaceIds = new Set();
  for (const item of items || []) {
    let placeId = item.placeId;
    while (placeId && placesById.has(placeId)) {
      keepPlaceIds.add(placeId);
      placeId = placesById.get(placeId)?.parentId || null;
    }
  }

  return rooms.map((room) => ({
    ...room,
    places: (room.places || []).filter((place) => {
      if (!isUnconfirmedCapturePlace(place)) return true;
      return keepPlaceIds.has(place.id);
    }),
  }));
}

function isUnconfirmedCapturePlace(place) {
  return /由上传照片(保存|自动生成)/.test(String(place?.note || ""));
}

function resetCaptureRecognition(overrides = {}) {
  recognitionRunId += 1;
  const hasImageOverride = Object.prototype.hasOwnProperty.call(overrides, "image");
  const nextImage = hasImageOverride ? (overrides.image || null) : null;
  const nextImageRef = hasImageOverride ? (overrides.imageRef || null) : null;
  const nextImageMeta = nextImage ? normalizeImageMeta(overrides.imageMeta) : null;
  state.capture = {
    ...state.capture,
    image: nextImage,
    imageRef: nextImageRef,
    candidates: [],
    activeCandidateId: null,
    recognitionStatus: "idle",
    recognitionError: "",
    recognitionDiagnostics: null,
    preprocessingMs: null,
    imageMeta: nextImageMeta,
    provider: "none",
    ...overrides,
    imageMeta: normalizeImageMeta(overrides.imageMeta || nextImageMeta),
  };
}

function queueCaptureAnalysis() {
  if (!state.capture.image) return;
  window.setTimeout(() => {
    scanCurrentPlace().catch((error) => {
      console.info("Queued capture analysis failed.", error);
    });
  }, 0);
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function roundNumber(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function normalizeImageMeta(meta) {
  const width = Math.round(Number(meta?.width || meta?.naturalWidth || meta?.videoWidth || 0));
  const height = Math.round(Number(meta?.height || meta?.naturalHeight || meta?.videoHeight || 0));
  if (!width || !height) return null;
  return { width, height };
}

function normalizeCropMeta(meta) {
  const width = Math.round(Number(meta?.width || 0));
  const height = Math.round(Number(meta?.height || 0));
  if (!width || !height) return null;
  return { width, height };
}

async function imageMetaFromDataUrl(image) {
  return getImageDimensions(image)
    .then((dimensions) => normalizeImageMeta(dimensions))
    .catch(() => null);
}

function imageAspectStyle(imageMeta) {
  const meta = normalizeImageMeta(imageMeta);
  if (!meta) return "";
  return `style="--image-aspect:${meta.width} / ${meta.height}"`;
}

function cropAspectStyle(cropMeta) {
  const meta = normalizeCropMeta(cropMeta);
  if (!meta) return "";
  const maxWidth = 108;
  const maxHeight = 132;
  const ratio = meta.width / meta.height;
  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  const frameHeight = Math.max(44, Math.round(height));
  return `style="--crop-aspect:${meta.width} / ${meta.height};--crop-preview-width:${Math.max(54, Math.round(width))}px;--crop-preview-height:${frameHeight}px"`;
}

function clampBox(box = {}, options = {}) {
  const minWidth = Number.isFinite(Number(options.minWidth)) ? Number(options.minWidth) : 0.6;
  const minHeight = Number.isFinite(Number(options.minHeight)) ? Number(options.minHeight) : 0.6;
  const width = clampNumber(box.w ?? 20, minWidth, 100);
  const height = clampNumber(box.h ?? 14, minHeight, 100);
  return {
    x: clampNumber(box.x ?? 10, 0, 100 - width),
    y: clampNumber(box.y ?? 10, 0, 100 - height),
    w: width,
    h: height,
  };
}

function normalizeDateText(dateText) {
  const text = String(dateText || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (!text) return "";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : dateToIso(date);
}

function normalizeReminderTime(timeText) {
  const match = String(timeText || "").match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return "09:00";
  const hour = clampNumber(match[1], 0, 23);
  const minute = clampNumber(match[2], 0, 59);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getReminderOffsetLabels(hasTime) {
  return hasTime ? timedReminderOffsetLabels : allDayReminderOffsetLabels;
}

function defaultReminderOffset(hasTime) {
  return hasTime ? "on-time" : "none";
}

function normalizeReminderOffset(offset, hasTime) {
  const labels = getReminderOffsetLabels(hasTime);
  const value = String(offset || "").trim();
  if (labels[value]) return value;
  if (value === "onTime") return "on-time";
  if (value === "sameDay") return "same-day";
  return defaultReminderOffset(hasTime);
}

function normalizeCustomOffset(customOffset = {}) {
  return {
    amount: Math.max(1, Math.round(Number(customOffset.amount) || 5)),
    unit: customOffsetUnitLabels[customOffset.unit] ? customOffset.unit : "minutes",
  };
}

function createNotificationId(seed) {
  const text = String(seed || `${Date.now()}-${Math.random()}`);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(31, hash) + text.charCodeAt(index);
  }
  return 100000 + ((hash >>> 0) % 2000000000);
}

function normalizeReminder(reminder = {}, index = 0) {
  const rawHasTime = Object.prototype.hasOwnProperty.call(reminder, "hasTime")
    ? Boolean(reminder.hasTime)
    : Boolean(reminder.time || reminder.nextTime);
  const id = reminder.id || createId("reminder", reminder.title || reminder.nextLabel || `提醒${index + 1}`);
  const date = normalizeDateText(reminder.date || reminder.nextAt || reminder.at) || dateToIso(today);
  const offset = normalizeReminderOffset(reminder.offset, rawHasTime);
  const notificationId = Number.isInteger(Number(reminder.notificationId))
    ? Number(reminder.notificationId)
    : createNotificationId(`${id}:${date}:${reminder.time || reminder.nextTime || ""}`);
  return {
    id,
    title: String(reminder.title || reminder.nextLabel || "提醒").trim() || "提醒",
    date,
    hasTime: rawHasTime,
    time: normalizeReminderTime(reminder.time || reminder.nextTime || "09:00"),
    offset,
    repeat: repeatLabels[reminder.repeat] ? reminder.repeat : (repeatLabels[reminder.nextRepeat] ? reminder.nextRepeat : "none"),
    customOffset: normalizeCustomOffset(reminder.customOffset),
    enabled: reminder.enabled !== false,
    notificationId,
  };
}

function legacyReminderFromFields(record = {}) {
  if (!record.nextAt) return null;
  return {
    id: record.nextReminderId || record.reminderId || undefined,
    title: record.nextLabel || "提醒",
    date: record.nextAt,
    hasTime: Boolean(record.nextTime),
    time: record.nextTime || "09:00",
    offset: record.nextOffset || "on-time",
    repeat: record.nextRepeat || "none",
    enabled: true,
    notificationId: record.notificationId,
  };
}

function normalizeReminderList(record = {}) {
  const raw = Array.isArray(record) ? record : (Array.isArray(record.reminders) ? record.reminders : []);
  if (raw.length) return raw.map((reminder, index) => normalizeReminder(reminder, index));
  const legacy = legacyReminderFromFields(record);
  return legacy ? [normalizeReminder(legacy)] : [];
}

function getPrimaryReminder(record = {}) {
  return normalizeReminderList(record)[0] || null;
}

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
    categoryId: item.categoryId || item.catalogId || "",
    categoryPath: Array.isArray(item.categoryPath) ? item.categoryPath : [],
    categoryScore: Number.isFinite(Number(item.categoryScore)) ? Number(item.categoryScore) : null,
    categoryMargin: Number.isFinite(Number(item.categoryMargin)) ? Number(item.categoryMargin) : null,
    catalogCandidates: Array.isArray(item.catalogCandidates) ? item.catalogCandidates : [],
    namingRejectionReason: item.namingRejectionReason || "",
    categoryIndexVersion: item.categoryIndexVersion || "",
    matchedSampleIds: Array.isArray(item.matchedSampleIds) ? item.matchedSampleIds : [],
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
  const modelBox = candidate.modelBox ? clampBox(candidate.modelBox) : null;

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
    modelBox,
    modelImageMeta: normalizeImageMeta(candidate.modelImageMeta),
    confidence,
    timings: candidate.timings && typeof candidate.timings === "object" ? { ...candidate.timings } : {},
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
    catalogCandidates: Array.isArray(candidate.catalogCandidates) ? candidate.catalogCandidates : [],
    namingRejectionReason: candidate.namingRejectionReason || "",
    categoryIndexVersion: candidate.categoryIndexVersion || "",
    matchedSampleIds: Array.isArray(candidate.matchedSampleIds) ? candidate.matchedSampleIds : [],
    providerId: candidate.providerId || candidate.source || provider,
    providerClass: candidate.providerClass || "",
    modelId: candidate.modelId || "",
    assetVersion: candidate.assetVersion || "",
    fallbackReason: candidate.fallbackReason || "",
    timings: candidate.timings && typeof candidate.timings === "object" ? candidate.timings : {},
    cropImage: candidate.cropImage || "",
    cropMeta: normalizeCropMeta(candidate.cropMeta),
    cropVersion: candidate.cropVersion || "",
    edited: Boolean(candidate.edited),
    nameEdited: Boolean(candidate.nameEdited),
    boxEdited: Boolean(candidate.boxEdited),
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

function getActiveCandidates(candidates = state.capture.candidates || []) {
  return candidates.filter((candidate) => !isCandidateDeleted(candidate));
}

function getDeletedCandidates(candidates = state.capture.candidates || []) {
  return candidates.filter((candidate) => isCandidateDeleted(candidate));
}

function getSelectedCandidateCount(candidates = state.capture.candidates || []) {
  return getActiveCandidates(candidates).filter((candidate) => candidate.selected).length;
}

function getCandidateIndex(candidates, candidateId) {
  return candidates.findIndex((candidate) => candidate.id === candidateId);
}

function getAdjacentCandidateId(candidateId, direction) {
  const candidates = getActiveCandidates();
  if (!candidates.length) return null;
  const currentIndex = Math.max(0, getCandidateIndex(candidates, candidateId));
  const nextIndex = clampNumber(currentIndex + direction, 0, candidates.length - 1);
  return candidates[nextIndex]?.id || null;
}

function getFallbackActiveCandidateId(preferredId = state.capture.activeCandidateId) {
  const activeCandidates = getActiveCandidates();
  if (!activeCandidates.length) return null;
  if (activeCandidates.some((candidate) => candidate.id === preferredId)) return preferredId;
  return activeCandidates[0].id;
}

async function recognizeStorageImage(context) {
  if (context.image) return recognizeWithLocalImage(context);
  throw new Error("请先上传或拍摄储物点照片。");
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
  const room = roomContext || getCaptureRoom?.() || getRoom?.(state.capture?.roomId || state.activeRoomId);
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

function boxArea(box) {
  return Math.max(0, box.w) * Math.max(0, box.h);
}

function boxIou(left, right) {
  const x1 = Math.max(left.x, right.x);
  const y1 = Math.max(left.y, right.y);
  const x2 = Math.min(left.x + left.w, right.x + right.w);
  const y2 = Math.min(left.y + left.h, right.y + right.h);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = boxArea(left) + boxArea(right) - intersection;
  return union ? intersection / union : 0;
}

function dedupeCandidates(candidates, maxItems = 10, overlapThreshold = 0.42) {
  const selected = [];
  for (const candidate of candidates.sort((a, b) => b.confidence - a.confidence)) {
    if (selected.some((existing) => boxIou(existing.box, candidate.box) > overlapThreshold)) continue;
    selected.push(candidate);
    if (selected.length >= maxItems) break;
  }
  return selected;
}

function mergeCandidateWithUserState(incoming, existing = null) {
  if (!existing) return incoming;
  const preserveUserFields = existing.edited
    ? {
      name: existing.name,
      category: existing.category,
      qty: existing.qty,
      expireAt: existing.expireAt,
      reminders: normalizeReminderList(existing),
      nextAt: existing.nextAt,
      nextTime: existing.nextTime,
      nextRepeat: existing.nextRepeat,
      nextLabel: existing.nextLabel,
      container: existing.container,
      box: existing.box,
      edited: true,
      nameEdited: existing.nameEdited,
      boxEdited: existing.boxEdited,
    }
    : {};
  return {
    ...incoming,
    ...preserveUserFields,
    id: existing.id,
    selected: existing.selected,
    deletedAt: existing.deletedAt || null,
    cropImage: incoming.cropImage || existing.cropImage || "",
    cropMeta: normalizeCropMeta(incoming.cropMeta || existing.cropMeta),
    cropVersion: incoming.cropVersion || existing.cropVersion || "",
    detailsOpen: existing.detailsOpen,
    boxOpen: existing.boxOpen,
    nameEdited: existing.nameEdited || incoming.nameEdited || false,
    boxEdited: existing.boxEdited || incoming.boxEdited || false,
    confidence: Math.max(existing.confidence || 0, incoming.confidence || 0),
  };
}

function mergeRecognitionCandidates(existingCandidates, incomingCandidates, provider) {
  const existing = existingCandidates.map((candidate, index) => normalizeCandidate(candidate, index, provider));
  const incoming = incomingCandidates.map((candidate, index) => normalizeCandidate(candidate, index, provider));
  const usedExistingIds = new Set();
  const mergedIncoming = incoming.map((candidate) => {
    const overlap = existing
      .filter((entry) => !usedExistingIds.has(entry.id))
      .map((entry) => ({ entry, iou: boxIou(entry.box, candidate.box) }))
      .sort((a, b) => b.iou - a.iou)[0];
    if (!overlap || overlap.iou < 0.26) return candidate;
    usedExistingIds.add(overlap.entry.id);
    return mergeCandidateWithUserState(candidate, overlap.entry);
  });

  const untouchedExisting = existing.filter((candidate) => !usedExistingIds.has(candidate.id));
  const withPreserved = [...mergedIncoming, ...untouchedExisting];
  return dedupeCandidates(withPreserved, visionConfig.maxDetectedObjects, 0.3)
    .map((candidate, index) => normalizeCandidate(candidate, index, provider));
}

function applyCandidateProgressUpdates(currentCandidates, updatedCandidates, provider) {
  const currentById = new Map(currentCandidates.map((candidate) => [candidate.id, candidate]));
  return updatedCandidates.map((candidate, index) => {
    const current = currentById.get(candidate.id);
    return normalizeCandidate(mergeCandidateWithUserState(candidate, current), index, provider);
  });
}

async function getVisionAssetMode() {
  if (!visionAssetModePromise) {
    visionAssetModePromise = fetch(`${visionConfig.localManifest}?v=${visionConfig.assetVersion}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((manifest) => {
        const models = new Set(Array.isArray(manifest?.models) ? manifest.models : []);
        const hasLocalRuntime = Boolean(manifest?.transformers);
        const owlReady = models.has(visionConfig.detectionModel);
        const groundingReady = models.has(visionConfig.groundingDinoModel);
        return {
          local: hasLocalRuntime && (groundingReady || owlReady),
          hasLocalRuntime,
          owlReady,
          groundingReady,
          samReady: models.has(visionConfig.samModel),
          catalogReady: models.has(visionConfig.catalogModel),
          manifest,
        };
      })
      .catch(() => ({
        local: false,
        hasLocalRuntime: false,
        owlReady: false,
        groundingReady: false,
        samReady: false,
        catalogReady: false,
        manifest: null,
      }));
  }
  return visionAssetModePromise;
}

async function loadTransformersRuntime() {
  if (!transformersModulePromise) {
    transformersModulePromise = (async () => {
      const assetMode = await getVisionAssetMode();
      let module = null;
      let runtimeMode = assetMode;
      if (assetMode.hasLocalRuntime) {
        try {
          module = await import(`${visionConfig.localTransformersModule}?v=${visionConfig.assetVersion}`);
        } catch (error) {
          console.info("Local Transformers.js asset unavailable, using CDN fallback.", error);
          runtimeMode = {
            ...assetMode,
            local: false,
            hasLocalRuntime: false,
            manifest: null,
          };
        }
      }
      if (!module) {
        if (!visionConfig.allowRemoteVisionModels) {
          throw new Error("本地视觉模型资产未安装，请先运行 python3 scripts/download-vision-assets.py");
        }
        module = await import(visionConfig.remoteTransformersModule);
      }

      module.env.allowLocalModels = runtimeMode.hasLocalRuntime;
      module.env.allowRemoteModels = Boolean(visionConfig.allowRemoteVisionModels);
      module.env.localModelPath = visionConfig.localModelPath;
      module.env.useBrowserCache = false;
      configureTransformersRuntime(module);

      return { ...module, runtimeMode };
    })();
  }
  return transformersModulePromise;
}

function getVisionWasmThreadCount() {
  if (!window.crossOriginIsolated || typeof SharedArrayBuffer === "undefined") return 1;
  const cores = Number(navigator.hardwareConcurrency) || 2;
  return Math.max(1, Math.min(visionConfig.maxWasmThreads, Math.max(1, cores - 1)));
}

function configureTransformersRuntime(module) {
  try {
    const wasmBackend = module.env?.backends?.onnx?.wasm;
    if (!wasmBackend) return;
    wasmBackend.numThreads = getVisionWasmThreadCount();
    wasmBackend.wasmPaths = "/vendor/transformers/";
  } catch (error) {
    console.info("Vision runtime thread tuning skipped.", error);
  }
}

async function loadOnnxRuntime() {
  if (!onnxRuntimeModulePromise) {
    onnxRuntimeModulePromise = import(`${visionConfig.localOnnxRuntimeModule}?v=${visionConfig.appVersion}`)
      .then((module) => {
        if (module.env?.wasm) {
          module.env.wasm.wasmPaths = "/vendor/onnxruntime/";
          module.env.wasm.numThreads = getVisionWasmThreadCount();
        }
        return module;
      })
      .catch((error) => {
        onnxRuntimeModulePromise = null;
        throw error;
      });
  }
  return onnxRuntimeModulePromise;
}

async function getYoloxDetector() {
  if (!yoloxDetectorPromise) {
    yoloxDetectorPromise = loadOnnxRuntime()
      .then(async (ort) => {
        const session = await ort.InferenceSession.create(`${visionConfig.yoloxModelPath}?v=${visionConfig.appVersion}`, {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        });
        return {
          kind: "yolox-household-subject",
          modelId: visionConfig.yoloxModelPath,
          session,
          ort,
          inputName: session.inputNames?.[0] || "images",
          outputName: session.outputNames?.[0] || "output",
          inputSize: Math.max(32, Number(visionConfig.yoloxInputSize) || 416),
        };
      })
      .catch((error) => {
        yoloxDetectorPromise = null;
        throw error;
      });
  }
  return yoloxDetectorPromise;
}

async function getGroundingDinoDetector() {
  if (!groundingDinoDetectorPromise) {
    groundingDinoDetectorPromise = loadTransformersRuntime()
      .then(async ({ AutoModelForZeroShotObjectDetection, AutoProcessor, RawImage, load_image }) => {
        if (!AutoModelForZeroShotObjectDetection || !AutoProcessor) {
          throw new Error("当前 Transformers.js 运行时不支持 Grounding DINO");
        }
        const processor = await AutoProcessor.from_pretrained(visionConfig.groundingDinoModel);
        const model = await AutoModelForZeroShotObjectDetection.from_pretrained(visionConfig.groundingDinoModel, { dtype: "q8" });
        return {
          kind: "grounding-dino",
          processor,
          model,
          RawImage,
          loadImage: load_image,
        };
      })
      .catch((error) => {
        groundingDinoDetectorPromise = null;
        throw error;
      });
  }
  return groundingDinoDetectorPromise;
}

async function getSmallModelDetector() {
  if (!smallModelDetectorPromise) {
    smallModelDetectorPromise = loadTransformersRuntime()
      .then(({ pipeline }) => pipeline("zero-shot-object-detection", visionConfig.detectionModel, { quantized: true }))
      .catch((error) => {
        smallModelDetectorPromise = null;
        throw error;
      });
  }
  return smallModelDetectorPromise;
}

async function getSamSegmenter() {
  if (!samSegmenterPromise) {
    samSegmenterPromise = (async () => {
      const assetMode = await getVisionAssetMode();
      if (!assetMode.samReady) return null;
      const { AutoProcessor, RawImage, SamModel, runtimeMode } = await loadTransformersRuntime();
      if (!AutoProcessor || !RawImage || !SamModel) return null;
      const processor = await AutoProcessor.from_pretrained(visionConfig.samModel, { quantized: true });
      const model = await SamModel.from_pretrained(visionConfig.samModel, { quantized: true });
      return {
        processor,
        model,
        RawImage,
        provider: runtimeMode.samReady ? "local-sam" : "browser-sam",
      };
    })().catch((error) => {
      console.info("SAM refinement unavailable.", error);
      samSegmenterPromise = null;
      return null;
    });
  }
  return samSegmenterPromise;
}

function warmVisionModels() {
  window.setTimeout(async () => {
    const assetMode = await getVisionAssetMode();
    if (!assetMode.hasLocalRuntime) return;
    loadTransformersRuntime().then(() => {
      getGroundingLabelEntries();
      warmCaptureDetectionModel();
      window.setTimeout(() => {
        getCatalogEmbeddingIndex().catch(() => null);
        if (assetMode.catalogReady) {
          getCatalogFeatureExtractor().catch((error) => {
            console.info("Catalog naming prewarm skipped.", error);
          });
        }
      }, 1000);
    }).catch((error) => {
      console.info("Vision runtime prewarm skipped.", error);
    });
  }, 250);
}

function warmCaptureDetectionModel() {
  window.setTimeout(async () => {
    const assetMode = await getVisionAssetMode();
    if (!assetMode.local) return;
    const attempt = getDetectorAttempts(assetMode)[0];
    if (!attempt) return;
    attempt.getDetector().catch((error) => {
      console.info(`${attempt.provider} prewarm skipped.`, error);
    });
  }, 80);
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

async function fetchJsonIndex(url) {
  if (!url) return null;
  const response = await fetch(`${url}?v=${visionConfig.assetVersion}`, { cache: "no-store" });
  return response.ok ? response.json() : null;
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

function detectionBoxToPercent(box, imageWidth, imageHeight) {
  if (Array.isArray(box)) {
    const [xMin = 0, yMin = 0, xMax = 1, yMax = 1] = box;
    return clampBox({
      x: (xMin / imageWidth) * 100,
      y: (yMin / imageHeight) * 100,
      w: ((xMax - xMin) / imageWidth) * 100,
      h: ((yMax - yMin) / imageHeight) * 100,
    }, { minWidth: 0.2, minHeight: 0.2 });
  }
  const xMin = box.xmin ?? box.x_min ?? box.left ?? box.x ?? 0;
  const yMin = box.ymin ?? box.y_min ?? box.top ?? box.y ?? 0;
  const xMax = box.xmax ?? box.x_max ?? box.right ?? (xMin + (box.width ?? box.w ?? 1));
  const yMax = box.ymax ?? box.y_max ?? box.bottom ?? (yMin + (box.height ?? box.h ?? 1));
  return clampBox({
    x: (xMin / imageWidth) * 100,
    y: (yMin / imageHeight) * 100,
    w: ((xMax - xMin) / imageWidth) * 100,
    h: ((yMax - yMin) / imageHeight) * 100,
  }, { minWidth: 0.2, minHeight: 0.2 });
}

function detectionToCandidate(detection, index, source, provider, threshold, labelEntries = null) {
  const meta = getDetectionLabelMeta(detection.label, labelEntries || getDetectionLabelEntries());
  const box = detectionBoxToPercent(detection.box, source.naturalWidth, source.naturalHeight);
  const rawScore = Number(detection.score) || threshold;
  const score = clampNumber(rawScore + (isStorageDetectionLabel(detection.label) ? 0.035 : 0), threshold, 0.99);
  const canUseLabelName = isStorageDetectionLabel(detection.label) && meta.name && score >= visionConfig.detectionNameThreshold;
  return {
    name: getUnknownObjectName(index),
    category: meta.category,
    qty: 1,
    expireAt: "",
    nextAt: "",
    nextLabel: "",
    container: "",
    box,
    confidence: score,
    detectionLabel: detection.label,
    suggestedName: canUseLabelName ? meta.name : "",
    catalogId: "",
    namingStatus: "loading",
    source: provider,
    providerId: provider,
    providerClass: provider.startsWith("local-") ? "real-local-model" : "fallback",
    modelId: provider.startsWith("local-yolox") ? visionConfig.yoloxModelPath : (provider.startsWith("local-grounding-dino") ? visionConfig.groundingDinoModel : visionConfig.detectionModel),
    assetVersion: visionConfig.assetVersion,
    timings: detection.timings || {},
  };
}

function nmsDetections(detections, source, iouThreshold, maxItems) {
  const selected = [];
  const limit = Number.isFinite(Number(maxItems)) ? Math.max(1, Number(maxItems)) : Infinity;
  const sorted = (Array.isArray(detections) ? detections : [])
    .filter((detection) => detection?.box)
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
  for (const detection of sorted) {
    const box = detectionBoxToPercent(detection.box, source.naturalWidth, source.naturalHeight);
    if (selected.some((existing) => boxIou(existing.box, box) >= iouThreshold)) continue;
    selected.push({ detection, box });
    if (selected.length >= limit) break;
  }
  return selected.map((entry) => entry.detection);
}

function createDetectionStatsReader(source, maxSide = 512) {
  const sourceWidth = source.naturalWidth || source.width || 1;
  const sourceHeight = source.naturalHeight || source.height || 1;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  return (box) => {
    const x1 = Math.max(0, Math.min(width - 1, Math.floor(box[0] * scale)));
    const y1 = Math.max(0, Math.min(height - 1, Math.floor(box[1] * scale)));
    const x2 = Math.max(x1 + 1, Math.min(width, Math.ceil(box[2] * scale)));
    const y2 = Math.max(y1 + 1, Math.min(height, Math.ceil(box[3] * scale)));
    let sum = 0;
    let count = 0;
    for (let y = y1; y < y2; y += 1) {
      for (let x = x1; x < x2; x += 1) {
        const offset = (y * width + x) * 4;
        sum += 0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2];
        count += 1;
      }
    }
    return { meanLuma: count ? sum / count : 255 };
  };
}

function getBoxArea(box) {
  return Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
}

function getBoxContainment(inner, outer) {
  const x1 = Math.max(inner[0], outer[0]);
  const y1 = Math.max(inner[1], outer[1]);
  const x2 = Math.min(inner[2], outer[2]);
  const y2 = Math.min(inner[3], outer[3]);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const innerArea = getBoxArea(inner);
  return innerArea > 0 ? intersection / innerArea : 0;
}

function getYoloxBoxShape(detection, source) {
  const sourceWidth = source.naturalWidth || source.width || 1;
  const sourceHeight = source.naturalHeight || source.height || 1;
  const imageArea = sourceWidth * sourceHeight;
  const [x1, y1, x2, y2] = detection.box;
  const width = Math.max(1, x2 - x1);
  const height = Math.max(1, y2 - y1);
  return {
    width,
    height,
    aspect: width / height,
    areaRatio: getBoxArea(detection.box) / Math.max(1, imageArea),
  };
}

function isLowValueYoloxDetection(detection, source, topScore) {
  const score = Number(detection?.score || 0);
  const shape = getYoloxBoxShape(detection, source);
  if (shape.areaRatio <= 0.00035) return true;
  if (shape.areaRatio <= 0.0008 && score < 0.32) return true;
  if (shape.areaRatio >= 0.92) return true;
  if ((shape.aspect >= 10 || shape.aspect <= 0.1) && score < 0.45) return true;
  if (topScore >= 0.5 && score < Math.max(visionConfig.yoloxThreshold, topScore * 0.18)) return true;
  return false;
}

function suppressYoloxNearDuplicates(detections) {
  const selected = [];
  const sorted = (Array.isArray(detections) ? detections : [])
    .filter((detection) => detection?.box)
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
  for (const detection of sorted) {
    const area = getBoxArea(detection.box);
    const duplicate = selected.some((existing) => {
      const existingArea = getBoxArea(existing.box);
      const smaller = Math.min(area, existingArea);
      const larger = Math.max(area, existingArea);
      const areaSimilarity = smaller / Math.max(1, larger);
      if (boxIou(existing.box, detection.box) >= 0.78) return true;
      return areaSimilarity >= 0.68
        && (getBoxContainment(detection.box, existing.box) >= 0.92 || getBoxContainment(existing.box, detection.box) >= 0.92);
    });
    if (!duplicate) selected.push(detection);
  }
  return selected;
}

function getYoloxDynamicDetectionLimit(detections, source) {
  const simpleMax = Math.max(1, Number(visionConfig.yoloxSimpleMaxDetections) || 5);
  const baseMax = Math.max(simpleMax, Number(visionConfig.yoloxBaseMaxDetections) || 10);
  const denseMax = Math.max(baseMax, Number(visionConfig.yoloxDenseMaxDetections) || 15);
  const candidates = (Array.isArray(detections) ? detections : []).filter((detection) => detection?.box);
  const useful = candidates.filter((detection) => {
    const shape = getYoloxBoxShape(detection, source);
    return Number(detection.score || 0) >= 0.2 && shape.areaRatio >= 0.001 && shape.areaRatio <= 0.75;
  });
  const strong = useful.filter((detection) => Number(detection.score || 0) >= 0.35);
  if (useful.length <= 6 && strong.length <= 2) return simpleMax;
  if (useful.length >= 12 || strong.length >= 7) return denseMax;
  return baseMax;
}

function postprocessYoloxDetections(detections, source) {
  const nmsLimit = Math.max(Number(visionConfig.yoloxDenseMaxDetections) || 15, Number(visionConfig.maxDetectedObjects) || 15) * 2;
  const nms = nmsDetections(detections, source, visionConfig.yoloxNmsIou, nmsLimit);
  const topScore = Math.max(0, ...nms.map((detection) => Number(detection.score || 0)));
  const filtered = suppressYoloxNearDuplicates(
    nms.filter((detection) => !isLowValueYoloxDetection(detection, source, topScore)),
  );
  const visible = suppressDarkDisplayInnerDetections(filtered, source);
  const limit = getYoloxDynamicDetectionLimit(visible, source);
  return visible
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
    .slice(0, limit);
}

function suppressDarkDisplayInnerDetections(detections, source) {
  if (!Array.isArray(detections) || detections.length < 2) return detections;
  const sourceWidth = source.naturalWidth || source.width || 1;
  const sourceHeight = source.naturalHeight || source.height || 1;
  const imageArea = sourceWidth * sourceHeight;
  let readStats = null;
  const getStats = (detection) => {
    if (!readStats) readStats = createDetectionStatsReader(source);
    if (!detection._displayStats) detection._displayStats = readStats(detection.box);
    return detection._displayStats;
  };
  const displayParents = detections.filter((detection) => {
    const [x1, y1, x2, y2] = detection.box;
    const width = x2 - x1;
    const height = y2 - y1;
    const areaRatio = getBoxArea(detection.box) / imageArea;
    const aspect = width / Math.max(1, height);
    return detection.score >= 0.55 && areaRatio >= 0.06 && aspect >= 1.2 && aspect <= 3.2 && getStats(detection).meanLuma <= 75;
  });
  if (!displayParents.length) return detections;
  return detections.filter((detection) => {
    const area = getBoxArea(detection.box);
    const stats = getStats(detection);
    return !displayParents.some((parent) => {
      if (parent === detection) return false;
      const parentArea = getBoxArea(parent.box);
      const areaRatio = area / Math.max(1, parentArea);
      return areaRatio >= 0.04
        && areaRatio <= 0.35
        && getBoxContainment(detection.box, parent.box) >= 0.9
        && stats.meanLuma <= 70;
    });
  }).map((detection) => {
    if (detection && typeof detection === "object") delete detection._displayStats;
    return detection;
  });
}

function preprocessYoloxImage(source, inputSize) {
  const sourceWidth = source.naturalWidth || source.width || 1;
  const sourceHeight = source.naturalHeight || source.height || 1;
  const ratio = Math.min(inputSize / sourceWidth, inputSize / sourceHeight);
  const resizedWidth = Math.max(1, Math.round(sourceWidth * ratio));
  const resizedHeight = Math.max(1, Math.round(sourceHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = inputSize;
  canvas.height = inputSize;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "rgb(114,114,114)";
  context.fillRect(0, 0, inputSize, inputSize);
  context.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, resizedWidth, resizedHeight);
  const pixels = context.getImageData(0, 0, inputSize, inputSize).data;
  const planeSize = inputSize * inputSize;
  const data = new Float32Array(planeSize * 3);
  for (let pixelIndex = 0; pixelIndex < planeSize; pixelIndex += 1) {
    const offset = pixelIndex * 4;
    data[pixelIndex] = pixels[offset + 2];
    data[planeSize + pixelIndex] = pixels[offset + 1];
    data[(planeSize * 2) + pixelIndex] = pixels[offset];
  }
  return { data, ratio, resizedWidth, resizedHeight, sourceWidth, sourceHeight };
}

function yoloxCenterBoxToDetection(row, ratio, sourceWidth, sourceHeight) {
  const cx = Number(row[0]);
  const cy = Number(row[1]);
  const width = Number(row[2]);
  const height = Number(row[3]);
  const objectness = Number(row[4]);
  const classScores = row.slice(5).map(Number).filter(Number.isFinite);
  const classScore = classScores.length ? Math.max(...classScores) : Number(row[5] ?? 1);
  const score = objectness * classScore;
  if (![cx, cy, width, height, score].every(Number.isFinite) || width <= 1 || height <= 1) return null;
  const x1 = clampNumber((cx - width / 2) / ratio, 0, sourceWidth - 1);
  const y1 = clampNumber((cy - height / 2) / ratio, 0, sourceHeight - 1);
  const x2 = clampNumber((cx + width / 2) / ratio, x1 + 1, sourceWidth);
  const y2 = clampNumber((cy + height / 2) / ratio, y1 + 1, sourceHeight);
  return {
    label: "household subject",
    score,
    box: [x1, y1, x2, y2],
  };
}

function postprocessYoloxOutput(output, meta, threshold) {
  const values = Array.from(output?.data || []);
  const dims = Array.isArray(output?.dims) ? output.dims : [];
  const stride = dims.length >= 3 ? dims[dims.length - 1] : 6;
  const detections = [];
  for (let index = 0; index + stride <= values.length; index += stride) {
    const row = values.slice(index, index + stride);
    const detection = yoloxCenterBoxToDetection(row, meta.ratio, meta.sourceWidth, meta.sourceHeight);
    if (!detection || detection.score < threshold) continue;
    detections.push(detection);
  }
  return detections;
}

async function runYoloxDetector({ source, detector, threshold }) {
  const startedAt = performance.now();
  const input = preprocessYoloxImage(source, detector.inputSize);
  const tensor = new detector.ort.Tensor("float32", input.data, [1, 3, detector.inputSize, detector.inputSize]);
  const outputs = await detector.session.run({ [detector.inputName]: tensor });
  const output = outputs[detector.outputName] || Object.values(outputs)[0];
  const rawDetections = postprocessYoloxOutput(output, input, threshold);
  const detectionMs = Math.round((performance.now() - startedAt) * 1000) / 1000;
  return rawDetections.map((detection) => ({
    ...detection,
    timings: {
      detectionMs,
      promptStrategy: "yolox-household-subject",
      promptCount: 0,
      promptBatches: 0,
      rawDetectionCount: rawDetections.length,
      filteredDetectionCount: rawDetections.length,
    },
  }));
}

async function runZeroShotDetector({ image, source, detector, provider, threshold, roomType = null }) {
  if (detector?.kind === "yolox-household-subject") {
    const detections = await runYoloxDetector({ source, detector, threshold });
    return postprocessYoloxDetections(detections, source)
      .map((detection, index) => detectionToCandidate(detection, index, source, provider, threshold, null));
  }
  const isGroundingDino = detector?.kind === "grounding-dino";
  const promptShards = isGroundingDino ? getGroundingPromptShards(roomType) : [];
  const labelEntries = isGroundingDino ? getGroundingSubjectLabelEntries(roomType) : getOwlVitSubjectLabelEntries(roomType);
  const labels = labelEntries.map((entry) => entry.label);
  const promptBatchSize = isGroundingDino
    ? Math.max(1, Math.min(labels.length || 1, Number(visionConfig.groundingPromptBatchSize) || labels.length || 1))
    : Math.max(1, Math.min(labels.length || 1, Number(visionConfig.owlVitPromptBatchSize) || labels.length || 1));
  const detectionStart = performance.now();
  const detectionOutput = isGroundingDino
    ? await runGroundingDinoDetector({ image, source, detector, promptShards, threshold })
    : { detections: await runPipelineObjectDetector({ image, detector, labels, threshold }) };
  const detections = Array.isArray(detectionOutput) ? detectionOutput : (detectionOutput.detections || []);
  const detectionMs = Math.round((performance.now() - detectionStart) * 1000) / 1000;
  const promptBatches = isGroundingDino
    ? (detectionOutput.promptBatches || 0)
    : Math.ceil((labels.length || 1) / promptBatchSize);
  const promptCount = isGroundingDino
    ? (detectionOutput.promptCount || 0)
    : labels.length;
  const filtered = (Array.isArray(detections) ? detections : [])
    .filter((detection) => detection?.box && Number(detection.score) >= threshold)
    .sort((a, b) => Number(b.score) - Number(a.score));
  return nmsDetections(filtered, source, visionConfig.detectionNmsIou, visionConfig.maxModelDetections)
    .map((detection, index) => detectionToCandidate({
      ...detection,
      timings: {
        detectionMs,
        promptRoomType: roomType,
        promptStrategy: isGroundingDino ? "coarse-shards" : "owlvit-subjects",
        promptShardNames: detectionOutput.promptShardNames || "",
        promptCount,
        promptBatchSize,
        promptBatches,
        rawDetectionCount: detections.length,
        filteredDetectionCount: filtered.length,
      },
    }, index, source, provider, threshold, labelEntries));
}

function chunkArray(values, chunkSize) {
  const chunks = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

async function runPipelineObjectDetector({ image, detector, labels, threshold }) {
  const detections = [];
  const promptBatchSize = Math.max(1, Math.min(labels.length || 1, Number(visionConfig.owlVitPromptBatchSize) || labels.length || 1));
  for (const labelChunk of chunkArray(labels, promptBatchSize)) {
    const chunkDetections = await detector(image, labelChunk, { threshold, percentage: false });
    if (Array.isArray(chunkDetections)) detections.push(...chunkDetections);
  }
  return detections;
}

function tensorValues(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.data)) return value.data;
  if (value.data) return Array.from(value.data);
  return [];
}

function tensorRows(value, width) {
  const values = tensorValues(value);
  if (Array.isArray(values[0])) return values;
  const rows = [];
  for (let index = 0; index < values.length; index += width) {
    rows.push(values.slice(index, index + width));
  }
  return rows;
}

async function readRawVisionImage(detector, image) {
  if (detector.loadImage) return detector.loadImage(image);
  if (detector.RawImage?.fromURL) return detector.RawImage.fromURL(image);
  if (detector.RawImage?.read) return detector.RawImage.read(image);
  return image;
}

async function runGroundingDinoDetector({ image, source, detector, promptShards, threshold }) {
  const rawImage = await readRawVisionImage(detector, image);
  const targetWidth = Number(rawImage?.width || source.naturalWidth || source.width || 1);
  const targetHeight = Number(rawImage?.height || source.naturalHeight || source.height || 1);
  const detections = [];
  const pseudoSource = { naturalWidth: targetWidth, naturalHeight: targetHeight };
  const shardTimings = [];
  const seenLabels = new Set();
  const startedAt = performance.now();
  let promptCount = 0;

  for (const shard of promptShards || []) {
    const labelBatch = (shard.entries || [])
      .map((entry) => normalizeDetectionLabel(entry.label))
      .filter((label) => {
        if (!label || seenLabels.has(label)) return false;
        seenLabels.add(label);
        return true;
      })
      .slice(0, visionConfig.groundingPromptBatchSize);
    if (!labelBatch.length) continue;
    const shardStartedAt = performance.now();
    const text = `${labelBatch.join(". ")}.`;
    const inputs = await detector.processor(rawImage, text);
    const outputs = await detector.model(inputs);
    let processed = detector.processor.post_process_grounded_object_detection
      ? detector.processor.post_process_grounded_object_detection(outputs, inputs.input_ids, {
        box_threshold: threshold,
        text_threshold: threshold,
        target_sizes: [[targetHeight, targetWidth]],
      })
      : [];
    if (processed instanceof Promise) processed = await processed;
    const shardMs = Math.round((performance.now() - shardStartedAt) * 1000) / 1000;
    const first = Array.isArray(processed) ? processed[0] : processed;
    const scores = tensorValues(first?.scores);
    const boxes = tensorRows(first?.boxes, 4);
    const resultLabels = tensorValues(first?.labels).length
      ? tensorValues(first.labels)
      : (Array.isArray(first?.labels) ? first.labels : []);
    for (let index = 0; index < boxes.length; index += 1) {
      detections.push({
        label: resultLabels[index] || labelBatch[0],
        score: Number(scores[index]) || threshold,
        box: boxes[index],
        promptShard: shard.id || shard.label || "prompt",
      });
    }
    promptCount += labelBatch.length;
    shardTimings.push({
      id: shard.id || shard.label || "prompt",
      labels: labelBatch.length,
      raw: boxes.length,
      ms: shardMs,
    });

    const selectedCount = nmsDetections(
      detections.filter((detection) => detection?.box && Number(detection.score) >= threshold),
      pseudoSource,
      visionConfig.detectionNmsIou,
      visionConfig.maxModelDetections,
    ).length;
    const elapsed = performance.now() - startedAt;
    const targetCount = Math.max(1, Number(visionConfig.groundingShortPromptTargetCount) || 7);
    const budgetMs = Math.max(1, Number(visionConfig.groundingPromptBudgetMs) || 2600);
    if (selectedCount >= targetCount || elapsed >= budgetMs) break;
  }
  return {
    detections,
    promptCount,
    promptBatches: shardTimings.length,
    promptShardNames: shardTimings.map((shard) => `${shard.id}:${shard.labels}/${Math.round(shard.ms)}ms`).join(", "),
    promptShardTimings: shardTimings,
  };
}

function hashStringFast(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${value.length}-${(hash >>> 0).toString(36)}`;
}

function cloneRecognitionResult(result, extra = {}) {
  return {
    provider: result.provider,
    candidates: (result.candidates || []).map((candidate) => ({
      ...candidate,
      box: { ...(candidate.box || {}) },
      modelBox: candidate.modelBox ? { ...candidate.modelBox } : null,
      modelImageMeta: normalizeImageMeta(candidate.modelImageMeta),
      timings: candidate.timings && typeof candidate.timings === "object" ? { ...candidate.timings } : {},
      cropMeta: normalizeCropMeta(candidate.cropMeta),
      aliases: Array.isArray(candidate.aliases) ? [...candidate.aliases] : [],
    })),
    timings: result.timings && typeof result.timings === "object" ? { ...result.timings } : null,
    ...extra,
  };
}

function percentBoxToPixels(box, source) {
  return {
    x1: Math.round((box.x / 100) * source.naturalWidth),
    y1: Math.round((box.y / 100) * source.naturalHeight),
    x2: Math.round(((box.x + box.w) / 100) * source.naturalWidth),
    y2: Math.round(((box.y + box.h) / 100) * source.naturalHeight),
  };
}

function maskTensorToBox(mask, source) {
  const data = mask?.data || mask?.mask?.data || mask?.array || null;
  const dims = mask?.dims || mask?.mask?.dims || mask?.shape || null;
  if (!data || !dims?.length) return null;

  const width = Number(dims[dims.length - 1]);
  const height = Number(dims[dims.length - 2]);
  if (!width || !height) return null;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let pixels = 0;
  const planeSize = width * height;
  const offset = data.length > planeSize ? data.length - planeSize : 0;
  for (let index = 0; index < planeSize; index += 1) {
    if (Number(data[offset + index]) <= 0.5) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    pixels += 1;
  }
  if (pixels < 16 || minX > maxX || minY > maxY) return null;

  return clampBox({
    x: (minX / width) * 100,
    y: (minY / height) * 100,
    w: ((maxX - minX + 1) / width) * 100,
    h: ((maxY - minY + 1) / height) * 100,
  });
}

function findMaskBox(output, source) {
  const queue = [output];
  const visited = new Set();
  while (queue.length) {
    const value = queue.shift();
    if (!value || visited.has(value)) continue;
    if (typeof value === "object") visited.add(value);
    const box = maskTensorToBox(value, source);
    if (box) return box;
    if (Array.isArray(value)) {
      queue.push(...value);
    } else if (typeof value === "object") {
      queue.push(...Object.values(value));
    }
  }
  return null;
}

function isPlausibleRefinedBox(original, refined) {
  const originalCenter = {
    x: original.x + original.w / 2,
    y: original.y + original.h / 2,
  };
  const containsCenter = originalCenter.x >= refined.x
    && originalCenter.x <= refined.x + refined.w
    && originalCenter.y >= refined.y
    && originalCenter.y <= refined.y + refined.h;
  const areaRatio = boxArea(refined) / Math.max(1, boxArea(original));
  return containsCenter && areaRatio >= 0.12 && areaRatio <= 3.8;
}

async function refineCandidateWithSam(segmenter, rawImage, source, candidate) {
  const { x1, y1, x2, y2 } = percentBoxToPixels(candidate.box, source);
  const centerPoint = [
    Math.round((x1 + x2) / 2),
    Math.round((y1 + y2) / 2),
  ];
  const inputs = await segmenter.processor(rawImage, {
    input_points: [[centerPoint]],
    input_labels: [[1]],
  });
  const outputs = await segmenter.model(inputs);
  const masks = segmenter.processor.post_process_masks
    ? await segmenter.processor.post_process_masks(outputs.pred_masks, inputs.original_sizes, inputs.reshaped_input_sizes)
    : outputs;
  const refinedBox = findMaskBox(masks, source);
  if (!refinedBox || !isPlausibleRefinedBox(candidate.box, refinedBox)) return candidate;
  return {
    ...candidate,
    box: refinedBox,
    source: `${candidate.source}+sam`,
  };
}

async function refineCandidatesWithSam(image, source, candidates, provider) {
  if (visionConfig.maxSamRefinements <= 0) {
    return { provider, candidates };
  }
  const segmenter = await getSamSegmenter();
  if (!segmenter || !candidates.length) {
    return { provider, candidates };
  }

  try {
    const rawImage = segmenter.RawImage.fromURL
      ? await segmenter.RawImage.fromURL(image)
      : await segmenter.RawImage.read(image);
    const refineTargets = candidates
      .filter((candidate) => boxArea(candidate.box) >= visionConfig.samMinBoxArea)
      .map((candidate, index) => ({
        candidate,
        index,
        priority: (isStorageDetectionLabel(candidate.detectionLabel) ? 1 : 0) + clampNumber(candidate.confidence, 0, 1),
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, visionConfig.maxSamRefinements);
    const refinedById = new Map();
    for (const { candidate } of refineTargets) {
      // SAM runs after detection and only tightens regions; a failure must not replace detector geometry.
      const refined = await refineCandidateWithSam(segmenter, rawImage, source, candidate).catch(() => candidate);
      refinedById.set(candidate.id, refined);
    }
    return {
      provider: `${provider}+sam`,
      candidates: candidates.map((candidate) => refinedById.get(candidate.id) || candidate),
    };
  } catch (error) {
    console.info("SAM refinement skipped.", error);
    return { provider, candidates };
  }
}

function getSourcePixelSize(source) {
  const sourceWidth = source.naturalWidth || source.width || 1;
  const sourceHeight = source.naturalHeight || source.height || 1;
  return { sourceWidth, sourceHeight };
}

function getCropPixelRect(source, box, options = {}) {
  const { sourceWidth, sourceHeight } = getSourcePixelSize(source);
  const paddingPct = Number(options.paddingPct) || 0;
  const padX = ((box.w * paddingPct) / 100);
  const padY = ((box.h * paddingPct) / 100);
  const x1Pct = clampNumber(box.x - padX, 0, 100);
  const y1Pct = clampNumber(box.y - padY, 0, 100);
  const x2Pct = clampNumber(box.x + box.w + padX, x1Pct + 0.01, 100);
  const y2Pct = clampNumber(box.y + box.h + padY, y1Pct + 0.01, 100);
  const x = Math.max(0, Math.round((x1Pct / 100) * sourceWidth));
  const y = Math.max(0, Math.round((y1Pct / 100) * sourceHeight));
  const width = Math.max(1, Math.round(((x2Pct - x1Pct) / 100) * sourceWidth));
  const height = Math.max(1, Math.round(((y2Pct - y1Pct) / 100) * sourceHeight));
  return {
    x,
    y,
    width: Math.max(1, Math.min(width, sourceWidth - x)),
    height: Math.max(1, Math.min(height, sourceHeight - y)),
  };
}

function cropImageToDataUrl(source, box, options = {}) {
  const rect = getCropPixelRect(source, box, options);
  const maxDimension = Number(options.maxDimension) || Math.max(rect.width, rect.height);
  const scale = Math.min(1, maxDimension / Math.max(rect.width, rect.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.width * scale));
  canvas.height = Math.max(1, Math.round(rect.height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", options.quality || 0.86);
}

function createCandidateCropSnapshot(source, box) {
  if (!source || !box) return null;
  try {
    const rect = getCropPixelRect(source, box);
    return {
      cropImage: cropImageToDataUrl(source, box, {
        maxDimension: visionConfig.candidateCropMaxDimension,
        quality: visionConfig.candidateCropQuality,
      }),
      cropMeta: { width: rect.width, height: rect.height },
      cropVersion: visionConfig.candidateCropVersion,
    };
  } catch (error) {
    console.info("Candidate crop thumbnail skipped.", error);
    return null;
  }
}

function createCandidateCropImage(source, box) {
  return createCandidateCropSnapshot(source, box)?.cropImage || "";
}

function shouldRefreshCandidateCrop(candidate) {
  return !candidate.cropImage
    || !normalizeCropMeta(candidate.cropMeta)
    || candidate.cropVersion !== visionConfig.candidateCropVersion;
}

async function matchCatalogForCrop(source, box) {
  const indexedMatch = await matchCatalogFromEmbeddingIndex(source, box);
  if (indexedMatch) return indexedMatch;

  const classifier = await getCatalogClassifier();
  if (!classifier) return null;

  const promptEntries = getCatalogPromptEntries();
  const results = await classifier(cropImageToDataUrl(source, box), promptEntries.map((entry) => entry.prompt));
  const best = (Array.isArray(results) ? results : [])
    .map((result) => ({
      ...result,
      meta: promptEntries.find((entry) => entry.prompt === result.label),
    }))
    .filter((result) => result.meta)
    .sort((a, b) => Number(b.score) - Number(a.score))[0];

  if (!best || Number(best.score) < visionConfig.catalogThreshold) return null;
  return {
    name: best.meta.name,
    category: best.meta.category,
    confidence: clampNumber(Number(best.score), 0, 1),
    catalogId: best.meta.id,
  };
}

async function recognizeWithSmallModel(image, options = {}) {
  const source = await loadImage(image);
  const assetMode = await getVisionAssetMode();
  const detectorAttempts = getDetectorAttempts(assetMode);
  const roomType = getCapturePromptRoomType(options.roomType);

  let lastError = null;
  for (const attempt of detectorAttempts) {
    try {
      const detectorLoadStart = performance.now();
      const detector = await attempt.getDetector();
      const detectorLoadMs = Math.round((performance.now() - detectorLoadStart) * 1000) / 1000;
      const candidates = await runZeroShotDetector({
        image,
        source,
        detector,
        provider: attempt.provider,
        threshold: attempt.threshold,
        roomType,
      });
      const detected = dedupeCandidates(candidates, visionConfig.maxDetectedObjects, 0.34);
      if (!detected.length) continue;
      const refined = await refineCandidatesWithSam(image, source, detected, attempt.provider);
      const firstTiming = refined.candidates[0]?.timings || detected[0]?.timings || {};
      return {
        provider: refined.provider,
        candidates: renumberUnknownCandidates(refined.candidates),
        timings: {
          detectorLoadMs,
          detectionMs: firstTiming.detectionMs || 0,
          promptCount: firstTiming.promptCount || 0,
          promptRoomType: firstTiming.promptRoomType || roomType,
          promptStrategy: firstTiming.promptStrategy || "",
          promptShardNames: firstTiming.promptShardNames || "",
          promptBatchSize: firstTiming.promptBatchSize || 0,
          promptBatches: firstTiming.promptBatches || 0,
          rawDetectionCount: firstTiming.rawDetectionCount || 0,
          filteredDetectionCount: firstTiming.filteredDetectionCount || 0,
          resultCount: refined.candidates.length,
        },
      };
    } catch (error) {
      lastError = error;
      console.info(`${attempt.provider} unavailable.`, error);
    }
  }

  throw lastError || new Error("本地主体识别暂不可用");
}

function getOwlVitDetectorAttempt(assetMode) {
  return {
    getDetector: getSmallModelDetector,
    provider: assetMode.owlReady ? "local-owlvit" : "browser-owlvit",
    threshold: visionConfig.detectionThreshold,
  };
}

function getGroundingDinoDetectorAttempt(assetMode) {
  return {
    getDetector: getGroundingDinoDetector,
    provider: assetMode.groundingReady ? "local-grounding-dino" : "browser-grounding-dino",
    threshold: visionConfig.groundingThreshold,
  };
}

function getYoloxDetectorAttempt() {
  return {
    getDetector: getYoloxDetector,
    provider: "local-yolox-household-subject",
    threshold: visionConfig.yoloxThreshold,
  };
}

function shouldAttemptGroundingDino(assetMode) {
  if (!assetMode.groundingReady) return false;
  if (!assetMode.owlReady) return true;
  return visionConfig.preferredDetector === "grounding-dino" || visionConfig.enableGroundingDinoFallback;
}

function getDetectorAttempts(assetMode) {
  if (visionConfig.preferredDetector === "yolox") {
    return [
      getYoloxDetectorAttempt(),
      ...(visionConfig.enableGroundingDinoFallback && assetMode.groundingReady ? [getGroundingDinoDetectorAttempt(assetMode)] : []),
    ];
  }

  const preferOwlVit = visionConfig.preferredDetector === "owlvit";
  if (preferOwlVit) {
    return [
      ...(assetMode.owlReady || !assetMode.groundingReady ? [getOwlVitDetectorAttempt(assetMode)] : []),
      ...(shouldAttemptGroundingDino(assetMode) ? [getGroundingDinoDetectorAttempt(assetMode)] : []),
    ];
  }

  return [
    ...(assetMode.groundingReady ? [getGroundingDinoDetectorAttempt(assetMode)] : []),
    ...(!assetMode.groundingReady && assetMode.owlReady ? [getOwlVitDetectorAttempt(assetMode)] : []),
  ];
}

async function recognizeWithSmallModelUncached(image, options = {}) {
  const result = await recognizeWithSmallModel(image, options);
  return result;
}

async function recognizeWithCloudApi(context) {
  const endpoint = visionConfig.cloudRecognitionEndpoint || (platform.isNative ? "" : "/api/recognize");
  if (!endpoint) {
    throw new Error("iOS 未配置云端识别端点，默认只使用本地识别。");
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      image: context.image,
      room: context.room?.name,
      place: context.place?.name,
      placeNote: context.place?.note,
      existingItems: context.existingItems.map((item) => ({
        name: item.name,
        category: item.category,
        container: item.container,
      })),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "云端大模型识别失败");
  }
  return {
    provider: payload.provider || "cloud-vlm",
    candidates: payload.candidates || [],
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片无法读取，请换一张照片。"));
    image.src = src;
  });
}

function withTimeout(promise, timeoutMs, message) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

function isImageFile(file) {
  if (file?.type?.startsWith("image/")) return true;
  return /\.(avif|bmp|gif|heic|heif|jpe?g|png|webp)$/i.test(file?.name || "");
}

function isLikelyImageDecodeError(error) {
  return /decode|解码|图片无法读取|source image|unsupported|invalid image/i.test(error?.message || String(error || ""));
}

async function readFileSignature(file, length = 32) {
  const buffer = await file.slice(0, length).arrayBuffer();
  return new Uint8Array(buffer);
}

function asciiFromBytes(bytes, start, end) {
  return Array.from(bytes.slice(start, end), (byte) => String.fromCharCode(byte)).join("");
}

async function isHeicHeifFile(file) {
  const mime = String(file?.type || "").toLowerCase();
  if (/image\/hei[cf]|image\/heif-sequence|image\/heic-sequence/.test(mime)) return true;
  if (/\.(heic|heif|heics|heifs)$/i.test(file?.name || "")) return true;

  try {
    const bytes = await readFileSignature(file, 32);
    if (bytes.length < 12 || asciiFromBytes(bytes, 4, 8) !== "ftyp") return false;
    const brands = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"]);
    for (let index = 8; index + 4 <= bytes.length; index += 4) {
      if (brands.has(asciiFromBytes(bytes, index, index + 4))) return true;
    }
  } catch (error) {
    console.warn("HEIC signature check failed.", error);
  }
  return false;
}

async function loadHeicConverter() {
  if (typeof window.heic2any === "function") return window.heic2any;
  if (!heicConverterPromise) {
    heicConverterPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${visionConfig.localHeicConverterScript}?v=${visionConfig.appVersion}`;
      script.async = true;
      script.onload = () => {
        if (typeof window.heic2any === "function") {
          resolve(window.heic2any);
          return;
        }
        reject(new Error("HEIC 转换器加载失败。"));
      };
      script.onerror = () => reject(new Error("HEIC 转换器加载失败。"));
      document.head.appendChild(script);
    }).catch((error) => {
      heicConverterPromise = null;
      throw error;
    });
  }
  return heicConverterPromise;
}

function canUseLocalImageConversionApi() {
  return ["http:", "https:"].includes(window.location.protocol);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("图片数据读取失败。"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}

async function convertHeicFileWithLocalServer(file) {
  const image = await blobToDataUrl(file);
  const response = await fetch("/api/convert-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      image,
      filename: file.name || "upload.heic",
      quality: Math.round(visionConfig.uploadJpegQuality * 100),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "本地 HEIC/HEIF 转换失败。");
  }
  if (!String(payload.image || "").startsWith("data:image/jpeg;base64,")) {
    throw new Error("本地 HEIC/HEIF 转换没有返回 JPEG。");
  }
  return fetch(payload.image).then((convertedResponse) => convertedResponse.blob());
}

async function convertHeicFileInBrowser(file) {
  const heic2any = await loadHeicConverter();
  const converted = await withTimeout(
    heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: Math.min(0.92, Math.max(0.72, visionConfig.uploadJpegQuality)),
      multiple: false,
    }),
    visionConfig.heicConversionTimeoutMs,
    "HEIC/HEIF 转 JPEG 超时，请稍后重试或先裁剪照片。",
  );
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob)) {
    throw new Error("HEIC/HEIF 转 JPEG 失败。");
  }
  return blob;
}

async function convertHeicFileToJpegBlob(file) {
  const errors = [];
  if (canUseLocalImageConversionApi()) {
    try {
      return await convertHeicFileWithLocalServer(file);
    } catch (error) {
      errors.push(error);
      console.warn("Local HEIC conversion failed, falling back to browser converter.", error);
    }
  }
  try {
    return await convertHeicFileInBrowser(file);
  } catch (error) {
    errors.push(error);
  }
  console.warn("HEIC conversion failed.", errors);
  throw new Error("HEIC/HEIF 自动转换失败，请换一张照片或先在相册导出为 JPEG/PNG。");
}

function getDrawableSize(source) {
  return {
    width: source.videoWidth || source.naturalWidth || source.width || 1,
    height: source.videoHeight || source.naturalHeight || source.height || 1,
  };
}

function drawSourceToDataUrl(source, width, height, quality) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function resizeImageSourceToDataUrl(source, options = {}) {
  const maxDimension = options.maxDimension || visionConfig.maxUploadDimension;
  const maxLength = options.maxLength || visionConfig.maxUploadDataUrlLength;
  let quality = options.quality || visionConfig.uploadJpegQuality;
  const original = getDrawableSize(source);
  let scale = Math.min(1, maxDimension / Math.max(original.width, original.height));
  let width = Math.max(1, Math.round(original.width * scale));
  let height = Math.max(1, Math.round(original.height * scale));
  let dataUrl = drawSourceToDataUrl(source, width, height, quality);

  while (dataUrl.length > maxLength && quality > 0.58) {
    quality = Math.max(0.58, quality - 0.08);
    dataUrl = drawSourceToDataUrl(source, width, height, quality);
  }

  while (dataUrl.length > maxLength && Math.max(width, height) > 960) {
    scale *= 0.86;
    width = Math.max(1, Math.round(original.width * scale));
    height = Math.max(1, Math.round(original.height * scale));
    dataUrl = drawSourceToDataUrl(source, width, height, quality);
  }

  if (dataUrl.length > maxLength * 1.2) {
    throw new Error("照片仍然过大，请换一张更小的图片或稍微裁剪后再上传。");
  }
  return dataUrl;
}

async function prepareImageForDetection(image) {
  return (await prepareModelImageContext(image)).modelImage;
}

function mapPercentBoxBetweenImages(box, fromMeta, toMeta) {
  const from = normalizeImageMeta(fromMeta);
  const to = normalizeImageMeta(toMeta);
  if (!from || !to) return clampBox(box);
  // The model image is always a proportional full-image resize, so percent boxes stay aligned.
  return clampBox(box);
}

function mapModelBoxToDisplayBox(box, modelContext) {
  return mapPercentBoxBetweenImages(box, modelContext?.modelMeta, modelContext?.originalMeta);
}

function mapDisplayBoxToModelBox(box, modelContext) {
  return mapPercentBoxBetweenImages(box, modelContext?.originalMeta, modelContext?.modelMeta);
}

async function prepareModelImageContext(image) {
  const originalSource = await loadImage(image);
  const originalMeta = normalizeImageMeta(originalSource) || getDrawableSize(originalSource);
  const shouldResize = Math.max(originalMeta.width, originalMeta.height) > visionConfig.detectionMaxDimension;
  const modelImage = shouldResize
    ? await resizeImageSourceToDataUrl(originalSource, {
      maxDimension: visionConfig.detectionMaxDimension,
      maxLength: Math.min(visionConfig.maxUploadDataUrlLength, 520000),
      quality: 0.78,
    })
    : image;
  const modelSource = shouldResize ? await loadImage(modelImage) : originalSource;
  const modelMeta = normalizeImageMeta(modelSource) || getDrawableSize(modelSource);
  return {
    originalSource,
    originalMeta,
    modelImage,
    modelSource,
    modelMeta,
    resized: shouldResize,
    maxLongSide: visionConfig.detectionMaxDimension,
  };
}

function attachModelCoordinateContext(candidates, modelContext) {
  return candidates.map((candidate) => {
    const modelBox = candidate.modelBox ? clampBox(candidate.modelBox) : clampBox(candidate.box);
    return {
      ...candidate,
      modelBox,
      modelImageMeta: normalizeImageMeta(modelContext?.modelMeta),
      box: mapModelBoxToDisplayBox(modelBox, modelContext),
    };
  });
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("照片数据读取失败，请重试。"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}

async function decodeImageBlobToDataUrl(blob) {
  const dataUrl = await readBlobAsDataUrl(blob);
  const url = URL.createObjectURL(blob);
  try {
    await withTimeout(
      loadImage(dataUrl),
      visionConfig.uploadDecodeTimeoutMs,
      "照片解码超时，请换一张 JPEG/PNG 或先裁剪后再上传。",
    ).catch(async (error) => {
      if (!window.createImageBitmap) throw error;
      const bitmap = await withTimeout(
        createImageBitmap(blob, { imageOrientation: "from-image" }),
        visionConfig.uploadDecodeTimeoutMs,
        "照片解码超时，请换一张 JPEG/PNG 或先裁剪后再上传。",
      );
      bitmap.close?.();
    });
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function prepareUploadedImage(file) {
  const isHeif = await isHeicHeifFile(file);
  if (!isImageFile(file) && !isHeif) {
    throw new Error("请选择图片文件。");
  }

  if (isHeif) {
    try {
      const jpegBlob = await convertHeicFileToJpegBlob(file);
      return await decodeImageBlobToDataUrl(jpegBlob);
    } catch (conversionError) {
      throw new Error(conversionError.message || "HEIC/HEIF 自动转换失败，请换一张照片。");
    }
  }

  try {
    return await decodeImageBlobToDataUrl(file);
  } catch (error) {
    if (isLikelyImageDecodeError(error)) {
      throw new Error("这张图片浏览器无法解码；如果是 HEIC/HEIF，系统会自动转换，请确认文件没有损坏。");
    }
    throw error;
  }
}

async function getImageDimensions(image) {
  const source = await loadImage(image);
  return {
    width: source.naturalWidth || source.width || 0,
    height: source.naturalHeight || source.height || 0,
  };
}

function buildIntegralScores(cellScores) {
  const rows = cellScores.length;
  const cols = cellScores[0]?.length || 0;
  const integral = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      integral[row + 1][col + 1] = cellScores[row][col]
        + integral[row][col + 1]
        + integral[row + 1][col]
        - integral[row][col];
    }
  }
  return integral;
}

function sumGridWindow(integral, row, col, height, width) {
  return integral[row + height][col + width]
    - integral[row][col + width]
    - integral[row + height][col]
    + integral[row][col];
}

function proposeRegionsFromGrid(cellScores, gridCols, gridRows) {
  const integral = buildIntegralScores(cellScores);
  const windowSizes = [
    [3, 3],
    [4, 3],
    [3, 4],
    [4, 4],
    [5, 4],
    [4, 5],
    [6, 4],
    [4, 6],
  ];
  const proposals = [];
  for (const [windowCols, windowRows] of windowSizes) {
    if (windowCols > gridCols || windowRows > gridRows) continue;
    for (let row = 0; row <= gridRows - windowRows; row += 1) {
      for (let col = 0; col <= gridCols - windowCols; col += 1) {
        const area = windowCols * windowRows;
        const score = sumGridWindow(integral, row, col, windowRows, windowCols) / Math.sqrt(area);
        proposals.push({
          score,
          box: clampBox({
            x: (col / gridCols) * 100,
            y: (row / gridRows) * 100,
            w: (windowCols / gridCols) * 100,
            h: (windowRows / gridRows) * 100,
          }),
        });
      }
    }
  }

  const scored = proposals
    .sort((a, b) => b.score - a.score)
    .slice(0, 80)
    .map((proposal, index) => ({
      name: getUnknownObjectName(index),
      category: "daily",
      qty: 1,
      expireAt: "",
      nextAt: "",
      nextLabel: "",
      container: "",
      box: proposal.box,
      confidence: clampNumber(0.35 + Math.min(0.48, proposal.score / 110), 0.35, 0.83),
      source: "local-image",
      namingStatus: "loading",
    }));

  return dedupeCandidates(scored, 8, 0.34)
    .map((candidate, index) => ({
      ...candidate,
      name: getUnknownObjectName(index),
    }));
}

async function recognizeWithHeuristicRegions(image) {
  const source = await loadImage(image);
  const maxWidth = 180;
  const width = maxWidth;
  const height = Math.max(1, Math.round((source.naturalHeight / source.naturalWidth) * width));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(source, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const gridCols = 18;
  const gridRows = Math.max(10, Math.round((height / width) * gridCols));
  const cellScores = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));
  const grayscale = new Float32Array(width * height);
  const saturation = new Float32Array(width * height);

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    grayscale[index] = red * 0.299 + green * 0.587 + blue * 0.114;
    saturation[index] = max ? (max - min) / max : 0;
  }

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const edge = Math.abs(grayscale[index] - grayscale[index - 1])
        + Math.abs(grayscale[index] - grayscale[index + 1])
        + Math.abs(grayscale[index] - grayscale[index - width])
        + Math.abs(grayscale[index] - grayscale[index + width]);
      const score = edge / 255 + saturation[index] * 0.8;
      const col = Math.min(gridCols - 1, Math.floor((x / width) * gridCols));
      const row = Math.min(gridRows - 1, Math.floor((y / height) * gridRows));
      cellScores[row][col] += score;
    }
  }

  return {
    provider: "local-image",
    candidates: proposeRegionsFromGrid(cellScores, gridCols, gridRows),
  };
}

async function recognizeWithLocalImage({ image }) {
  let smallModelResult = null;
  try {
    smallModelResult = await recognizeWithSmallModel(image);
  } catch (error) {
    console.info("Small model unavailable, falling back to local image analysis.", error);
  }

  if (smallModelResult?.candidates.length) {
    return smallModelResult;
  }

  const regionResult = await recognizeWithHeuristicRegions(image);
  return {
    ...regionResult,
    candidates: regionResult.candidates.map((candidate) => ({ ...candidate, namingStatus: "loading" })),
  };
}

function refineNameByPosition(name, box) {
  return name;
}

async function resolveCandidateName(candidate, index, source, options = {}) {
  if (candidate.edited && !options.force) return { ...candidate, namingStatus: "done" };

  const embeddingIndex = await getCatalogEmbeddingIndex();
  if (embeddingIndex.entries?.length) {
    const embeddingBox = options.box || candidate.modelBox || candidate.box;
    const catalogMatch = source ? await matchCatalogFromEmbeddingIndex(source, embeddingBox).catch(() => null) : null;
    if (catalogMatch?.accepted) {
      return {
        ...candidate,
        name: refineNameByPosition(catalogMatch.name, candidate.box),
        category: catalogMatch.category,
        confidence: Math.max(candidate.confidence, catalogMatch.confidence),
        catalogId: catalogMatch.catalogId,
        categoryId: catalogMatch.categoryId || catalogMatch.catalogId || "",
        categoryPath: catalogMatch.categoryPath || [],
        categoryScore: catalogMatch.categoryScore,
        categoryMargin: catalogMatch.categoryMargin,
        catalogCandidates: catalogMatch.catalogCandidates || [],
        namingRejectionReason: "",
        categoryIndexVersion: catalogMatch.categoryIndexVersion || "",
        matchedSampleIds: catalogMatch.matchedSampleIds || [],
        timings: {
          ...(candidate.timings || {}),
          ...(catalogMatch.timings || {}),
        },
        source: `${candidate.source}+embedding`,
        namingStatus: "done",
      };
    }
    if (catalogMatch) {
      return {
        ...candidate,
        name: candidate.name && !candidate.name.startsWith("候选区域") && !isUnknownObjectName(candidate.name)
          ? candidate.name
          : getUnknownObjectName(index),
        confidence: Math.max(candidate.confidence || 0, catalogMatch.confidence || 0),
        categoryScore: catalogMatch.categoryScore,
        categoryMargin: catalogMatch.categoryMargin,
        catalogCandidates: catalogMatch.catalogCandidates || [],
        namingRejectionReason: catalogMatch.namingRejectionReason || "low-confidence",
        categoryIndexVersion: catalogMatch.categoryIndexVersion || "",
        matchedSampleIds: catalogMatch.matchedSampleIds || [],
        timings: {
          ...(candidate.timings || {}),
          ...(catalogMatch.timings || {}),
        },
        source: `${candidate.source}+embedding-candidates`,
        namingStatus: "done",
      };
    }
  }

  return {
    ...candidate,
    name: candidate.name && !candidate.name.startsWith("候选区域") && !isUnknownObjectName(candidate.name)
      ? candidate.name
      : getUnknownObjectName(index),
    namingStatus: "done",
  };
}

async function nameDetectedCandidates(input, candidates, onProgress) {
  const context = typeof input === "object" && input
    ? input
    : { displayImage: input, modelImage: input, modelContext: null };
  const displayImage = context.displayImage || context.image || context.modelImage;
  const modelImage = context.modelImage || displayImage;
  const modelContext = context.modelContext || null;
  const minimumAnimation = new Promise((resolve) => setTimeout(resolve, 360));
  const displaySourcePromise = displayImage ? loadImage(displayImage).catch(() => null) : Promise.resolve(null);
  const modelSourcePromise = modelImage && modelImage !== displayImage
    ? loadImage(modelImage).catch(() => null)
    : displaySourcePromise;
  const [displaySource, modelSource] = await Promise.all([displaySourcePromise, modelSourcePromise]);
  await minimumAnimation;
  const preparedCandidates = displaySource
    ? candidates.map((candidate) => (
      shouldRefreshCandidateCrop(candidate)
        ? { ...candidate, ...(createCandidateCropSnapshot(displaySource, candidate.box) || {}) }
        : candidate
    ))
    : candidates;
  const named = Array(preparedCandidates.length).fill(null);
  onProgress?.(preparedCandidates);
  const namingTasks = preparedCandidates.map(async (candidate, index) => {
    const modelBox = candidate.modelBox || (modelContext ? mapDisplayBoxToModelBox(candidate.box, modelContext) : candidate.box);
    const candidateNamingStart = performance.now();
    const resolved = await resolveCandidateName(candidate, index, modelSource || displaySource, { box: modelBox });
    const candidateNamingMs = Math.round((performance.now() - candidateNamingStart) * 1000) / 1000;
    named[index] = {
      ...resolved,
      timings: {
        ...(candidate.timings || {}),
        ...(resolved.timings || {}),
        namingMs: candidateNamingMs,
      },
    };
    onProgress?.(preparedCandidates.map((entry, entryIndex) => named[entryIndex] || entry));
  });
  await Promise.all(namingTasks);
  return named.filter(Boolean);
}

function providerLabel(provider) {
  if (!provider) return "未识别";
  const name = String(provider);
  if (name === "none") return "等待照片";
  if (name === "local-mock") return "本地演示";
  if (name.endsWith("-fallback")) return "本地降级候选";
  if (name.endsWith("+sam")) return `${providerLabel(name.replace("+sam", ""))} + SAM`;
  if (name.includes("+regions")) return `${providerLabel(name.split("+")[0])} + 区域补全`;
  if (name.startsWith("local-yolox")) return "本地 YOLOX 主体检测";
  if (name.startsWith("local-grounding-dino")) return "本地 Grounding DINO";
  if (name.startsWith("browser-grounding-dino")) return "在线 Grounding DINO";
  if (name.startsWith("local-owlvit")) return "本地 OWL-ViT";
  if (name.startsWith("browser-owlvit")) return "在线 OWL-ViT";
  if (name.startsWith("local-small-model")) return "本地小模型";
  if (name.startsWith("browser-small-model")) return "在线小模型";
  if (name === "local-image") return "本地候选区域";
  if (name === "ios-camera") return "iOS 相机";
  if (name === "ios-photo-library") return "iOS 相册";
  if (name === "cloud-vlm" || name.startsWith("openai:")) return "云端大模型";
  return name;
}

function getRequestedRecognitionProvider() {
  if (visionConfig.preferredDetector === "yolox") return "local-yolox-household-subject";
  if (visionConfig.preferredDetector === "owlvit") return "local-owlvit";
  if (visionConfig.preferredDetector === "grounding-dino") return "local-grounding-dino";
  return "local-small-model";
}

function daysUntil(dateText) {
  if (!dateText) return null;
  const target = new Date(`${dateText}T00:00:00`);
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((target - current) / 86400000);
}

function formatDate(dateText) {
  if (!dateText) return "未设置";
  const date = new Date(`${dateText}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatReminderTime(timeText) {
  return normalizeReminderTime(timeText);
}

function formatReminderRepeat(repeat) {
  return repeatLabels[repeat] || repeatLabels.none;
}

function formatReminderOffset(reminder) {
  const normalized = normalizeReminder(reminder);
  const labels = getReminderOffsetLabels(normalized.hasTime);
  if (normalized.offset === "custom") {
    return `提前${normalized.customOffset.amount}${customOffsetUnitLabels[normalized.customOffset.unit]}`;
  }
  return labels[normalized.offset] || labels.none;
}

function formatReminderSchedule(reminder) {
  const normalized = normalizeReminder(reminder);
  const timeText = normalized.hasTime ? ` ${formatReminderTime(normalized.time)}` : "";
  return `${formatDate(normalized.date)}${timeText} · ${formatReminderRepeat(normalized.repeat)}`;
}

function dueStatus(dateText) {
  const days = daysUntil(dateText);
  if (days === null) return { label: "未设置", cls: "" };
  if (days < 0) return { label: `已超 ${Math.abs(days)} 天`, cls: "danger" };
  if (days <= 7) return { label: `${days} 天后`, cls: "danger" };
  if (days <= 30) return { label: `${days} 天后`, cls: "warn" };
  return { label: `${days} 天后`, cls: "good" };
}

function dateToIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysIso(days) {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
  return dateToIso(date);
}

function nextMondayIso() {
  const day = today.getDay();
  const offset = day === 1 ? 7 : ((8 - day) % 7 || 7);
  return addDaysIso(offset);
}

function monthKeyFromIso(dateText) {
  const date = dateText ? new Date(`${dateText}T00:00:00`) : today;
  if (Number.isNaN(date.getTime())) return dateToIso(today).slice(0, 7);
  return dateToIso(new Date(date.getFullYear(), date.getMonth(), 1)).slice(0, 7);
}

function moveMonthKey(monthKey, delta) {
  const [year, month] = String(monthKey || dateToIso(today).slice(0, 7)).split("-").map(Number);
  const date = new Date(year || today.getFullYear(), (month || today.getMonth() + 1) - 1 + delta, 1);
  return dateToIso(date).slice(0, 7);
}

function getCalendarDays(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      iso: dateToIso(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
    };
  });
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。！？、,.!?]/g, "");
}

function matchItem(query) {
  const q = normalizeText(query);
  if (!q) return null;
  let best = null;
  let bestScore = 0;
  for (const item of state.items) {
    const names = [item.name, ...(item.aliases || []), categoryLabels[item.category] || ""];
    let score = 0;
    for (const name of names) {
      const n = normalizeText(name);
      if (q.includes(n) || n.includes(q)) score = Math.max(score, n.length + 10);
      for (let size = Math.min(n.length, q.length); size >= 2; size -= 1) {
        if (q.includes(n.slice(0, size)) || n.includes(q.slice(0, size))) {
          score = Math.max(score, size);
          break;
        }
      }
    }
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return bestScore >= 2 ? best : null;
}

function buildTrail(item) {
  const room = getRoom(item.roomId);
  return buildTrailParts(item, room).join(" > ");
}

function buildTrailParts(item, room = getRoom(item.roomId)) {
  const placeNames = getPlacePath(item.placeId).map((place) => place.name);
  return [
    room.name,
    ...placeNames,
    item.container || "",
    item.name,
  ].filter(Boolean);
}

function renderPathSteps(item) {
  return `
    <ol class="path-steps" aria-label="查找路径">
      ${buildTrailParts(item).map((part, index) => `
        <li>
          <span>${index + 1}</span>
          <strong>${escapeHtml(part)}</strong>
        </li>
      `).join("")}
    </ol>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function styleBox(box) {
  return `left:${box.x}%;top:${box.y}%;width:${box.w}%;height:${box.h}%`;
}

function estimatePinLabelSize(candidate) {
  const text = candidate?.namingStatus === "loading" ? "识别中" : String(candidate?.name || "物品");
  const charUnits = Array.from(text).reduce((sum, char) => sum + (/[\u4e00-\u9fff]/.test(char) ? 14 : 8), 0);
  return {
    width: clampNumber(charUnits + 22, 58, 148),
    height: 30,
  };
}

function rectanglesOverlap(left, right, padding = 6) {
  return left.x < right.x + right.w + padding
    && left.x + left.w + padding > right.x
    && left.y < right.y + right.h + padding
    && left.y + left.h + padding > right.y;
}

function labelOverflowScore(rect, stageWidth, stageHeight) {
  const left = Math.max(0, 8 - rect.x);
  const top = Math.max(0, 8 - rect.y);
  const right = Math.max(0, rect.x + rect.w - (stageWidth - 8));
  const bottom = Math.max(0, rect.y + rect.h - (stageHeight - 8));
  return left + top + right + bottom;
}

function getPinLineMetrics(offset, labelSize) {
  const nearestX = clampNumber(0, offset.x, offset.x + labelSize.width);
  const nearestY = clampNumber(0, offset.y, offset.y + labelSize.height);
  const dx = nearestX;
  const dy = nearestY;
  const distance = Math.hypot(dx, dy);
  return {
    angle: Math.atan2(dy, dx) * (180 / Math.PI),
    length: Math.max(36, distance - 9),
  };
}

function buildPinLayout(candidate, index, placed, stageWidth, stageHeight) {
  const box = candidate.box;
  const center = {
    x: (clampNumber(box.x + box.w / 2, 2, 98) / 100) * stageWidth,
    y: (clampNumber(box.y + box.h / 2, 2, 98) / 100) * stageHeight,
  };
  const labelSize = estimatePinLabelSize(candidate);
  const leftOffset = -labelSize.width - 46;
  const preferredRight = center.x < stageWidth * 0.58;
  const candidates = [
    { x: preferredRight ? 46 : leftOffset, y: -42 },
    { x: preferredRight ? 46 : leftOffset, y: 16 },
    { x: preferredRight ? leftOffset : 46, y: -42 },
    { x: preferredRight ? leftOffset : 46, y: 16 },
    { x: -labelSize.width / 2, y: -64 },
    { x: -labelSize.width / 2, y: 38 },
    { x: preferredRight ? 70 : leftOffset - 24, y: index % 2 ? -66 : 40 },
    { x: preferredRight ? leftOffset - 24 : 70, y: index % 2 ? 40 : -66 },
  ];

  let best = null;
  for (const offset of candidates) {
    const adjusted = {
      x: clampNumber(center.x + offset.x, 8, stageWidth - labelSize.width - 8) - center.x,
      y: clampNumber(center.y + offset.y, 8, stageHeight - labelSize.height - 8) - center.y,
    };
    const rect = {
      x: center.x + adjusted.x,
      y: center.y + adjusted.y,
      w: labelSize.width,
      h: labelSize.height,
    };
    const overlapCount = placed.filter((entry) => rectanglesOverlap(rect, entry)).length;
    const overflow = labelOverflowScore(rect, stageWidth, stageHeight);
    const distance = Math.hypot(adjusted.x, adjusted.y);
    const score = overlapCount * 1000 + overflow * 15 + distance * 0.08;
    if (!best || score < best.score) best = { offset: adjusted, rect, score };
    if (score < 1) break;
  }

  const metrics = getPinLineMetrics(best.offset, labelSize);
  placed.push(best.rect);
  return {
    x: (center.x / stageWidth) * 100,
    y: (center.y / stageHeight) * 100,
    labelX: Math.round(best.offset.x),
    labelY: Math.round(best.offset.y),
    lineAngle: Number(metrics.angle.toFixed(2)),
    lineLength: Math.round(metrics.length),
  };
}

function layoutCandidatePins(candidates, stageWidth = 420, stageHeight = 410) {
  const placed = [];
  const layouts = new Map();
  const ordered = [...candidates].sort((left, right) => {
    const leftCenter = left.box.y + left.box.h / 2;
    const rightCenter = right.box.y + right.box.h / 2;
    if (Math.abs(leftCenter - rightCenter) > 4) return leftCenter - rightCenter;
    return (left.box.x + left.box.w / 2) - (right.box.x + right.box.w / 2);
  });
  ordered.forEach((candidate, index) => {
    layouts.set(candidate.id, buildPinLayout(candidate, index, placed, stageWidth, stageHeight));
  });
  return layouts;
}

function styleCandidatePin(box) {
  const centerX = clampNumber(box.x + box.w / 2, 2, 98);
  const centerY = clampNumber(box.y + box.h / 2, 2, 98);
  return `left:${centerX}%;top:${centerY}%`;
}

function styleActiveCandidateLabel(box) {
  const centerX = clampNumber(box.x + box.w / 2, 8, 92);
  const top = clampNumber(box.y - 2, 8, 92);
  return `left:${centerX}%;top:${top}%`;
}

function render() {
  app.innerHTML = `
    <div class="app">
      ${renderTopbar()}
      ${renderGlobalSearch()}
      <main class="app-main">
        ${state.activeTab === "capture" ? renderCaptureSpaceTabs() : ""}
        ${renderGlobalSearchAnswer()}
        ${renderMain()}
      </main>
      ${renderBottomTabs()}
      <div class="toast" id="toast"></div>
      ${renderCandidateDateModal()}
    </div>
  `;
  hydrateCamera();
  hydrateCandidatePins();
  hydrateCandidateCrops();
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">${icons.home}</div>
        <div>
          <h1>家忆 Home Memory</h1>
          <span>${state.items.length} 件物品 · ${getAllPlaces().length} 个储物点</span>
        </div>
      </div>
      <div class="top-actions">
        <button class="secondary-btn" data-tab="capture">${icons.plus}<span>新增</span></button>
        <button class="icon-btn" data-reset title="清空本地数据" aria-label="清空本地数据">${icons.rotate}</button>
      </div>
    </header>
  `;
}

function renderGlobalSearch() {
  return `
    <section class="global-search-row" aria-label="查找">
      <div class="search-box global-search-box">
        ${icons.search}
        <input class="search-field" data-query-input value="${escapeHtml(state.query)}" placeholder="查找物品、空间或提醒" />
        <button class="primary-btn" data-search><span>查找</span></button>
      </div>
    </section>
  `;
}

function renderGlobalSearchAnswer() {
  if (!state.lastAnswer || !String(state.query || "").trim()) return "";
  return `<div class="global-answer">${renderAnswer(state.lastAnswer)}</div>`;
}

function renderBottomTabs() {
  const tabs = [
    { id: "map", label: "照片地图", icon: icons.map },
    { id: "capture", label: "AI录入", icon: icons.scan },
    { id: "reminders", label: "提醒", icon: icons.bell },
  ];
  return `
    <nav class="bottom-tabs" aria-label="主导航">
      ${tabs.map((tab) => `
        <button class="bottom-tab ${state.activeTab === tab.id ? "active" : ""}" data-tab="${tab.id}">
          ${tab.icon}<span>${tab.label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderSidebar() {
  const activeRoom = getRoom();
  const placeRows = getRoomPlacesInTree(activeRoom.id);
  return `
    <aside class="sidebar panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">家庭空间</h2>
          <p class="panel-subtitle">按房间和储物点查看</p>
        </div>
      </div>
      <div class="room-list">
        ${state.rooms.map((room) => {
          const count = getRoomItems(room.id).length;
          return `
            <button class="room-btn ${state.activeRoomId === room.id ? "active" : ""}" data-room="${room.id}">
              <span class="room-thumb ${room.type}"></span>
              <span class="room-meta">
                <strong>${escapeHtml(room.name)}</strong>
                <span>${room.places.length} 个储物点</span>
              </span>
              <span class="count-pill">${count} 件</span>
            </button>
          `;
        }).join("")}
      </div>
      <div class="storage-list">
        ${placeRows.length ? placeRows.map(({ place, depth }) => `
          <button class="place-chip depth-${Math.min(depth, 3)} ${state.activePlaceId === place.id ? "active" : ""}" data-place="${place.id}" style="--place-depth:${depth}">
            <span>${escapeHtml(place.shortName)}</span>
            <span class="small-muted">${getItemsInPlaceTree(place.id).length} 件</span>
          </button>
        `).join("") : `<p class="empty-state compact">还没有储物点。可以上传照片或手动添加。</p>`}
        <div class="quick-add-row">
          <input class="field compact" data-new-place-name placeholder="新增储物点" />
          <button class="secondary-btn" data-add-place>${icons.plus}<span>添加</span></button>
        </div>
      </div>
    </aside>
  `;
}

function renderMain() {
  if (state.activeTab === "capture") return renderCaptureView();
  if (state.activeTab === "reminders") return renderReminderView();
  return renderMapView();
}

function renderSpaceTabs({ capture = false } = {}) {
  const activeId = capture ? (state.capture.roomId || state.activeRoomId) : state.activeRoomId;
  const buttonAttribute = capture ? "data-capture-space" : "data-room";
  return `
    <section class="space-tabs-shell" data-space-tabs-shell>
      <div class="space-tabs" aria-label="家庭空间">
        ${state.rooms.map((room) => `
          <span class="space-tab-wrap ${activeId === room.id ? "active" : ""}">
            <button class="space-tab" ${buttonAttribute}="${room.id}">
              <span>${escapeHtml(room.name)}</span>
              <b>${getRoomItems(room.id).length}</b>
            </button>
            <button class="space-edit-btn" type="button" data-edit-room="${room.id}" aria-label="编辑 ${escapeHtml(room.name)} 名称">${icons.edit}</button>
          </span>
        `).join("")}
      </div>
      <button class="space-add-tab" type="button" data-add-space-tab aria-label="新增空间">${icons.plus}</button>
    </section>
  `;
}

function renderCaptureSpaceTabs() {
  return renderSpaceTabs({ capture: true });
}

function renderPhotoMapControls(room) {
  const placeRows = getRoomPlacesInTree(room.id);
  return `
    <div class="photo-map-controls">
      ${renderSpaceTabs()}
      <div class="storage-list map-storage-list">
        ${placeRows.length ? placeRows.map(({ place, depth }) => `
          <button class="place-chip depth-${Math.min(depth, 3)} ${state.activePlaceId === place.id ? "active" : ""}" data-place="${place.id}" style="--place-depth:${depth}">
            <span>${escapeHtml(place.shortName)}</span>
            <span class="small-muted">${getItemsInPlaceTree(place.id).length} 件</span>
          </button>
        `).join("") : `<p class="empty-state compact">还没有储物点。可以上传照片或手动添加。</p>`}
        <div class="quick-add-row">
          <input class="field compact" data-new-place-name placeholder="新增储物点" />
          <button class="secondary-btn" data-add-place>${icons.plus}<span>添加</span></button>
        </div>
      </div>
    </div>
  `;
}

function renderMapView() {
  const room = getRoom();
  const place = getPlace();
  if (!place) {
    return `
      <section class="panel">
        ${renderPhotoMapControls(room)}
        <div class="view-title-row">
          <div>
            <h2>${escapeHtml(room.name)}照片地图</h2>
            <p>还没有储物点或已确认物品</p>
          </div>
          <div class="toolbar">
            <button class="secondary-btn" data-tab="capture">${icons.scan}<span>上传照片</span></button>
          </div>
        </div>
        <div class="scene-wrap">
          ${renderRoomStage(room, null, false)}
          <section class="panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">从照片开始</h3>
                <p class="panel-subtitle">上传当前空间照片，或手动添加储物点后开始整理。</p>
              </div>
            </div>
            <div class="item-list">
              <p class="empty-state">暂无物品</p>
            </div>
          </section>
        </div>
      </section>
    `;
  }
  return `
    <section class="panel">
      ${renderPhotoMapControls(room)}
      <div class="view-title-row">
        <div>
          <h2>${escapeHtml(room.name)}照片地图</h2>
          <p>${escapeHtml(buildPlacePathLabel(place.id) || place.name)} · ${getItemsInPlaceTree(place.id).length} 件已确认物品</p>
        </div>
        <div class="toolbar">
          <button class="secondary-btn" data-tab="capture">${icons.scan}<span>扫描此处</span></button>
        </div>
      </div>
      <div class="scene-wrap">
        ${renderRoomStage(room, place.id, true)}
        <div class="stage-detail">
          ${renderPlaceSummary(place)}
          ${renderStorageStage(place, null, true)}
        </div>
      </div>
    </section>
  `;
}

function renderPlaceSummary(place) {
  if (!place) {
    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">暂无储物点</h3>
            <p class="panel-subtitle">上传照片或手动添加后，这里会显示已确认物品。</p>
          </div>
        </div>
        <div class="item-list"><p class="empty-state">暂无物品</p></div>
      </section>
    `;
  }
  const items = getItemsByPlace(place.id);
  const childPlaces = getChildPlaces(place.id, place.roomId);
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${escapeHtml(place.name)}</h3>
          <p class="panel-subtitle">${escapeHtml(buildPlacePathLabel(place.id) || place.note)}</p>
        </div>
      </div>
      ${childPlaces.length ? `
        <div class="subplace-list">
          ${childPlaces.map((child) => `
            <button class="subplace-chip" data-place="${child.id}">
              <span>${escapeHtml(child.shortName)}</span>
              <span class="small-muted">${getItemsInPlaceTree(child.id).length} 件</span>
            </button>
          `).join("")}
        </div>
      ` : ""}
      <div class="item-list">
        ${items.length ? items.map(renderCompactItem).join("") : `<p class="empty-state">暂无物品</p>`}
        <div class="quick-add-row">
          <input class="field compact" data-new-child-place-name="${place.id}" placeholder="新增下级储物点" />
          <button class="secondary-btn" data-add-child-place="${place.id}">${icons.plus}<span>添加</span></button>
        </div>
      </div>
    </section>
  `;
}

function renderCompactItem(item) {
  const place = getPlace(item.placeId);
  const primaryReminder = getPrimaryReminder(item);
  const due = item.expireAt ? dueStatus(item.expireAt) : primaryReminder ? dueStatus(primaryReminder.date) : null;
  return `
    <article class="item-row">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="meta-line">
          <span class="badge ${item.category}">${categoryLabels[item.category] || item.category}</span>
          <span>${escapeHtml(place?.shortName || "未命名照片点")}</span>
          <span>${escapeHtml(item.container)}</span>
        </div>
      </div>
      <div class="item-actions">
        ${due ? `<span class="due-pill ${due.cls}">${due.label}</span>` : `<span class="status-pill good">已定位</span>`}
        <button class="icon-btn" data-scan-inside="${item.id}" title="拍摄内部" aria-label="拍摄 ${escapeHtml(item.name)} 内部">${icons.camera}</button>
      </div>
    </article>
  `;
}

function renderRoomStage(room, highlightPlaceId, clickable = false) {
  const rootHighlight = getRootPlaceFor(highlightPlaceId)?.id || highlightPlaceId;
  const rootPlaces = getRootPlaces(room.id);
  return `
    <div class="photo-stage ${room.type}">
      <div class="floor-line"></div>
      ${(furnitureByRoom[room.type] || []).map((piece) => `
        <span class="furniture ${piece.cls}" style="${styleBox(piece)}"></span>
      `).join("")}
      ${rootPlaces.map((place) => `
        <button
          class="hotspot ${rootHighlight === place.id ? "active" : ""}"
          style="${styleBox(place.box)}"
          ${clickable ? `data-place="${place.id}"` : ""}
          aria-label="${escapeHtml(place.name)}"
        >
          <span>${escapeHtml(place.shortName)}</span>
        </button>
      `).join("")}
      <div class="stage-caption">
        <div>
          <strong>${escapeHtml(room.name)}</strong>
          <span>${room.places.length} 个储物点 · ${getRoomItems(room.id).length} 件物品</span>
        </div>
        <span class="status-pill good">照片地图</span>
      </div>
    </div>
  `;
}

function renderStorageStage(place, highlightItemId = null, compact = false) {
  if (!place) {
    return `
      <div class="storage-stage photo">
        <div class="capture-placeholder">
          <div class="placeholder-panel">
            <strong>暂无储物点</strong>
            <span>上传照片或手动添加储物点</span>
          </div>
        </div>
      </div>
    `;
  }
  const items = getItemsByPlace(place.id);
  const childPlaces = getChildPlaces(place.id, place.roomId);
  const hasPhoto = Boolean(place.image);
  return `
    <div class="storage-stage ${place.kind} ${hasPhoto ? "has-photo" : ""}" ${hasPhoto ? imageAspectStyle(place.imageMeta) : ""}>
      ${hasPhoto ? `<img class="storage-photo" alt="${escapeHtml(place.name)}照片" src="${place.image}" />` : `
        <span class="storage-rail"></span>
        <span class="storage-rail"></span>
        <span class="storage-rail"></span>
      `}
      ${childPlaces.map((child) => `
        <button class="item-box place-box" style="${styleBox(child.box)}" data-place="${child.id}" aria-label="${escapeHtml(child.name)}">
          <span>${escapeHtml(child.shortName)}</span>
        </button>
      `).join("")}
      ${items.map((item) => `
        <span class="item-box ${highlightItemId === item.id ? "active" : ""}" style="${styleBox(item.box)}">
          <span>${escapeHtml(item.name)}</span>
        </span>
      `).join("")}
      <div class="stage-caption">
        <div>
          <strong>${escapeHtml(place.shortName)}</strong>
          <span>${escapeHtml(childPlaces.length ? `${childPlaces.length} 个下级储物点` : place.note)}</span>
        </div>
        ${compact ? `<span class="count-pill">${getItemsInPlaceTree(place.id).length} 件</span>` : ""}
      </div>
    </div>
  `;
}

function renderRouteStorageStage(place, highlightItemId = null) {
  if (!place?.image) {
    return `
      <div class="storage-stage route-missing-photo">
        <div class="capture-placeholder">
          <div class="placeholder-panel">
            <strong>${escapeHtml(place?.shortName || "未拍照")}</strong>
            <span>这一层还没有真实照片</span>
          </div>
        </div>
      </div>
    `;
  }
  return renderStorageStage(place, highlightItemId, false);
}

function renderFindView() {
  const answer = state.lastAnswer;
  return `
    <section class="panel">
      <div class="view-title-row">
        <div>
          <h2>问家里的东西</h2>
          <p>用照片地图返回位置、容器和局部高亮</p>
        </div>
        <span class="status-pill good">${state.items.length} 件可查询</span>
      </div>
      <div class="search-area">
        <div class="search-box">
          <input class="search-field" data-query-input value="${escapeHtml(state.query)}" placeholder="输入：遥控器在哪、哪些食品快过期、还有没有电池" />
          <button class="primary-btn" data-search>${icons.search}<span>查找</span></button>
        </div>
        <div class="example-row">
          ${["遥控器在哪", "哪些东西快过期", "电视柜里有什么", "还有没有电池", "新增客厅照片"].map((text) => `
            <button class="chip" data-example="${escapeHtml(text)}">${escapeHtml(text)}</button>
          `).join("")}
        </div>
      </div>
      ${answer ? renderAnswer(answer) : ""}
    </section>
  `;
}

function renderAnswer(answer) {
  if (answer.type === "expiring") {
    return `
      <section class="answer-panel">
        <div class="answer-head">
          <div>
            <h3>近期需要处理</h3>
            <p>${answer.items.length} 件物品在 30 天内到期或需要维护</p>
          </div>
        </div>
        <div class="result-list">
          ${answer.items.map((item) => {
            const due = dueStatus(item.reminderDate || item.expireAt || item.nextAt);
            return `
              <article class="result-row item-row">
                <div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <div class="meta-line">
                    <span class="badge ${item.category}">${categoryLabels[item.category]}</span>
                    <span>${escapeHtml(item.reminderTitle || "提醒")}：${escapeHtml(item.reminderSchedule || formatDate(item.reminderDate || item.expireAt || item.nextAt))}</span>
                    <span>${escapeHtml(buildTrail(item))}</span>
                  </div>
                </div>
                <span class="due-pill ${due.cls}">${due.label}</span>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  if (answer.type === "not-found") {
    return `
      <section class="answer-panel">
        <div class="answer-head">
          <div>
            <h3>没有找到匹配物品</h3>
            <p>可以上传当前空间照片，确认标注后系统会把新位置记下来。</p>
          </div>
          <button class="primary-btn" data-tab="capture">${icons.scan}<span>去扫描</span></button>
        </div>
      </section>
    `;
  }

  const item = answer.item;
  const room = getRoom(item.roomId);
  const place = getPlace(item.placeId);
  if (!place) return renderAnswer({ type: "not-found", query: item.name });
  const placePath = getPlacePath(place.id);
  const [rootPlace, ...insidePlaces] = placePath;
  const primaryReminder = getPrimaryReminder(item);
  const timeText = item.expireAt
    ? `有效期至 ${formatDate(item.expireAt)}`
    : primaryReminder
      ? `${primaryReminder.title}：${formatReminderSchedule(primaryReminder)} · ${formatReminderOffset(primaryReminder)}`
      : `上次确认 ${formatDate(item.updatedAt)}`;
  return `
    <section class="answer-panel">
      <div class="answer-head">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(buildTrail(item))}</p>
        </div>
        <span class="status-pill good">${Math.round(item.confidence * 100)}% 可信</span>
      </div>
      ${renderPathSteps(item)}
      <div class="route-grid">
        ${rootPlace ? `
          <div class="route-panel">
            <div class="route-label"><span>先到这个位置</span><strong>${escapeHtml(rootPlace.shortName)}</strong></div>
            ${renderRouteStorageStage(rootPlace, rootPlace.id === place.id ? item.id : null)}
          </div>
        ` : ""}
        ${insidePlaces.map((pathPlace, index) => `
          <div class="route-panel">
            <div class="route-label">
              <span>${index === insidePlaces.length - 1 ? "最后看这里" : "再进入这里"}</span>
              <strong>${escapeHtml(pathPlace.shortName)}</strong>
            </div>
            ${renderRouteStorageStage(pathPlace, index === insidePlaces.length - 1 ? item.id : null)}
          </div>
        `).join("")}
      </div>
      <div class="toolbar">
        <span class="status-pill">${escapeHtml(timeText)}</span>
        <button class="secondary-btn" data-found="${item.id}">${icons.check}<span>我找到了</span></button>
        <button class="secondary-btn" data-missing="${item.id}">${icons.scan}<span>不在这里</span></button>
      </div>
    </section>
  `;
}

function getRecognitionStatusMeta() {
  const status = state.capture.recognitionStatus || "idle";
  const candidates = state.capture.candidates || [];
  const activeCandidates = getActiveCandidates(candidates);
  const hasImage = Boolean(state.capture.image);
  if (status === "detecting") return { label: "识别主体", cls: "warn", body: "正在检测照片里的主体区域" };
  if (status === "naming") return { label: "命名中", cls: "warn", body: "主体框已生成，正在匹配物品名称" };
  if (status === "loading") return { label: hasImage ? "分析中" : "处理照片", cls: "warn", body: hasImage ? "正在本地分析上传照片" : "正在解码并压缩上传照片" };
  if (status === "done") return { label: "已生成候选", cls: "good", body: `${activeCandidates.length} 个候选，${getSelectedCandidateCount(candidates)} 个待入库` };
  if (status === "empty") return { label: "未发现候选", cls: "warn", body: "没有识别到可入库物品" };
  if (status === "error") return { label: "分析失败", cls: "danger", body: state.capture.recognitionError || "请稍后重试" };
  return {
    label: hasImage ? "等待分析" : "等待照片",
    cls: "",
    body: hasImage ? "上传照片已载入，等待本地图片分析" : "选择一张空间照片",
  };
}

function renderRecognitionDiagnostics() {
  const diagnostics = state.capture.recognitionDiagnostics;
  if (!diagnostics) return "";
  const total = Math.round(diagnostics.totalMs || 0);
  const detection = Math.round(diagnostics.detectionMs || 0);
  const naming = Math.round(diagnostics.namingMs || 0);
  const dimensions = diagnostics.imageDimensions
    ? `${diagnostics.imageDimensions.width}x${diagnostics.imageDimensions.height}`
    : "未知尺寸";
  const threadText = diagnostics.wasmThreads ? ` · WASM ${diagnostics.wasmThreads}线程` : "";
  const detectorLoadText = Number.isFinite(diagnostics.detectorLoadMs) ? ` · 加载 ${Math.round(diagnostics.detectorLoadMs)}ms` : "";
  const roomPromptText = diagnostics.promptRoomType ? ` · ${diagnostics.promptRoomType}包` : "";
  const shardText = diagnostics.promptShardNames ? ` · ${diagnostics.promptShardNames}` : "";
  const promptText = diagnostics.promptCount
    ? `${roomPromptText} · prompts ${diagnostics.promptCount}/${diagnostics.promptBatches || 1}批${shardText}`
    : "";
  const embeddingText = Number.isFinite(diagnostics.embeddingMs) ? ` · embedding ${Math.round(diagnostics.embeddingMs)}ms` : "";
  return `<p class="panel-subtitle diagnostic-line">${escapeHtml(`${providerLabel(diagnostics.provider)} · ${dimensions}${threadText}${detectorLoadText}${promptText} · 主体 ${detection}ms · 命名 ${naming}ms${embeddingText} · 总计 ${total}ms · ${diagnostics.resultCount} 个`)}</p>`;
}

function renderCaptureControls() {
  return `
    <div class="capture-controls">
      ${platform.photos.canUseNativePhotoLibrary()
        ? `<button class="secondary-btn" data-native-photo-library>${icons.box}<span>上传照片</span></button>`
        : `<button class="secondary-btn file-input">${icons.box}<span>上传照片</span><input type="file" accept="image/*" data-file-input /></button>`}
      <button class="secondary-btn" data-camera-start>${icons.camera}<span>摄像头</span></button>
    </div>
  `;
}

function renderCaptureView() {
  const room = getCaptureRoom();
  const place = getCapturePlace() || makeVirtualPlace(room);
  const candidates = state.capture.candidates || [];
  const activeCandidates = getActiveCandidates(candidates);
  const deletedCandidates = getDeletedCandidates(candidates);
  const selectedCount = getSelectedCandidateCount(candidates);
  return `
    <section class="panel">
      <div class="capture-grid">
        <div class="capture-workspace">
          ${renderCaptureControls()}
          ${renderCaptureStage()}
        </div>
        <div class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">候选物品</h3>
              <p class="panel-subtitle">${escapeHtml(place.shortName)} · ${escapeHtml(providerLabel(state.capture.provider))}</p>
              ${renderRecognitionDiagnostics()}
            </div>
            <span class="count-pill">${selectedCount}/${activeCandidates.length}${deletedCandidates.length ? ` · 回收站 ${deletedCandidates.length}` : ""}</span>
          </div>
          ${renderCandidateReviewPanel(candidates)}
        </div>
      </div>
    </section>
  `;
}

function renderCaptureStage() {
  const candidates = getActiveCandidates(state.capture.candidates || []);
  const activeId = getFallbackActiveCandidateId(state.capture.activeCandidateId);
  const activeCandidate = candidates.find((candidate) => candidate.id === activeId);
  const hasImage = Boolean(state.capture.image) && !state.cameraOn;
  return `
    <div class="capture-stage ${hasImage ? "has-image" : ""}" data-capture-stage ${hasImage ? imageAspectStyle(state.capture.imageMeta) : ""}>
      ${state.cameraOn ? `<video id="cameraVideo" autoplay playsinline muted></video>` : state.capture.image ? `<img alt="上传的储物点照片" src="${state.capture.image}" />` : renderCapturePlaceholder()}
      ${state.cameraOn ? `<button class="primary-btn" data-camera-shot style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:3">${icons.camera}<span>拍照</span></button>` : ""}
      ${activeCandidate ? `
        <span
          class="candidate-active-frame ${activeCandidate.selected ? "selected" : "unselected"}"
          style="${styleBox(activeCandidate.box)}"
          data-candidate-drag="${activeCandidate.id}"
          data-drag-mode="move"
          role="button"
          aria-label="拖拽调整 ${escapeHtml(activeCandidate.name)} 主体框"
        >
          <span class="candidate-active-highlight"></span>
          ${[
            ["tl", "nw"],
            ["tr", "ne"],
            ["bl", "sw"],
            ["br", "se"],
          ].map(([corner, handle]) => `
            <span class="frame-corner ${corner}" data-candidate-resize="${activeCandidate.id}" data-resize-handle="${handle}" aria-hidden="true"></span>
          `).join("")}
        </span>
        <span class="candidate-active-label" style="${styleActiveCandidateLabel(activeCandidate.box)}">
          ${escapeHtml(activeCandidate.namingStatus === "loading" ? "识别中" : activeCandidate.name)} <b>›</b>
        </span>
      ` : ""}
      ${candidates.map((candidate) => {
        const isActive = activeId === candidate.id;
        const isNaming = candidate.namingStatus === "loading";
        return `
        <button
          class="candidate-pin ${candidate.selected ? "selected" : "unselected"} ${isActive ? "active" : ""} ${isNaming ? "naming" : ""}"
          style="${styleCandidatePin(candidate.box)}"
          data-candidate-select="${candidate.id}"
          aria-label="查看 ${escapeHtml(candidate.name)} 的主体框"
        >
          <span class="pin-dot"></span>
        </button>
      `;
      }).join("")}
    </div>
  `;
}

function renderCapturePlaceholder() {
  return `
    <div class="capture-placeholder">
      <div class="placeholder-panel">
        <strong>等待照片</strong>
        <span>上传或拍摄储物点</span>
      </div>
    </div>
  `;
}

function hasCandidateOptionalDetails(candidate) {
  return Boolean(candidate.expireAt || normalizeReminderList(candidate).length || candidate.container);
}

function renderCandidateMetaChips(candidate) {
  const chips = [];
  if (candidate.expireAt) chips.push(`保质期 ${formatDate(candidate.expireAt)}`);
  for (const reminder of normalizeReminderList(candidate).slice(0, 2)) {
    chips.push(`${reminder.title} ${formatReminderSchedule(reminder)}`);
  }
  if (candidate.container) chips.push(`位置 ${candidate.container}`);
  if (candidate.namingRejectionReason && candidate.catalogCandidates?.length) {
    const names = candidate.catalogCandidates.slice(0, 3).map((entry) => entry.displayName).filter(Boolean).join(" / ");
    chips.push(`低置信候选 ${names}`);
  } else if (candidate.catalogCandidates?.length) {
    const best = candidate.catalogCandidates[0];
    if (best?.displayName && Number.isFinite(Number(best.score))) {
      chips.push(`命名匹配 ${best.displayName} ${Math.round(Number(best.score) * 100)}%`);
    }
  }
  if (!chips.length) return "";
  return `<div class="candidate-meta-chips">${chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join("")}</div>`;
}

function renderCandidateDatePicker(candidate, field, label) {
  const value = candidate[field] || "";
  return `
    <div class="date-picker-block">
      <span>${escapeHtml(label)}</span>
      <button class="secondary-btn compact-btn date-choice" type="button" data-open-date-picker="${candidate.id}" data-field="${field}">
        <strong>${value ? escapeHtml(formatDate(value)) : "选择日期"}</strong>
      </button>
      ${value ? `<button class="ghost-btn compact-btn" type="button" data-clear-candidate-date="${candidate.id}" data-field="${field}">清除</button>` : ""}
    </div>
  `;
}

function renderCandidateReviewPanel(candidates) {
  const activeCandidates = getActiveCandidates(candidates);
  const deletedCandidates = getDeletedCandidates(candidates);
  const activeId = getFallbackActiveCandidateId(state.capture.activeCandidateId);
  const activeCandidate = activeCandidates.find((candidate) => candidate.id === activeId);
  const activeIndex = activeCandidate ? getCandidateIndex(activeCandidates, activeCandidate.id) : -1;
  return `
    <div class="candidate-list candidate-card-stack">
      ${state.capture.recognitionError ? `<p class="capture-message danger">${escapeHtml(state.capture.recognitionError)}</p>` : ""}
      ${activeCandidate
        ? renderCandidate(activeCandidate, activeIndex, activeCandidates.length)
        : `<p class="empty-state">${state.capture.recognitionStatus === "empty" ? "没有候选区域" : state.capture.image ? "正在分析照片" : "等待照片"}</p>`}
      ${renderCandidateTrash(deletedCandidates)}
    </div>
  `;
}

function renderCandidateTrash(deletedCandidates) {
  if (!deletedCandidates.length) return "";
  return `
    <section class="candidate-trash">
      <div class="candidate-trash-head">
        <strong>垃圾箱</strong>
        <span>${deletedCandidates.length} 个可恢复</span>
      </div>
      <div class="candidate-trash-list">
        ${deletedCandidates.map((candidate) => `
          <article class="trash-candidate">
            ${renderCandidateCrop(candidate)}
            <div>
              <strong>${escapeHtml(candidate.name)}</strong>
              <span>置信度 ${Math.round(candidate.confidence * 100)}%</span>
            </div>
            <button class="secondary-btn compact-btn" type="button" data-restore-candidate="${candidate.id}">恢复</button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCandidateReminders(candidate) {
  const reminders = normalizeReminderList(candidate);
  return `
    <section class="reminder-task-panel">
      <div class="reminder-task-head">
        <div>
          <strong>提醒</strong>
          <span>${reminders.length ? `${reminders.length} 个提醒事项` : "未设置"}</span>
        </div>
        <button class="secondary-btn compact-btn" type="button" data-add-candidate-reminder="${candidate.id}">${icons.plus}<span>添加提醒</span></button>
      </div>
      ${reminders.length ? `
        <div class="reminder-task-list">
          ${reminders.map((reminder) => `
            <article class="reminder-task-row">
              <div>
                <strong>${escapeHtml(reminder.title)}</strong>
                <span>${escapeHtml(formatReminderSchedule(reminder))} · ${escapeHtml(formatReminderOffset(reminder))}</span>
              </div>
              <div class="candidate-actions">
                <button class="ghost-btn compact-btn" type="button" data-edit-candidate-reminder="${candidate.id}" data-reminder-id="${reminder.id}">编辑</button>
                <button class="icon-btn" type="button" data-delete-candidate-reminder="${candidate.id}" data-reminder-id="${reminder.id}" title="删除提醒" aria-label="删除提醒">${icons.trash}</button>
              </div>
            </article>
          `).join("")}
        </div>
      ` : `<p class="empty-state compact">提醒不是必填；需要时可以添加多个提醒事项。</p>`}
    </section>
  `;
}

function renderCandidateDateModal() {
  if (!candidateDatePickerState) return "";
  const candidate = (state.capture.candidates || []).find((entry) => entry.id === candidateDatePickerState.candidateId);
  if (!candidate) return "";
  const isReminder = candidateDatePickerState.mode === "reminder";
  const reminder = isReminder ? normalizeReminder(candidateDatePickerState.reminder) : null;
  const title = isReminder ? "提醒" : "保质期";
  const selected = isReminder
    ? reminder.date
    : (candidateDatePickerState.date || dateToIso(today));
  const monthKey = candidateDatePickerState.month || monthKeyFromIso(selected);
  const [year, month] = monthKey.split("-").map(Number);
  const monthTitle = `${year}年${month}月`;
  const quickOptions = isReminder
    ? [
      ["今天", addDaysIso(0)],
      ["明天", addDaysIso(1)],
      ["下周一", nextMondayIso()],
      ["明天上午", addDaysIso(1), "09:00", true],
    ]
    : [
      ["今天", addDaysIso(0)],
      ["1个月", addDaysIso(30)],
      ["3个月", addDaysIso(90)],
      ["半年", addDaysIso(180)],
    ];
  const [hour, minute] = isReminder ? formatReminderTime(reminder.time).split(":") : ["09", "00"];
  const offsetLabels = isReminder ? getReminderOffsetLabels(reminder.hasTime) : {};
  return `
    <div class="date-modal-backdrop" data-date-modal-dismiss>
      <section class="date-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}" data-date-modal>
        <div class="date-modal-head">
          <button class="round-btn" type="button" data-close-date-modal aria-label="关闭">×</button>
          <div class="date-mode-tabs">
            <span class="active">${escapeHtml(title)}</span>
          </div>
          <button class="round-btn confirm" type="button" data-confirm-date-modal aria-label="确认">✓</button>
        </div>
        ${isReminder ? `
          <label class="modal-field">
            <span>提醒事项</span>
            <input class="field" value="${escapeHtml(reminder.title)}" data-date-reminder-title placeholder="例如：换滤芯、补货、复查" />
          </label>
        ` : ""}
        <div class="date-quick-grid">
          ${quickOptions.map(([label, date, time, hasTime]) => `
            <button type="button" data-date-quick="${date}" ${time ? `data-time-quick="${time}"` : ""} ${hasTime ? "data-time-enabled=\"true\"" : ""}>
              <strong>${escapeHtml(label)}</strong>
              <span>${escapeHtml(formatDate(date))}</span>
            </button>
          `).join("")}
        </div>
        <div class="calendar-title-row">
          <button type="button" data-calendar-month="-1" aria-label="上个月">‹</button>
          <strong>${escapeHtml(monthTitle)}</strong>
          <button type="button" data-calendar-month="1" aria-label="下个月">›</button>
        </div>
        <div class="calendar-grid" aria-label="选择日期">
          ${["日", "一", "二", "三", "四", "五", "六"].map((day) => `<span>${day}</span>`).join("")}
          ${getCalendarDays(monthKey).map((day) => `
            <button
              type="button"
              class="${day.inMonth ? "" : "muted"} ${day.iso === selected ? "selected" : ""} ${day.iso === dateToIso(today) ? "today" : ""}"
              data-calendar-day="${day.iso}"
            >${day.day}</button>
          `).join("")}
        </div>
        ${isReminder ? `
          <div class="reminder-options">
            <label class="reminder-time-toggle">
              <span>时间</span>
              <span class="switch-row">
                <input type="checkbox" data-date-has-time ${reminder.hasTime ? "checked" : ""} />
                <b>${reminder.hasTime ? "精确到分钟" : "不选时间"}</b>
              </span>
            </label>
            ${reminder.hasTime ? `
              <label>
                <span>具体时间</span>
                <div class="time-select-row">
                <select class="select-field" data-date-time-hour>
                  ${Array.from({ length: 24 }, (_, value) => String(value).padStart(2, "0")).map((value) => `<option value="${value}" ${hour === value ? "selected" : ""}>${value}</option>`).join("")}
                </select>
                <b>:</b>
                <select class="select-field" data-date-time-minute>
                  ${Array.from({ length: 60 }, (_, value) => String(value).padStart(2, "0")).map((value) => `<option value="${value}" ${minute === value ? "selected" : ""}>${value}</option>`).join("")}
                </select>
                </div>
              </label>
            ` : ""}
            <label>
              <span>提醒</span>
              <select class="select-field" data-date-offset>
                ${Object.entries(offsetLabels).map(([key, label]) => `<option value="${key}" ${reminder.offset === key ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </label>
            ${reminder.offset === "custom" ? `
              <label>
                <span>自定义</span>
                <div class="custom-offset-row">
                  <input class="field" type="number" min="1" value="${reminder.customOffset.amount}" data-date-custom-offset-amount />
                  <select class="select-field" data-date-custom-offset-unit>
                    ${Object.entries(customOffsetUnitLabels).map(([key, label]) => `<option value="${key}" ${reminder.customOffset.unit === key ? "selected" : ""}>${label}</option>`).join("")}
                  </select>
                </div>
              </label>
            ` : ""}
            <label>
              <span>重复</span>
              <select class="select-field" data-date-repeat>
                ${Object.entries(repeatLabels).map(([key, label]) => `<option value="${key}" ${reminder.repeat === key ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </label>
          </div>
        ` : ""}
      </section>
    </div>
  `;
}

function renderCandidateCrop(candidate) {
  const label = candidate.cropImage ? "主体裁切图" : "裁切图生成中";
  return `
    <div class="candidate-crop ${candidate.cropImage ? "" : "empty"}" aria-label="${escapeHtml(label)}" ${cropAspectStyle(candidate.cropMeta)}>
      ${candidate.cropImage
        ? `<img src="${candidate.cropImage}" alt="${escapeHtml(candidate.name)}主体裁切图" />`
        : `<span>${escapeHtml(label)}</span>`}
    </div>
  `;
}

function catalogCandidateImageSrc(candidate) {
  const image = candidate?.representativeImages?.[0] || {};
  const imagePath = image.normalizedImagePath || "";
  if (!imagePath || !imagePath.startsWith("data/")) return "";
  return `/${imagePath}`;
}

function renderCatalogCandidatePanel(candidate) {
  const candidates = Array.isArray(candidate.catalogCandidates) ? candidate.catalogCandidates.slice(0, 3) : [];
  if (!candidates.length) return "";
  const title = candidate.namingRejectionReason ? "可能是这些物品" : "相似命名候选";
  return `
    <div class="catalog-candidate-panel">
      <div class="catalog-candidate-head">
        <strong>${escapeHtml(title)}</strong>
        ${candidate.namingRejectionReason ? `<span>低置信 · 请确认</span>` : `<span>按相似度排序</span>`}
      </div>
      <div class="catalog-candidate-list">
        ${candidates.map((entry, index) => {
          const src = catalogCandidateImageSrc(entry);
          const score = Number(entry.score) || 0;
          const hitCount = Number(entry.hitCount) || 1;
          return `
            <button class="catalog-candidate-option" type="button" data-apply-catalog-candidate="${candidate.id}" data-candidate-rank="${index}">
              <span class="catalog-candidate-thumb">
                ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(entry.displayName || "候选")}" loading="lazy" />` : `<b>${index + 1}</b>`}
              </span>
              <span class="catalog-candidate-copy">
                <strong>${escapeHtml(entry.displayName || entry.categoryId || "候选物品")}</strong>
                <small>${Math.round(score * 100)}% · ${hitCount} 个相似样本</small>
              </span>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderCandidate(candidate, activeIndex = 0, total = 1) {
  const isActive = getFallbackActiveCandidateId(state.capture.activeCandidateId) === candidate.id;
  const isNaming = candidate.namingStatus === "loading";
  const isLoading = ["loading", "detecting", "naming"].includes(state.capture.recognitionStatus);
  const selectedCount = getSelectedCandidateCount();
  const showDetails = candidate.detailsOpen || hasCandidateOptionalDetails(candidate);
  const showBox = candidate.boxOpen;
  const previousId = getAdjacentCandidateId(candidate.id, -1);
  const nextId = getAdjacentCandidateId(candidate.id, 1);
  return `
    <article class="candidate-card ${candidate.selected ? "" : "muted"} ${isActive ? "active" : ""} ${isNaming ? "naming" : ""}" data-candidate-select="${candidate.id}">
      <div class="candidate-card-nav">
        <button class="icon-btn" type="button" data-candidate-prev="${candidate.id}" ${previousId === candidate.id ? "disabled" : ""} aria-label="上一个候选">‹</button>
        <span>第 ${activeIndex + 1} / ${total} 个候选</span>
        <button class="icon-btn" type="button" data-candidate-next="${candidate.id}" ${nextId === candidate.id ? "disabled" : ""} aria-label="下一个候选">›</button>
        <button class="icon-btn danger" type="button" data-delete-candidate="${candidate.id}" title="删除候选" aria-label="删除候选">${icons.trash}</button>
      </div>
      <div class="candidate-head">
        <label class="checkbox">
          <input type="checkbox" ${candidate.selected ? "checked" : ""} data-candidate-toggle="${candidate.id}" />
          <strong>${isNaming ? `${escapeHtml(candidate.name)} · 识别中` : escapeHtml(candidate.name)}</strong>
        </label>
        <div class="candidate-actions">
          <span class="status-pill good">置信度 ${Math.round(candidate.confidence * 100)}%</span>
          <button class="primary-btn compact-btn" type="button" data-confirm-all ${selectedCount && !isLoading ? "" : "disabled"}>${icons.check}<span>确认入库</span></button>
        </div>
      </div>
      ${renderCandidateMetaChips(candidate)}
      <div class="candidate-body">
        ${renderCandidateCrop(candidate)}
        <div class="candidate-info">
          <div class="candidate-form">
            <label class="candidate-field">
              <span>物品名</span>
              <input class="field" value="${escapeHtml(candidate.name)}" data-candidate-field="${candidate.id}" data-field="name" aria-label="物品名称" />
            </label>
            <label class="candidate-field">
              <span>分类</span>
              <select class="select-field" data-candidate-field="${candidate.id}" data-field="category" aria-label="分类">
                ${Object.entries(categoryLabels).map(([key, label]) => `<option value="${key}" ${candidate.category === key ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </label>
            <label class="candidate-field">
              <span>数量（件）</span>
              <input class="field" type="number" min="1" value="${escapeHtml(candidate.qty || 1)}" data-candidate-field="${candidate.id}" data-field="qty" aria-label="数量，按件数统计" />
              <small>默认按 1 件入库</small>
            </label>
          </div>
          <div class="candidate-option-bar">
            <button class="secondary-btn compact-btn" data-scan-candidate-inside="${candidate.id}">${icons.camera}<span>拍内部</span></button>
            <button class="ghost-btn compact-btn" type="button" data-toggle-candidate-details="${candidate.id}">
              ${icons.bell}<span>${showDetails ? "收起提醒" : "保质期/提醒"}</span>
            </button>
            <button class="ghost-btn compact-btn" type="button" data-toggle-candidate-box="${candidate.id}">
              ${icons.scan}<span>${showBox ? "收起定位" : "调整定位"}</span>
            </button>
          </div>
          ${renderCatalogCandidatePanel(candidate)}
        </div>
      </div>
      ${showDetails ? `
        <div class="candidate-extra-panel">
          <div class="date-picker-grid">
            ${renderCandidateDatePicker(candidate, "expireAt", "保质期")}
          </div>
          ${renderCandidateReminders(candidate)}
          <label class="candidate-field">
            <span>具体位置</span>
            <input class="field" value="${escapeHtml(candidate.container || "")}" data-candidate-field="${candidate.id}" data-field="container" aria-label="具体位置" placeholder="例如：左侧抽屉、白色药箱" />
          </label>
        </div>
      ` : ""}
      ${showBox ? `
        <div class="box-control-grid" aria-label="定位框数值">
          ${["x", "y", "w", "h"].map((field) => `
            <label>
              <span>${field.toUpperCase()}</span>
              <input class="field" type="number" min="0" max="100" step="1" value="${Math.round(candidate.box[field])}" data-candidate-box-field="${candidate.id}" data-field="${field}" aria-label="${field.toUpperCase()} 坐标" />
            </label>
          `).join("")}
        </div>
      ` : ""}
    </article>
  `;
}

function renderReminderView() {
  const reminders = getReminderItems();
  return `
    <section class="panel">
      <div class="view-title-row">
        <div>
          <h2>主动提醒</h2>
          <p>食品、药品、维护和补货</p>
        </div>
        <span class="status-pill ${reminders.some((item) => dueStatus(item.reminderDate).cls === "danger") ? "danger" : "good"}">${reminders.length} 条</span>
      </div>
      <div class="reminder-list">
        ${reminders.map(renderReminder).join("") || `<p class="empty-state">暂无提醒</p>`}
      </div>
    </section>
  `;
}

function renderReminder(item) {
  const due = dueStatus(item.reminderDate);
  return `
    <article class="reminder-row">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="meta-line">
          <span class="badge ${item.category}">${categoryLabels[item.category]}</span>
          <span>${escapeHtml(item.reminderTitle || "提醒")}：${escapeHtml(item.reminderSchedule || formatDate(item.reminderDate))}</span>
          <span>${escapeHtml(buildTrail(item))}</span>
        </div>
      </div>
      <span class="due-pill ${due.cls}">${due.label}</span>
    </article>
  `;
}

function getReminderItems() {
  return state.items
    .flatMap((item) => {
      const entries = [];
      if (item.expireAt) {
        entries.push({
          ...item,
          reminderKind: "expiry",
          reminderTitle: "有效期",
          reminderDate: item.expireAt,
          reminderSchedule: formatDate(item.expireAt),
          dueIn: daysUntil(item.expireAt),
        });
      }
      for (const reminder of normalizeReminderList(item)) {
        entries.push({
          ...item,
          reminderKind: "task",
          reminder,
          reminderTitle: reminder.title,
          reminderDate: reminder.date,
          reminderSchedule: `${formatReminderSchedule(reminder)} · ${formatReminderOffset(reminder)}`,
          dueIn: daysUntil(reminder.date),
        });
      }
      return entries;
    })
    .filter((item) => item.dueIn <= 45)
    .sort((a, b) => a.dueIn - b.dueIn);
}

function getReminderOffsetMinutes(reminder) {
  const normalized = normalizeReminder(reminder);
  if (normalized.offset === "none") return null;
  if (normalized.offset === "on-time" || normalized.offset === "same-day") return 0;
  if (normalized.offset === "before-5m") return 5;
  if (normalized.offset === "before-30m") return 30;
  if (normalized.offset === "before-1h") return 60;
  if (normalized.offset === "before-1d") return 1440;
  if (normalized.offset === "before-2d") return 2880;
  if (normalized.offset === "before-3d") return 4320;
  if (normalized.offset === "before-1w") return 10080;
  if (normalized.offset === "custom") {
    const amount = normalized.customOffset.amount;
    if (normalized.customOffset.unit === "hours") return amount * 60;
    if (normalized.customOffset.unit === "days") return amount * 1440;
    if (normalized.customOffset.unit === "weeks") return amount * 10080;
    return amount;
  }
  return null;
}

function getReminderNotificationDate(reminder) {
  const normalized = normalizeReminder(reminder);
  if (!normalized.enabled) return null;
  const offsetMinutes = getReminderOffsetMinutes(normalized);
  if (offsetMinutes === null) return null;
  const [hour, minute] = normalized.hasTime ? normalizeReminderTime(normalized.time).split(":").map(Number) : [9, 0];
  const date = new Date(`${normalized.date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setMinutes(date.getMinutes() - offsetMinutes);
  if (date.getTime() <= Date.now()) return null;
  return date;
}

async function scheduleConfirmedItemReminders(items) {
  const notifications = normalizeItems(items).flatMap((item) => normalizeReminderList(item)
    .map((reminder) => {
      const at = getReminderNotificationDate(reminder);
      if (!at) return null;
      return {
        id: reminder.notificationId,
        title: `家忆：${item.name}`,
        body: `${reminder.title} · ${formatReminderSchedule(reminder)}`,
        schedule: { at },
        extra: { itemId: item.id, reminderId: reminder.id },
      };
    })
    .filter(Boolean));
  if (!notifications.length) return;
  const permission = await platform.notifications.requestPermissions().catch(() => ({ display: "denied" }));
  if (permission?.display === "denied") return;
  await platform.notifications.schedule(notifications).catch((error) => {
    console.info("Native reminders unavailable.", error);
  });
}

async function cancelReminderNotifications(records) {
  const ids = normalizeItems(records)
    .flatMap((item) => normalizeReminderList(item).map((reminder) => reminder.notificationId))
    .filter((id) => Number.isInteger(Number(id)))
    .map(Number);
  if (ids.length) await platform.notifications.cancel(ids).catch(() => {});
}

function renderInsights() {
  return `
    <aside class="insights-panel">
      <section class="side-section panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">今日提醒</h2>
            <p class="panel-subtitle">按日期和维护周期排序</p>
          </div>
        </div>
        <div class="reminder-list">
          ${getReminderItems().slice(0, 4).map(renderReminder).join("") || `<p class="empty-state">暂无提醒</p>`}
        </div>
      </section>
      <section class="side-section panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">收纳建议</h2>
            <p class="panel-subtitle">基于当前家庭数据生成</p>
          </div>
        </div>
        <div class="advice-list">
          ${buildAdvice().map((advice) => `
            <article class="advice-row">
              <strong>${escapeHtml(advice.title)}</strong>
              <p>${escapeHtml(advice.body)}</p>
            </article>
          `).join("")}
        </div>
      </section>
    </aside>
  `;
}

function buildAdvice() {
  if (!state.items.length) {
    return [{
      title: "先建立第一张照片地图",
      body: "从客厅开始上传照片，确认主体标注后再逐步补充厨房、卧室和阳台。",
    }];
  }
  const expiringFoods = state.items.filter((item) => item.category === "food" && item.expireAt && daysUntil(item.expireAt) <= 14);
  const petItems = state.items.filter((item) => item.category === "pet");
  const medicine = state.items.filter((item) => item.category === "medicine");
  const advice = [];
  if (expiringFoods.length) {
    advice.push({
      title: "先处理临期食品",
      body: `${expiringFoods.map((item) => item.name).join("、")} 将在 14 天内到期，适合放到冰箱视线最容易扫到的位置。`,
    });
  }
  if (petItems.length > 1) {
    const placeNames = [...new Set(petItems.map((item) => getPlace(item.placeId)?.shortName || "未命名储物点"))];
    advice.push({
      title: "宠物用品集中管理",
      body: `宠物用品分布在 ${placeNames.join("、")}，可以合并到阳台储物柜下层并保留一组常用件在客厅。`,
    });
  }
  if (medicine.some((item) => item.expireAt && daysUntil(item.expireAt) <= 45)) {
    advice.push({
      title: "药箱做一次复核",
      body: "白色医药箱里有近期到期药品，建议本周确认数量，并把儿童用药和成人用药分隔。"
    });
  }
  advice.push({
    title: "高频耗材放低一层",
    body: "滤芯、电池、保鲜袋这类高频耗材适合放在腰部高度或抽屉前半区，减少翻找。"
  });
  return advice.slice(0, 4);
}

function performSearch() {
  const query = state.query.trim();
  const normalized = normalizeText(query);
  if (!normalized) return;

  if (["过期", "临期", "到期", "提醒", "清理", "维护"].some((key) => normalized.includes(key))) {
    const items = getReminderItems();
    setState({ lastAnswer: { type: "expiring", items } });
    return;
  }

  const item = matchItem(query);
  setState({ lastAnswer: item ? { type: "item", item } : { type: "not-found", query } });
}

async function scanCurrentPlace() {
  if (["loading", "detecting", "naming"].includes(state.capture.recognitionStatus)) return;

  const room = getCaptureRoom();
  const virtualPlace = getCapturePlace() || makeVirtualPlace(room);
  if (!state.capture.image) {
    state.capture = {
      ...state.capture,
      candidates: [],
      activeCandidateId: null,
      recognitionStatus: "error",
      recognitionError: "请先上传或拍摄储物点照片。",
      provider: "none",
    };
    persist();
    render();
    showToast("请先上传或拍摄照片");
    return;
  }

  const requestedProvider = getRequestedRecognitionProvider();
  const runId = recognitionRunId + 1;
  recognitionRunId = runId;
  const scanImage = state.capture.image;
  const scanStartedAt = performance.now();
  const promptRoomType = getCapturePromptRoomType(room);
  const imageDimensionsPromise = getImageDimensions(scanImage).catch(() => null);
  state.capture = {
    ...state.capture,
    recognitionStatus: "detecting",
    recognitionError: "",
    recognitionDiagnostics: null,
    candidates: [],
    activeCandidateId: null,
    provider: requestedProvider,
  };
  persist();
  render();

  const stillCurrent = () => recognitionRunId === runId && state.capture.image === scanImage;
  let modelPrepMs = 0;
  let detectorTiming = {};
  try {
    const modelPrepStartedAt = performance.now();
    const modelContext = await prepareModelImageContext(scanImage).catch(async (error) => {
      console.info("Detection resize skipped.", error);
      const originalSource = await loadImage(scanImage);
      const originalMeta = normalizeImageMeta(originalSource) || getDrawableSize(originalSource);
      return {
        originalSource,
        originalMeta,
        modelImage: scanImage,
        modelSource: originalSource,
        modelMeta: originalMeta,
        resized: false,
        maxLongSide: Math.max(originalMeta.width, originalMeta.height),
      };
    });
    modelPrepMs = performance.now() - modelPrepStartedAt;
    const detectionImage = modelContext.modelImage;
    if (!stillCurrent()) return;

    const detectionStartedAt = performance.now();
    const smallRecognition = await recognizeWithSmallModelUncached(detectionImage, { roomType: promptRoomType })
      .catch((error) => {
        console.info("Small model unavailable, falling back to local image proposals.", error);
        return null;
      });
    if (!stillCurrent()) return;

    let provider = smallRecognition?.provider || requestedProvider;
    detectorTiming = smallRecognition?.timings || {};
    let detected = smallRecognition?.candidates?.length
      ? normalizeRecognitionResults(smallRecognition.candidates, provider)
      : [];
    detected = attachModelCoordinateContext(detected, modelContext);

    if (!detected.length) {
      const fallbackRecognition = await recognizeWithHeuristicRegions(detectionImage)
        .catch((error) => {
          console.info("Local proposal fallback failed.", error);
          return { provider: "local-image", candidates: [] };
        });
      if (!stillCurrent()) return;
      provider = `${fallbackRecognition.provider || "local-image"}-fallback`;
      detected = normalizeRecognitionResults(fallbackRecognition.candidates, provider);
      detected = attachModelCoordinateContext(detected, modelContext);
    }
    const detectionMs = Number(detectorTiming.detectionMs) || (performance.now() - detectionStartedAt);

    if (!detected.length) {
      state.capture = {
        ...state.capture,
        candidates: [],
        activeCandidateId: null,
        recognitionStatus: "empty",
        recognitionError: "",
        recognitionDiagnostics: {
          provider,
          assetMode: await getVisionAssetMode().catch(() => null),
          imageDimensions: await imageDimensionsPromise,
          preprocessingMs: state.capture.preprocessingMs || null,
          modelPrepMs,
          detectorLoadMs: detectorTiming.detectorLoadMs,
          promptRoomType: detectorTiming.promptRoomType || promptRoomType,
          promptStrategy: detectorTiming.promptStrategy,
          promptShardNames: detectorTiming.promptShardNames,
          promptCount: detectorTiming.promptCount,
          promptBatches: detectorTiming.promptBatches,
          detectionMs,
          namingMs: 0,
          totalMs: performance.now() - scanStartedAt,
          resultCount: 0,
          wasmThreads: getVisionWasmThreadCount(),
        },
        provider,
      };
      persist();
      render();
      showToast("没有找到候选区域");
      return;
    }

    const place = getCapturePlace() || virtualPlace;
    detected = renumberUnknownCandidates(detected);
    state.capture = {
      ...state.capture,
      roomId: room.id,
      placeId: place.virtual ? null : place.id,
      candidates: detected,
      activeCandidateId: detected[0]?.id || null,
      recognitionStatus: "naming",
      recognitionError: "",
      recognitionDiagnostics: null,
      provider,
    };
    persist();
    render();
    showToast(`已生成 ${detected.length} 个主体框，正在命名`);

    const namingStartedAt = performance.now();
    const namedCandidates = await nameDetectedCandidates({
      displayImage: scanImage,
      modelImage: detectionImage,
      modelContext,
    }, detected, (partialCandidates) => {
      if (!stillCurrent()) return;
      state.capture = {
        ...state.capture,
        candidates: applyCandidateProgressUpdates(state.capture.candidates || [], partialCandidates, provider),
      };
      persist();
      render();
    });
    if (!stillCurrent()) return;
    const namingMs = performance.now() - namingStartedAt;
    const embeddingMs = namedCandidates.reduce((total, candidate) => total + (Number(candidate.timings?.embeddingMs) || 0), 0);
    state.capture = {
      ...state.capture,
      candidates: applyCandidateProgressUpdates(state.capture.candidates || [], namedCandidates, provider),
      activeCandidateId: getFallbackActiveCandidateId(state.capture.activeCandidateId),
      recognitionStatus: "done",
      recognitionError: "",
      recognitionDiagnostics: {
        provider,
        assetMode: await getVisionAssetMode().catch(() => null),
        imageDimensions: await imageDimensionsPromise,
        preprocessingMs: state.capture.preprocessingMs || null,
        modelPrepMs,
        detectorLoadMs: detectorTiming.detectorLoadMs,
        promptRoomType: detectorTiming.promptRoomType || promptRoomType,
        promptStrategy: detectorTiming.promptStrategy,
        promptShardNames: detectorTiming.promptShardNames,
        promptCount: detectorTiming.promptCount,
        promptBatches: detectorTiming.promptBatches,
        rawDetectionCount: detectorTiming.rawDetectionCount,
        filteredDetectionCount: detectorTiming.filteredDetectionCount,
        detectionMs,
        namingMs,
        embeddingMs,
        totalMs: performance.now() - scanStartedAt,
        resultCount: namedCandidates.length,
        wasmThreads: getVisionWasmThreadCount(),
      },
      provider,
    };
    persist();
    render();
    showToast(`已完成 ${namedCandidates.length} 个候选标注`);
  } catch (error) {
    state.capture = {
      ...state.capture,
      candidates: [],
      activeCandidateId: null,
      recognitionStatus: "error",
      recognitionError: error.message || "分析失败，请保留照片后重试",
      recognitionDiagnostics: {
        provider: state.capture.provider || requestedProvider,
        assetMode: await getVisionAssetMode().catch(() => null),
        imageDimensions: await imageDimensionsPromise,
        preprocessingMs: state.capture.preprocessingMs || null,
        modelPrepMs,
        detectorLoadMs: detectorTiming.detectorLoadMs,
        promptRoomType: detectorTiming.promptRoomType || promptRoomType,
        promptStrategy: detectorTiming.promptStrategy,
        promptShardNames: detectorTiming.promptShardNames,
        promptCount: detectorTiming.promptCount,
        promptBatches: detectorTiming.promptBatches,
        detectionMs: performance.now() - scanStartedAt,
        namingMs: 0,
        totalMs: performance.now() - scanStartedAt,
        resultCount: 0,
        wasmThreads: getVisionWasmThreadCount(),
      },
    };
    persist();
    render();
    showToast("分析失败，未修改库存");
  }
}

function confirmCandidates() {
  const selected = getActiveCandidates().filter((candidate) => candidate.selected && normalizeText(candidate.name));
  if (!selected.length) {
    showToast("请选择要入库的物品");
    return;
  }
  const roomId = state.capture.roomId;
  const place = getCapturePlace() || ensureCapturePlace();
  const placeId = place.id;
  const nowText = new Date().toISOString().slice(0, 10);
  updatePlaceImage(placeId, state.capture.image, state.capture.imageRef, state.capture.imageMeta);
  const existingNames = new Set(state.items.map((item) => `${item.placeId}:${normalizeText(item.name)}`));
  const incoming = selected
    .filter((candidate) => !existingNames.has(`${placeId}:${normalizeText(candidate.name)}`))
    .map((candidate) => {
      const reminders = normalizeReminderList(candidate);
      const primaryReminder = reminders[0] || null;
      return {
      id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: candidate.name,
      aliases: [],
      category: candidate.category,
      qty: Number(candidate.qty) || 1,
      roomId,
      placeId,
      container: candidate.container,
      box: candidate.box,
      expireAt: candidate.expireAt || null,
      reminders,
      nextAt: primaryReminder?.date || null,
      nextTime: primaryReminder?.hasTime ? formatReminderTime(primaryReminder.time) : null,
      nextRepeat: primaryReminder?.repeat || null,
      nextLabel: primaryReminder?.title || null,
      updatedAt: nowText,
      confidence: candidate.confidence,
      source: candidate.source || state.capture.provider || "local-image",
      recognitionProvider: state.capture.provider || "local-image",
      categoryId: candidate.categoryId || candidate.catalogId || "",
      categoryPath: candidate.categoryPath || [],
      categoryScore: candidate.categoryScore,
      categoryMargin: candidate.categoryMargin,
      catalogCandidates: candidate.catalogCandidates || [],
      namingRejectionReason: candidate.namingRejectionReason || "",
      categoryIndexVersion: candidate.categoryIndexVersion || "",
      matchedSampleIds: candidate.matchedSampleIds || [],
      imageRef: state.capture.imageRef || null,
      boxEdited: Boolean(candidate.edited),
      };
    });

  state.items = normalizeItems([...state.items, ...incoming]);
  scheduleConfirmedItemReminders(incoming).catch((error) => console.info("Reminder scheduling skipped.", error));
  resetCaptureRecognition();
  state.activeRoomId = roomId;
  state.activePlaceId = placeId;
  state.activeTab = "map";
  persist();
  render();
  showToast(incoming.length ? `已入库 ${incoming.length} 件物品` : "这些物品已经在当前位置");
}

function scanInsideItem(itemId) {
  const item = state.items.find((entry) => entry.id === itemId);
  if (!item) return;
  const parentPlace = getPlaceById(item.placeId);
  if (!parentPlace) return;
  const existing = getChildPlaces(parentPlace.id, item.roomId)
    .find((place) => place.sourceItemId === item.id || normalizeText(place.name) === normalizeText(item.name));
  let targetPlace = existing;
  if (!targetPlace) {
    targetPlace = addPlace(item.roomId, item.name, parentPlace.id, {
      sourceItemId: item.id,
      kind: "photo",
      box: item.box,
      note: `拍摄 ${item.name} 内部后建立`,
    });
  }
  if (targetPlace) {
    resetCaptureRecognition({ roomId: item.roomId, placeId: targetPlace.id });
    state.activeRoomId = item.roomId;
    state.activePlaceId = targetPlace.id;
    state.activeTab = "capture";
    persist();
    render();
    showToast(`已切换到 ${targetPlace.name}，请上传内部照片`);
  }
}

function scanInsideCandidate(candidateId) {
  const candidate = getActiveCandidates().find((entry) => entry.id === candidateId);
  if (!candidate) return;
  const parentPlace = ensureCapturePlace();
  const cleanName = String(candidate.name || "").trim() || "下级储物点";
  const childName = isUnknownObjectName(cleanName) ? `${cleanName}内部` : cleanName;
  const existing = getChildPlaces(parentPlace.id, parentPlace.roomId)
    .find((place) => normalizeText(place.name) === normalizeText(childName));
  let targetPlace = existing;
  if (!targetPlace) {
    targetPlace = addPlace(parentPlace.roomId, childName, parentPlace.id, {
      kind: "photo",
      box: candidate.box,
      note: `由 ${parentPlace.name} 的主体创建`,
    });
  }
  if (!targetPlace) return;
  resetCaptureRecognition({ roomId: targetPlace.roomId, placeId: targetPlace.id, image: null, provider: "none" });
  state.activeRoomId = targetPlace.roomId;
  state.activePlaceId = targetPlace.id;
  state.activeTab = "capture";
  persist();
  render();
  showToast(`已切换到 ${targetPlace.name}，请上传内部照片`);
}

function moveCandidateCard(id, direction) {
  const nextId = getAdjacentCandidateId(id, direction);
  if (!nextId || nextId === id) return;
  selectCandidate(nextId);
}

function deleteCandidate(id) {
  const activeCandidates = getActiveCandidates();
  const currentIndex = getCandidateIndex(activeCandidates, id);
  const fallback = activeCandidates[currentIndex + 1] || activeCandidates[currentIndex - 1] || null;
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id
      ? { ...candidate, deletedAt: new Date().toISOString(), edited: true }
      : candidate
  ));
  state.capture.activeCandidateId = fallback?.id || null;
  persist();
  render();
}

function restoreCandidate(id) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id
      ? { ...candidate, deletedAt: null, edited: true }
      : candidate
  ));
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function updateCandidate(id, field, value) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id
      ? {
        ...candidate,
        [field]: field === "qty" ? Math.max(1, Math.round(Number(value) || 1)) : value,
        edited: true,
        ...(field === "name" ? { nameEdited: true } : {}),
      }
      : candidate
  ));
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function applyCatalogCandidate(id, rank) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => {
    if (candidate.id !== id) return candidate;
    const option = Array.isArray(candidate.catalogCandidates) ? candidate.catalogCandidates[rank] : null;
    if (!option) return candidate;
    return normalizeCandidate({
      ...candidate,
      name: option.displayName || candidate.name,
      category: categoryLabels[option.appCategory] ? option.appCategory : candidate.category,
      catalogId: option.categoryId || candidate.catalogId,
      categoryId: option.categoryId || candidate.categoryId,
      categoryPath: option.categoryPath || candidate.categoryPath || [],
      categoryScore: Number(option.score) || candidate.categoryScore,
      categoryMargin: null,
      matchedSampleIds: option.matchedSampleIds || candidate.matchedSampleIds || [],
      namingRejectionReason: "",
      edited: true,
      nameEdited: true,
    }, 0, state.capture.provider || "local-image");
  });
  state.capture.activeCandidateId = id;
  persist();
  render();
  showToast("已应用候选命名");
}

function toggleCandidatePanel(id, panel) {
  const key = panel === "box" ? "boxOpen" : "detailsOpen";
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id ? { ...candidate, [key]: !candidate[key] } : candidate
  ));
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function openCandidateDatePicker(id, field) {
  const candidate = (state.capture.candidates || []).find((entry) => entry.id === id);
  if (!candidate) return;
  const currentDate = candidate[field] || dateToIso(today);
  candidateDatePickerState = {
    mode: "date",
    candidateId: id,
    field,
    date: currentDate,
    month: monthKeyFromIso(currentDate),
  };
  state.capture.activeCandidateId = id;
  render();
}

function openCandidateReminderEditor(id, reminderId = null) {
  const candidate = (state.capture.candidates || []).find((entry) => entry.id === id);
  if (!candidate) return;
  const reminders = normalizeReminderList(candidate);
  const reminder = reminders.find((entry) => entry.id === reminderId)
    || normalizeReminder({
      id: createId("reminder", candidate.name || "提醒"),
      title: "提醒",
      date: dateToIso(today),
      hasTime: false,
      time: "09:00",
      offset: "none",
      repeat: "none",
      enabled: true,
    });
  candidateDatePickerState = {
    mode: "reminder",
    candidateId: id,
    reminder: normalizeReminder(reminder),
    month: monthKeyFromIso(reminder.date),
    offsetTouched: Boolean(reminderId),
  };
  state.capture.activeCandidateId = id;
  render();
}

function closeCandidateDatePicker() {
  candidateDatePickerState = null;
  render();
}

function updateCandidateDateDraft(patch) {
  if (!candidateDatePickerState) return;
  if (candidateDatePickerState.mode === "reminder") {
    const current = normalizeReminder(candidateDatePickerState.reminder);
    const rawReminder = {
      ...current,
      ...patch,
      customOffset: {
        ...current.customOffset,
        ...(patch.customOffset || {}),
      },
    };
    const nextHasTime = Object.prototype.hasOwnProperty.call(patch, "hasTime")
      ? Boolean(patch.hasTime)
      : current.hasTime;
    const offsetTouched = candidateDatePickerState.offsetTouched || Object.prototype.hasOwnProperty.call(patch, "offset");
    const offset = Object.prototype.hasOwnProperty.call(patch, "hasTime") && !offsetTouched
      ? defaultReminderOffset(nextHasTime)
      : normalizeReminderOffset(rawReminder.offset, nextHasTime);
    candidateDatePickerState = {
      ...candidateDatePickerState,
      ...("month" in patch ? { month: patch.month } : {}),
      offsetTouched,
      reminder: normalizeReminder({
        ...rawReminder,
        hasTime: nextHasTime,
        offset,
      }),
    };
    render();
    return;
  }
  candidateDatePickerState = {
    ...candidateDatePickerState,
    ...patch,
  };
  render();
}

function confirmCandidateDatePicker() {
  if (!candidateDatePickerState?.candidateId) return;
  const { candidateId } = candidateDatePickerState;
  if (candidateDatePickerState.mode === "reminder") {
    const reminder = normalizeReminder(candidateDatePickerState.reminder);
    state.capture.candidates = (state.capture.candidates || []).map((candidate) => {
      if (candidate.id !== candidateId) return candidate;
      const current = normalizeReminderList(candidate);
      const exists = current.some((entry) => entry.id === reminder.id);
      const reminders = exists
        ? current.map((entry) => (entry.id === reminder.id ? reminder : entry))
        : [...current, reminder];
      const primary = reminders[0] || null;
      return {
        ...candidate,
        reminders,
        nextAt: primary?.date || "",
        nextTime: primary?.time || "09:00",
        nextRepeat: primary?.repeat || "none",
        nextLabel: primary?.title || "",
        detailsOpen: true,
        edited: true,
      };
    });
    state.capture.activeCandidateId = candidateId;
    candidateDatePickerState = null;
    persist();
    render();
    return;
  }

  if (!candidateDatePickerState.field) return;
  const { field, date } = candidateDatePickerState;
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => {
    if (candidate.id !== candidateId) return candidate;
    const next = {
      ...candidate,
      [field]: date || dateToIso(today),
      edited: true,
    };
    return next;
  });
  state.capture.activeCandidateId = candidateId;
  candidateDatePickerState = null;
  persist();
  render();
}

function clearCandidateDate(id, field) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => {
    if (candidate.id !== id) return candidate;
    const next = { ...candidate, [field]: "", edited: true };
    return next;
  });
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function deleteCandidateReminder(candidateId, reminderId) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => {
    if (candidate.id !== candidateId) return candidate;
    const reminders = normalizeReminderList(candidate).filter((reminder) => reminder.id !== reminderId);
    const primary = reminders[0] || null;
    return {
      ...candidate,
      reminders,
      nextAt: primary?.date || "",
      nextTime: primary?.time || "09:00",
      nextRepeat: primary?.repeat || "none",
      nextLabel: primary?.title || "",
      detailsOpen: true,
      edited: true,
    };
  });
  state.capture.activeCandidateId = candidateId;
  persist();
  render();
}

function toggleCandidate(id) {
  if (!getActiveCandidates().some((candidate) => candidate.id === id)) return;
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id ? { ...candidate, selected: !candidate.selected } : candidate
  ));
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function selectCandidate(id) {
  if (!getActiveCandidates().some((candidate) => candidate.id === id)) return;
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function updateCandidateBox(id, field, value) {
  if (!getActiveCandidates().some((candidate) => candidate.id === id)) return;
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => {
    if (candidate.id !== id) return candidate;
    return {
      ...candidate,
      box: clampBox({ ...candidate.box, [field]: value }),
      modelBox: null,
      edited: true,
      boxEdited: true,
      cropVersion: "",
    };
  });
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function setCandidateBoxWithoutRender(id, box) {
  if (!getActiveCandidates().some((candidate) => candidate.id === id)) return;
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id ? { ...candidate, box: clampBox(box), modelBox: null, edited: true, boxEdited: true, cropVersion: "" } : candidate
  ));
  state.capture.activeCandidateId = id;
}

function startCandidateDrag(event, dragTarget, options = {}) {
  const id = dragTarget.dataset.candidateResize || dragTarget.dataset.candidateDrag;
  const candidate = getActiveCandidates().find((entry) => entry.id === id);
  const stage = dragTarget.closest("[data-capture-stage]");
  if (!candidate || !stage) return;
  const frameElement = dragTarget.closest("[data-candidate-drag]") || dragTarget;

  event.preventDefault();
  state.capture.activeCandidateId = id;
  candidateDrag = {
    id,
    mode: options.mode || dragTarget.dataset.dragMode || "move",
    handle: options.handle || dragTarget.dataset.resizeHandle || "",
    stage,
    frameElement,
    pointerTarget: dragTarget,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startBox: { ...candidate.box },
  };
  frameElement.classList.add("dragging");
  dragTarget.setPointerCapture?.(event.pointerId);
}

function moveCandidateDrag(event) {
  if (!candidateDrag) return;
  const rect = candidateDrag.stage.getBoundingClientRect();
  const deltaX = ((event.clientX - candidateDrag.startX) / rect.width) * 100;
  const deltaY = ((event.clientY - candidateDrag.startY) / rect.height) * 100;
  const box = candidateDrag.mode === "resize"
    ? resizeCandidateBox(candidateDrag.startBox, candidateDrag.handle, deltaX, deltaY)
    : clampBox({
      ...candidateDrag.startBox,
      x: candidateDrag.startBox.x + deltaX,
      y: candidateDrag.startBox.y + deltaY,
    });
  setCandidateBoxWithoutRender(candidateDrag.id, box);
  updateCandidateDragElements(candidateDrag, box);
}

function updateCandidateDragElements(drag, box) {
  if (!drag?.stage) return;
  if (drag.frameElement) drag.frameElement.style.cssText = styleBox(box);
  const pins = [...drag.stage.querySelectorAll("[data-candidate-select]")];
  const pin = pins.find((entry) => entry.dataset.candidateSelect === drag.id);
  if (pin) pin.style.cssText = styleCandidatePin(box);
  const label = drag.stage.querySelector(".candidate-active-label");
  if (label) label.style.cssText = styleActiveCandidateLabel(box);
}

function resizeCandidateBox(startBox, handle, deltaX, deltaY) {
  const minSize = 6;
  let left = startBox.x;
  let top = startBox.y;
  let right = startBox.x + startBox.w;
  let bottom = startBox.y + startBox.h;

  if (handle.includes("w")) left = clampNumber(startBox.x + deltaX, 0, right - minSize);
  if (handle.includes("e")) right = clampNumber(startBox.x + startBox.w + deltaX, left + minSize, 100);
  if (handle.includes("n")) top = clampNumber(startBox.y + deltaY, 0, bottom - minSize);
  if (handle.includes("s")) bottom = clampNumber(startBox.y + startBox.h + deltaY, top + minSize, 100);

  return clampBox({
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
  });
}

function boxesAlmostEqual(left = {}, right = {}) {
  return ["x", "y", "w", "h"].every((field) => Math.abs(Number(left[field]) - Number(right[field])) < 0.12);
}

function finishCandidateDrag() {
  if (!candidateDrag) return;
  const finishedDrag = candidateDrag;
  const candidate = (state.capture.candidates || []).find((entry) => entry.id === finishedDrag.id);
  const changed = candidate && !boxesAlmostEqual(candidate.box, finishedDrag.startBox);
  finishedDrag.frameElement?.classList.remove("dragging");
  candidateDrag = null;
  persist();
  render();
  if (changed) rerunCandidateNamingAfterBoxEdit(finishedDrag.id).catch((error) => {
    console.info("Candidate box re-recognition skipped.", error);
    state.capture.candidates = (state.capture.candidates || []).map((entry) => (
      entry.id === finishedDrag.id ? { ...entry, namingStatus: "done" } : entry
    ));
    persist();
    render();
  });
}

async function rerunCandidateNamingAfterBoxEdit(candidateId) {
  const image = state.capture.image;
  const candidate = (state.capture.candidates || []).find((entry) => entry.id === candidateId);
  if (!image || !candidate) return;

  const token = ++candidateEditRecognitionToken;
  state.capture.candidates = (state.capture.candidates || []).map((entry) => (
    entry.id === candidateId
      ? { ...entry, namingStatus: "loading", cropImage: "", cropMeta: null, cropVersion: "" }
      : entry
  ));
  persist();
  render();

  const modelContext = await prepareModelImageContext(image).catch(async () => {
    const source = await loadImage(image);
    const meta = normalizeImageMeta(source) || getDrawableSize(source);
    return {
      originalSource: source,
      originalMeta: meta,
      modelImage: image,
      modelSource: source,
      modelMeta: meta,
      resized: false,
      maxLongSide: Math.max(meta.width, meta.height),
    };
  });
  if (token !== candidateEditRecognitionToken || state.capture.image !== image) return;
  const latest = (state.capture.candidates || []).find((entry) => entry.id === candidateId);
  if (!latest) return;
  const crop = createCandidateCropSnapshot(modelContext.originalSource, latest.box) || {};
  const modelBox = mapDisplayBoxToModelBox(latest.box, modelContext);
  const activeCandidates = getActiveCandidates();
  const index = Math.max(0, getCandidateIndex(activeCandidates, candidateId));
  const resolved = latest.nameEdited
    ? { ...latest, namingStatus: "done" }
    : await resolveCandidateName(
      {
        ...latest,
        ...crop,
        modelBox,
        modelImageMeta: normalizeImageMeta(modelContext.modelMeta),
        suggestedName: "",
        edited: false,
        namingStatus: "loading",
      },
      index,
      modelContext.modelSource,
      { force: true, box: modelBox },
    );

  if (token !== candidateEditRecognitionToken || state.capture.image !== image) return;
  state.capture.candidates = (state.capture.candidates || []).map((entry) => {
    if (entry.id !== candidateId) return entry;
    return normalizeCandidate({
      ...entry,
      ...crop,
      modelBox,
      modelImageMeta: normalizeImageMeta(modelContext.modelMeta),
      name: latest.nameEdited ? entry.name : resolved.name,
      category: latest.nameEdited ? entry.category : resolved.category,
      confidence: latest.nameEdited ? entry.confidence : Math.max(entry.confidence || 0, resolved.confidence || 0),
      catalogId: latest.nameEdited ? entry.catalogId : resolved.catalogId,
      categoryId: latest.nameEdited ? entry.categoryId : (resolved.categoryId || resolved.catalogId || ""),
      categoryPath: latest.nameEdited ? entry.categoryPath : (resolved.categoryPath || []),
      categoryScore: latest.nameEdited ? entry.categoryScore : resolved.categoryScore,
      categoryMargin: latest.nameEdited ? entry.categoryMargin : resolved.categoryMargin,
      catalogCandidates: latest.nameEdited ? entry.catalogCandidates : (resolved.catalogCandidates || []),
      namingRejectionReason: latest.nameEdited ? entry.namingRejectionReason : (resolved.namingRejectionReason || ""),
      matchedSampleIds: latest.nameEdited ? entry.matchedSampleIds : (resolved.matchedSampleIds || []),
      source: latest.nameEdited ? entry.source : (resolved.source || entry.source),
      namingStatus: "done",
      edited: true,
      boxEdited: true,
    }, index, state.capture.provider || "local-image");
  });
  persist();
  render();
}

async function startCamera() {
  if (platform.photos.canUseNativeCamera()) {
    await importNativePhoto("camera");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("当前浏览器不支持摄像头");
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    state.cameraOn = true;
    render();
    hydrateCamera();
  } catch {
    showToast("摄像头未授权");
  }
}

async function importNativePhoto(source) {
  const isCamera = source === "camera";
  const canUse = isCamera ? platform.photos.canUseNativeCamera() : platform.photos.canUseNativePhotoLibrary();
  if (!canUse) {
    showToast("当前环境暂不支持原生照片导入");
    return;
  }
  state.capture = {
    ...state.capture,
    candidates: [],
    activeCandidateId: null,
    recognitionStatus: "loading",
    recognitionError: "",
    provider: isCamera ? "ios-camera" : "ios-photo-library",
  };
  render();
  showToast(isCamera ? "正在打开相机" : "正在打开相册");
  try {
    const preprocessStartedAt = performance.now();
    const photo = isCamera ? await platform.photos.captureFromCamera() : await platform.photos.pickFromLibrary();
    const image = photo.dataUrl;
    const loaded = await loadImage(image);
    const imageMeta = normalizeImageMeta(loaded) || await imageMetaFromDataUrl(image);
    const imageRef = await persistPhotoDataUrl(image, isCamera ? "ios-camera" : "ios-photo-library");
    resetCaptureRecognition({
      image,
      imageRef,
      imageMeta,
      preprocessingMs: performance.now() - preprocessStartedAt,
      provider: isCamera ? "ios-camera" : "ios-photo-library",
    });
    warmCaptureDetectionModel();
    persist();
    render();
    showToast(isCamera ? "照片已拍摄，正在分析" : "照片已导入，正在分析");
    queueCaptureAnalysis();
  } catch (error) {
    state.capture = {
      ...state.capture,
      candidates: [],
      activeCandidateId: null,
      recognitionStatus: "error",
      recognitionError: error.message || "照片导入失败",
      provider: isCamera ? "ios-camera" : "ios-photo-library",
    };
    persist();
    render();
    showToast(error.message || "照片导入失败");
  }
}

function hydrateCamera() {
  const video = document.querySelector("#cameraVideo");
  if (video && cameraStream) {
    video.srcObject = cameraStream;
  }
}

function hydrateCandidatePins() {
  const stage = document.querySelector("[data-capture-stage]");
  const candidates = state.capture.candidates || [];
  if (!stage || !candidates.length) return;
  const pins = [...stage.querySelectorAll("[data-candidate-select]")];
  for (const candidate of candidates) {
    const pin = pins.find((entry) => entry.dataset.candidateSelect === candidate.id);
    if (pin) pin.style.cssText = styleCandidatePin(candidate.box);
  }
}

async function hydrateCandidateCrops() {
  const candidates = state.capture.candidates || [];
  const image = state.capture.image;
  if (!image || !candidates.some(shouldRefreshCandidateCrop)) return;
  const key = `${hashStringFast(image)}:${visionConfig.candidateCropVersion}:${candidates.map((candidate) => `${candidate.id}:${candidate.cropVersion || "none"}:${candidate.cropMeta?.width || 0}x${candidate.cropMeta?.height || 0}`).join(",")}`;
  if (candidateCropHydrationKey === key) return;
  candidateCropHydrationKey = key;
  const source = await loadImage(image).catch(() => null);
  if (!source || state.capture.image !== image) return;
  let changed = false;
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => {
    if (!shouldRefreshCandidateCrop(candidate)) return candidate;
    const crop = createCandidateCropSnapshot(source, candidate.box);
    if (!crop?.cropImage) return candidate;
    changed = true;
    return { ...candidate, ...crop };
  });
  if (!changed) return;
  persist();
  render();
}

async function captureCameraFrame() {
  const video = document.querySelector("#cameraVideo");
  if (!video) return;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  stopCamera();
  try {
    const preprocessStartedAt = performance.now();
    const image = drawSourceToDataUrl(canvas, canvas.width, canvas.height, visionConfig.uploadJpegQuality);
    const imageMeta = normalizeImageMeta(canvas) || await imageMetaFromDataUrl(image);
    const imageRef = await persistPhotoDataUrl(image, "browser-camera");
    resetCaptureRecognition({ image, imageRef, imageMeta, preprocessingMs: performance.now() - preprocessStartedAt, provider: "local-image" });
    warmCaptureDetectionModel();
    state.cameraOn = false;
    persist();
    render();
    showToast("照片已拍摄，正在分析");
    queueCaptureAnalysis();
  } catch (error) {
    state.cameraOn = false;
    persist();
    render();
    showToast(error.message || "拍照处理失败");
  }
}

function stopCamera() {
  if (cameraStream) {
    for (const track of cameraStream.getTracks()) track.stop();
    cameraStream = null;
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

document.addEventListener("click", (event) => {
  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    setState({ activeTab: tabButton.dataset.tab });
    return;
  }

  const captureSpaceButton = event.target.closest("[data-capture-space]");
  if (captureSpaceButton) {
    selectCaptureSpace(captureSpaceButton.dataset.captureSpace);
    return;
  }

  const addSpaceTabButton = event.target.closest("[data-add-space-tab]");
  if (addSpaceTabButton) {
    promptAddRoom();
    return;
  }

  const editRoomButton = event.target.closest("[data-edit-room]");
  if (editRoomButton) {
    promptRenameRoom(editRoomButton.dataset.editRoom);
    return;
  }

  const roomButton = event.target.closest("[data-room]");
  if (roomButton) {
    const room = getRoom(roomButton.dataset.room);
    const firstPlace = getRootPlaces(room.id)[0] || room.places[0];
    setState({ activeRoomId: room.id, activePlaceId: firstPlace?.id || null });
    return;
  }

  const placeButton = event.target.closest("[data-place]");
  if (placeButton) {
    const place = getPlace(placeButton.dataset.place);
    if (!place) return;
    setState({ activeRoomId: place.roomId, activePlaceId: place.id });
    return;
  }

  if (event.target.closest("[data-search]")) {
    performSearch();
    return;
  }

  if (event.target.closest("[data-add-room]")) {
    const addRoomButton = event.target.closest("[data-add-room]");
    const scope = addRoomButton.closest("[data-space-tabs-shell], .room-list, .topbar") || document;
    addRoom(scope.querySelector("[data-new-room-name]")?.value);
    return;
  }

  if (event.target.closest("[data-add-place]")) {
    addPlace(state.activeRoomId, document.querySelector("[data-new-place-name]")?.value);
    return;
  }

  const addChildPlaceButton = event.target.closest("[data-add-child-place]");
  if (addChildPlaceButton) {
    const parentId = addChildPlaceButton.dataset.addChildPlace;
    const parent = getPlaceById(parentId);
    const input = [...document.querySelectorAll("[data-new-child-place-name]")]
      .find((entry) => entry.dataset.newChildPlaceName === parentId);
    if (parent) addPlace(parent.roomId, input?.value, parent.id);
    return;
  }

  const scanInsideButton = event.target.closest("[data-scan-inside]");
  if (scanInsideButton) {
    scanInsideItem(scanInsideButton.dataset.scanInside);
    return;
  }

  const scanCandidateInsideButton = event.target.closest("[data-scan-candidate-inside]");
  if (scanCandidateInsideButton) {
    scanInsideCandidate(scanCandidateInsideButton.dataset.scanCandidateInside);
    return;
  }

  const previousCandidateButton = event.target.closest("[data-candidate-prev]");
  if (previousCandidateButton) {
    moveCandidateCard(previousCandidateButton.dataset.candidatePrev, -1);
    return;
  }

  const nextCandidateButton = event.target.closest("[data-candidate-next]");
  if (nextCandidateButton) {
    moveCandidateCard(nextCandidateButton.dataset.candidateNext, 1);
    return;
  }

  const deleteCandidateButton = event.target.closest("[data-delete-candidate]");
  if (deleteCandidateButton) {
    deleteCandidate(deleteCandidateButton.dataset.deleteCandidate);
    return;
  }

  const restoreCandidateButton = event.target.closest("[data-restore-candidate]");
  if (restoreCandidateButton) {
    restoreCandidate(restoreCandidateButton.dataset.restoreCandidate);
    return;
  }

  const addCandidateReminderButton = event.target.closest("[data-add-candidate-reminder]");
  if (addCandidateReminderButton) {
    openCandidateReminderEditor(addCandidateReminderButton.dataset.addCandidateReminder);
    return;
  }

  const editCandidateReminderButton = event.target.closest("[data-edit-candidate-reminder]");
  if (editCandidateReminderButton) {
    openCandidateReminderEditor(editCandidateReminderButton.dataset.editCandidateReminder, editCandidateReminderButton.dataset.reminderId);
    return;
  }

  const deleteCandidateReminderButton = event.target.closest("[data-delete-candidate-reminder]");
  if (deleteCandidateReminderButton) {
    deleteCandidateReminder(deleteCandidateReminderButton.dataset.deleteCandidateReminder, deleteCandidateReminderButton.dataset.reminderId);
    return;
  }

  const toggleCandidateDetailsButton = event.target.closest("[data-toggle-candidate-details]");
  if (toggleCandidateDetailsButton) {
    toggleCandidatePanel(toggleCandidateDetailsButton.dataset.toggleCandidateDetails, "details");
    return;
  }

  const toggleCandidateBoxButton = event.target.closest("[data-toggle-candidate-box]");
  if (toggleCandidateBoxButton) {
    toggleCandidatePanel(toggleCandidateBoxButton.dataset.toggleCandidateBox, "box");
    return;
  }

  const datePickerButton = event.target.closest("[data-open-date-picker]");
  if (datePickerButton) {
    openCandidateDatePicker(datePickerButton.dataset.openDatePicker, datePickerButton.dataset.field);
    return;
  }

  if (event.target.closest("[data-close-date-modal]")) {
    closeCandidateDatePicker();
    return;
  }

  if (event.target.closest("[data-confirm-date-modal]")) {
    confirmCandidateDatePicker();
    return;
  }

  const dateBackdrop = event.target.closest("[data-date-modal-dismiss]");
  if (dateBackdrop && !event.target.closest("[data-date-modal]")) {
    closeCandidateDatePicker();
    return;
  }

  const monthButton = event.target.closest("[data-calendar-month]");
  if (monthButton && candidateDatePickerState) {
    updateCandidateDateDraft({ month: moveMonthKey(candidateDatePickerState.month, Number(monthButton.dataset.calendarMonth) || 0) });
    return;
  }

  const dayButton = event.target.closest("[data-calendar-day]");
  if (dayButton) {
    updateCandidateDateDraft({ date: dayButton.dataset.calendarDay, month: monthKeyFromIso(dayButton.dataset.calendarDay) });
    return;
  }

  const quickDateButton = event.target.closest("[data-date-quick]");
  if (quickDateButton) {
    updateCandidateDateDraft({
      date: quickDateButton.dataset.dateQuick,
      month: monthKeyFromIso(quickDateButton.dataset.dateQuick),
      ...(quickDateButton.dataset.timeQuick ? { time: quickDateButton.dataset.timeQuick } : {}),
      ...(quickDateButton.dataset.timeEnabled ? { hasTime: true } : {}),
    });
    return;
  }

  const clearCandidateDateButton = event.target.closest("[data-clear-candidate-date]");
  if (clearCandidateDateButton) {
    clearCandidateDate(clearCandidateDateButton.dataset.clearCandidateDate, clearCandidateDateButton.dataset.field);
    return;
  }

  const clearCandidateFieldButton = event.target.closest("[data-clear-candidate-field]");
  if (clearCandidateFieldButton) {
    updateCandidate(clearCandidateFieldButton.dataset.clearCandidateField, clearCandidateFieldButton.dataset.field, "");
    return;
  }

  const example = event.target.closest("[data-example]");
  if (example) {
    state.query = example.dataset.example;
    persist();
    performSearch();
    return;
  }

  if (event.target.closest("[data-scan]")) {
    scanCurrentPlace();
    return;
  }

  if (event.target.closest("[data-confirm-all]")) {
    confirmCandidates();
    return;
  }

  const catalogCandidateButton = event.target.closest("[data-apply-catalog-candidate]");
  if (catalogCandidateButton) {
    applyCatalogCandidate(
      catalogCandidateButton.dataset.applyCatalogCandidate,
      Number(catalogCandidateButton.dataset.candidateRank) || 0,
    );
    return;
  }

  const candidateToggle = event.target.closest("[data-candidate-toggle]");
  if (candidateToggle) {
    toggleCandidate(candidateToggle.dataset.candidateToggle);
    return;
  }

  const candidateSelect = event.target.closest("[data-candidate-select]");
  if (candidateSelect && (candidateSelect.classList.contains("candidate-pin") || !event.target.closest("input, select, button"))) {
    selectCandidate(candidateSelect.dataset.candidateSelect);
    return;
  }

  const foundButton = event.target.closest("[data-found]");
  if (foundButton) {
    const itemId = foundButton.dataset.found;
    state.items = state.items.map((item) => item.id === itemId ? { ...item, updatedAt: new Date().toISOString().slice(0, 10) } : item);
    persist();
    render();
    showToast("已更新最后确认时间");
    return;
  }

  const missingButton = event.target.closest("[data-missing]");
  if (missingButton) {
    const item = state.items.find((entry) => entry.id === missingButton.dataset.missing);
    if (item) {
      state.capture.roomId = item.roomId;
      state.capture.placeId = item.placeId;
      resetCaptureRecognition();
      state.activeTab = "capture";
      persist();
      render();
      showToast("重新扫描当前位置");
    }
    return;
  }

  if (event.target.closest("[data-camera-start]")) {
    startCamera();
    return;
  }

  if (event.target.closest("[data-native-photo-library]")) {
    importNativePhoto("library");
    return;
  }

  if (event.target.closest("[data-camera-shot]")) {
    captureCameraFrame();
    return;
  }

  if (event.target.closest("[data-reset]")) {
    stopCamera();
    cancelReminderNotifications(state.items).catch(() => {});
    platform.storage.removeSnapshot();
    state = structuredClone(seedState);
    render();
    showToast("已清空本地数据");
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-query-input]")) {
    state.query = event.target.value;
    persist();
    return;
  }

  const candidateBoxField = event.target.closest("[data-candidate-box-field]");
  if (candidateBoxField) {
    updateCandidateBox(candidateBoxField.dataset.candidateBoxField, candidateBoxField.dataset.field, candidateBoxField.value);
    return;
  }

  if (event.target.matches("[data-date-reminder-title]")) {
    if (candidateDatePickerState?.mode === "reminder") {
      candidateDatePickerState.reminder = normalizeReminder({
        ...candidateDatePickerState.reminder,
        title: event.target.value,
      });
    }
    return;
  }

  if (event.target.matches("[data-date-custom-offset-amount]")) {
    if (candidateDatePickerState?.mode === "reminder") {
      candidateDatePickerState.reminder = normalizeReminder({
        ...candidateDatePickerState.reminder,
        customOffset: {
          ...candidateDatePickerState.reminder.customOffset,
          amount: event.target.value,
        },
      });
    }
    return;
  }

  const candidateField = event.target.closest("[data-candidate-field]");
  if (candidateField) {
    updateCandidate(candidateField.dataset.candidateField, candidateField.dataset.field, candidateField.value);
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.matches("[data-date-time-hour], [data-date-time-minute]")) {
    const hour = document.querySelector("[data-date-time-hour]")?.value || "09";
    const minute = document.querySelector("[data-date-time-minute]")?.value || "00";
    updateCandidateDateDraft({ time: `${hour}:${minute}` });
    return;
  }

  if (event.target.matches("[data-date-has-time]")) {
    updateCandidateDateDraft({ hasTime: event.target.checked });
    return;
  }

  if (event.target.matches("[data-date-offset]")) {
    updateCandidateDateDraft({ offset: event.target.value });
    return;
  }

  if (event.target.matches("[data-date-custom-offset-unit]")) {
    updateCandidateDateDraft({ customOffset: { unit: event.target.value } });
    return;
  }

  if (event.target.matches("[data-date-repeat]")) {
    updateCandidateDateDraft({ repeat: event.target.value });
    return;
  }

  const candidateBoxField = event.target.closest("[data-candidate-box-field]");
  if (candidateBoxField) {
    updateCandidateBox(candidateBoxField.dataset.candidateBoxField, candidateBoxField.dataset.field, candidateBoxField.value);
    return;
  }

  const candidateField = event.target.closest("[data-candidate-field]");
  if (candidateField) {
    updateCandidate(candidateField.dataset.candidateField, candidateField.dataset.field, candidateField.value);
    return;
  }

  if (event.target.matches("[data-capture-room]")) {
    const room = getRoom(event.target.value);
    resetCaptureRecognition({ roomId: room.id, placeId: getRootPlaces(room.id)[0]?.id || room.places[0]?.id || null });
    persist();
    render();
    return;
  }

  if (event.target.matches("[data-file-input]")) {
    const file = event.target.files?.[0];
    if (!file) return;
    const input = event.target;
    state.capture = {
      ...state.capture,
      candidates: [],
      activeCandidateId: null,
      recognitionStatus: "loading",
      recognitionError: "",
      provider: "local-image",
    };
    render();
    showToast("正在处理高清照片");
    try {
      const preprocessStartedAt = performance.now();
      const image = await prepareUploadedImage(file);
      const imageMeta = await imageMetaFromDataUrl(image);
      const imageRef = await persistPhotoDataUrl(image, "file-input");
      resetCaptureRecognition({ image, imageRef, imageMeta, preprocessingMs: performance.now() - preprocessStartedAt, provider: "local-image" });
      warmCaptureDetectionModel();
      persist();
      render();
      showToast("照片已载入，正在分析");
      queueCaptureAnalysis();
    } catch (error) {
      state.capture = {
        ...state.capture,
        candidates: [],
        activeCandidateId: null,
        recognitionStatus: "error",
        recognitionError: error.message || "照片处理失败",
        provider: "local-image",
      };
      persist();
      render();
      showToast(error.message || "照片处理失败");
    } finally {
      input.value = "";
    }
  }
});

document.addEventListener("pointerdown", (event) => {
  const resizeHandle = event.target.closest("[data-candidate-resize]");
  if (resizeHandle) {
    startCandidateDrag(event, resizeHandle, { mode: "resize", handle: resizeHandle.dataset.resizeHandle });
    return;
  }
  const boxFrame = event.target.closest("[data-candidate-drag]");
  if (boxFrame) startCandidateDrag(event, boxFrame, { mode: "move" });
});

document.addEventListener("pointermove", moveCandidateDrag);
document.addEventListener("pointerup", finishCandidateDrag);
document.addEventListener("pointercancel", finishCandidateDrag);
window.addEventListener("resize", hydrateCandidatePins);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches("[data-query-input]")) {
    performSearch();
  }
});

window.addEventListener("beforeunload", stopCamera);

render();
performSearch();
hydratePlatformState();
warmVisionModels();
