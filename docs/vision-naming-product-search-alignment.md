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
- 主类目仍保持 GPC-style 四级 leaf，用户可见物品名来自 leaf；品牌、型号、SPU、形态词只作为索引 entry 的 entity metadata 和 rerank 特征。

### 第二阶段：提升离线索引质量

- 电子影音等混淆类目不应长期只保留 3 张图片；需要补充家庭场景图、正面/侧面/局部/摆放环境图。
- 每个叶子类目至少维护：商品白底图、真实场景图、局部细节图、常见品牌/形态变体。
- 对容易混淆的类目建立 hard-negative eval set，例如投影仪 vs 功放 vs 电视盒子 vs 蓝光播放器。
- 图片资产不进入 Git 仓库；manifest、source URL、sha256、embedding index 和生成脚本进入仓库，图片在本地缓存或对象存储中再现。

### 第三阶段：模型与重排升级

- 保留本地 CLIP 作为基础召回，但增加本地 reranker 或更适合商品检索的 embedding 模型。
- 引入图文联合信号：类目中文名、别名、淘宝常用词、品牌/形态词，与图片 embedding 一起参与重排。
- 对用户已确认的数据做轻量本地校准，例如每个类目的 prototype embedding、类目中心和 hard-negative margin。
- 运行时先用 embedding TopK 召回，再用本地 CLIP zero-shot image classification 对候选类目文本做二次排序；高混淆 cluster 使用更高 score/margin 阈值，并默认候选展示。

## 当前落地策略

- 四级 leaf 是唯一用户可见类目层级，不新增“第五级类目”给用户。
- 高混淆 cluster 包含家庭影音、收纳容器、线缆电源、药品包装、厨房小家电。
- 每个 cluster 有独立 `acceptScore`、`acceptMargin` 和 rerank text score 要求。
- 家庭影音 cluster 默认候选优先；只有 embedding 分数、margin 和图文 rerank 同时足够强时才自动命名。
- 每个候选保留 `embeddingScore`、`rerankTextScore`、`categoryCluster`、`entity`、代表样本和命中样本，方便 UI 展示与后续人工反馈。
- OCR 文本作为可选信号接入 rerank：浏览器支持 `TextDetector` 时使用 crop OCR；不支持时自动跳过，不影响本地离线链路。
- SigLIP 作为可选 A/B embedding 候选纳入资产配置，但不默认下载；需要时用 `VISION_OPTIONAL_MODELS=siglip python3 scripts/download-vision-assets.py` 拉取，再生成对应 embedding index 做评测。
- SigLIP2 也作为可选 A/B embedding 候选纳入资产配置；需要时用 `VISION_OPTIONAL_MODELS=siglip2 python3 scripts/download-vision-assets.py` 拉取。

## 当前策略评测快照

离线策略评测脚本为 `scripts/vision-naming-strategy-eval.mjs`，当前基于 66 个已有命名样本得到：

- 旧策略 `embedding-only`：覆盖率 100%，准确率 28.79%。
- `global-threshold`：覆盖率 13.64%，接受后准确率 77.78%。
- `cluster-threshold`：覆盖率 13.64%，接受后准确率 77.78%。
- `metadata-ocr-rerank`：覆盖率 43.94%，接受后准确率 75.86%。

这里的 `metadata-ocr-rerank` 使用已有 query 文本/标题词模拟文本信号，因此更接近“有 OCR/标题词时的上界”，不是当前所有设备上都能稳定达到的线上指标。

## Embedding 模型 A/B 快照

离线 A/B 脚本为 `scripts/vision-embedding-model-ab-eval.mjs`。当前使用 66 个 query 样本和 259 条相关/高混淆索引条目：

- `Xenova/clip-vit-base-patch32`：Top1 42.42%，Top3 59.09%，query embedding 均值 16.011ms，Top1 score 均值 0.8312，margin 均值 0.0471。
- `Xenova/siglip-base-patch16-224`：Top1 62.12%，Top3 74.24%，query embedding 均值 45.014ms，Top1 score 均值 0.8167，margin 均值 0.0873。
- `onnx-community/siglip2-base-patch16-224-ONNX`：Top1 51.52%，Top3 57.58%，query embedding 均值 44.904ms，Top1 score 均值 0.9292，margin 均值 0.0233。

初步结论：SigLIP 在这批家庭物品和高混淆类目上明显优于当前 CLIP；SigLIP2 的绝对分数更高，但 margin 更低，细粒度区分能力不如 SigLIP。当前先用 SigLIP 生成全量索引，并在模拟器/真机上测端到端耗时，再决定是否作为默认命名 embedding。

## SigLIP 全量索引

全量重嵌入脚本为 `scripts/vision-reembed-index.mjs`，输入为 `data/vision-index.household-cn.grounding-dino-clip.json`，输出为 `data/vision-index.household-cn.grounding-dino-siglip.json`。

当前生成结果：

- 输入条目 3075 条，成功写入 3075 条，失败 0 条。
- embedding 模型为 `Xenova/siglip-base-patch16-224`。
- embedding 维度为 768。
- 每个 crop embedding 平均耗时 45.082ms。
- 检索 metric 仍为 `max-inner-product`，embedding 已做 L2 normalize。

## 当前检索实现

当前线上命名检索位于 `src/vision/catalog-matcher.js` 的 `matchCatalogFromEmbeddingIndex()`：先筛掉不兼容条目，再对所有候选 entry 逐条计算 `vectorSimilarity()`，最后按 score 降序排序并截取 TopK。因此现在本质是 flat scan，也就是遍历所有兼容索引计算内积/余弦相似度，不是 HNSW、FAISS 或其他 ANN 索引。

在 3075 条、512/768 维的本地索引规模下，这种实现足够简单可控；当索引增长到 5 万或 10 万级时，需要升级为分层检索：先按房间/场景/cluster/category centroid 做粗召回，再用 typed-array 矩阵扫描或 HNSW/FAISS/WASM 向量索引做精排。

## OCR 能力探测

运行时能力检测页面由 `scripts/vision-runtime-capability-check.mjs` 生成，输出为 `data/generated/vision-runtime-capability-check.html`。重点检查：

- `TextDetector`：浏览器原生 OCR，若 iOS WebView 不支持，需要走 iOS Vision OCR bridge 或本地 OCR 模型。
- `BarcodeDetector`：包装条码可作为商品识别辅助。
- `SharedArrayBuffer` / `crossOriginIsolated`：决定 WASM 多线程能力。

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
