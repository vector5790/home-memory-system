## ADDED Requirements

### Requirement: Capture recognition provider
The system SHALL create item candidates for the selected storage place through a recognition provider boundary that accepts the current capture image, room, storage place, and existing item context.

#### Scenario: Analyze uploaded storage photo locally
- **WHEN** the user uploads a storage photo, selects a storage place, and starts recognition
- **THEN** the system SHALL use a free local image analysis provider to render candidate regions derived from the uploaded image on the capture stage

#### Scenario: Uploaded photo does not use demo candidates
- **WHEN** the user uploads a storage photo and starts recognition
- **THEN** the system SHALL NOT fall back to storage-place mock candidates or label candidates as known items unless a provider derived them from the uploaded image

#### Scenario: Recognize camera storage photo
- **WHEN** the user captures a camera frame and starts recognition
- **THEN** the system SHALL use the captured frame as the recognition image and render local image-analysis candidates for the selected storage place

### Requirement: Progressive recognition feedback
The system SHALL show object regions as soon as detection completes and continue naming candidates asynchronously.

#### Scenario: Detection completes before naming
- **WHEN** the detector returns candidate regions before item names are finalized
- **THEN** the system SHALL render the candidate boxes immediately with a visible naming-in-progress state

#### Scenario: Naming completes
- **WHEN** catalog or embedding-based naming completes for a candidate
- **THEN** the system SHALL replace the naming-in-progress label with the resolved catalog name or a neutral placeholder

#### Scenario: Stable detector boxes render before naming
- **WHEN** the user starts recognition for an uploaded photo
- **THEN** the system SHALL wait for the subject detector to return stable image-derived boxes before showing candidate points or boxes

#### Scenario: Naming does not move detected subjects
- **WHEN** naming finishes after detector boxes are visible
- **THEN** the system SHALL update candidate names without replacing or moving the detected subject geometry

#### Scenario: Local proposal fallback is explicit
- **WHEN** the small detector is unavailable or returns no regions
- **THEN** the system MAY use local image-region proposals as an explicit fallback without presenting them as model-detected subjects

### Requirement: Local model assets
The system SHALL prefer local free model assets when they are available before falling back to network-loaded model code.

#### Scenario: Local model assets are downloaded
- **WHEN** the user has downloaded the vision assets and starts recognition
- **THEN** the system SHALL load Transformers.js and model files from the local `vendor/` directory

#### Scenario: Local model assets are missing
- **WHEN** local model assets are not present and the user starts recognition
- **THEN** the system MAY fall back to the remote free browser model or local image-region proposals without mutating inventory

### Requirement: Grounded detection and optional segmentation refinement
The system SHALL prefer a free open-vocabulary detector for subject recall and SHALL refine regions with a local segmentation model when the segmentation asset is available.

#### Scenario: OWL-ViT asset is available
- **WHEN** the user starts recognition and the local OWL-ViT model is present
- **THEN** the system SHALL use OWL-ViT before Grounding DINO to generate image-derived subject candidates

#### Scenario: SAM asset is available
- **WHEN** detector candidates are available and the local SAM-compatible model is present
- **THEN** the system SHALL attempt segmentation refinement without replacing detector candidates on segmentation failure

#### Scenario: Fast detector is unavailable
- **WHEN** OWL-ViT cannot load or returns no regions
- **THEN** the system MAY fall back to configured Grounding DINO and then to explicit local image-region proposals without mutating inventory

### Requirement: High-resolution upload preparation
The system SHALL prepare uploaded and captured photos for browser-local recognition so larger phone photos can be analyzed without exceeding storage or model limits.

#### Scenario: User uploads a high-resolution photo
- **WHEN** the user uploads a multi-megabyte image
- **THEN** the system SHALL resize and compress it before storing it in capture state and running recognition

#### Scenario: Prepared photo remains too large
- **WHEN** preprocessing cannot reduce a photo below the supported browser-local limit
- **THEN** the system SHALL show a clear error and leave existing candidates and inventory unchanged

### Requirement: Catalog-assisted candidate naming
The system SHALL separate object region detection from item naming by matching detected regions against a small household item catalog and optional embedding index.

#### Scenario: Detected region matches catalog
- **WHEN** a detected item region matches a catalog item above the configured similarity threshold
- **THEN** the system SHALL use the catalog item name and category for the candidate

#### Scenario: Detected region does not match catalog
- **WHEN** a detected item region does not match the catalog above the configured similarity threshold
- **THEN** the system SHALL name the candidate with a neutral placeholder such as `物品A` and allow the user to fill the real name

### Requirement: No-photo capture guard
The system SHALL avoid generating capture candidates before the user uploads or captures a storage photo.

#### Scenario: Capture has no photo
- **WHEN** the user opens AI capture without an uploaded or captured photo
- **THEN** the system SHALL show an empty photo placeholder and SHALL NOT render existing inventory boxes as capture candidates

