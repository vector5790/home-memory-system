## 1. 命名诊断数据

- [x] 1.1 扩展命名结果数据结构，记录每个主体的 TopK、Top3、score、margin、acceptance policy、rejection reason、index version 和 embedding/index timing。
- [x] 1.2 在候选对象中区分 final accepted name、candidate-only result、unnameable reason 和 generic fallback name。
- [x] 1.3 为每个主体保存可复查的 crop metadata、box、source image id、detector provider 和 naming provider。

## 2. 离线命名评测报告

- [x] 2.1 扩展或新增命名评测脚本，支持输入带 ground truth 的主体框/crop 数据集。
- [x] 2.2 在报告中输出 Top1 accuracy、Top3 hit rate、candidate-correctable rate、false accept rate、unresolved rate、score/margin 分布。
- [x] 2.3 在报告中展示错误样本的 query crop、Top3 索引图、分数、类目路径和最终错误归因。
- [x] 2.4 将主体框错误和命名错误拆开统计，避免错误归因混淆。

## 3. 错误归因与混淆分析

- [x] 3.1 实现错误归因分类：subject-box-error、index-coverage-gap、category-granularity-gap、fine-grained-visual-confusion、threshold-policy-error、candidate-display-gap、unknown。
- [x] 3.2 按 category cluster 统计混淆矩阵、正确/错误 score 分布、margin 分布和样本数。
- [x] 3.3 为样本数足够的 cluster 输出建议阈值和预期误接受/拒绝权衡。

## 4. App 候选纠错闭环

- [x] 4.1 在候选物品 UI 中保留推荐名，同时展示 Top3 候选、分数和代表索引图。
- [x] 4.2 增加“选择此候选”“都不对”“手动输入名称”的本地纠错入口。
- [x] 4.3 将用户纠错记录保存为本地反馈样本，包含原始预测、TopK、主体框、crop metadata、用户选择和时间戳。

## 5. 索引改进建议

- [x] 5.1 基于评测和用户反馈生成按类目排序的补索引优先级列表。
- [x] 5.2 对 category-granularity-gap 样本输出拆细类目、补别名、补品牌/型号/形态字段的建议。
- [x] 5.3 对 index-coverage-gap 样本输出需要采集的代表图类型和现有 TopK 缺口说明。

## 6. 验证

- [x] 6.1 使用客厅图和至少一批家庭物品 query 重新跑命名评测报告。
- [x] 6.2 验证 Top3 候选展示不会破坏当前本地优先、native embedding、native index 检索链路。
- [x] 6.3 通过照片分析接口测试，确认真实照片输入可输出主体框、命名候选、TopK 和诊断信息。
- [x] 6.4 更新相关文档，说明命名不准的主要原因、评测指标和后续补索引/拆类目策略。

备注：6.3 改用 `scripts/analyze-photo-interface.mjs` 直接测试照片分析接口，已用 `/Users/guzeyu/Downloads/客厅.PNG` 生成 `data/generated/photo-analysis-interface.living-room.json`。
