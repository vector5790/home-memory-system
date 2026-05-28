## 1. Source Layout and Build Wiring

- [x] 1.1 Create the `src/` frontend module tree with `config/`, `domain/`, `store/`, `platform/`, `vision/`, `ui/`, and `main.js`.
- [x] 1.2 Update `index.html` and the static web build so the app loads `src/main.js` and packages the full `src/` tree for iOS.
- [x] 1.3 Keep any temporary compatibility imports documented while `app.js` is being reduced, then remove them before completion.

## 2. Domain Extraction

- [x] 2.1 Move constants and configuration that are not DOM-specific into `src/config/` modules.
- [x] 2.2 Extract room, storage-place, item, candidate, reminder, date, and search normalization helpers into `src/domain/`.
- [x] 2.3 Add a non-browser validation path for domain modules that proves they can run without DOM or storage primitives.

## 3. Local Store Boundary

- [x] 3.1 Implement a `src/store/` service boundary for initial load, snapshot save, native hydration, pending-write flush, photo persistence, and local clear operations.
- [x] 3.2 Move graph serialization, photo-reference serialization, and durable write error handling out of UI rendering and event code.
- [x] 3.3 Add store smoke validation for save, load, normalization, flush failure, and missing-photo recovery behavior.

## 4. Platform and Runtime Boundaries

- [x] 4.1 Move or wrap the existing platform adapter behind `src/platform/` while preserving current web and iOS behavior.
- [x] 4.2 Ensure packaged iOS startup does not require `server.py`, `server.mjs`, localhost endpoints, or remote model/runtime downloads.
- [x] 4.3 Preserve future Android capability names in the platform boundary without generating or validating an Android project.

## 5. Vision Provider Extraction

- [x] 5.1 Extract image preprocessing, model runtime loading, detector selection, catalog matching, diagnostics, and fallback proposal logic into `src/vision/`.
- [x] 5.2 Expose a high-level local recognition provider API for the app controller and UI actions.
- [x] 5.3 Keep optional remote recognition behind a provider boundary, with no remote provider configured for the iOS MVP.

## 6. UI and App Entrypoint Reduction

- [x] 6.1 Extract DOM rendering for capture, map, search, reminders, candidate review, and inventory views into `src/ui/`.
- [x] 6.2 Extract DOM event binding into UI/action modules that call explicit controller actions instead of mutating unrelated globals.
- [x] 6.3 Reduce `app.js` or its replacement entrypoint to startup, dependency composition, and high-level orchestration under the configured size threshold.

## 7. Architecture Validation and Documentation

- [x] 7.1 Add an architecture validation command that checks entrypoint size, disallowed cross-layer imports, and module boundary rules.
- [x] 7.2 Add mobile package validation for required local iOS assets and absence of dev-server runtime dependencies.
- [x] 7.3 Document module ownership, allowed dependency direction, iOS local-only runtime assumptions, optional remote-provider boundary, and deferred Android implementation.

## 8. Verification

- [x] 8.1 Run the existing web checks and static build validation after the refactor.
- [x] 8.2 Run iOS sync/package validation and confirm local model assets are present in the packaged output.
- [x] 8.3 Launch the iOS simulator and smoke-test capture/import, recognition fallback, candidate confirmation, reminders, search, persistence after restart, and missing-photo handling.
- [x] 8.4 Confirm the architecture validation command fails on intentional boundary violations and passes on the final implementation.
