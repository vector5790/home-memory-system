## 1. Taxonomy Data Model

- [x] 1.1 Define generated taxonomy, household subset, sample manifest, evaluation report, and index JSON schemas.
- [x] 1.2 Add seed schema fixtures under `data/` for one small household category slice.
- [x] 1.3 Document required category fields, source/version metadata, four-level lineage, localized names, aliases, detector labels, and active/excluded status.

## 2. Taxonomy Import and Subset

- [x] 2.1 Add a taxonomy import script that normalizes GS1 GPC-style four-level records into the project category schema.
- [x] 2.2 Add a Google Product Taxonomy mapping path for aliases, source ids, and sample query hints where mappings are available.
- [x] 2.3 Add household subset selection and exclusion metadata so only active household leaves are indexable.
- [x] 2.4 Add validation that rejects incomplete, duplicate, or ambiguous leaf category records.

## 3. Representative Image Manifest

- [x] 3.1 Add a manifest format for representative images with source, license, URL/path, hash, split, review status, and optional human box metadata.
- [x] 3.2 Add a manifest validation script that excludes samples missing provenance, hash, category id, or split.
- [x] 3.3 Seed a small reviewed sample manifest for high-frequency household leaves that can run quickly on local hardware.
- [x] 3.4 Add guidance for gallery/eval/holdout splits and hard-negative sibling categories.

## 4. Embedding and Index Builder

- [x] 4.1 Add a shared local embedding utility that uses the configured CLIP model and records model id, vector dimension, normalization, and metric.
- [x] 4.2 Add an offline builder that loads gallery samples, obtains subject boxes from human metadata or local detection, crops with padding, embeds crops, and writes index entries.
- [x] 4.3 Ensure builder failures skip only the affected sample and write a structured failure summary.
- [x] 4.4 Add generated index metadata for taxonomy version, sample manifest version, embedding model, metric, thresholds, build timestamp, and entry count.

## 5. Preflight Evaluation

- [x] 5.1 Add a preflight evaluation command that builds a temporary gallery and queries held-out eval samples.
- [x] 5.2 Report leaf top-1, leaf top-3, level-3 parent accuracy, coverage, false accept rate, unknown rejection, score/margin distributions, latency, and confusion pairs.
- [x] 5.3 Add configurable go/no-go thresholds and make the default full builder refuse to run when the latest evaluation fails or is missing.
- [x] 5.4 Add an explicit force option that marks generated indexes as non-production when bypassing the quality gate.

## 6. Runtime Retrieval Integration

- [x] 6.1 Update runtime index loading to accept generated category-index metadata while preserving seed-index fallback.
- [x] 6.2 Change candidate naming to embed detected subject crops, rank index entries by maximum normalized inner product, aggregate top-K results by leaf category, and compute score margin.
- [x] 6.3 Accept a category name only when score and margin thresholds pass; otherwise keep neutral placeholders and user edits.
- [x] 6.4 Attach category id, category path, score, margin, matched sample ids, and index version to resolved candidate metadata.
- [x] 6.5 Ignore index entries with mismatched dimension or metric and surface a non-fatal diagnostic warning.

## 7. Validation

- [x] 7.1 Run schema and manifest validation on the seeded household slice.
- [x] 7.2 Run preflight evaluation on the seeded slice and inspect the report for expected pass/fail behavior.
- [x] 7.3 Build a generated index from the seeded slice and verify the runtime can load it.
- [x] 7.4 Test online capture naming with index-present, ambiguous, and index-missing cases.
- [x] 7.5 Run OpenSpec validation for `scale-vision-category-index`.
