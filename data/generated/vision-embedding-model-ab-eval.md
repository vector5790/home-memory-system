# Embedding 模型 A/B 评测

生成时间：2026-05-28T12:02:49.459Z

索引候选条目：259
Query 样本：66

| 模型 | 维度 | Top1 | Top3 | 平均 Top1 score | 平均 margin | 查询耗时均值(ms) | 索引耗时均值(ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Xenova/clip-vit-base-patch32 | 512 | 0.4242 | 0.5909 | 0.8312 | 0.0471 | 16.011 | 16.35 |
| Xenova/siglip-base-patch16-224 | 768 | 0.6212 | 0.7424 | 0.8167 | 0.0873 | 45.014 | 45.395 |
| onnx-community/siglip2-base-patch16-224-ONNX | 768 | 0.5152 | 0.5758 | 0.9292 | 0.0233 | 44.904 | 44.452 |

## 说明

- SigLIP 输出 dense patch features，本脚本对 patch 维做 mean pooling 后再归一化。
- 为避免首次 A/B 过慢，本评测只使用已有评测样本相关类目和高混淆 cluster 的索引条目，不是全量 3075 条索引。
- 图片文件只从本地缓存读取，不进入 Git。
