## ADDED Requirements

### Requirement: Local-only vision model execution
The system SHALL execute learned vision models from local model assets by default and SHALL NOT automatically load remote vision model weights for capture recognition or benchmark runs.

#### Scenario: Local assets are available
- **WHEN** `vendor/vision-manifest.json` lists the required runtime and model assets
- **THEN** the system SHALL load Transformers.js and model files from `vendor/` for detection, segmentation, and embedding stages

#### Scenario: Local assets are missing
- **WHEN** the user starts recognition or a benchmark without required local model assets
- **THEN** the system SHALL report missing local assets and SHALL NOT silently load remote vision model weights

#### Scenario: Development remote mode is explicitly enabled
- **WHEN** a developer explicitly enables remote vision model loading for development
- **THEN** the system SHALL label the provider as remote and SHALL exclude those results from local-model benchmark pass/fail gates

### Requirement: Model asset preflight
The system SHALL provide a preflight check that validates local vision model assets before running real local model recognition or benchmark jobs.

#### Scenario: Manifest is missing
- **WHEN** the preflight cannot find `vendor/vision-manifest.json`
- **THEN** it SHALL fail with instructions to run `python3 scripts/download-vision-assets.py`

#### Scenario: Model files are incomplete
- **WHEN** the manifest lists a model but one or more referenced files are missing or empty
- **THEN** the preflight SHALL list the missing model files and SHALL prevent the benchmark from recording that model as a successful local run

#### Scenario: All requested model assets are valid
- **WHEN** the manifest, runtime files, and requested model files are present
- **THEN** the preflight SHALL return the asset version, model IDs, and provider configurations available for local execution

### Requirement: Provider selection order
The system SHALL prefer local OWL-ViT for subject detection, then local Grounding DINO, then explicit non-model Canvas proposals only when learned local detectors are unavailable or return no candidates.

#### Scenario: OWL-ViT is available
- **WHEN** local OWL-ViT assets are present and recognition starts
- **THEN** the system SHALL attempt OWL-ViT before Grounding DINO

#### Scenario: OWL-ViT fails and Grounding DINO is available
- **WHEN** OWL-ViT cannot load or returns no valid candidates and local Grounding DINO assets are present
- **THEN** the system SHALL attempt Grounding DINO before using Canvas proposals

#### Scenario: Learned detectors are unavailable
- **WHEN** neither local OWL-ViT nor local Grounding DINO can produce candidates
- **THEN** the system SHALL use Canvas proposals only as an explicit non-model fallback provider

### Requirement: Optional local segmentation refinement
The system SHALL optionally refine detected subject boxes with local SlimSAM when the segmentation asset is available and SHALL preserve detector candidates if segmentation fails.

#### Scenario: SlimSAM is available
- **WHEN** a local detector returns candidates and SlimSAM assets are present
- **THEN** the system SHALL attempt segmentation refinement and record segmentation timing and provider metadata

#### Scenario: SlimSAM fails
- **WHEN** segmentation refinement fails for a candidate
- **THEN** the system SHALL keep the original detector box and SHALL record the segmentation failure without failing the entire recognition run

### Requirement: Local embedding naming
The system SHALL name candidates from local crop embeddings only when a local embedding model and compatible index are available.

#### Scenario: CLIP and compatible index are available
- **WHEN** a detected crop is available, local CLIP assets are present, and the index dimension/metric is compatible
- **THEN** the system SHALL compute the crop embedding locally and retrieve top matches from the local index

#### Scenario: Embedding assets are unavailable
- **WHEN** local CLIP assets or a compatible index are unavailable
- **THEN** the system SHALL keep detector label naming or neutral placeholder naming and SHALL NOT claim embedding-based accuracy

#### Scenario: Match is ambiguous
- **WHEN** the best embedding match does not pass threshold or margin checks
- **THEN** the system SHALL keep a neutral placeholder and preserve user correction as the final item name

### Requirement: Runtime diagnostics
The system SHALL expose provider and fallback diagnostics so users and reports can distinguish real local model runs from baselines.

#### Scenario: Real local model returns candidates
- **WHEN** a local learned model produces candidates
- **THEN** each candidate SHALL include provider ID, model ID, asset version, confidence, and timing metadata where available

#### Scenario: Canvas fallback returns candidates
- **WHEN** Canvas proposals are used
- **THEN** candidates SHALL be labeled as non-model fallback and SHALL NOT be counted as learned model detections
