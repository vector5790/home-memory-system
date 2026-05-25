const STORAGE_KEY = "home-memory-system:v3";
const today = new Date();

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
  appVersion: "20260525-grounding-dino-normalized-index",
  assetVersion: "20260519-grounded-sam",
  remoteTransformersModule: "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2",
  localTransformersModule: "/vendor/transformers/transformers.min.js",
  localManifest: "/vendor/vision-manifest.json",
  localModelPath: "/vendor/models/",
  allowRemoteVisionModels: false,
  catalogIndex: "/data/vision-index.household-cn.grounding-dino-clip.json",
  catalogIndexFallback: "/data/vision-index.generated.json",
  groundingDinoModel: "onnx-community/grounding-dino-tiny-ONNX",
  detectionModel: "Xenova/owlvit-base-patch32",
  samModel: "Xenova/slimsam-77-uniform",
  catalogModel: "Xenova/clip-vit-base-patch32",
  detectionThreshold: 0.05,
  groundingThreshold: 0,
  detectionNameThreshold: 0.11,
  catalogThreshold: 0.26,
  catalogMarginThreshold: 0.03,
  catalogTopK: 5,
  maxDetectedObjects: 28,
  maxModelDetections: 48,
  detectionNmsIou: 0.85,
  maxUploadDimension: 1024,
  maxUploadDataUrlLength: 850000,
  uploadJpegQuality: 0.82,
  uploadDecodeTimeoutMs: 18000,
  maxSamRefinements: 8,
  groundingPromptBatchSize: 20,
  owlVitLabelLimit: 48,
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
    candidates: [],
    activeCandidateId: null,
    recognitionStatus: "idle",
    recognitionError: "",
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
let recognitionRunId = 0;
let visionAssetModePromise = null;
let transformersModulePromise = null;
let groundingDinoDetectorPromise = null;
let smallModelDetectorPromise = null;
let samSegmenterPromise = null;
let catalogClassifierPromise = null;
let catalogFeatureExtractorPromise = null;
let catalogIndexPromise = null;
let catalogIndexWarningShown = false;
let persistWarningShown = false;

const app = document.querySelector("#app");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seedState);
    const parsed = JSON.parse(raw);
    const loaded = { ...structuredClone(seedState), ...parsed, cameraOn: false };
    loaded.rooms = normalizeRooms(loaded.rooms);
    loaded.items = Array.isArray(loaded.items) ? loaded.items : [];
    loaded.capture = normalizeCaptureState({ ...structuredClone(seedState.capture), ...(parsed.capture || {}) });
    return loaded;
  } catch {
    return structuredClone(seedState);
  }
}

function createPersistSnapshot(options = {}) {
  const snapshot = structuredClone(state);
  snapshot.cameraOn = false;
  if (options.omitCaptureImage && snapshot.capture) {
    snapshot.capture.image = null;
  }
  if (options.omitPlaceImages) {
    snapshot.rooms = snapshot.rooms.map((room) => ({
      ...room,
      places: (room.places || []).map((place) => ({ ...place, image: null })),
    }));
  }
  return snapshot;
}

