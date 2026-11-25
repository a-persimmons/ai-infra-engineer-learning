# 第 06 课：容器镜像仓库

**时长：** 4 小时
**目标：** 掌握用于存储与分发机器学习 Docker 镜像的容器镜像仓库。

## 学习目标

完成本课后，你将能够：

1. 从 Docker Hub 推送及拉取镜像。
2. 使用云镜像仓库（ECR、GCR、ACR）。
3. 为机器学习镜像实施语义化版本管理。
4. 为企业设置私有镜像仓库。
5. 将镜像仓库与 CI/CD 流水线集成。
6. 扫描镜像中的安全漏洞。
7. 管理镜像生命周期及清理策略。

## 什么是容器镜像仓库？

**容器镜像仓库（Container Registry）** 是集中存储与分发 Docker 镜像的服务。

**类比：**
- Docker Registry 对于容器镜像，就像 GitHub 对于代码。
- 对可部署产物进行版本管理。
- 跨团队与环境共享镜像。

### 为什么在机器学习中使用镜像仓库？

**不使用镜像仓库：**
```bash
# Must build image on every machine
git clone repo
docker build -t ml-model .  # 20 minutes!
```

**使用镜像仓库：**
```bash
# Pull pre-built image
docker pull myregistry.com/ml-model:v1.0  # 2 minutes!
docker run myregistry.com/ml-model:v1.0
```

**收益：**
1. **快速部署**——无需重新构建。
2. **一致性**——在各环境部署相同镜像。
3. **版本管理**——追踪镜像版本。
4. **协作**——与团队共享镜像。
5. **CI/CD 集成**——自动化构建与部署。
6. **安全扫描**——自动发现漏洞。

## Docker Hub

### 概览

**Docker Hub** 是 Docker 默认使用的公共镜像仓库：
- 免费的公共 Repository。
- 原文所述免费权益包含一个私有 Repository。
- 官方镜像（python、ubuntu、nginx 等）。
- 支持与 GitHub 集成的自动构建。

### 创建 Docker Hub 账号

1. 访问 https://hub.docker.com。
2. 注册免费账号。
3. 验证电子邮件。
4. 创建访问 Token（Settings → Security）。

### 推送至 Docker Hub

```bash
# 1. Login
docker login
# Enter username and password (or access token)

# 2. Tag image with your Docker Hub username
docker tag ml-model:v1.0 yourusername/ml-model:v1.0

# 3. Push image
docker push yourusername/ml-model:v1.0

# 4. Pull from anywhere
docker pull yourusername/ml-model:v1.0
```

### 镜像命名规范

```
[registry]/[username]/[repository]:[tag]

docker.io/johndoe/ml-model:v1.0
└─registry─┘└username┘└repository┘└tag┘
```

**示例：**
```bash
# Docker Hub (default registry)
docker push johndoe/ml-model:v1.0
docker pull johndoe/ml-model:v1.0

# Docker Hub with explicit registry
docker push docker.io/johndoe/ml-model:v1.0

# Private registry
docker push myregistry.com/ml-model:v1.0
```

### 标签与版本管理

```bash
# Multiple tags for same image
docker tag ml-model:v1.0 johndoe/ml-model:v1.0
docker tag ml-model:v1.0 johndoe/ml-model:latest
docker tag ml-model:v1.0 johndoe/ml-model:prod

# Push all tags
docker push johndoe/ml-model:v1.0
docker push johndoe/ml-model:latest
docker push johndoe/ml-model:prod
```

### 私有 Repository

```bash
# Create private repo on Docker Hub (via web interface)
# Then push as usual
docker push johndoe/private-ml-model:v1.0

# Pull requires authentication
docker login
docker pull johndoe/private-ml-model:v1.0
```

## AWS Elastic Container Registry（ECR）

### 设置 ECR

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Create ECR repository
aws ecr create-repository --repository-name ml-model --region us-east-1

