# 本地视觉模型评测报告

- Dataset: `20260522-commons-household-real-eval`
- Predictions: `20260523-real-photo-provider-benchmark`
- Index: `20260522-commons-real-photo-index`
- Model: `provider-benchmark`
- Note: Provider benchmark predictions. Real local providers require valid vendor assets and --run-local-models; baselines are explicitly labeled.

## Summary

| Metric | Value |
| --- | ---: |
| Images | 6 |
| Objects | 6 |
| Box recall @ IoU 0.5 | 67% |
| Category accuracy | 83% |
| Name accuracy | 83% |
| Combined accuracy | 50% |
| Rejections | 0 |
| Extra predictions | 0 |

## Provider Comparison

| Provider | Model IDs | Class | Status | Box | Category | Name | Combined | Top3 | P95 end-to-end ms | Gate |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Local OWL-ViT + CLIP naming | Xenova/owlvit-base-patch32, Xenova/clip-vit-base-patch32 | real-local-model | ok | 67% | 83% | 83% | 50% | 100% | 317.167 | go |
| Local OWL-ViT + SlimSAM + CLIP naming | Xenova/owlvit-base-patch32, Xenova/clip-vit-base-patch32, Xenova/slimsam-77-uniform | real-local-model | ok | 67% | 83% | 83% | 50% | 100% | 1860.555 | go |
| Local Grounding DINO + CLIP naming | onnx-community/grounding-dino-tiny-ONNX, Xenova/clip-vit-base-patch32 | real-local-model | ok | 50% | 67% | 67% | 33% | 100% | 1793.066 | no-go |
| Local Grounding DINO + SlimSAM + CLIP naming | onnx-community/grounding-dino-tiny-ONNX, Xenova/clip-vit-base-patch32, Xenova/slimsam-77-uniform | real-local-model | ok | 33% | 67% | 67% | 33% | 100% | 4114.078 | no-go |
| Local CLIP naming | Xenova/clip-vit-base-patch32 | real-local-model | ok | 33% | 50% | 50% | 17% | 100% | 44.986 | no-go |
| Canvas proposal baseline | n/a | canvas-baseline | ok | 67% | 0% | 0% | 0% | 0% | 44.109 | not-applicable |
| GT-assisted report fixture | n/a | gt-assisted-fixture | ok | 100% | 100% | 100% | 100% | 100% | 4.12 | not-applicable |

## Cases By Provider

### Local OWL-ViT + CLIP naming

- Provider class: `real-local-model`
- Provider status: `ok`
- Model IDs: `Xenova/owlvit-base-patch32, Xenova/clip-vit-base-patch32`
- Gate: `go`

#### storage-box-real-query-1

- Query image: `fixtures/vision-real/raw/storage-box-query.jpg`
- Source: [Orange plastic storage container on top of a stack.jpg](https://commons.wikimedia.org/wiki/File:Orange_plastic_storage_container_on_top_of_a_stack.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 6.0, 'y': 8.0, 'w': 89.0, 'h': 84.0}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 14.2969, 'y': 21.5625, 'w': 84.9219, 'h': 78.4375}`
- IoU: `0.6725`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.7182` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #2 收纳盒 / `storage-box` score `0.714738` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #3 收纳盒 / `storage-box` score `0.7143` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)

#### charging-cable-real-query-1

- Query image: `fixtures/vision-real/raw/charging-cable-query.jpg`
- Source: [USB cable.jpg](https://commons.wikimedia.org/wiki/File:USB_cable.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 5.0, 'y': 28.0, 'w': 91.0, 'h': 45.0}`
- Prediction: 充电器 / `charger` / box `{'x': 0, 'y': 22.0697, 'w': 95.3125, 'h': 42.5554}`
- IoU: `0.6829`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.797692` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #2 数据线 / `charging-cable` score `0.754255` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 遥控器 / `remote-control` score `0.743431` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)

#### charger-real-query-1

- Query image: `fixtures/vision-real/raw/charger-query.jpg`
- Source: [Apple USB Charger 1 2017-02-02.jpg](https://commons.wikimedia.org/wiki/File:Apple_USB_Charger_1_2017-02-02.jpg)
- GT: 充电器 / `charger` / box `{'x': 37.0, 'y': 30.0, 'w': 60.0, 'h': 36.0}`
- Prediction: 充电器 / `charger` / box `{'x': 28.6719, 'y': 40.658, 'w': 71.0938, 'h': 46.0635}`
- IoU: `0.3885`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.847971` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 数据线 / `charging-cable` score `0.836892` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #3 数据线 / `charging-cable` score `0.805917` image `fixtures/vision-real/raw/charging-cable-gallery-3.jpg` [Cavo USB-C = USB-C della Samsung.jpg](https://commons.wikimedia.org/wiki/File:Cavo_USB-C_=_USB-C_della_Samsung.jpg)

#### remote-control-real-query-1

- Query image: `fixtures/vision-real/raw/remote-control-query.jpg`
- Source: [Television remote control - black 01.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_01.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 30.0, 'y': 0.5, 'w': 41.0, 'h': 98.0}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 2.2196, 'y': 0.4242, 'w': 93.6916, 'h': 99.0606}`
- IoU: `0.4329`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.8492` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #2 遥控器 / `remote-control` score `0.780871` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)
  - #3 遥控器 / `remote-control` score `0.747947` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)

