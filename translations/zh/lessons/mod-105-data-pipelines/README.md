# 模块 05：数据管道与编排

## 概览

本模块介绍构建、编排和管理机器学习工作流的数据管道所需的核心技能。你将学习使用 Apache Airflow 等行业标准工具自动化数据采集、转换与准备，使用 DVC 实现数据版本管理，通过 Apache Spark 处理大规模数据集，并确保整个机器学习管道中的数据质量。

## 学习目标

完成本模块后，你将能够：

- 设计并实现可扩展的机器学习数据管道架构。
- 使用 Apache Airflow 构建并编排复杂工作流。
- 使用 DVC 对数据集进行版本管理并追踪数据血缘。
- 使用 Apache Spark 处理大规模数据。
- 利用 Apache Kafka 基础能力处理流式数据。
- 实现数据验证与质量检查。
- 监控数据管道并妥善处理错误。
- 构建端到端机器学习训练流水线。

## 前置条件

- 完成模块 01–04（从基础到 Kubernetes）。
- Python 编程技能。
- 理解 SQL 与数据库。
- 基本理解分布式系统。
- 熟悉 Docker 与 Kubernetes。

## 模块结构

### 讲义

1. **面向机器学习的数据管道架构**（90 分钟）
   - 机器学习数据管道模式与最佳实践
   - 数据源、转换与目标
   - 批处理管道与流式管道
   - 管道设计原则

2. **Apache Airflow 基础**（120 分钟）
   - 工作流编排导论
   - Airflow 架构与组件
   - 在 Kubernetes 上安装 Airflow
   - 编写第一个 DAG

3. **面向机器学习的 Airflow 进阶**（120 分钟）
   - 机器学习工作流的复杂 DAG 模式
   - TaskFlow API 与 XCom
   - 动态 DAG 与参数化
   - 面向机器学习的 Airflow Operator（Python、Spark、Kubernetes）

4. **使用 DVC 进行数据版本管理**（90 分钟）
   - 为什么要像管理代码一样管理数据版本
   - DVC 安装与配置
   - 追踪数据集、模型及实验
   - 远程存储后端（S3、GCS、Azure）
   - 使用 DVC 构建数据管道

5. **使用 Apache Spark 处理数据**（120 分钟）
   - Spark 架构与 RDD/DataFrame API
   - 使用 PySpark 进行数据转换
   - 在 Kubernetes 上运行 Spark
   - 优化机器学习数据的 Spark 作业

6. **使用 Kafka 处理流式数据**（90 分钟）
   - 流处理基础
   - Kafka 架构（生产者、消费者、主题）
   - 实时特征工程
   - 将 Kafka 与机器学习管道集成

7. **数据质量与验证**（90 分钟）
   - 数据质量框架（Great Expectations、Pandera）
   - Schema 验证与漂移检测
   - 自动化数据测试
   - 监控数据质量指标

8. **管道监控与错误处理**（90 分钟）
   - Airflow 监控与告警
   - 日志最佳实践
   - 错误处理与重试
   - 数据管道的 SLA 监控
   - 生产环境故障排查

## 动手项目

### 项目 1：构建 Airflow 数据管道

创建面向生产环境的 Airflow DAG：

- 从多个数据源（API、数据库、S3）获取数据。
- 执行数据转换与验证。
- 存储处理后的数据供机器学习训练使用。
- 处理错误并发送告警。

### 项目 2：实现数据版本管理

为机器学习项目配置 DVC：

- 对大型数据集（10GB+）进行版本管理。
- 追踪数据血缘与转换过程。
- 创建可复现的数据管道。
- 与 Git 工作流集成。

### 项目 3：Spark 数据处理管道

构建 PySpark 管道：

- 处理大规模数据集（100GB+）。
- 执行特征工程。
- 在 Kubernetes 上运行并动态扩缩容。
- 优化性能与成本。

### 项目 4：端到端机器学习训练流水线

结合所有工具创建完整流水线：

- Airflow 编排
- DVC 数据版本管理
- Spark 数据处理
- 数据质量验证
- 触发模型训练

## 评估

- **测验**：数据管道概念、Airflow、DVC、Spark（25 题）。
- **实践考试**：构建包含监控的生产级数据管道。
- **代码审查**：提交 DAG 和数据管道供审查。

## 预计时间

- **讲义**：12 小时
- **动手项目**：20 小时
- **阅读与练习**：13 小时
- **总计**：约 45 小时

## 工具与技术

- **编排**：Apache Airflow 2.7+
- **数据版本管理**：DVC 3.0+
- **数据处理**：Apache Spark 3.4+、PySpark
- **流式处理**：Apache Kafka 3.5+
- **数据质量**：Great Expectations、Pandera
- **存储**：S3、GCS、Azure Blob Storage
- **基础设施**：Docker、Kubernetes、Helm

## 真实场景应用

本模块为以下岗位做准备：

- 面向机器学习公司的**数据工程师**。
- 承担管道职责的**机器学习基础设施工程师**。
- 构建端到端工作流的 **MLOps 工程师**。
- 相关公司：Uber、Airbnb、Netflix、Spotify（原文称这些公司广泛使用 Airflow 与 Spark）。

## 其他参考资料

### 文档
- [Apache Airflow 文档](https://airflow.apache.org/docs/)
- [DVC 文档](https://dvc.org/doc)
- [Apache Spark 文档](https://spark.apache.org/docs/latest/)
- [Apache Kafka 文档](https://kafka.apache.org/documentation/)

### 书籍
- James Densmore 的《Data Pipelines Pocket Reference》
- Martin Kleppmann 的《Designing Data-Intensive Applications》
- Jules Damji 等人的《Learning Spark》

### 课程
- Airflow Fundamentals（Astronomer）
- Data Engineering with Databricks
- Kafka Streams for Data Processing

## 支持

- 复习讲义与动手练习。
- 使用提供的代码示例进行实践。
- 加入 Airflow Community Slack。
- 在 Stack Overflow 上查找常见问题。

---

**准备构建面向机器学习的生产数据管道？** 从第 01 课开始！
