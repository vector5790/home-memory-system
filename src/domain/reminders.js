export function createReminderDomain({
  allDayReminderOffsetLabels,
  clampNumber,
  customOffsetUnitLabels,
  dateToIso,
  daysUntil,
  formatDate,
  repeatLabels,
  timedReminderOffsetLabels,
  today = new Date(),
  createId,
}) {
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

  return {
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
  };
}
