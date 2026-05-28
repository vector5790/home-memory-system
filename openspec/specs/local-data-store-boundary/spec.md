# local-data-store-boundary Specification

## Purpose
TBD - created by archiving change modularize-ios-mvp-architecture. Update Purpose after archive.
## Requirements
### Requirement: Local data-store service
The system SHALL expose local household graph persistence through a data-store service boundary rather than direct UI or domain access to browser/native storage primitives.

#### Scenario: Save through data-store boundary
- **WHEN** the app persists rooms, nested storage points, confirmed items, reminders, candidate metadata, recognition diagnostics, or photo references
- **THEN** it calls the data-store boundary
- **AND** UI modules do not call localStorage, Capacitor Preferences, or Filesystem directly

#### Scenario: Load through data-store boundary
- **WHEN** the app starts in browser or iOS runtime
- **THEN** it loads the initial household graph through the data-store boundary
- **AND** the loaded records are normalized before being used by UI rendering

### Requirement: Photo reference persistence
The system SHALL keep app-owned photo files and graph photo references coordinated by the local data-store boundary.

#### Scenario: Persist imported photo
- **WHEN** a user captures or imports a photo on iOS
- **THEN** the app stores the normalized image through a photo persistence API
- **AND** graph records store a stable photo reference rather than a large durable base64 image blob

#### Scenario: Restore referenced photo
- **WHEN** the app restarts and loads a storage point or item with a photo reference
- **THEN** the data-store boundary resolves that reference into a displayable URL when available
- **AND** missing files are surfaced as recoverable missing-photo state rather than mock data

### Requirement: Flushable durable writes
The system SHALL provide a way to flush pending native writes and report durable-write failures.

#### Scenario: Flush after critical save
- **WHEN** the app confirms candidates into inventory or clears local data
- **THEN** it can flush pending local writes through the data-store boundary
- **AND** a write failure is reported to the app controller for user-visible warning

#### Scenario: Session state remains available after failure
- **WHEN** durable graph or photo writes fail
- **THEN** the current session state remains available in memory
- **AND** the user is warned that the latest changes may not survive app restart

### Requirement: Store validation without UI
The system SHALL support validating local data-store behavior without launching the full UI.

#### Scenario: Store smoke validation
- **WHEN** a developer runs the architecture or store validation command
- **THEN** it exercises snapshot creation, load normalization, save/flush error paths, and photo-reference serialization without requiring manual UI interaction
