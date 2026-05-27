#!/usr/bin/env python3
import argparse
import csv
import json
import shutil
import time
import urllib.error
import urllib.request
from pathlib import Path

import cv2


DEFAULT_SOURCE_DIR = Path("/tmp/home-memory-openimages")
DEFAULT_OUTPUT = Path("/tmp/home-memory-openimages-household-scenes/COCO")

HOUSEHOLD_LABELS = {
    "/m/04y4h8h": "Bathroom cabinet",
    "/m/03ssj5": "Bed",
    "/m/03__z0": "Bookcase",
    "/m/01s105": "Cabinetry",
    "/m/01mzpv": "Chair",
    "/m/05kyg_": "Chest of drawers",
    "/m/0d4w1": "Closet",
    "/m/078n6m": "Coffee table",
    "/m/02522": "Computer monitor",
    "/m/02crq1": "Couch",
    "/m/0642b4": "Cupboard",
    "/m/01y9k5": "Desk",
    "/m/02dgv": "Door",
    "/m/0fqfqc": "Drawer",
    "/m/047j0r": "Filing cabinet",
    "/m/03fp41": "Houseplant",
    "/m/0h8n5zk": "Kitchen & dining room table",
    "/m/0h99cwc": "Kitchen appliance",
    "/m/0dtln": "Lamp",
    "/m/0fx9l": "Microwave oven",
    "/m/029bxz": "Oven",
    "/m/040b_t": "Refrigerator",
    "/m/0qjjc": "Remote control",
    "/m/0gjbg72": "Shelf",
    "/m/0130jx": "Sink",
    "/m/03m3pdh": "Sofa bed",
    "/m/026qbn5": "Studio couch",
    "/m/04bcr3": "Table",
    "/m/07c52": "Television",
    "/m/09g1w": "Toilet",
    "/m/02s195": "Vase",
    "/m/02vkqh8": "Wardrobe",
    "/m/0174k2": "Washing machine",
    "/m/0d4v4": "Window",
    "/m/031b6r": "Window blind",
}

ANCHOR_LABELS = {
    "/m/04y4h8h",
    "/m/03__z0",
    "/m/01s105",
    "/m/05kyg_",
    "/m/0d4w1",
    "/m/0642b4",
    "/m/0fqfqc",
    "/m/047j0r",
    "/m/0gjbg72",
    "/m/07c52",
    "/m/02vkqh8",
}


def read_annotations(source_dir):
    annotations = {}
    with (source_dir / "validation-annotations-bbox.csv").open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            label = row["LabelName"]
            if label not in HOUSEHOLD_LABELS:
                continue
            if row.get("IsDepiction") == "1" or row.get("IsGroupOf") == "1":
                continue
            xmin = float(row["XMin"])
            xmax = float(row["XMax"])
            ymin = float(row["YMin"])
            ymax = float(row["YMax"])
            area = max(0.0, xmax - xmin) * max(0.0, ymax - ymin)
            if area < 0.006 or area > 0.92:
                continue
            annotations.setdefault(row["ImageID"], []).append({
                "label": label,
                "displayName": HOUSEHOLD_LABELS[label],
                "boxNorm": [xmin, ymin, xmax, ymax],
                "area": area,
                "truncated": row.get("IsTruncated") == "1",
                "occluded": row.get("IsOccluded") == "1",
            })
    return annotations


def read_images(source_dir):
    images = {}
    with (source_dir / "validation-images-with-rotation.csv").open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            images[row["ImageID"]] = row
    return images


def image_score(boxes):
    labels = {box["label"] for box in boxes}
    anchor_count = sum(1 for box in boxes if box["label"] in ANCHOR_LABELS)
    storage_count = len(labels & ANCHOR_LABELS)
    box_count = len(boxes)
    medium_boxes = sum(1 for box in boxes if 0.015 <= box["area"] <= 0.45)
    return anchor_count * 8 + storage_count * 5 + box_count * 2 + medium_boxes


def download(urls, target, timeout=6):
    headers = {"User-Agent": "home-memory-system/0.1 household-scene-builder"}
    for url in urls:
        if not url:
            continue
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=timeout) as response:
                target.write_bytes(response.read())
            image = cv2.imread(str(target))
            if image is not None and min(image.shape[:2]) >= 220:
                return True
        except (urllib.error.URLError, TimeoutError, OSError):
            pass
    target.unlink(missing_ok=True)
    return False


def split_for_index(index):
    return "val" if index % 6 == 0 else "train"


