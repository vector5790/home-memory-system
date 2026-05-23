## Context

The app is a Capacitor-backed static app whose primary UI is rendered from `app.js` and styled in `styles.css`. The current shell still has a sticky desktop-style topbar with four navigation buttons, a left household-space sidebar, a main panel, and a right insight/reminder column. That arrangement is crowded on the iPhone simulator and makes `AI录入` compete with `照片地图` and `提醒`.

The capture flow already has local recognition, candidate cards, active candidate selection, center markers, crop snapshots, and pointer drag plumbing. However, box correction is still limited and does not yet provide a clear selected-region editing experience or an explicit re-naming pass after the crop changes.

## Goals / Non-Goals

**Goals:**

- Make the mobile app shell use one standalone search row plus a persistent bottom navigation for `照片地图`, `AI录入`, and `提醒`.
- Keep the global search available above every main tab.
- Move household space navigation into the `AI录入` flow as horizontal tabs below search.
- Provide default household space tabs for `客厅`, `厨房`, `阳台`, and `卧室`, while allowing users to add new spaces.
- Move reminder content into the `提醒` tab and household-space/photo-map content into the `照片地图` tab.
- Remove UI copy that implies photo map content will be automatically generated after recognition.
- Make selected subject boxes use a white frame and selected-region highlight.
- Support touch/mouse dragging to reposition and resize the selected subject box.
- Re-run item-name recognition from the adjusted crop when a subject box edit is completed.
- Verify behavior in the iOS simulator.

**Non-Goals:**

- Do not replace the local recognition model, catalog index, or provider selection as part of this change.
- Do not add account sync, backend storage, or server-side recognition.
- Do not redesign reminder task internals beyond moving reminder content into the `提醒` tab.
- Do not make browser testing the primary acceptance surface.

## Decisions

1. Split shell navigation into search, content, and bottom tabs.

   The app root will render the brand/header area separately from a full-width search row. `照片地图`, `AI录入`, and `提醒` become bottom tabs with safe-area padding, fixed touch targets, and active state. The previous `查找` top tab becomes the standalone search row rather than a primary tab.

   Alternative considered: keep `查找` as a fourth bottom tab. That would preserve the current route model, but the user explicitly wants search to stay on the first row independently.

2. Treat household spaces as AI capture context tabs.

   `AI录入` will show a horizontal space tab strip under the search row. The initial spaces remain `客厅`, `厨房`, `阳台`, and `卧室`; adding a space creates a new room record and selects it. Existing place selection remains available inside the capture controls or candidate card when the selected space has storage points.

   Alternative considered: keep the left sidebar globally visible. It works on desktop, but on mobile it costs too much space and duplicates the requested space tabs.

3. Move existing content instead of duplicating it.

   The current reminder list logic should render only when the active bottom tab is `提醒`. The current household-space/photo-map content should render under `照片地图`. Shared helpers such as `renderRoomStage`, `renderStorageStage`, and `renderPlaceSummary` should be reused so saved data stays compatible.

   Alternative considered: build a separate mobile-only view from scratch. That risks creating two inconsistent app experiences and more persistence bugs.

4. Make selected box editing explicit and crop-driven.

   Only the active candidate exposes the white subject frame, highlight overlay, drag surface, and resize handles. Dragging the selected box updates percentage-based geometry during interaction. On pointer release, the app persists the corrected box, regenerates the candidate crop, sets the candidate naming state to in-progress, and runs the existing catalog/embedding naming path against the adjusted crop.

   Alternative considered: let users edit only numeric X/Y/W/H fields. Numeric fields are useful as a fallback, but the requested mobile experience needs direct manipulation on the photo.

5. Keep detector boxes stable unless the user edits them.

   Model-derived subject geometry remains the starting point and must not be replaced by naming. After manual adjustment, only that candidate's box changes. Re-recognition updates the name/category/confidence/crop metadata for that candidate without moving other candidates.

   Alternative considered: re-run full image detection after every box edit. That is slower, can move unrelated subjects, and breaks the trust model the user has been asking for.

6. Use simulator verification as the source of truth.

   Implementation should run `npm run check:web`, `npm run build:web`, `npm run ios:sync`, build/install the iOS app, and test the simulator flow: bottom tabs, space tabs, upload, analyze, select a candidate, drag/resize the box, observe re-naming, and confirm that layout remains usable on iPhone.

   Alternative considered: only run browser smoke tests. The user has explicitly moved validation to the iOS simulator.

## Risks / Trade-offs

- Bottom tabs can cover content on small screens -> Use safe-area padding and bottom content padding.
- Removing the global sidebar can hide storage context -> Keep space tabs visible in `AI录入` and show photo-map hierarchy inside `照片地图`.
- Re-running naming after every tiny drag could feel slow -> Trigger naming only on drag end, debounce repeated edits, and show an in-card naming status.
- White frames may disappear on bright photos -> Use white corners/outline with subtle shadow and a translucent selected-area highlight.
- Resize handles can be hard to hit on iPhone -> Use large invisible hit areas around compact visual handles.
- Existing localStorage may contain non-default room names -> Normalize default spaces without deleting user-created spaces.

## Migration Plan

1. Keep existing `rooms`, `places`, `items`, and `capture` state shape compatible.
2. Add UI-only state for active bottom tab and selected space tab where needed, falling back to existing `activeTab` and `activeRoomId`.
3. Normalize first-run/default rooms to include `客厅`, `厨房`, `阳台`, and `卧室`; preserve any existing user-created rooms.
4. Move layout rendering in stages: shell/search row, bottom tabs, `照片地图`, `AI录入`, then `提醒`.
5. Add selected-box drag/resize controls behind the active candidate state.
6. Add a post-edit naming helper that reuses existing crop generation and catalog/embedding naming code.
7. Verify in the iOS simulator with dense HEIC/JPEG photos and saved local state.

## Open Questions

- Should the standalone search row search globally from every tab, or should it become context-sensitive inside `AI录入`?
- Should newly created spaces appear immediately in `照片地图`, `AI录入`, and future search filters, or only after the user uploads a photo for that space?
