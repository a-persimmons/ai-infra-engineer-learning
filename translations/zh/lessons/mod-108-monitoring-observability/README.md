# 模块 08：监控与可观测性

## 概览

本模块全面介绍 AI 基础设施的监控与可观测性实践。你将学习实现生产级监控系统，实时追踪基础设施健康状态、应用性能和机器学习模型行为。

## 模块目标

完成本模块后，你将能够：

1. **理解可观测性**：解释可观测性的三大支柱（指标、日志、链路追踪）。
2. **实现指标采集**：配置 Prometheus 采集基础设施与应用指标。
3. **创建仪表盘**：构建 Grafana 仪表盘，将系统健康状态可视化。
4. **集中式日志**：部署 ELK/EFK 技术栈，聚合并分析日志。
5. **分布式链路追踪**：实现跨微服务的请求追踪。
6. **配置告警**：设置合理的告警和 On-call 工作流。
7. **监控机器学习模型**：追踪模型性能、漂移与数据质量。
8. **生产运维**：实施 SLI、SLO 和事故响应。

## 前置条件

- **必需**：
  - 熟练使用 Linux 命令行
  - Docker 基础（模块 03）
  - Kubernetes 基础（模块 04）
  - 基本网络概念
  - Python 编程

- **推荐**：
  - 生产系统经验
  - 理解 HTTP/REST API
  - SQL 基础

## 模块结构

### 讲义

1. **可观测性导论**（约 75 分钟）
   - 三大支柱：指标、日志、链路追踪
   - 可观测性与监控对比
   - OpenTelemetry 标准
   - 设计可观测系统

2. **Prometheus 指标采集**（约 90 分钟）
   - Prometheus 架构
   - 指标类型与命名
   - Exporter 与服务发现
   - PromQL 查询语言
   - Recording Rule

3. **Grafana 仪表盘与可视化**（约 75 分钟）
   - 仪表盘设计原则
   - 面板类型与查询
   - 变量与模板
   - Grafana 告警
   - 共享与版本管理

4. **集中式日志**（约 90 分钟）
   - 日志最佳实践
   - ELK/EFK 技术栈架构
   - 日志采集（Fluentd/Filebeat）
   - Elasticsearch 索引
   - Kibana 查询与可视化

5. **分布式链路追踪**（约 75 分钟）
   - 链路追踪基础
   - Jaeger/Zipkin 架构
   - 应用埋点
   - Trace 分析
   - 性能优化

6. **告警与事故响应**（约 90 分钟）
   - 告警设计原则
   - Alertmanager 配置
   - On-call 工作流
   - 事故管理
   - 事后复盘与 SRE 实践

7. **机器学习专用监控**（约 90 分钟）
   - 模型性能指标
   - 数据漂移检测
   - 预测监控
   - 模型版本管理与回滚
   - A/B 测试指标

8. **生产环境最佳实践**（约 75 分钟）
   - SLI、SLO 与 SLA
   - 错误预算
   - 容量规划
   - 成本优化
   - 安全监控

### 动手实验

- **实验 1**：部署 Prometheus + Grafana 技术栈。
- **实验 2**：使用 EFK 搭建集中式日志。
- **实验 3**：实现分布式链路追踪。
- **实验 4**：创建机器学习模型监控仪表盘。
- **实验 5**：构建生产级可观测性技术栈。

### 评估

- **测验**：涵盖所有讲义的 25 道题。
- **实践练习**：为机器学习系统设计可观测性方案。
- **综合项目**：实现完整监控技术栈。

## 学习路线

```
Introduction to Observability
         ↓
    ╔═══════════════════╗
    ║    Prometheus     ║ → Metrics Collection
    ║   (Time-series)   ║
    ╚═══════════════════╝
         ↓
    ╔═══════════════════╗
    ║     Grafana       ║ → Visualization
    ║   (Dashboards)    ║
    ╚═══════════════════╝
         ↓
    ╔═══════════════════╗
    ║    ELK/EFK        ║ → Logging
    ║ (Log Management)  ║
    ╚═══════════════════╝
         ↓
    ╔═══════════════════╗
    ║ Jaeger/Zipkin     ║ → Tracing
    ║ (Distributed)     ║
    ╚═══════════════════╝
         ↓
    ╔═══════════════════╗
    ║  AlertManager     ║ → Alerting
    ║  (Notifications)  ║
    ╚═══════════════════╝
         ↓
    ML-Specific Monitoring
         ↓
   Production Best Practices
```

## 所需工具与配置

### 核心监控技术栈
```bash
# Prometheus (metrics)
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz

# Grafana (visualization)
wget https://dl.grafana.com/oss/release/grafana-10.0.0.linux-amd64.tar.gz

# Alertmanager (alerting)
wget https://github.com/prometheus/alertmanager/releases/download/v0.25.0/alertmanager-0.25.0.linux-amd64.tar.gz
```

### 日志技术栈
```bash
# Elasticsearch
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.9.0

# Kibana
docker pull docker.elastic.co/kibana/kibana:8.9.0

# Fluentd
docker pull fluent/fluentd:v1.16
```

### 链路追踪
```bash
# Jaeger all-in-one
docker pull jaegertracing/all-in-one:1.48
```