# Output:
# {
#     "repository": {
#         "repositoryUri": "123456789.dkr.ecr.us-east-1.amazonaws.com/ml-model"
#     }
# }
```

### 向 ECR 进行身份验证

```bash
# Get login password and authenticate
aws ecr get-login-password --region us-east-1 | \
    docker login --username AWS --password-stdin \
    123456789.dkr.ecr.us-east-1.amazonaws.com
```

### 推送至 ECR

```bash
# Tag image
docker tag ml-model:v1.0 \
    123456789.dkr.ecr.us-east-1.amazonaws.com/ml-model:v1.0

# Push
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ml-model:v1.0

# Pull
docker pull 123456789.dkr.ecr.us-east-1.amazonaws.com/ml-model:v1.0
```

### ECR 生命周期策略

**自动清理旧镜像：**

```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 production images",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["prod"],
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 2,
      "description": "Delete untagged images after 7 days",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 7
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
```

应用策略：

```bash
aws ecr put-lifecycle-policy \
    --repository-name ml-model \
    --lifecycle-policy-text file://policy.json
```

## Google Container Registry（GCR）/ Artifact Registry

### 设置 GCR

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login
gcloud auth configure-docker

# Or for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 推送至 GCR

```bash
# GCR format: gcr.io/[PROJECT-ID]/[IMAGE]
docker tag ml-model:v1.0 gcr.io/my-project/ml-model:v1.0

# Push
docker push gcr.io/my-project/ml-model:v1.0

# Pull
docker pull gcr.io/my-project/ml-model:v1.0
```

### Artifact Registry（推荐）

```bash
# Create repository
gcloud artifacts repositories create ml-models \
    --repository-format=docker \
    --location=us-central1

# Tag and push
docker tag ml-model:v1.0 \
    us-central1-docker.pkg.dev/my-project/ml-models/ml-model:v1.0

docker push us-central1-docker.pkg.dev/my-project/ml-models/ml-model:v1.0
```

## Azure Container Registry（ACR）

### 设置 ACR

```bash
# Install Azure CLI
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Create registry
az acr create --resource-group myResourceGroup \
    --name mymlregistry --sku Basic

# Login to registry
az acr login --name mymlregistry
```

### 推送至 ACR

```bash
# Get login server
az acr show --name mymlregistry --query loginServer

# Output: mymlregistry.azurecr.io

# Tag and push
docker tag ml-model:v1.0 mymlregistry.azurecr.io/ml-model:v1.0
docker push mymlregistry.azurecr.io/ml-model:v1.0

# Pull
docker pull mymlregistry.azurecr.io/ml-model:v1.0
```

## 镜像标签策略

### 语义化版本管理

**格式：** `MAJOR.MINOR.PATCH`（主版本号.次版本号.修订号）。

```bash
# Version 1.0.0 - initial release
docker tag ml-model myregistry/ml-model:1.0.0

# Version 1.0.1 - bug fix
docker tag ml-model myregistry/ml-model:1.0.1

# Version 1.1.0 - new feature
docker tag ml-model myregistry/ml-model:1.1.0

# Version 2.0.0 - breaking change
docker tag ml-model myregistry/ml-model:2.0.0
```

### 基于 Git 的标签

```bash
# Use git commit SHA
GIT_SHA=$(git rev-parse --short HEAD)
docker tag ml-model myregistry/ml-model:${GIT_SHA}

# Use git branch
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
docker tag ml-model myregistry/ml-model:${GIT_BRANCH}

# Use git tag
GIT_TAG=$(git describe --tags --abbrev=0)
docker tag ml-model myregistry/ml-model:${GIT_TAG}
```

### 环境标签

```bash
# Development
docker tag ml-model myregistry/ml-model:dev

# Staging
docker tag ml-model myregistry/ml-model:staging

# Production
docker tag ml-model myregistry/ml-model:prod
docker tag ml-model myregistry/ml-model:latest  # Also tag as latest
```

### 组合策略

```bash
# Multiple tags for production deployment
VERSION="1.2.0"
GIT_SHA=$(git rev-parse --short HEAD)

