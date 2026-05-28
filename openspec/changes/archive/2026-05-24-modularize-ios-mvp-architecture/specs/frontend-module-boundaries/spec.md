## ADDED Requirements

### Requirement: Modular frontend source layout
The system SHALL organize frontend source code into explicit modules with separate ownership for bootstrap, configuration, domain logic, local data storage, platform adapters, vision processing, and UI rendering/event handling.

#### Scenario: Source tree exposes architecture boundaries
- **WHEN** a developer inspects the frontend source tree
- **THEN** the source tree includes distinct module areas for configuration, domain, store, platform, vision, and UI code
- **AND** the application entrypoint is limited to composition, startup, and high-level orchestration

#### Scenario: Static packaging includes module tree
- **WHEN** a developer runs the web build command
- **THEN** the packaged web output includes the frontend module tree required by the app entrypoint
- **AND** the packaged iOS app can load those modules without a bundler or development server

### Requirement: Domain logic isolation
The system SHALL keep room, storage-place, item, reminder, candidate, date, and search logic in domain modules that can run without DOM access.

#### Scenario: Domain modules do not depend on rendering
- **WHEN** domain modules are imported in a non-browser validation context
- **THEN** they can normalize records, compute paths, evaluate reminders, and match search queries without reading or mutating DOM nodes

#### Scenario: UI uses domain APIs
- **WHEN** the UI needs room paths, item lists, reminder status, or candidate normalization
- **THEN** it obtains those results through domain module APIs rather than duplicating data-shaping logic inside render functions

### Requirement: UI rendering boundary
The system SHALL keep DOM rendering and DOM event binding in UI modules that receive state, actions, and domain helpers through explicit inputs.

#### Scenario: Rendering does not own persistence
- **WHEN** UI modules render capture, map, search, reminder, or candidate review views
- **THEN** they do not directly write to localStorage, Capacitor Preferences, Filesystem, or other durable storage APIs

#### Scenario: Event handlers call actions
- **WHEN** a user clicks, types, selects, drags, captures, uploads, or confirms items
- **THEN** UI event handlers call explicit app actions or controller methods instead of mutating unrelated module globals directly

### Requirement: App entrypoint size control
The system SHALL prevent the application entrypoint from becoming another large monolith.

#### Scenario: Entrypoint remains orchestration-focused
- **WHEN** architecture validation runs
- **THEN** the app entrypoint remains below the configured line-count threshold
- **AND** it does not contain detector implementation, persistence serialization, or full view rendering templates