#### Scenario: User starts analysis without a photo
- **WHEN** the user tries to start analysis without an uploaded or captured photo
- **THEN** the system SHALL keep the inventory unchanged and communicate that a photo is required

### Requirement: Empty household bootstrap
The system SHALL avoid pre-populating user-visible storage points or inventory items before the user adds or recognizes them.

#### Scenario: First launch
- **WHEN** the user opens the app with no saved local data
- **THEN** the system SHALL show default room names without seeded storage points or inventory items

#### Scenario: User adds a space
- **WHEN** the user enters a new space name
- **THEN** the system SHALL add that space and make it available for capture

#### Scenario: Recognition creates a photo point
- **WHEN** the user analyzes a room photo without an existing storage point and candidates are detected
- **THEN** the system SHALL create a photo-based storage point for that room

### Requirement: Hierarchical storage points
The system SHALL support nested storage points so an item can be associated with a child container inside another storage point.

#### Scenario: User adds a child storage point
- **WHEN** the user views an existing storage point and adds a lower-level storage point name
- **THEN** the system SHALL create the child storage point under the current parent and make it available for capture

#### Scenario: User scans inside a confirmed object
- **WHEN** the user chooses to photograph inside a confirmed object
- **THEN** the system SHALL create or select a child storage point linked to that object and guide the user to upload or capture its interior photo

#### Scenario: Search returns a nested path
- **WHEN** the user searches for an item stored inside a nested storage point
- **THEN** the system SHALL show the room, every parent storage point, the final storage point, and the item name in order

### Requirement: Clear photo annotations
The system SHALL render subject boxes and labels with a high-contrast, simple visual treatment that remains readable on busy real photos.

#### Scenario: Candidate boxes are visible
- **WHEN** candidate regions are shown on an uploaded photo
- **THEN** each selected candidate SHALL use a clear outline, compact label, and visible active state without obscuring the underlying object

#### Scenario: Candidate labels are still resolving
- **WHEN** a candidate has a region but no final name yet
- **THEN** the label SHALL show a concise recognition-in-progress state that is visually distinct from resolved names

#### Scenario: Dense candidate scenes use point annotations
- **WHEN** multiple candidate regions are shown on an uploaded photo
- **THEN** the system SHALL default to center-point annotations with compact connected labels and only show the full subject box for the active candidate

#### Scenario: Dense labels avoid collisions
- **WHEN** multiple subject labels would overlap on the uploaded photo
- **THEN** the system SHALL place labels around their center points with longer visible connectors and avoid common label collisions where possible

### Requirement: Candidate-to-child capture
The system SHALL let users continue from a detected subject into a nested capture flow before or after confirming it as an item.

#### Scenario: User photographs inside a detected candidate
- **WHEN** the user chooses to photograph inside a candidate subject
- **THEN** the system SHALL create or select a child storage point under the current place using the candidate geometry and switch capture to that child place

### Requirement: Candidate review and metadata editing
The system SHALL allow users to review each recognized candidate and edit its selected state, name, category, quantity, expiry date, maintenance date, maintenance label, and container before confirmation.

#### Scenario: User edits candidate metadata
- **WHEN** the user changes candidate fields in the review panel
- **THEN** the system SHALL update the candidate in capture state and keep the edited values visible until confirmation, reset, or storage-place change

#### Scenario: User excludes a candidate
- **WHEN** the user deselects a recognized candidate
- **THEN** the system SHALL leave the candidate visible as unselected and exclude it from confirmation

### Requirement: Candidate bounding box correction
The system SHALL allow users to select a candidate box on the capture stage and adjust its image-relative bounding box before confirming the item.

#### Scenario: User repositions candidate box
- **WHEN** the user adjusts a selected candidate box on the capture stage
- **THEN** the system SHALL persist the corrected percentage-based box in capture state and render the candidate at the corrected position

#### Scenario: Corrected box is confirmed
- **WHEN** the user confirms a selected candidate after correcting its box
- **THEN** the confirmed inventory item SHALL use the corrected box for future photo-map and search-result highlighting

### Requirement: Confirm candidates into inventory
The system SHALL add selected candidates to the inventory for the selected room and storage place while preserving user-corrected candidate metadata.

#### Scenario: Confirm selected candidates
- **WHEN** the user confirms selected candidates
- **THEN** the system SHALL create inventory items with room, storage place, name, category, quantity, container, expiry or maintenance metadata, confidence, updated date, and bounding box

#### Scenario: Prevent duplicate items in same storage place
- **WHEN** a selected candidate matches an existing item name in the same storage place
- **THEN** the system SHALL avoid adding a duplicate item and SHALL keep existing inventory data intact

### Requirement: Recognition failure handling
The system SHALL handle recognition errors without mutating confirmed inventory.

#### Scenario: Provider fails
- **WHEN** the recognition provider fails or returns invalid data
- **THEN** the system SHALL show an actionable failure message, keep the current capture image and storage-place selection, and leave confirmed inventory unchanged
