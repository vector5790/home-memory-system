## Context

The current app is a zero-dependency static prototype served by `server.mjs` or `server.py`. All product state lives in `app.js`, persists through `localStorage`, and uses seeded rooms, storage places, and items to demonstrate search, photo maps, capture, and reminders.

The existing capture flow already supports upload, camera capture, candidate editing, and confirmation into inventory. The next development step is to turn the earlier mock-only candidate flow into a free-first recognition boundary while keeping the prototype easy to run locally and safe for privacy-focused demos.

## Goals / Non-Goals

**Goals:**

- Define a recognition provider boundary that accepts a storage photo context and returns normalized item candidates.
- Use free local image analysis for uploaded photos before any paid or cloud provider.
- Do not show fixed mock capture candidates before a photo is uploaded or when image analysis fails.
- Make recognition asynchronous so local small models or optional cloud APIs can be added without changing the capture UX.
- Let users correct candidate names, categories, expiry dates, containers, quantities, and image-relative bounding boxes before confirmation.
- Preserve corrected candidate metadata when confirmed items are added to inventory.

**Non-Goals:**

- Do not make a paid or cloud vision API the default path in this change.
- Do not add authentication, household accounts, server-side storage, or cloud sync.
- Do not replace the current CSS-drawn room and storage map system with real photo management.
- Do not introduce a bundler, framework, or package dependency unless the implementation proves impossible without it.

## Decisions

1. Use an async recognition provider function inside `app.js`.

   The capture flow will call a single function such as `recognizeStorageImage(captureContext)`. The function returns candidates in the same normalized shape the UI consumes. The first implementation refuses to analyze without an uploaded or captured image, then tries local Transformers.js assets from `vendor/`, falls back to a free browser-loaded small model, and finally falls back to browser-local Canvas region proposals. Detection is separated from naming so boxes can render immediately while names resolve. A later implementation can add manually triggered cloud fallback.

   Alternative considered: call provider-specific code directly from the click handler. That would be faster to write but would mix UI state, provider details, and future API concerns.

2. Keep candidate data image-relative and percentage-based.

   Candidate `box` values will remain `{ x, y, w, h }` percentages relative to the capture stage. This matches existing photo-map rendering, survives responsive resizing, and is compatible with typical vision API bounding boxes after normalization.

   Alternative considered: store pixel boxes. Pixel coordinates are closer to raw model output but require more migration when images render at different sizes.

3. Add an active candidate editing state rather than a separate edit screen.

   The capture stage should support selecting a candidate box and adjusting it in place. The side panel remains the source of textual metadata edits. This keeps the workflow close to the current prototype: photograph, review, correct, confirm.

   Alternative considered: open a modal per candidate. That would be heavier and less useful for comparing the candidate against the photo map.

4. Preserve offline and free behavior by default.

   Uploaded images use local image analysis by default and must not silently fall back to fixed mock candidates. If a paid provider is introduced later, provider errors should leave the user in the same capture flow with a visible failure message and no inventory mutation.

   Alternative considered: require a configured external API before recognition can run. That conflicts with the prototype's local-first, free-first, and demo-friendly constraints.

5. Separate detection from naming.

   Object detection produces image-relative candidate boxes. Naming then checks a seed catalog of common household objects and an optional flat cosine embedding index. The slow CLIP-per-crop classifier is not part of the default path; it is kept as a future fallback behind an index so the UI can show boxes quickly. Regions below the similarity threshold use neutral names such as `物品A`, leaving the user in control.

   Alternative considered: directly translate the detector label into a Chinese item name. That is fast, but it caused false names such as generic boxes being shown as `收纳盒`.

6. Prefer Grounding DINO and use SAM only as a refinement layer.

   The open-vocabulary detector is responsible for subject recall and visible geometry. OWL-ViT remains the fallback detector because it is already smaller and available in the prototype. SlimSAM is optional and only tightens candidate regions after detection; if it cannot load or cannot produce a plausible mask, the detector box remains unchanged. This avoids replacing real detector output with fabricated or unstable boxes.

7. Start from an empty household map.

   The app should keep common room names to make the first screen understandable, but it should not seed storage points or item inventory. A successful room-photo recognition can create the first photo-based storage point automatically; users can also add spaces or storage points manually.

8. Use Canvas region proposals only as explicit fallback.

   Canvas-based region proposals are cheap enough to run after an image is loaded, but they are no longer shown before the detector because that made the first visible boxes feel fake. The capture flow waits for model-derived detection first and only shows local region proposals when the detector is unavailable or returns no regions.

   Alternative considered: render region proposals immediately and merge later. That feels faster, but it visually replaces boxes and undermines trust in detection.

9. Represent storage points as a hierarchy.

   A storage point may have a `parentId` pointing to another storage point in the same room. Room-level maps show root storage points; storage-stage views show direct child storage points and direct items. Search results build a path from the room through every storage point to the final item, enabling guidance such as `客厅 > 电视柜 > 柜子A > 阿莫西林`.

   Alternative considered: keep all storage points flat and encode hierarchy in names. That is simpler, but it cannot reliably answer “where inside the cabinet” or guide rescans into lower-level spaces.

## Risks / Trade-offs

- Recognition boundary remains in `app.js` → Mitigation: keep it small, named, async, and isolated so it can be moved behind `server.mjs` later.
- Drag or resize interactions can become fragile on mobile → Mitigation: start with simple pointer-based repositioning plus numeric step controls if needed, and verify desktop and mobile viewports.
- Data URLs in `localStorage` can grow large after photo upload → Mitigation: continue treating this as a prototype behavior and avoid storing multiple historical images in this change.
- Heuristic local region proposals can create false confidence about model quality → Mitigation: label provider output as candidate data and require user confirmation before inventory mutation.
- Downloaded local models can be large → Mitigation: keep the downloader explicit and let the app fall back when assets are absent.
- More detection labels can slow OWL-ViT → Mitigation: avoid per-crop classifier calls by default and render detection results before naming completes.
- Hierarchical places add migration complexity for saved `localStorage` snapshots → Mitigation: normalize older flat places with `parentId: null` when loading state.

## Migration Plan

No data migration is required. Existing `localStorage` snapshots should continue to load because the new fields are additive and the seed state remains the fallback. Resetting demo data will continue to restore the seeded prototype.

## Open Questions

- Which image search source should build the first full household object gallery?
- Should future OCR-derived expiry dates and quantities be marked separately from object-detection-derived fields?
- Should households be able to disable image persistence while still saving confirmed item metadata?
