# 第 01 课：Docker 入门

**时长：** 4 小时
**目标：** 理解容器与 Docker 架构，运行你的第一个机器学习容器。

## 什么是容器？

### 海运集装箱的类比

Docker 的名称源于货运码头，标准化集装箱彻底改变了货物运输。同样，软件容器也改变了应用部署方式。

**传统运输（集装箱出现之前）：**
- 不同类型的货物需要不同的处理方式。
- 装卸速度慢且容易出错。
- 不同船舶需要不同的装卸设备。
- 成本高、效率低。

**集装箱运输：**
- 标准化集装箱（20 英尺、40 英尺）。
- 各地使用相同的装卸设备。
- 快速装卸。
- 可以在轮船、火车、卡车之间使用统一的运输单元。

**软件领域采用同样的逻辑：**
- **容器出现之前：** 每个应用需要单独配置，依赖不同且容易发生冲突。
- **使用容器之后：** 将应用及依赖打包成标准单元，在兼容的环境中一致运行。

### 容器与虚拟机

#### 虚拟机（VM）
```
┌─────────────────────────────────────┐
│         Application A               │
│    ┌──────────────────────┐         │
│    │   Guest OS (Ubuntu)  │         │
│    │      4GB RAM         │         │
│    └──────────────────────┘         │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│         Application B               │
│    ┌──────────────────────┐         │
│    │   Guest OS (CentOS)  │         │
│    │      4GB RAM         │         │
│    └──────────────────────┘         │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│          Hypervisor (VMware)        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│        Host OS (Linux)              │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│       Hardware (8GB RAM)            │
└─────────────────────────────────────┘
```

#### 容器
```
┌───────────────┬───────────────┬───────────────┐
│  Container A  │  Container B  │  Container C  │
│  App + Libs   │  App + Libs   │  App + Libs   │
│   (50MB)      │   (30MB)      │   (60MB)      │
└───────────────┴───────────────┴───────────────┘
┌─────────────────────────────────────────────────┐
│           Docker Engine                         │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│           Host OS (Linux)                       │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│           Hardware (8GB RAM)                    │
└─────────────────────────────────────────────────┘
```

#### 主要区别

| 特性 | 虚拟机 | 容器 |
|---|---|---|
| **体积** | GB 级（完整操作系统） | MB 级（应用与库） |
| **启动** | 分钟级 | 秒级 |
| **性能** | 存在虚拟化开销 | 接近原生 |
| **隔离** | 较强（独立内核） | 进程级 |
| **资源使用** | 较高（多个操作系统副本） | 较低（共享内核） |
| **可移植性** | 受虚拟机管理程序限制 | 较高（兼容 Docker 的环境） |
| **使用场景** | 需要不同操作系统 | 相同操作系统内核，不同应用 |

### 为什么在机器学习中使用容器？

1. **从依赖地狱到依赖隔离**
   - 机器学习需要特定版本，例如 PyTorch 2.0、CUDA 11.8、cuDNN 8.6。
   - 容器将所需依赖一起打包。
   - 避免与其他项目的依赖冲突。

2. **从「在我的电脑上能运行」到「在各处运行」**
   - 开发者笔记本：Mac M1。
   - 训练服务器：配备 NVIDIA GPU 的 Ubuntu。
   - 生产环境：Kubernetes 集群。
   - 在满足平台、架构与硬件兼容条件的情况下，同一容器镜像可以提供一致的环境。

3. **可复现性**
   - 机器学习研究：随论文发布容器。
   - 其他人可以复现实验。
   - 减少环境配置的不确定性。

4. **可扩展性**
   - 在数秒内启动大量模型服务实例（原文举例为 100 个）。
   - Kubernetes 自动编排容器。
   - 易于水平扩展。

5. **资源效率**
   - 在同一台机器上运行 10 个不同的模型。
   - 每个模型运行于隔离的容器。
   - 相比虚拟机，额外开销较小。

