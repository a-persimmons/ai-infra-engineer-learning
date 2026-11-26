# 模块 08：监控与可观测性 — 学习资源

## 官方文档

### Prometheus
- **主要文档:** https://prometheus.io/docs/
- **PromQL 指南:** https://prometheus.io/docs/prometheus/latest/querying/basics/
- **最佳实践:** https://prometheus.io/docs/practices/naming/
- **告警规则:** https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/
- **记录规则:** https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/

### Grafana
- **文档:** https://grafana.com/docs/
- **仪表盘最佳实践:** https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/
- **自动配置:** https://grafana.com/docs/grafana/latest/administration/provisioning/
- **预构建仪表盘:** https://grafana.com/grafana/dashboards/
- **社区论坛:** https://community.grafana.com/

### Elasticsearch 与 ELK 技术栈
- **Elasticsearch:** https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
- **Logstash:** https://www.elastic.co/guide/en/logstash/current/index.html
- **Kibana:** https://www.elastic.co/guide/en/kibana/current/index.html
- **Filebeat:** https://www.elastic.co/guide/en/beats/filebeat/current/index.html
- **ELK 入门:** https://www.elastic.co/guide/en/elastic-stack-get-started/current/index.html

### Grafana Loki
- **文档:** https://grafana.com/docs/loki/latest/
- **LogQL 语言:** https://grafana.com/docs/loki/latest/logql/
- **最佳实践:** https://grafana.com/docs/loki/latest/best-practices/
- **Promtail:** https://grafana.com/docs/loki/latest/clients/promtail/

### 分布式链路追踪
- **OpenTelemetry:** https://opentelemetry.io/docs/
- **Jaeger:** https://www.jaegertracing.io/docs/
- **Grafana Tempo:** https://grafana.com/docs/tempo/latest/
- **OpenTelemetry Python:** https://opentelemetry.io/docs/instrumentation/python/

### Alertmanager
- **文档:** https://prometheus.io/docs/alerting/latest/
- **配置:** https://prometheus.io/docs/alerting/latest/configuration/
- **通知模板:** https://prometheus.io/docs/alerting/latest/notifications/

---

## 书籍

### 可观测性与监控

