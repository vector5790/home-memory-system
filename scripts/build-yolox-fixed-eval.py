#!/usr/bin/env python3
import argparse
import hashlib
import json
import shutil
from pathlib import Path

import cv2


DEFAULT_OUTPUT = Path("/tmp/home-memory-yolox-fixed-eval/COCO")
DEFAULT_OPENIMAGES = Path("/tmp/home-memory-openimages-household-scenes/COCO")
DEFAULT_STRONG = Path("/tmp/home-memory-yolox-household-strong-dataset/COCO")
DEFAULT_LIVING_ROOM = Path("data/generated/query-images/living-room-query.jpg")

LIVING_ROOM_BOXES = [
    {"bbox": [540, 382, 650, 418], "label": "television"},
    {"bbox": [190, 850, 1050, 345], "label": "tv cabinet"},
    {"bbox": [190, 885, 190, 310], "label": "left cabinet"},
    {"bbox": [600, 880, 530, 315], "label": "center cabinet"},
    {"bbox": [1125, 835, 110, 360], "label": "right shelf"},
    {"bbox": [420, 875, 340, 135], "label": "amplifier"},
    {"bbox": [770, 870, 360, 125], "label": "turntable"},
    {"bbox": [45, 455, 255, 380], "label": "left speaker"},
    {"bbox": [1240, 545, 205, 290], "label": "right speaker"},
]


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_size(path):
    image = cv2.imread(str(path))
    if image is None:
        raise RuntimeError(f"cannot read image: {path}")
    height, width = image.shape[:2]
    return width, height


def append_image(payload, source_path, target_dir, file_name, source):
    width, height = image_size(source_path)
    image_id = len(payload["images"]) + 1
    shutil.copy2(source_path, target_dir / file_name)
    payload["images"].append({
        "id": image_id,
        "file_name": file_name,
        "width": width,
        "height": height,
        "source": source,
        "sha256": sha256(source_path),
    })
    return image_id


def append_annotation(payload, image_id, bbox, source_label, quality):
    x, y, width, height = [float(value) for value in bbox]
    payload["annotations"].append({
        "id": len(payload["annotations"]) + 1,
        "image_id": image_id,
        "category_id": 1,
        "bbox": [round(x, 3), round(y, 3), round(width, 3), round(height, 3)],
        "area": round(width * height, 3),
        "iscrowd": 0,
        "sourceLabel": source_label,
        "quality": quality,
    })


def append_coco_val(payload, source_root, target_dir, prefix, limit=None):
    annotation_path = source_root / "annotations" / "instances_val2017.json"
    if not annotation_path.exists():
        return {"source": str(source_root), "images": 0, "annotations": 0, "skipped": True}
    data = json.loads(annotation_path.read_text(encoding="utf-8"))
    anns_by_image = {}
    for ann in data.get("annotations", []):
        anns_by_image.setdefault(ann["image_id"], []).append(ann)
    used_images = 0
    used_annotations = 0
    for image in data.get("images", []):
        if limit is not None and used_images >= limit:
            break
        source_path = source_root / "val2017" / image["file_name"]
        if not source_path.exists():
            continue
        file_name = f"{prefix}_{image['file_name']}"
        new_image_id = append_image(payload, source_path, target_dir, file_name, prefix)
        used_images += 1
        for ann in anns_by_image.get(image["id"], []):
            append_annotation(
                payload,
                new_image_id,
                ann["bbox"],
                ann.get("sourceLabel", ann.get("source_label", "household_subject")),
                ann.get("quality", "fixed-eval"),
            )
            used_annotations += 1
    return {"source": str(source_root), "images": used_images, "annotations": used_annotations}


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
            "description": "Fixed holdout evaluation set for Home Memory YOLOX household subject detection. Never use these images for training.",
            "version": "2026-05-27-fixed-eval-v1",
        },
        "licenses": [],
        "categories": [{"id": 1, "name": "household_subject", "supercategory": "household"}],
        "images": [],
        "annotations": [],
    }
    sources = []

    living_room = args.living_room
    living_image_id = append_image(payload, living_room, image_dir, "fixed_living_room_query.jpg", "manual-living-room-holdout")
    for item in LIVING_ROOM_BOXES:
        append_annotation(payload, living_image_id, item["bbox"], item["label"], "manual-fixed-eval")
    sources.append({"source": str(living_room), "images": 1, "annotations": len(LIVING_ROOM_BOXES)})

    sources.append(append_coco_val(payload, args.openimages_dir, image_dir, "openimages_holdout", args.openimages_limit))
    sources.append(append_coco_val(payload, args.strong_dir, image_dir, "strong_holdout", args.strong_limit))

    annotation_path = annotation_dir / "instances_val2017.json"
    annotation_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    summary = {
        "output": str(output),
        "images": len(payload["images"]),
        "annotations": len(payload["annotations"]),
        "sources": sources,
        "policy": "Do not copy these images into any train2017 dataset. The training script checks train-vs-fixed SHA256 overlap when --fixed-eval-dir is provided.",
        "annotationFile": str(annotation_path),
    }
    (output / "dataset-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--living-room", type=Path, default=DEFAULT_LIVING_ROOM)
    parser.add_argument("--openimages-dir", type=Path, default=DEFAULT_OPENIMAGES)
    parser.add_argument("--strong-dir", type=Path, default=DEFAULT_STRONG)
    parser.add_argument("--openimages-limit", type=int, default=None)
    parser.add_argument("--strong-limit", type=int, default=None)
    build(parser.parse_args())


if __name__ == "__main__":
    main()
