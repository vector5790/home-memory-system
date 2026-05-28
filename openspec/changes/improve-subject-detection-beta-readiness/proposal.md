## Why

Household subject detection has improved with YOLOX v7 and DINO-assisted training data, but visual review still shows noisy boxes, repeated detections, fixed output limits, and uneven training data quality. This change defines and implements the remaining work needed to make subject detection suitable for beta use: reliable post-processing, higher-quality non-eval training data, and explicit evaluation gates.

## What Changes

- Add beta-readiness requirements for household subject detection quality, including fixed gold evaluation, expanded candidate evaluation, and visual review outputs.
- Improve post-processing so detector output is not a fixed “top 9” list: use dynamic output limits, duplicate suppression, low-value box filtering, and storage-aware parent-child retention.
- Establish DINO-assisted training data generation as the required path for expanding non-eval real household scene training data.
- Track training data quality tiers separately from gold/candidate evaluation data and enforce no train/eval image leakage.
- Keep the product behavior as “automatic subject suggestions requiring user confirmation” until metrics and visual checks meet beta gates.

## Capabilities

### New Capabilities
- `subject-detection-beta-readiness`: Requirements for household subject detection post-processing, DINO-assisted training data quality, fixed evaluation gates, and beta release criteria.

### Modified Capabilities

## Impact

- Affected frontend detection pipeline: `app.js`
- Affected model/data scripts: YOLOX evaluation, OpenImages candidate generation, DINO-assisted training data generation, fixed-eval review scripts
- Affected model artifact: `vendor/models/home-memory/yolox-household-subject/model.onnx`
- No item naming behavior changes: final item names must still come from embedding retrieval, not detector labels.
