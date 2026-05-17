const STORAGE_KEY = "home-memory-system:v1";
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
  activeTab: "find",
  activeRoomId: "living",
  activePlaceId: "living-tv-drawer",
  query: "猫咪饮水机滤芯在哪",
  lastAnswer: null,
  capture: {
    roomId: "living",
    placeId: "living-tv-drawer",
    image: null,
    candidates: [],
  },
  cameraOn: false,
  rooms: [
    {
      id: "living",
      name: "客厅",
      type: "living",
      places: [
        {
          id: "living-tv-drawer",
          name: "电视柜右侧第二抽屉",
          shortName: "电视柜抽屉",
          kind: "drawer",
          box: { x: 55, y: 53, w: 25, h: 12 },
          note: "白色医药箱、常用电池和线材",
        },
        {
          id: "living-pet-corner",
          name: "猫咪用品角",
          shortName: "宠物角",
          kind: "shelf",
          box: { x: 12, y: 48, w: 24, h: 18 },
          note: "日常喂养和清洁用品",
        },
      ],
    },
    {
      id: "kitchen",
      name: "厨房",
      type: "kitchen",
      places: [
        {
          id: "kitchen-fridge",
          name: "冰箱冷藏室第二层",
          shortName: "冷藏第二层",
          kind: "fridge",
          box: { x: 68, y: 18, w: 20, h: 49 },
          note: "乳制品、剩菜和饮料",
        },
        {
          id: "kitchen-spice-drawer",
          name: "料理台下方调料抽屉",
          shortName: "调料抽屉",
          kind: "drawer",
          box: { x: 22, y: 64, w: 34, h: 12 },
          note: "调味料、保鲜袋和烘焙小件",
        },
      ],
    },
    {
      id: "balcony",
      name: "阳台",
      type: "balcony",
      places: [
        {
          id: "balcony-storage",
          name: "阳台储物柜下层",
          shortName: "储物柜下层",
          kind: "shelf",
          box: { x: 9, y: 52, w: 21, h: 25 },
          note: "宠物备件、清洁耗材和滤芯",
        },
        {
          id: "balcony-cleaning",
          name: "洗衣机旁清洁区",
          shortName: "清洁区",
          kind: "shelf",
          box: { x: 66, y: 36, w: 22, h: 33 },
          note: "洗衣液、除菌液和刷具",
        },
      ],
    },
    {
      id: "bedroom",
      name: "卧室",
      type: "bedroom",
      places: [
        {
          id: "bedroom-doc-drawer",
          name: "床头柜下层文件袋",
          shortName: "文件袋",
          kind: "drawer",
          box: { x: 57, y: 57, w: 20, h: 13 },
          note: "证件、保修卡和票据",
        },
        {
          id: "bedroom-wardrobe",
          name: "衣柜左侧收纳盒",
          shortName: "衣柜收纳盒",
          kind: "shelf",
          box: { x: 9, y: 24, w: 24, h: 36 },
          note: "换季衣物和旅行用品",
        },
      ],
    },
  ],
  items: [
    {
      id: "item-pet-filter",
      name: "猫咪饮水机滤芯",
      aliases: ["滤芯", "宠物滤芯", "饮水机滤芯"],
      category: "pet",
      qty: 2,
      roomId: "balcony",
      placeId: "balcony-storage",
      container: "透明收纳盒",
      box: { x: 58, y: 58, w: 22, h: 16 },
      expireAt: null,
      nextAt: "2026-05-24",
      nextLabel: "更换滤芯",
      updatedAt: "2026-05-15",
      confidence: 0.96,
    },
    {
      id: "item-thermometer",
      name: "电子体温计",
      aliases: ["体温计", "温度计"],
      category: "medicine",
      qty: 1,
      roomId: "living",
      placeId: "living-tv-drawer",
      container: "白色医药箱",
      box: { x: 63, y: 23, w: 18, h: 12 },
      expireAt: null,
      nextAt: null,
      nextLabel: null,
      updatedAt: "2026-05-09",
      confidence: 0.93,
    },
    {
      id: "item-ibuprofen",
      name: "布洛芬缓释胶囊",
      aliases: ["布洛芬", "退烧药", "止痛药"],
      category: "medicine",
      qty: 1,
      roomId: "living",
      placeId: "living-tv-drawer",
      container: "白色医药箱",
      box: { x: 30, y: 45, w: 24, h: 16 },
      expireAt: "2026-06-10",
      nextAt: null,
      nextLabel: null,
      updatedAt: "2026-05-09",
      confidence: 0.9,
    },
    {
      id: "item-battery",
      name: "7号电池",
      aliases: ["电池", "遥控器电池", "七号电池"],
      category: "tool",
      qty: 6,
      roomId: "living",
      placeId: "living-tv-drawer",
      container: "抽屉左侧小盒",
      box: { x: 16, y: 23, w: 20, h: 14 },
      expireAt: "2028-12-01",
      nextAt: null,
      nextLabel: null,
      updatedAt: "2026-05-11",
      confidence: 0.88,
    },
    {
      id: "item-yogurt",
      name: "原味酸奶",
      aliases: ["酸奶", "乳制品"],
      category: "food",
      qty: 3,
      roomId: "kitchen",
      placeId: "kitchen-fridge",
      container: "冷藏第二层左侧",
      box: { x: 20, y: 38, w: 20, h: 17 },
      expireAt: "2026-05-20",
      nextAt: null,
      nextLabel: null,
      updatedAt: "2026-05-16",
      confidence: 0.95,
    },
    {
      id: "item-passport",
      name: "护照",
      aliases: ["证件", "旅行证件"],
      category: "document",
      qty: 1,
      roomId: "bedroom",
      placeId: "bedroom-doc-drawer",
      container: "蓝色文件袋",
      box: { x: 38, y: 34, w: 28, h: 18 },
      expireAt: "2031-09-03",
      nextAt: null,
      nextLabel: null,
      updatedAt: "2026-05-02",
      confidence: 0.91,
    },
    {
      id: "item-air-filter",
      name: "空气净化器滤芯",
      aliases: ["净化器滤芯", "空气滤芯"],
      category: "appliance",
      qty: 1,
      roomId: "balcony",
      placeId: "balcony-storage",
      container: "储物柜下层左侧",
      box: { x: 15, y: 32, w: 28, h: 18 },
      expireAt: null,
      nextAt: "2026-06-01",
      nextLabel: "检查滤芯",
      updatedAt: "2026-04-28",
      confidence: 0.86,
    },
  ],
};

