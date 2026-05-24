export function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function clampBox(box = {}) {
  const width = clampNumber(box.w ?? 20, 6, 100);
  const height = clampNumber(box.h ?? 14, 6, 100);
  return {
    x: clampNumber(box.x ?? 10, 0, 100 - width),
    y: clampNumber(box.y ?? 10, 0, 100 - height),
    w: width,
    h: height,
  };
}

export function boxArea(box) {
  return Math.max(0, box.w) * Math.max(0, box.h);
}

export function boxIou(left, right) {
  const x1 = Math.max(left.x, right.x);
  const y1 = Math.max(left.y, right.y);
  const x2 = Math.min(left.x + left.w, right.x + right.w);
  const y2 = Math.min(left.y + left.h, right.y + right.h);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = boxArea(left) + boxArea(right) - intersection;
  return union ? intersection / union : 0;
}

export function dedupeCandidates(candidates, maxItems = 10, overlapThreshold = 0.42) {
  const selected = [];
  for (const candidate of candidates.sort((a, b) => b.confidence - a.confidence)) {
    if (selected.some((existing) => boxIou(existing.box, candidate.box) > overlapThreshold)) continue;
    selected.push(candidate);
    if (selected.length >= maxItems) break;
  }
  return selected;
}
