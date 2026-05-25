## Why

当前家庭视觉链路已经扩展了本地类目骨架，但新增类目在进入 embedding 前还缺少一套只评估“主体框识别”的流程。先对淘宝/中国大陆来源图片跑 Grounding DINO 与 OWL-ViT，并人工审核普通框、主框 A、主框 B 的准确性，可以在大规模 embedding 前判断哪个主体检测模型和主框策略更可靠。

## What Changes

- 为新增家庭类目批量采集淘宝/天猫/1688 等中国大陆商品图候选样本，复用现有采集实现和来源过滤策略。
- 增加图片预处理评估：比较原图与统一尺寸压缩图在检测耗时、检测成功率、框稳定性和审核准确率上的差异，输出是否应在主体检测前统一压缩图片的建议。
- 增加仅主体识别的本地评测链路，不计算 CLIP embedding，不生成 embedding index。
- 对每张图片分别运行本地 Grounding DINO 与 OWL-ViT，允许返回多个主体框，保留模型返回的全部有效候选框。
- Grounding DINO 与 OWL-ViT 专项评测都支持 0 阈值召回，并在审核前按置信度/NMS 截断为最多 10 个候选主体。
- 对每个模型结果计算并标识：
  - 主框 A：面积最大的主体框。
  - 主框 B：模型置信度最高的主体框。
  - 其他普通框：除主框 A/B 外的候选框。
- 增加前端审核页面，用不同颜色展示普通框、主框 A、主框 B，让人工标注同一张图每个模型的普通框、主框 A、主框 B 是否准确，选择当前图片哪个模型更好，以及应该采用哪个框作为后续 embedding 主体框。
- 审核页面的“效果更好”选择按模型 + image variant 展示，最终主框只能从已标注准确的候选框中选择。
- 审核页面增加 query 图有效性标注；当 query 图无效时必须填写原因或重新采集提示，后续可据此重采。
- 生成评测报告，按模型、图片尺寸策略、类目、普通框准确率、主框 A 准确率、主框 B 准确率、人工选择胜率和最终主框可用率汇总。
- 记录每张图片审核后的正确主框，作为后续 embedding crop 的输入数据。
- 记录后续待办：评测报告拆分主体召回与命名检索两张表；线上上传识别 prompt 改为由本地 GPC-style 类目骨架/待 embedding 类目动态生成，并按房间、场景和类目分组路由。
- 不引入远程视觉识别模型；本次只评估本地 Grounding DINO 与 OWL-ViT。

## Capabilities

### New Capabilities

- `household-subject-detection-evaluation`: 家庭类目商品图采集、图片预处理对比、本地 Grounding DINO/OWL-ViT 多框主体检测、人工审核页面、主体框准确率统计与正确主框产出。

### Modified Capabilities

- 无。

## Impact

- 数据：新增或扩展中国大陆商品图 manifest、主体检测 raw output、人工审核标注、正确主框 artifact 和评测报告。
- 脚本：扩展现有图片采集脚本，新增主体检测 benchmark、图片压缩对比、审核数据导出和报告生成命令。
- 前端：新增本地审核页面，用于逐图比较 Grounding DINO 与 OWL-ViT 的框结果并写回人工标注。
- 模型运行：使用本地 `vendor/` 中的 Grounding DINO 与 OWL-ViT；不计算 embedding，不调用远程视觉 API。
- 后续链路：审核产出的正确主框将作为后续 CLIP crop embedding 的输入来源。
