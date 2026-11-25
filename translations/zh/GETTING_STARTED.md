# 快速开始——AI 基础设施工程师学习路线

本指南将帮助你搭建环境，并开始成为 AI 基础设施工程师的学习旅程。

## 目录

- [前置条件检查](#前置条件检查)
- [环境搭建](#环境搭建)
- [云账号配置](#云账号配置)
- [工具安装](#工具安装)
- [验证安装](#验证安装)
- [你的第一课](#你的第一课)
- [学习建议](#学习建议)
- [故障排查](#故障排查)

---

## 前置条件检查

开始前，请确认具备以下条件：

### 必需技能

- **Python**：中级水平（函数、类、基本错误处理）。
  - 自测：能否编写一个带方法的类？
  - 自测：是否理解装饰器与上下文管理器？
- **Linux/Unix**：基本命令行操作。
  - 自测：能否切换目录、创建文件并使用 grep？
- **Git**：基础版本控制。
  - 自测：能否克隆、提交、推送并创建分支？
- **机器学习**：基础概念。
  - 自测：是否理解训练、推理与模型评估？

### 推荐技能

- 了解云平台（AWS/GCP/Azure 基础）。
- Docker 基础（容器概念）。
- 网络基础（HTTP、DNS、负载均衡）。
- SQL 基础。

### 硬件要求

- **最低配置**：8GB 内存、20GB 可用磁盘空间。
- **推荐配置**：16GB 内存、50GB 可用磁盘空间、GPU（用于本地实验）。
- **互联网**：用于访问云服务的稳定连接。

---

## 环境搭建

### 1. 安装 Python 3.11+

**Linux/macOS：**
```bash
# Check current Python version
python3 --version

# Install Python 3.11 (Ubuntu/Debian)
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev

# Verify installation
python3.11 --version
```

**macOS（Homebrew）：**
```bash
brew install python@3.11
```

**Windows：**
从 [python.org](https://www.python.org/downloads/) 下载安装。

### 2. 克隆仓库

```bash
# Clone this repository
git clone https://github.com/ai-infra-curriculum/ai-infra-engineer-learning.git
cd ai-infra-engineer-learning

# Verify you're in the right directory
ls -la
# You should see: lessons/, projects/, README.md, etc.
```

### 3. 创建虚拟环境

```bash
# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# Your prompt should now show (venv)
```

### 4. 安装依赖

```bash
# Upgrade pip
pip install --upgrade pip

# Install core requirements
pip install -r requirements.txt

# Verify installations
pip list
```

**预期安装的包：**

- fastapi
- uvicorn
- torch
- transformers
- numpy
- pandas
- prometheus-client
- pydantic
- pytest

---

## 云账号配置

你至少需要一个云服务提供商的账号（模块 02 推荐三家均配置）。

> 译注：以下免费额度和有效期按原文翻译，并非当前政策核验结果。创建资源前请确认云服务商最新价格及免费条件，并设置预算告警。

### AWS 免费额度

1. 访问 [aws.amazon.com](https://aws.amazon.com/free/)。
2. 点击 “Create a Free Account”。
3. 完成注册（需要信用卡；在符合免费额度条件时不会收取对应费用）。
4. **原文所列免费额度包括：**
   - 每月 750 小时 t2.micro 或 t3.micro EC2 实例（12 个月）。
   - 5GB S3 存储。
   - 750 小时 RDS（12 个月）。

**安装 AWS CLI：**
```bash
# Linux/macOS
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify
aws --version

# Configure (you'll need access keys from AWS Console)
aws configure
```

### GCP 免费额度

1. 访问 [cloud.google.com/free](https://cloud.google.com/free)。
2. 点击 “Get started for free”。
3. 完成注册。
4. **额度：**
   - 90 天内可使用 300 美元额度。
   - 额度到期后仍有符合条件的长期免费额度。

**安装 gcloud CLI：**
```bash
# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize
gcloud init

# Verify
gcloud --version
```

### Azure 免费额度

1. 访问 [azure.microsoft.com/free](https://azure.microsoft.com/free)。
2. 点击 “Start free”。
3. 完成注册。
4. **额度：**
   - 30 天内可使用 200 美元额度。
   - 12 个月的免费服务。

**安装 Azure CLI：**
```bash
# Linux/macOS
curl -L https://aka.ms/InstallAzureCli | bash

# Verify
az --version

# Login
az login
```

---

## 工具安装

### 1. Docker

**Linux：**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker run hello-world
```

**macOS/Windows：**
下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)。

### 2. Kubernetes（kubectl）

```bash
# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify
kubectl version --client
```

### 3. Minikube（本地 Kubernetes）

```bash
# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start minikube
minikube start

# Verify
kubectl get nodes
```

### 4. Terraform

```bash
# Linux
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Verify
terraform --version
```

### 5. Git（如果尚未安装）

```bash
# Linux
sudo apt install git

# Configure
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 验证安装

运行以下验证脚本，检查所有工具的安装情况：

```bash
# Create verification script
cat > verify_setup.sh << 'EOF'
#!/bin/bash

echo "=== Verifying Installation ==="
echo ""

# Python
echo -n "Python 3.11+: "
python3 --version 2>/dev/null || echo "❌ NOT FOUND"

# Pip packages
echo -n "FastAPI: "
python3 -c "import fastapi" 2>/dev/null && echo "✅ OK" || echo "❌ NOT FOUND"

echo -n "PyTorch: "
python3 -c "import torch" 2>/dev/null && echo "✅ OK" || echo "❌ NOT FOUND"

echo -n "Transformers: "
python3 -c "import transformers" 2>/dev/null && echo "✅ OK" || echo "❌ NOT FOUND"

# Docker
echo -n "Docker: "
docker --version 2>/dev/null && echo "✅ OK" || echo "❌ NOT FOUND"

# Kubernetes
echo -n "kubectl: "
kubectl version --client 2>/dev/null | head -1 && echo "✅ OK" || echo "❌ NOT FOUND"

# Cloud CLIs
echo -n "AWS CLI: "
aws --version 2>/dev/null && echo "✅ OK" || echo "⚠️  OPTIONAL"

echo -n "gcloud CLI: "
gcloud --version 2>/dev/null | head -1 && echo "✅ OK" || echo "⚠️  OPTIONAL"

echo -n "Azure CLI: "
az --version 2>/dev/null | head -1 && echo "✅ OK" || echo "⚠️  OPTIONAL"

# Terraform
echo -n "Terraform: "
terraform --version 2>/dev/null | head -1 && echo "✅ OK" || echo "❌ NOT FOUND"

echo ""
echo "=== Verification Complete ==="
EOF

chmod +x verify_setup.sh
./verify_setup.sh
```

**预期输出：**
```
=== Verifying Installation ===

Python 3.11+: Python 3.11.x ✅ OK
FastAPI: ✅ OK
PyTorch: ✅ OK
Transformers: ✅ OK
Docker: ✅ OK
kubectl: ✅ OK
AWS CLI: ✅ OK (or ⚠️ OPTIONAL)
gcloud CLI: ✅ OK (or ⚠️ OPTIONAL)
Azure CLI: ✅ OK (or ⚠️ OPTIONAL)
Terraform: ✅ OK

=== Verification Complete ===
```

---

## 你的第一课

现在环境已经搭建完成，从模块 01 开始学习！

```bash
# Navigate to Module 01
cd lessons/mod-101-foundations

# Read the module overview
cat README.md

# Start with Lesson 01
cd 01-introduction
cat README.md
```

### 推荐学习路线

1. **第 1–2 周**：模块 01，第 01–04 课（基础）。
2. **第 3–4 周**：模块 01，第 05–08 课（Docker、API）。
3. **第 5–6 周**：项目 01（基础模型服务）。
4. **第 7–10 周**：模块 02（云计算）。
5. **第 11 周及之后**：继续模块 03 及后续模块。

### 学习时间安排

**全职学习（每周 40 小时）：**

- 约 12–15 周完成。

**兼职学习（每周 10 小时）：**

- 约 50–60 周完成（约一年）。

**周末集中学习（每周 20 小时）：**

- 约 25–30 周完成（约 6–7 个月）。

---

## 学习建议

### 1. 动手实践

- **不要只阅读**：亲手输入所有代码示例。
- **进行实验**：修改代码、破坏系统并修复。
- **记录**：记录所学内容。

### 2. 基于项目学习

- 完成每课中的所有练习。
- 从零构建项目（不要跳过）。
- 为项目扩展自己的功能。

### 3. 云资源预算管理

- **在所有云平台控制台设置账单告警**（推荐阈值：10、25、50 美元）。
- 尽可能使用免费额度内的资源。
- 每次练习结束后关闭或清理资源。
- 使用 Spot/可抢占实例节省成本。

### 4. 参与社区

- 加入 [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions)。
- 分享项目及解决方案。
- 帮助其他学习者。

### 5. 追踪学习进度

使用进度追踪工具：

```bash
# Copy the progress template
cp progress/checklist.md progress/my-progress.md

# Update as you complete lessons
```

---

## 故障排查

### 常见问题

#### 问题：`python3.11: command not found`

**解决方法：**
```bash
# Linux: Install Python 3.11
sudo apt install python3.11

# macOS: Use Homebrew
brew install python@3.11
```

#### 问题：`docker: permission denied`

**解决方法：**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo (not recommended)
sudo docker run hello-world
```

#### 问题：`pip install` 因 SSL 错误失败

**解决方法：**
```bash
# Update pip and certificates
pip install --upgrade pip certifi

# Or use HTTP (less secure)
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org <package>
```

#### 问题：磁盘空间不足

**解决方法：**
```bash
# Clean Docker images
docker system prune -a

# Clean pip cache
pip cache purge

# Clean conda cache (if using conda)
conda clean --all
```

#### 问题：云平台 CLI 身份验证失败

**AWS：**
```bash
# Reconfigure
aws configure

# Check credentials
aws sts get-caller-identity
```

**GCP：**
```bash
# Re-authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

**Azure：**
```bash
# Re-login
az login

# Check subscription
az account show
```

### 获取帮助

1. **查看 FAQ**：[resources/faq.md](./resources/faq.md)。
2. **搜索 Issue**：[GitHub Issues](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/issues)。
3. **在 Discussions 中提问**：[GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions)。
4. **创建 Issue**：报告错误或不明确的说明。

---

## 下一步

你已准备好开始学习！下面是行动计划：

- [ ] 验证所有工具已安装（运行 `verify_setup.sh`）。
- [ ] 配置至少一个云账号。
- [ ] 配置账单告警。
- [ ] 开始模块 01，第 01 课。
- [ ] 加入 GitHub Discussions 社区。
- [ ] 为仓库加星，以便跟踪更新。

---

## 快速参考

### 必备命令

```bash
# Activate virtual environment
source venv/bin/activate

# Run tests
pytest

# Start FastAPI server
uvicorn app:app --reload

# Docker build and run
docker build -t myapp .
docker run -p 8000:8000 myapp

# Kubernetes
kubectl apply -f deployment.yaml
kubectl get pods
kubectl logs <pod-name>

# Check cloud resources
aws ec2 describe-instances
gcloud compute instances list
az vm list
```

### 资源限制（原文免费额度）

| 云服务商 | 计算 | 存储 | 有效期 |
|----------|---------|---------|----------|
| AWS | 750 小时 t2.micro | 5GB S3 | 12 个月 |
| GCP | 300 美元额度 | 包含在额度内 | 90 天 |
| Azure | 200 美元额度 | 包含在额度内 | 30 天 |

---

**准备开始 AI 基础设施工程学习之旅了吗？**

```bash
cd lessons/mod-101-foundations/01-introduction
cat README.md
```

祝学习顺利！
