## 1. Mobile App Shell

- [x] 1.1 Refactor `render()` and shell markup so the app has a standalone first-row search control and a mobile content area.
- [x] 1.2 Replace the current primary top navigation with persistent bottom tabs for `照片地图`, `AI录入`, and `提醒`.
- [x] 1.3 Preserve active-tab state when users switch between bottom tabs and when the app re-renders.
- [x] 1.4 Add bottom safe-area spacing so content and actions are not hidden behind the iOS home indicator.

## 2. Search And Space Tabs

- [x] 2.1 Move the search UI into the standalone first row and keep it visible across `照片地图`, `AI录入`, and `提醒`.
- [x] 2.2 Render `客厅`, `厨房`, `阳台`, and `卧室` as the default AI capture space tabs below the search row.
- [x] 2.3 Wire space-tab selection to `activeRoomId`, capture room, upload, recognition, and confirmation context.
- [x] 2.4 Add a compact create-space control that creates a new room tab and prevents duplicate normalized names.
- [x] 2.5 Ensure user-created spaces appear in both `AI录入` space tabs and `照片地图`.

## 3. Content Relocation

- [x] 3.1 Move household-space browsing and photo-map hierarchy under the `照片地图` tab.
- [x] 3.2 Remove the desktop household-space sidebar from the mobile primary layout.
- [x] 3.3 Move `今日提醒` and reminder list content into the `提醒` tab.
- [x] 3.4 Remove persistent reminder/insight side content from `照片地图` and `AI录入`.
- [x] 3.5 Replace empty-state copy that promises automatic photo generation with neutral upload/add guidance.

## 4. Selected Subject Frame Styling

- [x] 4.1 Update selected subject frame styling so active boxes use a white frame.
- [x] 4.2 Add a subtle selected-region highlight inside the active subject box without obscuring the photo.
- [x] 4.3 Keep non-selected candidates marker-only with no full box or label.
- [x] 4.4 Verify the selected frame stays readable on bright and dark real photos.

## 5. Box Drag And Resize

- [x] 5.1 Extend candidate drag state to distinguish move, resize, and idle operations.
- [x] 5.2 Allow users to drag the active subject box to reposition it on the photo.
- [x] 5.3 Add touch-friendly resize handles or equivalent direct controls for the active subject box.
- [x] 5.4 Clamp moved/resized boxes within photo bounds and enforce minimum usable width and height.
- [x] 5.5 Persist adjusted image-relative box geometry to candidate state and local storage.
- [x] 5.6 Keep numeric box fields in sync with direct drag/resize edits.

## 6. Re-Recognition After Box Edits

- [x] 6.1 Regenerate the active candidate crop after a move or resize completes.
- [x] 6.2 Add a candidate-level naming-in-progress state for post-edit re-recognition.
- [x] 6.3 Re-run item-name recognition against the adjusted crop using the existing catalog/embedding path.
- [x] 6.4 Apply updated name, category, confidence, source, and crop metadata only to the edited candidate.
- [x] 6.5 Preserve manual box geometry and editable candidate state if re-recognition fails.
- [x] 6.6 Ensure confirmed items use adjusted box geometry for photo-map and search-result highlighting.

## 7. Verification

- [x] 7.1 Run `npm run check:web`.
- [x] 7.2 Run `npm run build:web`.
- [x] 7.3 Run `npm run ios:sync`.
- [x] 7.4 Build and install the iOS app into the simulator.
- [x] 7.5 Verify simulator navigation: standalone search row, bottom tabs, AI space tabs, add-space flow, photo-map content, and reminder tab.
- [x] 7.6 Verify simulator recognition: upload a dense photo, analyze, select a subject, drag/resize the white frame, observe re-recognition, and confirm the edited item.
