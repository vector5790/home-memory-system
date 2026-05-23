## ADDED Requirements

### Requirement: 真实索引 readiness 汇总
系统 SHALL 将真实图片索引构建结果汇总回 household category readiness 报告。

#### Scenario: Leaf 拥有真实 index 样本
- **WHEN** 一个 household leaf 拥有满足阈值的 reviewed gallery images、有效 OWL-ViT regions 和 CLIP embeddings
- **THEN** readiness report 必须将该 leaf 标记为 index-ready，并记录 gallery/eval/image/region/embedding counts

#### Scenario: Leaf 只有 taxonomy 没有 index
- **WHEN** 一个 household leaf 没有足够真实图片、主体框或 embedding
- **THEN** readiness report 必须保留 taxonomy-valid 但标记为 not index-ready，并说明缺失阶段

#### Scenario: Runtime 选择扩展 taxonomy
- **WHEN** benchmark 或 index builder 显式选择 expanded household taxonomy
- **THEN** 系统必须只把 index-ready leaves 用于 production index，未 ready leaves 只能出现在 coverage/readiness 报告中
