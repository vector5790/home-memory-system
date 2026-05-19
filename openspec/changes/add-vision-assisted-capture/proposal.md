## Why

The current prototype validates the AI capture flow with fixed local candidate data, but it cannot yet prove the core promise: a family can photograph a storage area, let AI draft the inventory, and correct only what matters. Adding a vision-assisted capture path makes the next iteration closer to a real product while preserving the local-first prototype experience.

## What Changes

- Add a vision-assisted capture capability that can create item candidates from an uploaded or camera-captured storage photo.
- Introduce a recognition provider boundary so the prototype can use local/free providers first and optional multimodal APIs later without rewriting the UI flow.
- Prefer downloaded local model assets when available, with a free remote model and local heuristic fallback when not.
- Add a seed household object catalog and optional embedding-index format so detection boxes are named by similarity threshold instead of raw detector labels.
- Render fast local region proposals first, then merge slower small-model detections so the first usable boxes do not wait for model inference.
- Render detected boxes before naming finishes, with a visible naming-in-progress state.
- Start from empty user data: room names may exist, but storage points and items are created by the user or photo recognition.
- Add hierarchical storage points so a room can contain a TV cabinet, the TV cabinet can contain cabinet A, and confirmed items can be found through that full path.
- Let users turn a confirmed object into a lower-level storage point and rescan inside it.
- Allow users to review, select, edit, and reposition candidate item boxes before confirming them into the home inventory.
- Persist confirmed items with room, storage place, container, category, quantity, expiry or maintenance metadata, confidence, and image-relative bounding boxes.
- Improve capture annotations so subject boxes and names remain visible on real photos without looking visually heavy.
- Keep seeded inventory data for local development while ensuring capture candidates are derived from the uploaded photo, not fixed mock objects.

## Capabilities

### New Capabilities

- `vision-assisted-capture`: Covers creating, reviewing, editing, and confirming AI-generated item candidates from storage photos.

### Modified Capabilities

None.

## Impact

- Affected UI: `app.js` capture view, candidate review controls, storage photo stage, and confirmation flow.
- Affected styling: `styles.css` capture stage, candidate boxes, hierarchical place lists, route steps, edit states, and responsive controls.
- Affected data model: capture state, storage-place records, and item records gain clearer provenance for image-based candidates, parent-child storage relationships, and corrected bounding boxes.
- Affected future integration point: a recognition provider interface will isolate local/free image analysis from optional vision/OCR/vector enrichment providers.
