## Why

The current capture review flow still feels visually noisy when many objects are detected, and reminder fields are not yet clear enough for real app use. This change makes object review easier to operate on mobile and turns reminders into explicit, repeatable item actions instead of loosely related date fields.

## What Changes

- Refine candidate center markers so the solid point is smaller and only the outer pulse animates in/out.
- Change selected object framing from dark/black treatment to a clean white frame that remains readable over real photos.
- Keep labels hidden by default; show the frame and label only for the selected candidate.
- Rename "提醒日期" to "提醒" and remove the time-period toggle.
- Support minute-level time selection instead of 15-minute increments.
- Add reminder offset behavior:
  - When a time is selected, default to "准时" and allow `无`, `提前5分钟`, `提前30分钟`, `提前1小时`, `提前1天`, and `自定义`.
  - When no time is selected, default to `无` and allow `当天`, `提前1天`, `提前2天`, `提前3天`, `提前1周`, and `自定义`.
- Bind reminder date/time settings to reminder tasks, support multiple reminder tasks per item, and set date/time/offset together.
- Replace the candidate item list with card-based review controls.
- Support moving through candidate cards with previous/next interactions.
- Support deleting candidate items during review.
- Add a trash/recycle area so deleted candidates can be restored before confirmation.

## Capabilities

### New Capabilities

- `candidate-review-cards`: Covers mobile-friendly visual review of detected candidates, selected-object highlighting, card navigation, deletion, and trash restore.
- `item-reminder-scheduling`: Covers item reminder tasks, date/time selection, reminder offsets, and multiple reminders per item.

### Modified Capabilities

None.

## Impact

- Affected UI: capture photo overlay, candidate review panel, candidate card navigation, selected-candidate state, candidate deletion/restore controls, and item metadata forms.
- Affected styling: center marker animation, white selected frame, selected label treatment, candidate cards, trash area, and reminder controls.
- Affected data model: candidates gain a soft-deleted review state; items gain multiple reminder task records with date, optional time, offset, and repeat metadata.
- Affected iOS behavior: reminder inputs must remain usable in the Capacitor app, with local notification integration left behind the existing platform boundary where available.
