# 第 04 课：使用 DVC 管理数据版本

## 学习目标

完成本课后，你将能够：
- 理解数据版本管理为什么对 ML 至关重要。
- 安装并配置 DVC（Data Version Control，数据版本控制）。
- 使用 DVC 与 Git 追踪大型数据集。
- 设置远程存储后端（S3、GCS、Azure）。
- 使用 DVC 创建可复现的数据管道。
- 跨团队共享数据集和模型。
- 将 DVC 集成至 CI/CD 工作流。

## 前置条件

- Git 版本控制基础。
- 理解 ML 工作流。
- 熟悉云存储（S3/GCS）。
- Python 编程。

## 导论

**DVC（Data Version Control，数据版本控制）** 为大型数据集及 ML 模型提供类似 Git 的版本管理能力。

**为什么管理数据版本？**
- **可复现性：** 重新创建准确的训练环境。
- **协作：** 无需手动复制 TB 级数据即可共享数据集。
- **实验：** 追踪哪些数据产生了哪些模型。
- **回滚：** 恢复到此前的数据集版本。
- **血缘关系：** 理解数据 → 模型 → 指标之间的关系。

**实际应用（原文案例）：**
- **Iterative.ai：** 创建了 DVC，该开源工具获得超过 1.1 万 GitHub Star（原文统计）。
- **Hugging Face：** 原文称使用 DVC 管理数据集版本。
- **许多初创团队：** 使用 DVC 替代手动数据集管理。

## 1. 安装并配置 DVC

### 1.1 安装

```bash
# Install DVC
pip install dvc

# Install cloud storage support
pip install 'dvc[s3]'      # AWS S3
pip install 'dvc[gs]'      # Google Cloud Storage
pip install 'dvc[azure]'   # Azure Blob Storage
pip install 'dvc[all]'     # All providers

# Verify installation
dvc version
# DVC version: 3.28.0
```

### 1.2 在 Git 仓库中初始化 DVC

```bash
# Initialize Git repo (if not already done)
git init

# Initialize DVC
dvc init

# DVC creates:
# .dvc/            # DVC configuration and cache
# .dvc/.gitignore  # Ignore DVC cache in Git
# .dvc/config      # DVC configuration
# .dvcignore       # Files to ignore

# Commit DVC initialization
git add .dvc .dvcignore
git commit -m "Initialize DVC"
```

### 1.3 配置远程存储

**AWS S3：**

```bash
# Add S3 as remote storage
dvc remote add -d myremote s3://my-ml-data-bucket/dvc-cache

# Configure AWS credentials (use environment variables or AWS config)
dvc remote modify myremote access_key_id $AWS_ACCESS_KEY_ID
dvc remote modify myremote secret_access_key $AWS_SECRET_ACCESS_KEY
dvc remote modify myremote region us-west-2

# Or use IAM role (recommended in production)
dvc remote modify myremote use_ssl true
dvc remote modify myremote credentialpath ~/.aws/credentials

# Commit remote configuration
git add .dvc/config
git commit -m "Configure S3 remote storage"
```

**Google Cloud Storage：**

```bash
dvc remote add -d myremote gs://my-ml-data-bucket/dvc-cache
dvc remote modify myremote projectname my-gcp-project

# Set credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**Azure Blob Storage：**

```bash
dvc remote add -d myremote azure://mycontainer/dvc-cache
dvc remote modify myremote account_name mystorageaccount
dvc remote modify myremote account_key $AZURE_STORAGE_KEY
```

## 2. 使用 DVC 追踪数据集

### 2.1 将大型文件添加至 DVC

```bash
# Download dataset (example)
wget https://example.com/imagenet.tar.gz -O data/imagenet.tar.gz

# Add to DVC tracking
dvc add data/imagenet.tar.gz

# DVC creates:
# data/imagenet.tar.gz.dvc  # Metadata file (tracked in Git)
# data/.gitignore           # Ignore actual file in Git

# Commit metadata to Git
git add data/imagenet.tar.gz.dvc data/.gitignore
git commit -m "Track ImageNet dataset with DVC"

# Push data to remote storage
dvc push
```

**发生了什么：**
1. DVC 计算文件的 MD5 哈希。
2. 将文件存储在 `.dvc/cache/` 中。
3. 创建包含哈希的 `.dvc` 元数据文件。
4. 通过 `.gitignore` 避免在 Git 中追踪大型文件。
5. `dvc push` 将文件上传至 S3/GCS。

**文件结构：**

```
data/imagenet.tar.gz.dvc (tracked in Git):
  outs:
  - md5: a3e4f5... (hash of file)
    size: 150000000000  # 150 GB
    path: imagenet.tar.gz

