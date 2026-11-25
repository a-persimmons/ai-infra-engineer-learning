# 项目 01：基础模型服务系统

**时长：** 30 小时
**难度：** 中等
**先修要求：** 完成模块 01–04

## 项目概览

构建完整的模型服务系统，将预训练图像分类模型（ResNet）部署为 REST API。使用 Docker 容器化，部署至 Kubernetes，通过 Prometheus 和 Grafana 监控，并使用 CI/CD 流水线自动部署。

本项目展示以下基本技能：
- 模型服务与推理
- Docker 容器化
- Kubernetes 编排
- 监控与可观测性
- ML 系统的 CI/CD

## 学习目标

完成本项目后，你将能够：
1. **将 ML 模型部署为 REST API** — 使用 FastAPI 提供 PyTorch 模型服务。
2. **容器化 ML 应用** — 为 ML 服务创建优化的 Docker 镜像。
3. **部署至 Kubernetes** — 管理 Deployment、Service 和资源。
4. **实现监控** — 使用 Prometheus 追踪自定义指标并使用 Grafana 可视化。
5. **构建 CI/CD 流水线** — 使用 GitHub Actions 自动测试和部署。
6. **记录基础设施** — 为系统创建全面文档。

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     User/Client                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                 Kubernetes Cluster                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  LoadBalancer/Service (Port 8080)                  │    │
│  └─────────────────────┬──────────────────────────────┘    │
│                        │                                     │
│     ┌──────────────────┼──────────────────┐                │
│     │                  │                  │                 │
│     ↓                  ↓                  ↓                 │
│  ┌─────┐           ┌─────┐           ┌─────┐              │
│  │ Pod │           │ Pod │           │ Pod │               │
│  │ #1  │           │ #2  │           │ #3  │               │
│  │     │           │     │           │     │               │
│  │FastAPI          │FastAPI          │FastAPI              │
│  │+Model           │+Model           │+Model               │
│  └─────┘           └─────┘           └─────┘              │
│     │                  │                  │                 │
│     └──────────────────┼──────────────────┘                │
│                        │                                     │
│                        ↓                                     │
│            ┌───────────────────────┐                        │
│            │ ConfigMap (settings)  │                        │
│            └───────────────────────┘                        │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ↓ (metrics scraping)
┌─────────────────────────────────────────────────────────────┐
│              Monitoring Stack                               │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │   Prometheus    │ ──────> │    Grafana      │           │
│  │  (Metrics DB)   │         │  (Dashboards)   │           │
│  └─────────────────┘         └─────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 功能要求

### 必须实现

#### FR-1：图像分类 REST API
- **POST /predict** 端点接受上传图像或 URL。
- 返回置信度最高的 5 项预测。
- 小图像（小于 1MB）的 API 响应时间低于 100ms。
- 正确处理无效输入。
- 在 **/docs** 提供 API 文档（FastAPI 自动生成）。

#### FR-2：容器化
- 使用多阶段构建的 Dockerfile。
- 镜像小于 2GB。
- 容器以非 root 用户运行。
- 使用环境变量配置。
- 在 **/health** 提供健康检查端点。

#### FR-3：Kubernetes 部署
- Deployment 清单包含资源 requests/limits。
- Service 暴露 API（LoadBalancer 或 NodePort）。
- 使用 ConfigMap 配置应用。
- 配置存活及就绪探针。
- 支持无停机更新。

#### FR-4：监控
- Prometheus 采集应用指标。
- 自定义指标：**request_count、request_duration、prediction_count**。
- Grafana 仪表盘显示 5–7 个关键指标。
- 配置服务停机告警。
- 指标至少保留 7 天。

#### FR-5：CI/CD 流水线
- 每次向 main 分支提交时运行。
- 自动化 lint 与测试。
- 构建 Docker 镜像并推送至仓库。
- 自动部署到 Kubernetes（学习环境可选）。
- 流水线在 10 分钟内完成。

### 应当实现（推荐）

#### FR-6：性能
- API p95 延迟低于 100ms。
- 处理至少 10 个并发请求。
- 模型加载到内存（无冷启动延迟）。
- 正常负载下 CPU 利用率低于 70%。

## 技术栈

### 必需技术
- **Python 3.9+** — 应用语言
- **PyTorch** — ML 框架
- **FastAPI** — API Web 框架
- **Uvicorn** — ASGI 服务器
- **Docker** — 容器化
- **Kubernetes** — 编排（minikube 或云端）
- **Prometheus** — 指标采集
- **Grafana** — 可视化
- **GitHub Actions** — CI/CD

### 可选技术
- **TorchServe** — 自定义 FastAPI 服务的替代方案
- **Nginx** — 反向代理
- **Redis** — 缓存层
- **Locust** — 负载测试

