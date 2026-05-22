# iOS Smoke Test

Use this checklist before calling the iOS app reliable enough for household testing.

## Environment

- [x] Full Xcode is installed.
- [x] `xcode-select -p` points to `/Applications/Xcode.app/Contents/Developer`.
- [x] Node.js 20+ and npm are available.
- [x] Local model assets exist under `vendor/`.

Current local note: Xcode 26.5 and the iOS 26.5 simulator runtime are installed. Simulator launch verification was run on iPhone 17 simulator `7AC1093D-549E-4E79-8530-2EF9CB6C7241`.

Environment and launch commands run on 2026-05-20:

```bash
xcode-select -p
xcodebuild -version
npm run ios:sync
xcodebuild -list -project ios/App/App.xcodeproj
xcodebuild -project ios/App/App.xcodeproj -scheme App -showdestinations
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'platform=iOS Simulator,id=7AC1093D-549E-4E79-8530-2EF9CB6C7241' CODE_SIGNING_ALLOWED=NO build
xcrun simctl boot 7AC1093D-549E-4E79-8530-2EF9CB6C7241
xcrun simctl bootstatus 7AC1093D-549E-4E79-8530-2EF9CB6C7241 -b
xcrun simctl install 7AC1093D-549E-4E79-8530-2EF9CB6C7241 ~/Library/Developer/Xcode/DerivedData/App-*/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch 7AC1093D-549E-4E79-8530-2EF9CB6C7241 com.guzeyu.homememory
xcrun simctl io 7AC1093D-549E-4E79-8530-2EF9CB6C7241 screenshot /tmp/home-memory-ios/launch-mobile-nav-final.png
```

Results:

- `xcode-select -p` returned `/Applications/Xcode.app/Contents/Developer`.
- `xcodebuild -version` returned Xcode 26.5 build `17F42`.
- `npm run ios:sync` succeeded and refreshed packaged web assets.
- `xcodebuild ... build` returned `BUILD SUCCEEDED`.
- `simctl install` succeeded.
- `simctl launch` returned process id `49505`.
- Screenshot captured at `/tmp/home-memory-ios/launch-mobile-nav-final.png`.

## Build

- [x] Run `npm install`.
- [x] Run `npm run check:web`.
- [x] Run `npm run build:web`.
- [x] Run `npm run ios:sync`.
- [ ] Open `ios/App/App.xcodeproj` with Xcode or run `npm run ios:open`.

## Packaged Assets

- [x] Confirm `App.app/public/app.js` exists.
- [x] Confirm `App.app/public/platform.js` exists.
- [x] Confirm `App.app/public/vendor/vision-manifest.json` exists.
- [x] Confirm `App.app/public/vendor/transformers/ort-wasm-simd-threaded.jsep.wasm` exists.
- [x] Confirm the installed simulator app bundle is served from the app container, not a localhost dev server.

Observed installed app bundle size: approximately `686M`.

## Simulator

- [x] Build and launch the app in an iOS simulator.
- [x] Confirm the Home Memory UI loads without `python3 server.py` or `node server.mjs`.
- [x] Confirm the AI capture screen shows the empty household state.
- [ ] Import a photo through the available simulator photo-library path.
- [ ] Start analysis and confirm detector/naming progress is visible.
- [ ] Confirm at least one candidate into inventory.
- [ ] Quit and relaunch the app.
- [ ] Search for the saved item and confirm the saved photo path renders.

Remaining manual simulator steps:

1. Add a real multi-megabyte test photo to the booted simulator:

   ```bash
   xcrun simctl addmedia 7AC1093D-549E-4E79-8530-2EF9CB6C7241 /absolute/path/to/your-iphone-photo.jpg
   ```

2. Launch the app:

   ```bash
   xcrun simctl launch 7AC1093D-549E-4E79-8530-2EF9CB6C7241 com.guzeyu.homememory
   ```

3. In the app, go to `AI录入` > `上传照片`, select the added photo, and confirm the image appears.
4. Tap `开始识别`; confirm progress appears and the run either returns candidates or shows a clear local-model fallback/error.
5. Confirm at least one candidate into inventory.
6. Terminate and relaunch:

   ```bash
   xcrun simctl terminate 7AC1093D-549E-4E79-8530-2EF9CB6C7241 com.guzeyu.homememory
   xcrun simctl launch 7AC1093D-549E-4E79-8530-2EF9CB6C7241 com.guzeyu.homememory
   ```

7. Search for the confirmed item and verify the saved photo shown in the path/result is the real selected photo, not a placeholder.

## Physical Device

- Current local note: no physical iPhone verification was run in this environment.

- [ ] Install the app on an iPhone through Xcode.
- [ ] Grant camera permission only when entering the camera flow.
- [ ] Capture a real storage photo with the iPhone camera.
- [ ] Import a multi-megabyte photo from the photo library.
- [ ] Confirm large-photo preprocessing shows progress and does not silently fail.
- [ ] Run local recognition or observe the documented local fallback.
- [ ] Confirm an item, restart the app, and search for the item.
- [ ] Confirm the displayed photo is the real captured/imported photo, not a placeholder.

## Known Limitations to Record

- Simulator photo import and recognition were not completed from CLI automation; complete these in the simulator or on a physical iPhone.
- Physical iPhone unavailable.
- Recognition too slow or memory-constrained on the tested device.