#### medicine-box-real-query-1

- Query image: `fixtures/vision-real/raw/medicine-box-query.jpg`
- Source: [2023 Kasetka z lekami.jpg](https://commons.wikimedia.org/wiki/File:2023_Kasetka_z_lekami.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 4.0, 'y': 5.0, 'w': 92.0, 'h': 86.0}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 5.5469, 'y': 7.2316, 'w': 85.2344, 'h': 82.0339}`
- IoU: `0.8837`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.771356` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)
  - #2 数据线 / `charging-cable` score `0.628824` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 收纳盒 / `storage-box` score `0.622454` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)

#### battery-real-query-1

- Query image: `fixtures/vision-real/raw/battery-query.jpg`
- Source: [02 - Single Energizer Battery.jpg](https://commons.wikimedia.org/wiki/File:02_-_Single_Energizer_Battery.jpg)
- GT: 电池 / `battery` / box `{'x': 13.0, 'y': 15.0, 'w': 73.0, 'h': 53.0}`
- Prediction: 电池 / `battery` / box `{'x': 12.8125, 'y': 10.9685, 'w': 68.9063, 'h': 70.5951}`
- IoU: `0.7153`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电池 / `battery` score `0.698607` image `fixtures/vision-real/raw/battery-gallery-2.jpg` [AA batteries.JPG](https://commons.wikimedia.org/wiki/File:AA_batteries.JPG)
  - #2 电池 / `battery` score `0.68079` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #3 电池 / `battery` score `0.644391` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)

### Local OWL-ViT + SlimSAM + CLIP naming

- Provider class: `real-local-model`
- Provider status: `ok`
- Model IDs: `Xenova/owlvit-base-patch32, Xenova/clip-vit-base-patch32, Xenova/slimsam-77-uniform`
- Gate: `go`

#### storage-box-real-query-1

- Query image: `fixtures/vision-real/raw/storage-box-query.jpg`
- Source: [Orange plastic storage container on top of a stack.jpg](https://commons.wikimedia.org/wiki/File:Orange_plastic_storage_container_on_top_of_a_stack.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 6.0, 'y': 8.0, 'w': 89.0, 'h': 84.0}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 14.8438, 'y': 24.2708, 'w': 76.4063, 'h': 75.2083}`
- IoU: `0.6431`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.750561` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #2 收纳盒 / `storage-box` score `0.72357` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #3 收纳盒 / `storage-box` score `0.704972` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)

#### charging-cable-real-query-1

- Query image: `fixtures/vision-real/raw/charging-cable-query.jpg`
- Source: [USB cable.jpg](https://commons.wikimedia.org/wiki/File:USB_cable.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 5.0, 'y': 28.0, 'w': 91.0, 'h': 45.0}`
- Prediction: 充电器 / `charger` / box `{'x': 0, 'y': 22.0697, 'w': 95.3125, 'h': 42.5554}`
- IoU: `0.6829`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.797692` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #2 数据线 / `charging-cable` score `0.754255` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 遥控器 / `remote-control` score `0.743431` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)

#### charger-real-query-1

- Query image: `fixtures/vision-real/raw/charger-query.jpg`
- Source: [Apple USB Charger 1 2017-02-02.jpg](https://commons.wikimedia.org/wiki/File:Apple_USB_Charger_1_2017-02-02.jpg)
- GT: 充电器 / `charger` / box `{'x': 37.0, 'y': 30.0, 'w': 60.0, 'h': 36.0}`
- Prediction: 充电器 / `charger` / box `{'x': 28.6719, 'y': 40.658, 'w': 71.0938, 'h': 46.0635}`
- IoU: `0.3885`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.847971` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 数据线 / `charging-cable` score `0.836892` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #3 数据线 / `charging-cable` score `0.805917` image `fixtures/vision-real/raw/charging-cable-gallery-3.jpg` [Cavo USB-C = USB-C della Samsung.jpg](https://commons.wikimedia.org/wiki/File:Cavo_USB-C_=_USB-C_della_Samsung.jpg)

#### remote-control-real-query-1

- Query image: `fixtures/vision-real/raw/remote-control-query.jpg`
- Source: [Television remote control - black 01.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_01.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 30.0, 'y': 0.5, 'w': 41.0, 'h': 98.0}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 5.4907, 'y': 0, 'w': 90.771, 'h': 99.1212}`
- IoU: `0.4466`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.829152` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #2 遥控器 / `remote-control` score `0.782978` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)
  - #3 遥控器 / `remote-control` score `0.727509` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)

