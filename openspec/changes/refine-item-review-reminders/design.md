## Context

The app is now verified through the iOS simulator shell. Capture review, candidate metadata, date picking, and persistence are primarily implemented in `app.js`, with presentation in `styles.css` and native integrations hidden behind `platform.js`.

The latest capture UI already shows center dots by default and only shows the selected object frame and label, but the marker treatment is too heavy and the selected frame still has a dark mask. Candidate editing is still rendered as a vertical list, while reminders are stored as one loose set of fields (`nextAt`, `nextTime`, `nextRepeat`, `nextLabel`) that does not support multiple reminder tasks or clear offset choices.

## Goals / Non-Goals

**Goals:**

- Make dense object detection easier to read by shrinking candidate dots and animating only the outer pulse.
- Keep non-selected objects visually quiet and show a white selected frame/label only for the active candidate.
- Replace the candidate list with a card review model that supports previous/next navigation, deletion, and restore from trash.
- Preserve deleted candidates until the user confirms or starts a new analysis.
- Model reminders as multiple task records per candidate/item.
- Bind reminder task text, date, optional time, offset, and repeat settings in one editing flow.
- Support exact minute selection and the offset presets requested for timed and all-day reminders.
- Use the iOS simulator as the required behavior verification surface.

**Non-Goals:**

- Do not change the recognition provider, detection model, embedding index, or SAM refinement pipeline.
- Do not add cloud sync, accounts, shared household reminders, or backend scheduling.
- Do not build a full production notification center; this change only needs item-bound reminders and local scheduling boundaries.
- Do not remove the optional expiry field unless implementation discovers it is redundant; the requested rename applies to the reminder date control.

## Decisions

1. Store candidate deletion as review state, not by removing the candidate object.

   Candidates will gain a review state such as `deletedAt` or `isDeleted`. Active card lists filter deleted candidates out, trash lists show deleted candidates, and confirmation ignores deleted candidates. This preserves crop images, box geometry, names, and edits so restore is instant.

   Alternative considered: splice deleted candidates out of `state.capture.candidates`. That is simpler but makes undo/restore difficult and risks losing recognized data before confirmation.

2. Render one active candidate card at a time, with compact navigation.

   The candidate panel will present the active candidate as a card with crop, name/category/quantity, confidence text, location actions, and reminder controls. Previous/next buttons move `state.capture.activeCandidateId` through the non-deleted candidates. The trash area is a separate compact card/list below the active card so it does not compete with the main review.

   Alternative considered: render all candidates as separate cards in a long scroll. This improves visibility of all candidates but recreates the current list problem on mobile and makes photo-to-card comparison slower.

3. Keep the photo overlay marker-only by default.

   Each visible candidate gets a small solid dot centered on its detected box. A pseudo-element or child element renders the outer pulse animation so the solid point does not blink. The selected candidate displays a white corner frame and dark label without the previous dark full-box mask.

   Alternative considered: retain label callouts for every candidate. That worked for a few objects but became unreadable in dense scenes.

4. Introduce a normalized reminder array.

   Candidate and item records will support `reminders: [{ id, title, date, hasTime, time, offset, repeat, customOffset, enabled, notificationId }]`. Existing `nextAt/nextTime/nextRepeat/nextLabel` fields will be normalized into a single reminder record when loading or rendering legacy state. Confirming candidates copies reminder records into saved items.

   Alternative considered: add `nextAt2`, `nextAt3`, and similar fields. That would be brittle and would keep reminder text/date disconnected.

5. Use different offset presets depending on whether a time is selected.

   A timed reminder defaults to `on-time` and offers `none`, `5m`, `30m`, `1h`, `1d`, and custom. An all-day reminder defaults to `none` and offers `same-day`, `1d`, `2d`, `3d`, `1w`, and custom. Toggling time on/off recalculates only the default offset when the user has not manually chosen an offset for that reminder.

   Alternative considered: one shared offset list. That is simpler but creates confusing options, such as "准时" when no exact time exists.

6. Extend the platform notification adapter without making native notifications a hard web dependency.

   `platform.notifications` should expose request, schedule, and cancel methods. On web, scheduling can be a no-op that keeps in-app reminders visible. On iOS, Capacitor LocalNotifications can be used after permission. Reminder records should store notification IDs so updates and deletes can cancel stale notifications.

   Alternative considered: only show reminders inside the app. That is acceptable as fallback, but it does not satisfy the mobile expectation once users set an actual reminder time.

## Risks / Trade-offs

- Data migration from legacy single-reminder fields can duplicate reminders if run repeatedly -> Mitigation: normalize through a pure helper that only creates `reminders[]` when the array is missing or empty.
- Local notification permission may be denied -> Mitigation: keep reminders saved in-app and surface notification scheduling as best-effort.
- Candidate card navigation can hide context when many objects are present -> Mitigation: keep dots on the photo and show total/position counters plus trash count.
- Custom offset UI can become too complex -> Mitigation: ship preset offsets first with a simple custom amount/unit selector.
- White selected frame may disappear on bright photos -> Mitigation: use white corners with a subtle shadow only, not a dark full-frame mask.

## Migration Plan

1. Add normalization helpers for candidate review state and reminder arrays.
2. Render candidate cards from non-deleted candidates while preserving existing candidate crop and edit fields.
3. Add trash restore behavior and ensure confirmation filters deleted candidates.
4. Replace reminder date modal behavior with a reminder editor that binds title/date/time/offset/repeat together.
5. Preserve legacy `nextAt/nextTime/nextRepeat/nextLabel` values by converting them into `reminders[]` on load and during confirmation.
6. Extend notification adapter methods and schedule/cancel reminders best-effort after confirmation or reminder updates.
7. Verify iOS simulator flows for upload, select candidate, delete/restore, set multiple reminders, confirm, restart, and reminder list display.

## Open Questions

- Should candidate trash be cleared immediately after confirmation, or remain visible until the next uploaded photo?
- Should expiry dates automatically create a suggested reminder task, or remain separate until the user explicitly adds one?
