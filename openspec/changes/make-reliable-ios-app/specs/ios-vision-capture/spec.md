## ADDED Requirements

### Requirement: iOS photo ingestion
The system SHALL support native-friendly photo capture and photo-library import on iOS while preserving the existing browser upload fallback.

#### Scenario: Capture from camera
- **WHEN** the user starts the iOS camera flow and takes a photo
- **THEN** the app imports the captured image into the Home Memory capture screen
- **AND** the image is associated with the selected room and storage point context

#### Scenario: Import from library
- **WHEN** the user selects an existing iPhone photo from the library
- **THEN** the app imports the selected image into the capture screen
- **AND** the user can start the recognition lifecycle without refreshing the app

### Requirement: Large image preprocessing
The system SHALL preprocess real iPhone photos before display, persistence, and recognition so large images do not freeze the UI or disappear silently.

#### Scenario: Import high-resolution image
- **WHEN** the user imports a high-resolution iPhone photo
- **THEN** the app shows visible processing progress
- **AND** the app creates a bounded display/recognition image that can be rendered and analyzed within configured memory and size limits

#### Scenario: Decode unsupported image
- **WHEN** the platform cannot decode the selected image format
- **THEN** the app shows a clear error message
- **AND** the previous capture state remains intact

### Requirement: Packaged local model loading
The system SHALL load local recognition runtime assets and model manifests from packaged app resources or an explicitly documented app cache path.

#### Scenario: Packaged assets available
- **WHEN** the iOS app starts recognition and packaged local model assets are present
- **THEN** the recognition runtime loads assets from the app bundle or app cache
- **AND** recognition does not request model files from a localhost development server

#### Scenario: Assets missing
- **WHEN** required local model assets are missing or fail to load
- **THEN** the app reports the local model provider as unavailable
- **AND** the app falls back only to documented free/local alternatives or manual candidate entry

### Requirement: Recognition lifecycle on iOS
The system SHALL preserve the current detection-first recognition lifecycle in the iOS app.

#### Scenario: Start recognition
- **WHEN** the user taps the analysis action after importing a photo
- **THEN** the app enters a visible recognition state
- **AND** detector-derived subject points or boxes appear before completed item names when the detector returns geometry first

#### Scenario: Complete recognition
- **WHEN** recognition returns candidate subjects
- **THEN** the app displays editable candidates with names, fallback placeholders, confidence, categories, quantities, containers, and image-relative geometry
- **AND** the user must confirm candidates before inventory is mutated

### Requirement: Optional cloud fallback boundary
The system SHALL keep cloud image recognition optional and environment-configured for iOS builds.

#### Scenario: No cloud endpoint
- **WHEN** the iOS app has no cloud recognition endpoint configured
- **THEN** the app does not show cloud recognition as the default path
- **AND** it never embeds or requires a secret API key in the iOS bundle

#### Scenario: Cloud endpoint configured
- **WHEN** a cloud recognition endpoint is configured for a test build
- **THEN** the app sends only the currently selected image and capture context to that endpoint after explicit user action
- **AND** provider failures do not mutate confirmed inventory

### Requirement: Device performance reporting
The system SHALL provide enough runtime logging or visible diagnostics to evaluate recognition performance on iOS devices.

#### Scenario: Measure recognition run
- **WHEN** a recognition run completes or fails on iOS
- **THEN** the app records or exposes provider name, asset mode, image dimensions, preprocessing time, detection time, naming time, and result count for debugging

#### Scenario: Slow recognition
- **WHEN** recognition exceeds the configured slow-run threshold
- **THEN** the app keeps the user informed with progress state
- **AND** it does not replace detector geometry with fabricated mock candidates
