## 1. Local Model Runtime

- [x] 1.1 Add a reusable local vision asset preflight that validates `vendor/vision-manifest.json`, Transformers.js runtime files, and requested model files.
- [x] 1.2 Update runtime model loading so remote vision model weights are disabled by default and only available behind an explicit development flag.
- [x] 1.3 Ensure provider selection tries local OWL-ViT before local Grounding DINO, then uses Canvas proposals only as a non-model fallback.
- [x] 1.4 Add provider metadata fields for model ID, asset version, provider class, fallback reason, and stage timing.
- [x] 1.5 Ensure local CLIP crop embedding naming only runs when CLIP assets and index dimensions/metrics are compatible.

## 2. Benchmark Runner

- [x] 2.1 Extend `scripts/vision-model-eval.py` or add a companion benchmark command that accepts dataset, index, provider matrix, output paths, and timing options.
- [x] 2.2 Implement provider runners for local Grounding DINO, local OWL-ViT, optional SlimSAM refinement, local CLIP naming, and Canvas fallback baseline.
- [x] 2.3 Add model warmup/load timing and per-image stage timing for detection, segmentation, crop preparation, embedding, retrieval, naming, and end-to-end execution.
- [x] 2.4 Write raw benchmark prediction artifacts with provider metadata, timing traces, failures, top index matches, and skipped-provider reasons.
- [x] 2.5 Keep GT-assisted predictions as a report-harness validation fixture but exclude them from real local model pass/fail summaries.

## 3. Report Metrics

- [x] 3.1 Extend evaluation summary to group box recall, name accuracy, category accuracy, combined accuracy, top-1/top-3 retrieval, extra predictions, and failure counts by provider.
- [x] 3.2 Add latency summaries per provider and stage, including p50, p95, mean, max, and sample count.
- [x] 3.3 Add explicit provider classification labels for real local model, Canvas baseline, GT-assisted fixture, remote/development, skipped, and failed.
- [x] 3.4 Add go/no-go gate calculation with configurable accuracy, latency, failure-rate, and minimum dataset thresholds.
- [x] 3.5 Update JSON, Markdown, and HTML reports to show provider comparison tables plus per-image details with query image and Top3 matched index images.

## 4. Validation and Documentation

- [x] 4.1 Add script-level simulator tests or sanity checks for missing assets, skipped providers, Canvas baseline labeling, and timing aggregation.
- [x] 4.2 Run the benchmark on the real-photo dataset with available local assets and generate `data/generated/vision-model-eval-report.*`.
- [x] 4.3 Verify reports distinguish real model results from GT-assisted and Canvas baseline outputs.
- [x] 4.4 Update README with local asset setup, benchmark commands, output artifacts, and interpretation guidance.
- [x] 4.5 Run `node --check app.js`, Python compile checks, category validation, and model evaluation report generation without browser inspection.
