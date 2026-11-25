# 练习 11：机器学习流水线编排模式

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 02（原文标注 Airflow）；mod-105 练习 02 与 11

## 目标

实现四种机器学习编排模式——每模型一个 DAG、参数化 DAG、事件驱动与持续训练——分析其取舍。针对真实场景选择适当模式。

## 为什么重要

编排模式的选择决定平台复杂度。选择不当（例如对 200 个模型采用逐模型 DAG）会形成难以管理的大量代码；过度延迟绑定（例如对常规批处理使用事件驱动）则可能隐藏简单的 Bug。

## 四种模式

### 模式 1：每模型一个 DAG
每个模型对应一个 Airflow DAG 文件。明确、易读，代码规模随模型数量线性增长。

### 模式 2：参数化 DAG
一个由 YAML 配置驱动的 DAG 文件，内部遍历模型。

### 模式 3：事件驱动
由事件触发流水线（新数据、检测到漂移、调度事件）。K8s 上常使用 KEDA 或 Argo Events。

### 模式 4：持续训练
流式模式：摄取事件 → 更新特征 → 增量训练 → 部署。没有独立的批次运行。

## 要求

对包含三个模型（推荐、欺诈检测、生命周期价值）的平台实现每种模式。针对每种：
1. 提供可用代码。
2. 添加第四个模型并测量：需要多少新代码、多少配置、多少时间？
3. 记录故障模式：一个模型的数据出现问题时会发生什么？

## 分步操作

### 步骤 1——定义三个模型（15 分钟）
```yaml
# models.yaml
- name: recs-ranker
  schedule: "@daily"
  source: events.click
  features_view: recs_features
  algorithm: gradient_boosting
- name: fraud-detector
  schedule: "*/30 * * * *"          # every 30 min
  source: transactions
  features_view: fraud_features
  algorithm: random_forest
- name: ltv-predictor
  schedule: "@weekly"
  source: purchases
  features_view: ltv_features
  algorithm: xgboost
```

### 步骤 2——模式 1：每模型一个 DAG（30 分钟）
`dags/` 中的三个文件：
- `recs_ranker.py`
- `fraud_detector.py`
- `ltv_predictor.py`

每个约 100 行代码，略有差异。添加 `cltv-predictor` = 复制文件并修改约 20 行。

```python
# dags/recs_ranker.py
from datetime import datetime
from airflow import DAG
from airflow.decorators import task

with DAG("recs_ranker", schedule="@daily", start_date=datetime(2026,1,1)) as dag:
    @task
    def fetch(): ...
    @task
    def train(): ...
    @task
    def evaluate(): ...
    fetch() >> train() >> evaluate()
```

### 步骤 3——模式 2：参数化 DAG（45 分钟）
单一文件，依据配置生成 DAG：
```python
# dags/factory.py
import yaml
from airflow import DAG
from airflow.decorators import task

CONFIG = yaml.safe_load(open("/opt/airflow/config/models.yaml"))

for model_cfg in CONFIG:
    dag_id = f"train_{model_cfg['name']}"
    
    with DAG(dag_id, schedule=model_cfg["schedule"],
             start_date=datetime(2026,1,1),
             tags=["ml", model_cfg["name"]]) as dag:
        @task(task_id=f"fetch_{model_cfg['name']}")
        def fetch(source=model_cfg["source"]): ...
        @task(task_id=f"train_{model_cfg['name']}")
        def train(algorithm=model_cfg["algorithm"]): ...
        @task(task_id=f"eval_{model_cfg['name']}")
        def evaluate(): ...
        fetch() >> train() >> evaluate()
    
    globals()[dag_id] = dag
```

添加第四个模型只需在 YAML 中增加一个条目，无需新代码。

