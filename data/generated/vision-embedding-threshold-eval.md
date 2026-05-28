# Embedding 命名高置信阈值评估

生成时间：2026-05-28T04:21:34.652Z

## 结论

- 当前索引的 embedding 是归一化 CLIP 向量，运行时按 cosine / inner product 分数排序；分数越高越相似。
- 可以把 cosine distance 理解为 `1 - score`，所以 `score >= 0.74` 等价于 `distance <= 0.26`。
- 只用绝对距离不够，必须同时看 Top1 与第二个不同类目的 margin；电子影音这类 hard-negative 样本 margin 很小，强行命名会错。

## 建议阈值

- 保守高置信：score >= 0.74，distance <= 0.26，margin >= 0.04
- 可用高置信：score >= 0.74，distance <= 0.26，margin >= 0.03
- 不满足高置信时：展示 Top3 候选，不自动写死物品名。

## 数据集汇总

| 数据集 | 样本数 | Top1 | Top3 | 正确 Top1 score p50 | 错误 Top1 score p50 | 正确 margin p50 | 错误 margin p50 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vision-model-eval-report.gt-crop-clip-naming-cn-1000 | 50 | 0.3 | 0.42 | 0.8674 | 0.8264 | 0.0271 | 0.008 |
| vision-catalog-naming-eval.electronics | 16 | 0.25 | 0.3125 | 0.8537 | 0.8158 | 0.0098 | 0.0096 |

## 推荐操作点

| 数据集 | precision>=0.8 最大覆盖 | precision>=0.7 最大覆盖 | 最高 precision 操作点 |
| --- | --- | --- | --- |
| vision-model-eval-report.gt-crop-clip-naming-cn-1000 | score 0.5, dist 0.5, margin 0.04, precision 0.8571, coverage 0.14 | score 0.5, dist 0.5, margin 0.03, precision 0.7778, coverage 0.18 | score 0.5, dist 0.5, margin 0.05, precision 1, coverage 0.1 |
| vision-catalog-naming-eval.electronics | 无 | 无 | score 0.81, dist 0.19, margin 0.01, precision 0.4, coverage 0.3125 |

## Combined 阈值扫描 Top 20

| score | distance | margin | precision | coverage | accepted |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0.5 | 0.5 | 0.05 | 1 | 0.0758 | 5 |
| 0.51 | 0.49 | 0.05 | 1 | 0.0758 | 5 |
| 0.52 | 0.48 | 0.05 | 1 | 0.0758 | 5 |
| 0.53 | 0.47 | 0.05 | 1 | 0.0758 | 5 |
| 0.54 | 0.46 | 0.05 | 1 | 0.0758 | 5 |
| 0.55 | 0.45 | 0.05 | 1 | 0.0758 | 5 |
| 0.56 | 0.44 | 0.05 | 1 | 0.0758 | 5 |
| 0.57 | 0.43 | 0.05 | 1 | 0.0758 | 5 |
| 0.58 | 0.42 | 0.05 | 1 | 0.0758 | 5 |
| 0.59 | 0.41 | 0.05 | 1 | 0.0758 | 5 |
| 0.6 | 0.4 | 0.05 | 1 | 0.0758 | 5 |
| 0.61 | 0.39 | 0.05 | 1 | 0.0758 | 5 |
| 0.62 | 0.38 | 0.05 | 1 | 0.0758 | 5 |
| 0.63 | 0.37 | 0.05 | 1 | 0.0758 | 5 |
| 0.64 | 0.36 | 0.05 | 1 | 0.0758 | 5 |
| 0.65 | 0.35 | 0.05 | 1 | 0.0758 | 5 |
| 0.66 | 0.34 | 0.05 | 1 | 0.0758 | 5 |
| 0.67 | 0.33 | 0.05 | 1 | 0.0758 | 5 |
| 0.68 | 0.32 | 0.05 | 1 | 0.0758 | 5 |
| 0.69 | 0.31 | 0.05 | 1 | 0.0758 | 5 |

