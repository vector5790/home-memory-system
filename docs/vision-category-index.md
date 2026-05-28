# 视觉类目索引

这条链路把最小 seed 物品目录扩展为可评测、可追踪、可逐步扩容的本地视觉命名索引。默认命令仍然使用 seed fixture；扩展家庭类目需要显式传入 household source/category 文件。

## 类目来源策略

主类目骨架使用 GS1 GPC 形态的四级结构：

- `lineage.level1`：Segment。
- `lineage.level2`：Family。
- `lineage.level3`：Class，用于父级准确率和 sibling hard negatives。
- `lineage.level4`：Brick，也就是最终候选物品名的叶子类目。

Google Product Taxonomy 只作为开放补充，用于 aliases、search queries、detector labels 和辅助 source mapping。它不能覆盖 GS1 GPC canonical lineage。

UNSPSC 也有四级结构，但更偏采购、服务和企业供应链语义；第一版家庭视觉物品体系不把它作为 canonical 来源，只预留 optional auxiliary mapping。

## Category Record

标准化后的 category record 包含：

- `id`：稳定的项目 leaf id，使用 kebab-case。
- `source`、`sourceVersion`、`sourceId`：canonical 来源、版本和来源 ID。
- `lineage`：四级英文 lineage。
- `displayPath`、`displayName`：四段中文展示路径和中文叶子名。
- `aliases`：中文或英文别名。
- `detectorLabels`：英文开放词表检测 prompt，active leaf 至少两个。
- `searchQueries`：后续收集代表图片时使用的查询词。
- `googleProductTaxonomy`：可选 GPT 辅助映射。
- `coverageTier`：`seed`、`mvp`、`common` 或 `long-tail`。
- `indexReadiness`：代表图是否足够支撑 embedding index。
- `appCategory`：映射到应用内物品类别。
- `active`：是否进入当前家庭类目 subset。
- `exclusionReason`：inactive category 必填。

## 扩展家庭类目

扩展 source 文件是 [data/vision-taxonomy-source.household.json](/Users/guzeyu/.codex/worktrees/85a4/home-memory-system/data/vision-taxonomy-source.household.json)，它用 domain/group/leaf 的 authoring 结构维护类目，生成时展开成标准 category artifact。

生成完整 household artifact：

```bash
python3 scripts/vision-category-index.py import-taxonomy \
  --input data/vision-taxonomy-source.household.json \
  --output data/vision-categories.household.json \
  --version 20260524-household-expanded
```

当前 expanded artifact 输出：

- `data/vision-categories.household.json`
- 1013 个 leaf categories，其中 1012 个 active
- 22 个家庭 display domains
- 6 个 seed leaf categories 继续保留
- coverage tier 分布：6 个 seed、1003 个 mvp、3 个 common、1 个 long-tail
- 本轮扩充遵循 GS1 GPC-style 四级骨架：新增项都是 Brick 级视觉叶子类目，不按平台 SPU、品牌或规格拆分。

如果只想生成第一阶段 MVP 子集，可以额外传 `--max-coverage-tier mvp`。

## Coverage 与 Readiness

coverage report 在收集图片和跑大规模 embedding 前先检查类目结构：

```bash
python3 scripts/vision-category-index.py coverage-report \
  --taxonomy data/vision-categories.household.json \
  --output data/generated/vision-taxonomy-coverage.household.json
```

报告会输出：

- 按 coverage tier、level-1、level-2、level-3、app category、active status 和 index readiness 的数量。
- MVP 最小 leaf 数和最小 domain 数是否满足目标。
- 每个家庭 domain 是否达到最小 leaf 数。
- detector prompt 质量问题，例如泛化标签、重复 prompt、缺 search query 和 singleton sibling group。
- 哪些 active leaves 还没有足够 reviewed gallery/eval samples，因此不能用于 production index。

一个 taxonomy leaf 可以是有效类目，但不一定 index-ready。默认 production index builder 应只使用 index-ready leaves；缺图片的扩展 leaf 只能进入 taxonomy/report，不能假装已有可靠 embedding 索引。扩充到约 1000 个 active leaves 后，新增类目的 `includeForEmbedding` 默认仍是 `pending`，需要人工标注后再采图和建索引。

