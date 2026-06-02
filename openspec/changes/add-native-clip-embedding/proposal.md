## Why

当前图片分析的耗时瓶颈已经从主体检测转移到命名 embedding 阶段：主体检测约 200-300ms，而 CLIP crop embedding 与索引检索经常需要数秒。现有 Web/ONNX Runtime WASM 链路已经做了裁剪、批量和并发优化，但在 iOS App 内仍受 JS/WASM 初始化、图片编码和模型执行开销限制。

这次变更要把线上命名链路的图片 embedding 下沉到 iOS native 层执行，降低用户上传图片后等待候选物品命名的耗时，并让 UI 明确展示当前使用 native 还是 Web embedding。

## What Changes

- 新增 iOS native image embedding 能力，供运行时命名链路对主体 crop 批量计算 embedding。
- native embedding 输出必须与当前本地索引使用的模型空间一致；默认目标为 `Xenova/clip-vit-base-patch32` 对应的 CLIP image embedding，避免 query embedding 与既有索引向量不可比。
- JS 运行时在 Capacitor iOS 环境优先调用 native embedding，native 不可用或失败时保留清晰诊断，并按配置回退到现有 Web embedding。
- 命名诊断信息必须展示 embedding 执行模式、批量大小、native/Web 阶段耗时、向量维度和错误原因。
- 增加自动化与模拟器端到端验证，覆盖真实图片上传、主体检测、native embedding 命名、候选结果展示和耗时展示。
- 不在本次变更中切换到 SigLIP 或重建全量 SigLIP 索引；模型空间切换需要单独索引重建与准确率评测。

## Capabilities

### New Capabilities
- `native-vision-embedding`: iOS native 视觉 embedding 能力，覆盖模型一致性、批量 embedding、运行时接入、诊断与端到端验证。

### Modified Capabilities

## Impact

- iOS 工程：新增 native embedding 插件、模型资源接入、构建配置和模拟器验证路径。
- 前端运行时：`src/platform/index.js`、`src/vision/catalog-matcher.js`、`src/vision/recognition-pipeline.js` 的 native embedding 调用、错误处理和诊断展示。
- 配置与文档：`src/config/app-config.js`、`agent.md`、OpenSpec 需求与任务。
- 测试：Web check、embedding batch check、iOS sync/build、模拟器真实图片端到端测试。