.dvc/cache/a3/e4f5... (local cache, not in Git)
  → Actual 150 GB file

s3://bucket/dvc-cache/a3/e4f5... (remote storage)
  → Uploaded copy
```

### 2.2 获取数据

```bash
# Clone repository (gets .dvc metadata files)
git clone https://github.com/company/ml-project.git
cd ml-project

# Download data from remote storage
dvc pull

# DVC downloads files based on .dvc metadata
# Files appear in data/ directory
```

### 2.3 添加目录

```bash
# Track entire directory
dvc add data/raw/

# Creates data/raw.dvc with all files
git add data/raw.dvc data/.gitignore
git commit -m "Track raw data directory"
dvc push
```

### 2.4 更新数据集

```bash
# Modify dataset
python scripts/add_new_samples.py

# DVC detects changes
dvc status
# Output: data/imagenet.tar.gz.dvc:
#   changed outs:
#     modified:    data/imagenet.tar.gz

# Update DVC tracking
dvc add data/imagenet.tar.gz

# Commit new version
git add data/imagenet.tar.gz.dvc
git commit -m "Update ImageNet with 10k new samples"
dvc push

# Now have versioned history:
# - v1.0: 140 GB, 1.2M images (commit abc123)
# - v1.1: 150 GB, 1.21M images (commit def456)
```

### 2.5 在不同版本之间切换

```bash
# Checkout specific version
git checkout v1.0  # Git tag or commit hash
dvc checkout       # Downloads v1.0 data

# Data now matches v1.0 state!

# Return to latest
git checkout main
dvc checkout
```

## 3. DVC 数据管道

### 3.1 定义可复现的数据管道

**DVC 数据管道追踪数据转换过程：**

```yaml
# dvc.yaml
stages:
  download:
    cmd: python scripts/download_data.py
    outs:
      - data/raw/

  preprocess:
    cmd: python scripts/preprocess.py
    deps:
      - data/raw/
      - scripts/preprocess.py
    params:
      - preprocess.min_samples
      - preprocess.max_samples
    outs:
      - data/processed/

  train:
    cmd: python scripts/train.py
    deps:
      - data/processed/
      - scripts/train.py
    params:
      - train.epochs
      - train.learning_rate
    metrics:
      - metrics.json:
          cache: false
    outs:
      - models/model.pth
```

```yaml
# params.yaml (hyperparameters)
preprocess:
  min_samples: 1000
  max_samples: 100000

train:
  epochs: 100
  learning_rate: 0.001
  batch_size: 32
```

**运行管道：**

```bash
# Run all stages
dvc repro

# DVC:
# 1. Checks if inputs changed
# 2. Skips stages where inputs unchanged (caching!)
# 3. Runs only changed stages
# 4. Tracks outputs and metrics

# Commit pipeline and results
git add dvc.yaml dvc.lock metrics.json
git commit -m "Train model v1.0"
dvc push
```

### 3.2 数据管道的优势

**可复现性：**

```bash
# Reproduce exact results from 6 months ago
git checkout 6-months-ago-commit
dvc repro

# DVC downloads exact data and reruns pipeline
# Produces identical results!
```

**缓存：**

```bash
# Change only hyperparameters
vim params.yaml  # Change learning_rate: 0.001 → 0.01

dvc repro
# DVC output:
# Stage 'download' didn't change, skipping
# Stage 'preprocess' didn't change, skipping
# Stage 'train' changed, running...

# Only trains model, skips preprocessing!
```

### 3.3 复杂数据管道示例

```yaml
# dvc.yaml (ML pipeline)
stages:
  fetch_data:
    cmd: python scripts/fetch_from_db.py --date ${date}
    params:
      - fetch.start_date
      - fetch.end_date
    outs:
      - data/raw/transactions.parquet

  validate_data:
    cmd: python scripts/validate.py
    deps:
      - data/raw/transactions.parquet
      - scripts/validate.py
    outs:
      - data/validated/transactions.parquet

  feature_engineering:
    cmd: python scripts/features.py
    deps:
      - data/validated/transactions.parquet
      - scripts/features.py
    params:
      - features.window_days
      - features.aggregations
    outs:
      - data/features/user_features.parquet

  train_model:
    cmd: python scripts/train.py
    deps:
      - data/features/user_features.parquet
      - scripts/train.py
    params:
      - model.type
      - model.hyperparameters
    outs:
      - models/fraud_detector.pkl
    metrics:
      - metrics/train_metrics.json:
          cache: false
    plots:
      - plots/confusion_matrix.png:
          cache: false

  evaluate_model:
    cmd: python scripts/evaluate.py
    deps:
      - models/fraud_detector.pkl
      - data/features/user_features.parquet
    metrics:
      - metrics/eval_metrics.json:
          cache: false
