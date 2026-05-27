#!/usr/bin/env python3
import argparse
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


DEFAULT_SOURCE = Path("/tmp/home-memory-yolox-fixed-eval/COCO")
DEFAULT_OUTPUT = Path("/tmp/home-memory-yolox-fixed-eval-v2/COCO")
DEFAULT_DECISIONS = DEFAULT_SOURCE / "review" / "fixed-eval-review-decisions.json"

ANNOTATION_STANDARD = """# Home Memory subject detection fixed-eval annotation standard v2

## Positive sample rules

- Mark every independently useful household subject, not just one representative item in a repeated group.
- For storage structures, mark both the whole storage unit and independently accessible sub-units when visible: cabinet body, drawer, cabinet door, shelf bay, storage basket, storage box.
- When a cabinet/drawer has visible seams, split boxes along the physical seams. Do not merge adjacent compartments unless adding an extra parent box for the whole unit.
- Parent-child boxes are valid and expected for storage: one whole cabinet plus its child drawers/doors/compartments.
- A good box must include the complete visible extent of the target subject, including edges, handles, lids, feet, and visible protruding parts, while keeping padding tight.
- Do not leave large blank margins just to be safe, and do not crop off any visible part of the target.
- Avoid including unrelated objects placed on top, text overlays, hands, food props, or background.
- For product-style repeated objects, each visible object instance should have its own box: all rice bags, all cans, all seasoning bottles, all garbage bag rolls, all filter modules.
- If the user intent is a product, label the product itself, not decorative/serving props. Example: mark the rice cooker, not the rice bowl.
- For appliances/cables/accessories, box the functional object tightly, including visible connected body parts only when they are part of the subject.

## Negative sample patterns from v1

- Duplicate boxes from multiple source labels on the same physical object.
- Labeling only one item from a repeated product group.
- Marking props or content instead of the intended product subject.
- Overlarge boxes that include blank area, text, or unrelated objects.
- Missing child drawers/cabinet doors inside a visible storage unit.
- Merging separate cabinet sections when physical seams indicate independent units.
- Tight-looking boxes that still crop off the subject edge, handle, foot, lid, or other visible protruding part.

## Expansion guidance

- New fixed-eval images must not be used in train2017. Always run the SHA256 leak check in scripts/train-yolox-household-subject.py.
- Keep separate metrics for household large scenes and product-style images; they stress different failure modes.
- For every relabeled image, preserve the original wrong annotation overlay as a negative example and the reviewed annotation overlay as the positive example.
"""


