# 本地视觉模型评测报告

- Dataset: `20260523-household-cn-index-eval`
- Predictions: `20260523-real-photo-provider-benchmark`
- Index: `20260523-household-cn-owlvit-clip`
- Model: `provider-benchmark`
- Note: Provider benchmark predictions. Real local providers require valid vendor assets and --run-local-models; baselines are explicitly labeled.

## Summary

| Metric | Value |
| --- | ---: |
| Images | 50 |
| Objects | 50 |
| Box recall @ IoU 0.5 | 60% |
| Category accuracy | 44% |
| Name accuracy | 44% |
| Combined accuracy | 34% |
| Rejections | 0 |
| Extra predictions | 6 |

## Cases By Provider

### Local OWL-ViT + CLIP naming

- Provider class: `real-local-model`
- Provider status: `ok`
- Model IDs: `Xenova/owlvit-base-patch32, Xenova/clip-vit-base-patch32`
- Gate: `no-go`

#### storage-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/storage-box/storage-box-cn-eval-004-image.jpg`
- Source: [桌面透明抽屉式收纳盒手账文具置物架书桌上亚克力笔筒整理小盒子_虎窝淘](https://tao.hooos.com/goods_Jp8PXgXfRtkoBwxSXOxivta-2RmPPyFMW0eRVwRs2.html)
- GT: 收纳盒 / `storage-box` / box `{'x': 41.75, 'y': 22.625, 'w': 50.25, 'h': 71.375}`
- Prediction: 旅行收纳袋 / `packing-cube` / box `{'x': 7.25, 'y': 14.125, 'w': 88.875, 'h': 80.375}`
- IoU: `0.5021`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 旅行收纳袋 / `packing-cube` score `0.728912` image `fixtures/vision-household/cn/packing-cube/packing-cube-cn-gallery-002-9.jpg` [斜纹旅行收纳袋九件套旅游行李箱衣服分装收纳包9多功能收纳拉链-阿里巴巴](https://detail.1688.com/offer/683219164325.html)
  - #2 衣柜收纳格 / `closet-organizer` score `0.725362` image `fixtures/vision-household/cn/closet-organizer/closet-organizer-cn-gallery-002-t.jpg` [衣柜衣服收纳格神器宿舍衣物收纳分隔盒装T恤裤子分格抽屉整理箱_虎窝淘](https://tao.hooos.com/goods_POvbzZmC3t67NqONOZUvv3tPt6-7QGWW2swYpavbzBFn.html)
  - #3 浴帽 / `shower-cap` score `0.68656` image `fixtures/vision-household/cn/shower-cap/shower-cap-cn-gallery-001-5.jpg` [云蕾泡泡爽浴帽5个装，防油防水又护发？真实测评揭秘!-浴帽-淘宝百科网](https://bk.taobao.com/k/yumao_12562/b9b227438a7037010f344432ed9e4b68.html)

#### storage-basket-cn-eval-004

- Query image: `fixtures/vision-household/cn/storage-basket/storage-basket-cn-eval-004-hm-home-2025.jpg`
- Source: [HM HOME 2025夏季新款草编收纳篮，轻松打造家居新风尚🌿-其他收纳篮-淘宝百科网](https://bk.taobao.com/k/qitashounalan_6962/088d744c1c528cf78bfef090bff820e1.html)
- GT: 收纳篮 / `storage-basket` / box `{'x': 29.0625, 'y': 53.5156, 'w': 38.9063, 'h': 26.875}`
- Prediction: 装饰篮 / `decorative-basket` / box `{'x': 29.0625, 'y': 53.5156, 'w': 38.9063, 'h': 26.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 装饰篮 / `decorative-basket` score `0.786837` image `fixtures/vision-household/cn/decorative-basket/decorative-basket-cn-gallery-003-image.jpg` [北欧藤编草编花盆植物绿植落地大套盆编织花篮高档轻奢家居装饰篮-阿里巴巴](https://detail.1688.com/offer/697227474722.html)
  - #2 洗漱包 / `toiletry-bag` score `0.771377` image `fixtures/vision-household/cn/toiletry-bag/toiletry-bag-cn-gallery-002-muju.jpg` [日本MUJU无印旅行洗漱包：干湿分离，大容量便携收纳新体验!🧳🌟-洗漱包-淘宝百科网](https://bk.taobao.com/k/xishubao_8187/d6758e0e68e7f8107d3de0642f7354a4.html)
  - #3 装饰篮 / `decorative-basket` score `0.766047` image `fixtures/vision-household/cn/decorative-basket/decorative-basket-cn-gallery-002-image.jpg` [手提篮子藤编柳编创意手工编织小号田园采摘家居收纳装饰篮采摘篮：田园风情，家居必备🌿-购物篮-淘宝百科网](https://bk.taobao.com/k/gouwulan_6309/e339495dc8c79a44ec44c95d6fc80df2.html)

#### drawer-organizer-cn-eval-004

- Query image: `fixtures/vision-household/cn/drawer-organizer/drawer-organizer-cn-eval-004-image.jpg`
- Source: [♔可伸缩收纳盒分隔抽屉式长方形内置厨房餐具桌面化妆品分格整理-阿里巴巴](https://detail.1688.com/offer/890287295798.html)
- GT: 抽屉分隔盒 / `drawer-organizer` / box `{'x': 0.3797, 'y': 10.8677, 'w': 99.6203, 'h': 82.3083}`
- Prediction: 抽屉分隔盒 / `drawer-organizer` / box `{'x': 0.3797, 'y': 10.8677, 'w': 99.6203, 'h': 82.3083}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 抽屉分隔盒 / `drawer-organizer` score `0.795894` image `fixtures/vision-household/cn/drawer-organizer/drawer-organizer-cn-gallery-001-image.jpg` [抽屉收纳分隔自由组合整理分隔盒板分割神器塑料隔断袜子格子隔板_虎窝淘](https://tao.hooos.com/goods_613639296271.html)
  - #2 行李牌 / `luggage-tag` score `0.722157` image `fixtures/vision-household/cn/luggage-tag/luggage-tag-cn-gallery-001-image.jpg` [创意迷彩行李牌旅行箱吊牌 拉杆箱挂牌标签牌行李箱吊牌可定做_虎窝淘](https://tao.hooos.com/goods_570349006169.html)
  - #3 收纳盒 / `storage-box` score `0.716252` image `fixtures/vision-household/cn/storage-box/storage-box-cn-gallery-002-image.jpg` [办公室文件收纳盒抽屉式塑料桌底下多层文具储物学生整理置物柜子_虎窝淘](https://tao.hooos.com/goods_640886710103.html)

#### vacuum-storage-bag-cn-eval-004

- Query image: `fixtures/vision-household/cn/vacuum-storage-bag/vacuum-storage-bag-cn-eval-004-image.jpg`
- Source: [免抽气真空压缩袋棉被被子家用衣服衣物行李箱整理加厚大号收纳袋_虎窝淘](https://tao.hooos.com/goods_630480458209.html)
- GT: 真空压缩袋 / `vacuum-storage-bag` / box `{'x': 14.5, 'y': 44.25, 'w': 69, 'h': 51.125}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### closet-organizer-cn-eval-004

- Query image: `fixtures/vision-household/cn/closet-organizer/closet-organizer-cn-eval-004-image.jpg`
- Source: [千鸟格衣服收纳盒裤子收纳家用衣柜收纳神器分格抽屉式袜子收纳盒_虎窝淘](https://tao.hooos.com/goods_pr62jQ8Cxt7b2aNheeKSptm-mOZQQNu7a79dVnvT0.html)
- GT: 衣柜收纳格 / `closet-organizer` / box `{'x': 2.6496, 'y': 9.6886, 'w': 95.2991, 'h': 82.9585}`
- Prediction: 衣柜收纳格 / `closet-organizer` / box `{'x': 2.6496, 'y': 9.6886, 'w': 95.2991, 'h': 82.9585}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 衣柜收纳格 / `closet-organizer` score `0.877949` image `fixtures/vision-household/cn/closet-organizer/closet-organizer-cn-gallery-003-image.png` [千鸟格收纳箱：家居整理新风尚，衣柜分层神器大揭秘 -衣物收纳柜-淘宝百科网](https://bk.taobao.com/k/yiwushounaju_10579/d0e1bcb880322de895015a3e354d94ed.html)
  - #2 衣柜收纳格 / `closet-organizer` score `0.83923` image `fixtures/vision-household/cn/closet-organizer/closet-organizer-cn-gallery-002-t.jpg` [衣柜衣服收纳格神器宿舍衣物收纳分隔盒装T恤裤子分格抽屉整理箱_虎窝淘](https://tao.hooos.com/goods_POvbzZmC3t67NqONOZUvv3tPt6-7QGWW2swYpavbzBFn.html)
  - #3 湿巾包 / `wet-wipes-pack` score `0.78686` image `fixtures/vision-household/cn/wet-wipes-pack/wet-wipes-pack-cn-gallery-001-image.jpg` [婴儿湿巾柔软毛巾手口屁专用宝宝儿童大包带盖湿巾包家庭实惠装_虎窝淘](https://tao.hooos.com/goods_78dPN0ZS4t5GX3PK45TnnjfMtV-rkOPPMuMn02e0Qof9.html)

#### cable-organizer-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/cable-organizer-box/cable-organizer-box-cn-eval-004-image.jpg`
- Source: [数据线收纳盒带盖充电器电线理线盒：告别杂乱，桌面清爽大法! -插线板收纳盒-淘宝百科网](https://bk.taobao.com/k/chaxianbanshounahe_10156/5486c95c9c78c7f07b9921b83370147e.html)
- GT: 线缆收纳盒 / `cable-organizer-box` / box `{'x': 25.375, 'y': 1.875, 'w': 71.375, 'h': 54.375}`
- Prediction: 衣柜收纳格 / `closet-organizer` / box `{'x': 2.375, 'y': 1.5, 'w': 89, 'h': 95.875}`
- IoU: `0.4067`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 衣柜收纳格 / `closet-organizer` score `0.790328` image `fixtures/vision-household/cn/closet-organizer/closet-organizer-cn-gallery-002-t.jpg` [衣柜衣服收纳格神器宿舍衣物收纳分隔盒装T恤裤子分格抽屉整理箱_虎窝淘](https://tao.hooos.com/goods_POvbzZmC3t67NqONOZUvv3tPt6-7QGWW2swYpavbzBFn.html)
  - #2 螺丝刀 / `screwdriver` score `0.735376` image `fixtures/vision-household/cn/screwdriver/screwdriver-cn-gallery-001-8.jpg` [8件套内六花型螺丝刀中孔梅花套装十字一字米字带磁六角星型改锥_虎窝淘](https://tao.hooos.com/goods_632655433066.html)
  - #3 湿巾包 / `wet-wipes-pack` score `0.734771` image `fixtures/vision-household/cn/wet-wipes-pack/wet-wipes-pack-cn-gallery-001-image.jpg` [婴儿湿巾柔软毛巾手口屁专用宝宝儿童大包带盖湿巾包家庭实惠装_虎窝淘](https://tao.hooos.com/goods_78dPN0ZS4t5GX3PK45TnnjfMtV-rkOPPMuMn02e0Qof9.html)

#### shoe-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/shoe-box/shoe-box-cn-eval-004-aj.jpg`
- Source: [透明全亚克力鞋盒：AJ球鞋收纳展示神器，让你的鞋柜变身艺术品!-鞋盒-淘宝百科网](https://bk.taobao.com/k/xiehe_15507/266e7a508212b03c27893163e5a37546.html)
- GT: 鞋盒 / `shoe-box` / box `{'x': 20.9333, 'y': 5.4, 'w': 78.2667, 'h': 20.5}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### bowl-cn-eval-004

- Query image: `fixtures/vision-household/cn/bowl/bowl-cn-eval-004-image.jpg`
- Source: [陶瓷碗套装创意红瓷喜庆龙凤骨瓷米饭碗带勺结婚碗筷餐具礼品套装_虎窝淘](https://tao.hooos.com/goods_567664716671.html)
- GT: 碗 / `bowl` / box `{'x': 30.875, 'y': 31.375, 'w': 30.75, 'h': 21.875}`
- Prediction: 眼镜盒 / `glasses-case` / box `{'x': 30.875, 'y': 31.375, 'w': 30.75, 'h': 21.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 眼镜盒 / `glasses-case` score `0.784479` image `fixtures/vision-household/cn/glasses-case/glasses-case-cn-gallery-003-ins.jpg` [眼镜盒男近视眼睛盒ins少女简约韩国小清新学生创意个性便携镜盒_虎窝淘](https://tao.hooos.com/goods_591147887146.html)
  - #2 垃圾袋卷 / `trash-bag-roll` score `0.783663` image `fixtures/vision-household/cn/trash-bag-roll/trash-bag-roll-cn-gallery-002-45cm-55cm-30-50.jpg` [彩色点断式小号垃圾袋加厚45cm*55cm*30只/卷江浙沪50卷包邮_虎窝淘](https://tao.hooos.com/goods_8703072555.html)
  - #3 纸巾盒 / `tissue-box` score `0.763861` image `fixtures/vision-household/cn/tissue-box/tissue-box-cn-gallery-003-image.jpg` [实木餐纸巾盒：客厅卫生间的轻奢新宠，高级感满满🌟-纸巾盒-淘宝百科网](https://bk.taobao.com/k/zhijinhe_6489/9eb40a10ba3a5cc2d8ac6e941add80c4.html)

#### plate-cn-eval-004

- Query image: `fixtures/vision-household/cn/plate/plate-cn-eval-004-6.jpg`
- Source: [家用菜盘盘子套装6个菜盘方盘组合创意餐具蒸鱼盘陶瓷饭盘汤碟子_虎窝淘](https://tao.hooos.com/goods_ZQg7dm3c6tQYJxWfBBZIVt6-rkOPPMuM7OqA0oGhJ.html)
- GT: 盘子 / `plate` / box `{'x': 7.125, 'y': 27.75, 'w': 40.5, 'h': 17.875}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### mug-cn-eval-004

- Query image: `fixtures/vision-household/cn/mug/mug-cn-eval-004-diy-diy.jpg`
- Source: [陶瓷马克杯定制杯子diy活动礼品订做马克杯diy可印照片纪念定制图_虎窝淘](https://tao.hooos.com/goods_X4PwzGDfGt9z7oyuVVruBtg-ZWRNNbuGzBJgQOKuOM.html)
- GT: 马克杯 / `mug` / box `{'x': 27.125, 'y': 21.75, 'w': 61.875, 'h': 60.75}`
- Prediction: 马克杯 / `mug` / box `{'x': 27.125, 'y': 21.75, 'w': 61.875, 'h': 60.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 马克杯 / `mug` score `0.85782` image `fixtures/vision-household/cn/mug/mug-cn-gallery-002-logo.jpg` [彩色陶瓷杯马克杯咖啡杯可定 制logo广告礼品陶瓷杯马克杯咖啡杯-阿里巴巴](https://detail.1688.com/offer/689534381206.html)
  - #2 马克杯 / `mug` score `0.855642` image `fixtures/vision-household/cn/mug/mug-cn-gallery-003-diy.jpg` [网红创意双彩纯色热转印马克杯diy图案礼品杯家用水杯陶瓷杯-阿里巴巴](https://detail.1688.com/offer/728053178836.html)
  - #3 马克杯 / `mug` score `0.810432` image `fixtures/vision-household/cn/mug/mug-cn-gallery-001-image.jpg` [可叠马克杯北欧风创意设计情侣陶瓷杯女咖啡泡茶喝水杯子小众精致_虎窝淘](https://tao.hooos.com/goods_668474289581.html)

#### drinking-glass-cn-eval-004

- Query image: `fixtures/vision-household/cn/drinking-glass/drinking-glass-cn-eval-004-image.jpg`
- Source: [富光双层玻璃杯子，男士女士通用的高档泡茶杯-玻璃杯-淘宝好物网](https://goods.taobao.com/t/bolibei_2224/50d66459543557316351e9df0b456223.html)
- GT: 玻璃杯 / `drinking-glass` / box `{'x': 26, 'y': 10.375, 'w': 72.625, 'h': 86.25}`
- Prediction: 玻璃杯 / `drinking-glass` / box `{'x': 26, 'y': 10.375, 'w': 72.625, 'h': 86.25}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 玻璃杯 / `drinking-glass` score `0.910945` image `fixtures/vision-household/cn/drinking-glass/drinking-glass-cn-gallery-003-image.jpg` [富光双层玻璃杯：居家泡茶神器，男士商务必备!-玻璃杯-淘宝好物网](https://goods.taobao.com/t/bolibei_2224/55392a7b5e45f4cd38310f97f10f9e1f.html)
  - #2 线缆收纳盒 / `cable-organizer-box` score `0.763621` image `fixtures/vision-household/cn/cable-organizer-box/cable-organizer-box-cn-gallery-003-image.jpg` [插座插排电线收纳盒电源线整理线盒拖线板藏集线神器桌面遮挡装饰_虎窝淘](https://tao.hooos.com/goods_VBmJabMF6twd0NqRDPu27XtvtV-A7AqqefKYbzAaKbSQ.html)
  - #3 调料瓶 / `spice-jar` score `0.755976` image `fixtures/vision-household/cn/spice-jar/spice-jar-cn-gallery-002-image.jpg` [调料盒厨房家用调料罐子盐罐调料组合套装调味瓶罐调料瓶玻璃油壶_虎窝淘](https://tao.hooos.com/goods_QzpmA98sQt2VzOzhXyriatQ-nMYPPWFx7DoX088szg.html)

#### saucepan-cn-eval-004

- Query image: `fixtures/vision-household/cn/saucepan/saucepan-cn-eval-004-image.jpg`
- Source: [👶厨神必备!炊大皇奶锅，让宝宝辅食烹饪变得如此简单💖-奶锅-淘宝好物网](https://goods.taobao.com/t/naiguo_1587/a5845341e0adb95eccdbd9abeaa57507.html)
- GT: 奶锅 / `saucepan` / box `{'x': 19.75, 'y': 30.625, 'w': 79.25, 'h': 65.5}`
- Prediction: 奶锅 / `saucepan` / box `{'x': 19.75, 'y': 30.625, 'w': 79.25, 'h': 65.5}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 奶锅 / `saucepan` score `0.830635` image `fixtures/vision-household/cn/saucepan/saucepan-cn-gallery-003-316l.jpg` [316L不锈钢奶锅，宝宝辅食必备神器，轻松搞定美味辅食!🍼🍲-奶锅-淘宝百科网](https://bk.taobao.com/k/naiguo_9305/c082d37e52adc1f913823b6f4b6bf13e.html)
  - #2 煎锅 / `frying-pan` score `0.823541` image `fixtures/vision-household/cn/frying-pan/frying-pan-cn-gallery-003-22-24-26-28cm.jpg` [爱仕达22/24/26/28CM煎锅平底锅不粘锅平底煎牛排迷你煤气灶_虎窝淘](https://tao.hooos.com/goods_525895170083.html)
  - #3 奶锅 / `saucepan` score `0.817448` image `fixtures/vision-household/cn/saucepan/saucepan-cn-gallery-001-316l.jpg` [德国无涂层316L不锈钢小奶锅：宝宝辅食的安心之选，妈妈的心头好!-奶锅-淘宝百科网](https://bk.taobao.com/k/naiguo_9305/a8e660a73ee9958a68839016981d6892.html)

#### frying-pan-cn-eval-004

- Query image: `fixtures/vision-household/cn/frying-pan/frying-pan-cn-eval-004-image.jpg`
- Source: [老式铸铁煎锅：复古魅力，烹饪新体验🔥-煎锅-淘宝百科网](https://bk.taobao.com/k/jianguo_13506/1a1a1edec8bf7d912d756bfea09bf376.html)
- GT: 煎锅 / `frying-pan` / box `{'x': 46.8, 'y': 26.5, 'w': 48.6, 'h': 42.2}`
- Prediction: 煎锅 / `frying-pan` / box `{'x': 1.8, 'y': 5, 'w': 53, 'h': 76.8}`
- IoU: `0.0584`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 煎锅 / `frying-pan` score `0.755729` image `fixtures/vision-household/cn/frying-pan/frying-pan-cn-gallery-002-image.jpg` [🔥老式铁锅升级版：平底无涂层牛排煎锅，让你的厨房瞬间高大上!🍳-煎锅-淘宝百科网](https://bk.taobao.com/k/jianguo_13506/2075b25aca1bddec34b1cd61bdd5b47e.html)
  - #2 煎锅 / `frying-pan` score `0.727001` image `fixtures/vision-household/cn/frying-pan/frying-pan-cn-gallery-003-22-24-26-28cm.jpg` [爱仕达22/24/26/28CM煎锅平底锅不粘锅平底煎牛排迷你煤气灶_虎窝淘](https://tao.hooos.com/goods_525895170083.html)
  - #3 菜板 / `cutting-board` score `0.686761` image `fixtures/vision-household/cn/cutting-board/cutting-board-cn-gallery-001-image.jpg` [苏泊尔乌檀木实木菜板抗菌防霉家用砧板木质案板厨房粘板大号沾板_虎窝淘](https://tao.hooos.com/goods_606234098228.html)

#### cutting-board-cn-eval-004

- Query image: `fixtures/vision-household/cn/cutting-board/cutting-board-cn-eval-004-image.jpg`
- Source: [抗菌防霉塑料菜板，厨房必备神器! -砧板-淘宝百科网](https://bk.taobao.com/k/zhenban_4264/27701a9e6eaa2f720001aa8a752a1e29.html)
- GT: 菜板 / `cutting-board` / box `{'x': 0.75, 'y': 28.125, 'w': 98.375, 'h': 53.25}`
- Prediction: 玻璃杯 / `drinking-glass` / box `{'x': 38.25, 'y': 18.125, 'w': 52.75, 'h': 41.875}`
- IoU: `0.2916`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 玻璃杯 / `drinking-glass` score `0.753802` image `fixtures/vision-household/cn/drinking-glass/drinking-glass-cn-gallery-003-image.jpg` [富光双层玻璃杯：居家泡茶神器，男士商务必备!-玻璃杯-淘宝好物网](https://goods.taobao.com/t/bolibei_2224/55392a7b5e45f4cd38310f97f10f9e1f.html)
  - #2 线缆收纳盒 / `cable-organizer-box` score `0.751794` image `fixtures/vision-household/cn/cable-organizer-box/cable-organizer-box-cn-gallery-003-image.jpg` [插座插排电线收纳盒电源线整理线盒拖线板藏集线神器桌面遮挡装饰_虎窝淘](https://tao.hooos.com/goods_VBmJabMF6twd0NqRDPu27XtvtV-A7AqqefKYbzAaKbSQ.html)
  - #3 洗发水 / `shampoo-bottle` score `0.739172` image `fixtures/vision-household/cn/shampoo-bottle/shampoo-bottle-cn-gallery-001-100.jpg` [官方正品100年润发洗发水美洲青柠一百年润发控油去油止痒洗发露_虎窝淘](https://tao.hooos.com/goods_656546443101.html)

#### rice-bag-cn-eval-004

- Query image: `fixtures/vision-household/cn/rice-bag/rice-bag-cn-eval-004-2-5kg10.jpg`
- Source: [五常稻花香米袋小米大米包装袋子牛皮纸定制手提2.5kg10斤装防水_虎窝淘](https://tao.hooos.com/goods_557623835514.html)
- GT: 米袋 / `rice-bag` / box `{'x': 0.25, 'y': 1.75, 'w': 34.375, 'h': 55.625}`
- Prediction: 米袋 / `rice-bag` / box `{'x': 0.25, 'y': 1.75, 'w': 34.375, 'h': 55.625}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 米袋 / `rice-bag` score `0.831983` image `fixtures/vision-household/cn/rice-bag/rice-bag-cn-gallery-002-10-2-5kg5kg.jpg` [大米包装袋10斤装牛皮纸米袋2.5kg5kg农家米袋子小米纸袋定制印刷_虎窝淘](https://tao.hooos.com/goods_664722170663.html)
  - #2 米袋 / `rice-bag` score `0.815819` image `fixtures/vision-household/cn/rice-bag/rice-bag-cn-gallery-003-image.png` [米袋布袋定制为何成为面粉包装新宠？抽绳束口设计有何优势？-棉布袋-淘宝好物网](https://goods.taobao.com/t/mianbudai_4632/4e9f07a9f4414f48fe1e96a969de009b.html)
  - #3 零食袋 / `snack-bag` score `0.811594` image `fixtures/vision-household/cn/snack-bag/snack-bag-cn-gallery-001-image.jpg` [烘焙包装饼干零食袋子桃酥麻花干果坚果打包包装袋中式点心食品袋_虎窝淘](https://tao.hooos.com/goods_630466100072.html)

#### noodle-pack-cn-eval-004

- Query image: `fixtures/vision-household/cn/noodle-pack/noodle-pack-cn-eval-004-8.jpg`
- Source: [福州礼盒线面8包装盈乐长寿面福建特产手工面线糊细挂面生日面条_虎窝淘](https://tao.hooos.com/goods_634161618276.html)
- GT: 面条包装 / `noodle-pack` / box `{'x': 12.75, 'y': 7.5, 'w': 72.75, 'h': 54.375}`
- Prediction: 垃圾袋卷 / `trash-bag-roll` / box `{'x': 12.75, 'y': 7.5, 'w': 72.75, 'h': 54.375}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 垃圾袋卷 / `trash-bag-roll` score `0.795531` image `fixtures/vision-household/cn/trash-bag-roll/trash-bag-roll-cn-gallery-003-image.jpg` [大号塑料垃圾袋卷装商用物业厨房加厚黑色家用户外特大-阿里巴巴](https://detail.1688.com/offer/895620773986.html)
  - #2 香皂 / `soap-bar` score `0.79528` image `fixtures/vision-household/cn/soap-bar/soap-bar-cn-gallery-003-125g.jpg` [舒肤佳香皂纯白清香125g（ 温和滋养 天然植物皂基新老包装随机发货）-融创集采商城](https://wydsmp.sunac.com.cn/goods/2094716)
  - #3 米袋 / `rice-bag` score `0.776532` image `fixtures/vision-household/cn/rice-bag/rice-bag-cn-gallery-001-10-20-30-50.jpg` [大米袋子10斤装20 30 50斤大米编织袋!农家自封米袋太香了!-水泥袋-淘宝好物网](https://goods.taobao.com/t/shuinidai_14291/f3e7e99858b56992f833f44fd0f9e9af.html)

#### canned-food-cn-eval-004

- Query image: `fixtures/vision-household/cn/canned-food/canned-food-cn-eval-004-312gx6.jpg`
- Source: [水果罐头混合装312gx6罐新鲜整箱糖水果橘子黄桃菠萝椰果什锦罐头_虎窝淘](https://tao.hooos.com/goods_624066826188.html)
- GT: 罐头 / `canned-food` / box `{'x': 69.875, 'y': 7.875, 'w': 28.5, 'h': 41.75}`
- Prediction: 垃圾袋卷 / `trash-bag-roll` / box `{'x': 69.875, 'y': 7.875, 'w': 28.5, 'h': 41.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 垃圾袋卷 / `trash-bag-roll` score `0.801413` image `fixtures/vision-household/cn/trash-bag-roll/trash-bag-roll-cn-gallery-003-image.jpg` [大号塑料垃圾袋卷装商用物业厨房加厚黑色家用户外特大-阿里巴巴](https://detail.1688.com/offer/895620773986.html)
  - #2 洗洁精 / `dish-soap` score `0.763536` image `fixtures/vision-household/cn/dish-soap/dish-soap-cn-gallery-002-4-68kg.jpg` [雕牌洗洁精4.68kg大桶：厨房清洁神器，家庭酒店通用!-洗洁精-淘宝好物网](https://goods.taobao.com/t/xijiejing_5616/06dbf05bba7b2e8e631c9156c6aa9eaa.html)
  - #3 洁厕剂 / `toilet-cleaner-bottle` score `0.762421` image `fixtures/vision-household/cn/toilet-cleaner-bottle/toilet-cleaner-bottle-cn-gallery-001-500g.jpg` [超威强力洁厕精500g/瓶洁厕液洁厕剂除尿垢除臭马桶清洁剂洁厕灵_虎窝淘](https://tao.hooos.com/goods_611641715714.html)

#### snack-bag-cn-eval-004

- Query image: `fixtures/vision-household/cn/snack-bag/snack-bag-cn-eval-004-100.jpg`
- Source: [休闲食品自封袋坚果自立袋糖果零食袋子批发 100个零食物语包装袋_虎窝淘](https://tao.hooos.com/goods_624794102528.html)
- GT: 零食袋 / `snack-bag` / box `{'x': 45.5, 'y': 21.375, 'w': 46.125, 'h': 66.875}`
- Prediction: 驱蚊液 / `mosquito-repellent` / box `{'x': 3.375, 'y': 17.25, 'w': 46.875, 'h': 69.375}`
- IoU: `0.0514`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 驱蚊液 / `mosquito-repellent` score `0.833075` image `fixtures/vision-household/cn/mosquito-repellent/mosquito-repellent-cn-gallery-003-ars-saratect-200ml.jpg` [ARS/安速 Saratect驱蚊液200ml：日本进口，夏日防蚊神器大揭秘!-防蚊液-淘宝百科网](https://bk.taobao.com/k/fangwenye_18177/91c6d4ad9daf69a68c7390d0def19853.html)
  - #2 口罩包 / `face-mask-pack` score `0.831278` image `fixtures/vision-household/cn/face-mask-pack/face-mask-pack-cn-gallery-001-image.jpg` [纯棉纱布口罩防工业粉尘透气一次性打磨脱脂防尘可水洗纱口罩包邮_虎窝淘](https://tao.hooos.com/goods_593557714075.html)
  - #3 米袋 / `rice-bag` score `0.814631` image `fixtures/vision-household/cn/rice-bag/rice-bag-cn-gallery-001-10-20-30-50.jpg` [大米袋子10斤装20 30 50斤大米编织袋!农家自封米袋太香了!-水泥袋-淘宝好物网](https://goods.taobao.com/t/shuinidai_14291/f3e7e99858b56992f833f44fd0f9e9af.html)

#### beverage-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/beverage-bottle/beverage-bottle-cn-eval-004-33-2500ml-2-5-pet-5.jpg`
- Source: [33号2500ml/2.5升一次性透明塑料瓶空瓶果汁瓶pet饮料瓶子5斤带盖_虎窝淘](https://tao.hooos.com/goods_MqVZarDtKtJ9xmWuVVmUQtA-PNzeejCnBOOW0pMhY.html)
- GT: 饮料瓶 / `beverage-bottle` / box `{'x': 31.125, 'y': 7.25, 'w': 33.25, 'h': 82}`
- Prediction: 饮料瓶 / `beverage-bottle` / box `{'x': 31.125, 'y': 7.25, 'w': 33.25, 'h': 82}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 饮料瓶 / `beverage-bottle` score `0.896921` image `fixtures/vision-household/cn/beverage-bottle/beverage-bottle-cn-gallery-002-13-500ml.jpg` [13号500ml/毫升一次性透明塑料瓶空瓶矿泉水瓶果汁瓶饮料瓶子带盖_虎窝淘](https://tao.hooos.com/goods_543225313651.html)
  - #2 海绵 / `sponge` score `0.821413` image `fixtures/vision-household/cn/sponge/sponge-cn-gallery-001-2-3-4-diy.png` [揭秘!2寸3寸4寸进口海绵，为何成为DIY达人的最爱？🌟-洗车海绵-淘宝好物网](https://goods.taobao.com/t/xichehaimian_5382/d940378346a7267160599da3e2472f77.html)
  - #3 药瓶 / `pill-bottle` score `0.805393` image `fixtures/vision-household/cn/pill-bottle/pill-bottle-cn-gallery-002-image.jpg` [高品质塑料小瓶，分装神器，让你的粉末药瓶不再凌乱!💊💪-喷瓶-淘宝百科网](https://bk.taobao.com/k/penping_11758/cc8f5347b661f72ef1ea162f6abb4449.html)

#### spice-jar-cn-eval-004

- Query image: `fixtures/vision-household/cn/spice-jar/spice-jar-cn-eval-004-image.jpg`
- Source: [定量控盐瓶调料罐密封罐防潮控盐调料瓶家用厨房调味料瓶组合套装_虎窝淘](https://tao.hooos.com/goods_jGjKVjmyc0tJAPg2mDYtBKeUJte-wzQnnOsQO4naORwsN.html)
- GT: 调料瓶 / `spice-jar` / box `{'x': 35.7333, 'y': 27.4, 'w': 31, 'h': 62.0667}`
- Prediction: 吸尘器 / `vacuum-cleaner` / box `{'x': 35.1333, 'y': 27, 'w': 30.6, 'h': 62}`
- IoU: `0.9365`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 吸尘器 / `vacuum-cleaner` score `0.798547` image `fixtures/vision-household/cn/vacuum-cleaner/vacuum-cleaner-cn-gallery-003-image.jpg` [亿力吸尘器：家庭清洁神器，干湿两用，一机多能!-吸尘器-淘宝好物网](https://goods.taobao.com/t/xichenqi_4854/c342a9597ac60f3b5117a831b9bc67f5.html)
  - #2 驱蚊液 / `mosquito-repellent` score `0.785614` image `fixtures/vision-household/cn/mosquito-repellent/mosquito-repellent-cn-gallery-001-100ml-5.jpg` [雷达欧护驱蚊液佳儿护草本艾叶户外喷雾100ml/瓶宝宝儿童驱蚊水5_虎窝淘](https://tao.hooos.com/goods_geJkYKRc3tvWnn0co7vTatr-mOZQQNuWQ5qbbMXuBe.html)
  - #3 充电器 / `charger` score `0.783263` image `fixtures/vision-household/cn/charger/charger-cn-gallery-003-100w-120w-66w.png` [华为充电器100W超级快充头插120w闪充适用荣耀手机66w原装正品线_虎窝淘](https://tao.hooos.com/goods_Q0Nkez6HQtn9qKRUXyNsatQ-0Rakk7FBxeRGpJmtw.html)

#### medicine-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/medicine-box/medicine-box-cn-eval-004-image.jpg`
- Source: [日本药盒便携一周分装盒，吃药再也不手忙脚乱!💊-药盒-淘宝百科网](https://bk.taobao.com/k/yaohe_5655/7715f52b55552fd1ce4c7716c65f1a9d.html)
- GT: 药盒 / `medicine-box` / box `{'x': 7.25, 'y': 34.25, 'w': 58.25, 'h': 42.875}`
- Prediction: 充电器 / `charger` / box `{'x': 47.125, 'y': 8.25, 'w': 48, 'h': 33.75}`
- IoU: `0.0358`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.793742` image `fixtures/vision-household/cn/charger/charger-cn-gallery-002-100w-nova9-10-11-pro-ultra-90-70-50-magic4-pro.jpg` [华为100W充电器原装超级快充Nova9/10/11/Pro/Ultra荣耀90/70/50/Magic4/Pro/至臻版官方旗舰正品手机充电 ...](https://tao.hooos.com/goods_XzMkGVuGtXOq2jwBGfVV6fBtg-ZWRNNbuARA6eYKkCp.html)
  - #2 线缆收纳盒 / `cable-organizer-box` score `0.782775` image `fixtures/vision-household/cn/cable-organizer-box/cable-organizer-box-cn-gallery-001-image.jpg` [竹木盖带孔电线收纳盒桌面插线板电源线充电器数据线理线盒集线器-阿里巴巴](https://detail.1688.com/offer/735637706033.html)
  - #3 U盘 / `usb-flash-drive` score `0.778292` image `fixtures/vision-household/cn/usb-flash-drive/usb-flash-drive-cn-gallery-001-u-usb3-2-128g-64g-u.jpg` [飞利浦U盘：超高速USB3.2，128G/64G大容量，官方旗舰店正品保障!🚀-普通U盘-淘宝百科网](https://bk.taobao.com/k/putongUpan_8152/2c1cb761159160631f49939a58524382.html)

#### pill-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/pill-bottle/pill-bottle-cn-eval-004-image.jpg`
- Source: [便携塑料小药瓶白色避光小空瓶固体胶囊分装瓶药用片剂包装瓶带盖_虎窝淘](https://tao.hooos.com/goods_601296008600.html)
- GT: 药瓶 / `pill-bottle` / box `{'x': 21.625, 'y': 34.5, 'w': 18.75, 'h': 58.25}`
- Prediction: 电饭煲 / `rice-cooker` / box `{'x': 4.375, 'y': 32.625, 'w': 92.125, 'h': 63.25}`
- IoU: `0.1874`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 电饭煲 / `rice-cooker` score `0.800105` image `fixtures/vision-household/cn/rice-cooker/rice-cooker-cn-gallery-002-image.jpg` [美的春天半球电饭煲，迷你智能，一机多用，让美食不再等待!?-商用电饭煲-淘宝好物网](https://goods.taobao.com/t/shangyongdianfanbao_3790/868dd40ce5c14aabf3365127a057472f.html)
  - #2 药瓶 / `pill-bottle` score `0.790658` image `fixtures/vision-household/cn/pill-bottle/pill-bottle-cn-gallery-002-image.jpg` [高品质塑料小瓶，分装神器，让你的粉末药瓶不再凌乱!💊💪-喷瓶-淘宝百科网](https://bk.taobao.com/k/penping_11758/cc8f5347b661f72ef1ea162f6abb4449.html)
  - #3 调料瓶 / `spice-jar` score `0.789121` image `fixtures/vision-household/cn/spice-jar/spice-jar-cn-gallery-003-image.jpg` [调料盒四个装果酱挤压瓶套装烧烤调料瓶家用酱料瓶厨房透明调味罐_虎窝淘](https://tao.hooos.com/goods_xYkROdmtktqMa9aQPpuQ6DhAt9-4RDrrQF86997JN0Ik.html)

#### thermometer-cn-eval-004

- Query image: `fixtures/vision-household/cn/thermometer/thermometer-cn-eval-004-image.jpg`
- Source: [电子体温计欧德宝：精准测量，守护家人的健康温度!-体温计-淘宝百科网](https://bk.taobao.com/k/tiwenji_6546/6b020ce5a7bd6812a8998595ed429e9c.html)
- GT: 体温计 / `thermometer` / box `{'x': 62.75, 'y': 9.875, 'w': 19.25, 'h': 77.875}`
- Prediction: 垃圾袋卷 / `trash-bag-roll` / box `{'x': 62.75, 'y': 9.875, 'w': 19.25, 'h': 77.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 垃圾袋卷 / `trash-bag-roll` score `0.834297` image `fixtures/vision-household/cn/trash-bag-roll/trash-bag-roll-cn-gallery-002-45cm-55cm-30-50.jpg` [彩色点断式小号垃圾袋加厚45cm*55cm*30只/卷江浙沪50卷包邮_虎窝淘](https://tao.hooos.com/goods_8703072555.html)
  - #2 马桶刷 / `toilet-brush` score `0.832173` image `fixtures/vision-household/cn/toilet-brush/toilet-brush-cn-gallery-003-image.jpg` [马桶刷家用无死角地刷软毛长柄厕所刷子浴室用品壁挂式清洁刷耐用_虎窝淘](https://tao.hooos.com/goods_pOxAkJtxt6RwdpjjxTegyCptm-DokRR8IP9Bgmjaafn.html)
  - #3 驱蚊液 / `mosquito-repellent` score `0.818085` image `fixtures/vision-household/cn/mosquito-repellent/mosquito-repellent-cn-gallery-001-100ml-5.jpg` [雷达欧护驱蚊液佳儿护草本艾叶户外喷雾100ml/瓶宝宝儿童驱蚊水5_虎窝淘](https://tao.hooos.com/goods_geJkYKRc3tvWnn0co7vTatr-mOZQQNuWQ5qbbMXuBe.html)

#### bandage-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/bandage-box/bandage-box-cn-eval-004-5.jpg`
- Source: [医疗促销礼品 可贴牌便携塑料创可贴盒含5片止血贴 创口贴邦迪盒-阿里巴巴](https://detail.1688.com/offer/41419373508.html)
- GT: 创可贴盒 / `bandage-box` / box `{'x': 2.3333, 'y': 23.6667, 'w': 32.2222, 'h': 39.7778}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### first-aid-kit-cn-eval-004

- Query image: `fixtures/vision-household/cn/first-aid-kit/first-aid-kit-cn-eval-004-image.jpg`
- Source: [户外急救包全攻略：红十字会推荐便携医用箱，地震应急必备!-应急包-淘宝百科网](https://bk.taobao.com/k/yingjibao_3523/5a38e2227090da1cd5bb3c437ef9c4bf.html)
- GT: 急救包 / `first-aid-kit` / box `{'x': 33.2639, 'y': 6.1806, 'w': 64.6528, 'h': 9.8611}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### face-mask-pack-cn-eval-004

- Query image: `fixtures/vision-household/cn/face-mask-pack/face-mask-pack-cn-eval-004-954vkn95-3m9041.jpg`
- Source: [口罩954VKN95口罩防装修甲醛粉尘异味3M9041有机气体防护口罩包邮-阿里巴巴](https://detail.1688.com/offer/690036462534.html)
- GT: 口罩包 / `face-mask-pack` / box `{'x': 48.125, 'y': 34.1667, 'w': 14.6094, 'h': 17.9167}`
- Prediction: 剃须刀 / `razor` / box `{'x': 48.125, 'y': 34.1667, 'w': 14.6094, 'h': 17.9167}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 剃须刀 / `razor` score `0.800902` image `fixtures/vision-household/cn/razor/razor-cn-gallery-003-s5166.jpg` [飞利浦剃须刀电动男士官方旗舰店正品刮胡刀胡须刀礼盒礼物S5166_虎窝淘](https://tao.hooos.com/goods_W7aZjbJiotokqvkUarQSQta-Mw0WW4FVKB2wQNDtY.html)
  - #2 充电器 / `charger` score `0.783035` image `fixtures/vision-household/cn/charger/charger-cn-gallery-003-100w-120w-66w.png` [华为充电器100W超级快充头插120w闪充适用荣耀手机66w原装正品线_虎窝淘](https://tao.hooos.com/goods_Q0Nkez6HQtn9qKRUXyNsatQ-0Rakk7FBxeRGpJmtw.html)
  - #3 卷纸 / `toilet-paper-roll` score `0.771337` image `fixtures/vision-household/cn/toilet-paper-roll/toilet-paper-roll-cn-gallery-001-12-240.jpg` [清风12卷240米双层大卷纸：家庭酒店必备，品质生活新选择!-大盘卷纸-淘宝好物网](https://goods.taobao.com/t/dapanjuanzhi_14680/86ad61a557ccb5f84f3bf68aa7508900.html)

#### disinfectant-wipes-cn-eval-004

- Query image: `fixtures/vision-household/cn/disinfectant-wipes/disinfectant-wipes-cn-eval-004-60.jpg`
- Source: [一次性医用消毒湿巾60片装：大包消毒湿巾，随时随地杀菌消毒!-消毒棉片-淘宝好物网](https://goods.taobao.com/t/xiaodumianpian_13445/30444cedfcd79975b148f40eaeaa12bc.html)
- GT: 消毒湿巾 / `disinfectant-wipes` / box `{'x': 0, 'y': 30.75, 'w': 99.375, 'h': 69.25}`
- Prediction: 洗衣液 / `laundry-detergent` / box `{'x': 0, 'y': 30.75, 'w': 99.375, 'h': 69.25}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 洗衣液 / `laundry-detergent` score `0.821484` image `fixtures/vision-household/cn/laundry-detergent/laundry-detergent-cn-gallery-002-10.jpg` [薰衣草香洗衣液10斤装：深层洁净亮白增艳，家庭必备洗衣神器!-手洗洗衣液-淘宝好物网](https://goods.taobao.com/t/shouxixiyiye_2168/4abc4f182cee169212862c81b26f4f23.html)
  - #2 笔 / `pen` score `0.818024` image `fixtures/vision-household/cn/pen/pen-cn-gallery-003-720.jpg` [美卡勒马克笔全套720色绘画笔双头笔套装盒装硬头软头动漫彩色笔_虎窝淘](https://tao.hooos.com/goods_Q2brnbdHQtBxD3o98ZTXyBsatQ-YA3ppxSdn7naj8JcW.html)
  - #3 洁厕剂 / `toilet-cleaner-bottle` score `0.813198` image `fixtures/vision-household/cn/toilet-cleaner-bottle/toilet-cleaner-bottle-cn-gallery-001-500g.jpg` [超威强力洁厕精500g/瓶洁厕液洁厕剂除尿垢除臭马桶清洁剂洁厕灵_虎窝淘](https://tao.hooos.com/goods_611641715714.html)

#### laundry-detergent-cn-eval-004

- Query image: `fixtures/vision-household/cn/laundry-detergent/laundry-detergent-cn-eval-004-3kg-4-24.jpg`
- Source: [蓝月亮洗衣液3Kg*4瓶薰衣草香深层洁净衣物清洁整箱家用24斤大桶_虎窝淘](https://tao.hooos.com/goods_2nXMbGbUotwqnynFaaptDtD-xzQZZ4sO6Yp7k0etA.html)
- GT: 洗衣液 / `laundry-detergent` / box `{'x': 15.125, 'y': 25.25, 'w': 44.625, 'h': 67.875}`
- Prediction: 洗衣液 / `laundry-detergent` / box `{'x': 15.125, 'y': 25.25, 'w': 44.625, 'h': 67.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 洗衣液 / `laundry-detergent` score `0.911018` image `fixtures/vision-household/cn/laundry-detergent/laundry-detergent-cn-gallery-001-1-1kg.jpg` [蓝月亮洗衣液1公斤机洗常规家用官方旗舰正品1kg瓶装持久留香_虎窝淘](https://tao.hooos.com/goods_v9N2dY8UZt0xdnvSAM9U0te-4RDrrQFy4on2veH9.html)
  - #2 洗衣液 / `laundry-detergent` score `0.887906` image `fixtures/vision-household/cn/laundry-detergent/laundry-detergent-cn-gallery-002-10.jpg` [薰衣草香洗衣液10斤装：深层洁净亮白增艳，家庭必备洗衣神器!-手洗洗衣液-淘宝好物网](https://goods.taobao.com/t/shouxixiyiye_2168/4abc4f182cee169212862c81b26f4f23.html)
  - #3 洁厕剂 / `toilet-cleaner-bottle` score `0.874752` image `fixtures/vision-household/cn/toilet-cleaner-bottle/toilet-cleaner-bottle-cn-gallery-003-image.jpg` [超威洁厕净洁厕剂液灵马桶清洁剂强力除垢剂去黄家用卫生间清香型_虎窝淘](https://tao.hooos.com/goods_611818304642.html)

#### dish-soap-cn-eval-004

- Query image: `fixtures/vision-household/cn/dish-soap/dish-soap-cn-eval-004-500g.jpg`
- Source: [雕牌洗洁精小瓶500g全效丝瓜清爽去油餐洗净洗碟精宿舍家用洗涤精_虎窝淘](https://tao.hooos.com/goods_624853574427.html)
- GT: 洗洁精 / `dish-soap` / box `{'x': 38.375, 'y': 29.375, 'w': 23.5, 'h': 61.75}`
- Prediction: 驱蚊液 / `mosquito-repellent` / box `{'x': 39.5, 'y': 32.25, 'w': 23.25, 'h': 59.75}`
- IoU: `0.865`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 驱蚊液 / `mosquito-repellent` score `0.906811` image `fixtures/vision-household/cn/mosquito-repellent/mosquito-repellent-cn-gallery-003-ars-saratect-200ml.jpg` [ARS/安速 Saratect驱蚊液200ml：日本进口，夏日防蚊神器大揭秘!-防蚊液-淘宝百科网](https://bk.taobao.com/k/fangwenye_18177/91c6d4ad9daf69a68c7390d0def19853.html)
  - #2 洗洁精 / `dish-soap` score `0.851613` image `fixtures/vision-household/cn/dish-soap/dish-soap-cn-gallery-003-25-3.jpg` [25年最新必买!超能离子去油洗洁精3瓶装，柠檬护手不伤手厨房神器-洗洁精-淘宝好物网](https://goods.taobao.com/t/xijiejing_5616/727c671f35b2c2146de7b22cbd90d01b.html)
  - #3 洁厕剂 / `toilet-cleaner-bottle` score `0.846538` image `fixtures/vision-household/cn/toilet-cleaner-bottle/toilet-cleaner-bottle-cn-gallery-003-image.jpg` [超威洁厕净洁厕剂液灵马桶清洁剂强力除垢剂去黄家用卫生间清香型_虎窝淘](https://tao.hooos.com/goods_611818304642.html)

#### cleaning-spray-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/cleaning-spray-bottle/cleaning-spray-bottle-cn-eval-004-500ml.jpg`
- Source: [家居护理家政清洁配比瓶安利产品稀释喷瓶喷雾瓶500ml喷头大喷壶-阿里巴巴](https://detail.1688.com/offer/611229856143.html)
- GT: 清洁喷瓶 / `cleaning-spray-bottle` / box `{'x': 28, 'y': 22.125, 'w': 19.125, 'h': 60.75}`
- Prediction: 清洁喷瓶 / `cleaning-spray-bottle` / box `{'x': 28, 'y': 22.125, 'w': 19.125, 'h': 60.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 清洁喷瓶 / `cleaning-spray-bottle` score `0.829741` image `fixtures/vision-household/cn/cleaning-spray-bottle/cleaning-spray-bottle-cn-gallery-001-84.jpg` [喷壶家用非安利喷瓶酒精84消毒专用清洁喷雾瓶洗洁精稀释瓶带刻度_虎窝淘](https://tao.hooos.com/goods_652657850226.html)
  - #2 清洁喷瓶 / `cleaning-spray-bottle` score `0.817589` image `fixtures/vision-household/cn/cleaning-spray-bottle/cleaning-spray-bottle-cn-gallery-003-500-b.jpg` [家用喷壶500洗洁精稀释比例厨房清洁喷雾瓶B款喷壶天蓝色|_虎窝淘](https://tao.hooos.com/goods_MPoZPkrHKtVdr5RCVXJSQtA-rkOPPMuMR9OgDzBuX.html)
  - #3 洗发水 / `shampoo-bottle` score `0.795956` image `fixtures/vision-household/cn/shampoo-bottle/shampoo-bottle-cn-gallery-001-100.jpg` [官方正品100年润发洗发水美洲青柠一百年润发控油去油止痒洗发露_虎窝淘](https://tao.hooos.com/goods_656546443101.html)

#### sponge-cn-eval-004

- Query image: `fixtures/vision-household/cn/sponge/sponge-cn-eval-004-image.jpg`
- Source: [高密度海绵垫子：拯救腰背的神器!可裁剪海棉沙发垫实测太香了!-海绵-淘宝好物网](https://goods.taobao.com/t/haimian_2272/5a020e31cf634481f51b9f34c3621b3b.html)
- GT: 海绵 / `sponge` / box `{'x': 51.2, 'y': 72.5, 'w': 25.4, 'h': 12.7}`
- Prediction: 湿巾包 / `wet-wipes-pack` / box `{'x': 8.6, 'y': 0.5, 'w': 79.5, 'h': 99.5}`
- IoU: `0.0408`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 湿巾包 / `wet-wipes-pack` score `0.771769` image `fixtures/vision-household/cn/wet-wipes-pack/wet-wipes-pack-cn-gallery-001-image.jpg` [婴儿湿巾柔软毛巾手口屁专用宝宝儿童大包带盖湿巾包家庭实惠装_虎窝淘](https://tao.hooos.com/goods_78dPN0ZS4t5GX3PK45TnnjfMtV-rkOPPMuMn02e0Qof9.html)
  - #2 真空压缩袋 / `vacuum-storage-bag` score `0.753252` image `fixtures/vision-household/cn/vacuum-storage-bag/vacuum-storage-bag-cn-gallery-001-image.jpg` [免抽气真空压缩立体袋，衣物收纳神器，旅行必备!🌍-衣物压缩袋-淘宝百科网](https://bk.taobao.com/k/yiwuyasuodai_8928/770ccc61d8f312b0b5618b4380bdf77e.html)
  - #3 洗发水 / `shampoo-bottle` score `0.7429` image `fixtures/vision-household/cn/shampoo-bottle/shampoo-bottle-cn-gallery-001-100.jpg` [官方正品100年润发洗发水美洲青柠一百年润发控油去油止痒洗发露_虎窝淘](https://tao.hooos.com/goods_656546443101.html)

#### trash-bag-roll-cn-eval-004

- Query image: `fixtures/vision-household/cn/trash-bag-roll/trash-bag-roll-cn-eval-004-image.jpg`
- Source: [白色加厚垃圾袋家用一次性点断式塑料袋透明平口大号垃圾桶袋卷装_虎窝淘](https://tao.hooos.com/goods_571439119485.html)
- GT: 垃圾袋卷 / `trash-bag-roll` / box `{'x': 4.125, 'y': 56.125, 'w': 54.25, 'h': 36.625}`
- Prediction: 洗发水 / `shampoo-bottle` / box `{'x': 4.125, 'y': 56.125, 'w': 54.25, 'h': 36.625}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 洗发水 / `shampoo-bottle` score `0.847142` image `fixtures/vision-household/cn/shampoo-bottle/shampoo-bottle-cn-gallery-001-100.jpg` [官方正品100年润发洗发水美洲青柠一百年润发控油去油止痒洗发露_虎窝淘](https://tao.hooos.com/goods_656546443101.html)
  - #2 笔 / `pen` score `0.826679` image `fixtures/vision-household/cn/pen/pen-cn-gallery-003-720.jpg` [美卡勒马克笔全套720色绘画笔双头笔套装盒装硬头软头动漫彩色笔_虎窝淘](https://tao.hooos.com/goods_Q2brnbdHQtBxD3o98ZTXyBsatQ-YA3ppxSdn7naj8JcW.html)
  - #3 洁厕剂 / `toilet-cleaner-bottle` score `0.822019` image `fixtures/vision-household/cn/toilet-cleaner-bottle/toilet-cleaner-bottle-cn-gallery-001-500g.jpg` [超威强力洁厕精500g/瓶洁厕液洁厕剂除尿垢除臭马桶清洁剂洁厕灵_虎窝淘](https://tao.hooos.com/goods_611641715714.html)

#### toilet-cleaner-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/toilet-cleaner-bottle/toilet-cleaner-bottle-cn-eval-004-image.jpg`
- Source: [大瓶洁厕剂洁厕灵马桶便槽除臭去污护釉清洁剂清香不刺鼻洁厕液_虎窝淘](https://tao.hooos.com/goods_604396009583.html)
- GT: 洁厕剂 / `toilet-cleaner-bottle` / box `{'x': 25, 'y': 11.125, 'w': 26, 'h': 88.125}`
- Prediction: 洁厕剂 / `toilet-cleaner-bottle` / box `{'x': 25, 'y': 11.125, 'w': 26, 'h': 88.125}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 洁厕剂 / `toilet-cleaner-bottle` score `0.89033` image `fixtures/vision-household/cn/toilet-cleaner-bottle/toilet-cleaner-bottle-cn-gallery-003-image.jpg` [超威洁厕净洁厕剂液灵马桶清洁剂强力除垢剂去黄家用卫生间清香型_虎窝淘](https://tao.hooos.com/goods_611818304642.html)
  - #2 洗衣液 / `laundry-detergent` score `0.873658` image `fixtures/vision-household/cn/laundry-detergent/laundry-detergent-cn-gallery-002-10.jpg` [薰衣草香洗衣液10斤装：深层洁净亮白增艳，家庭必备洗衣神器!-手洗洗衣液-淘宝好物网](https://goods.taobao.com/t/shouxixiyiye_2168/4abc4f182cee169212862c81b26f4f23.html)
  - #3 洗衣液 / `laundry-detergent` score `0.86867` image `fixtures/vision-household/cn/laundry-detergent/laundry-detergent-cn-gallery-001-1-1kg.jpg` [蓝月亮洗衣液1公斤机洗常规家用官方旗舰正品1kg瓶装持久留香_虎窝淘](https://tao.hooos.com/goods_v9N2dY8UZt0xdnvSAM9U0te-4RDrrQFy4on2veH9.html)

#### mop-head-cn-eval-004

- Query image: `fixtures/vision-household/cn/mop-head/mop-head-cn-eval-004-image.png`
- Source: [加厚吸水旋转拖把头：清洁神器，让你的家务事半功倍!💪-旋转拖把-淘宝百科网](https://bk.taobao.com/k/xuanzhuantuoba_7060/f5eb890109848dc64d5ccc5734643968.html)
- GT: 拖把头 / `mop-head` / box `{'x': 44.875, 'y': 0.25, 'w': 38, 'h': 60.75}`
- Prediction: 线缆收纳盒 / `cable-organizer-box` / box `{'x': 0, 'y': 0, 'w': 50.375, 'h': 37.625}`
- IoU: `0.0514`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 线缆收纳盒 / `cable-organizer-box` score `0.705507` image `fixtures/vision-household/cn/cable-organizer-box/cable-organizer-box-cn-gallery-001-image.jpg` [竹木盖带孔电线收纳盒桌面插线板电源线充电器数据线理线盒集线器-阿里巴巴](https://detail.1688.com/offer/735637706033.html)
  - #2 碗 / `bowl` score `0.69669` image `fixtures/vision-household/cn/bowl/bowl-cn-gallery-002-2024.jpg` [景德镇2024新款简约骨瓷碗，优雅实用的用餐选择？-碗-淘宝好物网](https://goods.taobao.com/t/wan_1585/f5c7b44b69155845a2cca56c4141e4e7.html)
  - #3 小风扇 / `portable-fan` score `0.69319` image `fixtures/vision-household/cn/portable-fan/portable-fan-cn-gallery-003-2022-usb.jpg` [2022新款小风扇usb便携式挂脖折叠风扇超静音手持大风力迷你电扇_虎窝淘](https://tao.hooos.com/goods_641887863975.html)

#### charging-cable-cn-eval-004

- Query image: `fixtures/vision-household/cn/charging-cable/charging-cable-cn-eval-004-25-type-c-vivo-2.jpg`
- Source: [25年必买Type-C弯头数据线｜华为小米vivo快充神器，加长2米超实用!-数据线-淘宝好物网](https://goods.taobao.com/t/shujuxian_1728/e1fb26e96b31392db7ca115f1c17db04.html)
- GT: 数据线 / `charging-cable` / box `{'x': 11.375, 'y': 5.375, 'w': 86.25, 'h': 94.5}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 11.375, 'y': 5.375, 'w': 86.25, 'h': 94.5}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.80522` image `fixtures/vision-household/cn/charging-cable/charging-cable-cn-gallery-001-pd27w-65w-type-c.jpg` [车载数据线四合一超级快充PD27W？65W双Type-C快充线真香警告!-车载数据线-淘宝百科网](https://bk.taobao.com/k/chezaishujuxian_10588/95f3e3ef8dea4c7f5daa7db1fd25086b.html)
  - #2 线缆收纳盒 / `cable-organizer-box` score `0.775169` image `fixtures/vision-household/cn/cable-organizer-box/cable-organizer-box-cn-gallery-003-image.jpg` [插座插排电线收纳盒电源线整理线盒拖线板藏集线神器桌面遮挡装饰_虎窝淘](https://tao.hooos.com/goods_VBmJabMF6twd0NqRDPu27XtvtV-A7AqqefKYbzAaKbSQ.html)
  - #3 消毒湿巾 / `disinfectant-wipes` score `0.767915` image `fixtures/vision-household/cn/disinfectant-wipes/disinfectant-wipes-cn-gallery-002-80-75.jpg` [80片酒精消毒湿巾75度一次性乙醇杀菌抑菌卫生湿纸巾便携式随身装_虎窝淘](https://tao.hooos.com/goods_612730701267.html)

#### charger-cn-eval-004

- Query image: `fixtures/vision-household/cn/charger/charger-cn-eval-004-magsafe.jpg`
- Source: [MagSafe三合一无线充电器：苹果全家桶的终极充电解决方案!-手机充电器-淘宝好物网](https://goods.taobao.com/t/shoujichongdianqi_4125/bd5e056cf1e0a8d89e68849eb39313c1.html)
- GT: 充电器 / `charger` / box `{'x': 9.9167, 'y': 38.3333, 'w': 51.9167, 'h': 55.25}`
- Prediction: 哑铃 / `dumbbell` / box `{'x': 38.8333, 'y': 33.9167, 'w': 29.6667, 'h': 26.4167}`
- IoU: `0.1608`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 哑铃 / `dumbbell` score `0.783043` image `fixtures/vision-household/cn/dumbbell/dumbbell-cn-gallery-003-image.jpg` [纯钢哑铃男士健身器材家用钢制电镀哑铃，轻松增肌，告别健身房!-哑铃-淘宝好物网](https://goods.taobao.com/t/yaling_2509/d14b5649c307c759cf6ea6e6b7330572.html)
  - #2 奶锅 / `saucepan` score `0.776955` image `fixtures/vision-household/cn/saucepan/saucepan-cn-gallery-001-316l.jpg` [德国无涂层316L不锈钢小奶锅：宝宝辅食的安心之选，妈妈的心头好!-奶锅-淘宝百科网](https://bk.taobao.com/k/naiguo_9305/a8e660a73ee9958a68839016981d6892.html)
  - #3 锤子 / `hammer` score `0.775988` image `fixtures/vision-household/cn/hammer/hammer-cn-gallery-003-diy.jpg` [安装锤手工diy皮具辅助打孔敲击工具高密度白蜡木锤双头尼龙锤子_虎窝淘](https://tao.hooos.com/goods_625635595004.html)

#### battery-cn-eval-004

- Query image: `fixtures/vision-household/cn/battery/battery-cn-eval-004-5-7-4-ktv-aa-1-5v.jpg`
- Source: [倍量 5号7号充电电池大容量4节套装KTV套装可代替AA五1.5v锂电池_虎窝淘](https://tao.hooos.com/goods_600127184801.html)
- GT: 电池 / `battery` / box `{'x': 24.75, 'y': 4.875, 'w': 24.375, 'h': 38.25}`
- Prediction: 充电器 / `charger` / box `{'x': 24.75, 'y': 4.875, 'w': 24.375, 'h': 38.25}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 充电器 / `charger` score `0.721061` image `fixtures/vision-household/cn/charger/charger-cn-gallery-001-anker-737-24000mah-140w.jpg` [Anker安克737移动电源24000mah手机平板充电宝140W快充电器彩显_虎窝淘](https://tao.hooos.com/goods_680459790001.html)
  - #2 旅行转换插头 / `travel-adapter` score `0.7078` image `fixtures/vision-household/cn/travel-adapter/travel-adapter-cn-gallery-002-usb.jpg` [公牛USB多国旅行转换插头：全球出行必备神器，轻松解决充电烦恼!-转换插头-淘宝百科网](https://bk.taobao.com/k/zhuanhuanchatou_13673/c13de92ae39d93195ed04cec15c3a236.html)
  - #3 旅行转换插头 / `travel-adapter` score `0.701311` image `fixtures/vision-household/cn/travel-adapter/travel-adapter-cn-gallery-003-usb.jpg` [全球旅行必备神器!公牛USB多国转换插头器，让你出国无忧!-转换插头-淘宝好物网](https://goods.taobao.com/t/zhuanhuanchatou_1772/8fb972fcedd224c661a585482891f0d9.html)

#### power-bank-cn-eval-004

- Query image: `fixtures/vision-household/cn/power-bank/power-bank-cn-eval-004-22-5w-10000-wepost.jpg`
- Source: [品胜22.5W充电宝10000毫安超薄小巧便携式超级快充充电宝轻薄闪充迷你移动电源适用华为小米苹果专用可上飞机 - 小编推荐 - WePost ...](https://www.wepost.com.my/recommends/items/taobao-MOW2ZOfVz8adWw5IZV.html)
- GT: 充电宝 / `power-bank` / box `{'x': 56.5, 'y': 19.25, 'w': 29.625, 'h': 69.125}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### earphones-cn-eval-004

- Query image: `fixtures/vision-household/cn/earphones/earphones-cn-eval-004-ikf-t1.jpg`
- Source: [iKF T1蓝牙耳机头戴式耳机无线新款游戏降噪耳机有线带麦超长待机_虎窝淘](https://tao.hooos.com/goods_668818291173.html)
- GT: 耳机 / `earphones` / box `{'x': 27.375, 'y': 12.875, 'w': 72.625, 'h': 82.625}`
- Prediction: 数据线 / `charging-cable` / box `{'x': 27.375, 'y': 12.875, 'w': 72.625, 'h': 82.625}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 数据线 / `charging-cable` score `0.751419` image `fixtures/vision-household/cn/charging-cable/charging-cable-cn-gallery-001-pd27w-65w-type-c.jpg` [车载数据线四合一超级快充PD27W？65W双Type-C快充线真香警告!-车载数据线-淘宝百科网](https://bk.taobao.com/k/chezaishujuxian_10588/95f3e3ef8dea4c7f5daa7db1fd25086b.html)
  - #2 耳机 / `earphones` score `0.744337` image `fixtures/vision-household/cn/earphones/earphones-cn-gallery-002-w860nb-pro-5-3.jpg` [漫步者 W860NB Pro头戴式主动降噪蓝牙耳机双金标认证降噪耳机 可有线电脑耳机 蓝牙5.3参数配置_规格_性能_功能-苏宁易购](https://www.suning.com/itemcanshu/0071077022/12403560231.html)
  - #3 瑜伽垫 / `yoga-mat` score `0.705523` image `fixtures/vision-household/cn/yoga-mat/yoga-mat-cn-gallery-001-yoga-15mm.jpg` [加厚瑜伽垫 yoga健身垫瑜珈运动垫初学普拉提垫防滑厚度15mm_虎窝淘](https://tao.hooos.com/goods_534646488530.html)

#### usb-flash-drive-cn-eval-004

- Query image: `fixtures/vision-household/cn/usb-flash-drive/usb-flash-drive-cn-eval-004-u350-32g-type-c-u-u.jpg`
- Source: [爱国者U350-32G Type-C U盘：手机电脑双用，数据传输神器!-手机U盘-淘宝好物网](https://goods.taobao.com/t/shoujiUpan_2532/649ba1c594dec5f741aa361cb9dfb1da.html)
- GT: U盘 / `usb-flash-drive` / box `{'x': 13.5, 'y': 13.5, 'w': 77, 'h': 56}`
- Prediction: U盘 / `usb-flash-drive` / box `{'x': 13.5, 'y': 13.5, 'w': 77, 'h': 56}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 U盘 / `usb-flash-drive` score `0.796711` image `fixtures/vision-household/cn/usb-flash-drive/usb-flash-drive-cn-gallery-001-u-usb3-2-128g-64g-u.jpg` [飞利浦U盘：超高速USB3.2，128G/64G大容量，官方旗舰店正品保障!🚀-普通U盘-淘宝百科网](https://bk.taobao.com/k/putongUpan_8152/2c1cb761159160631f49939a58524382.html)
  - #2 数据线 / `charging-cable` score `0.789075` image `fixtures/vision-household/cn/charging-cable/charging-cable-cn-gallery-002-ex-zr-usb-z80-1m.jpg` [卡西欧EX-ZR系列专用USB数据线Z80技术解析：1m直头线的信号完整性设计_数据线_淘宝数码网](https://shuma.taobao.com/topic/shujuxian_238/8076c27463731599f951f714ae98612f.html)
  - #3 U盘 / `usb-flash-drive` score `0.755276` image `fixtures/vision-household/cn/usb-flash-drive/usb-flash-drive-cn-gallery-002-u-cz73-u.jpg` [闪迪U盘 CZ73：🚀极速传输+金属质感，车载礼品首选!🌟-普通U盘-淘宝好物网](https://goods.taobao.com/t/putongUpan_9119/5aff29aa63e3a17f454f0595c07a5e16.html)

#### memory-card-case-cn-eval-004

- Query image: `fixtures/vision-household/cn/memory-card-case/memory-card-case-cn-eval-004-sd-tf-usb-3-0.jpg`
- Source: [耐影存储卡盒卡套SD卡TF卡收纳包相机手机内存卡保护盒储存卡USB 3.0高速读卡器手机读卡器：数码摄影爱好者的必备神器!-包-淘宝百科网](https://bk.taobao.com/k/bao_14745/377457741010f16bfc8374c46319ec75.html)
- GT: 存储卡盒 / `memory-card-case` / box `{'x': 14.875, 'y': 48.875, 'w': 55.875, 'h': 47.75}`
- Prediction: 存储卡盒 / `memory-card-case` / box `{'x': 14.875, 'y': 48.875, 'w': 55.875, 'h': 47.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 存储卡盒 / `memory-card-case` score `0.744428` image `fixtures/vision-household/cn/memory-card-case/memory-card-case-cn-gallery-001-image.jpg` [多合一内存卡盒：锐玛相机存储卡盒，拯救你的数码收纳烦恼!-数码收纳整理包-淘宝好物网](https://goods.taobao.com/t/shumashounazhenglibao_11905/779a70c02b380d563b9cd65b3e5688e4.html)
  - #2 抽屉分隔盒 / `drawer-organizer` score `0.737486` image `fixtures/vision-household/cn/drawer-organizer/drawer-organizer-cn-gallery-002-image.jpg` [厨房抽屉分隔餐具收纳盒家用橱柜内置分格刀叉筷子置物架厨具收纳_虎窝淘](https://tao.hooos.com/goods_V8NJaxZi6tyA576T22jivtV-rkOPPMuMMKXR7Vxck.html)
  - #3 真空压缩袋 / `vacuum-storage-bag` score `0.734408` image `fixtures/vision-household/cn/vacuum-storage-bag/vacuum-storage-bag-cn-gallery-001-image.jpg` [免抽气真空压缩立体袋，衣物收纳神器，旅行必备!🌍-衣物压缩袋-淘宝百科网](https://bk.taobao.com/k/yiwuyasuodai_8928/770ccc61d8f312b0b5618b4380bdf77e.html)

#### remote-control-cn-eval-004

- Query image: `fixtures/vision-household/cn/remote-control/remote-control-cn-eval-004-optoma-h115-tw342-hb3201-hdf321b.jpg`
- Source: [原装全新奥图码Optoma投影仪H115 TW342 HB3201 HDF321B 遥控器_虎窝淘](https://tao.hooos.com/goods_N7wR0gkC5tGBGZXqbmCxx9HRtB-wzQnnOsQa2gJARpIN.html)
- GT: 遥控器 / `remote-control` / box `{'x': 62.9167, 'y': 19.8333, 'w': 22.4167, 'h': 60.5833}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 62.9167, 'y': 19.8333, 'w': 22.4167, 'h': 60.5833}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.891729` image `fixtures/vision-household/cn/remote-control/remote-control-cn-gallery-003-le43e7900-le32e7900.jpg` [包邮灏玺王牌网络液晶电视遥控器LE43E7900 LE32E7900主页键_虎窝淘](https://tao.hooos.com/goods_586782184897.html)
  - #2 遥控器 / `remote-control` score `0.845731` image `fixtures/vision-household/cn/remote-control/remote-control-cn-gallery-002-arc480a4-2-3-5.jpg` [大金空调遥控器通用款!ARC480A4/2/3/5全适配!懒人必备神器!-遥控器-淘宝好物网](https://goods.taobao.com/t/yaokongqi_13041/616f289138d88e40552e0bba4d2f735d.html)
  - #3 遥控器 / `remote-control` score `0.807399` image `fixtures/vision-household/cn/remote-control/remote-control-cn-gallery-001-image.jpg` [万能空调遥控器通用全部款机适用格力美的海尔海信志高科龙奥克斯_虎窝淘](https://tao.hooos.com/goods_2PmDxxkuotOP60eCaaVSDtD-BmWKKNHgBe4xpr6iD.html)

#### electric-kettle-cn-eval-004

- Query image: `fixtures/vision-household/cn/electric-kettle/electric-kettle-cn-eval-004-2l3l.jpg`
- Source: [万利达电热水壶电水壶2L3L不锈钢一体保温自动断电开水壶家用学生_虎窝淘](https://tao.hooos.com/goods_W7Jg6pdfotGXpQMcaresQta-XNReeAC0d5ZyQOes3.html)
- GT: 电水壶 / `electric-kettle` / box `{'x': 6, 'y': 5.625, 'w': 91.125, 'h': 89}`
- Prediction: 电水壶 / `electric-kettle` / box `{'x': 6, 'y': 5.625, 'w': 91.125, 'h': 89}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电水壶 / `electric-kettle` score `0.770814` image `fixtures/vision-household/cn/electric-kettle/electric-kettle-cn-gallery-003-304.jpg` [龙力电水壶家用大容量烧水壶304不锈钢自动断电开水壶酒店商用_虎窝淘](https://tao.hooos.com/goods_622152408921.html)
  - #2 电饭煲 / `rice-cooker` score `0.768704` image `fixtures/vision-household/cn/rice-cooker/rice-cooker-cn-gallery-003-cuckoo-ih-3-2-4.png` [CUCKOO福库进口IH电饭煲家用多功能3升小型智能预约电饭锅 2-4人_虎窝淘](https://tao.hooos.com/goods_BKPnxnBT6t0zzP7uprvirte-JRMPPdFMnpe4a7YuD.html)
  - #3 奶锅 / `saucepan` score `0.731701` image `fixtures/vision-household/cn/saucepan/saucepan-cn-gallery-003-316l.jpg` [316L不锈钢奶锅，宝宝辅食必备神器，轻松搞定美味辅食!🍼🍲-奶锅-淘宝百科网](https://bk.taobao.com/k/naiguo_9305/c082d37e52adc1f913823b6f4b6bf13e.html)

#### rice-cooker-cn-eval-004

- Query image: `fixtures/vision-household/cn/rice-cooker/rice-cooker-cn-eval-004-20-30.jpg`
- Source: [苏电饭煲旗舰款，20-30人食堂必备神器？🔥-商用电饭煲-淘宝好物网](https://goods.taobao.com/t/shangyongdianfanbao_3790/22cceecc30bba51ad654e8307665260d.html)
- GT: 电饭煲 / `rice-cooker` / box `{'x': 17.5, 'y': 85.75, 'w': 24, 'h': 14.125}`
- Prediction: 电饭煲 / `rice-cooker` / box `{'x': 19.75, 'y': 26.375, 'w': 70.5, 'h': 63.375}`
- IoU: `0.0184`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 电饭煲 / `rice-cooker` score `0.846157` image `fixtures/vision-household/cn/rice-cooker/rice-cooker-cn-gallery-003-cuckoo-ih-3-2-4.png` [CUCKOO福库进口IH电饭煲家用多功能3升小型智能预约电饭锅 2-4人_虎窝淘](https://tao.hooos.com/goods_BKPnxnBT6t0zzP7uprvirte-JRMPPdFMnpe4a7YuD.html)
  - #2 奶锅 / `saucepan` score `0.787528` image `fixtures/vision-household/cn/saucepan/saucepan-cn-gallery-001-316l.jpg` [德国无涂层316L不锈钢小奶锅：宝宝辅食的安心之选，妈妈的心头好!-奶锅-淘宝百科网](https://bk.taobao.com/k/naiguo_9305/a8e660a73ee9958a68839016981d6892.html)
  - #3 奶锅 / `saucepan` score `0.776323` image `fixtures/vision-household/cn/saucepan/saucepan-cn-gallery-003-316l.jpg` [316L不锈钢奶锅，宝宝辅食必备神器，轻松搞定美味辅食!🍼🍲-奶锅-淘宝百科网](https://bk.taobao.com/k/naiguo_9305/c082d37e52adc1f913823b6f4b6bf13e.html)

#### air-purifier-filter-cn-eval-004

- Query image: `fixtures/vision-household/cn/air-purifier-filter/air-purifier-filter-cn-eval-004-352-x80-x83-x83c.jpg`
- Source: [352标准滤芯套装：空气净化器滤芯X80/X83/X83C，拯救呼吸的"隐形铠甲"!-净化-淘宝好物网](https://goods.taobao.com/t/jinghua_11148/61ceb4c80f43f7af6447a283ee60d63f.html)
- GT: 空气净化器滤芯 / `air-purifier-filter` / box `{'x': 0, 'y': 48.125, 'w': 36.625, 'h': 50.75}`
- Prediction: 卷尺 / `measuring-tape` / box `{'x': 8.25, 'y': 17.125, 'w': 84, 'h': 69.125}`
- IoU: `0.1643`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 卷尺 / `measuring-tape` score `0.749982` image `fixtures/vision-household/cn/measuring-tape/measuring-tape-cn-gallery-003-5.jpg` [日本进口牧田钢卷尺5米加厚加硬!公英制自动锁？实测真香!-卷尺-淘宝百科网](https://bk.taobao.com/k/juanchi_9687/321d61bf43c1f4a30667fb9fc02c994d.html)
  - #2 锤子 / `hammer` score `0.747444` image `fixtures/vision-household/cn/hammer/hammer-cn-gallery-001-image.jpg` [手锤大小铁锤子工具重型五金榔头多功能纯钢锻打家用万用八角一体_虎窝淘](https://tao.hooos.com/goods_670501552305.html)
  - #3 围巾 / `scarf` score `0.742649` image `fixtures/vision-household/cn/scarf/scarf-cn-gallery-003-cacuss.jpg` [CACUSS羊毛围巾：男友生日礼物首选，温暖又不失商务范儿!-围巾-淘宝好物网](https://goods.taobao.com/t/weijin_3933/f2c8d31cd017793639f37f6f51cb5ead.html)

#### hair-dryer-cn-eval-004

- Query image: `fixtures/vision-household/cn/hair-dryer/hair-dryer-cn-eval-004-h101.jpg`
- Source: [米家吹风机H101：智能科技与高效造型的完美结合-商品-淘宝百科网](https://bk.taobao.com/k/shangpin_1930/52e3a06f14f422d4d010bd92a12dba8a.html)
- GT: 吹风机 / `hair-dryer` / box `{'x': 14.25, 'y': 1, 'w': 75.625, 'h': 34.25}`
- Prediction: 吹风机 / `hair-dryer` / box `{'x': 50, 'y': 3.5, 'w': 39.875, 'h': 94.25}`
- IoU: `0.2491`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 吹风机 / `hair-dryer` score `0.816095` image `fixtures/vision-household/cn/hair-dryer/hair-dryer-cn-gallery-003-5610h-2400w.jpg` [火之凤吹风机5610H 高速电吹风家用大功率发廊级2400W大风力速干低噪音理发店专用恒温护发不伤发吹风筒 钛金灰【图片 价格 品牌 评论】-京东](https://item.m.jd.com/product/10040498033286.html)
  - #2 马桶刷 / `toilet-brush` score `0.757402` image `fixtures/vision-household/cn/toilet-brush/toilet-brush-cn-gallery-003-image.jpg` [马桶刷家用无死角地刷软毛长柄厕所刷子浴室用品壁挂式清洁刷耐用_虎窝淘](https://tao.hooos.com/goods_pOxAkJtxt6RwdpjjxTegyCptm-DokRR8IP9Bgmjaafn.html)
  - #3 锤子 / `hammer` score `0.72206` image `fixtures/vision-household/cn/hammer/hammer-cn-gallery-002-image.jpg` [圆头锤子铁锤五金工具家用手锤小榔头奶头锤子纤维柄安装锤奶子_虎窝淘](https://tao.hooos.com/goods_586066961925.html)

#### vacuum-cleaner-cn-eval-004

- Query image: `fixtures/vision-household/cn/vacuum-cleaner/vacuum-cleaner-cn-eval-004-image.jpg`
- Source: [德国无线吸尘器家用小型大吸力功率强力静低音手持拖地一体洗地机_虎窝淘](https://tao.hooos.com/goods_58moVQTxtYvA7jF77GUMtV-nMYPPWFxV7XjRKqSzb.html)
- GT: 吸尘器 / `vacuum-cleaner` / box `{'x': 26, 'y': 10.625, 'w': 53.875, 'h': 88.875}`
- Prediction: 吸尘器 / `vacuum-cleaner` / box `{'x': 26, 'y': 10.625, 'w': 53.875, 'h': 88.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 吸尘器 / `vacuum-cleaner` score `0.836685` image `fixtures/vision-household/cn/vacuum-cleaner/vacuum-cleaner-cn-gallery-001-fc9735.jpg` [飞利浦FC9735吸尘器：家居清洁新革命，强力除螨，给你洁净生活!💪-吸尘器-淘宝百科网](https://bk.taobao.com/k/xichenqi_1913/f44ca0eafe65c32db5e9dcb7fb3f50cb.html)
  - #2 拖把头 / `mop-head` score `0.822536` image `fixtures/vision-household/cn/mop-head/mop-head-cn-gallery-002-image.jpg` [对折式海绵头拖把头：家居清洁新神器，轻松搞定地面污渍!-胶棉拖把头-淘宝百科网](https://bk.taobao.com/k/jiaomiantuobatou_7070/b453033183e15d215be24481ba12f3de.html)
  - #3 线缆收纳盒 / `cable-organizer-box` score `0.819371` image `fixtures/vision-household/cn/cable-organizer-box/cable-organizer-box-cn-gallery-003-image.jpg` [插座插排电线收纳盒电源线整理线盒拖线板藏集线神器桌面遮挡装饰_虎窝淘](https://tao.hooos.com/goods_VBmJabMF6twd0NqRDPu27XtvtV-A7AqqefKYbzAaKbSQ.html)

#### router-cn-eval-004

- Query image: `fixtures/vision-household/cn/router/router-cn-eval-004-e2627-e2628-ax3000m-wifi6.jpg`
- Source: [中兴E2627/E2628，AX3000M WIFI6路由器，联通版如何选？-普通路由器-淘宝好物网](https://goods.taobao.com/t/putongluyouqi_1489/09d7941c7e9cbfda57cba94190713466.html)
- GT: 路由器 / `router` / box `{'x': 48.8889, 'y': 33.7963, 'w': 38.7037, 'h': 40.9259}`
- Prediction: 路由器 / `router` / box `{'x': 48.8889, 'y': 33.7963, 'w': 38.7037, 'h': 40.9259}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 路由器 / `router` score `0.824717` image `fixtures/vision-household/cn/router/router-cn-gallery-002-fast-1200m-11ac.jpg` [FAST 1200M 11ac双频无线路由器，家庭网络升级新选择？🚀-商品-淘宝百科网](https://bk.taobao.com/k/shangpin_1930/601de37dca5ef23d59725de5de99b9fa.html)
  - #2 路由器 / `router` score `0.818988` image `fixtures/vision-household/cn/router/router-cn-gallery-003-5g-5g.jpg` [工业级5g无线路由器精选和工业级5g无线路由器品牌价格与图片-淘宝商品网](https://pcdetail.taobao.com/p/74abd22be827473b8fff8649eed80bf1)
  - #3 旅行转换插头 / `travel-adapter` score `0.765335` image `fixtures/vision-household/cn/travel-adapter/travel-adapter-cn-gallery-002-usb.jpg` [公牛USB多国旅行转换插头：全球出行必备神器，轻松解决充电烦恼!-转换插头-淘宝百科网](https://bk.taobao.com/k/zhuanhuanchatou_13673/c13de92ae39d93195ed04cec15c3a236.html)

#### screwdriver-cn-eval-004

- Query image: `fixtures/vision-household/cn/screwdriver/screwdriver-cn-eval-004-202-30cm.jpg`
- Source: [202冲磁铬钒钢螺丝刀：解锁30CM长度的高效神器，工具控必备!-螺丝刀-淘宝百科网](https://bk.taobao.com/k/luosidao_6772/9b6f82e46fd8cb6c446ea334c3a5a461.html)
- GT: 螺丝刀 / `screwdriver` / box `{'x': 25.2, 'y': 29.8667, 'w': 69.2, 'h': 67.8667}`
- Prediction: 螺丝刀 / `screwdriver` / box `{'x': 48.5333, 'y': 11.4667, 'w': 27.0667, 'h': 39.7333}`
- IoU: `0.1112`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 螺丝刀 / `screwdriver` score `0.829802` image `fixtures/vision-household/cn/screwdriver/screwdriver-cn-gallery-003-2025-12-1.jpg` [2025刀友12合1多功能螺丝刀套装｜铬钒钢升级版避坑指南+真实测评-螺丝刀-淘宝好物网](https://goods.taobao.com/t/luosidao_7514/3755d077b08ea5345a8443c095f09600.html)
  - #2 笔 / `pen` score `0.79819` image `fixtures/vision-household/cn/pen/pen-cn-gallery-003-720.jpg` [美卡勒马克笔全套720色绘画笔双头笔套装盒装硬头软头动漫彩色笔_虎窝淘](https://tao.hooos.com/goods_Q2brnbdHQtBxD3o98ZTXyBsatQ-YA3ppxSdn7naj8JcW.html)
  - #3 卷尺 / `measuring-tape` score `0.787641` image `fixtures/vision-household/cn/measuring-tape/measuring-tape-cn-gallery-002-5.jpg` [史丹利5米加厚钢卷尺：精准测量，家居必备神器!📏 -卷尺-淘宝百科网](https://bk.taobao.com/k/juanchi_9687/0fe744c76995a29158161f85e0a56b1d.html)

#### scissors-cn-eval-004

- Query image: `fixtures/vision-household/cn/scissors/scissors-cn-eval-004-0603-2.jpg`
- Source: [得力剪刀学生办公手工0603厨房铁皮家用园艺大美工文具剪刀2把装_虎窝淘](https://tao.hooos.com/goods_536393260433.html)
- GT: 剪刀 / `scissors` / box `{'x': 3.875, 'y': 10, 'w': 40.25, 'h': 83.375}`
- Prediction: 剪刀 / `scissors` / box `{'x': 29.375, 'y': 8.625, 'w': 29.125, 'h': 84}`
- IoU: `0.2659`; boxMatch: `False`; categoryMatch: `True`; nameMatch: `True`; combined: `False`
- Top3 index matches:
  - #1 剪刀 / `scissors` score `0.885544` image `fixtures/vision-household/cn/scissors/scissors-cn-gallery-002-image.jpg` [王麻子剪刀：传统手工艺与现代生活的完美融合-商品-淘宝百科网](https://bk.taobao.com/k/shangpin_1930/1ac9108d448f976cfb2e44713ff1f3d0.html)
  - #2 剪刀 / `scissors` score `0.859015` image `fixtures/vision-household/cn/scissors/scissors-cn-gallery-003-hewer-hs-3108.jpg` [德国熙骅HEWER HS-3108安全剪刀：工业级防护，手艺人必备神器!-剪刀-淘宝好物网](https://goods.taobao.com/t/jiandao_2080/e1031c66001067c5f806204a7a5e2295.html)
  - #3 锤子 / `hammer` score `0.814271` image `fixtures/vision-household/cn/hammer/hammer-cn-gallery-002-image.jpg` [圆头锤子铁锤五金工具家用手锤小榔头奶头锤子纤维柄安装锤奶子_虎窝淘](https://tao.hooos.com/goods_586066961925.html)
