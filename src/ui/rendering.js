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

export {
  escapeHtml,
  layoutCandidatePins,
  styleActiveCandidateLabel,
  styleBox,
  styleCandidatePin,
};
