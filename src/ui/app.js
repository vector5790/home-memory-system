import { HOME_DATA_SCHEMA_VERSION, createHomeMemoryPlatform } from "../platform/index.js";
import { createDateDomain } from "../domain/dates.js";
import { boxIou, clampBox, clampNumber, dedupeCandidates } from "../domain/geometry.js";
import { createRecordDomain } from "../domain/records.js";
import { createReminderDomain } from "../domain/reminders.js";
import { normalizeText } from "../domain/text.js";
import { findBestItem } from "../domain/search.js";
import { createVisionCatalog } from "../vision/catalog.js";
import { createImageProcessing } from "../vision/image-processing.js";
import { createHeuristicRegionRecognizer } from "../vision/heuristic-regions.js";
import { createVisionJsonFetcher } from "../vision/json-index.js";
import { createVisionRecognitionPipeline } from "../vision/recognition-pipeline.js";
import { getRequestedRecognitionProvider, providerLabel } from "../vision/providers.js";
import { escapeHtml, layoutCandidatePins, styleActiveCandidateLabel, styleBox, styleCandidatePin } from "./rendering.js";
import { createCaptureRenderers } from "./capture-rendering.js";
import {
  allDayReminderOffsetLabels,
  categoryLabels,
  customOffsetUnitLabels,
  furnitureByRoom,
  genericDetectionLabels,
  icons,
  repeatLabels,
  timedReminderOffsetLabels,
  unknownObjectNames,
  visionCatalog,
  visionConfig,
} from "../config/app-config.js";

const STORAGE_KEY = "home-memory-system:v3";
const platform = createHomeMemoryPlatform({
  storageKey: STORAGE_KEY,
  schemaVersion: HOME_DATA_SCHEMA_VERSION,
});
const today = new Date();
const fetchJsonIndex = createVisionJsonFetcher(visionConfig);
const dateDomain = createDateDomain(today);
const {
  addDaysIso,
  dateToIso,
  daysUntil,
  formatDate,
  getCalendarDays,
  monthKeyFromIso,
  moveMonthKey,
  nextMondayIso,
} = dateDomain;
const {
  createNotificationId,
  defaultReminderOffset,
  dueStatus,
  formatReminderOffset,
  formatReminderRepeat,
  formatReminderSchedule,
  formatReminderTime,
  getPrimaryReminder,
  getReminderOffsetLabels,
  legacyReminderFromFields,
  normalizeCustomOffset,
  normalizeDateText,
  normalizeReminder,
  normalizeReminderList,
  normalizeReminderOffset,
  normalizeReminderTime,
} = createReminderDomain({
  allDayReminderOffsetLabels,
  clampNumber,
  customOffsetUnitLabels,
  dateToIso,
  daysUntil,
  formatDate,
  repeatLabels,
  timedReminderOffsetLabels,
  today,
  createId,
});
const {
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
  isStorageDetectionLabel,
  normalizeDetectionLabel,
} = createVisionCatalog({
  fetchJsonIndex,
  furnitureByRoom,
  genericDetectionLabels,
  getRoomContext: () => getCaptureRoom?.() || getRoom?.(state.capture?.roomId || state.activeRoomId),
  normalizeText,
  visionCatalog,
  visionConfig,
});
const {
  attachModelCoordinateContext,
  decodeImageBlobToDataUrl,
  getDrawableSize,
  getImageDimensions,
  imageMetaFromDataUrl,
  loadImage,
  mapDisplayBoxToModelBox,
  mapModelBoxToDisplayBox,
  mapPercentBoxBetweenImages,
  normalizeImageMeta,
  prepareImageForDetection,
  prepareModelImageContext,
  prepareUploadedImage,
  readBlobAsDataUrl,
  resizeImageSourceToDataUrl,
  withTimeout,
} = createImageProcessing({ clampBox, visionConfig });
const { recognizeWithHeuristicRegions } = createHeuristicRegionRecognizer({ loadImage });
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