## 项目结构

```
project-101-basic-model-serving/
├── README.md                       # This file
├── REQUIREMENTS.md                 # Detailed requirements
├── ARCHITECTURE.md                 # Architecture documentation
├── MILESTONES.md                   # Implementation milestones
│
├── src/
│   ├── __init__.py
│   ├── api.py                      # FastAPI application (CODE STUB)
│   ├── model.py                    # Model loading and inference (CODE STUB)
│   ├── utils.py                    # Utility functions (CODE STUB)
│   └── config.py                   # Configuration management (CODE STUB)
│
├── tests/
│   ├── __init__.py
│   ├── test_api.py                 # API tests (TEST STUBS)
│   └── test_model.py               # Model tests (TEST STUBS)
│
├── kubernetes/
│   ├── deployment.yaml             # K8s deployment (TEMPLATE)
│   ├── service.yaml                # K8s service (TEMPLATE)
│   ├── configmap.yaml              # Configuration (TEMPLATE)
│   └── hpa.yaml                    # Horizontal Pod Autoscaler (optional)
│
├── monitoring/
│   ├── prometheus.yml              # Prometheus config
│   └── grafana-dashboard.json      # Grafana dashboard template
│
├── docs/
│   ├── API.md                      # API documentation template
│   ├── DEPLOYMENT.md               # Deployment guide template
│   └── TROUBLESHOOTING.md          # Troubleshooting guide template
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml               # CI/CD pipeline (TEMPLATE)
│
├── requirements.txt                # Python dependencies
├── requirements-dev.txt            # Development dependencies
├── Dockerfile                      # Docker build instructions (TEMPLATE)
├── docker-compose.yml              # Local development setup
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
└── pytest.ini                      # Pytest configuration
```

## 实现里程碑

### 里程碑 1：可运行的 FastAPI 应用（6 小时）
**目标：** 本地通过 REST API 提供模型服务。

**任务：**
- 在 model.py 实现模型加载。
- 在 api.py 创建 FastAPI 应用。
- 实现 /predict、/health、/metrics 端点。
- 使用示例图像进行本地测试。
- 验证响应格式。

**交付物：** localhost:8000 上可用的 API。

### 里程碑 2：Docker 容器（4 小时）
**目标：** 容器化应用。

**任务：**
- 编写多阶段构建 Dockerfile。
- 优化镜像大小（小于 2GB）。
- 配置非 root 用户。
- 添加健康检查。
- 本地测试容器。

**交付物：** 成功运行的 Docker 镜像。

### 里程碑 3：Kubernetes 部署（6 小时）
**目标：** 在 Kubernetes 上运行服务。

**任务：**
- 编写 deployment.yaml。
- 编写 service.yaml。
- 创建 configmap.yaml。
- 部署至 minikube。
- 验证可访问性。

**交付物：** 可通过 K8s 访问的服务。

### 里程碑 4：监控（6 小时）
**目标：** Prometheus 与 Grafana 正常运行。

**任务：**
- 在 K8s 安装 Prometheus 和 Grafana。
- 配置 Prometheus 采集。
- 在应用中实现自定义指标。
- 创建 Grafana 仪表盘。
- 设置基本告警。

**交付物：** 显示指标的仪表盘。

### 里程碑 5：CI/CD 流水线（4 小时）
**目标：** 自动化测试及部署。

**任务：**
- 编写 GitHub Actions 工作流。
- 实现 lint 与测试。
- 配置 Docker 构建及推送。
- 添加部署步骤（可选）。
- 端到端测试流水线。

**交付物：** 可运行的 CI/CD 流水线。

### 里程碑 6：文档（4 小时）
**目标：** 完整文档。

**任务：**
- 编写 API 文档。
- 创建部署指南。
- 添加故障排查指南。
- 在 README 加入架构图。
- 添加代码注释。

**交付物：** 全面文档。

## 开始实践

### 步骤 1：配置项目
```bash
# Create project directory
mkdir -p project-101-basic-model-serving
cd project-101-basic-model-serving

# Copy starter code from this repository
# Or create structure manually

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 步骤 2：理解代码骨架

查看 src/ 目录的代码骨架。每个文件包含：
- **完整函数签名**
- **TODO 注释**，解释需要实现的内容
- 实现的**提示和示例**
- 用于清晰表达的**类型注解**

### 步骤 3：从里程碑 1 开始

按顺序完成里程碑。每个里程碑建立在前一个基础上。

### 步骤 4：边实现边测试

每完成一个组件就运行测试：

```bash
# Test API
pytest tests/test_api.py