docker tag ml-model myregistry/ml-model:${VERSION}
docker tag ml-model myregistry/ml-model:${VERSION}-${GIT_SHA}
docker tag ml-model myregistry/ml-model:latest
docker tag ml-model myregistry/ml-model:prod

# Push all
docker push myregistry/ml-model --all-tags
```

## CI/CD 集成

### GitHub Actions 示例

**.github/workflows/build-push.yml：**
```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: yourusername/ml-model
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### GitLab CI 示例

**.gitlab-ci.yml：**
```yaml
variables:
  DOCKER_DRIVER: overlay2
  IMAGE_NAME: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA

stages:
  - build
  - push

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $IMAGE_NAME .
    - docker push $IMAGE_NAME

push-latest:
  stage: push
  image: docker:latest
  only:
    - main
  script:
    - docker pull $IMAGE_NAME
    - docker tag $IMAGE_NAME $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:latest
```

## 安全扫描

### Docker Scan（Snyk）

```bash
# Scan local image
docker scan ml-model:v1.0

# Scan with specific severity
docker scan --severity=high ml-model:v1.0

# View detailed report
docker scan --json ml-model:v1.0 > scan-report.json
```

### Trivy 扫描器

```bash
# Install Trivy
sudo apt-get install trivy

# Scan image
trivy image ml-model:v1.0

# Scan for HIGH and CRITICAL only
trivy image --severity HIGH,CRITICAL ml-model:v1.0

# Output to JSON
trivy image -f json -o results.json ml-model:v1.0
```

### ECR 镜像扫描

```bash
# Enable scanning on push
aws ecr put-image-scanning-configuration \
    --repository-name ml-model \
    --image-scanning-configuration scanOnPush=true

# Manual scan
aws ecr start-image-scan \
    --repository-name ml-model \
    --image-id imageTag=v1.0

# Get scan results
aws ecr describe-image-scan-findings \
    --repository-name ml-model \
    --image-id imageTag=v1.0
```

> 译注：GCR 与 Docker Scan 属于原文所处时期的工具或服务，新的部署应核对受支持的 Artifact Registry、Docker Scout 或 Trivy 等方案。Docker Hub 免费权益和自动构建资格也以当前套餐为准。

## 私有镜像仓库配置

### Docker Registry（自建）

```bash
# Run registry container
docker run -d -p 5000:5000 \
    --name registry \
    -v registry-data:/var/lib/registry \
    registry:2

# Push to local registry
docker tag ml-model localhost:5000/ml-model:v1.0
docker push localhost:5000/ml-model:v1.0

# Pull from local registry
docker pull localhost:5000/ml-model:v1.0
```

### 使用 TLS 保护私有镜像仓库

**docker-compose.yml：**
```yaml
version: '3.8'

services:
  registry:
    image: registry:2
    ports:
      - "5000:5000"
    environment:
      REGISTRY_HTTP_TLS_CERTIFICATE: /certs/domain.crt
      REGISTRY_HTTP_TLS_KEY: /certs/domain.key
      REGISTRY_AUTH: htpasswd
      REGISTRY_AUTH_HTPASSWD_PATH: /auth/htpasswd
      REGISTRY_AUTH_HTPASSWD_REALM: Registry Realm
    volumes:
      - ./certs:/certs
      - ./auth:/auth
      - registry-data:/var/lib/registry

volumes:
  registry-data:
```

## 动手练习：多镜像仓库工作流

### 目标

构建机器学习模型镜像，使用适当标签将其推送至多个镜像仓库。

### 步骤

**1. 构建镜像：**
```bash
docker build -t ml-model:local .
```

