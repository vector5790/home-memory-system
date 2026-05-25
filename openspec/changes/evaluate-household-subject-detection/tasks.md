## 1. 数据范围与采集

- [x] 1.1 增加主体检测评估的 category selection 读取逻辑，支持按新增类目、selection 文件或 `--category-ids` 选择采集范围。
- [x] 1.2 复用并扩展中国大陆商品图采集器，为选中类目生成主体检测评估 manifest。
- [x] 1.3 在 manifest 中记录 taxonomy version、category id、source url/title/host、image host、search query、sha256、review status 和 non-production-ready 标记。
- [x] 1.4 生成 source report，按 category 汇总采集数量、失败阶段、失败原因和不足样本。

## 2. 图片预处理评估

- [x] 2.1 增加 image variant 生成逻辑，至少支持 `original` 和长边 1024px 的 `normalized-1024`。
- [x] 2.2 保留原图路径和压缩图路径，并记录压缩后的尺寸、字节数和变体生成耗时。
- [x] 2.3 确保小图不会被放大，压缩图保持原始宽高比。

## 3. 本地主体检测运行

- [x] 3.1 增加主体检测 benchmark 命令，输入 manifest、categories、image variants 和模型列表。
- [x] 3.2 接入本地 Grounding DINO，并输出统一 detection schema。
- [x] 3.3 接入本地 OWL-ViT，并输出统一 detection schema。
- [x] 3.4 每个模型保留所有超过阈值的候选框，记录 detection id、label、score、box、areaPct、rankByScore 和 rankByArea。
- [x] 3.5 为每个模型结果计算主框 A（面积最大框）和主框 B（置信度最高框），并正确处理 A/B 为同一框的情况。
- [x] 3.6 记录每张图每个模型每个 image variant 的耗时、阈值、prompted labels、失败原因和 raw output 路径。
- [x] 3.7 为 OWL-ViT 增加 category-level 去重/NMS，并在去重后最多保留 10 个主体框。
- [x] 3.8 将 Grounding DINO 评测阈值默认调为 0，并在阈值后按置信度最多保留 10 个主体框，避免审核页被低分候选淹没。
- [x] 3.9 将 OWL-ViT 评测阈值默认调为 0，并继续在 category-level NMS 后最多保留 10 个主体框。
- [x] 3.10 为 Grounding DINO 评测结果增加 IoU NMS，再保留 top10，避免重复框进入审核页面。

## 4. 审核页面与标注保存

- [x] 4.1 增加本地审核 server，提供检测结果 JSON、图片资源和标注写入 API。
- [x] 4.2 实现审核前端页面，同图对比 Grounding DINO 与 OWL-ViT，并展示模型、variant、耗时、框数量和失败状态。
- [x] 4.3 在页面中用不同视觉样式展示主框 A、主框 B 和普通框，普通框可共用一种颜色。
- [x] 4.4 支持用户标注普通框、主框 A、主框 B 的准确/不准确状态。
- [x] 4.5 支持用户选择当前图片哪个模型效果更好、最终采用哪个主体框，或标记无可用主体框。
- [x] 4.6 将 reviewer、timestamp、image id、category id、box verdicts、model verdicts、best model、selected primary box 和 notes 写入 review artifact。
- [x] 4.7 将审核页面改为每行一个候选框，展示框编号/角色/名字、score、准确性选择、主框选择和只看当前框的聚焦操作。
- [x] 4.8 优化标注页面滚动上下文和候选框标题展示，避免标注或聚焦后跳回第一行。
- [x] 4.9 将“效果更好的模型”选择项扩展为模型 + image variant 粒度，覆盖 `original` 和 `normalized-1024`。
- [x] 4.10 将最终主框候选限制为人工标注为准确的框；未标准确的框不能直接选为最终主框。
- [x] 4.11 将候选框标题默认改为单行显示，并提供展开/收起操作查看完整标题和 detection id。
- [x] 4.12 增加 query 图有效性标注；当图片无效时要求填写原因/重采提示，并从后续主框导出与指标计算中排除。
- [x] 4.13 在每个候选框标注行中展示当前主体框的裁剪缩略图，方便快速判断框内容。
- [x] 4.14 为 app 上传图片的本地主体识别增加模型级 IoU NMS，避免 raw detection 重复框占满候选列表。
- [x] 4.15 将候选框标注行改成两行布局，第一行显示标题和分数，第二行显示准确性、主框选择和聚焦操作，避免横向滚动。
- [x] 4.16 将 query 图默认标为有效、候选框默认标为准确；审核员只需要显式标出无效 query 或不准确主体框。

## 5. 指标与报告

- [x] 5.1 根据 review artifact 计算普通框 precision、主框 A 准确率、主框 B 准确率、图片级成功率、人工选择胜率、平均框数、失败率、平均识别耗时和检测 p50/p95。
- [x] 5.2 按模型、image variant、category 和 source provider 输出分组指标。
- [x] 5.3 生成压缩策略评估结论，说明是否建议主体检测前统一使用压缩图。
- [x] 5.4 生成模型推荐结论，说明 Grounding DINO 与 OWL-ViT 哪个主体检测效果更好。
- [x] 5.5 生成 HTML/Markdown/JSON 报告，报告中展示 query 图、普通框、主框 A、主框 B、人工标注、模型对比和两个模型的平均识别耗时。
- [x] 5.6 报告输出人工标注准确框的最低分数和不准确框的最高分数。
- [x] 5.7 将后续评测报告拆成两张表：主体召回评测表（尽可能找出用户家里的多个可导入物品）和命名检索评测表（主体 crop embedding 检索叶子类目命名）。

## 6. 正确主框导出

- [x] 6.1 从 review artifact 导出 approved selected primary boxes。
- [x] 6.2 每条正确主框记录包含 image id、category id、source image path、model id、image variant、detection id、box、label、score、review status、reviewer 和 timestamp。
- [x] 6.3 对未审核或标记无可用主体框的图片，不写入 approved selected primary box 集合。
- [x] 6.4 在 artifact 中记录 taxonomy version、image manifest version、detection run version、review version 和生成时间。

## 7. 文档与验证

- [x] 7.1 更新 README 和视觉类目文档，说明主体检测评估流程、审核页面启动方式、标注文件和报告输出。
- [x] 7.2 增加脚本级模拟器验证，覆盖 manifest 生成、variant 生成、detection schema、A/B 主框派生、review 写入和指标计算。
- [x] 7.3 运行 OpenSpec strict validation，确保新增 capability spec 可归档。
- [x] 7.4 运行本地脚本语法检查和核心 simulator checks，记录验证结果。

## 8. 后续线上链路待办

- [ ] 8.1 当前项目上传图片做主体识别时，模型 prompt 应改为根据图片动态生成：从本地 GPC-style 类目骨架和待 embedding 类目自动生成 prompt，并按房间、场景、类目分组路由，不再依赖 `app.js` 中的手写静态列表。
