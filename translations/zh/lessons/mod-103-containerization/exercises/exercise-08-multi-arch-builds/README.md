# 练习 08：多架构构建（amd64 + arm64）

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 练习 07（BuildKit）

## 目标

构建、推送并验证一个能够在 Intel/AMD（linux/amd64）与 ARM（linux/arm64）宿主机上原生运行的 Docker 镜像。比较模拟构建与原生 arm64 构建的性能，并验证多架构镜像的 Manifest List 能正确向每个平台提供对应镜像。

## 为什么重要

AWS Graviton、GCP Tau T2A 和 Apple Silicon 笔记本均采用 arm64。对于 CPU 密集型模型，原文估计 Graviton 上的机器学习推理在相同吞吐量下可节约 20–40% 成本。只发布 amd64 镜像的团队无法利用这些优势；支持多架构的团队可能仅需修改 Helm values 中的一项配置即可切换。

## 要求

1. 为 linux/amd64 和 linux/arm64 构建 iris-api 镜像。
2. 以 **Manifest List** 形式推送（一个标签、两个平台专用镜像）。
3. 使用 docker manifest inspect 验证两个平台均被声明。
4. 对每个平台进行推理延迟基准测试。
5. CI 工作流通过单个命令为每个 PR 构建两个平台的镜像。

## 分步操作

### 步骤 1——Buildx 配置（15 分钟）
```bash
docker buildx create --name multi --driver docker-container --bootstrap --use
docker buildx ls                # confirm both platforms available
```

### 步骤 2——通过模拟进行交叉构建（30 分钟）
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/me/iris-api:multi \
  --push .
time ...
```
注意 QEMU 模拟下的 arm64 构建较慢（原文称通常比原生慢 5–10 倍）。

### 步骤 3——原生 arm64 构建（30 分钟）
供应 Graviton（AWS）或 Tau T2A（GCP）实例。通过 SSH 登录，安装 Docker 与 buildx，然后运行：
```bash
docker buildx build --platform linux/arm64 -t arm64-only:latest --load .
```
与模拟构建的耗时比较。

### 步骤 4——验证 Manifest List（15 分钟）
```bash
docker manifest inspect ghcr.io/me/iris-api:multi
# Expect manifests for both linux/amd64 and linux/arm64

# On an arm64 host:
docker pull ghcr.io/me/iris-api:multi
docker run --rm ghcr.io/me/iris-api:multi uname -m   # → aarch64

# On amd64:
docker pull ghcr.io/me/iris-api:multi
docker run --rm ghcr.io/me/iris-api:multi uname -m   # → x86_64
```

### 步骤 5——推理基准测试（30 分钟）
在每个平台运行 iris-api 容器，并通过 Locust 进行负载测试（参照 mod-101 实验 04）。记录吞吐量与 p95 延迟。与相当规格的 x86 实例比较（例如 AWS M7g 与 M7i）。

### 步骤 6——CI 工作流（30 分钟）
GitHub Actions 提供 linux/arm64 Runner（私有仓库的计费依套餐而定）。使用 docker/build-push-action@v5 与矩阵配置：
```yaml
strategy:
  matrix:
    platform: [linux/amd64, linux/arm64]
runs-on: ${{ matrix.platform == 'linux/arm64' && 'ubuntu-22.04-arm' || 'ubuntu-22.04' }}
```
这样可以完全避免模拟。

## 交付物

1. 镜像仓库中的多架构镜像。
2. 比较模拟与原生构建耗时的 `BENCHMARKS.md`。
3. 比较 arm64 与 amd64 推理性能的 `BENCHMARKS.md`。
4. 在 PR 上产生多架构镜像的 CI 工作流。

## 验证

- [ ] docker manifest inspect 显示两个平台。
- [ ] docker run --platform linux/arm64 与 linux/amd64 均成功。
- [ ] 在 arm64 宿主机上，`docker run <image> uname -m` 返回 aarch64。
- [ ] 原生 arm64 构建比模拟构建快超过三倍。
- [ ] 至少为一个 CPU 模型记录 arm64 推理基准测试结果。

## 拓展目标

- 在 Manifest List 添加 **windows/amd64** 变体（机器学习较少使用，通用基础设施工具中较常见）。
- 使用 **--provenance=true** 附加 SLSA 来源证明。
- 构建自己的**多架构基础镜像**（供团队使用的加固精简镜像）。
- 容器启动时检测 NEON/SVE 指令可用性，并使用合适的 BLAS 实现。

## 常见陷阱

- **传统 Docker 镜像存储中的 --load 不支持多架构**——多平台 buildx 构建产生 Manifest List，不能直接加载到仅支持单平台镜像的存储中。使用 --push。
- **在 arm64 使用 amd64 依赖 Wheel**——缺少目标平台 Wheel 时，pip 可能从源码编译，使构建大幅变慢。使用两种架构的 Wheel，或在对应平台的 Builder 阶段编译。
- **arm64 上纯 PyTorch 性能可能较慢**——原文建议 ARM 用于 CPU 推理，amd64 用于 GPU。
- **Manifest List 与镜像标签不匹配**——不要将单架构与多架构构建推送至同一个标签；最后一次推送可能覆盖 Manifest List。

> 译注：原文声称 arm64 尚不支持 CUDA，这并不准确。NVIDIA 在部分 ARM64 Linux 平台提供 CUDA 支持，实际需核对硬件、驱动及容器镜像兼容性。支持 containerd 镜像存储的 Docker 环境也可具备多平台镜像加载能力。性能、价格与 Runner 可用性应以实测和当前平台配置为准。
