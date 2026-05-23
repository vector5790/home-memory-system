## ADDED Requirements

### Requirement: Candidate markers remain quiet until selected
The system SHALL render every visible detected candidate as a small center marker by default. The marker's solid center MUST remain visible and stable, while only the outer ring or pulse animates. The system SHALL hide object labels and full subject frames for non-selected candidates.

#### Scenario: Dense photo shows marker-only candidates
- **WHEN** a photo analysis returns multiple visible candidates
- **THEN** the photo overlay shows small center markers for those candidates
- **AND** no non-selected candidate label or full subject frame is displayed
- **AND** the solid center of each marker remains visible while only the outer pulse animates

#### Scenario: Selecting a marker reveals the candidate
- **WHEN** the user taps a candidate marker on the photo
- **THEN** that candidate becomes the active candidate
- **AND** the system displays the candidate's subject frame and label
- **AND** other candidates remain marker-only

### Requirement: Selected candidate uses a white photo frame
The system SHALL display the active candidate's subject box with a white corner-frame treatment. The active frame MUST NOT use a black outline or dark full-box mask as the primary frame color.

#### Scenario: Active candidate is highlighted over the photo
- **WHEN** a candidate is active
- **THEN** the candidate's subject area is highlighted with a white frame
- **AND** the candidate label is shown near the selected subject
- **AND** the frame remains readable over light and dark photo regions

### Requirement: Candidate review uses cards instead of a vertical list
The system SHALL replace the candidate review list with card-based review. The active review card SHALL show the candidate crop, name, category, quantity, confidence explanation, and available actions. The system SHALL provide previous and next controls that move through non-deleted candidates.

#### Scenario: User reviews candidates one card at a time
- **WHEN** candidate analysis has produced at least two non-deleted candidates
- **THEN** the candidate panel shows one active candidate card
- **AND** previous and next controls are available when adjacent candidates exist
- **AND** moving to another card updates the active candidate on the photo

#### Scenario: Candidate confidence is understandable
- **WHEN** a candidate card is displayed
- **THEN** the card shows confidence with an explanatory label such as `置信度`
- **AND** the confidence value is not shown as a bare percentage without context

### Requirement: Candidate deletion is recoverable before confirmation
The system SHALL allow users to delete a candidate from the active review set. Deleted candidates MUST be excluded from the photo marker overlay, card navigation, selected count, and confirmation result. The system SHALL keep deleted candidates in a trash area until the capture session is reset or replaced so the user can restore them.

#### Scenario: User deletes a candidate
- **WHEN** the user deletes the active candidate
- **THEN** that candidate is removed from active card navigation
- **AND** its photo marker is hidden
- **AND** the trash area shows that deleted candidate as restorable

#### Scenario: User restores a deleted candidate
- **WHEN** the user restores a candidate from trash
- **THEN** that candidate returns to the active review set
- **AND** its crop, name, box, confidence, and edited fields are preserved
- **AND** it can be confirmed into inventory again

### Requirement: Confirmation respects card review state
The system SHALL confirm only candidates that are not deleted and are selected for入库. Deleted candidates MUST NOT create inventory items even if their prior selected flag was true.

#### Scenario: Deleted candidate is ignored during confirmation
- **WHEN** a deleted candidate and an active selected candidate exist in the same capture session
- **AND** the user confirms入库
- **THEN** only the active selected candidate creates an inventory item
- **AND** the deleted candidate remains absent from saved inventory