# Test model
pytest tests/test_model.py

# Run all tests
pytest

# Check coverage
pytest --cov=src
```

### 步骤 5：记录工作

随进展保持文档更新。

## 评估标准

| 类别 | 权重 | 标准 |
|---|---|---|
| **功能** | 40% | API 正确处理各种输入；K8s 部署稳定；监控正常；CI/CD 可用；满足全部验收条件 |
| **代码质量** | 25% | 代码干净、结构清晰；符合 PEP 8；正确错误处理；外部化配置；Docker/K8s 最佳实践 |
| **文档** | 20% | 全面 README；架构图；明确部署说明；API 文档；故障排查指南 |
| **测试** | 10% | 单元测试（70% 以上覆盖率）；集成测试；全部通过 |
| **创新** | 5% | 创意解决方案；性能优化；附加功能 |

**通过分数：** 70/100。

## 成功指标

- [ ] API p95 响应时间低于 100ms
- [ ] 连续运行 7 天可用率超过 99%
- [ ] 监控仪表盘显示所有关键指标
- [ ] 20 个以上并发用户的负载测试通过
- [ ] 完整文档使其他人能够部署
- [ ] CI/CD 流水线成功部署

## 常见陷阱

1. **Docker 镜像过大** — 使用多阶段构建和 slim 基础镜像。
2. **模型未加载至内存** — 导致推理缓慢。
3. **缺少健康检查** — 导致部署问题。
4. **硬编码配置** — 使用 ConfigMap 和环境变量。
5. **未本地测试容器** — 部署 K8s 前使用 Docker 测试。
6. **资源限制不足** — 可能导致 OOM Kill。

## 优化技巧

1. 使用 slim Python 基础镜像（python:3.11-slim）。
2. 在 Docker 层缓存 pip 依赖。
3. 应用启动时预加载模型。
4. 使用异步 FastAPI 端点改善并发。
5. 如有需要，实现请求批处理。
6. 为重复预测添加缓存。

## 进阶扩展

完成核心要求后，尝试：
1. **请求批处理** — 批量处理推理请求，提高吞吐量。
2. **Redis 缓存** — 缓存常见预测。
3. **A/B 测试** — 同时部署两个模型版本。
4. **API 认证** — 添加 API Key 验证。
5. **Helm Chart** — 打包以便部署。
6. **Horizontal Pod Autoscaling** — 根据负载自动扩缩容。
7. **分布式追踪** — 使用 Jaeger 追踪请求。
8. **镜像优化** — 将 Docker 镜像减小至 1GB 以下。

## 实际业务关联

本项目模拟以下公司生产 ML 服务系统的模式：
- **Airbnb** — 推荐模型服务
- **Netflix** — 个性化 API
- **Uber** — 定价和预计到达时间预测

API + K8s + 监控 + CI/CD 是常见行业架构模式。

## 面试讨论要点

准备讨论：
- API 框架选型决策（FastAPI vs Flask vs TorchServe）。
- 模型服务方案权衡（内存内加载 vs 外部服务）。
- 如何在 Kubernetes 中处理扩缩容及资源管理。
- 监控策略及追踪的关键指标。
- CI/CD 流水线设计与测试策略。
- 如何使用监控工具排查生产问题。

## 帮助与资源

### 文档
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [PyTorch 文档](https://pytorch.org/docs/)
- [Kubernetes 文档](https://kubernetes.io/docs/)
- [Prometheus 文档](https://prometheus.io/docs/)

### 教程
- [FastAPI 教程](https://fastapi.tiangolo.com/tutorial/)
- [Kubernetes 基础](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)

### 获得帮助
- 在 GitHub Discussions 提问。
- 查看 TROUBLESHOOTING.md 中的常见问题。
- 自己尝试后，再查看解决方案仓库。

## 提交

完成后，提交：
1. **GitHub 仓库** — 全部代码及文档。
2. **演示视频（5–10 分钟）** — 展示系统工作情况。
3. **架构图** — 系统的可视化表示。
4. **README** — 全面文档。
5. **反思（1–2 页）** — 所学知识、遇到的挑战以及如何解决。

## 下一步

完成本项目后：
1. **评审与重构** — 改善代码质量。
2. **扩展** — 尝试进阶功能。
3. **分享** — 添加至 LinkedIn/简历。
4. **进入项目 02** — 构建端到端 MLOps 流水线。

---

**准备开始？** 查看 REQUIREMENTS.md 中的详细功能要求，再阅读 src/ 中的代码骨架，开始实现！

**祝你顺利！**

> 译注：各项指标为原文验收目标，并非实测结果。通过 URL 接收图像时需防范 SSRF，并限制下载大小、超时和目的地址。
