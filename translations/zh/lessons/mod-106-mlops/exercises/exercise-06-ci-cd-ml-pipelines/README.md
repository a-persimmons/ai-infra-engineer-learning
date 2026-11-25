# 练习 06：ML 管道的 CI/CD

**预计时长：** 26–34 小时
**难度：** 高级
**前置条件：** Python 3.9+、GitHub Actions、Docker、pytest、MLflow

## 概览

使用 GitHub Actions 为 ML 项目构建生产级 CI/CD 流水线。实现自动化测试（单元测试、集成测试、模型验证）、CI 中的模型训练、自动化部署及回滚机制。本练习教授 ML 模型持续集成与交付的 MLOps 最佳实践。

在生产 ML 平台中，CI/CD 对于以下方面至关重要：
- **自动化测试：** 在部署前发现缺陷。
- **模型验证：** 确保模型满足质量标准。
- **可复现性：** 从任意提交构建及部署。
- **快速迭代：** 将模型部署时间从数天缩短至数分钟。
- **回滚安全：** 失败时快速回滚。

## 学习目标

完成本练习后，你将能够：

1. **为 ML 项目构建 GitHub Actions 工作流。**
2. **实现自动化测试**（单元、集成及模型测试）。
3. **在 CI 中创建模型训练管道。**
4. **自动构建 Docker 镜像。**
5. **将模型部署至预发布/生产环境。**
6. **实现蓝绿部署**，以零停机为目标。
7. **在部署失败时自动回滚。**

## 业务背景

**实际业务场景（原文案例）：** 数据科学团队手动部署模型：

- **部署缓慢：** 手动步骤导致部署耗时 2–3 小时。
- **部署失败：** 30% 的部署因缺少依赖而失败。
- **没有测试：** 未验证模型便部署，导致生产事故。
- **无法回滚：** 没有自动回滚，故障修复需要数小时。
- **不可复现：** 无法重建两周前的模型。

你的任务是构建 CI/CD 流水线：
- 每次提交自动运行全部测试。
- 在 CI 中训练模型并验证性能。
- 构建具有精确依赖版本的 Docker 镜像。
- 自动部署至预发布环境，经审批后部署至生产。
- 实现蓝绿部署（零停机目标）。
- 失败后 5 分钟内自动回滚。

## 项目结构

```
exercise-06-ci-cd-ml-pipelines/
├── README.md
├── requirements.txt
├── .github/
│   └── workflows/
│       ├── test.yml                 # Run tests on PR
│       ├── train.yml                # Train model in CI
│       ├── build.yml                # Build Docker image
│       ├── deploy-staging.yml       # Deploy to staging
│       └── deploy-production.yml    # Deploy to production
├── src/
│   └── ml_project/
│       ├── __init__.py
│       ├── data/
│       │   ├── __init__.py
│       │   └── loader.py
│       ├── features/
│       │   ├── __init__.py
│       │   └── engineering.py
│       ├── models/
│       │   ├── __init__.py
│       │   ├── trainer.py
│       │   └── predictor.py
│       └── utils/
│           ├── __init__.py
│           └── validation.py
├── tests/
│   ├── unit/
│   │   ├── test_data_loader.py
│   │   ├── test_features.py
│   │   └── test_model.py
│   ├── integration/
│   │   └── test_pipeline.py
│   └── model/
│       ├── test_model_performance.py
│       └── test_model_bias.py
├── scripts/
│   ├── train.py                     # Training script
│   ├── validate_model.py            # Model validation
│   └── deploy.py                    # Deployment script
├── deployment/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── kubernetes/
│       ├── deployment.yaml
│       └── service.yaml
├── config/
│   ├── model_config.yaml
│   └── deployment_config.yaml
└── docs/
    ├── CICD.md
    └── DEPLOYMENT.md
```

## 需求

### 功能需求

1. **自动化测试：**
   - 全部函数的单元测试。
   - 管道集成测试。
   - 模型性能测试（准确率超过阈值）。
   - 模型偏差测试（公平性指标）。
   - 数据质量测试。

2. **CI 中的模型训练：**
   - PR 中训练模型。
   - 缓存训练数据。
   - 将指标记录至 MLflow。
   - 模型性能下降时使流程失败。

3. **Docker 镜像构建：**
   - 每次合并至 main 时构建。
   - 使用 Git Commit SHA 打标签。
   - 推送至容器镜像仓库。
   - 使用多阶段构建优化体积。

4. **部署：**
   - 自动部署至预发布。
   - 经审批后部署至生产。
   - 蓝绿部署模式。
   - 流量切换前进行健康检查。

