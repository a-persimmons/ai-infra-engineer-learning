# 练习 07：BuildKit 缓存优化

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 01–06（Dockerfile 与多阶段构建）

## 目标

将 BuildKit 高级功能（缓存挂载、Secret、镜像仓库支持的远程缓存、多平台构建）应用于真实机器学习 Docker 镜像。测量冷构建、热构建及 CI 缓存构建的耗时，目标是将 CI 构建时间减少至少 70%。

## 为什么重要

12 分钟的 Docker 构建 × 每天 50 个 PR × 等待 CI 的工程师人数，会形成实际瓶颈。许多团队默认使用 docker build，却没有充分利用 BuildKit 的缓存功能。能够将 CI 构建时间减少 70% 的工程师可以显著提高团队效率。

## 要求

构建满足以下条件的 Dockerfile 与 CI 工作流：

1. 使用 **`# syntax=docker/dockerfile:1.6`** 启用现代 BuildKit 功能。
2. 对 `/root/.cache/pip` 和 `~/.cache/torch` 使用 **`--mount=type=cache`**。
3. 使用 **`--mount=type=secret`** 在构建时注入 Hugging Face Token，而不将其写入镜像层。
4. 将构建缓存推送至**镜像仓库支持的缓存**（GHCR 或 ECR）。
5. 为 linux/amd64 和 linux/arm64 构建**多平台镜像**。
6. CI 工作流拉取镜像仓库缓存，相较无缓存构建至少减少 70% 耗时。

## 分步操作

### 步骤 1——基线（15 分钟）
对真实机器学习镜像（例如 PyTorch + transformers + 约 500MB 权重）进行无缓存构建并计时：
```bash
docker buildx build --no-cache -t base:latest .
time ... ≈ 8-12 minutes on typical CI
```

### 步骤 2——添加缓存挂载（30 分钟）
```dockerfile
# syntax=docker/dockerfile:1.6
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt
COPY . .
```
使用 `--cache-from` / `--cache-to local` 重新构建，并测量第二次构建时间；依赖未变时应非常快。

### 步骤 3——HF Token 的 Secret 挂载（30 分钟）
```dockerfile
RUN --mount=type=secret,id=hf_token,target=/run/secrets/hf_token \
    HF_TOKEN=$(cat /run/secrets/hf_token) \
    huggingface-cli download mistralai/Mistral-7B-Instruct-v0.3
```
```bash
docker buildx build --secret id=hf_token,src=$HOME/.cache/hf-token -t img:latest .
```
验证 Token 未出现在任何镜像层的历史中（`docker history img:latest`）。

### 步骤 4——镜像仓库支持的缓存（45 分钟）
```bash
docker buildx build \
  --cache-from type=registry,ref=ghcr.io/me/iris-api:cache \
  --cache-to type=registry,ref=ghcr.io/me/iris-api:cache,mode=max \
  -t ghcr.io/me/iris-api:latest \
  --push .
```
max 模式也会缓存中间层（占用更多存储，但后续构建更快）。

### 步骤 5——多平台构建（30 分钟）
```bash
docker buildx create --use --name multiarch
docker buildx build --platform linux/amd64,linux/arm64 \
  --cache-from type=registry,ref=ghcr.io/me/iris-api:cache \
  -t ghcr.io/me/iris-api:multi --push .
```
在 x86 构建器上模拟 ARM 较慢；生产环境可在真实 Graviton/Ampere Runner 上使用 `--platform linux/arm64`。

### 步骤 6——CI 工作流（30 分钟）
GitHub Actions：
```yaml
- uses: docker/setup-buildx-action@v3
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
- uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    platforms: linux/amd64,linux/arm64
    tags: ghcr.io/${{ github.repository }}/iris-api:${{ github.sha }}
    cache-from: type=registry,ref=ghcr.io/${{ github.repository }}/iris-api:cache
    cache-to: type=registry,ref=ghcr.io/${{ github.repository }}/iris-api:cache,mode=max
    secrets: |
      hf_token=${{ secrets.HF_TOKEN }}
```

### 步骤 7——测量（30 分钟）
运行 CI 工作流三次：
1. 删除缓存镜像后（冷构建）。
2. 有缓存，源代码未变化（完全命中）。
3. 有缓存，仅修改应用源代码（部分命中——应复用依赖层并重建应用层）。

在 `BENCHMARKS.md` 中记录数据。

## 交付物

1. 优化后的 Dockerfile。
2. GitHub Actions 工作流。
3. 包含三次计时与分析的 `BENCHMARKS.md`。
4. 验证：docker history 显示无泄露的 Secret。

## 验证

- [ ] 冷构建（无缓存镜像）成功。
- [ ] 热构建（有缓存且源代码无变化）耗时低于冷构建的 30%。
- [ ] 部分变更构建（仅修改应用源代码）耗时低于冷构建的 30%。
- [ ] 镜像仓库中存在多架构镜像——docker manifest inspect 显示 linux/amd64 和 linux/arm64。
- [ ] docker history 不包含 HF Token。

## 拓展目标

- 添加 **CodeBuild / GitHub Actions arm64 Runner**，完全避免 arm64 构建时的模拟。
- 对源文件使用 **COPY --link**，支持跨阶段缓存复用。
- 添加 **docker scout cves** 步骤，在发现严重 CVE 时阻止构建。

## 常见陷阱

- **容器内缓存挂载路径**——必须与工具实际使用的缓存目录一致（pip 使用 /root/.cache/pip，而非 /app/.cache/pip）。
- **缓存 max 模式占用大量镜像仓库存储**——设置保留策略，或使用较为保守的 mode=min。
- **--push 并发覆盖标签**——两个 PR 竞争时可能覆盖彼此缓存。使用逐分支缓存标签。
- **通过 RUN echo $HF_TOKEN 泄露 Secret**——Secret 应在 RUN 内安全读取；打印会使其出现在构建日志中。

> 译注：docker history 检查并不能证明镜像文件、构建缓存或日志中绝无密钥泄露；应同时检查这些位置，并避免将密钥作为 ARG 或 ENV 持久化。缓存挂载数据与可导出的镜像层缓存不同，需分别验证 CI 中的缓存持久化。
