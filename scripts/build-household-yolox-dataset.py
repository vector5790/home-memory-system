#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import shutil
from pathlib import Path

import cv2
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = Path("/tmp/home-memory-yolox-household-dataset/COCO")


def read_json(path, fallback=None):
    path = ROOT / path if not Path(path).is_absolute() else Path(path)
    if not path.exists():
        if fallback is not None:
            return fallback
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_path(value):
    path = Path(value or "")
    return path if path.is_absolute() else ROOT / path


def stable_split(key, val_ratio):
    digest = hashlib.sha1(str(key).encode("utf-8")).hexdigest()
    return "val" if int(digest[:8], 16) / 0xFFFFFFFF < val_ratio else "train"


def image_size(path):
    image = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if image is None:
        return None
    height, width = image.shape[:2]
    return width, height, image


def clamp_box(box, width, height):
    x = max(0.0, min(float(box[0]), width - 1))
    y = max(0.0, min(float(box[1]), height - 1))
    w = max(1.0, min(float(box[2]), width - x))
    h = max(1.0, min(float(box[3]), height - y))
    if w * h < 16:
        return None
    return [round(x, 3), round(y, 3), round(w, 3), round(h, 3)]


def pct_box_to_abs(box, width, height):
    if not box:
        return None
    return clamp_box([
        float(box.get("x", 0)) * width / 100.0,
        float(box.get("y", 0)) * height / 100.0,
        float(box.get("w", 0)) * width / 100.0,
        float(box.get("h", 0)) * height / 100.0,
    ], width, height)