5. **回滚：**
   - 出错时自动回滚。
   - 保留最近 5 个可部署版本。
   - 支持一条命令手动回滚。

### 非功能需求

- **构建时间：** 完整流水线低于 10 分钟。
- **测试覆盖率：** 超过 80%。
- **部署时间：** 低于 5 分钟。
- **回滚时间：** 低于 2 分钟。

## 实现任务

### 任务 1：测试工作流（5–6 小时）

配置 PR 自动化测试。

```yaml
# .github/workflows/test.yml

name: Test ML Pipeline

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install flake8 black mypy
          pip install -r requirements.txt

      - name: Lint with flake8
        run: flake8 src/ tests/ --max-line-length=120

      - name: Check formatting with black
        run: black --check src/ tests/

      - name: Type check with mypy
        run: mypy src/

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run unit tests
        run: pytest tests/unit/ -v --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run integration tests
        run: pytest tests/integration/ -v
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost/test

  model-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Download test data
        run: |
          # Download sample test dataset
          mkdir -p data/test
          # TODO: Download from S3 or artifact storage

      - name: Run model performance tests
        run: pytest tests/model/test_model_performance.py -v

      - name: Run model bias tests
        run: pytest tests/model/test_model_bias.py -v
```

**模型测试示例：**

```python
# tests/model/test_model_performance.py

import pytest
from src.ml_project.models.trainer import train_model
from src.ml_project.models.predictor import ModelPredictor

def test_model_accuracy_threshold():
    """Test model meets minimum accuracy threshold"""
    # Load test data
    X_test, y_test = load_test_data()

    # Train model (or load pre-trained)
    model = train_model(X_train, y_train)

    # Predict
    predictor = ModelPredictor(model)
    y_pred = predictor.predict(X_test)

    # Calculate accuracy
    accuracy = (y_pred == y_test).mean()

    # Assert minimum threshold
    assert accuracy >= 0.85, f"Model accuracy {accuracy} below threshold 0.85"

def test_model_precision_recall():
    """Test precision and recall meet thresholds"""
    from sklearn.metrics import precision_score, recall_score

    # Load data and model
    X_test, y_test = load_test_data()
    model = load_trained_model()

    # Predict
    y_pred = model.predict(X_test)

    # Calculate metrics
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)

    # Assert thresholds
    assert precision >= 0.80, f"Precision {precision} below 0.80"
    assert recall >= 0.75, f"Recall {recall} below 0.75"
```

**验收标准：**
- [ ] Lint、格式及类型检查通过。
- [ ] 运行单元测试并统计覆盖率。
- [ ] 集成测试包含依赖服务。
- [ ] 验证模型性能。
- [ ] 每个 PR 运行测试。

---

### 任务 2：模型训练工作流（6–7 小时）

在 CI 中训练模型，并使用 MLflow 追踪。

```yaml
# .github/workflows/train.yml

name: Train Model

on:
  workflow_dispatch:  # Manual trigger
    inputs:
      experiment_name:
        description: 'MLflow experiment name'
        required: true
        default: 'fraud_detection'
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM

jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Download training data
        run: |
          # Download from S3
          aws s3 cp s3://ml-data/training/latest.parquet data/training.parquet
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Train model
        run: python scripts/train.py --experiment-name ${{ github.event.inputs.experiment_name }}
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          MLFLOW_TRACKING_USERNAME: ${{ secrets.MLFLOW_USERNAME }}
          MLFLOW_TRACKING_PASSWORD: ${{ secrets.MLFLOW_PASSWORD }}

      - name: Validate model
        run: python scripts/validate_model.py --min-accuracy 0.85

      - name: Register model
        if: success()
        run: |
          python -c "
          import mlflow
          mlflow.set_tracking_uri('${{ secrets.MLFLOW_TRACKING_URI }}')

          # Get best run from experiment
          experiment = mlflow.get_experiment_by_name('${{ github.event.inputs.experiment_name }}')
          runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id], order_by=['metrics.accuracy DESC'], max_results=1)

          if len(runs) > 0:
              run_id = runs.iloc[0]['run_id']
              # Register model
              mlflow.register_model(
                  f'runs:/{run_id}/model',
                  name='fraud_detection',
                  tags={'git_sha': '${{ github.sha }}', 'trained_by': 'github_actions'}
              )
          "

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: model-artifacts
          path: |
            models/
            metrics/
```

**训练脚本：**

