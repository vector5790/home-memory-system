# 视觉命名策略评测

生成时间：2026-05-28T10:33:08.945Z

## 策略对比

| 策略 | 样本 | 接受数 | 覆盖率 | 接受后准确率 | Top1/候选准确率 |
| --- | ---: | ---: | ---: | ---: | ---: |
| embedding-only | 66 | 66 | 1 | 0.2879 | 0.2879 |
| global-threshold | 66 | 9 | 0.1364 | 0.7778 | 0.1061 |
| cluster-threshold | 66 | 9 | 0.1364 | 0.7778 | 0.1061 |
| metadata-ocr-rerank | 66 | 29 | 0.4394 | 0.7586 | 0.4242 |

## 说明

- `embedding-only` 表示旧的 Top1 直接命名。
- `global-threshold` 表示全局 score/margin 阈值。
- `cluster-threshold` 表示按高混淆类目 cluster 使用独立阈值，并对家庭影音等 cluster 默认候选展示。
- `metadata-ocr-rerank` 使用 query 文本/OCR 文本/标题词对 TopK 候选做规则重排；若没有真实 OCR，则它代表文本信号可用时的离线上界。
