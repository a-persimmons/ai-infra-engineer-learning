# 模块 105：数据流水线 — 参考答案

> [模块测验](../../../lessons/mod-105-data-pipelines/quizzes/module-quiz.md)的详细答案，包含解析、常见错误和课程参考。
>
> **学术诚信：** 请先尝试完成测验，再用于自学。

---

## 问题 1
**问题：** Apache Airflow 在 ML 基础设施中的主要用途是什么？

**答案：** B) 编排和调度复杂的数据工作流

**解析：**
Airflow 是工作流编排器，本身不负责模型训练、服务或存储，而是协调任务（提取、转换、训练、评估、部署），管理任务依赖、调度、重试与可观测性。在 ML 基础设施中，它如同“指挥者”，将 Spark、DVC、模型训练器等工具连接成可复现的流水线。

**常见错误：**
- 选择 A（训练模型）：Airflow 本身不执行训练代码，而是触发在其他地方定义的训练任务。
- 选择 C（提供预测服务）：这是模型服务器（如 TorchServe、KServe）的职责，而非编排器的职责。
- 选择 D（存储训练数据）：存储由对象存储、数据仓库或 DVC 远程存储负责。

**相关资料：** `lessons/mod-105-data-pipelines/02-apache-airflow-fundamentals.md`

---

## 问题 2
**问题：** 在 Airflow 中，DAG 的全称是什么？

**答案：** B) Directed Acyclic Graph（有向无环图）

**解析：**
DAG 将工作流建模为由有向边（依赖关系）连接的节点（任务），并严格禁止环路。这保证了确定的执行顺序和有限的运行过程，Airflow 调度器正是依靠这些性质来规划任务启动。

**常见错误：**
- 选择 A、C 或 D：它们听起来合理，但都不是真正的 Airflow 术语。“无环”是关键约束，也是 DAG 与一般图的区别。

**相关资料：** `lessons/mod-105-data-pipelines/02-apache-airflow-fundamentals.md`

---

## 问题 3
**问题：** 判断题：Airflow 的 DAG 中，任务可以具有循环依赖。

**答案：** 错误

**解析：**
DAG 中的 A 代表 *acyclic*（无环）。若任务 A 依赖 B，而 B 又依赖 A，调度器无法确定起点，Airflow 会拒绝解析 DAG。循环会在 DAG 解析阶段被检测到，并抛出 `AirflowDagCycleException`。

**常见错误：**
- 因为混淆“任务可以多次重试”和“任务可以依赖自己”而回答正确。重试在*时间上*类似循环，但依赖图仍然无环。

**相关资料：** `lessons/mod-105-data-pipelines/02-apache-airflow-fundamentals.md`

---

## 问题 4
**问题：** Airflow 中哪个组件负责执行任务？

**答案：** C) Executor（执行器）

**解析：**
Airflow 将*执行什么*（调度器的决定）与*如何、在哪里执行*（执行器）分开。Scheduler 决定哪些任务实例已经就绪，将它们放入队列，而 Executor（Local、Celery、Kubernetes 等）实际启动运行任务代码的工作进程。

**常见错误：**
- 选择 A（Scheduler）：调度器只决定应运行什么，并将工作交给执行器。
- 选择 B（Web Server）：提供 UI 和 API，从不执行任务代码。
- 选择 D（Metadata Database）：存储 DAG、运行与任务状态，是被动存储而非执行器。

**相关资料：** `lessons/mod-105-data-pipelines/02-apache-airflow-fundamentals.md`

---

## 问题 5
**问题：** Airflow 中 `depends_on_past` 参数的用途是什么？

**答案：** A) 如果上一次 DAG 运行失败，则阻止任务运行

**解析：**
`depends_on_past=True` 使任务实例等待*上一次计划的 DAG 运行*中*同一个任务*成功后才运行。对于有状态流水线（如增量 ETL），今天的运行依赖昨天正确完成，这一点非常关键。