const candidateProfiles = {
  "living-tv-drawer": [
    { name: "创可贴", category: "medicine", qty: 2, expireAt: "2026-08-18", container: "白色医药箱", box: { x: 17, y: 50, w: 20, h: 14 }, confidence: 0.92 },
    { name: "Type-C 数据线", category: "tool", qty: 3, expireAt: "", container: "抽屉右侧线材区", box: { x: 58, y: 58, w: 28, h: 15 }, confidence: 0.89 },
    { name: "电子体温计", category: "medicine", qty: 1, expireAt: "", container: "白色医药箱", box: { x: 63, y: 22, w: 18, h: 12 }, confidence: 0.94 },
    { name: "7号电池", category: "tool", qty: 4, expireAt: "2029-03-01", container: "抽屉左侧小盒", box: { x: 15, y: 24, w: 20, h: 14 }, confidence: 0.86 },
  ],
  "kitchen-fridge": [
    { name: "原味酸奶", category: "food", qty: 3, expireAt: "2026-05-20", container: "冷藏第二层左侧", box: { x: 18, y: 38, w: 22, h: 17 }, confidence: 0.96 },
    { name: "盒装鸡蛋", category: "food", qty: 8, expireAt: "2026-05-27", container: "冷藏第二层右侧", box: { x: 52, y: 38, w: 28, h: 17 }, confidence: 0.88 },
    { name: "儿童奶酪棒", category: "food", qty: 6, expireAt: "2026-05-30", container: "门架中层", box: { x: 72, y: 58, w: 15, h: 18 }, confidence: 0.83 },
    { name: "开封番茄酱", category: "food", qty: 1, expireAt: "2026-06-05", container: "门架下层", box: { x: 69, y: 72, w: 12, h: 15 }, confidence: 0.81 },
  ],
  "kitchen-spice-drawer": [
    { name: "黑胡椒粒", category: "food", qty: 1, expireAt: "2027-02-01", container: "调料抽屉左侧", box: { x: 16, y: 27, w: 18, h: 18 }, confidence: 0.86 },
    { name: "保鲜袋", category: "daily", qty: 1, expireAt: "", container: "调料抽屉后侧", box: { x: 58, y: 33, w: 26, h: 16 }, confidence: 0.9 },
    { name: "生抽", category: "food", qty: 1, expireAt: "2027-08-12", container: "调料抽屉右侧", box: { x: 42, y: 58, w: 18, h: 20 }, confidence: 0.84 },
  ],
  "balcony-storage": [
    { name: "猫咪饮水机滤芯", category: "pet", qty: 2, expireAt: "", container: "透明收纳盒", box: { x: 58, y: 58, w: 22, h: 16 }, confidence: 0.96, nextAt: "2026-05-24", nextLabel: "更换滤芯" },
    { name: "空气净化器滤芯", category: "appliance", qty: 1, expireAt: "", container: "储物柜下层左侧", box: { x: 15, y: 32, w: 28, h: 18 }, confidence: 0.84, nextAt: "2026-06-01", nextLabel: "检查滤芯" },
    { name: "宠物除臭喷雾", category: "pet", qty: 1, expireAt: "2027-01-03", container: "透明收纳盒", box: { x: 44, y: 34, w: 13, h: 24 }, confidence: 0.82 },
  ],
  "balcony-cleaning": [
    { name: "洗衣液", category: "daily", qty: 1, expireAt: "", container: "洗衣机旁清洁区", box: { x: 20, y: 34, w: 18, h: 25 }, confidence: 0.89 },
    { name: "除菌液", category: "daily", qty: 1, expireAt: "2027-09-08", container: "洗衣机旁清洁区", box: { x: 44, y: 36, w: 17, h: 24 }, confidence: 0.84 },
  ],
  "bedroom-doc-drawer": [
    { name: "护照", category: "document", qty: 1, expireAt: "2031-09-03", container: "蓝色文件袋", box: { x: 38, y: 34, w: 28, h: 18 }, confidence: 0.91 },
    { name: "家电保修卡", category: "document", qty: 4, expireAt: "2027-12-31", container: "透明文件袋", box: { x: 22, y: 60, w: 30, h: 17 }, confidence: 0.87 },
    { name: "备用钥匙", category: "tool", qty: 2, expireAt: "", container: "小号密封袋", box: { x: 66, y: 58, w: 13, h: 12 }, confidence: 0.8 },
  ],
  "bedroom-wardrobe": [
    { name: "旅行收纳袋", category: "daily", qty: 3, expireAt: "", container: "衣柜左侧收纳盒", box: { x: 25, y: 36, w: 28, h: 20 }, confidence: 0.9 },
    { name: "换季围巾", category: "daily", qty: 2, expireAt: "", container: "衣柜左侧收纳盒", box: { x: 54, y: 52, w: 24, h: 18 }, confidence: 0.82 },
  ],
};

