# 练习 06：使用 DVC 管理数据与模型版本

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** Git、Python；实验 05（DVC 概览）

## 目标

构建由 DVC 管理的机器学习项目，对数据、代码、模型和指标进行可复现的联合版本管理。实现多阶段管道，演示通过 `dvc exp run` 进行参数扫描，并使用 `dvc repro` 仅重建发生变化的部分。

## 为什么重要

机器学习中的「上周还能运行」问题通常与数据相关。DVC 使数据成为 Git 工作流中的一等公民：通过 `git checkout` 切换到指定 SHA，再使用 `dvc checkout` 恢复产生该结果的确切训练数据、模型与指标（必要时先下载缓存）。这是可审计的可复现性。

## 要求

1. 包含至少四个阶段的**管道**（摄取、预处理、训练、评估）。
2. 各阶段使用 `params.yaml` 中的**参数**。
3. 逐阶段声明**指标**。
4. 通过 `dvc exp run` 及参数覆盖开展**实验**。
5. **远程存储**（S3 或本地文件系统）。
6. 在 PR 上执行 `dvc repro` 并比较指标的 **CI 工作流**。

## 分步操作

### 步骤 1——初始化（15 分钟）
```bash
mkdir dvc-project && cd dvc-project
git init -q
python -m venv venv && source venv/bin/activate
pip install 'dvc[s3]' scikit-learn pandas joblib pyyaml

dvc init
git add .dvc .dvcignore && git commit -m "init dvc"
```

### 步骤 2——本地远程存储（5 分钟）
```bash
mkdir -p ~/dvc-remote
dvc remote add -d localstore ~/dvc-remote
git add .dvc/config && git commit -m "dvc: local remote"
```

### 步骤 3——管道定义（45 分钟）
```yaml
# dvc.yaml
stages:
  ingest:
    cmd: python src/ingest.py --output data/raw.parquet
    deps: [src/ingest.py]
    outs: [data/raw.parquet]

  preprocess:
    cmd: python src/preprocess.py
    deps: [src/preprocess.py, data/raw.parquet]
    params: [preprocess.test_size, preprocess.random_seed]
    outs: [data/train.parquet, data/test.parquet]

  train:
    cmd: python src/train.py
    deps: [src/train.py, data/train.parquet]
    params: [train.algorithm, train.hyperparameters]
    outs: [models/model.joblib]
    metrics: [metrics/train.json]

  evaluate:
    cmd: python src/evaluate.py
    deps: [src/evaluate.py, models/model.joblib, data/test.parquet]
    metrics: [metrics/evaluate.json]
    plots:
      - plots/roc.json:
          x: fpr
          y: tpr
```

### 步骤 4——参数文件（15 分钟）
```yaml
# params.yaml
preprocess:
  test_size: 0.2
  random_seed: 42
train:
  algorithm: gradient_boosting
  hyperparameters:
    learning_rate: 0.05
    n_estimators: 300
    max_depth: 6
```

### 步骤 5——示例源代码（30 分钟）
```python
# src/ingest.py
import pandas as pd
from sklearn.datasets import load_iris
df = load_iris(as_frame=True).frame
df.to_parquet("data/raw.parquet")
```

```python
# src/train.py
import json, joblib, yaml, pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

params = yaml.safe_load(open("params.yaml"))["train"]
df = pd.read_parquet("data/train.parquet")
X, y = df.drop(columns=["target"]), df["target"]
model = GradientBoostingClassifier(**params["hyperparameters"]).fit(X, y)
joblib.dump(model, "models/model.joblib")
json.dump({"train_accuracy": float(accuracy_score(y, model.predict(X)))},
          open("metrics/train.json", "w"))
```

（`preprocess.py` 与 `evaluate.py` 类似。）

### 步骤 6——运行与提交（10 分钟）
```bash
mkdir -p data models metrics plots
dvc repro
git add dvc.yaml dvc.lock params.yaml src/ metrics/ plots/
git commit -m "feat: initial pipeline"
dvc push
```

### 步骤 7——实验（30 分钟）
```bash
dvc exp run --set-param train.hyperparameters.learning_rate=0.1
dvc exp run --set-param train.hyperparameters.learning_rate=0.01
dvc exp run --set-param train.algorithm=random_forest \
            --set-param train.hyperparameters.n_estimators=500

dvc exp show       # tabular comparison
dvc exp apply <exp-name>     # promote an experiment to working dir
```

### 步骤 8——CI 工作流（30 分钟）
```yaml
# .github/workflows/dvc-ci.yml
on: pull_request
jobs:
  reproduce:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: iterative/setup-dvc@v1
      - uses: iterative/setup-cml@v2
      - run: pip install -r requirements.txt
      - run: dvc pull
      - run: dvc repro
      - run: |
          dvc metrics diff main --md >> report.md
          dvc plots diff main --target plots/roc.json --md --out roc-diff.png >> report.md
          cml comment create report.md
```

现在 PR 中可以直接看到诸如「准确率 +0.012」的信息。

## 交付物

1. 包含全部四个阶段的可用 DVC 项目。
2. 至少三次展示不同超参数组合的实验。
3. 在 PR 上发布指标差异的 CI 工作流。
4. `EXPERIMENTS.md`，记录参数扫描所得结论。

## 验证

- [ ] `dvc repro` 具有幂等性（再次执行不进行无必要的重建）。
- [ ] 编辑单个源文件，仅重新执行受影响的下游阶段。
- [ ] `dvc exp show` 并列显示至少三次实验。
- [ ] PR 检查发布指标差异。

## 拓展目标

- 将 **MLflow** 与 DVC 一起使用，比较开发体验。
- 设置**共享 S3 远程存储**，用于团队协作。
- 在阶段之间实现**数据质量门禁**（使用练习 07 的 GE 管道）。

## 常见陷阱

- **`dvc repro` 总是重新执行每个阶段**——未在 `outs:` 中声明输出；没有输出声明，DVC 无法对其进行哈希以检测变化。
- **提交数据而非 `.dvc` 指针**——`data/raw.parquet` 应加入 `.gitignore`，提交对应的 `.dvc` 文件。
- **`dvc push` 没有写入内容**——未设置远程存储。检查 `dvc remote default`。
- **参数变更没有触发重新运行**——该阶段的 `params:` 列表未包含修改的参数。