**常见错误：**
- 选择 B（任务间共享数据）：这是 XCom，而非 `depends_on_past`。
- 选择 C（调度过去的任务）：回填由 `start_date` 与 `catchup` 配置，而非此参数。
- 选择 D（检查任务依赖）：普通上下游依赖通过 `>>` 或 `set_upstream` 声明，而非 `depends_on_past`。

**相关资料：** `lessons/mod-105-data-pipelines/03-advanced-airflow-ml.md`

---

## 问题 6
**问题：** 解释 Airflow 中 `CeleryExecutor` 与 `LocalExecutor` 的区别。

**答案：**

- **LocalExecutor** 使用 Python 多进程，在与调度器*相同的机器*上并行运行任务。它受单台宿主机的 CPU、内存和进程限制，适合开发和中小型生产部署。
- **CeleryExecutor** 通过 Celery 消息代理（Redis 或 RabbitMQ）将任务分发到*远程工作机器池*。它支持水平扩展、跨主机故障隔离，适合高吞吐量生产工作负载。

**解析：**
核心区别是单机并行与分布式并行，后者伴随运维复杂度增加（使用 Celery 必须运行并监控消息代理及工作节点集群）。KubernetesExecutor 更进一步，为每个任务启动一个 Pod。

**常见错误：**
- 认为 LocalExecutor 是“单线程”：它是多进程，只不过运行在同一台机器。
- 忘记 CeleryExecutor 需要外部消息代理（Redis/RabbitMQ）与工作进程；这部分运维开销是主要权衡。
- 混淆 CeleryExecutor 与 KubernetesExecutor：两者均分发工作，但 Kubernetes 为每个任务创建新的 Pod，而 Celery 使用长期运行的工作进程。

**相关资料：** `lessons/mod-105-data-pipelines/02-apache-airflow-fundamentals.md`

---

## 问题 7
**问题：** DVC（数据版本控制）解决什么问题？

**答案：** A) 使用 Git 管理大型数据集

**解析：**
Git 针对源代码优化，不适合大型二进制文件（GB 级图像、Parquet、模型权重）。DVC 在 Git 之上增加一层：在 Git 中追踪小型 `.dvc` 指针文件，同时将实际大文件推送到远程后端（S3、GCS、Azure、SSH 等）。由此可对任意大型数据集及模型实现 Git 风格的版本控制。

**常见错误：**
- 选择 B（跟踪模型性能）：这是 MLflow 或 Weights & Biases 的职责。
- 选择 C（部署到生产环境）：DVC 流水线用于运行实验；部署由 CI/CD 或模型服务平台处理。
- 选择 D（监控数据质量）：这是 Great Expectations、Deequ 或 Soda 的职责，而非 DVC。

**相关资料：** `lessons/mod-105-data-pipelines/04-data-versioning-dvc.md`

---

## 问题 8
**问题：** 判断题：DVC 将实际数据文件保存在 Git 仓库中。

**答案：** 错误

**解析：**
DVC 仅提交包含内容哈希及远程位置的微小元数据文件（`.dvc` 文件）。实际字节保存在 DVC 的本地缓存及配置的远程存储（S3、GCS、Azure Blob、SSH 等）中。这让 Git 仓库保持小巧、快速，同时仍能可复现地检出任意历史数据集版本。

**常见错误：**
- 看到“DVC 与 Git 一起工作”就回答正确；它是与 Git *协作*，而非将二进制数据塞进 Git 对象数据库。

**相关资料：** `lessons/mod-105-data-pipelines/04-data-versioning-dvc.md`

---

## 问题 9
**问题：** 使用哪个命令通过 DVC 跟踪新数据集？

**答案：** A) `dvc add <file>`

**解析：**
`dvc add` 计算文件哈希，将文件移入 DVC 缓存，创建 `<file>.dvc` 指针文件，并将原始路径添加到 `.gitignore`。随后使用 `git add` 添加 `.dvc` 文件，并执行 `dvc push` 将数据上传到配置的远程存储。

