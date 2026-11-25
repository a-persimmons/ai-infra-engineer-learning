# 练习 12：逐模型成本归因

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 练习 02 与 mod-102 练习 08

## 目标

构建逐模型成本归因系统，每天告诉你「模型 X 的训练成本为 Y 美元，服务成本为 Z 美元」。在仪表盘中展示，设置逐模型预算，并在超支时告警。

## 为什么重要

团队拥有 20 个模型且云账单突然增长时，「哪个模型导致了增长？」应当在 30 秒内回答，而非经过三天调查。归因系统一次构建，可以持续产生价值。

## 要求

1. **标签**：每个 Kubernetes 资源（训练 Job、服务 Deployment）均带有 `model_name` 标签。
2. **训练成本**：GPU/CPU 时间 × 实例小时费率。
3. **服务成本**：副本数 × 对应小时费率 × 运行时间 + 逐请求费用（若采用托管服务）。
4. **存储成本**：模型产物大小 × 存储类别价格。
5. **每日 Parquet**：`s3://finops/per-model-daily/<date>.parquet`。
6. **仪表盘**：逐模型随时间变化的支出、当月支出最高的模型。
7. **预算告警**：逐模型每日支出超过预算的 1.2 倍时发送 Slack 通知。

## 分步操作

### 步骤 1——标签（30 分钟）
统一各 Deployment 的标签：
```yaml
metadata:
  labels:
    model: recs-ranker
    model_version: v3.2
    team: ml-platform
    cost_center: rec
```
通过 Kyverno 强制执行（参照 mod-103 ex-10）：
```yaml
kind: ClusterPolicy
metadata: { name: require-model-label }
spec:
  rules:
    - name: model-label
      match: { resources: { kinds: [Deployment, Job] } }
      validate:
        message: "Deployment must have `model` label"
        pattern: { metadata: { labels: { model: "?*" } } }
```

### 步骤 2——成本收集（60 分钟）
针对每天的每个模型：
```python
# collect_costs.py
import boto3, pandas as pd
from kubernetes import client, config
from datetime import datetime, timedelta

config.load_kube_config()
k8s = client.CoreV1Api()
metrics = client.CustomObjectsApi()

INSTANCE_HOURLY = {"m6i.large": 0.096, "g4dn.xlarge": 0.526, ...}

def daily_costs(date: str):
    rows = []
    # Get pod-level resource usage from Prometheus
    # Tag each by model from labels
    
    # Serving cost: replicas × instance_type × 24 hours
    for deploy in apps.list_deployment_for_all_namespaces().items:
        model = deploy.metadata.labels.get("model")
        if not model: continue
        instance = deploy.spec.template.spec.node_selector.get("instance-type", "m6i.large")
        cost = deploy.spec.replicas * INSTANCE_HOURLY[instance] * 24
        rows.append({"date": date, "model": model, "kind": "serving", "cost": cost})
    
    # Training cost: completed Jobs in the date range, duration × instance type
    for job in batch.list_job_for_all_namespaces(label_selector="model").items:
        if job.status.completion_time and job.status.completion_time.date() == date:
            duration_h = (job.status.completion_time - job.status.start_time).seconds / 3600
            model = job.metadata.labels["model"]
            instance = job.spec.template.spec.node_selector.get("instance-type", "m6i.large")
            cost = duration_h * INSTANCE_HOURLY[instance]
            rows.append({"date": date, "model": model, "kind": "training", "cost": cost})
    
    # S3 model artifact storage
    s3 = boto3.client('s3')
    for obj in s3.list_objects_v2(Bucket="model-artifacts").get("Contents", []):
        model = obj["Key"].split("/")[0]  # convention: <model>/<version>/model.joblib
        size_gb = obj["Size"] / 1e9
        cost = size_gb * 0.023        # S3 Standard
        rows.append({"date": date, "model": model, "kind": "storage", "cost": cost})
    
    return pd.DataFrame(rows)

df = daily_costs(date="2026-05-22")
df.to_parquet("s3://finops/per-model-daily/2026-05-22.parquet")
```

### 步骤 3——逐预测成本（15 分钟）
对于 LLM 或托管服务：
```python
TOKEN_COST = {"gpt-4o-mini": (0.00015, 0.0006), ...}  # ($/1K prompt, $/1K completion)

def prediction_cost(model, usage):
    p, c = TOKEN_COST[model]
    return (usage.prompt_tokens / 1000 * p) + (usage.completion_tokens / 1000 * c)
```
按日聚合。

### 步骤 4——每日 Airflow DAG（30 分钟）
```python
with DAG("collect_per_model_costs", schedule="0 6 * * *", ...) as dag:
    @task
    def collect(ds: str): df = daily_costs(ds); df.to_parquet(f"s3://...{ds}.parquet")
    @task
    def alert_budgets(ds: str):
        df = pd.read_parquet(f"s3://...{ds}.parquet")
        budgets = yaml.safe_load(open("budgets.yaml"))
        for model, group in df.groupby("model"):
            spend = group.cost.sum()
            if spend > budgets.get(model, float("inf")) * 1.2:
                slack(f"{model} spent ${spend:.2f} (budget ${budgets[model]})")
    collect("{{ ds }}") >> alert_budgets("{{ ds }}")
```

### 步骤 5——仪表盘（30 分钟）
Grafana 通过 Athena 查询（也可直接通过 DuckDB 查询 Parquet）：
- 逐模型每日成本（堆叠面积图）。
- 本月支出最高的十个模型。
- 每千次预测成本（服务模型）。
- 各模型的预算与实际支出仪表。

### 步骤 6——验证（15 分钟）
与 AWS Cost Explorer 月度总额交叉核对；目标是差异不超过 5%。

## 交付物

1. 标签策略及 Kyverno 强制执行机制。
2. `collect_costs.py` 收集脚本。
3. 每天运行的 Airflow DAG。
4. 包含至少五个模型预算的 `budgets.yaml`。
5. Grafana 仪表盘。
6. `INVESTIGATION_GUIDE.md`：成本突然上升时如何使用仪表盘。

## 验证

- [ ] 所有生产资源均具有 `model` 标签（原文验证项）。
- [ ] 已生成每日 Parquet。
- [ ] 总额与 AWS Cost Explorer 的差异在 ±5% 内。
- [ ] 人为超过预算时触发告警。

## 拓展目标

- 添加**预测**：根据过去 14 天的支出预测各模型月度支出。
- 添加**逐团队聚合**（将团队所属模型成本求和）。
- 集成**工程与财务 OKR**：按团队进行成本分摊，减少浪费。

## 常见陷阱

- **未打标签的资源**——默认归入 untagged 类别，并在仪表盘中将其作为待处理事项展示。
- **共享基础设施（PostgreSQL、Redis）**——按使用量分摊（例如某模型的键占用的 Redis 内存）。
- **Spot 价格波动**——每日成本不同；使用各时间段的加权平均值。
- **成本延迟**——AWS Cost Explorer 数据通常有延迟（原文估计约 24 小时），每日脚本应追补历史数据。

> 译注：原文的 model_name 与 model 标签命名不一致，实际实现应统一。多个副本共享同一节点时不可重复计算整个实例费用，应采用资源占用量或使用量分摊。
