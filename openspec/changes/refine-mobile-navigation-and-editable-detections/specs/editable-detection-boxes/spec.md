## ADDED Requirements

### Requirement: Selected subject uses a white editable frame
The system SHALL render the active detected subject with a white subject frame. The selected subject area inside the frame SHALL be highlighted without obscuring the underlying photo.

#### Scenario: User selects a subject marker
- **WHEN** the user taps a detected subject marker
- **THEN** that subject becomes active
- **AND** the active subject displays a white frame
- **AND** the area inside the active subject frame is visibly highlighted

#### Scenario: Non-selected subjects stay quiet
- **WHEN** multiple subjects are visible
- **THEN** non-selected subjects remain marker-only
- **AND** non-selected subjects do not show full boxes or labels

### Requirement: Users can drag the active subject box
The system SHALL allow users to reposition the active subject box by dragging it on the photo. The adjusted geometry MUST be stored as image-relative percentage coordinates.

#### Scenario: User moves a subject box
- **WHEN** the user drags the active subject box to a new location
- **THEN** the frame follows the user's pointer during the drag
- **AND** the candidate box is persisted at the adjusted image-relative position when the drag ends

#### Scenario: Drag stays inside image bounds
- **WHEN** the user drags a subject box beyond the image edge
- **THEN** the system clamps the box within the photo bounds
- **AND** the box width and height remain valid

### Requirement: Users can resize the active subject box
The system SHALL allow users to resize the active subject box with touch-friendly handles or equivalent direct manipulation controls. The resized geometry MUST be stored as image-relative percentage coordinates.

#### Scenario: User resizes a subject box
- **WHEN** the user drags a resize handle on the active subject frame
- **THEN** the frame resizes during the drag
- **AND** the candidate box is persisted with the adjusted image-relative width and height when the drag ends

#### Scenario: Resize preserves usable minimum size
- **WHEN** the user resizes a subject box very small
- **THEN** the system enforces a usable minimum box width and height
- **AND** the selected frame and handles remain operable

### Requirement: Box editing triggers item-name re-recognition
The system SHALL re-run item-name recognition for the edited candidate after the user completes a drag or resize operation. Re-recognition MUST use the adjusted subject crop and MUST NOT move other detected subjects.

#### Scenario: User finishes moving a box
- **WHEN** the user completes dragging the active subject box
- **THEN** the app regenerates that candidate's crop from the adjusted box
- **AND** the app runs item-name recognition for that candidate again
- **AND** the candidate shows a naming-in-progress state until the new name result is available

#### Scenario: User finishes resizing a box
- **WHEN** the user completes resizing the active subject box
- **THEN** the app regenerates that candidate's crop from the adjusted box
- **AND** the app runs item-name recognition for that candidate again
- **AND** the updated name, category, confidence, and crop are applied only to that candidate

### Requirement: Manual box edits are preserved through confirmation
The system SHALL preserve user-adjusted subject box geometry when candidates are confirmed into inventory. Confirmed items MUST use the adjusted box for photo-map and search-result highlighting.

#### Scenario: User confirms an edited candidate
- **WHEN** the user adjusts a candidate box and then confirms it into inventory
- **THEN** the saved item uses the adjusted box geometry
- **AND** later photo-map or search highlighting uses the adjusted geometry

### Requirement: Re-recognition failure keeps the user edit
The system SHALL keep the manually adjusted box if item-name re-recognition fails. A failed naming pass MUST NOT revert the adjusted geometry or remove the candidate.

#### Scenario: Naming after box edit fails
- **WHEN** the user edits a subject box
- **AND** item-name recognition fails for the adjusted crop
- **THEN** the adjusted box remains visible and persisted
- **AND** the candidate keeps a neutral editable name or its previous user-edited name
- **AND** the user can still manually edit the item name