## Embedding 类目标注

完整 taxonomy 不等于每个 leaf 都要立刻采图和算 embedding。先导出可编辑 TSV：

```bash
python3 scripts/vision-category-index.py export-embedding-selection \
  --taxonomy data/vision-categories.household.json \
  --output data/vision-embedding-category-selection.household.tsv
```

标注文件列含义：

- `categoryId`、`displayName`、`displayPath`：类目定位信息，不建议手改。
- `includeForEmbedding`：人工决策列；填 `yes`/`include` 才会进入带 selection 的采图和建索引命令，填 `no` 或保留 `pending` 不进入。
- `embeddingPriority`：建议优先级，默认按 tier 给 `p0` 到 `p3`，可手动调整。
- `annotationStatus`、`notes`：审核状态和备注。

标注后，采图和建索引命令都可以传 selection 文件：

```bash
node scripts/vision-household-index.mjs create-cn-manifest \
  --categories data/vision-categories.household.json \
  --embedding-selection data/vision-embedding-category-selection.household.tsv \
  --gallery-per-category 3 \
  --eval-total 50 \
  --output data/vision-household-image-manifest.cn.json \
  --report data/generated/vision-household-cn-source-report.json \
  --image-dir fixtures/vision-household/cn

node scripts/vision-household-index.mjs build-index \
  --manifest data/vision-household-image-manifest.cn.json \
  --categories data/vision-categories.household.json \
  --embedding-selection data/vision-embedding-category-selection.household.tsv \
  --output data/vision-index.household-cn.owlvit-clip.json \
  --report data/generated/vision-household-cn-index-build-report.json
```

不传 `--embedding-selection` 时，脚本保持旧行为：处理 taxonomy 中所有 active 类目。

## Seed Smoke Test

seed 文件仍然是快速 smoke-test subset：

```bash
python3 scripts/vision-category-index.py import-taxonomy
python3 scripts/vision-category-index.py validate
python3 scripts/vision-category-index.py evaluate
python3 scripts/vision-category-index.py build-index
```

这会从 `data/vision-taxonomy-source.seed.json` 生成 `data/vision-categories.seed.json`，校验 `data/vision-samples.seed.json`，输出 `data/generated/vision-evaluation.seed.json`，并在评估通过后生成 `data/vision-index.generated.json`。

## 评测与 Runtime 选择

模型 benchmark 默认使用 seed categories，但可以显式传入扩展 taxonomy artifact：

```bash
python3 scripts/vision-model-eval.py benchmark \
  --categories data/vision-categories.household.json \
  --index data/vision-index.real.json \
  --dataset data/vision-model-eval.real.json \
  --run-local-models \
  --evaluate
```

本地 Node provider 同样支持显式传 `--categories`：

```bash
node scripts/vision-local-model-runner.mjs \
  --provider owlvit \
  --dataset data/vision-model-eval.real.json \
  --index data/vision-index.real.json \
  --categories data/vision-categories.household.json \
  --output data/generated/provider-output.json
```

浏览器 runtime 仍优先加载 generated index，并在失败时回退到 seed index 或中性占位名。扩展 household taxonomy 进入线上命名前，需要先为目标 leaves 准备代表图片、跑本地模型评测、生成通过 gate 的 embedding index。

## 真实 Household Index Smoke Batch

真实 index smoke batch 使用已有 Wikimedia household 实图，生成 manifest、OWL-ViT 主体框、CLIP crop embedding 和评测报告：

```bash
node scripts/vision-household-index.mjs create-smoke-manifest \
  --output data/vision-household-image-manifest.smoke.json

node scripts/vision-household-index.mjs expand-eval-manifest \
  --input data/vision-household-image-manifest.smoke.json \
  --output data/vision-household-image-manifest.smoke-50.json \
  --report data/generated/vision-household-query-expansion-report.json \
  --target-eval 50

node scripts/vision-household-index.mjs create-eval-dataset \
  --manifest data/vision-household-image-manifest.smoke-50.json \
  --output data/vision-model-eval.household-index.json

node scripts/vision-household-index.mjs build-index \
  --manifest data/vision-household-image-manifest.smoke-50.json \
  --categories data/vision-categories.household.json \
  --output data/vision-index.household.owlvit-clip.json \
  --report data/generated/vision-household-index-build-report.json \
  --build-version 20260523-household-owlvit-clip-smoke-50

node scripts/vision-household-index.mjs readiness \
  --manifest data/vision-household-image-manifest.smoke-50.json \
  --index data/vision-index.household.owlvit-clip.json \
  --categories data/vision-categories.household.json \
  --output data/generated/vision-household-index-readiness.json
```

