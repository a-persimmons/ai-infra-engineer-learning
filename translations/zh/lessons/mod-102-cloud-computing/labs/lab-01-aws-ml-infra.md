# 实验 01：搭建适用于机器学习的 AWS 环境

**时长：** 90 分钟  **前置条件：** AWS 账号、沙箱账号中的 IAM 管理权限。

## 目标

在 AWS 上部署一个最小化机器学习工作负载：具有公有和私有子网的 VPC、存储模型产物的 S3 存储桶、运行 iris-api 容器的 EC2 实例，以及位于其前方的应用负载均衡器（ALB）。完成后，你将拥有一个对外提供预测服务的 URL。

## 步骤

### 1. 配置 CLI
```bash
aws configure                  # access key, region us-west-2, output json
aws sts get-caller-identity
```

### 2. 创建 VPC 与子网（CloudShell 或本地）
```bash
aws cloudformation deploy --template-file vpc.yaml --stack-name ml-lab-vpc --capabilities CAPABILITY_NAMED_IAM
```
（也可以使用 AWS 控制台：VPC → “Create VPC with subnets” → 2 个可用区，每个包含一个公有和一个私有子网。）

### 3. 创建 S3 存储桶
```bash
aws s3 mb s3://ml-lab-$(aws sts get-caller-identity --query Account --output text)-artifacts
aws s3 cp model.joblib s3://ml-lab-$(...)-artifacts/iris/model.joblib
```

### 4. 使用 iris-api 镜像启动 EC2 实例

- 实例类型：`t3.small`
- AMI：Amazon Linux 2023
- 安全组：允许来自你自身 IP 的 22 端口入站流量，以及来自 0.0.0.0/0 的 80 端口入站流量。
- 用户数据：
  ```bash
  #!/bin/bash
  yum install -y docker
  systemctl enable --now docker
  docker run -d -p 80:8000 --restart=always your-account.dkr.ecr.us-west-2.amazonaws.com/iris-api:0.2
  ```

### 5. 创建 ALB 与目标组

- ALB 位于公有子网，监听 80 端口。
- 目标组：实例协议 HTTP，端口 80，健康检查路径 `/health`。
- 注册 EC2 实例。

### 6. 测试
```bash
curl http://<alb-dns-name>/health
curl -X POST http://<alb-dns-name>/predict -H 'content-type: application/json' \
  -d '{"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2}'
```

## 验证

- [ ] 使用 ALB DNS 名称访问 `/health`，返回 200。
- [ ] `/predict` 返回 JSON 预测结果。
- [ ] S3 存储桶包含 `iris/model.joblib`。
- [ ] EC2 安全组不允许来自 0.0.0.0/0 的 22 端口流量。

## 清理
```bash
aws elbv2 delete-load-balancer --load-balancer-arn <arn>
aws ec2 terminate-instances --instance-ids <id>
aws s3 rb s3://ml-lab-$(...)-artifacts --force
aws cloudformation delete-stack --stack-name ml-lab-vpc
```

## 故障排查

- **EC2 user-data 未执行** — 通过 SSM Session Manager 检查 `/var/log/cloud-init-output.log`。
- **ALB 健康检查失败** — 确保 EC2 安全组允许来自 ALB 安全组的流量，而不只是你自己的 IP。
- **ECR 镜像拉取被拒绝** — 为实例角色附加 `AmazonEC2ContainerRegistryReadOnly`。
