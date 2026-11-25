# 实验 03：将日志发送至 Loki

**时长：** 60 分钟  **前置条件：** Docker。

## 目标

在本地运行 Loki + Promtail，从 Python 服务发送结构化 JSON 日志，并在 Grafana 中使用 LogQL 查询。

## 步骤

### 1. compose.yaml
```yaml
services:
  loki:
    image: grafana/loki:3.0.0
    ports: ["3100:3100"]
    command: ["-config.file=/etc/loki/local-config.yaml"]
  promtail:
    image: grafana/promtail:3.0.0
    volumes:
      - /var/log:/var/log:ro
      - ./promtail.yaml:/etc/promtail/config.yml
      - /var/run/docker.sock:/var/run/docker.sock
    command: ["-config.file=/etc/promtail/config.yml"]
  grafana:
    image: grafana/grafana:11.1.0
    ports: ["3000:3000"]
    environment: { GF_SECURITY_ADMIN_PASSWORD: admin }
```

### 2. promtail.yaml——抓取 Docker 容器日志
```yaml
server: { http_listen_port: 9080 }
positions: { filename: /tmp/positions.yaml }
clients: [{ url: http://loki:3100/loki/api/v1/push }]
scrape_configs:
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
```

### 3. 启动服务
```bash
docker compose up -d
```

### 4. 输出结构化 JSON 的示例应用
```python
# app.py
import json, logging, sys, time, random

class JsonFmt(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "ts": time.time(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            **getattr(record, "extra", {}),
        })

h = logging.StreamHandler(sys.stdout)
h.setFormatter(JsonFmt())
log = logging.getLogger("app")
log.addHandler(h); log.setLevel(logging.INFO)

while True:
    user = f"user-{random.randint(1,100)}"
    log.info("predict", extra={"extra": {"user": user, "latency_ms": random.randint(5,200)}})
    if random.random() < 0.05:
        log.error("inference failed", extra={"extra": {"user": user}})
    time.sleep(0.5)
```

在 Docker 容器中运行应用，使 Promtail 能够采集其日志：
```bash
docker build -t app . && docker run -d --name app app
```

### 5. 在 Grafana 中添加 Loki 数据源

URL 为 `http://loki:3100`。点击 Save & Test。

### 6. LogQL 查询

- `{container="app"}` — 所有日志。
- `{container="app"} |= "error"` — 错误日志。
- `{container="app"} | json | latency_ms > 100` — JSON 过滤。
- `count_over_time({container="app"} |= "error"[5m])` — 错误计数。

## 验证

- [ ] Loki 摄取日志（在 Grafana Explore 中可见）。
- [ ] JSON 解析器提取 `latency_ms` 与 `user`。
- [ ] `latency_ms > 100` 的 LogQL 过滤条件返回日志子集。

## 清理
```bash
docker compose down -v
docker rm -f app
```

## 故障排查

- **Promtail 没有采集日志** — 检查 Docker Socket 挂载；macOS 上若标准路径不存在，使用 `/Users/<you>/.docker/run/docker.sock`。
- **`Maximum chunk age exceeded`** — 原文指出 Loki 默认保留期为 168 小时，更旧日志被丢弃。
- **JSON 解析失败** — 日志必须是单行有效 JSON；多行 JSON 需要 Promtail 的 multiline 阶段。
