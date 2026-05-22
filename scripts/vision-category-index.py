#!/usr/bin/env python3
"""Build and evaluate the local vision category index.

The first implementation intentionally keeps the embedding backend dependency-free:
fixture samples use deterministic normalized vectors so validation and gating can run
on any developer machine. The embedding boundary records the configured CLIP model id
and can be replaced by a real local CLIP adapter without changing index/eval formats.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import statistics
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "data" / "vision-taxonomy-source.seed.json"
DEFAULT_CATEGORIES = ROOT / "data" / "vision-categories.seed.json"
DEFAULT_SAMPLES = ROOT / "data" / "vision-samples.seed.json"
DEFAULT_VALIDATION = ROOT / "data" / "generated" / "vision-validation-report.seed.json"
DEFAULT_EVALUATION = ROOT / "data" / "generated" / "vision-evaluation.seed.json"
DEFAULT_INDEX = ROOT / "data" / "vision-index.generated.json"
DEFAULT_MODEL_ID = "Xenova/clip-vit-base-patch32"
DEFAULT_DIMENSION = 512
DEFAULT_ACCEPT_SCORE = 0.82
DEFAULT_ACCEPT_MARGIN = 0.03
DEFAULT_TOP_K = 5
DEFAULT_EVALUATION_ID = "eval-20260522-household-seed"
DEFAULT_EVALUATION_VERSION = "20260522-household-seed-evaluation"
DEFAULT_VALIDATION_VERSION = "20260522-household-seed-validation"
DEFAULT_BUILD_VERSION = "20260522-household-seed-index"
DEFAULT_BUILD_TIMESTAMP = "2026-05-22T00:00:00Z"

VALID_APP_CATEGORIES = {"food", "medicine", "pet", "document", "tool", "daily", "appliance"}
VALID_SPLITS = {"gallery", "eval", "holdout"}
VALID_REVIEW_STATUSES = {"reviewed", "pending", "rejected"}


class ValidationProblem(Exception):
    pass


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValidationProblem(f"{rel(path)} must contain a JSON object")
    return value


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {rel(path)}")


def slugify(value: str) -> str:
    lowered = value.strip().lower()
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    lowered = lowered.strip("-")
    return lowered or "category"


def normalize_string_list(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        text = str(value).strip()
        key = text.lower()
        if text and key not in seen:
            result.append(text)
            seen.add(key)
    return result


def normalize_path_list(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    return [str(value).strip() for value in values if str(value).strip()]


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


def normalize_source_record(record: dict[str, Any], taxonomy: dict[str, Any]) -> dict[str, Any]:
    levels = normalize_path_list(record.get("levels"))
    display_path = normalize_path_list(record.get("displayPath"))
    category_id = str(record.get("id") or slugify(levels[-1] if levels else "")).strip()
    active = record.get("active") is not False
    source = str(record.get("source") or taxonomy.get("primarySource") or "unknown").strip()
    source_version = str(record.get("sourceVersion") or taxonomy.get("primaryVersion") or "unknown").strip()
    source_id = str(record.get("sourceId") or "").strip()

    if len(levels) != 4:
        return {
            "id": category_id,
            "source": source,
            "sourceVersion": source_version,
            "sourceId": source_id or f"incomplete:{category_id}",
            "lineage": {
                "level1": levels[0] if len(levels) > 0 else "",
                "level2": levels[1] if len(levels) > 1 else "",
                "level3": levels[2] if len(levels) > 2 else "",
                "level4": levels[3] if len(levels) > 3 else "",
            },
            "displayPath": (display_path + levels)[:4],
            "displayName": display_path[-1] if display_path else (levels[-1] if levels else category_id),
            "aliases": normalize_string_list(record.get("aliases")),
            "detectorLabels": normalize_string_list(record.get("detectorLabels")),
            "searchQueries": normalize_string_list(record.get("searchQueries")),
            "appCategory": record.get("appCategory") if record.get("appCategory") in VALID_APP_CATEGORIES else "daily",
            "active": False,
            "exclusionReason": record.get("exclusionReason") or "Taxonomy path did not normalize to four levels.",
        }

    if len(display_path) != 4:
        display_path = levels

    category: dict[str, Any] = {
        "id": category_id,
        "source": source,
        "sourceVersion": source_version,
        "sourceId": source_id or category_id,
        "lineage": {
            "level1": levels[0],
            "level2": levels[1],
            "level3": levels[2],
            "level4": levels[3],
        },
        "displayPath": display_path,
        "displayName": display_path[-1],
        "aliases": normalize_string_list(record.get("aliases")),
        "detectorLabels": normalize_string_list(record.get("detectorLabels")),
        "searchQueries": normalize_string_list(record.get("searchQueries")),
        "appCategory": record.get("appCategory") if record.get("appCategory") in VALID_APP_CATEGORIES else "daily",
        "active": active,
    }
    google_mapping = record.get("googleProductTaxonomy")
    if isinstance(google_mapping, dict) and google_mapping.get("id"):
        category["googleProductTaxonomy"] = {
            "id": str(google_mapping["id"]),
            "path": normalize_string_list(google_mapping.get("path")),
        }
    if not active:
        category["exclusionReason"] = str(record.get("exclusionReason") or "Excluded from household subset.").strip()
    return category


def command_import_taxonomy(args: argparse.Namespace) -> int:
    source = read_json(args.input)
    taxonomy = source.get("taxonomy") if isinstance(source.get("taxonomy"), dict) else {}
    subset = source.get("subset") if isinstance(source.get("subset"), dict) else {}
    records = source.get("records") if isinstance(source.get("records"), list) else []
    categories = [
        normalize_source_record(record, taxonomy)
        for record in records
        if isinstance(record, dict)
    ]
    active_ids = [category["id"] for category in categories if category.get("active")]
    exclusions = [
        {"categoryId": category["id"], "reason": category.get("exclusionReason") or "Inactive category."}
        for category in categories
        if not category.get("active")
    ]
    payload = {
        "kind": "vision-categories",
        "version": args.version,
        "taxonomy": {
            "primarySource": taxonomy.get("primarySource") or "GS1 GPC",
            "primaryVersion": taxonomy.get("primaryVersion") or "unknown",
            "auxiliarySources": taxonomy.get("auxiliarySources") or [],
        },
        "subset": {
            "id": subset.get("id") or "household",
            "name": subset.get("name") or "Household subset",
            "includedCategoryIds": active_ids,
            "exclusions": exclusions,
        },
        "categories": categories,
    }
    errors, warnings = validate_taxonomy(payload)
    if errors:
        raise ValidationProblem("\n".join(errors))
    write_json(args.output, payload)
    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)
    return 0


def validate_taxonomy(taxonomy: dict[str, Any]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    if taxonomy.get("kind") != "vision-categories":
        errors.append("taxonomy.kind must be vision-categories")
    categories = taxonomy.get("categories")
    if not isinstance(categories, list) or not categories:
        errors.append("taxonomy.categories must be a non-empty array")
        return errors, warnings

    ids: set[str] = set()
    source_ids: set[str] = set()
    active_ids: set[str] = set()
    for index, category in enumerate(categories):
        prefix = f"categories[{index}]"
        if not isinstance(category, dict):
            errors.append(f"{prefix} must be an object")
            continue
        category_id = str(category.get("id") or "").strip()
        if not category_id:
            errors.append(f"{prefix}.id is required")
        elif category_id in ids:
            errors.append(f"duplicate category id: {category_id}")
        ids.add(category_id)

        source_id = str(category.get("sourceId") or "").strip()
        if not source_id:
            errors.append(f"{category_id}.sourceId is required")
        elif source_id in source_ids:
            errors.append(f"duplicate source id: {source_id}")
        source_ids.add(source_id)

        lineage = category.get("lineage")
        if not isinstance(lineage, dict):
            errors.append(f"{category_id}.lineage is required")
        else:
            for level in ("level1", "level2", "level3", "level4"):
                if not str(lineage.get(level) or "").strip():
                    errors.append(f"{category_id}.lineage.{level} is required")

        display_path = category.get("displayPath")
        if not isinstance(display_path, list) or len(display_path) != 4 or not all(str(part).strip() for part in display_path):
            errors.append(f"{category_id}.displayPath must contain exactly four non-empty values")
        if not str(category.get("displayName") or "").strip():
            errors.append(f"{category_id}.displayName is required")
        if not isinstance(category.get("aliases"), list):
            errors.append(f"{category_id}.aliases must be an array")
        if not isinstance(category.get("detectorLabels"), list) or not category.get("detectorLabels"):
            errors.append(f"{category_id}.detectorLabels must be a non-empty array")
        if category.get("appCategory") not in VALID_APP_CATEGORIES:
            errors.append(f"{category_id}.appCategory is invalid")
        if category.get("active") is True:
            active_ids.add(category_id)
        elif not str(category.get("exclusionReason") or "").strip():
            errors.append(f"{category_id}.exclusionReason is required for inactive categories")

    subset = taxonomy.get("subset") if isinstance(taxonomy.get("subset"), dict) else {}
    included = subset.get("includedCategoryIds")
    if not isinstance(included, list):
        errors.append("subset.includedCategoryIds must be an array")
    else:
        included_set = set(map(str, included))
        missing = sorted(included_set - ids)
        if missing:
            errors.append(f"subset includes unknown category ids: {', '.join(missing)}")
        inactive_included = sorted(included_set - active_ids)
        if inactive_included:
            errors.append(f"subset includes inactive category ids: {', '.join(inactive_included)}")
        active_missing = sorted(active_ids - included_set)
        if active_missing:
            warnings.append(f"active categories not listed in subset: {', '.join(active_missing)}")

    return errors, warnings


def validate_samples(taxonomy: dict[str, Any], manifest: dict[str, Any]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    if manifest.get("kind") != "vision-samples":
        errors.append("samples.kind must be vision-samples")
    samples = manifest.get("samples")
    if not isinstance(samples, list) or not samples:
        errors.append("samples.samples must be a non-empty array")
        return errors, warnings

    categories = {category["id"]: category for category in taxonomy.get("categories", []) if isinstance(category, dict) and category.get("id")}
    sample_ids: set[str] = set()
    split_by_category: dict[str, set[str]] = defaultdict(set)
    for index, sample in enumerate(samples):
        prefix = f"samples[{index}]"
        if not isinstance(sample, dict):
            errors.append(f"{prefix} must be an object")
            continue
        sample_id = str(sample.get("id") or "").strip()
        category_id = str(sample.get("categoryId") or "").strip()
        if not sample_id:
            errors.append(f"{prefix}.id is required")
        elif sample_id in sample_ids:
            errors.append(f"duplicate sample id: {sample_id}")
        sample_ids.add(sample_id)
        if category_id not in categories:
            errors.append(f"{sample_id}.categoryId references unknown category: {category_id}")
        elif categories[category_id].get("active") is not True:
            warnings.append(f"{sample_id} references inactive category {category_id}; it will only be used as an unknown sample")
        if sample.get("split") not in VALID_SPLITS:
            errors.append(f"{sample_id}.split must be gallery, eval, or holdout")
        else:
            split_by_category[category_id].add(sample["split"])
        if sample.get("reviewStatus") not in VALID_REVIEW_STATUSES:
            errors.append(f"{sample_id}.reviewStatus is invalid")
        if not isinstance(sample.get("license"), dict) or not sample["license"].get("name") or not sample["license"].get("usage"):
            errors.append(f"{sample_id}.license.name and usage are required")
        if not str(sample.get("imagePath") or "").strip():
            errors.append(f"{sample_id}.imagePath is required")
        if not re.fullmatch(r"[a-f0-9]{64}", str(sample.get("sha256") or "")):
            errors.append(f"{sample_id}.sha256 must be a 64-character lowercase hex digest")
        if sample.get("humanBox") is not None and normalize_box(sample.get("humanBox")) is None:
            errors.append(f"{sample_id}.humanBox is invalid")

    active_ids = [category["id"] for category in categories.values() if category.get("active")]
    for category_id in active_ids:
        splits = split_by_category.get(category_id, set())
        if "gallery" not in splits:
            warnings.append(f"{category_id} has no gallery samples")
        if "eval" not in splits:
            warnings.append(f"{category_id} has no eval samples")
    return errors, warnings


def command_validate(args: argparse.Namespace) -> int:
    taxonomy = read_json(args.taxonomy)
    manifest = read_json(args.samples)
    taxonomy_errors, taxonomy_warnings = validate_taxonomy(taxonomy)
    sample_errors, sample_warnings = validate_samples(taxonomy, manifest)
    report = {
        "kind": "vision-validation-report",
        "version": args.report_version,
        "passed": not taxonomy_errors and not sample_errors,
        "taxonomy": rel(args.taxonomy),
        "samples": rel(args.samples),
        "errors": taxonomy_errors + sample_errors,
        "warnings": taxonomy_warnings + sample_warnings,
    }
    if args.output:
        write_json(args.output, report)
    for warning in report["warnings"]:
        print(f"warning: {warning}", file=sys.stderr)
    if report["errors"]:
        for error in report["errors"]:
            print(f"error: {error}", file=sys.stderr)
        return 1
    print("validation passed")
    return 0


def raw_vector(seed: str, dimension: int) -> list[float]:
    values: list[float] = []
    counter = 0
    while len(values) < dimension:
        digest = hashlib.sha256(f"{seed}:{counter}".encode("utf-8")).digest()
        counter += 1
        for offset in range(0, len(digest), 4):
            integer = int.from_bytes(digest[offset:offset + 4], "big", signed=False)
            values.append((integer / 0xFFFFFFFF) * 2.0 - 1.0)
            if len(values) == dimension:
                break
    return values


def normalize_vector(values: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in values))
    if not norm:
        return [0.0 for _ in values]
    return [value / norm for value in values]


def mixed_embedding(category_id: str, sample_id: str, dimension: int = DEFAULT_DIMENSION) -> list[float]:
    base = normalize_vector(raw_vector(f"category:{category_id}", dimension))
    noise = normalize_vector(raw_vector(f"sample:{sample_id}", dimension))
    values = [(0.965 * base_value) + (0.035 * noise_value) for base_value, noise_value in zip(base, noise)]
    return normalize_vector(values)


def dot(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right))


def percentile(values: list[float], percent: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round((percent / 100) * (len(ordered) - 1))))
    return ordered[index]


def active_categories(taxonomy: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        category["id"]: category
        for category in taxonomy.get("categories", [])
        if isinstance(category, dict) and category.get("active") is True
    }


def all_categories(taxonomy: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        category["id"]: category
        for category in taxonomy.get("categories", [])
        if isinstance(category, dict) and category.get("id")
    }


def reviewed_samples(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        sample
        for sample in manifest.get("samples", [])
        if isinstance(sample, dict) and sample.get("reviewStatus") == "reviewed"
    ]


def build_gallery_vectors(
    taxonomy: dict[str, Any],
    manifest: dict[str, Any],
    dimension: int,
) -> list[dict[str, Any]]:
    categories = active_categories(taxonomy)
    gallery: list[dict[str, Any]] = []
    for sample in reviewed_samples(manifest):
        if sample.get("split") != "gallery" or sample.get("categoryId") not in categories:
            continue
        category = categories[sample["categoryId"]]
        gallery.append({
            "sample": sample,
            "category": category,
            "embedding": mixed_embedding(category["id"], sample["id"], dimension),
        })
    return gallery


def rank_gallery(query_embedding: list[float], gallery: list[dict[str, Any]], top_k: int = DEFAULT_TOP_K) -> list[dict[str, Any]]:
    ranked = [
        {
            "sampleId": item["sample"]["id"],
            "categoryId": item["category"]["id"],
            "level3": item["category"]["lineage"]["level3"],
            "score": dot(query_embedding, item["embedding"]),
        }
        for item in gallery
    ]
    ranked.sort(key=lambda entry: entry["score"], reverse=True)
    return ranked[:top_k]


def best_by_leaf(ranked: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    for entry in ranked:
        current = grouped.get(entry["categoryId"])
        if not current or entry["score"] > current["score"]:
            grouped[entry["categoryId"]] = {
                "categoryId": entry["categoryId"],
                "level3": entry["level3"],
                "score": entry["score"],
                "sampleIds": [entry["sampleId"]],
            }
        elif current and entry["sampleId"] not in current["sampleIds"]:
            current["sampleIds"].append(entry["sampleId"])
    return sorted(grouped.values(), key=lambda entry: entry["score"], reverse=True)


def evaluate_samples(
    taxonomy: dict[str, Any],
    manifest: dict[str, Any],
    dimension: int,
    accept_score: float,
    accept_margin: float,
) -> dict[str, Any]:
    categories = all_categories(taxonomy)
    active = active_categories(taxonomy)
    gallery = build_gallery_vectors(taxonomy, manifest, dimension)
    if not gallery:
        raise ValidationProblem("No reviewed gallery samples are available for active categories")

    active_eval = [
        sample for sample in reviewed_samples(manifest)
        if sample.get("split") == "eval" and sample.get("categoryId") in active
    ]
    unknown_eval = [
        sample for sample in reviewed_samples(manifest)
        if sample.get("split") == "eval" and sample.get("categoryId") not in active
    ]
    if not active_eval:
        raise ValidationProblem("No reviewed eval samples are available for active categories")

    top1_hits = 0
    top3_hits = 0
    parent_hits = 0
    accepted = 0
    false_accepts = 0
    scores: list[float] = []
    margins: list[float] = []
    latencies: list[float] = []
    confusions: Counter[tuple[str, str]] = Counter()
    per_sample: list[dict[str, Any]] = []

    for sample in active_eval + unknown_eval:
        start = time.perf_counter()
        query = mixed_embedding(sample["categoryId"], sample["id"], dimension)
        ranked = rank_gallery(query, gallery)
        leaves = best_by_leaf(ranked)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        best = leaves[0] if leaves else None
        runner_up = next((entry for entry in leaves[1:] if entry["categoryId"] != best["categoryId"]), None) if best else None
        margin = (best["score"] - runner_up["score"]) if best and runner_up else (best["score"] if best else 0.0)
        is_known = sample.get("categoryId") in active
        accepted_match = bool(best and best["score"] >= accept_score and margin >= accept_margin)
        latencies.append(elapsed_ms)
        if best:
            scores.append(best["score"])
            margins.append(margin)
        if is_known:
            expected = active[sample["categoryId"]]
            top_ids = [entry["categoryId"] for entry in leaves[:3]]
            if best and best["categoryId"] == sample["categoryId"]:
                top1_hits += 1
            else:
                confusions[(sample["categoryId"], best["categoryId"] if best else "none")] += 1
            if sample["categoryId"] in top_ids:
                top3_hits += 1
            if best and categories[best["categoryId"]]["lineage"]["level3"] == expected["lineage"]["level3"]:
                parent_hits += 1
            if accepted_match:
                accepted += 1
        elif accepted_match:
            false_accepts += 1
        per_sample.append({
            "sampleId": sample["id"],
            "expectedCategoryId": sample.get("categoryId"),
            "knownCategory": is_known,
            "accepted": accepted_match,
            "topCategoryId": best["categoryId"] if best else None,
            "score": round(best["score"], 6) if best else None,
            "margin": round(margin, 6),
            "latencyMs": round(elapsed_ms, 4),
        })

    known_total = len(active_eval)
    unknown_total = len(unknown_eval)
    metrics = {
        "knownEvalCount": known_total,
        "unknownEvalCount": unknown_total,
        "galleryEntryCount": len(gallery),
        "leafTop1": top1_hits / known_total,
        "leafTop3": top3_hits / known_total,
        "level3ParentAccuracy": parent_hits / known_total,
        "coverage": accepted / known_total,
        "falseAcceptRate": false_accepts / unknown_total if unknown_total else 0.0,
        "unknownRejectionRate": 1.0 - (false_accepts / unknown_total) if unknown_total else 1.0,
        "scoreDistribution": {
            "min": min(scores) if scores else None,
            "p50": percentile(scores, 50),
            "p95": percentile(scores, 95),
            "max": max(scores) if scores else None,
        },
        "marginDistribution": {
            "min": min(margins) if margins else None,
            "p50": percentile(margins, 50),
            "p95": percentile(margins, 95),
            "max": max(margins) if margins else None,
        },
        "latencyMs": {
            "mean": statistics.fmean(latencies) if latencies else 0.0,
            "p95": percentile(latencies, 95),
        },
    }
    return {
        "metrics": round_metrics(metrics),
        "confusions": [
            {"expectedCategoryId": expected, "predictedCategoryId": predicted, "count": count}
            for (expected, predicted), count in confusions.most_common()
        ],
        "perSample": per_sample,
    }


def round_metrics(value: Any) -> Any:
    if isinstance(value, float):
        return round(value, 6)
    if isinstance(value, dict):
        return {key: round_metrics(item) for key, item in value.items()}
    if isinstance(value, list):
        return [round_metrics(item) for item in value]
    return value


def command_evaluate(args: argparse.Namespace) -> int:
    taxonomy = read_json(args.taxonomy)
    manifest = read_json(args.samples)
    errors, warnings = validate_taxonomy(taxonomy)
    sample_errors, sample_warnings = validate_samples(taxonomy, manifest)
    if errors or sample_errors:
        raise ValidationProblem("\n".join(errors + sample_errors))
    for warning in warnings + sample_warnings:
        print(f"warning: {warning}", file=sys.stderr)

    evaluated = evaluate_samples(taxonomy, manifest, args.dimension, args.accept_score, args.accept_margin)
    metrics = evaluated["metrics"]
    gate = {
        "leafTop1Min": args.leaf_top1_min,
        "leafTop3Min": args.leaf_top3_min,
        "level3ParentAccuracyMin": args.level3_parent_min,
        "falseAcceptRateMax": args.false_accept_max,
    }
    passed = (
        metrics["leafTop1"] >= gate["leafTop1Min"]
        and metrics["leafTop3"] >= gate["leafTop3Min"]
        and metrics["level3ParentAccuracy"] >= gate["level3ParentAccuracyMin"]
        and metrics["falseAcceptRate"] <= gate["falseAcceptRateMax"]
    )
    report = {
        "kind": "vision-embedding-evaluation",
        "version": args.report_version,
        "id": args.report_id,
        "passed": passed,
        "taxonomyVersion": taxonomy.get("version"),
        "sampleManifestVersion": manifest.get("version"),
        "embedding": {
            "modelId": args.model_id,
            "dimension": args.dimension,
            "normalized": True,
            "adapter": "deterministic-fixture",
        },
        "metric": "max-inner-product",
        "thresholds": {
            "acceptScore": args.accept_score,
            "acceptMargin": args.accept_margin,
            **gate,
        },
        **evaluated,
    }
    write_json(args.output, report)
    print("evaluation passed" if passed else "evaluation failed")
    return 0 if passed else 2


def make_index_entry(
    sample: dict[str, Any],
    category: dict[str, Any],
    embedding: list[float],
    build_version: str,
) -> dict[str, Any]:
    box = normalize_box(sample.get("humanBox"))
    if not box:
        raise ValidationProblem(f"{sample['id']} has no valid humanBox and no local detector adapter is configured")
    crop = {
        "type": "human-box",
        "paddingPct": 4,
        "box": box,
    }
    return {
        "id": f"{category['id']}:{sample['id']}",
        "categoryId": category["id"],
        "itemId": category["id"],
        "displayName": category["displayName"],
        "name": category["displayName"],
        "appCategory": category["appCategory"],
        "categoryPath": category["displayPath"],
        "lineage": category["lineage"],
        "sampleId": sample["id"],
        "matchedSampleIds": [sample["id"]],
        "sourceImagePath": sample["imagePath"],
        "sourceUrl": sample.get("sourceUrl", ""),
        "license": sample.get("license", {}),
        "box": box,
        "crop": crop,
        "embedding": [round(value, 8) for value in embedding],
        "buildVersion": build_version,
    }


def command_build_index(args: argparse.Namespace) -> int:
    taxonomy = read_json(args.taxonomy)
    manifest = read_json(args.samples)
    errors, warnings = validate_taxonomy(taxonomy)
    sample_errors, sample_warnings = validate_samples(taxonomy, manifest)
    if errors or sample_errors:
        raise ValidationProblem("\n".join(errors + sample_errors))
    for warning in warnings + sample_warnings:
        print(f"warning: {warning}", file=sys.stderr)

    evaluation: dict[str, Any] | None = None
    production_ready = True
    if args.evaluation.exists():
        evaluation = read_json(args.evaluation)
    if not args.force:
        if not evaluation:
            raise ValidationProblem(f"Missing evaluation report: {rel(args.evaluation)}")
        if evaluation.get("passed") is not True:
            raise ValidationProblem("Latest evaluation report did not pass; use --force to build a non-production index")
    elif not evaluation or evaluation.get("passed") is not True:
        production_ready = False

    build_version = args.build_version
    categories = active_categories(taxonomy)
    failures: list[dict[str, str]] = []
    entries: list[dict[str, Any]] = []
    for sample in reviewed_samples(manifest):
        if sample.get("split") != "gallery":
            continue
        category = categories.get(sample.get("categoryId"))
        if not category:
            continue
        try:
            embedding = mixed_embedding(category["id"], sample["id"], args.dimension)
            entries.append(make_index_entry(sample, category, embedding, build_version))
        except Exception as error:
            failures.append({"sampleId": sample.get("id", ""), "reason": str(error)})

    if not entries:
        raise ValidationProblem("No index entries were generated")

    evaluation_thresholds = evaluation.get("thresholds", {}) if evaluation else {}
    accept_score = float(evaluation_thresholds.get("acceptScore", args.accept_score))
    accept_margin = float(evaluation_thresholds.get("acceptMargin", args.accept_margin))
    index = {
        "kind": "vision-category-index",
        "version": build_version,
        "algorithm": "flat-inner-product",
        "metric": "max-inner-product",
        "normalized": True,
        "embeddingModel": args.model_id,
        "embedding": {
            "modelId": args.model_id,
            "dimension": args.dimension,
            "normalized": True,
            "adapter": "deterministic-fixture",
        },
        "threshold": accept_score,
        "marginThreshold": accept_margin,
        "thresholds": {
            "acceptScore": accept_score,
            "acceptMargin": accept_margin,
        },
        "topK": args.top_k,
        "taxonomy": taxonomy.get("taxonomy"),
        "taxonomyVersion": taxonomy.get("version"),
        "sampleManifestVersion": manifest.get("version"),
        "evaluationReportId": evaluation.get("id") if evaluation else None,
        "evaluationReportPath": rel(args.evaluation) if evaluation else None,
        "buildTimestamp": args.build_timestamp,
        "productionReady": production_ready,
        "forced": bool(args.force),
        "entryCount": len(entries),
        "failureCount": len(failures),
        "failures": failures,
        "entries": entries,
    }
    write_json(args.output, index)
    if failures:
        print(f"warning: skipped {len(failures)} sample(s); see index.failures", file=sys.stderr)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    import_parser = subparsers.add_parser("import-taxonomy", help="Normalize GS1 GPC-style source records")
    import_parser.add_argument("--input", type=Path, default=DEFAULT_SOURCE)
    import_parser.add_argument("--output", type=Path, default=DEFAULT_CATEGORIES)
    import_parser.add_argument("--version", default="20260522-household-seed")
    import_parser.set_defaults(func=command_import_taxonomy)

    validate_parser = subparsers.add_parser("validate", help="Validate taxonomy and sample manifests")
    validate_parser.add_argument("--taxonomy", type=Path, default=DEFAULT_CATEGORIES)
    validate_parser.add_argument("--samples", type=Path, default=DEFAULT_SAMPLES)
    validate_parser.add_argument("--output", type=Path, default=DEFAULT_VALIDATION)
    validate_parser.add_argument("--report-version", default=DEFAULT_VALIDATION_VERSION)
    validate_parser.set_defaults(func=command_validate)

    eval_parser = subparsers.add_parser("evaluate", help="Run preflight embedding evaluation")
    eval_parser.add_argument("--taxonomy", type=Path, default=DEFAULT_CATEGORIES)
    eval_parser.add_argument("--samples", type=Path, default=DEFAULT_SAMPLES)
    eval_parser.add_argument("--output", type=Path, default=DEFAULT_EVALUATION)
    eval_parser.add_argument("--model-id", default=DEFAULT_MODEL_ID)
    eval_parser.add_argument("--report-id", default=DEFAULT_EVALUATION_ID)
    eval_parser.add_argument("--report-version", default=DEFAULT_EVALUATION_VERSION)
    eval_parser.add_argument("--dimension", type=int, default=DEFAULT_DIMENSION)
    eval_parser.add_argument("--accept-score", type=float, default=DEFAULT_ACCEPT_SCORE)
    eval_parser.add_argument("--accept-margin", type=float, default=DEFAULT_ACCEPT_MARGIN)
    eval_parser.add_argument("--leaf-top1-min", type=float, default=0.70)
    eval_parser.add_argument("--leaf-top3-min", type=float, default=0.85)
    eval_parser.add_argument("--level3-parent-min", type=float, default=0.90)
    eval_parser.add_argument("--false-accept-max", type=float, default=0.05)
    eval_parser.set_defaults(func=command_evaluate)

    build_parser_ = subparsers.add_parser("build-index", help="Build generated gallery index")
    build_parser_.add_argument("--taxonomy", type=Path, default=DEFAULT_CATEGORIES)
    build_parser_.add_argument("--samples", type=Path, default=DEFAULT_SAMPLES)
    build_parser_.add_argument("--evaluation", type=Path, default=DEFAULT_EVALUATION)
    build_parser_.add_argument("--output", type=Path, default=DEFAULT_INDEX)
    build_parser_.add_argument("--model-id", default=DEFAULT_MODEL_ID)
    build_parser_.add_argument("--build-version", default=DEFAULT_BUILD_VERSION)
    build_parser_.add_argument("--build-timestamp", default=DEFAULT_BUILD_TIMESTAMP)
    build_parser_.add_argument("--dimension", type=int, default=DEFAULT_DIMENSION)
    build_parser_.add_argument("--accept-score", type=float, default=DEFAULT_ACCEPT_SCORE)
    build_parser_.add_argument("--accept-margin", type=float, default=DEFAULT_ACCEPT_MARGIN)
    build_parser_.add_argument("--top-k", type=int, default=DEFAULT_TOP_K)
    build_parser_.add_argument("--force", action="store_true")
    build_parser_.set_defaults(func=command_build_index)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args) or 0)
    except ValidationProblem as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    except BrokenPipeError:
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
