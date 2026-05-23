## ADDED Requirements

### Requirement: 扩展家庭类目骨架
系统 SHALL 提供扩展版家庭视觉类目 taxonomy，覆盖 seed fixture 之外的常见家庭物品域。

#### Scenario: 生成扩展类目 artifact
- **WHEN** 运行扩展 taxonomy 生成命令
- **THEN** 系统必须生成一个类目 artifact，其中 active leaf 覆盖收纳、厨房器具、食品与囤货、药品与健康、清洁与洗护、电子配件、家电、工具五金、文件与办公、衣物配饰、个人护理、母婴儿童、宠物用品、运动户外、旅行、季节物品、家纺、卫浴用品和家居装饰

#### Scenario: 保留 seed subset
- **WHEN** 生成扩展 taxonomy artifact
- **THEN** 现有 seed subset 必须继续作为独立的快速 smoke-test subset 可用，并且不得被扩展 artifact 覆盖

#### Scenario: MVP 最小覆盖
- **WHEN** 扩展 taxonomy artifact 被标记为 MVP-ready
- **THEN** 它必须包含至少 120 个 active leaf categories，并覆盖至少 12 个一级家庭域

### Requirement: 覆盖层级
系统 SHALL 为 taxonomy leaves 标记覆盖层级，避免未完成的长尾覆盖阻塞有用的家庭 subset。

#### Scenario: 设置覆盖层级
- **WHEN** 编写一个 category leaf
- **THEN** 它必须声明 `seed`、`mvp`、`common` 或 `long-tail` 中的一个 coverage tier

#### Scenario: 按层级过滤
- **WHEN** taxonomy builder 使用最大 coverage tier 参数运行
- **THEN** 它必须只包含不高于该层级的 leaves，并报告被排除的更高层级 leaf 数量

#### Scenario: 缺少层级
- **WHEN** 一个 active category leaf 缺少 coverage tier
- **THEN** 校验必须失败，并指出对应 category id

### Requirement: 类目编写契约
系统 SHALL 对每个 active 家庭 category leaf 执行完整的编写契约。

#### Scenario: Active leaf 字段完整
- **WHEN** 一个 category leaf 处于 active 状态
- **THEN** 它必须包含稳定的 kebab-case id、source name、source version、source id、四级 lineage、四段中文 display path、中文 display name、app category、aliases、detector labels、search queries 和 coverage tier

#### Scenario: 检测标签可用
- **WHEN** 校验 active leaf
- **THEN** 系统必须要求至少两个英文 detector labels，并拒绝只有 `object`、`item`、`thing` 或 `household item` 这类泛化标签的类目

#### Scenario: 展示路径重复
- **WHEN** 两个 active leaves 拥有相同的 normalized 中文 display path
- **THEN** 校验必须失败，除非存在显式 disambiguation override

#### Scenario: 保留 inactive leaf
- **WHEN** 一个 category leaf 处于 inactive 状态
- **THEN** 它必须包含 exclusion reason，并且不得出现在 active household subset 中

### Requirement: 来源映射与 override
系统 SHALL 为扩展家庭 taxonomy 保留来源 provenance 和项目 override 的可追踪性。

#### Scenario: 使用 GS1 GPC canonical 骨架
- **WHEN** 生成 active category leaf
- **THEN** 它必须使用 GS1 GPC 作为 canonical source taxonomy，并保留 `Segment`、`Family`、`Class`、`Brick` 四级 lineage、GS1 GPC source id 和 source version

#### Scenario: 存在来源映射
- **WHEN** 生成 active category leaf
- **THEN** 它必须包含 canonical GS1 GPC source id，并可以包含 Google Product Taxonomy ids 等辅助映射

#### Scenario: Google Product Taxonomy 作为辅助补充
- **WHEN** 一个 leaf 同时存在 Google Product Taxonomy 映射
- **THEN** 系统必须把 Google Product Taxonomy 用作 aliases、search queries、detector labels 或 auxiliary source mapping 的补充，不得用它覆盖 canonical GS1 GPC lineage

#### Scenario: UNSPSC 不作为首个 canonical 来源
- **WHEN** 扩展家庭 taxonomy builder 生成第一版视觉家庭类目
- **THEN** 系统不得要求或默认使用 UNSPSC lineage 作为 canonical source，但可以在后续 schema 中预留 optional auxiliary mapping

#### Scenario: 使用项目 override
- **WHEN** 某个 category 无法从 canonical source taxonomy 干净映射
- **THEN** 生成记录必须包含显式 project override reason，而不是静默编造 lineage

#### Scenario: 来源版本变化
- **WHEN** taxonomy source version 发生变化
- **THEN** 生成 artifact 必须包含 source version 和 build version，让下游 index 能追踪每个 category 来自哪个 taxonomy

### Requirement: 覆盖校验报告
系统 SHALL 为扩展家庭 taxonomy 生成覆盖校验报告。

#### Scenario: 报告覆盖数量
- **WHEN** 运行 taxonomy validation
- **THEN** 它必须写出一份报告，包含按 coverage tier、level-1 domain、level-2 family、level-3 class、app category、active status 和 index readiness 分组的数量

#### Scenario: 报告覆盖缺口
- **WHEN** 校验发现某个必需家庭域低于最小 leaf 目标
- **THEN** 报告必须列出该 domain、当前数量、最小目标和缺失示例

#### Scenario: 报告 prompt 质量问题
- **WHEN** 校验发现重复 detector labels、过宽泛 prompts、缺少 search queries 或 singleton sibling groups
- **THEN** 报告必须包含这些问题及受影响的 category ids

### Requirement: 区分 index readiness
系统 SHALL 区分类目 taxonomy 有效性和 embedding index readiness。

#### Scenario: 有效 taxonomy 但没有图片
- **WHEN** 一个 active category 没有 reviewed gallery 和 eval samples
- **THEN** taxonomy 必须仍然有效，但 readiness report 必须将该 leaf 标记为 not index-ready

#### Scenario: Index-ready leaf
- **WHEN** 一个 leaf 拥有配置要求的最少 reviewed gallery samples 和 evaluation samples
- **THEN** readiness report 必须将该 leaf 标记为 index-ready，并包含 sample counts

#### Scenario: 从扩展 taxonomy 构建 index
- **WHEN** 请求为扩展 categories 构建 index
- **THEN** builder 默认必须只包含 index-ready leaves，除非用户显式强制生成 non-production build

### Requirement: Runtime 与 benchmark 类目选择
系统 SHALL 允许 runtime 和 benchmark 命令在 seed subset 与扩展家庭 taxonomy 之间选择。

#### Scenario: Seed smoke test
- **WHEN** 现有 smoke-test 命令没有提供扩展 taxonomy 路径
- **THEN** 它们必须继续使用 seed taxonomy 和 seed fixtures

#### Scenario: 扩展 benchmark 输入
- **WHEN** benchmark 或 index 命令传入扩展 taxonomy 路径
- **THEN** 它们必须从该 artifact 加载扩展类目的 labels、aliases、display paths 和 detector prompts

#### Scenario: Prompt budget 超限
- **WHEN** 扩展 taxonomy 的 detector labels 数量超过配置的模型 prompt budget
- **THEN** 系统必须支持按 coverage tier 或 level-1 domain 过滤，而不是一次检测传入所有 labels
