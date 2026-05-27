#!/usr/bin/env python3
import argparse
import hashlib
import json
import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


DEFAULT_GOLD = Path("/tmp/home-memory-yolox-fixed-eval-gold-v1/COCO")
DEFAULT_OPENIMAGES = Path("/tmp/home-memory-openimages-household-scenes/COCO")
DEFAULT_STRONG = Path("/tmp/home-memory-yolox-household-strong-dataset/COCO")
DEFAULT_OUTPUT = Path("/tmp/home-memory-yolox-fixed-eval-expanded-v1/COCO")


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_size(path):
    with Image.open(path) as image:
        return image.width, image.height


def clamp_box(box, width, height):
    x, y, w, h = [float(value) for value in box]
    x = max(0.0, min(width - 1.0, x))
    y = max(0.0, min(height - 1.0, y))
    w = max(1.0, min(width - x, w))
    h = max(1.0, min(height - y, h))
    return [round(x, 3), round(y, 3), round(w, 3), round(h, 3)]


def add_image(payload, source_path, image_dir, file_name, tier, source_dataset, source_image):
    width, height = image_size(source_path)
    digest = sha256(source_path)
    image_id = len(payload["images"]) + 1
    shutil.copy2(source_path, image_dir / file_name)
    payload["images"].append({
        "id": image_id,
        "file_name": file_name,
        "width": width,
        "height": height,
        "sha256": digest,
        "tier": tier,
        "sourceDataset": source_dataset,
        "sourceImage": source_image,
    })
    return image_id, width, height, digest


def add_annotation(payload, image_id, bbox, source_label, quality, width, height):
    bbox = clamp_box(bbox, width, height)
    payload["annotations"].append({
        "id": len(payload["annotations"]) + 1,
        "image_id": image_id,
        "category_id": 1,
        "bbox": bbox,
        "area": round(bbox[2] * bbox[3], 3),
        "iscrowd": 0,
        "sourceLabel": source_label or "household_subject",
        "quality": quality,
    })


def append_coco_split(payload, source_root, split, image_dir, prefix, tier, include_quality=None, limit=None, seen_hashes=None):
    annotation_path = source_root / "annotations" / f"instances_{split}2017.json"
    if not annotation_path.exists():
        return {"source": str(source_root), "split": split, "images": 0, "annotations": 0, "skipped": True}
    data = read_json(annotation_path)
    anns_by_image = {}
    for ann in data.get("annotations", []):
        if include_quality and ann.get("quality") not in include_quality:
            continue
        anns_by_image.setdefault(ann["image_id"], []).append(ann)
    used_images = 0
    used_annotations = 0
    skipped_duplicates = 0
    for image in data.get("images", []):
        if limit is not None and used_images >= limit:
            break
        annotations = anns_by_image.get(image["id"], [])
        if not annotations:
            continue
        source_path = source_root / f"{split}2017" / image["file_name"]
        if not source_path.exists():
            continue
        digest = sha256(source_path)
        if seen_hashes is not None and digest in seen_hashes:
            skipped_duplicates += 1
            continue
        file_name = f"{prefix}_{split}_{image['file_name']}"
        new_image_id, width, height, digest = add_image(payload, source_path, image_dir, file_name, tier, str(source_root), image["file_name"])
        if seen_hashes is not None:
            seen_hashes.add(digest)
        used_images += 1
        for ann in annotations:
            add_annotation(
                payload,
                new_image_id,
                ann["bbox"],
                ann.get("sourceLabel", ann.get("source_label", "household_subject")),
                ann.get("quality", tier),
                width,
                height,
            )
            used_annotations += 1
    return {
        "source": str(source_root),
        "split": split,
        "images": used_images,
        "annotations": used_annotations,
        "skippedDuplicates": skipped_duplicates,
        "tier": tier,
    }


