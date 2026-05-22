## ADDED Requirements

### Requirement: Benchmark model matrix
The system SHALL run a configurable benchmark matrix over local vision provider configurations and SHALL include non-model baselines only when they are clearly labeled.

#### Scenario: Benchmark includes learned local providers
- **WHEN** benchmark assets are valid
- **THEN** the benchmark SHALL run available local provider configurations such as Grounding DINO, OWL-ViT, Grounding DINO plus SlimSAM, OWL-ViT plus SlimSAM, and CLIP-based naming where supported

#### Scenario: Benchmark includes Canvas baseline
- **WHEN** Canvas proposals are included in a benchmark
- **THEN** the report SHALL label that provider as a non-model baseline and SHALL exclude it from learned-model pass/fail gates

#### Scenario: Provider asset is missing
- **WHEN** a configured provider lacks required local assets
- **THEN** the benchmark SHALL mark that provider as skipped with a setup reason instead of silently substituting another model

### Requirement: Benchmark prediction artifacts
The system SHALL write raw benchmark prediction artifacts that preserve per-image predictions, boxes, names, top index matches, provider metadata, and timing traces.

#### Scenario: Provider predicts an object
- **WHEN** a benchmark provider returns a candidate for an evaluation image
- **THEN** the prediction artifact SHALL include image ID, prediction ID, box, name, category ID, confidence, provider ID, model IDs, and timing fields

#### Scenario: Provider computes index matches
- **WHEN** a benchmark provider computes local embedding retrieval for a crop
- **THEN** the prediction artifact SHALL include the top index matches, scores, category IDs, source image paths, and index version

#### Scenario: Provider fails on an image
- **WHEN** a benchmark provider fails for a specific image
- **THEN** the prediction artifact SHALL include the failure reason and elapsed time without aborting all other providers

### Requirement: Accuracy metrics
The system SHALL compute accuracy metrics per provider and per stage from benchmark predictions and ground truth.

#### Scenario: Detection boxes are evaluated
- **WHEN** predictions and GT boxes exist for an image
- **THEN** the report SHALL compute IoU, box recall at the configured IoU threshold, and unmatched/extra prediction counts per provider

#### Scenario: Names are evaluated
- **WHEN** predictions include names or category IDs
- **THEN** the report SHALL compute name accuracy, category ID accuracy, and combined box-plus-name accuracy per provider

#### Scenario: Retrieval is evaluated
- **WHEN** predictions include top index matches
- **THEN** the report SHALL compute top-1 and top-3 category retrieval accuracy per provider

#### Scenario: Unknown rejection is evaluated
- **WHEN** a provider rejects a low-confidence or ambiguous match
- **THEN** the report SHALL count the rejection separately from wrong-name false accepts

### Requirement: Latency metrics
The system SHALL compute latency metrics per provider and per stage from benchmark timing traces.

#### Scenario: Stage timing is available
- **WHEN** predictions include timing for detection, segmentation, embedding, retrieval, naming, and end-to-end execution
- **THEN** the report SHALL summarize p50, p95, mean, max, and sample count for each stage per provider

#### Scenario: Model warmup is measured
- **WHEN** a provider loads or warms up a model
- **THEN** the report SHALL record warmup/load time separately from per-image inference latency

#### Scenario: Timing is missing
- **WHEN** a provider omits timing for a stage
- **THEN** the report SHALL mark that stage as unavailable instead of treating it as zero latency

### Requirement: Combined vision model evaluation report
The system SHALL generate `vision-model-eval-report` outputs that compare local model providers by accuracy, latency, failures, and fallback behavior.

#### Scenario: Report is generated
- **WHEN** benchmark evaluation completes
- **THEN** the system SHALL write JSON, Markdown, and HTML reports with provider comparison summaries and per-image case details

#### Scenario: Report shows query and matched index images
- **WHEN** a prediction includes top index matches
- **THEN** the HTML and Markdown reports SHALL show or reference the query image and the top three matched local index images

#### Scenario: Report distinguishes real model and baseline runs
- **WHEN** a provider is GT-assisted, Canvas fallback, skipped, remote, or real local model
- **THEN** the report SHALL display that classification prominently and SHALL NOT mix those classes in learned-model accuracy summaries

### Requirement: Benchmark go/no-go status
The system SHALL derive an explicit go/no-go status for each real local provider using configured accuracy and latency gates.

#### Scenario: Provider passes gates
- **WHEN** a real local provider meets configured accuracy, latency, and failure-rate thresholds
- **THEN** the report SHALL mark that provider as eligible for broader local indexing or runtime use

#### Scenario: Provider fails gates
- **WHEN** a real local provider fails one or more configured thresholds
- **THEN** the report SHALL list the failed gates and SHALL recommend keeping placeholder naming or fallback behavior for that provider

#### Scenario: Dataset is too small
- **WHEN** the benchmark dataset has fewer than the configured minimum images or categories
- **THEN** the report SHALL mark go/no-go status as provisional rather than definitive
