# 本地视觉模型评测报告

- Dataset: `20260523-household-index-smoke-50-eval`
- Predictions: `20260523-real-photo-provider-benchmark`
- Index: `20260523-household-owlvit-clip-smoke-50`
- Model: `provider-benchmark`
- Note: Provider benchmark predictions. Real local providers require valid vendor assets and --run-local-models; baselines are explicitly labeled.

## Summary

| Metric | Value |
| --- | ---: |
| Images | 50 |
| Objects | 50 |
| Box recall @ IoU 0.5 | 70% |
| Category accuracy | 50% |
| Name accuracy | 50% |
| Combined accuracy | 42% |
| Rejections | 0 |
| Extra predictions | 8 |

## Cases By Provider

### Local OWL-ViT + CLIP naming

- Provider class: `real-local-model`
- Provider status: `ok`
- Model IDs: `Xenova/owlvit-base-patch32, Xenova/clip-vit-base-patch32`
- Gate: `go`

#### storage-box-real-query-1

- Query image: `fixtures/vision-real/raw/storage-box-query.jpg`
- Source: [Orange plastic storage container on top of a stack.jpg](https://commons.wikimedia.org/wiki/File:Orange_plastic_storage_container_on_top_of_a_stack.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 6, 'y': 8, 'w': 89, 'h': 84}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 14.2188, 'y': 21.9792, 'w': 83.3594, 'h': 78.0208}`
- IoU: `0.6796`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.771597` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)
  - #2 收纳盒 / `storage-box` score `0.731004` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #3 收纳盒 / `storage-box` score `0.673852` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)

#### charging-cable-real-query-1

- Query image: `fixtures/vision-real/raw/charging-cable-query.jpg`
- Source: [USB cable.jpg](https://commons.wikimedia.org/wiki/File:USB_cable.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 5, 'y': 28, 'w': 91, 'h': 45}`
- Prediction: 充电器 / `charger` / box `{'x': 0, 'y': 22.0697, 'w': 95.3125, 'h': 42.5554}`
- IoU: `0.6829`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.822508` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 充电器 / `charger` score `0.789077` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #3 数据线 / `charging-cable` score `0.758752` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### charger-real-query-1

- Query image: `fixtures/vision-real/raw/charger-query.jpg`
- Source: [Apple USB Charger 1 2017-02-02.jpg](https://commons.wikimedia.org/wiki/File:Apple_USB_Charger_1_2017-02-02.jpg)
- GT: 充电器 / `charger` / box `{'x': 37, 'y': 30, 'w': 60, 'h': 36}`
- Prediction: 充电器 / `charger` / box `{'x': 28.6719, 'y': 40.658, 'w': 71.0938, 'h': 46.0635}`
- IoU: `0.3885`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.821868` image `fixtures/vision-real/raw/charger-gallery-1.jpg` [USB wall charger.JPG](https://commons.wikimedia.org/wiki/File:USB_wall_charger.JPG)
  - #2 充电器 / `charger` score `0.808202` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 数据线 / `charging-cable` score `0.801575` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### remote-control-real-query-1

- Query image: `fixtures/vision-real/raw/remote-control-query.jpg`
- Source: [Television remote control - black 01.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_01.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 30, 'y': 0.5, 'w': 41, 'h': 98}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 2.2196, 'y': 0.4242, 'w': 93.6916, 'h': 99.0606}`
- IoU: `0.4329`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.913452` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)
  - #2 遥控器 / `remote-control` score `0.850893` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #3 遥控器 / `remote-control` score `0.808842` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)

#### medicine-box-real-query-1

- Query image: `fixtures/vision-real/raw/medicine-box-query.jpg`
- Source: [2023 Kasetka z lekami.jpg](https://commons.wikimedia.org/wiki/File:2023_Kasetka_z_lekami.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 4, 'y': 5, 'w': 92, 'h': 86}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 5.5469, 'y': 7.2316, 'w': 85.2344, 'h': 82.0339}`
- IoU: `0.8837`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.74138` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)
  - #2 收纳盒 / `storage-box` score `0.655593` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #3 收纳盒 / `storage-box` score `0.638881` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)

#### battery-real-query-1

- Query image: `fixtures/vision-real/raw/battery-query.jpg`
- Source: [02 - Single Energizer Battery.jpg](https://commons.wikimedia.org/wiki/File:02_-_Single_Energizer_Battery.jpg)
- GT: 电池 / `battery` / box `{'x': 13, 'y': 15, 'w': 73, 'h': 53}`
- Prediction: 充电器 / `charger` / box `{'x': 12.8125, 'y': 10.9685, 'w': 68.9063, 'h': 70.5951}`
- IoU: `0.7153`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.633163` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 电池 / `battery` score `0.630359` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)
  - #3 电池 / `battery` score `0.628393` image `fixtures/vision-real/raw/battery-gallery-2.jpg` [AA batteries.JPG](https://commons.wikimedia.org/wiki/File:AA_batteries.JPG)

#### storage-box-commons-eval-02

