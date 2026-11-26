# 模块 108：监控与可观测性 — 参考答案

> [模块测验](../../../lessons/mod-108-monitoring-observability/quizzes/module-quiz.md)的详细答案，包含解析、常见错误和课程参考。
>
> **学术诚信：** 请在尝试完成测验后用于自学。

---

## 问题 1
**问题：** 可观测性的三大支柱是什么？

**答案：** B) 指标、日志、链路追踪

**解析：**
可观测性的三大支柱是指标（随时间聚合的数值度量）、日志（带时间戳的离散事件记录）和链路追踪（请求在分布式系统中经过的路径）。三者共同提供互补信号，让工程师不仅能回答发生了*什么*，还能够回答*为什么*。每个支柱弥补其他支柱的盲区，例如指标展示趋势，日志揭示上下文，链路追踪揭示跨服务的因果关系。

**常见错误：**
- 选择 A（监控、日志记录、追踪）：监控是一门实践学科，而不是支柱；支柱是指标，即用于监控的数据类型。
- 选择 D（CPU、内存、磁盘）：这些是基础设施资源类别，而非可观测性支柱。

**相关资料：** `lessons/mod-108-monitoring-observability/01-introduction-observability.md`

---

## 问题 2
**问题：** Prometheus 中哪种指标类型只能随时间增加？

**答案：** C) Counter（计数器）

**解析：**
Prometheus 计数器是单调递增的数值，仅在进程重启时重置，非常适合已处理请求数、遇到的错误数或已处理字节数等累计量。通常对计数器应用 `rate()` 或 `increase()` 以计算每秒速率或增量。相反，Gauge 可以升降，而 Histogram 和 Summary 记录观测值的分布。

**常见错误：**
- 选择 A（Gauge）：Gauge 自由波动（例如温度、队列深度），因此与计数器相反。
- 选择 B（Histogram）：直方图内部使用多个桶计数器，但直方图类型本身记录的是分布，而不是单个单调数值。

**相关资料：** `lessons/mod-108-monitoring-observability/02-prometheus-metrics.md`

---

## 问题 3
**问题：** 监控与可观测性的主要区别是什么？

**答案：** B) 监控回答“哪里坏了”，可观测性回答“为什么坏了”

**解析：**
传统监控通过预定义的仪表盘与告警观察已知故障模式，告诉你*出现了问题*。可观测性更进一步，通过提供丰富的高基数数据，让你提出关于系统行为的全新、未预料到的问题，帮助理解故障*为什么*发生。实践中，监控是可观测系统的一个子集。

**常见错误：**
- 选择 C（监控只有指标）：两者都使用指标、日志与追踪；区别在于方法，而非数据类型。
- 选择 D（没有区别）：两者相关但并非同义词；混淆二者会导致应对未知问题的工具投入不足。

**相关资料：** `lessons/mod-108-monitoring-observability/01-introduction-observability.md`

---

## 问题 4
**问题：** 在 ML 系统中，“数据漂移”指什么？

**答案：** B) 输入数据分布与训练数据相比发生变化

**解析：**
当推理时传入特征的统计分布偏离模型训练所用的分布，就会出现数据漂移（也称协变量偏移）。即使模型自身没有变化，其预测也可能退化，因为它被应用于已学习的输入空间之外。通过 PSI、KS 检验等及早检测漂移，可以在准确率崩溃前重新训练模型。

**常见错误：**
- 选择 A（准确率随时间下降）：那是“概念漂移”或模型性能退化，通常是数据漂移的*后果*，而非定义。
- 选择 C（网络延迟）：漂移是数据的统计性质，与网络性能无关。

**相关资料：** `lessons/mod-108-monitoring-observability/07-ml-model-observability.md`

---

## 问题 5
**问题：** 以下哪项不属于“四大黄金指标”？

**答案：** C) 安全

**解析：**
Google SRE 的四大黄金指标为延迟、流量、错误和饱和度，是任何面向用户的服务至少应采集的信号。安全虽然关键，却是一个独立领域，由不同的控制措施和遥测数据（审计日志、入侵检测）处理。黄金指标关注用户感知的可靠性及剩余容量。

**常见错误：**
- 选择 A（延迟）或 B（流量）：两者都是核心黄金指标，可能是误读了问题。
- 选择 D（饱和度）：饱和度表示资源有多“满”，是第四项黄金指标，相比更熟悉的延迟、流量和错误，它常被遗忘。

