## Context

项目已经有家庭类目 taxonomy、淘宝/中国大陆候选图片采集、OWL-ViT + CLIP crop embedding 索引和评测报告。新增类目数量变大后，直接进入 embedding 会把主体框错误放大成命名错误，因此需要先单独评估主体检测模型的框质量。

本次评估面向本地模型：Grounding DINO 与 OWL-ViT。评估输入是新增类目的淘宝/天猫/1688 等中国大陆商品图候选样本，输出是每张图两个模型的多框检测结果、主框 A/主框 B、人工审核标注、模型对比指标和后续 embedding 可复用的正确主框。

## Goals / Non-Goals

**Goals:**

- 复用现有中国大陆商品图采集策略，为新增类目补齐主体检测评估样本。
- 在不做 embedding 的前提下，评估 Grounding DINO 与 OWL-ViT 的主体框准确性。
- 允许每个模型对同一张图返回多个主体框，并保留全部有效框用于人工审核。
- 同时评估原图与统一尺寸压缩图，给出是否需要先压缩图片的建议。
- 提供前端审核页面，让人工逐图判断普通框、主框 A、主框 B 是否准确，并选择当前图片更好的模型和最终主体框。
- 生成机器可读报告和人工可读报告，记录每张图片最终正确主框，供后续 embedding crop 使用。

**Non-Goals:**

- 本次不计算 CLIP embedding，不生成 embedding index。
- 本次不引入远程视觉识别模型或远程标注服务。
- 本次不要求一次性把所有图片标注到生产级，只要求形成可持续补标和统计的流程。
- 本次不替换线上默认命名链路，只为后续主框选择和 embedding 构建提供依据。

## Decisions

1. **以 selection 文件确定采集范围**

   使用现有 `data/vision-embedding-category-selection.household.tsv` 或新的 detection selection 参数作为类目输入。对本次新增类目，默认可以通过脚本筛出“还没有采集样本的 active leaf”，也可以显式传 `--category-ids` 或 selection 文件。这样不会因为 taxonomy 继续扩展而误触发全量采集。

2. **复用淘宝/中国大陆候选来源采集器**

   采集沿用现有 `create-cn-manifest` 的搜索和过滤思路：优先淘宝搜索入口，随后用 DuckDuckGo/Bing 的中文商品图查询，并过滤淘宝/天猫/1688/中国大陆候选来源。新 manifest 需要保留 source url、source title、source host、image host、搜索 query、license/review status、sha256 和类目信息。图片默认先标记为 `pending`，进入人工审核前不得宣称 production-ready。

3. **图片压缩作为评估变量，而不是默认改写原图**

   对每个样本生成至少两个检测输入变体：

   - `original`：原始下载图。
   - `normalized-1024`：长边统一压缩到 1024px，保持宽高比，避免放大小图。

   检测报告按变体记录耗时、框数量、失败率、主框 A/B 审核准确率和人工选择胜率。只有当压缩图在准确率不下降或下降低于阈值，同时耗时明显改善时，报告才建议后续默认压缩。

4. **统一 Grounding DINO 与 OWL-ViT 输出 schema**

   两个模型的 raw output 统一成 detection run artifact：

   - `imageId`、`categoryId`、`modelId`、`imageVariant`
   - `detections[]`：每个框包含稳定 id、label、score、box 百分比坐标、areaPct、rankByScore、rankByArea
   - `primaryBoxAId`：面积最大的有效框
   - `primaryBoxBId`：置信度最高的有效框
   - `timingMs`、`thresholds`、`promptedLabels`、`failureReason`

   若同一个框同时是 A 和 B，页面必须同时显示两个角色，不复制框记录。

   OWL-ViT 需要在进入审核 artifact 前以 0 阈值召回候选，并做 category-level 去重/NMS：同一 category/同义 prompt group 内按 score 保留高置信框，过滤高 IoU 重叠框；之后按 score 最多保留 10 个候选主体。artifact 需要记录原始框数量、去重后框数量、阈值、NMS IoU 阈值和 max subjects，避免审核页面被同义词 prompt 的重复框淹没。

   Grounding DINO 的专项评测默认使用 0 阈值观察候选召回能力，但在进入审核页面前先按 IoU 做 NMS，再按 score 做 topK 截断，默认最多保留 10 个候选主体。这样可以暴露低阈值下模型真实可召回的主体，同时避免重复框或数百个低分框直接交给人工审核。

   app 上传图片的本地主体识别也需要在 raw detections 转候选主体前执行模型级 NMS，避免前若干个高分候选被近似重复框占满；已有的最终候选去重继续保留，用来处理跨模型或后续命名阶段带来的重复主体。

