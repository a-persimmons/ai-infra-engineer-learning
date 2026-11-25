# 期中实践考核：AI 基础设施工程师

**时长：** 3 小时  
**及格线：** 70%（70/100 分）  
**开卷：** 是（允许文档、笔记）  
**可访问互联网：** 是（禁止与他人交流）

---

## 考试概览

本实践考试检验部署和管理端到端 ML 基础设施系统的能力。你将容器化应用、部署到 Kubernetes、搭建监控并排查问题。

## 环境

提供：
- 简单 ML 模型（预训练 sklearn 或 PyTorch 模型）。
- 基础 Python 推理代码。
- Kubernetes 集群访问权限。
- 已安装的 Prometheus 和 Grafana。

## 第一部分：容器化（25 分）

### 任务 1.1：创建优化的 Dockerfile（15 分）

为提供的 ML 推理应用创建 Dockerfile，满足：

- [ ] 使用 Python 3.11 基础镜像（2 分）。
- [ ] 多阶段构建（4 分）。
- [ ] 非 root 用户运行（3 分）。
- [ ] 仅安装生产依赖（2 分）。
- [ ] 镜像小于 500MB（2 分）。
- [ ] 正确设置工作目录并复制文件（2 分）。

**交付物：** `Dockerfile`。

### 任务 1.2：本地测试 Docker Compose（10 分）

创建 `docker-compose.yml`，运行：
- ML 推理服务。
- Redis（缓存）。
- Prometheus（指标）。

**要求：**
- [ ] 定义全部服务（3 分）。
- [ ] 服务间网络正确（3 分）。
- [ ] 配置健康检查（2 分）。
- [ ] 使用数据卷实现持久化（2 分）。

**交付物：** `docker-compose.yml`。

**测试：** 运行 `docker-compose up`，验证所有服务启动。

---

## 第二部分：Kubernetes 部署（30 分）

### 任务 2.1：创建 Kubernetes Manifest（20 分）

为 ML 服务创建 Kubernetes Manifest。

**2.1.1 Deployment（10 分）**
- [ ] 3 个副本（2 分）。
- [ ] Resource Request 和 Limit（2 分）。
- [ ] Liveness 和 Readiness 探针（3 分）。
- [ ] 从 ConfigMap 获取环境变量（2 分）。
- [ ] 正确的 Label 和 Selector（1 分）。

**2.1.2 Service（5 分）**
- [ ] ClusterIP Service 暴露 80 端口（3 分）。
- [ ] Selector 与 Deployment 匹配（2 分）。

**2.1.3 ConfigMap（3 分）**
- [ ] ConfigMap 包含模型配置（3 分）。

**2.1.4 HorizontalPodAutoscaler（2 分）**
- [ ] HPA 目标 CPU 利用率 70%（2 分）。
- [ ] 最小 2 个、最大 10 个副本。

**交付物：**
- `deployment.yaml`
- `service.yaml`
- `configmap.yaml`
- `hpa.yaml`

### 任务 2.2：部署与验证（10 分）

将应用部署至 Kubernetes。

**运行命令：**
```bash
# Apply manifests
kubectl apply -f k8s/

# Verify deployment
kubectl get pods
kubectl get svc
kubectl describe hpa

# Test endpoint
# (Provide command showing successful API call)
```

**评估：**
- [ ] 所有 Pod 正常运行（3 分）。
- [ ] Service 可访问（3 分）。
- [ ] HPA 配置正确（2 分）。
- [ ] 可以成功预测（2 分）。

**交付物：** 显示成功部署的截图或命令输出。

---

## 第三部分：监控搭建（25 分）

### 任务 3.1：实现 Prometheus 指标（15 分）

为应用增加 Prometheus 指标。

**必需指标：**
- [ ] `predictions_total`：预测总数 Counter（3 分）。
- [ ] `prediction_duration_seconds`：延迟 Histogram（4 分）。
- [ ] `model_loaded`：模型状态 Gauge（3 分）。
- [ ] `prediction_errors_total`：错误数 Counter（3 分）。
- [ ] 指标具有正确标签（model_name、version）（2 分）。

**交付物：** 添加指标后的应用代码。

### 任务 3.2：创建 Grafana 仪表盘（10 分）

**必需面板：**
- [ ] 请求速率（QPS）——图表（2 分）。
- [ ] P95 延迟——图表（3 分）。
- [ ] 错误率——图表（2 分）。
- [ ] 活跃 Pod——Stat 面板（1 分）。
- [ ] 合适的时间范围和刷新设置（1 分）。
- [ ] 用于过滤的仪表盘变量（1 分）。

