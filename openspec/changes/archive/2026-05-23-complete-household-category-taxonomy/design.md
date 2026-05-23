## 背景

当前类目管线的结构已经基本正确，但数据仍然只是 seed slice：6 个 active 家庭叶子类目，加 1 个 inactive 的未知类目负样本。这足够验证 OWL-ViT + CLIP 的评测链路，但不足以支撑真实家庭照片命名，因为剪刀、胶带、碗、杯子、食品包装、洗护用品、清洁用品、文件、包、衣物、家电、宠物用品和季节物品等常见对象都还缺失。

已有 `vision-category-index` 变更已经确立了核心记录形态：四级 lineage、本地化展示路径、别名、检测标签、搜索词、app 类别、来源信息和 active 状态。本变更应该沿用这套结构，而不是另造一套 catalog 格式。

## 目标 / 非目标

**目标：**

- 定义更完整的家庭 taxonomy 骨架，在开始收集代表图片前覆盖常见家庭库存对象。
- 让 taxonomy 适合开放词表检测：每个叶子类目必须有英文 detector labels、aliases，并通过 prompt 质量校验。
- 保留来源追踪：以 GS1 GPC 的 `Segment / Family / Class / Brick` 作为 canonical 四级 lineage，辅以 Google Product Taxonomy 映射和显式项目 override。
- 产出覆盖率和 readiness 报告，让缺口能按层级、家庭域、app 类别、覆盖层级和图片准备状态被看见。
- 保留现有 seed subset 作为快速 smoke test，同时新增更大的家庭 taxonomy artifact 供真实索引使用。

**非目标：**

- 本变更不收集所有扩展叶子类目的代表图片。
- 本变更默认不对扩展 taxonomy 跑全量 CLIP embedding 推理。
- 本变更不替换 app 当前的 inventory category enum，除非后续产品分类另有决策。
- 本变更不承诺工业全品类穷尽覆盖；目标是家庭优先、可持续扩展的骨架。
- 本变更不采用 UNSPSC 作为首个 canonical 视觉家庭物品体系；它更适合采购、耗材和服务类场景，后续只作为补充映射候选。

## 决策

1. 使用分层 taxonomy，而不是一次性要求“大而全”。

   扩展 taxonomy 的叶子类目需要标记 `coverageTier`：`seed`、`mvp`、`common` 或 `long-tail`。`seed` 保留快速 fixture；`mvp` 覆盖第一版实用家庭识别；`common` 和 `long-tail` 可以先存在于 source 文件中，但在缺少代表图片时不要求 index-ready。这样不会因为长尾类目未完成而阻塞可用版本。

2. 用 GS1 GPC 做 canonical 四级骨架。

   主 source taxonomy 应使用 GS1 GPC，因为它天然提供 `Segment / Family / Class / Brick` 四级结构，和当前项目需要的一级到四级 lineage 一致。生成后的每个 active leaf 都应保留 GS1 GPC source id、source version、四级英文 lineage 和对应中文展示路径。项目可以为了视觉识别拆分或合并少数 brick，但必须记录 override reason。

3. 用 Google Product Taxonomy 做开放补充，而不是主骨架。

   Google Product Taxonomy 的优势是开放可获取、贴近电商检索词和别名，适合补充 aliases、search queries、detector labels 和辅助 mapping。它不应该覆盖 GS1 GPC 的 canonical lineage；当两者粒度冲突时，以 GS1 GPC lineage 为准，并把 Google id 作为 `auxiliarySourceIds` 或等价字段保存。

4. 暂不采用 UNSPSC 作为首个视觉家庭物品 canonical 来源。

   UNSPSC 虽然也有四级结构，但更偏采购、服务、耗材和企业供应链语义，很多家庭视觉对象的叶子命名不如 GS1 GPC/GPT 组合贴近拍照识别。它可以在后续需要采购属性、维修服务、耗材管理时加入映射，但本变更不让 runtime 或 benchmark 依赖 UNSPSC lineage。

5. 用家庭域做规划桶，同时保留标准来源 lineage。

   authoring source 可以按收纳、厨房、食品、药品、清洁、电子、家电、工具、文件、衣物、个护、母婴、宠物、运动户外、旅行、季节和装饰等家庭域组织。每个叶子类目仍保留标准四级 lineage 和 source mapping，避免 runtime 和报告绑定到非正式房间标签。

6. 中文展示名与英文检测 prompt 分离。

   OWL-ViT 和 Grounding DINO 更适合简短英文标签。每个 active leaf 都需要中文 `displayPath`/`displayName` 用于 UI，同时需要英文 `detectorLabels`/`searchQueries` 用于模型 prompt 和图片发现。校验应拒绝只有中文 prompt 或只有 `object` 这类泛化标签的 active leaf。

7. 图片收集前先做覆盖校验。

   taxonomy builder 应报告 tier、level-1、level-3、app category 和 readiness 的数量，并标记重复 ID、重复中文展示路径、缺别名、缺 detector labels、来源映射缺失、过宽泛的 level-4 标签，以及只有单个叶子的 sibling group。这样能在下载或 embedding 成千上万张图片前先修结构问题。

8. 区分类目有效性和索引 readiness。

   一个类目可以是有效 taxonomy，但不一定 index-ready。`active` 表示它能出现在家庭 taxonomy 中；`indexReady` 或生成的 readiness report 则必须要求足够的 reviewed gallery/eval samples。这样不会悄悄创建没有代表图片支撑的弱索引叶子。

## 风险 / 取舍

- 大量手写 taxonomy 容易漂移或重复 -> 通过 schema 校验、重复展示路径检查和覆盖率报告降低风险。
- OWL-ViT 标签过多会拖慢检测或降低精度 -> 通过 coverage tier、prompt 分组和后续按 domain prompt 控制。
- GS1 GPC 与 Google Product Taxonomy 无法完美映射家庭视觉类目 -> GS1 GPC 作为 canonical lineage，Google Product Taxonomy 作为辅助映射，使用显式项目 override 和 source notes，避免损失信息的自动 flatten。
- UNSPSC 也有四级结构但语义偏采购和服务 -> 不作为首个 canonical 视觉体系，后续只按需要补充映射。
- 扩展类目没有图片时容易造成“已经可用”的错觉 -> 区分类目有效性和 index readiness，并突出缺样本数量。
- 部分家庭物品在叶子级别视觉上很相似 -> 使用 aliases、sibling hard negatives 和父级 fallback 报告缓解。

## 迁移计划

1. 在当前 seed 文件旁新增扩展家庭 taxonomy source artifact。
2. 扩展 taxonomy importer/validator，使其理解 coverage tiers、readiness metadata 和 coverage reports。
3. 把 GS1 GPC source id/version/四级 lineage 作为 active leaf 的必填 canonical 来源字段，把 Google Product Taxonomy 作为可选辅助映射字段。
4. 生成扩展 category artifact，但不覆盖 seed smoke-test artifact。
5. 更新文档，说明 taxonomy tier、来源选择策略以及大规模 index build 需要先满足代表图片 readiness。
6. 当某个 tier 有足够图片后，benchmark/index 命令再显式指向扩展 artifact。

回滚很简单：当前 seed 文件保持不变，runtime 仍可继续加载已有 generated/seed index。

## 待定问题

- 第一版面向用户的 MVP leaf 数量目标最终应定为 120、200 还是 300 左右？
- prompt grouping 应按 level-1 domain、app category、储物房间，还是用户最近上下文来切？
- 在用户真实家庭照片足够之前，各类目 tier 可以接受哪些开放图片来源？
