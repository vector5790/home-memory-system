# 视觉命名与一线电商识图对齐调研

## 背景

当前家庭记忆系统的物品命名链路是：主体检测得到 region，再对 crop 计算本地 CLIP embedding，最后在离线类目索引中做相似检索并映射到叶子类目名。这个方案在常见食品、清洁用品等外观差异较大的物品上可以先跑通，但在电视机、投影仪、功放、AV 接收机、唱片机、机顶盒、播放器、音箱等电子影音类目上容易混淆。

本轮调研的目标不是照搬购物平台的商品详情页能力，而是拆出它们在“拍图找物/识图命名”上的产品与技术原则，指导当前本地模型方案的下一步演进。

## 公开产品形态观察

- Google Lens 的购物体验强调“拍图后找到相似商品、价格、评价和购买渠道”，背后依赖 Google Shopping Graph 的海量商品图谱，而不是只返回一个物品名。
- Amazon Lens / Lens Live 支持拍照、上传图片、扫码，并返回 exact matches 和 similar items。Lens Live 进一步把相机画面中的候选商品做实时扫描和结果卡片展示。
- Pinterest Lens / visual search 强调用户可以选择图片中的局部对象，并查找相似 Pins、商品或视觉风格，核心是交互式视觉发现。
- 阿里云图像搜索和商品理解公开能力也采用“在指定商品/图库中搜索相同或相似视觉信息”的表述，适用于以图搜商品、相似商品推荐和商品类目/标签/属性识别。

这些产品的共同点是：第一步通常是视觉召回，输出候选集合；随后结合商品库、标题、类目、价格、点击/购买反馈、用户选择区域等信息重排。它们不会把低置信图片强行命名成唯一答案。

## 对当前方案的判断

当前本地方案的优势是可离线、隐私友好、链路简单，适合做家庭物品导入的 MVP。但如果目标是和一线大厂识图命名体验对齐，需要承认两点：

1. 仅靠通用 CLIP crop embedding + 每叶子 3 张淘宝商品图，无法稳定区分细粒度电子影音类目。
2. 对于同一张客厅图，多主体、多尺度、遮挡、反光、黑色矩形设备堆叠，会让“主体框是否正确”和“命名是否正确”两个误差叠加。

所以命名策略应从“单答案”升级为“可接受时给主答案；不确定时给候选，并让用户选择”。用户选择结果还应进入后续的本地评测与微调/重排数据。

## 对齐原则

- 候选优先：低置信、低 margin 或 hard-negative 类目聚集时，不强制命名，展示 Top3/Top5 候选。
- 区域可控：允许用户确认或更换主体框，尤其是一个画面中有多个可导入物品时。
- 类目聚合：检索先按 entry TopK 召回，再聚合到 category-level，避免同一类的多张索引图把结果列表刷屏。
- 硬负样本：电子影音、厨房小家电、清洁用品、收纳盒等相似类目必须做 category cluster 级评测。
- 阈值分层：全局阈值只能兜底，关键类目应有 cluster-specific threshold/margin。
- 用户反馈闭环：用户选择候选名、改名、标记错误，应沉淀为本地正负样本，后续用于重排和评测。

## 推荐演进路径

### 第一阶段：当前版本落地

- 运行时命名保留主答案，但当 Top1 分数或 margin 不足时返回“未知/可能是这些物品”。
- 在候选面板展示 Top3 类目、相似分数、命中索引数量和代表索引图。
- 用户点击候选后写回物品名、类目 id、命中样本 id，并标记为人工确认。

### 第二阶段：提升离线索引质量

- 电子影音等混淆类目不应长期只保留 3 张图片；需要补充家庭场景图、正面/侧面/局部/摆放环境图。
- 每个叶子类目至少维护：商品白底图、真实场景图、局部细节图、常见品牌/形态变体。
- 对容易混淆的类目建立 hard-negative eval set，例如投影仪 vs 功放 vs 电视盒子 vs 蓝光播放器。

### 第三阶段：模型与重排升级

- 保留本地 CLIP 作为基础召回，但增加本地 reranker 或更适合商品检索的 embedding 模型。
- 引入图文联合信号：类目中文名、别名、淘宝常用词、品牌/形态词，与图片 embedding 一起参与重排。
- 对用户已确认的数据做轻量本地校准，例如每个类目的 prototype embedding、类目中心和 hard-negative margin。

## 对当前指标的解释

本轮电子影音 hard-negative 评测中，Top1 只有 25%，Top3 约 31.25%；当 margin 设置为 0.03 时全部拒识。这说明模型不是完全没有相似召回能力，而是相似类目之间分数差过小，不适合直接自动命名。候选展示比强行返回“投影仪”更符合真实产品体验。

## 参考资料

- Google Lens shopping product details: https://blog.google/products/shopping/visual-search-lens-shopping/
- Google Lens: https://lens.google/
- Amazon Lens: https://www.aboutamazon.com/news/retail/how-to-use-amazon-lens
- Amazon Lens Live: https://www.aboutamazon.com/news/retail/search-image-amazon-lens-live-shopping-rufus
- Pinterest visual search help: https://help.pinterest.com/en/article/use-visual-search-features
- Pinterest visual discovery paper: https://arxiv.org/abs/1702.04680
- 阿里云视觉搜索: https://vision.aliyun.com/imgsearch
- 阿里云商品理解: https://vision.aliyun.com/goodstech
