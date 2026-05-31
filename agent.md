# Agent Rules

- The project is currently in testing. Do not use recognition-result caching for image detection or naming tests; every scan must run the real current model and embedding pipeline.
- Item names must come from embedding retrieval against the category index. Do not add hardcoded Chinese name mappings or use detector labels as final item names.
- Each detected subject must run embedding-based naming, and subject naming should execute concurrently rather than serially.
- Storage structures are first-class detection targets: whole cabinets, storage boxes, drawers, cabinet doors, and compartments should be detected as boxes. The detector should support parent-child storage hierarchy so a large cabinet can contain individual drawers/cabinets, which can later contain detailed item photos and inventory locations such as living room -> large cabinet A -> drawer B.
- Subject detector training, fixed-eval curation, and dataset-building workflows live in the separate `yolox-train` repository. This repository only consumes the final runtime detector artifact under `vendor/models/home-memory/yolox-household-subject/model.onnx` and keeps the app-side loading, post-processing, packaging, and naming pipeline aligned with that artifact.
