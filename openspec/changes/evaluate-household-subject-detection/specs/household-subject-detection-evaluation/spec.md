## ADDED Requirements

### Requirement: 中国大陆商品图采集
系统 SHALL 为家庭类目主体检测评估采集中国大陆商品图候选样本，并保留可追踪来源信息。

#### Scenario: 为新增类目采集样本
- **WHEN** 运行主体检测评估图片采集命令并指定新增 household categories
- **THEN** 系统必须按 category 采集淘宝、天猫、1688 或中国大陆候选来源图片，并写出包含 category id、image path、source url、source title、source host、image host、search query、sha256、review status 和 taxonomy version 的 manifest

#### Scenario: 采集失败可追踪
- **WHEN** 某个 category 没有采集到足够图片
- **THEN** 系统必须在 source report 中记录 category id、查询词、来源 provider、失败阶段和失败原因

#### Scenario: 不声明生产可用
- **WHEN** 图片样本尚未经过人工来源和类别审核
- **THEN** manifest 必须将样本标记为 pending 或 non-production-ready，不得宣称这些图片可直接进入生产索引

### Requirement: 图片压缩评估
系统 SHALL 比较原图和统一尺寸压缩图对主体检测性能与准确性的影响。

#### Scenario: 生成检测输入变体
- **WHEN** 一个采集样本进入主体检测评估
- **THEN** 系统必须至少保留 `original` 和 `normalized-1024` 两个 image variants，其中 `normalized-1024` 必须保持宽高比并只在长边超过 1024px 时缩小图片

#### Scenario: 按变体记录检测指标
- **WHEN** 模型对不同 image variants 运行检测
- **THEN** 系统必须分别记录每个 variant 的检测耗时、检测框数量、失败原因、主框 A、主框 B 和模型输出阈值

#### Scenario: 输出压缩建议
- **WHEN** 人工审核结果足以比较 image variants
- **THEN** 报告必须按模型输出压缩前后准确率、检测成功率、p50/p95 耗时和最终建议，并说明是否建议后续主体检测默认使用压缩图

### Requirement: 本地多模型主体检测
系统 SHALL 使用本地 Grounding DINO 与 OWL-ViT 对同一批图片执行主体检测，并允许每个模型返回多个候选主体框。

#### Scenario: 运行本地模型
- **WHEN** 运行主体检测 benchmark
- **THEN** 系统必须从本地模型目录加载 Grounding DINO 和 OWL-ViT，不得调用远程视觉识别 API

#### Scenario: 保留多个候选框
- **WHEN** 模型对一张图片返回多个有效框
- **THEN** 系统必须保留所有超过阈值的候选框，并为每个框记录 detection id、label、score、box 百分比坐标、areaPct、rankByScore 和 rankByArea

#### Scenario: OWL-ViT 去重和数量上限
- **WHEN** OWL-ViT 对同一张图片返回多个候选框
- **THEN** 系统必须支持以 0 阈值召回候选框，先按 category-level label group 做去重/NMS，再按置信度最多保留 10 个候选主体框，并记录去重前后框数量、阈值和 NMS 参数

#### Scenario: Grounding DINO 零阈值召回和数量上限
- **WHEN** Grounding DINO 用于主体检测评估
- **THEN** 系统必须支持以 0 阈值召回候选框，并在后处理阶段先按 IoU 做 NMS，再按置信度最多保留 10 个主体框，同时记录阈值、原始框数量、保留框数量和 NMS 参数

#### Scenario: 线上主体识别候选 NMS
- **WHEN** 用户上传图片触发 app 内本地主体识别
- **THEN** 系统必须在模型 raw detections 转成候选主体前执行 IoU NMS，避免重复框占满候选列表；最终候选列表仍应执行去重以处理跨模型或后续命名阶段的重复

#### Scenario: 无检测结果
- **WHEN** 某个模型对某张图片没有返回有效框
- **THEN** 系统必须记录该模型该图片的 failureReason，并在审核页面和报告中显示为无可用框

### Requirement: 主框 A 与主框 B
系统 SHALL 为每个模型、每张图、每个 image variant 自动派生两个主框角色。

#### Scenario: 主框 A
- **WHEN** 一个检测结果包含至少一个候选框
- **THEN** 系统必须将面积最大的有效框标记为主框 A，并保存其 detection id

#### Scenario: 主框 B
- **WHEN** 一个检测结果包含至少一个候选框
- **THEN** 系统必须将置信度最高的有效框标记为主框 B，并保存其 detection id

#### Scenario: 同一框同时为 A 和 B
- **WHEN** 面积最大的框和置信度最高的框是同一个 detection id
- **THEN** 系统必须将同一框同时标记为主框 A 和主框 B，不得复制出两个不同框记录

### Requirement: 主体检测审核页面
系统 SHALL 提供一个本地前端页面，让用户人工审核每张图片中每个模型的普通框、主框 A、主框 B 和最终主体框选择。

#### Scenario: 展示模型对比
- **WHEN** 用户打开主体检测审核页面
- **THEN** 页面必须在同一张 query 图下展示 Grounding DINO 与 OWL-ViT 的检测结果，并显示模型名、image variant、耗时、候选框数量和失败状态

#### Scenario: 框颜色区分
- **WHEN** 页面渲染检测框
- **THEN** 主框 A、主框 B 和普通框必须使用不同的视觉标识；普通框之间可以使用同一种颜色

#### Scenario: 标注框准确性
- **WHEN** 用户审核某个模型的检测结果
- **THEN** 页面必须按每个候选框逐行展示主体框缩略图、框编号/角色/名字、score、准确性选择项、是否选为图片主框的选项，并保存到 review artifact