#### medicine-box-real-query-1

- Query image: `fixtures/vision-real/raw/medicine-box-query.jpg`
- Source: [2023 Kasetka z lekami.jpg](https://commons.wikimedia.org/wiki/File:2023_Kasetka_z_lekami.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 4.0, 'y': 5.0, 'w': 92.0, 'h': 86.0}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 5.5469, 'y': 7.2316, 'w': 85.2344, 'h': 82.0339}`
- IoU: `0.8837`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.771356` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)
  - #2 数据线 / `charging-cable` score `0.628824` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 收纳盒 / `storage-box` score `0.622454` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)

#### battery-real-query-1

- Query image: `fixtures/vision-real/raw/battery-query.jpg`
- Source: [02 - Single Energizer Battery.jpg](https://commons.wikimedia.org/wiki/File:02_-_Single_Energizer_Battery.jpg)
- GT: 电池 / `battery` / box `{'x': 13.0, 'y': 15.0, 'w': 73.0, 'h': 53.0}`
- Prediction: 电池 / `battery` / box `{'x': 12.8125, 'y': 10.9685, 'w': 68.9063, 'h': 70.5951}`
- IoU: `0.7153`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电池 / `battery` score `0.698607` image `fixtures/vision-real/raw/battery-gallery-2.jpg` [AA batteries.JPG](https://commons.wikimedia.org/wiki/File:AA_batteries.JPG)
  - #2 电池 / `battery` score `0.68079` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #3 电池 / `battery` score `0.644391` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)

### Local Grounding DINO + CLIP naming

- Provider class: `real-local-model`
- Provider status: `ok`
- Model IDs: `onnx-community/grounding-dino-tiny-ONNX, Xenova/clip-vit-base-patch32`
- Gate: `no-go`

#### storage-box-real-query-1

- Query image: `fixtures/vision-real/raw/storage-box-query.jpg`
- Source: [Orange plastic storage container on top of a stack.jpg](https://commons.wikimedia.org/wiki/File:Orange_plastic_storage_container_on_top_of_a_stack.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 6.0, 'y': 8.0, 'w': 89.0, 'h': 84.0}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 79.2933, 'y': 46.8992, 'w': 20.6597, 'h': 50.1644}`
- IoU: `0.0908`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.725688` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #2 收纳盒 / `storage-box` score `0.719587` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)
  - #3 数据线 / `charging-cable` score `0.707012` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)

#### charging-cable-real-query-1

- Query image: `fixtures/vision-real/raw/charging-cable-query.jpg`
- Source: [USB cable.jpg](https://commons.wikimedia.org/wiki/File:USB_cable.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 5.0, 'y': 28.0, 'w': 91.0, 'h': 45.0}`
- Prediction: 充电器 / `charger` / box `{'x': 0.1356, 'y': 23.4868, 'w': 89.6889, 'h': 35.7427}`
- IoU: `0.5695`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.815957` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #2 电池 / `battery` score `0.756689` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #3 数据线 / `charging-cable` score `0.756623` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)

#### charger-real-query-1

- Query image: `fixtures/vision-real/raw/charger-query.jpg`
- Source: [Apple USB Charger 1 2017-02-02.jpg](https://commons.wikimedia.org/wiki/File:Apple_USB_Charger_1_2017-02-02.jpg)
- GT: 充电器 / `charger` / box `{'x': 37.0, 'y': 30.0, 'w': 60.0, 'h': 36.0}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 28.157, 'y': 42.5398, 'w': 70.9954, 'h': 40.3053}`
- IoU: `0.3895`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.852291` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #2 充电器 / `charger` score `0.842735` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 数据线 / `charging-cable` score `0.822635` image `fixtures/vision-real/raw/charging-cable-gallery-3.jpg` [Cavo USB-C = USB-C della Samsung.jpg](https://commons.wikimedia.org/wiki/File:Cavo_USB-C_=_USB-C_della_Samsung.jpg)

