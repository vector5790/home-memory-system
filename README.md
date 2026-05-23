# 家忆 Home Memory

面向中国大陆家庭的 AI native 家庭物品记忆系统原型。

第一版采用零依赖静态 Web 实现，重点验证四个体验：

- 拍照/上传后生成候选物品，用户只做确认。
- 物品绑定房间、储物点、容器、局部位置和有效期。
- 查询时返回照片地图和局部高亮，而不是只返回文字。
- 主动提醒食品、药品、耗材和设备维护。

## 运行与验证

当前以 iOS 模拟器作为默认体验和验收入口：

```bash
npm install
python3 scripts/download-vision-assets.py
npm run test:simulator
```

`npm run test:simulator` 会先构建 Web 资产、同步到 Capacitor iOS 工程，再启动 iOS 运行流程。以后功能验证以模拟器或真机为准，不再使用本地浏览器页面作为验收入口。

首次使用前需要下载本地小模型资产：

```bash
python3 scripts/download-vision-assets.py
```

这会把 Transformers.js、Grounding DINO Tiny、OWL-ViT、SlimSAM 和 CLIP 目录匹配模型放到 `vendor/`。如果要手动走 iOS App 开发，先安装 Node.js 20+ 和完整 Xcode，然后运行：

```bash
npm install
npm run build:web
npx cap add ios # 只在首次生成 ios/ 工程时需要
npm run ios:sync
npm run ios:open
```

`npm run build:web` 会把 `index.html`、`app.js`、`platform.js`、`styles.css`、`data/` 和 `vendor/` 里的本地模型资产复制到 `www/`，再由 Capacitor 同步到 iOS 工程。首次 iOS 打包前请先执行 `python3 scripts/download-vision-assets.py`，否则本地模型资产校验会失败。

如果 `xcodebuild` 提示 active developer directory 是 `/Library/Developer/CommandLineTools`，说明当前只安装或只选中了 Command Line Tools，需要安装完整 Xcode，并执行：

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

默认不需要任何付费 API。上传照片后，App 会优先调用打包在 `vendor/` 里的本地 OWL-ViT 做开放词表主体检测；Grounding DINO 保留为可配置的慢速兜底，不作为默认链路。主体点会先出现，名称会以“识别中”状态异步补全。如果小模型不可用，再明确降级到本地 Canvas 图片分析生成候选区域，用户再手动确认和改名。

## 当前范围

这是产品交互原型。当前遵循免费能力优先：

1. 初始只保留客厅、厨房、阳台、卧室这些空间名，不预置储物点和物品。
2. 用户可以手动新增空间/储物点；上传照片识别成功后也会自动生成照片点。
3. 储物点支持下级目录，例如 `客厅 > 电视柜 > 柜子A > 阿莫西林`。
4. 上传并确认后的照片会绑定到当前储物点，之后搜索路径会在真实照片上高亮物品。
5. 上传照片后，优先用 OWL-ViT 输出主体区域；Grounding DINO 作为可配置慢速兜底，Canvas 只在小模型不可用或无结果时兜底。
6. 候选命名先匹配家庭常见物品目录和可选 embedding 索引，低于阈值时显示 `物品A/B/C` 等待用户填写。
7. 云端大模型识别只作为后续可选兜底 provider，不是默认路径。

## iOS 当前实现范围

- 已添加 Capacitor iOS 工程，bundle id 为 `com.guzeyu.homememory`。
- Web 端通过 `platform.js` 统一访问运行环境、存储、文件、相机/相册和通知能力。
- iOS 相机/相册入口会优先走 Capacitor Camera，桌面浏览器仍保留文件上传和 `getUserMedia`。
- iOS 侧会尝试把处理后的照片保存到 App Data 下的 `photos/`，并在持久化快照中保留 `imageRef`。
- 云端识别不会作为 iOS 默认路径，也不会把 API key 打进 App 包。
- iOS 真机/模拟器验证清单见 `docs/ios-smoke-test.md`。

真实产品中还可以继续替换或增强为：

1. 本地小模型检测：YOLO / OWLv2 / Grounding DINO 返回候选物品和 bounding box。
2. 本地分割：SAM / SAM2 细化物品区域。
3. OCR：PaddleOCR / Tesseract 识别生产日期、有效期、品牌、规格、批号。
4. 向量检索：先用 `data/vision-index.seed.json` 的 flat cosine 小索引验证，后续全量目录再替换为 HNSW 或 PQ/量化索引。
5. 家庭知识图谱：房间、储物点、容器、物品、提醒、移动事件。
6. 本地优先隐私策略：默认本地保存，云端识别单独授权。

## 下一步

- 用联网图片搜索批量构建家庭物品图库，再离线生成 embedding 索引。
- 将云端大模型识别保留为手动触发的兜底能力。
- 增加家庭成员权限和私密物品。
- 增加二维码/NFC 标签打印。
- 增加收纳师 Pro 交付模式。
- 第二阶段接入 RoomPlan / AR 房间扫描。