### Python 库
```bash
pip install prometheus-client      # Prometheus metrics
pip install opentelemetry-api      # OpenTelemetry
pip install opentelemetry-sdk
pip install python-json-logger     # Structured logging
pip install grafanalib             # Grafana as code
```

## 涵盖的核心概念

### 可观测性基础
- **指标（Metrics）**：随时间变化的数值测量（CPU、内存、每秒请求数）。
- **日志（Logs）**：带上下文的离散事件（错误、事务）。
- **链路追踪（Traces）**：请求在分布式系统中的流转过程。
- **基数（Cardinality）**：不同指标标签组合的数量。
- **采样（Sampling）**：在保留洞察能力的同时减少数据量。

### Prometheus 概念
- **时间序列**：由指标名称与标签唯一标识。
- **抓取（Scraping）**：基于拉取的指标采集。
- **Exporter**：暴露指标端点的应用。
- **联邦（Federation）**：分层 Prometheus 配置。
- **远程存储**：长期指标存储。

### Grafana 概念
- **数据源**：Grafana 查询数据的位置。
- **面板**：单独的可视化组件。
- **变量**：动态仪表盘参数。
- **注释**：图表上的事件标记。
- **播放列表**：轮换展示仪表盘。

### 日志概念
- **结构化日志**：JSON 格式的日志条目。
- **日志级别**：DEBUG、INFO、WARN、ERROR、FATAL。
- **关联 ID**：关联相关日志条目。
- **日志保留**：保留日志的时间长度。
- **索引模式**：Elasticsearch 索引组织方式。

### 链路追踪概念
- **Span**：一条 Trace 内的单个操作。
- **Trace Context**：跨服务边界传播的上下文。
- **采样**：采集的 Trace 所占比例。
- **服务网格**：自动化链路追踪埋点。
- **尾部采样**：观察完整 Trace 后再执行采样。

## 真实场景应用

本模块为以下任务做准备：

1. **生产事故**：快速诊断并解决问题。
2. **容量规划**：根据趋势预测资源需求。
3. **性能优化**：识别机器学习流水线瓶颈。
4. **成本管理**：追踪并优化基础设施成本。
5. **合规**：满足日志和审计要求。
6. **SRE 实践**：实施 SLO 与错误预算。

## 行业背景

### 为什么重要

可观测性对于机器学习基础设施至关重要：

- **复杂性**：现代机器学习系统跨越数十个服务。
- **规模**：每天处理数百万次预测。
- **可靠性**：机器学习系统需要满足 SLA（99.9% 以上可用时间）。
- **成本**：GPU/计算成本需要仔细监控。
- **合规**：法规要求保留审计记录。
- **性能**：亚秒级延迟要求。

### 常见场景

1. **模型性能监控**：追踪准确率、延迟、吞吐量。
2. **数据质量**：检测漂移、缺失特征与异常值。
3. **基础设施健康**：GPU 利用率、内存、磁盘 I/O。
4. **成本归因**：按模型、团队、项目追踪成本。
5. **事故响应**：根因分析与调试。
6. **合规**：审计日志、数据访问追踪。

## 时间投入

- **讲义**：约 10–12 小时
- **动手实验**：约 15–20 小时
- **测验与评估**：约 3–4 小时
- **总计**：约 30–35 小时

## 成功标准

能够完成以下任务时，你就成功完成了本模块：

- [ ] 解释可观测性的三大支柱及各自使用场景。
- [ ] 部署并配置 Prometheus 采集指标。
- [ ] 创建带告警的有效 Grafana 仪表盘。
- [ ] 使用 ELK/EFK 技术栈搭建集中式日志。
- [ ] 实现跨微服务的分布式链路追踪。
- [ ] 设计并配置合理的告警规则。
- [ ] 监控机器学习模型性能与数据漂移。
- [ ] 计算并追踪 SLI 和 SLO。
- [ ] 有效响应生产事故。
- [ ] 优化监控成本与数据保留策略。

## 其他参考资料

### 文档
- [Prometheus 文档](https://prometheus.io/docs/)
- [Grafana 文档](https://grafana.com/docs/)
- [Elasticsearch 指南](https://www.elastic.co/guide/)
- [Jaeger 文档](https://www.jaegertracing.io/docs/)

### 书籍
- Charity Majors 等人的《Observability Engineering》
- Google SRE 团队的《The Site Reliability Workbook》
- Cindy Sridharan 的《Distributed Systems Observability》

### 工具
- **Prometheus**：时间序列指标数据库。
- **Grafana**：可视化与仪表盘。
- **Alertmanager**：告警路由与管理。
- **Elasticsearch**：日志存储与搜索。
- **Kibana**：日志可视化。
- **Jaeger**：分布式链路追踪。
- **OpenTelemetry**：可观测性框架。

### 社区
- [CNCF Observability TAG](https://github.com/cncf/tag-observability)
- [Prometheus Users](https://prometheus.io/community/)
- [Grafana Community](https://community.grafana.com/)

## 下一步

完成本模块后，你将为以下内容做好准备：

- **模块 09**：基础设施即代码——自动化监控部署。
- **模块 10**：LLM 基础设施——监控大语言模型。
- **项目 02**：构建包含全面监控的 MLOps 流水线。
- **项目 03**：部署具备生产级可观测性的 LLM。

---

**准备构建生产级可观测性了吗？开始学习监控吧！**