def build_dataset(args):
    source_dir = args.source_dir
    out = args.output
    if out.exists():
        shutil.rmtree(out)
    (out / "annotations").mkdir(parents=True, exist_ok=True)
    records_dir = out / "source-images"
    records_dir.mkdir(parents=True, exist_ok=True)

    annotations = read_annotations(source_dir)
    images = read_images(source_dir)
    candidates = []
    for image_id, boxes in annotations.items():
        if image_id not in images:
            continue
        labels = {box["label"] for box in boxes}
        if len(boxes) < args.min_boxes or not labels.intersection(ANCHOR_LABELS):
            continue
        candidates.append((image_score(boxes), image_id, boxes))
    candidates.sort(reverse=True)
    print(f"candidate images: {len(candidates)}", flush=True)

    selected = []
    attempts = 0
    for _, image_id, boxes in candidates:
        if len(selected) >= args.count:
            break
        attempts += 1
        meta = images[image_id]
        image_path = records_dir / f"{image_id}.jpg"
        ok = download([meta.get("Thumbnail300KURL"), meta.get("OriginalURL")], image_path, timeout=args.timeout)
        if not ok:
            continue
        image = cv2.imread(str(image_path))
        if image is None:
            image_path.unlink(missing_ok=True)
            continue
        height, width = image.shape[:2]
        if width / max(height, 1) < 0.55 or width / max(height, 1) > 2.2:
            image_path.unlink(missing_ok=True)
            continue
        selected.append({
            "imageId": image_id,
            "source": meta,
            "path": image_path,
            "width": width,
            "height": height,
            "boxes": boxes,
        })
        print(f"selected {len(selected):02d}/{args.count} {image_id} boxes={len(boxes)}", flush=True)
        time.sleep(args.delay)

    payloads = {"train": {"images": [], "annotations": []}, "val": {"images": [], "annotations": []}}
    source_manifest = []
    for index, record in enumerate(selected, 1):
        split = split_for_index(index)
        image_dir = out / f"{split}2017"
        image_dir.mkdir(parents=True, exist_ok=True)
        image_id = len(payloads[split]["images"]) + 1
        file_name = f"openimages_household_{image_id:04d}.jpg"
        shutil.copy2(record["path"], image_dir / file_name)
        payloads[split]["images"].append({
            "id": image_id,
            "file_name": file_name,
            "width": record["width"],
            "height": record["height"],
            "openImagesId": record["imageId"],
        })
        source_manifest.append({
            "split": split,
            "fileName": file_name,
            "openImagesId": record["imageId"],
            "license": record["source"].get("License", ""),
            "originalLandingUrl": record["source"].get("OriginalLandingURL", ""),
            "boxCount": len(record["boxes"]),
        })
        for box in record["boxes"]:
            x1, y1, x2, y2 = box["boxNorm"]
            x = x1 * record["width"]
            y = y1 * record["height"]
            w = (x2 - x1) * record["width"]
            h = (y2 - y1) * record["height"]
            if w < 3 or h < 3:
                continue
            payloads[split]["annotations"].append({
                "id": len(payloads[split]["annotations"]) + 1,
                "image_id": image_id,
                "category_id": 1,
                "bbox": [round(x, 3), round(y, 3), round(w, 3), round(h, 3)],
                "area": round(w * h, 3),
                "iscrowd": 0,
                "quality": "strong-openimages",
                "sourceLabel": box["displayName"],
            })

    categories = [{"id": 1, "name": "household_subject", "supercategory": "household"}]
    for split, payload in payloads.items():
        (out / "annotations" / f"instances_{split}2017.json").write_text(json.dumps({
            "info": {
                "description": "Open Images household large-scene strong annotations for Home Memory YOLOX.",
                "source": "Open Images validation bounding boxes",
                "licenseNote": "Per-image license and landing URL are stored in source-manifest.json.",
            },
            "licenses": [],
            "categories": categories,
            **payload,
        }, ensure_ascii=False), encoding="utf-8")

    summary = {
        "selected": len(selected),
        "attempts": attempts,
        "trainImages": len(payloads["train"]["images"]),
        "trainAnnotations": len(payloads["train"]["annotations"]),
        "valImages": len(payloads["val"]["images"]),
        "valAnnotations": len(payloads["val"]["annotations"]),
        "output": str(out),
    }
    (out / "source-manifest.json").write_text(json.dumps(source_manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    (out / "dataset-summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--count", type=int, default=50)
    parser.add_argument("--min-boxes", type=int, default=4)
    parser.add_argument("--delay", type=float, default=0.02)
    parser.add_argument("--timeout", type=float, default=6)
    args = parser.parse_args()
    build_dataset(args)


if __name__ == "__main__":
    main()
