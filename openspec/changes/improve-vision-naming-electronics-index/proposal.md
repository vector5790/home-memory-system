## Why

当前“主体检测后用 CLIP crop embedding 检索命名”的链路在真实客厅图上会把功放、唱片机识别成投影仪，评测报告中的 GT-crop 命名准确率也偏低。主要原因是本地索引缺少高频家庭电子影音叶子类目，并且命名检索缺少拒识、相似类聚合和 hard-negative 校准。

这次变更先解决命名侧问题：补齐电子影音类目与淘宝商品图索引，提升正确类目存在时的检索命名稳定性；本次不做主体检测模型训练或召回优化。

## What Changes

- 在本地 GPC-style 家庭类目骨架中补充高频电子影音类目，包括电视机、功放、唱片机、书架音箱、落地音箱、有源音箱、回音壁、机顶盒、电视盒子、媒体播放器、CD/DVD/蓝光播放器、柜机空调等。
- 为新增叶子类目按现有淘宝采集链路采集图片，每个叶子类目先保留 3 张淘宝商品图。
- 对新增叶子类目用现有离线流程生成 embedding 索引：图片按比例缩小到长边最多 1024px，使用当前默认主体检测链路产出主框，对主框 crop 计算 CLIP embedding。
- 优化在线命名检索：从单张最近邻 Top1 改为支持按类目聚合 TopK，降低单个错误样本导致的误命名。
- 增加拒识与低置信候选机制：当最高分不足或与第二候选差距过小时，不强行命名为错误类目，而返回未知/候选列表。
- 针对投影仪、功放、唱片机、电视盒子等视觉相似电子设备建立命名评测集，输出 Top1、Top3、拒识率、混淆矩阵和典型错误样例。
- 不包含主体检测模型训练、主体检测数据标注、YOLOX/Grounding DINO 召回优化。

## Capabilities

### New Capabilities
- `vision-catalog-naming`: 视觉命名检索能力，覆盖 crop embedding 检索、类目聚合、拒识/候选输出、命名评测与混淆分析。

### Modified Capabilities
- `household-category-taxonomy`: 家庭类目骨架需要覆盖高频电子影音类目，并能标记需要进入 embedding 索引的叶子类目。

## Impact

- 数据文件：`data/vision-taxonomy-source.household.json`、`data/vision-categories.household.json`、`data/vision-embedding-category-selection.household.tsv`。
- 图片与索引：`fixtures/vision-household/cn/**`、`data/vision-household-image-manifest.cn.json`、`data/vision-index.household-cn.grounding-dino-clip.json`、`data/generated/**`。
- 前端命名链路：`app.js` 中 catalog index 载入、候选排序、阈值/边距判断、候选展示逻辑。
- 离线脚本：现有类目采集、索引构建、评测报告脚本需要支持新增电子影音命名评测。
