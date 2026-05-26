## Why

The current repository is a browser-first prototype, but the product promise depends on repeated real-home use from a phone: capture storage photos, recognize objects, save corrected locations, and find items later without fragile demo state. Turning the repository into a reliable iOS app creates the mobile foundation needed for real household testing while preserving the local-first and free-first recognition strategy.

## What Changes

- Add an iOS app shell using a maintained Web-to-native bridge so the current web UI can run inside a real iOS project without a full Swift rewrite.
- Add a repeatable build and run workflow for local browser development, iOS simulator, and iOS device testing.
- Package app assets, static files, and downloaded local model assets in a way that works without a local Python or Node server.
- Replace prototype-only persistence assumptions with a mobile-safe storage boundary for home graph data, captured photos, thumbnails, and recognition metadata.
- Add native-friendly camera and photo-library capture paths so large real iPhone photos can be imported, compressed, displayed, and analyzed predictably.
- Keep recognition free-first: local browser/native assets first, optional cloud fallback only when explicitly configured.
- Add iOS permission strings, app metadata, and privacy-oriented behavior for camera, photos, notifications, and local files.
- Add smoke tests and manual QA instructions that prove the app can install, launch, capture or upload a photo, run recognition, save inventory, restart, and recover saved data.
- Keep the existing static web prototype runnable during migration so web iteration remains fast.

## Capabilities

### New Capabilities

- `ios-app-shell`: Covers the native iOS project, app boot, packaged web assets, permissions, build workflow, and simulator/device smoke checks.
- `ios-local-data`: Covers durable local persistence for rooms, storage hierarchy, items, photos, thumbnails, and migration away from fragile browser-only state.
- `ios-vision-capture`: Covers iOS camera/photo ingestion, large-image preprocessing, local model asset loading, recognition lifecycle, and optional cloud fallback boundaries.

### Modified Capabilities

None.

## Impact

- Affected repository structure: add package/build configuration, native iOS project files, generated web output handling, and mobile test documentation.
- Affected frontend: introduce platform/storage/capture adapters while keeping the current UI and static web development path working.
- Affected data model: move image-heavy persistence out of `localStorage` into a durable file/database boundary and retain compatibility for existing prototype snapshots where practical.
- Affected runtime: local model assets must load from packaged app resources or a documented first-run download/cache path instead of relying on a localhost server.
- Affected privacy and permissions: add iOS usage descriptions and ensure photos, recognition data, and inventory remain local unless a user explicitly enables a cloud provider.
