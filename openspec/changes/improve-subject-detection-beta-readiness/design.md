## Context

The project now has a YOLOX household subject detector trained with DINO-assisted large-scene data. Quantitative evaluation improved over v4, but visual inspection still shows beta blockers: noisy fixed top-k output, duplicated boxes, product-ad text/background boxes, insufficient handling of dense cabinet/drawer scenes, and domain bias in the training set.

The current product rule remains: detector boxes identify subjects only; item names must be resolved later through embedding retrieval. The current project phase is testing, so no recognition-result caching should be introduced.

## Goals / Non-Goals

**Goals:**
- Make subject detection good enough for beta use as editable subject suggestions.
- Improve app-side post-processing without requiring a model retrain for every tuning change.
- Keep training data expansion grounded in the gold 21-image annotation standard and DINO-assisted boundary checks.
- Maintain fixed gold and expanded evaluation sets with no training leakage.
- Produce visual review artifacts for model/data decisions.

**Non-Goals:**
- Guarantee fully automatic, user-confirmation-free subject detection.
- Use detector labels as final item names.
- Introduce recognition-result caching during testing.
- Replace the mobile YOLOX model with a heavy DINO-like model at runtime.

## Decisions

1. **Use YOLOX for runtime detection and DINO for offline data QA**

   YOLOX remains the mobile runtime detector because it is fast and already integrated. GroundingDINO-style models are used offline to refine or validate specific subject boundaries using targeted prompts such as cabinet, drawer, television, amplifier, rice cooker, and power adapter.

2. **Post-process detections by scene complexity instead of fixed top-k**

   The app should derive an output budget from the raw detection distribution and image complexity. Simple product-like images should return fewer boxes. Dense household scenes should allow more boxes, especially storage parent-child structures.

3. **Separate suppression from storage hierarchy**

   Duplicate/low-value boxes should be suppressed, but parent-child storage boxes should be retained when the child is a drawer, compartment, cabinet door, shelf bay, or storage box candidate. This avoids losing location hierarchy.

4. **Train only from non-eval strong/candidate data**

   Gold and expanded fixed-eval images must remain excluded by SHA checks. DINO-assisted training data must be tiered by quality: DINO-refined, DINO-added, OpenImages-kept, and rejected/filtered.

5. **Beta release requires both metrics and visual review**

   A model is beta-ready only when fixed metrics improve without obvious visual regressions on gold and expanded contact sheets. The product surface must present the output as editable suggestions.

## Risks / Trade-offs

- **Risk: DINO-assisted data adds false positives** → Keep DINO additions high-confidence, retain decision JSON, and review contact sheets before training/deploying.
- **Risk: Dynamic output budgets increase user-visible clutter** → Cap simple scenes tightly and use stronger duplicate/background suppression before increasing dense-scene budgets.
- **Risk: Training set domain bias from OpenImages shelves/stores** → Filter shelf/bookcase-dominant candidates unless paired with household anchors; keep per-label distribution reports.
- **Risk: Metrics improve while visual quality regresses** → Require gold and expanded visual contact sheets for deployment decisions.
