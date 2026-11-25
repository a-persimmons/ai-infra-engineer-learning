# 项目 01：基础模型服务系统

**时长：** 30 小时  
**难度：** 中等  
**前置条件：** 完成模块 01–04

## 项目概览

构建完整模型服务系统，将预训练图像分类模型 ResNet 部署为 REST API。使用 Docker 容器化，Kubernetes 部署，Prometheus 和 Grafana 监控，并通过 CI/CD 流水线自动部署。

本项目展示以下基础技能：
- 模型服务与推理。
- Docker 容器化。
- Kubernetes 编排。
- 监控与可观测性。
- ML 系统 CI/CD。

## 学习目标

完成后，你将能够：
1. **部署 ML 模型 REST API**——通过 FastAPI 提供 PyTorch 模型服务。
2. **容器化 ML 应用**——创建优化的 Docker 镜像。
3. **部署至 Kubernetes**——管理 Deployment、Service 及资源。
4. **实现监控**——Prometheus 追踪自定义指标，Grafana 可视化。
5. **构建 CI/CD 流水线**——GitHub Actions 自动化测试与部署。
6. **记录基础设施**——创建完整系统文档。

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

## 功能需求

### 必须实现

#### FR-1：图像分类 REST API
- **POST /predict** 接收图像上传或 URL。
- 返回 Top-5 预测及置信度。
- 小于 1MB 的小图像响应时间低于 100ms。
- 正确处理无效输入。
- **/docs** 提供自动生成的 API 文档。

#### FR-2：容器化
- Dockerfile 多阶段构建。
- 镜像小于 2GB。
- 非 root 用户运行。
- 通过环境变量配置。
- **/health** 健康端点。

#### FR-3：Kubernetes 部署
- Deployment Manifest 含资源 Request/Limit。
- Service（LoadBalancer 或 NodePort）暴露 API。
- ConfigMap 提供应用配置。
- 配置 Liveness 及 Readiness 探针。
- 支持零停机更新。

#### FR-4：监控
- Prometheus 抓取应用指标。
- 自定义指标：**request_count、request_duration、prediction_count**。
- Grafana 仪表盘展示 5–7 个关键指标。
- 配置服务中断告警。
- 指标保留至少 7 天。

#### FR-5：CI/CD 流水线
- main 分支每次提交运行流水线。
- 自动 Lint 及测试。
- 构建 Docker 镜像并推送仓库。
- 自动部署至 Kubernetes（学习环境可选）。
- 流水线 10 分钟内完成。

### 建议实现

#### FR-6：性能
- API P95 延迟低于 100ms。
- 处理 10 个以上并发请求。
- 模型加载至内存（避免冷启动延迟）。
- 正常负载下 CPU 利用率低于 70%。

## 技术栈

### 必需技术
- **Python 3.9+**：应用语言。
- **PyTorch**：ML 框架。
- **FastAPI**：API Web 框架。
- **Uvicorn**：ASGI 服务器。
- **Docker**：容器化。
- **Kubernetes**：编排（minikube 或云）。
- **Prometheus**：指标采集。
- **Grafana**：可视化。
- **GitHub Actions**：CI/CD。

### 可选技术
- **TorchServe**：自定义 FastAPI 服务的替代方案。
- **Nginx**：反向代理。
- **Redis**：缓存层。
- **Locust**：负载测试。

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
**目标：** 本地 REST API 模型服务。

**任务：**
- 在 model.py 实现模型加载。
- 在 api.py 创建 FastAPI 应用。
- 实现 /predict、/health、/metrics 端点。
- 使用示例图像本地测试。
- 验证响应格式。

**交付物：** localhost:8000 上运行的 API。

### 里程碑 2：Docker 容器（4 小时）
**目标：** 容器化应用。

**任务：**
- 编写多阶段构建 Dockerfile。
- 优化镜像大小（低于 2GB）。
- 配置非 root 用户。
- 添加健康检查。
- 本地测试容器。

**交付物：** 成功运行的 Docker 镜像。

### 里程碑 3：Kubernetes 部署（6 小时）
**目标：** 服务在 Kubernetes 运行。

**任务：**
- 编写 deployment.yaml。
- 编写 service.yaml。
- 创建 configmap.yaml。
- 部署至 minikube。
- 验证可访问性。

**交付物：** 可通过 K8s 访问的服务。

### 里程碑 4：监控（6 小时）
**目标：** Prometheus 和 Grafana 正常运行。

**任务：**
- 在 K8s 安装 Prometheus 和 Grafana。
- 配置 Prometheus 抓取。
- 在应用实现自定义指标。
- 创建 Grafana 仪表盘。
- 设置基础告警。

**交付物：** 展示指标的仪表盘。

### 里程碑 5：CI/CD 流水线（4 小时）
**目标：** 自动化测试与部署。

