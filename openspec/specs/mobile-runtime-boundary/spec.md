# mobile-runtime-boundary Specification

## Purpose
TBD - created by archiving change modularize-ios-mvp-architecture. Update Purpose after archive.
## Requirements
### Requirement: Packaged iOS runtime independence
The system SHALL keep the iOS MVP runtime independent from local Python or Node development servers.

#### Scenario: iOS app launches from packaged assets
- **WHEN** the iOS app is built, installed, and launched in a simulator or on a device
- **THEN** it loads UI code, data seeds, styles, and local model manifests from packaged app assets
- **AND** it does not require `server.py`, `server.mjs`, or localhost endpoints for startup

#### Scenario: Development server remains optional
- **WHEN** a developer uses the browser development workflow
- **THEN** the development server may serve static files or development-only helper endpoints
- **AND** those endpoints are documented as non-runtime dependencies for the iOS MVP

### Requirement: Local-only native model resources
The system SHALL prevent native mobile builds from silently downloading vision runtimes or model files from remote CDNs or model hosts.

#### Scenario: Native local model assets present
- **WHEN** a native iOS recognition run starts and packaged local model assets are present
- **THEN** the vision runtime loads local assets from packaged paths or app-owned cache paths
- **AND** it does not request model or runtime files from CDN/Hugging Face hosts

#### Scenario: Native local model assets missing
- **WHEN** required local model assets are missing in native runtime
- **THEN** the app reports the local model provider as unavailable
- **AND** it falls back only to local documented alternatives or manual confirmation paths

### Requirement: Optional remote provider boundary
The system SHALL keep future remote recognition services behind an explicit provider boundary.

#### Scenario: No remote provider configured
- **WHEN** no remote recognition endpoint is explicitly configured
- **THEN** the iOS MVP does not show remote recognition as the default path
- **AND** it does not send photos or household metadata to remote services

#### Scenario: Remote provider added later
- **WHEN** a future change configures a remote recognition provider
- **THEN** that provider is invoked through the vision/provider boundary
- **AND** provider failures do not mutate confirmed inventory directly

### Requirement: Android implementation remains deferred
The system SHALL preserve future Android extension points without implementing Android in this change.

#### Scenario: No Android project generated
- **WHEN** this architecture change is complete
- **THEN** the repository does not need to contain a generated `android/` app project
- **AND** Android-specific packaging, signing, and device validation are not required for completion

#### Scenario: Platform boundary names Android explicitly
- **WHEN** platform adapters describe runtime capabilities
- **THEN** they can represent web, iOS, future Android, and generic native runtimes without forcing current iOS code to depend on Android implementation details

