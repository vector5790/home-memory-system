# 本地视觉模型评测报告

- Dataset: `20260528-current-local-naming-eval`
- Predictions: `20260528-gt-crop-clip-naming-cn-1000`
- Index: `20260527-household-gpc-core-1000-grounding-dino-normalized-1024-clip`
- Model: `gt-crop-clip-naming`
- Note: Uses human/manifest GT subject boxes to isolate CLIP crop embedding naming accuracy against the household CN index.

## Summary

| Metric | Value |
| --- | ---: |
| Images | 50 |
| Objects | 50 |
| Box recall @ IoU 0.5 | 100% |
| Category accuracy | 30% |
| Name accuracy | 30% |
| Combined accuracy | 30% |
| Rejections | 0 |
| Extra predictions | 0 |

## Cases By Provider

### GT crop + CLIP naming

- Provider class: `real-local-model`
- Provider status: `ok`
- Model IDs: `Xenova/clip-vit-base-patch32`
- Gate: `no-go`

#### storage-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/storage-box/storage-box-cn-eval-004-image.jpg`
- Source: [桌面透明抽屉式收纳盒手账文具置物架书桌上亚克力笔筒整理小盒子_虎窝淘](https://tao.hooos.com/goods_Jp8PXgXfRtkoBwxSXOxivta-2RmPPyFMW0eRVwRs2.html)
- GT: 收纳盒 / `storage-box` / box `{'x': 41.75, 'y': 22.625, 'w': 50.25, 'h': 71.375}`
- Prediction: 玩具收纳桶 / `toy-storage-bin` / box `{'x': 41.75, 'y': 22.625, 'w': 50.25, 'h': 71.375}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 玩具收纳桶 / `toy-storage-bin` score `0.742448` image `fixtures/vision-household/cn/toy-storage-bin/toy-storage-bin-cn-gallery-003-image.jpg` [透明太空人娃娃收纳桶，拯救你的毛绒玩具大作战!🌟-毛绒玩具收纳桶-淘宝百科网](https://bk.taobao.com/k/maorongwanjushounatong_8986/a30cd44b71a03f21cc40e46b13d859e9.html)
  - #2 抽屉收纳盒 / `drawer-storage-box` score `0.734006` image `fixtures/vision-household/cn/drawer-storage-box/drawer-storage-box-cn-gallery-003-a4.jpg` [塑料桌面透明抽屉式收纳盒办公室文件书本A4纸文具收纳盒学习用品_虎窝淘](https://tao.hooos.com/goods_601902432620.html)
  - #3 玩具收纳桶 / `toy-storage-bin` score `0.733377` image `fixtures/vision-household/cn/toy-storage-bin/toy-storage-bin-cn-gallery-002-image.jpg` [微智毛绒娃娃收纳桶玩偶收纳筐公仔儿童玩具收纳筒神器收纳篮透明_虎窝淘](https://tao.hooos.com/goods_nJg2X6XuMt4mxgrtkN5t0tP-BmWKKNHrvkvwr6Dfp.html)

#### storage-basket-cn-eval-004

- Query image: `fixtures/vision-household/cn/storage-basket/storage-basket-cn-eval-004-hm-home-2025.jpg`
- Source: [HM HOME 2025夏季新款草编收纳篮，轻松打造家居新风尚🌿-其他收纳篮-淘宝百科网](https://bk.taobao.com/k/qitashounalan_6962/088d744c1c528cf78bfef090bff820e1.html)
- GT: 收纳篮 / `storage-basket` / box `{'x': 29.0625, 'y': 53.5156, 'w': 38.9063, 'h': 26.875}`
- Prediction: 凉席 / `cooling-mat` / box `{'x': 29.0625, 'y': 53.5156, 'w': 38.9063, 'h': 26.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 凉席 / `cooling-mat` score `0.800552` image `fixtures/vision-household/cn/cooling-mat/cooling-mat-cn-gallery-003-image.jpg` [夏季凉席选购指南 - 知乎](https://zhuanlan.zhihu.com/p/67072302)
  - #2 鞋带包 / `shoelace-pack` score `0.796612` image `fixtures/vision-household/cn/shoelace-pack/shoelace-pack-cn-gallery-003-sinya-alibaba-com.jpg` [Sinya高跟鞋意大利鞋带包套装尼日利亚带石头鞋搭配女士场合派对包| Alibaba.com](https://chinese.alibaba.com/product-detail/Sinya-High-Heel-Italian-Shoes-With-1600618971489.html)
  - #3 洗衣篮 / `laundry-basket` score `0.790203` image `fixtures/vision-household/cn/laundry-basket/laundry-basket-cn-gallery-003-image.jpg` [编织藤编柳编脏衣服收纳筐洗衣篮家用简约脏衣篓脏衣篮篮子收纳桶_虎窝淘](https://tao.hooos.com/goods_528340334904.html)

#### drawer-organizer-cn-eval-004

- Query image: `fixtures/vision-household/cn/drawer-organizer/drawer-organizer-cn-eval-004-image.jpg`
- Source: [♔可伸缩收纳盒分隔抽屉式长方形内置厨房餐具桌面化妆品分格整理-阿里巴巴](https://detail.1688.com/offer/890287295798.html)
- GT: 抽屉分隔盒 / `drawer-organizer` / box `{'x': 0.3797, 'y': 10.8677, 'w': 99.6203, 'h': 82.3083}`
- Prediction: 抽屉分隔盒 / `drawer-organizer` / box `{'x': 0.3797, 'y': 10.8677, 'w': 99.6203, 'h': 82.3083}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 抽屉分隔盒 / `drawer-organizer` score `0.795894` image `fixtures/vision-household/cn/drawer-organizer/drawer-organizer-cn-gallery-001-image.jpg` [抽屉收纳分隔自由组合整理分隔盒板分割神器塑料隔断袜子格子隔板_虎窝淘](https://tao.hooos.com/goods_613639296271.html)
  - #2 药品收纳盒 / `medicine-storage-box` score `0.787864` image `fixtures/vision-household/cn/medicine-storage-box/medicine-storage-box-cn-gallery-003-image.jpg` [家庭药箱医药收纳箱装药品大容量家用医疗急救盒多层小药物药盒包_虎窝淘](https://tao.hooos.com/goods_DMyaQPAuDt5bnOzy25hQQwujtn-Mw0WW4FV5gGeojYSZ.html)
  - #3 药品收纳盒 / `medicine-storage-box` score `0.78004` image `fixtures/vision-household/cn/medicine-storage-box/medicine-storage-box-cn-gallery-001-image.jpg` [家庭装药箱大容量药品医药箱家用多层收纳柜抽屉药物收纳盒小药盒_虎窝淘](https://tao.hooos.com/goods_PKgrgGWi3tkG80wHvVBsPt6-8ZkvvmF0zV88qwpfY.html)

#### vacuum-storage-bag-cn-eval-004

- Query image: `fixtures/vision-household/cn/vacuum-storage-bag/vacuum-storage-bag-cn-eval-004-image.jpg`
- Source: [免抽气真空压缩袋棉被被子家用衣服衣物行李箱整理加厚大号收纳袋_虎窝淘](https://tao.hooos.com/goods_630480458209.html)
- GT: 真空压缩袋 / `vacuum-storage-bag` / box `{'x': 14.5, 'y': 44.25, 'w': 69, 'h': 51.125}`
- Prediction: 真空压缩袋 / `vacuum-storage-bag` / box `{'x': 14.5, 'y': 44.25, 'w': 69, 'h': 51.125}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 真空压缩袋 / `vacuum-storage-bag` score `0.867353` image `fixtures/vision-household/cn/vacuum-storage-bag/vacuum-storage-bag-cn-gallery-003-image.jpg` [带阀门真空压缩袋出差旅行收纳袋衣物收纳整理包旅游专用密封袋_虎窝淘](https://tao.hooos.com/goods_532911248784.html)
  - #2 床底收纳箱 / `underbed-storage-box` score `0.818747` image `fixtures/vision-household/cn/underbed-storage-box/underbed-storage-box-cn-gallery-002-image.jpg` [水洗棉床笠床单单件无印日式良品简约全棉纯色席梦思床垫保护套_虎窝淘](https://tao.hooos.com/goods_528543683544.html)
  - #3 桌布 / `tablecloth` score `0.807349` image `fixtures/vision-household/cn/tablecloth/tablecloth-cn-gallery-003-image.jpg` [定制桌布，打造专属品牌形象，会议桌布新选择？🌟-桌布-淘宝好物网](https://goods.taobao.com/t/zhuobu_1979/847751be22484de0eb5a459040a4ee26.html)

#### closet-organizer-cn-eval-004

- Query image: `fixtures/vision-household/cn/closet-organizer/closet-organizer-cn-eval-004-image.jpg`
- Source: [千鸟格衣服收纳盒裤子收纳家用衣柜收纳神器分格抽屉式袜子收纳盒_虎窝淘](https://tao.hooos.com/goods_pr62jQ8Cxt7b2aNheeKSptm-mOZQQNu7a79dVnvT0.html)
- GT: 衣柜收纳格 / `closet-organizer` / box `{'x': 2.6496, 'y': 9.6886, 'w': 95.2991, 'h': 82.9585}`
- Prediction: 分药盒 / `medical-pill-box` / box `{'x': 2.6496, 'y': 9.6886, 'w': 95.2991, 'h': 82.9585}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 分药盒 / `medical-pill-box` score `0.813004` image `fixtures/vision-household/cn/medical-pill-box/medical-pill-box-cn-gallery-002-49.png` [特大49格分药盒：一周无忧，老人用药不再愁!💊💪-药盒-淘宝百科网](https://bk.taobao.com/k/yaohe_5655/c4300aa70d6f0b3b57116611c9b4bc93.html)
  - #2 真空压缩袋 / `vacuum-storage-bag` score `0.805457` image `fixtures/vision-household/cn/vacuum-storage-bag/vacuum-storage-bag-cn-gallery-001-image.jpg` [免抽气真空压缩立体袋，衣物收纳神器，旅行必备!🌍-衣物压缩袋-淘宝百科网](https://bk.taobao.com/k/yiwuyasuodai_8928/770ccc61d8f312b0b5618b4380bdf77e.html)
  - #3 钉子盒 / `nail-box` score `0.799962` image `fixtures/vision-household/cn/nail-box/nail-box-cn-gallery-003-image.jpg` [样品小零件盒钉子收纳塑料带盖螺丝电子贴片元件盒可拆分钓鱼盒子_虎窝淘](https://tao.hooos.com/goods_XBJZyKXUGtX2pmj5z5FVYrtBtg-d8ZBBDFnBv4g7K9cd.html)

#### cable-organizer-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/cable-organizer-box/cable-organizer-box-cn-eval-004-image.jpg`
- Source: [数据线收纳盒带盖充电器电线理线盒：告别杂乱，桌面清爽大法! -插线板收纳盒-淘宝百科网](https://bk.taobao.com/k/chaxianbanshounahe_10156/5486c95c9c78c7f07b9921b83370147e.html)
- GT: 线缆收纳盒 / `cable-organizer-box` / box `{'x': 25.375, 'y': 1.875, 'w': 71.375, 'h': 54.375}`
- Prediction: 吸尘器 / `vacuum-cleaner` / box `{'x': 25.375, 'y': 1.875, 'w': 71.375, 'h': 54.375}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 吸尘器 / `vacuum-cleaner` score `0.81219` image `fixtures/vision-household/cn/vacuum-cleaner/vacuum-cleaner-cn-gallery-002-2025-usb.jpg` [2025新款无线吸尘器：大吸力+吸拖一体!家庭清洁新革命，你还在等什么？-USB吸尘器-淘宝好物网](https://goods.taobao.com/t/USBxichenqi_9851/9db2a12e7e736dd2c65dfb0f7068b1c9.html)
  - #2 路由器 / `router` score `0.788533` image `fixtures/vision-household/cn/router/router-cn-gallery-003-5g-5g.jpg` [工业级5g无线路由器精选和工业级5g无线路由器品牌价格与图片-淘宝商品网](https://pcdetail.taobao.com/p/74abd22be827473b8fff8649eed80bf1)
  - #3 门挡 / `door-stop` score `0.787941` image `fixtures/vision-household/cn/door-stop/door-stop-cn-gallery-003-image.jpg` [门吸免打孔新款门挡器防撞硅胶卫生间门阻门后强磁铁静音门碰地吸_虎窝淘](https://tao.hooos.com/goods_MJeKkpVcKtw3g3zcVV7HQtA-XNReeACpkg4zX0AI6.html)

#### shoe-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/shoe-box/shoe-box-cn-eval-004-aj.jpg`
- Source: [透明全亚克力鞋盒：AJ球鞋收纳展示神器，让你的鞋柜变身艺术品!-鞋盒-淘宝百科网](https://bk.taobao.com/k/xiehe_15507/266e7a508212b03c27893163e5a37546.html)
- GT: 鞋盒 / `shoe-box` / box `{'x': 20.9333, 'y': 5.4, 'w': 78.2667, 'h': 20.5}`
- Prediction: 收纳标签贴 / `storage-label-sticker` / box `{'x': 20.9333, 'y': 5.4, 'w': 78.2667, 'h': 20.5}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 收纳标签贴 / `storage-label-sticker` score `0.835925` image `fixtures/vision-household/cn/storage-label-sticker/storage-label-sticker-cn-gallery-003-image.jpg` [彩色不干胶标签贴贴纸防水无痕自粘分类收纳手写标签纸儿童姓名贴-阿里巴巴](https://detail.1688.com/offer/677337595134.html)
  - #2 植物标签 / `plant-label` score `0.806621` image `fixtures/vision-household/cn/plant-label/plant-label-cn-gallery-003-1-11.jpg` [本田雅阁1代到11代的历史演变_车家号_发现车生活_汽车之家](https://chejiahao.autohome.com.cn/info/15060936?isfrom=m)
  - #3 蒸锅 / `steamer-pot` score `0.80651` image `fixtures/vision-household/cn/steamer-pot/steamer-pot-cn-gallery-002-image.jpg` [《明朝那些事儿》主要人物线路图 - 知乎](https://zhuanlan.zhihu.com/p/141478672)

#### bowl-cn-eval-004

- Query image: `fixtures/vision-household/cn/bowl/bowl-cn-eval-004-image.jpg`
- Source: [陶瓷碗套装创意红瓷喜庆龙凤骨瓷米饭碗带勺结婚碗筷餐具礼品套装_虎窝淘](https://tao.hooos.com/goods_567664716671.html)
- GT: 碗 / `bowl` / box `{'x': 30.875, 'y': 31.375, 'w': 30.75, 'h': 21.875}`
- Prediction: 马克杯 / `mug` / box `{'x': 30.875, 'y': 31.375, 'w': 30.75, 'h': 21.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 马克杯 / `mug` score `0.788205` image `fixtures/vision-household/cn/mug/mug-cn-gallery-003-diy.jpg` [网红创意双彩纯色热转印马克杯diy图案礼品杯家用水杯陶瓷杯-阿里巴巴](https://detail.1688.com/offer/728053178836.html)
  - #2 粉饼盒 / `powder-compact` score `0.781149` image `fixtures/vision-household/cn/powder-compact/powder-compact-cn-gallery-001-image.jpg` [透明粉饼粉扑翻盖实色粉饼盒卡扣分装可置腮红包材盒带双层镜子配-阿里巴巴](https://detail.1688.com/offer/844688256336.html)
  - #3 眼镜盒 / `glasses-case` score `0.777934` image `fixtures/vision-household/cn/glasses-case/glasses-case-cn-gallery-003-ins.jpg` [眼镜盒男近视眼睛盒ins少女简约韩国小清新学生创意个性便携镜盒_虎窝淘](https://tao.hooos.com/goods_591147887146.html)

#### plate-cn-eval-004

- Query image: `fixtures/vision-household/cn/plate/plate-cn-eval-004-6.jpg`
- Source: [家用菜盘盘子套装6个菜盘方盘组合创意餐具蒸鱼盘陶瓷饭盘汤碟子_虎窝淘](https://tao.hooos.com/goods_ZQg7dm3c6tQYJxWfBBZIVt6-rkOPPMuM7OqA0oGhJ.html)
- GT: 盘子 / `plate` / box `{'x': 7.125, 'y': 27.75, 'w': 40.5, 'h': 17.875}`
- Prediction: 茶杯 / `tea-cup` / box `{'x': 7.125, 'y': 27.75, 'w': 40.5, 'h': 17.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 茶杯 / `tea-cup` score `0.796236` image `fixtures/vision-household/cn/tea-cup/tea-cup-cn-gallery-002-image.jpg` [镂空玲珑茶具功夫茶杯单杯主人个人小陶瓷景德镇青花瓷白瓷品茗杯_虎窝淘](https://tao.hooos.com/goods_45274389437.html)
  - #2 盘子 / `plate` score `0.781996` image `fixtures/vision-household/cn/plate/plate-cn-gallery-001-image.jpg` [浮雕镂空西餐盘创意陶瓷圆盘套装蕾丝饭盘平盘水果盘牛排盘子菜盘_虎窝淘](https://tao.hooos.com/goods_530873685200.html)
  - #3 马克杯 / `mug` score `0.775029` image `fixtures/vision-household/cn/mug/mug-cn-gallery-001-image.jpg` [可叠马克杯北欧风创意设计情侣陶瓷杯女咖啡泡茶喝水杯子小众精致_虎窝淘](https://tao.hooos.com/goods_668474289581.html)

#### mug-cn-eval-004

- Query image: `fixtures/vision-household/cn/mug/mug-cn-eval-004-diy-diy.jpg`
- Source: [陶瓷马克杯定制杯子diy活动礼品订做马克杯diy可印照片纪念定制图_虎窝淘](https://tao.hooos.com/goods_X4PwzGDfGt9z7oyuVVruBtg-ZWRNNbuGzBJgQOKuOM.html)
- GT: 马克杯 / `mug` / box `{'x': 27.125, 'y': 21.75, 'w': 61.875, 'h': 60.75}`
- Prediction: 马克杯 / `mug` / box `{'x': 27.125, 'y': 21.75, 'w': 61.875, 'h': 60.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 马克杯 / `mug` score `0.871587` image `fixtures/vision-household/cn/mug/mug-cn-gallery-002-logo.jpg` [彩色陶瓷杯马克杯咖啡杯可定 制logo广告礼品陶瓷杯马克杯咖啡杯-阿里巴巴](https://detail.1688.com/offer/689534381206.html)
  - #2 瓶装水 / `pet-bottle-water` score `0.794549` image `fixtures/vision-household/cn/pet-bottle-water/pet-bottle-water-cn-gallery-002-image.jpg` [航院李晓雁课题组在超高强度三维曲面纳米点阵材料方面取得重要进展-清华大学航天航空学院](http://www.hy.tsinghua.edu.cn/info/1157/2600.htm)
  - #3 宠物尿裤包 / `pet-diaper-pack` score `0.791411` image `fixtures/vision-household/cn/pet-diaper-pack/pet-diaper-pack-cn-gallery-003-image.jpg` [公狗纸尿裤礼貌带男狗尿不湿生理裤宠物小狗泰迪防乱尿一次性尿布_虎窝淘](https://tao.hooos.com/goods_xmqqbvjfktqMdxovpRiQ62TAt9-BmWKKNHr86aMQ5Of8.html)

#### drinking-glass-cn-eval-004

- Query image: `fixtures/vision-household/cn/drinking-glass/drinking-glass-cn-eval-004-image.jpg`
- Source: [富光双层玻璃杯子，男士女士通用的高档泡茶杯-玻璃杯-淘宝好物网](https://goods.taobao.com/t/bolibei_2224/50d66459543557316351e9df0b456223.html)
- GT: 玻璃杯 / `drinking-glass` / box `{'x': 26, 'y': 10.375, 'w': 72.625, 'h': 86.25}`
- Prediction: 玻璃杯 / `drinking-glass` / box `{'x': 26, 'y': 10.375, 'w': 72.625, 'h': 86.25}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 玻璃杯 / `drinking-glass` score `0.88227` image `fixtures/vision-household/cn/drinking-glass/drinking-glass-cn-gallery-003-image.jpg` [富光双层玻璃杯：居家泡茶神器，男士商务必备!-玻璃杯-淘宝好物网](https://goods.taobao.com/t/bolibei_2224/55392a7b5e45f4cd38310f97f10f9e1f.html)
  - #2 电水壶 / `electric-kettle` score `0.793419` image `fixtures/vision-household/cn/electric-kettle/electric-kettle-cn-gallery-002-image.jpg` [万利达电热水壶不锈钢水壶家用大容量保温防烫开水壶烧水壶电水壶_虎窝淘](https://tao.hooos.com/goods_Py6ry4mf3tnyzGqSvD9hPt6-DokRR8IPoeWOnzMHq.html)
  - #3 沙拉酱瓶 / `salad-dressing-bottle` score `0.767496` image `fixtures/vision-household/cn/salad-dressing-bottle/salad-dressing-bottle-cn-gallery-002-image.jpg` [三只装挤压式挤酱瓶透明尖嘴番茄酱蜂蜜奶油沙拉酱耗油塑料调料瓶_虎窝淘](https://tao.hooos.com/goods_629770593047.html)

#### saucepan-cn-eval-004

- Query image: `fixtures/vision-household/cn/saucepan/saucepan-cn-eval-004-image.jpg`
- Source: [👶厨神必备!炊大皇奶锅，让宝宝辅食烹饪变得如此简单💖-奶锅-淘宝好物网](https://goods.taobao.com/t/naiguo_1587/a5845341e0adb95eccdbd9abeaa57507.html)
- GT: 奶锅 / `saucepan` / box `{'x': 19.75, 'y': 30.625, 'w': 79.25, 'h': 65.5}`
- Prediction: 奶锅 / `saucepan` / box `{'x': 19.75, 'y': 30.625, 'w': 79.25, 'h': 65.5}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 奶锅 / `saucepan` score `0.884957` image `fixtures/vision-household/cn/saucepan/saucepan-cn-gallery-001-316l.jpg` [德国无涂层316L不锈钢小奶锅：宝宝辅食的安心之选，妈妈的心头好!-奶锅-淘宝百科网](https://bk.taobao.com/k/naiguo_9305/a8e660a73ee9958a68839016981d6892.html)
  - #2 儿童碗 / `baby-bowl` score `0.828876` image `fixtures/vision-household/cn/baby-bowl/baby-bowl-cn-gallery-001-316-4-6-3-7.jpg` [儿童碗食品级316防摔防烫不锈钢4一6岁以上带手柄3吃饭7宝宝餐具_虎窝淘](https://tao.hooos.com/goods_jABZzwYT0tQxBkZcBJBIJte-OpRwwaFZRD0xN3vc7.html)
  - #3 压力锅 / `pressure-cooker` score `0.824983` image `fixtures/vision-household/cn/pressure-cooker/pressure-cooker-cn-gallery-001-316.jpg` [🔥【厨房神器】卡洛图316不锈钢高压锅，让美味升级!🌟-压力锅/高压锅-淘宝好物网](https://goods.taobao.com/t/yaliguo_1627/323987ca92b060341da319ca63dd856a.html)

#### frying-pan-cn-eval-004

- Query image: `fixtures/vision-household/cn/frying-pan/frying-pan-cn-eval-004-image.jpg`
- Source: [老式铸铁煎锅：复古魅力，烹饪新体验🔥-煎锅-淘宝百科网](https://bk.taobao.com/k/jianguo_13506/1a1a1edec8bf7d912d756bfea09bf376.html)
- GT: 煎锅 / `frying-pan` / box `{'x': 46.8, 'y': 26.5, 'w': 48.6, 'h': 42.2}`
- Prediction: 餐盘 / `dinner-plate` / box `{'x': 46.8, 'y': 26.5, 'w': 48.6, 'h': 42.2}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 餐盘 / `dinner-plate` score `0.838003` image `fixtures/vision-household/cn/dinner-plate/dinner-plate-cn-gallery-003-aito.png` [AITO日式餐具套装单个北欧创意简约家用陶瓷餐盘沙拉碗饭碗汤碗_虎窝淘](https://tao.hooos.com/goods_594161338949.html)
  - #2 托盘 / `serving-tray` score `0.828063` image `fixtures/vision-household/cn/serving-tray/serving-tray-cn-gallery-003-image.jpg` [加厚长方形塑料盘子肯德基汉堡店托盘商用快餐盘食堂餐厅餐具端菜_虎窝淘](https://tao.hooos.com/goods_595893150542.html)
  - #3 煎锅 / `frying-pan` score `0.815338` image `fixtures/vision-household/cn/frying-pan/frying-pan-cn-gallery-002-image.jpg` [🔥老式铁锅升级版：平底无涂层牛排煎锅，让你的厨房瞬间高大上!🍳-煎锅-淘宝百科网](https://bk.taobao.com/k/jianguo_13506/2075b25aca1bddec34b1cd61bdd5b47e.html)

#### cutting-board-cn-eval-004

- Query image: `fixtures/vision-household/cn/cutting-board/cutting-board-cn-eval-004-image.jpg`
- Source: [抗菌防霉塑料菜板，厨房必备神器! -砧板-淘宝百科网](https://bk.taobao.com/k/zhenban_4264/27701a9e6eaa2f720001aa8a752a1e29.html)
- GT: 菜板 / `cutting-board` / box `{'x': 0.75, 'y': 28.125, 'w': 98.375, 'h': 53.25}`
- Prediction: 电压力锅 / `electric-pressure-cooker` / box `{'x': 0.75, 'y': 28.125, 'w': 98.375, 'h': 53.25}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 电压力锅 / `electric-pressure-cooker` score `0.753411` image `fixtures/vision-household/cn/electric-pressure-cooker/electric-pressure-cooker-cn-gallery-003-yl50easy203-5l.jpg` [美的 YL50Easy203 5L电压力锅：智能烹饪新体验-商品-淘宝百科网](https://bk.taobao.com/k/shangpin_1930/28d0324b37ea8efbf5d763bd6ed7f920.html)
  - #2 菜板 / `cutting-board` score `0.751555` image `fixtures/vision-household/cn/cutting-board/cutting-board-cn-gallery-003-image.jpg` [花梨木菜板家用神器!无漆无蜡防霉又耐用，厨房小白必备!-砧板-淘宝好物网](https://goods.taobao.com/t/zhenban_1852/ee6125f651641e6e2fcb3b1d6630bb07.html)
  - #3 糕点包装 / `cake-pack` score `0.747587` image `fixtures/vision-household/cn/cake-pack/cake-pack-cn-gallery-003-image.jpg` [网红日式蛋糕卷包装盒瑞士卷虎皮卷透明糕点小西点面包烘焙盒子_虎窝淘](https://tao.hooos.com/goods_NBBKmNBf5tj9w6RIxZJCRtB-ZWRNNbuGY3rkkxWUO.html)

#### rice-bag-cn-eval-004

- Query image: `fixtures/vision-household/cn/rice-bag/rice-bag-cn-eval-004-2-5kg10.jpg`
- Source: [五常稻花香米袋小米大米包装袋子牛皮纸定制手提2.5kg10斤装防水_虎窝淘](https://tao.hooos.com/goods_557623835514.html)
- GT: 米袋 / `rice-bag` / box `{'x': 0.25, 'y': 1.75, 'w': 34.375, 'h': 55.625}`
- Prediction: 蛤蜊盒 / `clam-pack` / box `{'x': 0.25, 'y': 1.75, 'w': 34.375, 'h': 55.625}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 蛤蜊盒 / `clam-pack` score `0.880651` image `fixtures/vision-household/cn/clam-pack/clam-pack-cn-gallery-002-390.png` [姚朵朵海产品礼盒 海鲜干货 鱼干 海带 蛤蜊干 走亲访友春节送礼 姚朵朵瑞盒食锦礼盒390克【图片 价格 品牌 报价】-京东](https://item.jd.com/10208254202696.html)
  - #2 腐竹包装 / `bean-curd-stick-pack` score `0.854944` image `fixtures/vision-household/cn/bean-curd-stick-pack/bean-curd-stick-pack-cn-gallery-001-500-250g.jpg` [腐竹包装袋子拉链自封口塑料礼品袋子豆腐皮腐枝袋500克一斤250g_虎窝淘](https://tao.hooos.com/goods_651895543124.html)
  - #3 挂面捆 / `dried-noodle-bundle` score `0.854286` image `fixtures/vision-household/cn/dried-noodle-bundle/dried-noodle-bundle-cn-gallery-003-1000g.jpg` [【天猫超市】想念挂面 香菇面1000g 杂粮面条 粗粮面 无添加 - 小轩窗](https://www.9ifashion.com/goods/560215.html)

#### noodle-pack-cn-eval-004

- Query image: `fixtures/vision-household/cn/noodle-pack/noodle-pack-cn-eval-004-8.jpg`
- Source: [福州礼盒线面8包装盈乐长寿面福建特产手工面线糊细挂面生日面条_虎窝淘](https://tao.hooos.com/goods_634161618276.html)
- GT: 面条包装 / `noodle-pack` / box `{'x': 12.75, 'y': 7.5, 'w': 72.75, 'h': 54.375}`
- Prediction: 香肠包装 / `sausage-pack` / box `{'x': 12.75, 'y': 7.5, 'w': 72.75, 'h': 54.375}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 香肠包装 / `sausage-pack` score `0.831312` image `fixtures/vision-household/cn/sausage-pack/sausage-pack-cn-gallery-002-image.jpg` [香肠风干肠哈尔滨红肠包装盒腊肠猪肉灌肠腊味熟食火腿通用礼品盒_虎窝淘](https://tao.hooos.com/goods_660849495591.html)
  - #2 米袋 / `rice-bag` score `0.826461` image `fixtures/vision-household/cn/rice-bag/rice-bag-cn-gallery-001-10-20-30-50.jpg` [大米袋子10斤装20 30 50斤大米编织袋!农家自封米袋太香了!-水泥袋-淘宝好物网](https://goods.taobao.com/t/shuinidai_14291/f3e7e99858b56992f833f44fd0f9e9af.html)
  - #3 鞋油盒 / `shoe-polish-tin` score `0.822649` image `fixtures/vision-household/cn/shoe-polish-tin/shoe-polish-tin-cn-gallery-003-2019.jpg` [全胜凯威海绵鞋蜡皮具皮革护理无色单面鞋油 2019新包装包邮_虎窝淘](https://tao.hooos.com/goods_22934472513.html)

#### canned-food-cn-eval-004

- Query image: `fixtures/vision-household/cn/canned-food/canned-food-cn-eval-004-312gx6.jpg`
- Source: [水果罐头混合装312gx6罐新鲜整箱糖水果橘子黄桃菠萝椰果什锦罐头_虎窝淘](https://tao.hooos.com/goods_624066826188.html)
- GT: 罐头 / `canned-food` / box `{'x': 69.875, 'y': 7.875, 'w': 28.5, 'h': 41.75}`
- Prediction: 瓶装碳酸饮料 / `carbonated-drink-bottle` / box `{'x': 69.875, 'y': 7.875, 'w': 28.5, 'h': 41.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 瓶装碳酸饮料 / `carbonated-drink-bottle` score `0.824282` image `fixtures/vision-household/cn/carbonated-drink-bottle/carbonated-drink-bottle-cn-gallery-002-300ml.jpg` [百事可乐碳酸饮料迷你瓶装汽水 百事可乐300ml解渴畅饮美味_虎窝淘](https://tao.hooos.com/goods_pJ3odjvUxt6Vm0O0enceg0uptm-ZWRNNbuAZmgOYy0cp.html)
  - #2 凉茶罐 / `herbal-tea-can` score `0.821088` image `fixtures/vision-household/cn/herbal-tea-can/herbal-tea-can-cn-gallery-002-25-310ml-6-0-0-0.jpg` [25年必买!三皮罐凉茶310ml*6罐｜0糖0脂0卡清爽解腻神器-凉茶-淘宝好物网](https://goods.taobao.com/t/liangcha_10529/e0266989fddf293742940cf67f998203.html)
  - #3 瓶装碳酸饮料 / `carbonated-drink-bottle` score `0.814941` image `fixtures/vision-household/cn/carbonated-drink-bottle/carbonated-drink-bottle-cn-gallery-003-2l-6.jpg` [百事可乐无糖极度七喜美年达超大瓶装碳酸饮料2L*6瓶整箱无糖可乐_虎窝淘](https://tao.hooos.com/goods_633282473126.html)

#### snack-bag-cn-eval-004

- Query image: `fixtures/vision-household/cn/snack-bag/snack-bag-cn-eval-004-100.jpg`
- Source: [休闲食品自封袋坚果自立袋糖果零食袋子批发 100个零食物语包装袋_虎窝淘](https://tao.hooos.com/goods_624794102528.html)
- GT: 零食袋 / `snack-bag` / box `{'x': 45.5, 'y': 21.375, 'w': 46.125, 'h': 66.875}`
- Prediction: 酸奶瓶 / `yogurt-bottle` / box `{'x': 45.5, 'y': 21.375, 'w': 46.125, 'h': 66.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 酸奶瓶 / `yogurt-bottle` score `0.856269` image `fixtures/vision-household/cn/yogurt-bottle/yogurt-bottle-cn-gallery-001-910g-2.jpg` [新希望活润酸奶910g*2桶大桶装草莓桑葚黄桃芒果味浓香早餐酸奶_虎窝淘](https://tao.hooos.com/goods_672023048447.html)
  - #2 金针菇 / `enoki-mushroom` score `0.85522` image `fixtures/vision-household/cn/enoki-mushroom/enoki-mushroom-cn-gallery-003-image.jpg` [金大洲金针菇：麻辣大包来袭，开袋即食的美味革命!-蔬菜干-淘宝百科网](https://bk.taobao.com/k/shucaigan_14139/49fe3036e1095c32182cd393c4c42746.html)
  - #3 罐装碳酸饮料 / `carbonated-drink-can` score `0.847944` image `fixtures/vision-household/cn/carbonated-drink-can/carbonated-drink-can-cn-gallery-002-x-330ml.jpg` [美年达 x 蛋仔派对联名限定装大气橙味碳酸饮料330ml罐装果味饮料-淘宝网](https://mobile-phone.taobao.com/detail/Ymc4Qm5uWHcrcWN2S1ptd05acGNPQT09.html)

#### beverage-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/beverage-bottle/beverage-bottle-cn-eval-004-33-2500ml-2-5-pet-5.jpg`
- Source: [33号2500ml/2.5升一次性透明塑料瓶空瓶果汁瓶pet饮料瓶子5斤带盖_虎窝淘](https://tao.hooos.com/goods_MqVZarDtKtJ9xmWuVVmUQtA-PNzeejCnBOOW0pMhY.html)
- GT: 饮料瓶 / `beverage-bottle` / box `{'x': 31.125, 'y': 7.25, 'w': 33.25, 'h': 82}`
- Prediction: 饮料瓶 / `beverage-bottle` / box `{'x': 31.125, 'y': 7.25, 'w': 33.25, 'h': 82}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 饮料瓶 / `beverage-bottle` score `0.885132` image `fixtures/vision-household/cn/beverage-bottle/beverage-bottle-cn-gallery-002-13-500ml.jpg` [13号500ml/毫升一次性透明塑料瓶空瓶矿泉水瓶果汁瓶饮料瓶子带盖_虎窝淘](https://tao.hooos.com/goods_543225313651.html)
  - #2 果酱瓶 / `jam-jar` score `0.879021` image `fixtures/vision-household/cn/jam-jar/jam-jar-cn-gallery-001-image.jpg` [果酱瓶玻璃瓶密封罐蜂蜜燕窝分装罐头草莓酱空瓶柠檬膏秋梨膏瓶子_虎窝淘](https://tao.hooos.com/goods_616748182248.html)
  - #3 爽肤水瓶 / `toner-bottle` score `0.858881` image `fixtures/vision-household/cn/toner-bottle/toner-bottle-cn-gallery-002-120.jpg` [120毫升透绿色爽肤水卸妆水保湿精华水分装瓶带电镀银色旋盖-阿里巴巴](https://detail.1688.com/offer/646858993936.html)

#### spice-jar-cn-eval-004

- Query image: `fixtures/vision-household/cn/spice-jar/spice-jar-cn-eval-004-image.jpg`
- Source: [定量控盐瓶调料罐密封罐防潮控盐调料瓶家用厨房调味料瓶组合套装_虎窝淘](https://tao.hooos.com/goods_jGjKVjmyc0tJAPg2mDYtBKeUJte-wzQnnOsQO4naORwsN.html)
- GT: 调料瓶 / `spice-jar` / box `{'x': 35.7333, 'y': 27.4, 'w': 31, 'h': 62.0667}`
- Prediction: 加湿器 / `humidifier` / box `{'x': 35.7333, 'y': 27.4, 'w': 31, 'h': 62.0667}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 加湿器 / `humidifier` score `0.826353` image `fixtures/vision-household/cn/humidifier/humidifier-cn-gallery-002-2-xiaomi-2.jpg` [米家加湿器2 银离子抗菌智能加湿器卧室家用适用于Xiaomi加湿器2-阿里巴巴](https://detail.1688.com/offer/704968990809.html)
  - #2 鱼竿 / `fishing-rod` score `0.80821` image `fixtures/vision-household/cn/fishing-rod/fishing-rod-cn-gallery-003-image.jpg` [鱼竿手竿套装全套一套组合新手渔具用品垂钓装备大全海杆钓鱼竿_虎窝淘](https://tao.hooos.com/goods_PKDpY7Nf3tnnK7KUvvNUPt6-PNzeejCKg892JagSD.html)
  - #3 香薰瓶 / `diffuser-bottle` score `0.799599` image `fixtures/vision-household/cn/diffuser-bottle/diffuser-bottle-cn-gallery-001-image.jpg` [带盖经典磨砂玻璃瓶无火香薰分装瓶香水精油扩香瓶空瓶藤条香薰瓶_虎窝淘](https://tao.hooos.com/goods_nwo8OkQSMt3pgNOYxpCkNOh0tP-PNzeejCKm2A4a3XHb.html)

#### medicine-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/medicine-box/medicine-box-cn-eval-004-image.jpg`
- Source: [日本药盒便携一周分装盒，吃药再也不手忙脚乱!💊-药盒-淘宝百科网](https://bk.taobao.com/k/yaohe_5655/7715f52b55552fd1ce4c7716c65f1a9d.html)
- GT: 药盒 / `medicine-box` / box `{'x': 7.25, 'y': 34.25, 'w': 58.25, 'h': 42.875}`
- Prediction: 药盒 / `medicine-box` / box `{'x': 7.25, 'y': 34.25, 'w': 58.25, 'h': 42.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 药盒 / `medicine-box` score `0.794381` image `fixtures/vision-household/cn/medicine-box/medicine-box-cn-gallery-002-image.jpg` [便携式药盒家用密封防潮带切药器小号分装药丸盒迷你随身装薬盒子_虎窝淘](https://tao.hooos.com/goods_641233251476.html)
  - #2 收纳盒 / `storage-box` score `0.783497` image `fixtures/vision-household/cn/storage-box/storage-box-cn-gallery-003-image.jpg` [手提收纳盒 透明收纳箱塑料盒子家居储物防潮防虫 儿童玩具整理箱_虎窝淘](https://tao.hooos.com/goods_9nWjnZQTBtONzJPppvsZnqtQt6-jeke0AOcXvwoGNb4TzO.html)
  - #3 收纳盒 / `storage-box` score `0.776724` image `fixtures/vision-household/cn/storage-box/storage-box-cn-gallery-002-image.jpg` [办公室文件收纳盒抽屉式塑料桌底下多层文具储物学生整理置物柜子_虎窝淘](https://tao.hooos.com/goods_640886710103.html)

#### pill-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/pill-bottle/pill-bottle-cn-eval-004-image.jpg`
- Source: [便携塑料小药瓶白色避光小空瓶固体胶囊分装瓶药用片剂包装瓶带盖_虎窝淘](https://tao.hooos.com/goods_601296008600.html)
- GT: 药瓶 / `pill-bottle` / box `{'x': 21.625, 'y': 34.5, 'w': 18.75, 'h': 58.25}`
- Prediction: 鱼竿 / `fishing-rod` / box `{'x': 21.625, 'y': 34.5, 'w': 18.75, 'h': 58.25}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 鱼竿 / `fishing-rod` score `0.909749` image `fixtures/vision-household/cn/fishing-rod/fishing-rod-cn-gallery-003-image.jpg` [鱼竿手竿套装全套一套组合新手渔具用品垂钓装备大全海杆钓鱼竿_虎窝淘](https://tao.hooos.com/goods_PKDpY7Nf3tnnK7KUvvNUPt6-PNzeejCKg892JagSD.html)
  - #2 脚凳 / `ottoman` score `0.899087` image `fixtures/vision-household/cn/ottoman/ottoman-cn-gallery-001-image.jpg` [弥玥泉补水喷雾保湿女舒缓敏感肌妆前冰川温泉小分子爽肤水弥月泉-阿里巴巴](https://detail.1688.com/offer/681239914534.html)
  - #3 饮料瓶 / `beverage-bottle` score `0.891785` image `fixtures/vision-household/cn/beverage-bottle/beverage-bottle-cn-gallery-003-330ml500ml.jpg` [现货330ml500ml棕色玻璃瓶 啤酒瓶空瓶汽水瓶饮料瓶咖啡瓶 奶茶瓶_虎窝淘](https://tao.hooos.com/goods_4bjKdjNsgtNM625VvQiww2sNtg-BmWKKNHrvR9d3wqs6.html)

#### thermometer-cn-eval-004

- Query image: `fixtures/vision-household/cn/thermometer/thermometer-cn-eval-004-image.jpg`
- Source: [电子体温计欧德宝：精准测量，守护家人的健康温度!-体温计-淘宝百科网](https://bk.taobao.com/k/tiwenji_6546/6b020ce5a7bd6812a8998595ed429e9c.html)
- GT: 体温计 / `thermometer` / box `{'x': 62.75, 'y': 9.875, 'w': 19.25, 'h': 77.875}`
- Prediction: 扫帚 / `broom` / box `{'x': 62.75, 'y': 9.875, 'w': 19.25, 'h': 77.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 扫帚 / `broom` score `0.859847` image `fixtures/vision-household/cn/broom/broom-cn-gallery-001-image.jpg` [花锦颂 套装扫把簸箕软毛防风刮水器塑料扫帚清洁组合扫地神器两件套（颜色随机）-融创集采商城](https://wydsmp.sunac.com.cn/goods/1049710)
  - #2 靴子 / `boots` score `0.846376` image `fixtures/vision-household/cn/boots/boots-cn-gallery-003-2022.jpg` [长筒靴女过膝长靴2022秋冬季新款高筒皮靴子平底真皮瘦瘦腿弹力靴_虎窝淘](https://tao.hooos.com/goods_606938304465.html)
  - #3 睫毛膏管 / `mascara-tube` score `0.839035` image `fixtures/vision-household/cn/mascara-tube/mascara-tube-cn-gallery-003-8ml.jpg` [高端铝管睫毛膏管8ml碎发整理液染眉膏纤长睫毛管空管包材-阿里巴巴](https://detail.1688.com/offer/796232165373.html)

#### bandage-box-cn-eval-004

- Query image: `fixtures/vision-household/cn/bandage-box/bandage-box-cn-eval-004-5.jpg`
- Source: [医疗促销礼品 可贴牌便携塑料创可贴盒含5片止血贴 创口贴邦迪盒-阿里巴巴](https://detail.1688.com/offer/41419373508.html)
- GT: 创可贴盒 / `bandage-box` / box `{'x': 2.3333, 'y': 23.6667, 'w': 32.2222, 'h': 39.7778}`
- Prediction: 牙膏 / `toothpaste` / box `{'x': 2.3333, 'y': 23.6667, 'w': 32.2222, 'h': 39.7778}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 牙膏 / `toothpaste` score `0.774755` image `fixtures/vision-household/cn/toothpaste/toothpaste-cn-gallery-003-200g-2.jpg` [纳爱斯自然盐白牙膏200g*2支清洁天然多效去牙垢亮白薄荷护龈_虎窝淘](https://tao.hooos.com/goods_661824898383.html)
  - #2 浴室清洁剂瓶 / `bathroom-cleaner-bottle` score `0.757326` image `fixtures/vision-household/cn/bathroom-cleaner-bottle/bathroom-cleaner-bottle-cn-gallery-001-2.jpg` [2瓶浴室清洁剂厕所水垢浴缸泡沫草酸清洁剂玻璃瓷砖不锈钢除水渍_虎窝淘](https://tao.hooos.com/goods_602646493553.html)
  - #3 脚凳 / `ottoman` score `0.753482` image `fixtures/vision-household/cn/ottoman/ottoman-cn-gallery-001-image.jpg` [弥玥泉补水喷雾保湿女舒缓敏感肌妆前冰川温泉小分子爽肤水弥月泉-阿里巴巴](https://detail.1688.com/offer/681239914534.html)

#### first-aid-kit-cn-eval-004

- Query image: `fixtures/vision-household/cn/first-aid-kit/first-aid-kit-cn-eval-004-image.jpg`
- Source: [户外急救包全攻略：红十字会推荐便携医用箱，地震应急必备!-应急包-淘宝百科网](https://bk.taobao.com/k/yingjibao_3523/5a38e2227090da1cd5bb3c437ef9c4bf.html)
- GT: 急救包 / `first-aid-kit` / box `{'x': 33.2639, 'y': 6.1806, 'w': 64.6528, 'h': 9.8611}`
- Prediction: 收纳标签贴 / `storage-label-sticker` / box `{'x': 33.2639, 'y': 6.1806, 'w': 64.6528, 'h': 9.8611}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 收纳标签贴 / `storage-label-sticker` score `0.871192` image `fixtures/vision-household/cn/storage-label-sticker/storage-label-sticker-cn-gallery-003-image.jpg` [彩色不干胶标签贴贴纸防水无痕自粘分类收纳手写标签纸儿童姓名贴-阿里巴巴](https://detail.1688.com/offer/677337595134.html)
  - #2 蒸锅 / `steamer-pot` score `0.831224` image `fixtures/vision-household/cn/steamer-pot/steamer-pot-cn-gallery-002-image.jpg` [《明朝那些事儿》主要人物线路图 - 知乎](https://zhuanlan.zhihu.com/p/141478672)
  - #3 蛋黄酱瓶 / `mayonnaise-bottle` score `0.809703` image `fixtures/vision-household/cn/mayonnaise-bottle/mayonnaise-bottle-cn-gallery-001-1kg-12.jpg` [百利纯正蛋黄酱1kg*12袋整箱｜沙拉控狂喜!这瓶酱料让我吃出高级餐厅的味道!-沙拉-淘宝好物网](https://goods.taobao.com/t/shala_11460/1eaf8ae8e6dcf90786f0c329acda5cb9.html)

#### face-mask-pack-cn-eval-004

- Query image: `fixtures/vision-household/cn/face-mask-pack/face-mask-pack-cn-eval-004-954vkn95-3m9041.jpg`
- Source: [口罩954VKN95口罩防装修甲醛粉尘异味3M9041有机气体防护口罩包邮-阿里巴巴](https://detail.1688.com/offer/690036462534.html)
- GT: 口罩包 / `face-mask-pack` / box `{'x': 48.125, 'y': 34.1667, 'w': 14.6094, 'h': 17.9167}`
- Prediction: 花盆 / `flower-pot` / box `{'x': 48.125, 'y': 34.1667, 'w': 14.6094, 'h': 17.9167}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 花盆 / `flower-pot` score `0.808921` image `fixtures/vision-household/cn/flower-pot/flower-pot-cn-gallery-002-66.jpg` [这66款庭院围墙，完美你的庭院边界！ - 知乎](https://zhuanlan.zhihu.com/p/438666085)
  - #2 宠物碗 / `pet-bowl` score `0.807125` image `fixtures/vision-household/cn/pet-bowl/pet-bowl-cn-gallery-001-image.jpg` [宠物碗界的"全能选手"，你家毛孩子值得拥有!-猫狗碗/慢食碗-淘宝好物网](https://goods.taobao.com/t/maogouwan_2285/9a98b3dd63570594fbcf09d97ed7dc90.html)
  - #3 饮水机 / `water-dispenser` score `0.80572` image `fixtures/vision-household/cn/water-dispenser/water-dispenser-cn-gallery-001-2021.jpg` [贝尔斯盾饮水机智能家用全自动下置水桶冰温热小型茶吧机2021新款_虎窝淘](https://tao.hooos.com/goods_yd7yDWriRtgxgdvhooMfvtA-p3j775cRePW9prxTo.html)

#### disinfectant-wipes-cn-eval-004

- Query image: `fixtures/vision-household/cn/disinfectant-wipes/disinfectant-wipes-cn-eval-004-60.jpg`
- Source: [一次性医用消毒湿巾60片装：大包消毒湿巾，随时随地杀菌消毒!-消毒棉片-淘宝好物网](https://goods.taobao.com/t/xiaodumianpian_13445/30444cedfcd79975b148f40eaeaa12bc.html)
- GT: 消毒湿巾 / `disinfectant-wipes` / box `{'x': 0, 'y': 30.75, 'w': 99.375, 'h': 69.25}`
- Prediction: 笔 / `pen` / box `{'x': 0, 'y': 30.75, 'w': 99.375, 'h': 69.25}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 笔 / `pen` score `0.842888` image `fixtures/vision-household/cn/pen/pen-cn-gallery-003-720.jpg` [美卡勒马克笔全套720色绘画笔双头笔套装盒装硬头软头动漫彩色笔_虎窝淘](https://tao.hooos.com/goods_Q2brnbdHQtBxD3o98ZTXyBsatQ-YA3ppxSdn7naj8JcW.html)
  - #2 一次性筷子包 / `disposable-chopsticks-pack` score `0.840416` image `fixtures/vision-household/cn/disposable-chopsticks-pack/disposable-chopsticks-pack-cn-gallery-002-image.jpg` [一次性筷子四件套餐包四合一筷勺外卖卫生餐具商用套装刀叉可定制_虎窝淘](https://tao.hooos.com/goods_602663603487.html)
  - #3 湿巾包 / `wet-wipes-pack` score `0.830597` image `fixtures/vision-household/cn/wet-wipes-pack/wet-wipes-pack-cn-gallery-001-image.jpg` [婴儿湿巾柔软毛巾手口屁专用宝宝儿童大包带盖湿巾包家庭实惠装_虎窝淘](https://tao.hooos.com/goods_78dPN0ZS4t5GX3PK45TnnjfMtV-rkOPPMuMn02e0Qof9.html)

#### laundry-detergent-cn-eval-004

- Query image: `fixtures/vision-household/cn/laundry-detergent/laundry-detergent-cn-eval-004-3kg-4-24.jpg`
- Source: [蓝月亮洗衣液3Kg*4瓶薰衣草香深层洁净衣物清洁整箱家用24斤大桶_虎窝淘](https://tao.hooos.com/goods_2nXMbGbUotwqnynFaaptDtD-xzQZZ4sO6Yp7k0etA.html)
- GT: 洗衣液 / `laundry-detergent` / box `{'x': 15.125, 'y': 25.25, 'w': 44.625, 'h': 67.875}`
- Prediction: 洗衣液 / `laundry-detergent` / box `{'x': 15.125, 'y': 25.25, 'w': 44.625, 'h': 67.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 洗衣液 / `laundry-detergent` score `0.942179` image `fixtures/vision-household/cn/laundry-detergent/laundry-detergent-cn-gallery-001-1-1kg.jpg` [蓝月亮洗衣液1公斤机洗常规家用官方旗舰正品1kg瓶装持久留香_虎窝淘](https://tao.hooos.com/goods_v9N2dY8UZt0xdnvSAM9U0te-4RDrrQFy4on2veH9.html)
  - #2 洗衣液瓶 / `laundry-detergent-bottle` score `0.926515` image `fixtures/vision-household/cn/laundry-detergent-bottle/laundry-detergent-bottle-cn-gallery-001-1kg-wepost.jpg` [蓝月亮机洗洗衣液自然清香亮白增艳衣服衣物护理1kg/瓶装留香 - 小编推荐 - WePost 全民代运 - 马来西亚中国淘宝代运与集运专家](https://www.wepost.com.my/recommends/items/taobao-MOW2ZOf4QedNrmURy.html)
  - #3 洗衣液瓶 / `laundry-detergent-bottle` score `0.925888` image `fixtures/vision-household/cn/laundry-detergent-bottle/laundry-detergent-bottle-cn-gallery-002-12-3kg-1kg-3.png` [蓝月亮洗衣液12斤套装3kg+1kg*3瓶家用深层洁净护理薰衣草香持久_虎窝淘](https://tao.hooos.com/goods_BKdZpaVS6t8vkRwIpMmirte-WkRwwpuQO5OvWrpId.html)

#### dish-soap-cn-eval-004

- Query image: `fixtures/vision-household/cn/dish-soap/dish-soap-cn-eval-004-500g.jpg`
- Source: [雕牌洗洁精小瓶500g全效丝瓜清爽去油餐洗净洗碟精宿舍家用洗涤精_虎窝淘](https://tao.hooos.com/goods_624853574427.html)
- GT: 洗洁精 / `dish-soap` / box `{'x': 38.375, 'y': 29.375, 'w': 23.5, 'h': 61.75}`
- Prediction: 洗衣粉袋 / `washing-powder-bag` / box `{'x': 38.375, 'y': 29.375, 'w': 23.5, 'h': 61.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 洗衣粉袋 / `washing-powder-bag` score `0.899572` image `fixtures/vision-household/cn/washing-powder-bag/washing-powder-bag-cn-gallery-002-max.jpg` [官方正品雕牌洗衣粉大袋装，家庭必备!大包袋去渍力MAX，茉莉清香扑鼻，你还在等什么？-洗衣粉-淘宝好物网](https://goods.taobao.com/t/xiyifen_12480/dc3cbb593761cc132ddfc0871c2c18fe.html)
  - #2 驱蚊液 / `mosquito-repellent` score `0.896381` image `fixtures/vision-household/cn/mosquito-repellent/mosquito-repellent-cn-gallery-003-ars-saratect-200ml.jpg` [ARS/安速 Saratect驱蚊液200ml：日本进口，夏日防蚊神器大揭秘!-防蚊液-淘宝百科网](https://bk.taobao.com/k/fangwenye_18177/91c6d4ad9daf69a68c7390d0def19853.html)
  - #3 洗洁精 / `dish-soap` score `0.894871` image `fixtures/vision-household/cn/dish-soap/dish-soap-cn-gallery-002-4-68kg.jpg` [雕牌洗洁精4.68kg大桶：厨房清洁神器，家庭酒店通用!-洗洁精-淘宝好物网](https://goods.taobao.com/t/xijiejing_5616/06dbf05bba7b2e8e631c9156c6aa9eaa.html)

#### cleaning-spray-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/cleaning-spray-bottle/cleaning-spray-bottle-cn-eval-004-500ml.jpg`
- Source: [家居护理家政清洁配比瓶安利产品稀释喷瓶喷雾瓶500ml喷头大喷壶-阿里巴巴](https://detail.1688.com/offer/611229856143.html)
- GT: 清洁喷瓶 / `cleaning-spray-bottle` / box `{'x': 28, 'y': 22.125, 'w': 19.125, 'h': 60.75}`
- Prediction: 清洁喷瓶 / `cleaning-spray-bottle` / box `{'x': 28, 'y': 22.125, 'w': 19.125, 'h': 60.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 清洁喷瓶 / `cleaning-spray-bottle` score `0.853556` image `fixtures/vision-household/cn/cleaning-spray-bottle/cleaning-spray-bottle-cn-gallery-001-84.jpg` [喷壶家用非安利喷瓶酒精84消毒专用清洁喷雾瓶洗洁精稀释瓶带刻度_虎窝淘](https://tao.hooos.com/goods_652657850226.html)
  - #2 生理盐水瓶 / `medical-saline-bottle` score `0.83777` image `fixtures/vision-household/cn/medical-saline-bottle/medical-saline-bottle-cn-gallery-001-500ml-ok-250ml-5-5jmgzo.jpg` [《生理性盐水500ml大瓶氯化钠盐氺美容湿敷脸祛痘消毒洗鼻清洗液ok 【250ML盐水】5瓶+送赠品5JMGZO》无著【摘要 书评 在线阅读 ...](https://product.suning.com/0071413501/12274969648.html)
  - #3 气泡水瓶 / `sparkling-water-bottle` score `0.792392` image `fixtures/vision-household/cn/sparkling-water-bottle/sparkling-water-bottle-cn-gallery-002-image.jpg` [大象牌泰象木塞苏打水瓶：复古潮流，享受清新气泡的秘诀🌟-酒塞-淘宝百科网](https://bk.taobao.com/k/jiusai_14516/0d2237e777e6aa08f2f4e25d3d37625e.html)

#### sponge-cn-eval-004

- Query image: `fixtures/vision-household/cn/sponge/sponge-cn-eval-004-image.jpg`
- Source: [高密度海绵垫子：拯救腰背的神器!可裁剪海棉沙发垫实测太香了!-海绵-淘宝好物网](https://goods.taobao.com/t/haimian_2272/5a020e31cf634481f51b9f34c3621b3b.html)
- GT: 海绵 / `sponge` / box `{'x': 51.2, 'y': 72.5, 'w': 25.4, 'h': 12.7}`
- Prediction: 瑜伽垫 / `yoga-mat` / box `{'x': 51.2, 'y': 72.5, 'w': 25.4, 'h': 12.7}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 瑜伽垫 / `yoga-mat` score `0.892894` image `fixtures/vision-household/cn/yoga-mat/yoga-mat-cn-gallery-002-2025.jpg` [瑜伽垫天然橡胶2025新款：防滑减震静音，女神必备土豪垫!-瑜伽垫-淘宝好物网](https://goods.taobao.com/t/yujiadian_13965/69ed692e5750bc2a48c043a54389acbf.html)
  - #2 吸顶灯面板 / `ceiling-light-panel` score `0.88488` image `fixtures/vision-household/cn/ceiling-light-panel/ceiling-light-panel-cn-gallery-003-led.jpg` [雷士照明集成吊顶led灯嵌入式厨房卫生间吸顶灯铝扣板平板面板灯_虎窝淘](https://tao.hooos.com/goods_GKXeX9I8tOQ8a2fYYouQtJ-jdZqqnCX0rV2g9WtK.html)
  - #3 球 / `sports-ball` score `0.882377` image `fixtures/vision-household/cn/sports-ball/sports-ball-cn-gallery-003-image.jpg` [世界十大旅游景点，一生必去一次的旅游胜地，你去过哪几个？__财经头条](https://cj.sina.com.cn/articles/view/6559979314/18701573200100e5en)

#### trash-bag-roll-cn-eval-004

- Query image: `fixtures/vision-household/cn/trash-bag-roll/trash-bag-roll-cn-eval-004-image.jpg`
- Source: [白色加厚垃圾袋家用一次性点断式塑料袋透明平口大号垃圾桶袋卷装_虎窝淘](https://tao.hooos.com/goods_571439119485.html)
- GT: 垃圾袋卷 / `trash-bag-roll` / box `{'x': 4.125, 'y': 56.125, 'w': 54.25, 'h': 36.625}`
- Prediction: 笔 / `pen` / box `{'x': 4.125, 'y': 56.125, 'w': 54.25, 'h': 36.625}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 笔 / `pen` score `0.845209` image `fixtures/vision-household/cn/pen/pen-cn-gallery-003-720.jpg` [美卡勒马克笔全套720色绘画笔双头笔套装盒装硬头软头动漫彩色笔_虎窝淘](https://tao.hooos.com/goods_Q2brnbdHQtBxD3o98ZTXyBsatQ-YA3ppxSdn7naj8JcW.html)
  - #2 花生酱瓶 / `peanut-butter-jar` score `0.839003` image `fixtures/vision-household/cn/peanut-butter-jar/peanut-butter-jar-cn-gallery-002-450gx2.jpg` [顶好幼滑花生酱450gX2瓶蒸饺蘸酱香西餐调味酱花生酱夹心饼干料_虎窝淘](https://tao.hooos.com/goods_549517966503.html)
  - #3 一次性筷子包 / `disposable-chopsticks-pack` score `0.8384` image `fixtures/vision-household/cn/disposable-chopsticks-pack/disposable-chopsticks-pack-cn-gallery-002-image.jpg` [一次性筷子四件套餐包四合一筷勺外卖卫生餐具商用套装刀叉可定制_虎窝淘](https://tao.hooos.com/goods_602663603487.html)

#### toilet-cleaner-bottle-cn-eval-004

- Query image: `fixtures/vision-household/cn/toilet-cleaner-bottle/toilet-cleaner-bottle-cn-eval-004-image.jpg`
- Source: [大瓶洁厕剂洁厕灵马桶便槽除臭去污护釉清洁剂清香不刺鼻洁厕液_虎窝淘](https://tao.hooos.com/goods_604396009583.html)
- GT: 洁厕剂 / `toilet-cleaner-bottle` / box `{'x': 25, 'y': 11.125, 'w': 26, 'h': 88.125}`
- Prediction: 衣领净瓶 / `collar-cleaner-bottle` / box `{'x': 25, 'y': 11.125, 'w': 26, 'h': 88.125}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 衣领净瓶 / `collar-cleaner-bottle` score `0.892803` image `fixtures/vision-household/cn/collar-cleaner-bottle/collar-cleaner-bottle-cn-gallery-001-500g-2-500g-2-500g-2.jpg` [【美的蓝月亮 衣领净组合套装喷雾型衣领净500g*2瓶+衣领净瓶补500g*2瓶】美的洗衣液,蓝月亮 衣领净组合套装喷雾型衣领净500g*2瓶 ...](https://www.midea.cn/10000/1000000000100511299170.html)
  - #2 洗衣皂 / `laundry-soap-bar` score `0.892669` image `fixtures/vision-household/cn/laundry-soap-bar/laundry-soap-bar-cn-gallery-002-108g.jpg` [固本无磷超效洗衣皂108g：老肥皂逆袭？柠檬香型真能去渍又环保？🧼-洗衣皂-淘宝百科网](https://bk.taobao.com/k/xiyizao_9672/156b9b50484aaf0b3070cc9935d1d621.html)
  - #3 洁厕剂 / `toilet-cleaner-bottle` score `0.889946` image `fixtures/vision-household/cn/toilet-cleaner-bottle/toilet-cleaner-bottle-cn-gallery-001-500g.jpg` [超威强力洁厕精500g/瓶洁厕液洁厕剂除尿垢除臭马桶清洁剂洁厕灵_虎窝淘](https://tao.hooos.com/goods_611641715714.html)

#### mop-head-cn-eval-004

- Query image: `fixtures/vision-household/cn/mop-head/mop-head-cn-eval-004-image.png`
- Source: [加厚吸水旋转拖把头：清洁神器，让你的家务事半功倍!💪-旋转拖把-淘宝百科网](https://bk.taobao.com/k/xuanzhuantuoba_7060/f5eb890109848dc64d5ccc5734643968.html)
- GT: 拖把头 / `mop-head` / box `{'x': 44.875, 'y': 0.25, 'w': 38, 'h': 60.75}`
- Prediction: 沙发 / `sofa` / box `{'x': 44.875, 'y': 0.25, 'w': 38, 'h': 60.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 沙发 / `sofa` score `0.839985` image `fixtures/vision-household/cn/sofa/sofa-cn-gallery-003-image.jpg` [真皮沙发头层牛皮沙发定制极简高端客厅小户型康纳利直排家具沙发-阿里巴巴](https://detail.1688.com/offer/693722881619.html)
  - #2 毛巾架 / `towel-rack` score `0.829276` image `fixtures/vision-household/cn/towel-rack/towel-rack-cn-gallery-001-invisible-bath-towel-rack.jpg` [Invisible Bath Towel Rack: 拯救你的浴室空间，隐形毛巾架的魔力 -滑板收纳架-淘宝百科网](https://bk.taobao.com/k/huabanshounajia_13061/8da3cf3b68a725193ef5ff6480c8b9df.html)
  - #3 扫帚 / `broom` score `0.815538` image `fixtures/vision-household/cn/broom/broom-cn-gallery-003-image.jpg` [扫把簸箕套装组合撮箕家用套装软毛笤帚不粘头发扫地垃圾铲扫帚_虎窝淘](https://tao.hooos.com/goods_rB8AKJAuOtzJMaVs66QFqtZ-nMYPPWFx7q4ajK8fg.html)

#### charging-cable-cn-eval-004

- Query image: `fixtures/vision-household/cn/charging-cable/charging-cable-cn-eval-004-25-type-c-vivo-2.jpg`
- Source: [25年必买Type-C弯头数据线｜华为小米vivo快充神器，加长2米超实用!-数据线-淘宝好物网](https://goods.taobao.com/t/shujuxian_1728/e1fb26e96b31392db7ca115f1c17db04.html)
- GT: 数据线 / `charging-cable` / box `{'x': 11.375, 'y': 5.375, 'w': 86.25, 'h': 94.5}`
- Prediction: Lightning线 / `lightning-cable` / box `{'x': 11.375, 'y': 5.375, 'w': 86.25, 'h': 94.5}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 Lightning线 / `lightning-cable` score `0.857965` image `fixtures/vision-household/cn/lightning-cable/lightning-cable-cn-gallery-001-lightning-type-c.jpg` [苹果用户速看!Lightning转Type-C充电线百元搞定快充时代_手机_淘宝数码网](https://shuma.taobao.com/topic/shouji_19/aab7f22176e18d02cd2b38b8dd271219)
  - #2 USB插排 / `usb-power-strip` score `0.809534` image `fixtures/vision-household/cn/usb-power-strip/usb-power-strip-cn-gallery-003-20w-65w-usb.jpg` [公牛插座插排20W快充笔记本笔电排插65W多功能USB插排智能接线板_虎窝淘](https://tao.hooos.com/goods_9ZmvbpHBtO2m2pqjqC22XTQt6-RWRNNzuVV6DOxR5Hv.html)
  - #3 打蛋器 / `whisk` score `0.802564` image `fixtures/vision-household/cn/whisk/whisk-cn-gallery-001-image.jpg` [乐米高电动打蛋器家用小型烘焙奶油打发器打蛋机蛋糕奶油搅拌机_虎窝淘](https://tao.hooos.com/goods_zrkJMe0Ueta3qZ5voqhvvMfdt4-OpRwwaFZRVabg3vs2.html)

#### charger-cn-eval-004

- Query image: `fixtures/vision-household/cn/charger/charger-cn-eval-004-magsafe.jpg`
- Source: [MagSafe三合一无线充电器：苹果全家桶的终极充电解决方案!-手机充电器-淘宝好物网](https://goods.taobao.com/t/shoujichongdianqi_4125/bd5e056cf1e0a8d89e68849eb39313c1.html)
- GT: 充电器 / `charger` / box `{'x': 9.9167, 'y': 38.3333, 'w': 51.9167, 'h': 55.25}`
- Prediction: 马桶盖 / `toilet-seat` / box `{'x': 9.9167, 'y': 38.3333, 'w': 51.9167, 'h': 55.25}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 马桶盖 / `toilet-seat` score `0.799988` image `fixtures/vision-household/cn/toilet-seat/toilet-seat-cn-gallery-001-image.jpg` [智能马桶盖_卫丽净官网](http://www.weilijing.cn/wwh/level6.html)
  - #2 挂烫机 / `garment-steamer` score `0.798538` image `fixtures/vision-household/cn/garment-steamer/garment-steamer-cn-gallery-003-gt13cp.jpg` [苏泊尔挂烫机家用手持蒸汽熨斗烫机商用服装熨烫机电熨斗GT13CP_虎窝淘](https://tao.hooos.com/goods_qq6ojoDi2twYjyesgg3SWt0-WkRwwpuNxz2z0mQc3.html)
  - #3 剃须刀 / `shaver` score `0.79227` image `fixtures/vision-household/cn/shaver/shaver-cn-gallery-002-fs373.jpg` [飞科剃须刀电动男刮胡刀全身水洗智能充电式胡须刀官方正品FS373_虎窝淘](https://tao.hooos.com/goods_BAYqVOzc6t8VQP20pasppoCrte-JRMPPdFMjG44Xq8H0.html)

#### battery-cn-eval-004

- Query image: `fixtures/vision-household/cn/battery/battery-cn-eval-004-5-7-4-ktv-aa-1-5v.jpg`
- Source: [倍量 5号7号充电电池大容量4节套装KTV套装可代替AA五1.5v锂电池_虎窝淘](https://tao.hooos.com/goods_600127184801.html)
- GT: 电池 / `battery` / box `{'x': 24.75, 'y': 4.875, 'w': 24.375, 'h': 38.25}`
- Prediction: 电池充电器 / `rechargeable-battery-charger` / box `{'x': 24.75, 'y': 4.875, 'w': 24.375, 'h': 38.25}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 电池充电器 / `rechargeable-battery-charger` score `0.715592` image `fixtures/vision-household/cn/rechargeable-battery-charger/rechargeable-battery-charger-cn-gallery-003-csdn.jpg` [电池工作原理：一种通俗易懂的讲解_电池的工作原理通俗易懂-CSDN博客](https://blog.csdn.net/zhuoqingjoking97298/article/details/128481045)
  - #2 充电器 / `charger` score `0.71414` image `fixtures/vision-household/cn/charger/charger-cn-gallery-001-anker-737-24000mah-140w.jpg` [Anker安克737移动电源24000mah手机平板充电宝140W快充电器彩显_虎窝淘](https://tao.hooos.com/goods_680459790001.html)
  - #3 旅行转换插头 / `travel-adapter` score `0.712976` image `fixtures/vision-household/cn/travel-adapter/travel-adapter-cn-gallery-003-usb.jpg` [全球旅行必备神器!公牛USB多国转换插头器，让你出国无忧!-转换插头-淘宝好物网](https://goods.taobao.com/t/zhuanhuanchatou_1772/8fb972fcedd224c661a585482891f0d9.html)

#### power-bank-cn-eval-004

- Query image: `fixtures/vision-household/cn/power-bank/power-bank-cn-eval-004-22-5w-10000-wepost.jpg`
- Source: [品胜22.5W充电宝10000毫安超薄小巧便携式超级快充充电宝轻薄闪充迷你移动电源适用华为小米苹果专用可上飞机 - 小编推荐 - WePost ...](https://www.wepost.com.my/recommends/items/taobao-MOW2ZOfVz8adWw5IZV.html)
- GT: 充电宝 / `power-bank` / box `{'x': 56.5, 'y': 19.25, 'w': 29.625, 'h': 69.125}`
- Prediction: 一次性手套盒 / `disposable-glove-box` / box `{'x': 56.5, 'y': 19.25, 'w': 29.625, 'h': 69.125}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 一次性手套盒 / `disposable-glove-box` score `0.821338` image `fixtures/vision-household/cn/disposable-glove-box/disposable-glove-box-cn-gallery-003-pe.png` [一次性手套pe食品级餐饮专用加厚塑料薄膜商用厨房家用盒装抽取式_虎窝淘](https://tao.hooos.com/goods_rXz2mrBsOtVvBgMY5mI6OmHqtZ-vz2ooBsBBYm9yyzsd.html)
  - #2 止汗棒 / `deodorant-stick` score `0.803559` image `fixtures/vision-household/cn/deodorant-stick/deodorant-stick-cn-gallery-003-76g-40g-pp-pe.jpg` [76g遮瑕棒香体棒 40g止汗棒PP固体膏体棒PE防晒底部旋转包材-阿里巴巴](https://detail.1688.com/offer/844579700376.html)
  - #3 马桶刷 / `toilet-brush` score `0.793337` image `fixtures/vision-household/cn/toilet-brush/toilet-brush-cn-gallery-003-image.jpg` [马桶刷家用无死角地刷软毛长柄厕所刷子浴室用品壁挂式清洁刷耐用_虎窝淘](https://tao.hooos.com/goods_pOxAkJtxt6RwdpjjxTegyCptm-DokRR8IP9Bgmjaafn.html)

#### earphones-cn-eval-004

- Query image: `fixtures/vision-household/cn/earphones/earphones-cn-eval-004-ikf-t1.jpg`
- Source: [iKF T1蓝牙耳机头戴式耳机无线新款游戏降噪耳机有线带麦超长待机_虎窝淘](https://tao.hooos.com/goods_668818291173.html)
- GT: 耳机 / `earphones` / box `{'x': 27.375, 'y': 12.875, 'w': 72.625, 'h': 82.625}`
- Prediction: 耳机 / `earphones` / box `{'x': 27.375, 'y': 12.875, 'w': 72.625, 'h': 82.625}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 耳机 / `earphones` score `0.765427` image `fixtures/vision-household/cn/earphones/earphones-cn-gallery-002-w860nb-pro-5-3.jpg` [漫步者 W860NB Pro头戴式主动降噪蓝牙耳机双金标认证降噪耳机 可有线电脑耳机 蓝牙5.3参数配置_规格_性能_功能-苏宁易购](https://www.suning.com/itemcanshu/0071077022/12403560231.html)
  - #2 智能音箱 / `smart-speaker` score `0.749962` image `fixtures/vision-household/cn/smart-speaker/smart-speaker-cn-gallery-003-x5.png` [天猫精灵X5智能音箱，你的生活小助手？🌟深度解析与体验-智能-淘宝百科网](https://bk.taobao.com/k/zhineng_1907/55422f98c99e190782bfa5290f8bc973.html)
  - #3 门挡 / `door-stop` score `0.742492` image `fixtures/vision-household/cn/door-stop/door-stop-cn-gallery-003-image.jpg` [门吸免打孔新款门挡器防撞硅胶卫生间门阻门后强磁铁静音门碰地吸_虎窝淘](https://tao.hooos.com/goods_MJeKkpVcKtw3g3zcVV7HQtA-XNReeACpkg4zX0AI6.html)

#### usb-flash-drive-cn-eval-004

- Query image: `fixtures/vision-household/cn/usb-flash-drive/usb-flash-drive-cn-eval-004-u350-32g-type-c-u-u.jpg`
- Source: [爱国者U350-32G Type-C U盘：手机电脑双用，数据传输神器!-手机U盘-淘宝好物网](https://goods.taobao.com/t/shoujiUpan_2532/649ba1c594dec5f741aa361cb9dfb1da.html)
- GT: U盘 / `usb-flash-drive` / box `{'x': 13.5, 'y': 13.5, 'w': 77, 'h': 56}`
- Prediction: USB-C线 / `usb-c-cable` / box `{'x': 13.5, 'y': 13.5, 'w': 77, 'h': 56}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 USB-C线 / `usb-c-cable` score `0.869171` image `fixtures/vision-household/cn/usb-c-cable/usb-c-cable-cn-gallery-002-usb-to-type-c-type-c-3-0.jpg` [USB to Type-c数据线Type-c 3.0快充线高速数据传输线-阿里巴巴](https://detail.1688.com/offer/680443630939.html)
  - #2 数据线 / `charging-cable` score `0.849971` image `fixtures/vision-household/cn/charging-cable/charging-cable-cn-gallery-001-pd27w-65w-type-c.jpg` [车载数据线四合一超级快充PD27W？65W双Type-C快充线真香警告!-车载数据线-淘宝百科网](https://bk.taobao.com/k/chezaishujuxian_10588/95f3e3ef8dea4c7f5daa7db1fd25086b.html)
  - #3 HDMI线 / `hdmi-cable` score `0.82015` image `fixtures/vision-household/cn/hdmi-cable/hdmi-cable-cn-gallery-002-hdmi-4k60hz-hdmi-a-hdmi.jpg` [光纤HDMI线推荐 | 4K60Hz高清线缆体验报告 HDMI A镀金线 -HDMI线-淘宝好物网](https://goods.taobao.com/t/HDMIxian_6922/acc1e883dab92e02f099a0ed4b990f3c.html)

#### memory-card-case-cn-eval-004

- Query image: `fixtures/vision-household/cn/memory-card-case/memory-card-case-cn-eval-004-sd-tf-usb-3-0.jpg`
- Source: [耐影存储卡盒卡套SD卡TF卡收纳包相机手机内存卡保护盒储存卡USB 3.0高速读卡器手机读卡器：数码摄影爱好者的必备神器!-包-淘宝百科网](https://bk.taobao.com/k/bao_14745/377457741010f16bfc8374c46319ec75.html)
- GT: 存储卡盒 / `memory-card-case` / box `{'x': 14.875, 'y': 48.875, 'w': 55.875, 'h': 47.75}`
- Prediction: 一次性盘包装 / `disposable-plate-pack` / box `{'x': 14.875, 'y': 48.875, 'w': 55.875, 'h': 47.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 一次性盘包装 / `disposable-plate-pack` score `0.778679` image `fixtures/vision-household/cn/disposable-plate-pack/disposable-plate-pack-cn-gallery-003-image.jpg` [生鲜托盘包装盒一次性真空贴体盒超市打包盒牛排塑料盘冷鲜肉批发_虎窝淘](https://tao.hooos.com/goods_XQJeM9JiGtX2GynV9JtVVAuBtg-aAZjjVSdgP40y74T7.html)
  - #2 真空压缩袋 / `vacuum-storage-bag` score `0.766061` image `fixtures/vision-household/cn/vacuum-storage-bag/vacuum-storage-bag-cn-gallery-001-image.jpg` [免抽气真空压缩立体袋，衣物收纳神器，旅行必备!🌍-衣物压缩袋-淘宝百科网](https://bk.taobao.com/k/yiwuyasuodai_8928/770ccc61d8f312b0b5618b4380bdf77e.html)
  - #3 钉子盒 / `nail-box` score `0.765364` image `fixtures/vision-household/cn/nail-box/nail-box-cn-gallery-003-image.jpg` [样品小零件盒钉子收纳塑料带盖螺丝电子贴片元件盒可拆分钓鱼盒子_虎窝淘](https://tao.hooos.com/goods_XBJZyKXUGtX2pmj5z5FVYrtBtg-d8ZBBDFnBv4g7K9cd.html)

#### remote-control-cn-eval-004

- Query image: `fixtures/vision-household/cn/remote-control/remote-control-cn-eval-004-optoma-h115-tw342-hb3201-hdf321b.jpg`
- Source: [原装全新奥图码Optoma投影仪H115 TW342 HB3201 HDF321B 遥控器_虎窝淘](https://tao.hooos.com/goods_N7wR0gkC5tGBGZXqbmCxx9HRtB-wzQnnOsQa2gJARpIN.html)
- GT: 遥控器 / `remote-control` / box `{'x': 62.9167, 'y': 19.8333, 'w': 22.4167, 'h': 60.5833}`
- Prediction: 遥控器 / `remote-control` / box `{'x': 62.9167, 'y': 19.8333, 'w': 22.4167, 'h': 60.5833}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 遥控器 / `remote-control` score `0.901833` image `fixtures/vision-household/cn/remote-control/remote-control-cn-gallery-003-le43e7900-le32e7900.jpg` [包邮灏玺王牌网络液晶电视遥控器LE43E7900 LE32E7900主页键_虎窝淘](https://tao.hooos.com/goods_586782184897.html)
  - #2 遥控器 / `remote-control` score `0.846391` image `fixtures/vision-household/cn/remote-control/remote-control-cn-gallery-002-arc480a4-2-3-5.jpg` [大金空调遥控器通用款!ARC480A4/2/3/5全适配!懒人必备神器!-遥控器-淘宝好物网](https://goods.taobao.com/t/yaokongqi_13041/616f289138d88e40552e0bba4d2f735d.html)
  - #3 燃气报警器 / `gas-alarm` score `0.835531` image `fixtures/vision-household/cn/gas-alarm/gas-alarm-cn-gallery-001-image.jpg` [🔥科力强燃气报警器：守护家庭安全的智能卫士!🏠-家用气体检测报警器-淘宝百科网](https://bk.taobao.com/k/jiayongqitijiancebaojingqi_15965/d47892814b3878e0e62895aef2717842.html)

#### electric-kettle-cn-eval-004

- Query image: `fixtures/vision-household/cn/electric-kettle/electric-kettle-cn-eval-004-2l3l.jpg`
- Source: [万利达电热水壶电水壶2L3L不锈钢一体保温自动断电开水壶家用学生_虎窝淘](https://tao.hooos.com/goods_W7Jg6pdfotGXpQMcaresQta-XNReeAC0d5ZyQOes3.html)
- GT: 电水壶 / `electric-kettle` / box `{'x': 6, 'y': 5.625, 'w': 91.125, 'h': 89}`
- Prediction: 电水壶 / `electric-kettle` / box `{'x': 6, 'y': 5.625, 'w': 91.125, 'h': 89}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 电水壶 / `electric-kettle` score `0.827867` image `fixtures/vision-household/cn/electric-kettle/electric-kettle-cn-gallery-001-304.jpg` [半球电水水壶家用自动断电热烧水壶烧水保温一体壶304不锈钢快速_虎窝淘](https://tao.hooos.com/goods_580170829947.html)
  - #2 咖啡机 / `coffee-machine` score `0.788865` image `fixtures/vision-household/cn/coffee-machine/coffee-machine-cn-gallery-002-derlla.jpg` [☕️德国Derlla全自动咖啡机，让你在家也能享受现磨咖啡的香浓滋味!-咖啡机-淘宝好物网](https://goods.taobao.com/t/kafeiji_149/7e3718be46c875acd1c28840c08cb296.html)
  - #3 破壁机 / `food-processor` score `0.786016` image `fixtures/vision-household/cn/food-processor/food-processor-cn-gallery-003-frunuts.jpg` [frunuts破壁机豆浆机：家用迷你神器，懒人厨房的救星!-商用破壁机-淘宝百科网](https://bk.taobao.com/k/shangyongpobiji_8323/30988929432906fec1ff0d0e44d6141c.html)

#### rice-cooker-cn-eval-004

- Query image: `fixtures/vision-household/cn/rice-cooker/rice-cooker-cn-eval-004-20-30.jpg`
- Source: [苏电饭煲旗舰款，20-30人食堂必备神器？🔥-商用电饭煲-淘宝好物网](https://goods.taobao.com/t/shangyongdianfanbao_3790/22cceecc30bba51ad654e8307665260d.html)
- GT: 电饭煲 / `rice-cooker` / box `{'x': 17.5, 'y': 85.75, 'w': 24, 'h': 14.125}`
- Prediction: 面粉袋 / `flour-bag` / box `{'x': 17.5, 'y': 85.75, 'w': 24, 'h': 14.125}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 面粉袋 / `flour-bag` score `0.832482` image `fixtures/vision-household/cn/flour-bag/flour-bag-cn-gallery-002-image.jpg` [面粉（小麦磨成的粉状物）_百度百科](https://baike.baidu.com/item/面粉/1215215)
  - #2 食盐罐 / `salt-container` score `0.815077` image `fixtures/vision-household/cn/salt-container/salt-container-cn-gallery-002-image.jpg` [厨房按压式定量盐罐控盐瓶罐子撒盐神器计量出盐调料盒厨房调味瓶-阿里巴巴](https://detail.1688.com/offer/730000268444.html)
  - #3 猫砂袋 / `cat-litter-bag` score `0.810944` image `fixtures/vision-household/cn/cat-litter-bag/cat-litter-bag-cn-gallery-002-image.jpg` [现货专用智能猫砂盆猫砂袋抽绳猫厕所垃圾袋免铲加厚清洁袋批发-阿里巴巴](https://detail.1688.com/offer/861611627328.html)

#### air-purifier-filter-cn-eval-004

- Query image: `fixtures/vision-household/cn/air-purifier-filter/air-purifier-filter-cn-eval-004-352-x80-x83-x83c.jpg`
- Source: [352标准滤芯套装：空气净化器滤芯X80/X83/X83C，拯救呼吸的"隐形铠甲"!-净化-淘宝好物网](https://goods.taobao.com/t/jinghua_11148/61ceb4c80f43f7af6447a283ee60d63f.html)
- GT: 空气净化器滤芯 / `air-purifier-filter` / box `{'x': 0, 'y': 48.125, 'w': 36.625, 'h': 50.75}`
- Prediction: 电子体温计 / `thermometer-digital` / box `{'x': 0, 'y': 48.125, 'w': 36.625, 'h': 50.75}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 电子体温计 / `thermometer-digital` score `0.763529` image `fixtures/vision-household/cn/thermometer-digital/thermometer-digital-cn-gallery-003-k10.png` [欧姆龙电子体温计K10家用医用儿童成人婴儿腋下测量准确快速测温_虎窝淘](https://tao.hooos.com/goods_mnjDm7DhktJKpXKgXBfzzwFot3-63XvvVcymxZnM28TY.html)
  - #2 身份证 / `id-card` score `0.759444` image `fixtures/vision-household/cn/id-card/id-card-cn-gallery-001-image.png` [商家福利：一个身份证可以开三个淘宝个人店铺](https://qn.taobao.com/headline/news/10674735/)
  - #3 红包 / `red-envelope-pack` score `0.752329` image `fixtures/vision-household/cn/red-envelope-pack/red-envelope-pack-cn-gallery-003-image.jpg` [淘宝惊喜红包，正确使用姿势 - 知乎](https://zhuanlan.zhihu.com/p/270013247)

#### hair-dryer-cn-eval-004

- Query image: `fixtures/vision-household/cn/hair-dryer/hair-dryer-cn-eval-004-h101.jpg`
- Source: [米家吹风机H101：智能科技与高效造型的完美结合-商品-淘宝百科网](https://bk.taobao.com/k/shangpin_1930/52e3a06f14f422d4d010bd92a12dba8a.html)
- GT: 吹风机 / `hair-dryer` / box `{'x': 14.25, 'y': 1, 'w': 75.625, 'h': 34.25}`
- Prediction: 鞋拔 / `shoehorn` / box `{'x': 14.25, 'y': 1, 'w': 75.625, 'h': 34.25}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 鞋拔 / `shoehorn` score `0.781606` image `fixtures/vision-household/cn/shoehorn/shoehorn-cn-gallery-002-image.jpg` [塑料鞋拔超长鞋拔子：穿鞋神器，轻松搞定高跟鞋难题!👠 -鞋拔-淘宝百科网](https://bk.taobao.com/k/xieba_9405/6075fa442ba701cc964140d3ad5493bb.html)
  - #2 哑铃 / `dumbbell` score `0.775885` image `fixtures/vision-household/cn/dumbbell/dumbbell-cn-gallery-003-image.jpg` [纯钢哑铃男士健身器材家用钢制电镀哑铃，轻松增肌，告别健身房!-哑铃-淘宝好物网](https://goods.taobao.com/t/yaling_2509/d14b5649c307c759cf6ea6e6b7330572.html)
  - #3 头灯 / `flashlight-headlamp` score `0.764527` image `fixtures/vision-household/cn/flashlight-headlamp/flashlight-headlamp-cn-gallery-002-image.jpg` [头灯强光充电超亮头戴式照明户外超长续航超轻钓鱼小手电筒_虎窝淘](https://tao.hooos.com/goods_QgvyQ2sQtnzXRqiXyDSatQ-YA3ppxSB6eNVobncR.html)

#### vacuum-cleaner-cn-eval-004

- Query image: `fixtures/vision-household/cn/vacuum-cleaner/vacuum-cleaner-cn-eval-004-image.jpg`
- Source: [德国无线吸尘器家用小型大吸力功率强力静低音手持拖地一体洗地机_虎窝淘](https://tao.hooos.com/goods_58moVQTxtYvA7jF77GUMtV-nMYPPWFxV7XjRKqSzb.html)
- GT: 吸尘器 / `vacuum-cleaner` / box `{'x': 26, 'y': 10.625, 'w': 53.875, 'h': 88.875}`
- Prediction: 吸尘器 / `vacuum-cleaner` / box `{'x': 26, 'y': 10.625, 'w': 53.875, 'h': 88.875}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 吸尘器 / `vacuum-cleaner` score `0.83952` image `fixtures/vision-household/cn/vacuum-cleaner/vacuum-cleaner-cn-gallery-002-2025-usb.jpg` [2025新款无线吸尘器：大吸力+吸拖一体!家庭清洁新革命，你还在等什么？-USB吸尘器-淘宝好物网](https://goods.taobao.com/t/USBxichenqi_9851/9db2a12e7e736dd2c65dfb0f7068b1c9.html)
  - #2 拖把头 / `mop-head` score `0.829493` image `fixtures/vision-household/cn/mop-head/mop-head-cn-gallery-002-image.jpg` [对折式海绵头拖把头：家居清洁新神器，轻松搞定地面污渍!-胶棉拖把头-淘宝百科网](https://bk.taobao.com/k/jiaomiantuobatou_7070/b453033183e15d215be24481ba12f3de.html)
  - #3 吸尘器 / `vacuum-cleaner` score `0.801652` image `fixtures/vision-household/cn/vacuum-cleaner/vacuum-cleaner-cn-gallery-001-fc9735.jpg` [飞利浦FC9735吸尘器：家居清洁新革命，强力除螨，给你洁净生活!💪-吸尘器-淘宝百科网](https://bk.taobao.com/k/xichenqi_1913/f44ca0eafe65c32db5e9dcb7fb3f50cb.html)

#### router-cn-eval-004

- Query image: `fixtures/vision-household/cn/router/router-cn-eval-004-e2627-e2628-ax3000m-wifi6.jpg`
- Source: [中兴E2627/E2628，AX3000M WIFI6路由器，联通版如何选？-普通路由器-淘宝好物网](https://goods.taobao.com/t/putongluyouqi_1489/09d7941c7e9cbfda57cba94190713466.html)
- GT: 路由器 / `router` / box `{'x': 48.8889, 'y': 33.7963, 'w': 38.7037, 'h': 40.9259}`
- Prediction: 路由器 / `router` / box `{'x': 48.8889, 'y': 33.7963, 'w': 38.7037, 'h': 40.9259}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 路由器 / `router` score `0.843933` image `fixtures/vision-household/cn/router/router-cn-gallery-002-fast-1200m-11ac.jpg` [FAST 1200M 11ac双频无线路由器，家庭网络升级新选择？🚀-商品-淘宝百科网](https://bk.taobao.com/k/shangpin_1930/601de37dca5ef23d59725de5de99b9fa.html)
  - #2 路由器 / `router` score `0.814008` image `fixtures/vision-household/cn/router/router-cn-gallery-001-ax3000.jpg` [🔥中兴AX3000巡天版路由器，小白必看的安装指南!都给我冲!-路由器-淘宝百科网](https://bk.taobao.com/k/luyouqi_309/2eab65a675904659b407e671b0c7ce9e.html)
  - #3 投影仪 / `projector` score `0.773665` image `fixtures/vision-household/cn/projector/projector-cn-gallery-002-25-4k.png` [25新款投影仪：白天强光直投，4K超清，打造私人家庭影院!-投影仪-淘宝好物网](https://goods.taobao.com/t/touyingyi_2027/b66a32ca64c476a3376efb1207cbc6cc.html)

#### screwdriver-cn-eval-004

- Query image: `fixtures/vision-household/cn/screwdriver/screwdriver-cn-eval-004-202-30cm.jpg`
- Source: [202冲磁铬钒钢螺丝刀：解锁30CM长度的高效神器，工具控必备!-螺丝刀-淘宝百科网](https://bk.taobao.com/k/luosidao_6772/9b6f82e46fd8cb6c446ea334c3a5a461.html)
- GT: 螺丝刀 / `screwdriver` / box `{'x': 25.2, 'y': 29.8667, 'w': 69.2, 'h': 67.8667}`
- Prediction: 扳手 / `wrench` / box `{'x': 25.2, 'y': 29.8667, 'w': 69.2, 'h': 67.8667}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `False`; nameMatch: `False`; combined: `False`
- Top3 index matches:
  - #1 扳手 / `wrench` score `0.792847` image `fixtures/vision-household/cn/wrench/wrench-cn-gallery-002-image.jpg` [活动扳手工具卫浴活口扳手多功能大开口板子短柄扳手活络板子扳手_虎窝淘](https://tao.hooos.com/goods_q3byR0AU2t0XYeJig3afWt0-Mw0WW4F4Z0WM2MyHZ.html)
  - #2 螺丝刀 / `screwdriver` score `0.789458` image `fixtures/vision-household/cn/screwdriver/screwdriver-cn-gallery-001-8.jpg` [8件套内六花型螺丝刀中孔梅花套装十字一字米字带磁六角星型改锥_虎窝淘](https://tao.hooos.com/goods_632655433066.html)
  - #3 热熔胶棒 / `hot-melt-glue-stick` score `0.779205` image `fixtures/vision-household/cn/hot-melt-glue-stick/hot-melt-glue-stick-cn-gallery-001-image.jpg` [环保透明热熔胶棒：手工艺人的必备神器，让创意无界限!🎨 -热熔胶棒-淘宝百科网](https://bk.taobao.com/k/rerongjiaobang_13443/1edc7d7cab3a9e6b9e9ca9f619e48d1d.html)

#### scissors-cn-eval-004

- Query image: `fixtures/vision-household/cn/scissors/scissors-cn-eval-004-0603-2.jpg`
- Source: [得力剪刀学生办公手工0603厨房铁皮家用园艺大美工文具剪刀2把装_虎窝淘](https://tao.hooos.com/goods_536393260433.html)
- GT: 剪刀 / `scissors` / box `{'x': 3.875, 'y': 10, 'w': 40.25, 'h': 83.375}`
- Prediction: 剪刀 / `scissors` / box `{'x': 3.875, 'y': 10, 'w': 40.25, 'h': 83.375}`
- IoU: `1.0`; boxMatch: `True`; categoryMatch: `True`; nameMatch: `True`; combined: `True`
- Top3 index matches:
  - #1 剪刀 / `scissors` score `0.891624` image `fixtures/vision-household/cn/scissors/scissors-cn-gallery-002-image.jpg` [王麻子剪刀：传统手工艺与现代生活的完美融合-商品-淘宝百科网](https://bk.taobao.com/k/shangpin_1930/1ac9108d448f976cfb2e44713ff1f3d0.html)
  - #2 剪刀 / `scissors` score `0.865392` image `fixtures/vision-household/cn/scissors/scissors-cn-gallery-003-hewer-hs-3108.jpg` [德国熙骅HEWER HS-3108安全剪刀：工业级防护，手艺人必备神器!-剪刀-淘宝好物网](https://goods.taobao.com/t/jiandao_2080/e1031c66001067c5f806204a7a5e2295.html)
  - #3 园艺剪 / `garden-shears` score `0.864526` image `fixtures/vision-household/cn/garden-shears/garden-shears-cn-gallery-002-image.jpg` [多功能修枝剪园林剪刀 防滑园艺剪花艺插花剪 植物剪刀-阿里巴巴](https://detail.1688.com/offer/555622488840.html)
