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

生成 MVP household artifact：

```bash
python3 scripts/vision-category-index.py import-taxonomy \
  --input data/vision-taxonomy-source.household.json \
  --output data/vision-categories.household.json \
  --version 20260523-household-expanded \
  --max-coverage-tier mvp
```

当前 MVP artifact 输出：

- `data/vision-categories.household.json`
- 133 个 active MVP leaf categories
- 19 个家庭 display domains
- 6 个 seed leaf categories 继续保留
- 4 个 common/long-tail candidate leaves 被排除在 MVP artifact 之外

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

一个 taxonomy leaf 可以是有效类目，但不一定 index-ready。默认 production index builder 应只使用 index-ready leaves；缺图片的扩展 leaf 只能进入 taxonomy/report，不能假装已有可靠 embedding 索引。

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
  --output data/vision-index.household-cn.owlvit-clip.json \
  --report data/generated/vision-household-cn-index-build-report.json \
  --threshold 0.005 \
  --build-version 20260523-household-cn-owlvit-clip

node scripts/vision-household-index.mjs readiness \
  --manifest data/vision-household-image-manifest.cn.json \
  --index data/vision-index.household-cn.owlvit-clip.json \
  --categories data/vision-categories.household.json \
  --output data/generated/vision-household-cn-index-readiness.json
```

当前大陆来源 manifest 覆盖 133 个 active MVP leaf categories，共 448 张图片：398 张 gallery、50 张 eval/query。除 `麦片盒` 只有 2 张 gallery 外，其余 leaf 都有 3 张 gallery。构建出的 `data/vision-index.household-cn.owlvit-clip.json` 有 398 个 index entries，覆盖 133 个类目，全部带 512 维本地 CLIP embedding。readiness report 中 `indexReadyLeafCount` 为 50，是因为当前规则要求 leaf 同时有 eval 图；索引覆盖本身是 133/133。

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
