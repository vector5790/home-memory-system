## Context

The app already detects subject boxes locally with Grounding DINO or OWL-ViT, optionally refines with SlimSAM, and names candidates through `data/vision-index.seed.json` when an embedding index exists. Today that index is empty, the catalog has only a few household seed labels, and the runtime falls back to neutral names for most detected subjects.

This change turns the seed catalog into a measured category index. The important constraint is that full gallery inference can be expensive even on local models, so the project must evaluate the current CLIP embedding model on a representative slice before computing embeddings for every planned image.

Research summary:

- GS1 Global Product Classification (GPC) is the best primary taxonomy fit because it is built as a four-level retail/product hierarchy: Segment, Family, Class, and Brick. The GS1 GPC Browser describes the standard as a universal product classification system and exposes published schemas for browsing: https://gpc-browser.gs1.org/
- Google Product Taxonomy is the best auxiliary taxonomy because it is easy to download, has stable category IDs, and currently exposes 5,595 product paths in `taxonomy-with-ids.en-US.txt` with version `2021-09-21`: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
- UNSPSC also has a four-level structure, but it is procurement-oriented and includes many services/non-visual commodities, so it is less suitable as the first visual household object backbone: https://www.commerce.gov/oam/resources/united-nations-standard-products-and-services-codes-unspsc
- Open Images and product-image datasets can help with representative images, but labels rarely align directly to a product taxonomy and licenses vary. The index pipeline must treat image source, license, and split metadata as first-class fields.

## Goals / Non-Goals

**Goals:**

- Define a canonical four-level category model for household visual naming.
- Use GS1 GPC as the primary hierarchy, with Google Product Taxonomy mappings for open category IDs, aliases, and sample search queries where helpful.
- Store leaf categories with Chinese display names, English detector prompts, aliases, and representative sample metadata.
- Build an offline index from representative images by detecting subject boxes, cropping or masking subjects, computing local normalized embeddings, and storing vector plus box and category lineage metadata.
- Add a preflight evaluation gate that estimates retrieval quality before running full-scale inference.
- Keep online naming local-first: subject detection, crop embedding, index retrieval, confidence checks, and fallback to `物品A/B/C` when uncertain.

**Non-Goals:**

- Do not promise exhaustive coverage of every global product category in the first implementation; start with a household subset and keep the schema able to expand.
- Do not make a cloud vision or commercial image-search API required for runtime naming.
- Do not rely on unlicensed scraped images as canonical samples.
- Do not replace the existing detector, segmentation, candidate editing, confirmation, or nested storage flows.
- Do not blindly accept top-1 embedding matches without threshold and ambiguity checks.

## Decisions

1. Use GS1 GPC as the canonical four-level taxonomy.

   The index should model `level1`, `level2`, `level3`, and `level4` as GPC Segment, Family, Class, and Brick. This matches the user's requested 1-4 level hierarchy without inventing a home-grown tree. Each imported leaf gets a stable project ID, source ID, source version, canonical English path, localized Chinese display path, aliases, detector labels, and `active`/`excluded` status.

   Alternative considered: use Google Product Taxonomy as the primary tree. It is easier to fetch and has many consumer product names, but its path depth is variable rather than a strict four-level system. We should still use it as a mapping source for open category IDs and sample query phrases.

2. Keep a household subset separate from the full taxonomy.

   The repository should import or reference the broader taxonomy, then maintain a curated `household` subset for indexing. The subset keeps the local prototype small and lets us prioritize high-frequency household objects: containers, furniture, electronics accessories, tools, medicines, food packages, cleaning supplies, pet supplies, documents, and consumables.

   Alternative considered: build embeddings for every leaf immediately. That increases cost and storage before the embedding model has proven useful on the actual visual task.

3. Treat representative images as a versioned manifest, not as implicit scraped files.

   Each leaf category should have sample records with `sampleId`, `categoryId`, `source`, `sourceUrl`, `license`, `imagePath`, `sha256`, `split`, optional human box, and optional notes. Splits should include `gallery`, `eval`, and `holdout` so evaluation does not test on the same images used in the index.

   Alternative considered: derive samples directly from `searchQueries` at build time. That is convenient, but it makes builds non-reproducible and hides licensing problems.

