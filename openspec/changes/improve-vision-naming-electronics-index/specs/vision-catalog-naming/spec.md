## ADDED Requirements

### Requirement: 类目级 embedding 命名检索
系统 SHALL 在主体框 crop embedding 后按类目聚合相似索引结果，而不是仅使用单条最近邻作为最终物品名。

#### Scenario: TopK entry 聚合为类目候选
- **WHEN** 系统对一个主体 crop embedding 检索本地 index
- **THEN** 系统必须取 entry TopK，并按 `categoryId` 聚合为类目候选，候选包含类目 id、展示名、最佳分数、平均分数、命中 entry 数和代表索引图片

#### Scenario: 最终命名来自类目候选
- **WHEN** 最高类目候选满足接受阈值和 margin 阈值
- **THEN** 系统必须使用该类目的展示名作为物品名，并保留 Top3 相似索引图片用于诊断

#### Scenario: 单个坏样本不直接决定命名
- **WHEN** 单条 entry 分数最高但其类目聚合分数未满足接受条件
- **THEN** 系统不得只因为该 entry 是 Top1 就把主体命名为该 entry 的类目

### Requirement: 低置信拒识与候选展示
系统 SHALL 对低置信或相似类 margin 过小的命名结果执行拒识，避免把未知电子设备强行命名成错误类目。

#### Scenario: 分数低于阈值
- **WHEN** 最高类目候选分数低于命名接受阈值
- **THEN** 系统必须返回未知命名状态，并展示可用的候选类目而不是强行写入错误物品名

#### Scenario: Margin 过小
- **WHEN** 最高类目候选与第二候选的分数差低于 margin 阈值
- **THEN** 系统必须返回低置信命名状态，并展示至少前 3 个候选类目

#### Scenario: 用户仍可修正
- **WHEN** 系统返回未知或低置信命名状态
- **THEN** UI 必须保留主体框、候选图片和候选类目，允许用户手动确认或改名

### Requirement: 电子影音 hard-negative 命名评测
系统 SHALL 提供电子影音相似类命名评测报告，用于衡量新增索引和拒识策略是否减少错误命名。

#### Scenario: 评测相似电子设备
- **WHEN** 运行电子影音命名评测
- **THEN** 评测集必须包含投影仪、电视机、功放、AV 接收机、唱片机、电视盒子、媒体播放器、音箱和播放器等相似类样本

#### Scenario: 报告命名指标
- **WHEN** 评测完成
- **THEN** 报告必须包含 Top1 准确率、Top3 命中率、拒识率、低置信率、混淆矩阵、典型错误样例和 Top3 相似索引图

#### Scenario: 隔离主体框影响
- **WHEN** 本次评测用于判断命名质量
- **THEN** 报告必须包含 GT-crop 或审核主框的命名评测结果，避免把主体检测错误混入命名准确率
