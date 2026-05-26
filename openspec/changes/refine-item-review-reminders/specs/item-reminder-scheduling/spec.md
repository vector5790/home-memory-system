## ADDED Requirements

### Requirement: Reminder task combines date and action text
The system SHALL label item reminder controls as `提醒` rather than `提醒日期`. A reminder MUST bind the reminder action text, date, optional time, offset, and repeat setting together as one reminder task. Each candidate or item SHALL support multiple reminder tasks.

#### Scenario: User adds multiple reminder tasks
- **WHEN** the user opens reminder settings for a candidate
- **AND** adds two reminder tasks with different action text and dates
- **THEN** both reminder tasks are shown under that candidate
- **AND** each task keeps its own date, optional time, offset, and repeat setting

#### Scenario: Reminder field is not a loose date
- **WHEN** the user opens candidate details
- **THEN** the reminder entry point is labeled `提醒`
- **AND** the reminder action text is edited in the same flow as the reminder date and time

### Requirement: Reminder time selection supports exact minutes
The system SHALL support selecting reminder time at one-minute precision. The reminder time selector MUST NOT be limited to 15-minute increments.

#### Scenario: User chooses a non-quarter-hour time
- **WHEN** the user selects a timed reminder
- **AND** chooses `09:07`
- **THEN** the reminder is saved and displayed as `09:07`
- **AND** the value is preserved after reopening the reminder editor

### Requirement: Timed reminders use timed offset presets
The system SHALL default a timed reminder offset to `准时` when a time is selected. For timed reminders, the system SHALL allow `无`, `准时`, `提前5分钟`, `提前30分钟`, `提前1小时`, `提前1天`, and `自定义` offset choices.

#### Scenario: New timed reminder defaults to on-time
- **WHEN** the user enables time for a reminder task
- **AND** the user has not manually chosen an offset
- **THEN** the offset defaults to `准时`

#### Scenario: Timed reminder supports requested presets
- **WHEN** the user edits a timed reminder's offset
- **THEN** the offset choices include `无`, `准时`, `提前5分钟`, `提前30分钟`, `提前1小时`, `提前1天`, and `自定义`

### Requirement: All-day reminders use all-day offset presets
The system SHALL default an all-day reminder offset to `无` when no time is selected. For all-day reminders, the system SHALL allow `无`, `当天`, `提前1天`, `提前2天`, `提前3天`, `提前1周`, and `自定义` offset choices.

#### Scenario: New all-day reminder defaults to none
- **WHEN** the user creates a reminder without selecting a time
- **THEN** the offset defaults to `无`

#### Scenario: All-day reminder supports requested presets
- **WHEN** the user edits an all-day reminder's offset
- **THEN** the offset choices include `无`, `当天`, `提前1天`, `提前2天`, `提前3天`, `提前1周`, and `自定义`

### Requirement: Reminder editor removes time-period mode
The system SHALL remove the previous reminder time-period mode from the reminder date editor. Reminder editing SHALL provide date, optional exact time, offset, repeat, and reminder action controls without a `时间段` tab or segmented mode.

#### Scenario: User opens reminder editor
- **WHEN** the user opens the reminder editor for a candidate
- **THEN** no `时间段` tab or time-period mode is shown
- **AND** the user can still set date, optional time, offset, repeat, and reminder action text

### Requirement: Confirmed items preserve and schedule reminders
The system SHALL copy candidate reminder tasks to confirmed inventory items. When native local notifications are available and permission is granted, the system SHALL schedule enabled reminder tasks and cancel stale notifications when reminders are changed or removed. When native notifications are unavailable or denied, reminders MUST remain visible in the app.

#### Scenario: Candidate reminders become item reminders
- **WHEN** the user confirms a candidate with multiple reminder tasks
- **THEN** the saved inventory item contains those reminder tasks
- **AND** the reminder view can display each task independently

#### Scenario: Native notification unavailable does not lose reminders
- **WHEN** a reminder task is saved in an environment without native notification scheduling
- **THEN** the reminder task remains persisted in the app
- **AND** the app does not fail the confirmation flow because notification scheduling is unavailable