> 译注：容器不是完整的硬件虚拟化。同一镜像能否运行取决于 CPU 架构、内核、GPU 驱动及运行时兼容性；使用容器也不代表模型结果一定逐位一致。启动速度与镜像体积取决于实际负载，机器学习镜像常达 GB 级。

## Docker 架构

### 核心组件

```
┌──────────────────────────────────────────────────┐
│              Docker Client (CLI)                 │
│        $ docker run pytorch/pytorch              │
└─────────────────┬────────────────────────────────┘
                  │ Docker API (REST)
┌─────────────────▼────────────────────────────────┐
│              Docker Daemon                       │
│  ┌────────────────────────────────────────┐     │
│  │  Container Runtime (containerd)        │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Container │  │Container │  │Container │      │
│  │    A     │  │    B     │  │    C     │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │      Images (Local Storage)            │     │
│  │  pytorch:2.0  tensorflow:2.10          │     │
│  └────────────────────────────────────────┘     │
└──────────────────────────────────────────────────┘
```

#### 1. Docker Client（客户端）
- 用户直接交互的命令行工具。
- 命令：`docker run`、`docker build`、`docker ps`。
- 通过 REST API 与守护进程通信。

#### 2. Docker Daemon（dockerd）
- 管理容器的后台服务。
- 构建镜像、运行容器、管理网络。
- 监听客户端的 API 请求。

#### 3. 容器运行时
- 实际管理容器运行的底层组件。
- Docker 默认使用 containerd（由 Docker 捐赠给 CNCF）。
- 与操作系统内核交互。

#### 4. 镜像
- 用于创建容器的只读模板。
- 拉取或构建后存储在本地。
- 由多个镜像层组成（后面详细介绍）。

#### 5. 容器
- 镜像的运行实例。
- 宿主机上的隔离进程。
- 拥有自己的文件系统视图、网络及进程空间。

#### 6. Docker Registry（镜像仓库）
- 存储 Docker 镜像。
- Docker Hub（公共镜像仓库）。
- 私有镜像仓库（ECR、GCR、ACR、自建仓库）。

### Docker 工作流

```
1. Write Dockerfile  →  2. Build Image  →  3. Push to Registry
     (recipe)              (template)          (share)
        │                      │                    │
        └──────────────────────┴────────────────────┘
                               │
                               ▼
4. Pull Image  →  5. Run Container  →  6. Container Running
  (download)         (instantiate)         (your app)
```

**示例：**
```bash
# 1. Write Dockerfile (create file)
# 2. Build image
docker build -t my-ml-model:v1 .

# 3. Push to registry
docker push myrepo/my-ml-model:v1

# 4. Pull image (on production server)
docker pull myrepo/my-ml-model:v1

# 5. Run container
docker run -p 8000:8000 myrepo/my-ml-model:v1

# 6. Container is running and serving predictions
```

## 安装 Docker

### 前置条件

**系统要求（原文版本）：**
- **Linux：** 内核 3.10+（支持大多数发行版）。
- **macOS：** macOS 10.15+（Catalina 或更新版本）。
- **Windows：** Windows 10/11 Pro、Enterprise 或 Education（使用 WSL2）。
- **内存：** 至少 4GB，推荐 8GB 以上。
- **磁盘：** 至少 20GB 可用空间。

### 安装选项

#### 选项 1：Docker Desktop（推荐 Mac/Windows 用户）

**优点：**
- 用于管理容器的图形界面。
- 包含 Docker Engine、CLI、Compose 及 Kubernetes。
- 易于安装。

**缺点：**
- 企业使用可能需要付费许可（原文以超过 250 名员工或超过 1,000 万美元营收的公司为例）。
- 存在资源开销（在 Mac/Windows 上运行 Linux 虚拟机）。

**下载：** https://www.docker.com/products/docker-desktop

#### 选项 2：Docker Engine（Linux，免费且开源）

**Ubuntu/Debian：**
```bash
# Update package index
sudo apt-get update

# Install dependencies
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (avoid using sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker run hello-world
```