MANUAL_BOXES = {
    1: [
        ("television", [535, 382, 660, 420]),
        ("tv cabinet whole", [190, 1005, 1045, 190]),
        ("left cabinet", [190, 1005, 410, 190]),
        ("center cabinet", [600, 1005, 330, 190]),
        ("right cabinet", [930, 1005, 305, 190]),
        ("amplifier", [418, 855, 354, 151]),
        ("turntable", [753, 855, 307, 151]),
        ("left speaker", [30, 487, 243, 326]),
        ("right speaker", [1240, 545, 180, 280]),
    ],
    2: [
        ("upper cabinet", [78, 55, 270, 145]),
        ("lower left cabinet", [75, 190, 275, 165]),
        ("lower right cabinet", [368, 206, 195, 176]),
    ],
    3: [
        ("drawer cabinet whole", [118, 128, 505, 255]),
        ("drawer upper left", [128, 135, 248, 68]),
        ("drawer upper right", [376, 135, 247, 68]),
        ("drawer middle left", [128, 203, 248, 88]),
        ("drawer middle right", [376, 203, 247, 88]),
        ("drawer lower left", [128, 291, 248, 83]),
        ("drawer lower right", [376, 291, 247, 83]),
    ],
    4: [
        ("cabinet group whole", [3, 32, 626, 575]),
        ("upper left cabinet", [4, 36, 305, 188]),
        ("lower left cabinet", [6, 223, 303, 365]),
        ("upper right cabinet", [321, 35, 305, 189]),
        ("lower right cabinet", [328, 224, 295, 371]),
    ],
    5: [
        ("left upper shelf", [66, 25, 91, 49]),
        ("left middle shelf", [66, 76, 88, 34]),
        ("left lower shelf", [66, 113, 88, 32]),
        ("television", [269, 118, 183, 154]),
        ("media cabinet whole", [260, 273, 202, 128]),
        ("upper device bay", [263, 279, 196, 40]),
        ("middle device bay", [263, 321, 196, 37]),
        ("lower device bay", [263, 362, 196, 36]),
    ],
    6: [
        ("wall cupboard", [12, 127, 142, 30]),
        ("picture frame left", [490, 126, 27, 69]),
        ("picture frame center", [528, 121, 37, 82]),
        ("picture frame right", [580, 113, 56, 102]),
        ("television", [105, 228, 86, 65]),
        ("dresser whole", [200, 198, 138, 119]),
        ("dresser upper row", [204, 202, 130, 36]),
        ("dresser lower left door", [203, 238, 65, 75]),
        ("dresser lower right door", [270, 238, 64, 75]),
        ("table", [0, 248, 103, 132]),
        ("coffee table", [291, 315, 113, 140]),
        ("couch", [380, 237, 260, 243]),
    ],
    7: [
        ("cabinet whole", [6, 45, 505, 381]),
        ("left upper drawer", [24, 61, 325, 152]),
        ("left lower cabinet", [25, 215, 323, 210]),
        ("middle upper drawer", [350, 64, 98, 145]),
        ("middle lower cabinet", [350, 211, 98, 214]),
        ("right upper drawer", [449, 69, 60, 136]),
        ("right lower cabinet", [449, 209, 61, 216]),
    ],
    8: [
        ("door", [512, 197, 70, 251]),
        ("couch", [178, 318, 273, 131]),
        ("drawer cabinet whole", [27, 327, 151, 121]),
        ("drawer upper", [28, 334, 144, 36]),
        ("drawer middle", [28, 374, 144, 34]),
        ("drawer lower", [28, 412, 144, 35]),
    ],
    9: [
        ("window", [0, 93, 103, 156]),
        ("wall cabinet whole", [120, 100, 298, 73]),
        ("left upper cabinet", [121, 104, 74, 66]),
        ("middle upper cabinet", [170, 76, 107, 50]),
        ("right upper cabinet", [294, 104, 123, 66]),
        ("sink base cabinet", [109, 210, 220, 75]),
        ("refrigerator", [326, 165, 93, 155]),
        ("right plant shelf whole", [418, 98, 74, 189]),
        ("plant upper box", [420, 99, 71, 74]),
        ("plant lower box", [420, 194, 71, 86]),
        ("island table", [119, 277, 325, 203]),
        ("lower shelf whole", [315, 345, 157, 103]),
        ("lower shelf upper bay", [318, 346, 152, 47]),
        ("lower shelf lower bay", [318, 396, 151, 51]),
    ],
    11: [
        ("rice bag back left", [0, 18, 276, 442]),
        ("rice bag back center", [276, 0, 244, 407]),
        ("rice bag back right", [520, 14, 278, 407]),
        ("rice bag front left", [160, 365, 267, 385]),
        ("rice bag front right", [435, 369, 248, 370]),
    ],
    12: [
        ("can upper left", [18, 55, 227, 348]),
        ("can upper center", [288, 36, 234, 344]),
        ("can upper right", [557, 62, 230, 335]),
        ("can lower left", [0, 405, 254, 355]),
        ("can lower center", [268, 398, 262, 363]),
        ("can lower right", [535, 399, 262, 363]),
    ],
    13: [
        ("seasoning bottle left", [57, 389, 398, 850]),
        ("seasoning bottle center", [536, 389, 466, 901]),
        ("seasoning bottle right", [1040, 395, 406, 848]),
    ],
    15: [
        ("trash bag purple", [202, 136, 447, 254]),
        ("trash bag white", [96, 278, 456, 275]),
        ("trash bag blue", [559, 320, 140, 201]),
        ("trash bag green", [33, 451, 439, 293]),
        ("trash bag pink", [471, 486, 168, 184]),
        ("trash bag yellow", [627, 440, 156, 183]),
    ],
    17: [
        ("headphones", [218, 104, 582, 661]),
    ],
    18: [
        ("rice cooker", [148, 202, 582, 492]),
    ],
    19: [
        ("filter left", [68, 147, 308, 491]),
        ("filter center", [288, 148, 276, 529]),
        ("filter right", [455, 149, 287, 527]),
    ],
    20: [
        ("power adapter", [360, 355, 914, 344]),
    ],
    21: [
        ("right storage stack whole", [367, 409, 590, 740]),
        ("right storage box upper", [367, 409, 590, 230]),
        ("right storage box middle", [483, 616, 472, 285]),
        ("right storage box lower", [419, 840, 537, 309]),
        ("left storage basket", [239, 429, 185, 747]),
    ],
}


UNCHANGED_KEEP = {8, 10, 14, 16}


def clamp_box(box, width, height):
    x, y, w, h = [float(value) for value in box]
    x = max(0.0, min(width - 1.0, x))
    y = max(0.0, min(height - 1.0, y))
    w = max(1.0, min(width - x, w))
    h = max(1.0, min(height - y, h))
    return [round(x, 3), round(y, 3), round(w, 3), round(h, 3)]


