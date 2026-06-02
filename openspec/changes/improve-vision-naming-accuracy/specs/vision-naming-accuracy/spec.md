## ADDED Requirements

### Requirement: Naming diagnostics per subject

The system SHALL record a diagnostic record for each detected subject that is sent through item naming.

#### Scenario: Subject naming is completed
- **WHEN** a detected subject receives a final name or candidate-only result
- **THEN** the system records subject id, source image id, detection provider, subject box, crop metadata, embedding model, index version, TopK matches, Top3 display candidates, score, margin, acceptance policy, final name, and rejection reason when present

#### Scenario: Subject is not nameable
- **WHEN** a subject has no usable box, no embedding, or no compatible index entry
- **THEN** the system records an explicit not-nameable reason instead of silently falling back to a generic object name

### Requirement: Naming evaluation report

The system SHALL provide an offline evaluation report focused on item naming accuracy.

#### Scenario: Evaluation dataset is processed
- **WHEN** a labeled dataset of household subject crops or subject boxes is evaluated
- **THEN** the report includes Top1 accuracy, Top3 hit rate, candidate-correctable rate, false accept rate, unresolved rate, average score, average margin, and confusion clusters

#### Scenario: Subject box quality affects naming
- **WHEN** a labeled case has an invalid or ambiguous subject box
- **THEN** the report separates box-quality failure from naming-model failure

### Requirement: Error attribution

The system SHALL assign each incorrect naming case to one or more actionable error categories.

#### Scenario: Incorrect Top1 result is analyzed
- **WHEN** Top1 does not match the ground truth item
- **THEN** the system classifies the error as subject-box-error, index-coverage-gap, category-granularity-gap, fine-grained-visual-confusion, threshold-policy-error, candidate-display-gap, or unknown

#### Scenario: Correct item appears in Top3
- **WHEN** Top1 is incorrect but a matching item appears in Top3
- **THEN** the system marks the case as candidate-correctable and records the rank and score of the matching candidate

### Requirement: Cluster-level naming policy

The system SHALL support cluster-level analysis and policy recommendations for visually or semantically confusing item groups.

#### Scenario: Cluster has enough labeled cases
- **WHEN** a category cluster has enough labeled correct and incorrect examples
- **THEN** the report computes recommended score and margin thresholds for that cluster and shows expected false accept and reject trade-offs

#### Scenario: Cluster lacks enough samples
- **WHEN** a category cluster has insufficient labeled cases
- **THEN** the system reports the data gap and does not automatically recommend a production threshold

### Requirement: User correction feedback

The system SHALL allow local user corrections to become structured feedback for improving naming accuracy.

#### Scenario: User chooses a candidate
- **WHEN** the user selects one of the displayed candidates as the correct item
- **THEN** the system stores the selected candidate id, prior TopK list, subject box, crop metadata, original predicted name, score, and timestamp

#### Scenario: User enters a custom name
- **WHEN** the user manually enters a name because no candidate is correct
- **THEN** the system stores the custom name, subject box, crop metadata, prior TopK list, and a no-candidate-match marker

### Requirement: Index improvement recommendations

The system SHALL generate prioritized recommendations for improving the naming index.

#### Scenario: Coverage gap is detected
- **WHEN** repeated errors show that a ground truth item category has no visually similar TopK index entries
- **THEN** the system recommends collecting additional representative index images for that category

#### Scenario: Granularity gap is detected
- **WHEN** repeated errors show that multiple distinct household objects collapse into the same leaf category or visual cluster
- **THEN** the system recommends splitting the category, adding aliases, or adding a subcategory/SPU-style discriminator before adding more images
