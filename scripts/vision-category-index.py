#!/usr/bin/env python3
"""Build and evaluate the local vision category index.

The first implementation intentionally keeps the embedding backend dependency-free:
fixture samples use deterministic normalized vectors so validation and gating can run
on any developer machine. The embedding boundary records the configured CLIP model id
and can be replaced by a real local CLIP adapter without changing index/eval formats.
"""

from __future__ import annotations

import argparse
import csv
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
DEFAULT_HOUSEHOLD_SOURCE = ROOT / "data" / "vision-taxonomy-source.household.json"
DEFAULT_HOUSEHOLD_CATEGORIES = ROOT / "data" / "vision-categories.household.json"
DEFAULT_HOUSEHOLD_COVERAGE = ROOT / "data" / "generated" / "vision-taxonomy-coverage.household.json"
DEFAULT_HOUSEHOLD_EMBEDDING_SELECTION = ROOT / "data" / "vision-embedding-category-selection.household.tsv"
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
DEFAULT_HOUSEHOLD_VERSION = "20260523-household-expanded"
DEFAULT_COVERAGE_VERSION = "20260523-household-expanded-coverage"

VALID_APP_CATEGORIES = {"food", "medicine", "pet", "document", "tool", "daily", "appliance"}
VALID_SPLITS = {"gallery", "eval", "holdout"}
VALID_REVIEW_STATUSES = {"reviewed", "pending", "rejected"}
VALID_COVERAGE_TIERS = {"seed", "mvp", "common", "long-tail"}
COVERAGE_TIER_RANK = {"seed": 0, "mvp": 1, "common": 2, "long-tail": 3}
GENERIC_DETECTOR_LABELS = {"object", "item", "thing", "household item"}
CANONICAL_LINEAGE_LEVELS = ["Segment", "Family", "Class", "Brick"]
EMBEDDING_SELECTION_COLUMNS = [
    "categoryId",
    "displayName",
    "displayPath",
    "lineage",
    "coverageTier",
    "appCategory",
    "includeForEmbedding",
    "embeddingPriority",
    "annotationStatus",
    "notes",
]


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


def normalize_int(value: Any, default: int = 0) -> int:
    try:
        return max(0, int(value))
    except (TypeError, ValueError):
        return default


def normalize_coverage_tier(value: Any) -> str | None:
    text = str(value or "").strip()
    return text if text in VALID_COVERAGE_TIERS else None