**相关资料：** `lessons/mod-108-monitoring-observability/01-introduction-observability.md`

---

## 问题 6
**问题：** 以下 PromQL 查询计算的是什么？
```promql
rate(http_requests_total[5m])
```

**答案：** B) 最近 5 分钟内的平均每秒请求数

**解析：**
`rate()` 计算计数器在指定时间范围内每秒的平均增长速率。使用 `[5m]` 窗口时，它返回最近 5 分钟的平均每秒请求数，并平滑短时尖峰。若要获取总量，应使用 `increase()`；若要获取每分钟速率，则乘以 60。

**常见错误：**
- 选择 A（请求总数）：应使用 `increase(http_requests_total[5m])`，而非 `rate()`。
- 选择 C（当前请求速率）：`rate()` 返回 5 分钟平均值；瞬时速率应使用 `irate()`。

**相关资料：** `lessons/mod-108-monitoring-observability/02-prometheus-metrics.md`

---

## 问题 7
**问题：** Prometheus 中记录规则的目的是什么？

**答案：** B) 预计算高开销查询，并将结果存储为新的时间序列

**解析：**
记录规则允许按计划计算复杂或频繁使用的 PromQL 表达式，并将结果持久化为新的时间序列。这显著加快仪表盘和告警的速度，否则每次查询都需重新执行重量级聚合。它们是让高流量 Grafana 面板保持响应速度的标准工具。

**常见错误：**
- 选择 C（记录告警历史）：告警历史保存在 Alertmanager 或外部存储中，而非记录规则。
- 选择 D（备份指标）：备份由 remote_write 或快照处理，而非记录规则。

**相关资料：** `lessons/mod-108-monitoring-observability/02-prometheus-metrics.md`

---

## 问题 8
**问题：** Prometheus 告警规则中的 `for: 5m` 是什么意思？

**答案：** C) 只有条件连续满足 5 分钟时，告警才触发

**解析：**
`for` 子句规定告警表达式必须连续为真多长时间，告警才能从 pending（待触发）转换到 firing（触发中）。这可以抑制瞬时尖峰，降低短暂异常造成的噪声。评估间隔（规则运行频率）则由独立的 `evaluation_interval` 设置控制。

**常见错误：**
- 选择 A（每 5 分钟触发一次）：`for` 不控制通知频率；应通过 Alertmanager 的 `repeat_interval` 配置。
- 选择 B（每 5 分钟评估一次）：评估频率由全局设置控制，而不是 `for`。

**相关资料：** `lessons/mod-108-monitoring-observability/06-alerting-strategies.md`

---

## 问题 9
**问题：** 应使用哪个 PromQL 函数根据直方图计算第 95 百分位延迟？

**答案：** B) histogram_quantile()

**解析：**
`histogram_quantile(0.95, sum(rate(metric_bucket[5m])) by (le))` 从 Prometheus 直方图暴露的累计桶计数器中插值计算第 95 百分位。该函数需要 `le`（小于或等于）标签，因此直方图必须定义累计桶。PromQL 中不存在内置的 `percentile_95()` 函数。

**常见错误：**
- 选择 A（avg_over_time）：平均值掩盖尾部延迟，而 P95/P99 正是为了揭示尾部延迟。
- 选择 D（percentile_95）：PromQL 中没有这个函数，它只是一个看起来合理的干扰项。

**相关资料：** `lessons/mod-108-monitoring-observability/02-prometheus-metrics.md`

---

## 问题 10
**问题：** Prometheus 拉取式架构的主要优势是什么？

**答案：** B) 更容易检测目标何时宕机

**解析：**
因为 Prometheus 主动抓取目标，所以抓取失败会立即通过 `up` 指标（值为 `0`）体现，目标健康状态成为一等概念。拉取也简化访问控制（只需要 Prometheus 能访问目标），并借助 Kubernetes/Consul 集成自然实现服务发现。在推送系统中，沉默的 Agent 可能与没有流量的健康 Agent 看起来完全相同。

**常见错误：**
- 选择 A（更低的网络开销）：拉取与推送的开销相似；目标较多时拉取甚至可能开销更大。
- 选择 C（更快的数据采集）：速度由抓取间隔决定，而不是拉取或推送模式。

**相关资料：** `lessons/mod-108-monitoring-observability/02-prometheus-metrics.md`

