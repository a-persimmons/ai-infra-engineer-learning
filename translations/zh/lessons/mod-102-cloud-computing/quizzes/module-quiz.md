# 模块 02 测验：面向 ML 的云计算

**题目总数：** 20  
**及格分数：** 70%（14/20 题）  
**时间限制：** 45 分钟  
**类型：** 混合（选择、判断、简答）

---

## 第一部分：云计算基础（第 1–5 题）

### 第 1 题
**哪种云服务模型提供对底层基础设施最多的控制？**

A) 软件即服务（SaaS）  
B) 平台即服务（PaaS）  
C) 基础设施即服务（IaaS）  
D) 函数即服务（FaaS）

<details>
<summary>答案</summary>

C) 基础设施即服务（IaaS）——对虚拟机、存储及网络提供最大控制能力。

</details>

---

### 第 2 题
**判断题：对于 ML 训练工作负载，预留实例总比 Spot 实例便宜。**

<details>
<summary>答案</summary>

错误——原文指出 Spot 实例可能比预留实例便宜 70–90%，但可能中断。预留实例相对按需价格提供折扣，原文认为能够保证容量；对于可中断工作负载，Spot 通常更便宜。

</details>

---

### 第 3 题
**使用对象存储（S3/GCS/Blob）保存 ML 数据集的主要优势是什么？**

A) 最快读写性能  
B) 最低随机访问延迟  
C) 低成本下的近乎无限扩展性与持久性  
D) 内置数据库查询能力

<details>
<summary>答案</summary>

C) 低成本下的可扩展性与持久性——对象存储针对大规模数据设计，具有 11 个 9 的持久性目标，并可经济高效地存储大型数据集。

</details>

---

### 第 4 题
**对于可以容忍中断的大语言模型训练，选择哪种 GPU 实例最具成本效益？**

A) 按需 P4 实例（AWS）  
B) 预留 P4 实例（AWS）  
C) Spot P4 实例（AWS）  
D) 仅 CPU 的 T2 实例（AWS）

<details>
<summary>答案</summary>

C) Spot P4 实例（AWS）——原文示例为节省 70–90% 费用，适合有检查点的可中断训练。

</details>

---

### 第 5 题
**VPC（Virtual Private Cloud，虚拟私有云）的主要作用是什么？**

A) 降低云费用  
B) 隔离并保护网络资源  
C) 加快数据传输  
D) 支持多云部署

<details>
<summary>答案</summary>

B) 隔离并保护网络资源——VPC 提供网络隔离、安全组及对云资源的受控访问。

</details>

---

## 第二部分：云平台特性（第 6–10 题）

### 第 6 题
**以下托管 ML 服务分别属于哪家云服务商？正确匹配：

1. SageMaker
2. Vertex AI
3. Azure Machine Learning**

A) 1=AWS，2=GCP，3=Azure  
B) 1=GCP，2=AWS，3=Azure  
C) 1=Azure，2=GCP，3=AWS  
D) 1=AWS，2=Azure，3=GCP

<details>
<summary>答案</summary>

A) 1=AWS（SageMaker），2=GCP（Vertex AI），3=Azure（Azure Machine Learning）。

</details>

---

### 第 7 题
**相较 AWS 与 Azure，Google Cloud Platform 的独特能力是什么？**

A) Kubernetes 服务（GKE）  
B) TPU（张量处理单元）  
C) 对象存储服务  
D) 带 GPU 的虚拟机

<details>
<summary>答案</summary>

B) TPU（张量处理单元）——原文指出 Google Cloud 是提供 TPU 的主要云服务商，TPU 是用于 ML 训练与推理的专用硬件。

</details>

---

### 第 8 题
**在 AWS 中，使用哪项服务规模化编排容器化 ML 工作负载？**

A) EC2（Elastic Compute Cloud）  
B) Lambda（Serverless 函数）  
C) EKS（Elastic Kubernetes Service）  
D) S3（Simple Storage Service）

<details>
<summary>答案</summary>

C) EKS——AWS 的托管 Kubernetes 服务，用于规模化编排容器化应用。

</details>

---

### 第 9 题
**哪项 Azure 服务直接集成 OpenAI 模型，用于 LLM 部署？**

A) Azure Kubernetes Service  
B) Azure OpenAI Service  
C) Azure Machine Learning  
D) Azure Functions

<details>
<summary>答案</summary>

B) Azure OpenAI Service——提供带企业功能的 OpenAI 模型托管访问（原文举例 GPT-4、GPT-3.5、DALL-E）。

</details>

---

### 第 10 题
**GCP 中等效于 AWS S3 的服务是什么？**

A) Cloud Storage（GCS）  
B) Persistent Disk  
C) Filestore  
D) Cloud SQL

<details>
<summary>答案</summary>

A) Cloud Storage（GCS）——GCP 的对象存储服务，与 AWS S3 对应。

</details>

---

## 第三部分：存储与网络（第 11–15 题）

### 第 11 题
**哪种存储类型为高吞吐量 ML 训练数据访问提供最佳性能？**

A) 对象存储（S3/GCS）  
B) 块存储（EBS/Persistent Disk）  
C) NFS 文件存储  
D) 数据库存储（RDS/Cloud SQL）

<details>
<summary>答案</summary>

B) 块存储（EBS/Persistent Disk）——原文认为它提供最高 IOPS 与吞吐量，适合快速随机访问；临时 SSD 或本地 NVMe 可提供更高性能。

</details>

---

### 第 12 题
**安全组在云网络中的作用是什么？**

A) 加密静态数据  
B) 作为虚拟防火墙控制入站/出站流量  
C) 在实例间进行负载均衡  
D) 监控安全威胁

