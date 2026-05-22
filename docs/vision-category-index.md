# Vision Category Index

This change turns the tiny seed object catalog into a measured, reproducible category index for local visual naming.

## Category Records

Each normalized category record uses a four-level lineage based on the GS1 GPC shape:

- `lineage.level1`: Segment-level product area.
- `lineage.level2`: Family-level grouping.
- `lineage.level3`: Class-level grouping used for parent accuracy and sibling hard negatives.
- `lineage.level4`: Leaf category used as the item name candidate.

Required provenance and runtime fields:

- `source`, `sourceVersion`, `sourceId`: where the canonical category came from.
- `id`: stable project leaf id.
- `displayPath`, `displayName`: localized UI path and leaf name.
- `aliases`: Chinese or English names users and datasets may use.
- `detectorLabels`: English open-vocabulary detector prompts.
- `searchQueries`: terms for collecting representative samples.
- `googleProductTaxonomy`: optional auxiliary mapping for open IDs and search terms.
- `appCategory`: one of the app's inventory categories.
- `active`: whether the leaf can be indexed.
- `exclusionReason`: required when an inactive category is deliberately excluded.

## Representative Images

Representative samples live in a manifest rather than being discovered implicitly at build time. Every sample must include:

- `id`, `categoryId`, `sourceType`, `sourceUrl` or `imagePath`.
- `license` metadata and a `sha256` content hash.
- `split`: `gallery`, `eval`, or `holdout`.
- `reviewStatus`: `reviewed`, `pending`, or `rejected`.
- Optional `humanBox` in image-relative percentages.

Use `gallery` samples to build the searchable index. Use `eval` samples only for the preflight report. Keep `holdout` for later model comparisons. Add sibling categories in the same level-3 class when possible so cables, chargers, batteries, medicine boxes, and similar small objects are tested against hard negatives instead of only easy global categories.

## Evaluation Gate

Run preflight evaluation before full gallery inference. The report tracks leaf top-1/top-3 accuracy, level-3 parent accuracy, threshold coverage, false accepts, unknown rejection, score and margin distributions, latency, and confusion pairs.

The full index builder refuses to run unless the latest evaluation report passes, unless `--force` is provided. Forced builds are marked `productionReady: false` in the index metadata.

## Retrieval Metric

The runtime and offline tools use normalized vectors. The nearest indexed item is the maximum inner product match, equivalent to the minimum `1 - innerProduct` distance. Do not minimize the raw inner product.
