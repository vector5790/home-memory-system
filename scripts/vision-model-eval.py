#!/usr/bin/env python3
"""Evaluate local vision model boxes, names, and index retrieval matches.

Inputs:
- A dataset manifest with household item images and ground-truth boxes/names.
- A prediction JSON produced by the local model under test.
- A generated local embedding index so the report can show the top-3 matched
  representative index images for each input image.

The script can also create deterministic seed fixtures and fixture predictions.
Those are useful for validating the evaluation harness before plugging in the
real browser/local model output.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.parse
from collections import Counter
from pathlib import Path
from typing import Any

try:
    from PIL import Image, ImageDraw, ImageFont
except Exception:  # pragma: no cover - surfaced by command entrypoints.
    Image = None
    ImageDraw = None
    ImageFont = None


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATEGORIES = ROOT / "data" / "vision-categories.seed.json"
DEFAULT_SAMPLES = ROOT / "data" / "vision-samples.seed.json"
DEFAULT_INDEX = ROOT / "data" / "vision-index.generated.json"
DEFAULT_DATASET = ROOT / "data" / "vision-model-eval.seed.json"
DEFAULT_PREDICTIONS = ROOT / "data" / "generated" / "vision-model-predictions.seed.json"
DEFAULT_REPORT_JSON = ROOT / "data" / "generated" / "vision-model-eval-report.seed.json"
DEFAULT_REPORT_HTML = ROOT / "data" / "generated" / "vision-model-eval-report.seed.html"
DEFAULT_REPORT_MD = ROOT / "data" / "generated" / "vision-model-eval-report.seed.md"
DEFAULT_FIXTURE_DIR = ROOT / "fixtures" / "vision"
DEFAULT_REAL_SOURCES = ROOT / "data" / "vision-real-photo-sources.json"
DEFAULT_REAL_DATASET = ROOT / "data" / "vision-model-eval.real.json"
DEFAULT_REAL_INDEX = ROOT / "data" / "vision-index.real.json"
DEFAULT_REAL_PREDICTIONS = ROOT / "data" / "generated" / "vision-model-predictions.real.gt-assisted.json"
DEFAULT_BENCHMARK_PREDICTIONS = ROOT / "data" / "generated" / "vision-model-predictions.real.benchmark.json"
DEFAULT_BENCHMARK_RAW = ROOT / "data" / "generated" / "vision-model-benchmark-raw.real.json"
DEFAULT_VENDOR = ROOT / "vendor"
DEFAULT_MANIFEST = DEFAULT_VENDOR / "vision-manifest.json"

IOU_THRESHOLD = 0.5
TOP_K = 3
REAL_EMBEDDING_DIMENSION = 512
TRANSFORMERS_RUNTIME_FILES = [
    "transformers/transformers.min.js",
    "transformers/ort-wasm-simd-threaded.jsep.mjs",
    "transformers/ort-wasm-simd-threaded.jsep.wasm",
]
VISION_MODEL_IDS = {
    "grounding-dino": "onnx-community/grounding-dino-tiny-ONNX",
    "owlvit": "Xenova/owlvit-base-patch32",
    "sam": "Xenova/slimsam-77-uniform",
    "clip": "Xenova/clip-vit-base-patch32",
}
DEFAULT_PROVIDER_MATRIX = [
    "owlvit",
    "owlvit-sam",
    "grounding-dino",
    "grounding-dino-sam",
    "clip-naming",
    "canvas-baseline",
    "gt-assisted",
]
PROVIDER_CLASSES = {
    "gt-assisted": "gt-assisted-fixture",
    "canvas-baseline": "canvas-baseline",
    "grounding-dino": "real-local-model",
    "grounding-dino-sam": "real-local-model",
    "owlvit": "real-local-model",
    "owlvit-sam": "real-local-model",
    "clip-naming": "real-local-model",
}
DEFAULT_GATES = {
    "minImages": 6,
    "boxRecallAtIoU": 0.5,
    "categoryAccuracy": 0.5,
    "nameAccuracy": 0.5,
    "combinedAccuracy": 0.4,
    "top3RetrievalAccuracy": 0.5,
    "p95EndToEndMs": 12000,
    "failureRate": 0.2,
}


class EvaluationError(Exception):
    pass


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise EvaluationError(f"{path} must contain a JSON object")
    return value


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {relative(path)}")


def relative(path: Path | str) -> str:
    path = Path(path)
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def resolve_path(path: str | Path) -> Path:
    path = Path(path)
    return path if path.is_absolute() else ROOT / path


def elapsed_ms(start: float) -> float:
    return round((time.perf_counter() - start) * 1000, 3)


def percentile(values: list[float], pct: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    if len(ordered) == 1:
        return round(ordered[0], 3)
    position = (len(ordered) - 1) * pct
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return round(ordered[int(position)], 3)
    weight = position - lower
    return round(ordered[lower] * (1 - weight) + ordered[upper] * weight, 3)


def timing_summary(values: list[float]) -> dict[str, Any]:
    clean = [float(value) for value in values if value is not None and math.isfinite(float(value))]
    if not clean:
        return {"available": False, "count": 0}
    return {
        "available": True,
        "count": len(clean),
        "p50": percentile(clean, 0.5),
        "p95": percentile(clean, 0.95),
        "mean": round(sum(clean) / len(clean), 3),
        "max": round(max(clean), 3),
    }


def commons_file_page_url(file_title: str) -> str:
    encoded = urllib.parse.quote(file_title.replace(" ", "_"), safe="._-(),=")
    return f"https://commons.wikimedia.org/wiki/File:{encoded}"


def commons_file_download_url(file_title: str, width: int = 1000) -> str:
    encoded = urllib.parse.quote(file_title.replace(" ", "_"), safe="")
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{encoded}?width={width}"


def normalize_text(value: Any) -> str:
    text = str(value or "").strip().lower()
    for token in (" ", "-", "_", "/", "\\", "　", "·", ".", "。", "（", "）", "(", ")"):
        text = text.replace(token, "")
    return text


def normalize_box(box: Any) -> dict[str, float] | None:
    if not isinstance(box, dict):
        return None
    try:
        width = min(max(float(box.get("w", 0)), 0.1), 100.0)
        height = min(max(float(box.get("h", 0)), 0.1), 100.0)
        x = min(max(float(box.get("x", 0)), 0.0), 100.0 - width)
        y = min(max(float(box.get("y", 0)), 0.0), 100.0 - height)
    except (TypeError, ValueError):
        return None
    return {"x": round(x, 4), "y": round(y, 4), "w": round(width, 4), "h": round(height, 4)}


def box_iou(left: dict[str, float], right: dict[str, float]) -> float:
    lx1, ly1 = left["x"], left["y"]
    lx2, ly2 = left["x"] + left["w"], left["y"] + left["h"]
    rx1, ry1 = right["x"], right["y"]
    rx2, ry2 = right["x"] + right["w"], right["y"] + right["h"]
    ix1, iy1 = max(lx1, rx1), max(ly1, ry1)
    ix2, iy2 = min(lx2, rx2), min(ly2, ry2)
    intersection = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    union = left["w"] * left["h"] + right["w"] * right["h"] - intersection
    return intersection / union if union else 0.0


def dot(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right))


def normalize_vector(values: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in values)) or 1.0
    return [round(value / norm, 8) for value in values]


def stable_unit_vector(key: str, dimension: int = REAL_EMBEDDING_DIMENSION) -> list[float]:
    values = []
    for index in range(dimension):
        digest = hashlib.sha256(f"{key}:{index}".encode("utf-8")).digest()
        raw = int.from_bytes(digest[:4], "big") / 0xFFFFFFFF
        values.append(raw * 2.0 - 1.0)
    return normalize_vector(values)


def category_proxy_embedding(category_id: str, sample_id: str, role: str, dimension: int = REAL_EMBEDDING_DIMENSION) -> list[float]:
    base = stable_unit_vector(f"real-category:{category_id}", dimension)
    texture = stable_unit_vector(f"real-sample:{sample_id}", dimension)
    base_weight = 0.97 if role == "query" else 0.92
    return normalize_vector([
        base[index] * base_weight + texture[index] * (1.0 - base_weight)
        for index in range(dimension)
    ])


def provider_model_requirements(provider_id: str) -> list[str]:
    if provider_id == "grounding-dino":
        return [VISION_MODEL_IDS["grounding-dino"], VISION_MODEL_IDS["clip"]]
    if provider_id == "grounding-dino-sam":
        return [VISION_MODEL_IDS["grounding-dino"], VISION_MODEL_IDS["sam"], VISION_MODEL_IDS["clip"]]
    if provider_id == "owlvit":
        return [VISION_MODEL_IDS["owlvit"], VISION_MODEL_IDS["clip"]]
    if provider_id == "owlvit-sam":
        return [VISION_MODEL_IDS["owlvit"], VISION_MODEL_IDS["sam"], VISION_MODEL_IDS["clip"]]
    if provider_id == "clip-naming":
        return [VISION_MODEL_IDS["clip"]]
    return []


def provider_display_name(provider_id: str) -> str:
    return {
        "grounding-dino": "Local Grounding DINO + CLIP naming",
        "grounding-dino-sam": "Local Grounding DINO + SlimSAM + CLIP naming",
        "owlvit": "Local OWL-ViT + CLIP naming",
        "owlvit-sam": "Local OWL-ViT + SlimSAM + CLIP naming",
        "clip-naming": "Local CLIP naming",
        "canvas-baseline": "Canvas proposal baseline",
        "gt-assisted": "GT-assisted report fixture",
    }.get(provider_id, provider_id)


def provider_class(provider_id: str, skipped: bool = False, failed: bool = False) -> str:
    if skipped:
        return "skipped"
    if failed:
        return "failed"
    return PROVIDER_CLASSES.get(provider_id, "real-local-model")


def preflight_vision_assets(providers: list[str], manifest_path: Path = DEFAULT_MANIFEST) -> dict[str, Any]:
    result: dict[str, Any] = {
        "ok": True,
        "manifestPath": relative(manifest_path),
        "runtimeFiles": [],
        "models": {},
        "providers": {},
        "messages": [],
    }

    if not manifest_path.exists():
        result["ok"] = False
        result["messages"].append("Missing vendor/vision-manifest.json. Run python3 scripts/download-vision-assets.py")
        manifest = {}
    else:
        manifest = read_json(manifest_path)
        result["version"] = manifest.get("version")
        result["transformers"] = manifest.get("transformers")

    for runtime_file in TRANSFORMERS_RUNTIME_FILES:
        path = DEFAULT_VENDOR / runtime_file
        ok = path.exists() and path.stat().st_size > 0
        result["runtimeFiles"].append({"path": runtime_file, "ok": ok, "bytes": path.stat().st_size if path.exists() else 0})
        if not ok:
            result["ok"] = False
            result["messages"].append(f"Missing runtime asset {runtime_file}")

    files_by_model = manifest.get("files", {}) if isinstance(manifest.get("files"), dict) else {}
    manifest_models = set(manifest.get("models", [])) if isinstance(manifest.get("models"), list) else set()
    required_models = sorted({model for provider_id in providers for model in provider_model_requirements(provider_id)})
    for model_id in required_models:
        listed_files = files_by_model.get(model_id, [])
        model_status = {
            "modelId": model_id,
            "listedInManifest": model_id in manifest_models,
            "ok": True,
            "missingFiles": [],
            "fileCount": len(listed_files) if isinstance(listed_files, list) else 0,
        }
        if model_id not in manifest_models:
            model_status["ok"] = False
            model_status["missingFiles"].append("<model not listed in manifest>")
        if not isinstance(listed_files, list) or not listed_files:
            model_status["ok"] = False
            model_status["missingFiles"].append("<no files listed>")
        else:
            for relative_file in listed_files:
                path = DEFAULT_VENDOR / "models" / str(relative_file)
                if not path.exists() or path.stat().st_size == 0:
                    model_status["ok"] = False
                    model_status["missingFiles"].append(str(relative_file))
        if not model_status["ok"]:
            result["ok"] = False
            result["messages"].append(f"Missing or incomplete model {model_id}")
        result["models"][model_id] = model_status

    for provider_id in providers:
        requirements = provider_model_requirements(provider_id)
        missing = [model_id for model_id in requirements if not result["models"].get(model_id, {}).get("ok")]
        result["providers"][provider_id] = {
            "id": provider_id,
            "displayName": provider_display_name(provider_id),
            "providerClass": provider_class(provider_id, skipped=bool(missing)),
            "requiredModels": requirements,
            "ok": not missing,
            "skipReason": f"Missing local assets: {', '.join(missing)}" if missing else "",
        }
    return result


def load_categories(path: Path) -> dict[str, dict[str, Any]]:
    payload = read_json(path)
    return {
        category["id"]: category
        for category in payload.get("categories", [])
        if isinstance(category, dict) and category.get("id")
    }


def name_terms(category: dict[str, Any]) -> set[str]:
    terms = {category.get("displayName"), category.get("id")}
    terms.update(category.get("displayPath", []))
    terms.update(category.get("aliases", []))
    terms.update(category.get("detectorLabels", []))
    return {normalize_text(term) for term in terms if normalize_text(term)}


def category_name_match(prediction: dict[str, Any], truth: dict[str, Any], categories: dict[str, dict[str, Any]]) -> tuple[bool, str]:
    truth_category = categories.get(truth.get("categoryId"), {})
    predicted_category_id = str(prediction.get("categoryId") or prediction.get("catalogId") or "").strip()
    predicted_name = str(prediction.get("name") or "").strip()
    normalized_pred_name = normalize_text(predicted_name)

    if predicted_category_id and predicted_category_id == truth.get("categoryId"):
        return True, "category-id"
    if normalized_pred_name and normalized_pred_name in name_terms(truth_category):
        return True, "alias"
    if normalized_pred_name and normalized_pred_name == normalize_text(truth.get("name")):
        return True, "display-name"
    return False, "mismatch"


def load_font(size: int = 18):
    if ImageFont is None:
        return None
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()


def pct_box_to_pixels(box: dict[str, float], width: int, height: int) -> tuple[int, int, int, int]:
    return (
        round((box["x"] / 100) * width),
        round((box["y"] / 100) * height),
        round(((box["x"] + box["w"]) / 100) * width),
        round(((box["y"] + box["h"]) / 100) * height),
    )


def draw_category(draw: Any, category_id: str, box: dict[str, float], sample_id: str, width: int, height: int) -> None:
    x1, y1, x2, y2 = pct_box_to_pixels(box, width, height)
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2
    color = {
        "storage-box": "#62a6d8",
        "charging-cable": "#222222",
        "charger": "#f3f3f3",
        "remote-control": "#202225",
        "medicine-box": "#ffffff",
        "battery": "#f1c44e",
        "cat-teaser-toy": "#a96ad8",
    }.get(category_id, "#cccccc")

    if category_id == "storage-box":
        draw.rounded_rectangle((x1, y1, x2, y2), radius=18, fill=color, outline="#1c5275", width=5)
        draw.line((x1 + 16, y1 + 28, x2 - 16, y1 + 28), fill="#1c5275", width=4)
        draw.rectangle((cx - 28, y1 + 12, cx + 28, y1 + 23), fill="#d8ecf7", outline="#1c5275", width=2)
    elif category_id == "charging-cable":
        draw.arc((x1, y1, x2, y2 + 30), start=190, end=520, fill=color, width=9)
        draw.rounded_rectangle((x1, cy - 12, x1 + 42, cy + 12), radius=6, fill="#d7d7d7", outline=color, width=3)
        draw.rounded_rectangle((x2 - 42, cy - 10, x2, cy + 10), radius=5, fill="#d7d7d7", outline=color, width=3)
    elif category_id == "charger":
        draw.rounded_rectangle((x1, y1 + 25, x2, y2), radius=14, fill=color, outline="#777777", width=4)
        draw.rectangle((cx - 20, y1, cx - 8, y1 + 28), fill="#b9b9b9", outline="#777777")
        draw.rectangle((cx + 8, y1, cx + 20, y1 + 28), fill="#b9b9b9", outline="#777777")
        draw.text((cx - 22, cy + 10), "USB", fill="#777777", font=load_font(16))
    elif category_id == "remote-control":
        draw.rounded_rectangle((x1, y1, x2, y2), radius=18, fill=color, outline="#555a60", width=4)
        for row in range(5):
            for col in range(2):
                bx = x1 + 18 + col * 32
                by = y1 + 45 + row * 34
                draw.ellipse((bx, by, bx + 18, by + 18), fill="#b7bcc2")
        draw.ellipse((cx - 16, y1 + 16, cx + 16, y1 + 48), fill="#e84d4d")
    elif category_id == "medicine-box":
        draw.rounded_rectangle((x1, y1, x2, y2), radius=12, fill=color, outline="#d34545", width=5)
        draw.rectangle((cx - 12, cy - 38, cx + 12, cy + 38), fill="#d34545")
        draw.rectangle((cx - 38, cy - 12, cx + 38, cy + 12), fill="#d34545")
    elif category_id == "battery":
        draw.rounded_rectangle((x1, y1, x2, y2), radius=15, fill=color, outline="#705820", width=4)
        draw.rectangle((x2 - 5, cy - 18, x2 + 18, cy + 18), fill="#705820")
        draw.text((x1 + 18, cy - 18), "+", fill="#705820", font=load_font(28))
    elif category_id == "cat-teaser-toy":
        draw.line((x1, cy, x2 - 50, cy - 16), fill="#55336d", width=7)
        draw.ellipse((x2 - 70, cy - 50, x2, cy + 20), fill="#d79bec", outline="#55336d", width=4)
        draw.line((x2 - 45, cy - 45, x2 - 18, cy + 15), fill="#55336d", width=3)
    else:
        draw.rectangle((x1, y1, x2, y2), fill=color, outline="#333333", width=4)

    draw.text((16, 16), sample_id, fill="#333333", font=load_font(15))


def create_fixture_image(sample: dict[str, Any], fixture_dir: Path) -> None:
    if Image is None or ImageDraw is None:
        raise EvaluationError("Pillow is required to create fixture images")
    image_path = resolve_path(sample["imagePath"])
    image_path.parent.mkdir(parents=True, exist_ok=True)
    width, height = 640, 480
    image = Image.new("RGB", (width, height), "#f6f3ed")
    draw = ImageDraw.Draw(image)
    for offset in range(0, width, 64):
        draw.line((offset, 0, offset - 120, height), fill="#ece7df", width=2)
    box = normalize_box(sample.get("humanBox")) or {"x": 20, "y": 20, "w": 60, "h": 55}
    draw_category(draw, sample["categoryId"], box, sample["id"], width, height)
    image.save(image_path, quality=90)


def command_create_fixtures(args: argparse.Namespace) -> int:
    samples = read_json(args.samples).get("samples", [])
    for sample in samples:
        if isinstance(sample, dict) and sample.get("imagePath"):
            create_fixture_image(sample, args.fixture_dir)

    categories = load_categories(args.categories)
    eval_images = []
    for sample in samples:
        if not isinstance(sample, dict) or sample.get("split") != "eval" or sample.get("reviewStatus") != "reviewed":
            continue
        category = categories.get(sample.get("categoryId"), {})
        eval_images.append({
            "id": sample["id"],
            "imagePath": sample["imagePath"],
            "sourceSampleId": sample["id"],
            "groundTruth": [
                {
                    "id": f"gt-{sample['id']}",
                    "name": category.get("displayName", sample.get("categoryId")),
                    "categoryId": sample.get("categoryId"),
                    "categoryPath": category.get("displayPath", []),
                    "box": normalize_box(sample.get("humanBox")),
                    "aliases": category.get("aliases", []),
                    "activeCategory": bool(category.get("active")),
                }
            ],
        })

    dataset = {
        "kind": "vision-model-eval-dataset",
        "version": "20260522-household-seed-model-eval",
        "description": "Seed household object images for evaluating local subject boxes, names, and top-3 local index retrieval.",
        "images": eval_images,
    }
    write_json(args.output, dataset)
    return 0


def nudge_box(box: dict[str, float], dx: float, dy: float, scale: float = 1.0) -> dict[str, float]:
    width = box["w"] * scale
    height = box["h"] * scale
    return normalize_box({"x": box["x"] + dx, "y": box["y"] + dy, "w": width, "h": height}) or box


def index_entries(index: dict[str, Any]) -> list[dict[str, Any]]:
    entries = []
    for entry in index.get("entries", []):
        if isinstance(entry, dict) and isinstance(entry.get("embedding"), list):
            entries.append(entry)
    return entries


def top_index_matches(query_embedding: list[float], index: dict[str, Any], top_k: int = TOP_K) -> list[dict[str, Any]]:
    matches = []
    for entry in index_entries(index):
        score = dot(query_embedding, entry["embedding"])
        matches.append({
            "entryId": entry.get("id"),
            "sampleId": entry.get("sampleId"),
            "categoryId": entry.get("categoryId"),
            "displayName": entry.get("displayName") or entry.get("name"),
            "categoryPath": entry.get("categoryPath", []),
            "imagePath": entry.get("sourceImagePath"),
            "sourceImagePath": entry.get("sourceImagePath"),
            "sourceUrl": entry.get("sourceUrl"),
            "sourceTitle": entry.get("sourceTitle"),
            "license": entry.get("license"),
            "box": entry.get("box"),
            "crop": entry.get("crop", {}),
            "matchedSampleIds": entry.get("matchedSampleIds", []),
            "categoryIndexVersion": index.get("version"),
            "embeddingModel": index.get("embeddingModel") or index.get("embedding", {}).get("modelId"),
            "metric": index.get("metric"),
            "score": round(score, 6),
        })
    matches.sort(key=lambda item: item["score"], reverse=True)
    top_matches = matches[:top_k]
    if top_matches:
        runner_up = next((match for match in top_matches[1:] if match.get("categoryId") != top_matches[0].get("categoryId")), None)
        top_margin = top_matches[0]["score"] - (runner_up["score"] if runner_up else 0.0)
        top_matches[0]["margin"] = round(top_margin, 6)
    return top_matches


def choose_query_embedding(category_id: str, sample_id: str, index: dict[str, Any]) -> list[float]:
    same_category = [entry for entry in index_entries(index) if entry.get("categoryId") == category_id]
    if same_category:
        # Use the first same-category gallery vector as a deterministic proxy for a local embedding result.
        return list(same_category[0]["embedding"])
    entries = index_entries(index)
    return list(entries[0]["embedding"]) if entries else []


def fixture_prediction_for(image: dict[str, Any], index: dict[str, Any]) -> dict[str, Any]:
    truth = image["groundTruth"][0]
    gt_box = normalize_box(truth.get("box")) or {"x": 20, "y": 20, "w": 50, "h": 40}
    category_id = truth.get("categoryId")
    name = truth.get("name")
    box = nudge_box(gt_box, 1.5, -1.0, 1.02)

    # Deterministic hard cases to prove the report catches both box and name failures.
    if image["id"] == "charging-cable-eval-2":
        box = nudge_box(gt_box, 22, 0, 0.8)
    if image["id"] == "charger-eval-1":
        name = "数据线"
        category_id = "charging-cable"
    if image["id"] == "battery-eval-2":
        name = "充电器"
        category_id = "charger"
    if not truth.get("activeCategory"):
        name = "物品A"
        category_id = ""

    query_embedding = choose_query_embedding(category_id or truth.get("categoryId"), image["id"], index)
    matches = top_index_matches(query_embedding, index) if query_embedding else []
    return {
        "id": f"pred-{image['id']}",
        "name": name,
        "categoryId": category_id,
        "box": box,
        "confidence": 0.92 if category_id else 0.38,
        "queryEmbedding": [round(value, 8) for value in query_embedding],
        "matches": matches,
    }


def command_fixture_predictions(args: argparse.Namespace) -> int:
    dataset = read_json(args.dataset)
    index = read_json(args.index)
    images = []
    for image in dataset.get("images", []):
        if not isinstance(image, dict):
            continue
        images.append({
            "imageId": image["id"],
            "imagePath": image["imagePath"],
            "predictions": [fixture_prediction_for(image, index)],
        })
    payload = {
        "kind": "vision-model-predictions",
        "version": "20260522-fixture-local-output",
        "model": {
            "id": "fixture-local-model",
            "detector": "fixture-box-detector",
            "namer": "fixture-category-index",
            "note": "Deterministic local-output fixture for validating the evaluation system.",
        },
        "images": images,
    }
    write_json(args.output, payload)
    return 0


def download_real_source_image(source: dict[str, Any], width: int) -> None:
    image_path = resolve_path(source["imagePath"])
    if image_path.exists():
        return
    image_path.parent.mkdir(parents=True, exist_ok=True)
    file_title = str(source.get("fileTitle") or "")
    if not file_title:
        raise EvaluationError(f"{source.get('id')} is missing fileTitle")
    subprocess.run(
        [
            "curl",
            "-L",
            "--fail",
            "--silent",
            "--show-error",
            "--max-time",
            "90",
            commons_file_download_url(file_title, width),
            "-o",
            str(image_path),
        ],
        check=True,
        cwd=ROOT,
    )


def verify_real_source_images(sources: list[dict[str, Any]]) -> None:
    missing = [
        relative(resolve_path(source["imagePath"]))
        for source in sources
        if not resolve_path(source.get("imagePath", "")).exists()
    ]
    if missing:
        raise EvaluationError(
            "missing real source images; rerun with --download: "
            + ", ".join(missing[:6])
            + (" ..." if len(missing) > 6 else "")
        )


def build_real_dataset(sources: list[dict[str, Any]], categories: dict[str, dict[str, Any]]) -> dict[str, Any]:
    images = []
    for source in sources:
        if source.get("role") != "query":
            continue
        category = categories.get(source.get("categoryId"), {})
        source_url = commons_file_page_url(str(source.get("fileTitle") or ""))
        images.append({
            "id": source["id"],
            "imagePath": source["imagePath"],
            "sourceTitle": source.get("fileTitle"),
            "sourceUrl": source_url,
            "sourceProvider": "Wikimedia Commons",
            "groundTruth": [
                {
                    "id": f"gt-{source['id']}",
                    "name": category.get("displayName", source.get("categoryId")),
                    "categoryId": source.get("categoryId"),
                    "categoryPath": category.get("displayPath", []),
                    "box": normalize_box(source.get("box")),
                    "aliases": category.get("aliases", []),
                    "activeCategory": bool(category.get("active")),
                    "sourceTitle": source.get("fileTitle"),
                    "sourceUrl": source_url,
                }
            ],
        })
    return {
        "kind": "vision-model-eval-dataset",
        "version": "20260522-commons-household-real-eval",
        "description": "Real household object photos with manually annotated GT boxes for evaluating subject detection, item naming, and top-3 local index retrieval display.",
        "sourceProvider": "Wikimedia Commons",
        "notes": [
            "The photos are real downloaded Commons media, not synthetic drawing fixtures.",
            "Ground-truth boxes are manual percentage-coordinate annotations over the main household object.",
        ],
        "images": images,
    }


def build_real_index(sources: list[dict[str, Any]], categories: dict[str, dict[str, Any]]) -> dict[str, Any]:
    entries = []
    for source in sources:
        if source.get("role") != "gallery":
            continue
        category_id = str(source.get("categoryId") or "")
        category = categories.get(category_id, {})
        source_url = commons_file_page_url(str(source.get("fileTitle") or ""))
        entries.append({
            "id": f"{category_id}:{source['id']}",
            "categoryId": category_id,
            "itemId": category_id,
            "displayName": category.get("displayName", category_id),
            "name": category.get("displayName", category_id),
            "appCategory": category.get("appCategory", "daily"),
            "categoryPath": category.get("displayPath", []),
            "lineage": category.get("lineage", {}),
            "sampleId": source["id"],
            "matchedSampleIds": [source["id"]],
            "sourceImagePath": source["imagePath"],
            "sourceUrl": source_url,
            "sourceTitle": source.get("fileTitle"),
            "license": {
                "name": "Wikimedia Commons media",
                "usage": "See the source file page for exact license and attribution requirements.",
            },
            "box": normalize_box(source.get("box")),
            "crop": {
                "type": "manual-box",
                "paddingPct": 4,
                "box": normalize_box(source.get("box")),
            },
            "embedding": category_proxy_embedding(category_id, source["id"], "gallery"),
            "buildVersion": "20260522-commons-real-photo-index",
        })
    return {
        "kind": "vision-category-index",
        "version": "20260522-commons-real-photo-index",
        "description": "Real-photo representative local index for report display. Embeddings are deterministic category proxy vectors until the local CLIP adapter is connected.",
        "metric": "dot",
        "dimension": REAL_EMBEDDING_DIMENSION,
        "topK": TOP_K,
        "threshold": 0.2,
        "marginThreshold": 0.04,
        "embedding": {
            "modelId": "deterministic-category-proxy",
            "dimension": REAL_EMBEDDING_DIMENSION,
            "note": "This is a reproducible proxy embedding for the real-photo evaluation harness; it is not a measured local CLIP vector.",
        },
        "entries": entries,
    }


def build_gt_assisted_predictions(dataset: dict[str, Any], index: dict[str, Any]) -> dict[str, Any]:
    images = []
    for image in dataset.get("images", []):
        truth = image["groundTruth"][0]
        category_id = truth.get("categoryId")
        query_embedding = category_proxy_embedding(str(category_id), image["id"], "query")
        prediction = {
            "id": f"pred-{image['id']}",
            "name": truth.get("name"),
            "categoryId": category_id,
            "box": nudge_box(normalize_box(truth.get("box")) or {"x": 0, "y": 0, "w": 100, "h": 100}, 0.8, -0.6, 1.01),
            "confidence": 0.99,
            "queryEmbedding": query_embedding,
            "matches": top_index_matches(query_embedding, index),
            "source": "gt-assisted-real-photo-fixture",
        }
        images.append({
            "imageId": image["id"],
            "imagePath": image["imagePath"],
            "predictions": [prediction],
        })
    return {
        "kind": "vision-model-predictions",
        "version": "20260522-real-photo-gt-assisted-output",
        "model": {
            "id": "gt-assisted-real-photo-fixture",
            "detector": "manual-gt-box-with-small-nudge",
            "namer": "manual-gt-category",
            "note": "This validates the real-photo evaluation report and Top3 index display. It is not a measured local model run because this workspace does not contain vendor local model assets.",
        },
        "images": images,
    }


def prediction_provider_metadata(provider_id: str, preflight: dict[str, Any] | None = None, skipped: bool = False, failed: bool = False, reason: str = "") -> dict[str, Any]:
    provider_info = (preflight or {}).get("providers", {}).get(provider_id, {})
    required_models = provider_model_requirements(provider_id)
    return {
        "id": provider_id,
        "displayName": provider_display_name(provider_id),
        "providerClass": provider_class(provider_id, skipped=skipped, failed=failed),
        "requiredModels": required_models,
        "modelIds": required_models,
        "assetVersion": (preflight or {}).get("version"),
        "status": "skipped" if skipped else ("failed" if failed else "ok"),
        "skipReason": reason or provider_info.get("skipReason", ""),
    }


def image_size(path: str | Path) -> tuple[int, int]:
    if Image is None:
        return (1, 1)
    with Image.open(resolve_path(path)) as image:
        return image.size


def canvas_baseline_box(image_path: str) -> dict[str, float]:
    if Image is None:
        return {"x": 20.0, "y": 20.0, "w": 60.0, "h": 60.0}
    with Image.open(resolve_path(image_path)) as image:
        image = image.convert("RGB")
        image.thumbnail((180, 180))
        width, height = image.size
        pixels = image.load()
        corners = [
            pixels[0, 0],
            pixels[width - 1, 0],
            pixels[0, height - 1],
            pixels[width - 1, height - 1],
        ]
        background = tuple(sum(channel[index] for channel in corners) / len(corners) for index in range(3))
        xs: list[int] = []
        ys: list[int] = []
        for y in range(height):
            for x in range(width):
                red, green, blue = pixels[x, y]
                diff = abs(red - background[0]) + abs(green - background[1]) + abs(blue - background[2])
                saturation = max(red, green, blue) - min(red, green, blue)
                if diff > 60 or saturation > 45:
                    xs.append(x)
                    ys.append(y)
        if not xs or not ys:
            return {"x": 20.0, "y": 20.0, "w": 60.0, "h": 60.0}
        pad_x = max(2, round(width * 0.03))
        pad_y = max(2, round(height * 0.03))
        x1 = max(0, min(xs) - pad_x)
        y1 = max(0, min(ys) - pad_y)
        x2 = min(width, max(xs) + pad_x)
        y2 = min(height, max(ys) + pad_y)
        return normalize_box({
            "x": (x1 / width) * 100,
            "y": (y1 / height) * 100,
            "w": ((x2 - x1) / width) * 100,
            "h": ((y2 - y1) / height) * 100,
        }) or {"x": 20.0, "y": 20.0, "w": 60.0, "h": 60.0}


def timed_prediction_from_truth(image: dict[str, Any], index: dict[str, Any], provider_id: str) -> dict[str, Any]:
    start = time.perf_counter()
    truth = image["groundTruth"][0]
    detection_start = time.perf_counter()
    box = nudge_box(normalize_box(truth.get("box")) or {"x": 0, "y": 0, "w": 100, "h": 100}, 0.8, -0.6, 1.01)
    detection_ms = elapsed_ms(detection_start)
    embedding_start = time.perf_counter()
    query_embedding = category_proxy_embedding(str(truth.get("categoryId")), image["id"], "query")
    embedding_ms = elapsed_ms(embedding_start)
    retrieval_start = time.perf_counter()
    matches = top_index_matches(query_embedding, index)
    retrieval_ms = elapsed_ms(retrieval_start)
    return {
        "id": f"{provider_id}-pred-{image['id']}",
        "providerId": provider_id,
        "providerClass": provider_class(provider_id),
        "name": truth.get("name"),
        "categoryId": truth.get("categoryId"),
        "box": box,
        "confidence": 0.99,
        "queryEmbedding": query_embedding,
        "matches": matches,
        "source": provider_id,
        "timings": {
            "detectionMs": detection_ms,
            "segmentationMs": None,
            "cropMs": 0.0,
            "embeddingMs": embedding_ms,
            "retrievalMs": retrieval_ms,
            "namingMs": round(embedding_ms + retrieval_ms, 3),
            "endToEndMs": elapsed_ms(start),
        },
    }


def canvas_baseline_prediction(image: dict[str, Any], provider_id: str = "canvas-baseline") -> dict[str, Any]:
    start = time.perf_counter()
    detection_start = time.perf_counter()
    box = canvas_baseline_box(image["imagePath"])
    detection_ms = elapsed_ms(detection_start)
    return {
        "id": f"{provider_id}-pred-{image['id']}",
        "providerId": provider_id,
        "providerClass": provider_class(provider_id),
        "name": "物品A",
        "categoryId": "",
        "box": box,
        "confidence": 0.35,
        "source": provider_id,
        "timings": {
            "detectionMs": detection_ms,
            "segmentationMs": None,
            "cropMs": 0.0,
            "embeddingMs": None,
            "retrievalMs": None,
            "namingMs": 0.0,
            "endToEndMs": elapsed_ms(start),
        },
    }


def skipped_provider_record(image: dict[str, Any], provider_id: str, reason: str) -> dict[str, Any]:
    return {
        "id": f"{provider_id}-skip-{image['id']}",
        "providerId": provider_id,
        "providerClass": "skipped",
        "name": "",
        "categoryId": "",
        "box": None,
        "confidence": 0.0,
        "source": provider_id,
        "skipped": True,
        "failureReason": reason,
        "timings": {"endToEndMs": 0.0},
    }


def run_node_local_provider(
    dataset: dict[str, Any],
    index: dict[str, Any],
    provider_id: str,
    raw_dir: Path,
    categories_path: Path,
) -> dict[str, Any]:
    runner = ROOT / "scripts" / "vision-local-model-runner.mjs"
    if not runner.exists():
        raise EvaluationError("scripts/vision-local-model-runner.mjs is missing")
    dataset_path = raw_dir / "dataset.json"
    index_path = raw_dir / "index.json"
    output = raw_dir / f"{provider_id}.json"
    command = [
        "node",
        str(runner),
        "--dataset",
        str(dataset_path),
        "--index",
        str(index_path),
        "--categories",
        str(categories_path),
        "--provider",
        provider_id,
        "--output",
        str(output),
    ]
    write_json(dataset_path, dataset)
    write_json(index_path, index)
    subprocess.run(command, check=True, cwd=ROOT)
    return read_json(output)


def build_benchmark_predictions(
    dataset: dict[str, Any],
    index: dict[str, Any],
    providers: list[str],
    preflight: dict[str, Any],
    raw_dir: Path,
    run_local_models: bool,
    categories_path: Path = DEFAULT_CATEGORIES,
) -> dict[str, Any]:
    images = [{"imageId": image["id"], "imagePath": image["imagePath"], "predictions": []} for image in dataset.get("images", [])]
    by_id = {image["imageId"]: image for image in images}
    provider_records = []
    raw_dir.mkdir(parents=True, exist_ok=True)

    for provider_id in providers:
        provider_info = preflight.get("providers", {}).get(provider_id, {})
        skipped_reason = provider_info.get("skipReason", "")
        if provider_id in {"grounding-dino", "grounding-dino-sam", "owlvit", "owlvit-sam", "clip-naming"} and skipped_reason:
            provider_records.append(prediction_provider_metadata(provider_id, preflight, skipped=True, reason=skipped_reason))
            for image in dataset.get("images", []):
                by_id[image["id"]]["predictions"].append(skipped_provider_record(image, provider_id, skipped_reason))
            continue

        if provider_id == "gt-assisted":
            provider_records.append(prediction_provider_metadata(provider_id, preflight))
            for image in dataset.get("images", []):
                by_id[image["id"]]["predictions"].append(timed_prediction_from_truth(image, index, provider_id))
            continue

        if provider_id == "canvas-baseline":
            provider_records.append(prediction_provider_metadata(provider_id, preflight))
            for image in dataset.get("images", []):
                by_id[image["id"]]["predictions"].append(canvas_baseline_prediction(image, provider_id))
            continue

        if run_local_models:
            try:
                provider_payload = run_node_local_provider(dataset, index, provider_id, raw_dir, categories_path)
                provider_record = prediction_provider_metadata(provider_id, preflight)
                provider_record.update({
                    key: value
                    for key, value in provider_payload.get("provider", {}).items()
                    if key not in {"id", "displayName", "providerClass", "status"}
                })
                provider_records.append(provider_record)
                for image_result in provider_payload.get("images", []):
                    image_id = image_result.get("imageId")
                    for prediction in image_result.get("predictions", []):
                        prediction.setdefault("providerId", provider_id)
                        prediction.setdefault("providerClass", provider_class(provider_id))
                        by_id[str(image_id)]["predictions"].append(prediction)
            except Exception as error:
                reason = f"provider failed: {error}"
                provider_records.append(prediction_provider_metadata(provider_id, preflight, failed=True, reason=reason))
                for image in dataset.get("images", []):
                    by_id[image["id"]]["predictions"].append(skipped_provider_record(image, provider_id, reason))
            continue

        reason = "local model execution disabled for this run; pass --run-local-models after installing Node benchmark dependencies"
        provider_records.append(prediction_provider_metadata(provider_id, preflight, skipped=True, reason=reason))
        for image in dataset.get("images", []):
            by_id[image["id"]]["predictions"].append(skipped_provider_record(image, provider_id, reason))

    return {
        "kind": "vision-model-predictions",
        "version": "20260523-real-photo-provider-benchmark",
        "model": {
            "id": "provider-benchmark",
            "note": "Provider benchmark predictions. Real local providers require valid vendor assets and --run-local-models; baselines are explicitly labeled.",
        },
        "preflight": preflight,
        "providers": provider_records,
        "images": images,
    }


def command_create_real_photo_set(args: argparse.Namespace) -> int:
    sources_payload = read_json(args.sources)
    sources = [
        source for source in sources_payload.get("images", [])
        if isinstance(source, dict) and source.get("id") and source.get("imagePath")
    ]
    if args.download:
        for source in sources:
            download_real_source_image(source, args.download_width)
    verify_real_source_images(sources)

    categories = load_categories(args.categories)
    dataset = build_real_dataset(sources, categories)
    index = build_real_index(sources, categories)
    predictions = build_gt_assisted_predictions(dataset, index)
    write_json(args.dataset, dataset)
    write_json(args.index, index)
    write_json(args.predictions, predictions)
    return 0


def parse_provider_list(value: str | None) -> list[str]:
    if not value:
        return list(DEFAULT_PROVIDER_MATRIX)
    providers = [part.strip() for part in value.split(",") if part.strip()]
    unknown = [provider for provider in providers if provider not in DEFAULT_PROVIDER_MATRIX]
    if unknown:
        raise EvaluationError(f"unknown provider(s): {', '.join(unknown)}")
    return providers


def command_preflight(args: argparse.Namespace) -> int:
    providers = parse_provider_list(args.providers)
    preflight = preflight_vision_assets(providers, args.manifest)
    write_json(args.output, preflight)
    if not preflight.get("ok"):
        print("local vision asset preflight failed:", file=sys.stderr)
        for message in preflight.get("messages", []):
            print(f"- {message}", file=sys.stderr)
        if args.strict:
            return 1
    return 0


def command_benchmark(args: argparse.Namespace) -> int:
    dataset = read_json(args.dataset)
    index = read_json(args.index)
    providers = parse_provider_list(args.providers)
    preflight = preflight_vision_assets(providers, args.manifest)
    predictions = build_benchmark_predictions(
        dataset=dataset,
        index=index,
        providers=providers,
        preflight=preflight,
        raw_dir=args.raw_dir,
        run_local_models=args.run_local_models,
        categories_path=args.categories,
    )
    write_json(args.output, predictions)
    write_json(args.raw_output, {
        "kind": "vision-model-benchmark-raw",
        "version": predictions.get("version"),
        "preflight": preflight,
        "providers": predictions.get("providers", []),
        "images": predictions.get("images", []),
    })
    if args.evaluate:
        categories = load_categories(args.categories)
        report = evaluate(dataset, predictions, categories, index, args.iou_threshold)
        write_json(args.output_json, report)
        render_html_report(report, args.output_html)
        if args.output_md:
            render_markdown_report(report, args.output_md)
    return 0


def command_run_predictor(args: argparse.Namespace) -> int:
    dataset = read_json(args.dataset)
    output_dir = args.temp_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    images = []
    for image in dataset.get("images", []):
        image_id = image["id"]
        image_path = resolve_path(image["imagePath"])
        prediction_path = output_dir / f"{image_id}.json"
        command = [
            part.format(image=str(image_path), output=str(prediction_path), image_id=image_id)
            for part in args.command
        ]
        subprocess.run(command, check=True, cwd=ROOT)
        prediction = read_json(prediction_path)
        predictions = prediction.get("predictions", prediction.get("candidates", []))
        images.append({"imageId": image_id, "imagePath": image["imagePath"], "predictions": predictions})
    write_json(args.output, {
        "kind": "vision-model-predictions",
        "version": args.version,
        "model": {"id": args.model_id, "command": args.command},
        "images": images,
    })
    return 0


def prediction_by_image(predictions: dict[str, Any], provider_id: str | None = None) -> dict[str, list[dict[str, Any]]]:
    by_image = {}
    for image in predictions.get("images", []):
        if isinstance(image, dict):
            by_image[str(image.get("imageId"))] = [
                prediction for prediction in image.get("predictions", [])
                if isinstance(prediction, dict)
                and (provider_id is None or prediction.get("providerId") == provider_id)
                and not prediction.get("skipped")
            ]
    return by_image


def skipped_by_provider(predictions: dict[str, Any], provider_id: str) -> int:
    count = 0
    for image in predictions.get("images", []):
        for prediction in image.get("predictions", []):
            if isinstance(prediction, dict) and prediction.get("providerId") == provider_id and prediction.get("skipped"):
                count += 1
    return count


def match_predictions_to_truths(
    truths: list[dict[str, Any]],
    predictions: list[dict[str, Any]],
    categories: dict[str, dict[str, Any]],
    iou_threshold: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    unmatched_predictions = set(range(len(predictions)))
    rows = []
    for truth in truths:
        truth_box = normalize_box(truth.get("box"))
        best_index = None
        best_iou = 0.0
        for pred_index in list(unmatched_predictions):
            pred_box = normalize_box(predictions[pred_index].get("box"))
            if not truth_box or not pred_box:
                continue
            candidate_iou = box_iou(truth_box, pred_box)
            if candidate_iou > best_iou:
                best_iou = candidate_iou
                best_index = pred_index
        prediction = predictions[best_index] if best_index is not None else {}
        if best_index is not None:
            unmatched_predictions.remove(best_index)
        name_ok, name_reason = category_name_match(prediction, truth, categories) if prediction else (False, "missing")
        category_ok = bool(prediction) and str(prediction.get("categoryId") or prediction.get("catalogId") or "") == str(truth.get("categoryId") or "")
        box_ok = bool(prediction) and best_iou >= iou_threshold
        rejected = bool(prediction) and not prediction.get("categoryId") and not prediction.get("catalogId") and not prediction.get("name")
        rows.append({
            "truth": truth,
            "prediction": prediction,
            "iou": round(best_iou, 4),
            "boxMatch": box_ok,
            "categoryMatch": category_ok,
            "nameMatch": name_ok,
            "nameMatchReason": name_reason,
            "combinedMatch": box_ok and name_ok,
            "rejected": rejected,
        })
    extras = [predictions[index] for index in sorted(unmatched_predictions)]
    return rows, extras


def ensure_prediction_matches(prediction: dict[str, Any], index: dict[str, Any]) -> list[dict[str, Any]]:
    explicit = prediction.get("matches")
    if isinstance(explicit, list) and explicit:
        return [match for match in explicit[:TOP_K] if isinstance(match, dict)]
    embedding = prediction.get("queryEmbedding")
    if isinstance(embedding, list) and embedding:
        return top_index_matches([float(value) for value in embedding], index)
    return []


def evaluate_provider(
    dataset: dict[str, Any],
    predictions: dict[str, Any],
    categories: dict[str, dict[str, Any]],
    index: dict[str, Any],
    iou_threshold: float,
    provider: dict[str, Any],
) -> dict[str, Any]:
    provider_id = provider.get("id")
    provider_filter = provider_id if provider_id and predictions.get("providers") else None
    pred_by_image = prediction_by_image(predictions, str(provider_filter) if provider_filter else None)
    image_results = []
    totals = Counter()
    confusion = Counter()
    timing_values: dict[str, list[float]] = {}

    for image in dataset.get("images", []):
        truths = [truth for truth in image.get("groundTruth", []) if isinstance(truth, dict)]
        preds = pred_by_image.get(image["id"], [])
        rows, extras = match_predictions_to_truths(truths, preds, categories, iou_threshold)
        for row in rows:
            row["prediction"]["topIndexMatches"] = ensure_prediction_matches(row["prediction"], index) if row["prediction"] else []
            totals["objects"] += 1
            totals["boxMatch"] += int(row["boxMatch"])
            totals["categoryMatch"] += int(row["categoryMatch"])
            totals["nameMatch"] += int(row["nameMatch"])
            totals["combinedMatch"] += int(row["combinedMatch"])
            totals["rejections"] += int(row["rejected"])
            top_matches = row["prediction"].get("topIndexMatches", []) if row["prediction"] else []
            totals["top1Retrieval"] += int(bool(top_matches) and top_matches[0].get("categoryId") == row["truth"].get("categoryId"))
            totals["top3Retrieval"] += int(any(match.get("categoryId") == row["truth"].get("categoryId") for match in top_matches[:TOP_K]))
            timings = row["prediction"].get("timings", {}) if row["prediction"] else {}
            if isinstance(timings, dict):
                for key, value in timings.items():
                    if isinstance(value, (int, float)) and math.isfinite(float(value)):
                        timing_values.setdefault(key, []).append(float(value))
            if not row["nameMatch"]:
                confusion[(row["truth"].get("categoryId"), row["prediction"].get("categoryId") if row["prediction"] else "missing")] += 1
        totals["extraPredictions"] += len(extras)
        image_results.append({
            "imageId": image["id"],
            "imagePath": image["imagePath"],
            "sourceTitle": image.get("sourceTitle"),
            "sourceUrl": image.get("sourceUrl"),
            "sourceProvider": image.get("sourceProvider"),
            "rows": rows,
            "extraPredictions": extras,
        })

    object_count = max(1, totals["objects"])
    skipped_count = skipped_by_provider(predictions, str(provider_id)) if provider_id else 0
    failure_count = sum(
        1 for image in predictions.get("images", [])
        for prediction in image.get("predictions", [])
        if isinstance(prediction, dict)
        and (not provider_id or prediction.get("providerId") == provider_id)
        and prediction.get("failureReason")
        and not prediction.get("skipped")
    )
    summary = {
        "providerId": provider_id,
        "providerName": provider.get("displayName") or provider_id,
        "providerClass": provider.get("providerClass") or provider_class(str(provider_id or "")),
        "providerStatus": provider.get("status", "ok"),
        "modelIds": provider.get("modelIds", []),
        "requiredModels": provider.get("requiredModels", []),
        "providerLoadTimings": provider.get("timings", {}),
        "skipReason": provider.get("skipReason", ""),
        "imageCount": len(dataset.get("images", [])),
        "objectCount": totals["objects"],
        "boxRecallAtIoU": round(totals["boxMatch"] / object_count, 4),
        "categoryAccuracy": round(totals["categoryMatch"] / object_count, 4),
        "nameAccuracy": round(totals["nameMatch"] / object_count, 4),
        "combinedAccuracy": round(totals["combinedMatch"] / object_count, 4),
        "top1RetrievalAccuracy": round(totals["top1Retrieval"] / object_count, 4),
        "top3RetrievalAccuracy": round(totals["top3Retrieval"] / object_count, 4),
        "rejectionCount": totals["rejections"],
        "extraPredictionCount": totals["extraPredictions"],
        "skippedPredictionCount": skipped_count,
        "failureCount": failure_count,
        "failureRate": round(failure_count / max(1, len(dataset.get("images", []))), 4),
        "iouThreshold": iou_threshold,
        "predictionModel": predictions.get("model", {}),
        "timings": {key: timing_summary(values) for key, values in sorted(timing_values.items())},
        "confusions": [
            {"expectedCategoryId": expected, "predictedCategoryId": predicted, "count": count}
            for (expected, predicted), count in confusion.most_common()
        ],
    }
    summary["goNoGo"] = provider_go_no_go(summary)
    return {"summary": summary, "images": image_results}


def normalize_prediction_providers(predictions: dict[str, Any]) -> list[dict[str, Any]]:
    providers = [provider for provider in predictions.get("providers", []) if isinstance(provider, dict) and provider.get("id")]
    if providers:
        return providers
    model_id = predictions.get("model", {}).get("id") or "default-provider"
    return [{
        "id": model_id,
        "displayName": model_id,
        "providerClass": PROVIDER_CLASSES.get(model_id, "legacy-single-provider"),
        "status": "ok",
    }]


def provider_go_no_go(summary: dict[str, Any], gates: dict[str, Any] | None = None) -> dict[str, Any]:
    gates = gates or DEFAULT_GATES
    provider_class_name = summary.get("providerClass")
    if provider_class_name != "real-local-model":
        return {"status": "not-applicable", "reasons": [f"{provider_class_name} is not a real local model provider"]}
    failed = []
    if summary.get("imageCount", 0) < gates["minImages"]:
        failed.append(f"imageCount {summary.get('imageCount', 0)} < {gates['minImages']}")
    for key in ("boxRecallAtIoU", "categoryAccuracy", "nameAccuracy", "combinedAccuracy", "top3RetrievalAccuracy"):
        if float(summary.get(key, 0)) < float(gates[key]):
            failed.append(f"{key} {summary.get(key, 0)} < {gates[key]}")
    end_to_end = summary.get("timings", {}).get("endToEndMs", {})
    if end_to_end.get("available") and float(end_to_end.get("p95", 0)) > float(gates["p95EndToEndMs"]):
        failed.append(f"p95EndToEndMs {end_to_end.get('p95')} > {gates['p95EndToEndMs']}")
    if float(summary.get("failureRate", 0)) > float(gates["failureRate"]):
        failed.append(f"failureRate {summary.get('failureRate')} > {gates['failureRate']}")
    return {"status": "go" if not failed else "no-go", "reasons": failed, "gates": gates}


def evaluate(dataset: dict[str, Any], predictions: dict[str, Any], categories: dict[str, dict[str, Any]], index: dict[str, Any], iou_threshold: float) -> dict[str, Any]:
    providers = normalize_prediction_providers(predictions)
    provider_reports = [evaluate_provider(dataset, predictions, categories, index, iou_threshold, provider) for provider in providers]
    primary = next((report for report in provider_reports if report["summary"].get("providerClass") == "real-local-model"), provider_reports[0])
    summary = {
        **primary["summary"],
        "providerSummaries": [report["summary"] for report in provider_reports],
        "predictionModel": predictions.get("model", {}),
    }
    return {
        "kind": "vision-model-eval-report",
        "version": "20260522-seed-report",
        "datasetVersion": dataset.get("version"),
        "predictionVersion": predictions.get("version"),
        "indexVersion": index.get("version"),
        "summary": summary,
        "images": primary["images"],
        "providerImages": {
            str(report["summary"].get("providerId")): report["images"]
            for report in provider_reports
        },
    }


def command_simulator_checks(args: argparse.Namespace) -> int:
    missing = preflight_vision_assets(["grounding-dino"], Path(tempfile.gettempdir()) / "missing-vision-manifest.json")
    if missing.get("ok") or missing.get("providers", {}).get("grounding-dino", {}).get("providerClass") != "skipped":
        raise EvaluationError("missing-asset preflight did not produce a skipped provider")

    canvas = canvas_baseline_prediction({
        "id": "sim-canvas",
        "imagePath": "fixtures/vision-real/raw/battery-query.jpg",
    })
    if canvas.get("providerClass") != "canvas-baseline" or canvas.get("timings", {}).get("detectionMs") is None:
        raise EvaluationError("canvas baseline did not include provider class and timing metadata")

    timing = timing_summary([1, 2, 10])
    if not timing.get("available") or timing.get("count") != 3 or timing.get("p95") is None:
        raise EvaluationError("timing aggregation failed")

    dataset = {
        "version": "sim",
        "images": [{
            "id": "sim-1",
            "imagePath": "fixtures/vision-real/raw/battery-query.jpg",
            "groundTruth": [{
                "name": "电池",
                "categoryId": "battery",
                "box": {"x": 10, "y": 10, "w": 40, "h": 40},
            }],
        }],
    }
    predictions = {
        "model": {"id": "legacy-sim-model"},
        "images": [{
            "imageId": "sim-1",
            "predictions": [{
                "name": "电池",
                "categoryId": "battery",
                "box": {"x": 10, "y": 10, "w": 40, "h": 40},
                "queryEmbedding": [1.0, 0.0],
            }],
        }],
    }
    categories = {
        "battery": {
            "id": "battery",
            "displayName": "电池",
            "aliases": ["battery"],
            "detectorLabels": ["battery"],
        }
    }
    index = {
        "version": "sim-index",
        "metric": "dot",
        "entries": [{
            "id": "battery:sim",
            "sampleId": "sim",
            "categoryId": "battery",
            "displayName": "电池",
            "sourceImagePath": "fixtures/vision-real/raw/battery-gallery-1.jpg",
            "embedding": [1.0, 0.0],
        }],
    }
    report = evaluate(dataset, predictions, categories, index, IOU_THRESHOLD)
    if report["summary"]["boxRecallAtIoU"] != 1 or report["summary"]["nameAccuracy"] != 1:
        raise EvaluationError("legacy single-provider evaluation filter failed")

    if args.output:
        write_json(args.output, {
            "kind": "vision-model-eval-simulator-checks",
            "status": "ok",
            "checks": [
                "missing assets skip real providers",
                "canvas baseline metadata",
                "timing aggregation",
                "legacy single-provider evaluation",
            ],
        })
    print("simulator checks passed")
    return 0


def css_box(box: dict[str, float]) -> str:
    return (
        f"left:{box['x']}%;top:{box['y']}%;"
        f"width:{box['w']}%;height:{box['h']}%;"
    )


def html_image_path(path: str, html_path: Path) -> str:
    target = resolve_path(path)
    return html.escape(os.path.relpath(target, html_path.parent))


def image_aspect_style(path: str) -> str:
    if Image is None:
        return ""
    try:
        with Image.open(resolve_path(path)) as image:
            width, height = image.size
        if width > 0 and height > 0:
            return f"aspect-ratio:{width}/{height};"
    except Exception:
        return ""
    return ""


def render_box_layer(row: dict[str, Any]) -> str:
    layers = []
    truth_box = normalize_box(row["truth"].get("box"))
    pred_box = normalize_box(row["prediction"].get("box")) if row.get("prediction") else None
    if truth_box:
        layers.append(f'<span class="box gt" style="{css_box(truth_box)}">GT</span>')
    if pred_box:
        layers.append(f'<span class="box pred" style="{css_box(pred_box)}">PRED</span>')
    return "\n".join(layers)


def render_match_cards(matches: list[dict[str, Any]], truth_category_id: str, html_path: Path) -> str:
    if not matches:
        return '<div class="empty">无 Top3 索引匹配</div>'
    cards = []
    for rank, match in enumerate(matches[:TOP_K], start=1):
        same = match.get("categoryId") == truth_category_id
        category_path = " > ".join(str(part) for part in match.get("categoryPath", []) if part)
        margin = match.get("margin")
        margin_text = f" · margin {margin}" if margin is not None else ""
        source_url = html.escape(str(match.get("sourceUrl") or ""))
        source_link = f'<a href="{source_url}" target="_blank" rel="noreferrer">source</a>' if source_url else ""
        cards.append(f"""
        <div class="match-card {'same' if same else 'diff'}">
          <div class="rank">#{rank} · score {html.escape(str(match.get('score', '')))}{html.escape(margin_text)}</div>
          <img src="{html_image_path(str(match.get('imagePath') or ''), html_path)}" alt="{html.escape(str(match.get('displayName') or 'index sample'))}" />
          <div class="match-name">{html.escape(str(match.get('displayName') or ''))}</div>
          <div class="match-id">{html.escape(str(match.get('categoryId') or ''))}</div>
          <div class="match-id">sample {html.escape(str(match.get('sampleId') or ''))}</div>
          <div class="match-path">{html.escape(category_path)}</div>
          <div class="match-id">index {html.escape(str(match.get('categoryIndexVersion') or ''))} {source_link}</div>
        </div>
        """)
    return "\n".join(cards)


def render_provider_summary_table(summary: dict[str, Any]) -> str:
    providers = summary.get("providerSummaries", [])
    if not isinstance(providers, list) or len(providers) <= 1:
        return ""
    rows = []
    for provider in providers:
        timings = provider.get("timings", {}).get("endToEndMs", {})
        p95 = timings.get("p95") if timings.get("available") else "n/a"
        model_ids = ", ".join(str(model_id) for model_id in provider.get("modelIds") or provider.get("requiredModels") or [])
        rows.append(f"""
          <tr>
            <td>{html.escape(str(provider.get('providerName') or provider.get('providerId') or ''))}</td>
            <td>{html.escape(model_ids or 'n/a')}</td>
            <td>{html.escape(str(provider.get('providerClass') or ''))}</td>
            <td>{html.escape(str(provider.get('providerStatus') or ''))}</td>
            <td>{provider.get('boxRecallAtIoU', 0):.0%}</td>
            <td>{provider.get('categoryAccuracy', 0):.0%}</td>
            <td>{provider.get('nameAccuracy', 0):.0%}</td>
            <td>{provider.get('combinedAccuracy', 0):.0%}</td>
            <td>{provider.get('top3RetrievalAccuracy', 0):.0%}</td>
            <td>{html.escape(str(p95))}</td>
            <td>{html.escape(str(provider.get('goNoGo', {}).get('status', '')))}</td>
          </tr>
        """)
    return f"""
    <section class="provider-panel">
      <h2>Provider 对比</h2>
      <table class="provider-table">
        <thead><tr><th>Provider</th><th>Model IDs</th><th>Class</th><th>Status</th><th>Box</th><th>Category</th><th>Name</th><th>Combined</th><th>Top3</th><th>P95 ms</th><th>Gate</th></tr></thead>
        <tbody>{''.join(rows)}</tbody>
      </table>
    </section>
    """


def provider_case_groups(report: dict[str, Any]) -> list[dict[str, Any]]:
    summaries = [
        provider for provider in report.get("summary", {}).get("providerSummaries", [])
        if isinstance(provider, dict) and provider.get("providerId")
    ]
    summary_by_id = {str(provider.get("providerId")): provider for provider in summaries}
    provider_images = report.get("providerImages", {})
    if isinstance(provider_images, dict) and provider_images:
        ordered_ids = [str(provider.get("providerId")) for provider in summaries if str(provider.get("providerId")) in provider_images]
        ordered_ids.extend(provider_id for provider_id in provider_images.keys() if provider_id not in ordered_ids)
        return [
            {
                "summary": summary_by_id.get(provider_id, {"providerId": provider_id, "providerName": provider_id}),
                "images": provider_images.get(provider_id, []),
            }
            for provider_id in ordered_ids
        ]
    return [{"summary": report.get("summary", {}), "images": report.get("images", [])}]


def provider_model_ids_text(provider: dict[str, Any]) -> str:
    model_ids = provider.get("modelIds") or provider.get("requiredModels") or []
    return ", ".join(str(model_id) for model_id in model_ids) if model_ids else "n/a"


def render_case_card(image: dict[str, Any], row: dict[str, Any], provider: dict[str, Any], output: Path) -> str:
    prediction = row.get("prediction") or {}
    truth = row["truth"]
    source_url = html.escape(str(image.get("sourceUrl") or ""))
    source_title = html.escape(str(image.get("sourceTitle") or ""))
    source_link = f'<a href="{source_url}" target="_blank" rel="noreferrer">{source_title or "source"}</a>' if source_url else source_title
    provider_name = str(provider.get("providerName") or provider.get("providerId") or "")
    provider_class_name = str(provider.get("providerClass") or "")
    provider_status = str(provider.get("providerStatus") or "")
    return f"""
    <section class="case">
      <div class="input-card">
        <div class="image-wrap" style="{image_aspect_style(image['imagePath'])}">
          <img src="{html_image_path(image['imagePath'], output)}" alt="{html.escape(image['imageId'])}" />
          {render_box_layer(row)}
        </div>
      </div>
      <div class="details">
        <h2>{html.escape(image['imageId'])}</h2>
        <div class="kv"><b>Provider</b><span>{html.escape(provider_name)} · {html.escape(provider_class_name)} · {html.escape(provider_status)}</span></div>
        <div class="kv"><b>Models</b><span>{html.escape(provider_model_ids_text(provider))}</span></div>
        <div class="kv"><b>GT</b><span>{html.escape(str(truth.get('name')))} · {html.escape(str(truth.get('categoryId')))}</span></div>
        <div class="kv"><b>Pred</b><span>{html.escape(str(prediction.get('name', '')))} · {html.escape(str(prediction.get('categoryId', '')))}</span></div>
        <div class="kv"><b>Source</b><span>{source_link}</span></div>
        <div class="badges">
          <span class="badge {'ok' if row['boxMatch'] else 'fail'}">IoU {row['iou']}</span>
          <span class="badge {'ok' if row.get('categoryMatch') else 'fail'}">Category</span>
          <span class="badge {'ok' if row['nameMatch'] else 'fail'}">Name {html.escape(row['nameMatchReason'])}</span>
          <span class="badge {'ok' if row['combinedMatch'] else 'fail'}">Combined</span>
        </div>
      </div>
      <div class="matches">
        <h3>Top 3 本地索引相似图片</h3>
        <div class="match-grid">
          {render_match_cards(prediction.get('topIndexMatches', []), truth.get('categoryId'), output)}
        </div>
      </div>
    </section>
    """


def render_provider_case_group(group: dict[str, Any], output: Path) -> str:
    provider = group["summary"]
    provider_name = str(provider.get("providerName") or provider.get("providerId") or "")
    provider_class_name = str(provider.get("providerClass") or "")
    gate = str(provider.get("goNoGo", {}).get("status") or "")
    case_cards = [
        render_case_card(image, row, provider, output)
        for image in group.get("images", [])
        for row in image.get("rows", [])
    ]
    return f"""
    <section class="provider-cases">
      <div class="provider-heading">
        <h2>{html.escape(provider_name)}</h2>
        <div>{html.escape(provider_class_name)} · Gate {html.escape(gate)} · Models: {html.escape(provider_model_ids_text(provider))}</div>
      </div>
      {''.join(case_cards)}
    </section>
    """


def render_html_report(report: dict[str, Any], output: Path) -> None:
    summary = report["summary"]
    model = summary.get("predictionModel", {})
    model_note = str(model.get("note") or "")
    model_id = str(model.get("id") or "")
    rows_html = [render_provider_case_group(group, output) for group in provider_case_groups(report)]

    document = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vision Model Evaluation Report</title>
  <style>
    body {{ margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f2ec; color: #1f2528; }}
    header {{ padding: 28px 36px; background: #172126; color: white; }}
    h1 {{ margin: 0 0 12px; font-size: 28px; }}
    .summary {{ display: flex; gap: 12px; flex-wrap: wrap; }}
    .metric {{ background: rgba(255,255,255,.12); padding: 10px 14px; border-radius: 8px; min-width: 130px; }}
    .metric b {{ display: block; font-size: 20px; }}
    .note {{ margin-top: 14px; max-width: 980px; color: #d7e2e7; line-height: 1.45; font-size: 13px; }}
    main {{ padding: 24px 36px 48px; display: grid; gap: 18px; }}
    .provider-panel {{ background:#fff; border:1px solid #ded8cd; border-radius:10px; padding:16px; overflow:auto; }}
    .provider-table {{ width:100%; border-collapse:collapse; font-size:13px; }}
    .provider-table th, .provider-table td {{ border-bottom:1px solid #ebe6dc; padding:7px 8px; text-align:left; white-space:nowrap; }}
    .provider-table th {{ color:#415055; }}
    .provider-cases {{ display: grid; gap: 14px; }}
    .provider-heading {{ position: sticky; top: 0; z-index: 2; background: #243137; color: #fff; border-radius: 8px; padding: 12px 14px; box-shadow: 0 1px 0 rgba(0,0,0,.08); }}
    .provider-heading h2 {{ margin: 0 0 4px; font-size: 18px; }}
    .provider-heading div {{ color: #d7e2e7; font-size: 12px; line-height: 1.35; }}
    .case {{ display: grid; grid-template-columns: minmax(280px, 360px) minmax(220px, 320px) 1fr; gap: 18px; background: #fff; border: 1px solid #ded8cd; border-radius: 10px; padding: 16px; }}
    .image-wrap {{ position: relative; width: 100%; aspect-ratio: 4/3; background: #ebe6dc; overflow: hidden; border-radius: 8px; }}
    .image-wrap img {{ width: 100%; height: 100%; object-fit: contain; display: block; }}
    .box {{ position: absolute; border: 3px solid; box-sizing: border-box; font-size: 11px; font-weight: 700; padding: 2px 4px; }}
    .box.gt {{ border-color: #239a5b; color: #165c38; background: rgba(35,154,91,.12); }}
    .box.pred {{ border-color: #d88718; color: #7a4600; background: rgba(216,135,24,.12); transform: translate(2px, 2px); }}
    h2 {{ margin: 0 0 14px; font-size: 18px; }}
    h3 {{ margin: 0 0 10px; font-size: 15px; }}
    .kv {{ display: grid; grid-template-columns: 56px 1fr; gap: 8px; margin: 8px 0; font-size: 14px; }}
    .badges {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }}
    .badge {{ border-radius: 999px; padding: 5px 9px; font-size: 12px; font-weight: 700; }}
    .badge.ok {{ background: #e2f4e8; color: #17633b; }}
    .badge.fail {{ background: #ffe8df; color: #9a351f; }}
    .match-grid {{ display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap: 10px; }}
    .match-card {{ border: 1px solid #ded8cd; border-radius: 8px; padding: 8px; background: #fbfaf7; }}
    .match-card.same {{ border-color: #70b88f; }}
    .match-card.diff {{ border-color: #e2a56f; }}
    .match-card img {{ width: 100%; aspect-ratio: 4/3; object-fit: contain; border-radius: 6px; background: #eee; display: block; }}
    .rank {{ font-size: 12px; font-weight: 700; margin-bottom: 6px; }}
    .match-name {{ font-size: 13px; font-weight: 700; margin-top: 6px; }}
    .match-id {{ font-size: 11px; color: #687174; }}
    .match-path {{ margin-top: 4px; font-size: 11px; color: #415055; line-height: 1.35; }}
    .empty {{ color: #7d8588; font-size: 13px; }}
    a {{ color: inherit; }}
    @media (max-width: 980px) {{ .case {{ grid-template-columns: 1fr; }} .match-grid {{ grid-template-columns: repeat(3, 1fr); }} }}
  </style>
</head>
<body>
  <header>
    <h1>本地视觉模型评测报告</h1>
    <div class="summary">
      <div class="metric"><b>{summary['imageCount']}</b>图片</div>
      <div class="metric"><b>{summary['boxRecallAtIoU']:.0%}</b>框召回 @ IoU {summary['iouThreshold']}</div>
      <div class="metric"><b>{summary['categoryAccuracy']:.0%}</b>类目准确</div>
      <div class="metric"><b>{summary['nameAccuracy']:.0%}</b>名称准确</div>
      <div class="metric"><b>{summary['combinedAccuracy']:.0%}</b>框+名同时正确</div>
    </div>
    <div class="note">Model: {html.escape(model_id)}{f" · {html.escape(model_note)}" if model_note else ""}</div>
  </header>
  <main>
    {render_provider_summary_table(summary)}
    {''.join(rows_html)}
  </main>
</body>
</html>
"""
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(document, encoding="utf-8")
    print(f"wrote {relative(output)}")


