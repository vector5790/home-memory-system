## Context

当前命名链路在主体检测后，会把每个主体框 crop 成小图，再用 `Xenova/clip-vit-base-patch32` 计算 image embedding，并与本地 household index 做相似度检索。最近一轮优化后，Web 链路已支持 crop 缩放、批量 embedding、并发调度和耗时分解；但在 iOS App 内，CLIP embedding 仍通过 JS/WASM 执行，真实图片测试中命名阶段仍明显慢于主体检测。

仓库现有模型资源主要是 ONNX/Web 形态：`vendor/models/Xenova/clip-vit-base-patch32/onnx/vision_model_quantized.onnx`，暂无 CoreML `.mlmodel` 或 `.mlpackage`。因此 native 实现必须解决“iOS 能执行当前 CLIP image encoder”以及“输出向量与已生成索引同空间”这两个约束。

## Goals / Non-Goals

**Goals:**
- 在 iOS App 中提供可调用的 native image embedding 接口，并接入当前线上命名链路。
- 保持 query embedding 与现有 CLIP 索引向量可比，输出维度、归一化和池化策略与 Web 链路一致。
- 支持批量主体 crop embedding，避免每个主体重复初始化模型。
- 在 UI 和日志中展示 native/Web 模式、耗时、向量维度和失败原因。
- 通过自动化检查与 iOS 模拟器真实图片端到端测试后再交付给用户体验。

**Non-Goals:**
- 本次不切换默认 embedding 模型到 SigLIP/SigLIP2。
- 本次不重建全量索引，也不改变类目聚合、拒识阈值和 reranker 策略。
- 本次不优化主体检测模型。

## Decisions

### Decision 1: native 输出必须对齐当前 CLIP 索引

native 层只要接入命名链路，就必须返回与当前 index 同空间的 CLIP image embedding。不能使用 Vision FeaturePrint、分类 logits 或其他图片特征替代，因为这些向量与现有 CLIP 索引不可比，会让相似度检索失效。

备选方案：
- 使用 Apple Vision FeaturePrint：实现快，但向量空间不匹配，拒绝。
- 切换到 SigLIP：可能准确率更好，但需要全量索引重建和阈值重评估，留作后续变更。
- 原生执行当前 CLIP image encoder：与索引一致，是本次目标。

### Decision 2: iOS native 通过明确插件能力暴露给 JS

JS 侧通过 `HomeMemoryVision.embedImageDataUrls({ model, images })` 调用 native。native 返回 `vectors`、`model`、`dimension`、`timings` 和 `mode`，JS 侧只接受数量、维度和模型匹配的结果；否则记录诊断并按配置回退到 Web embedding。

### Decision 3: 批量与模型常驻优先

native 层必须缓存模型 session，首次加载后后续主体共享同一个 image encoder。接口一次接收多个 crop，减少 JS/native bridge 往返次数，并让 UI 中的“命名中”状态随批次完成逐步更新。

### Decision 4: 测试必须覆盖真实 App 路径

除 `npm run check:web` 和 embedding 脚本外，修改图片上传、主体检测、crop、embedding、命名或候选 UI 后，必须在 iOS 模拟器中上传真实家庭图片，确认主体框、命名候选、耗时诊断和错误提示都可用。

## Risks / Trade-offs

- [Risk] iOS 缺少当前 ONNX CLIP 的 native 推理运行时或 CoreML 模型资源 → Mitigation: 先实现明确的模型发现、维度校验和错误诊断；若引入 ONNX Runtime iOS 或 CoreML 转换失败，不把不可比特征接入默认命名。
- [Risk] native 与 Web 预处理略有差异导致向量漂移 → Mitigation: 增加 native/Web 同图 embedding 对比脚本，校验维度、norm 和 cosine 差异。
- [Risk] native 首次加载仍慢 → Mitigation: 支持模型预热与 session 复用，并在诊断中拆分 load/preprocess/inference/postprocess。
- [Risk] 批量过大造成内存压力 → Mitigation: 使用配置化 max batch，失败时自动降低批量并保留错误信息。

## Migration Plan

1. 新增 native plugin 与 JS 适配层，默认仍允许 Web fallback。
2. 接入 native 模型执行与输出校验。
3. 增加 Web/native 对比测试、iOS build/sync 和模拟器端到端测试。
4. 通过真实图片验证后，将默认链路保持为 native 优先、Web 可诊断回退。

## Open Questions

- 当前仓库是否允许引入 ONNX Runtime iOS 二进制依赖，还是应先把 CLIP image encoder 转为 CoreML 资源随 App 打包。
- native 预热触发点应放在 App 启动后空闲时，还是用户进入拍照/导入页面时。