**常见错误：**
- 选择 B（`dvc track`）：并非 DVC 命令；有人类比 `git lfs track` 虚构了该命令。
- 选择 C（`dvc commit`）：命令存在，但用于手动变更后重新记录流水线阶段输出，而非首次跟踪。
- 选择 D（`dvc push`）：将已跟踪文件上传到远程存储，不能开始跟踪新文件。

**相关资料：** `lessons/mod-105-data-pipelines/04-data-versioning-dvc.md`

---

## 问题 10
**问题：** DVC 流水线的用途是什么？

**答案：** B) 定义可复现的数据处理工作流

**解析：**
DVC 流水线（在 `dvc.yaml` 中定义）声明具有明确输入（deps）、输出（outs）、参数和执行命令的阶段。DVC 跟踪这些内容的哈希，因此运行 `dvc repro` 时仅重新执行输入发生变化的阶段，从而获得与版本化数据直接关联、可复现且感知缓存的数据和 ML 工作流。

**常见错误：**
- 选择 A（清洗数据）：清洗可能是某个阶段执行的工作；流水线是封装层，并非清洗工具。
- 选择 C（压缩文件）或 D（加密）：DVC 既不压缩也不加密数据，这些问题交给远程存储后端。

**相关资料：** `lessons/mod-105-data-pipelines/04-data-versioning-dvc.md`

---

## 问题 11
**问题：** Apache Spark 相比传统 MapReduce 的主要优势是什么？

**答案：** B) 内存处理，实现 100 倍加速

**解析：**
Hadoop MapReduce 在每个 map 和 reduce 阶段之间将中间结果写入磁盘。Spark 通过 DAG 执行引擎跨阶段将数据集（RDD/DataFrame）保留在内存中，消除大部分磁盘 I/O。对于迭代工作负载（ML 训练、图算法），这带来著名的数量级性能提升。

**常见错误：**
- 选择 A（安全性）：Spark 和 MapReduce 均依赖 Hadoop 生态的安全机制（Kerberos、Ranger），并非差异化优势。
- 选择 C（更少存储）：Spark 的设计实际上使用*更多* RAM。
- 选择 D（更容易安装）：两者的运维都不简单，这不是主要优势。

**相关资料：** `lessons/mod-105-data-pipelines/05-data-processing-spark.md`

---

## 问题 12
**问题：** Spark 中的 DataFrame 是什么？

**答案：** A) 组织为命名列的分布式数据集合

**解析：**
Spark DataFrame 是具有 Schema（命名且带类型的列）、经过分区的分布式 `Row` 对象集合。概念上类似关系表或 pandas DataFrame，但分布在多个执行器上，并通过 Catalyst（查询规划器）及 Tungsten（执行引擎）优化。

**常见错误：**
- 选择 B（单机 pandas DataFrame）：pandas 是单进程的；Spark DataFrame 是分布式的。两者拥有相似的 API，但执行模型不同。
- 选择 C（SQL 表）：可以使用 SQL 查询 DataFrame，但 DataFrame 本身是内存中的分布式结构，而非持久化表。
- 选择 D（JSON 文件格式）：JSON 是可读入 DataFrame 的数据*来源*，而非 DataFrame 本身。

**相关资料：** `lessons/mod-105-data-pipelines/05-data-processing-spark.md`

---

## 问题 13
**问题：** 判断题：在 Spark 中，调用转换操作时会立即执行。

**答案：** 错误

**解析：**
Spark 使用*惰性求值*。`filter`、`map`、`select` 和 `groupBy` 等转换仅构建逻辑计划（血缘 DAG）。直到 `count`、`collect`、`write` 或 `show` 等*行动操作*触发执行之前，实际计算不会运行。这使 Catalyst 可以在数据移动前优化整个计划（谓词下推、列裁剪、阶段融合）。