let state = loadState();
let cameraStream = null;
let toastTimer = null;

const app = document.querySelector("#app");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seedState);
    return { ...structuredClone(seedState), ...JSON.parse(raw), cameraOn: false };
  } catch {
    return structuredClone(seedState);
  }
}

function persist() {
  const snapshot = structuredClone(state);
  snapshot.cameraOn = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function setState(patch) {
  state = { ...state, ...patch };
  persist();
  render();
}

function getRoom(roomId = state.activeRoomId) {
  return state.rooms.find((room) => room.id === roomId) || state.rooms[0];
}

function getAllPlaces() {
  return state.rooms.flatMap((room) => room.places.map((place) => ({ ...place, roomId: room.id, roomName: room.name, roomType: room.type })));
}

function getPlace(placeId = state.activePlaceId) {
  return getAllPlaces().find((place) => place.id === placeId) || getAllPlaces()[0];
}

function getItemsByPlace(placeId) {
  return state.items.filter((item) => item.placeId === placeId);
}

function getRoomItems(roomId) {
  return state.items.filter((item) => item.roomId === roomId);
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
  const place = getPlace(item.placeId);
  return `${room.name} > ${place.name} > ${item.container || "未命名容器"} > ${item.name}`;
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
        <button class="icon-btn" data-reset title="重置演示数据" aria-label="重置演示数据">${icons.rotate}</button>
      </div>
    </header>
  `;
}

function renderSidebar() {
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
        ${getRoom().places.map((place) => `
          <button class="place-chip ${state.activePlaceId === place.id ? "active" : ""}" data-place="${place.id}">
            <span>${escapeHtml(place.shortName)}</span>
            <span class="small-muted">${getItemsByPlace(place.id).length} 件</span>
          </button>
        `).join("")}
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
  return `
    <section class="panel">
      <div class="view-title-row">
        <div>
          <h2>${escapeHtml(room.name)}照片地图</h2>
          <p>${escapeHtml(place.name)} · ${getItemsByPlace(place.id).length} 件已确认物品</p>
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
  const items = getItemsByPlace(place.id);
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${escapeHtml(place.name)}</h3>
          <p class="panel-subtitle">${escapeHtml(place.note)}</p>
        </div>
      </div>
      <div class="item-list">
        ${items.length ? items.map(renderCompactItem).join("") : `<p class="empty-state">暂无物品</p>`}
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
          <span>${escapeHtml(place.shortName)}</span>
          <span>${escapeHtml(item.container)}</span>
        </div>
      </div>
      ${due ? `<span class="due-pill ${due.cls}">${due.label}</span>` : `<span class="status-pill good">已定位</span>`}
    </article>
  `;
}

function renderRoomStage(room, highlightPlaceId, clickable = false) {
  return `
    <div class="photo-stage ${room.type}">
      <div class="floor-line"></div>
      ${(furnitureByRoom[room.type] || []).map((piece) => `
        <span class="furniture ${piece.cls}" style="${styleBox(piece)}"></span>
      `).join("")}
      ${room.places.map((place) => `
        <button
          class="hotspot ${highlightPlaceId === place.id ? "active" : ""}"
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
  const items = getItemsByPlace(place.id);
  return `
    <div class="storage-stage ${place.kind}">
      <span class="storage-rail"></span>
      <span class="storage-rail"></span>
      <span class="storage-rail"></span>
      ${items.map((item) => `
        <span class="item-box ${highlightItemId === item.id ? "active" : ""}" style="${styleBox(item.box)}">
          <span>${escapeHtml(item.name)}</span>
        </span>
      `).join("")}
      <div class="stage-caption">
        <div>
          <strong>${escapeHtml(place.shortName)}</strong>
          <span>${escapeHtml(place.note)}</span>
        </div>
        ${compact ? `<span class="count-pill">${items.length} 件</span>` : ""}
      </div>
    </div>
  `;
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
          <input class="search-field" data-query-input value="${escapeHtml(state.query)}" placeholder="输入：护照在哪、哪些食品快过期、还有没有电池" />
          <button class="primary-btn" data-search>${icons.search}<span>查找</span></button>
        </div>
        <div class="example-row">
          ${["猫咪饮水机滤芯在哪", "哪些东西快过期", "体温计在哪", "还有没有电池", "护照在哪"].map((text) => `
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
            <p>可以扫描当前抽屉或柜子，系统会把新位置记下来。</p>
          </div>
          <button class="primary-btn" data-tab="capture">${icons.scan}<span>去扫描</span></button>
        </div>
      </section>
    `;
  }

  const item = answer.item;
  const room = getRoom(item.roomId);
  const place = getPlace(item.placeId);
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
      <div class="route-grid">
        <div class="route-panel">
          <div class="route-label"><span>先到这个位置</span><strong>${escapeHtml(room.name)}</strong></div>
          ${renderRoomStage(room, place.id, false)}
        </div>
        <div class="route-panel">
          <div class="route-label"><span>打开后看这里</span><strong>${escapeHtml(place.shortName)}</strong></div>
          ${renderStorageStage(place, item.id, false)}
        </div>
      </div>
      <div class="toolbar">
        <span class="status-pill">${escapeHtml(timeText)}</span>
        <button class="secondary-btn" data-found="${item.id}">${icons.check}<span>我找到了</span></button>
        <button class="secondary-btn" data-missing="${item.id}">${icons.scan}<span>不在这里</span></button>
      </div>
    </section>
  `;
}

function renderCaptureView() {
  const place = getPlace(state.capture.placeId);
  const candidates = state.capture.candidates || [];
  return `
    <section class="panel">
      <div class="view-title-row">
        <div>
          <h2>AI录入</h2>
          <p>${escapeHtml(place.name)} · ${candidates.length ? `${candidates.length} 个候选物品` : "等待识别"}</p>
        </div>
        <div class="toolbar">
          <button class="secondary-btn" data-scan>${icons.spark}<span>开始识别</span></button>
          <button class="primary-btn" data-confirm-all ${candidates.length ? "" : "disabled"}>${icons.check}<span>确认入库</span></button>
        </div>
      </div>
      <div class="capture-grid">
        <div>
          ${renderCaptureStage()}
          <div class="capture-controls">
            <select class="select-field" data-capture-room>
              ${state.rooms.map((room) => `<option value="${room.id}" ${state.capture.roomId === room.id ? "selected" : ""}>${escapeHtml(room.name)}</option>`).join("")}
            </select>
            <select class="select-field" data-capture-place>
              ${getRoom(state.capture.roomId).places.map((roomPlace) => `<option value="${roomPlace.id}" ${state.capture.placeId === roomPlace.id ? "selected" : ""}>${escapeHtml(roomPlace.name)}</option>`).join("")}
            </select>
            <button class="secondary-btn file-input">${icons.box}<span>上传照片</span><input type="file" accept="image/*" data-file-input /></button>
            <button class="secondary-btn" data-camera-start>${icons.camera}<span>摄像头</span></button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">候选物品</h3>
              <p class="panel-subtitle">${escapeHtml(place.shortName)} · 点选后入库</p>
            </div>
            <span class="count-pill">${candidates.filter((candidate) => candidate.selected).length}/${candidates.length}</span>
          </div>
          <div class="candidate-list">
            ${candidates.length ? candidates.map(renderCandidate).join("") : `<p class="empty-state">点击开始识别</p>`}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCaptureStage() {
  const candidates = state.capture.candidates || [];
  return `
    <div class="capture-stage">
      ${state.cameraOn ? `<video id="cameraVideo" autoplay playsinline muted></video>` : state.capture.image ? `<img alt="上传的储物点照片" src="${state.capture.image}" />` : renderStorageStage(getPlace(state.capture.placeId), null, false)}
      ${state.cameraOn ? `<button class="primary-btn" data-camera-shot style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:3">${icons.camera}<span>拍照</span></button>` : ""}
      ${candidates.map((candidate) => `
        <button class="candidate-box ${candidate.selected ? "active" : ""}" style="${styleBox(candidate.box)}" data-candidate-toggle="${candidate.id}">
          <span>${escapeHtml(candidate.name)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderCandidate(candidate) {
  return `
    <article class="candidate-row">
      <div class="candidate-head">
        <label class="checkbox">
          <input type="checkbox" ${candidate.selected ? "checked" : ""} data-candidate-toggle="${candidate.id}" />
          <strong>${escapeHtml(candidate.name)}</strong>
        </label>
        <span class="status-pill good">${Math.round(candidate.confidence * 100)}%</span>
      </div>
      <div class="candidate-form">
        <input class="field" value="${escapeHtml(candidate.name)}" data-candidate-field="${candidate.id}" data-field="name" aria-label="物品名称" />
        <select class="select-field" data-candidate-field="${candidate.id}" data-field="category" aria-label="分类">
          ${Object.entries(categoryLabels).map(([key, label]) => `<option value="${key}" ${candidate.category === key ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <input class="field" type="date" value="${escapeHtml(candidate.expireAt || "")}" data-candidate-field="${candidate.id}" data-field="expireAt" aria-label="有效期" />
      </div>
      <input class="field" value="${escapeHtml(candidate.container || "")}" data-candidate-field="${candidate.id}" data-field="container" aria-label="容器" />
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
    const placeNames = [...new Set(petItems.map((item) => getPlace(item.placeId).shortName))];
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

function scanCurrentPlace() {
  const placeId = state.capture.placeId;
  const profile = candidateProfiles[placeId] || [];
  const candidates = profile.map((candidate, index) => ({
    ...candidate,
    id: `candidate-${Date.now()}-${index}`,
    selected: true,
    aliases: [],
  }));
  state.capture = { ...state.capture, candidates };
  persist();
  render();
  showToast(`识别到 ${candidates.length} 个候选物品`);
}

function confirmCandidates() {
  const selected = (state.capture.candidates || []).filter((candidate) => candidate.selected);
  if (!selected.length) {
    showToast("请选择要入库的物品");
    return;
  }
  const roomId = state.capture.roomId;
  const placeId = state.capture.placeId;
  const nowText = new Date().toISOString().slice(0, 10);
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
    }));

  state.items = [...state.items, ...incoming];
  state.capture = { ...state.capture, candidates: [] };
  state.activeRoomId = roomId;
  state.activePlaceId = placeId;
  state.activeTab = "map";
  persist();
  render();
  showToast(incoming.length ? `已入库 ${incoming.length} 件物品` : "这些物品已经在当前位置");
}

function updateCandidate(id, field, value) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id ? { ...candidate, [field]: value } : candidate
  ));
  persist();
  render();
}

function toggleCandidate(id) {
  state.capture.candidates = (state.capture.candidates || []).map((candidate) => (
    candidate.id === id ? { ...candidate, selected: !candidate.selected } : candidate
  ));
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

function captureCameraFrame() {
  const video = document.querySelector("#cameraVideo");
  if (!video) return;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  stopCamera();
  state.capture.image = canvas.toDataURL("image/jpeg", 0.88);
  state.cameraOn = false;
  persist();
  render();
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
    const firstPlace = room.places[0];
    setState({ activeRoomId: room.id, activePlaceId: firstPlace.id });
    return;
  }

  const placeButton = event.target.closest("[data-place]");
  if (placeButton) {
    const place = getPlace(placeButton.dataset.place);
    setState({ activeRoomId: place.roomId, activePlaceId: place.id });
    return;
  }

  if (event.target.closest("[data-search]")) {
    performSearch();
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
      state.capture.candidates = [];
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
    showToast("已重置演示数据");
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-query-input]")) {
    state.query = event.target.value;
    persist();
    return;
  }

  const candidateField = event.target.closest("[data-candidate-field]");
  if (candidateField) {
    updateCandidate(candidateField.dataset.candidateField, candidateField.dataset.field, candidateField.value);
  }
});

document.addEventListener("change", (event) => {
  const candidateField = event.target.closest("[data-candidate-field]");
  if (candidateField) {
    updateCandidate(candidateField.dataset.candidateField, candidateField.dataset.field, candidateField.value);
    return;
  }

  if (event.target.matches("[data-capture-room]")) {
    const room = getRoom(event.target.value);
    state.capture.roomId = room.id;
    state.capture.placeId = room.places[0].id;
    state.capture.candidates = [];
    persist();
    render();
    return;
  }

  if (event.target.matches("[data-capture-place]")) {
    const place = getPlace(event.target.value);
    state.capture.roomId = place.roomId;
    state.capture.placeId = place.id;
    state.capture.candidates = [];
    persist();
    render();
    return;
  }

  if (event.target.matches("[data-file-input]")) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.capture.image = reader.result;
      state.capture.candidates = [];
      persist();
      render();
      showToast("照片已载入");
    };
    reader.readAsDataURL(file);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches("[data-query-input]")) {
    performSearch();
  }
});

window.addEventListener("beforeunload", stopCamera);

render();
performSearch();