def inferred_foreground_box(image):
    if image is None:
        return None
    if image.ndim == 3 and image.shape[2] == 4:
        alpha = image[:, :, 3]
        ys, xs = np.where(alpha > 12)
        if xs.size and ys.size:
            return [int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)]
        image = image[:, :, :3]
    if image.ndim == 2:
        bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    else:
        bgr = image[:, :, :3]
    height, width = bgr.shape[:2]
    border = np.concatenate([
        bgr[: max(2, height // 30), :, :].reshape(-1, 3),
        bgr[-max(2, height // 30):, :, :].reshape(-1, 3),
        bgr[:, : max(2, width // 30), :].reshape(-1, 3),
        bgr[:, -max(2, width // 30):, :].reshape(-1, 3),
    ], axis=0)
    bg = np.median(border.astype(np.float32), axis=0)
    diff = np.linalg.norm(bgr.astype(np.float32) - bg, axis=2)
    threshold = max(18.0, float(np.percentile(diff, 82)))
    mask = (diff > threshold).astype(np.uint8) * 255
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        inset_x = width * 0.04
        inset_y = height * 0.04
        return [inset_x, inset_y, width - inset_x * 2, height - inset_y * 2]
    boxes = [cv2.boundingRect(c) for c in contours if cv2.contourArea(c) > width * height * 0.002]
    if not boxes:
        inset_x = width * 0.04
        inset_y = height * 0.04
        return [inset_x, inset_y, width - inset_x * 2, height - inset_y * 2]
    x1 = min(x for x, y, w, h in boxes)
    y1 = min(y for x, y, w, h in boxes)
    x2 = max(x + w for x, y, w, h in boxes)
    y2 = max(y + h for x, y, w, h in boxes)
    pad_x = width * 0.015
    pad_y = height * 0.015
    return [x1 - pad_x, y1 - pad_y, (x2 - x1) + pad_x * 2, (y2 - y1) + pad_y * 2]


def add_record(records, image_path, boxes, source, split_key, max_weak=999999):
    resolved = resolve_path(image_path)
    loaded = image_size(resolved)
    if not loaded:
        return False
    width, height, image = loaded
    abs_boxes = []
    for item in boxes:
        if item.get("percent"):
            box = pct_box_to_abs(item["box"], width, height)
        elif item.get("infer"):
            box = clamp_box(inferred_foreground_box(image), width, height)
        else:
            box = clamp_box(item["box"], width, height)
        if not box:
            continue
        area_ratio = box[2] * box[3] / float(width * height)
        if area_ratio < 0.001:
            continue
        abs_boxes.append({**item, "box": box, "area": round(box[2] * box[3], 3)})
    if not abs_boxes:
        return False
    weak_count = sum(1 for b in abs_boxes if b.get("quality") == "weak")
    if weak_count > max_weak:
        return False
    records.append({
        "path": resolved,
        "width": width,
        "height": height,
        "boxes": abs_boxes,
        "source": source,
        "split": stable_split(split_key, 0.12),
    })
    return True


def collect_manifest_boxes(records, args):
    manifest = read_json("data/vision-household-image-manifest.cn.json", {})
    limit = args.max_manifest_images
    count = 0
    for sample in manifest.get("samples", []):
        if limit and count >= limit:
            break
        image_path = sample.get("imagePath") or sample.get("localPath")
        if not image_path:
            continue
        boxes = []
        if sample.get("gtBox"):
            boxes.append({"box": sample["gtBox"], "percent": True, "quality": "strong", "note": "manifest-gt"})
        elif args.include_weak_product_boxes:
            boxes.append({"infer": True, "quality": "weak", "note": "foreground-from-product-image"})
        if add_record(records, image_path, boxes, "cn-household-manifest", sample.get("id", image_path)):
            count += 1


def collect_real_boxes(records):
    payload = read_json("data/vision-real-photo-sources.json", {})
    for sample in payload.get("images", []):
        if sample.get("box") and sample.get("imagePath"):
            add_record(records, sample["imagePath"], [{
                "box": sample["box"],
                "percent": True,
                "quality": "strong",
                "note": "wikimedia-manual-box",
            }], "vision-real-photo-sources", sample.get("id", sample["imagePath"]))


def collect_reviewed_detection_boxes(records):
    review = read_json("data/generated/vision-subject-detection-review.cn.first10-v3-nms.json", {})
    run = read_json("data/generated/vision-subject-detection-run.cn.first10-v2.json", {})
    accurate = set()
    for item in review.get("reviews", []):
        for det_id, verdict in (item.get("boxVerdicts") or {}).items():
            if verdict == "accurate":
                accurate.add(det_id)
    if not accurate:
        return
    by_image = {}
    for result in run.get("results", []):
        if result.get("imageVariant") != "original":
            continue
        boxes = []
        for detection in result.get("detections", []):
            if detection.get("id") in accurate and detection.get("box"):
                boxes.append({
                    "box": detection["box"],
                    "percent": True,
                    "quality": "strong",
                    "note": "reviewed-detection-accurate",
                })
        if boxes:
            path = (result.get("image") or {}).get("path")
            by_image.setdefault(path, []).extend(boxes)
    for path, boxes in by_image.items():
        add_record(records, path, boxes, "reviewed-subject-detections", path)


def collect_living_room_boxes(records):
    for file_name in [
        "data/generated/query-images/living-room-grounding-dino-t0-top10-boxes.json",
    ]:
        payload = read_json(file_name, {})
        boxes = []
        for detection in payload.get("detections", []):
            score = float(detection.get("score", 0))
            if score < 0.10:
                continue
            boxes.append({
                "box": detection["box"],
                "percent": True,
                "quality": "weak",
                "note": f"living-room-dino-score-{score:.3f}",
            })
        if boxes:
            add_record(records, "data/generated/query-images/living-room-query.jpg", boxes, "living-room-dino-pseudo", file_name)


def copy_or_link(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        return
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)


def write_coco(records, out_dir):
    categories = [{"id": 1, "name": "household_subject", "supercategory": "household"}]
    stats = {"train": {"images": 0, "annotations": 0}, "val": {"images": 0, "annotations": 0}}
    for split in ["train", "val"]:
        split_records = [r for r in records if r["split"] == split]
        images = []
        annotations = []
        image_dir = out_dir / f"{split}2017"
        for image_id, record in enumerate(split_records, 1):
            ext = record["path"].suffix.lower() or ".jpg"
            file_name = f"{image_id:08d}{ext}"
            copy_or_link(record["path"], image_dir / file_name)
            images.append({
                "id": image_id,
                "file_name": file_name,
                "width": record["width"],
                "height": record["height"],
                "source": record["source"],
            })
            for box in record["boxes"]:
                ann_id = len(annotations) + 1
                annotations.append({
                    "id": ann_id,
                    "image_id": image_id,
                    "category_id": 1,
                    "bbox": box["box"],
                    "area": box["area"],
                    "iscrowd": 0,
                    "quality": box.get("quality", ""),
                    "note": box.get("note", ""),
                })
        ann_dir = out_dir / "annotations"
        ann_dir.mkdir(parents=True, exist_ok=True)
        (ann_dir / f"instances_{split}2017.json").write_text(json.dumps({
            "info": {
                "description": "Weak first-pass household subject detection dataset for YOLOX.",
                "labelPolicy": "single class household_subject; final item names remain embedding-retrieved",
            },
            "licenses": [],
            "categories": categories,
            "images": images,
            "annotations": annotations,
        }, ensure_ascii=False), encoding="utf-8")
        stats[split] = {"images": len(images), "annotations": len(annotations)}
    return stats


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--max-manifest-images", type=int, default=900)
    parser.add_argument("--include-weak-product-boxes", action="store_true")
    args = parser.parse_args()
    out_dir = Path(args.output)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    records = []
    collect_manifest_boxes(records, args)
    collect_real_boxes(records)
    collect_reviewed_detection_boxes(records)
    collect_living_room_boxes(records)
    seen = set()
    deduped = []
    for record in records:
        key = str(record["path"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(record)
    stats = write_coco(deduped, out_dir)
    quality = {}
    for record in deduped:
        for box in record["boxes"]:
            quality[box.get("quality", "unknown")] = quality.get(box.get("quality", "unknown"), 0) + 1
    summary = {
        "output": str(out_dir),
        "records": len(deduped),
        "stats": stats,
        "quality": quality,
    }
    (out_dir / "dataset-summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