```

```bash
# Run pipeline
dvc repro

# View metrics
dvc metrics show

# Compare experiments
dvc exp show --only-changed
```

## 4. 使用 DVC 追踪实验

### 4.1 运行实验

```bash
# Run experiment with different parameters
dvc exp run -S train.learning_rate=0.01 -S train.batch_size=64

# Run multiple experiments in queue
dvc exp run -S train.learning_rate=0.001 --queue
dvc exp run -S train.learning_rate=0.01 --queue
dvc exp run -S train.learning_rate=0.1 --queue

# Execute queued experiments
dvc exp run --run-all --jobs 3  # Run 3 in parallel
```

### 4.2 比较实验

```bash
# List experiments
dvc exp show

# Output:
# ┌────────────────────┬──────────┬────────┬──────────┬──────────┐
# │ Experiment         │ accuracy │ f1     │ train.lr │ train.bs │
# ├────────────────────┼──────────┼────────┼──────────┼──────────┤
# │ main               │ 0.92     │ 0.89   │ 0.001    │ 32       │
# │ exp-lr-0.01        │ 0.94     │ 0.91   │ 0.01     │ 32       │
# │ exp-lr-0.1         │ 0.88     │ 0.85   │ 0.1      │ 32       │
# │ exp-bs-64          │ 0.93     │ 0.90   │ 0.001    │ 64       │
# └────────────────────┴──────────┴────────┴──────────┴──────────┘

# Compare specific experiments
dvc exp diff exp-lr-0.01 exp-lr-0.1

# Apply best experiment to workspace
dvc exp apply exp-lr-0.01

# Commit best experiment
git add dvc.lock params.yaml metrics.json
git commit -m "Use learning rate 0.01 (best accuracy: 0.94)"
```

### 4.3 实验图表

```bash
# Generate plots comparing experiments
dvc plots show

# Compare metric across experiments
dvc plots diff --targets metrics/train_metrics.json -x epoch -y loss

# Generates interactive HTML plot
```

## 5. 协作工作流

### 5.1 与团队共享数据

**团队成员 A：**

```bash
# Add new dataset
dvc add data/new_dataset.parquet
git add data/new_dataset.parquet.dvc .gitignore
git commit -m "Add new dataset"
git push origin main
dvc push  # Upload to S3
```

**团队成员 B：**

```bash
# Pull latest code
git pull origin main

# Download new data
dvc pull

# Data now available locally!
```

### 5.2 大型团队协作

**最佳实践：**

1. **使用共享远程存储：**
   ```bash
   # Everyone uses same S3 bucket
   dvc remote add -d shared s3://team-ml-data/
   ```

2. **不要将缓存提交至 Git：**
   ```
   .dvc/cache/ is in .gitignore (default)
   ```

3. **训练前拉取数据：**
   ```bash
   git pull
   dvc pull
   dvc repro
   ```

4. **训练后推送数据：**
   ```bash
   dvc add models/new_model.pkl
   git add models/new_model.pkl.dvc
   git commit -m "Train new model"
   git push
   dvc push
   ```

## 6. 将 DVC 集成至 CI/CD

### 6.1 GitHub Actions 示例

```yaml
# .github/workflows/train-model.yml
name: Train ML Model

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  train:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install dvc[s3]

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2

    - name: Pull data from DVC
      run: dvc pull

    - name: Run DVC pipeline
      run: dvc repro

    - name: Push results to DVC
      run: dvc push

    - name: Commit metrics
      run: |
        git config user.name "GitHub Actions"
        git config user.email "actions@github.com"
        git add dvc.lock metrics.json
        git commit -m "Update model metrics [skip ci]" || echo "No changes"
        git push
```

### 6.2 Airflow 集成

```python
# dags/dvc_training_pipeline.py
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

dag = DAG('dvc_training_pipeline', start_date=datetime(2023, 1, 1), schedule_interval='@daily')

pull_data = BashOperator(
    task_id='pull_data',
    bash_command='cd /opt/ml-project && dvc pull',
    dag=dag,
)

run_pipeline = BashOperator(
    task_id='run_pipeline',
    bash_command='cd /opt/ml-project && dvc repro',
    dag=dag,
)

push_results = BashOperator(
    task_id='push_results',
    bash_command='cd /opt/ml-project && dvc push',
    dag=dag,
)