const {
  getUnknownObjectName,
  isCandidateDeleted,
  isUnknownObjectName,
  normalizeCandidate,
  normalizeItem,
  normalizeItems,
  normalizeRecognitionResults,
  renumberUnknownCandidates,
} = createRecordDomain({
  categoryLabels,
  clampBox,
  clampNumber,
  createId,
  normalizeCropMeta,
  normalizeReminderList,
  repeatLabels,
  seedState,
});
const {
  createCandidateCropSnapshot,
  getVisionAssetMode,
  getVisionWasmThreadCount,
  nameDetectedCandidates,
  recognizeWithSmallModelUncached,
  recognizeWithLocalImage,
  shouldRefreshCandidateCrop,
  warmCatalogNamingResources,
  warmCaptureDetectionModel,
  warmVisionModels,
} = createVisionRecognitionPipeline({
  boxIou,
  clampBox,
  clampNumber,
  dedupeCandidates,
  fetchJsonIndex,
  getCatalogPromptEntries,
  getCapturePromptRoomType,
  getDetectionLabelEntries,
  getDetectionLabelMeta,
  getGroundingLabelEntries,
  getGroundingPromptShards,
  getUnknownObjectName,
  isStorageDetectionLabel,
  isUnknownObjectName,
  loadImage,
  mapDisplayBoxToModelBox,
  normalizeCandidate,
  normalizeCropMeta,
  normalizeDetectionLabel,
  normalizeImageMeta,
  platform,
  recognizeWithHeuristicRegions,
  renumberUnknownCandidates,
  visionCatalog,
  visionConfig,
});

let state = loadState();
let cameraStream = null;
let toastTimer = null;
let candidateDrag = null;
let candidateDatePickerState = null;
let recognitionRunId = 0;
let candidateEditRecognitionToken = 0;
let candidateCropHydrationKey = "";
let catalogNamingWarmupPromise = null;
let persistWarningShown = false;
const stateRef = {
  get current() {
    return state;
  },
};
const candidateDatePickerStateRef = {
  get current() {
    return candidateDatePickerState;
  },
};
const {
  getRecognitionStatusMeta,
  renderCandidate,
  renderCandidateCrop,
  renderCandidateDateModal,
  renderCandidateDatePicker,
  renderCandidateMetaChips,
  renderCandidateReminders,
  renderCandidateReviewPanel,
  renderCandidateTrash,
  renderCaptureControls,
  renderCapturePlaceholder,
  renderCaptureStage,
  renderCaptureView,
  renderCatalogCandidatePanel,
  renderRecognitionDiagnostics,
} = createCaptureRenderers({
  addDaysIso,
  candidateDatePickerStateRef,
  allDayReminderOffsetLabels,
  categoryLabels,
  cropAspectStyle,
  customOffsetUnitLabels,
  escapeHtml,
  dateToIso,
  formatDate,
  formatReminderOffset,
  formatReminderRepeat,
  getActiveCandidates,
  getAdjacentCandidateId,
  getCandidateIndex,
  getCapturePlace,
  getCaptureRoom,
  getDeletedCandidates,
  getFallbackActiveCandidateId,
  getReminderOffsetLabels,
  getRequestedRecognitionProvider,
  getSelectedCandidateCount,
  icons,
  imageAspectStyle,
  makeVirtualPlace,
  monthKeyFromIso,
  moveMonthKey,
  normalizeReminder,
  normalizeReminderList,
  nextMondayIso,
  platform,
  providerLabel,
  repeatLabels,
  stateRef,
  getCalendarDays,
  today,
  styleActiveCandidateLabel,
  styleBox,
  styleCandidatePin,
  timedReminderOffsetLabels,
  visionConfig,
});

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

function prewarmCatalogNamingResources() {
  if (catalogNamingWarmupPromise) return catalogNamingWarmupPromise;
  catalogNamingWarmupPromise = warmCatalogNamingResources().catch((error) => ({
    skipped: true,
    reason: error?.message || "catalog-warmup-failed",
    warmupMs: 0,
  }));
  return catalogNamingWarmupPromise;
}

function scheduleCatalogNamingPrewarm() {
  const run = () => {
    prewarmCatalogNamingResources().catch((error) => {
      console.info("Catalog naming prewarm skipped.", error);
    });
  };
  window.setTimeout(run, 600);
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 1800 });
  } else {
    window.setTimeout(run, 1800);
  }
}