def draw_overlay(dataset_dir, payload):
    review_dir = dataset_dir / "review"
    overlay_dir = review_dir / "overlay"
    overlay_dir.mkdir(parents=True, exist_ok=True)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 14)
        title_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
    except Exception:
        font = ImageFont.load_default()
        title_font = font
    anns_by_image = {}
    for ann in payload["annotations"]:
        anns_by_image.setdefault(ann["image_id"], []).append(ann)
    cards = []
    for image in payload["images"]:
        path = dataset_dir / "val2017" / image["file_name"]
        canvas = Image.open(path).convert("RGB")
        draw = ImageDraw.Draw(canvas)
        for index, ann in enumerate(anns_by_image.get(image["id"], []), 1):
            x, y, w, h = ann["bbox"]
            box = [x, y, x + w, y + h]
            color = (40, 220, 80) if image["tier"] == "gold-human-confirmed" else (250, 170, 30)
            for offset in range(2):
                draw.rectangle([box[0] - offset, box[1] - offset, box[2] + offset, box[3] + offset], outline=color)
            label = f"{index} {ann.get('sourceLabel', '')[:18]}"
            draw.text((x + 2, max(2, y - 16)), label, fill=color, font=font)
        title = f"{image['id']:03d} {image['tier']} boxes={len(anns_by_image.get(image['id'], []))}"
        title_box = draw.textbbox((0, 0), title, font=title_font)
        draw.rectangle([0, 0, canvas.width, title_box[3] + 12], fill=(0, 0, 0))
        draw.text((8, 6), title, fill=(255, 255, 255), font=title_font)
        output_path = overlay_dir / f"{image['id']:03d}_{image['file_name']}"
        canvas.save(output_path, quality=92)
        thumb = canvas.copy()
        thumb.thumbnail((360, 270))
        card = Image.new("RGB", (380, 320), "white")
        card_draw = ImageDraw.Draw(card)
        card_draw.text((8, 8), title, fill=(0, 0, 0), font=font)
        card.paste(thumb, ((380 - thumb.width) // 2, 38))
        cards.append(card)
    if cards:
        cols = 3
        rows = math.ceil(len(cards) / cols)
        sheet = Image.new("RGB", (cols * 380, rows * 320), (235, 235, 235))
        for index, card in enumerate(cards):
            sheet.paste(card, ((index % cols) * 380, (index // cols) * 320))
        sheet.save(review_dir / "expanded-fixed-eval-contact-sheet.jpg", quality=92)


def build(args):
    output = args.output
    if output.exists():
        shutil.rmtree(output)
    image_dir = output / "val2017"
    annotation_dir = output / "annotations"
    image_dir.mkdir(parents=True, exist_ok=True)
    annotation_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "info": {
            "description": "Expanded fixed evaluation set for Home Memory household subject detection. Gold v1 is human confirmed; candidate tiers still need spot review before becoming official gold.",
            "version": "2026-05-28-expanded-v1",
        },
        "licenses": [],
        "categories": [{"id": 1, "name": "household_subject", "supercategory": "household"}],
        "images": [],
        "annotations": [],
    }
    seen_hashes = set()
    sources = []
    sources.append(append_coco_split(payload, args.gold, "val", image_dir, "gold", "gold-human-confirmed", seen_hashes=seen_hashes))
    sources.append(append_coco_split(payload, args.openimages, "train", image_dir, "openimages", "candidate-openimages-human-boxes", limit=args.openimages_train_limit, seen_hashes=seen_hashes))
    sources.append(append_coco_split(payload, args.openimages, "val", image_dir, "openimages", "candidate-openimages-human-boxes", limit=args.openimages_val_limit, seen_hashes=seen_hashes))
    sources.append(append_coco_split(payload, args.strong, "train", image_dir, "strong", "candidate-strong-product-boxes", include_quality={"strong"}, limit=args.strong_train_limit, seen_hashes=seen_hashes))
    sources.append(append_coco_split(payload, args.strong, "val", image_dir, "strong", "candidate-strong-product-boxes", include_quality={"strong"}, limit=args.strong_val_limit, seen_hashes=seen_hashes))
    (annotation_dir / "instances_val2017.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    tiers = {}
    for image in payload["images"]:
        tiers.setdefault(image["tier"], {"images": 0, "annotations": 0})
        tiers[image["tier"]]["images"] += 1
    for ann in payload["annotations"]:
        image = payload["images"][ann["image_id"] - 1]
        tiers[image["tier"]]["annotations"] += 1
    summary = {
        "output": str(output),
        "images": len(payload["images"]),
        "annotations": len(payload["annotations"]),
        "tiers": tiers,
        "sources": sources,
        "policy": "Do not use any image from this dataset in train2017. Keep gold-human-confirmed separate from candidate tiers until human reviewed.",
    }
    (output / "dataset-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    draw_overlay(output, payload)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--gold", type=Path, default=DEFAULT_GOLD)
    parser.add_argument("--openimages", type=Path, default=DEFAULT_OPENIMAGES)
    parser.add_argument("--strong", type=Path, default=DEFAULT_STRONG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--openimages-train-limit", type=int, default=None)
    parser.add_argument("--openimages-val-limit", type=int, default=None)
    parser.add_argument("--strong-train-limit", type=int, default=None)
    parser.add_argument("--strong-val-limit", type=int, default=None)
    build(parser.parse_args())


if __name__ == "__main__":
    main()
