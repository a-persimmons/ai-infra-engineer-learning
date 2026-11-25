# 第 02 课：开发环境配置

**时长：** 5 小时
**目标：** 安装并配置机器学习基础设施开发所需的全部工具。

## 概览

配置良好的开发环境对于高效开展机器学习基础设施工作至关重要。本课将安装并配置：

- Python 3.9+ 与虚拟环境。
- 用于版本控制的 Git。
- 用于容器化的 Docker。
- Kubernetes 命令行工具。
- 云平台 CLI（AWS/GCP/Azure）。
- 代码编辑器（VS Code 或 PyCharm）。
- 必备 Python 依赖包。

完成后，你将拥有专业的机器学习基础设施开发环境。

## 步骤 1：准备操作系统

### Linux（推荐 Ubuntu/Debian）

如果使用 Linux，你已经具备良好的基础！大多数工具都可以原生运行。

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install build essentials
sudo apt install -y build-essential curl wget git
```

### macOS

macOS 非常适合开发。首先安装 Homebrew：

```bash
# Install Homebrew (package manager for macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Verify installation
brew --version
```

### Windows 与 WSL2

对于 Windows，使用 Windows Subsystem for Linux 2（WSL2）：

```powershell
# In PowerShell (Administrator)
wsl --install

# Restart computer

# After restart, set Ubuntu as default
wsl --set-default-version 2
wsl --install -d Ubuntu-22.04
```

安装完成后，从开始菜单打开 Ubuntu，并按照 Linux 的说明操作。

## 步骤 2：安装 Python 3.9+

### 检查当前 Python 版本

```bash
python3 --version
```

如果已安装 Python 3.9 或更高版本，跳到虚拟环境配置部分。

### 安装 Python 3.11（推荐）

**Ubuntu/Debian：**
```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev
```

**macOS：**
```bash
brew install python@3.11
```

### 设置 Python 虚拟环境

虚拟环境能够隔离项目依赖：

```bash
# Install pip if needed
python3.11 -m ensurepip --upgrade

# Create virtual environment for this course
python3.11 -m venv ~/ai-infra-venv

# Activate virtual environment
source ~/ai-infra-venv/bin/activate

# On Windows WSL:
source ~/ai-infra-venv/bin/activate

# Verify Python in venv
which python
python --version  # Should show 3.11.x
```

为了使用方便，**将激活命令添加到 Shell 配置文件**：

```bash
# For bash
echo 'alias activate-ai="source ~/ai-infra-venv/bin/activate"' >> ~/.bashrc
source ~/.bashrc

# For zsh (macOS default)
echo 'alias activate-ai="source ~/ai-infra-venv/bin/activate"' >> ~/.zshrc
source ~/.zshrc
```

现在只需输入 activate-ai 即可激活环境。

### 安装必备 Python 依赖包

```bash
# Make sure venv is activated
source ~/ai-infra-venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install core ML and infrastructure packages
pip install \
    torch torchvision \
    tensorflow \
    transformers \
    numpy pandas scikit-learn \
    fastapi uvicorn \
    requests httpx \
    pyyaml python-dotenv \
    pytest pytest-asyncio \
    black flake8 mypy
```

安装预计需要 5–10 分钟，可以休息片刻。

## 步骤 3：安装 Git

Git 是版本控制的必备工具。

**Ubuntu/Debian：**
```bash
sudo apt install -y git
```

**macOS：**
```bash
brew install git
```

**配置 Git：**
```bash
# Set your name and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

### 设置 GitHub 账号

