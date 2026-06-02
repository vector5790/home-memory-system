## ADDED Requirements

### Requirement: iOS native CLIP image embedding
系统 SHALL 在 iOS App 内提供 native image embedding 能力，且默认输出与当前本地 CLIP 索引同一向量空间的主体 crop embedding。

#### Scenario: Native embedding 返回可检索向量
- **WHEN** iOS App 对一个或多个主体 crop 调用 native embedding
- **THEN** 系统必须返回与当前 catalog model 匹配的 embedding 向量、向量维度、模型标识和执行耗时

#### Scenario: Native embedding 与索引模型不匹配
- **WHEN** native 层无法确认输出模型与当前索引模型一致
- **THEN** 系统不得把该向量用于命名检索，并必须返回明确错误原因

#### Scenario: Native embedding 不使用不可比特征替代
- **WHEN** native 层没有可用的 CLIP image encoder
- **THEN** 系统不得使用 Apple Vision FeaturePrint 或其他不可比图像特征冒充 CLIP embedding

### Requirement: 批量 embedding 与模型常驻
系统 SHALL 支持对多个主体 crop 进行批量 native embedding，并复用已加载的 native 模型实例。

#### Scenario: 多主体批量命名
- **WHEN** 一张图片识别出多个主体框需要命名
- **THEN** 系统必须按配置的最高并发或批量上限分批调用 native embedding，并在每批完成后更新对应主体命名

#### Scenario: 模型只加载一次
- **WHEN** 同一次 App 会话内连续分析多张图片
- **THEN** native embedding 模型必须复用已初始化 session，避免每个主体或每张图片重复加载模型

#### Scenario: 批量失败降级
- **WHEN** native 批量 embedding 因内存、维度或运行时错误失败
- **THEN** 系统必须记录失败原因，并根据配置降低批量或回退到 Web embedding

### Requirement: 运行时接入与诊断
系统 SHALL 在命名链路中优先使用 native embedding，并让用户或开发者能看出当前实际使用的是 native 还是 Web embedding。

#### Scenario: iOS native 可用
- **WHEN** App 运行在 iOS Capacitor 环境且 native embedding 插件可用
- **THEN** 命名链路必须优先调用 native embedding，并在候选物品诊断中展示 `mode native`

#### Scenario: native 不可用或失败
- **WHEN** native embedding 插件不存在、模型不存在、执行失败或输出校验失败
- **THEN** 命名链路必须展示可诊断的失败原因，并按配置回退到 Web embedding

#### Scenario: 耗时分解
- **WHEN** 一次图片分析完成
- **THEN** UI 必须展示主体检测耗时、命名总耗时、embedding 模式、批量大小和 native/Web embedding 阶段耗时

### Requirement: Native embedding 验证
系统 SHALL 提供自动化与模拟器验证，证明 native embedding 在真实图片分析链路中可用。

#### Scenario: 自动化检查
- **WHEN** 运行项目检查命令
- **THEN** 系统必须校验 native embedding 入口、Web fallback、向量维度校验和命名链路不会因 native 缺失而崩溃

#### Scenario: 模拟器真实图片测试
- **WHEN** 修改图片上传、主体检测、crop、embedding、命名或候选 UI 后准备交付
- **THEN** 必须在 iOS 模拟器中上传真实家庭图片，并确认主体框、命名候选、诊断耗时和错误提示均正常

#### Scenario: Web/native 对比
- **WHEN** native embedding 模型资源可用
- **THEN** 系统必须对同一 crop 运行 Web 与 native embedding 对比，报告维度、向量 norm 和 cosine 相似度差异