4. Store detector boxes and embeddings together in a generated index.

   The offline builder should run the same local detector stack used by the app when possible, choose the best subject box for each sample, crop with small padding, compute the local CLIP embedding with normalization, and write entries containing category lineage, source image metadata, box coordinates, crop metadata, embedding model/version, vector dimension, and metric.

   Alternative considered: embed whole sample images only. That works for clean product photos but fails on shelf/container scenes where the online query crop is a detected subject.

5. Use maximum inner product for normalized embeddings.

   The existing code normalizes CLIP feature output and computes cosine similarity. With normalized vectors, the nearest visual match is the maximum inner product. If the implementation exposes a distance, it should minimize `1 - dot`, not minimize raw inner product.

   Alternative considered: leave the current flat cosine scan unchanged without documenting the metric. That risks inverted rankings when the index is rebuilt or replaced by an ANN library.

6. Gate full indexing behind a preflight evaluation report.

   Before a full gallery build, run a small sample such as 50-100 household leaf categories, 10-20 gallery images per leaf, and 5-10 eval images per leaf. The report should include leaf top-1/top-3 accuracy, level-3 parent accuracy, threshold coverage, false accept rate, unknown rejection, score/margin distributions, latency, and confusion pairs. A practical first go/no-go target is leaf top-1 at or above 70%, leaf top-3 at or above 85%, level-3 parent accuracy at or above 90%, and false accepts at or below 5% at the selected threshold.

   Alternative considered: build the full index first and inspect examples manually. That can hide systematic failures until the most expensive work has already completed.

7. Require threshold and margin checks online.

   Online naming should search top-K entries, aggregate by leaf category, and accept a name only when the best leaf passes a calibrated similarity threshold and has a clear margin over the next different leaf. Otherwise the UI keeps the neutral placeholder and preserves user correction.

   Alternative considered: assign the top-1 leaf every time. That gives a cleaner demo but is worse for trust because wrong item names are more expensive than placeholders.

8. Keep the runtime flat scan for small indexes and define a scale path.

   The first generated household subset can keep the current flat cosine search in browser because it is transparent and easy to debug. When the index grows beyond a configurable browser budget, the same index schema should support sharding by level-1/category subset or replacing flat scan with an approximate nearest-neighbor index such as HNSW in a worker or local service.

   Alternative considered: introduce ANN infrastructure immediately. That adds moving parts before the embedding model and category set are validated.

## Risks / Trade-offs

- GS1 taxonomy licensing or schema access may not fit redistribution needs -> Store source/version metadata, keep a project-local subset, and verify license terms before checking in full imported data.
- Product taxonomies do not perfectly match household visual objects -> Add project aliases, detector labels, and local leaf overrides while keeping canonical source IDs.
- Representative image quality can dominate embedding quality -> Track source, split, hash, box, and review status; include hard negatives and cluttered household scenes, not only clean product shots.
- CLIP may confuse visually similar leaves such as chargers, adapters, cables, medicine bottles, and spice jars -> Calibrate thresholds and margins per category family, and keep placeholder fallback for low-margin matches.
- Detector crop errors may be mistaken for embedding failures -> Evaluate embedding-only crops and end-to-end detected crops separately.
- Browser JSON indexes can become large -> Start with a household subset, store generated artifacts separately, and add sharding or ANN only after metrics justify expansion.
- Incorrect names hurt user trust more than unknown placeholders -> Prefer conservative acceptance thresholds and expose user correction as the source of truth.

## Migration Plan

1. Add taxonomy and sample manifest files without changing runtime behavior.
2. Add a preflight evaluation script and report output; run it on a small curated household subset.
3. If the report passes the go/no-go gate, run the generated index builder for the same subset.
4. Point `visionConfig.catalogIndex` to the generated index while keeping the seed index as fallback.
5. Expand categories and sample counts incrementally, re-running the evaluation report for every model or taxonomy version change.
6. Roll back by restoring the seed index path or disabling generated index loading; detection and manual candidate correction continue to work.

## Open Questions

- Which exact GS1 GPC release and redistribution terms should the project pin for the first import?
- Which image sources are acceptable for representative samples in this repo: local user-curated photos, open-license datasets, generated fixtures, or external manifests only?
- Should thresholds be global for the first version or calibrated per level-3 class once enough evaluation data exists?
- What browser index size should trigger sharding or a local ANN service?
