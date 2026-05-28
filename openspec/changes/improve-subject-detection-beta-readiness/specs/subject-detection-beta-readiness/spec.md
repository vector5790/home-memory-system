## ADDED Requirements

### Requirement: Runtime Detection Produces Editable Suggestions
The system SHALL present household subject detections as editable suggestions until beta readiness gates explicitly allow stronger automation.

#### Scenario: User scans a household scene
- **WHEN** the user uploads or captures an image for subject detection
- **THEN** the system returns suggested subject boxes that can be reviewed, deleted, or corrected by the user

#### Scenario: Detector labels are available internally
- **WHEN** a detector or offline model provides class or prompt labels
- **THEN** the system MUST NOT use those labels as final item names; final item names MUST come from embedding retrieval

### Requirement: Dynamic Post-Processing Controls Visual Clutter
The system SHALL post-process raw subject detections using image-aware output budgets, duplicate suppression, low-value box filtering, and storage-aware retention.

#### Scenario: Simple product-like image
- **WHEN** raw detections come from a simple image with few strong subject candidates
- **THEN** the system returns a small number of high-quality boxes instead of filling the maximum output count

#### Scenario: Dense household scene
- **WHEN** raw detections come from a dense scene containing many useful household subjects
- **THEN** the system may return more boxes than a simple scene while still suppressing duplicates and low-value background boxes

#### Scenario: Parent-child storage boxes
- **WHEN** a large storage structure contains visible drawers, cabinet doors, shelf bays, or compartments
- **THEN** the post-processor SHALL preserve useful parent-child boxes rather than treating all contained boxes as duplicates

### Requirement: Fixed Evaluation Sets Are Protected
The system SHALL keep human-confirmed gold evaluation data and candidate expanded evaluation data separate from training data.

#### Scenario: Training dataset is built
- **WHEN** a YOLOX training dataset is generated
- **THEN** it MUST exclude images whose SHA256 hashes match the gold or expanded fixed evaluation sets

#### Scenario: Training completes
- **WHEN** YOLOX training completes
- **THEN** fixed evaluation metrics MUST be generated against the frozen gold evaluation set

### Requirement: Training Data Uses DINO-Assisted Quality Tiers
The system SHALL track DINO-assisted training annotations by quality tier and preserve review artifacts for auditability.

#### Scenario: DINO refines an existing candidate box
- **WHEN** a DINO targeted prompt box sufficiently overlaps a candidate source box and passes confidence and area checks
- **THEN** the generated annotation records the quality tier as DINO-refined

#### Scenario: DINO adds a high-confidence subject
- **WHEN** DINO finds a high-confidence subject that does not duplicate an existing candidate box
- **THEN** the generated annotation records the quality tier as DINO-added

#### Scenario: Candidate source box is retained
- **WHEN** DINO does not provide a suitable replacement for a candidate source box
- **THEN** the generated annotation records that the source box was kept

### Requirement: Beta Model Deployment Requires Metrics And Visual Review
The system SHALL deploy a new subject detector only after comparing metrics and visual artifacts against the current model.

#### Scenario: Candidate model improves metrics
- **WHEN** a candidate model improves gold and expanded fixed-eval metrics
- **THEN** the candidate still requires visual review of prediction-vs-ground-truth contact sheets before being considered beta-ready

#### Scenario: Candidate model regresses user-visible quality
- **WHEN** visual review shows excessive clutter, large background boxes, or key subject misses
- **THEN** the candidate MUST NOT be treated as ready for fully automatic external use
