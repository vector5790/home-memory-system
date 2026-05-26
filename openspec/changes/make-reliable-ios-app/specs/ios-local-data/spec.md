## ADDED Requirements

### Requirement: Versioned home data store
The system SHALL persist rooms, nested storage points, items, reminders, recognition metadata, and photo references through a versioned data-store boundary instead of direct image-heavy `localStorage` writes.

#### Scenario: Save inventory state
- **WHEN** the user confirms a recognized item into inventory
- **THEN** the item, room path, storage hierarchy, candidate box, category, quantity, and reminder metadata are persisted through the data-store boundary
- **AND** the saved record references photo files by stable IDs or relative paths rather than embedding large base64 images in the graph record

#### Scenario: Reload saved state
- **WHEN** the iOS app is terminated and launched again
- **THEN** rooms, nested storage points, confirmed items, reminders, and photo references are restored from durable app storage

### Requirement: App-owned photo file storage
The system SHALL store captured or imported photos as app-owned files with separate display derivatives when needed.

#### Scenario: Persist captured photo
- **WHEN** the user captures or imports a storage photo on iOS
- **THEN** the app stores a normalized photo file in app storage
- **AND** the app stores or can derive a thumbnail/display image for the capture and search UI

#### Scenario: Display saved photo
- **WHEN** the user opens a saved item or storage point after restarting the app
- **THEN** the UI displays the stored real photo associated with that item or storage point
- **AND** the photo is not replaced by a mock or placeholder image unless the file is genuinely missing

### Requirement: Prototype data migration
The system SHALL attempt a one-time migration from existing prototype `localStorage` data into the new data-store boundary when compatible data exists.

#### Scenario: Migrate compatible snapshot
- **WHEN** a user launches the app with a compatible existing Home Memory `localStorage` snapshot
- **THEN** the app imports rooms, storage points, items, reminders, and any usable image references into the new store
- **AND** the migration records the target schema version

#### Scenario: Handle incompatible snapshot
- **WHEN** an existing snapshot cannot be parsed or migrated safely
- **THEN** the app starts with a clean default home state
- **AND** the user sees a non-blocking message that old local prototype data could not be migrated

### Requirement: Storage failure handling
The system SHALL surface storage failures without silently losing user-confirmed inventory.

#### Scenario: Photo write failure
- **WHEN** photo persistence fails during capture or confirmation
- **THEN** the app shows an actionable error
- **AND** the item is not marked as fully saved with a broken photo reference

#### Scenario: Graph write failure
- **WHEN** inventory graph persistence fails after user edits
- **THEN** the app keeps the current session state available
- **AND** the app warns the user that the change has not been durably saved

### Requirement: Local-first privacy boundary
The system SHALL keep household inventory data and photos local by default.

#### Scenario: No cloud provider configured
- **WHEN** the app runs with no explicit cloud recognition endpoint configured
- **THEN** confirmed inventory data, photos, and recognition metadata remain in local app storage
- **AND** no photo is sent to a remote recognition service

#### Scenario: Cloud provider enabled later
- **WHEN** a future cloud provider is configured
- **THEN** the app clearly labels the provider before sending an image
- **AND** local saved data remains readable without that provider