**任务：**
- 编写 GitHub Actions 工作流。
- 实现 Lint 和测试。
- 配置 Docker 构建与推送。
- 增加部署步骤（可选）。
- 端到端测试流水线。

**交付物：** 正常的 CI/CD 流水线。

### 里程碑 6：文档（4 小时）
**目标：** 完整文档。

**任务：**
- 编写 API 文档。
- 创建部署指南。
- 添加故障排查指南。
- 更新 README 和架构图。
- 增加代码注释。

**交付物：** 完整文档。

## 快速开始

### 步骤 1：设置项目

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

### 步骤 2：理解代码桩

查看 src/ 目录的代码桩。每个文件包含：
- **完整函数签名。**
- **TODO 注释**，说明需实现什么。
- **实现提示和示例。**
- **类型提示**，便于理解。

### 步骤 3：从里程碑 1 开始

按顺序完成里程碑，每个阶段基于前一阶段。

### 步骤 4：随时测试

每个组件完成后运行测试：

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

随进展持续更新文档。

## 考核评分标准

| 类别 | 权重 | 标准 |
|---|---|---|
| **功能性** | 40% | API 正确处理各种输入；Kubernetes 部署稳定；监控及 CI/CD 正常；满足所有验收标准 |
| **代码质量** | 25% | 代码整洁、组织合理；PEP 8；错误处理；外部化配置；Docker/K8s 最佳实践 |
| **文档** | 20% | 完整 README、架构图、清晰部署说明、API 文档、故障排查 |
| **测试** | 10% | 单元测试覆盖率 70% 以上、集成测试、全部通过 |
| **创新** | 5% | 创新方案、性能优化、额外功能 |

**及格：** 70/100。

## 成功指标

项目成功条件：
- [ ] API P95 响应时间低于 100ms。
- [ ] 连续运行 7 天可用性超过 99%。
- [ ] 仪表盘显示全部关键指标。
- [ ] 20 个以上并发用户的负载测试通过。
- [ ] 完整文档允许他人部署。
- [ ] CI/CD 流水线部署成功。

## 常见陷阱

1. Docker 镜像太大——采用多阶段构建、slim 基础镜像。
2. 模型未加载至内存——导致推理缓慢。
3. 缺少健康检查——造成部署问题。
4. 硬编码配置——使用 ConfigMap 和环境变量。
5. 不进行本地容器测试——K8s 前先用 Docker 测试。
6. 资源限制不足——可能导致 OOM Kill。

## 优化建议

1. 使用 slim Python 基础镜像（python:3.11-slim）。
2. 在 Docker 层缓存 pip 依赖。
3. 应用启动时预加载模型。
4. 使用 FastAPI 异步端点改善并发。
5. 按需实现请求批处理。
6. 缓存重复预测。

## 进阶学习者扩展

完成核心需求后尝试：
1. **请求批处理**——合并多个推理请求提高吞吐。
2. **Redis 缓存**——缓存常见预测。
3. **A/B 测试**——同时部署两个模型版本。
4. **API 鉴权**——API Key 验证。
5. **Helm Chart**——打包以便部署。
6. **Horizontal Pod Autoscaling**——基于负载扩缩容。
7. **分布式追踪**——增加 Jaeger。
8. **镜像优化**——将 Docker 镜像减小到 1GB 以下。

## 真实业务相关性

原文举例以下公司具有类似的生产 ML 服务场景：
- **Airbnb**：推荐模型服务。
- **Netflix**：个性化 API。
- **Uber**：价格及到达时间预测。

API + K8s + 监控 + CI/CD 是业界常见架构模式。

## 面试讨论点

准备讨论：
- API 框架选择的设计决策（FastAPI、Flask、TorchServe）。
- 模型服务方法的取舍（内存加载与外部服务）。
- Kubernetes 扩展及资源管理。
- 监控策略及关键指标。
- CI/CD 设计与测试策略。
- 如何借助监控调试生产问题。

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

### 获取帮助
- 在 GitHub Discussions 提问。
- 查看 TROUBLESHOOTING.md。
- 自行尝试后再查看解答仓库。

## 提交

完成后提交：
1. GitHub 仓库——全部代码及文档。
2. 演示视频（5–10 分钟）——展示系统运行。
3. 架构图——系统可视化。
4. README——完整文档。
5. 反思（1–2 页）——学习收获、挑战及解决方法。

## 下一步

完成项目后：
1. 复盘与重构——改善代码质量。
2. 扩展——尝试高级功能。
3. 分享——加入 LinkedIn 或简历。
4. 进入项目 02——构建端到端 MLOps 流水线。

---

**准备开始？** 原文建议查看 REQUIREMENTS.md 的详细功能要求，再阅读 src/ 代码桩开始实现。

祝顺利！

> 译注：性能及可用性均为项目验收目标，未实际测量。URL 输入需防 SSRF，CPU 密集推理不能仅依赖 async 提升性能。具体依赖版本、文件及 API 路径以仓库实际实现为准。
