## Context

The app is currently a Capacitor iOS shell that packages the static Home Memory UI. The product logic, UI state, capture flow, object recognition orchestration, and local persistence are concentrated in `app.js`. The latest capture implementation is local-first: it tries downloaded Transformers.js assets from `vendor/`, uses Grounding DINO/OWL-ViT/SlimSAM/CLIP when available, and only treats cloud recognition as an optional API path.

This is a good starting point for iOS because the UI already runs in a WebView runtime, but it is not yet a reliable mobile app. The earlier prototype assumed a localhost server, stored large image data in `localStorage` when space allowed, depended on desktop upload/camera behavior, and lacked a native iOS project, build workflow, permission configuration, or device-level persistence boundary.

## Goals / Non-Goals

**Goals:**

- Create a real iOS project that can be opened in Xcode, run in the simulator, and installed on a device.
- Keep the web asset build boundary needed by Capacitor while making simulator/device verification the default.
- Package the current UI and local model assets so the app can boot without Python, Node, or a development server.
- Introduce platform adapters for storage, photo capture/import, file URLs, and optional native capabilities.
- Move photos and image-heavy state out of `localStorage` into durable app file storage.
- Preserve a free-first recognition path and make any cloud provider explicit and optional.
- Add a repeatable smoke-test checklist for launch, upload/camera, recognition, confirmation, restart, search, and saved data recovery.

**Non-Goals:**

- Do not rewrite the UI in SwiftUI in this change.
- Do not add user accounts, cloud sync, family sharing, or production backend storage.
- Do not make a paid vision API the default recognition path.
- Do not promise App Store submission in the first implementation; the target is a reliable local/TestFlight-ready iOS app foundation.
- Do not replace the current recognition models with Core ML unless WKWebView/Transformers.js device testing proves the web runtime is not viable.

## Decisions

1. Use Capacitor as the iOS bridge for the first app foundation.

   Capacitor provides a maintained iOS runtime around WKWebView, Xcode project management, and JavaScript-to-native plugin access. This matches the current static web implementation and avoids a costly SwiftUI rewrite before the product flow is proven on real homes. The iOS project will live under `ios/`, with `capacitor.config.*` pointing at a generated static web directory.

   Alternative considered: build a SwiftUI app immediately. That may be the long-term best native experience, but it would duplicate the current UI and slow down validation. Alternative considered: ship a PWA only. That avoids native setup but does not give enough control over camera, files, notifications, model assets, or TestFlight distribution.

2. Add a lightweight web build boundary before adding native code.

   The repository should gain a `package.json` with scripts such as `build:web`, `ios:sync`, `ios:open`, `ios:run`, and `test:simulator`. The initial `build:web` can copy `index.html`, `app.js`, `styles.css`, `data/`, and selected `vendor/` assets into a Capacitor `webDir` without introducing a framework. This keeps the static implementation simple while giving iOS a stable packaged asset root.

   Alternative considered: introduce Vite/React immediately. That can help later, but the current UI is already a working single-file app; adding a bundler and framework now would increase migration risk without solving the iOS reliability problem by itself.

3. Introduce platform adapters instead of scattering Capacitor calls through UI code.

   `app.js` should call small adapter modules for storage, photos, file URL conversion, notifications, and environment detection. The iOS implementation can use Capacitor plugins behind the adapter while the UI continues to work with normalized app data. Web fallbacks may remain for development safety, but they are not the acceptance-test path.

   Alternative considered: directly import Capacitor plugins in capture and persistence handlers. That is faster initially, but it would make the web prototype harder to run and would make later Swift/Core ML migration messier.

4. Store graph data and photos separately.

   Home graph data should be stored as a versioned JSON document at first, with a migration path to SQLite when query volume grows. Captured photos, thumbnails, and cropped candidate images should be stored as files under app data directories and referenced from graph records by stable IDs and relative paths. The UI can keep short-lived object URLs or display URLs, but saved state must not depend on base64 image blobs in `localStorage`.

   Alternative considered: use only `localStorage`/WKWebView storage. That is fragile for large photos and can be cleared by WebKit under storage pressure. Alternative considered: adopt SQLite immediately. SQLite is likely right later, but a versioned file store is enough for the first reliable device build if writes are transactional and tested.

