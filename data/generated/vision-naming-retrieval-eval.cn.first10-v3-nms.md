# 命名检索评测报告

- Run: 2026-05-25-subject-detection-cn-first10-v3-nms-run
- Index: 20260523-household-cn-owlvit-clip
- Existing naming eval: 20260522-seed-report
- Generated: 2026-05-25T15:31:18.405Z

## Summary

- 主体标注选中主框：7
- 具备 index embedding 覆盖的选中主框：5
- 标注集命名检索可评估率：0.7143
- 已有 50 图 Top1 命中率：0.44
- 已有 50 图 Top3 命中率：0.5
- 已有 50 图名称准确率：0.44
- 已有 50 图 combined 准确率：0.34
- 平均检测耗时：2724.855 ms
- 平均 embedding 耗时：18.251 ms
- 平均检索耗时：0.594 ms

> 主体标注集当前用于检查 selected crop 是否具备命名检索条件；实际 topK 命名准确率引用已有 50 张 household-index 本地 OWL-ViT + CLIP benchmark。

## 标注主框索引覆盖

| Image | 类目 | 主框模型 | 检测分 | Index entries | Embeddings | 可评估 |
| --- | --- | --- | ---: | ---: | ---: | --- |
| cable-organizer-box-subject-cn-01 | 线缆收纳盒 | grounding-dino:normalized-1024 | 0.746192 | 3 | 3 | yes |
| closet-organizer-subject-cn-01 | 衣柜收纳格 | grounding-dino:normalized-1024 | 0.670138 | 3 | 3 | yes |
| document-storage-box-subject-cn-01 | 文件收纳箱 | grounding-dino:normalized-1024 | 0.63685 | 0 | 0 | no |
| folding-storage-crate-subject-cn-01 | 折叠收纳筐 | grounding-dino:normalized-1024 | 0.515498 | 0 | 0 | no |
| shoe-box-subject-cn-01 | 鞋盒 | grounding-dino:normalized-1024 | 0.656917 | 3 | 3 | yes |
| storage-basket-subject-cn-01 | 收纳篮 | grounding-dino:normalized-1024 | 0.629283 | 3 | 3 | yes |
| storage-box-subject-cn-01 | 收纳盒 | grounding-dino:normalized-1024 | 0.577594 | 3 | 3 | yes |

## 已有命名 Benchmark 明细