def normalize_path_list(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    return [str(value).strip() for value in values if str(value).strip()]


def normalize_auxiliary_source_ids(values: Any) -> list[dict[str, Any]]:
    if not isinstance(values, list):
        return []
    result: list[dict[str, Any]] = []
    for value in values:
        if not isinstance(value, dict):
            continue
        source = str(value.get("source") or "").strip()
        source_id = str(value.get("id") or value.get("sourceId") or "").strip()
        if not source or not source_id:
            continue
        result.append({
            "source": source,
            "id": source_id,
            "path": normalize_string_list(value.get("path")),
            "usage": str(value.get("usage") or "auxiliary-mapping").strip(),
        })
    return result


def normalize_index_readiness(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    gallery = normalize_int(value.get("reviewedGallerySamples", value.get("gallerySamples", 0)))
    evaluation = normalize_int(value.get("evaluationSamples", value.get("reviewedEvaluationSamples", 0)))
    required_gallery = normalize_int(value.get("requiredGallerySamples", 3), 3)
    required_eval = normalize_int(value.get("requiredEvaluationSamples", 2), 2)
    index_ready = value.get("indexReady")
    if not isinstance(index_ready, bool):
        index_ready = gallery >= required_gallery and evaluation >= required_eval
    readiness = {
        "reviewedGallerySamples": gallery,
        "evaluationSamples": evaluation,
        "requiredGallerySamples": required_gallery,
        "requiredEvaluationSamples": required_eval,
        "indexReady": index_ready,
    }
    notes = str(value.get("notes") or "").strip()
    if notes:
        readiness["notes"] = notes
    return readiness


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


def expand_grouped_source_records(source: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, int]]:
    records = [
        dict(record)
        for record in source.get("records", [])
        if isinstance(record, dict)
    ]
    excluded_by_tier: Counter[str] = Counter()
    taxonomy = source.get("taxonomy") if isinstance(source.get("taxonomy"), dict) else {}
    source_name = taxonomy.get("primarySource") or "GS1 GPC"
    source_version = taxonomy.get("primaryVersion") or "unknown"

    domains = source.get("domains") if isinstance(source.get("domains"), list) else []
    for domain in domains:
        if not isinstance(domain, dict):
            continue
        domain_tier = normalize_coverage_tier(domain.get("coverageTier")) or "mvp"
        domain_display = str(domain.get("displayName") or domain.get("id") or "").strip()
        groups = domain.get("groups") if isinstance(domain.get("groups"), list) else []
        for group in groups:
            if not isinstance(group, dict):
                continue
            base_levels = normalize_path_list(group.get("levels"))
            base_display_path = normalize_path_list(group.get("displayPath"))
            if len(base_levels) != 3 or len(base_display_path) != 3:
                continue
            prefix = str(group.get("sourceIdPrefix") or f"GPC-HH-{slugify(domain_display)}-{slugify(group.get('id') or '')}").upper()
            leaves = group.get("leaves") if isinstance(group.get("leaves"), list) else []
            for offset, leaf in enumerate(leaves, start=1):
                if not isinstance(leaf, dict):
                    continue
                leaf_id = str(leaf.get("id") or "").strip()
                brick = str(leaf.get("brick") or leaf.get("label") or leaf_id.replace("-", " ")).strip()
                display_name = str(leaf.get("displayName") or leaf_id).strip()
                labels = normalize_string_list(leaf.get("detectorLabels") or leaf.get("labels"))
                if not labels:
                    labels = [brick.lower(), leaf_id.replace("-", " ")]
                if len(labels) == 1:
                    labels.append(leaf_id.replace("-", " "))
                search_queries = normalize_string_list(leaf.get("searchQueries") or leaf.get("queries"))
                if not search_queries:
                    search_queries = [f"{label} household" for label in labels[:2]]
                aliases = normalize_string_list(leaf.get("aliases"))
                aliases = normalize_string_list([*aliases, *labels, display_name])
                record = {
                    "id": leaf_id,
                    "source": leaf.get("source") or group.get("source") or source_name,
                    "sourceVersion": leaf.get("sourceVersion") or group.get("sourceVersion") or source_version,
                    "sourceId": leaf.get("sourceId") or f"{prefix}-{offset:04d}",
                    "levels": [*base_levels, brick],
                    "displayPath": [*base_display_path, display_name],
                    "aliases": aliases,
                    "detectorLabels": labels,
                    "searchQueries": search_queries,
                    "appCategory": leaf.get("appCategory") or group.get("appCategory") or "daily",
                    "active": leaf.get("active") is not False,
                    "coverageTier": normalize_coverage_tier(leaf.get("coverageTier")) or normalize_coverage_tier(group.get("coverageTier")) or domain_tier,
                    "indexReadiness": leaf.get("indexReadiness") or {
                        "reviewedGallerySamples": 0,
                        "evaluationSamples": 0,
                        "indexReady": False,
                    },
                }
                if leaf.get("googleProductTaxonomy"):
                    record["googleProductTaxonomy"] = leaf["googleProductTaxonomy"]
                elif leaf.get("gpt"):
                    google_path = normalize_string_list(group.get("googlePath"))
                    record["googleProductTaxonomy"] = {
                        "id": str(leaf["gpt"]),
                        "path": [*google_path, brick] if google_path else [brick],
                    }
                if leaf.get("auxiliarySourceIds") or group.get("auxiliarySourceIds"):
                    record["auxiliarySourceIds"] = [
                        *(group.get("auxiliarySourceIds") if isinstance(group.get("auxiliarySourceIds"), list) else []),
                        *(leaf.get("auxiliarySourceIds") if isinstance(leaf.get("auxiliarySourceIds"), list) else []),
                    ]
                if leaf.get("sourceOverrideReason") or group.get("sourceOverrideReason"):
                    record["sourceOverrideReason"] = str(leaf.get("sourceOverrideReason") or group.get("sourceOverrideReason")).strip()
                if leaf.get("disambiguation"):
                    record["disambiguation"] = str(leaf["disambiguation"]).strip()
                if leaf.get("active") is False:
                    record["exclusionReason"] = str(leaf.get("exclusionReason") or "Excluded from expanded household visual taxonomy.").strip()
                records.append(record)

    return records, dict(excluded_by_tier)


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
    coverage_tier = normalize_coverage_tier(record.get("coverageTier"))
    if coverage_tier:
        category["coverageTier"] = coverage_tier
    auxiliary_source_ids = normalize_auxiliary_source_ids(record.get("auxiliarySourceIds"))
    if auxiliary_source_ids:
        category["auxiliarySourceIds"] = auxiliary_source_ids
    readiness = normalize_index_readiness(record.get("indexReadiness"))
    if readiness:
        category["indexReadiness"] = readiness
    source_override_reason = str(record.get("sourceOverrideReason") or "").strip()
    if source_override_reason:
        category["sourceOverrideReason"] = source_override_reason
    disambiguation = str(record.get("disambiguation") or "").strip()
    if disambiguation:
        category["disambiguation"] = disambiguation
    if not active:
        category["exclusionReason"] = str(record.get("exclusionReason") or "Excluded from household subset.").strip()
    return category


def command_import_taxonomy(args: argparse.Namespace) -> int:
    source = read_json(args.input)
    taxonomy = source.get("taxonomy") if isinstance(source.get("taxonomy"), dict) else {}
    subset = source.get("subset") if isinstance(source.get("subset"), dict) else {}
    records, _ = expand_grouped_source_records(source)
    max_tier = normalize_coverage_tier(args.max_coverage_tier)
    excluded_by_tier: Counter[str] = Counter()
    if max_tier:
        max_rank = COVERAGE_TIER_RANK[max_tier]
        filtered_records: list[dict[str, Any]] = []
        for record in records:
            tier = normalize_coverage_tier(record.get("coverageTier"))
            if tier and COVERAGE_TIER_RANK[tier] > max_rank:
                excluded_by_tier[tier] += 1
                continue
            filtered_records.append(record)
        records = filtered_records
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
    taxonomy_payload = {
        "primarySource": taxonomy.get("primarySource") or "GS1 GPC",
        "primaryVersion": taxonomy.get("primaryVersion") or "unknown",
        "auxiliarySources": taxonomy.get("auxiliarySources") or [],
    }
    for optional_key in ("canonicalLineageLevels", "sourceStrategy", "coverageTiers", "coverageTargets"):
        if optional_key in taxonomy:
            taxonomy_payload[optional_key] = taxonomy[optional_key]
    payload = {
        "kind": "vision-categories",
        "version": args.version,
        "taxonomy": taxonomy_payload,
        "subset": {
            "id": subset.get("id") or "household",
            "name": subset.get("name") or "Household subset",
            "includedCategoryIds": active_ids,
            "exclusions": exclusions,
        },
        "categories": categories,
    }
    if max_tier or excluded_by_tier:
        payload["build"] = {
            "sourcePath": rel(args.input),
            "maxCoverageTier": max_tier or "all",
            "excludedByCoverageTier": dict(sorted(excluded_by_tier.items())),
            "excludedByCoverageTierCount": sum(excluded_by_tier.values()),
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
    display_paths: dict[str, str] = {}
    detector_labels: dict[str, list[str]] = defaultdict(list)
    taxonomy_meta = taxonomy.get("taxonomy") if isinstance(taxonomy.get("taxonomy"), dict) else {}
    primary_source = str(taxonomy_meta.get("primarySource") or "")
    requires_expanded_contract = primary_source == "GS1 GPC" or any(
        isinstance(category, dict) and category.get("coverageTier")
        for category in categories
    )
    if primary_source == "GS1 GPC":
        levels = taxonomy_meta.get("canonicalLineageLevels")
        if levels != CANONICAL_LINEAGE_LEVELS:
            errors.append("taxonomy.canonicalLineageLevels must be Segment, Family, Class, Brick for GS1 GPC")
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
        else:
            display_key = " / ".join(str(part).strip().lower() for part in display_path)
            existing = display_paths.get(display_key)
            if existing and not category.get("disambiguation"):
                errors.append(f"duplicate display path: {existing} and {category_id}")
            else:
                display_paths[display_key] = category_id
        if not str(category.get("displayName") or "").strip():
            errors.append(f"{category_id}.displayName is required")
        aliases = category.get("aliases")
        if not isinstance(aliases, list):
            errors.append(f"{category_id}.aliases must be an array")
        elif category.get("active") is True and requires_expanded_contract and not normalize_string_list(aliases):
            errors.append(f"{category_id}.aliases must not be empty")
        labels = normalize_string_list(category.get("detectorLabels"))
        if not labels:
            errors.append(f"{category_id}.detectorLabels must be a non-empty array")
        else:
            for label in labels:
                detector_labels[label.lower()].append(category_id)
        if category.get("active") is True and requires_expanded_contract:
            if len(labels) < 2:
                errors.append(f"{category_id}.detectorLabels must contain at least two labels")
            if not any(re.search(r"[A-Za-z]", label) for label in labels):
                errors.append(f"{category_id}.detectorLabels must include English detector prompts")
            if labels and all(label.strip().lower() in GENERIC_DETECTOR_LABELS for label in labels):
                errors.append(f"{category_id}.detectorLabels cannot be generic-only")
            search_queries = normalize_string_list(category.get("searchQueries"))
            if not search_queries:
                errors.append(f"{category_id}.searchQueries must not be empty")
            tier = normalize_coverage_tier(category.get("coverageTier"))
            if not tier:
                errors.append(f"{category_id}.coverageTier must be seed, mvp, common, or long-tail")
            if primary_source == "GS1 GPC":
                if category.get("source") != "GS1 GPC":
                    errors.append(f"{category_id}.source must be GS1 GPC")
                if category.get("googleProductTaxonomy") and not isinstance(category["googleProductTaxonomy"], dict):
                    errors.append(f"{category_id}.googleProductTaxonomy must be an object when present")
        if category.get("appCategory") not in VALID_APP_CATEGORIES:
            errors.append(f"{category_id}.appCategory is invalid")
        if category.get("active") is True:
            active_ids.add(category_id)
        elif not str(category.get("exclusionReason") or "").strip():
            errors.append(f"{category_id}.exclusionReason is required for inactive categories")

    duplicate_detector_labels = {
        label: sorted(set(category_ids))
        for label, category_ids in detector_labels.items()
        if len(set(category_ids)) > 1
    }
    for label, category_ids in sorted(duplicate_detector_labels.items()):
        warnings.append(f"detector label '{label}' is shared by categories: {', '.join(category_ids)}")

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


def count_reviewed_samples_by_category(manifest: dict[str, Any] | None) -> dict[str, Counter[str]]:
    counts: dict[str, Counter[str]] = defaultdict(Counter)
    if not manifest:
        return counts
    for sample in reviewed_samples(manifest):
        category_id = str(sample.get("categoryId") or "").strip()
        split = str(sample.get("split") or "").strip()
        if category_id and split:
            counts[category_id][split] += 1
    return counts


def readiness_for_category(
    category: dict[str, Any],
    sample_counts: dict[str, Counter[str]],
    min_gallery: int,
    min_eval: int,
) -> dict[str, Any]:
    readiness = normalize_index_readiness(category.get("indexReadiness")) or {}
    category_counts = sample_counts.get(category.get("id", ""), Counter())
    gallery = max(normalize_int(readiness.get("reviewedGallerySamples")), category_counts.get("gallery", 0))
    evaluation = max(normalize_int(readiness.get("evaluationSamples")), category_counts.get("eval", 0))
    return {
        "categoryId": category.get("id"),
        "reviewedGallerySamples": gallery,
        "evaluationSamples": evaluation,
        "requiredGallerySamples": min_gallery,
        "requiredEvaluationSamples": min_eval,
        "indexReady": gallery >= min_gallery and evaluation >= min_eval,
    }


def increment(counter: dict[str, int], key: Any) -> None:
    text = str(key or "unknown").strip() or "unknown"
    counter[text] = counter.get(text, 0) + 1


def build_coverage_report(
    taxonomy: dict[str, Any],
    manifest: dict[str, Any] | None,
    version: str,
    min_gallery: int,
    min_eval: int,
) -> dict[str, Any]:
    taxonomy_errors, taxonomy_warnings = validate_taxonomy(taxonomy)
    sample_errors: list[str] = []
    sample_warnings: list[str] = []
    if manifest:
        sample_errors, sample_warnings = validate_samples(taxonomy, manifest)
    categories = [
        category
        for category in taxonomy.get("categories", [])
        if isinstance(category, dict)
    ]
    active = [category for category in categories if category.get("active") is True]
    mvp_active = [
        category
        for category in active
        if category.get("coverageTier") in {"seed", "mvp"} or not category.get("coverageTier")
    ]
    sample_counts = count_reviewed_samples_by_category(manifest)

    counts = {
        "byCoverageTier": {},
        "byLevel1": {},
        "byLevel2": {},
        "byLevel3": {},
        "byAppCategory": {},
        "byActiveStatus": {},
        "byIndexReadiness": {},
    }
    readiness_rows: list[dict[str, Any]] = []
    for category in categories:
        lineage = category.get("lineage") if isinstance(category.get("lineage"), dict) else {}
        increment(counts["byCoverageTier"], category.get("coverageTier") or "unspecified")
        increment(counts["byLevel1"], lineage.get("level1"))
        increment(counts["byLevel2"], lineage.get("level2"))
        increment(counts["byLevel3"], lineage.get("level3"))
        increment(counts["byAppCategory"], category.get("appCategory"))
        increment(counts["byActiveStatus"], "active" if category.get("active") is True else "inactive")
        if category.get("active") is True:
            readiness = readiness_for_category(category, sample_counts, min_gallery, min_eval)
            readiness_rows.append(readiness)
            increment(counts["byIndexReadiness"], "index-ready" if readiness["indexReady"] else "not-index-ready")

    target_config = {}
    taxonomy_meta = taxonomy.get("taxonomy") if isinstance(taxonomy.get("taxonomy"), dict) else {}
    if isinstance(taxonomy_meta.get("coverageTargets"), dict):
        target_config = taxonomy_meta["coverageTargets"]
    gaps: list[dict[str, Any]] = []
    min_active_leaves = normalize_int(target_config.get("minActiveLeaves"), 0)
    if min_active_leaves and len(mvp_active) < min_active_leaves:
        gaps.append({
            "type": "min-active-leaves",
            "current": len(mvp_active),
            "minimum": min_active_leaves,
            "missingExamples": ["add more MVP household leaves"],
        })
    min_domains = normalize_int(target_config.get("minLevel1Domains"), 0)
    mvp_domains = {category["displayPath"][0] for category in mvp_active if isinstance(category.get("displayPath"), list) and category["displayPath"]}
    if min_domains and len(mvp_domains) < min_domains:
        gaps.append({
            "type": "min-level1-domains",
            "current": len(mvp_domains),
            "minimum": min_domains,
            "missingExamples": ["add more household domains"],
        })
    domain_minimums = target_config.get("domainMinimums") if isinstance(target_config.get("domainMinimums"), dict) else {}
    domain_examples = target_config.get("domainExamples") if isinstance(target_config.get("domainExamples"), dict) else {}
    current_by_display_domain = Counter(
        category["displayPath"][0]
        for category in mvp_active
        if isinstance(category.get("displayPath"), list) and category["displayPath"]
    )
    for domain, minimum in sorted(domain_minimums.items()):
        current = current_by_display_domain.get(domain, 0)
        required = normalize_int(minimum, 0)
        if current < required:
            examples = domain_examples.get(domain) if isinstance(domain_examples.get(domain), list) else []
            gaps.append({
                "type": "domain-minimum",
                "domain": domain,
                "current": current,
                "minimum": required,
                "missingExamples": examples[:5],
            })

    label_to_categories: dict[str, list[str]] = defaultdict(list)
    singleton_sibling_groups: list[dict[str, Any]] = []
    siblings: dict[str, list[str]] = defaultdict(list)
    prompt_issues = {
        "duplicateDetectorLabels": [],
        "genericOnlyLabels": [],
        "missingSearchQueries": [],
        "singletonSiblingGroups": [],
    }
    for category in active:
        labels = normalize_string_list(category.get("detectorLabels"))
        if labels and all(label.lower() in GENERIC_DETECTOR_LABELS for label in labels):
            prompt_issues["genericOnlyLabels"].append(category["id"])
        if not normalize_string_list(category.get("searchQueries")):
            prompt_issues["missingSearchQueries"].append(category["id"])
        for label in labels:
            label_to_categories[label.lower()].append(category["id"])
        lineage = category.get("lineage") if isinstance(category.get("lineage"), dict) else {}
        sibling_key = " / ".join(str(lineage.get(level) or "") for level in ("level1", "level2", "level3"))
        siblings[sibling_key].append(category["id"])
    for label, category_ids in sorted(label_to_categories.items()):
        unique_ids = sorted(set(category_ids))
        if len(unique_ids) > 1:
            prompt_issues["duplicateDetectorLabels"].append({"label": label, "categoryIds": unique_ids})
    for sibling_key, category_ids in sorted(siblings.items()):
        if sibling_key.strip(" /") and len(category_ids) == 1:
            singleton_sibling_groups.append({"level3": sibling_key, "categoryIds": category_ids})
    prompt_issues["singletonSiblingGroups"] = singleton_sibling_groups

    passed = not taxonomy_errors and not sample_errors and not gaps
    return {
        "kind": "vision-taxonomy-coverage-report",
        "version": version,
        "passed": passed,
        "taxonomyVersion": taxonomy.get("version"),
        "sampleManifestVersion": manifest.get("version") if manifest else None,
        "summary": {
            "categoryCount": len(categories),
            "activeLeafCount": len(active),
            "mvpActiveLeafCount": len(mvp_active),
            "level1DomainCount": len({category.get("lineage", {}).get("level1") for category in active if isinstance(category.get("lineage"), dict)}),
            "displayDomainCount": len(mvp_domains),
            "indexReadyLeafCount": sum(1 for row in readiness_rows if row["indexReady"]),
            "notIndexReadyLeafCount": sum(1 for row in readiness_rows if not row["indexReady"]),
        },
        "counts": counts,
        "targets": target_config,
        "gaps": gaps,
        "promptQualityIssues": prompt_issues,
        "indexReadiness": readiness_rows,
        "errors": taxonomy_errors + sample_errors,
        "warnings": taxonomy_warnings + sample_warnings,
    }


def command_coverage_report(args: argparse.Namespace) -> int:
    taxonomy = read_json(args.taxonomy)
    manifest = read_json(args.samples) if args.samples else None
    report = build_coverage_report(
        taxonomy,
        manifest,
        args.report_version,
        args.min_gallery_samples,
        args.min_eval_samples,
    )
    write_json(args.output, report)
    for warning in report["warnings"]:
        print(f"warning: {warning}", file=sys.stderr)
    for gap in report["gaps"]:
        print(f"gap: {gap}", file=sys.stderr)
    for error in report["errors"]:
        print(f"error: {error}", file=sys.stderr)
    print("coverage validation passed" if report["passed"] else "coverage validation failed")
    return 0 if report["passed"] else 1


def read_embedding_selection_tsv(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        rows: dict[str, dict[str, str]] = {}
        for row in reader:
            category_id = str(row.get("categoryId") or "").strip()
            if category_id:
                rows[category_id] = {str(key): str(value or "") for key, value in row.items() if key}
        return rows


def default_embedding_priority(category: dict[str, Any]) -> str:
    tier = normalize_coverage_tier(category.get("coverageTier")) or "mvp"
    return {
        "seed": "p0",
        "mvp": "p1",
        "common": "p2",
        "long-tail": "p3",
    }.get(tier, "p2")


def command_export_embedding_selection(args: argparse.Namespace) -> int:
    taxonomy = read_json(args.taxonomy)
    errors, warnings = validate_taxonomy(taxonomy)
    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)
    if errors:
        raise ValidationProblem("\n".join(errors))

    existing = read_embedding_selection_tsv(args.output) if args.preserve_existing else {}
    categories = [
        category
        for category in taxonomy.get("categories", [])
        if isinstance(category, dict) and category.get("active") is True
    ]
    categories.sort(key=lambda category: (
        " / ".join(map(str, category.get("displayPath") or [])).lower(),
        str(category.get("id") or ""),
    ))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=EMBEDDING_SELECTION_COLUMNS, delimiter="\t", lineterminator="\n")
        writer.writeheader()
        for category in categories:
            category_id = str(category.get("id") or "")
            previous = existing.get(category_id, {})
            display_path = normalize_path_list(category.get("displayPath"))
            lineage = category.get("lineage") if isinstance(category.get("lineage"), dict) else {}
            lineage_path = [
                str(lineage.get("level1") or ""),
                str(lineage.get("level2") or ""),
                str(lineage.get("level3") or ""),
                str(lineage.get("level4") or ""),
            ]
            writer.writerow({
                "categoryId": category_id,
                "displayName": category.get("displayName") or category_id,
                "displayPath": " / ".join(display_path),
                "lineage": " / ".join(part for part in lineage_path if part),
                "coverageTier": category.get("coverageTier") or "",
                "appCategory": category.get("appCategory") or "",
                "includeForEmbedding": previous.get("includeForEmbedding") or args.default_include,
                "embeddingPriority": previous.get("embeddingPriority") or default_embedding_priority(category),
                "annotationStatus": previous.get("annotationStatus") or "pending",
                "notes": previous.get("notes") or "",
            })
    print(f"wrote {rel(args.output)}")
    print(f"exported {len(categories)} active category row(s)")
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
    readiness_tracked = any(isinstance(category.get("indexReadiness"), dict) for category in categories.values())
    if readiness_tracked:
        ready_categories = {
            category_id: category
            for category_id, category in categories.items()
            if (normalize_index_readiness(category.get("indexReadiness")) or {}).get("indexReady") is True
        }
        if args.force:
            production_ready = False
        else:
            categories = ready_categories
            if not categories:
                raise ValidationProblem("No index-ready active categories are available; use --force only for a non-production build")
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
    import_parser.add_argument("--max-coverage-tier", choices=sorted(VALID_COVERAGE_TIERS, key=COVERAGE_TIER_RANK.get))
    import_parser.set_defaults(func=command_import_taxonomy)

    validate_parser = subparsers.add_parser("validate", help="Validate taxonomy and sample manifests")
    validate_parser.add_argument("--taxonomy", type=Path, default=DEFAULT_CATEGORIES)
    validate_parser.add_argument("--samples", type=Path, default=DEFAULT_SAMPLES)
    validate_parser.add_argument("--output", type=Path, default=DEFAULT_VALIDATION)
    validate_parser.add_argument("--report-version", default=DEFAULT_VALIDATION_VERSION)
    validate_parser.set_defaults(func=command_validate)

    coverage_parser = subparsers.add_parser("coverage-report", help="Validate expanded taxonomy coverage and readiness")
    coverage_parser.add_argument("--taxonomy", type=Path, default=DEFAULT_HOUSEHOLD_CATEGORIES)
    coverage_parser.add_argument("--samples", type=Path)
    coverage_parser.add_argument("--output", type=Path, default=DEFAULT_HOUSEHOLD_COVERAGE)
    coverage_parser.add_argument("--report-version", default=DEFAULT_COVERAGE_VERSION)
    coverage_parser.add_argument("--min-gallery-samples", type=int, default=3)
    coverage_parser.add_argument("--min-eval-samples", type=int, default=2)
    coverage_parser.set_defaults(func=command_coverage_report)

    selection_parser = subparsers.add_parser(
        "export-embedding-selection",
        help="Export a TSV annotation sheet for choosing categories that should get embeddings",
    )
    selection_parser.add_argument("--taxonomy", type=Path, default=DEFAULT_HOUSEHOLD_CATEGORIES)
    selection_parser.add_argument("--output", type=Path, default=DEFAULT_HOUSEHOLD_EMBEDDING_SELECTION)
    selection_parser.add_argument("--default-include", choices=["pending", "yes", "no"], default="pending")
    selection_parser.add_argument("--preserve-existing", action=argparse.BooleanOptionalAction, default=True)
    selection_parser.set_defaults(func=command_export_embedding_selection)

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