**交付物：** `dashboard.json`（导出的仪表盘）。

---

## 第四部分：故障排查与运维（20 分）

### 任务 4.1：调试问题（10 分）

提供一个存在故障的部署，诊断并修复问题。

**场景：** 部署中故意设置了 3 个问题。

**任务：**
1. 找出全部问题（3 分，每个 1 分）。
2. 修复每个问题（6 分，每项 2 分）。
3. 记录问题及修复方式（1 分）。

**可能的问题：**
- 错误镜像 Tag。
- 缺少环境变量。
- 错误端口配置。
- 资源限制过低。
- 健康检查配置错误。

**交付物：**
- 修复后的 YAML 文件。
- 记录问题与修复的 `TROUBLESHOOTING.md`。

### 任务 4.2：性能优化（10 分）

根据当前部署，识别并实施 3 项优化。

**优化方向：**
- [ ] 减小 Docker 镜像（3 分）。
- [ ] 优化资源分配（3 分）。
- [ ] 改善启动时间（2 分）。
- [ ] 增加缓存层（2 分）。

**交付物：** `OPTIMIZATIONS.md`，记录：
- 优化内容。
- 优化前后指标。
- 改善性能的原因。

---

## 提交要求

### 目录结构

```
exam-submission/
├── Dockerfile
├── docker-compose.yml
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── hpa.yaml
├── app/
│   └── main.py (with metrics)
├── grafana/
│   └── dashboard.json
├── TROUBLESHOOTING.md
├── OPTIMIZATIONS.md
└── README.md
```

### README.md 必须包含
1. 如何本地构建和运行。
2. 如何部署至 Kubernetes。
3. 如何访问服务。
4. 如何查看指标和仪表盘。
5. 假设或注意事项。

---

## 评估标准

### 功能性（40%）
- 代码运行无错误。
- 所有服务成功部署。
- 端点正确响应。
- 监控正常工作。

### 完整性（30%）
- 提交所有必需文件。
- 尝试全部任务。
- 文档完整。

### 质量（20%）
- 遵循最佳实践。
- 正确使用 Kubernetes 资源。
- 考虑安全性。
- 代码整洁、有组织。

### 问题解决（10%）
- 故障排查方法。
- 优化选择。
- 文档质量。

---

## 评分细则

| 部分 | 分值 | 标准 |
|---|---:|---|
| **第一部分：容器化** | 25 | Dockerfile 质量、Compose 配置 |
| **第二部分：Kubernetes** | 30 | Manifest 正确，部署成功 |
| **第三部分：监控** | 25 | 指标实现，仪表盘正常 |
| **第四部分：故障排查** | 20 | 修复问题，实现优化 |
| **总计** | **100** | |

### 加分项（最多 10 分）
- 额外优化（+5）。
- 出色文档（+3）。
- 创新方案（+2）。

---

## 时间管理建议

- **第 1 小时：** 第一、二部分（容器化及 Kubernetes）。
- **第 2 小时：** 第三部分（监控）。
- **第 3 小时：** 第四部分（故障排查）及文档。

**提示：** 即使尚未完成，也提交已有成果。可以获得部分分数！

---

## 允许使用的资源

**允许：**
- Kubernetes 文档。
- Docker 文档。
- Prometheus/Grafana 文档。
- 自己的笔记。
- 课程材料。
- Stack Overflow（仅阅读）。

**禁止：**
- 与他人交流。
- 在线发帖提问。
- 使用 ChatGPT 或 AI 助手。
- 复制他人解答。

---

## 提交

1. 将提交目录打包为 ZIP。
2. 命名为 `LastName_FirstName_MidtermExam.zip`。
3. 上传至考试提交门户。
4. 确认提交已收到。

**截止：** 考试时段结束（开始后 3 小时）。

**逾期：** 每 15 分钟扣 10%。

---

## 祝顺利！

记住：
- 仔细阅读所有说明。
- 提交前测试。
- 记录决策。
- 合理管理时间。
- 即使未完成也要提交。

**考试期间有疑问：** 举手或使用指定交流渠道（仅用于澄清题意，不提供解答帮助）。

> 译注：原文任务 4.2 要求三项优化，但四项分值合计 10 分；具体计分按实际考核要求确认。考试禁止使用 AI 的规则为原文考核约束。代码块保留原样。
