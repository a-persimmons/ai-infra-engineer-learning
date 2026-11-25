# 练习 07：Alertmanager 路由与通知策略

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 练习 03（PromQL）；Alertmanager 正在运行

## 目标

编写接近生产环境的告警规则（阈值与 SLO 消耗速率），通过 Alertmanager 路由树按严重程度选择接收方（PagerDuty + Slack + 邮件），实现抑制、静默与分组，并使用合成事故演示端到端流程。

## 为什么重要

不合理的告警会使工程师逐渐忽略告警。认真设计路由（正确严重程度、正确渠道、正确人员）才能使值班呼叫真正转化为行动。

## 要求

1. **告警规则**（共十项）：阈值规则及两项多窗口 SLO 消耗速率规则。
2. **路由树**至少包含三个接收方（PagerDuty、Slack-critical、Slack-warnings）。
3. **抑制规则**减少噪声（例如 TargetDown 抑制下游 HighErrorRate）。
4. **Group_by 规则**将相关告警合并。
5. 针对已知问题的**静默**（CLI、API 与界面操作）。
6. 可读的 Slack 与 PagerDuty 消息**模板**。
7. 端到端测试：通过 `amtool` 触发各严重程度的告警，验证接收方行为。

## 分步操作

### 步骤 1——告警规则（45 分钟）
```yaml
# alerts.yml
groups:
  - name: model-api
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{job="model-api",status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total{job="model-api"}[5m]))
          > 0.05
        for: 5m
        labels: { severity: critical, service: model-api, team: ml-platform }
        annotations:
          summary: "5xx error rate > 5% for 5m"
          runbook_url: "https://runbooks/high-error-rate"

      - alert: TargetDown
        expr: up{job="model-api"} == 0
        for: 2m
        labels: { severity: critical, service: model-api }
        annotations: { summary: "Prometheus target down" }

      - alert: ErrorBudgetBurnFast
        expr: |
          (sum(rate(http_requests_total{status=~"5..",job="model-api"}[5m])) / sum(rate(http_requests_total{job="model-api"}[5m]))) > (14.4 * 0.01)
          and
          (sum(rate(http_requests_total{status=~"5..",job="model-api"}[1h])) / sum(rate(http_requests_total{job="model-api"}[1h]))) > (14.4 * 0.01)
        labels: { severity: critical, service: model-api, slo: availability }
        annotations: { summary: "Burning 5% of monthly error budget in 1h" }

      # ... 7 more covering latency, queue depth, restarts, drift, infrastructure
```

### 步骤 2——路由树（45 分钟）
```yaml
# alertmanager.yml
route:
  receiver: default-slack
  group_by: [alertname, cluster, service]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  routes:
    - matchers: [severity = "critical"]
      receiver: pagerduty
      continue: true
    - matchers: [severity = "critical"]
      receiver: slack-critical
    - matchers: [severity = "warning"]
      receiver: slack-warnings
    - matchers: [team = "data-platform"]
      receiver: data-platform-slack

inhibit_rules:
  - source_matchers: [severity = "critical"]
    target_matchers: [severity =~ "warning|info"]
    equal: [alertname, service, cluster]
  - source_matchers: [alertname = "TargetDown"]
    target_matchers: [alertname =~ "HighErrorRate|SlowResponse"]
    equal: [service, cluster]

receivers:
  - name: default-slack
    slack_configs:
      - channel: '#alerts'
        send_resolved: true
        title:  '{{ template "slack.title" . }}'
        text:   '{{ template "slack.text" . }}'
  - name: slack-critical
    slack_configs:
      - channel: '#alerts-critical'
        color: danger
        ... 
  - name: slack-warnings
    slack_configs:
      - channel: '#alerts-warnings'
  - name: pagerduty
    pagerduty_configs:
      - service_key_file: /etc/alertmanager/secrets/pagerduty
        severity: '{{ .CommonLabels.severity }}'
        details:
          runbook: '{{ .CommonAnnotations.runbook_url }}'
  - name: data-platform-slack
    slack_configs:
      - channel: '#data-platform-alerts'
```

### 步骤 3——模板（30 分钟）
```
# templates.tmpl
{{ define "slack.title" }}
  {{- if eq .Status "firing" -}}:fire:{{- else -}}:white_check_mark:{{- end }}
  [{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}]
  {{ .CommonLabels.alertname }} on {{ .CommonLabels.service }}
{{ end }}
{{ define "slack.text" }}
{{ range .Alerts }}
*Summary:* {{ .Annotations.summary }}
*Severity:* {{ .Labels.severity }}
{{ if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{ end }}
{{ end }}
{{ end }}
```

### 步骤 4——端到端测试（30 分钟）
```bash
# Fire a fake alert
amtool alert add \
  alertname=HighErrorRate severity=critical service=model-api \
  --annotation=summary="synthetic test from amtool"

# Check delivery in Slack #alerts-critical and PagerDuty.

# Silence it for an hour
amtool silence add alertname=HighErrorRate --duration=1h --comment="testing"

# Verify routing
amtool config routes test --config.file=alertmanager.yml severity=warning team=ml-platform
# Should report: warnings-slack receiver matched
```

### 步骤 5——验证抑制（15 分钟）
针对同一服务同时触发 TargetDown 和 HighErrorRate。应仅由 TargetDown 发送通知，错误率告警被抑制。

### 步骤 6——面向生产的分组（15 分钟）
确认：同时出现 50 条 HighErrorRate 告警（每个 Pod 一条）时，将它们合并为一条通知，而非 50 次独立呼叫。

## 交付物

1. 包含全部十项规则的 `alerts.yml`。
2. 包含路由与抑制规则的 `alertmanager.yml`。
3. 包含定制 Slack 与 PagerDuty 消息的 `templates.tmpl`。
4. `ALERTING_PHILOSOPHY.md`：何时告警、严重程度是什么、运行手册应符合什么标准。
5. 端到端流程的演示录像或截图。

## 验证

- [ ] `amtool config routes test` 确认各严重程度均到达预期接收方。
- [ ] 合成严重告警产生 PagerDuty 事故，并在 #alerts-critical 发送 Slack 消息。
- [ ] 抑制机制可明确抑制较低严重程度的告警。
- [ ] 分组将相关告警合并为一条通知。
- [ ] 静默阻止通知，但不会移除告警。

## 拓展目标

- 添加**按时间窗口路由**：特定告警仅在工作时间呼叫（`time_intervals`）。
- 在 PagerDuty 添加**升级策略**：15 分钟内未确认则升级至下一位值班人员。
- 集成 **incident.io** 或 **Squadcast**，进行跨渠道事故管理。

## 常见陷阱

- **通知泛滥**——通常源于错误的 group_by。按真正有关联的标签分组（alertname + cluster），而非 request_id。
- **无法采取行动的严重告警**——每项值班呼叫都应有运行手册。如果没有手册，原文建议降为 warning。
- **路由树遮蔽**——子路由按顺序匹配；除非设置 continue: true，否则首个匹配的路由生效。使用 amtool 测试。
- **模板无法渲染**——使用 `amtool template render` 测试；原文认为损坏的模板可能发送默认原始文本。

> 译注：严重程度应由实际业务影响与响应要求决定，不能仅因缺少运行手册而自动降级；模板错误可能导致通知失败，应检查 Alertmanager 日志与通知失败指标。