### 步骤 4——模式 3：事件驱动（60 分钟）
在 Kubernetes 上使用 Argo Events + Argo Workflows：
```yaml
# event-source.yaml
apiVersion: argoproj.io/v1alpha1
kind: EventSource
metadata: { name: s3-new-data }
spec:
  type: s3
  s3:
    bucket: { name: ml-raw }
    events: [s3:ObjectCreated:*]
```
```yaml
# sensor.yaml — translates event into workflow trigger
apiVersion: argoproj.io/v1alpha1
kind: Sensor
metadata: { name: train-on-new-data }
spec:
  triggers:
    - template:
        argoWorkflow:
          source:
            resource: { ... ref to WorkflowTemplate train-model ... }
          parameters:
            - src: { dependencyName: s3-new-data, dataKey: body.s3.object.key }
              dest: spec.arguments.parameters.0.value
```

新文件到达 → 触发工作流 → 模型基于该数据切片训练。

### 步骤 5——模式 4：持续训练（60 分钟）
流式处理：每 N 个事件执行一次增量模型更新。
```python
# online_update.py
import joblib, redis, json
from kafka import KafkaConsumer
from sklearn.linear_model import SGDClassifier

model = joblib.load("model.joblib")
r = redis.Redis()
c = KafkaConsumer("events", value_deserializer=lambda v: json.loads(v))

BATCH_SIZE = 1000
buffer = []
for msg in c:
    buffer.append(msg.value)
    if len(buffer) >= BATCH_SIZE:
        X = [...]; y = [...]
        model.partial_fit(X, y, classes=[0,1])
        joblib.dump(model, "model.joblib")
        r.publish("model:updated", json.dumps({"trained_on": len(buffer)}))
        buffer = []
```
生产环境：搭配影子部署，在晋升之前验证每次更新。

### 步骤 6——比较（30 分钟）
```markdown
| Pattern | Adding 4th model | Failure isolation | Operational complexity |
|---|---|---|---|
| DAG per model | +1 file, ~100 LOC | Excellent (model A's bug can't touch model B) | Low |
| Parametric | +1 YAML entry | Medium (parsing bug breaks all) | Low |
| Event-driven | +1 sensor + workflow template | Excellent | High (Argo learning curve) |
| Continuous | Substantial refactor | Poor (streaming bug affects everything) | High |
```

### 步骤 7——场景选择（15 分钟）
原文列出四个场景：
1. **小团队的三个常规批处理模型**——模式 2（参数化，组件最少）。
2. **50 个批处理模型，各团队具有自定义逻辑**——模式 1（逐模型 DAG，由各团队负责）。
3. **要求端到端小于一小时的实时欺诈检测**——模式 3（事件驱动）。
4. **必须在数分钟内适应用户行为的推荐系统**——模式 4（持续训练）。

在 `SCENARIO_PICKS.md` 中阐明每项选择的理由。

## 交付物

1. 四种模式的可用代码。
2. `COMPARISON.md` 比较矩阵。
3. `SCENARIO_PICKS.md` 建议。
4. `OPERATIONS.md`：每种模式如何失败，以及如何调试。

## 验证

- [ ] 四种模式均可针对三个模型端到端运行。
- [ ] 针对每种模式测量并记录添加第四个模型的成本。
- [ ] 已测试故障隔离：故意破坏一个模型，观察影响范围。

## 拓展目标

- 添加 **Prefect** 作为第五种模式，与 Airflow 的开发体验比较。
- 实现 **DAG 生成工具**：通过更高层级的 YAML 生成逐模型和参数化版本。
- 添加各模式可比较的**可观测性**：逐模型仪表盘及告警。

## 常见陷阱

- **参数化 DAG 共享状态**——共享辅助函数中的 Bug 会同时破坏所有 DAG。
- **事件驱动缺乏批量重试机制**——事件突发触发 N 个工作流，使集群过度订阅。
- **持续训练没有金丝雀验证**——每次 partial_fit 直接进入生产。应先验证。
- **逐模型 DAG 的复制粘贴漂移**——50 个 DAG 中有 12 个缺少重试配置。使用共享装饰器。

> 译注：原文前置条件与场景数量存在小幅不一致；此处保留所有实际列出的场景。