<details>
<summary>答案</summary>

B) 作为虚拟防火墙控制入站/出站流量——安全组定义允许进出资源的网络流量规则。

</details>

---

### 第 13 题
**判断题：同一可用区内的数据传输通常免费。**

<details>
<summary>答案</summary>

正确——原文称多数云服务商不收取同一可用区的数据传输费用，但会收取跨可用区及跨区域传输费用。

</details>

---

### 第 14 题
**训练期间，推荐如何存储模型产物及检查点？**

A) 仅使用本地实例存储  
B) 对象存储（S3/GCS）与定期检查点  
C) 数据库（RDS/Cloud SQL）  
D) 仅内存

<details>
<summary>答案</summary>

B) 对象存储与定期检查点——对象存储具有持久性及成本效益，在实例中断时有助于防止数据丢失。

</details>

---

### 第 15 题
**使用哪项网络组件将传入的 ML 推理请求分配到多个实例？**

A) Security Group  
B) VPC  
C) Load Balancer  
D) NAT Gateway

<details>
<summary>答案</summary>

C) Load Balancer——负载均衡器（ALB、NLB 或其他云平台等效组件）在多个后端实例之间分配流量，实现高可用性及可扩展性。

</details>

---

## 第四部分：成本优化与最佳实践（第 16–20 题）

### 第 16 题
**哪种策略最能降低 ML 训练工作负载的费用？**

A) 仅使用按需实例以提高可靠性  
B) 使用 Spot 实例、检查点及自动重启  
C) 全部工作负载使用预留实例  
D) 使用可获得的最强 GPU 训练

<details>
<summary>答案</summary>

B) 使用 Spot 实例、检查点及自动重启——原文举例相较按需实例节省 70–90%，适当配置检查点后，中断可以得到处理。

</details>

---

### 第 17 题
**主要云服务商的入站（Ingress）与出站（Egress）数据费用通常有何区别？**

A) 入站昂贵，出站免费  
B) 入站及出站均昂贵  
C) 入站免费，出站昂贵  
D) 入站及出站均免费

<details>
<summary>答案</summary>

C) 入站免费，出站昂贵——云服务商通常不收取上传费用，但收取下载费用，尤其是跨区域或传输至互联网。

</details>

---

### 第 18 题
**简答题：列举三种优化 ML 工作负载云成本的策略。**

<details>
<summary>参考答案</summary>

1. **使用 Spot 实例：** 配合检查点，用于可中断训练（原文示例节省 70–90%）。
2. **合理调整实例规格：** 监控利用率并选择适当实例类型，避免过度供应。
3. **自动扩缩容：** 低需求时缩容，推理高峰时扩容。
4. **存储生命周期策略：** 将不常访问的数据移至更便宜的存储层（Glacier、Coldline）。
5. **预留实例：** 用于可预测、长时间运行的工作负载（原文示例相较按需节省 40–60%）。
6. **优化数据传输：** 将数据与计算放在一起，尽量减少跨区域及出站费用。

（任意三种有效策略均可。）

</details>

---

### 第 19 题
**实施多云战略的主要原因是什么？**

A) 通过多个服务商使成本最大化  
B) 避免厂商锁定并提高韧性  
C) 使架构更复杂  
D) 利用多个服务商的免费层

<details>
<summary>答案</summary>

B) 避免厂商锁定并提高韧性——多云战略提供灵活性，减少对单一服务商的依赖，有助于改善灾难恢复及合规能力。

</details>

---

### 第 20 题
**判断题：为方便起见，直接在应用代码中硬编码云凭据是最佳实践。**

<details>
<summary>答案</summary>

错误——绝不应硬编码凭据。使用 IAM 角色、服务账号、密钥管理服务（AWS Secrets Manager、GCP Secret Manager、Azure Key Vault）或环境变量。

</details>

---

## 评分指南

### 评分标准

- **答对 18–20 题（90–100%）：** 优秀，掌握 ML 云计算概念。
- **答对 16–17 题（80–89%）：** 很好，理解扎实，有少量不足。
- **答对 14–15 题（70–79%）：** 及格，知识足够，复习困难领域。
- **答对不足 14 题（低于 70%）：** 未通过，复习并重测。

### 下一步

**通过（达到 70%）：**
1. 复习错题。
2. 完成模块 02 实践练习。
3. 可选择完成综合项目。
4. 进入模块 03：Docker 容器化。

**未通过（低于 70%）：**
1. 复习错题对应的讲义。
2. 重新完成动手练习。
3. 补充学习后重测。
4. 如需帮助，在 GitHub Discussions 提问。

---

## 答案汇总

1. C
2. 错误
3. C
4. C
5. B
6. A
7. B
8. C
9. B
10. A
11. B
12. B
13. 正确
14. B
15. C
16. B
17. C
18. 简答（见上文）
19. B
20. 错误

---

## 自我评估问题

完成测验后，思考：

1. 我最熟悉哪个云平台？
2. 我是否理解不同存储及计算选项的成本影响？
3. 我能否设计安全的 ML 工作负载网络架构？
4. 我能否自信地比较并选择云服务？
5. 进入模块 03 前需要复习哪些主题？

---

**复习时间：** 15–30 分钟，用于查看答案并理解错误。

**准备进入模块 03 了吗？** 如果得分达到 70% 且完成练习，就可以继续！

> 译注：答案按原文保留。区域型 Reserved Instances 不一定预留容量；Spot 折扣通常以按需价格为参照，实际价格随区域及实例变化。同一可用区传输也可能产生 NAT Gateway、负载均衡等费用。存储性能取决于访问模式与具体配置。原文价格及服务列表未独立核验。