实际 index entry 包含：

- `id`：稳定主键，例如 `storage-box:storage-box-real-gallery-1:r0`。
- `categoryId`、`displayName`、`categoryPath`、`lineage`。
- `sourceImagePath` 和 `image`，其中包含图片路径、source URL、title 和 sha256。
- `region` / `box`：OWL-ViT 输出的主体框，使用图片相对百分比坐标。
- `crop`：crop 类型、padding 和 box。
- `detector`：OWL-ViT model id、命中的 label、score 和 prompt labels。
- `embedding`：本地 CLIP crop embedding，归一化后用于最大 inner product 检索。

重新评测：

```bash
python3 scripts/vision-model-eval.py benchmark \
  --dataset data/vision-model-eval.household-index.json \
  --index data/vision-index.household.owlvit-clip.json \
  --categories data/vision-categories.household.json \
  --providers owlvit \
  --run-local-models \
  --evaluate \
  --output data/generated/vision-model-predictions.household-index.json \
  --raw-output data/generated/vision-model-benchmark-raw.household-index.json \
  --raw-dir data/generated/vision-model-benchmark-raw-household-index \
  --output-json data/generated/vision-model-eval-report.household-index.json \
  --output-html data/generated/vision-model-eval-report.household-index.html \
  --output-md data/generated/vision-model-eval-report.household-index.md
```

当前 smoke report 覆盖 6 个 leaves、18 张 gallery 图和 50 张 eval/query 图。结果为 go：box recall 70%，category/name accuracy 50%，Top3 retrieval 70%，combined accuracy 42%。新增 query 图来自 Wikimedia Commons，并使用 OWL-ViT-assisted 自动 GT 框标注来快速扩大评测规模；这适合 smoke 测试，进入生产门槛前仍需要人工复核 GT 框和图片类别。

## 中国大陆来源 Household Index

大陆来源批量索引使用 `scripts/vision-household-index.mjs create-cn-manifest`。采集器会先尝试直连 `https://s.taobao.com/search?q=<类目名>`；当前命令行环境下淘宝搜索页主要返回前端壳和安全脚本，不稳定暴露商品卡片，因此实际可用样本主要来自 DuckDuckGo Images 的中文查询结果，并通过 `tao.hooos.com`、`bk.taobao.com`、`goods.taobao.com`、`detail.1688.com`、`img.alicdn.com` 等淘宝/1688 生态或中国大陆候选来源过滤。昵图网、摄图网、花瓣等设计素材站点和 `设计图`、`广告设计`、`banner`、`psd` 等标题被过滤掉。

生成大陆来源 manifest、eval dataset、索引和 readiness：

```bash
node scripts/vision-household-index.mjs create-cn-manifest \
  --categories data/vision-categories.household.json \
  --embedding-selection data/vision-embedding-category-selection.household.tsv \
  --gallery-per-category 3 \
  --eval-total 50 \
  --search-limit 30 \
  --output data/vision-household-image-manifest.cn.json \
  --report data/generated/vision-household-cn-source-report.json \
  --image-dir fixtures/vision-household/cn

node scripts/vision-household-index.mjs create-eval-dataset \
  --manifest data/vision-household-image-manifest.cn.json \
  --categories data/vision-categories.household.json \
  --output data/vision-model-eval.household-index.cn.json \
  --version 20260523-household-cn-index-eval

node scripts/vision-household-index.mjs build-index \
  --manifest data/vision-household-image-manifest.cn.json \
  --categories data/vision-categories.household.json \
  --embedding-selection data/vision-embedding-category-selection.household.tsv \
  --output data/vision-index.household-cn.owlvit-clip.json \
  --report data/generated/vision-household-cn-index-build-report.json \
  --threshold 0.005 \
  --build-version 20260523-household-cn-owlvit-clip

node scripts/vision-household-index.mjs readiness \
  --manifest data/vision-household-image-manifest.cn.json \
  --index data/vision-index.household-cn.owlvit-clip.json \
  --categories data/vision-categories.household.json \
  --embedding-selection data/vision-embedding-category-selection.household.tsv \
  --output data/generated/vision-household-cn-index-readiness.json
```

