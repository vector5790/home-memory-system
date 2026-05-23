## 1. Manifest 与图片准备

- [x] 1.1 定义 household image manifest 格式，包含 category、source、license、variant、split、reviewStatus、hash 和本地路径。
- [x] 1.2 为 smoke subset 选择覆盖多个家庭域的 leaves，并为每个 leaf 准备多张不同品牌/类型图片记录。
- [x] 1.3 增加图片下载/缓存/校验命令，失败样本写入 report 而不是中断整批。
- [x] 1.4 生成 smoke household image manifest 和 source report。

## 2. 本地模型 Index Builder

- [x] 2.1 新增或扩展 builder，读取 household image manifest 和 household categories。
- [x] 2.2 调用本地 OWL-ViT 对每张图片生成主体 region，记录 label、score、box 和耗时。
- [x] 2.3 对 OWL-ViT region crop 调用本地 CLIP 生成归一化 embedding。
- [x] 2.4 写出实际 household index，每条 entry 包含稳定 id、region、图片、crop、embedding 和模型元数据。
- [x] 2.5 写出 index build report，汇总成功、失败、no-region、no-embedding 和 readiness。

## 3. 评测复跑

- [x] 3.1 基于 manifest/index 生成评测 dataset 和预测结果，兼容现有 `vision-model-eval.py`。
- [x] 3.2 跑 household index 评测，输出 JSON、HTML 和 Markdown 报告。
- [x] 3.3 报告逐 case 展示使用模型、预测框、物品名、GT/审核标签和 Top3 相似 index 图片。
- [x] 3.4 汇总 box accuracy、category/name accuracy、Top3 retrieval、耗时和 go/no-go。

## 4. Readiness 与文档

- [x] 4.1 将真实 index 结果汇总到 household readiness report，区分 taxonomy-ready 和 index-ready。
- [x] 4.2 更新 README 和 `docs/vision-category-index.md`，说明真实 index 构建和评测命令。
- [x] 4.3 确保默认 runtime 仍不自动切换到未通过评测的 expanded index。

## 5. 验证

- [x] 5.1 运行 OpenSpec strict validation。
- [x] 5.2 运行 smoke manifest 生成、图片校验、OWL-ViT/CLIP index build。
- [x] 5.3 运行 household eval report 生成。
- [x] 5.4 检查生成 index entry 包含 id、region、image 和 embedding。
