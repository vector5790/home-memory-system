## ADDED Requirements

### Requirement: 高频电子影音类目覆盖
系统 SHALL 在家庭 GPC-style 类目骨架中覆盖客厅和家庭影音场景的高频电子设备叶子类目。

#### Scenario: 电子影音类目存在
- **WHEN** 生成扩展家庭 taxonomy artifact
- **THEN** active leaf 必须包含电视机、功放、AV 接收机、唱片机、书架音箱、落地音箱、有源音箱、回音壁、机顶盒、电视盒子、媒体播放器、CD 播放器、DVD/蓝光播放器、投影仪和柜机空调等高频家庭电子影音类目

#### Scenario: 类目支持中英检索
- **WHEN** 电子影音 leaf 被写入 taxonomy
- **THEN** 它必须包含中文 display name、英文 detector labels、中文淘宝 search queries、aliases 和 GPC-style 四级 lineage

#### Scenario: 标记 embedding scope
- **WHEN** 电子影音 leaf 属于本次命名索引补齐范围
- **THEN** selection TSV 必须将该 leaf 标记为需要采集图片并生成 embedding

### Requirement: 电子影音代表图采集
系统 SHALL 为新增电子影音叶子类目采集淘宝来源代表图，并保持可复现 manifest。

#### Scenario: 每个 leaf 三张图
- **WHEN** 新增电子影音 leaf 被标记为 embedding scope
- **THEN** manifest 必须为该 leaf 保留 3 张淘宝来源 gallery 图片，记录 sample id、category id、source URL、source title、image path、split 和 review status

#### Scenario: 图片不足
- **WHEN** 某个新增电子影音 leaf 未采满 3 张可用图片
- **THEN** readiness 或 source report 必须列出该 leaf、当前图片数量和失败原因

#### Scenario: 构建索引
- **WHEN** 新增电子影音图片采集完成
- **THEN** index builder 必须为成功生成主框和 embedding 的样本写入本地 household index
