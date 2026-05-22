# 本地视觉模型评测报告

- Dataset: `20260522-household-seed-model-eval`
- Predictions: `20260522-fixture-local-output`
- Index: `20260522-household-seed-index`
- Model: `fixture-local-model`
- Note: Deterministic local-output fixture for validating the evaluation system.

## Summary

| Metric | Value |
| --- | ---: |
| Images | 13 |
| Objects | 13 |
| Box recall @ IoU 0.5 | 100% |
| Name accuracy | 77% |
| Combined accuracy | 77% |
| Extra predictions | 0 |

## Cases

### storage-box-eval-1

- Query image: `fixtures/vision/storage-box-eval-1.jpg`
- Source: 
- GT: 收纳盒 / `storage-box` / box `{'x': 15.0, 'y': 18.0, 'w': 65.0, 'h': 52.0}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 16.5, 'y': 17.0, 'w': 66.3, 'h': 53.04}`
- IoU: `0.9186`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `1.0` image `fixtures/vision/storage-box-gallery-1.jpg`
  - #2 收纳盒 / `storage-box` score `0.998714` image `fixtures/vision/storage-box-gallery-2.jpg`
  - #3 遥控器 / `remote-control` score `0.063921` image `fixtures/vision/remote-control-gallery-1.jpg`

### storage-box-eval-2

- Query image: `fixtures/vision/storage-box-eval-2.jpg`
- Source: 
- GT: 收纳盒 / `storage-box` / box `{'x': 20.0, 'y': 24.0, 'w': 58.0, 'h': 47.0}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 21.5, 'y': 23.0, 'w': 59.16, 'h': 47.94}`
- IoU: `0.9114`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `1.0` image `fixtures/vision/storage-box-gallery-1.jpg`
  - #2 收纳盒 / `storage-box` score `0.998714` image `fixtures/vision/storage-box-gallery-2.jpg`
  - #3 遥控器 / `remote-control` score `0.063921` image `fixtures/vision/remote-control-gallery-1.jpg`

### charging-cable-eval-1

- Query image: `fixtures/vision/charging-cable-eval-1.jpg`
- Source: 
- GT: 数据线 / `charging-cable` / box `{'x': 12.0, 'y': 38.0, 'w': 78.0, 'h': 20.0}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 13.5, 'y': 37.0, 'w': 79.56, 'h': 20.4}`
- IoU: `0.8736`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `1.0` image `fixtures/vision/charging-cable-gallery-1.jpg`
  - #2 数据线 / `charging-cable` score `0.998791` image `fixtures/vision/charging-cable-gallery-2.jpg`
  - #3 电池 / `battery` score `0.028529` image `fixtures/vision/battery-gallery-1.jpg`

### charging-cable-eval-2

- Query image: `fixtures/vision/charging-cable-eval-2.jpg`
- Source: 
- GT: 数据线 / `charging-cable` / box `{'x': 10.0, 'y': 41.0, 'w': 76.0, 'h': 19.0}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 32.0, 'y': 41.0, 'w': 60.8, 'h': 15.2}`
- IoU: `0.5305`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `1.0` image `fixtures/vision/charging-cable-gallery-1.jpg`
  - #2 数据线 / `charging-cable` score `0.998791` image `fixtures/vision/charging-cable-gallery-2.jpg`
  - #3 电池 / `battery` score `0.028529` image `fixtures/vision/battery-gallery-1.jpg`

### charger-eval-1

- Query image: `fixtures/vision/charger-eval-1.jpg`
- Source: 
- GT: 充电器 / `charger` / box `{'x': 35.0, 'y': 26.0, 'w': 30.0, 'h': 42.0}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 36.5, 'y': 25.0, 'w': 30.6, 'h': 42.84}`
- IoU: `0.865`; boxMatch: `True`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `1.0` image `fixtures/vision/charging-cable-gallery-1.jpg`
  - #2 数据线 / `charging-cable` score `0.998791` image `fixtures/vision/charging-cable-gallery-2.jpg`
  - #3 电池 / `battery` score `0.028529` image `fixtures/vision/battery-gallery-1.jpg`

### charger-eval-2

- Query image: `fixtures/vision/charger-eval-2.jpg`
- Source: 
- GT: 充电器 / `charger` / box `{'x': 31.0, 'y': 23.0, 'w': 35.0, 'h': 44.0}`
- Prediction: 充电器 / `charger` / box `{'x': 32.5, 'y': 22.0, 'w': 35.7, 'h': 44.88}`
- IoU: `0.8791`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 充电器 / `charger` score `1.0` image `fixtures/vision/charger-gallery-1.jpg`
  - #2 充电器 / `charger` score `0.998703` image `fixtures/vision/charger-gallery-2.jpg`
  - #3 数据线 / `charging-cable` score `0.009402` image `fixtures/vision/charging-cable-gallery-2.jpg`

### remote-control-eval-1

