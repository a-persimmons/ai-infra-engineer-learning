# 实验 05：编写多窗口错误预算消耗率告警规则

**时长：** 60 分钟  **前置条件：** Prometheus + Alertmanager。

## 目标

编写面向生产环境的 Prometheus 告警规则：经典阈值规则，以及 Google SRE 风格的多窗口错误预算消耗率告警。通过 Alertmanager 按严重级别路由至不同接收器。

## 步骤

### 1. 阈值告警
```yaml
# alerts.yml
groups:
  - name: model-api
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(predictions_total{status="error"}[5m]))
          /
          sum(rate(predictions_total[5m]))
          > 0.05
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "Error rate > 5% for 5m"
          runbook_url: "https://runbooks/high-error-rate"

      - alert: SlowResponses
        expr: |
          histogram_quantile(0.95,
            sum by (le) (rate(inference_latency_seconds_bucket[5m])))
          > 0.5
        for: 10m
        labels: { severity: warning }
        annotations:
          summary: "p95 latency > 500ms for 10m"
```

### 2. SLO 错误预算消耗率

对于 30 天内 99% 可用性的 SLO，错误预算为 1%。多窗口告警既捕获快速消耗（1 小时消耗 5% 预算），也捕获缓慢消耗（6 小时消耗 10% 预算）。
```yaml
      - alert: ErrorBudgetBurnFast
        expr: |
          (
            sum(rate(predictions_total{status="error"}[5m]))
            /
            sum(rate(predictions_total[5m]))
          ) > (14.4 * 0.01)
          and
          (
            sum(rate(predictions_total{status="error"}[1h]))
            /
            sum(rate(predictions_total[1h]))
          ) > (14.4 * 0.01)
        labels: { severity: critical }
        annotations:
          summary: "Burning 5% of monthly error budget in 1h"

      - alert: ErrorBudgetBurnSlow
        expr: |
          (
            sum(rate(predictions_total{status="error"}[30m]))
            /
            sum(rate(predictions_total[30m]))
          ) > (6 * 0.01)
          and
          (
            sum(rate(predictions_total{status="error"}[6h]))
            /
            sum(rate(predictions_total[6h]))
          ) > (6 * 0.01)
        labels: { severity: warning }
        annotations:
          summary: "Burning 10% of monthly error budget in 6h"
```
14.4 倍与 6 倍消耗率来自 Google SRE Workbook。

> 译注：30 天窗口内 14.4 倍消耗率持续 1 小时对应约 2% 的预算，原文这里的 5% 与该倍数并不一致。

### 3. 验证语法
```bash
docker run --rm -v $PWD:/work prom/prometheus:v2.51.0 \
  promtool check rules /work/alerts.yml
```

### 4. Alertmanager 配置（alertmanager.yml）
```yaml
route:
  receiver: default-slack
  group_by: [alertname, service]
  group_wait: 30s
  routes:
    - matchers: [severity = "critical"]
      receiver: pagerduty
    - matchers: [severity = "warning"]
      receiver: warnings-slack
receivers:
  - name: default-slack
    slack_configs:
      - channel: '#alerts'
        api_url: 'https://hooks.slack.com/services/T.../B.../...'
  - name: warnings-slack
    slack_configs:
      - channel: '#alerts-warnings'
        api_url: '...'
  - name: pagerduty
    pagerduty_configs:
      - service_key: '<routing-key>'
```

### 5. 在不产生真实流量的情况下测试告警路由
```bash
amtool config routes test --config.file=alertmanager.yml severity=critical
# Expected: matches the pagerduty receiver
```

### 6. 临时静默告警
```bash
amtool silence add alertname=HighErrorRate --duration=2h --comment="known issue, fix in flight"
amtool silence list
```

## 验证

- [ ] `promtool check rules` 返回 OK。
- [ ] `amtool config routes test` 按严重级别返回预期接收器。
- [ ] 手动触发告警（通过 `amtool alert add ...`）时，告警出现在正确的 Slack 频道。

## 清理
```bash
amtool silence expire $(amtool silence list -q)
```

## 故障排查

- **规则计算延迟** — `evaluation_interval` 默认 1 分钟；可缩短，但会增加 CPU 消耗。
- **`for` 子句被忽略** — 某些表达式（如 `absent`、`up`）与 `for` 结合时的表现可能不符合直觉。在依赖这些规则前先在 Prometheus 界面中测试。
- **低流量时消耗率告警一直触发** — 添加 `and sum(rate(predictions_total[1h])) > 1`，要求流量达到最低阈值后才告警。
