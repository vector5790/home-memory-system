## 1. 需求与现状确认

- [x] 1.1 确认当前 CLIP/SigLIP 模型资源形态、iOS 工程依赖和 native plugin 接入点。
- [x] 1.2 明确 native embedding 只能使用与索引同空间的 CLIP image embedding，不允许用不可比特征兜底。

## 2. Native embedding 实现

- [x] 2.1 新增 iOS `HomeMemoryVision` native plugin，并暴露 `embedImageDataUrls` 批量接口。
- [x] 2.2 接入可执行的 native CLIP image encoder 或明确的模型资源加载路径。
- [x] 2.3 实现图片解码、resize/normalize、批量执行、L2 normalize、维度校验和模型 session 复用。
- [x] 2.4 返回 native 耗时分解、模型标识、向量维度和错误诊断。

## 3. JS 运行时接入

- [x] 3.1 完善 `src/platform/index.js` 的 native embedding 能力探测、调用和错误透传。
- [x] 3.2 完善 `src/vision/catalog-matcher.js` 的 native 结果校验、fallback 和诊断展示。
- [x] 3.3 确认主体命名批次完成后 UI 能逐步更新，不重复触发正在进行的主体命名。

## 4. 测试与验证

- [x] 4.1 增加或更新自动化检查，覆盖 native plugin 缺失、native 失败 fallback、向量维度异常和批量结果数量异常。
- [x] 4.2 运行 `npm run check:web`、embedding 检查脚本和 iOS sync/build。
- [x] 4.3 在 iOS 模拟器上传真实家庭图片，验证主体框、候选物品、native/Web 模式、耗时诊断和错误提示。
- [x] 4.4 若 native 模型可用，运行 native 端到端同图验证并记录 native 模式、向量维度与耗时诊断。

## 5. 收尾

- [x] 5.1 更新任务状态和相关说明文档。
- [x] 5.2 整理本地变更，确认没有调试产物或无关文件混入。
