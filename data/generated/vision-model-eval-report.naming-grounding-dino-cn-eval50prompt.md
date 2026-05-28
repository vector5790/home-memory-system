# 本地视觉模型评测报告

- Dataset: `20260528-current-local-naming-eval`
- Predictions: `20260523-real-photo-provider-benchmark`
- Index: `20260527-household-gpc-core-1000-grounding-dino-normalized-1024-clip`
- Model: `provider-benchmark`
- Note: Provider benchmark predictions. Real local providers require valid vendor assets and --run-local-models; baselines are explicitly labeled.

## Summary

| Metric | Value |
| --- | ---: |
| Images | 50 |
| Objects | 50 |
| Box recall @ IoU 0.5 | 0% |
| Category accuracy | 0% |
| Name accuracy | 0% |
| Combined accuracy | 0% |
| Rejections | 0 |
| Extra predictions | 50 |

## Cases By Provider

### Local Grounding DINO + CLIP naming

- Provider class: `real-local-model`
- Provider status: `ok`
- Model IDs: `onnx-community/grounding-dino-tiny-ONNX, Xenova/clip-vit-base-patch32`
- Gate: `no-go`

#### storage-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/storage-box/storage-box-cn-eval-004-image.jpg`
- Source: [桌面透明抽屉式收纳盒手账文具置物架书桌上亚克力笔筒整理小盒子_虎窝淘](https://tao.hooos.com/goods_Jp8PXgXfRtkoBwxSXOxivta-2RmPPyFMW0eRVwRs2.html)
- GT: 收纳盒 / `storage-box` / box `{'x': 41.75, 'y': 22.625, 'w': 50.25, 'h': 71.375}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### storage-basket-cn-eval-004

- Query image: `fixtures/vision-household/cn/storage-basket/storage-basket-cn-eval-004-hm-home-2025.jpg`
- Source: [HM HOME 2025夏季新款草编收纳篮，轻松打造家居新风尚🌿-其他收纳篮-淘宝百科网](https://bk.taobao.com/k/qitashounalan_6962/088d744c1c528cf78bfef090bff820e1.html)
- GT: 收纳篮 / `storage-basket` / box `{'x': 29.0625, 'y': 53.5156, 'w': 38.9063, 'h': 26.875}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### drawer-organizer-cn-eval-004

- Query image: `fixtures/vision-household/cn/drawer-organizer/drawer-organizer-cn-eval-004-image.jpg`
- Source: [♔可伸缩收纳盒分隔抽屉式长方形内置厨房餐具桌面化妆品分格整理-阿里巴巴](https://detail.1688.com/offer/890287295798.html)
- GT: 抽屉分隔盒 / `drawer-organizer` / box `{'x': 0.3797, 'y': 10.8677, 'w': 99.6203, 'h': 82.3083}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

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
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### cable-organizer-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/cable-organizer-box/cable-organizer-box-cn-eval-004-image.jpg`
- Source: [数据线收纳盒带盖充电器电线理线盒：告别杂乱，桌面清爽大法! -插线板收纳盒-淘宝百科网](https://bk.taobao.com/k/chaxianbanshounahe_10156/5486c95c9c78c7f07b9921b83370147e.html)
- GT: 线缆收纳盒 / `cable-organizer-box` / box `{'x': 25.375, 'y': 1.875, 'w': 71.375, 'h': 54.375}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

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
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

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
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### drinking-glass-cn-eval-004

- Query image: `fixtures/vision-household/cn/drinking-glass/drinking-glass-cn-eval-004-image.jpg`
- Source: [富光双层玻璃杯子，男士女士通用的高档泡茶杯-玻璃杯-淘宝好物网](https://goods.taobao.com/t/bolibei_2224/50d66459543557316351e9df0b456223.html)
- GT: 玻璃杯 / `drinking-glass` / box `{'x': 26, 'y': 10.375, 'w': 72.625, 'h': 86.25}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### saucepan-cn-eval-004

- Query image: `fixtures/vision-household/cn/saucepan/saucepan-cn-eval-004-image.jpg`
- Source: [👶厨神必备!炊大皇奶锅，让宝宝辅食烹饪变得如此简单💖-奶锅-淘宝好物网](https://goods.taobao.com/t/naiguo_1587/a5845341e0adb95eccdbd9abeaa57507.html)
- GT: 奶锅 / `saucepan` / box `{'x': 19.75, 'y': 30.625, 'w': 79.25, 'h': 65.5}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### frying-pan-cn-eval-004

- Query image: `fixtures/vision-household/cn/frying-pan/frying-pan-cn-eval-004-image.jpg`
- Source: [老式铸铁煎锅：复古魅力，烹饪新体验🔥-煎锅-淘宝百科网](https://bk.taobao.com/k/jianguo_13506/1a1a1edec8bf7d912d756bfea09bf376.html)
- GT: 煎锅 / `frying-pan` / box `{'x': 46.8, 'y': 26.5, 'w': 48.6, 'h': 42.2}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### cutting-board-cn-eval-004

- Query image: `fixtures/vision-household/cn/cutting-board/cutting-board-cn-eval-004-image.jpg`
- Source: [抗菌防霉塑料菜板，厨房必备神器! -砧板-淘宝百科网](https://bk.taobao.com/k/zhenban_4264/27701a9e6eaa2f720001aa8a752a1e29.html)
- GT: 菜板 / `cutting-board` / box `{'x': 0.75, 'y': 28.125, 'w': 98.375, 'h': 53.25}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### rice-bag-cn-eval-004

- Query image: `fixtures/vision-household/cn/rice-bag/rice-bag-cn-eval-004-2-5kg10.jpg`
- Source: [五常稻花香米袋小米大米包装袋子牛皮纸定制手提2.5kg10斤装防水_虎窝淘](https://tao.hooos.com/goods_557623835514.html)
- GT: 米袋 / `rice-bag` / box `{'x': 0.25, 'y': 1.75, 'w': 34.375, 'h': 55.625}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### noodle-pack-cn-eval-004

- Query image: `fixtures/vision-household/cn/noodle-pack/noodle-pack-cn-eval-004-8.jpg`
- Source: [福州礼盒线面8包装盈乐长寿面福建特产手工面线糊细挂面生日面条_虎窝淘](https://tao.hooos.com/goods_634161618276.html)
- GT: 面条包装 / `noodle-pack` / box `{'x': 12.75, 'y': 7.5, 'w': 72.75, 'h': 54.375}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### canned-food-cn-eval-004

- Query image: `fixtures/vision-household/cn/canned-food/canned-food-cn-eval-004-312gx6.jpg`
- Source: [水果罐头混合装312gx6罐新鲜整箱糖水果橘子黄桃菠萝椰果什锦罐头_虎窝淘](https://tao.hooos.com/goods_624066826188.html)
- GT: 罐头 / `canned-food` / box `{'x': 69.875, 'y': 7.875, 'w': 28.5, 'h': 41.75}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### snack-bag-cn-eval-004

- Query image: `fixtures/vision-household/cn/snack-bag/snack-bag-cn-eval-004-100.jpg`
- Source: [休闲食品自封袋坚果自立袋糖果零食袋子批发 100个零食物语包装袋_虎窝淘](https://tao.hooos.com/goods_624794102528.html)
- GT: 零食袋 / `snack-bag` / box `{'x': 45.5, 'y': 21.375, 'w': 46.125, 'h': 66.875}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### beverage-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/beverage-bottle/beverage-bottle-cn-eval-004-33-2500ml-2-5-pet-5.jpg`
- Source: [33号2500ml/2.5升一次性透明塑料瓶空瓶果汁瓶pet饮料瓶子5斤带盖_虎窝淘](https://tao.hooos.com/goods_MqVZarDtKtJ9xmWuVVmUQtA-PNzeejCnBOOW0pMhY.html)
- GT: 饮料瓶 / `beverage-bottle` / box `{'x': 31.125, 'y': 7.25, 'w': 33.25, 'h': 82}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### spice-jar-cn-eval-004

- Query image: `fixtures/vision-household/cn/spice-jar/spice-jar-cn-eval-004-image.jpg`
- Source: [定量控盐瓶调料罐密封罐防潮控盐调料瓶家用厨房调味料瓶组合套装_虎窝淘](https://tao.hooos.com/goods_jGjKVjmyc0tJAPg2mDYtBKeUJte-wzQnnOsQO4naORwsN.html)
- GT: 调料瓶 / `spice-jar` / box `{'x': 35.7333, 'y': 27.4, 'w': 31, 'h': 62.0667}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### medicine-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/medicine-box/medicine-box-cn-eval-004-image.jpg`
- Source: [日本药盒便携一周分装盒，吃药再也不手忙脚乱!💊-药盒-淘宝百科网](https://bk.taobao.com/k/yaohe_5655/7715f52b55552fd1ce4c7716c65f1a9d.html)
- GT: 药盒 / `medicine-box` / box `{'x': 7.25, 'y': 34.25, 'w': 58.25, 'h': 42.875}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### pill-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/pill-bottle/pill-bottle-cn-eval-004-image.jpg`
- Source: [便携塑料小药瓶白色避光小空瓶固体胶囊分装瓶药用片剂包装瓶带盖_虎窝淘](https://tao.hooos.com/goods_601296008600.html)
- GT: 药瓶 / `pill-bottle` / box `{'x': 21.625, 'y': 34.5, 'w': 18.75, 'h': 58.25}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### thermometer-cn-eval-004

- Query image: `fixtures/vision-household/cn/thermometer/thermometer-cn-eval-004-image.jpg`
- Source: [电子体温计欧德宝：精准测量，守护家人的健康温度!-体温计-淘宝百科网](https://bk.taobao.com/k/tiwenji_6546/6b020ce5a7bd6812a8998595ed429e9c.html)
- GT: 体温计 / `thermometer` / box `{'x': 62.75, 'y': 9.875, 'w': 19.25, 'h': 77.875}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

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
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### disinfectant-wipes-cn-eval-004

- Query image: `fixtures/vision-household/cn/disinfectant-wipes/disinfectant-wipes-cn-eval-004-60.jpg`
- Source: [一次性医用消毒湿巾60片装：大包消毒湿巾，随时随地杀菌消毒!-消毒棉片-淘宝好物网](https://goods.taobao.com/t/xiaodumianpian_13445/30444cedfcd79975b148f40eaeaa12bc.html)
- GT: 消毒湿巾 / `disinfectant-wipes` / box `{'x': 0, 'y': 30.75, 'w': 99.375, 'h': 69.25}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### laundry-detergent-cn-eval-004

- Query image: `fixtures/vision-household/cn/laundry-detergent/laundry-detergent-cn-eval-004-3kg-4-24.jpg`
- Source: [蓝月亮洗衣液3Kg*4瓶薰衣草香深层洁净衣物清洁整箱家用24斤大桶_虎窝淘](https://tao.hooos.com/goods_2nXMbGbUotwqnynFaaptDtD-xzQZZ4sO6Yp7k0etA.html)
- GT: 洗衣液 / `laundry-detergent` / box `{'x': 15.125, 'y': 25.25, 'w': 44.625, 'h': 67.875}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### dish-soap-cn-eval-004

- Query image: `fixtures/vision-household/cn/dish-soap/dish-soap-cn-eval-004-500g.jpg`
- Source: [雕牌洗洁精小瓶500g全效丝瓜清爽去油餐洗净洗碟精宿舍家用洗涤精_虎窝淘](https://tao.hooos.com/goods_624853574427.html)
- GT: 洗洁精 / `dish-soap` / box `{'x': 38.375, 'y': 29.375, 'w': 23.5, 'h': 61.75}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### cleaning-spray-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/cleaning-spray-bottle/cleaning-spray-bottle-cn-eval-004-500ml.jpg`
- Source: [家居护理家政清洁配比瓶安利产品稀释喷瓶喷雾瓶500ml喷头大喷壶-阿里巴巴](https://detail.1688.com/offer/611229856143.html)
- GT: 清洁喷瓶 / `cleaning-spray-bottle` / box `{'x': 28, 'y': 22.125, 'w': 19.125, 'h': 60.75}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### sponge-cn-eval-004

- Query image: `fixtures/vision-household/cn/sponge/sponge-cn-eval-004-image.jpg`
- Source: [高密度海绵垫子：拯救腰背的神器!可裁剪海棉沙发垫实测太香了!-海绵-淘宝好物网](https://goods.taobao.com/t/haimian_2272/5a020e31cf634481f51b9f34c3621b3b.html)
- GT: 海绵 / `sponge` / box `{'x': 51.2, 'y': 72.5, 'w': 25.4, 'h': 12.7}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### trash-bag-roll-cn-eval-004

- Query image: `fixtures/vision-household/cn/trash-bag-roll/trash-bag-roll-cn-eval-004-image.jpg`
- Source: [白色加厚垃圾袋家用一次性点断式塑料袋透明平口大号垃圾桶袋卷装_虎窝淘](https://tao.hooos.com/goods_571439119485.html)
- GT: 垃圾袋卷 / `trash-bag-roll` / box `{'x': 4.125, 'y': 56.125, 'w': 54.25, 'h': 36.625}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### toilet-cleaner-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/toilet-cleaner-bottle/toilet-cleaner-bottle-cn-eval-004-image.jpg`
- Source: [大瓶洁厕剂洁厕灵马桶便槽除臭去污护釉清洁剂清香不刺鼻洁厕液_虎窝淘](https://tao.hooos.com/goods_604396009583.html)
- GT: 洁厕剂 / `toilet-cleaner-bottle` / box `{'x': 25, 'y': 11.125, 'w': 26, 'h': 88.125}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### mop-head-cn-eval-004

- Query image: `fixtures/vision-household/cn/mop-head/mop-head-cn-eval-004-image.png`
- Source: [加厚吸水旋转拖把头：清洁神器，让你的家务事半功倍!💪-旋转拖把-淘宝百科网](https://bk.taobao.com/k/xuanzhuantuoba_7060/f5eb890109848dc64d5ccc5734643968.html)
- GT: 拖把头 / `mop-head` / box `{'x': 44.875, 'y': 0.25, 'w': 38, 'h': 60.75}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### charging-cable-cn-eval-004

- Query image: `fixtures/vision-household/cn/charging-cable/charging-cable-cn-eval-004-25-type-c-vivo-2.jpg`
- Source: [25年必买Type-C弯头数据线｜华为小米vivo快充神器，加长2米超实用!-数据线-淘宝好物网](https://goods.taobao.com/t/shujuxian_1728/e1fb26e96b31392db7ca115f1c17db04.html)
- GT: 数据线 / `charging-cable` / box `{'x': 11.375, 'y': 5.375, 'w': 86.25, 'h': 94.5}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### charger-cn-eval-004

- Query image: `fixtures/vision-household/cn/charger/charger-cn-eval-004-magsafe.jpg`
- Source: [MagSafe三合一无线充电器：苹果全家桶的终极充电解决方案!-手机充电器-淘宝好物网](https://goods.taobao.com/t/shoujichongdianqi_4125/bd5e056cf1e0a8d89e68849eb39313c1.html)
- GT: 充电器 / `charger` / box `{'x': 9.9167, 'y': 38.3333, 'w': 51.9167, 'h': 55.25}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### battery-cn-eval-004

- Query image: `fixtures/vision-household/cn/battery/battery-cn-eval-004-5-7-4-ktv-aa-1-5v.jpg`
- Source: [倍量 5号7号充电电池大容量4节套装KTV套装可代替AA五1.5v锂电池_虎窝淘](https://tao.hooos.com/goods_600127184801.html)
- GT: 电池 / `battery` / box `{'x': 24.75, 'y': 4.875, 'w': 24.375, 'h': 38.25}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

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
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### usb-flash-drive-cn-eval-004

- Query image: `fixtures/vision-household/cn/usb-flash-drive/usb-flash-drive-cn-eval-004-u350-32g-type-c-u-u.jpg`
- Source: [爱国者U350-32G Type-C U盘：手机电脑双用，数据传输神器!-手机U盘-淘宝好物网](https://goods.taobao.com/t/shoujiUpan_2532/649ba1c594dec5f741aa361cb9dfb1da.html)
- GT: U盘 / `usb-flash-drive` / box `{'x': 13.5, 'y': 13.5, 'w': 77, 'h': 56}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### memory-card-case-cn-eval-004

- Query image: `fixtures/vision-household/cn/memory-card-case/memory-card-case-cn-eval-004-sd-tf-usb-3-0.jpg`
- Source: [耐影存储卡盒卡套SD卡TF卡收纳包相机手机内存卡保护盒储存卡USB 3.0高速读卡器手机读卡器：数码摄影爱好者的必备神器!-包-淘宝百科网](https://bk.taobao.com/k/bao_14745/377457741010f16bfc8374c46319ec75.html)
- GT: 存储卡盒 / `memory-card-case` / box `{'x': 14.875, 'y': 48.875, 'w': 55.875, 'h': 47.75}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### remote-control-cn-eval-004

- Query image: `fixtures/vision-household/cn/remote-control/remote-control-cn-eval-004-optoma-h115-tw342-hb3201-hdf321b.jpg`
- Source: [原装全新奥图码Optoma投影仪H115 TW342 HB3201 HDF321B 遥控器_虎窝淘](https://tao.hooos.com/goods_N7wR0gkC5tGBGZXqbmCxx9HRtB-wzQnnOsQa2gJARpIN.html)
- GT: 遥控器 / `remote-control` / box `{'x': 62.9167, 'y': 19.8333, 'w': 22.4167, 'h': 60.5833}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### electric-kettle-cn-eval-004

- Query image: `fixtures/vision-household/cn/electric-kettle/electric-kettle-cn-eval-004-2l3l.jpg`
- Source: [万利达电热水壶电水壶2L3L不锈钢一体保温自动断电开水壶家用学生_虎窝淘](https://tao.hooos.com/goods_W7Jg6pdfotGXpQMcaresQta-XNReeAC0d5ZyQOes3.html)
- GT: 电水壶 / `electric-kettle` / box `{'x': 6, 'y': 5.625, 'w': 91.125, 'h': 89}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### rice-cooker-cn-eval-004

- Query image: `fixtures/vision-household/cn/rice-cooker/rice-cooker-cn-eval-004-20-30.jpg`
- Source: [苏电饭煲旗舰款，20-30人食堂必备神器？🔥-商用电饭煲-淘宝好物网](https://goods.taobao.com/t/shangyongdianfanbao_3790/22cceecc30bba51ad654e8307665260d.html)
- GT: 电饭煲 / `rice-cooker` / box `{'x': 17.5, 'y': 85.75, 'w': 24, 'h': 14.125}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### air-purifier-filter-cn-eval-004

- Query image: `fixtures/vision-household/cn/air-purifier-filter/air-purifier-filter-cn-eval-004-352-x80-x83-x83c.jpg`
- Source: [352标准滤芯套装：空气净化器滤芯X80/X83/X83C，拯救呼吸的"隐形铠甲"!-净化-淘宝好物网](https://goods.taobao.com/t/jinghua_11148/61ceb4c80f43f7af6447a283ee60d63f.html)
- GT: 空气净化器滤芯 / `air-purifier-filter` / box `{'x': 0, 'y': 48.125, 'w': 36.625, 'h': 50.75}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### hair-dryer-cn-eval-004

- Query image: `fixtures/vision-household/cn/hair-dryer/hair-dryer-cn-eval-004-h101.jpg`
- Source: [米家吹风机H101：智能科技与高效造型的完美结合-商品-淘宝百科网](https://bk.taobao.com/k/shangpin_1930/52e3a06f14f422d4d010bd92a12dba8a.html)
- GT: 吹风机 / `hair-dryer` / box `{'x': 14.25, 'y': 1, 'w': 75.625, 'h': 34.25}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### vacuum-cleaner-cn-eval-004

- Query image: `fixtures/vision-household/cn/vacuum-cleaner/vacuum-cleaner-cn-eval-004-image.jpg`
- Source: [德国无线吸尘器家用小型大吸力功率强力静低音手持拖地一体洗地机_虎窝淘](https://tao.hooos.com/goods_58moVQTxtYvA7jF77GUMtV-nMYPPWFxV7XjRKqSzb.html)
- GT: 吸尘器 / `vacuum-cleaner` / box `{'x': 26, 'y': 10.625, 'w': 53.875, 'h': 88.875}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### router-cn-eval-004

- Query image: `fixtures/vision-household/cn/router/router-cn-eval-004-e2627-e2628-ax3000m-wifi6.jpg`
- Source: [中兴E2627/E2628，AX3000M WIFI6路由器，联通版如何选？-普通路由器-淘宝好物网](https://goods.taobao.com/t/putongluyouqi_1489/09d7941c7e9cbfda57cba94190713466.html)
- GT: 路由器 / `router` / box `{'x': 48.8889, 'y': 33.7963, 'w': 38.7037, 'h': 40.9259}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### screwdriver-cn-eval-004

- Query image: `fixtures/vision-household/cn/screwdriver/screwdriver-cn-eval-004-202-30cm.jpg`
- Source: [202冲磁铬钒钢螺丝刀：解锁30CM长度的高效神器，工具控必备!-螺丝刀-淘宝百科网](https://bk.taobao.com/k/luosidao_6772/9b6f82e46fd8cb6c446ea334c3a5a461.html)
- GT: 螺丝刀 / `screwdriver` / box `{'x': 25.2, 'y': 29.8667, 'w': 69.2, 'h': 67.8667}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none

#### scissors-cn-eval-004

- Query image: `fixtures/vision-household/cn/scissors/scissors-cn-eval-004-0603-2.jpg`
- Source: [得力剪刀学生办公手工0603厨房铁皮家用园艺大美工文具剪刀2把装_虎窝淘](https://tao.hooos.com/goods_536393260433.html)
- GT: 剪刀 / `scissors` / box `{'x': 3.875, 'y': 10, 'w': 40.25, 'h': 83.375}`
- Prediction:  / `` / box `None`
- IoU: `0.0`; boxMatch: `False`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - none