**常见错误：**
- 类比 pandas 而回答正确：pandas 是立即求值，Spark 是惰性求值。将两者混淆是从 pandas 转向 Spark 时最常见的陷阱。

**相关资料：** `lessons/mod-105-data-pipelines/05-data-processing-spark.md`

---

## 问题 14
**问题：** 以下哪个是 Spark 行动操作（而非转换）？

**答案：** D) `count()`

**解析：**
行动操作向 Driver 返回值或写出数据，触发血缘计划执行。`count()` 向 Driver 返回 `Long`，因此必须执行计划。`filter`、`map` 与 `groupBy` 仅构建计划并返回新的 DataFrame/RDD，属于转换。

**常见错误：**
- 选择 C（`groupBy`）：它看起来很重（行动执行时确实可能触发 shuffle），但本身仅惰性地返回 `GroupedData` 对象；直到调用聚合及行动操作才会执行。
- 选择 A 或 B（`filter`/`map`）：二者都是典型的惰性转换。

**相关资料：** `lessons/mod-105-data-pipelines/05-data-processing-spark.md`

---

## 问题 15
**问题：** 解释 Spark 中 shuffle 的含义及其为何昂贵。

**答案：** Shuffle 是*跨分区和执行器重新分发数据*的过程，使具有相同键的行进入同一分区。它由 `groupByKey`、`reduceByKey`、`join`、`distinct` 和 `repartition` 等宽依赖转换触发。

**解析：**
Shuffle 成本高昂，因为它涉及：
1. **磁盘 I/O**：Map 端输出以 shuffle 文件形式写入本地磁盘。
2. **网络传输**：Reducer 跨集群获取自己的分区。
3. 每条 shuffle 记录的**序列化与反序列化**。
4. **内存压力**：无法放入执行器内存的分区溢写到磁盘。
5. **阶段边界**：Shuffle 结束一个阶段并启动下一个阶段，在所有 Map 任务完成前阻塞进度。

缓解措施包括优先使用 `reduceByKey` 而不是 `groupByKey`、对小表使用广播连接、为倾斜键加盐，以及预先对数据分区。

**常见错误：**
- 只说它是“在机器间移动数据”，而不提磁盘溢写或阶段边界；二者都是主要成本来源。
- 认为只有 `repartition` 是 shuffle：`repartition` 会导致 shuffle，但 join、group-by 与 distinct 也会。
- 忘记 `reduceByKey` 因为在 Map 端合并，比 `groupByKey` shuffle 的数据更少；这是常见面试考点。

**相关资料：** `lessons/mod-105-data-pipelines/05-data-processing-spark.md`

---

## 问题 16
**问题：** Apache Kafka 主要用于什么？

**答案：** B) 实时事件流处理

**解析：**
Kafka 是分布式、日志结构的事件流平台。生产者向主题分区追加事件，消费者从分区读取，消息在磁盘中保留可配置的时间。它是事件驱动架构、实时分析、CDC 和 ML 特征流的事实标准骨干。

**常见错误：**
- 选择 A（批处理）：这是 Spark/Hadoop 的领域；Kafka 用于流处理，不过它可以为批处理任务提供数据。
- 选择 C（模型训练）：Kafka 传输数据，训练由 PyTorch/TensorFlow 等框架完成。
- 选择 D（数据仓库）：数据仓库（Snowflake、BigQuery、Redshift）服务分析查询；Kafka 是日志，而非可查询的存储。

**相关资料：** `lessons/mod-105-data-pipelines/06-streaming-data-kafka.md`

---

## 问题 17
**问题：** Kafka 中的 topic（主题）是什么？

**答案：** B) 发布消息的类别或数据流名称

**解析：**
主题是有名称、仅追加的日志，生产者向其发布记录，消费者从中读取。主题拆分为多个分区实现并行，并跨 Broker 复制以保证持久性。主题名称是订阅和访问控制的单位。