5. Treat iPhone photos as large source files that need a managed preprocessing pipeline.

   Camera and library imports should produce a normalized JPEG derivative and a smaller thumbnail before recognition or persistence. The pipeline should preserve enough resolution for object detection, cap memory use, handle common iOS formats such as HEIC when the platform can decode them, and show progress/error states instead of appearing frozen.

   Alternative considered: continue using a browser file input only. It is acceptable on desktop, but it does not give enough control over real iPhone camera behavior, EXIF orientation, large file memory pressure, or app-file persistence.

6. Package local model assets first, then consider first-run download only if bundle size becomes unacceptable.

   The current free-first strategy depends on `vendor/` assets. The first implementation should make packaged assets work in the iOS WebView and verify that model files, WASM runtime files, JSON manifests, and tokenizer assets load from the app bundle. If the final app becomes too large, the same manifest can drive a first-run download/cache flow.

   Alternative considered: always download models on first launch. That reduces app size, but it makes the first real test depend on network quality and adds failure modes before the core flow is proven.

7. Keep cloud recognition outside the app shell by default.

   The current `/api/recognize` path is a development convenience, not an iOS runtime dependency. The iOS app should not embed API keys. If cloud fallback is enabled later, it must call a real backend endpoint configured per environment and show an explicit provider label and privacy choice.

   Alternative considered: store an API key in the app bundle. That is not acceptable because bundled keys can be extracted and would break the local-first privacy promise.

8. Use iOS permissions and privacy copy as product surfaces, not boilerplate.

   The app must include camera, photo library, and notification usage descriptions that match actual behavior. Permission prompts should be preceded or followed by clear in-app state, and denial should leave upload/manual entry paths usable. Local-only operation should be the default privacy posture.

   Alternative considered: request every permission at first launch. That creates distrust and makes debugging harder; permissions should be requested when the user enters the relevant workflow.

9. Define "reliable iOS app" through smoke tests.

   A build is not acceptable just because Xcode opens. The change is complete only when the app can launch on simulator, launch on a physical iPhone when available, import a large photo, show it, run the recognition lifecycle or a clear local-model fallback, confirm inventory, restart, search for the saved item, and show the saved photo path.

## Risks / Trade-offs

- WKWebView model inference may be slow or memory-constrained on older iPhones → Mitigation: benchmark the current models on device, preload only when needed, cap image size, and keep a future Core ML provider boundary.
- Packaged model assets may make the app bundle large → Mitigation: start with the smallest verified asset set, document bundle size, and preserve the manifest for a first-run cache strategy.
- Capacitor plugin behavior can diverge from desktop behavior → Mitigation: keep adapter boundaries and run simulator/device smoke checks before considering the change complete.
- JSON file storage can become less efficient as households grow → Mitigation: version the storage API so SQLite can replace the implementation without changing UI records.
- iOS photo formats and orientation can produce confusing results → Mitigation: normalize imports into app-owned JPEG derivatives and verify with real iPhone photos.
- Native project files can be noisy in git → Mitigation: commit generated iOS project files intentionally, avoid unrelated Xcode setting churn, and document regeneration steps.
- App Store review may reject a thin web wrapper if the native value is not clear → Mitigation: make camera, offline local recognition, durable local photo maps, reminders, and privacy behavior first-class app features before distribution.

## Migration Plan

1. Add web build scripts and a generated web output directory for the iOS package.
2. Add Capacitor configuration and generate the iOS project.
3. Add platform adapter modules with web fallbacks, then route existing persistence and photo flows through them.
4. Move saved photos into app file storage and migrate existing `localStorage` snapshots into the new store on first launch.
5. Verify local model assets load from packaged resources; document and fix any WKWebView path or WASM issues.
6. Add iOS permissions, icons/splash placeholders, app metadata, and manual smoke-test documentation.
7. Run iOS simulator/device checks. If the iOS migration has to be rolled back, keep the UI source files intact and remove only the native packaging layer.

## Open Questions

- Should the first iOS build target TestFlight immediately, or only local device installation through Xcode?
- Which minimum iOS version should the app support after testing model inference and plugin requirements on available devices?
- Should photos be backed up to iCloud by default, excluded from backup, or controlled by a future user setting?
- Should reminders use local notifications in this change or remain an in-app reminders panel until the core capture/search loop is stable?
