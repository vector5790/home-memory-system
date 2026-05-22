# 家忆 Home Memory

面向中国大陆家庭的 AI native 家庭物品记忆系统原型。

第一版采用零依赖静态 Web 实现，重点验证四个体验：

- 拍照/上传后生成候选物品，用户只做确认。
- 物品绑定房间、储物点、容器、局部位置和有效期。
- 查询时返回照片地图和局部高亮，而不是只返回文字。
- 主动提醒食品、药品、耗材和设备维护。

## 运行

推荐直接用 macOS 自带的 Python 启动：

```bash
python3 server.py 4173
```

首次使用前可以先下载本地小模型资产：

```bash
npm install
python3 scripts/download-vision-assets.py
```

这会把 Transformers.js、Grounding DINO Tiny、OWL-ViT、SlimSAM 和 CLIP 目录匹配模型放到 `vendor/`。之后启动服务：

```text
http://localhost:4173/?v=20260523-owlvit-default
```

默认不需要任何付费 API，也不会自动把照片发给远程视觉模型。上传照片后，浏览器会优先调用 `vendor/` 里的本地 OWL-ViT 做开放词表主体检测，再对主体 crop 使用本地 CLIP embedding 匹配类目索引完成命名；主体点和连线标签会先出现，名称会以“识别中”状态异步补全。如果本地 OWL-ViT 还没下载，会退回本地 Grounding DINO；如果本地小模型资产不可用，再明确降级到本地 Canvas 图片分析生成候选区域，用户再手动确认和改名。

如果你的 PowerShell 能直接识别 `node`，也可以使用 Node 服务：

```powershell
node server.mjs 4173
```

如果提示 `node` 无法识别，直接运行启动脚本：

```powershell
.\start.bat
```

或者：

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

## 当前范围

这是产品交互原型。当前遵循免费能力优先：

1. 初始只保留客厅、厨房、阳台、卧室这些空间名，不预置储物点和物品。
2. 用户可以手动新增空间/储物点；上传照片识别成功后也会自动生成照片点。
3. 储物点支持下级目录，例如 `客厅 > 电视柜 > 柜子A > 阿莫西林`。
4. 上传并确认后的照片会绑定到当前储物点，之后搜索路径会在真实照片上高亮物品。
5. 上传照片后，默认用本地 OWL-ViT 输出主体区域，再用本地 CLIP crop embedding 命名；Grounding DINO 只作为 learned-model 备选，Canvas 只在本地小模型不可用或无结果时兜底，不自动调用远程视觉模型。
6. 候选命名先匹配家庭常见物品目录和可选 embedding 索引，低于阈值时显示 `物品A/B/C` 等待用户填写。
7. 云端大模型识别只作为后续可选兜底 provider，不是默认路径。

真实产品中还可以继续替换或增强为：

1. 本地小模型检测：YOLO / OWLv2 / Grounding DINO 返回候选物品和 bounding box。
2. 本地分割：SAM / SAM2 细化物品区域。
3. OCR：PaddleOCR / Tesseract 识别生产日期、有效期、品牌、规格、批号。
4. 向量检索：先用 `data/vision-index.seed.json` 的 flat cosine 小索引验证，后续全量目录再替换为 HNSW 或 PQ/量化索引。
5. 家庭知识图谱：房间、储物点、容器、物品、提醒、移动事件。
6. 本地优先隐私策略：默认本地保存，云端识别单独授权。

## 类目索引实验

当前仓库包含一个小型家庭物品类目索引管线，用来在大规模图片推理前验证本地 embedding 的检索效果：

```bash
python3 scripts/vision-category-index.py import-taxonomy
python3 scripts/vision-category-index.py validate
python3 scripts/vision-category-index.py evaluate
python3 scripts/vision-category-index.py build-index
```

这会从 `data/vision-taxonomy-source.seed.json` 生成四级类目 fixture，校验 `data/vision-samples.seed.json`，输出 `data/generated/vision-evaluation.seed.json`，并在评估通过后生成 `data/vision-index.generated.json`。浏览器端会优先加载生成索引，失败时回退到 `data/vision-index.seed.json`。

## 本地视觉模型评测

开发和验收默认走脚本模拟器，不需要打开浏览器人工检查。浏览器只作为产品交互入口，评测报告生成、Top3 索引展示和指标校验都用下面的命令复现。

评测主体框、物品名和 Top3 本地索引相似图。`create-fixtures` 是脚本链路自测；真实模型评测应使用 `benchmark --run-local-models`：

```bash
python3 scripts/vision-model-eval.py create-fixtures
python3 scripts/vision-model-eval.py fixture-predictions
python3 scripts/vision-model-eval.py evaluate
```

输出：

- `data/generated/vision-model-eval-report.seed.html`：可视化报告，包含输入图、GT 框、预测框、物品名和 Top3 相似索引图。
- `data/generated/vision-model-eval-report.seed.json`：结构化指标和逐图结果。
- `data/generated/vision-model-eval-report.seed.md`：摘要测试报告。

真实照片评测夹具：

```bash
python3 scripts/vision-model-eval.py create-real-photo-set --download
python3 scripts/vision-model-eval.py evaluate \
  --dataset data/vision-model-eval.real.json \
  --predictions data/generated/vision-model-predictions.real.gt-assisted.json \
  --index data/vision-index.real.json \
  --output-json data/generated/vision-model-eval-report.real.json \
  --output-html data/generated/vision-model-eval-report.real.html \
  --output-md data/generated/vision-model-eval-report.real.md
```

真实照片来源记录在 `data/vision-real-photo-sources.json`，query 图有人工 GT 框；`data/vision-index.real.json` 使用真实 gallery 图片展示 Top3 相似索引图。注意：`vision-model-predictions.real.gt-assisted.json` 是用 GT 辅助生成的评测链路基线，不代表本地模型真实跑分；安装 `vendor/` 模型并接入预测器后，应替换为真实预测输出再跑 `evaluate`。

真实本地模型 benchmark 会离线运行 Grounding DINO、OWL-ViT、SlimSAM、CLIP naming、Canvas baseline 和 GT-assisted fixture，并按 provider 分开计算准确率、耗时和 go/no-go：

```bash
python3 scripts/vision-model-eval.py preflight-assets --strict
python3 scripts/vision-model-eval.py benchmark \
  --run-local-models \
  --evaluate \
  --providers owlvit,owlvit-sam,grounding-dino,grounding-dino-sam,clip-naming,canvas-baseline,gt-assisted
```

核心输出：

- `data/generated/vision-model-predictions.real.benchmark.json`：所有 provider 的预测、框、物品名、Top3 索引匹配、失败原因和逐阶段耗时。
- `data/generated/vision-model-benchmark-raw.real.json`：完整原始 benchmark artifact。
- `data/generated/vision-model-eval-report.benchmark.{json,html,md}`：最终评测报告。

报告中的 `real-local-model` 才参与本地模型 go/no-go；`canvas-baseline` 只是非模型兜底，`gt-assisted-fixture` 只验证报告链路。当前小样本 fixture 下，OWL-ViT/OWL-ViT+SlimSAM 通过默认门槛，Grounding DINO 和纯 CLIP naming 未通过，后续扩大类目/图片前应优先复核这些 provider 的 box recall 与 combined accuracy。

## 下一步

- 用联网图片搜索批量构建家庭物品图库，再离线生成 embedding 索引。
- 将云端大模型识别保留为手动触发的兜底能力。
- 增加家庭成员权限和私密物品。
- 增加二维码/NFC 标签打印。
- 增加收纳师 Pro 交付模式。
- 第二阶段接入 RoomPlan / AR 房间扫描。
