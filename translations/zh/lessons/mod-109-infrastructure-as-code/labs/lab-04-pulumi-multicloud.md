# 实验 04：使用 Pulumi 进行多云部署

**时长：** 75 分钟  **前置条件：** 已配置 Pulumi CLI、AWS CLI 与 GCP CLI。

## 目标

使用 Pulumi 的 Python 版本，从一个项目在 AWS 和 GCP 上创建小型工作负载，演示如何使用真实编程语言实现跨云抽象。

## 步骤

### 1. 安装
```bash
brew install pulumi
pulumi version
pip install pulumi pulumi-aws pulumi-gcp
```

### 2. 创建新项目
```bash
mkdir multicloud && cd multicloud
pulumi new python -y --name multicloud
```

### 3. __main__.py
```python
import pulumi
import pulumi_aws as aws
import pulumi_gcp as gcp

# AWS S3 bucket
aws_bucket = aws.s3.BucketV2("artifacts-aws", force_destroy=True)
aws.s3.BucketObject("model",
    bucket=aws_bucket.id,
    key="iris/model.joblib",
    source=pulumi.FileAsset("../model.joblib"))

# GCP storage bucket
gcp_bucket = gcp.storage.Bucket("artifacts-gcp",
    location="US",
    force_destroy=True)
gcp.storage.BucketObject("model",
    bucket=gcp_bucket.name,
    name="iris/model.joblib",
    source=pulumi.FileAsset("../model.joblib"))

pulumi.export("aws_bucket", aws_bucket.id)
pulumi.export("gcp_bucket", gcp_bucket.name)
```

### 4. 配置 Provider
```bash
pulumi config set aws:region us-west-2
pulumi config set gcp:project <PROJECT_ID>
pulumi config set gcp:region us-central1
```

### 5. 应用
```bash
pulumi up
```
检查执行计划，输入 `yes`。

### 6. 使用 Stack 区分环境
```bash
pulumi stack init prod
pulumi config set aws:region us-east-1 --stack prod
pulumi up --stack prod
```

### 7. 检查输出
```bash
pulumi stack output
pulumi stack output aws_bucket
```

### 8. 销毁
```bash
pulumi destroy
pulumi stack rm dev --yes
```

## 验证

- [ ] Pulumi 执行计划正确显示两个云服务商的资源。
- [ ] Apply 成功。
- [ ] 两个存储桶均存在（在 AWS 与 GCP 控制台中验证）。
- [ ] 切换 Stack 时，无需修改代码即可改变区域。

## 清理
```bash
pulumi destroy --yes
```

## 故障排查

- **`Pulumi.yaml not found`** — 先运行 `pulumi new`。
- **从错误的 Profile 获取 AWS 凭据** — 执行 `export AWS_PROFILE=...`，或在 `Pulumi.yaml` 中配置。
- **GCP 提示 Permission denied** — 执行 `gcloud auth application-default login` 设置应用默认凭据（ADC）。
