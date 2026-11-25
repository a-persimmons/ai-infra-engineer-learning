# 实验 04：使用单一工具实现多云部署

**时长：** 90 分钟  **前置条件：** AWS/GCP/Azure 中任意两个账号；Terraform 1.6+。

## 目标

使用 Terraform 定义可移植的模型服务部署，然后在两个自行选择的云平台上应用同一根模块。完成后，iris-api 将在两个云平台上运行，通过不同 DNS 名称访问，但遵循相同 API 契约。

## 步骤

### 1. 项目布局
```
ml-multicloud/
├── modules/
│   ├── aws/ main.tf variables.tf outputs.tf
│   ├── gcp/ main.tf variables.tf outputs.tf
│   └── azure/ main.tf variables.tf outputs.tf
└── envs/
    ├── aws/  main.tf backend.tf
    └── gcp/  main.tf backend.tf
```

每个云模块均创建网络、托管容器运行时（ECS/Cloud Run/Container Apps）和公开负载均衡器。

### 2. 定义 AWS 模块（骨架）
```hcl
# modules/aws/main.tf
resource "aws_ecs_cluster" "this" { name = var.name }
resource "aws_ecs_service" "iris" {
  name            = "iris-api"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.iris.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  ...
}
output "endpoint" { value = aws_lb.this.dns_name }
```

### 3. 定义 GCP 模块（骨架）
```hcl
# modules/gcp/main.tf
resource "google_cloud_run_v2_service" "iris" {
  name     = "iris-api"
  location = var.region
  template {
    containers {
      image = var.image
      ports { container_port = 8000 }
    }
  }
}
output "endpoint" { value = google_cloud_run_v2_service.iris.uri }
```

### 4. 定义根模块
```hcl
# envs/aws/main.tf
module "iris" {
  source = "../../modules/aws"
  name   = "iris-multicloud"
  image  = var.image
  region = "us-west-2"
}
output "endpoint" { value = module.iris.endpoint }
```

`envs/gcp/main.tf` 类似。

### 5. 应用配置
```bash
cd envs/aws && terraform init && terraform apply -var image=$AWS_ECR_IMAGE
cd ../gcp  && terraform init && terraform apply -var image=$GCP_ARTIFACT_IMAGE
```

### 6. 验证两个端点
```bash
AWS_URL=$(cd envs/aws && terraform output -raw endpoint)
GCP_URL=$(cd envs/gcp && terraform output -raw endpoint)

for url in "$AWS_URL" "$GCP_URL"; do
  echo "== $url =="
  curl -s "$url/health"
  curl -s -X POST "$url/predict" -H 'content-type: application/json' \
    -d '{"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2}'
done
```

## 验证

- [ ] 两个端点访问 `/health` 均返回 200。
- [ ] 两个端点对相同输入返回相同预测。
- [ ] 各环境执行 `terraform destroy` 后，所有资源均被彻底清理（云平台控制台没有遗留资源）。

## 清理
```bash
cd envs/aws && terraform destroy -auto-approve
cd ../gcp  && terraform destroy -auto-approve
```

## 故障排查

- **两个云平台使用相同 Terraform 状态文件** — 后端必须按环境区分（每个环境使用不同的 S3 前缀或 GCS 存储桶）。
- **预测输出不同** — 两边必须部署相同模型产物。核对两个构建流水线中的 `model.joblib` SHA。
- **GCP Cloud Run 要求公开镜像** — 配置 Cloud Run 通过服务账号使用私有 Artifact Registry 镜像。