**常见错误：**
- 选择 A（数据库表）：主题是仅追加流，而非可变表（尽管 Kafka Streams 在其之上提供了表抽象）。
- 选择 C（消费者实例）：消费者从主题*读取*数据，本身并非主题。
- 选择 D（配置文件）：主题确实有配置，但主题本身是逻辑数据流。

**相关资料：** `lessons/mod-105-data-pipelines/06-streaming-data-kafka.md`

---

## 问题 18
**问题：** 判断题：Kafka 中同一个消费者组内的消费者会接收到重复消息。

**答案：** 错误

**解析：**
在一个消费者组内，每个*分区*同一时刻只分配给一个消费者，因此每条消息会交付给组内一个消费者，这是 Kafka 在组内实现水平扩展的方式。读取同一主题的不同消费者组各自获得每条消息的副本（组间广播，组内负载均衡）。

**常见错误：**
- 混淆组内（负载均衡）与组间（广播）语义而回答正确。
- 忘记至少一次交付在重新均衡或重试时可能产生重复，但这是交付语义的边界情况，而非问题所考察的设计意图。

**相关资料：** `lessons/mod-105-data-pipelines/06-streaming-data-kafka.md`

---

## 问题 19
**问题：** Kafka 分区的目的是什么？

**答案：** B) 支持并行处理与可扩展性

**解析：**
分区是 Kafka 实现水平扩展的方式。一个主题被拆分成 N 个分区；生产者将写入分散到各分区（通常通过键哈希），同一消费者组中的消费者分担分区，各自并行读取互不重叠的子集。吞吐量与消费者并行度均受到分区数限制。

**常见错误：**
- 选择 A（加密消息）：传输加密由 TLS 处理，磁盘由静态加密处理，与分区无关。
- 选择 C（压缩数据）：压缩是生产者端的编解码设置（gzip、snappy、lz4、zstd）。
- 选择 D（验证格式）：Schema 验证是 Schema Registry 的职责，而非分区的职责。

**相关资料：** `lessons/mod-105-data-pipelines/06-streaming-data-kafka.md`

---

## 问题 20
**问题：** 以下哪项不属于数据质量维度？

**答案：** C) Velocity（速度）

**解析：**
标准数据质量维度包括完整性、准确性、一致性、及时性、有效性与唯一性。速度是“大数据 3V”（Volume、Velocity、Variety）之一，描述的是数据*特征*，而非数据*质量*。混淆这两个框架是题目的陷阱。

**常见错误：**
- 选择 A（完整性）：核心质量维度（必填字段是否已填充？）。
- 选择 B（准确性）：核心质量维度（数值是否符合现实？）。
- 选择 D（一致性）：核心质量维度（同一事实在不同系统中是否一致？）。

**相关资料：** `lessons/mod-105-data-pipelines/07-data-quality-validation.md`

---

## 问题 21
**问题：** 在 ML 场景中，什么是数据漂移？

**答案：** B) 数据的统计性质随时间变化

**解析：**
数据漂移（协变量或特征漂移）表示生产环境中的输入分布 P(X) 已偏离训练分布。概念漂移是相关情况，即 P(Y|X) 发生变化。即使流水线无错误地运行，二者仍会悄然降低模型性能，因此生产 ML 系统监控分布，而不仅仅是正常运行时间。

**常见错误：**
- 选择 A（传输中的损坏）：这是数据质量问题（位错误、字段丢失），而非漂移。
- 选择 C（意外删除）：这是数据丢失或治理问题。
- 选择 D（存储在错误位置）：这是数据工程 Bug，而非漂移。

**相关资料：** `lessons/mod-105-data-pipelines/07-data-quality-validation.md`

---

## 问题 22
**问题：** 列出 ML 训练流水线应实现的三项常见数据质量检查。