**CentOS/RHEL：**
```bash
# Install dependencies
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 安装后验证

```bash
# Check Docker version
docker --version
# Output: Docker version 24.0.7, build afdd53b

# Check Docker info
docker info

# Run test container
docker run hello-world
# Should download and run successfully

# Check Docker Compose
docker compose version
# Output: Docker Compose version v2.23.0
```

### 安装故障排查

**问题：** 执行 Docker 命令时出现「permission denied」。
```bash
# Solution: Add user to docker group
sudo usermod -aG docker $USER
# Log out and log back in, or run:
newgrp docker
```

**问题：** Docker 守护进程未运行。
```bash
# Linux: Start Docker service
sudo systemctl start docker
sudo systemctl status docker

# Mac/Windows: Start Docker Desktop application
```

**问题：** 「Cannot connect to the Docker daemon」。
```bash
# Check if Docker daemon is running
sudo systemctl status docker

# Check Docker socket permissions
ls -l /var/run/docker.sock
```

> 译注：操作系统支持范围和许可条款可能变化，以实际 Docker 版本的官方说明为准。Docker 用户组具有较高的主机权限，应谨慎授予。

## 你的第一批 Docker 命令

### 基本命令

#### 1. 检查 Docker 安装
```bash
docker --version
docker info
```

#### 2. 运行第一个容器
```bash
# Run official Python container
docker run python:3.11 python --version

# What happened:
# 1. Docker looked for 'python:3.11' image locally
# 2. Didn't find it, so pulled from Docker Hub
# 3. Created container from image
# 4. Ran 'python --version' inside container
# 5. Printed output and exited
```

#### 3. 运行交互式容器
```bash
# Run Python container interactively
docker run -it python:3.11 python

# Now you're inside Python REPL in container
>>> import sys
>>> print(sys.version)
>>> exit()
```

**参数：**
- `-i`：交互式（保持标准输入打开）。
- `-t`：分配伪终端（TTY）。
- 组合使用 `-it` 获得交互式终端。

#### 4. 在后台运行容器（Detached）
```bash
# Run Nginx web server in background
docker run -d -p 8080:80 nginx

# Flags:
# -d: Detached mode (background)
# -p 8080:80: Map host port 8080 to container port 80

# Visit http://localhost:8080 in browser
```

#### 5. 列出正在运行的容器
```bash
docker ps

# Output:
# CONTAINER ID   IMAGE   COMMAND                  CREATED         STATUS         PORTS                  NAMES
# a1b2c3d4e5f6   nginx   "/docker-entrypoint.…"   2 minutes ago   Up 2 minutes   0.0.0.0:8080->80/tcp   brave_tesla
```

#### 6. 列出所有容器（包括已停止的）
```bash
docker ps -a
```

#### 7. 停止容器
```bash
docker stop <container_id or name>
# Example:
docker stop a1b2c3d4e5f6
# or
docker stop brave_tesla
```

#### 8. 启动已停止的容器
```bash
docker start <container_id or name>
```

#### 9. 删除容器
```bash
docker rm <container_id or name>

# Force remove running container:
docker rm -f <container_id>
```

#### 10. 列出已下载的镜像
```bash
docker images

# Output:
# REPOSITORY   TAG     IMAGE ID       CREATED       SIZE
# python       3.11    1234567890ab   2 weeks ago   1.01GB
# nginx        latest  abcdef123456   3 weeks ago   142MB
```

#### 11. 删除镜像
```bash
docker rmi <image_id or name:tag>

# Example:
docker rmi python:3.11
```

#### 12. 查看容器日志
```bash
docker logs <container_id or name>

# Follow logs in real-time:
docker logs -f <container_id>
```

#### 13. 在运行中的容器执行命令
```bash
docker exec -it <container_id> bash