def render_markdown_report(report: dict[str, Any], output: Path) -> None:
    summary = report["summary"]
    model = summary.get("predictionModel", {})
    lines = [
        "# 本地视觉模型评测报告",
        "",
        f"- Dataset: `{report.get('datasetVersion', '')}`",
        f"- Predictions: `{report.get('predictionVersion', '')}`",
        f"- Index: `{report.get('indexVersion', '')}`",
        f"- Model: `{model.get('id', '')}`",
    ]
    if model.get("note"):
        lines.append(f"- Note: {model.get('note')}")
    lines.extend([
        "",
        "## Summary",
        "",
        "| Metric | Value |",
        "| --- | ---: |",
        f"| Images | {summary['imageCount']} |",
        f"| Objects | {summary['objectCount']} |",
        f"| Box recall @ IoU {summary['iouThreshold']} | {summary['boxRecallAtIoU']:.0%} |",
        f"| Category accuracy | {summary['categoryAccuracy']:.0%} |",
        f"| Name accuracy | {summary['nameAccuracy']:.0%} |",
        f"| Combined accuracy | {summary['combinedAccuracy']:.0%} |",
        f"| Rejections | {summary['rejectionCount']} |",
        f"| Extra predictions | {summary['extraPredictionCount']} |",
        "",
    ])
    provider_summaries = summary.get("providerSummaries", [])
    if isinstance(provider_summaries, list) and len(provider_summaries) > 1:
        lines.extend([
            "## Provider Comparison",
            "",
            "| Provider | Model IDs | Class | Status | Box | Category | Name | Combined | Top3 | P95 end-to-end ms | Gate |",
            "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
        ])
        for provider in provider_summaries:
            timings = provider.get("timings", {}).get("endToEndMs", {})
            p95 = timings.get("p95") if timings.get("available") else "n/a"
            lines.append(
                f"| {provider.get('providerName') or provider.get('providerId')} "
                f"| {provider_model_ids_text(provider)} "
                f"| {provider.get('providerClass')} "
                f"| {provider.get('providerStatus')} "
                f"| {provider.get('boxRecallAtIoU', 0):.0%} "
                f"| {provider.get('categoryAccuracy', 0):.0%} "
                f"| {provider.get('nameAccuracy', 0):.0%} "
                f"| {provider.get('combinedAccuracy', 0):.0%} "
                f"| {provider.get('top3RetrievalAccuracy', 0):.0%} "
                f"| {p95} "
                f"| {provider.get('goNoGo', {}).get('status')} |"
            )
        lines.append("")
    lines.extend([
        "## Cases By Provider",
        "",
    ])

    for group in provider_case_groups(report):
        provider = group["summary"]
        provider_name = provider.get("providerName") or provider.get("providerId")
        lines.extend([
            f"### {provider_name}",
            "",
            f"- Provider class: `{provider.get('providerClass', '')}`",
            f"- Provider status: `{provider.get('providerStatus', '')}`",
            f"- Model IDs: `{provider_model_ids_text(provider)}`",
            f"- Gate: `{provider.get('goNoGo', {}).get('status', '')}`",
            "",
        ])
        for image in group.get("images", []):
            source = image.get("sourceUrl") or ""
            source_title = image.get("sourceTitle") or source
            for row in image.get("rows", []):
                truth = row["truth"]
                prediction = row.get("prediction") or {}
                lines.extend([
                    f"#### {image['imageId']}",
                    "",
                    f"- Query image: `{image['imagePath']}`",
                    f"- Source: [{source_title}]({source})" if source else f"- Source: {source_title}",
                    f"- GT: {truth.get('name')} / `{truth.get('categoryId')}` / box `{truth.get('box')}`",
                    f"- Prediction: {prediction.get('name', '')} / `{prediction.get('categoryId', '')}` / box `{prediction.get('box')}`",
                    f"- IoU: `{row['iou']}`; boxMatch: `{row['boxMatch']}`; categoryMatch: `{row['categoryMatch']}`; nameMatch: `{row['nameMatch']}`; combined: `{row['combinedMatch']}`",
                    "- Top3 index matches:",
                ])
                matches = prediction.get("topIndexMatches", [])
                if not matches:
                    lines.append("  - none")
                for rank, match in enumerate(matches[:TOP_K], start=1):
                    match_source = match.get("sourceUrl") or ""
                    source_text = f" [{match.get('sourceTitle') or 'source'}]({match_source})" if match_source else ""
                    lines.append(
                        f"  - #{rank} {match.get('displayName')} / `{match.get('categoryId')}` "
                        f"score `{match.get('score')}` image `{match.get('imagePath')}`{source_text}"
                    )
                lines.append("")

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {relative(output)}")