---

## 问题 11
**问题：** Grafana 仪表盘中变量的用途是什么？

**答案：** B) 创建具有过滤功能的动态、可复用仪表盘

**解析：**
Grafana 变量（模板变量）允许用户在仪表盘顶部选择值，例如环境、命名空间、模型名称，并将这些值替换到每个面板的查询中。这样可将一个仪表盘变成跨多个实体复用的视图，避免仪表盘泛滥。变量可以从数据源查询、常量或自定义列表填充。

**常见错误：**
- 选择 A（存储查询结果）：Grafana 单独缓存查询结果；变量保存可选值，而非结果集。
- 选择 C（定义告警阈值）：阈值在每个面板或告警规则中配置，而非通过变量配置。

**相关资料：** `lessons/mod-108-monitoring-observability/03-grafana-visualization.md`

---

## 问题 12
**问题：** 哪种 Grafana 面板类型最适合显示单个当前值及其阈值指示？

**答案：** C) Gauge（仪表）

**解析：**
Gauge 面板将单个标量值与可配置的颜色阈值（例如绿色、黄色、红色区间）进行对照展示，使当前状态及其“离危险还有多远”一目了然。它非常适合利用率百分比或 SLO 预算等 KPI。时间序列展示趋势，表格展示多个值，热力图展示密度分布。

**常见错误：**
- 选择 A（Time series）：更适合展示值随时间变化，而非单个瞬时读数。
- 选择 D（Heatmap）：热力图展示两个维度上的分布，而非单个值。

**相关资料：** `lessons/mod-108-monitoring-observability/03-grafana-visualization.md`

---

## 问题 13
**问题：** Grafana 中转换（transformation）的作用是什么？

**答案：** B) 在可视化之前修改查询结果

**解析：**
转换在面板渲染前，对查询返回的数据执行客户端操作，例如连接时间序列、重命名字段、过滤行、计算派生列等。当你不能或不希望将逻辑下推到底层查询语言时，转换是合适的工具。转换链按顺序执行，每步输出作为下一步输入。

**常见错误：**
- 选择 A（转换数据源类型）：Grafana 不会改变数据源类型；这在数据源层配置。
- 选择 C（更改主题）：主题属于用户或 UI 设置，与数据无关。

**相关资料：** `lessons/mod-108-monitoring-observability/03-grafana-visualization.md`

---

## 问题 14
**问题：** Grafana 中自动配置（provisioning）的目的是什么？

**答案：** B) 通过文件自动配置数据源和仪表盘

**解析：**
Provisioning 使用 YAML/JSON 文件（通常挂载到容器中）声明数据源、仪表盘、告警规则和通知渠道，从而使 Grafana 可以通过代码复现。这支持 GitOps 工作流、仪表盘版本控制和可靠的灾难恢复，并消除不同环境之间手动点击操作产生的配置漂移。

**常见错误：**
- 选择 A（分配内存）：资源分配由容器运行时处理，而非 Grafana。
- 选择 C（创建用户账号）：用户配置是相关但独立的问题，通常与 OAuth/LDAP 关联。

**相关资料：** `lessons/mod-108-monitoring-observability/03-grafana-visualization.md`

---

## 问题 15
**问题：** 结构化日志相比非结构化日志的主要优势是什么？

**答案：** C) 可由机器解析与查询

**解析：**
结构化日志（通常是 JSON）携带明确的键值字段，因此日志聚合器可以在不依赖脆弱的正则表达式提取的情况下建立索引、过滤、聚合和连接。例如可以执行“展示所有 `user_id=42` 且 `latency_ms>500` 的错误”这样的查询。非结构化纯文本日志需要解析管道，而消息格式一旦改变，管道便可能失效。

**常见错误：**
- 选择 A（更易于人类阅读）：原始 JSON 实际上比自由文本*更难*快速浏览，工具可以弥补这点。
- 选择 B（占用更少磁盘空间）：由于键名和引号，JSON 通常比纯文本更大。

**相关资料：** `lessons/mod-108-monitoring-observability/04-logging-elk-loki.md`

---

## 问题 16
**问题：** ELK 技术栈中哪个组件负责解析与转换日志数据？

**答案：** B) Logstash