# This opens a shell inside the running container
# Now you can explore filesystem, check processes, etc.
```

#### 14. 检查容器详细信息
```bash
docker inspect <container_id>
# Returns JSON with all container configuration and state
```

#### 15. 拉取镜像但不运行
```bash
docker pull pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
```

### Docker 命令速查表

```bash
# Images
docker pull <image>           # Download image
docker images                 # List images
docker rmi <image>            # Remove image
docker build -t <name> .      # Build image from Dockerfile

# Containers
docker run <image>            # Create and start container
docker ps                     # List running containers
docker ps -a                  # List all containers
docker stop <container>       # Stop container
docker start <container>      # Start stopped container
docker restart <container>    # Restart container
docker rm <container>         # Remove container
docker logs <container>       # View logs
docker exec -it <container> bash  # Shell into container

# Cleanup
docker system prune           # Remove unused data
docker container prune        # Remove stopped containers
docker image prune            # Remove dangling images
docker volume prune           # Remove unused volumes

# Information
docker info                   # Docker system info
docker version                # Docker version
docker inspect <container>    # Container details
docker stats                  # Container resource usage
```

## 运行你的第一个机器学习容器

### 示例 1：PyTorch 容器

```bash
# Pull official PyTorch image
docker pull pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime

# Run interactive PyTorch session
docker run -it pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime python

# Inside Python:
>>> import torch
>>> print(torch.__version__)
2.0.0
>>> print(torch.cuda.is_available())
False  # (False if no GPU mapped to container)
>>> exit()
```

### 示例 2：TensorFlow 容器

```bash
# Pull TensorFlow image
docker pull tensorflow/tensorflow:latest

# Run Jupyter notebook
docker run -it -p 8888:8888 tensorflow/tensorflow:latest-jupyter

# Open browser to http://localhost:8888
# Token will be printed in terminal
```

### 示例 3：使用 PyTorch 运行 Jupyter

```bash
# Run Jupyter with PyTorch
docker run -it \
    -p 8888:8888 \
    -v $(pwd):/workspace \
    pytorch/pytorch:latest \
    sh -c "pip install jupyter && jupyter notebook --ip=0.0.0.0 --allow-root"

# Breakdown:
# -it: Interactive terminal
# -p 8888:8888: Map Jupyter port
# -v $(pwd):/workspace: Mount current directory
# pytorch/pytorch:latest: Image to use
# sh -c "...": Command to run
```

## 理解 Docker 镜像与镜像层

### 镜像层

Docker 镜像由多个层构建而成，每个文件系统层表示一组文件系统变更。

```
┌───────────────────────────────────┐
│  Layer 5: pip install pytorch     │  ← 2GB (PyTorch binaries)
├───────────────────────────────────┤
│  Layer 4: pip install numpy       │  ← 50MB (NumPy)
├───────────────────────────────────┤
│  Layer 3: apt install python3-pip │  ← 100MB (pip + dependencies)
├───────────────────────────────────┤
│  Layer 2: apt update               │  ← 50MB (package lists)
├───────────────────────────────────┤
│  Layer 1: Base Ubuntu 22.04       │  ← 77MB (OS)
└───────────────────────────────────┘
Total Image Size: ~2.3GB
```

**主要收益：**
1. **可复用性：** 基础层可以在多个镜像之间共享。
2. **效率：** 只需下载和存储尚未存在的层。
3. **快速构建：** 未变更的层可以使用缓存。

### 检查镜像层

```bash
# View image history (layers)
docker history pytorch/pytorch:latest

