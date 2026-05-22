## ADDED Requirements

### Requirement: Four-level category taxonomy
The system SHALL represent visual item categories with a canonical four-level hierarchy and stable leaf identifiers.

#### Scenario: Import canonical taxonomy
- **WHEN** the taxonomy import runs for a supported external taxonomy source
- **THEN** the system SHALL produce category records with source name, source version, source category id, level-1 name, level-2 name, level-3 name, level-4 leaf name, project category id, localized display path, aliases, detector labels, and active status

#### Scenario: Taxonomy path is incomplete
- **WHEN** an imported taxonomy path cannot be normalized into the required four levels
- **THEN** the system SHALL either map it through an explicit project override or mark it inactive with a reason instead of silently creating an ambiguous leaf

### Requirement: Household category subset
The system SHALL maintain an indexable household subset separate from the full imported taxonomy.

#### Scenario: Build household subset
- **WHEN** the category subset builder runs
- **THEN** the system SHALL include only active leaf categories selected for household visual recognition and SHALL preserve references to their canonical taxonomy source ids

#### Scenario: Category is excluded
- **WHEN** a category is excluded from the household subset
- **THEN** the system SHALL record the exclusion reason so future imports do not accidentally re-enable it

### Requirement: Representative image manifest
The system SHALL describe representative category images through a reproducible manifest before they are used for embedding inference.

#### Scenario: Register representative sample
- **WHEN** a representative image is added for a leaf category
- **THEN** the system SHALL store sample id, category id, source type, source URL or local path, license metadata, image path, content hash, split, and review status

#### Scenario: Split samples for evaluation
- **WHEN** representative images are prepared for a category
- **THEN** the system SHALL separate gallery, evaluation, and holdout samples so evaluation images are not used as gallery index entries

#### Scenario: Sample lacks required provenance
- **WHEN** a sample does not include required source, license, or hash metadata
- **THEN** the system SHALL exclude that sample from index building and report the validation error

### Requirement: Offline subject embedding index
The system SHALL build an offline embedding index from representative image samples and detected subject regions.

#### Scenario: Build gallery index entry
- **WHEN** the index builder processes an accepted gallery sample
- **THEN** the system SHALL detect or load the subject box, crop or mask the subject region, compute a normalized embedding with the configured local model, and write an index entry containing embedding vector, vector dimension, embedding model id, metric, category id, category path, sample id, source image path, subject box, crop metadata, and build version

#### Scenario: Subject detection fails during index build
- **WHEN** the builder cannot obtain a valid subject box for a sample
- **THEN** the system SHALL skip the sample, record the failure reason, and continue processing other samples without writing a misleading full-image entry

#### Scenario: Index metric is cosine-like
- **WHEN** embeddings are normalized before indexing
- **THEN** the system SHALL rank matches by maximum inner product or equivalently minimum `1 - innerProduct` distance

### Requirement: Preflight embedding evaluation
The system SHALL evaluate the current local embedding model on a representative sample before full-scale gallery inference.

#### Scenario: Run preflight evaluation
- **WHEN** the evaluation command runs for a category subset
- **THEN** the system SHALL build a temporary gallery from gallery samples, query held-out evaluation samples, and report leaf top-1 accuracy, leaf top-3 accuracy, level-3 parent accuracy, threshold coverage, false accept rate, unknown rejection rate, score distribution, margin distribution, latency, and confusion pairs

#### Scenario: Evaluation does not meet quality gate
- **WHEN** the evaluation report fails the configured go/no-go thresholds
- **THEN** the system SHALL block the default full index build and SHALL surface the failing metrics and most confused category pairs

#### Scenario: Full build is intentionally forced
- **WHEN** a user explicitly forces a full index build despite a failed or missing evaluation report
- **THEN** the system SHALL mark the generated index as forced and non-production in its metadata

### Requirement: Online category retrieval naming
The system SHALL resolve detected subject candidates to leaf category names by embedding-searching the generated index when the index is available.

#### Scenario: Candidate matches category index
- **WHEN** a detected subject crop is embedded locally and the generated index returns a top leaf whose score and margin pass the configured thresholds
- **THEN** the system SHALL name the candidate with the leaf display name and attach category id, category path, score, margin, matched sample ids, and index version to the candidate metadata

#### Scenario: Candidate match is ambiguous
- **WHEN** the best indexed leaf does not pass the configured score threshold or margin threshold
- **THEN** the system SHALL keep a neutral placeholder name and SHALL NOT overwrite user-edited candidate metadata

#### Scenario: Generated index is unavailable
- **WHEN** the generated category index cannot load or contains no valid entries
- **THEN** the system SHALL keep the existing seed-index or placeholder fallback behavior without mutating confirmed inventory

### Requirement: Index versioning and traceability
The system SHALL make taxonomy, samples, embedding model, and evaluation provenance traceable from every generated index.

#### Scenario: Generated index is written
- **WHEN** the index builder writes an index file
- **THEN** the system SHALL include taxonomy source/version, sample manifest version, embedding model id, embedding dimension, metric, build timestamp, evaluation report id, threshold configuration, and entry count

#### Scenario: Runtime loads an index
- **WHEN** the app loads a generated index
- **THEN** the system SHALL ignore entries whose embedding dimension or metric does not match the runtime search configuration and SHALL expose a non-fatal warning for diagnostics
