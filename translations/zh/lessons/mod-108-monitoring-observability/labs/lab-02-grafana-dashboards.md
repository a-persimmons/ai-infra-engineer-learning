# 实验 02：从零构建 Grafana 仪表盘

**时长：** 75 分钟  **前置条件：** 实验 01；已安装 Grafana。

## 目标

搭建 Grafana，连接 Prometheus，并为 FastAPI 服务构建五面板仪表盘：每秒请求数（RPS）、错误率、p95 延迟、处理中的请求数及错误预算。

## 步骤

### 1. 运行 Grafana
```bash
docker run -d --name grafana -p 3000:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin grafana/grafana:11.1.0
```
http://localhost:3000 ，用户名 `admin`，密码 `admin`。

### 2. 添加 Prometheus 数据源

- URL：`http://host.docker.internal:9090`
- 点击 “Save & Test” → 出现绿色勾选标记。

### 3. 构建面板

对每个面板，选择 “Add visualization” → 选择 Prometheus → 粘贴查询 → 设置单位 → 保存。

**面板 1：RPS（时间序列）**

- `sum(rate(predictions_total[1m]))`
- 单位：req/s。图例：total RPS。

**面板 2：错误率（统计值）**

- `100 * sum(rate(predictions_total{status="error"}[5m])) / sum(rate(predictions_total[5m]))`
- 单位：百分比（0–100）。阈值：绿色小于 1，黄色 1–5，红色大于 5。

**面板 3：p50/p95/p99 延迟（时间序列）**

- `histogram_quantile(0.50, sum by (le) (rate(inference_latency_seconds_bucket[5m])))`，图例为 `p50`。
- p95 和 p99 使用对应分位数。
- 单位：秒。

**面板 4：处理中的请求数（时间序列）**

- `inflight_requests`

**面板 5：30 天错误预算消耗（统计值）**

- `1 - (sum(increase(predictions_total{status="error"}[30d])) / sum(increase(predictions_total[30d]))) / 0.01`
- 假定 SLO 为 99% 可用性。单位：百分比。

> 译注：上述表达式实际计算剩余错误预算比例，而不是消耗率；原文表达式保留不变。

### 4. 模板变量

Settings → Variables → 添加 `service` 变量，查询为 `label_values(predictions_total, service)`。在查询中使用 `{service=~"$service"}`。

### 5. 导出与导入

Settings → JSON Model → 复制 JSON。保存为 `dashboard.json`。恢复时在新 Grafana 中选择 “Import JSON”。

## 验证

- [ ] 数据源连接测试成功。
- [ ] 产生流量后，全部五个面板均渲染出数据。
- [ ] 时间范围选择器会影响全部面板。
- [ ] 仪表盘 JSON 可以正常导出。

## 清理
```bash
docker stop grafana && docker rm grafana
```

## 故障排查

- **所有面板显示 No data** — 数据源 URL 指向错误主机；在 Grafana 容器中执行 `docker exec grafana wget -O- http://host.docker.internal:9090/api/v1/query?query=up` 检查。
- **延迟面板返回 0** — Histogram 桶配置有误。桶计数必须是累计的（例如 0.005、0.01、0.025……）。
- **变量无法解析** — 变量查询应返回标签，而非指标值；使用 `label_values()`。
