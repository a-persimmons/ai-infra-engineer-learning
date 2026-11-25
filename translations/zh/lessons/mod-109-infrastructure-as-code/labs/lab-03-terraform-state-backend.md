# 实验 03：使用 S3 与 DynamoDB 锁实现远程状态后端

**时长：** 45 分钟  **前置条件：** AWS CLI、Terraform。

## 目标

将 Terraform 状态从本地磁盘迁移至 S3，添加基于 DynamoDB 的状态锁，并验证两个并发 Apply 会正确串行执行。

## 步骤

### 1. 初始化后端资源

首次执行时，尚无法将初始化过程的状态存入 S3（先有鸡还是先有蛋的问题）。先使用本地状态执行 Apply，再迁移。
```hcl
# bootstrap/main.tf
resource "aws_s3_bucket" "tfstate" { bucket = "company-tfstate-${random_string.suffix.result}" }
resource "random_string" "suffix"  { length = 6 special = false upper = false }
resource "aws_s3_bucket_versioning" "v" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "enc" {
  bucket = aws_s3_bucket.tfstate.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
}
resource "aws_dynamodb_table" "locks" {
  name = "tfstate-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "LockID"
  attribute { name = "LockID" type = "S" }
}
output "bucket" { value = aws_s3_bucket.tfstate.id }
```
```bash
cd bootstrap && terraform init && terraform apply
BUCKET=$(terraform output -raw bucket)
```

### 2. 在项目中配置后端
```hcl
# main.tf
terraform {
  backend "s3" {
    bucket         = "company-tfstate-abc123"      # from bootstrap output
    key            = "ml/lab/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "tfstate-locks"
    encrypt        = true
  }
}
```

### 3. 迁移现有本地状态
```bash
terraform init -migrate-state
# Confirm: yes
ls -la terraform.tfstate     # gone — state now in S3
```

### 4. 测试锁

在终端 A 中：
```bash
terraform apply              # type "yes" but don't hit enter yet
```

在终端 B 中，使用同一项目的另一份检出副本：
```bash
terraform plan               # should fail with "Error: Error acquiring the state lock"
```

### 5. 检查锁
```bash
aws dynamodb scan --table-name tfstate-locks
```
终端 A 完成后，锁会被释放。

### 6. 验证版本管理
```bash
aws s3api list-object-versions --bucket $BUCKET --prefix ml/lab/
```
每次 Apply 都产生一个新版本。要回滚，可恢复较早版本。

## 验证

- [ ] 状态文件位于 S3，而非本地磁盘。
- [ ] 并发 Apply 尝试被阻止，并返回明确错误。
- [ ] 在 S3 中可以看到多个状态版本。

## 清理
```bash
# In your project:
terraform destroy
# In bootstrap (only after no projects use the state any more):
cd bootstrap && terraform destroy
```

## 故障排查

- **`Failed to get existing workspaces: AccessDenied`** — IAM 权限问题；需要存储桶上的 `s3:ListBucket`、`s3:GetObject`、`s3:PutObject` 权限及表上的 `dynamodb:GetItem`/`PutItem`/`DeleteItem` 权限。
- **`Error: state snapshot was created by Terraform vX.Y, which is newer`** — 本地 Terraform 版本比创建状态的版本旧，请升级。
- **未启用状态版本管理** — 在初始化配置中添加 `aws_s3_bucket_versioning`。启用后每次保存都会创建新版本。

> 译注：本实验保留原文的 DynamoDB 锁方案；较新的 Terraform S3 后端还支持原生锁文件。
