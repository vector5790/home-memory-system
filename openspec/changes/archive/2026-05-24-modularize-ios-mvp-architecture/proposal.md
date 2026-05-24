## Why

The iOS MVP now runs locally and avoids remote recognition by default, but the implementation is still concentrated in a 5,000+ line `app.js` that mixes state, domain rules, vision pipelines, rendering, and event handling. This makes the next round of mobile reliability work risky: fixing persistence, validating restart recovery, adding optional cloud providers, or later adding Android would all touch the same large surface.

This change creates a focused architecture-hardening track before more product features are added. Android remains out of scope for implementation, but the refactor must preserve clean extension points for future Android and remote-service providers.

## What Changes

- Split the current `app.js` single-file frontend into explicit modules for app bootstrap, domain/data normalization, persistence, platform adapters, vision/image processing, rendering, and event handling.
- Define a stable local data-store boundary for the iOS MVP so graph state and photo references can be saved, flushed, restored, and tested without UI code reaching into storage details.
- Keep development-only server code isolated from the mobile runtime path so iOS packaging and validation do not rely on Python/Node servers.
- Add architecture-level checks that prevent the frontend from collapsing back into one large module and verify that native builds do not use remote model/runtime resources unless explicitly configured.
- Preserve existing iOS MVP behavior during the refactor: local-first capture, OWL-ViT-first recognition, local fallback candidates, manual confirmation, reminders, search, and photo maps.
- Leave Android implementation out of scope while retaining platform adapter naming and seams that can support Android later.

## Capabilities

### New Capabilities

- `frontend-module-boundaries`: Covers the expected module layout, ownership rules, and public interfaces after splitting the current app monolith.
- `local-data-store-boundary`: Covers durable local graph/photo persistence contracts, reload behavior, and storage failure handling independent of UI rendering.
- `mobile-runtime-boundary`: Covers the separation between packaged iOS runtime, development-only servers, optional cloud services, and future Android extension points.
- `architecture-validation`: Covers automated checks and smoke validation that keep the architecture healthy after the refactor.

### Modified Capabilities

None.

## Impact

- Affected frontend files: `app.js` will shrink into a bootstrap/orchestration entrypoint, with new modules under a dedicated source directory.
- Affected platform layer: `platform.js` may move or become part of a platform module while keeping the same web/iOS behavior.
- Affected persistence: storage and photo-reference logic will move behind a local data-store boundary with testable load/save/flush behavior.
- Affected vision code: local model runtime, detector selection, image preprocessing, catalog matching, and heuristic fallback will move out of UI rendering code.
- Affected build scripts: static packaging must include the new module tree and continue to fail fast when required local model assets are missing.
- Affected documentation: README and smoke-test docs should describe the iOS MVP architecture, development server role, and future Android/remote-service boundaries.
