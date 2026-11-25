# 练习 01：环境验证

**模块：** 01——基础
**时长：** 2–3 小时
**难度：** 入门
**目标：** 验证开发环境是否正确配置

## 概览

本练习确保你已正确安装和配置机器学习基础设施开发所需的全部工具。你将创建简单程序来测试每个组件。

## 前置条件

- 完成第 02 课：环境配置。
- 按照课程说明安装全部工具。

## 任务

### 任务 1：Python 环境验证（30 分钟）

创建 Python 脚本，验证机器学习依赖包。

**文件：** verify_python.py

```python
#!/usr/bin/env python3
"""
Verification script for Python ML environment
"""

import sys

def check_package(package_name, import_name=None):
    """Check if a package is installed and importable"""
    if import_name is None:
        import_name = package_name

    try:
        module = __import__(import_name)
        version = getattr(module, '__version__', 'unknown')
        print(f"✅ {package_name}: {version}")
        return True
    except ImportError:
        print(f"❌ {package_name}: NOT INSTALLED")
        return False

def main():
    print("=" * 50)
    print("Python ML Environment Verification")
    print("=" * 50)
    print(f"\nPython Version: {sys.version}")
    print(f"Python Path: {sys.executable}\n")

    # Core ML packages
    packages = [
        ('PyTorch', 'torch'),
        ('TensorFlow', 'tensorflow'),
        ('Transformers', 'transformers'),
        ('NumPy', 'numpy'),
        ('Pandas', 'pandas'),
        ('scikit-learn', 'sklearn'),
        ('FastAPI', 'fastapi'),
        ('Uvicorn', 'uvicorn'),
        ('Requests', 'requests'),
        ('HTTPX', 'httpx'),
        ('PyYAML', 'yaml'),
        ('python-dotenv', 'dotenv'),
        ('pytest', 'pytest'),
        ('Black', 'black'),
        ('Flake8', 'flake8'),
    ]

    results = []
    print("Checking packages...\n")
    for package, import_name in packages:
        results.append(check_package(package, import_name))

    # Summary
    print("\n" + "=" * 50)
    print(f"Summary: {sum(results)}/{len(results)} packages installed")
    print("=" * 50)

    if all(results):
        print("\n🎉 All packages installed successfully!")
        return 0
    else:
        print("\n⚠️  Some packages are missing. Please install them.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

**运行脚本：**
```bash
# Activate virtual environment
source ~/ai-infra-venv/bin/activate

# Run verification
python verify_python.py
```

**预期输出：**
- 所有依赖包均显示成功标记。
- 「All packages installed successfully!」

**交付物 1：**
- 显示全部依赖包已安装的截图或文本输出。

---

### 任务 2：Docker 验证（30 分钟）

创建并运行简单 Docker 容器。

**文件：** Dockerfile.test

```dockerfile
# Simple test Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy verification script
COPY verify_python.py .

# Install packages
RUN pip install --no-cache-dir \
    torch --index-url https://download.pytorch.org/whl/cpu \
    numpy pandas scikit-learn

# Run verification
CMD ["python", "verify_python.py"]
```

**构建并运行：**
```bash
# Build Docker image
docker build -f Dockerfile.test -t ml-env-test .

# Run container
docker run ml-env-test

# Check Docker is working
docker ps -a
docker images
```

**交付物 2：**
- Docker 构建成功的截图。
- 容器运行截图。

---

### 任务 3：配置 Git 仓库（30 分钟）

为学习过程创建 Git 仓库。

```bash
# Create new repository
mkdir -p ~/ai-infra-learning
cd ~/ai-infra-learning

# Initialize git
git init

# Create project structure
mkdir -p modules/01-foundations exercises projects

# Copy your verification scripts
cp /path/to/verify_python.py exercises/

# Create README
cat > README.md << 'EOF'
# AI Infrastructure Learning Journey

My learning repository for AI Infrastructure Engineer curriculum.

## Environment

- Python 3.11
- Docker installed
- Kubernetes tools ready
- VS Code configured

## Progress

- [x] Module 01: Started
- [ ] Module 02: Not started
- [ ] Project 01: Not started
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
__pycache__/
*.pyc
venv/
.env
*.log
.DS_Store
EOF

# First commit
git add .
git commit -m "Initial commit: Environment setup verification"

# Check status
git log
git status
```

**创建 GitHub 仓库：**
1. 访问 github.com。
2. 点击 New repository（新建仓库）。
3. 命名为 ai-infra-learning。
4. 不要使用 README 初始化（本地已经存在 README）。
5. 复制远程仓库 URL。

**推送至 GitHub：**
```bash
git remote add origin git@github.com:yourusername/ai-infra-learning.git
git branch -M main
git push -u origin main
```

**交付物 3：**
- GitHub 仓库链接。
- 显示首次提交的截图。

---

### 任务 4：Kubernetes 验证（30 分钟）

验证 Kubernetes 工具可用。

```bash
# Check kubectl
kubectl version --client

# Check minikube
minikube version

# Check helm
helm version

# Start minikube (if resources allow)
minikube start --driver=docker --memory=2048

# Verify cluster
kubectl cluster-info
kubectl get nodes

# Deploy test pod
kubectl run test-nginx --image=nginx --port=80

