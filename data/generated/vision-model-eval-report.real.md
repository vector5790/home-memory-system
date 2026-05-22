# 本地视觉模型评测报告

- Dataset: `20260522-commons-household-real-eval`
- Predictions: `20260522-real-photo-gt-assisted-output`
- Index: `20260522-commons-real-photo-index`
- Model: `gt-assisted-real-photo-fixture`
- Note: This validates the real-photo evaluation report and Top3 index display. It is not a measured local model run because this workspace does not contain vendor local model assets.

## Summary

| Metric | Value |
| --- | ---: |
| Images | 6 |
| Objects | 6 |
| Box recall @ IoU 0.5 | 100% |
| Name accuracy | 100% |
| Combined accuracy | 100% |
| Extra predictions | 0 |

## Cases

### storage-box-real-query-1

- Query image: `fixtures/vision-real/raw/storage-box-query.jpg`
- Source: [Orange plastic storage container on top of a stack.jpg](https://commons.wikimedia.org/wiki/File:Orange_plastic_storage_container_on_top_of_a_stack.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 6.0, 'y': 8.0, 'w': 89.0, 'h': 84.0}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 6.8, 'y': 7.4, 'w': 89.89, 'h': 84.84}`
- IoU: `0.963`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.995972` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #2 收纳盒 / `storage-box` score `0.995892` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #3 收纳盒 / `storage-box` score `0.995852` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)

### charging-cable-real-query-1

- Query image: `fixtures/vision-real/raw/charging-cable-query.jpg`
- Source: [USB cable.jpg](https://commons.wikimedia.org/wiki/File:USB_cable.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 5.0, 'y': 28.0, 'w': 91.0, 'h': 45.0}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 5.8, 'y': 27.4, 'w': 91.91, 'h': 45.45}`
- IoU: `0.9571`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.995874` image `fixtures/vision-real/raw/charging-cable-gallery-3.jpg` [Cavo USB-C = USB-C della Samsung.jpg](https://commons.wikimedia.org/wiki/File:Cavo_USB-C_=_USB-C_della_Samsung.jpg)
  - #2 数据线 / `charging-cable` score `0.995822` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 数据线 / `charging-cable` score `0.995709` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

### charger-real-query-1

- Query image: `fixtures/vision-real/raw/charger-query.jpg`
- Source: [Apple USB Charger 1 2017-02-02.jpg](https://commons.wikimedia.org/wiki/File:Apple_USB_Charger_1_2017-02-02.jpg)
- GT: 充电器 / `charger` / box `{'x': 37.0, 'y': 30.0, 'w': 60.0, 'h': 36.0}`
- Prediction: 充电器 / `charger` / box `{'x': 37.8, 'y': 29.4, 'w': 60.6, 'h': 36.36}`
- IoU: `0.9424`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.995933` image `fixtures/vision-real/raw/charger-gallery-1.jpg` [USB wall charger.JPG](https://commons.wikimedia.org/wiki/File:USB_wall_charger.JPG)
  - #2 充电器 / `charger` score `0.995848` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #3 充电器 / `charger` score `0.995694` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)

### remote-control-real-query-1

- Query image: `fixtures/vision-real/raw/remote-control-query.jpg`
- Source: [Television remote control - black 01.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_01.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 30.0, 'y': 0.5, 'w': 41.0, 'h': 98.0}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 30.8, 'y': 0.0, 'w': 41.41, 'h': 98.98}`
- IoU: `0.9431`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.99593` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)
  - #2 遥控器 / `remote-control` score `0.995795` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)
  - #3 遥控器 / `remote-control` score `0.995599` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)

### medicine-box-real-query-1

- Query image: `fixtures/vision-real/raw/medicine-box-query.jpg`
- Source: [2023 Kasetka z lekami.jpg](https://commons.wikimedia.org/wiki/File:2023_Kasetka_z_lekami.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 4.0, 'y': 5.0, 'w': 92.0, 'h': 86.0}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 4.8, 'y': 4.4, 'w': 92.92, 'h': 86.86}`
- IoU: `0.9636`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.995753` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)
  - #2 药盒 / `medicine-box` score `0.995715` image `fixtures/vision-real/raw/medicine-box-gallery-3.jpg` [Pill Dispenser (daily).jpg](https://commons.wikimedia.org/wiki/File:Pill_Dispenser_(daily).jpg)
  - #3 药盒 / `medicine-box` score `0.995651` image `fixtures/vision-real/raw/medicine-box-gallery-2.jpg` [Pill Box (32636946385).jpg](https://commons.wikimedia.org/wiki/File:Pill_Box_(32636946385).jpg)

### battery-real-query-1

- Query image: `fixtures/vision-real/raw/battery-query.jpg`
- Source: [02 - Single Energizer Battery.jpg](https://commons.wikimedia.org/wiki/File:02_-_Single_Energizer_Battery.jpg)
- GT: 电池 / `battery` / box `{'x': 13.0, 'y': 15.0, 'w': 73.0, 'h': 53.0}`
- Prediction: 电池 / `battery` / box `{'x': 13.8, 'y': 14.4, 'w': 73.73, 'h': 53.53}`
- IoU: `0.9568`; boxMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电池 / `battery` score `0.995864` image `fixtures/vision-real/raw/battery-gallery-2.jpg` [AA batteries.JPG](https://commons.wikimedia.org/wiki/File:AA_batteries.JPG)
  - #2 电池 / `battery` score `0.995774` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #3 电池 / `battery` score `0.995722` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)