commit_results = BashOperator(
    task_id='commit_results',
    bash_command='''
        cd /opt/ml-project
        git add dvc.lock metrics.json
        git commit -m "Training run {{ ds }}"
        git push
    ''',
    dag=dag,
)

pull_data >> run_pipeline >> push_results >> commit_results
```

## 7. 最佳实践

### 7.1 哪些内容适合通过 DVC 追踪？

**适合使用 DVC 追踪：**
- 大型数据集（超过 10MB，原文经验值）。
- 模型文件（.pkl、.pth、.h5）。
- 预处理数据与中间数据。
- 模型评估结果（图表、报告）。

**不应使用 DVC 追踪：**
- 源代码（使用 Git）。
- 小型配置文件（使用 Git）。
- Secret 或凭据（使用密钥管理工具）。

### 7.2 目录结构

```
project/
├── data/
│   ├── raw/              # DVC tracked
│   ├── processed/        # DVC tracked
│   └── features/         # DVC tracked
├── models/               # DVC tracked
├── metrics/              # DVC tracked (if large)
├── plots/                # DVC tracked
├── scripts/              # Git tracked
│   ├── preprocess.py
│   ├── train.py
│   └── evaluate.py
├── dvc.yaml              # Git tracked
├── dvc.lock              # Git tracked
├── params.yaml           # Git tracked
├── requirements.txt      # Git tracked
└── README.md             # Git tracked
```

### 7.3 性能建议

**利用缓存加速下载：**

```bash
# DVC cache shared across all your projects
# ~/.dvc/cache/

# Link files instead of copying (saves disk space)
dvc config cache.type symlink  # Or 'hardlink' or 'reflink'
```

**部分数据拉取：**

```bash
# Pull only specific files
dvc pull data/processed/

# Pull without downloading data (just update .dvc files)
dvc fetch --run-cache
```

## 8. 总结

### 核心要点

**DVC 为数据与模型提供类似 Git 的版本管理能力。**
- 无需将大型文件存储在 Git 中即可追踪它们。
- 将数据存入 S3/GCS/Azure，将元数据存入 Git。

**核心工作流：**
- `dvc add` → `git add *.dvc` → `git commit` → `dvc push`。
- `git pull` → `dvc pull`，获取相应版本的数据。

**DVC 数据管道支持可复现性：**
- 在 `dvc.yaml` 中定义阶段。
- 追踪依赖、参数、输出与指标。
- `dvc repro` 利用缓存，仅重新运行需要更新的阶段。

**实验追踪：**
- 使用 `dvc exp run` 运行参数组合实验。
- 使用 `dvc exp show` 比较结果。
- 应用最佳实验并提交。

**协作：**
- 团队使用共享远程存储。
- 利用缓存避免重复下载数据。
- 与 CI/CD（GitHub Actions、Airflow）集成。

### 实际行业应用

使用 DVC 管理数据版本的企业（原文案例）：
- **Iterative.ai：** DVC 的创建者，管理 ML 数据集。
- **Hugging Face：** 数据集版本管理与共享。
- **许多 ML 团队：** 替代手动维护的 data_v1、data_v2 文件夹。

## 自我检查问题

1. 哪条命令使用 DVC 追踪大型数据集？
2. 如何将 S3 配置为 DVC 远程存储？
3. `dvc add data.csv` 会创建哪些文件？
4. 克隆 DVC 仓库后，如何下载数据？
5. 相较手动脚本，DVC 数据管道有哪些优势？
6. 如何使用不同超参数运行多个实验？
7. 为什么不使用 DVC 追踪源代码？
8. DVC 缓存如何节省时间及磁盘空间？

## 补充资源

- [DVC 文档](https://dvc.org/doc)
- [DVC 入门指南](https://dvc.org/doc/start)
- [DVC 与 MLflow](https://dvc.org/doc/user-guide/related-technologies)
- [DVC Studio](https://studio.iterative.ai/)（DVC 的 Web 界面）

---

**下一课：** 使用 Apache Spark 处理大型 ML 数据集！

> 译注：DVC 数据版本管理不能单独保证整个训练环境完全可复现，还需要固定代码、软件依赖、配置、随机状态及相关计算环境。缓存目录布局与哈希算法可能随 DVC 版本、配置及存储后端而异。大小阈值仅为经验建议，小型指标文件也可以直接用 Git 管理。访问远程存储应采用最小权限及短期凭据，避免提交包含凭据的配置；清理共享缓存或远程对象前应确认全部版本的保留需求。原文企业案例与 Star 数未独立核验，所有代码块保持原样。