现有大陆来源 manifest/index 是上一批 133 个 active MVP leaf categories 的结果，共 448 张图片：398 张 gallery、50 张 eval/query。构建出的 `data/vision-index.household-cn.owlvit-clip.json` 有 398 个 index entries，覆盖 133 个类目，全部带 512 维本地 CLIP embedding。扩充到 344 个 active leaf 后，应先在 `data/vision-embedding-category-selection.household.tsv` 标注本轮要建索引的类目，再按上面的 selection 命令增量采图和重建索引。

## 主体检测专项评估

主体检测专项评估用于在大规模 embedding 前先判断本地检测模型是否能稳定给出可用主体框。本流程只运行主体检测，不做 CLIP embedding，也不把采集图片标记为生产可用。

### 采集范围

默认可以直接按 household taxonomy 的 active leaf 采集。若只想采集新增类目，可传 `--only-without-existing-samples`，脚本会用已有 `data/vision-household-image-manifest.cn.json` 排除已经有样本的类目。也可以传 `--category-ids` 或 `--category-selection` 精确控制范围；selection 文件支持 `includeForSubjectDetection`、`includeForDetection`、`subjectDetectionPriority`，也兼容 `includeForEmbedding=yes/include`。

```bash
node scripts/vision-subject-detection-eval.mjs create-manifest \
  --categories data/vision-categories.household.json \
  --only-without-existing-samples \
  --samples-per-category 3 \
  --search-limit 30 \
  --output data/vision-subject-detection-manifest.cn.json \
  --report data/generated/vision-subject-detection-source-report.cn.json \
  --image-dir fixtures/vision-subject-detection/cn
```

manifest 会记录 taxonomy version、category id、source URL/title/host、image URL/host、search query、本地图片路径、sha256、review status 和 `nonProductionReady: true`。source report 会按 category 汇总采集数量、失败 provider、下载/解码失败原因和不足样本。

### 图片变体

```bash
node scripts/vision-subject-detection-eval.mjs create-variants \
  --manifest data/vision-subject-detection-manifest.cn.json \
  --output data/vision-subject-detection-manifest.variants.json \
  --target-long-side 1024
```

每张图至少有两个 variant：`original` 和 `normalized-1024`。如果原图长边小于 1024px，normalized variant 会直接复用原图并记录 `reuse-original-no-upscale`；脚本保持宽高比，不放大小图，并记录每个 variant 的生成耗时。

### 本地模型检测

```bash
node scripts/vision-subject-detection-eval.mjs run-detection \
  --manifest data/vision-subject-detection-manifest.variants.json \
  --categories data/vision-categories.household.json \
  --models grounding-dino,owlvit \
  --variants original,normalized-1024 \
  --output data/generated/vision-subject-detection-run.json \
  --raw-dir data/generated/vision-subject-detection-raw
```

模型只从本地 `vendor/models/` 加载：Grounding DINO 使用 `onnx-community/grounding-dino-tiny-ONNX`，OWL-ViT 使用 `Xenova/owlvit-base-patch32`。默认阈值为 Grounding DINO `0.2`、OWL-ViT `0.01`；OWL-ViT 的开放词表分数通常偏低，过高阈值会把合理候选框过滤掉。OWL-ViT 结果会先按 category-level label group 做去重/NMS，再按 score 最多保留 10 个候选主体，避免同义 prompt 产生大量重复框。每个模型结果都会记录 detection id、label、score、百分比 box、areaPct、rankByScore、rankByArea、prompted labels、阈值、失败原因、raw output path、检测耗时和 NMS 参数。

