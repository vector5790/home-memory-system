## 1. 类目数据模型

- [x] 1.1 扩展 category schema/source 格式，新增 `coverageTier`、可选 source override reason 和 index-readiness 元数据，同时不破坏当前 seed 文件。
- [x] 1.2 将 GS1 GPC 定义为 canonical source taxonomy，字段需覆盖 `Segment`、`Family`、`Class`、`Brick`、source id 和 source version。
- [x] 1.3 将 Google Product Taxonomy 定义为辅助映射来源，用于 aliases、search queries、detector labels 和 auxiliary source ids。
- [x] 1.4 明确 UNSPSC 暂不作为首个视觉家庭物品体系的 canonical source，只预留 optional auxiliary mapping。
- [x] 1.5 定义必需的家庭 level-1 domains 以及每个 domain 的 MVP 最小 leaf 目标。
- [x] 1.6 在 seed source artifact 旁新增扩展家庭 taxonomy source artifact。
- [x] 1.7 保持当前 seed taxonomy 和 fixtures 作为默认 smoke-test subset 可用。

## 2. 扩展类目编写

- [x] 2.1 编写至少 120 个 active MVP leaf categories，并覆盖至少 12 个家庭 domains。
- [x] 2.2 为每个 active leaf 补齐 GS1 GPC 四级 lineage、中文 display paths、中文 display names、aliases、英文 detector labels、search queries、app category mappings、GS1 source ids 和可选 Google Product Taxonomy 辅助映射。
- [x] 2.3 为后续扩展有价值的 common 和 long-tail candidate leaves 标记 coverage tiers、active/inactive status。
- [x] 2.4 为 inactive leaves 增加明确 exclusion reasons，并为无法干净映射到 canonical source taxonomy 的 leaves 增加 explicit override reasons。

## 3. Builder 与校验

- [x] 3.1 扩展 `scripts/vision-category-index.py` 或新增配套命令，从 expanded source 生成扩展家庭 category artifacts。
- [x] 3.2 增加 required fields、重复 ids、重复 normalized display paths、缺失 coverage tiers、缺失 GS1 GPC canonical mapping、inactive leaves 缺少 exclusion reasons 的校验。
- [x] 3.3 增加 detector prompt 校验，包括最少英文 labels、generic-only labels、重复 prompts 和缺失 search queries。
- [x] 3.4 增加 coverage 校验，按 tier、level-1、level-2、level-3、app category、active status 和 index readiness 统计。
- [x] 3.5 增加 readiness 逻辑，区分 taxonomy 有效 leaves 和拥有足够 reviewed gallery/eval samples、可用于 index building 的 leaves。

## 4. 报告与文档

- [x] 4.1 在 `data/generated/` 下生成 coverage report artifact，包含 category counts、gap lists、prompt-quality issues 和 index-readiness counts。
- [x] 4.2 更新 README 和 `docs/vision-category-index.md`，说明 taxonomy tiers、MVP coverage targets、GS1 GPC / Google Product Taxonomy / UNSPSC 来源策略和 image-readiness guidance。
- [x] 4.3 记录 benchmark/index 命令如何选择 seed 与 expanded taxonomy 输入。

## 5. 验证

- [x] 5.1 运行 seed category validation，证明 smoke-test subset 仍然可用。
- [x] 5.2 运行 expanded taxonomy generation 和 coverage validation。
- [x] 5.3 验证 expanded artifact 满足 spec 中的 MVP 阈值。
- [x] 5.4 运行 OpenSpec status/validation，确认所有 generated artifacts 都存在。
