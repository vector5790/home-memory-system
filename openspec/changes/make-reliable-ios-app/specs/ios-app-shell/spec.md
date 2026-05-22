## ADDED Requirements

### Requirement: iOS project bootstrapping
The system SHALL include a native iOS project that packages the existing web app through a maintained Web-to-native bridge and can be opened from the repository without relying on a local Python or Node server at runtime.

#### Scenario: Open iOS project
- **WHEN** a developer follows the documented iOS setup command
- **THEN** the repository contains an `ios/` project that can be opened in Xcode
- **AND** the packaged app points at bundled web assets rather than `localhost`

#### Scenario: Launch packaged app
- **WHEN** the iOS app launches in a simulator or on a device
- **THEN** the Home Memory UI loads from app-packaged assets
- **AND** the app does not require `python3 server.py` or `node server.mjs` to be running

### Requirement: Repeatable build commands
The system SHALL provide documented commands for browser development, web asset packaging, iOS synchronization, and opening or running the iOS app.

#### Scenario: Build web assets
- **WHEN** a developer runs the documented web build command
- **THEN** the current `index.html`, `app.js`, `styles.css`, `data/`, and required runtime assets are copied or emitted into the configured iOS web asset directory

#### Scenario: Sync native project
- **WHEN** a developer runs the documented iOS sync command after a web change
- **THEN** the iOS project receives the latest packaged web assets
- **AND** the command exits with a non-zero status if required assets are missing

### Requirement: Browser workflow remains available
The system SHALL keep the existing local browser prototype runnable during and after the iOS migration.

#### Scenario: Run browser prototype
- **WHEN** a developer starts the existing local server and opens the documented localhost URL
- **THEN** the browser prototype loads with the same capture, search, storage hierarchy, and reminder flows available

#### Scenario: Platform adapter fallback
- **WHEN** the app runs in a normal desktop browser without native plugins
- **THEN** platform adapters use web fallbacks
- **AND** the UI does not fail due to missing iOS-only APIs

### Requirement: iOS permissions and app metadata
The system SHALL configure iOS app metadata and usage descriptions for every native permission used by the app.

#### Scenario: Camera permission prompt
- **WHEN** the user starts the camera workflow in the iOS app for the first time
- **THEN** iOS displays a camera permission message that explains capturing storage photos for Home Memory
- **AND** denying permission leaves upload/manual entry paths usable

#### Scenario: Photo library permission prompt
- **WHEN** the user imports a photo from the iOS photo library for the first time
- **THEN** iOS displays a photo-library permission message that explains selecting storage photos
- **AND** denying permission leaves camera/manual entry paths usable

### Requirement: iOS smoke test evidence
The system SHALL include a manual smoke-test checklist for iOS simulator and device verification.

#### Scenario: Complete smoke checklist
- **WHEN** a developer completes the iOS smoke-test checklist
- **THEN** the checklist covers install, launch, photo import or camera capture, recognition start, candidate confirmation, app restart, saved item search, and saved photo display

#### Scenario: Record known limitations
- **WHEN** a smoke-test step cannot be completed on the available environment
- **THEN** the checklist records the limitation and the exact step that remains unverified