def draw_overlay(dataset_dir, payload, output_dir, color=(60, 220, 60)):
    output_dir.mkdir(parents=True, exist_ok=True)
    anns_by_image = {}
    for ann in payload["annotations"]:
        anns_by_image.setdefault(ann["image_id"], []).append(ann)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 14)
    except Exception:
        font = ImageFont.load_default()
    for image in payload["images"]:
        source = dataset_dir / "val2017" / image["file_name"]
        if not source.exists():
            continue
        canvas = Image.open(source).convert("RGB")
        draw = ImageDraw.Draw(canvas)
        for ann in anns_by_image.get(image["id"], []):
            x, y, w, h = ann["bbox"]
            x1, y1, x2, y2 = int(x), int(y), int(x + w), int(y + h)
            for offset in range(2):
                draw.rectangle([x1 - offset, y1 - offset, x2 + offset, y2 + offset], outline=color)
            label = ann.get("sourceLabel", "")[:22]
            if label:
                text_y = max(2, y1 - 16)
                draw.text((x1 + 2, text_y), label, fill=color, font=font)
        canvas.save(output_dir / f"{image['id']:03d}_{image['file_name']}", quality=92)


def build(args):
    source = args.source
    output = args.output
    if output.exists():
        shutil.rmtree(output)
    (output / "annotations").mkdir(parents=True, exist_ok=True)
    (output / "val2017").mkdir(parents=True, exist_ok=True)
    review_dir = output / "review"
    review_dir.mkdir(parents=True, exist_ok=True)

    original = json.loads((source / "annotations" / "instances_val2017.json").read_text(encoding="utf-8"))
    decisions = json.loads(args.decisions.read_text(encoding="utf-8")) if args.decisions.exists() else {}
    original_anns = {}
    for ann in original["annotations"]:
        original_anns.setdefault(ann["image_id"], []).append(ann)

    payload = {
        "info": {
            "description": "Fixed holdout evaluation set v2 after human review. Do not use these images for training.",
            "version": "2026-05-27-fixed-eval-v2-human-reviewed",
            "sourceV1": str(source),
        },
        "licenses": original.get("licenses", []),
        "categories": original["categories"],
        "images": [],
        "annotations": [],
    }
    negative_payload = {**payload, "images": [], "annotations": []}
    changes = []
    for image in original["images"]:
        decision = decisions.get(str(image["id"]), {})
        shutil.copy2(source / "val2017" / image["file_name"], output / "val2017" / image["file_name"])
        new_image = dict(image)
        new_image["reviewStatus"] = decision.get("status", "")
        new_image["reviewNotes"] = decision.get("notes", "")
        payload["images"].append(new_image)
        negative_payload["images"].append(new_image)

        if image["id"] in MANUAL_BOXES:
            box_rows = MANUAL_BOXES[image["id"]]
            quality = "human-reviewed-v2"
            changes.append({"imageId": image["id"], "fileName": image["file_name"], "from": len(original_anns.get(image["id"], [])), "to": len(box_rows), "notes": decision.get("notes", "")})
        elif image["id"] in UNCHANGED_KEEP:
            box_rows = [(ann.get("sourceLabel", "household_subject"), ann["bbox"]) for ann in original_anns.get(image["id"], [])]
            quality = "human-reviewed-keep-v2"
        else:
            box_rows = [(ann.get("sourceLabel", "household_subject"), ann["bbox"]) for ann in original_anns.get(image["id"], [])]
            quality = "carried-forward-v2"

        for label, box in box_rows:
            bbox = clamp_box(box, image["width"], image["height"])
            payload["annotations"].append({
                "id": len(payload["annotations"]) + 1,
                "image_id": image["id"],
                "category_id": 1,
                "bbox": bbox,
                "area": round(bbox[2] * bbox[3], 3),
                "iscrowd": 0,
                "sourceLabel": label,
                "quality": quality,
            })
        for ann in original_anns.get(image["id"], []):
            neg = dict(ann)
            neg["id"] = len(negative_payload["annotations"]) + 1
            neg["quality"] = "negative-v1-before-human-review"
            negative_payload["annotations"].append(neg)

    (output / "annotations" / "instances_val2017.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    (review_dir / "negative-v1-annotations.json").write_text(json.dumps(negative_payload, ensure_ascii=False), encoding="utf-8")
    (review_dir / "annotation-standard.md").write_text(ANNOTATION_STANDARD, encoding="utf-8")
    summary = {
        "output": str(output),
        "images": len(payload["images"]),
        "annotations": len(payload["annotations"]),
        "negativeV1Annotations": len(negative_payload["annotations"]),
        "changedImages": changes,
        "decisions": str(args.decisions),
    }
    (output / "dataset-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    draw_overlay(output, negative_payload, review_dir / "negative-v1")
    draw_overlay(output, payload, review_dir / "positive-v2")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--decisions", type=Path, default=DEFAULT_DECISIONS)
    build(parser.parse_args())


if __name__ == "__main__":
    main()
