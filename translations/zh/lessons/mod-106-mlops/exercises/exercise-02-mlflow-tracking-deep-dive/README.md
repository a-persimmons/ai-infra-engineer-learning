# 练习 02：深入 MLflow 实验追踪

**时长：** 3 小时
**难度：** 中级
**前置条件：** 已安装 Python 与 MLflow

## 目标

达到生产团队所需的 MLflow 使用深度：考虑后端的实验命名、自动记录、自定义指标、模型签名、模型打包（`mlflow.pyfunc`），以及由 PostgreSQL + S3 支持的追踪服务器。

## 为什么重要

多数团队止步于「我们将记录写入 MLflow」。成熟的团队将 MLflow 视为权威数据源，用于回答「运行了什么实验、产生了什么产物、谁可以提供模型服务」。本练习将使用方式从初步使用推进到专业实践。

## 要求

1. 运行具有持久化后端的 MLflow 追踪服务器（PostgreSQL + S3/MinIO）。
2. 使用 `autolog`、自定义指标、自定义产物和模型签名记录模型。
3. 使用 `mlflow.pyfunc` 打包非标准模型。
4. 通过程序查询 MLflow：寻找最佳 Run、按标签列出 Run、比较 Run。
5. 演示父子 Run 关系（超参数优化 HPO 扫描）。
6. 演示 **MLflow Recipes** 或封装 MLflow 的自定义编排器。

## 分步操作

### 步骤 1——带持久化后端的追踪服务器（参照 mod-106 实验 01）（15 分钟）
参阅 mod-106 实验 01 的 Docker Compose 完整配置。

### 步骤 2——自动记录（15 分钟）
```python
import mlflow, mlflow.sklearn
mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("recs-baseline")
mlflow.sklearn.autolog(log_models=False)

from sklearn.ensemble import GradientBoostingClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split

X, y = load_breast_cancer(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)

with mlflow.start_run(run_name="autolog-demo"):
    model = GradientBoostingClassifier(n_estimators=100).fit(Xtr, ytr)
```
打开界面——自动采集所有超参数、指标及签名。

### 步骤 3——自定义指标与产物（30 分钟）
```python
import json
with mlflow.start_run(run_name="custom-metrics"):
    model = ...
    mlflow.log_metric("custom_business_metric", 0.42)
    mlflow.log_artifact("confusion_matrix.png")
    mlflow.log_dict({"thresholds": [0.3, 0.5, 0.7]}, "thresholds.json")
    mlflow.set_tag("team", "recs-platform")
    mlflow.set_tag("data_version", "2026-05-01")
```

### 步骤 4——模型签名与 log_model（30 分钟）
```python
from mlflow.models.signature import infer_signature
sig = infer_signature(Xtr, model.predict(Xtr))

mlflow.sklearn.log_model(model, "model", signature=sig, input_example=Xtr[:5])
```
签名有两个用途：界面中的文档，以及模型提供服务时的运行时输入验证。

### 步骤 5——为非标准模型创建 Pyfunc 封装（45 分钟）
对于 `mlflow.<flavor>` 未直接支持的模型（例如 XGBoost + 自定义预处理）：
```python
import mlflow.pyfunc

class WrappedModel(mlflow.pyfunc.PythonModel):
    def load_context(self, context):
        import joblib
        self.preproc = joblib.load(context.artifacts["preproc"])
        self.model   = joblib.load(context.artifacts["model"])
    def predict(self, context, model_input):
        return self.model.predict(self.preproc.transform(model_input))

mlflow.pyfunc.log_model(
    artifact_path="combined",
    python_model=WrappedModel(),
    artifacts={"preproc": "/tmp/preproc.joblib", "model": "/tmp/model.joblib"},
    conda_env={...},
    signature=sig,
)

# Loading back:
loaded = mlflow.pyfunc.load_model("runs:/<id>/combined")
loaded.predict(Xte)
```

### 步骤 6——程序化查询（30 分钟）
```python
client = mlflow.MlflowClient()
runs = client.search_runs(experiment_ids=[exp_id],
                          filter_string="metrics.auc > 0.9 AND tags.team = 'recs-platform'",
                          order_by=["metrics.auc DESC"], max_results=10)
for r in runs: print(r.info.run_id, r.data.metrics.get("auc"))
```

### 步骤 7——用于 HPO 的父子 Run（30 分钟）
```python
with mlflow.start_run(run_name="hpo-parent") as parent:
    for lr in (0.01, 0.03, 0.1):
        for d in (3, 6, 10):
            with mlflow.start_run(run_name=f"trial-lr{lr}-d{d}", nested=True):
                mlflow.log_params({"lr": lr, "depth": d})
                # train + log metrics
                mlflow.log_metric("auc", auc)
```
界面显示父 Run 与可折叠的子 Run。

### 步骤 8——工作流集成（15 分钟）
将训练脚本封装在 Airflow DAG 中：
- 从 MLflow 读取此前最佳 AUC。
- 运行训练。
- 如果新 AUC > 此前最佳值 + 0.005，则注册新模型版本；否则记录后退出。

## 交付物

1. 追踪服务器配置及至少三个已有记录的实验。
2. 通过 Pyfunc 封装且包含预处理的模型。
3. 能找到并汇总最佳 Run 的程序化查询脚本。
4. 模型效果改善时自动注册的 Airflow DAG。
5. `MLFLOW_PLAYBOOK.md`：团队如何使用 MLflow（标签、Run 命名、实验生命周期）。

## 验证

- [ ] 所有实验在界面中可见，包含指标、参数与产物。
- [ ] Pyfunc 模型能够加载并正确预测。
- [ ] 查询按照预期顺序返回 Run。
- [ ] HPO 父子结构在界面中可见。

## 拓展目标

- 添加 **Optuna**，实现系统化 HPO 并与 MLflow 集成。
- 使用 **MLflow Recipes** 标准化回归或分类工作流。
- 根据 MLflow 元数据构建**模型卡生成器**。

## 常见陷阱

- **没有实验名称**——默认的 Default 实验会堆积大量无组织的记录。始终调用 `set_experiment`。
- **将完整数据集作为产物记录**——会使 MLflow 存储膨胀。改为记录样本与 S3 引用。
- **标签漂移**——缺少规范时，每次 Run 的标签 Schema 不同。在 `MLFLOW_PLAYBOOK.md` 中记录标准标签。
- **生产追踪服务器使用 SQLite**——并发写入场景宜采用 PostgreSQL 后端。

> 译注：MLflow Recipes 属于原文所处版本的功能，使用新版 MLflow 时应检查其可用性；本练习允许采用自定义编排器替代。
