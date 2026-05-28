# Subject Detection Beta Readiness Report

## Current Recommendation

The current YOLOX v7 model should remain an editable subject-suggestion feature. It is not ready for fully automatic external use because fixed-eval visual review still shows missed key subjects, noisy low-value boxes, and unstable dense-scene coverage.

## Current Runtime Artifact

- Runtime ONNX: `vendor/models/home-memory/yolox-household-subject/model.onnx`
- Source checkpoint: `/tmp/home-memory-yolox-runs/household-subject-dino-assisted-3000-v7/yolox_nano_household_subject_v1.pt`
- Source ONNX: `/tmp/home-memory-yolox-runs/household-subject-dino-assisted-3000-v7/model.onnx`
- App version after post-processing update: `20260528-yolox-household-subject-v7-dynamic-postprocess`

## Fixed Evaluation Baselines

Training-script evaluation, unconstrained prediction count:

| Dataset | Images | GT | Pred | Recall@0.30 | Precision@0.30 | Recall@0.50 | Precision@0.50 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Gold fixed eval | 21 | 105 | 296 | 0.8286 | 0.2939 | 0.6952 | 0.2466 |
| Expanded filtered eval | 124 | 625 | 1774 | 0.7296 | 0.2570 | 0.5616 | 0.1979 |

ONNX app-like evaluation before this change, fixed max-9 output:

| Dataset | Images | GT | Pred | Recall@0.30 | Precision@0.30 | Recall@0.50 | Precision@0.50 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Gold fixed eval | 21 | 105 | 189 | 0.6286 | 0.3492 | 0.5524 | 0.3069 |
| Expanded filtered eval | 124 | 625 | 1116 | 0.5472 | 0.3065 | 0.4368 | 0.2446 |

Visual review artifact:

- `/tmp/home-memory-yolox-runs/visual-eval-v7-gold/gold-v7-gt-vs-pred-contact-sheet.jpg`
- Dynamic post-processing visual check: `/tmp/home-memory-yolox-runs/visual-eval-v7-gold-dynamic-postprocess/gold-v7-dynamic-postprocess-contact-sheet.jpg`

## Data Quality Baseline

- Frozen gold eval: `/tmp/home-memory-yolox-fixed-eval-gold-v1/COCO`
- Expanded filtered eval: `/tmp/home-memory-yolox-fixed-eval-expanded-v1-filtered/COCO`
- DINO-assisted training source: `/tmp/home-memory-yolox-household-scenes-dino-assisted-3000/COCO`
- Home-filtered DINO-assisted training set: `/tmp/home-memory-yolox-household-scenes-dino-assisted-3000-home-filtered/COCO`
- Home-filtered size: 1,794 train images / 16,615 train boxes; 342 val images / 2,802 val boxes.

## Runtime Post-Processing Update

The app now post-processes YOLOX detections with:

- Dynamic output budgets: simple scenes return up to 5 boxes, normal scenes up to 10, dense scenes up to 15.
- Low-value filtering for tiny, huge, extreme-aspect, and very weak boxes.
- Near-duplicate suppression that removes highly overlapping/similar boxes.
- Parent-child retention by avoiding containment-only suppression when the child is meaningfully smaller than the parent, which protects cabinet/drawer/compartment-style hierarchy.

The helper script `scripts/visualize-yolox-postprocess-from-predictions.py` can regenerate the gold visual check from saved prediction JSON.

## Beta Gate

Before treating subject detection as externally ready, the next candidate must:

- Improve or hold Gold and Expanded fixed-eval recall without unacceptable precision loss.
- Pass human visual review on gold and expanded contact sheets.
- Keep gold and expanded eval images excluded from all training data by SHA.
- Keep detector output as editable suggestions.
- Continue resolving final item names only through embedding retrieval.

## Next Training Trigger

Do not retrain just because more data exists. Retrain only after the training-set report/contact sheets show that the next DINO-assisted expansion has household-scene coverage, tight boundaries, reduced store/shelf bias, and no fixed-eval leakage.
