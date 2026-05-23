## Context

当前项目已经有三块基础能力：扩展 household taxonomy、真实本地视觉模型评测、以及浏览器端 OWL-ViT + CLIP 默认链路。缺口是 expanded taxonomy 仍然没有真实代表图片和真实本地 embedding index；`data/vision-categories.household.json` 里的 leaves 目前都是 taxonomy-ready，但不是 index-ready。

本变更要把一批 household leaves 变成真实可检索索引：为每个 leaf 选择多张不同品牌、包装或类型的图片，用本地 OWL-ViT 找主体框，再对主体框 crop 用本地 CLIP 生成 embedding。由于完整 133 个 MVP leaves 每个多张图会带来下载、版权、人工审核和模型耗时成本，执行上采用可续跑的批处理：先生成全量采集计划和 manifest schema，再默认跑一个可控 smoke batch，后续可以按 `--limit`、`--category` 或 `--coverage-tier` 扩容。

## Goals / Non-Goals

**Goals:**

- 为 household leaves 建立真实图片 manifest，记录每张图的 category、来源、许可证、品牌/类型提示、split、hash 和 review 状态。
- 使用本地 OWL-ViT 对代表图做主体框检测，保存 region/box、检测 label、score 和失败原因。
- 使用本地 CLIP 对主体框 crop 生成归一化 embedding，并写入可检索 index。
- 每条 index entry 包含稳定主键 id、category id、region、图片路径、crop metadata、embedding、模型 id、source 和 build version。
- 复用现有评测系统重新评估 box、物品名、Top3 检索、耗时和 go/no-go。
- 把实际拥有有效 gallery/eval/index 的 leaves 汇总为 readiness report，而不是把全量 taxonomy 直接视为可用。

**Non-Goals:**

- 本变更不承诺一次性下载并审核完整 133 个 leaves 的所有代表图。
- 本变更不把未经许可证记录或未经模型评测通过的 index 标记为 production-ready。
- 本变更不引入云端视觉模型作为默认推理路径。
- 本变更不要求浏览器 runtime 立即加载 expanded household index；runtime 切换应在评测通过后单独控制。

## Decisions

1. 真实 index 采用 manifest-first 流程。

   图片不会在 build 时隐式搜索并直接入库。先生成 `vision-household-image-manifest.*.json`，记录 source URL/path、license、brand/type variant、split 和 reviewStatus；builder 只处理 reviewed 或显式允许的 pending 样本。这样能复现，也能把版权和人工检查放到链路里。

2. 默认执行 smoke subset，支持逐步扩容到全量 leaves。

   完整 household MVP 是 133 个 active leaves，每 leaf 多图意味着几百张图片和大量本地模型调用。默认命令先对一批代表性 leaves 运行，例如 seed leaves 加厨房、食品、清洁、工具等高频域；`--limit-categories`、`--category-id`、`--max-coverage-tier` 用于扩大范围。评测报告必须注明覆盖范围。

3. OWL-ViT 负责主体框，CLIP 只吃 crop。

   对每个 image sample，builder 从 category 的 detectorLabels/aliases 中选 prompt，调用本地 OWL-ViT。选最高分且面积合理的主体框，按少量 padding crop，再调用本地 CLIP image embedding。失败时记录到 build report，不写误导性的 full-image index entry。

4. Index entry 使用稳定主键。

   主键格式使用 `categoryId:sampleId:regionIndex` 或等价稳定 id。entry 必须包含 `region`/`box`、`sourceImagePath`、`crop`、`embedding`、`categoryPath`、`displayName`、`modelIds`、`sourceUrl`、`license` 和 `buildVersion`。

5. 评测复用现有 vision-model-eval。

   新 builder 输出的 index 和 predictions 要适配 `scripts/vision-model-eval.py evaluate/benchmark`。报告继续展示 query 图、预测框、预测物品名和 Top3 相似索引图，并按 provider/model 分组显示准确率与耗时。

## Risks / Trade-offs

- 开放图片来源许可证复杂 -> manifest 记录 license/source，默认优先本地 fixture、开放许可证或明确可用的图片，未知许可证不得 production-ready。
- OWL-ViT 对某些小物品或包装图可能框不准 -> build report 记录 no-box/low-score/ambiguous-box，评测分离 box recall 和 naming accuracy。
- 每 leaf 多图的全量构建耗时大 -> 采用可续跑 cache、limit 参数、分批 manifest 和 smoke/full 两套报告。
- CLIP embedding 对细粒度品牌/包装可能混淆 -> Top3 和 sibling confusion 在报告中展示，低 margin 不进入 production-ready。
- 下载图片受网络波动影响 -> 支持 manifest 已有本地图片直接构建，下载失败只影响对应 sample。

## Migration Plan

1. 新增 household image manifest 与真实 index 输出路径，不替换 seed index。
2. 新增或扩展本地 index builder，优先处理 smoke subset。
3. 生成真实 household index 和 build/readiness report。
4. 运行评测并产出 `vision-model-eval-report.household-index.*`。
5. 如果 smoke batch 通过，再逐步扩大到更多 leaves；否则保留 seed/runtime 当前默认路径。
