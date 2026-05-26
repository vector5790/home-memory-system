## Why

The current mobile app still behaves like a dense desktop layout: top navigation, space filters, photo map, AI capture, and reminders compete for the same screen area. Object detection review also needs to become more trustworthy because users must be able to correct a subject box before the app re-identifies the item.

## What Changes

- Keep the search box as the first row and make it a standalone row.
- Move `照片地图`, `AI录入`, and `提醒` into a persistent bottom 3-tab navigation.
- In the `AI录入` tab, show household space tabs directly under the search row.
- Replace the previous space filter with four default household space tabs: `客厅`, `厨房`, `阳台`, and `卧室`.
- Support creating a new household space tab.
- Move the previous `今日提醒` content into the `提醒` tab.
- Move the previous `家庭空间` content under the `照片地图` tab.
- Stop auto-generating photo/map placeholder copy after recognition.
- Change detected subject boxes to white.
- Highlight the selected subject area inside the subject box.
- Allow users to drag and adjust the selected subject box position and size.
- Re-run item-name recognition after the user completes a subject box adjustment.

## Capabilities

### New Capabilities

- `mobile-tab-navigation`: Covers the mobile app navigation model, standalone search row, bottom tabs, household space tabs, new space creation, and relocation of photo map/reminder/space content.
- `editable-detection-boxes`: Covers selected subject box styling, selected-region highlighting, drag adjustment, and re-running item-name recognition after box edits.

### Modified Capabilities

None.

## Impact

- Affected UI: app shell, search row, bottom navigation, AI capture layout, household space controls, photo map view, reminder view, and object overlay.
- Affected state: active primary tab, active household space tab, created household spaces, selected candidate box geometry, and re-recognition status.
- Affected recognition flow: item naming must re-run from the adjusted crop while keeping the algorithmic detection boxes as the starting point.
- Affected iOS behavior: all changes must be verified in the iOS simulator; browser-only verification is no longer sufficient for this app.
