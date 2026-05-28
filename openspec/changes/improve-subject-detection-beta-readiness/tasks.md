## 1. Baselines And Tracking
- [x] 1.1 Record current v7 model artifact, fixed gold metrics, expanded-eval metrics, and visual review artifact paths.
- [x] 1.2 Freeze the 21-image human-confirmed gold eval set separately from expanded candidate eval data.
- [x] 1.3 Add a concise beta-readiness report that compares current metrics, visual risks, and deployment recommendation.

## 2. Runtime Post-Processing
- [x] 2.1 Replace fixed YOLOX top-k output with a dynamic output budget based on scene complexity.
- [x] 2.2 Add low-value box filtering for tiny, huge, thin, and weak duplicate detections.
- [x] 2.3 Preserve useful parent-child storage detections while suppressing near-duplicate boxes.
- [x] 2.4 Verify app checks and run fixed-eval visual comparison with the updated post-processor.

## 3. Training Data Quality
- [x] 3.1 Build the large OpenImages household candidate pool for non-eval training data.
- [x] 3.2 Generate DINO-assisted annotations with quality tiers.
- [x] 3.3 Filter shelf/store-dominant scenes from the DINO-assisted training set.
- [ ] 3.4 Add repeatable data quality reports/contact sheets for future DINO-assisted data expansion.

## 4. Beta Readiness
- [x] 4.1 Keep runtime behavior positioned as editable subject suggestions until beta gates pass.
- [x] 4.2 Document model rollback paths and current deployed ONNX artifact.
- [ ] 4.3 Re-run training only after post-processing and data quality reports show the next training set is worth using.
