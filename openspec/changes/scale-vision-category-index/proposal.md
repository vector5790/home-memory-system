## Why

The current vision naming path only has a tiny seed catalog and an empty flat embedding index, so subject boxes often fall back to neutral names even when local detection works. Before expanding to thousands of representative object images, the project needs an industrial category backbone and a small, measurable evaluation gate for the local embedding model so large offline inference does not waste time on a weak representation.

## What Changes

- Add a hierarchical vision category index capability that represents objects with a four-level industrial taxonomy, localized display names, aliases, and representative image samples per leaf category.
- Adopt an external product taxonomy as the canonical category source for import, filtering, and future updates, with a project-specific household subset for the prototype.
- Add an offline pipeline for collecting or registering representative leaf images, running local subject detection, cropping subject boxes, computing local embeddings, and writing a searchable index that includes embedding vectors, crop/source image metadata, subject box coordinates, and category lineage.
- Add a preflight evaluation workflow that samples categories and images before full-scale indexing, reports retrieval quality, threshold curves, confusion cases, and go/no-go criteria for the current local embedding model.
- Update online candidate naming so detected subject crops are embedded locally, searched against the generated index, and resolved to the nearest leaf category when confidence and ambiguity checks pass.
- Keep the existing neutral placeholder behavior when the index is absent, low-confidence, or ambiguous.

## Capabilities

### New Capabilities

- `vision-category-index`: Covers hierarchical product categories, representative image indexing, embedding search, preflight evaluation, and online leaf-category naming.

### Modified Capabilities

None.

## Impact

- Affected data: `data/vision-catalog.seed.json`, `data/vision-index.seed.json`, and new generated taxonomy/index/evaluation artifacts under `data/` or a generated asset directory.
- Affected scripts: new taxonomy import, representative image manifest, embedding/index build, and evaluation scripts.
- Affected UI/runtime: `app.js` candidate naming and confidence metadata; the detection, review, confirmation, and placeholder flows remain intact.
- Affected local assets: the existing local CLIP/embedding model remains the default evaluator and index builder, with room to swap embedding providers after evaluation.
- Affected validation: OpenSpec validation plus offline retrieval metrics before any full gallery inference run.
