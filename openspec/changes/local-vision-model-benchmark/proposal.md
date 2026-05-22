## Why

The current prototype has local-model code paths, but real execution can silently degrade to remote browser model loading or Canvas heuristics when `vendor/` assets are missing. We need a reproducible local-only model runtime and an evaluation report that measures both accuracy and latency before trusting local detection, segmentation, and embedding-based naming at scale.

## What Changes

- Require the vision capture pipeline to use downloaded local model assets for Grounding DINO, OWL-ViT, SlimSAM, and CLIP; remote vision model loading is disabled unless explicitly configured for development.
- Add a local model asset preflight that verifies `vendor/vision-manifest.json`, model directories, runtime files, and model-to-feature compatibility before benchmark or runtime recognition.
- Add a benchmark runner that executes multiple local model configurations on the real-photo evaluation dataset and records per-image/per-object timings for detection, optional segmentation refinement, crop embedding, index retrieval, and end-to-end naming.
- Generate `vision-model-eval-report` outputs that compare model/provider accuracy and latency side by side, including box IoU recall, name accuracy, combined accuracy, top-1/top-3 category retrieval, p50/p95 latency, failure rate, and fallback counts.
- Keep Canvas region proposals as an explicit non-model fallback baseline in the report, but never label it as Grounding DINO or a learned local model.
- Preserve the current neutral placeholder behavior when local models are unavailable, slow, low-confidence, or ambiguous.

## Capabilities

### New Capabilities

- `local-vision-model-runtime`: Covers local-only model asset validation, provider selection, fallback semantics, and runtime diagnostics for subject detection, segmentation, and embedding.
- `vision-model-benchmark-report`: Covers benchmark dataset inputs, model/provider timing, accuracy metrics, report generation, and go/no-go criteria for local vision models.

### Modified Capabilities

None.

## Impact

- Affected runtime: `app.js` local model loading, provider labels, recognition fallback behavior, and catalog embedding lookup.
- Affected scripts: `scripts/download-vision-assets.py`, `scripts/vision-model-eval.py`, and new or extended benchmark/simulator entrypoints.
- Affected data: `data/vision-model-eval.real.json`, `data/vision-index.real.json`, `data/generated/vision-model-eval-report.*`, and benchmark prediction/timing artifacts.
- Affected local assets: `vendor/transformers`, `vendor/models`, and `vendor/vision-manifest.json` become required for real local model benchmarks.
- Affected validation: script-based simulator checks replace browser inspection; reports must make fallback/non-model baselines visually and structurally distinct from real model runs.
