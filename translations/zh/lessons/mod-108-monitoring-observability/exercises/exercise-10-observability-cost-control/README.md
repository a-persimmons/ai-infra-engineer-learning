# 练习 10：可观测性成本控制

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 全部此前练习

## 目标

针对具有代表性的可观测性技术栈（Prometheus + Loki + Tempo + Grafana），分析各组件的成本驱动因素，应用五种降本技术（基数控制、采样、分层保留、降采样、存储类别），并产出成本与覆盖率取舍矩阵。目标：降低 60% 成本，覆盖率损失低于 5%。

## 为什么重要

可观测性账单往往是平台团队仅次于计算资源的大额云账单项目。在大规模场景中，可观测性的成本可能高于被监控系统本身。能够在不丢失关键信号的情况下减少成本的工程师具有较高价值。

## 各系统的成本驱动因素

| 系统 | 主要驱动因素 | 典型账单项目 |
|---|---|---|
| **Prometheus** | 活跃时间序列数量 × 抓取频率（原文写为抓取间隔） | 内存（TSDB Head）、磁盘（WAL 与 Block）、CPU（查询） |
| **Loki** | 摄取字节数 × 保留时间 | S3（Chunk）、索引（DynamoDB/BoltDB）、计算 |
| **Tempo** | Span 数量 × 保留时间 × 采样率 | S3（Block）、计算（Compactor） |
| **Grafana** | 每秒查询数与仪表盘数量 | 一般计算量较小，大规模时增大 |
| **云 APM（Datadog/NewRelic）** | 自定义指标、主机数、日志 GB | 由厂商针对上述项目计费 |

## 要求

1. 测量技术栈当前消耗，建立基线。
2. 应用五种降本技术：
   - 降低基数。
   - Trace 采样。
   - 指标分层保留（原始与降采样）。
   - 根据级别与服务层级保留日志。
   - 对象存储类别转换（S3 IA、Glacier）。
3. 每项技术应用后测量资源消耗。
4. 识别覆盖率损失（哪些问题无法再回答？）。
5. 包含建议的最终报告。

## 分步操作

### 步骤 1——基线（30 分钟）
针对每个组件收集：
```promql
# Prometheus active series
prometheus_tsdb_head_series

# Prometheus storage usage
prometheus_tsdb_storage_blocks_bytes

# Loki bytes ingested
sum(rate(loki_distributor_bytes_received_total[1h])) * 3600 * 24 * 30  # monthly

# Tempo spans ingested
sum(rate(tempo_distributor_spans_received_total[1h])) * 3600 * 24 * 30

# Active series breakdown by label name
topk(20, count by (__name__)({__name__=~".+"}))
```
将数据记录在 `BASELINE.md` 中。

### 步骤 2——降低基数（45 分钟）
常见主要问题来源：
- 逐用户、逐请求标签。
- 高基数 URL 路径（user_id=12345）。
- 客户 ID。

策略：
- 抓取时**删除标签**：原文示例 `relabel_configs: - action: labeldrop regex: 'request_id'`。
- **替换动态路径**：通过 metric_relabel_configs 将 `/users/<id>` → `/users/:id`。
- **导出前聚合**（使用降低标签数量的记录规则）。

应用并重新测量。原文常见结果：活跃序列减少 40–60%。

### 步骤 3——Trace 采样（30 分钟）
将基于头部的 100% 采样替换为尾部采样或概率采样：
```yaml
# OTel collector config
processors:
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: errors-and-slow
        type: and
        and:
          and_sub_policy:
            - { name: status_code, type: status_code, status_code: { status_codes: [ERROR] }}
        # 100% of errors + slow requests
      - name: probabilistic
        type: probabilistic
        probabilistic: { sampling_percentage: 1 }   # 1% of normal traffic
```
原文预计 Trace 数量下降 95% 以上，同时保留所有错误及有代表性的慢请求样本。

### 步骤 4——指标分层保留（30 分钟）
使用 Thanos 或 Cortex/Mimir 实现分层存储：
- 原始数据，15 秒分辨率：14 天。
- 降采样，五分钟分辨率：90 天。
- 降采样，一小时分辨率：两年。

配置 Thanos Compactor；验证查询旧数据时自动返回降采样结果。原文预计旧数据存储成本下降超过 70%。

### 步骤 5——按级别与层级保留日志（30 分钟）
Loki 保留策略：
- DEBUG：不摄取（在 Vector 中丢弃）。
- INFO：七天。
- WARN：30 天。
- ERROR：90 天。
- 审计日志：一年（原文合规示例）。

通过 Vector 路由实现（参照练习 05）。

### 步骤 6——S3 存储类别转换（15 分钟）
S3 生命周期规则：
- 0–30 天：STANDARD。
- 30–90 天：STANDARD_IA（原文举例便宜 50%）。
- 90 天以上：GLACIER_FLEXIBLE_RETRIEVAL（原文举例便宜 75%）。

原文建议应用于 Loki Chunk、Tempo Block、Prometheus 归档 Block。

### 步骤 7——成本与覆盖率矩阵（30 分钟）
逐项记录：
- 成本节省百分比。
- 覆盖率损失（哪些查询无法再执行？）。
- 风险（哪些场景更难调试？）。

| 技术 | 节省 | 损失 | 风险 |
|---|---|---|---|
| 删除 request_id 标签 | 35% | 无法通过 Prometheus 逐请求追踪（改用 Tempo） | 低——Tempo 保留 Trace |
| 1% 概率 Trace 采样 | 95% Trace 存储 | 未采样的正常请求 Trace | 中——通过独立策略保留 100% 错误 |
| INFO 保留期限从七天缩至三天 | 50% Loki 存储 | 无法调查三天前的 INFO 事件 | 低——原文认为多数调查涉及最近 24 小时 |
| …… | …… | …… | …… |

## 交付物

1. 包含实测数据的 `BASELINE.md`。
2. 每项技术的配置差异（Prometheus、Vector、Loki、Tempo）。
3. `COST_VS_COVERAGE.md` 矩阵。
4. `RECOMMENDATIONS.md`：团队当前阶段应采用哪些技术。

## 验证

- [ ] 至少应用五种不同的降本技术。
- [ ] 每项技术均有优化前后的测量结果。
- [ ] 测试技术栈的总成本降低至少 50%。
- [ ] 明确记录覆盖率损失，避免日后出现意外发现。

## 拓展目标

- 实现**自适应采样**：事故期间提高采样率。
- 添加**逐团队成本分配**（参照 mod-102 练习 08）。
- 构建**预算告警**：预计本月 Loki 摄取成本超过 X 美元时，通知平台团队。

## 常见陷阱

- **基数问题来自六个月前引入的标签**——活跃序列数量悄然增长。每月运行基数报告。
- **采样丢失事故信号**——优先对错误应用尾部采样保留策略，不要采样掉错误。
- **缩短保留期限违反合规要求**——审计日志通常有保留要求。明确标记并排除在降本措施之外。
- **通过降低可见性省钱**——始终记录哪些查询将无法执行。团队需要了解这些影响。

## 参考答案

engineer-solutions 仓库中的 Vector 与 Thanos 参考配置。

> 译注：指标标签通常需要 metric_relabel_configs 或在源头治理，删除标签前须避免序列冲突；记录规则不会自动减少原始数据摄取。Thanos 支持上述降采样层级，但不能假定 Cortex/Mimir 具有完全相同的机制。Glacier Flexible Retrieval 需要恢复对象后才能读取，不应直接转换仍需在线查询的数据块。保留期限及成本示例需按实际合规要求、版本与账单核实。
