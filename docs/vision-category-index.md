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

## 主体检测模型

主体检测模型的训练、固定评估集维护、数据集构建和人工审核流程已经迁移到独立的 `yolox-train` 仓库。本仓库只保留最终使用模型的运行时集成：Web/iOS 打包时从 `vendor/models/home-memory/yolox-household-subject/model.onnx` 加载 ONNX 模型，并在应用侧完成检测后处理、用户可编辑主体框和 embedding 命名链路。

## 检索指标

runtime 和离线工具使用归一化向量。最近邻是最大 inner product，等价于最小化 `1 - innerProduct` 距离。不要最小化原始 inner product。