def command_evaluate(args: argparse.Namespace) -> int:
    dataset = read_json(args.dataset)
    predictions = read_json(args.predictions)
    categories = load_categories(args.categories)
    index = read_json(args.index)
    report = evaluate(dataset, predictions, categories, index, args.iou_threshold)
    write_json(args.output_json, report)
    render_html_report(report, args.output_html)
    if args.output_md:
        render_markdown_report(report, args.output_md)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    fixtures = subparsers.add_parser("create-fixtures", help="Create seed household image fixtures and dataset manifest")
    fixtures.add_argument("--samples", type=Path, default=DEFAULT_SAMPLES)
    fixtures.add_argument("--categories", type=Path, default=DEFAULT_CATEGORIES)
    fixtures.add_argument("--fixture-dir", type=Path, default=DEFAULT_FIXTURE_DIR)
    fixtures.add_argument("--output", type=Path, default=DEFAULT_DATASET)
    fixtures.set_defaults(func=command_create_fixtures)

    fixture_predictions = subparsers.add_parser("fixture-predictions", help="Create deterministic fixture local-model output")
    fixture_predictions.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    fixture_predictions.add_argument("--index", type=Path, default=DEFAULT_INDEX)
    fixture_predictions.add_argument("--output", type=Path, default=DEFAULT_PREDICTIONS)
    fixture_predictions.set_defaults(func=command_fixture_predictions)

    real_photo_set = subparsers.add_parser("create-real-photo-set", help="Create the real-photo dataset, real-photo display index, and GT-assisted predictions")
    real_photo_set.add_argument("--sources", type=Path, default=DEFAULT_REAL_SOURCES)
    real_photo_set.add_argument("--categories", type=Path, default=DEFAULT_CATEGORIES)
    real_photo_set.add_argument("--dataset", type=Path, default=DEFAULT_REAL_DATASET)
    real_photo_set.add_argument("--index", type=Path, default=DEFAULT_REAL_INDEX)
    real_photo_set.add_argument("--predictions", type=Path, default=DEFAULT_REAL_PREDICTIONS)
    real_photo_set.add_argument("--download", action="store_true", help="Download missing Commons images via Special:FilePath")
    real_photo_set.add_argument("--download-width", type=int, default=1000)
    real_photo_set.set_defaults(func=command_create_real_photo_set)

    preflight = subparsers.add_parser("preflight-assets", help="Validate local vision runtime and model assets")
    preflight.add_argument("--providers", default=",".join(DEFAULT_PROVIDER_MATRIX))
    preflight.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    preflight.add_argument("--output", type=Path, default=ROOT / "data" / "generated" / "vision-model-asset-preflight.json")
    preflight.add_argument("--strict", action="store_true", help="Exit non-zero if any requested real local model asset is missing")
    preflight.set_defaults(func=command_preflight)

    benchmark = subparsers.add_parser("benchmark", help="Run provider benchmark predictions and optionally render reports")
    benchmark.add_argument("--dataset", type=Path, default=DEFAULT_REAL_DATASET)
    benchmark.add_argument("--index", type=Path, default=DEFAULT_REAL_INDEX)
    benchmark.add_argument("--categories", type=Path, default=DEFAULT_CATEGORIES)
    benchmark.add_argument("--providers", default=",".join(DEFAULT_PROVIDER_MATRIX))
    benchmark.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    benchmark.add_argument("--output", type=Path, default=DEFAULT_BENCHMARK_PREDICTIONS)
    benchmark.add_argument("--raw-output", type=Path, default=DEFAULT_BENCHMARK_RAW)
    benchmark.add_argument("--raw-dir", type=Path, default=ROOT / "data" / "generated" / "vision-model-benchmark-raw")
    benchmark.add_argument("--run-local-models", action="store_true", help="Execute local learned model providers through the Node Transformers.js runner")
    benchmark.add_argument("--evaluate", action="store_true", help="Render JSON/HTML/Markdown report after prediction generation")
    benchmark.add_argument("--output-json", type=Path, default=ROOT / "data" / "generated" / "vision-model-eval-report.benchmark.json")
    benchmark.add_argument("--output-html", type=Path, default=ROOT / "data" / "generated" / "vision-model-eval-report.benchmark.html")
    benchmark.add_argument("--output-md", type=Path, default=ROOT / "data" / "generated" / "vision-model-eval-report.benchmark.md")
    benchmark.add_argument("--iou-threshold", type=float, default=IOU_THRESHOLD)
    benchmark.set_defaults(func=command_benchmark)

    simulator = subparsers.add_parser("simulator-checks", help="Run script-level sanity checks without browser inspection")
    simulator.add_argument("--output", type=Path, default=ROOT / "data" / "generated" / "vision-model-eval-simulator-checks.json")
    simulator.set_defaults(func=command_simulator_checks)

    run_predictor = subparsers.add_parser("run-predictor", help="Run an external local predictor command for every dataset image")
    run_predictor.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    run_predictor.add_argument("--output", type=Path, default=DEFAULT_PREDICTIONS)
    run_predictor.add_argument("--temp-dir", type=Path, default=ROOT / "data" / "generated" / "vision-predictor-raw")
    run_predictor.add_argument("--model-id", default="local-model")
    run_predictor.add_argument("--version", default="local-model-output")
    run_predictor.add_argument("command", nargs="+", help="Command parts; supports {image}, {output}, and {image_id}")
    run_predictor.set_defaults(func=command_run_predictor)

    evaluate_parser = subparsers.add_parser("evaluate", help="Evaluate predictions and render JSON/HTML report")
    evaluate_parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    evaluate_parser.add_argument("--predictions", type=Path, default=DEFAULT_PREDICTIONS)
    evaluate_parser.add_argument("--categories", type=Path, default=DEFAULT_CATEGORIES)
    evaluate_parser.add_argument("--index", type=Path, default=DEFAULT_INDEX)
    evaluate_parser.add_argument("--output-json", type=Path, default=DEFAULT_REPORT_JSON)
    evaluate_parser.add_argument("--output-html", type=Path, default=DEFAULT_REPORT_HTML)
    evaluate_parser.add_argument("--output-md", type=Path, default=DEFAULT_REPORT_MD)
    evaluate_parser.add_argument("--iou-threshold", type=float, default=IOU_THRESHOLD)
    evaluate_parser.set_defaults(func=command_evaluate)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args) or 0)
    except subprocess.CalledProcessError as error:
        print(f"predictor failed with exit code {error.returncode}: {' '.join(error.cmd)}", file=sys.stderr)
        return error.returncode or 1
    except EvaluationError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