1. **《Observability Engineering》（可观测性工程），作者：Charity Majors、Liz Fong-Jones、George Miranda**
   - 出版社: O'Reilly (2022)
   - 重点: 构建可观测系统、文化和实践
   - 难度: 中级至高级
   - [O'Reilly 链接](https://www.oreilly.com/library/view/observability-engineering/9781492076438/)

2. **《Distributed Systems Observability》（分布式系统可观测性），作者：Cindy Sridharan**
   - 出版社: O'Reilly (2018)
   - 重点: 分布式系统中的监控、日志和链路追踪
   - 难度: 中级
   - [O'Reilly 链接](https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/)

3. **《Practical Monitoring》（实用监控），作者：Mike Julian**
   - 出版社: O'Reilly (2017)
   - 重点: 有效的监控策略和实践
   - 难度: 初级至中级
   - [O'Reilly 链接](https://www.oreilly.com/library/view/practical-monitoring/9781491957349/)

4. **《Prometheus: Up & Running》（Prometheus 入门与实践），作者：Brian Brazil**
   - 出版社: O'Reilly (2018)
   - 重点: 全面的 Prometheus 指南
   - 难度: 初级至中级
   - [O'Reilly 链接](https://www.oreilly.com/library/view/prometheus-up/9781492034131/)

### 站点可靠性工程

5. **《Site Reliability Engineering》（SRE 指南），作者：Google**
   - 出版社: O'Reilly (2016)
   - 重点: Google 管理生产系统的方法
   - 难度: 中级至高级
   - 在线免费阅读: https://sre.google/sre-book/table-of-contents/
   - 重点章节: 监控分布式系统、实用告警

6. **《The Site Reliability Workbook》（站点可靠性实践手册），作者：Google**
   - 出版社: O'Reilly (2018)
   - 重点: SRE 原则的实际实施
   - 在线免费阅读: https://sre.google/workbook/table-of-contents/
   - 重点章节: SLO 工程、基于 SLO 的告警

---

## 在线课程

### 免费课程

1. **Prometheus 与 Grafana 教程（TechWorld with Nana）**
   - 平台: YouTube
   - 链接: https://www.youtube.com/c/TechWorldwithNana
   - 时长: 多个视频（共 2–4 小时）
   - 难度: 初级

2. **使用 Grafana 实现可观测性（Grafana Labs）**
   - 平台: Grafana Learning
   - 链接: https://grafana.com/tutorials/
   - 时长: 自主安排进度
   - 难度: 初级至中级

3. **ELK 技术栈教程（DigitalOcean）**
   - 平台: DigitalOcean Community
   - 链接: https://www.digitalocean.com/community/tutorial_series/centralized-logging-with-elk-stack
   - 时长: 自主安排进度
   - 难度: 初级

### 付费课程

4. **《使用 Prometheus 进行监控和告警》（Linux Academy/ACG）**
   - 平台: A Cloud Guru
   - 时长: 3–4 小时
   - 难度: 中级
   - 包含: 实践实验

5. **《使用 Grafana 技术栈实现完整可观测性》（Udemy）**
   - 平台: Udemy
   - 时长: 6–8 小时
   - 难度: 中级
   - 覆盖: Prometheus, Grafana, Loki, Tempo

6. **《站点可靠性工程：度量与管理可靠性》（Coursera）**
   - 平台: Coursera (Google Cloud)
   - 时长: 4 周
   - 难度: 中级

---

## 交互式实验与在线沙盒

1. **Prometheus 在线沙盒**
   - 链接: https://play.prometheus.io/
   - 说明: 带示例数据的在线 Prometheus 实例
   - 用途: 练习 PromQL 查询

2. **Grafana Play**
   - 链接: https://play.grafana.org/
   - 说明: 带示例仪表盘的在线 Grafana 实例
   - 用途: 探索仪表盘与功能

3. **Katacoda 场景（已归档，现归 O'Reilly）**
   - 平台: O'Reilly Learning
   - 主题: Prometheus、Grafana、ELK、Kubernetes 监控
   - 难度: 初级至中级

4. **Killercoda**
   - 链接: https://killercoda.com/
   - 主题: 多种可观测性场景
   - 难度: 初级至中级

---

## 工具与程序库

### Python 程序库

```bash
# Prometheus client
pip install prometheus-client

# OpenTelemetry
pip install opentelemetry-api opentelemetry-sdk
pip install opentelemetry-instrumentation-fastapi
pip install opentelemetry-exporter-prometheus
pip install opentelemetry-exporter-jaeger

# Structured logging
pip install python-json-logger
pip install structlog

# ML monitoring
pip install evidently  # Data drift detection
pip install mlflow     # Experiment tracking
pip install shap       # Model explainability
```

### 指标导出器

- **Node Exporter:** https://github.com/prometheus/node_exporter
- **NVIDIA GPU Exporter (DCGM):** https://github.com/NVIDIA/dcgm-exporter
- **Kubernetes 指标:** https://github.com/kubernetes/kube-state-metrics
- **Blackbox Exporter:** https://github.com/prometheus/blackbox_exporter
- **PostgreSQL Exporter:** https://github.com/prometheus-community/postgres_exporter
- **MongoDB Exporter:** https://github.com/percona/mongodb_exporter

### 可视化与分析

- **Grafana 仪表盘:** https://grafana.com/grafana/dashboards/
  - GPU 监控: 仪表盘 #12239
  - Node Exporter: 仪表盘 #1860
  - Kubernetes: 仪表盘 #315

---

## 博客与文章

### 可观测性最佳实践

1. **《指标、链路追踪与日志》，作者：Peter Bourgon**
   - 链接: https://peter.bourgon.org/blog/2017/02/21/metrics-tracing-and-logging.html
   - 主题: 区分可观测性的三大支柱

2. **《云原生时代的监控》（CNCF 博客）**
   - 链接: https://www.cncf.io/blog/
   - 主题: 现代监控方法

3. **《如何监控 SRE 黄金指标》（Google Cloud）**
   - 链接: https://cloud.google.com/blog/products/devops-sre
   - 主题: 四大黄金指标的实施

### 机器学习专项监控

4. **《生产环境中的 ML 模型监控》（Eugene Yan）**
   - 链接: https://eugeneyan.com/writing/ml-monitoring/
   - 主题: 全面的 ML 监控指南

5. **《机器学习中的数据漂移》（Evidently AI 博客）**
   - 链接: https://www.evidentlyai.com/blog
   - 主题: 数据漂移检测与监控

6. **《MLOps 监控最佳实践》（Neptune.ai）**
   - 链接: https://neptune.ai/blog/ml-model-monitoring-best-tools
   - 主题: ML 监控工具与实践

### 企业工程博客

7. **Uber 工程博客**
   - 链接: https://eng.uber.com/
   - 主题: Jaeger、M3、大规模可观测性

8. **Netflix 技术博客**
   - 链接: https://netflixtechblog.com/
   - 主题: Atlas、可观测性模式

9. **Spotify 工程博客**
   - 链接: https://engineering.atspotify.com/
   - 主题: ML 监控、数据质量

---

## GitHub 仓库

### 示例项目

1. **Awesome Prometheus**
   - 链接: https://github.com/roaldnefs/awesome-prometheus
   - 说明: 精选 Prometheus 资源列表

2. **Grafana 仪表盘合集**
   - 链接: https://github.com/rfmoz/grafana-dashboards
   - 说明: 社区仪表盘合集

3. **OpenTelemetry Demo**
   - 链接: https://github.com/open-telemetry/opentelemetry-demo
   - 说明: 具备完整可观测性的微服务示例

4. **ML 监控示例**
   - 链接: https://github.com/evidentlyai/evidently
   - 说明: ML 监控和漂移检测

### 参考实现

5. **kube-prometheus-stack**
   - 链接: https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack
   - 说明: 完整的 Kubernetes 监控技术栈

6. **Prometheus Operator**
   - 链接: https://github.com/prometheus-operator/prometheus-operator
   - 说明: 用于 Prometheus 的 Kubernetes Operator

---

## 会议与演讲

### 年度会议

1. **KubeCon + CloudNativeCon**
   - 主题: 云原生环境中的可观测性
   - 视频: https://www.youtube.com/c/cloudnativefdn

2. **ObservabilityCON (Grafana Labs)**
   - 主题: Grafana 生态系统的最新发展
   - 视频: https://grafana.com/about/events/observabilitycon/

3. **PromCon（Prometheus 大会）**
   - 主题: Prometheus 生态系统与最佳实践
   - 视频: https://www.youtube.com/c/PrometheusIo

### 值得关注的演讲

4. **《可观测性：三年回顾》— Charity Majors**
   - 会议: QCon
   - 链接: 在 InfoQ 上搜索

5. **《面向微服务的分布式链路追踪》— Ben Sigelman**
   - 会议: 多个会议
   - 链接: 在 YouTube 上搜索

---

## 社区

### 论坛与讨论

1. **Prometheus 社区**
   - 邮件列表: https://groups.google.com/forum/#!forum/prometheus-users
   - Slack: https://prometheus.io/community/

2. **Grafana 社区**
   - 论坛: https://community.grafana.com/
   - Slack: https://grafana.slack.com/

3. **CNCF Slack**
   - 可观测性频道
   - 加入: https://communityinviter.com/apps/cloud-native/cncf

4. **r/devops (Reddit)**
   - 链接: https://www.reddit.com/r/devops/
   - 主题: 监控与可观测性讨论

---

## 认证

### 相关认证

1. **认证 Kubernetes 管理员（CKA）**
   - 包含: 监控 Kubernetes 集群
   - 认证机构: CNCF
   - 链接: https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/

2. **Prometheus 认证助理（PCA）**
   - 重点: Prometheus 基础
   - 认证机构: Linux Foundation
   - 链接: https://training.linuxfoundation.org/certification/prometheus-certified-associate/

3. **站点可靠性工程（SRE）认证**
   - 重点: 包括监控在内的 SRE 实践
   - 认证机构: DevOps Institute
   - 链接: https://www.devopsinstitute.com/certifications/sre-foundation/

---

## 速查表

1. **PromQL 速查表**
   - 链接: https://promlabs.com/promql-cheat-sheet/

2. **LogQL 速查表**
   - 链接: https://grafana.com/docs/loki/latest/logql/

3. **Elasticsearch Query DSL**
   - 链接: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html

---

## 新闻简报

1. **SRE Weekly**
   - 链接: https://sreweekly.com/
   - 频率: 每周
   - 主题: SRE、监控、事故

2. **DevOps'ish**
   - 链接: https://devopsish.com/
   - 频率: 每周
   - 主题: DevOps、云原生、可观测性

3. **Last Week in AWS**
   - 链接: https://www.lastweekinaws.com/
   - 频率: 每周
   - 主题: AWS，包括监控服务

---

## 实践项目

### 初级项目

1. **在本地搭建 Prometheus + Grafana**
   - 监控示例应用
   - 创建自定义仪表盘
   - 配置基础告警

2. **实现结构化日志**
   - 为 Python 应用添加 JSON 日志
   - 将日志发送到 Loki 或 ELK
   - 创建日志查询

### 中级项目

3. **构建完整的可观测性技术栈**
   - 指标: Prometheus
   - 日志: Loki or ELK
   - 链路追踪: Jaeger or Tempo
   - 仪表盘: Grafana

4. **ML 模型监控**
   - 为 ML 推理服务添加观测埋点
   - 跟踪准确率、延迟、吞吐量
   - 实现漂移检测
   - 创建面向 ML 的仪表盘

### 高级项目

5. **多集群可观测性**
   - 搭建联邦式 Prometheus
   - 跨集群集中式日志
   - 跨服务分布式链路追踪

6. **自定义 Exporter 开发**
   - 为自定义系统构建 Prometheus Exporter
   - 采用适当的指标命名规范
   - 添加配置选项

---

## 可进一步探索的工具

### 可观测性平台

- **Datadog:** https://www.datadoghq.com/
- **New Relic:** https://newrelic.com/
- **Dynatrace:** https://www.dynatrace.com/
- **Honeycomb:** https://www.honeycomb.io/
- **Lightstep:** https://lightstep.com/

### 开源替代方案

- **VictoriaMetrics:** 兼容 Prometheus，性能更好
- **Thanos:** Prometheus 长期存储
- **Cortex:** 可水平扩展的 Prometheus
- **M3:** Uber 的指标平台
- **SigNoz:** 开源可观测性平台

---

## 持续学习！

可观测性是一个快速发展的领域。通过以下方式跟进最新进展：
- 在 Twitter/X 上关注核心维护者
- 阅读所用工具的发布说明
- 尝试新功能
- 与社区分享学习心得
- 为开源项目贡献

**监控愉快！** 📊🔍🚀
