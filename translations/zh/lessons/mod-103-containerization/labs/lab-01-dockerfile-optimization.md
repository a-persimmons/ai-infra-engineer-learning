# 实验 01：针对机器学习工作负载优化 Dockerfile

**时长：** 60 分钟  **前置条件：** 已安装 Docker；完成 mod-101 的实验 02。

## 目标

对未经优化的机器学习 Dockerfile 应用优化措施：调整镜像层顺序、多阶段构建、BuildKit 缓存挂载以及 `.dockerignore`。测量优化前后的镜像大小和构建时间。

## 步骤

### 1. 从未经优化的 Dockerfile 开始
```dockerfile
FROM python:3.11
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```
构建并记录大小：`docker build -t naive .` → 通常为 1.2–1.5 GB。

### 2. 改用精简基础镜像与 .dockerignore
```dockerfile
FROM python:3.11-slim
...
```
添加 `.dockerignore`：
```
__pycache__/
*.pyc
.git/
venv/
tests/
*.md
```

### 3. 按变更频率排列镜像层
先复制 `requirements.txt` 并安装依赖，再复制源代码；如果依赖不变，就可以利用缓存：
```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

### 4. 为 pip 使用 BuildKit 缓存挂载
```dockerfile
# syntax=docker/dockerfile:1.6
FROM python:3.11-slim
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt
```
使用 `DOCKER_BUILDKIT=1 docker build` 构建。

### 5. 使用多阶段构建移除构建工具
```dockerfile
FROM python:3.11 AS builder
RUN pip wheel --wheel-dir /wheels -r requirements.txt

FROM python:3.11-slim AS runtime
COPY --from=builder /wheels /wheels
RUN pip install --no-index --find-links=/wheels -r requirements.txt && rm -rf /wheels
```

### 6. 测量
```bash
docker images | grep -E 'naive|optimized'
hyperfine 'docker build --no-cache -t opt .'
```

## 验证
- [ ] 优化后镜像小于 400 MB（未经优化的镜像大于 1 GB）。
- [ ] 第二次构建（源代码无变更）少于 5 秒（命中 pip 层缓存）。
- [ ] `docker history opt` 显示少于 10 层。

## 清理
```bash
docker rmi naive opt
```

## 故障排查
- **缓存挂载没有效果** — 确认启用了 BuildKit（`docker buildx version` 显示版本不低于 0.10）。
- **精简镜像缺少系统库** — 在 builder 阶段而非 runtime 阶段安装 `gcc`/`g++`。