```python
# scripts/train.py

import argparse
import mlflow
import mlflow.sklearn
from src.ml_project.data.loader import load_data
from src.ml_project.features.engineering import engineer_features
from src.ml_project.models.trainer import train_model
from sklearn.model_selection import train_test_split

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--experiment-name', required=True)
    args = parser.parse_args()

    # Set MLflow experiment
    mlflow.set_experiment(args.experiment_name)

    with mlflow.start_run():
        # Log git commit
        mlflow.set_tag('git_sha', os.environ.get('GITHUB_SHA', 'local'))

        # Load data
        df = load_data('data/training.parquet')
        mlflow.log_param('data_rows', len(df))

        # Engineer features
        X, y = engineer_features(df)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Train model
        model = train_model(X_train, y_train)

        # Evaluate
        from sklearn.metrics import accuracy_score, precision_score, recall_score
        y_pred = model.predict(X_test)

        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred)
        }

        # Log metrics
        mlflow.log_metrics(metrics)

        # Log model
        mlflow.sklearn.log_model(model, 'model')

        print(f"Accuracy: {metrics['accuracy']:.4f}")

if __name__ == '__main__':
    main()
```

**验收标准：**
- [ ] 在 CI 中训练模型。
- [ ] 记录至 MLflow。
- [ ] 验证性能。
- [ ] 注册模型。
- [ ] 上传产物。

---

### 任务 3：Docker 构建工作流（5–6 小时）

自动构建并推送 Docker 镜像。

```yaml
# .github/workflows/build.yml

name: Build Docker Image

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          file: deployment/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Run container security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

**Dockerfile（多阶段构建）：**

```dockerfile
# deployment/Dockerfile

# Stage 1: Builder
FROM python:3.9-slim as builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ make \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.9-slim

WORKDIR /app

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Download model from MLflow (or bake into image)
# In production, typically download at runtime
ENV MLFLOW_TRACKING_URI=https://mlflow.example.com

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run model server
EXPOSE 8000
CMD ["python", "scripts/serve.py"]
```

**验收标准：**
- [ ] Docker 多阶段构建。
- [ ] 带标签推送至镜像仓库。
- [ ] 使用 Trivy 进行安全扫描。
- [ ] 构建缓存优化。
- [ ] 元数据标签。

---

### 任务 4：部署工作流（6–7 小时）

部署至预发布及经审批的生产环境。

```yaml
# .github/workflows/deploy-staging.yml

