## 1. 类目与采集范围

- [x] 1.1 梳理新增电子影音 leaf 清单，覆盖电视机、功放、AV 接收机、唱片机、音箱、回音壁、机顶盒、电视盒子、媒体播放器、CD/DVD/蓝光播放器、柜机空调等。
- [x] 1.2 更新 taxonomy source、generated categories 和 embedding selection TSV，确保新增 leaf 有中文名、英文 detector labels、淘宝 search queries 和 GPC-style 四级 lineage。
- [x] 1.3 运行 taxonomy/coverage 生成或校验命令，确认新增 leaf 出现在 active household categories 中。

## 2. 图片与索引

- [x] 2.1 复用现有淘宝采集实现，为新增 leaf 每类采集或保留 3 张 gallery 图片，并写入 manifest/source report。
- [x] 2.2 使用现有离线索引流程对新增图片生成 normalized image、主体 region 和 CLIP crop embedding。
- [x] 2.3 合并生成新的 household index，并确认新增 leaf 的 index entry、region、image path 和 embedding 均可用。

## 3. 命名检索策略

- [x] 3.1 在运行时 catalog naming 中实现 entry TopK 到 category-level candidates 的聚合。
- [x] 3.2 增加命名接受阈值和 margin 判断，低置信或 margin 过小时返回未知/候选而不是强制命名。
- [x] 3.3 保留 Top3 类目候选和代表索引图，供 UI 和诊断报告展示。

## 4. 评测报告

- [x] 4.1 构建电子影音 hard-negative 命名评测集，包含投影仪、电视机、功放、AV 接收机、唱片机、音箱和播放器等相似类。
- [x] 4.2 运行 GT-crop/审核框命名评测，输出 JSON、HTML 和 Markdown 报告。
- [x] 4.3 报告 Top1、Top3、拒识率、低置信率、混淆矩阵、典型错误和 Top3 相似索引图。

## 5. 验证与收尾

- [x] 5.1 运行 `npm run check:web` 和相关数据校验命令。
- [x] 5.2 在 iOS 模拟器重新打包启动，确认运行时使用更新后的索引和命名策略。
- [x] 5.3 更新任务状态并总结新增类目数、索引条目数、embedding 覆盖和评测结果。
