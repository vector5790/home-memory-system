export function createDateDomain(today = new Date()) {
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

  return {
    addDaysIso,
    dateToIso,
    daysUntil,
    formatDate,
    getCalendarDays,
    monthKeyFromIso,
    moveMonthKey,
    nextMondayIso,
  };
}
