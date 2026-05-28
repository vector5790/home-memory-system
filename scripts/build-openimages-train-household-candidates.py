#!/usr/bin/env python3
import argparse
import csv
import heapq
import json
import shutil
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image


DEFAULT_SOURCE_DIR = Path("/tmp/home-memory-openimages-train")
DEFAULT_OUTPUT = Path("/tmp/home-memory-openimages-train-household-candidates/COCO")

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


def box_area(row):
    return max(0.0, float(row["XMax"]) - float(row["XMin"])) * max(0.0, float(row["YMax"]) - float(row["YMin"]))


def score_boxes(boxes):
    labels = {box["label"] for box in boxes}
    anchor_count = sum(1 for box in boxes if box["label"] in ANCHOR_LABELS)
    storage_types = len(labels & ANCHOR_LABELS)
    box_count = len(boxes)
    medium_boxes = sum(1 for box in boxes if 0.012 <= box["area"] <= 0.42)
    repeated_storage = sum(1 for box in boxes if box["label"] in {"/m/0fqfqc", "/m/0gjbg72", "/m/0642b4", "/m/01s105"})
    return anchor_count * 10 + storage_types * 7 + box_count * 2 + medium_boxes + repeated_storage * 2


def collect_candidate_boxes(annotation_path, min_boxes, heap_size):
    by_image = {}
    seen_rows = 0
    kept_rows = 0
    with annotation_path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            seen_rows += 1
            label = row["LabelName"]
            if label not in HOUSEHOLD_LABELS:
                continue
            if row.get("IsDepiction") == "1" or row.get("IsGroupOf") == "1":
                continue
            area = box_area(row)
            if area < 0.004 or area > 0.92:
                continue
            by_image.setdefault(row["ImageID"], []).append({
                "label": label,
                "displayName": HOUSEHOLD_LABELS[label],
                "boxNorm": [float(row["XMin"]), float(row["YMin"]), float(row["XMax"]), float(row["YMax"])],
                "area": area,
                "truncated": row.get("IsTruncated") == "1",
                "occluded": row.get("IsOccluded") == "1",
            })
            kept_rows += 1
    heap = []
    for image_id, boxes in by_image.items():
        labels = {box["label"] for box in boxes}
        if len(boxes) < min_boxes or not labels.intersection(ANCHOR_LABELS):
            continue
        score = score_boxes(boxes)
        item = (score, image_id)
        if len(heap) < heap_size:
            heapq.heappush(heap, item)
        elif score > heap[0][0]:
            heapq.heapreplace(heap, item)
    selected = sorted(heap, reverse=True)
    return by_image, selected, {"seenRows": seen_rows, "keptHouseholdRows": kept_rows, "candidateImages": len(by_image)}


def read_image_metadata(path, wanted_ids):
    records = {}
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            image_id = row["ImageID"]
            if image_id in wanted_ids:
                records[image_id] = row
    return records


def download_one(record, target, timeout):
    headers = {"User-Agent": "home-memory-system/0.1 openimages-train-candidate-builder"}
    urls = [record.get("Thumbnail300KURL"), record.get("OriginalURL")]
    for url in urls:
        if not url:
            continue
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=timeout) as response:
                target.write_bytes(response.read())
            with Image.open(target) as image:
                width, height = image.size
                if min(width, height) >= 220:
                    return {"ok": True, "width": width, "height": height}
        except (urllib.error.URLError, TimeoutError, OSError, Image.UnidentifiedImageError):
            target.unlink(missing_ok=True)
    return {"ok": False}


def split_for_index(index):
    return "val" if index % 8 == 0 else "train"


