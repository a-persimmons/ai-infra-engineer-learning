# 实验 05：使用 DVC 对数据与模型进行版本管理

**时长：** 60 分钟  **前置条件：** Git、Python 3.11+。

## 目标

使用 DVC 追踪大型数据文件和模型产物，使用 Git 管理元数据。固定某个数据集版本，基于它训练，并在数月后复现结果。

## 步骤

### 1. 初始化
```bash
mkdir dvc-lab && cd dvc-lab
git init
python -m venv venv && source venv/bin/activate
pip install 'dvc[s3]' scikit-learn joblib
dvc init
git add .dvc .dvcignore && git commit -m "init dvc"
```

### 2. 配置本地远程存储（真实项目使用 S3/GCS/Azure）
```bash
mkdir -p ~/dvc-remote
dvc remote add -d localstore ~/dvc-remote
git add .dvc/config && git commit -m "dvc: local remote"
```

### 3. 追踪数据集
```bash
mkdir data
python -c "from sklearn.datasets import load_iris; import pandas as pd; \
  df = load_iris(as_frame=True).frame; df.to_parquet('data/iris.parquet')"
dvc add data/iris.parquet
git add data/.gitignore data/iris.parquet.dvc && git commit -m "dvc: track iris v1"
dvc push
```

### 4. 修改并重新追踪
```bash
python -c "from sklearn.datasets import load_iris; import pandas as pd; \
  df = load_iris(as_frame=True).frame; df = df[df['sepal length (cm)'] > 5]; \
  df.to_parquet('data/iris.parquet')"
dvc add data/iris.parquet
git add data/iris.parquet.dvc && git commit -m "dvc: iris v2 (filtered)"
dvc push
```

### 5. 回滚
```bash
git checkout HEAD~1 data/iris.parquet.dvc
dvc checkout
wc -l data/iris.parquet   # back to v1 size
```

### 6. 构建包含多个阶段的流水线
```bash
cat > dvc.yaml <<'EOF'
stages:
  train:
    cmd: python train.py
    deps: [data/iris.parquet, train.py]
    outs: [model.joblib]
    metrics: [metrics.json]
EOF

cat > train.py <<'EOF'
import json, joblib, pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

df = pd.read_parquet("data/iris.parquet")
X = df.drop(columns=["target"]); y = df["target"]
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=50, random_state=42).fit(Xtr, ytr)
joblib.dump(model, "model.joblib")
json.dump({"accuracy": float(accuracy_score(yte, model.predict(Xte)))}, open("metrics.json","w"))
EOF

dvc repro
git add dvc.yaml dvc.lock train.py && git commit -m "dvc: training pipeline"
dvc push
```

### 7. 后续复现
```bash
git checkout <commit-hash>
dvc checkout      # pulls matching data + model
cat metrics.json
```

## 验证

- [ ] `data/iris.parquet` 位于 `.gitignore` 中，并由 DVC 追踪。
- [ ] 已提交 `dvc.lock`（它固定输入与输出的哈希值）。
- [ ] `dvc repro` 仅重新执行输入发生变化的阶段。
- [ ] 回滚 Git 提交能够恢复完全相同的数据与模型。

## 清理
```bash
cd .. && rm -rf dvc-lab ~/dvc-remote
```

## 故障排查

- **`dvc push` 没有写入任何内容** — 未配置远程存储；检查 `dvc remote default`。
- **`dvc checkout` 提示 missing data** — 远程存储中缺少该版本；检查 `dvc fetch`。
- **流水线总是重新运行** — 未在 `outs` 声明输出，因此 DVC 无法计算其哈希。
