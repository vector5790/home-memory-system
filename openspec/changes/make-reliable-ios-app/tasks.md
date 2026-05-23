## 1. Web Build and Dependency Setup

- [x] 1.1 Add `package.json` and lockfile with scripts for web asset build, iOS sync, iOS open, iOS run, and simulator verification.
- [x] 1.2 Add a lightweight `build:web` script that emits current static assets into the configured Capacitor web directory.
- [x] 1.3 Ensure `index.html`, `app.js`, `styles.css`, `data/`, and required `vendor/` runtime/model files are included or explicitly checked during packaging.
- [x] 1.4 Remove the local browser workflow from default verification docs and scripts.

## 2. Capacitor iOS Shell

- [x] 2.1 Add Capacitor configuration with stable app id, app name, web asset directory, and iOS settings.
- [x] 2.2 Generate and commit the native `ios/` project.
- [x] 2.3 Configure iOS app metadata, icons/splash placeholders, deployment target, and bundle settings needed for simulator/device launch.
- [x] 2.4 Add camera, photo-library, and notification usage descriptions that match Home Memory behavior.
- [x] 2.5 Verify the packaged app launches in iOS simulator without a local Python or Node server.

## 3. Platform Adapter Layer

- [x] 3.1 Add environment detection for web browser versus Capacitor iOS runtime.
- [x] 3.2 Introduce storage, photo, file-url, and notification adapter modules with browser fallbacks.
- [x] 3.3 Route existing `app.js` persistence through the storage adapter without changing the visible capture flow.
- [x] 3.4 Route existing upload/camera entry points through the photo adapter while preserving fallback file input behavior.
- [x] 3.5 Add adapter-level error handling so missing native plugins show recoverable UI messages.

## 4. Durable Local Data and Photo Storage

- [x] 4.1 Define a versioned home data document format for rooms, nested storage points, items, reminders, recognition metadata, and photo references.
- [x] 4.2 Implement app-owned file persistence for normalized photos and thumbnails on iOS.
- [x] 4.3 Replace saved base64 photo blobs in durable records with stable photo IDs or relative file paths.
- [x] 4.4 Add one-time migration from compatible existing `localStorage` snapshots into the new data store.
- [x] 4.5 Handle graph write failures and photo write failures without silently marking broken data as saved.
- [ ] 4.6 Verify app restart restores saved rooms, storage hierarchy, items, reminders, and real photos.

## 5. iOS Photo Capture and Preprocessing

- [x] 5.1 Implement iOS camera capture through the photo adapter and import the result into the current capture screen.
- [x] 5.2 Implement iOS photo-library import through the photo adapter and import the result into the current capture screen.
- [x] 5.3 Normalize large iPhone photos into bounded JPEG derivatives and thumbnails before display, recognition, and persistence.
- [x] 5.4 Preserve existing progress/error UI for large-image decoding, compression, and unsupported formats.
- [ ] 5.5 Verify at least one multi-megabyte iPhone photo can be imported, displayed, analyzed or gracefully rejected, and saved.

## 6. Local Model Assets and Recognition Runtime

- [x] 6.1 Update model asset manifest/build checks so packaged iOS assets include required Transformers.js runtime, WASM, tokenizer, model, and catalog files.
- [x] 6.2 Verify local model assets load from the Capacitor app resource origin or documented app cache path.
- [x] 6.3 Ensure iOS recognition never depends on `/api/recognize`, `localhost`, or embedded API keys.
- [x] 6.4 Preserve detector-first UI behavior on iOS: geometry appears before names when detection returns first.
- [x] 6.5 Add recognition diagnostics for provider name, asset mode, image dimensions, preprocessing time, detection time, naming time, and result count.
- [x] 6.6 Document the fallback behavior when local model assets are unavailable or too slow on device.

## 7. Privacy, Permissions, and Optional Cloud Boundary

- [x] 7.1 Ensure local inventory data and photos remain local by default in iOS builds.
- [x] 7.2 Disable cloud recognition in iOS unless an explicit non-secret endpoint configuration exists.
- [x] 7.3 Add visible provider labeling before any future cloud image recognition request.
- [x] 7.4 Ensure permission denial leaves alternative capture/manual-entry paths usable.

## 8. Verification and Documentation

- [x] 8.1 Add an iOS setup and troubleshooting section to `README.md`.
- [x] 8.2 Add a manual iOS smoke-test checklist covering install, launch, photo import/camera, recognition start, confirmation, restart, search, and saved photo display.
- [x] 8.3 Run syntax/build checks for the web app and web asset packaging.
- [x] 8.4 Run iOS simulator launch verification and record the command/result.
- [x] 8.5 Run physical-device verification when a device is available, or document the exact unverified steps.
- [x] 8.6 Run `openspec validate make-reliable-ios-app --strict`.