| Image | GT | Pred | IoU | Box | Category | Name | Combined | Top3 |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| storage-box-cn-eval-004 | 收纳盒 / storage-box | 旅行收纳袋 / packing-cube | 0.5021 | true | false | false | false | #1 旅行收纳袋 0.728912<br>#2 衣柜收纳格 0.725362<br>#3 浴帽 0.68656 |
| storage-basket-cn-eval-004 | 收纳篮 / storage-basket | 装饰篮 / decorative-basket | 1 | true | false | false | false | #1 装饰篮 0.786837<br>#2 洗漱包 0.771377<br>#3 装饰篮 0.766047 |
| drawer-organizer-cn-eval-004 | 抽屉分隔盒 / drawer-organizer | 抽屉分隔盒 / drawer-organizer | 1 | true | true | true | true | #1 抽屉分隔盒 0.795894<br>#2 行李牌 0.722157<br>#3 收纳盒 0.716252 |
| vacuum-storage-bag-cn-eval-004 | 真空压缩袋 / vacuum-storage-bag | - / - | 0 | false | false | false | false | - |
| closet-organizer-cn-eval-004 | 衣柜收纳格 / closet-organizer | 衣柜收纳格 / closet-organizer | 1 | true | true | true | true | #1 衣柜收纳格 0.877949<br>#2 衣柜收纳格 0.83923<br>#3 湿巾包 0.78686 |
| cable-organizer-box-cn-eval-004 | 线缆收纳盒 / cable-organizer-box | 衣柜收纳格 / closet-organizer | 0.4067 | false | false | false | false | #1 衣柜收纳格 0.790328<br>#2 螺丝刀 0.735376<br>#3 湿巾包 0.734771 |
| shoe-box-cn-eval-004 | 鞋盒 / shoe-box | - / - | 0 | false | false | false | false | - |
| bowl-cn-eval-004 | 碗 / bowl | 眼镜盒 / glasses-case | 1 | true | false | false | false | #1 眼镜盒 0.784479<br>#2 垃圾袋卷 0.783663<br>#3 纸巾盒 0.763861 |
| plate-cn-eval-004 | 盘子 / plate | - / - | 0 | false | false | false | false | - |
| mug-cn-eval-004 | 马克杯 / mug | 马克杯 / mug | 1 | true | true | true | true | #1 马克杯 0.85782<br>#2 马克杯 0.855642<br>#3 马克杯 0.810432 |
| drinking-glass-cn-eval-004 | 玻璃杯 / drinking-glass | 玻璃杯 / drinking-glass | 1 | true | true | true | true | #1 玻璃杯 0.910945<br>#2 线缆收纳盒 0.763621<br>#3 调料瓶 0.755976 |
| saucepan-cn-eval-004 | 奶锅 / saucepan | 奶锅 / saucepan | 1 | true | true | true | true | #1 奶锅 0.830635<br>#2 煎锅 0.823541<br>#3 奶锅 0.817448 |
| frying-pan-cn-eval-004 | 煎锅 / frying-pan | 煎锅 / frying-pan | 0.0584 | false | true | true | false | #1 煎锅 0.755729<br>#2 煎锅 0.727001<br>#3 菜板 0.686761 |
| cutting-board-cn-eval-004 | 菜板 / cutting-board | 玻璃杯 / drinking-glass | 0.2916 | false | false | false | false | #1 玻璃杯 0.753802<br>#2 线缆收纳盒 0.751794<br>#3 洗发水 0.739172 |
| rice-bag-cn-eval-004 | 米袋 / rice-bag | 米袋 / rice-bag | 1 | true | true | true | true | #1 米袋 0.831983<br>#2 米袋 0.815819<br>#3 零食袋 0.811594 |
| noodle-pack-cn-eval-004 | 面条包装 / noodle-pack | 垃圾袋卷 / trash-bag-roll | 1 | true | false | false | false | #1 垃圾袋卷 0.795531<br>#2 香皂 0.79528<br>#3 米袋 0.776532 |
| canned-food-cn-eval-004 | 罐头 / canned-food | 垃圾袋卷 / trash-bag-roll | 1 | true | false | false | false | #1 垃圾袋卷 0.801413<br>#2 洗洁精 0.763536<br>#3 洁厕剂 0.762421 |
| snack-bag-cn-eval-004 | 零食袋 / snack-bag | 驱蚊液 / mosquito-repellent | 0.0514 | false | false | false | false | #1 驱蚊液 0.833075<br>#2 口罩包 0.831278<br>#3 米袋 0.814631 |
| beverage-bottle-cn-eval-004 | 饮料瓶 / beverage-bottle | 饮料瓶 / beverage-bottle | 1 | true | true | true | true | #1 饮料瓶 0.896921<br>#2 海绵 0.821413<br>#3 药瓶 0.805393 |
| spice-jar-cn-eval-004 | 调料瓶 / spice-jar | 吸尘器 / vacuum-cleaner | 0.9365 | true | false | false | false | #1 吸尘器 0.798547<br>#2 驱蚊液 0.785614<br>#3 充电器 0.783263 |
| medicine-box-cn-eval-004 | 药盒 / medicine-box | 充电器 / charger | 0.0358 | false | false | false | false | #1 充电器 0.793742<br>#2 线缆收纳盒 0.782775<br>#3 U盘 0.778292 |
| pill-bottle-cn-eval-004 | 药瓶 / pill-bottle | 电饭煲 / rice-cooker | 0.1874 | false | false | false | false | #1 电饭煲 0.800105<br>#2 药瓶 0.790658<br>#3 调料瓶 0.789121 |
| thermometer-cn-eval-004 | 体温计 / thermometer | 垃圾袋卷 / trash-bag-roll | 1 | true | false | false | false | #1 垃圾袋卷 0.834297<br>#2 马桶刷 0.832173<br>#3 驱蚊液 0.818085 |
| bandage-box-cn-eval-004 | 创可贴盒 / bandage-box | - / - | 0 | false | false | false | false | - |
| first-aid-kit-cn-eval-004 | 急救包 / first-aid-kit | - / - | 0 | false | false | false | false | - |
| face-mask-pack-cn-eval-004 | 口罩包 / face-mask-pack | 剃须刀 / razor | 1 | true | false | false | false | #1 剃须刀 0.800902<br>#2 充电器 0.783035<br>#3 卷纸 0.771337 |
| disinfectant-wipes-cn-eval-004 | 消毒湿巾 / disinfectant-wipes | 洗衣液 / laundry-detergent | 1 | true | false | false | false | #1 洗衣液 0.821484<br>#2 笔 0.818024<br>#3 洁厕剂 0.813198 |
| laundry-detergent-cn-eval-004 | 洗衣液 / laundry-detergent | 洗衣液 / laundry-detergent | 1 | true | true | true | true | #1 洗衣液 0.911018<br>#2 洗衣液 0.887906<br>#3 洁厕剂 0.874752 |
| dish-soap-cn-eval-004 | 洗洁精 / dish-soap | 驱蚊液 / mosquito-repellent | 0.865 | true | false | false | false | #1 驱蚊液 0.906811<br>#2 洗洁精 0.851613<br>#3 洁厕剂 0.846538 |
| cleaning-spray-bottle-cn-eval-004 | 清洁喷瓶 / cleaning-spray-bottle | 清洁喷瓶 / cleaning-spray-bottle | 1 | true | true | true | true | #1 清洁喷瓶 0.829741<br>#2 清洁喷瓶 0.817589<br>#3 洗发水 0.795956 |
| sponge-cn-eval-004 | 海绵 / sponge | 湿巾包 / wet-wipes-pack | 0.0408 | false | false | false | false | #1 湿巾包 0.771769<br>#2 真空压缩袋 0.753252<br>#3 洗发水 0.7429 |
| trash-bag-roll-cn-eval-004 | 垃圾袋卷 / trash-bag-roll | 洗发水 / shampoo-bottle | 1 | true | false | false | false | #1 洗发水 0.847142<br>#2 笔 0.826679<br>#3 洁厕剂 0.822019 |
| toilet-cleaner-bottle-cn-eval-004 | 洁厕剂 / toilet-cleaner-bottle | 洁厕剂 / toilet-cleaner-bottle | 1 | true | true | true | true | #1 洁厕剂 0.89033<br>#2 洗衣液 0.873658<br>#3 洗衣液 0.86867 |
| mop-head-cn-eval-004 | 拖把头 / mop-head | 线缆收纳盒 / cable-organizer-box | 0.0514 | false | false | false | false | #1 线缆收纳盒 0.705507<br>#2 碗 0.69669<br>#3 小风扇 0.69319 |
| charging-cable-cn-eval-004 | 数据线 / charging-cable | 数据线 / charging-cable | 1 | true | true | true | true | #1 数据线 0.80522<br>#2 线缆收纳盒 0.775169<br>#3 消毒湿巾 0.767915 |
| charger-cn-eval-004 | 充电器 / charger | 哑铃 / dumbbell | 0.1608 | false | false | false | false | #1 哑铃 0.783043<br>#2 奶锅 0.776955<br>#3 锤子 0.775988 |
| battery-cn-eval-004 | 电池 / battery | 充电器 / charger | 1 | true | false | false | false | #1 充电器 0.721061<br>#2 旅行转换插头 0.7078<br>#3 旅行转换插头 0.701311 |
| power-bank-cn-eval-004 | 充电宝 / power-bank | - / - | 0 | false | false | false | false | - |
| earphones-cn-eval-004 | 耳机 / earphones | 数据线 / charging-cable | 1 | true | false | false | false | #1 数据线 0.751419<br>#2 耳机 0.744337<br>#3 瑜伽垫 0.705523 |
| usb-flash-drive-cn-eval-004 | U盘 / usb-flash-drive | U盘 / usb-flash-drive | 1 | true | true | true | true | #1 U盘 0.796711<br>#2 数据线 0.789075<br>#3 U盘 0.755276 |
| memory-card-case-cn-eval-004 | 存储卡盒 / memory-card-case | 存储卡盒 / memory-card-case | 1 | true | true | true | true | #1 存储卡盒 0.744428<br>#2 抽屉分隔盒 0.737486<br>#3 真空压缩袋 0.734408 |
| remote-control-cn-eval-004 | 遥控器 / remote-control | 遥控器 / remote-control | 1 | true | true | true | true | #1 遥控器 0.891729<br>#2 遥控器 0.845731<br>#3 遥控器 0.807399 |
| electric-kettle-cn-eval-004 | 电水壶 / electric-kettle | 电水壶 / electric-kettle | 1 | true | true | true | true | #1 电水壶 0.770814<br>#2 电饭煲 0.768704<br>#3 奶锅 0.731701 |
| rice-cooker-cn-eval-004 | 电饭煲 / rice-cooker | 电饭煲 / rice-cooker | 0.0184 | false | true | true | false | #1 电饭煲 0.846157<br>#2 奶锅 0.787528<br>#3 奶锅 0.776323 |
| air-purifier-filter-cn-eval-004 | 空气净化器滤芯 / air-purifier-filter | 卷尺 / measuring-tape | 0.1643 | false | false | false | false | #1 卷尺 0.749982<br>#2 锤子 0.747444<br>#3 围巾 0.742649 |
| hair-dryer-cn-eval-004 | 吹风机 / hair-dryer | 吹风机 / hair-dryer | 0.2491 | false | true | true | false | #1 吹风机 0.816095<br>#2 马桶刷 0.757402<br>#3 锤子 0.72206 |
| vacuum-cleaner-cn-eval-004 | 吸尘器 / vacuum-cleaner | 吸尘器 / vacuum-cleaner | 1 | true | true | true | true | #1 吸尘器 0.836685<br>#2 拖把头 0.822536<br>#3 线缆收纳盒 0.819371 |
| router-cn-eval-004 | 路由器 / router | 路由器 / router | 1 | true | true | true | true | #1 路由器 0.824717<br>#2 路由器 0.818988<br>#3 旅行转换插头 0.765335 |
| screwdriver-cn-eval-004 | 螺丝刀 / screwdriver | 螺丝刀 / screwdriver | 0.1112 | false | true | true | false | #1 螺丝刀 0.829802<br>#2 笔 0.79819<br>#3 卷尺 0.787641 |
| scissors-cn-eval-004 | 剪刀 / scissors | 剪刀 / scissors | 0.2659 | false | true | true | false | #1 剪刀 0.885544<br>#2 剪刀 0.859015<br>#3 锤子 0.814271 |