function persist() {
  const attempts = [
    createPersistSnapshot(),
    createPersistSnapshot({ omitCaptureImage: true }),
    createPersistSnapshot({ omitCaptureImage: true, omitPlaceImages: true }),
  ];
  let lastError = null;
  for (const snapshot of attempts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      return true;
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

function setState(patch) {
  state = { ...state, ...patch };
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
    note: "上传照片后自动生成",
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
    note: "由上传照片自动生成",
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

function updatePlaceImage(placeId, image) {
  if (!placeId || !image) return;
  state.rooms = state.rooms.map((room) => ({
    ...room,
    places: room.places.map((place) => (
      place.id === placeId ? { ...place, image } : place
    )),
  }));
}

function normalizeCaptureState(capture) {
  const hasUploadedImage = Boolean(capture.image);
  const provider = capture.provider === "real-image" ? "local-image" : capture.provider || "none";
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
  const activeCandidateId = candidates.some((candidate) => candidate.id === capture.activeCandidateId)
    ? capture.activeCandidateId
    : null;

  return {
    ...capture,
    candidates,
    activeCandidateId,
    recognitionStatus: capture.recognitionStatus || "idle",
    recognitionError: capture.recognitionError || "",
    provider,
  };
}

function resetCaptureRecognition(overrides = {}) {
  recognitionRunId += 1;
  state.capture = {
    ...state.capture,
    candidates: [],
    activeCandidateId: null,
    recognitionStatus: "idle",
    recognitionError: "",
    provider: "none",
    ...overrides,
  };
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function clampBox(box = {}) {
  const width = clampNumber(box.w ?? 20, 6, 100);
  const height = clampNumber(box.h ?? 14, 6, 100);
  return {
    x: clampNumber(box.x ?? 10, 0, 100 - width),
    y: clampNumber(box.y ?? 10, 0, 100 - height),
    w: width,
    h: height,
  };
}

function normalizeCandidate(candidate = {}, index = 0, provider = "local-image") {
  const name = String(candidate.name || `候选物品 ${index + 1}`).trim();
  const category = categoryLabels[candidate.category] ? candidate.category : "daily";
  const qty = Math.max(1, Math.round(Number(candidate.qty) || 1));
  const confidence = clampNumber(candidate.confidence ?? 0.75, 0, 1);

  return {
    id: candidate.id || `candidate-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    name,
    aliases: Array.isArray(candidate.aliases) ? candidate.aliases : [],
    category,
    qty,
    expireAt: candidate.expireAt || "",
    nextAt: candidate.nextAt || "",
    nextLabel: candidate.nextLabel || "",
    container: candidate.container || "",
    box: clampBox(candidate.box),
    confidence,
    selected: candidate.selected !== false,
    source: candidate.source || provider,
    namingStatus: candidate.namingStatus || "done",
    detectionLabel: candidate.detectionLabel || "",
    suggestedName: candidate.suggestedName || "",
    catalogId: candidate.catalogId || "",
    categoryId: candidate.categoryId || candidate.catalogId || "",
    categoryPath: Array.isArray(candidate.categoryPath) ? candidate.categoryPath : [],
    categoryScore: Number.isFinite(Number(candidate.categoryScore)) ? Number(candidate.categoryScore) : null,
    categoryMargin: Number.isFinite(Number(candidate.categoryMargin)) ? Number(candidate.categoryMargin) : null,
    categoryIndexVersion: candidate.categoryIndexVersion || "",
    matchedSampleIds: Array.isArray(candidate.matchedSampleIds) ? candidate.matchedSampleIds : [],
    providerId: candidate.providerId || candidate.source || provider,
    providerClass: candidate.providerClass || "",
    modelId: candidate.modelId || "",
    assetVersion: candidate.assetVersion || "",
    fallbackReason: candidate.fallbackReason || "",
    timings: candidate.timings && typeof candidate.timings === "object" ? candidate.timings : {},
    edited: Boolean(candidate.edited),
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

function normalizeDetectionLabel(label) {
  return normalizeText(label)
    .replace(/^(a|an|the)\s+/, "")
    .replace(/[.。]+$/g, "");
}

function getDetectionLabelMeta(label) {
  const normalized = normalizeDetectionLabel(label);
  return getDetectionLabelEntries().find((entry) => normalizeDetectionLabel(entry.label) === normalized)
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
      nextAt: existing.nextAt,
      nextLabel: existing.nextLabel,
      container: existing.container,
      box: existing.box,
      edited: true,
    }
    : {};
  return {
    ...incoming,
    ...preserveUserFields,
    id: existing.id,
    selected: existing.selected,
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
      module.env.useBrowserCache = true;

      return { ...module, runtimeMode };
    })();
  }
  return transformersModulePromise;
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
      .then(({ pipeline }) => pipeline("zero-shot-object-detection", visionConfig.detectionModel, { dtype: "q8" }))
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
      const processor = await AutoProcessor.from_pretrained(visionConfig.samModel);
      const model = await SamModel.from_pretrained(visionConfig.samModel, { dtype: "q8" });
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
    loadTransformersRuntime().catch((error) => {
      console.info("Vision runtime prewarm skipped.", error);
    });
  }, 900);
}

function warmCaptureDetectionModel() {
  window.setTimeout(async () => {
    const assetMode = await getVisionAssetMode();
    if (!assetMode.local) return;
    if (assetMode.groundingReady) {
      getGroundingDinoDetector().catch((error) => {
        console.info("Grounding DINO prewarm skipped.", error);
      });
      return;
    }
    if (assetMode.owlReady) {
      getSmallModelDetector().catch((error) => {
        console.info("OWL-ViT prewarm skipped.", error);
      });
    }
  }, 120);
}

async function getCatalogClassifier() {
  if (!catalogClassifierPromise) {
    catalogClassifierPromise = loadTransformersRuntime()
      .then(async ({ pipeline, runtimeMode }) => {
        if (!runtimeMode.catalogReady) return null;
        return pipeline("zero-shot-image-classification", visionConfig.catalogModel, { dtype: "q8" });
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
        return pipeline("image-feature-extraction", visionConfig.catalogModel, { dtype: "q8" });
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
    catalogIndexPromise = loadCatalogEmbeddingIndex()
      .catch(() => ({ entries: [] }));
  }
  return catalogIndexPromise;
}

async function fetchJsonIndex(url) {
  if (!url) return null;
  const response = await fetch(`${url}?v=${visionConfig.assetVersion}`, { cache: "no-store" });
  return response.ok ? response.json() : null;
}

async function loadCatalogEmbeddingIndex() {
  const primary = await fetchJsonIndex(visionConfig.catalogIndex).catch(() => null);
  const normalizedPrimary = normalizeCatalogEmbeddingIndex(primary, visionConfig.catalogIndex);
  if (normalizedPrimary.entries.length) return normalizedPrimary;

  const fallback = await fetchJsonIndex(visionConfig.catalogIndexFallback).catch(() => null);
  return normalizeCatalogEmbeddingIndex(fallback, visionConfig.catalogIndexFallback);
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

async function embedImageDataUrl(dataUrl) {
  const extractor = await getCatalogFeatureExtractor();
  if (!extractor) return null;
  const output = await extractor(dataUrl);
  const values = output?.data || output?.[0]?.data;
  return values ? Array.from(values) : null;
}

async function matchCatalogFromEmbeddingIndex(source, box) {
  const index = await getCatalogEmbeddingIndex();
  if (!index.entries?.length) return null;
  const embedding = await embedImageDataUrl(cropImageToDataUrl(source, box));
  if (!embedding) return null;

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
  if (!best || best.score < threshold || margin < marginThreshold) return null;
  return {
    name: best.displayName,
    category: best.appCategory,
    confidence: clampNumber(best.score, 0, 1),
    catalogId: best.categoryId,
    categoryId: best.categoryId,
    categoryPath: best.categoryPath,
    categoryScore: best.score,
    categoryMargin: margin,
    categoryIndexVersion: index.version || "",
    matchedSampleIds: best.matchedSampleIds,
  };
}

function aggregateCatalogMatchesByLeaf(entries) {
  const leaves = new Map();
  for (const entry of entries) {
    const current = leaves.get(entry.categoryId);
    if (!current || entry.score > current.score) {
      leaves.set(entry.categoryId, {
        categoryId: entry.categoryId,
        displayName: entry.displayName,
        appCategory: entry.appCategory,
        categoryPath: entry.categoryPath,
        score: entry.score,
        matchedSampleIds: entry.matchedSampleIds?.length ? entry.matchedSampleIds : [entry.sampleId].filter(Boolean),
      });
    } else if (current) {
      for (const sampleId of entry.matchedSampleIds || [entry.sampleId]) {
        if (sampleId && !current.matchedSampleIds.includes(sampleId)) current.matchedSampleIds.push(sampleId);
      }
    }
  }
  return [...leaves.values()].sort((a, b) => b.score - a.score);
}

function detectionBoxToPercent(box, imageWidth, imageHeight) {
  if (Array.isArray(box)) {
    const [xMin = 0, yMin = 0, xMax = 1, yMax = 1] = box;
    return clampBox({
      x: (xMin / imageWidth) * 100,
      y: (yMin / imageHeight) * 100,
      w: ((xMax - xMin) / imageWidth) * 100,
      h: ((yMax - yMin) / imageHeight) * 100,
    });
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
  });
}

function detectionToCandidate(detection, index, source, provider, threshold) {
  const meta = getDetectionLabelMeta(detection.label);
  const box = detectionBoxToPercent(detection.box, source.naturalWidth, source.naturalHeight);
  const rawScore = Number(detection.score) || threshold;
  const score = clampNumber(rawScore + (isStorageDetectionLabel(detection.label) ? 0.035 : 0), threshold, 0.99);
  const canUseLabelName = (meta.isCatalogItem || meta.name) && score >= visionConfig.detectionNameThreshold;
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
    catalogId: canUseLabelName && meta.id ? meta.id : "",
    namingStatus: "loading",
    source: provider,
    providerId: provider,
    providerClass: provider.startsWith("local-") ? "real-local-model" : "fallback",
    modelId: provider.startsWith("local-grounding-dino") ? visionConfig.groundingDinoModel : visionConfig.detectionModel,
    assetVersion: visionConfig.assetVersion,
    timings: detection.timings || {},
  };
}

function nmsDetections(detections, source, iouThreshold, maxItems) {
  const selected = [];
  const sorted = (Array.isArray(detections) ? detections : [])
    .filter((detection) => detection?.box)
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
  for (const detection of sorted) {
    const box = detectionBoxToPercent(detection.box, source.naturalWidth, source.naturalHeight);
    if (selected.some((existing) => boxIou(existing.box, box) >= iouThreshold)) continue;
    selected.push({ detection, box });
    if (selected.length >= maxItems) break;
  }
  return selected.map((entry) => entry.detection);
}

async function runZeroShotDetector({ image, source, detector, provider, threshold }) {
  const labels = getDetectionLabelEntries().map((entry) => entry.label);
  const detectionStart = performance.now();
  const detections = detector?.kind === "grounding-dino"
    ? await runGroundingDinoDetector({ image, source, detector, labels, threshold })
    : await runPipelineObjectDetector({ image, detector, labels: labels.slice(0, visionConfig.owlVitLabelLimit), threshold });
  const detectionMs = Math.round((performance.now() - detectionStart) * 1000) / 1000;
  const filtered = (Array.isArray(detections) ? detections : [])
    .filter((detection) => detection?.box && Number(detection.score) >= threshold)
    .sort((a, b) => Number(b.score) - Number(a.score));
  return nmsDetections(filtered, source, visionConfig.detectionNmsIou, visionConfig.maxModelDetections)
    .map((detection, index) => detectionToCandidate({
      ...detection,
      timings: { detectionMs },
    }, index, source, provider, threshold));
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
  for (const labelChunk of chunkArray(labels, 1)) {
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

async function runGroundingDinoDetector({ image, source, detector, labels, threshold }) {
  const rawImage = await readRawVisionImage(detector, image);
  const detections = [];
  const batches = chunkArray(labels.map((label) => normalizeDetectionLabel(label)).filter(Boolean), visionConfig.groundingPromptBatchSize);

  for (const labelBatch of batches) {
    const text = `${labelBatch.join(". ")}.`;
    const inputs = await detector.processor(rawImage, text);
    const outputs = await detector.model(inputs);
    const processed = detector.processor.post_process_grounded_object_detection
      ? detector.processor.post_process_grounded_object_detection(outputs, inputs.input_ids, {
        box_threshold: threshold,
        text_threshold: threshold,
        target_sizes: [[source.naturalHeight, source.naturalWidth]],
      })
      : [];
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
      });
    }
  }
  return detections;
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
  const segmenter = await getSamSegmenter();
  if (!segmenter || !candidates.length) {
    return { provider, candidates };
  }

  try {
    const rawImage = segmenter.RawImage.fromURL
      ? await segmenter.RawImage.fromURL(image)
      : await segmenter.RawImage.read(image);
    const refined = [];
    for (const [index, candidate] of candidates.entries()) {
      if (index >= visionConfig.maxSamRefinements) {
        refined.push(candidate);
        continue;
      }
      // SAM runs after detection and only tightens regions; a failure must not replace detector geometry.
      refined.push(await refineCandidateWithSam(segmenter, rawImage, source, candidate).catch(() => candidate));
    }
    return {
      provider: `${provider}+sam`,
      candidates: refined,
    };
  } catch (error) {
    console.info("SAM refinement skipped.", error);
    return { provider, candidates };
  }
}

function cropImageToDataUrl(source, box) {
  const x = Math.max(0, Math.round((box.x / 100) * source.naturalWidth));
  const y = Math.max(0, Math.round((box.y / 100) * source.naturalHeight));
  const width = Math.max(1, Math.round((box.w / 100) * source.naturalWidth));
  const height = Math.max(1, Math.round((box.h / 100) * source.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(width, source.naturalWidth - x);
  canvas.height = Math.min(height, source.naturalHeight - y);
  const context = canvas.getContext("2d");
  context.drawImage(source, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
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

async function recognizeWithSmallModel(image) {
  const source = await loadImage(image);
  const assetMode = await getVisionAssetMode();
  const detectorAttempts = [];
  if (assetMode.groundingReady) {
    detectorAttempts.push({
      getDetector: getGroundingDinoDetector,
      provider: "local-grounding-dino",
      threshold: visionConfig.groundingThreshold,
    });
  }
  if (assetMode.owlReady) {
    detectorAttempts.push({
      getDetector: getSmallModelDetector,
      provider: "local-owlvit",
      threshold: visionConfig.detectionThreshold,
    });
  }
  if (!detectorAttempts.length) {
    throw new Error("本地 OWL-ViT/Grounding DINO 模型未安装");
  }

  let lastError = null;
  for (const attempt of detectorAttempts) {
    try {
      const detector = await attempt.getDetector();
      const candidates = await runZeroShotDetector({
        image,
        source,
        detector,
        provider: attempt.provider,
        threshold: attempt.threshold,
      });
      const detected = dedupeCandidates(candidates, visionConfig.maxDetectedObjects, 0.34);
      if (!detected.length) continue;
      const refined = await refineCandidatesWithSam(image, source, detected, attempt.provider);
      return {
        provider: refined.provider,
        candidates: renumberUnknownCandidates(refined.candidates),
      };
    } catch (error) {
      lastError = error;
      console.info(`${attempt.provider} unavailable.`, error);
    }
  }

  throw lastError || new Error("本地主体识别暂不可用");
}

async function recognizeWithCloudApi(context) {
  const response = await fetch("/api/recognize", {
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

async function prepareUploadedImage(file) {
  if (!isImageFile(file)) {
    throw new Error("请选择图片文件。");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await withTimeout(
      loadImage(url),
      visionConfig.uploadDecodeTimeoutMs,
      "照片解码超时，请换一张 JPEG/PNG 或先裁剪后再上传。",
    ).catch(async (error) => {
      if (!window.createImageBitmap) throw error;
      const bitmap = await withTimeout(
        createImageBitmap(file, { imageOrientation: "from-image" }),
        visionConfig.uploadDecodeTimeoutMs,
        "照片解码超时，请换一张 JPEG/PNG 或先裁剪后再上传。",
      );
      return bitmap;
    });
    try {
      return await resizeImageSourceToDataUrl(image);
    } finally {
      image.close?.();
    }
  } catch (error) {
    if (/decode|解码|图片无法读取|source image/i.test(error.message || "")) {
      throw new Error("这张图片浏览器无法解码；如果是 HEIC/HEIF，请先导出为 JPEG/PNG 后再上传。");
    }
    throw error;
  } finally {
    URL.revokeObjectURL(url);
  }
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

async function detectCandidatesFromLocalImage(image, requestedProvider = "local-small-model") {
  const smallRecognition = await recognizeWithSmallModel(image)
    .catch((error) => {
      console.info("Small model unavailable, falling back to local image proposals.", error);
      return null;
    });

  let provider = smallRecognition?.provider || requestedProvider;
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

  return { provider, candidates };
}

async function recognizeWithLocalImage({ image }) {
  if (!image) throw new Error("请先上传或拍摄储物点照片。");
  const recognition = await detectCandidatesFromLocalImage(image);
  return {
    ...recognition,
    candidates: renumberUnknownCandidates(recognition.candidates),
  };
}

function refineNameByPosition(name, box) {
  if (name === "音响") {
    if (box.x + box.w / 2 < 42) return "左音箱";
    if (box.x + box.w / 2 > 58) return "右音箱";
  }
  if (name === "音箱面罩") {
    if (box.x + box.w / 2 < 42) return "左音箱面罩";
    if (box.x + box.w / 2 > 58) return "右音箱面罩";
  }
  return name;
}

async function resolveCandidateName(candidate, index, sourceImage) {
  if (candidate.edited) return { ...candidate, namingStatus: "done" };

  if (candidate.suggestedName) {
    return {
      ...candidate,
      name: refineNameByPosition(candidate.suggestedName, candidate.box),
      namingStatus: "done",
    };
  }

  const embeddingIndex = await getCatalogEmbeddingIndex();
  if (embeddingIndex.entries?.length) {
    const source = await loadImage(sourceImage);
    const catalogMatch = await matchCatalogFromEmbeddingIndex(source, candidate.box).catch(() => null);
    if (catalogMatch) {
      return {
        ...candidate,
        name: refineNameByPosition(catalogMatch.name, candidate.box),
        category: catalogMatch.category,
        confidence: Math.max(candidate.confidence, catalogMatch.confidence),
        catalogId: catalogMatch.catalogId,
        categoryId: catalogMatch.categoryId || catalogMatch.catalogId,
        categoryPath: catalogMatch.categoryPath || [],
        categoryScore: catalogMatch.categoryScore,
        categoryMargin: catalogMatch.categoryMargin,
        categoryIndexVersion: catalogMatch.categoryIndexVersion,
        matchedSampleIds: catalogMatch.matchedSampleIds || [],
        source: `${candidate.source}+embedding`,
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

async function nameDetectedCandidates(image, candidates, onProgress) {
  const minimumAnimation = new Promise((resolve) => setTimeout(resolve, 360));
  await minimumAnimation;
  const named = [];
  for (let index = 0; index < candidates.length; index += 1) {
    const resolved = await resolveCandidateName(candidates[index], index, image);
    named.push(resolved);
    onProgress?.([...named, ...candidates.slice(index + 1)]);
  }
  return named;
}

function providerLabel(provider) {
  if (!provider) return "未识别";
  const name = String(provider);
  if (name === "none") return "等待照片";
  if (name === "local-mock") return "本地演示";
  if (name.endsWith("-fallback")) return "本地降级候选";
  if (name.endsWith("+sam")) return `${providerLabel(name.replace("+sam", ""))} + SAM`;
  if (name.includes("+regions")) return `${providerLabel(name.split("+")[0])} + 区域补全`;
  if (name.startsWith("local-grounding-dino")) return "本地 Grounding DINO";
  if (name.startsWith("local-owlvit")) return "本地 OWL-ViT";
  if (name.startsWith("local-small-model")) return "本地小模型";
  if (name.startsWith("browser-grounding-dino") || name.startsWith("browser-owlvit") || name.startsWith("browser-small-model")) return "远程视觉模型已禁用";
  if (name === "local-image") return "本地候选区域";
  if (name === "cloud-vlm" || name.startsWith("openai:")) return "云端大模型";
  return name;
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

function dueStatus(dateText) {
  const days = daysUntil(dateText);
  if (days === null) return { label: "未设置", cls: "" };
  if (days < 0) return { label: `已超 ${Math.abs(days)} 天`, cls: "danger" };
  if (days <= 7) return { label: `${days} 天后`, cls: "danger" };
  if (days <= 30) return { label: `${days} 天后`, cls: "warn" };
  return { label: `${days} 天后`, cls: "good" };
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

function styleCandidatePin(box, layoutOrIndex = 0) {
  const centerX = clampNumber(box.x + box.w / 2, 2, 98);
  const centerY = clampNumber(box.y + box.h / 2, 2, 98);
  const layout = typeof layoutOrIndex === "object" && layoutOrIndex
    ? layoutOrIndex
    : null;
  if (!layout) {
    const fallbackRight = centerX < 62;
    const fallbackX = fallbackRight ? 46 : -124;
    const fallbackY = centerY < 50 ? 18 : -44;
    const metrics = getPinLineMetrics({ x: fallbackX, y: fallbackY }, { width: 96, height: 30 });
    return `left:${centerX}%;top:${centerY}%;--label-x:${fallbackX}px;--label-y:${fallbackY}px;--line-angle:${metrics.angle}deg;--line-length:${metrics.length}px`;
  }
  return `left:${layout.x}%;top:${layout.y}%;--label-x:${layout.labelX}px;--label-y:${layout.labelY}px;--line-angle:${layout.lineAngle}deg;--line-length:${layout.lineLength}px`;
}

function render() {
  app.innerHTML = `
    <div class="app">
      ${renderTopbar()}
      <div class="app-grid">
        ${renderSidebar()}
        <main class="main-panel">
          ${renderMain()}
        </main>
        ${renderInsights()}
      </div>
      <div class="toast" id="toast"></div>
    </div>
  `;
  hydrateCamera();
  hydrateCandidatePins();
}

function renderTopbar() {
  const tabs = [
    { id: "find", label: "查找", icon: icons.search },
    { id: "map", label: "照片地图", icon: icons.map },
    { id: "capture", label: "AI录入", icon: icons.scan },
    { id: "reminders", label: "提醒", icon: icons.bell },
  ];
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">${icons.home}</div>
        <div>
          <h1>家忆 Home Memory</h1>
          <span>${state.items.length} 件物品 · ${getAllPlaces().length} 个储物点</span>
        </div>
      </div>
      <nav class="nav-tabs" aria-label="主导航">
        ${tabs.map((tab) => `
          <button class="tab-btn ${state.activeTab === tab.id ? "active" : ""}" data-tab="${tab.id}">
            ${tab.icon}<span>${tab.label}</span>
          </button>
        `).join("")}
      </nav>
      <div class="top-actions">
        <button class="secondary-btn" data-tab="capture">${icons.plus}<span>新增</span></button>
        <button class="icon-btn" data-reset title="清空本地数据" aria-label="清空本地数据">${icons.rotate}</button>
      </div>
    </header>
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
        <div class="quick-add-row">
          <input class="field compact" data-new-room-name placeholder="新增空间" />
          <button class="secondary-btn" data-add-room>${icons.plus}<span>添加</span></button>
        </div>
      </div>
      <div class="storage-list">
        ${placeRows.length ? placeRows.map(({ place, depth }) => `
          <button class="place-chip depth-${Math.min(depth, 3)} ${state.activePlaceId === place.id ? "active" : ""}" data-place="${place.id}" style="--place-depth:${depth}">
            <span>${escapeHtml(place.shortName)}</span>
            <span class="small-muted">${getItemsInPlaceTree(place.id).length} 件</span>
          </button>
        `).join("") : `<p class="empty-state compact">还没有储物点。上传照片识别后会自动生成，也可以手动添加。</p>`}
        <div class="quick-add-row">
          <input class="field compact" data-new-place-name placeholder="新增储物点" />
          <button class="secondary-btn" data-add-place>${icons.plus}<span>添加</span></button>
        </div>
      </div>
    </aside>
  `;
}

function renderMain() {
  if (state.activeTab === "map") return renderMapView();
  if (state.activeTab === "capture") return renderCaptureView();
  if (state.activeTab === "reminders") return renderReminderView();
  return renderFindView();
}

function renderMapView() {
  const room = getRoom();
  const place = getPlace();
  if (!place) {
    return `
      <section class="panel">
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
                <p class="panel-subtitle">上传当前空间照片后，系统会生成主体标注和第一个照片点。</p>
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
  const due = item.expireAt ? dueStatus(item.expireAt) : item.nextAt ? dueStatus(item.nextAt) : null;
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
            <span>上传照片识别后自动生成</span>
          </div>
        </div>
      </div>
    `;
  }
  const items = getItemsByPlace(place.id);
  const childPlaces = getChildPlaces(place.id, place.roomId);
  const hasPhoto = Boolean(place.image);
  return `
    <div class="storage-stage ${place.kind} ${hasPhoto ? "has-photo" : ""}">
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
            const dateText = item.expireAt || item.nextAt;
            const due = dueStatus(dateText);
            return `
              <article class="result-row item-row">
                <div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <div class="meta-line">
                    <span class="badge ${item.category}">${categoryLabels[item.category]}</span>
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
  const timeText = item.expireAt ? `有效期至 ${formatDate(item.expireAt)}` : item.nextAt ? `${item.nextLabel || "下次处理"}：${formatDate(item.nextAt)}` : `上次确认 ${formatDate(item.updatedAt)}`;
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
  const hasImage = Boolean(state.capture.image);
  if (status === "detecting") return { label: "识别主体", cls: "warn", body: "正在检测照片里的主体区域" };
  if (status === "naming") return { label: "命名中", cls: "warn", body: "主体框已生成，正在匹配物品名称" };
  if (status === "loading") return { label: hasImage ? "分析中" : "处理照片", cls: "warn", body: hasImage ? "正在本地分析上传照片" : "正在解码并压缩上传照片" };
  if (status === "done") return { label: "已生成候选", cls: "good", body: `${candidates.length} 个候选，${candidates.filter((candidate) => candidate.selected).length} 个待入库` };
  if (status === "empty") return { label: "未发现候选", cls: "warn", body: "没有识别到可入库物品" };
  if (status === "error") return { label: "分析失败", cls: "danger", body: state.capture.recognitionError || "请稍后重试" };
  return {
    label: hasImage ? "等待分析" : "等待照片",
    cls: "",
    body: hasImage ? "上传照片已载入，等待本地图片分析" : "选择一张空间照片",
  };
}

function renderCaptureView() {
  const room = getCaptureRoom();
  const place = getCapturePlace() || makeVirtualPlace(room);
  const placeRows = getRoomPlacesInTree(room.id);
  const candidates = state.capture.candidates || [];
  const selectedCount = candidates.filter((candidate) => candidate.selected).length;
  const status = getRecognitionStatusMeta();
  const isLoading = ["loading", "detecting", "naming"].includes(state.capture.recognitionStatus);
  const canAnalyze = Boolean(state.capture.image) && !isLoading;
  return `
    <section class="panel">
      <div class="view-title-row">
        <div>
          <h2>AI录入</h2>
          <p>${escapeHtml(place.name)} · ${escapeHtml(status.body)}</p>
        </div>
        <div class="toolbar">
          <span class="status-pill ${status.cls}">${status.label}</span>
          <button class="secondary-btn" data-scan ${canAnalyze ? "" : "disabled"}>${icons.spark}<span>${isLoading ? "分析中" : state.capture.image ? "开始分析" : "先上传照片"}</span></button>
          <button class="primary-btn" data-confirm-all ${selectedCount && !isLoading ? "" : "disabled"}>${icons.check}<span>确认入库</span></button>
        </div>
      </div>
      <div class="capture-grid">
        <div>
          ${renderCaptureStage()}
          <div class="capture-controls">
            <select class="select-field" data-capture-room>
              ${state.rooms.map((room) => `<option value="${room.id}" ${state.capture.roomId === room.id ? "selected" : ""}>${escapeHtml(room.name)}</option>`).join("")}
            </select>
            <select class="select-field" data-capture-place ${room.places.length ? "" : "disabled"}>
              ${placeRows.length ? placeRows.map(({ place: roomPlace, depth }) => `<option value="${roomPlace.id}" ${state.capture.placeId === roomPlace.id ? "selected" : ""}>${escapeHtml(`${"  ".repeat(depth)}${depth ? "↳ " : ""}${roomPlace.name}`)}</option>`).join("") : `<option>识别后自动生成照片点</option>`}
            </select>
            <button class="secondary-btn file-input">${icons.box}<span>上传照片</span><input type="file" accept="image/*" data-file-input /></button>
            <button class="secondary-btn" data-camera-start>${icons.camera}<span>摄像头</span></button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">候选物品</h3>
              <p class="panel-subtitle">${escapeHtml(place.shortName)} · ${escapeHtml(providerLabel(state.capture.provider))}</p>
            </div>
            <span class="count-pill">${selectedCount}/${candidates.length}</span>
          </div>
          <div class="candidate-list">
            ${state.capture.recognitionError ? `<p class="capture-message danger">${escapeHtml(state.capture.recognitionError)}</p>` : ""}
            ${candidates.length ? candidates.map(renderCandidate).join("") : `<p class="empty-state">${state.capture.recognitionStatus === "empty" ? "没有候选区域" : state.capture.image ? "点击开始分析" : "等待照片"}</p>`}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCaptureStage() {
  const candidates = state.capture.candidates || [];
  const activeCandidate = candidates.find((candidate) => candidate.id === state.capture.activeCandidateId);
  const pinLayouts = layoutCandidatePins(candidates);
  return `
    <div class="capture-stage" data-capture-stage>
      ${state.cameraOn ? `<video id="cameraVideo" autoplay playsinline muted></video>` : state.capture.image ? `<img alt="上传的储物点照片" src="${state.capture.image}" />` : renderCapturePlaceholder()}
      ${state.cameraOn ? `<button class="primary-btn" data-camera-shot style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:3">${icons.camera}<span>拍照</span></button>` : ""}
      ${activeCandidate ? `
        <span class="candidate-outline ${activeCandidate.selected ? "selected" : "unselected"}" style="${styleBox(activeCandidate.box)}"></span>
      ` : ""}
      ${candidates.map((candidate, index) => {
        const isActive = state.capture.activeCandidateId === candidate.id;
        const isNaming = candidate.namingStatus === "loading";
        return `
        <button
          class="candidate-pin ${candidate.selected ? "selected" : "unselected"} ${isActive ? "active" : ""} ${isNaming ? "naming" : ""}"
          style="${styleCandidatePin(candidate.box, pinLayouts.get(candidate.id) || index)}"
          data-candidate-select="${candidate.id}"
          data-candidate-drag="${candidate.id}"
          aria-label="查看 ${escapeHtml(candidate.name)} 的主体框"
        >
          <span class="pin-dot"></span>
          <span class="pin-label">${isNaming ? "识别中" : escapeHtml(candidate.name)}</span>
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

function renderCandidate(candidate) {
  const isActive = state.capture.activeCandidateId === candidate.id;
  const isNaming = candidate.namingStatus === "loading";
  return `
    <article class="candidate-row ${candidate.selected ? "" : "muted"} ${isActive ? "active" : ""} ${isNaming ? "naming" : ""}" data-candidate-select="${candidate.id}">
      <div class="candidate-head">
        <label class="checkbox">
          <input type="checkbox" ${candidate.selected ? "checked" : ""} data-candidate-toggle="${candidate.id}" />
          <strong>${isNaming ? `${escapeHtml(candidate.name)} · 识别中` : escapeHtml(candidate.name)}</strong>
        </label>
        <div class="candidate-actions">
          <span class="status-pill good">${Math.round(candidate.confidence * 100)}%</span>
          <button class="secondary-btn compact-btn" data-scan-candidate-inside="${candidate.id}">${icons.camera}<span>拍内部</span></button>
        </div>
      </div>
      <div class="candidate-form">
        <input class="field" value="${escapeHtml(candidate.name)}" data-candidate-field="${candidate.id}" data-field="name" aria-label="物品名称" />
        <select class="select-field" data-candidate-field="${candidate.id}" data-field="category" aria-label="分类">
          ${Object.entries(categoryLabels).map(([key, label]) => `<option value="${key}" ${candidate.category === key ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <input class="field" type="number" min="1" value="${escapeHtml(candidate.qty || 1)}" data-candidate-field="${candidate.id}" data-field="qty" aria-label="数量" />
      </div>
      <div class="candidate-form secondary">
        <input class="field" type="date" value="${escapeHtml(candidate.expireAt || "")}" data-candidate-field="${candidate.id}" data-field="expireAt" aria-label="有效期" />
        <input class="field" type="date" value="${escapeHtml(candidate.nextAt || "")}" data-candidate-field="${candidate.id}" data-field="nextAt" aria-label="维护日期" />
        <input class="field" value="${escapeHtml(candidate.nextLabel || "")}" data-candidate-field="${candidate.id}" data-field="nextLabel" aria-label="维护事项" placeholder="维护事项" />
      </div>
      <input class="field" value="${escapeHtml(candidate.container || "")}" data-candidate-field="${candidate.id}" data-field="container" aria-label="容器" />
      <div class="box-control-grid" aria-label="定位框数值">
        ${["x", "y", "w", "h"].map((field) => `
          <label>
            <span>${field.toUpperCase()}</span>
            <input class="field" type="number" min="0" max="100" step="1" value="${Math.round(candidate.box[field])}" data-candidate-box-field="${candidate.id}" data-field="${field}" aria-label="${field.toUpperCase()} 坐标" />
          </label>
        `).join("")}
      </div>
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
        <span class="status-pill ${reminders.some((item) => dueStatus(item.expireAt || item.nextAt).cls === "danger") ? "danger" : "good"}">${reminders.length} 条</span>
      </div>
      <div class="reminder-list">
        ${reminders.map(renderReminder).join("") || `<p class="empty-state">暂无提醒</p>`}
      </div>
    </section>
  `;
}

function renderReminder(item) {
  const dateText = item.expireAt || item.nextAt;
  const due = dueStatus(dateText);
  const label = item.expireAt ? "有效期" : item.nextLabel || "下次处理";
  return `
    <article class="reminder-row">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="meta-line">
          <span class="badge ${item.category}">${categoryLabels[item.category]}</span>
          <span>${escapeHtml(label)}：${formatDate(dateText)}</span>
          <span>${escapeHtml(buildTrail(item))}</span>
        </div>
      </div>
      <span class="due-pill ${due.cls}">${due.label}</span>
    </article>
  `;
}

function getReminderItems() {
  return state.items
    .filter((item) => item.expireAt || item.nextAt)
    .map((item) => ({ ...item, dueIn: daysUntil(item.expireAt || item.nextAt) }))
    .filter((item) => item.dueIn <= 45)
    .sort((a, b) => a.dueIn - b.dueIn);
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

  const requestedProvider = "local-small-model";
  const runId = recognitionRunId + 1;
  recognitionRunId = runId;
  const scanImage = state.capture.image;
  state.capture = {
    ...state.capture,
    recognitionStatus: "detecting",
    recognitionError: "",
    candidates: [],
    activeCandidateId: null,
    provider: requestedProvider,
  };
  persist();
  render();

  const stillCurrent = () => recognitionRunId === runId && state.capture.image === scanImage;
  try {
    const recognition = await detectCandidatesFromLocalImage(scanImage, requestedProvider);
    if (!stillCurrent()) return;

    const provider = recognition.provider;
    let detected = recognition.candidates;

    if (!detected.length) {
      state.capture = {
        ...state.capture,
        candidates: [],
        activeCandidateId: null,
        recognitionStatus: "empty",
        recognitionError: "",
        provider,
      };
      persist();
      render();
      showToast("没有找到候选区域");
      return;
    }

    const place = ensureCapturePlace();
    updatePlaceImage(place.id, scanImage);
    detected = renumberUnknownCandidates(detected);
    state.capture = {
      ...state.capture,
      roomId: room.id,
      placeId: place.id,
      candidates: detected,
      activeCandidateId: null,
      recognitionStatus: "naming",
      recognitionError: "",
      provider,
    };
    persist();
    render();
    showToast(`已生成 ${detected.length} 个主体框，正在命名`);

    const namedCandidates = await nameDetectedCandidates(scanImage, detected, (partialCandidates) => {
      if (!stillCurrent()) return;
      state.capture = {
        ...state.capture,
        candidates: applyCandidateProgressUpdates(state.capture.candidates || [], partialCandidates, provider),
      };
      persist();
      render();
    });
    if (!stillCurrent()) return;
    state.capture = {
      ...state.capture,
      candidates: applyCandidateProgressUpdates(state.capture.candidates || [], namedCandidates, provider),
      activeCandidateId: state.capture.activeCandidateId || null,
      recognitionStatus: "done",
      recognitionError: "",
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
    };
    persist();
    render();
    showToast("分析失败，未修改库存");
  }
}

function confirmCandidates() {
  const selected = (state.capture.candidates || []).filter((candidate) => candidate.selected && normalizeText(candidate.name));
  if (!selected.length) {
    showToast("请选择要入库的物品");
    return;
  }
  const roomId = state.capture.roomId;
  const placeId = state.capture.placeId;
  const nowText = new Date().toISOString().slice(0, 10);
  updatePlaceImage(placeId, state.capture.image);
  const existingNames = new Set(state.items.map((item) => `${item.placeId}:${normalizeText(item.name)}`));
  const incoming = selected
    .filter((candidate) => !existingNames.has(`${placeId}:${normalizeText(candidate.name)}`))
    .map((candidate) => ({
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
      nextAt: candidate.nextAt || null,
      nextLabel: candidate.nextLabel || null,
      updatedAt: nowText,
      confidence: candidate.confidence,
      source: candidate.source || state.capture.provider || "local-image",
      recognitionProvider: state.capture.provider || "local-image",
      categoryId: candidate.categoryId || candidate.catalogId || "",
      categoryPath: candidate.categoryPath || [],
      categoryScore: candidate.categoryScore,
      categoryMargin: candidate.categoryMargin,
      categoryIndexVersion: candidate.categoryIndexVersion || "",
      matchedSampleIds: candidate.matchedSampleIds || [],
      boxEdited: Boolean(candidate.edited),
    }));

  state.items = [...state.items, ...incoming];
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
  const candidate = (state.capture.candidates || []).find((entry) => entry.id === candidateId);
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

function updateCandidate(id, field, value) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id
      ? {
        ...candidate,
        [field]: field === "qty" ? Math.max(1, Math.round(Number(value) || 1)) : value,
        edited: true,
      }
      : candidate
  ));
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function toggleCandidate(id) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id ? { ...candidate, selected: !candidate.selected } : candidate
  ));
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function selectCandidate(id) {
  if (!(state.capture.candidates || []).some((candidate) => candidate.id === id)) return;
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function updateCandidateBox(id, field, value) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => {
    if (candidate.id !== id) return candidate;
    return {
      ...candidate,
      box: clampBox({ ...candidate.box, [field]: value }),
      edited: true,
    };
  });
  state.capture.activeCandidateId = id;
  persist();
  render();
}

function setCandidateBoxWithoutRender(id, box) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id ? { ...candidate, box: clampBox(box), edited: true } : candidate
  ));
  state.capture.activeCandidateId = id;
}

function startCandidateDrag(event, boxButton) {
  const id = boxButton.dataset.candidateDrag;
  const candidate = (state.capture.candidates || []).find((entry) => entry.id === id);
  const stage = boxButton.closest("[data-capture-stage]");
  if (!candidate || !stage) return;

  event.preventDefault();
  state.capture.activeCandidateId = id;
  candidateDrag = {
    id,
    stage,
    boxButton,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startBox: { ...candidate.box },
  };
  boxButton.classList.add("active");
  boxButton.setPointerCapture?.(event.pointerId);
}

function moveCandidateDrag(event) {
  if (!candidateDrag) return;
  const rect = candidateDrag.stage.getBoundingClientRect();
  const deltaX = ((event.clientX - candidateDrag.startX) / rect.width) * 100;
  const deltaY = ((event.clientY - candidateDrag.startY) / rect.height) * 100;
  const box = clampBox({
    ...candidateDrag.startBox,
    x: candidateDrag.startBox.x + deltaX,
    y: candidateDrag.startBox.y + deltaY,
  });
  setCandidateBoxWithoutRender(candidateDrag.id, box);
  const index = (state.capture.candidates || []).findIndex((candidate) => candidate.id === candidateDrag.id);
  candidateDrag.boxButton.style.cssText = styleCandidatePin(box, Math.max(0, index));
}

function finishCandidateDrag() {
  if (!candidateDrag) return;
  candidateDrag = null;
  persist();
  render();
}

async function startCamera() {
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
  const rect = stage.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const layouts = layoutCandidatePins(candidates, rect.width, rect.height);
  const pins = [...stage.querySelectorAll("[data-candidate-select]")];
  for (const candidate of candidates) {
    const pin = pins.find((entry) => entry.dataset.candidateSelect === candidate.id);
    const layout = layouts.get(candidate.id);
    if (pin && layout) pin.style.cssText = styleCandidatePin(candidate.box, layout);
  }
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
    const image = await resizeImageSourceToDataUrl(canvas);
    resetCaptureRecognition({ image, provider: "local-image" });
    warmCaptureDetectionModel();
    state.cameraOn = false;
    persist();
    render();
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
    addRoom(document.querySelector("[data-new-room-name]")?.value);
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

  const candidateToggle = event.target.closest("[data-candidate-toggle]");
  if (candidateToggle) {
    toggleCandidate(candidateToggle.dataset.candidateToggle);
    return;
  }

  const candidateSelect = event.target.closest("[data-candidate-select]");
  if (candidateSelect && !event.target.closest("input, select")) {
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

  if (event.target.closest("[data-camera-shot]")) {
    captureCameraFrame();
    return;
  }

  if (event.target.closest("[data-reset]")) {
    stopCamera();
    localStorage.removeItem(STORAGE_KEY);
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

  const candidateField = event.target.closest("[data-candidate-field]");
  if (candidateField) {
    updateCandidate(candidateField.dataset.candidateField, candidateField.dataset.field, candidateField.value);
  }
});

document.addEventListener("change", async (event) => {
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

  if (event.target.matches("[data-capture-place]")) {
    const place = getPlace(event.target.value);
    if (!place) return;
    resetCaptureRecognition({ roomId: place.roomId, placeId: place.id });
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
      const image = await prepareUploadedImage(file);
      resetCaptureRecognition({ image, provider: "local-image" });
      warmCaptureDetectionModel();
      persist();
      render();
      showToast("照片已载入");
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
  const boxButton = event.target.closest("[data-candidate-drag]");
  if (boxButton) startCandidateDrag(event, boxButton);
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
warmVisionModels();
