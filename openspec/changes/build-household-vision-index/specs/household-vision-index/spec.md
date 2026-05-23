## ADDED Requirements

### Requirement: 图片 manifest
系统 SHALL 为 household vision index 使用可复现的图片 manifest。

#### Scenario: 为 leaf 准备代表图
- **WHEN** 为 household leaf 准备 index 样本
- **THEN** 每个样本必须记录 sample id、category id、图片路径或来源 URL、license、brand/type variant、split、reviewStatus 和 sha256

#### Scenario: 多品牌多类型覆盖
- **WHEN** 一个 leaf 被标记为 index build scope
- **THEN** 系统必须为该 leaf 计划多张不同品牌、包装形态或类型的代表图，若不足必须在 readiness report 中记录缺口

#### Scenario: 不可用图片
- **WHEN** 图片下载失败、hash 缺失、license 缺失或 reviewStatus 为 rejected
- **THEN** builder 必须跳过该样本并在 build report 中记录失败原因

### Requirement: OWL-ViT 主体框索引构建
系统 SHALL 使用本地 OWL-ViT 为 household representative images 生成主体 region。

#### Scenario: 检测主体 region
- **WHEN** builder 处理一个可用 image sample
- **THEN** 它必须使用该 category 的 detector labels 或 aliases 调用本地 OWL-ViT，并保存最佳主体框、检测 label、score、模型 id 和耗时

#### Scenario: 主体框失败
- **WHEN** OWL-ViT 没有返回满足阈值和面积约束的主体框
- **THEN** builder 必须不写 index entry，并把该 sample 标记为 no-region 或 low-confidence-region

#### Scenario: region 坐标格式
- **WHEN** builder 写入 region
- **THEN** region 必须包含图片相对百分比坐标 `x`、`y`、`w`、`h`，且数值必须在 0 到 100 范围内

### Requirement: CLIP crop embedding index
系统 SHALL 使用本地 CLIP 对 OWL-ViT 主体 crop 生成 embedding index。

#### Scenario: 写入 index entry
- **WHEN** 一个 sample 成功获得主体 region 和 CLIP embedding
- **THEN** 系统必须写入包含稳定主键 id、category id、display name、category path、source image path、region、crop metadata、embedding、embedding model id、detector model id、source/license 和 build version 的 index entry

#### Scenario: embedding 归一化
- **WHEN** CLIP embedding 被写入 index
- **THEN** embedding 必须是归一化向量，并声明使用最大 inner product 检索

#### Scenario: 稳定主键
- **WHEN** 同一个 manifest 和同一组 region 重新构建
- **THEN** 相同 sample 的 index entry id 必须保持稳定，便于 diff、缓存和评测引用

### Requirement: Index build report
系统 SHALL 输出 household index build report，说明覆盖、失败和 readiness。

#### Scenario: 统计覆盖
- **WHEN** household index build 完成
- **THEN** report 必须按 category、domain、split、region status、embedding status 和 index readiness 汇总数量

#### Scenario: 记录失败
- **WHEN** 某张图片没有生成可用 index entry
- **THEN** report 必须记录 sample id、category id、失败阶段、失败原因和可重试标记

#### Scenario: production readiness
- **WHEN** index 覆盖或评测未达到阈值
- **THEN** generated index 必须标记为 non-production，除非后续评测通过并显式提升

### Requirement: 评测复跑
系统 SHALL 使用现有 vision model eval 系统重新评测 household index。

#### Scenario: 生成评测报告
- **WHEN** household index 构建完成
- **THEN** 系统必须生成 JSON、HTML 和 Markdown 评测报告，包含主体框准确性、物品名准确性、Top3 检索图、耗时和 go/no-go

#### Scenario: 按模型链路展示
- **WHEN** 报告展示逐 case 结果
- **THEN** 每个 case 必须显示使用的 detector、embedding/namer、预测框、预测物品名、GT 或审核标签，以及 Top3 相似 index 图片

#### Scenario: 评测范围说明
- **WHEN** 只对 smoke subset 或部分 leaves 评测
- **THEN** 报告必须明确列出覆盖的 category ids、leaf 数量、图片数量和未覆盖原因