**解析：**
Logstash 是 ELK 技术栈的 ETL 引擎，从多种输入接收事件，使用过滤插件（grok、mutate、geoip 等）解析和丰富事件，再将结果转发给 Elasticsearch 或其他输出端。Elasticsearch 负责存储及索引；Kibana 负责可视化；Filebeat 负责传输原始日志行。现代技术栈通常使用更轻量的 Beats 与 Elasticsearch ingest pipeline 替代 Logstash，但题目考察的是经典 ELK 分工。

**常见错误：**
- 选择 A（Elasticsearch）：Elasticsearch 负责索引与搜索，但解析在上游 Logstash（或 ingest pipeline）中进行。
- 选择 D（Filebeat）：Filebeat 是轻量级日志传输工具，执行最少处理后转发日志行。

**相关资料：** `lessons/mod-108-monitoring-observability/04-logging-elk-loki.md`

---

## 问题 17
**问题：** Loki 与 Elasticsearch 的主要区别是什么？

**答案：** B) Loki 只索引标签，不索引全文

**解析：**
Loki 采用“Prometheus 风格”设计：它为每个日志流索引少量标签，将压缩日志内容存储在对象存储中，再在查询时通过类似 grep 的过滤器执行全文匹配。与 Elasticsearch 的全文倒排索引相比，这大幅降低索引体积与成本，代价是临时文本搜索速度较慢。对于高流量且标签丰富的工作负载，这带来成本低得多的日志技术栈。

**常见错误：**
- 选择 A（Loki 更慢）：在限定标签范围的查询中，Loki 实际上可能更快；Elasticsearch 在大范围全文扫描上占优。
- 选择 D（占用更多存储）：Loki 跳过全文索引，因此占用的存储*更少*。

**相关资料：** `lessons/mod-108-monitoring-observability/04-logging-elk-loki.md`

---

## 问题 18
**问题：** 分布式链路追踪中的 span 是什么？

**答案：** B) 一条 trace 中的单次操作

**解析：**
Span 表示一个工作单元，例如函数调用、RPC、数据库查询，包含开始时间、持续时间、属性以及将其连接到树中的父 span ID。一条 trace 是共享同一 trace ID 的全部 span 的集合，构成请求经过各服务的路径。Span 是 OpenTelemetry SDK 发出的基本构建单元。

**常见错误：**
- 选择 A（trace 总时长）：这是 trace 的根 span 时长，而不是 span 本身的定义。
- 选择 D（网络连接）：span 是逻辑操作，而非传输层结构。

**相关资料：** `lessons/mod-108-monitoring-observability/05-distributed-tracing.md`

---

## 问题 19
**问题：** 哪个协议或框架已成为观测埋点的行业标准？

**答案：** C) OpenTelemetry

**解析：**
OpenTelemetry（OTel）是 CNCF 毕业级标准，统一跨厂商、跨语言的指标、日志、链路追踪 API、SDK 和 OTLP 传输协议。它取代早期 OpenTracing 与 OpenCensus 项目，如今几乎所有可观测性后端（Jaeger、Tempo、Datadog 等）都支持它。选择 OTel 可以避免观测埋点代码被供应商锁定。

**常见错误：**
- 选择 A（Zipkin）或 B（Jaeger）：二者是链路追踪*后端*，现在都可以消费 OpenTelemetry SDK 发出的 OTLP 数据。
- 选择 D（Prometheus）：Prometheus 是指标系统，而非通用观测埋点框架。

**相关资料：** `lessons/mod-108-monitoring-observability/05-distributed-tracing.md`

---

## 问题 20
**问题：** 与 Jaeger 相比，Grafana Tempo 的主要优势是什么？

**答案：** C) 更低的存储成本（对象存储、最少索引）

**解析：**
Tempo 将链路追踪直接存储在对象存储（S3、GCS、Azure Blob）中，并仅索引 trace ID，依靠 TraceQL 及与指标、日志的关联寻找感兴趣的 trace。相比 Jaeger 的逐属性索引，这大幅降低成本，尤其在大规模场景中使 100% 保留成为可能。这一设计符合“存储一切，通过关联查询”的范式。

**常见错误：**
- 选择 A（更好的 UI）：现代技术栈中二者都使用 Grafana 进行可视化；UI 不是差异所在。
- 选择 B（更快的查询）：基于标签的搜索中 Tempo 实际上可能更慢；优势是成本，而不是速度。

**相关资料：** `lessons/mod-108-monitoring-observability/05-distributed-tracing.md`

