# 实验 01：使用 Prometheus 为 Python 服务添加埋点

**时长：** 60 分钟  **前置条件：** Python 3.11+、Docker。

## 目标

为 FastAPI 服务添加 Counter、Histogram 和 Gauge 指标，通过 `/metrics` 暴露这些指标，在本地运行 Prometheus 抓取指标，并在界面中进行查询。

## 步骤

### 1. 示例服务
```python
# app.py
import time, random
from fastapi import FastAPI
from prometheus_client import Counter, Histogram, Gauge, make_asgi_app

REQUESTS  = Counter("predictions_total", "Total predictions", ["status"])
LATENCY   = Histogram("inference_latency_seconds", "Inference latency",
                       buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0))
INFLIGHT  = Gauge("inflight_requests", "In-flight requests")

app = FastAPI()
app.mount("/metrics", make_asgi_app())

@app.post("/predict")
async def predict(payload: dict):
    INFLIGHT.inc()
    t0 = time.perf_counter()
    try:
        # simulate inference
        time.sleep(random.uniform(0.005, 0.05))
        if random.random() < 0.02:
            REQUESTS.labels(status="error").inc()
            return {"error": "transient"}, 500
        REQUESTS.labels(status="ok").inc()
        return {"prediction": random.random()}
    finally:
        LATENCY.observe(time.perf_counter() - t0)
        INFLIGHT.dec()
```
```bash
pip install fastapi uvicorn prometheus-client
uvicorn app:app --port 8000 &
curl http://localhost:8000/metrics | head -20
```

### 2. prometheus.yml
```yaml
global: { scrape_interval: 5s }
scrape_configs:
  - job_name: app
    static_configs:
      - targets: ['host.docker.internal:8000']
```

### 3. 在 Docker 中运行 Prometheus
```bash
docker run -d --name prom -p 9090:9090 -v $PWD/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

### 4. 产生流量
```bash
for i in $(seq 1 200); do curl -s -X POST http://localhost:8000/predict -d '{}' -H 'content-type: application/json' > /dev/null; done
```

### 5. 在 Prometheus 界面中查询（http://localhost:9090）

- `predictions_total`
- `rate(predictions_total[1m])`
- `sum by (status) (rate(predictions_total[5m]))`
- `histogram_quantile(0.95, sum by (le) (rate(inference_latency_seconds_bucket[5m])))`
- `inflight_requests`

## 验证

- [ ] `/metrics` 端点返回 Prometheus 指标暴露格式。
- [ ] Prometheus Targets 页面显示 `app` 为 UP。
- [ ] 产生流量后，五条查询均返回非空数据。

## 清理
```bash
docker stop prom && docker rm prom
pkill -f uvicorn
rm prometheus.yml app.py
```

## 故障排查

- **Targets 页面显示 DOWN** — `host.docker.internal` 默认在 macOS/Windows 上解析；Linux 上使用宿主机 IP 或 `--add-host=host.docker.internal:host-gateway`。
- **`inflight_requests` 无数据** — 该 Gauge 在两次抓取之间可能回到零。添加一个运行时间较长的端点观察。
- **`histogram_quantile returns NaN`** — 窗口内样本不足；将 `[5m]` 扩大为 `[15m]` 或产生更多流量。
