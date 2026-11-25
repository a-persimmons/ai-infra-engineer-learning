# 练习 08：实现 SLI、SLO 与错误预算

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** 练习 03 与 07

## 目标

为 iris-api 服务正式定义 SLI、设定 SLO、计算错误预算，设置多个时间窗口的消耗速率告警，并产出季度 SLO 评审模板。完成后，你将把 Google SRE Workbook 中的模式应用至真实服务。

## 为什么重要

SLO 是工程团队与产品、管理层就可靠性及功能交付速度进行协商的依据。没有 SLO 的团队可能在脆弱（要求修复每次告警）与松懈（不知道何时出现严重问题）之间摇摆。SLO 使讨论拥有量化基础。

## 背景

依次理解三个概念：

- **SLI（Service Level Indicator，服务等级指标）：** 实测比例 `good_events / total_events`。iris-api 的两个 SLI：
  - 可用性 SLI = `successful_requests / total_requests`。
  - 延迟 SLI = `requests_under_threshold / total_requests`。

- **SLO（Service Level Objective，服务等级目标）：** 为 SLI 设定的目标：
  - 可用性 SLO：30 天内达到 99.5%。
  - 延迟 SLO：30 天内 95% 的请求低于 200ms。

- **错误预算：** 允许错误的比例为 `1 - SLO`。对于 99.5%，预算为总事件数量的 0.5%。错误预算消耗速度明显超过可持续速率时，按告警策略呼叫值班人员。

## 要求

1. 将 SLI 定义为 PromQL 记录规则。
2. 设定量化 SLO。
3. 计算剩余错误预算。
4. 实现多窗口、多消耗速率告警（参照 Google SRE Workbook）。
5. 构建展示预算消耗的 Grafana 面板。
6. 编写季度 SLO 评审模板。

## 分步操作

### 步骤 1——将 SLI 定义为记录规则（30 分钟）
```yaml
# sli-rules.yml
groups:
  - name: iris-api-sli
    interval: 30s
    rules:
      - record: sli:availability:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{job="iris-api",status!~"5.."}[5m]))
          /
          sum(rate(http_requests_total{job="iris-api"}[5m]))

      - record: sli:latency:ratio_rate5m
        expr: |
          sum(rate(http_request_duration_seconds_bucket{job="iris-api",le="0.200"}[5m]))
          /
          sum(rate(http_request_duration_seconds_count{job="iris-api"}[5m]))
```

### 步骤 2——设定 SLO（15 分钟）
```yaml
slo_availability: 0.995          # 99.5% over 30d
slo_latency:      0.95            # 95% under 200ms over 30d
budget_window:    30d
```

### 步骤 3——计算剩余预算（30 分钟）
```promql
# Availability error budget remaining (fraction 0..1):
1 - (
  (1 - sum(rate(http_requests_total{job="iris-api",status!~"5.."}[30d])) / sum(rate(http_requests_total{job="iris-api"}[30d])))
  / 0.005
)
```

### 步骤 4——多窗口消耗速率告警（60 分钟）
根据 SRE Workbook，在两个不同时间窗口都指示快速消耗时告警：

```yaml
# Critical: 5% of monthly budget in 1h
- alert: ErrorBudgetBurnFast
  expr: |
    (1 - sli:availability:ratio_rate5m) > (14.4 * 0.005)
    and
    (1 - sli:availability:ratio_rate1h) > (14.4 * 0.005)
  labels: { severity: critical, slo: availability }

# Warning: 10% of monthly budget in 6h
- alert: ErrorBudgetBurnSlow
  expr: |
    (1 - sli:availability:ratio_rate30m) > (6 * 0.005)
    and
    (1 - sli:availability:ratio_rate6h) > (6 * 0.005)
  labels: { severity: warning, slo: availability }
```

