## Why

扩展 household taxonomy 现在只是 taxonomy-ready，还没有真实代表图片、主体框和本地 CLIP embedding，因此不能证明线上“拍图 -> 主体识别 -> embedding 检索 -> 物品名”的真实效果。下一步需要产出一个可复现的真实 household vision index，并用现有评测系统重新验证 OWL-ViT 主体框和 CLIP 命名质量。

## What Changes

- 为 household MVP leaves 准备代表图片 manifest，每个 leaf 至少选择多张不同品牌、形态或包装类型的图片，并记录来源、许可证、split、review 状态和 hash。
- 新增或扩展索引构建命令，调用本地 OWL-ViT 对每张代表图做主体框识别，再对主体框 crop 调用本地 CLIP 计算 embedding。
- 生成实际 household index artifact，每条索引包含主键 id、category id、region/box、图片路径、crop 信息、embedding、模型信息和来源信息。
- 在 index 构建前后输出失败与 readiness 报告，明确哪些 leaf 缺图片、缺有效主体框或缺 embedding。
- 基于之前的 vision model eval 系统重新跑评测，报告主体框准确性、物品名准确性、Top3 相似索引图、耗时和 go/no-go 结论。
- 默认先按可控规模执行 MVP smoke subset，支持继续扩展到完整 133 个 active MVP leaves；不把无评测通过的 index 标记为 production-ready。

## Capabilities

### New Capabilities

- `household-vision-index`: 真实家庭类目图片采集、OWL-ViT 主体框检测、CLIP crop embedding 索引构建和评测报告。

### Modified Capabilities

- `household-category-taxonomy`: 类目 readiness 从 taxonomy-only 扩展到 image/index/eval readiness，并记录哪些 leaves 已拥有可用真实索引。

## Impact

- 数据：新增 household image manifest、下载/缓存图片目录、实际 household index、index build report 和评测报告。
- 脚本：扩展 `scripts/vision-category-index.py`、`scripts/vision-local-model-runner.mjs` 或新增专用 household index builder，真实调用本地 OWL-ViT 与 CLIP。
- 评测：复用并扩展 `scripts/vision-model-eval.py` 的 report 产物，展示 query 图、预测框、物品名和 Top3 本地索引图。
- 文档：更新 README 和 `docs/vision-category-index.md`，说明真实 index 构建、模型依赖、可控规模执行和继续扩容方式。