---

## 问题 21
**问题：** 为了具备可操作性，每条告警应包含什么？

**答案：** B) 运维手册 URL 或明确的修复步骤

**解析：**
可操作的告警告诉响应人员*哪里出错、为什么重要，以及该怎么处理*。在告警注解中嵌入运维手册链接（或直接写入步骤），能够将凌晨 3 点收到的紧急呼叫从慌乱变成按流程处理，并缩短平均解决时间。缺少修复指导的告警是告警疲劳与事件响应缓慢的主要成因。

**常见错误：**
- 选择 A（颜色编码）：颜色对仪表盘有帮助，却无法帮助正在阅读 Slack/PagerDuty 消息的值班工程师。
- 选择 D（历史趋势图）：这是有用的上下文，但不是告警可操作性最重要的要素。

**相关资料：** `lessons/mod-108-monitoring-observability/06-alerting-strategies.md`

---

## 问题 22
**问题：** Alertmanager 中抑制规则的用途是什么？

**答案：** B) 当高优先级告警触发时，抑制低优先级告警

**解析：**
抑制规则允许基于匹配标签使一条告警静默另一条告警，例如“集群宕机”告警触发时，可抑制所有仅属于症状的“服务不可达”告警。这防止级联故障期间产生告警风暴，让响应人员专注于根因。它不同于静默（手动、有时间限制的屏蔽）和分组（批量通知）。

**常见错误：**
- 选择 A（阻止发送告警）：描述过于宽泛；静默可以实现这一目的，而抑制取决于另一条告警是否触发。
- 选择 C（降低通知速度）：这是 `repeat_interval` 或 `group_wait` 的功能，而非抑制。

**相关资料：** `lessons/mod-108-monitoring-observability/06-alerting-strategies.md`

---

## 问题 23
**问题：** 什么是“告警疲劳”？

**答案：** B) 因误报过多而导致团队忽略告警

**解析：**
当响应人员被大量噪声、低价值或误报的告警淹没时，会出现告警疲劳，即敏感度降低；最终他们开始忽略或自动确认所有告警，包括真实事故。这是值班有效性面临的最大威胁。解决方法是严格调优：每条告警都必须可操作、紧急且范围明确，否则应将其改为仪表盘。

**常见错误：**
- 选择 A（告警耗时太长）：这是告警延迟，是另一个相对少见的问题。
- 选择 C（CPU 使用率）：告警的 CPU 成本可以忽略；这是干扰项。

**相关资料：** `lessons/mod-108-monitoring-observability/06-alerting-strategies.md`

---

## 问题 24
**问题：** 群体稳定性指数（PSI）用于什么？

**答案：** B) 检测两个分布之间的数据漂移

**解析：**
PSI 通过比较分桶比例，量化一个特征的分布在参考时期（通常为训练数据）与比较时期（当前生产数据）之间变化了多少。常见阈值：PSI < 0.1 表示无显著漂移，0.1–0.25 表示中度漂移，> 0.25 表示需要采取措施的显著漂移。它广泛用于信用风险模型，也是 ML 可观测性仪表盘的常用指标。

**常见错误：**
- 选择 A（模型准确率）：准确率使用带标签的真实值衡量，而不是 PSI。
- 选择 D（GPU 利用率）：这是基础设施指标，与统计漂移无关。

**相关资料：** `lessons/mod-108-monitoring-observability/07-ml-model-observability.md`

---

## 问题 25
**问题：** 在 ML 可解释性场景中，SHAP 的全称是什么？

**答案：** B) SHapley Additive exPlanations（Shapley 加性解释）

**解析：**
SHAP 将合作博弈论中的 Shapley 值应用于模型预测，归因每个特征的边际贡献，产生可加、局部准确的解释。它广泛用于全局特征重要性与单次预测的可解释性，并与 XGBoost、LightGBM、PyTorch 等框架集成。随时间监控 SHAP 值，甚至能在原始分布看起来稳定时发现特征重要性漂移。

**常见错误：**
- 选择 A 或 C：这些是由任意词汇组成、看似合理的干扰项；SHAP 明确源自 Lloyd Shapley。
- 选择 D（System Health and Performance）：混淆了 ML 可解释性技术与通用运维缩写。

**相关资料：** `lessons/mod-108-monitoring-observability/07-ml-model-observability.md`

---