主框 A 是面积最大的检测框，主框 B 是置信度最高的检测框。如果 A/B 是同一个框，结果中记录 `primaryBoxesSame: true`，审核页面会用合并样式展示。

### 审核页面

```bash
node scripts/vision-subject-detection-eval.mjs serve-review \
  --manifest data/vision-subject-detection-manifest.variants.json \
  --detection data/generated/vision-subject-detection-run.json \
  --review data/generated/vision-subject-detection-review.json \
  --port 4188
```

本地页面会按同一张图对比 Grounding DINO 与 OWL-ViT，并显示模型、variant、耗时、框数量和失败状态。主框 A、主框 B、A+B 和普通框使用不同视觉样式。审核时每个候选框一行，包含框编号/角色/名字、score、准确性选择项、是否选为图片主框，以及只显示当前框的聚焦按钮；标注结果记录哪个模型效果更好、最终采用哪个主体框或无可用主体框，以及 reviewer、timestamp、box verdicts、model verdicts 和 notes。

### 报告与主框导出

```bash
node scripts/vision-subject-detection-eval.mjs report \
  --manifest data/vision-subject-detection-manifest.variants.json \
  --detection data/generated/vision-subject-detection-run.json \
  --review data/generated/vision-subject-detection-review.json \
  --output-base data/generated/vision-subject-detection-eval

node scripts/vision-subject-detection-eval.mjs export-boxes \
  --manifest data/vision-subject-detection-manifest.variants.json \
  --detection data/generated/vision-subject-detection-run.json \
  --review data/generated/vision-subject-detection-review.json \
  --output data/generated/vision-subject-primary-boxes.reviewed.json
```

报告会生成 JSON、Markdown 和 HTML，包含 query 图、普通框、主框 A、主框 B、人工标注、模型对比、压缩策略建议、模型推荐结论，以及 Grounding DINO/OWL-ViT 的平均识别耗时和 p50/p95。指标会按模型、image variant、category 和 source provider 分组，并输出人工标注准确框的最低 score 和不准确框的最高 score。

导出的 `vision-subject-primary-boxes.reviewed.json` 只包含已审核且有可用主体框的图片。每条记录包含 image id、category id、source image path、model id、image variant、detection id、box、label、score、review status、reviewer 和 timestamp，后续可以作为 CLIP crop embedding 的输入。

### 验证

脚本级 simulator 不加载模型，也不需要浏览器：

```bash
node scripts/vision-subject-detection-eval.mjs simulator-checks
```

它覆盖 manifest 生成、variant 生成、detection schema、A/B 主框派生、review 写入、指标计算和 approved primary boxes 导出。

大陆来源评测命令：

```bash
python3 scripts/vision-model-eval.py benchmark \
  --dataset data/vision-model-eval.household-index.cn.json \
  --index data/vision-index.household-cn.owlvit-clip.json \
  --categories data/vision-categories.household.json \
  --providers owlvit \
  --run-local-models \
  --evaluate \
  --output data/generated/vision-model-predictions.household-index.cn.json \
  --raw-output data/generated/vision-model-benchmark-raw.household-index.cn.json \
  --raw-dir data/generated/vision-model-benchmark-raw-household-index-cn \
  --output-json data/generated/vision-model-eval-report.household-index.cn.json \
  --output-html data/generated/vision-model-eval-report.household-index.cn.html \
  --output-md data/generated/vision-model-eval-report.household-index.cn.md
```

当前大陆来源报告为 no-go：box recall 60%，category/name accuracy 44%，Top3 retrieval 50%，combined accuracy 34%，failure rate 0%。完整类目 prompt 分批后，OWL-ViT detection p50 约 2708ms，CLIP crop embedding p50 约 18ms，检索 p50 约 0.57ms。主要问题不是链路不可用，而是当前 CLIP crop embedding 在相似收纳、包装、容器和清洁用品之间区分度不足；后续应增加人工审核 gallery、按父类分 shard/重排，或评估更强的中文商品图 embedding 模型。

## 检索指标

runtime 和离线工具使用归一化向量。最近邻是最大 inner product，等价于最小化 `1 - innerProduct` 距离。不要最小化原始 inner product。
