import { normalizeText } from "./text.js";

export function findBestItem(query, items, categoryLabels) {
  const q = normalizeText(query);
  if (!q) return null;
  let best = null;
  let bestScore = 0;
  for (const item of items) {
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

export function buildTrailParts(item, room, placePath = []) {
  const placeNames = placePath.map((place) => place.name);
  return [
    room.name,
    ...placeNames,
    item.container || "",
    item.name,
  ].filter(Boolean);
}