# Check pod
kubectl get pods
kubectl describe pod test-nginx

# Clean up
kubectl delete pod test-nginx
minikube stop
```

**交付物 4：**
- kubectl、minikube、helm 版本截图。
- 测试 Pod 运行截图。

---

### 任务 5：云 CLI 验证（30 分钟）

验证至少一个云平台 CLI 正常工作。

**AWS：**
```bash
# Check version
aws --version

# List regions (if configured)
aws ec2 describe-regions --output table
```

**GCP：**
```bash
# Check version
gcloud --version

# List projects
gcloud projects list
```

**Azure：**
```bash
# Check version
az --version

# List locations
az account list-locations --output table
```

**交付物 5：**
- 云 CLI 正常工作的截图。
- 记录所使用的云平台。

---

### 任务 6：VS Code 配置（20 分钟）

为 Python 机器学习开发配置 VS Code。

**任务：**
1. 打开 VS Code。
2. 安装 Python 扩展（如果尚未安装）。
3. 打开 ai-infra-learning 目录。
4. 创建 .vscode/settings.json：

```json
{
    "python.defaultInterpreterPath": "~/ai-infra-venv/bin/python",
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "python.formatting.provider": "black",
    "editor.formatOnSave": true,
    "python.testing.pytestEnabled": true,
    "files.exclude": {
        "**/__pycache__": true,
        "**/*.pyc": true
    }
}
```

5. 创建测试 Python 文件并验证：
   - 语法高亮正常。
   - 自动补全正常。
   - Lint 正常（故意制造错误，观察红色波浪线）。

**交付物 6：**
- VS Code 打开 Python 文件的截图。
- 展示自动补全或 Lint 功能的截图。

---

## 挑战任务（可选）

### 挑战 1：简单机器学习模型推理

创建脚本，加载预训练模型并执行预测。

```python
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import requests
from io import BytesIO

# Load pre-trained ResNet
model = models.resnet18(pretrained=True)
model.eval()

# Download a sample image
url = "https://github.com/pytorch/hub/raw/master/images/dog.jpg"
response = requests.get(url)
img = Image.open(BytesIO(response.content))

# Prepare image
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

input_tensor = preprocess(img)
input_batch = input_tensor.unsqueeze(0)

# Inference
with torch.no_grad():
    output = model(input_batch)

# Get prediction
_, predicted = torch.max(output, 1)
print(f"Predicted class: {predicted.item()}")
```

### 挑战 2：Docker Compose 多服务

创建包含多个服务的 docker-compose.yml：

```yaml
version: '3.8'

services:
  app:
    image: python:3.11-slim
    volumes:
      - .:/app
    working_dir: /app
    command: sleep infinity

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

运行：docker-compose up -d

---

## 提交要求

创建包含以下内容的文档：

1. **系统信息**
   - 操作系统及版本。
   - 硬件规格（CPU、RAM）。

2. **全部交付物**
   - 每个任务的截图。
   - GitHub 仓库链接。
   - 遇到的问题记录。

3. **反思问题**
   - 环境配置中最具挑战性的部分是什么？
   - 你最期待进一步学习哪个工具？
   - 关于开发环境还有哪些问题？

## 评分标准

| 任务 | 分值 | 标准 |
|---|---:|---|
| 任务 1：Python | 20 | 所有依赖包均已安装并验证 |
| 任务 2：Docker | 20 | Docker 能够构建并运行容器 |
| 任务 3：Git | 20 | 已创建仓库并推送至 GitHub |
| 任务 4：Kubernetes | 15 | kubectl、minikube、helm 正常运行 |
| 任务 5：云 CLI | 10 | 至少一个云 CLI 可用 |
| 任务 6：VS Code | 10 | 编辑器已配置用于 Python 开发 |
| 文档 | 5 | 清晰的截图与解释 |
| **总计** | **100** | |

**及格：** 70/100 分。

## 常见问题与解决方案

### Python 依赖包无法安装
```bash
# Update pip first
pip install --upgrade pip setuptools wheel

# Install one at a time to identify problem package
pip install torch
pip install tensorflow
```

### Docker 权限不足
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

### minikube 启动失败
```bash
# Use different driver
minikube start --driver=docker --memory=2048

# Or just verify minikube is installed
minikube version
```

### Git 推送认证失败
```bash
# Use SSH key instead
# Follow SSH setup in Lesson 02

# Or use personal access token for HTTPS
# Generate at github.com/settings/tokens
```

## 后续步骤

完成练习并验证环境后：

1. **进入第 03 课**——机器学习基础设施基础。
2. **持续维护环境**——定期更新依赖包。
3. **每天练习**——在工作或个人项目中使用这些工具。

---

## 补充资源

- [Python 虚拟环境指南](https://docs.python.org/3/tutorial/venv.html)
- [Docker 入门](https://docs.docker.com/get-started/)
- [Git 基础](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [Kubernetes 基础教程](https://kubernetes.io/docs/tutorials/kubernetes-basics/)

> 译注：提交截图前应遮蔽访问密钥、令牌及其他敏感账号信息。课程代码使用原文版本，部分环境可能需要使用新版 docker compose 命令或更新 VS Code 配置。
