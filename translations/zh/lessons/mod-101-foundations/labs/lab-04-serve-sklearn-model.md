# 实验 04：通过 FastAPI 端点提供 scikit-learn 模型服务

**时长：** 75 分钟
**难度：** 入门进阶
**前置条件：** 完成实验 01–03。

## 目标

在本地训练小型 scikit-learn 分类器，使用 joblib 持久化模型，并通过 FastAPI 的 `/predict` 端点提供预测服务，使用 Pydantic 验证输入。将结果容器化，并部署至实验 03 的 kind 集群。

## 为什么重要

这是生产级模型服务的最小真实形态。后续每个项目都是这种模式的扩展（添加监控、扩缩容、批处理和优化），因此先建立正确的基础结构很重要。

## 前置条件

- 实验 03 的 kind 集群仍在运行，或者愿意重新创建集群（`kind create cluster --config kind-config.yaml`）。

## 步骤

### 1. 创建项目

```bash
mkdir -p ~/ai-infra-labs/lab-04-serve && cd ~/ai-infra-labs/lab-04-serve
python3 -m venv venv && source venv/bin/activate

cat > requirements.txt <<'EOF'
scikit-learn>=1.4
joblib>=1.3
fastapi>=0.111
uvicorn[standard]>=0.30
pydantic>=2.7
gunicorn>=22.0
EOF

pip install --upgrade pip
pip install -r requirements.txt
```

### 2. 训练并保存小型模型

```bash
cat > train.py <<'EOF'
"""Train a small classifier on the iris dataset and save it."""
import joblib
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=50, random_state=42).fit(X_tr, y_tr)
print(f"test accuracy: {accuracy_score(y_te, model.predict(X_te)):.3f}")

joblib.dump(model, "model.joblib")
print("saved -> model.joblib")
EOF

python train.py
ls -lh model.joblib
```

### 3. 构建 FastAPI 服务

```bash
cat > app.py <<'EOF'
"""Serve the iris classifier behind FastAPI."""
import logging, time
from contextlib import asynccontextmanager
from typing import Annotated

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, ValidationError

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("iris-api")

MODEL_PATH = "model.joblib"
CLASS_NAMES = ["setosa", "versicolor", "virginica"]


class PredictIn(BaseModel):
    sepal_length: Annotated[float, Field(ge=0, le=20)]
    sepal_width:  Annotated[float, Field(ge=0, le=20)]
    petal_length: Annotated[float, Field(ge=0, le=20)]
    petal_width:  Annotated[float, Field(ge=0, le=20)]

    def as_row(self) -> list[float]:
        return [self.sepal_length, self.sepal_width, self.petal_length, self.petal_width]


class PredictOut(BaseModel):
    class_name: str
    class_id: int
    latency_ms: float


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("loading model from %s", MODEL_PATH)
    app.state.model = joblib.load(MODEL_PATH)
    yield
    log.info("shutting down")


app = FastAPI(title="iris-api", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/ready")
def ready(request) -> dict:
    if getattr(request.app.state, "model", None) is None:
        raise HTTPException(503, "model not loaded")
    return {"status": "ready"}


@app.post("/predict", response_model=PredictOut)
def predict(req: PredictIn, request) -> PredictOut:
    t0 = time.perf_counter()
    class_id = int(request.app.state.model.predict([req.as_row()])[0])
    elapsed = (time.perf_counter() - t0) * 1000
    return PredictOut(class_name=CLASS_NAMES[class_id], class_id=class_id, latency_ms=round(elapsed, 3))
EOF
```

注意：为简洁起见，本骨架省略了 `request` 参数的类型标注。生产环境应使用 `from fastapi import Request` 和 `request: Request`。

### 4. 本地运行并执行冒烟测试

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 &
sleep 1

curl -s http://localhost:8000/health
curl -s -X POST http://localhost:8000/predict -H 'content-type: application/json' \
  -d '{"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2}'

# Stop the dev server
kill %1
```

预期：`{"class_name":"setosa","class_id":0,"latency_ms":...}`。

### 5. 容器化

```bash
cat > Dockerfile <<'EOF'
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py model.joblib ./
EXPOSE 8000
CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "app:app"]
EOF

docker build -t iris-api:0.1 .
```

### 6. 部署到 kind

```bash
kind load docker-image iris-api:0.1 --name lab-03

cat > k8s.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: { name: iris-api }
spec:
  replicas: 2
  selector: { matchLabels: { app: iris-api } }
  template:
    metadata: { labels: { app: iris-api } }
    spec:
      containers:
        - name: api
          image: iris-api:0.1
          imagePullPolicy: Never
          ports: [{ containerPort: 8000 }]
          readinessProbe:
            httpGet: { path: /ready, port: 8000 }
            initialDelaySeconds: 3
---
apiVersion: v1
kind: Service
metadata: { name: iris-api }
spec:
  type: NodePort
  selector: { app: iris-api }
  ports:
    - port: 80
      targetPort: 8000
      nodePort: 30080
EOF

kubectl delete -f ../lab-03-kind/service.yaml --ignore-not-found
kubectl delete -f ../lab-03-kind/deployment.yaml --ignore-not-found
kubectl apply -f k8s.yaml
kubectl rollout status deployment/iris-api
```

### 7. 从宿主机进行测试

```bash
for _ in {1..5}; do
  curl -s -X POST http://localhost:8080/predict \
    -H 'content-type: application/json' \
    -d '{"sepal_length":6.0,"sepal_width":3.0,"petal_length":5.0,"petal_width":1.5}'
done
```

## 验证

- [ ] `/health` 返回 `{"status":"ok"}`。
- [ ] `/ready` 仅在模型加载后返回 200。
- [ ] `/predict` 返回包含 `class_name`、`class_id` 和 `latency_ms` 的 JSON 响应体。
- [ ] 发送错误输入（如 `"sepal_length": "not a number"`）返回 HTTP 422，并包含字段级错误详情。
- [ ] `kubectl get pods` 显示两个 Ready 的 Pod。

## 清理

```bash
kubectl delete -f k8s.yaml
docker rmi iris-api:0.1
cd ~ && rm -rf ~/ai-infra-labs/lab-04-serve
```

## 故障排查

- **422 Unprocessable Entity** — Pydantic 验证拒绝了输入。错误响应体会告诉你哪个字段有问题，通常是缺失键或类型错误。
- **每次请求都加载模型** — 跳过了 `lifespan` 上下文管理器。确认 `app.state.model` 在启动时设置一次，而不是在 `predict` 内设置。
- **Pod CrashLoopBackOff** — 执行 `kubectl logs pod/<name>`。常见原因是没有将 `model.joblib` 复制进镜像；检查 `COPY app.py model.joblib ./`。
- **`Address already in use`** — 之前的 `uvicorn` 仍在运行。执行 `pkill -f uvicorn` 或 `lsof -i :8000`。
