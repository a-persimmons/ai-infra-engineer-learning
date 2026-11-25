# 实验 04：使用 GitHub Actions 实现模型 CI/CD

**时长：** 75 分钟  **前置条件：** GitHub 账号、包含先前实验中 `iris-api` 的仓库。

## 目标

每次向 `main` 推送涉及模型代码的修改时，自动训练、使用留出数据进行质量门禁评估（准确率 ≥95%）、构建镜像、推送至 GHCR，并部署至 `staging` 环境。

## 步骤

### 1. 仓库结构
```
.
├── src/train.py
├── src/api.py
├── Dockerfile
├── tests/
└── .github/workflows/ml-cicd.yml
```

### 2. 包含质量门禁的训练脚本
```python
# src/train.py
import json, sys, joblib
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=200, random_state=42).fit(Xtr, ytr)
acc = accuracy_score(yte, model.predict(Xte))
print(f"accuracy={acc:.4f}")
joblib.dump(model, "model.joblib")
json.dump({"accuracy": acc}, open("metrics.json", "w"))
if acc < 0.95:
    print("FAIL: accuracy below 0.95 threshold")
    sys.exit(1)
```

### 3. 工作流
```yaml
# .github/workflows/ml-cicd.yml
name: ml-cicd

on:
  push:
    branches: [main]
    paths: ['src/**','Dockerfile','requirements.txt']

permissions:
  contents: read
  packages: write
  id-token: write

jobs:
  train-and-deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt
      - name: Train
        run: python src/train.py
      - name: Upload metrics
        uses: actions/upload-artifact@v4
        with: { name: metrics, path: metrics.json }
      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}/iris-api:${{ github.sha }}
      - name: Deploy to staging
        run: |
          kubectl --context=staging set image deployment/iris-api \
            api=ghcr.io/${{ github.repository }}/iris-api:${{ github.sha }}
          kubectl --context=staging rollout status deployment/iris-api --timeout=3m
        env:
          KUBECONFIG: ${{ secrets.STAGING_KUBECONFIG }}
```

### 4. 在仓库设置中添加 `secrets.STAGING_KUBECONFIG`。

### 5. 推送修改

编辑 `src/train.py`（例如增加 `n_estimators`），提交并推送。观察工作流：

- 训练门禁（若准确率下降，构建停止）。
- 镜像构建与推送。
- Staging 环境滚动发布。

### 6. 在 staging 中验证

`curl https://<staging-domain>/health`

## 验证

- [ ] 推送时工作流端到端运行。
- [ ] 准确率门禁失败时，构建停止（通过修改 train.py 使用不良参数强制触发）。
- [ ] 在 GHCR 中可以看到镜像。
- [ ] Staging 集群的 Pod 正在运行新镜像标签（SHA）。

## 清理
```bash
# Delete the workflow file or just don't merge to main.
```

## 故障排查

- **推送至 GHCR 时 `Permission denied`** — 在 `permissions` 中添加 `packages: write`。
- **`kubectl: command not found`** — 添加 `azure/setup-kubectl@v4` Action。
- **Staging 部署卡住** — 滚动发布超时；在 Staging 集群上通过 SSH/kubectl 调查。