消耗速率：
- 14.4 倍：约 50 小时耗尽 30 天的预算 → 快速消耗严重告警（长窗口为一小时）。
- 6 倍：约五天耗尽预算 → 慢速消耗警告（长窗口为六小时）。

你还需要较长窗口的记录规则：
```yaml
- record: sli:availability:ratio_rate30m
  expr: sum(rate(http_requests_total{job="iris-api",status!~"5.."}[30m])) / sum(rate(http_requests_total{job="iris-api"}[30m]))
- record: sli:availability:ratio_rate1h
  expr: ...
- record: sli:availability:ratio_rate6h
  expr: ...
```

### 步骤 5——Grafana SLO 面板（45 分钟）
创建仪表盘：
- **大数字**：剩余错误预算百分比（低于 25% 为红色、25% 至不足 50% 为黄色、至少 50% 为绿色）。
- **趋势图**：过去 30 天的 SLI 与 SLO 目标线。
- **消耗速率迷你趋势图**：5 分钟、30 分钟、一小时、六小时窗口的消耗速率。
- **预测**：按当前速率，何时耗尽预算？

### 步骤 6——季度 SLO 评审模板（30 分钟）
`SLO_REVIEW_TEMPLATE.md`：
```markdown
## Q[N] SLO Review — iris-api

**Period:** YYYY-MM-DD to YYYY-MM-DD

| SLO | Target | Actual | Met? | Budget consumed |
|---|---|---|---|---|
| Availability | 99.5% | 99.62% | ✅ | 76% |
| Latency p95 < 200ms | 95% | 91.4% | ❌ | 172% (exhausted) |

### Incidents this quarter
- 2026-04-15: 22-min outage on auth dep → 0.3% budget hit
- 2026-05-02: latency regression from v3.4 → 1.1% sustained budget hit

### Reliability work prioritized next quarter
- (Drawn from incident postmortem action items + the failing SLO above)

### SLO changes proposed
- Latency target was too aggressive given downstream feature-store p99; propose moving to 95% < 250ms.
```

## 交付物

1. SLI 记录规则（`sli-rules.yml`）。
2. 消耗速率告警规则。
3. Grafana SLO 仪表盘 JSON。
4. `SLO_REVIEW_TEMPLATE.md`。
5. `SLO_PHILOSOPHY.md`：团队如何利用 SLO 做取舍决策。

## 验证

- [ ] 全部记录规则均可正确计算（使用 `promtool check rules` 检查规则）。
- [ ] 合成持续故障（例如 30 分钟内错误率为 10%）按预期触发 ErrorBudgetBurnSlow（原文测试目标）。
- [ ] SLO 仪表盘正确显示剩余预算。
- [ ] 至少针对一个季度的数据填写季度评审模板。

## 拓展目标

- 添加**按时间窗口区分的 SLO**（例如工作时间 99.9%，非工作时间 99%）。
- 使用 **Sloth** 或 **Pyrra**，通过更简单的 YAML 规范生成 SLO 配置。
- 实现**策略门禁**：剩余错误预算低于 20% 时拒绝部署。

## 常见陷阱

- **SLI 定义存在争议**——达成一致并记录。「4xx 算错误吗？」通常不算，因为它可能是客户端问题。
- **按照愿望设定 SLO**——应根据实际可持续能力设定，而非理想值。提高 SLO 比降低更容易获得认同。
- **达到 SLO 阈值才告警**——刚耗尽预算时才呼叫已经太晚。应通过消耗速率提前告警。
- **忽视预算耗尽**——预算耗尽时，可靠性工作应升至最高优先级；否则 SLO 只是装饰。

> 译注：多窗口告警判断的是窗口内平均消耗速率，而非要求错误持续满整个长窗口。若六小时窗口此前无错误、流量均匀，30 分钟 10% 错误率对应 0.5% 错误预算的约 1.67 倍长窗口消耗速率，不一定触发 6 倍规则。应针对实际规则构造测试，并使用 promtool test rules 验证计算与告警逻辑。
