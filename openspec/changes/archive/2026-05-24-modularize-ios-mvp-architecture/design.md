## Context

The current iOS MVP is functionally local-first, but most of the application still lives in `app.js`. That file owns state hydration, data normalization, room/place/item operations, image decoding, HEIC conversion, Transformers.js runtime loading, detector orchestration, candidate naming, rendering, event delegation, camera handling, and reminder logic. This kept the prototype moving quickly, but it makes every future change high-risk because unrelated concerns share the same module scope and global state.

The product direction remains iOS-first for the MVP. Android is intentionally not implemented in this change, and remote services remain optional future providers. The goal is to make those future paths cheaper by creating clear local module boundaries now.

## Goals / Non-Goals

**Goals:**

- Reduce `app.js` to a small bootstrap/orchestration entrypoint instead of the main implementation container.
- Move domain logic, persistence, platform adapters, vision/image processing, rendering, and event binding into explicit modules with narrow imports.
- Preserve existing iOS MVP behavior while changing structure: local photo capture/import, OWL-ViT-first recognition, fallback candidate generation, candidate review, reminders, search, and packaged local model loading.
- Make local data save/load/flush behavior testable without rendering the UI.
- Make development-only servers visibly separate from packaged mobile runtime behavior.
- Add lightweight architecture checks so new changes do not reintroduce a large frontend monolith.

**Non-Goals:**

- Do not implement Android, create an `android/` project, or add Android-specific build scripts in this change.
- Do not add cloud recognition, accounts, sync, or API keys.
- Do not rewrite the UI in SwiftUI, React, or another framework.
- Do not replace the local data store with SQLite unless extraction reveals the current adapter cannot meet the testable contract.
- Do not change the visual design or product workflow beyond what is necessary to preserve behavior after extraction.

## Decisions

1. Split by ownership, not by file size.

   The new frontend layout should reflect responsibility boundaries:

   ```text
   src/
     main.js
     config/
     domain/
     store/
     platform/
     vision/
     ui/
   ```

   `main.js` wires modules together. `domain/` owns rooms, places, items, reminders, candidates, dates, and search matching. `store/` owns snapshot creation, persistence, migration, and photo reference handling. `platform/` owns Capacitor/web adapters. `vision/` owns image preprocessing, model runtime, detectors, catalog matching, caching, and fallback proposals. `ui/` owns rendering and DOM event binding.

   Alternative considered: split `app.js` into arbitrary chunks such as `app-part-1.js`. That would reduce line count but preserve hidden coupling. The module layout must make ownership visible.

2. Use plain ES modules and the existing static build path.

   The app already uses browser-native module loading. This change should avoid introducing Vite, React, TypeScript, or a bundler. `scripts/build-web.mjs` can copy the `src/` tree alongside `index.html`, data, styles, and vendor assets. This keeps the iOS packaging model simple and avoids a framework migration while the app is still validating product behavior.

   Alternative considered: adopt a framework immediately. That may help later, but it would mix architectural extraction with a UI rewrite and make behavior preservation harder.

3. Keep a central state object for now, but remove direct global mutation from low-level modules.

   A full state-management rewrite is out of scope. The extracted modules can still operate on a single app state object, but domain and vision modules should be pure or mostly pure where practical. UI event handlers and the app controller should be the primary places that mutate state and trigger persistence/rendering.

   Alternative considered: introduce Redux/Zustand-style state management. That is heavier than needed for this MVP and would distract from separating current responsibilities.

4. Treat local persistence as a service boundary.

   Persistence should expose functions such as `loadInitialState`, `hydrateNativeState`, `saveSnapshot`, `flushPendingWrites`, `persistPhotoDataUrl`, and `clearSnapshot`. UI code should not know whether the implementation uses localStorage, Capacitor Preferences, Filesystem, JSON files, or a future SQLite adapter. Write failures must remain observable.

   Alternative considered: leave persistence in `platform.js`. Platform adapters should expose primitives, but app-level snapshot rules belong in the store layer.

5. Make vision providers replaceable while keeping local-only defaults.

   The vision layer should expose a high-level recognition function that selects the configured local detector, prepares images, returns normalized candidates, and reports diagnostics. The UI should not import Transformers.js runtime helpers, detector classes, or model manifest logic directly. Native builds must not allow remote model/runtime downloads unless a future explicit configuration says so.

   Alternative considered: keep detector selection in the capture click handler. That preserves current coupling and makes future native ML or cloud provider tests harder.

6. Keep development servers as tooling, not architecture.

   `server.py` and `server.mjs` can remain for local browser development and optional development API experiments, but mobile code and docs must make clear that iOS packaging does not depend on them. Any future cloud provider should enter through a provider boundary, not through ad hoc localhost assumptions.

   Alternative considered: delete the servers now. They still help with local debugging and HEIC conversion during browser development, so deletion is unnecessary for this architecture pass.

7. Define measurable architecture checks.

   The change should add a small script or documented command that checks module boundaries and file-size thresholds. The exact threshold can be conservative, but `app.js`/`src/main.js` must no longer be thousands of lines. The check should fail if source modules import from disallowed layers or if the bootstrap file grows into another monolith.

   Alternative considered: rely on review discipline only. The current monolith shows that review discipline is not enough once prototype pressure returns.

## Risks / Trade-offs

- Behavior regressions during extraction → Mitigation: extract in small vertical slices, run `npm run check:web`, `npm run build:web`, `npm run ios:sync`, and simulator smoke checks after meaningful moves.
- Circular imports between domain, UI, and vision modules → Mitigation: define import direction rules and keep `main.js` as the composition root.
- Local model path breakage after moving modules → Mitigation: keep public asset URLs rooted at `/vendor/` and verify packaged `ios/App/App/public/vendor/vision-manifest.json`.
- Over-abstraction before product shape stabilizes → Mitigation: extract existing functions with minimal API design; do not introduce generic frameworks or plugin systems beyond current needs.
- Large generated/vendor assets make build checks slow → Mitigation: architecture checks should inspect source files and manifests, not scan model binaries deeply.
- Existing OpenSpec changes remain in progress → Mitigation: this change should not alter the remaining iOS device verification tasks; it should make them easier to run and reason about.

## Migration Plan

1. Add the target `src/` module structure and move `platform.js` into or behind the new platform boundary while keeping the existing import path working temporarily if needed.
2. Extract configuration/constants and domain normalization/search/reminder helpers from `app.js` without changing behavior.
3. Extract local data-store and photo persistence functions, then add direct tests or node-checkable smoke scripts for save/load/flush behavior.
4. Extract image preprocessing and vision runtime/detector orchestration, preserving the same provider labels and diagnostics.
5. Extract rendering and event binding into UI modules, leaving `main.js` as the composition root.
6. Update build packaging to copy the new source tree and update `index.html` to load the new entrypoint.
7. Add architecture validation checks and update README/smoke-test docs.
8. Run syntax/build/iOS sync validation and a simulator launch smoke check.

Rollback is straightforward because this is a structural refactor: keep the current committed branch as the baseline and revert the refactor commit if packaging or simulator launch regresses.

## Open Questions

- What file-size threshold should the architecture check enforce for the bootstrap and individual modules?
- Should the local data-store boundary remain JSON/Preferences for this change or move to app-owned JSON files immediately?
- Should browser development continue to support `/api/recognize`, or should cloud experiments be documented as a separate future provider only?
