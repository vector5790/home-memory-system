#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


DEFAULT_PREDICTIONS = Path("/tmp/home-memory-yolox-runs/visual-eval-v7-gold/predictions.json")
DEFAULT_OUTPUT = Path("/tmp/home-memory-yolox-runs/visual-eval-v7-gold-dynamic-postprocess")


def area(box: list[float]) -> float:
    return max(0.0, box[2] - box[0]) * max(0.0, box[3] - box[1])


def iou(a: list[float], b: list[float]) -> float:
    x1 = max(a[0], b[0])
    y1 = max(a[1], b[1])
    x2 = min(a[2], b[2])
    y2 = min(a[3], b[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    union = area(a) + area(b) - inter
    return inter / union if union > 0 else 0.0


def containment(inner: list[float], outer: list[float]) -> float:
    x1 = max(inner[0], outer[0])
    y1 = max(inner[1], outer[1])
    x2 = min(inner[2], outer[2])
    y2 = min(inner[3], outer[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    inner_area = area(inner)
    return inter / inner_area if inner_area > 0 else 0.0


def shape(box: list[float], width: int, height: int) -> tuple[float, float]:
    box_width = max(1.0, box[2] - box[0])
    box_height = max(1.0, box[3] - box[1])
    return box_width / box_height, area(box) / max(1.0, width * height)


def nms(preds: list[dict], iou_threshold: float, limit: int) -> list[dict]:
    selected: list[dict] = []
    for pred in sorted(preds, key=lambda item: item.get("score", 0), reverse=True):
        if any(iou(pred["box"], kept["box"]) >= iou_threshold for kept in selected):
            continue
        selected.append(pred)
        if len(selected) >= limit:
            break
    return selected


def suppress_near_duplicates(preds: list[dict]) -> list[dict]:
    selected: list[dict] = []
    for pred in sorted(preds, key=lambda item: item.get("score", 0), reverse=True):
        pred_area = area(pred["box"])
        duplicate = False
        for kept in selected:
            kept_area = area(kept["box"])
            area_similarity = min(pred_area, kept_area) / max(1.0, max(pred_area, kept_area))
            if iou(pred["box"], kept["box"]) >= 0.78:
                duplicate = True
                break
            if area_similarity >= 0.68 and (
                containment(pred["box"], kept["box"]) >= 0.92
                or containment(kept["box"], pred["box"]) >= 0.92
            ):
                duplicate = True
                break
        if not duplicate:
            selected.append(pred)
    return selected


def postprocess(preds: list[dict], width: int, height: int) -> list[dict]:
    candidates = nms(preds, 0.45, 30)
    top_score = max([pred.get("score", 0) for pred in candidates] or [0])
    filtered = []
    for pred in candidates:
        aspect, area_ratio = shape(pred["box"], width, height)
        score = float(pred.get("score", 0))
        if area_ratio <= 0.00035:
            continue
        if area_ratio <= 0.0008 and score < 0.32:
            continue
        if area_ratio >= 0.92:
            continue
        if (aspect >= 10 or aspect <= 0.1) and score < 0.45:
            continue
        if top_score >= 0.5 and score < max(0.12, top_score * 0.18):
            continue
        filtered.append(pred)

    filtered = suppress_near_duplicates(filtered)
    useful = [
        pred for pred in filtered
        if pred.get("score", 0) >= 0.2 and 0.001 <= shape(pred["box"], width, height)[1] <= 0.75
    ]
    strong = [pred for pred in useful if pred.get("score", 0) >= 0.35]
    if len(useful) <= 6 and len(strong) <= 2:
        limit = 5
    elif len(useful) >= 12 or len(strong) >= 7:
        limit = 15
    else:
        limit = 10
    return sorted(filtered, key=lambda item: item.get("score", 0), reverse=True)[:limit]


def draw_boxes(draw: ImageDraw.ImageDraw, boxes: list[dict], color: tuple[int, int, int], label_key: str) -> None:
    for index, item in enumerate(boxes, start=1):
        box = item["box"]
        draw.rectangle(box, outline=color, width=4)
        label = str(item.get(label_key) or index)
        draw.rectangle([box[0], max(0, box[1] - 18), box[0] + 8 + len(label) * 8, box[1]], fill=color)
        draw.text((box[0] + 3, max(0, box[1] - 17)), label, fill=(255, 255, 255))


def make_card(root: Path, row: dict, output_dir: Path, index: int) -> Image.Image:
    meta = row["image"]
    image_path = root / "val2017" / meta["file_name"]
    image = Image.open(image_path).convert("RGB")
    preds = postprocess(row.get("pred", []), image.width, image.height)
    gt = row.get("gt", [])

    canvas = image.copy()
    draw = ImageDraw.Draw(canvas)
    draw_boxes(draw, gt, (30, 200, 80), "label")
    draw_boxes(draw, preds, (230, 70, 60), "score")

    max_width = 520
    ratio = min(1.0, max_width / canvas.width)
    preview = canvas.resize((round(canvas.width * ratio), round(canvas.height * ratio)))
    title_height = 40
    card = Image.new("RGB", (preview.width, preview.height + title_height), (245, 245, 245))
    card.paste(preview, (0, title_height))
    card_draw = ImageDraw.Draw(card)
    card_draw.text(
        (8, 10),
        f"{index:02d} {meta['file_name']}  gt={len(gt)} pred={len(preds)}",
        fill=(0, 0, 0),
    )
    output_path = output_dir / f"{index:02d}_{meta['file_name']}"
    canvas.save(output_path, quality=92)
    return card


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--predictions", type=Path, default=DEFAULT_PREDICTIONS)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    payload = json.loads(args.predictions.read_text())
    root = Path(payload["root"])
    args.output_dir.mkdir(parents=True, exist_ok=True)
    cards = [make_card(root, row, args.output_dir, index) for index, row in enumerate(payload["rows"], start=1)]
    if not cards:
        return
    columns = 3
    gap = 14
    width = max(card.width for card in cards)
    height = max(card.height for card in cards)
    rows = (len(cards) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * width + (columns - 1) * gap, rows * height + (rows - 1) * gap), (230, 230, 230))
    for index, card in enumerate(cards):
        x = (index % columns) * (width + gap)
        y = (index // columns) * (height + gap)
        sheet.paste(card, (x, y))
    sheet.save(args.output_dir / "gold-v7-dynamic-postprocess-contact-sheet.jpg", quality=92)
    print(args.output_dir / "gold-v7-dynamic-postprocess-contact-sheet.jpg")


if __name__ == "__main__":
    main()
