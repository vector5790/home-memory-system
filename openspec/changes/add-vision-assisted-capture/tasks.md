## 1. Recognition Boundary

- [x] 1.1 Add an async recognition provider function in `app.js` that accepts the current capture context and returns normalized candidates.
- [x] 1.2 Remove fixed `candidateProfiles` from the capture path so candidates come from uploaded-photo analysis.
- [x] 1.3 Add provider result validation and empty-result handling before updating capture state.
- [x] 1.4 Update the scan action to await the provider and show loading, success, empty, and failure feedback.

## 2. Candidate Data Model

- [x] 2.1 Extend capture state with active candidate, recognition status, and provider error fields.
- [x] 2.2 Normalize candidate fields for name, category, quantity, expiry date, maintenance date, maintenance label, container, confidence, selection, and bounding box.
- [x] 2.3 Preserve user-edited candidate metadata and corrected boxes across re-renders.
- [x] 2.4 Ensure changing room, changing storage place, resetting data, or loading a new image clears stale recognition state.

## 3. Candidate Review UI

- [x] 3.1 Add quantity, maintenance date, and maintenance label controls to each candidate row.
- [x] 3.2 Add an active candidate state so selecting a stage box highlights the matching review row and vice versa.
- [x] 3.3 Surface recognition provider status in the capture view without blocking existing upload and camera controls.
- [x] 3.4 Keep selected and unselected candidates visible with distinct visual states.

## 4. Bounding Box Correction

- [x] 4.1 Implement pointer-based repositioning for the active candidate box inside the capture stage.
- [x] 4.2 Clamp corrected candidate boxes to the capture stage bounds.
- [x] 4.3 Add accessible nudge controls or equivalent numeric controls for fine adjustment.
- [x] 4.4 Confirm that corrected percentage-based boxes render consistently across desktop and mobile widths.

## 5. Confirmation and Persistence

- [x] 5.1 Update candidate confirmation to persist corrected boxes and all edited metadata into inventory items.
- [x] 5.2 Keep duplicate prevention scoped to normalized item name plus storage place.
- [x] 5.3 Ensure provider failures and empty results never mutate confirmed inventory.
- [x] 5.4 Verify existing search, photo-map highlighting, reminder, reset, upload, and camera flows still work.

## 6. Validation

- [x] 6.1 Run the app locally and test upload recognition, candidate editing, box correction, confirmation, duplicate prevention, and reset.
- [x] 6.2 Use iOS simulator verification for mobile capture layouts.
- [x] 6.3 Run OpenSpec validation for `add-vision-assisted-capture`.

## 7. Local Model and Catalog Index

- [x] 7.1 Add a local model asset manifest and downloader for free browser models.
- [x] 7.2 Add a 10-item household vision catalog and optional embedding index format.
- [x] 7.3 Make recognition prefer local model assets, then remote free model, then Canvas region proposals.
- [x] 7.4 Use catalog or embedding-threshold matching for candidate names and neutral placeholders for unmatched regions.

## 8. Progressive Scene Labeling and Empty Bootstrap

- [x] 8.1 Split capture analysis into detection and naming phases so boxes render before names finish.
- [x] 8.2 Add naming-in-progress animation for stage labels and candidate rows.
- [x] 8.3 Remove seeded storage points and inventory items from first-launch state.
- [x] 8.4 Add manual space and storage-point creation.
- [x] 8.5 Expand the seed scene catalog for living-room labels such as TV, speakers, amplifier, remote, cabinet, lamp, ornament, and pillow.

## 9. Fast Recognition and Nested Storage

- [x] 9.1 Render Canvas region proposals before waiting for small-model detections, then merge slower detections with preserved user edits.
- [x] 9.2 Normalize storage places with `parentId` and render room storage points as a hierarchy.
- [x] 9.3 Add child storage-point creation and a "photograph inside" flow from confirmed objects.
- [x] 9.4 Update search and photo-map guidance to show full nested paths.
- [x] 9.5 Improve capture subject-box styling for readable, simple annotations on real photos.
- [x] 9.6 Verify recognition, hierarchy creation, nested search guidance, and annotation rendering in the iOS simulator.

## 10. Stable Detection and Candidate Drill-In

- [x] 10.1 Change recognition so visible subject geometry comes from the detector first; local region proposals are fallback only.
- [x] 10.2 Normalize unresolved candidate names into sequential placeholders such as `物品A`, `物品B`, `物品C`.
- [x] 10.3 Replace default full-box overlays with center-point and connected-label annotations, showing the full box only for the active candidate.
- [x] 10.4 Expand household detection labels for cabinets, drawers, doors, shelves, and compartments.
- [x] 10.5 Add a candidate-level "photograph inside" flow that creates a child storage point before confirmation.
- [x] 10.6 Verify stable detection, placeholder order, point annotation, cabinet/drawer labels, and candidate drill-in.

## 11. Grounded Recall, Segmentation, and Dense Photo UX

- [x] 11.1 Use OWL-ViT as the preferred fast local open-vocabulary detector, with Grounding DINO kept as an optional slow fallback.
- [x] 11.2 Add optional SlimSAM/SAM region refinement that never replaces detector geometry on failure.
- [x] 11.3 Add high-resolution upload and camera-frame preprocessing before persistence and recognition.
- [x] 11.4 Improve dense annotation layout with label collision avoidance and longer point-to-label connectors.
- [x] 11.5 Update model asset download instructions and verify syntax, OpenSpec, upload handling, and annotation rendering.
