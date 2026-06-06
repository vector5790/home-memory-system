# 视觉物品命名准确性诊断

当前图片导入链路的主要瓶颈已经从耗时转向命名准确性。主体框质量可通过手动框和 YOLOX 检测分别验证；当框已经覆盖目标主体但仍把功放、唱片机、音箱等命名成相近设备时，优先按下面几个方向排查。

## 主要原因

1. 索引覆盖不足：目标类目没有足够相似的真实索引图，TopK 里看不到同类样本时，继续调全局阈值意义有限。
2. 类目粒度不足：四级 GPC-style 叶子类目对家庭影音、线缆、收纳容器等细粒度物品仍然偏粗，需要补别名、品牌/型号/形态字段，必要时增加本地扩展层。
3. 视觉细粒度混淆：CLIP crop embedding 对外观相近、功能相近的商品区分能力有限，正确 Top1 score 和错误 Top1 score 会重叠。
4. 阈值策略不足：全局 score/margin 阈值不能适配所有类目簇，电子影音这类高混淆簇需要 cluster-level 统计后再决定阈值。
5. 候选展示不足：Top1 错但 Top3 有正确候选时，应让用户低成本纠正，并把纠正记录成后续补索引样本。

## 评测指标

命名评测报告应至少包含：

- Top1 accuracy：Top1 类目是否等于 ground truth。
- Top3 hit rate：正确类目是否出现在 Top3。
- candidate-correctable rate：Top1 错但 Top3 有正确候选的比例。
- false accept rate：系统接受命名后仍然错误的比例。
- unresolved rate：被拒识或没有最终类目名的比例。
- score/margin 分布：分别统计正确和错误样本，避免用单个全局分数判断高置信。
- error attribution：把错误拆成 subject-box-error、index-coverage-gap、category-granularity-gap、fine-grained-visual-confusion、threshold-policy-error、candidate-display-gap、unknown。

## 本地反馈闭环

App 候选物品页会保留推荐名，同时展示 Top3 候选、分数和代表索引图。用户可以选择某个候选、标记“都不对”，或直接手动输入名称。系统会在本地保存反馈样本，包含原预测、TopK、主体框、crop metadata、用户选择和时间戳；反馈不上传图片。

## 补索引策略

补索引不应只按类目数量平均推进，应按评测错误和用户反馈排序：

1. TopK 缺少同类样本的类目优先补真实代表图。
2. 同类目反复被相近类目覆盖时，优先补品牌、型号、形态、材质、使用场景差异图。
3. 多个不同物品长期压到同一个叶子类目时，先拆细本地扩展层或补别名，再采集更多图片。
4. Top3 可纠正率高的类目先优化候选展示和反馈，不必立即扩大索引。

当前可用脚本：

照片分析接口测试，输入一张真实家庭照片，输出主体检测、命名候选、TopK、诊断和耗时：

```bash
node scripts/analyze-photo-interface.mjs \
  --image /Users/guzeyu/Downloads/客厅.PNG \
  --output data/generated/photo-analysis-interface.living-room.json
```

该脚本会在 Node 里直接加载 `vendor/models/home-memory/yolox-household-subject/model.onnx` 做 YOLOX 主体检测，再用本地 CLIP crop embedding 检索 `data/vision-index.household-cn.grounding-dino-clip.json`。如果输入文件扩展名和真实格式不一致，例如 HEIC 被命名成 `.PNG`，脚本会先用 `sips` 转成可解码 JPEG。

离线命名评测报告：

```bash
node scripts/vision-catalog-naming-eval.mjs \
  --dataset data/vision-catalog-naming-eval.electronics.json \
  --index data/generated/vision-index.electronics-naming.delta.json \
  --output-json data/generated/vision-naming-accuracy-analysis.electronics.json \
  --output-html data/generated/vision-naming-accuracy-analysis.electronics.html \
  --output-md data/generated/vision-naming-accuracy-analysis.electronics.md
```
