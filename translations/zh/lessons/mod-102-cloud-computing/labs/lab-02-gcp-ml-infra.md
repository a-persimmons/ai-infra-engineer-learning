# 实验 02：搭建适用于机器学习的 GCP 环境

**时长：** 90 分钟  **前置条件：** 已启用结算的 GCP 项目。

## 目标

在 GCP 上搭建最小机器学习环境：VPC、存放模型产物的 GCS 存储桶、运行 iris-api 的 Compute Engine 虚拟机，以及具有托管证书的全球 HTTPS 负载均衡器。

## 步骤

### 1. 配置 CLI
```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud config set compute/region us-central1
```

### 2. 启用所需 API
```bash
gcloud services enable compute.googleapis.com storage.googleapis.com artifactregistry.googleapis.com
```

### 3. 创建网络与存储桶
```bash
gcloud compute networks create ml-lab --subnet-mode=auto
gsutil mb -l us-central1 gs://ml-lab-$(gcloud config get-value project)-artifacts
gsutil cp model.joblib gs://ml-lab-$(...)-artifacts/iris/model.joblib
```

### 4. 将 iris-api 推送至 Artifact Registry
```bash
gcloud artifacts repositories create iris --repository-format=docker --location=us-central1
docker tag iris-api:0.2 us-central1-docker.pkg.dev/$(gcloud config get-value project)/iris/iris-api:0.2
gcloud auth configure-docker us-central1-docker.pkg.dev
docker push us-central1-docker.pkg.dev/$(...)/iris/iris-api:0.2
```

### 5. 创建虚拟机
```bash
gcloud compute instances create-with-container iris-vm \
  --zone=us-central1-a --machine-type=e2-small \
  --container-image=us-central1-docker.pkg.dev/$(...)/iris/iris-api:0.2 \
  --tags=http-server \
  --network=ml-lab
gcloud compute firewall-rules create allow-iris --allow=tcp:80 --target-tags=http-server --network=ml-lab
```

### 6. 使用全球 HTTPS 负载均衡器提供入口

- 预留全球静态 IP。
- 创建一个包含该虚拟机的非托管实例组。
- 创建后端服务，配置 HTTP 健康检查路径 `/health`。
- 创建 URL 映射 → 目标 HTTPS 代理 → 全球转发规则。
- 为你的域名附加 Google 托管证书。

### 7. 测试
```bash
curl https://<your-domain>/health
```

## 验证

- [ ] HTTPS 端点的 `/health` 返回 200，`/predict` 返回有效预测。
- [ ] 托管证书状态为 ACTIVE。
- [ ] GCS 存储桶包含模型产物。

## 清理
```bash
gcloud compute forwarding-rules delete ... && gcloud compute target-https-proxies delete ... && gcloud compute url-maps delete ...
gcloud compute backend-services delete iris-be
gcloud compute instance-groups unmanaged delete iris-ig
gcloud compute instances delete iris-vm --zone=us-central1-a
gcloud artifacts repositories delete iris --location=us-central1
gsutil rm -r gs://ml-lab-$(...)-artifacts
gcloud compute networks delete ml-lab
```

## 故障排查

- **托管证书处于 PROVISIONING 超过一小时** — 域名 DNS A 记录必须指向负载均衡器 IP，且需要等待 TTL 到期。
- **虚拟机容器未启动** — `gcloud compute instances get-serial-port-output iris-vm --zone=us-central1-a` 可显示 Docker 拉取错误。
- **API 未启用错误** — 重新执行 `gcloud services enable` 步骤；配置传播可能需要 30 秒。