#### Scenario: 候选框行无需横向滚动
- **WHEN** 用户在审核页面查看候选框标注行
- **THEN** 每个候选框标注行必须分为标题/分数行和操作行，准确性、主框选择和聚焦操作必须位于第二行，避免用户横向滚动才能看清所有内容

#### Scenario: 聚焦单个候选框
- **WHEN** 用户想观察某个候选框是否准确
- **THEN** 页面必须提供只显示当前候选框的操作，并允许恢复显示全部候选框

#### Scenario: 保持审核上下文
- **WHEN** 用户标注候选框、选择主框或切换只看当前框
- **THEN** 页面必须尽量保持当前滚动位置和候选框上下文，不得无故跳回候选框列表第一行；候选框标题默认单行显示，并提供展开操作查看完整标题和 detection id

#### Scenario: 标注图片级选择
- **WHEN** 用户审核一张图片
- **THEN** 页面必须允许用户选择当前图片哪个模型识别效果更好、当前图片后续 embedding 应采用哪个框作为主体框，或标记为无可用主体框

#### Scenario: 标注 query 图有效性
- **WHEN** 用户审核一张 query 图
- **THEN** 页面必须允许用户标注 query 图是否有效；当标为无效时，系统必须要求用户填写无效原因或重新采集提示，并将该原因写入 review artifact

#### Scenario: 默认节省标注成本
- **WHEN** 用户打开或保存一张尚未显式标注的 query 图
- **THEN** 页面必须默认将 query 图视为有效，并默认将候选主体框视为准确；只有用户显式标记无效 query 或不准确主体框时，review artifact 和报告指标才按负例统计

#### Scenario: 按模型变体选择效果更好结果
- **WHEN** 同一模型存在 `original` 和 `normalized-1024` 等多个 image variant 的检测结果
- **THEN** 页面必须在“效果更好的模型”中展示模型 + image variant 粒度的选项，不能只展示模型 id

#### Scenario: 最终主框只来自准确框
- **WHEN** 用户选择当前图片后续 embedding 应采用的最终主框
- **THEN** 页面必须只允许从人工标注为准确的候选框中选择；未标为准确或已标为不准确的候选框不得直接成为最终主框

#### Scenario: 保存审核结果
- **WHEN** 用户提交或切换到下一张图片
- **THEN** 系统必须通过本地写入 API 保存 reviewer、timestamp、image id、category id、query image validity、invalid reason、model-level verdicts、box-level verdicts、best model、selected primary box 和 notes

### Requirement: 主体检测评测报告
系统 SHALL 根据人工审核结果计算 Grounding DINO 与 OWL-ViT 的主体检测效果，并输出机器可读和人工可读报告。

#### Scenario: 计算模型指标
- **WHEN** 存在已审核的主体检测结果
- **THEN** 报告必须按模型和 image variant 计算普通框 precision、主框 A 准确率、主框 B 准确率、图片级成功率、人工选择胜率、平均框数、失败率、平均识别耗时、检测 p50 和检测 p95

#### Scenario: 计算人工标注分数边界
- **WHEN** 存在已标注准确或不准确的候选框
- **THEN** 报告必须输出已标注准确框的最低 score 和已标注不准确框的最高 score，用于辅助设置后续模型阈值

#### Scenario: 计算类目指标
- **WHEN** 已审核结果覆盖多个 category
- **THEN** 报告必须按 category 汇总样本数、可用主框数、最佳模型分布、主框 A/B 准确率和失败原因

#### Scenario: 推荐模型与主框策略
- **WHEN** 报告生成完成
- **THEN** 报告必须明确当前数据下哪个模型主体识别效果更好，并说明更推荐使用主框 A、主框 B 或人工选择框作为后续 embedding 主框来源

#### Scenario: 区分主体召回与命名检索评测
- **WHEN** 后续同时评估“用户导入尽可能多的家庭物品”和“主体 crop embedding 检索命名”
- **THEN** 报告应该拆分为主体召回评测表和命名检索评测表，分别统计多物品召回质量、误检/重复框，以及 embedding 命名准确率和叶子类目命中情况

### Requirement: 动态 prompt 路由待办
系统 SHALL 记录并后续实现线上上传图片主体识别 prompt 的动态生成：prompt 来源必须从手写静态列表改为由本地 GPC-style 类目骨架和待 embedding 类目生成，并按房间、场景或类目分组路由。

#### Scenario: 根据本地类目生成检测 prompt
- **WHEN** 用户上传图片触发线上主体识别
- **THEN** 系统应该从本地 GPC-style 类目骨架、待 embedding 类目、别名和 detector labels 生成候选 prompt，而不是依赖硬编码在应用代码里的固定列表

#### Scenario: 按场景分组路由
- **WHEN** 待检测 prompt 数量超过单次模型调用的合理预算
- **THEN** 系统应该按房间、场景、类目或视觉形态分组路由 prompt，并记录每组 prompt 的来源和命中结果

### Requirement: 正确主框产出
系统 SHALL 将人工确认的正确主体框保存为后续 embedding 可复用的数据 artifact。

#### Scenario: 导出正确主框
- **WHEN** 用户完成图片审核并选择最终主体框
- **THEN** 系统必须导出每张图片的 selected primary box，包含 image id、category id、source image path、model id、image variant、detection id、box、label、score、review status、reviewer 和 timestamp

#### Scenario: 排除未通过图片
- **WHEN** 一张图片被标记为无可用主体框或尚未审核
- **THEN** 系统不得将该图片写入可用于后续 embedding 的 approved selected primary box 集合

#### Scenario: 追踪来源版本
- **WHEN** 导出正确主框 artifact
- **THEN** artifact 必须记录 taxonomy version、image manifest version、detection run version、review version 和生成时间
