## 背景

当前视觉类目骨架只覆盖了少量 seed 物品，对真实家庭拍照识别来说过窄，也会让 OWL-ViT + CLIP 命名链路在小样本上显得比真实家庭规模下更乐观。在收集大量代表图片或构建更大的 embedding 索引之前，需要先补齐一套覆盖面更广、可治理、可验证的家庭物品类目体系。

## 变更内容

- 将当前 6 个 active seed 叶子类目扩展为面向家庭场景的类目骨架，覆盖收纳、厨房、食品、药品、清洁、工具、电子配件、家电、文件证件、衣物、母婴、宠物、季节物品等常见家庭物品域。
- 以 GS1 GPC 作为主类目来源和四级工业骨架，沿用 `Segment / Family / Class / Brick` 结构；Google Product Taxonomy 只作为开放补充，用于别名、查询词和辅助映射。
- 暂不把 UNSPSC 作为首个视觉家庭物品体系的 canonical 来源；仅在后续确有采购、耗材或服务类扩展需求时作为参考映射。
- 定义覆盖层级，避免第一版就假装“全量完备”：`seed`、`mvp`、`common`、`long-tail` 分层推进。
- 增加类目编写和校验规则，包括稳定 ID、四级 lineage、中文展示路径、英文检测标签、别名、app 类别映射和来源追踪。
- 增加或扩展脚本，生成扩展版 `data/vision-categories.*.json`，并在收集代表图片前校验覆盖率、重复命名、prompt 质量和 index-ready 状态。
- 增加报告产物，汇总各层级类目数量、覆盖缺口、别名/prompt 问题，以及仍缺代表图片的叶子类目。
- 保留当前小型 seed fixture 作为快速 smoke test，同时引入更大的家庭类目 artifact 供真实评测和索引构建使用。

## 能力范围

### 新增能力

- `household-category-taxonomy`：覆盖扩展家庭物品类目、覆盖层级、类目编写规则、校验和报告。

### 修改能力

无。

## 影响范围

- 数据：`data/vision-taxonomy-source.seed.json`、`data/vision-categories.seed.json`，以及新增的扩展 taxonomy/category artifact。
- 脚本：`scripts/vision-category-index.py` 或配套的 taxonomy 生成/校验命令。
- 文档：`docs/vision-category-index.md` 和 README 中关于类目规模、覆盖层级、图片收集 readiness 的说明。
- 评测：benchmark 和 index-building 流程继续支持 seed subset，同时可以显式指向扩展家庭 taxonomy。
