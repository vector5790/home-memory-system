# 主体召回评测报告

- Run: 2026-05-25-subject-detection-cn-first10-v3-nms-run
- Review: 2026-05-25-subject-detection-review
- Generated: 2026-05-25T15:31:18.404Z
- 默认标注口径：query 图默认有效；候选框未显式标为不准确时按准确统计。

## Summary

- 样本数：10
- 已审核：8
- 有效 query：7
- 无效 query：1
- 已选最终主框：7
- 结论：当前标注口径下建议优先使用 grounding-dino 做主体检测；继续关注其主框 A/B 准确率和平均识别耗时。

## Model Variant

| 模型 | Variant | 已审核结果 | 框准确率 | 图级召回成功率 | 平均准确框/图 | 被选主框数 | 人工最佳胜率 | 平均耗时 ms | p50 ms | p95 ms | 准确框最低分 | 不准确框最高分 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| grounding-dino | normalized-1024 | 7 | 0.5857 | 1 | 5.857 | 7 | 1 | 1454.187 | 1335.134 | 1901.002 | 0.072969 | 0.272679 |
| grounding-dino | original | 7 | 0.6143 | 1 | 6.143 | 0 | 0 | 1494.198 | 1426.96 | 1822.219 | 0.072969 | 0.271138 |
| owlvit | normalized-1024 | 7 | 0.4 | 1 | 4 | 0 | 0 | 204.665 | 199.932 | 239.551 | 0.018333 | 0.072757 |
| owlvit | original | 7 | 0.3857 | 0.8571 | 3.857 | 0 | 0 | 207.907 | 202.122 | 275.947 | 0.012901 | 0.086138 |

## 无效 Query

| Image | Category | Reason |
| --- | --- | --- |
| drawer-organizer-subject-cn-01 | drawer-organizer | 这是一张毛坯房的照片，不属于抽屉分隔盒 |

## 样本明细

| Image | 类目 | 有效性 | 最佳模型 | 最终主框 |
| --- | --- | --- | --- | --- |
| storage-box-subject-cn-01 | 收纳盒 | valid | grounding-dino:normalized-1024 | storage-box-subject-cn-01:normalized-1024:grounding-dino:d01 |
| storage-basket-subject-cn-01 | 收纳篮 | valid | grounding-dino:normalized-1024 | storage-basket-subject-cn-01:normalized-1024:grounding-dino:d01 |
| drawer-organizer-subject-cn-01 | 抽屉分隔盒 | invalid | - | - |
| vacuum-storage-bag-subject-cn-01 | 真空压缩袋 | unreviewed | - | - |
| closet-organizer-subject-cn-01 | 衣柜收纳格 | valid | grounding-dino:normalized-1024 | closet-organizer-subject-cn-01:normalized-1024:grounding-dino:d01 |
| cable-organizer-box-subject-cn-01 | 线缆收纳盒 | valid | grounding-dino:normalized-1024 | cable-organizer-box-subject-cn-01:normalized-1024:grounding-dino:d01 |
| shoe-box-subject-cn-01 | 鞋盒 | valid | grounding-dino:normalized-1024 | shoe-box-subject-cn-01:normalized-1024:grounding-dino:d01 |
| underbed-storage-box-subject-cn-01 | 床底收纳箱 | unreviewed | - | - |
| folding-storage-crate-subject-cn-01 | 折叠收纳筐 | valid | grounding-dino:normalized-1024 | folding-storage-crate-subject-cn-01:normalized-1024:grounding-dino:d01 |
| document-storage-box-subject-cn-01 | 文件收纳箱 | valid | grounding-dino:normalized-1024 | document-storage-box-subject-cn-01:normalized-1024:grounding-dino:d01 |