- Query image: `fixtures/vision/remote-control-eval-1.jpg`
- Source: 
- GT: 遥控器 / `remote-control` / box `{'x': 36.0, 'y': 14.0, 'w': 18.0, 'h': 72.0}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 37.5, 'y': 13.0, 'w': 18.36, 'h': 73.44}`
- IoU: `0.8157`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `1.0` image `fixtures/vision/remote-control-gallery-1.jpg`
  - #2 遥控器 / `remote-control` score `0.998712` image `fixtures/vision/remote-control-gallery-2.jpg`
  - #3 收纳盒 / `storage-box` score `0.063921` image `fixtures/vision/storage-box-gallery-1.jpg`

### remote-control-eval-2

- Query image: `fixtures/vision/remote-control-eval-2.jpg`
- Source: 
- GT: 遥控器 / `remote-control` / box `{'x': 40.0, 'y': 13.0, 'w': 16.0, 'h': 73.0}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 41.5, 'y': 12.0, 'w': 16.32, 'h': 74.46}`
- IoU: `0.7991`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `1.0` image `fixtures/vision/remote-control-gallery-1.jpg`
  - #2 遥控器 / `remote-control` score `0.998712` image `fixtures/vision/remote-control-gallery-2.jpg`
  - #3 收纳盒 / `storage-box` score `0.063921` image `fixtures/vision/storage-box-gallery-1.jpg`

### medicine-box-eval-1

- Query image: `fixtures/vision/medicine-box-eval-1.jpg`
- Source: 
- GT: 药盒 / `medicine-box` / box `{'x': 21.0, 'y': 17.0, 'w': 51.0, 'h': 46.0}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 22.5, 'y': 16.0, 'w': 52.02, 'h': 46.92}`
- IoU: `0.9042`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `1.0` image `fixtures/vision/medicine-box-gallery-1.jpg`
  - #2 药盒 / `medicine-box` score `0.998718` image `fixtures/vision/medicine-box-gallery-2.jpg`
  - #3 充电器 / `charger` score `-0.001066` image `fixtures/vision/charger-gallery-2.jpg`

### medicine-box-eval-2

- Query image: `fixtures/vision/medicine-box-eval-2.jpg`
- Source: 
- GT: 药盒 / `medicine-box` / box `{'x': 24.0, 'y': 18.0, 'w': 49.0, 'h': 45.0}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 25.5, 'y': 17.0, 'w': 49.98, 'h': 45.9}`
- IoU: `0.9013`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `1.0` image `fixtures/vision/medicine-box-gallery-1.jpg`
  - #2 药盒 / `medicine-box` score `0.998718` image `fixtures/vision/medicine-box-gallery-2.jpg`
  - #3 充电器 / `charger` score `-0.001066` image `fixtures/vision/charger-gallery-2.jpg`

### battery-eval-1

- Query image: `fixtures/vision/battery-eval-1.jpg`
- Source: 
- GT: 电池 / `battery` / box `{'x': 33.0, 'y': 21.0, 'w': 15.0, 'h': 56.0}`
- Prediction: 电池 / `battery` / box `{'x': 34.5, 'y': 20.0, 'w': 15.3, 'h': 57.12}`
- IoU: `0.7892`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电池 / `battery` score `1.0` image `fixtures/vision/battery-gallery-1.jpg`
  - #2 电池 / `battery` score `0.998728` image `fixtures/vision/battery-gallery-2.jpg`
  - #3 遥控器 / `remote-control` score `0.029137` image `fixtures/vision/remote-control-gallery-1.jpg`

### battery-eval-2

- Query image: `fixtures/vision/battery-eval-2.jpg`
- Source: 
- GT: 电池 / `battery` / box `{'x': 48.0, 'y': 20.0, 'w': 15.0, 'h': 57.0}`
- Prediction: 充电器 / `charger` / box `{'x': 49.5, 'y': 19.0, 'w': 15.3, 'h': 58.14}`
- IoU: `0.7892`; boxMatch: `True`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `1.0` image `fixtures/vision/charger-gallery-1.jpg`
  - #2 充电器 / `charger` score `0.998703` image `fixtures/vision/charger-gallery-2.jpg`
  - #3 数据线 / `charging-cable` score `0.009402` image `fixtures/vision/charging-cable-gallery-2.jpg`

### cat-teaser-eval-1

- Query image: `fixtures/vision/cat-teaser-eval-1.jpg`
- Source: 
- GT: 逗猫棒 / `cat-teaser-toy` / box `{'x': 15.0, 'y': 35.0, 'w': 70.0, 'h': 14.0}`
- Prediction: 物品A / `` / box `{'x': 16.5, 'y': 34.0, 'w': 71.4, 'h': 14.28}`
- IoU: `0.8346`; boxMatch: `True`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `1.0` image `fixtures/vision/storage-box-gallery-1.jpg`
  - #2 收纳盒 / `storage-box` score `0.998714` image `fixtures/vision/storage-box-gallery-2.jpg`
  - #3 遥控器 / `remote-control` score `0.063921` image `fixtures/vision/remote-control-gallery-1.jpg`
