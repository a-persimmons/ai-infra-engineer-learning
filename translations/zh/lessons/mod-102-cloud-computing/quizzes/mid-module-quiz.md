# 模块 02：云计算——模块中期测验

**时限：** 25 分钟
**及格分数：** 80%（20 题中答对 16 题）
**范围：** 第 01–04 课（云架构、AWS、GCP、Azure）

---

## 第一部分：面向 ML 的云架构（5 题）

### Q1. 云原生 ML 架构的主要优势是什么？

a) 总成本低于本地部署
b) 按需提供弹性与可扩展性
c) 保证训练速度更快
d) 无需监控

**答案：** B

---

### Q2. 在云端存储训练数据集，哪种存储类型最合适？

a) 块存储（EBS）
b) 对象存储（S3、GCS）
c) 关系型数据库
d) 仅使用本地 SSD

**答案：** B

---

### Q3. 云端 ML 基础设施中的 VPC 有何用途？

a) 降低成本
b) 提供隔离的网络环境
c) 加速训练
d) 存储模型

**答案：** B

---

### Q4. 对于批量训练作业，哪种计算资源选项最具成本效益？

a) 按需实例
b) 预留实例
c) Spot/Preemptible 实例
d) 专用宿主机

**答案：** C

---

### Q5. 使用 Serverless 进行 ML 推理的取舍是什么？

a) 较高延迟与较低运维开销之间的取舍
b) 较低成本与较高复杂度之间的取舍
c) 更好安全性与较差性能之间的取舍
d) 不存在取舍

**答案：** A

---

## 第二部分：面向 ML 基础设施的 AWS（5 题）

### Q6. 哪项 AWS 服务提供托管 Kubernetes？

a) ECS
b) EKS
c) Fargate
d) Lambda

**答案：** B

---

### Q7. AWS SageMaker 的主要用途是什么？

a) 对象存储
b) 托管 ML 训练及部署
c) 容器编排
d) 网络

**答案：** B

---

### Q8. 哪项 AWS 存储服务最适合大规模对象存储？

a) EBS
b) EFS
c) S3
d) Instance Store

**答案：** C

---

### Q9. AWS 中的 IAM 代表什么？

a) Internet Access Management（互联网访问管理）
b) Identity and Access Management（身份与访问管理）
c) Infrastructure Automation Manager（基础设施自动化管理器）
d) Image Asset Manager（镜像资产管理器）

**答案：** B

---

### Q10. 哪种 EC2 实例类型针对 GPU 工作负载进行了优化？

a) t3.large
b) m5.xlarge
c) p3.2xlarge
d) c5.4xlarge

**答案：** C

---

## 第三部分：面向 ML 的 Google Cloud Platform（5 题）

### Q11. Google 的托管 ML 平台叫什么？

a) AI Platform
b) Vertex AI
c) Cloud ML Engine
d) ML Studio

**答案：** B

---

### Q12. 哪项 GCP 服务提供托管 Kubernetes？

a) GCE
b) GAE
c) GKE
d) Cloud Run

**答案：** C

---

### Q13. Google Cloud 中的 TPU 是什么？

a) Tensor Processing Unit（张量处理单元），用于 ML 加速
b) Total Performance Upgrade（全面性能升级）
c) Training Pipeline Utility（训练管道工具）
d) Temporary Processing Unit（临时处理单元）

**答案：** A

---

### Q14. 哪项 GCP 存储服务与 AWS S3 对应？

a) Persistent Disk
b) Cloud Storage
c) Filestore
d) Cloud SQL

**答案：** B

---

### Q15. 对某些 ML 工作负载而言，TPU 相比 GPU 的优势是什么？

a) 总是更便宜
b) 针对 TensorFlow 运算进行优化
c) 更适合游戏
d) 没有优势

**答案：** B

---

## 第四部分：面向 ML 基础设施的 Azure（5 题）

### Q16. Azure 的托管 ML 服务叫什么？

a) Azure AI
b) Azure Machine Learning
c) Azure ML Studio
d) Azure Cognitive Services

**答案：** B

---

### Q17. 哪项 Azure 服务提供托管 Kubernetes？

a) Azure Container Instances
b) Azure Functions
c) AKS（Azure Kubernetes Service）
d) Azure App Service

**答案：** C

---

### Q18. Azure OpenAI Service 提供什么独特能力？

a) 免费 GPU 访问
b) 通过 Azure 访问 GPT 模型
c) 自动化模型训练
d) 无限存储

**答案：** B

---

### Q19. 哪项 Azure 存储服务与 AWS S3 对应？

a) Azure Files
b) Azure Disk
c) Blob Storage
d) Table Storage

**答案：** C

---

### Q20. Azure 面向企业客户的一项关键优势是什么？

a) 最低成本
b) 与 Microsoft 生态集成
c) 最快性能
d) 没有安全功能

**答案：** B

---

## 答案汇总

1. B   2. B   3. B   4. C   5. A
6. B   7. B   8. C   9. B   10. C
11. B  12. C  13. A  14. B  15. B
16. B  17. C  18. B  19. C  20. B

---

## 评分

- **答对 18–20 题（90–100%）：** 优秀！云计算基础扎实。
- **答对 16–17 题（80–89%）：** 良好！可以继续学习。
- **答对 14–15 题（70–79%）：** 一般。回顾薄弱领域。
- **答对少于 14 题（低于 70%）：** 继续学习前回顾第 01–04 课。

---

## 复习范围

如果某部分得分较低，请复习：

- **第一部分：** 第 01 课——面向 ML 的云架构。
- **第二部分：** 第 02 课——面向 ML 基础设施的 AWS。
- **第三部分：** 第 03 课——面向 ML 的 Google Cloud Platform。
- **第四部分：** 第 04 课——面向 ML 基础设施的 Azure。

---

**注意：** 本测验涵盖模块 02 的前半部分。完成第 05–08 课后继续参加最终测验！

> 译注：保留原文题目及答案。Spot 的成本优势依赖作业容错和实际价格，Serverless 延迟也取决于冷启动及配置。TPU 不限于 TensorFlow，现代生态亦支持 JAX、PyTorch/XLA 等。