5. **审核页面通过本地写入 API 保存标注**

   审核页面使用本地 Node server 提供静态页面和 JSON API，而不是只生成无法写回的静态 HTML。页面按图片展示 Grounding DINO 与 OWL-ViT 的结果，使用不同颜色区分：

   - 主框 A：面积最大框。
   - 主框 B：最高置信框。
   - 普通框：其他候选框。

   标注结果写入 review artifact。页面不再使用难以对应的“框准/框不准”按钮组，而是每个候选框一行，展示主体框缩略图、框编号/角色/名字、score、准确性选择项、是否选为图片主框的选项，以及“只看此框”的聚焦按钮。候选框行采用两行布局：第一行放标题和分数，第二行放准确性、主框选择和聚焦操作，避免横向滚动才能看清整行。普通框、主框 A 和主框 B 使用一致的行级审核样式。页面在标注、选择主框和聚焦单框时保持滚动上下文，标题默认单行显示，并提供展开操作查看完整标题和 detection id。页面还需要标注 query 图是否有效；如果图片无效，必须填写无效原因或重新采集提示，并在保存时清空最终主框、排除后续 embedding 导出。最终保存 query image validity、invalid reason、box-level verdicts、当前图更好的模型、最终选择的主体框、备注和 reviewer/timestamp。

   “效果更好的模型”必须以模型 + image variant 为粒度，避免 `normalized-1024` 与 `original` 的差异被合并。最终主框只能从人工标注为准确的候选框中选择；未标为准确的框需要先完成准确性标注，才能成为后续 embedding 的主框来源。

6. **指标以人工审核为准**

   模型优劣不只看置信度或框数量，而以人工标注后的指标计算：

   - 普通框 precision：人工标为准确的普通框 / 已审核普通框。
   - 主框 A 准确率：A 框被标为准确的图片占比。
   - 主框 B 准确率：B 框被标为准确的图片占比。
   - 图片级成功率：至少有一个可用主体框的图片占比。
   - 模型胜率：人工选择某模型更好的图片占比。
   - 推荐主框策略：A、B、人工指定其他框或无可用框的分布。
   - 分数边界：已标注准确框的最低 score、已标注不准确框的最高 score，辅助判断阈值是否需要调整。
   - 性能：平均识别耗时、检测 p50/p95、失败率、平均框数，按模型和图片变体拆分。

7. **正确主框作为后续 embedding 输入**

   评审完成后导出 `subject-boxes` artifact，每张图片最多一个 `selectedPrimaryBox`，记录来自哪个模型、哪个变体、哪个 detection id、坐标、人工选择原因和审核状态。后续 embedding 构建只能使用审核通过的 selected primary box。

8. **后续评测拆表与动态 prompt 路由**

   后续报告需要拆成两张表：主体召回评测表面向“用户上传图片导入家中尽可能多的物品”，重点看正确主体数量、召回、误检和重复框；命名检索评测表面向“主体 crop 后靠 embedding 检索叶子类目命名”，重点看 leaf category 命中、topK 命中、相似图质量和耗时。

   当前线上上传图片链路仍依赖应用代码中的手写静态 prompt 列表。后续应改为从本地 GPC-style 类目骨架、待 embedding 类目、aliases 和 detector labels 自动生成 prompt，并按房间、场景、类目或视觉形态分组路由，避免全量 GPC 叶子类目直接塞进单次模型调用。

## Risks / Trade-offs

- [淘宝页面反爬或搜索结果不稳定] → 保留现有多来源 fallback，source report 必须列出每类目成功/失败原因，允许后续人工补图。
- [商品图包含包装、手模、场景道具，多个主体都合理] → 页面允许多个普通框准确，同时只选择一个后续 embedding 主框，并保留备注解释。
- [Grounding DINO 与 OWL-ViT prompt budget 不同] → 每类目使用该类目的 detector labels/aliases，不做全局全类目 prompt；必要时按类别分批。
- [压缩可能改变小物体检测质量] → 压缩只作为评估变体，报告必须同时输出准确率和耗时，不在没有证据时改变默认流程。
- [人工审核成本高] → 支持按 category、model、未审核/冲突状态筛选，并允许先审核抽样集生成阶段性报告。
- [当前 taxonomy 和旧 manifest 数量不一致] → 新 manifest 与检测报告必须记录 taxonomy version 和 category selection path，避免把旧 133 类目结果误认为新 344 类目全量结果。