**答案：** 以下任意三项：
1. **空值或缺失值检查**：必需列超过空值比例阈值时，失败或发出告警。
2. **范围或值域验证**：数值位于指定范围（如 `0 <= age <= 120`），分类值在允许的集合中。
3. **Schema 验证**：预期列存在且类型符合预期，新增或缺失列会触发硬失败。
4. **唯一性或主键检查**：ID 列唯一，没有重复行。
5. **分布或漂移检查**：群体稳定性指数、KS 检验，或与参考数据集进行均值/标准差比较。
6. **引用完整性**：外键值存在于被引用的表中。
7. **行数或新鲜度检查**：今天的批次大小在预期区间内且未过期。

**解析：**
健壮的 ML 流水线分层实施结构检查（Schema、类型）、语义检查（范围、唯一性）与统计检查（分布、漂移）。Great Expectations、Deequ、Soda 和 Pandera 等工具将这些要求编码为可测试的期望条件，在坏数据进入训练前让流水线失败。

**常见错误：**
- 只列出空值检查：可以发现缺失数据，却遗漏超范围数值、Schema 漂移与分布偏移。
- 将模型质量监控（准确率、AUC）与数据质量检查混淆；题目问的是数据，而不是模型。
- 忘记新鲜度：流水线常常在过期数据上运行，直到预测退化才被发现。

**相关资料：** `lessons/mod-105-data-pipelines/07-data-quality-validation.md`

---

## 问题 23
**问题：** 可观测性的三大支柱是什么？

**答案：** B) 指标、日志、链路追踪

**解析：**
经典可观测性支柱是**指标**（数值时间序列，如 P95 延迟、请求速率）、**日志**（带时间戳的结构化事件记录）与**链路追踪**（请求跨服务的因果路径）。仪表盘与告警是这些支柱的*消费者*，而非支柱本身。

**常见错误：**
- 选择 A（指标、日志、仪表盘）：仪表盘将指标可视化；它是输出，而非数据类型。
- 选择 C（告警、日志、报告）：告警和报告也是由支柱衍生的输出。
- 选择 D（指标、告警、链路追踪）：告警由指标和日志派生；缺失的支柱是日志。

**相关资料：** `lessons/mod-105-data-pipelines/08-pipeline-monitoring-errors.md`

---

## 问题 24
**问题：** 什么是死信队列（DLQ）？

**答案：** B) 用于存储处理失败消息的位置

**解析：**
DLQ 是一个旁路队列（或 Kafka 主题、SQS 队列等），流水线将重试后仍无法成功处理的消息路由到此处，例如格式错误的载荷、Schema 违规或持续的下游错误。这隔离了“毒丸”消息，避免它们阻塞主流水线，并为运维人员提供检查、修复和重放的位置。

**常见错误：**
- 选择 A（高优先级消息）：优先队列处理顺序，而非故障。
- 选择 C（自动删除旧消息）：这是普通队列上的保留或 TTL 策略。
- 选择 D（归档已处理消息）：成功消息通常保留在源主题或迁移到数据湖，而非 DLQ。

**相关资料：** `lessons/mod-105-data-pipelines/08-pipeline-monitoring-errors.md`

---

## 问题 25
**问题：** 判断题：熔断器模式通过停止向故障服务发送请求，有助于防止级联故障。

**答案：** 正确

**解析：**
熔断器跟踪对下游依赖调用的失败率。失败超过阈值后，熔断器“打开”，在冷却期间短路后续调用（快速失败或返回降级结果），随后转为“半开”以探测恢复情况。它防止调用方资源耗尽（线程、连接、队列），同时保护故障服务不被重试压垮，这正是局部故障通常演变为级联故障的两种机制。

**常见错误：**
- 因为熔断器“阻塞合法流量”而回答错误：这种短期代价正是权衡所在，否则可能导致整个系统崩溃。
- 将熔断器（跨服务保护）与限流（跨客户端节流）或舱壁模式（资源隔离）混淆。这些是互补的韧性模式，并非同一事物。

**相关资料：** `lessons/mod-105-data-pipelines/08-pipeline-monitoring-errors.md`

---