name: Deploy to Staging

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v3

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG_STAGING }}" | base64 -d > kubeconfig
          export KUBECONFIG=./kubeconfig

      - name: Update deployment
        run: |
          # Update image tag in deployment
          kubectl set image deployment/model-server \
            model-server=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:main-${{ github.sha }} \
            -n staging

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/model-server -n staging --timeout=5m

      - name: Run smoke tests
        run: |
          # Get service URL
          SERVICE_URL=$(kubectl get svc model-server -n staging -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

          # Test health endpoint
          curl -f http://$SERVICE_URL/health || exit 1

          # Test prediction endpoint
          curl -X POST http://$SERVICE_URL/predict \
            -H 'Content-Type: application/json' \
            -d '{"features": [1.0, 2.0, 3.0]}' || exit 1

      - name: Rollback on failure
        if: failure()
        run: |
          kubectl rollout undo deployment/model-server -n staging
```

```yaml
# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      image_tag:
        description: 'Image tag to deploy'
        required: true

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requires approval

    steps:
      - uses: actions/checkout@v3

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG_PROD }}" | base64 -d > kubeconfig
          export KUBECONFIG=./kubeconfig

      - name: Blue-Green Deployment
        run: |
          # Deploy new version (green)
          kubectl apply -f deployment/kubernetes/deployment-green.yaml

          # Update green deployment image
          kubectl set image deployment/model-server-green \
            model-server=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.event.inputs.image_tag }} \
            -n production

          # Wait for green deployment
          kubectl rollout status deployment/model-server-green -n production --timeout=10m

      - name: Run production smoke tests
        run: |
          # Test green deployment
          GREEN_URL=$(kubectl get svc model-server-green -n production -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

          # Health check
          curl -f http://$GREEN_URL/health || exit 1

          # Prediction test
          curl -X POST http://$GREEN_URL/predict \
            -H 'Content-Type: application/json' \
            -d '{"features": [1.0, 2.0, 3.0]}' || exit 1

      - name: Switch traffic to green
        if: success()
        run: |
          # Update service selector to point to green
          kubectl patch service model-server -n production \
            -p '{"spec":{"selector":{"version":"green"}}}'

          echo "Traffic switched to green deployment"

      - name: Keep blue deployment as rollback
        run: |
          # Scale down blue but keep for quick rollback
          kubectl scale deployment model-server-blue -n production --replicas=1

      - name: Rollback on failure
        if: failure()
        run: |
          # Delete green deployment
          kubectl delete deployment model-server-green -n production

          echo "Deployment failed, keeping blue active"
```

**Kubernetes 部署（蓝绿）：**

```yaml
# deployment/kubernetes/deployment-green.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-server-green
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: model-server
      version: green
  template:
    metadata:
      labels:
        app: model-server
        version: green
    spec:
      containers:
      - name: model-server
        image: ghcr.io/org/model:placeholder  # Updated by CI
        ports:
        - containerPort: 8000
        env:
        - name: MLFLOW_TRACKING_URI
          valueFrom:
            secretKeyRef:
              name: mlflow-credentials
              key: tracking-uri
        resources:
          requests:
            cpu: "1"
            memory: "2Gi"
          limits:
            cpu: "2"
            memory: "4Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**验收标准：**
- [ ] 自动部署至预发布。
- [ ] 经审批部署至生产。
- [ ] 蓝绿部署模式。
- [ ] 流量切换前执行冒烟测试。
- [ ] 失败时自动回滚。

---

### 任务 5：回滚机制（4–5 小时）

实现快速回滚能力。

```yaml
# .github/workflows/rollback.yml

name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      target_version:
        description: 'Version to rollback to (or "previous")'
        required: true
        default: 'previous'

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG_PROD }}" | base64 -d > kubeconfig
          export KUBECONFIG=./kubeconfig

      - name: Rollback deployment
        run: |
          if [ "${{ github.event.inputs.target_version }}" == "previous" ]; then
            # Rollback to previous revision
            kubectl rollout undo deployment/model-server -n production
          else
            # Rollback to specific version
            # Switch traffic back to blue
            kubectl patch service model-server -n production \
              -p '{"spec":{"selector":{"version":"blue"}}}'

            # Scale up blue
            kubectl scale deployment model-server-blue -n production --replicas=3

            # Delete green
            kubectl delete deployment model-server-green -n production || true
          fi

      - name: Wait for rollback
        run: |
          kubectl rollout status deployment/model-server -n production --timeout=5m

      - name: Verify rollback
        run: |
          SERVICE_URL=$(kubectl get svc model-server -n production -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
          curl -f http://$SERVICE_URL/health

      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              text: "Production rollback completed to ${{ github.event.inputs.target_version }}",
              username: 'GitHub Actions',
              icon_emoji: ':warning:'
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

**验收标准：**
- [ ] 一键回滚。
- [ ] 回滚至此前或指定版本。
- [ ] 回滚后验证。
- [ ] 通知团队。
- [ ] 回滚时间低于 2 分钟。

---

## 测试要求

```python
# tests/integration/test_deployment.py

def test_deployment_health_check():
    """Test deployment responds to health check"""
    import requests

    response = requests.get("http://localhost:8000/health")
    assert response.status_code == 200
    assert response.json()['status'] == 'healthy'

def test_prediction_endpoint():
    """Test prediction endpoint works"""
    import requests

    payload = {"features": [1.0, 2.0, 3.0, 4.0, 5.0]}
    response = requests.post("http://localhost:8000/predict", json=payload)

    assert response.status_code == 200
    assert 'prediction' in response.json()
```

## 预期结果

| 指标 | 目标 | 实测 |
|---|---|---|
| **构建时间** | 低于 10 分钟 | ________min |
| **测试覆盖率** | 超过 80% | ________% |
| **部署时间** | 低于 5 分钟 | ________min |
| **回滚时间** | 低于 2 分钟 | ________min |

## 验证

提交：
1. GitHub Actions 工作流。
2. 自动化测试（单元、集成、模型）。
3. Docker 构建配置。
4. Kubernetes 部署 Manifest。
5. 蓝绿部署实现。
6. 回滚工作流。
7. 文档。

## 资源

- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [蓝绿部署](https://martinfowler.com/bliki/BlueGreenDeployment.html)

---

**预计完成时长（原文）：** 26–34 小时。

**实践技能：**
- GitHub Actions 工作流。
- 自动化 ML 测试。
- Docker 镜像构建。
- Kubernetes 部署。
- 蓝绿部署。
- ML CI/CD。
- 自动化回滚。

> 译注：蓝绿部署并不保证零停机，还需验证容量、状态兼容性及流量切换。CI 应隔离不可信 PR 与生产凭据，采用短期凭据和最小权限。模型公平性需结合业务和数据定义指标。原始代码块与 TODO 保留，未实际部署。