def write_coco(selected, boxes_by_image, metadata, source_images, output, max_images):
    if output.exists():
        shutil.rmtree(output)
    (output / "annotations").mkdir(parents=True, exist_ok=True)
    payloads = {"train": {"images": [], "annotations": []}, "val": {"images": [], "annotations": []}}
    source_manifest = []
    count = 0
    for score, image_id, downloaded in selected:
        if count >= max_images:
            break
        meta = metadata[image_id]
        source_path = source_images / f"{image_id}.jpg"
        if not source_path.exists():
            continue
        count += 1
        split = split_for_index(count)
        image_dir = output / f"{split}2017"
        image_dir.mkdir(parents=True, exist_ok=True)
        image_payload = payloads[split]
        image_number = len(image_payload["images"]) + 1
        file_name = f"openimages_train_household_{image_number:05d}.jpg"
        shutil.copy2(source_path, image_dir / file_name)
        image_payload["images"].append({
            "id": image_number,
            "file_name": file_name,
            "width": downloaded["width"],
            "height": downloaded["height"],
            "openImagesId": image_id,
            "score": score,
        })
        source_manifest.append({
            "split": split,
            "fileName": file_name,
            "openImagesId": image_id,
            "score": score,
            "license": meta.get("License", ""),
            "originalLandingUrl": meta.get("OriginalLandingURL", ""),
            "boxCount": len(boxes_by_image[image_id]),
        })
        for box in boxes_by_image[image_id]:
            x1, y1, x2, y2 = box["boxNorm"]
            x = x1 * downloaded["width"]
            y = y1 * downloaded["height"]
            w = (x2 - x1) * downloaded["width"]
            h = (y2 - y1) * downloaded["height"]
            if w < 3 or h < 3:
                continue
            image_payload["annotations"].append({
                "id": len(image_payload["annotations"]) + 1,
                "image_id": image_number,
                "category_id": 1,
                "bbox": [round(x, 3), round(y, 3), round(w, 3), round(h, 3)],
                "area": round(w * h, 3),
                "iscrowd": 0,
                "quality": "openimages-train-strong-candidate",
                "sourceLabel": box["displayName"],
            })
    categories = [{"id": 1, "name": "household_subject", "supercategory": "household"}]
    for split, payload in payloads.items():
        (output / "annotations" / f"instances_{split}2017.json").write_text(json.dumps({
            "info": {
                "description": "OpenImages train household large-scene candidates for DINO-assisted Home Memory YOLOX training.",
                "source": "OpenImages train bounding boxes",
                "policy": "Candidate boxes must be DINO-assisted or reviewed before final training.",
            },
            "licenses": [],
            "categories": categories,
            **payload,
        }, ensure_ascii=False), encoding="utf-8")
    (output / "source-manifest.json").write_text(json.dumps(source_manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "trainImages": len(payloads["train"]["images"]),
        "trainAnnotations": len(payloads["train"]["annotations"]),
        "valImages": len(payloads["val"]["images"]),
        "valAnnotations": len(payloads["val"]["annotations"]),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--target", type=int, default=5000)
    parser.add_argument("--candidate-multiplier", type=float, default=1.8)
    parser.add_argument("--min-boxes", type=int, default=4)
    parser.add_argument("--workers", type=int, default=16)
    parser.add_argument("--timeout", type=float, default=6)
    args = parser.parse_args()

    annotation_path = args.source_dir / "oidv6-train-annotations-bbox.csv"
    metadata_path = args.source_dir / "train-images-boxable-with-rotation.csv"
    heap_size = max(args.target, int(args.target * args.candidate_multiplier))
    boxes_by_image, selected, scan_stats = collect_candidate_boxes(annotation_path, args.min_boxes, heap_size)
    wanted_ids = {image_id for _, image_id in selected}
    metadata = read_image_metadata(metadata_path, wanted_ids)
    source_images = args.output.parent / f"{args.output.name}-source-images"
    source_images.mkdir(parents=True, exist_ok=True)

    downloaded = []
    started = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {}
        for score, image_id in selected:
            if image_id not in metadata:
                continue
            target = source_images / f"{image_id}.jpg"
            if target.exists():
                try:
                    with Image.open(target) as image:
                        width, height = image.size
                    futures[pool.submit(lambda width=width, height=height: {"ok": True, "width": width, "height": height})] = (score, image_id)
                    continue
                except Exception:
                    target.unlink(missing_ok=True)
            futures[pool.submit(download_one, metadata[image_id], target, args.timeout)] = (score, image_id)
        for future in as_completed(futures):
            score, image_id = futures[future]
            result = future.result()
            if result.get("ok"):
                downloaded.append((score, image_id, result))
                if len(downloaded) == 1 or len(downloaded) % 100 == 0:
                    print(json.dumps({"downloaded": len(downloaded), "target": args.target, "imageId": image_id, "seconds": round(time.time() - started, 1)}), flush=True)
            if len(downloaded) >= args.target:
                break
    downloaded.sort(reverse=True)
    stats = write_coco(downloaded, boxes_by_image, metadata, source_images, args.output, args.target)
    summary = {
        "output": str(args.output),
        "target": args.target,
        "selectedBeforeDownload": len(selected),
        "downloaded": len(downloaded),
        "scan": scan_stats,
        "stats": stats,
        "seconds": round(time.time() - started, 3),
    }
    (args.output / "dataset-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
