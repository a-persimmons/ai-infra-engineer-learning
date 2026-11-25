# 实验 01：端到端搭建 MLflow 实验追踪服务器

**时长：** 60 分钟  **前置条件：** Docker。

## 目标

运行 MLflow 实验追踪服务器，使用 Postgres 存储元数据，使用兼容 S3 的 Minio 存储产物。从训练脚本记录实验并在界面中查看。

## 步骤

### 1. compose.yaml
```yaml
services:
  pg:
    image: postgres:15
    environment: { POSTGRES_USER: mlflow, POSTGRES_PASSWORD: mlflow, POSTGRES_DB: mlflow }
    volumes: [pg:/var/lib/postgresql/data]
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment: { MINIO_ROOT_USER: minioadmin, MINIO_ROOT_PASSWORD: minioadmin }
    ports: ["9000:9000", "9001:9001"]
    volumes: [minio:/data]
  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.13.0
    depends_on: [pg, minio]
    ports: ["5000:5000"]
    environment:
      AWS_ACCESS_KEY_ID: minioadmin
      AWS_SECRET_ACCESS_KEY: minioadmin
      MLFLOW_S3_ENDPOINT_URL: http://minio:9000
    command: >
      mlflow server --host 0.0.0.0 --port 5000
        --backend-store-uri postgresql://mlflow:mlflow@pg:5432/mlflow
        --default-artifact-root s3://mlflow/
volumes: { pg: {}, minio: {} }
```

### 2. 启动并创建存储桶
```bash
docker compose up -d
sleep 5
# Create bucket via Minio CLI:
docker run --rm --network host minio/mc alias set local http://localhost:9000 minioadmin minioadmin
docker run --rm --network host minio/mc mb local/mlflow
```

### 3. 从脚本记录实验
```python
# train.py
import mlflow, mlflow.sklearn
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("iris-baseline")

X, y = load_iris(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)

for n in (10, 50, 200):
    with mlflow.start_run(run_name=f"rf-n{n}"):
        mlflow.log_param("n_estimators", n)
        model = RandomForestClassifier(n_estimators=n, random_state=42).fit(Xtr, ytr)
        acc = accuracy_score(yte, model.predict(Xte))
        mlflow.log_metric("accuracy", acc)
        mlflow.sklearn.log_model(model, artifact_path="model")
```

### 4. 打开界面

http://localhost:5000 → “iris-baseline” → 三次运行记录。

### 5. 比较运行记录

选中全部三次运行 → “Compare” → 查看指标和参数表格。

### 6. 重新加载已记录的模型
```python
import mlflow.pyfunc
best = mlflow.search_runs(experiment_names=["iris-baseline"], order_by=["metrics.accuracy DESC"]).iloc[0]
m = mlflow.pyfunc.load_model(f"runs:/{best.run_id}/model")
print(m.predict([[5.1, 3.5, 1.4, 0.2]]))
```

## 验证

- [ ] 界面中可以看到全部三次运行及准确率。
- [ ] 可以在界面中浏览产物（model.pkl）。
- [ ] 加载已记录的模型能够得到有效预测。

## 清理
```bash
docker compose down -v
```

## 故障排查

- **`OperationalError: connection refused`** — Postgres 尚未就绪。执行 `compose up` 后等待 10 秒。
- **`NoSuchBucket: mlflow`** — 跳过了 `mc mb local/mlflow` 步骤。
- **产物上传成功，但界面显示下载错误** — 浏览器无法访问 minio:9000（产物路径中的 URL）。使用本地主机别名，或运行带有 `--artifacts-destination` 的 `mlflow ui`。
