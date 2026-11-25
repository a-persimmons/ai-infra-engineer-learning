# 实验 02：模型注册与阶段晋升

**时长：** 60 分钟  **前置条件：** 实验 01；MLflow 技术栈正在运行。

## 目标

在 MLflow Model Registry 中注册模型，在不同阶段之间转换（Staging → Production），并在服务脚本中按阶段加载模型。

## 步骤

### 1. 从一次运行记录注册模型
```python
import mlflow
mlflow.set_tracking_uri("http://localhost:5000")

best = mlflow.search_runs(experiment_names=["iris-baseline"], order_by=["metrics.accuracy DESC"]).iloc[0]
mv = mlflow.register_model(f"runs:/{best.run_id}/model", name="iris-classifier")
print(mv.version)
```

### 2. 通过客户端转换阶段
```python
from mlflow.tracking import MlflowClient
c = MlflowClient()
c.transition_model_version_stage("iris-classifier", version=mv.version, stage="Staging",
                                  archive_existing_versions=True)
```

### 3. 在服务脚本中按阶段加载
```python
import mlflow.pyfunc
m = mlflow.pyfunc.load_model("models:/iris-classifier/Staging")
print(m.predict([[5.1, 3.5, 1.4, 0.2]]))
```
这是生产实践模式：应用代码引用阶段，而不是固定版本。

### 4. 晋升至 Production
```python
c.transition_model_version_stage("iris-classifier", mv.version, stage="Production",
                                  archive_existing_versions=True)
```

### 5. 阶段转换时的 Webhook / 事件（可选）

MLflow 没有第一方 Webhook，但可以通过 API 轮询，或者通过 CI 中的标签触发。

### 6. 界面浏览

http://localhost:5000 → “Models” 标签页 → “iris-classifier” → 查看版本历史和阶段分配情况。

## 验证

- [ ] 模型出现在注册中心，版本正确。
- [ ] 通过界面和客户端均能转换阶段。
- [ ] `models:/iris-classifier/Production` URI 能够解析并进行预测。

## 清理
```bash
# delete the registered model via UI or:
python -c "from mlflow.tracking import MlflowClient; MlflowClient().delete_registered_model('iris-classifier')"
```

## 故障排查

- **`Registered model not found`** — 注册与加载步骤中的名称拼写不一致。
- **阶段转换悄然回滚** — 使用 Databricks 托管的 MLflow 时可能是权限问题；开源 MLflow 允许任意客户端操作。
- **`archive_existing_versions` 已弃用** — 在 MLflow 2.9+ 中使用新的 aliases API 替代阶段。
