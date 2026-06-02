## Why

当前图片导入链路的耗时已经接近可接受区间，但同一主体仍会出现“功放/唱片机被命名成投影仪”等细粒度误判。继续扩大索引规模之前，需要先建立一套面向命名准确性的诊断和改进需求，明确错误来自主体框、embedding 输入、索引覆盖、细粒度类目混淆、阈值策略还是候选展示策略。

## What Changes

- 新增物品命名准确性分析能力，系统性记录每个主体的检测框、embedding 检索 TopK、分数、margin、候选类目和最终命名结果。
- 建立命名错误归因机制，将错误分为主体框错误、索引缺失、类目过粗、相似外观混淆、阈值/接受策略错误、展示候选不足等类型。
- 增加离线评测报告，重点衡量 Top1 命名准确率、Top3 命中率、候选可纠正率、误接受率、未命名率、混淆类目分布。
- 设计面向用户校正的数据闭环：用户选择正确候选、手动输入名称或标记无匹配时，记录可用于后续补索引、补别名、调阈值和细分类目的反馈。
- 不改变当前主体检测模型选择，不以耗时优化为主要目标；本 change 聚焦命名准确性。

## Capabilities

### New Capabilities

- `vision-naming-accuracy`: 定义物品命名诊断、评测、错误归因、候选展示和用户反馈闭环的行为要求。

### Modified Capabilities

- 无

## Impact

- 影响图片导入后的命名链路：`src/vision/catalog-matcher.js`、`src/vision/recognition-pipeline.js`、`src/ui/capture-rendering.js`、`src/ui/app.js`。
- 影响离线评测脚本和报告：`scripts/vision-catalog-naming-eval.mjs`、`scripts/vision-embedding-threshold-eval.mjs`、相关 `data/generated/*` 报告。
- 影响索引和类目数据的诊断使用方式：`data/vision-index*.json`、native metadata/binary index、家庭物品类目骨架。
- 可能新增用于命名反馈的本地数据结构，但不得破坏现有本地优先、单一主体检测模型、原生 embedding fallback 等约束。
