## 1. Candidate Review State

- [x] 1.1 Add candidate normalization fields for recoverable deletion and derive active/deleted candidate collections.
- [x] 1.2 Update candidate selection so deleted candidates cannot become active and active selection advances to the nearest available candidate.
- [x] 1.3 Update confirmation logic to ignore deleted candidates and count only non-deleted selected candidates.

## 2. Candidate Overlay UI

- [x] 2.1 Shrink the candidate center marker and make only the outer pulse animate while the solid dot stays visible.
- [x] 2.2 Change the selected candidate frame to a white corner-frame treatment without a dark full-box mask.
- [x] 2.3 Ensure labels and full subject frames appear only for the active candidate.
- [x] 2.4 Verify dense photos remain readable in the iOS simulator viewport.

## 3. Candidate Card Review

- [x] 3.1 Replace the candidate list with a single active candidate card that includes crop, name, category, quantity, confidence text, and actions.
- [x] 3.2 Add previous and next controls for moving through non-deleted candidates and syncing the active photo marker.
- [x] 3.3 Add candidate delete controls that move candidates into trash without losing crop, name, box, confidence, or edits.
- [x] 3.4 Add a trash/recycle area with restore controls and visible deleted count.
- [x] 3.5 Keep scan-inside, location adjustment, and optional details actions available from the active card.

## 4. Reminder Data Model

- [x] 4.1 Add reminder normalization helpers that convert legacy `nextAt`, `nextTime`, `nextRepeat`, and `nextLabel` into `reminders[]`.
- [x] 4.2 Update candidate and item records to persist multiple reminder tasks with title, date, optional time, offset, repeat, enabled state, and notification ID.
- [x] 4.3 Update reminder list and reminder chips to render multiple reminder tasks per item or candidate.

## 5. Reminder Editor

- [x] 5.1 Rename the reminder entry point from `提醒日期` to `提醒`.
- [x] 5.2 Replace the old date modal with a reminder editor that binds task title, date, optional exact time, offset, and repeat together.
- [x] 5.3 Remove the `时间段` mode from reminder editing.
- [x] 5.4 Change time selection from 15-minute increments to one-minute precision.
- [x] 5.5 Add timed reminder offset defaults and presets: `无`, `准时`, `提前5分钟`, `提前30分钟`, `提前1小时`, `提前1天`, and `自定义`.
- [x] 5.6 Add all-day reminder offset defaults and presets: `无`, `当天`, `提前1天`, `提前2天`, `提前3天`, `提前1周`, and `自定义`.
- [x] 5.7 Support adding, editing, and deleting multiple reminder tasks for one candidate.

## 6. Notification Boundary

- [x] 6.1 Extend `platform.notifications` with best-effort schedule and cancel methods for native local notifications.
- [x] 6.2 Schedule enabled confirmed-item reminders when permissions and native APIs are available.
- [x] 6.3 Cancel stale native notifications when reminder tasks are edited, disabled, deleted, or removed by item updates.
- [x] 6.4 Keep reminders saved and visible in-app when notification permission is denied or unavailable.

## 7. Verification

- [x] 7.1 Run `npm run check:web`.
- [x] 7.2 Run `npm run build:web`.
- [x] 7.3 Test iOS simulator capture review: upload photo, analyze, select marker, navigate cards, delete, restore, and confirm.
- [x] 7.4 Test reminder editing: add multiple reminders, choose `09:07`, switch between timed/all-day offsets, save, reopen, and confirm.
- [x] 7.5 Sync and smoke-test the iOS app if native notification or picker behavior changes.
