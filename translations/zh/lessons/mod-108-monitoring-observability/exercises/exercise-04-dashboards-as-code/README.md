# 练习 04：Grafana 仪表盘即代码

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 03（PromQL）；Grafana 正在运行

## 目标

使用代码而非手动点击界面编写 Grafana 仪表盘，将其纳入版本管理，通过 CI 验证，并自动供应到新的 Grafana 实例。完成后，仪表盘和其他代码一样通过 Pull Request 评审。

## 为什么重要

通过界面编辑的仪表盘容易发生漂移、积累损坏的面板、被意外覆盖，且实例重建后可能丢失。仪表盘即代码像 Terraform 一样管理它们：显式定义、经过评审、可复现。团队规模增长后，这种方式尤为有用。

## 工具选项

选择一种（或实现两种进行比较）：
- **grafonnet**（Jsonnet 库）——成熟方案，Grafana Labs 自身也使用。
- **grafanalib**（Python）——对采用 Python 的团队较易使用。
- **terraform-provider-grafana**——适合已经采用 Terraform 的 IaC 技术栈。
- **Grafana provisioning + JSON 实现仪表盘即代码**——最简单，不需要 DSL。

本练习以 **Python + grafanalib** 为主。

## 要求

1. 通过代码定义三个仪表盘：API 概览、机器学习漂移、SLI/SLO 错误预算。
2. 每个仪表盘至少五个面板。
3. 模板变量（数据源、Namespace、服务）。
4. 链接部署事件的注解。
5. 每个 PR 执行 lint 与仪表盘渲染，并发布截图差异的 CI 工作流。
6. Grafana 启动时自动加载仪表盘的供应配置。

## 分步操作

### 步骤 1——配置（15 分钟）
```bash
pip install grafanalib
mkdir dashboards-as-code && cd dashboards-as-code
```

### 步骤 2——仪表盘 1：API 概览（60 分钟）
```python
# api_overview.dashboard.py
from grafanalib.core import *

dashboard = Dashboard(
    title="iris-api · overview",
    tags=["iris", "api", "ml"],
    timezone="utc",
    refresh="30s",
    templating=Templating(list=[
        Template(name="datasource", type="datasource", query="prometheus"),
        Template(name="namespace", type="query", dataSource="$datasource",
                 query="label_values(kube_pod_info, namespace)"),
    ]),
    panels=[
        Graph(title="Request rate",
              dataSource="$datasource",
              targets=[Target(expr='sum(rate(http_requests_total{namespace="$namespace"}[1m]))')]),
        Stat(title="Error rate %",
             dataSource="$datasource",
             targets=[Target(expr='100*sum(rate(http_requests_total{status=~"5..",namespace="$namespace"}[5m]))/sum(rate(http_requests_total{namespace="$namespace"}[5m]))')]),
        Graph(title="p50/p95/p99 latency",
              dataSource="$datasource",
              targets=[
                  Target(expr='histogram_quantile(0.50, sum by(le)(rate(http_request_duration_seconds_bucket[5m])))', legendFormat='p50'),
                  Target(expr='histogram_quantile(0.95, sum by(le)(rate(http_request_duration_seconds_bucket[5m])))', legendFormat='p95'),
                  Target(expr='histogram_quantile(0.99, sum by(le)(rate(http_request_duration_seconds_bucket[5m])))', legendFormat='p99'),
              ]),
        # 2 more panels
    ],
).auto_panel_ids()
```

构建生成 JSON 的 `Makefile` 目标：
```python
# build.py
from grafanalib._gen import write_dashboard
from api_overview.dashboard import dashboard
write_dashboard(dashboard, "out/api_overview.json")
```

### 步骤 3——仪表盘 2：机器学习漂移（45 分钟）
面板：逐特征 PSI（前十项柱状图）、随时间变化的预测分布（热力图）、特征分布比较（分组直方图）、漂移告警状态。

### 步骤 4——仪表盘 3：SLI/SLO（45 分钟）
参照 Google SRE Workbook：可用性 SLI、延迟 SLI、剩余错误预算仪表、消耗速率告警可视化。

### 步骤 5——CI 工作流（30 分钟）
```yaml
# .github/workflows/dashboards.yml
on: [pull_request]
jobs:
  build-and-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install grafanalib
      - run: make build
      - name: Validate JSON
        run: |
          for f in out/*.json; do
            python -m json.tool "$f" > /dev/null
            jq -e '.panels | length > 0' "$f"
          done
      - name: PromQL syntax check
        run: |
          # Extract every PromQL string and validate via promtool
          jq -r '.panels[].targets[].expr' out/*.json | \
            while read -r q; do
              echo "$q" | promtool check parse-expressions
            done
```

### 步骤 6——供应配置（15 分钟）
```yaml
# grafana/provisioning/dashboards/dashboards.yaml
apiVersion: 1
providers:
  - name: code
    folder: ML Platform
    type: file
    options:
      path: /var/lib/grafana/dashboards
```
将 `out/` 挂载至 `/var/lib/grafana/dashboards`。重启 Grafana，仪表盘随之出现。

### 步骤 7——CI 中的截图差异（30 分钟）
拓展：使用 `grafana-screenshot-action` 或无头 Chromium，对已知良好的 Prometheus 数据集截取每个仪表盘。渲染意外变化时 PR 检查失败。

## 交付物

1. 全部三个仪表盘的 Python 定义。
2. `out/` 中渲染后的 JSON。
3. CI 工作流。
4. Grafana 供应配置。
5. 说明开发流程（「如何添加新仪表盘」）的 README。

## 验证

- [ ] `make build` 生成三个 JSON 文件。
- [ ] 所有 JSON 文件均能正常导入 Grafana。
- [ ] PR 引入无效 PromQL 时 CI 失败。
- [ ] 重启 Grafana 时自动加载仪表盘。

## 拓展目标

- 添加同样通过代码生成的**告警规则**（使用 grafonnet 的 `alerts.libsonnet`）。
- 构建**仪表盘注册中心**服务器，按版本及 Git SHA 提供仪表盘。
- 实现**仪表盘所有权**：每个面板标记负责团队的 Slack 频道。

## 常见陷阱

- **自动生成的面板 ID 冲突**——始终对 Dashboard 调用 `.auto_panel_ids()`。
- **模板变量无法传播**——变量名必须在各面板中完全匹配（区分大小写）。
- **供应的仪表盘变为只读**——这正是设计目的。在代码中编辑而非界面。
- **Grafana 版本不匹配**——grafanalib 可能落后于 Grafana 版本，部分新面板类型需要手动编写 JSON。

> 译注：CI 若要检测 PromQL 语义错误，除 JSON 结构校验外，还需实际解析或执行查询；供应仪表盘能否在界面编辑由配置决定。
