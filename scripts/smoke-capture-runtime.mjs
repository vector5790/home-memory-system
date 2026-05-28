import { clampBox } from "../src/domain/geometry.js";
import { createCaptureRenderers } from "../src/ui/capture-rendering.js";
import {
  escapeHtml,
  layoutCandidatePins,
  styleActiveCandidateLabel,
  styleBox,
  styleCandidatePin,
} from "../src/ui/rendering.js";

const onePixelJpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==";

const stateRef = {
  current: {
    cameraOn: false,
    capture: {
      image: onePixelJpeg,
      imageMeta: { width: 5712, height: 4284 },
      provider: "yolox",
      recognitionStatus: "done",
      recognitionError: "",
      recognitionDiagnostics: {
        provider: "yolox",
        imageDimensions: { width: 5712, height: 4284 },
        wasmThreads: 1,
        detectionMs: 462,
        namingMs: 0,
        totalMs: 462,
        resultCount: 2,
      },
      candidates: [
        {
          id: "candidate-a",
          name: "电视机",
          category: "appliance",
          qty: 1,
          confidence: 0.87,
          selected: true,
          box: clampBox({ x: 16, y: 12, w: 38, h: 26 }),
          cropImage: onePixelJpeg,
          cropMeta: { width: 320, height: 240 },
          catalogCandidates: [
            {
              displayName: "电视机",
              score: 0.91,
              embeddingScore: 0.88,
              rerankTextScore: 0.83,
              hitCount: 3,
              representativeImages: [{ normalizedImagePath: "data/generated/sample.jpg" }],
            },
          ],
        },
        {
          id: "candidate-b",
          name: "功放",
          category: "appliance",
          qty: 1,
          confidence: 0.72,
          selected: false,
          box: clampBox({ x: 52, y: 48, w: 22, h: 18 }),
          cropImage: onePixelJpeg,
          cropMeta: { width: 220, height: 180 },
        },
      ],
      activeCandidateId: "candidate-a",
    },
  },
};

const getCandidates = () => stateRef.current.capture.candidates;
const getActiveCandidates = (candidates = getCandidates()) => candidates.filter((candidate) => !candidate.deleted);
const getCandidateIndex = (candidates, id) => Math.max(0, candidates.findIndex((candidate) => candidate.id === id));
const getFallbackActiveCandidateId = (preferredId) => {
  const active = getActiveCandidates();
  return active.some((candidate) => candidate.id === preferredId) ? preferredId : active[0]?.id || null;
};
const getAdjacentCandidateId = (id, direction) => {
  const active = getActiveCandidates();
  const index = getCandidateIndex(active, id);
  return active[Math.min(Math.max(index + direction, 0), active.length - 1)]?.id || id;
};

const renderers = createCaptureRenderers({
  addDaysIso: (days) => `2026-05-${String(28 + days).padStart(2, "0")}`,
  allDayReminderOffsetLabels: {},
  candidateDatePickerStateRef: { current: null },
  categoryLabels: {
    appliance: "家电",
    daily: "日用",
  },
  cropAspectStyle: (meta) => meta?.width && meta?.height ? `style="aspect-ratio:${meta.width}/${meta.height}"` : "",
  customOffsetUnitLabels: {},
  dateToIso: () => "2026-05-28",
  escapeHtml,
  formatDate: (date) => date,
  formatReminderOffset: () => "当天",
  formatReminderRepeat: () => "不重复",
  formatReminderSchedule: (reminder) => reminder?.date || "",
  getActiveCandidates,
  getAdjacentCandidateId,
  getCalendarDays: () => [],
  getCandidateIndex,
  getCapturePlace: () => null,
  getCaptureRoom: () => ({ id: "living", name: "客厅", shortName: "客厅", type: "living" }),
  getDeletedCandidates: (candidates = getCandidates()) => candidates.filter((candidate) => candidate.deleted),
  getFallbackActiveCandidateId,
  getReminderOffsetLabels: () => ({}),
  getRequestedRecognitionProvider: () => "yolox",
  getSelectedCandidateCount: (candidates = getCandidates()) => candidates.filter((candidate) => candidate.selected && !candidate.deleted).length,
  icons: {
    bell: "",
    box: "",
    camera: "",
    check: "",
    plus: "",
    scan: "",
    trash: "",
  },
  imageAspectStyle: (meta) => meta?.width && meta?.height ? `style="aspect-ratio:${meta.width}/${meta.height}"` : "",
  makeVirtualPlace: (room) => ({ id: "virtual", name: room.name, shortName: room.name }),
  monthKeyFromIso: () => "2026-05",
  moveMonthKey: () => "2026-05",
  nextMondayIso: () => "2026-06-01",
  normalizeReminder: (reminder) => reminder || {},
  normalizeReminderList: (candidate) => candidate.reminders || [],
  platform: { photos: { canUseNativePhotoLibrary: () => true } },
  providerLabel: (provider) => provider === "yolox" ? "本地 YOLOX 主体检测" : provider,
  repeatLabels: {},
  stateRef,
  styleActiveCandidateLabel,
  styleBox,
  styleCandidatePin,
  timedReminderOffsetLabels: {},
  today: new Date("2026-05-28T00:00:00+08:00"),
  visionConfig: {},
});

const html = [
  renderers.renderCaptureView(),
  renderers.renderCaptureStage(),
  renderers.renderRecognitionDiagnostics(),
].join("\n");
const pins = layoutCandidatePins(getActiveCandidates(), 390, 410);

if (!html.includes("候选物品") || !html.includes("电视机") || !pins.has("candidate-a")) {
  throw new Error("Capture runtime smoke test did not render expected candidates.");
}

console.log(`Capture runtime smoke test passed: rendered ${getActiveCandidates().length} candidates.`);