1. 如果尚未注册，在 [github.com](https://github.com) 创建账号。
2. 设置用于身份验证的 SSH 密钥：

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Press Enter to accept default location
# Enter a passphrase (optional but recommended)

# Start SSH agent
eval "$(ssh-agent -s)"

# Add SSH key
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
# Copy the output
```

3. 前往 GitHub → Settings → SSH and GPG keys → New SSH key。
4. 粘贴公钥并保存。
5. 测试连接：

```bash
ssh -T git@github.com
# Should see: "Hi username! You've successfully authenticated"
```

## 步骤 4：安装 Docker

Docker 是容器化的重要工具。

### Ubuntu/Debian

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up stable repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to docker group (avoid sudo)
sudo usermod -aG docker $USER

# Log out and log back in for group change to take effect
```

### macOS

```bash
# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop from Applications
# Wait for it to finish starting (whale icon in menu bar)
```

### Windows（WSL2）

从 [docker.com](https://www.docker.com/products/docker-desktop/) 下载并安装 Docker Desktop。

启用 WSL2 集成：

- 打开 Docker Desktop → Settings → Resources → WSL Integration。
- 启用与 Ubuntu 的集成。

### 验证 Docker 安装

```bash
# Check version
docker --version

# Run test container
docker run hello-world

# Should see "Hello from Docker!" message
```

## 步骤 5：安装 Kubernetes 工具

### kubectl（Kubernetes CLI）

**Linux：**
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

**macOS：**
```bash
brew install kubectl
```

**验证：**
```bash
kubectl version --client
```

### minikube（本地 Kubernetes）

**Linux：**
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

**macOS：**
```bash
brew install minikube
```

**验证：**
```bash
minikube version

# Start minikube (we'll use this in Module 04)
# Don't run this yet if low on resources
# minikube start --driver=docker
```

### Helm（Kubernetes 包管理器）

**Linux/macOS：**
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

**验证：**
```bash
helm version
```

## 步骤 6：安装云平台 CLI

首先选择一个云平台（以后可以添加其他平台）。

### AWS CLI

```bash
# Linux/macOS
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# macOS alternative
brew install awscli

# Verify
aws --version

# Configure (if you have AWS account)
aws configure
# Enter Access Key ID, Secret Access Key, region (us-east-1), output format (json)
```

### Google Cloud SDK

```bash
# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# macOS
brew install --cask google-cloud-sdk

# Initialize
gcloud init
```

### Azure CLI

```bash
# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# macOS
brew update && brew install azure-cli

# Login
az login
```

**对于本课程，至少拥有一个云平台 CLI 即可。**

## 步骤 7：安装代码编辑器

### VS Code（推荐）

**Linux：**
```bash
# Download .deb package
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code
```

**macOS：**
```bash
brew install --cask visual-studio-code
```

**必备 VS Code 扩展：**
```bash
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-kubernetes-tools.vscode-kubernetes-tools
code --install-extension eamodio.gitlens
code --install-extension redhat.vscode-yaml
code --install-extension github.copilot  # Optional, requires subscription
```

### PyCharm（替代方案）

从 [jetbrains.com](https://www.jetbrains.com/pycharm/) 下载 PyCharm Community（免费）。

## 步骤 8：验证完整配置

运行以下验证脚本：

```bash
#!/bin/bash
# save as verify-setup.sh

echo "=== Verifying ML Infrastructure Development Environment ==="
echo ""

# Python
echo "Python Version:"
python --version || echo "❌ Python not found"
echo ""

# Pip packages
echo "Key Python Packages:"
python -c "import torch; print(f'PyTorch: {torch.__version__}')" || echo "❌ PyTorch not installed"
python -c "import tensorflow as tf; print(f'TensorFlow: {tf.__version__}')" || echo "❌ TensorFlow not installed"
python -c "import fastapi; print(f'FastAPI: {fastapi.__version__}')" || echo "❌ FastAPI not installed"
echo ""

# Git
echo "Git Version:"
git --version || echo "❌ Git not found"
echo ""

# Docker
echo "Docker Version:"
docker --version || echo "❌ Docker not found"
docker ps > /dev/null 2>&1 && echo "✅ Docker running" || echo "⚠️  Docker not running (start Docker Desktop)"
echo ""

# Kubernetes
echo "Kubernetes Tools:"
kubectl version --client --short || echo "❌ kubectl not found"
minikube version --short || echo "❌ minikube not found"
helm version --short || echo "❌ helm not found"
echo ""

# Cloud CLI (at least one)
echo "Cloud CLIs:"
aws --version 2>/dev/null && echo "✅ AWS CLI installed" || echo "⚠️  AWS CLI not installed"
gcloud --version 2>/dev/null && echo "✅ GCloud CLI installed" || echo "⚠️  GCloud CLI not installed"
az --version 2>/dev/null && echo "✅ Azure CLI installed" || echo "⚠️  Azure CLI not installed"
echo ""

echo "=== Verification Complete ==="
echo "If you see ❌ errors, review the installation steps for those tools."
```

执行：

```bash
chmod +x verify-setup.sh
./verify-setup.sh
```

## 步骤 9：创建项目结构

为本课程设置工作空间：

```bash
# Create workspace directory
mkdir -p ~/ai-infra-learning
cd ~/ai-infra-learning

# Initialize git repository
git init

# Create standard structure
mkdir -p {modules/01-foundations,projects/{project-01,project-02,project-03},exercises,notes}

# Create .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
*.egg-info/
.pytest_cache/

# IDEs
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Environment variables
.env
.env.local

# Data files (don't commit large files)
*.csv
*.h5
*.pkl
*.pth
*.ckpt

# Model files
models/
*.model
*.weights

# Docker
*.tar
EOF

# Create README
cat > README.md << 'EOF'
# AI Infrastructure Learning Journey

This repository contains my work for the AI Infrastructure Engineer curriculum.

## Structure

- `modules/` - Notes and exercises for each module
- `projects/` - Hands-on projects
- `exercises/` - Practice exercises
- `notes/` - Personal learning notes

## Progress

- [ ] Module 01: Foundations
- [ ] Project 01: Basic Model Serving
- ...
EOF

# Initial commit
git add .
git commit -m "Initial setup: Project structure"

# Connect to GitHub (create repo at github.com first)
# git remote add origin git@github.com:yourusername/ai-infra-learning.git
# git push -u origin main
```

## 故障排查

### Docker 权限不足

```bash
sudo usermod -aG docker $USER
# Log out and log back in
```

### Python 依赖包安装失败

```bash
# Update pip and setuptools
pip install --upgrade pip setuptools wheel

# Try again
pip install <package-name>
```

### minikube 无法启动

```bash
# Delete and recreate
minikube delete
minikube start --driver=docker --memory=4096
```

### 云平台 CLI 身份验证问题

```bash
# AWS
aws configure

# GCloud
gcloud auth login
gcloud config set project <your-project-id>

# Azure
az login
```

## 后续步骤

恭喜！现在你已经配置了专业的机器学习基础设施开发环境。

**第 03 课**将深入探讨机器学习基础设施概念与机器学习生命周期。

在此之前，请完成练习 01，实践新配置的环境。

---

## 练习 01：环境验证

**文件：** exercises/exercise-01-environment.md

**任务：**
1. 运行验证脚本，确保全部工具均已安装。
2. 创建简单的 Python 脚本，导入 PyTorch 与 TensorFlow。
3. 运行 Docker 容器并验证其正常工作。
4. 创建 Git 仓库并进行首次提交。
5. 对成功执行的结果截图。

**交付物：**
- 包含代码与截图的 GitHub 仓库。
- 记录配置过程的 README。

---

## 补充资源

- [Docker 文档](https://docs.docker.com/)
- [Kubernetes 文档](https://kubernetes.io/docs/)
- [VS Code Python 教程](https://code.visualstudio.com/docs/python/python-tutorial)
- [Git 手册](https://guides.github.com/introduction/git-handbook/)

---

**下一课：** [03-ml-infrastructure-basics.md](./03-ml-infrastructure-basics.md)——理解机器学习生命周期及基础设施要求。

> 译注：本课保留原文安装命令及版本要求；Python、CLI、编辑器及系统软件包的支持情况可能随版本变化。安装前应核对官方文档与 CPU 架构，执行第三方安装脚本前确认来源。Docker 用户组具有较高的主机权限；云平台优先使用短期凭据，不要提交访问密钥。
