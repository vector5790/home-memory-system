## ADDED Requirements

### Requirement: Architecture Validation Command
The system SHALL provide an automated validation command that checks frontend architecture boundaries and regression thresholds.

#### Scenario: Developer validates architecture constraints
- WHEN a developer runs the architecture validation command
- THEN the command reports pass or fail for module boundary rules, entrypoint size thresholds, and disallowed cross-layer imports
- AND the command exits non-zero when any required boundary check fails

### Requirement: Monolith Regression Prevention
The system SHALL prevent the primary app entrypoint from growing back into a broad application monolith.

#### Scenario: Entrypoint exceeds approved responsibility
- GIVEN the frontend has a documented entrypoint size threshold
- WHEN the app entrypoint exceeds that threshold or directly owns domain/store/vision/UI implementation details
- THEN architecture validation fails with a message naming the violated file and rule

### Requirement: Mobile Package Validation
The system SHALL validate that the iOS MVP package can run without remote runtime dependencies.

#### Scenario: iOS package is checked for local-only runtime dependencies
- WHEN mobile package validation runs for the iOS MVP
- THEN it verifies required local model and app assets are present in the packaged build inputs
- AND it verifies dev-only server references are not required by the packaged iOS runtime

### Requirement: Architecture Notes
The system SHALL document module ownership, allowed dependencies, and deferred Android integration points.

#### Scenario: Developer reviews architecture before changing modules
- WHEN a developer opens the architecture notes
- THEN the notes describe each frontend module group, its ownership boundary, and the allowed dependency direction
- AND the notes state that Android implementation is deferred while preserving shared module extension points