#### remote-control-real-query-1

- Query image: `fixtures/vision-real/raw/remote-control-query.jpg`
- Source: [Television remote control - black 01.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_01.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 30.0, 'y': 0.5, 'w': 41.0, 'h': 98.0}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 15.2264, 'y': 75.3569, 'w': 75.3783, 'h': 17.1981}`
- IoU: `0.153`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.735342` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #2 遥控器 / `remote-control` score `0.717321` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)
  - #3 遥控器 / `remote-control` score `0.702921` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)

#### medicine-box-real-query-1

- Query image: `fixtures/vision-real/raw/medicine-box-query.jpg`
- Source: [2023 Kasetka z lekami.jpg](https://commons.wikimedia.org/wiki/File:2023_Kasetka_z_lekami.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 4.0, 'y': 5.0, 'w': 92.0, 'h': 86.0}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 7.3859, 'y': 11.6776, 'w': 83.4229, 'h': 78.7815}`
- IoU: `0.8307`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.826291` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)
  - #2 数据线 / `charging-cable` score `0.645271` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 收纳盒 / `storage-box` score `0.64327` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)

#### battery-real-query-1

- Query image: `fixtures/vision-real/raw/battery-query.jpg`
- Source: [02 - Single Energizer Battery.jpg](https://commons.wikimedia.org/wiki/File:02_-_Single_Energizer_Battery.jpg)
- GT: 电池 / `battery` / box `{'x': 13.0, 'y': 15.0, 'w': 73.0, 'h': 53.0}`
- Prediction: 电池 / `battery` / box `{'x': 13.1852, 'y': 15.0511, 'w': 67.8975, 'h': 68.8745}`
- IoU: `0.7262`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电池 / `battery` score `0.708965` image `fixtures/vision-real/raw/battery-gallery-2.jpg` [AA batteries.JPG](https://commons.wikimedia.org/wiki/File:AA_batteries.JPG)
  - #2 电池 / `battery` score `0.704888` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #3 电池 / `battery` score `0.691942` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)

### Local Grounding DINO + SlimSAM + CLIP naming

- Provider class: `real-local-model`
- Provider status: `ok`
- Model IDs: `onnx-community/grounding-dino-tiny-ONNX, Xenova/clip-vit-base-patch32, Xenova/slimsam-77-uniform`
- Gate: `no-go`

#### storage-box-real-query-1

- Query image: `fixtures/vision-real/raw/storage-box-query.jpg`
- Source: [Orange plastic storage container on top of a stack.jpg](https://commons.wikimedia.org/wiki/File:Orange_plastic_storage_container_on_top_of_a_stack.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 6.0, 'y': 8.0, 'w': 89.0, 'h': 84.0}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 79.2969, 'y': 68.5417, 'w': 15.3125, 'h': 27.9167}`
- IoU: `0.0476`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.765613` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)
  - #2 收纳盒 / `storage-box` score `0.760426` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #3 数据线 / `charging-cable` score `0.736803` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)

#### charging-cable-real-query-1

- Query image: `fixtures/vision-real/raw/charging-cable-query.jpg`
- Source: [USB cable.jpg](https://commons.wikimedia.org/wiki/File:USB_cable.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 5.0, 'y': 28.0, 'w': 91.0, 'h': 45.0}`
- Prediction: 电池 / `battery` / box `{'x': 40.5469, 'y': 27.5607, 'w': 24.2188, 'h': 18.057}`
- IoU: `0.1039`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 电池 / `battery` score `0.782671` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #2 数据线 / `charging-cable` score `0.755026` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 充电器 / `charger` score `0.731425` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)

#### charger-real-query-1

- Query image: `fixtures/vision-real/raw/charger-query.jpg`
- Source: [Apple USB Charger 1 2017-02-02.jpg](https://commons.wikimedia.org/wiki/File:Apple_USB_Charger_1_2017-02-02.jpg)
- GT: 充电器 / `charger` / box `{'x': 37.0, 'y': 30.0, 'w': 60.0, 'h': 36.0}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 28.157, 'y': 42.5398, 'w': 70.9954, 'h': 40.3053}`
- IoU: `0.3895`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.852291` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #2 充电器 / `charger` score `0.842735` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 数据线 / `charging-cable` score `0.822635` image `fixtures/vision-real/raw/charging-cable-gallery-3.jpg` [Cavo USB-C = USB-C della Samsung.jpg](https://commons.wikimedia.org/wiki/File:Cavo_USB-C_=_USB-C_della_Samsung.jpg)

#### remote-control-real-query-1

- Query image: `fixtures/vision-real/raw/remote-control-query.jpg`
- Source: [Television remote control - black 01.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_01.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 30.0, 'y': 0.5, 'w': 41.0, 'h': 98.0}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 11.7991, 'y': 63.3939, 'w': 81.4252, 'h': 35.697}`
- IoU: `0.2624`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.736951` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)
  - #2 遥控器 / `remote-control` score `0.731578` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #3 遥控器 / `remote-control` score `0.652277` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)

#### medicine-box-real-query-1

- Query image: `fixtures/vision-real/raw/medicine-box-query.jpg`
- Source: [2023 Kasetka z lekami.jpg](https://commons.wikimedia.org/wiki/File:2023_Kasetka_z_lekami.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 4.0, 'y': 5.0, 'w': 92.0, 'h': 86.0}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 7.3859, 'y': 11.6776, 'w': 83.4229, 'h': 78.7815}`
- IoU: `0.8307`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.826291` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)
  - #2 数据线 / `charging-cable` score `0.645271` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 收纳盒 / `storage-box` score `0.64327` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)

#### battery-real-query-1

- Query image: `fixtures/vision-real/raw/battery-query.jpg`
- Source: [02 - Single Energizer Battery.jpg](https://commons.wikimedia.org/wiki/File:02_-_Single_Energizer_Battery.jpg)
- GT: 电池 / `battery` / box `{'x': 13.0, 'y': 15.0, 'w': 73.0, 'h': 53.0}`
- Prediction: 电池 / `battery` / box `{'x': 13.1852, 'y': 15.0511, 'w': 67.8975, 'h': 68.8745}`
- IoU: `0.7262`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电池 / `battery` score `0.708965` image `fixtures/vision-real/raw/battery-gallery-2.jpg` [AA batteries.JPG](https://commons.wikimedia.org/wiki/File:AA_batteries.JPG)
  - #2 电池 / `battery` score `0.704888` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #3 电池 / `battery` score `0.691942` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)

### Local CLIP naming

- Provider class: `real-local-model`
- Provider status: `ok`
- Model IDs: `Xenova/clip-vit-base-patch32`
- Gate: `no-go`

#### storage-box-real-query-1

- Query image: `fixtures/vision-real/raw/storage-box-query.jpg`
- Source: [Orange plastic storage container on top of a stack.jpg](https://commons.wikimedia.org/wiki/File:Orange_plastic_storage_container_on_top_of_a_stack.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 6.0, 'y': 8.0, 'w': 89.0, 'h': 84.0}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 0, 'y': 0, 'w': 100, 'h': 100}`
- IoU: `0.7476`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.751253` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)
  - #2 收纳盒 / `storage-box` score `0.749714` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #3 收纳盒 / `storage-box` score `0.704585` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)

#### charging-cable-real-query-1

- Query image: `fixtures/vision-real/raw/charging-cable-query.jpg`
- Source: [USB cable.jpg](https://commons.wikimedia.org/wiki/File:USB_cable.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 5.0, 'y': 28.0, 'w': 91.0, 'h': 45.0}`
- Prediction: 充电器 / `charger` / box `{'x': 0, 'y': 0, 'w': 100, 'h': 100}`
- IoU: `0.4095`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.860802` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 数据线 / `charging-cable` score `0.853468` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #3 充电器 / `charger` score `0.816003` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)

#### charger-real-query-1

- Query image: `fixtures/vision-real/raw/charger-query.jpg`
- Source: [Apple USB Charger 1 2017-02-02.jpg](https://commons.wikimedia.org/wiki/File:Apple_USB_Charger_1_2017-02-02.jpg)
- GT: 充电器 / `charger` / box `{'x': 37.0, 'y': 30.0, 'w': 60.0, 'h': 36.0}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 0, 'y': 0, 'w': 100, 'h': 100}`
- IoU: `0.216`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.845991` image `fixtures/vision-real/raw/charging-cable-gallery-3.jpg` [Cavo USB-C = USB-C della Samsung.jpg](https://commons.wikimedia.org/wiki/File:Cavo_USB-C_=_USB-C_della_Samsung.jpg)
  - #2 数据线 / `charging-cable` score `0.845987` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #3 充电器 / `charger` score `0.798012` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)

#### remote-control-real-query-1

- Query image: `fixtures/vision-real/raw/remote-control-query.jpg`
- Source: [Television remote control - black 01.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_01.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 30.0, 'y': 0.5, 'w': 41.0, 'h': 98.0}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 0, 'y': 0, 'w': 100, 'h': 100}`
- IoU: `0.4018`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.821604` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #2 遥控器 / `remote-control` score `0.778982` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)
  - #3 遥控器 / `remote-control` score `0.726747` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)

#### medicine-box-real-query-1

- Query image: `fixtures/vision-real/raw/medicine-box-query.jpg`
- Source: [2023 Kasetka z lekami.jpg](https://commons.wikimedia.org/wiki/File:2023_Kasetka_z_lekami.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 4.0, 'y': 5.0, 'w': 92.0, 'h': 86.0}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 0, 'y': 0, 'w': 100, 'h': 100}`
- IoU: `0.7912`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.747158` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #2 药盒 / `medicine-box` score `0.72266` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)
  - #3 收纳盒 / `storage-box` score `0.696044` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)

#### battery-real-query-1

- Query image: `fixtures/vision-real/raw/battery-query.jpg`
- Source: [02 - Single Energizer Battery.jpg](https://commons.wikimedia.org/wiki/File:02_-_Single_Energizer_Battery.jpg)
- GT: 电池 / `battery` / box `{'x': 13.0, 'y': 15.0, 'w': 73.0, 'h': 53.0}`
- Prediction: 电池 / `battery` / box `{'x': 0, 'y': 0, 'w': 100, 'h': 100}`
- IoU: `0.3869`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 电池 / `battery` score `0.725503` image `fixtures/vision-real/raw/battery-gallery-2.jpg` [AA batteries.JPG](https://commons.wikimedia.org/wiki/File:AA_batteries.JPG)
  - #2 电池 / `battery` score `0.697357` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)
  - #3 电池 / `battery` score `0.654204` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)

### Canvas proposal baseline

- Provider class: `canvas-baseline`
- Provider status: `ok`
- Model IDs: `n/a`
- Gate: `not-applicable`

#### storage-box-real-query-1

- Query image: `fixtures/vision-real/raw/storage-box-query.jpg`
- Source: [Orange plastic storage container on top of a stack.jpg](https://commons.wikimedia.org/wiki/File:Orange_plastic_storage_container_on_top_of_a_stack.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 6.0, 'y': 8.0, 'w': 89.0, 'h': 84.0}`
- Prediction: 物品A / `` / box `{'x': 0.0, 'y': 0.0, 'w': 100.0, 'h': 100.0}`
- IoU: `0.7476`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### charging-cable-real-query-1

- Query image: `fixtures/vision-real/raw/charging-cable-query.jpg`
- Source: [USB cable.jpg](https://commons.wikimedia.org/wiki/File:USB_cable.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 5.0, 'y': 28.0, 'w': 91.0, 'h': 45.0}`
- Prediction: 物品A / `` / box `{'x': 0.0, 'y': 20.3008, 'w': 98.8889, 'h': 60.1504}`
- IoU: `0.6884`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### charger-real-query-1

- Query image: `fixtures/vision-real/raw/charger-query.jpg`
- Source: [Apple USB Charger 1 2017-02-02.jpg](https://commons.wikimedia.org/wiki/File:Apple_USB_Charger_1_2017-02-02.jpg)
- GT: 充电器 / `charger` / box `{'x': 37.0, 'y': 30.0, 'w': 60.0, 'h': 36.0}`
- Prediction: 物品A / `` / box `{'x': 0.0, 'y': 0.0, 'w': 100.0, 'h': 100.0}`
- IoU: `0.216`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### remote-control-real-query-1

- Query image: `fixtures/vision-real/raw/remote-control-query.jpg`
- Source: [Television remote control - black 01.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_01.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 30.0, 'y': 0.5, 'w': 41.0, 'h': 98.0}`
- Prediction: 物品A / `` / box `{'x': 0.0, 'y': 0.0, 'w': 100.0, 'h': 100.0}`
- IoU: `0.4018`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### medicine-box-real-query-1

- Query image: `fixtures/vision-real/raw/medicine-box-query.jpg`
- Source: [2023 Kasetka z lekami.jpg](https://commons.wikimedia.org/wiki/File:2023_Kasetka_z_lekami.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 4.0, 'y': 5.0, 'w': 92.0, 'h': 86.0}`
- Prediction: 物品A / `` / box `{'x': 5.0, 'y': 8.0645, 'w': 88.8889, 'h': 83.871}`
- IoU: `0.9221`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### battery-real-query-1

- Query image: `fixtures/vision-real/raw/battery-query.jpg`
- Source: [02 - Single Energizer Battery.jpg](https://commons.wikimedia.org/wiki/File:02_-_Single_Energizer_Battery.jpg)
- GT: 电池 / `battery` / box `{'x': 13.0, 'y': 15.0, 'w': 73.0, 'h': 53.0}`
- Prediction: 物品A / `` / box `{'x': 10.5556, 'y': 11.5702, 'w': 72.7778, 'h': 76.8595}`
- IoU: `0.65`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

### GT-assisted report fixture

- Provider class: `gt-assisted-fixture`
- Provider status: `ok`
- Model IDs: `n/a`
- Gate: `not-applicable`

#### storage-box-real-query-1

- Query image: `fixtures/vision-real/raw/storage-box-query.jpg`
- Source: [Orange plastic storage container on top of a stack.jpg](https://commons.wikimedia.org/wiki/File:Orange_plastic_storage_container_on_top_of_a_stack.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 6.0, 'y': 8.0, 'w': 89.0, 'h': 84.0}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 6.8, 'y': 7.4, 'w': 89.89, 'h': 84.84}`
- IoU: `0.963`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.995972` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #2 收纳盒 / `storage-box` score `0.995892` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #3 收纳盒 / `storage-box` score `0.995852` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)

#### charging-cable-real-query-1

- Query image: `fixtures/vision-real/raw/charging-cable-query.jpg`
- Source: [USB cable.jpg](https://commons.wikimedia.org/wiki/File:USB_cable.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 5.0, 'y': 28.0, 'w': 91.0, 'h': 45.0}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 5.8, 'y': 27.4, 'w': 91.91, 'h': 45.45}`
- IoU: `0.9571`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.995874` image `fixtures/vision-real/raw/charging-cable-gallery-3.jpg` [Cavo USB-C = USB-C della Samsung.jpg](https://commons.wikimedia.org/wiki/File:Cavo_USB-C_=_USB-C_della_Samsung.jpg)
  - #2 数据线 / `charging-cable` score `0.995822` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 数据线 / `charging-cable` score `0.995709` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### charger-real-query-1

- Query image: `fixtures/vision-real/raw/charger-query.jpg`
- Source: [Apple USB Charger 1 2017-02-02.jpg](https://commons.wikimedia.org/wiki/File:Apple_USB_Charger_1_2017-02-02.jpg)
- GT: 充电器 / `charger` / box `{'x': 37.0, 'y': 30.0, 'w': 60.0, 'h': 36.0}`
- Prediction: 充电器 / `charger` / box `{'x': 37.8, 'y': 29.4, 'w': 60.6, 'h': 36.36}`
- IoU: `0.9424`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.995933` image `fixtures/vision-real/raw/charger-gallery-1.jpg` [USB wall charger.JPG](https://commons.wikimedia.org/wiki/File:USB_wall_charger.JPG)
  - #2 充电器 / `charger` score `0.995848` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #3 充电器 / `charger` score `0.995694` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)

#### remote-control-real-query-1

- Query image: `fixtures/vision-real/raw/remote-control-query.jpg`
- Source: [Television remote control - black 01.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_01.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 30.0, 'y': 0.5, 'w': 41.0, 'h': 98.0}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 30.8, 'y': 0.0, 'w': 41.41, 'h': 98.98}`
- IoU: `0.9431`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.99593` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)
  - #2 遥控器 / `remote-control` score `0.995795` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)
  - #3 遥控器 / `remote-control` score `0.995599` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)

#### medicine-box-real-query-1

- Query image: `fixtures/vision-real/raw/medicine-box-query.jpg`
- Source: [2023 Kasetka z lekami.jpg](https://commons.wikimedia.org/wiki/File:2023_Kasetka_z_lekami.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 4.0, 'y': 5.0, 'w': 92.0, 'h': 86.0}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 4.8, 'y': 4.4, 'w': 92.92, 'h': 86.86}`
- IoU: `0.9636`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.995753` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)
  - #2 药盒 / `medicine-box` score `0.995715` image `fixtures/vision-real/raw/medicine-box-gallery-3.jpg` [Pill Dispenser (daily).jpg](https://commons.wikimedia.org/wiki/File:Pill_Dispenser_(daily).jpg)
  - #3 药盒 / `medicine-box` score `0.995651` image `fixtures/vision-real/raw/medicine-box-gallery-2.jpg` [Pill Box (32636946385).jpg](https://commons.wikimedia.org/wiki/File:Pill_Box_(32636946385).jpg)

#### battery-real-query-1

- Query image: `fixtures/vision-real/raw/battery-query.jpg`
- Source: [02 - Single Energizer Battery.jpg](https://commons.wikimedia.org/wiki/File:02_-_Single_Energizer_Battery.jpg)
- GT: 电池 / `battery` / box `{'x': 13.0, 'y': 15.0, 'w': 73.0, 'h': 53.0}`
- Prediction: 电池 / `battery` / box `{'x': 13.8, 'y': 14.4, 'w': 73.73, 'h': 53.53}`
- IoU: `0.9568`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电池 / `battery` score `0.995864` image `fixtures/vision-real/raw/battery-gallery-2.jpg` [AA batteries.JPG](https://commons.wikimedia.org/wiki/File:AA_batteries.JPG)
  - #2 电池 / `battery` score `0.995774` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #3 电池 / `battery` score `0.995722` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)
