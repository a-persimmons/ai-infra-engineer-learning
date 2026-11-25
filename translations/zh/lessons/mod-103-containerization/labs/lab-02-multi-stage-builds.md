# 实验 02：通过多阶段构建生成精简的生产镜像

**时长：** 60 分钟  **前置条件：** 完成实验 01。

## 目标

使用多阶段 Dockerfile，将构建时所需的工具（编译器、大型开发 SDK）与运行时分离，使生成的镜像只包含提供服务所需的内容。

## 步骤

### 1. 识别问题
许多机器学习库（`xgboost`、`lightgbm`、`pyarrow`、原生 CUDA 绑定）在安装时需要 C/C++ 工具链，但运行时并不需要。单阶段镜像会携带数百 MB 不必要的构建工具。

### 2. 为 PyTorch 服务进行三阶段构建
```dockerfile
# syntax=docker/dockerfile:1.6

# Stage 1: deps with compilers
FROM python:3.11 AS deps
WORKDIR /build
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip wheel --wheel-dir /wheels -r requirements.txt

# Stage 2: app build (e.g., compile Cython extensions)
FROM python:3.11 AS appbuild
WORKDIR /src
COPY pyproject.toml setup.py ./
COPY app/ ./app/
RUN pip install build && python -m build --wheel --outdir /dist

# Stage 3: runtime — only Python + installed wheels
FROM python:3.11-slim AS runtime
RUN groupadd -r app && useradd -r -g app -u 1000 app
WORKDIR /app
COPY --from=deps /wheels /tmp/wheels
COPY --from=appbuild /dist /tmp/dist
RUN pip install --no-index --find-links=/tmp/wheels --find-links=/tmp/dist \
        myapp && rm -rf /tmp/wheels /tmp/dist
USER 1000
CMD ["myapp"]
```

### 3. 验证镜像大小差异
```bash
docker build --target deps -t app:deps .
docker build --target runtime -t app:runtime .
docker images app
```
`runtime` 的大小应小于 `deps` 的 50%。

### 4. 使用 PyTorch 复现真实案例
在 runtime 阶段使用 `pytorch/pytorch:2.3-runtime`，仅复制模型与入口程序。

## 验证
- [ ] `docker image inspect app:runtime` 显示有 `pip` 和 `python`，但没有 `gcc`/`g++`。
- [ ] 运行时镜像小于 1.5 GB（或你设定的目标）。
- [ ] 应用启动并成功响应。

## 清理
```bash
docker rmi app:deps app:appbuild app:runtime 2>/dev/null
```

## 故障排查
- **运行时缺少共享库** — 某些 PyTorch 运算需要 `libgomp1`；在 runtime 阶段添加 `apt-get install -y libgomp1`。
- **第一阶段的 wheel 包不兼容** — 第一阶段与第三阶段必须使用相同的 Python 次版本（3.11.x ↔ 3.11.x）。