- Query image: `fixtures/vision-household/smoke-50/storage-box/storage-box-commons-eval-02-file-storage-containers-in-svalbard-global-seed-vault-01-jpg.jpg`
- Source: [File:Storage containers in Svalbard Global Seed Vault 01.jpg](https://commons.wikimedia.org/wiki/File%3AStorage_containers_in_Svalbard_Global_Seed_Vault_01.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 0, 'y': 0, 'w': 99.7917, 'h': 99.2188}`
- Prediction: 充电器 / `charger` / box `{'x': 0, 'y': 0, 'w': 99.7917, 'h': 99.2188}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.62594` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #2 收纳盒 / `storage-box` score `0.624792` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)
  - #3 电池 / `battery` score `0.620514` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)

#### storage-box-commons-eval-03

- Query image: `fixtures/vision-household/smoke-50/storage-box/storage-box-commons-eval-03-file-day-of-service-2015-21253681361-jpg.jpg`
- Source: [File:Day of Service 2015 (21253681361).jpg](https://commons.wikimedia.org/wiki/File%3ADay_of_Service_2015_(21253681361).jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 16.1458, 'y': 72.5313, 'w': 35.2083, 'h': 26.6342}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 16.1458, 'y': 72.5313, 'w': 35.2083, 'h': 26.6342}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.738901` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #2 数据线 / `charging-cable` score `0.731194` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #3 药盒 / `medicine-box` score `0.719041` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)

#### storage-box-commons-eval-04

- Query image: `fixtures/vision-household/smoke-50/storage-box/storage-box-commons-eval-04-file-day-of-service-2015-21245680865-jpg.jpg`
- Source: [File:Day of Service 2015 (21245680865).jpg](https://commons.wikimedia.org/wiki/File%3ADay_of_Service_2015_(21245680865).jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 24.6875, 'y': 58.0668, 'w': 50.3125, 'h': 29.4854}`
- Prediction: 电池 / `battery` / box `{'x': 0.5208, 'y': 38.943, 'w': 24.2708, 'h': 59.5271}`
- IoU: `0.001`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 电池 / `battery` score `0.701143` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #2 充电器 / `charger` score `0.671194` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 数据线 / `charging-cable` score `0.66942` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### storage-box-commons-eval-05

- Query image: `fixtures/vision-household/smoke-50/storage-box/storage-box-commons-eval-05-file-day-of-service-2015-20624556473-jpg.jpg`
- Source: [File:Day of Service 2015 (20624556473).jpg](https://commons.wikimedia.org/wiki/File%3ADay_of_Service_2015_(20624556473).jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 42.9167, 'y': 45.9666, 'w': 23.125, 'h': 14.6732}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### storage-box-commons-eval-06

- Query image: `fixtures/vision-household/smoke-50/storage-box/storage-box-commons-eval-06-file-day-of-service-2015-21253681701-jpg.jpg`
- Source: [File:Day of Service 2015 (21253681701).jpg](https://commons.wikimedia.org/wiki/File%3ADay_of_Service_2015_(21253681701).jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 49.375, 'y': 40.2643, 'w': 24.1667, 'h': 9.8053}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 49.375, 'y': 40.2643, 'w': 24.1667, 'h': 9.8053}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.771745` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #2 收纳盒 / `storage-box` score `0.749899` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #3 药盒 / `medicine-box` score `0.696272` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)

#### storage-box-commons-eval-07

- Query image: `fixtures/vision-household/smoke-50/storage-box/storage-box-commons-eval-07-file-plastic-multi-drawer-storage-cabinets-1-2018-01-30-jpg.jpg`
- Source: [File:Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File%3APlastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 21.3542, 'y': 16.0938, 'w': 55.625, 'h': 76.7969}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 55.5208, 'y': 53.3594, 'w': 18.0208, 'h': 12.2656}`
- IoU: `0.0517`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.547145` image `fixtures/vision-real/raw/storage-box-gallery-3.jpg` [Plastic multi-drawer storage cabinets 1 2018-01-30.jpg](https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets_1_2018-01-30.jpg)
  - #2 收纳盒 / `storage-box` score `0.546261` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #3 收纳盒 / `storage-box` score `0.53298` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)

#### storage-box-commons-eval-08

- Query image: `fixtures/vision-household/smoke-50/storage-box/storage-box-commons-eval-08-file-blue-plastic-storage-organizer-boxes-for-screws-jpg.jpg`
- Source: [File:Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File%3ABlue_plastic_storage_organizer_boxes_for_screws.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 0, 'y': 1.6349, 'w': 99.7917, 'h': 93.3243}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 0, 'y': 1.6349, 'w': 99.7917, 'h': 93.3243}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.689937` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #2 数据线 / `charging-cable` score `0.662823` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 收纳盒 / `storage-box` score `0.641981` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)

#### storage-box-commons-eval-09

- Query image: `fixtures/vision-household/smoke-50/storage-box/storage-box-commons-eval-09-file-gratnells-school-storage-jumbo-tray-in-purple-jpg.jpg`
- Source: [File:Gratnells School Storage Jumbo Tray in Purple.jpg](https://commons.wikimedia.org/wiki/File%3AGratnells_School_Storage_Jumbo_Tray_in_Purple.jpg)
- GT: 收纳盒 / `storage-box` / box `{'x': 13.5417, 'y': 10.1563, 'w': 67.2917, 'h': 84.0625}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 13.5417, 'y': 10.1563, 'w': 67.2917, 'h': 84.0625}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.895913` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)
  - #2 充电器 / `charger` score `0.787005` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #3 收纳盒 / `storage-box` score `0.778736` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)

#### charging-cable-commons-eval-02

- Query image: `fixtures/vision-household/smoke-50/charging-cable/charging-cable-commons-eval-02-file-huawei-ec226-with-usb-cable-3384718751-jpg.jpg`
- Source: [File:Huawei EC226 with USB cable (3384718751).jpg](https://commons.wikimedia.org/wiki/File%3AHuawei_EC226_with_USB_cable_(3384718751).jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 0.8333, 'y': 11.8056, 'w': 79.4792, 'h': 79.1667}`
- Prediction: 充电器 / `charger` / box `{'x': 0.8333, 'y': 11.8056, 'w': 79.4792, 'h': 79.1667}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.737913` image `fixtures/vision-real/raw/charger-gallery-1.jpg` [USB wall charger.JPG](https://commons.wikimedia.org/wiki/File:USB_wall_charger.JPG)
  - #2 充电器 / `charger` score `0.719393` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 遥控器 / `remote-control` score `0.712863` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)

#### charging-cable-commons-eval-03

- Query image: `fixtures/vision-household/smoke-50/charging-cable/charging-cable-commons-eval-03-file-lost-found-mini-usb-ladekabel-jpg.jpg`
- Source: [File:Lost&Found Mini USB LAdekabel.jpg](https://commons.wikimedia.org/wiki/File%3ALost%26Found_Mini_USB_LAdekabel.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 13.125, 'y': 27.5, 'w': 68.9583, 'h': 45.4167}`
- Prediction: 充电器 / `charger` / box `{'x': 13.125, 'y': 27.5, 'w': 68.9583, 'h': 45.4167}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.772347` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 数据线 / `charging-cable` score `0.744746` image `fixtures/vision-real/raw/charging-cable-gallery-3.jpg` [Cavo USB-C = USB-C della Samsung.jpg](https://commons.wikimedia.org/wiki/File:Cavo_USB-C_=_USB-C_della_Samsung.jpg)
  - #3 数据线 / `charging-cable` score `0.733605` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### charging-cable-commons-eval-04

- Query image: `fixtures/vision-household/smoke-50/charging-cable/charging-cable-commons-eval-04-file-usb-c-png.png`
- Source: [File:USB-C.png](https://commons.wikimedia.org/wiki/File%3AUSB-C.png)
- GT: 数据线 / `charging-cable` / box `{'x': 69.9203, 'y': 64.0127, 'w': 27.8884, 'h': 32.4841}`
- Prediction: 充电器 / `charger` / box `{'x': 69.9203, 'y': 64.0127, 'w': 27.8884, 'h': 32.4841}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.785711` image `fixtures/vision-real/raw/charger-gallery-1.jpg` [USB wall charger.JPG](https://commons.wikimedia.org/wiki/File:USB_wall_charger.JPG)
  - #2 充电器 / `charger` score `0.78535` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #3 充电器 / `charger` score `0.782604` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)

#### charging-cable-commons-eval-05

- Query image: `fixtures/vision-household/smoke-50/charging-cable/charging-cable-commons-eval-05-file-usb-broadband-modems-jpg.jpg`
- Source: [File:USB broadband modems.jpg](https://commons.wikimedia.org/wiki/File%3AUSB_broadband_modems.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 6.9444, 'y': 48.7234, 'w': 79.5833, 'h': 20.2128}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### charging-cable-commons-eval-06

- Query image: `fixtures/vision-household/smoke-50/charging-cable/charging-cable-commons-eval-06-file-usb-a-and-usb-micro-b-connectors-in-the-power-bank-jpg.jpg`
- Source: [File:USB-A and USB micro B connectors in the power bank.jpg](https://commons.wikimedia.org/wiki/File%3AUSB-A_and_USB_micro_B_connectors_in_the_power_bank.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 25.4167, 'y': 8.6806, 'w': 43.6458, 'h': 23.6111}`
- Prediction: 电池 / `battery` / box `{'x': 25.4167, 'y': 8.6806, 'w': 43.6458, 'h': 23.6111}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 电池 / `battery` score `0.80904` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #2 数据线 / `charging-cable` score `0.803562` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #3 充电器 / `charger` score `0.780856` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)

#### charging-cable-commons-eval-07

- Query image: `fixtures/vision-household/smoke-50/charging-cable/charging-cable-commons-eval-07-file-usb-a-b-cable-agr-jpg.jpg`
- Source: [File:USB A & B cable.agr.jpg](https://commons.wikimedia.org/wiki/File%3AUSB_A_%26_B_cable.agr.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 16.0417, 'y': 0.625, 'w': 83.3333, 'h': 93.3333}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### charging-cable-commons-eval-08

- Query image: `fixtures/vision-household/smoke-50/charging-cable/charging-cable-commons-eval-08-file-10base-t1s-to-usb-media-converter-png.png`
- Source: [File:10BASE-T1S-To-USB Media Converter.png](https://commons.wikimedia.org/wiki/File%3A10BASE-T1S-To-USB_Media_Converter.png)
- GT: 数据线 / `charging-cable` / box `{'x': 44.7742, 'y': 12.9151, 'w': 31.6129, 'h': 8.8561}`
- Prediction: 充电器 / `charger` / box `{'x': 30.5806, 'y': 1.476, 'w': 65.8065, 'h': 87.6384}`
- IoU: `0.0485`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.619438` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 数据线 / `charging-cable` score `0.61759` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #3 充电器 / `charger` score `0.607879` image `fixtures/vision-real/raw/charger-gallery-1.jpg` [USB wall charger.JPG](https://commons.wikimedia.org/wiki/File:USB_wall_charger.JPG)

#### charging-cable-commons-eval-09

- Query image: `fixtures/vision-household/smoke-50/charging-cable/charging-cable-commons-eval-09-file-five-usb-cables-with-braided-jackets-in-different-colours-jpg.jpg`
- Source: [File:Five USB cables with braided jackets in different colours.jpg](https://commons.wikimedia.org/wiki/File%3AFive_USB_cables_with_braided_jackets_in_different_colours.jpg)
- GT: 数据线 / `charging-cable` / box `{'x': 1.9792, 'y': 39.2722, 'w': 75.5208, 'h': 53.0705}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### charger-commons-eval-02

- Query image: `fixtures/vision-household/smoke-50/charger/charger-commons-eval-02-file-ladeger-t-jpg.jpg`
- Source: [File:Ladegerät.jpg](https://commons.wikimedia.org/wiki/File%3ALadeger%C3%A4t.jpg)
- GT: 充电器 / `charger` / box `{'x': 8.0208, 'y': 0.2778, 'w': 82.7083, 'h': 94.1667}`
- Prediction: 充电器 / `charger` / box `{'x': 8.0208, 'y': 0.2778, 'w': 82.7083, 'h': 94.1667}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.766435` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 收纳盒 / `storage-box` score `0.720737` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #3 遥控器 / `remote-control` score `0.711702` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)

#### charger-commons-eval-03

- Query image: `fixtures/vision-household/smoke-50/charger/charger-commons-eval-03-file-usb-aa-battery-charger-1-jpg.jpg`
- Source: [File:USB AA battery charger 1.jpg](https://commons.wikimedia.org/wiki/File%3AUSB_AA_battery_charger_1.jpg)
- GT: 充电器 / `charger` / box `{'x': 56.9792, 'y': 26.25, 'w': 21.3542, 'h': 17.6389}`
- Prediction: 充电器 / `charger` / box `{'x': 10.1042, 'y': 21.5278, 'w': 77.1875, 'h': 55.2778}`
- IoU: `0.0883`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.707525` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #2 充电器 / `charger` score `0.65741` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 收纳盒 / `storage-box` score `0.646011` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)

#### charger-commons-eval-04

- Query image: `fixtures/vision-household/smoke-50/charger/charger-commons-eval-04-file-usb-aa-battery-charger-3-jpg.jpg`
- Source: [File:USB AA battery charger 3.jpg](https://commons.wikimedia.org/wiki/File%3AUSB_AA_battery_charger_3.jpg)
- GT: 充电器 / `charger` / box `{'x': 17.7083, 'y': 25.5556, 'w': 66.875, 'h': 68.3333}`
- Prediction: 充电器 / `charger` / box `{'x': 17.7083, 'y': 25.5556, 'w': 66.875, 'h': 68.3333}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.743536` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 数据线 / `charging-cable` score `0.72503` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #3 充电器 / `charger` score `0.719379` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)

#### charger-commons-eval-05

- Query image: `fixtures/vision-household/smoke-50/charger/charger-commons-eval-05-file-usb-aa-battery-charger-2-jpg.jpg`
- Source: [File:USB AA battery charger 2.jpg](https://commons.wikimedia.org/wiki/File%3AUSB_AA_battery_charger_2.jpg)
- GT: 充电器 / `charger` / box `{'x': 15.7292, 'y': 12.0833, 'w': 72.8125, 'h': 73.8889}`
- Prediction: 充电器 / `charger` / box `{'x': 15.7292, 'y': 12.0833, 'w': 72.8125, 'h': 73.8889}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.787868` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #2 充电器 / `charger` score `0.783019` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 数据线 / `charging-cable` score `0.781873` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### charger-commons-eval-06

- Query image: `fixtures/vision-household/smoke-50/charger/charger-commons-eval-06-file-nikon-mh-18a-battery-charger-jpg.jpg`
- Source: [File:Nikon MH-18a battery charger.jpg](https://commons.wikimedia.org/wiki/File%3ANikon_MH-18a_battery_charger.jpg)
- GT: 充电器 / `charger` / box `{'x': 16.875, 'y': 11.2202, 'w': 67.6042, 'h': 80.3647}`
- Prediction: 充电器 / `charger` / box `{'x': 16.875, 'y': 11.2202, 'w': 67.6042, 'h': 80.3647}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.827107` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #2 充电器 / `charger` score `0.804052` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 数据线 / `charging-cable` score `0.754573` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### charger-commons-eval-07

- Query image: `fixtures/vision-household/smoke-50/charger/charger-commons-eval-07-file-universal-battery-charger-charging-jpg.jpg`
- Source: [File:Universal battery charger charging.jpg](https://commons.wikimedia.org/wiki/File%3AUniversal_battery_charger_charging.jpg)
- GT: 充电器 / `charger` / box `{'x': 9.8191, 'y': 5.2326, 'w': 86.8217, 'h': 93.9922}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 9.8191, 'y': 5.2326, 'w': 86.8217, 'h': 93.9922}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.717027` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #2 数据线 / `charging-cable` score `0.664983` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 电池 / `battery` score `0.646038` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)

#### charger-commons-eval-08

- Query image: `fixtures/vision-household/smoke-50/charger/charger-commons-eval-08-file-buck-converter-stepdown-3a-usb-charger-and-supply-img-20170202-2107-jpg.jpg`
- Source: [File:Buck converter stepdown 3A USB Charger and Supply IMG 20170202 2107.jpg](https://commons.wikimedia.org/wiki/File%3ABuck_converter_stepdown_3A_USB_Charger_and_Supply_IMG_20170202_2107.jpg)
- GT: 充电器 / `charger` / box `{'x': 1.0417, 'y': 9.661, 'w': 91.9792, 'h': 81.1864}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 59.2708, 'y': 61.1864, 'w': 21.875, 'h': 26.4407}`
- IoU: `0.0775`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.744532` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #2 充电器 / `charger` score `0.687372` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 电池 / `battery` score `0.677721` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)

#### charger-commons-eval-09

- Query image: `fixtures/vision-household/smoke-50/charger/charger-commons-eval-09-file-canon-battery-charger-cb2lte-1290-jpg.jpg`
- Source: [File:Canon battery charger CB2LTE-1290.jpg](https://commons.wikimedia.org/wiki/File%3ACanon_battery_charger_CB2LTE-1290.jpg)
- GT: 充电器 / `charger` / box `{'x': 4.7917, 'y': 14.7222, 'w': 93.9583, 'h': 74.8611}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### remote-control-commons-eval-02

- Query image: `fixtures/vision-household/smoke-50/remote-control/remote-control-commons-eval-02-file-remote-control-infrared-jpg.jpg`
- Source: [File:Remote-Control-Infrared.jpg](https://commons.wikimedia.org/wiki/File%3ARemote-Control-Infrared.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 0.2604, 'y': 0, 'w': 98.1771, 'h': 99.4141}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### remote-control-commons-eval-03

- Query image: `fixtures/vision-household/smoke-50/remote-control/remote-control-commons-eval-03-file-remote-infrared-jpg.jpg`
- Source: [File:Remote infrared.jpg](https://commons.wikimedia.org/wiki/File%3ARemote_infrared.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 9.1667, 'y': 41.2676, 'w': 70.4167, 'h': 38.7324}`
- Prediction: 充电器 / `charger` / box `{'x': 9.1667, 'y': 41.2676, 'w': 70.4167, 'h': 38.7324}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.885389` image `fixtures/vision-real/raw/charger-gallery-1.jpg` [USB wall charger.JPG](https://commons.wikimedia.org/wiki/File:USB_wall_charger.JPG)
  - #2 充电器 / `charger` score `0.821258` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 数据线 / `charging-cable` score `0.767632` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### remote-control-commons-eval-04

- Query image: `fixtures/vision-household/smoke-50/remote-control/remote-control-commons-eval-04-file-avermedia-rm-rh-remote-control-white-background-edit-jpg.jpg`
- Source: [File:AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File%3AAverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 20.7292, 'y': 19.375, 'w': 63.0208, 'h': 64.2188}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 20.7292, 'y': 19.375, 'w': 63.0208, 'h': 64.2188}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.97986` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)
  - #2 遥控器 / `remote-control` score `0.794218` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #3 充电器 / `charger` score `0.779048` image `fixtures/vision-real/raw/charger-gallery-1.jpg` [USB wall charger.JPG](https://commons.wikimedia.org/wiki/File:USB_wall_charger.JPG)

#### remote-control-commons-eval-05

- Query image: `fixtures/vision-household/smoke-50/remote-control/remote-control-commons-eval-05-file-remote-controls-jpg.jpg`
- Source: [File:Remote controls.JPG](https://commons.wikimedia.org/wiki/File%3ARemote_controls.JPG)
- GT: 遥控器 / `remote-control` / box `{'x': 85.8333, 'y': 4.878, 'w': 13.8542, 'h': 86.8902}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 85.8333, 'y': 4.878, 'w': 13.8542, 'h': 86.8902}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.851` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #2 遥控器 / `remote-control` score `0.819793` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)
  - #3 遥控器 / `remote-control` score `0.757097` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)

#### remote-control-commons-eval-06

- Query image: `fixtures/vision-household/smoke-50/remote-control/remote-control-commons-eval-06-file-remote-control-control-remoto-jpg.jpg`
- Source: [File:Remote control - control remoto.jpg](https://commons.wikimedia.org/wiki/File%3ARemote_control_-_control_remoto.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 4.0541, 'y': 5.6911, 'w': 83.1081, 'h': 89.4309}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 4.0541, 'y': 5.6911, 'w': 83.1081, 'h': 89.4309}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.856367` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #2 遥控器 / `remote-control` score `0.799163` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)
  - #3 遥控器 / `remote-control` score `0.777193` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)

#### remote-control-commons-eval-07

- Query image: `fixtures/vision-household/smoke-50/remote-control/remote-control-commons-eval-07-file-nuon-n2000-remote-control-jpg.jpg`
- Source: [File:Nuon-N2000-Remote-Control.jpg](https://commons.wikimedia.org/wiki/File%3ANuon-N2000-Remote-Control.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 5.1042, 'y': 2.6824, 'w': 93.75, 'h': 94.0987}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 5.1042, 'y': 2.6824, 'w': 93.75, 'h': 94.0987}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.853774` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #2 遥控器 / `remote-control` score `0.849372` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)
  - #3 遥控器 / `remote-control` score `0.737508` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)

#### remote-control-commons-eval-08

- Query image: `fixtures/vision-household/smoke-50/remote-control/remote-control-commons-eval-08-file-television-remote-control-unbranded-4028-jpg.jpg`
- Source: [File:Television remote control - unbranded-4028.jpg](https://commons.wikimedia.org/wiki/File%3ATelevision_remote_control_-_unbranded-4028.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 4.7917, 'y': 6.0417, 'w': 88.9583, 'h': 92.2917}`
- Prediction: 充电器 / `charger` / box `{'x': 4.7917, 'y': 6.0417, 'w': 88.9583, 'h': 92.2917}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.815752` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 充电器 / `charger` score `0.792488` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #3 遥控器 / `remote-control` score `0.771378` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)

#### remote-control-commons-eval-09

- Query image: `fixtures/vision-household/smoke-50/remote-control/remote-control-commons-eval-09-file-lg-ir-dvd-remote-control-6711r1p089k-jpg.jpg`
- Source: [File:LG IR DVD Remote Control 6711R1P089K.jpg](https://commons.wikimedia.org/wiki/File%3ALG_IR_DVD_Remote_Control_6711R1P089K.jpg)
- GT: 遥控器 / `remote-control` / box `{'x': 26.0417, 'y': 3.6907, 'w': 45.8333, 'h': 82.5425}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 26.0417, 'y': 3.6907, 'w': 45.8333, 'h': 82.5425}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.861404` image `fixtures/vision-real/raw/remote-control-gallery-3.jpg` [Remote control for Hisense TV.jpg](https://commons.wikimedia.org/wiki/File:Remote_control_for_Hisense_TV.jpg)
  - #2 遥控器 / `remote-control` score `0.852255` image `fixtures/vision-real/raw/remote-control-gallery-1.jpg` [Television remote control - black colour.jpg](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_black_colour.jpg)
  - #3 遥控器 / `remote-control` score `0.7954` image `fixtures/vision-real/raw/remote-control-gallery-2.jpg` [AverMedia RM-RH Remote control (white background) edit.jpg](https://commons.wikimedia.org/wiki/File:AverMedia_RM-RH_Remote_control_(white_background)_edit.jpg)

#### medicine-box-commons-eval-02

- Query image: `fixtures/vision-household/smoke-50/medicine-box/medicine-box-commons-eval-02-file-pill-box-with-pills-jpg.jpg`
- Source: [File:Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File%3APill_box_with_pills.JPG)
- GT: 药盒 / `medicine-box` / box `{'x': 6.25, 'y': 38.0556, 'w': 83.5417, 'h': 32.0833}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 6.25, 'y': 38.0556, 'w': 83.5417, 'h': 32.0833}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.938397` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)
  - #2 数据线 / `charging-cable` score `0.654279` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #3 药盒 / `medicine-box` score `0.654158` image `fixtures/vision-real/raw/medicine-box-gallery-3.jpg` [Pill Dispenser (daily).jpg](https://commons.wikimedia.org/wiki/File:Pill_Dispenser_(daily).jpg)

#### medicine-box-commons-eval-03

- Query image: `fixtures/vision-household/smoke-50/medicine-box/medicine-box-commons-eval-03-file-pill-dispenser-daily-jpg.jpg`
- Source: [File:Pill Dispenser (daily).jpg](https://commons.wikimedia.org/wiki/File%3APill_Dispenser_(daily).jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 2.2581, 'y': 47.9487, 'w': 97.7419, 'h': 47.9487}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 2.2581, 'y': 47.9487, 'w': 97.7419, 'h': 47.9487}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `1` image `fixtures/vision-real/raw/medicine-box-gallery-3.jpg` [Pill Dispenser (daily).jpg](https://commons.wikimedia.org/wiki/File:Pill_Dispenser_(daily).jpg)
  - #2 药盒 / `medicine-box` score `0.657181` image `fixtures/vision-real/raw/medicine-box-gallery-1.jpg` [Pill box with pills.JPG](https://commons.wikimedia.org/wiki/File:Pill_box_with_pills.JPG)
  - #3 数据线 / `charging-cable` score `0.529784` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### medicine-box-commons-eval-04

- Query image: `fixtures/vision-household/smoke-50/medicine-box/medicine-box-commons-eval-04-file-pill-box-for-spanish-or-french-speakers-32518630336-jpg.jpg`
- Source: [File:Pill Box for Spanish or French Speakers (32518630336).jpg](https://commons.wikimedia.org/wiki/File%3APill_Box_for_Spanish_or_French_Speakers_(32518630336).jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 1.3542, 'y': 19.0402, 'w': 98.6458, 'h': 71.8266}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 0.9375, 'y': 18.7307, 'w': 99.0625, 'h': 71.6718}`
- IoU: `0.9851`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.749513` image `fixtures/vision-real/raw/medicine-box-gallery-2.jpg` [Pill Box (32636946385).jpg](https://commons.wikimedia.org/wiki/File:Pill_Box_(32636946385).jpg)
  - #2 收纳盒 / `storage-box` score `0.616665` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #3 收纳盒 / `storage-box` score `0.613488` image `fixtures/vision-real/raw/storage-box-gallery-2.jpg` [Gratnells Extra Deep Storage Tray.jpg](https://commons.wikimedia.org/wiki/File:Gratnells_Extra_Deep_Storage_Tray.jpg)

#### medicine-box-commons-eval-05

- Query image: `fixtures/vision-household/smoke-50/medicine-box/medicine-box-commons-eval-05-file-pill-box-32636946385-jpg.jpg`
- Source: [File:Pill Box (32636946385).jpg](https://commons.wikimedia.org/wiki/File%3APill_Box_(32636946385).jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 8.3333, 'y': 20.9064, 'w': 89.7917, 'h': 63.5965}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 8.3333, 'y': 20.9064, 'w': 89.7917, 'h': 63.5965}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.918602` image `fixtures/vision-real/raw/medicine-box-gallery-2.jpg` [Pill Box (32636946385).jpg](https://commons.wikimedia.org/wiki/File:Pill_Box_(32636946385).jpg)
  - #2 收纳盒 / `storage-box` score `0.674482` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #3 数据线 / `charging-cable` score `0.645844` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### medicine-box-commons-eval-06

- Query image: `fixtures/vision-household/smoke-50/medicine-box/medicine-box-commons-eval-06-file-pill-box-24888074919-jpg.jpg`
- Source: [File:Pill Box (24888074919).jpg](https://commons.wikimedia.org/wiki/File%3APill_Box_(24888074919).jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 0.3125, 'y': 3.0769, 'w': 99.6875, 'h': 95.7265}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 0.3125, 'y': 3.0769, 'w': 99.6875, 'h': 95.7265}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.751676` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #2 充电器 / `charger` score `0.72693` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #3 药盒 / `medicine-box` score `0.722898` image `fixtures/vision-real/raw/medicine-box-gallery-2.jpg` [Pill Box (32636946385).jpg](https://commons.wikimedia.org/wiki/File:Pill_Box_(32636946385).jpg)

#### medicine-box-commons-eval-07

- Query image: `fixtures/vision-household/smoke-50/medicine-box/medicine-box-commons-eval-07-file-pill-box-warkworth-2022-03-27-3-jpg.jpg`
- Source: [File:Pill Box, Warkworth (2022-03-27) 3.jpg](https://commons.wikimedia.org/wiki/File%3APill_Box%2C_Warkworth_(2022-03-27)_3.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 13.75, 'y': 0, 'w': 69.5833, 'h': 99.6875}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### medicine-box-commons-eval-08

- Query image: `fixtures/vision-household/smoke-50/medicine-box/medicine-box-commons-eval-08-file-pill-box-warkworth-2022-03-27-2-jpg.jpg`
- Source: [File:Pill Box, Warkworth (2022-03-27) 2.jpg](https://commons.wikimedia.org/wiki/File%3APill_Box%2C_Warkworth_(2022-03-27)_2.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 20, 'y': 37.4306, 'w': 16.9792, 'h': 6.1111}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### medicine-box-commons-eval-09

- Query image: `fixtures/vision-household/smoke-50/medicine-box/medicine-box-commons-eval-09-file-pill-box-warkworth-2022-03-27-5-jpg.jpg`
- Source: [File:Pill Box, Warkworth (2022-03-27) 5.jpg](https://commons.wikimedia.org/wiki/File%3APill_Box%2C_Warkworth_(2022-03-27)_5.jpg)
- GT: 药盒 / `medicine-box` / box `{'x': 0, 'y': 81.8056, 'w': 23.5417, 'h': 18.1944}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 0, 'y': 81.8056, 'w': 23.5417, 'h': 18.1944}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.726803` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
  - #2 收纳盒 / `storage-box` score `0.708771` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #3 充电器 / `charger` score `0.699568` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)

#### battery-commons-eval-02

- Query image: `fixtures/vision-household/smoke-50/battery/battery-commons-eval-02-file-alkali-battery-5-jpg.jpg`
- Source: [File:Alkali battery 5.jpg](https://commons.wikimedia.org/wiki/File%3AAlkali_battery_5.jpg)
- GT: 电池 / `battery` / box `{'x': 73.0208, 'y': 12.8898, 'w': 24.0625, 'h': 75.052}`
- Prediction: 电池 / `battery` / box `{'x': 73.0208, 'y': 12.8898, 'w': 24.0625, 'h': 75.052}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电池 / `battery` score `0.711688` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #2 电池 / `battery` score `0.67358` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)
  - #3 数据线 / `charging-cable` score `0.662491` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)

#### battery-commons-eval-03

- Query image: `fixtures/vision-household/smoke-50/battery/battery-commons-eval-03-file-aa-battery-adapter-jpg.jpg`
- Source: [File:AA battery adapter.jpg](https://commons.wikimedia.org/wiki/File%3AAA_battery_adapter.jpg)
- GT: 电池 / `battery` / box `{'x': 6.5625, 'y': 4.6563, 'w': 81.875, 'h': 85.255}`
- Prediction: 收纳盒 / `storage-box` / box `{'x': 6.5625, 'y': 4.6563, 'w': 81.875, 'h': 85.255}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 收纳盒 / `storage-box` score `0.714364` image `fixtures/vision-real/raw/storage-box-gallery-1.jpg` [Blue plastic storage organizer boxes for screws.jpg](https://commons.wikimedia.org/wiki/File:Blue_plastic_storage_organizer_boxes_for_screws.jpg)
  - #2 充电器 / `charger` score `0.707991` image `fixtures/vision-real/raw/charger-gallery-2.jpg` [ADTEC-USBcharger-APD-V140AC2-BK 001.jpg](https://commons.wikimedia.org/wiki/File:ADTEC-USBcharger-APD-V140AC2-BK_001.jpg)
  - #3 数据线 / `charging-cable` score `0.691056` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)

#### battery-commons-eval-04

- Query image: `fixtures/vision-household/smoke-50/battery/battery-commons-eval-04-file-02-single-energizer-battery-jpg.jpg`
- Source: [File:02 - Single Energizer Battery.jpg](https://commons.wikimedia.org/wiki/File%3A02_-_Single_Energizer_Battery.jpg)
- GT: 电池 / `battery` / box `{'x': 13.75, 'y': 12.7726, 'w': 68.4375, 'h': 70.8723}`
- Prediction: 充电器 / `charger` / box `{'x': 13.75, 'y': 12.7726, 'w': 68.4375, 'h': 70.8723}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.657895` image `fixtures/vision-real/raw/charger-gallery-3.jpg` [Mobile phone charger plugs.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone_charger_plugs.jpg)
  - #2 数据线 / `charging-cable` score `0.655329` image `fixtures/vision-real/raw/charging-cable-gallery-2.jpg` [Apple usb extension cable.JPG](https://commons.wikimedia.org/wiki/File:Apple_usb_extension_cable.JPG)
  - #3 电池 / `battery` score `0.652526` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)

#### battery-commons-eval-05

- Query image: `fixtures/vision-household/smoke-50/battery/battery-commons-eval-05-file-6-most-common-battery-types-1-jpg.jpg`
- Source: [File:6 most common battery types-1.jpg](https://commons.wikimedia.org/wiki/File%3A6_most_common_battery_types-1.jpg)
- GT: 电池 / `battery` / box `{'x': 62.0833, 'y': 34.5972, 'w': 6.7708, 'h': 64.6919}`
- Prediction: 电池 / `battery` / box `{'x': 62.0833, 'y': 34.5972, 'w': 6.7708, 'h': 64.6919}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电池 / `battery` score `0.64161` image `fixtures/vision-real/raw/battery-gallery-3.jpg` [AA Batteries (51825378856).jpg](https://commons.wikimedia.org/wiki/File:AA_Batteries_(51825378856).jpg)
  - #2 电池 / `battery` score `0.607008` image `fixtures/vision-real/raw/battery-gallery-1.jpg` [2500 mAh NiMH Battery - AA (11469147674).jpg](https://commons.wikimedia.org/wiki/File:2500_mAh_NiMH_Battery_-_AA_(11469147674).jpg)
  - #3 数据线 / `charging-cable` score `0.575109` image `fixtures/vision-real/raw/charging-cable-gallery-1.jpg` [Universal Serial Bus, USB.JPG](https://commons.wikimedia.org/wiki/File:Universal_Serial_Bus,_USB.JPG)