**2. 为多个镜像仓库添加标签：**
```bash
VERSION="1.0.0"
GIT_SHA=$(git rev-parse --short HEAD)

# Docker Hub
docker tag ml-model:local \
    yourusername/ml-model:${VERSION}
docker tag ml-model:local \
    yourusername/ml-model:latest

# AWS ECR
docker tag ml-model:local \
    123456789.dkr.ecr.us-east-1.amazonaws.com/ml-model:${VERSION}

# GCP Artifact Registry
docker tag ml-model:local \
    us-central1-docker.pkg.dev/my-project/ml-models/ml-model:${VERSION}
```

**3. 推送至镜像仓库：**
```bash
# Docker Hub
docker push yourusername/ml-model:${VERSION}
docker push yourusername/ml-model:latest

# ECR
aws ecr get-login-password --region us-east-1 | \
    docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ml-model:${VERSION}

# GCR
gcloud auth configure-docker us-central1-docker.pkg.dev
docker push us-central1-docker.pkg.dev/my-project/ml-models/ml-model:${VERSION}
```

**4. 扫描漏洞：**
```bash
trivy image yourusername/ml-model:${VERSION}
```

## 最佳实践

### 1. 避免在生产环境使用 :latest

**不推荐：**
```bash
docker pull ml-model:latest  # Which version?
```

**推荐：**
```bash
docker pull ml-model:1.2.3  # Explicit version
```

### 2. 使用多个标识为镜像添加标签

```bash
# Semantic version + git SHA + environment
docker tag ml-model myregistry/ml-model:1.2.3
docker tag ml-model myregistry/ml-model:1.2.3-abc123f
docker tag ml-model myregistry/ml-model:prod
```

### 3. 实施镜像清理策略

```bash
# Delete old images from Docker Hub manually
# Use lifecycle policies in ECR/GCR/ACR

# Clean local images
docker image prune -a --filter "until=720h"  # Older than 30 days
```

### 4. 使用多架构镜像

```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 \
    -t myregistry/ml-model:1.0.0 --push .
```

## 总结

本课学习了：

1. **Docker Hub**——公共及私有 Repository。
2. **云镜像仓库**——ECR、GCR、ACR 的设置与使用。
3. **标签策略**——语义化版本管理、基于 Git 的标签。
4. **CI/CD 集成**——自动化构建及推送。
5. **安全扫描**——使用 Trivy 检测漏洞。
6. **私有镜像仓库**——自建仓库的设置。

**核心要点：**
- 使用镜像仓库实现快速、一致的部署。
- 使用明确版本标记镜像。
- 扫描镜像中的安全漏洞。
- 实施清理策略。
- 与 CI/CD 集成，实现自动化。

## 下一步是什么？

下一课 **07-gpu-docker.md** 将学习：
- 安装 NVIDIA Container Toolkit。
- 在容器中运行 GPU 工作负载。
- 支持 GPU 的基础镜像。
- 监控容器中的 GPU 使用情况。
- 多 GPU 容器部署。

---

## 自我检查问题

1. Docker Hub 与私有镜像仓库有什么区别？
2. 如何为 AWS ECR 中的镜像添加标签？
3. 在生产环境使用 :latest 标签有什么问题？
4. 如何扫描镜像中的漏洞？
5. 什么是生命周期策略？为什么有用？

## 补充资源

- [Docker Hub 文档](https://docs.docker.com/docker-hub/)
- [AWS ECR 用户指南](https://docs.aws.amazon.com/ecr/)
- [Google Artifact Registry](https://cloud.google.com/artifact-registry/docs)
- [Trivy 扫描器](https://github.com/aquasecurity/trivy)

---

**下一课：** [07-gpu-docker.md](./07-gpu-docker.md)

> 译注：版本标签也可能被覆盖，生产部署宜固定镜像 Digest 或启用不可变标签策略。使用镜像仓库时应优先采用短期身份凭据、最小权限、可信签名与漏洞修复流程；扫描通过并不代表不存在安全风险。清理策略应保留正在运行及允许回滚的镜像版本。全部原始代码块及英文注释保持不变，具体命令与服务费用需按当前版本核对。
