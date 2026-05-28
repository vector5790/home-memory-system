#!/usr/bin/env python3
"""Download local Transformers.js assets used by the Home Memory prototype."""

from __future__ import annotations

import json
import time
import sys
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VENDOR = ROOT / "vendor"
VERSION = "20260519-grounded-sam"
TRANSFORMERS_VERSION = "3.7.2"
TRANSFORMERS_URL = (
    f"https://cdn.jsdelivr.net/npm/@huggingface/transformers@{TRANSFORMERS_VERSION}"
    "/dist/transformers.min.js"
)
RUNTIME_ASSETS = [
    "ort-wasm-simd-threaded.jsep.mjs",
    "ort-wasm-simd-threaded.jsep.wasm",
]
MODELS = [
    "onnx-community/grounding-dino-tiny-ONNX",
    "Xenova/owlvit-base-patch32",
    "Xenova/slimsam-77-uniform",
    "Xenova/clip-vit-base-patch32",
    "Xenova/siglip-base-patch16-224",
]
OPTIONAL_MODELS = {
    "siglip2": "onnx-community/siglip2-base-patch16-224-ONNX",
}
RETRY_COUNT = 3
RETRY_DELAY_SECONDS = 2


def with_retries(label: str, operation):
    last_error = None
    for attempt in range(1, RETRY_COUNT + 1):
        try:
            return operation()
        except Exception as error:
            last_error = error
            if attempt == RETRY_COUNT:
                break
            print(f"retry {attempt}/{RETRY_COUNT - 1} {label}: {error}", flush=True)
            time.sleep(RETRY_DELAY_SECONDS * attempt)
    raise last_error


def fetch_json(url: str) -> object:
    def operation():
        with urllib.request.urlopen(url, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    return with_retries(url, operation)


def download(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and destination.stat().st_size > 0:
        print(f"skip {destination.relative_to(ROOT)}", flush=True)
        return
    print(f"get  {destination.relative_to(ROOT)}", flush=True)

    def operation():
        request = urllib.request.Request(url, headers={"user-agent": "home-memory-system/0.1"})
        with urllib.request.urlopen(request, timeout=180) as response:
            destination.write_bytes(response.read())

    with_retries(str(destination.relative_to(ROOT)), operation)


def list_model_files(repo_id: str) -> list[str]:
    tree_url = f"https://huggingface.co/api/models/{repo_id}/tree/main?recursive=1"
    try:
        tree = fetch_json(tree_url)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Unable to list {repo_id}: HTTP {error.code}") from error

    paths = [entry.get("path", "") for entry in tree if entry.get("type") == "file"]
    metadata = [
        path for path in paths
        if path.endswith((".json", ".txt", ".model"))
        and not path.startswith(("resolve/", "refs/"))
    ]
    onnx = [path for path in paths if path.startswith("onnx/") and path.endswith((".onnx", ".onnx_data"))]
    quantized = [path for path in onnx if "quantized" in path]
    return sorted(set(metadata + (quantized or onnx)))


def download_model(repo_id: str) -> list[str]:
    downloaded: list[str] = []
    for path in list_model_files(repo_id):
        url = f"https://huggingface.co/{repo_id}/resolve/main/{path}"
        target = VENDOR / "models" / repo_id / path
        download(url, target)
        downloaded.append(str(target.relative_to(VENDOR / "models")))
    return downloaded


def main() -> int:
    try:
        requested_optional = {
            item.strip().lower()
            for item in (sys.argv[1:] or [])
            if item.strip()
        }
        # Keep the default package small. Optional A/B models are downloaded only
        # when requested, e.g. `VISION_OPTIONAL_MODELS=siglip python3 scripts/download-vision-assets.py`.
        import os
        env_optional = {
            item.strip().lower()
            for item in os.environ.get("VISION_OPTIONAL_MODELS", "").split(",")
            if item.strip()
        }
        optional_models = [
            model
            for key, model in OPTIONAL_MODELS.items()
            if key in requested_optional or key in env_optional or model.lower() in requested_optional or model.lower() in env_optional
        ]
        model_ids = MODELS + [model for model in optional_models if model not in MODELS]
        download(TRANSFORMERS_URL, VENDOR / "transformers" / "transformers.min.js")
        for filename in RUNTIME_ASSETS:
            download(
                f"https://cdn.jsdelivr.net/npm/@huggingface/transformers@{TRANSFORMERS_VERSION}/dist/{filename}",
                VENDOR / "transformers" / filename,
            )
        files_by_model = {model: download_model(model) for model in model_ids}
    except Exception as error:
        print(f"download failed: {error}", file=sys.stderr)
        return 1

    manifest = {
      "version": VERSION,
      "transformers": TRANSFORMERS_VERSION,
      "runtimeAssets": RUNTIME_ASSETS,
      "models": model_ids,
      "files": files_by_model,
    }
    manifest_path = VENDOR / "vision-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {manifest_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
