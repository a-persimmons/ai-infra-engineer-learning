# 实验 02：构建、运行并检查你的第一个 Docker 容器

**时长：** 60 分钟
**难度：** 入门
**前置条件：** 完成实验 01；安装 Docker Desktop 或 Docker Engine。

## 目标

通过多阶段 Dockerfile 将一个小型 Python Web 服务容器化，在本地运行它，从宿主机检查文件系统与进程，然后正确停止并移除容器。完成后，你将具体理解镜像与容器的区别，而不仅仅停留在抽象概念层面。

## 为什么重要

后续每个项目都假设你能够阅读 Dockerfile、构建镜像、运行容器，并使用 `docker logs` 和 `docker exec` 进行调试。在这里投入的时间会在后续每个模块得到回报。

## 前置条件

验证：

```bash
docker --version           # expect Docker version 24.x or newer
docker info                # should succeed without errors
```

若 `docker info` 报错提示无法连接 Docker 守护进程，请启动 Docker Desktop。

## 步骤

### 1. 创建一个小型 Flask 服务

```bash
mkdir -p ~/ai-infra-labs/lab-02-docker && cd ~/ai-infra-labs/lab-02-docker

cat > app.py <<'EOF'
from flask import Flask, jsonify
import os, platform

app = Flask(__name__)

@app.get("/health")
def health():
    return jsonify(status="ok", host=platform.node(), python=platform.python_version())
EOF

cat > requirements.txt <<'EOF'
flask>=3.0
gunicorn>=22.0
EOF
```

### 2. 编写多阶段 Dockerfile

```bash
cat > Dockerfile <<'EOF'
# ---- builder stage: install Python deps into a wheelhouse
FROM python:3.11-slim AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# ---- runtime stage: only what's needed to run
FROM python:3.11-slim AS runtime
RUN groupadd -r app && useradd -r -g app -u 1000 app
WORKDIR /app
COPY --from=builder /wheels /wheels
COPY requirements.txt .
RUN pip install --no-index --find-links=/wheels -r requirements.txt && rm -rf /wheels

COPY app.py .
USER 1000
EXPOSE 8000
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8000", "app:app"]
EOF
```

### 3. 构建镜像

```bash
docker build -t hello-flask:0.1 .
```

应看到两个阶段：先构建 builder，再逐层构建 runtime。

```bash
docker images hello-flask
# Expect something like:
# REPOSITORY    TAG    IMAGE ID       CREATED          SIZE
# hello-flask   0.1    <hash>         5 seconds ago    ~150MB
```

### 4. 运行容器

```bash
docker run -d --name hello --rm -p 8000:8000 hello-flask:0.1
sleep 2
curl -s http://localhost:8000/health
```

预期：`{"host":"<container-id>","python":"3.11.x","status":"ok"}`

### 5. 从宿主机检查容器

```bash
docker ps
docker logs hello                         # gunicorn boot output
docker stats hello --no-stream            # current CPU / memory / IO
docker exec -it hello sh -c 'whoami; ps aux; ls -la /app'
```

确认 `whoami` 返回 `app`，而不是 `root`。这是你的非 root 用户。

### 6. 停止并移除容器

```bash
docker stop hello                         # SIGTERM with grace period
docker ps -a | grep hello || echo "no hello container — removed by --rm"
```

## 验证

- [ ] `docker images hello-flask` 显示镜像小于 200MB。
- [ ] `curl http://localhost:8000/health` 返回 status ok。
- [ ] `docker exec hello whoami` 返回 `app`，而不是 `root`。
- [ ] `docker exec hello ls -la /app` 仅显示 `app.py`（以及 pip 安装的依赖），没有 `requirements.txt` 或 `wheels/`。
- [ ] 执行 `docker stop hello` 后，`docker ps -a` 不再显示 `hello` 容器。

## 清理

```bash
docker rmi hello-flask:0.1
docker system prune -f      # optional: cleans dangling layers
cd ~ && rm -rf ~/ai-infra-labs/lab-02-docker
```

## 故障排查

- **`Cannot connect to the Docker daemon`** — 启动 Docker Desktop，或在 Linux 上执行 `sudo systemctl start docker`。
- **构建在 `pip wheel` 处失败** — 检查 `requirements.txt` 语法；每行一个包，不要有额外空白。
- **容器立即退出** — `docker logs hello` 会显示错误。常见原因是 CMD 或 app.py 中的拼写错误。
- **8000 端口已被占用** — 修改宿主机端口（`-p 8001:8000`）或停止冲突进程：`lsof -i :8000`。
- **`docker exec` 提示 executable file not found in $PATH** — runtime 阶段使用 `python:3.11-slim`，不包含 `bash`，改用 `sh`。
