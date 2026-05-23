## ADDED Requirements

### Requirement: Search is a standalone first row
The system SHALL render the search control as its own first-row interaction above the primary app content. The search row MUST remain available when the user is on `照片地图`, `AI录入`, or `提醒`.

#### Scenario: User opens the app
- **WHEN** the user opens the app on the iOS simulator
- **THEN** the first interaction row contains the search input/control
- **AND** the search row is visually separate from the bottom tab navigation

#### Scenario: User changes primary tab
- **WHEN** the user switches between `照片地图`, `AI录入`, and `提醒`
- **THEN** the search row remains available above the tab content

### Requirement: Primary navigation uses three bottom tabs
The system SHALL expose `照片地图`, `AI录入`, and `提醒` as persistent bottom tabs. The previous top navigation buttons for these destinations MUST NOT remain as the primary navigation.

#### Scenario: Bottom tabs are visible
- **WHEN** the app is displayed on an iPhone simulator viewport
- **THEN** the bottom navigation shows exactly the primary tabs `照片地图`, `AI录入`, and `提醒`
- **AND** tapping each tab switches the main content to that destination

#### Scenario: Active bottom tab is clear
- **WHEN** a bottom tab is active
- **THEN** that tab is visually distinguished from the inactive bottom tabs
- **AND** content is not hidden behind the bottom safe area

### Requirement: AI capture has household space tabs
The system SHALL render household space tabs directly below the search row when `AI录入` is active. The default tabs SHALL be `客厅`, `厨房`, `阳台`, and `卧室`.

#### Scenario: User opens AI capture
- **WHEN** the user taps the `AI录入` bottom tab
- **THEN** a household space tab row appears below the search row
- **AND** the row includes `客厅`, `厨房`, `阳台`, and `卧室`

#### Scenario: User switches capture space
- **WHEN** the user taps a household space tab in `AI录入`
- **THEN** the capture context switches to that space
- **AND** upload, camera, recognition, and candidate confirmation use the selected space

### Requirement: Users can create household space tabs
The system SHALL allow users to create a new household space tab from the space tab row. Newly created spaces MUST be selectable for AI capture and photo-map viewing.

#### Scenario: User adds a new space
- **WHEN** the user enters a new household space name and confirms it
- **THEN** the system adds a new space tab with that name
- **AND** the new space becomes selectable in `AI录入`
- **AND** the new space is available under `照片地图`

#### Scenario: User tries to add a duplicate space
- **WHEN** the user enters a space name that already exists after normalization
- **THEN** the system SHALL NOT create a duplicate tab
- **AND** the existing matching space remains selectable

### Requirement: Reminder content lives under the reminder tab
The system SHALL move the previous reminder summary/list content into the `提醒` bottom tab. Reminder content MUST NOT remain as a persistent side panel next to `AI录入` or `照片地图` on mobile.

#### Scenario: User opens reminders
- **WHEN** the user taps the `提醒` bottom tab
- **THEN** the app displays the reminder list and reminder-related empty states under that tab

#### Scenario: User opens another tab
- **WHEN** the user opens `照片地图` or `AI录入`
- **THEN** the previous reminder side content is not shown as a separate right column

### Requirement: Household space content lives under photo map
The system SHALL move the previous household-space browsing content under the `照片地图` bottom tab. The photo map tab SHALL provide access to rooms, storage points, nested storage points, and confirmed items.

#### Scenario: User opens photo map
- **WHEN** the user taps the `照片地图` bottom tab
- **THEN** the app displays household space/photo-map content
- **AND** the user can inspect rooms, storage points, nested storage points, and confirmed items from that tab

#### Scenario: User opens AI capture
- **WHEN** the user taps the `AI录入` bottom tab
- **THEN** household-space browsing is not shown as a desktop sidebar
- **AND** space selection is represented by the AI capture space tabs

### Requirement: Recognition copy does not promise automatic photo generation
The system SHALL remove UI copy that tells users photo-map or storage content will be automatically generated after recognition. Empty states MAY guide users to upload or add content manually, but MUST NOT overpromise automatic photo generation.

#### Scenario: User views an empty photo map
- **WHEN** there are no storage points or confirmed items for a space
- **THEN** the empty state does not say that photos or storage points will be automatically generated after recognition
- **AND** the empty state offers a clear manual next action such as upload, scan, or add