function normalizeCropMeta(meta) {
  const width = Math.round(Number(meta?.width || 0));
  const height = Math.round(Number(meta?.height || 0));
  if (!width || !height) return null;
  return { width, height };
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

function boxArea(box) {
  return Math.max(0, box.w) * Math.max(0, box.h);
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

  const item = findBestItem(query, state.items, categoryLabels);
  setState({ lastAnswer: item ? { type: "item", item } : { type: "not-found", query } });
}

async function scanCurrentPlace() {
  if (["detecting", "naming"].includes(state.capture.recognitionStatus)) return;

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

  const requestedProvider = getRequestedRecognitionProvider(visionConfig);
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
  const namingWarmupPromise = prewarmCatalogNamingResources();
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
          rawDetectionCount: detectorTiming.rawDetectionCount,
          filteredDetectionCount: detectorTiming.filteredDetectionCount,
          topDetectionScore: detectorTiming.topDetectionScore,
          yoloxThreshold: detectorTiming.yoloxThreshold,
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
    const namingWarmup = await namingWarmupPromise;
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
    const embeddingModelReadyMs = namedCandidates.reduce((total, candidate) => total + (Number(candidate.timings?.embeddingModelReadyMs) || 0), 0);
    const embeddingExtractorMs = namedCandidates.reduce((total, candidate) => total + (Number(candidate.timings?.embeddingExtractorMs) || 0), 0);
    const embeddingPostprocessMs = namedCandidates.reduce((total, candidate) => total + (Number(candidate.timings?.embeddingPostprocessMs) || 0), 0);
    const embeddingInputBytes = namedCandidates.reduce((total, candidate) => total + (Number(candidate.timings?.embeddingInputBytes) || 0), 0);
    const embeddingBatchSize = Math.max(...namedCandidates.map((candidate) => Number(candidate.timings?.embeddingBatchSize) || 0), 0);
    const embeddingBatchExtractorMs = Math.max(...namedCandidates.map((candidate) => Number(candidate.timings?.embeddingBatchExtractorMs) || 0), 0);
    const embeddingBatchTotalMs = Math.max(...namedCandidates.map((candidate) => Number(candidate.timings?.embeddingBatchTotalMs) || 0), 0);
    const embeddingBatchMode = namedCandidates.find((candidate) => candidate.timings?.embeddingBatchMode)?.timings?.embeddingBatchMode || "";
    const embeddingExtractorMode = namedCandidates.find((candidate) => candidate.timings?.embeddingExtractorMode)?.timings?.embeddingExtractorMode || "";
    const embeddingNativeIndexFormat = namedCandidates.find((candidate) => candidate.timings?.embeddingNativeIndexFormat)?.timings?.embeddingNativeIndexFormat || "";
    const embeddingProcessorMs = namedCandidates.reduce((total, candidate) => total + (Number(candidate.timings?.embeddingProcessorMs) || 0), 0);
    const embeddingModelMs = namedCandidates.reduce((total, candidate) => total + (Number(candidate.timings?.embeddingModelMs) || 0), 0);
    const embeddingBatchProcessorMs = Math.max(...namedCandidates.map((candidate) => Number(candidate.timings?.embeddingBatchProcessorMs) || 0), 0);
    const embeddingBatchModelMs = Math.max(...namedCandidates.map((candidate) => Number(candidate.timings?.embeddingBatchModelMs) || 0), 0);
    const maxEmbeddingInputBytes = Math.max(...namedCandidates.map((candidate) => Number(candidate.timings?.embeddingInputBytes) || 0), 0);
    const maxEmbeddingCropLongSide = Math.max(...namedCandidates.map((candidate) => Math.max(
      Number(candidate.timings?.embeddingCropWidth) || 0,
      Number(candidate.timings?.embeddingCropHeight) || 0,
    )), 0);
    const catalogCropMs = namedCandidates.reduce((total, candidate) => total + (Number(candidate.timings?.catalogCropMs) || 0), 0);
    const catalogSearchMs = namedCandidates.reduce((total, candidate) => total + (Number(candidate.timings?.catalogSearchMs) || 0), 0);
    const catalogTotalMs = namedCandidates.reduce((total, candidate) => total + (Number(candidate.timings?.catalogTotalMs) || 0), 0);
    const catalogIndexLoadMs = Math.max(...namedCandidates.map((candidate) => Number(candidate.timings?.catalogIndexLoadMs) || 0), 0);
    const perCandidateNamingMs = namedCandidates.reduce((max, candidate) => Math.max(max, Number(candidate.timings?.namingMs) || 0), 0);
    const embeddingNamedCount = namedCandidates.filter((candidate) => String(candidate.source || "").includes("embedding")).length;
    const unresolvedNamingCount = namedCandidates.filter((candidate, index) => (
      !candidate.name || isUnknownObjectName(candidate.name) || candidate.name === getUnknownObjectName(index)
    )).length;
    const catalogCandidateCount = namedCandidates.reduce((total, candidate) => (
      total + (Array.isArray(candidate.catalogCandidates) ? candidate.catalogCandidates.length : 0)
    ), 0);
    const namingRejectionReasons = Object.entries(namedCandidates.reduce((counts, candidate) => {
      const reason = candidate.namingRejectionReason || "";
      if (reason) counts[reason] = (counts[reason] || 0) + 1;
      return counts;
    }, {})).map(([reason, count]) => `${reason}:${count}`).join(",");
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
        topDetectionScore: detectorTiming.topDetectionScore,
        yoloxThreshold: detectorTiming.yoloxThreshold,
        detectionMs,
        namingMs,
        embeddingMs,
        embeddingModelReadyMs,
        embeddingExtractorMs,
        embeddingPostprocessMs,
        embeddingInputBytes,
        embeddingBatchSize,
        embeddingBatchExtractorMs,
        embeddingBatchTotalMs,
        embeddingBatchMode,
        embeddingExtractorMode,
        embeddingNativeIndexFormat,
        embeddingProcessorMs,
        embeddingModelMs,
        embeddingBatchProcessorMs,
        embeddingBatchModelMs,
        maxEmbeddingInputBytes,
        maxEmbeddingCropLongSide,
        catalogCropMs,
        catalogSearchMs,
        catalogTotalMs,
        catalogIndexLoadMs,
        catalogWarmupMs: namingWarmup?.warmupMs,
        catalogWarmupEntries: namingWarmup?.entries,
        catalogWarmupExtractorReady: namingWarmup?.extractorReady,
        embeddingWarmupMode: namingWarmup?.embeddingWarmupMode,
        embeddingWarmupError: namingWarmup?.embeddingWarmupError,
        embeddingNamedCount,
        unresolvedNamingCount,
        catalogCandidateCount,
        namingRejectionReasons,
        catalogNamingConcurrency: visionConfig.catalogNamingConcurrency,
        perCandidateNamingMs,
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

function getManualCandidateBox(index = 0) {
  return clampBox({
    x: 30 + ((index % 3) * 5),
    y: 28 + ((index % 2) * 7),
    w: 34,
    h: 34,
  });
}

function addManualCandidate() {
  if (!state.capture.image) {
    showToast("请先选择或拍摄照片");
    return;
  }
  const activeCandidates = getActiveCandidates();
  const index = activeCandidates.length;
  const id = createId("candidate", `manual-${index + 1}`);
  const candidate = normalizeCandidate({
    id,
    name: getUnknownObjectName(index),
    category: "daily",
    qty: 1,
    box: getManualCandidateBox(index),
    confidence: 1,
    selected: true,
    source: "manual-subject-box",
    detectionLabel: `手动主体框 ${index + 1}`,
    namingStatus: "done",
    cropVersion: "",
    edited: true,
    boxOpen: true,
  }, index, state.capture.provider || "manual-subject-box");
  state.capture = {
    ...state.capture,
    candidates: [...(state.capture.candidates || []), candidate],
    activeCandidateId: id,
    recognitionStatus: ["idle", "empty", "error"].includes(state.capture.recognitionStatus) ? "done" : state.capture.recognitionStatus,
    recognitionError: "",
    provider: state.capture.provider || "manual-subject-box",
  };
  persist();
  render();
  hydrateCandidateCrops().catch((error) => console.info("Manual candidate crop hydration skipped.", error));
  rerunCandidateNamingAfterBoxEdit(id).catch((error) => {
    console.info("Manual candidate naming skipped.", error);
    state.capture.candidates = (state.capture.candidates || []).map((entry) => (
      entry.id === id ? { ...entry, namingStatus: "done" } : entry
    ));
    persist();
    render();
  });
  showToast("已添加手动主体框，正在识别名称");
}

function renameCandidateFromCurrentBox(id) {
  const candidate = (state.capture.candidates || []).find((entry) => entry.id === id);
  if (!candidate) return;
  if (candidate.namingStatus === "loading") return;
  state.capture.activeCandidateId = id;
  rerunCandidateNamingAfterBoxEdit(id).catch((error) => {
    console.info("Candidate name re-recognition skipped.", error);
    state.capture.candidates = (state.capture.candidates || []).map((entry) => (
      entry.id === id ? { ...entry, namingStatus: "done" } : entry
    ));
    persist();
    render();
  });
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
  if (candidate.namingStatus === "loading") return;

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
    prewarmCatalogNamingResources();
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

function hashStringFast(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
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
    prewarmCatalogNamingResources();
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

  const renameCandidateButton = event.target.closest("[data-rename-candidate]");
  if (renameCandidateButton) {
    renameCandidateFromCurrentBox(renameCandidateButton.dataset.renameCandidate);
    return;
  }

  if (event.target.closest("[data-add-manual-candidate]")) {
    addManualCandidate();
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
    rerunCandidateNamingAfterBoxEdit(candidateBoxField.dataset.candidateBoxField).catch((error) => {
      console.info("Candidate box re-recognition skipped.", error);
    });
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
      prewarmCatalogNamingResources();
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
scheduleCatalogNamingPrewarm();
