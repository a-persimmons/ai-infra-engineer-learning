# 实验 06：通过流量拆分进行 A/B 测试

**时长：** 60 分钟  **前置条件：** kind 集群；已安装 Istio（`istioctl install -y`）。

## 目标

并行部署两个模型版本，按 50/50 拆分流量，按版本记录预测结果，并通过简单统计检验计算哪个版本表现更好。

## 步骤

### 1. 部署 v1 和 v2
```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: iris-v1, labels: { app: iris, version: v1 } }
spec:
  replicas: 2
  selector: { matchLabels: { app: iris, version: v1 } }
  template:
    metadata: { labels: { app: iris, version: v1 } }
    spec: { containers: [{ name: api, image: iris-api:0.2, ports: [{ containerPort: 8000 }] }] }
---
# Same for iris-v2 with image iris-api:0.3 and label version: v2
```

### 2. 使用一个 Service 覆盖两个版本
```yaml
apiVersion: v1
kind: Service
metadata: { name: iris }
spec:
  selector: { app: iris }
  ports: [{ port: 80, targetPort: 8000 }]
```

### 3. 用 Istio VirtualService 实现 50/50 流量拆分
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata: { name: iris }
spec:
  host: iris
  subsets:
    - { name: v1, labels: { version: v1 } }
    - { name: v2, labels: { version: v2 } }
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: { name: iris }
spec:
  hosts: [iris]
  http:
    - route:
        - destination: { host: iris, subset: v1 }
          weight: 50
        - destination: { host: iris, subset: v2 }
          weight: 50
```

### 4. 产生流量并收集结果

API 在响应中包含模型版本。采集它们：
```bash
for _ in {1..500}; do
  curl -s -X POST http://iris.default/predict -H 'content-type: application/json' \
    -d '{"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2}'
done | jq -r .model_version | sort | uniq -c
```
预期流量比例约为 50/50。

### 5. 按版本记录结果（点击率、转化率）

在真实测试中，应记录与各请求关联的下游业务指标。本实验通过合成结果生成器进行模拟：
```python
import requests, random, csv
rows = []
for _ in range(2000):
    r = requests.post("http://iris.default/predict", json={...}).json()
    success = random.random() < (0.85 if r["model_version"]=="v2" else 0.80)
    rows.append([r["model_version"], int(success)])
csv.writer(open("results.csv","w")).writerows(rows)
```

### 6. 分析
```python
import pandas as pd
from scipy import stats
df = pd.read_csv("results.csv", names=["version","success"])
pivot = df.groupby("version").agg(["mean","count"])
print(pivot)
res = stats.proportions_ztest(
    df.groupby("version")["success"].sum(),
    df.groupby("version")["success"].count(),
)
print("p-value:", res[1])
```

## 验证

- [ ] 流量比例约为 50/50（500 次以上请求时，偏差在 ±5% 内）。
- [ ] 采集的结果能识别每个请求命中的版本。
- [ ] Z 检验产生 p 值；模拟 2,000 次试验、提升 5 个百分点时，预期 p 小于 0.05。

## 清理
```bash
kubectl delete deploy iris-v1 iris-v2
kubectl delete svc iris
kubectl delete destinationrule iris
kubectl delete virtualservice iris
```

## 故障排查

- **全部流量进入 v1** — 未应用 VirtualService，或未注入 Istio。为命名空间添加标签：`kubectl label ns default istio-injection=enabled`。
- **`p-value` 始终很小** — 生成了相关联的合成结果；改用独立随机采样。
- **拆分比例为 70/30 而非 50/50** — 连接池会将每个客户端的流量固定下来。每次请求使用新客户端，或增加样本量 n。