# Output shows each layer:
# IMAGE          CREATED BY                                      SIZE
# <missing>      pip install pytorch                             2.0GB
# <missing>      pip install numpy                               50MB
# <missing>      apt install python3-pip                         100MB
# ...
```

## Docker 命名规范

### 镜像名称
```
registry.com/username/repository:tag
```

**示例：**
- `pytorch/pytorch:2.0.0`——Docker Hub、pytorch 组织、pytorch 仓库、2.0.0 标签。
- `gcr.io/myproject/model-server:v1.2`——GCR、myproject、model-server、v1.2。
- `nginx:latest`——Docker Hub（隐式指定）、nginx 仓库、latest 标签。

**标签：**
- `latest`——原文称为最新版本；省略标签时默认使用该标签。
- `2.0.0`——语义化版本。
- `2.0.0-cuda11.7`——包含附加信息的版本。
- `dev`、`prod`、`staging`——环境标签。

> 译注：latest 只是一个可变标签，并不保证指向最新版本。生产环境宜固定版本或镜像 Digest。GCR 属于旧版仓库方案，新部署应核对 Artifact Registry。

### 容器名称

```bash
# Docker auto-generates names like "brave_tesla" if not specified
docker run nginx
# Creates container with random name

# Specify custom name:
docker run --name my-web-server nginx
```

## 动手练习

### 练习 1：运行预构建的机器学习模型容器

使用公共 Docker 镜像部署预训练模型：

```bash
# TODO: Pull Hugging Face model serving container
docker pull huggingface/transformers-pytorch-cpu:latest

# TODO: Run container serving BERT model
docker run -p 8080:8080 huggingface/transformers-pytorch-cpu:latest

# TODO: Test inference endpoint
# curl -X POST http://localhost:8080/predict -d '{"text": "Hello world"}'

# TODO: View container logs
docker logs <container_id>

# TODO: Stop and remove container
docker stop <container_id>
docker rm <container_id>
```

### 练习 2：探索容器文件系统

```bash
# TODO: Run Ubuntu container interactively
docker run -it ubuntu:22.04 bash

# Inside container:
# pwd                    # Where am I?
# ls -la                 # What files exist?
# apt update             # Update package lists
# apt install python3    # Install Python
# python3 --version      # Verify Python installed
# exit                   # Leave container
```

### 练习 3：挂载本地目录

```bash
# TODO: Create local directory with Python script
mkdir ~/ml-docker-test
cd ~/ml-docker-test
echo 'print("Hello from Docker!")' > hello.py

# TODO: Run container with volume mount
docker run -it -v $(pwd):/workspace python:3.11 bash

# Inside container:
# cd /workspace
# ls                     # See hello.py from host
# python hello.py        # Run script
# exit
```

## 常见问题及解决方案

### 问题 1：端口已被占用
```bash
# Error: "bind: address already in use"
# Solution: Use different host port
docker run -p 8081:80 nginx  # Instead of 8080:80
```

### 问题 2：容器立即退出
```bash
# Container runs and exits right away
# Reason: No foreground process running
# Solution: Use -it for interactive, or run long-running process
docker run -it ubuntu bash
```

### 问题 3：无法从宿主机访问容器
```bash
# Container running but can't connect
# Solution: Check port mapping
docker ps  # Verify PORTS column shows mapping
# Ensure application binds to 0.0.0.0, not 127.0.0.1
```

### 问题 4：磁盘空间不足
```bash
# Error: "no space left on device"
# Solution: Clean up Docker resources
docker system prune -a  # Remove all unused images, containers, networks
```

## 后续步骤

下一课将学习：
1. 从零编写 Dockerfile。
2. 为机器学习应用构建自定义镜像。
3. 深入理解 Dockerfile 指令。
4. 创建面向生产环境的镜像。

## 自我检查问题

进入第 02 课之前，确保能够回答：

1. 镜像与容器有什么区别？
2. 与虚拟机相比，容器对机器学习有哪些主要优势？
3. 如何在后台运行容器？
4. docker run 的 -p 参数有什么作用？
5. 如何访问正在运行的容器中的 Shell？
6. 什么是 Docker 镜像层？为什么重要？

---

**恭喜！** 你已经完成 Docker 入门，理解了容器基础，并能运行预构建容器。下一课将学习为机器学习应用构建自己的镜像。

**下一课：** [02-dockerfile-ml-apps.md](./02-dockerfile-ml-apps.md)——为机器学习应用编写 Dockerfile。
