# 模块 02 测验：面向 ML 的云计算

**总题数：** 20
**及格分数：** 70%（20 题中答对 14 题）
**时限：** 45 分钟
**题型：** 混合（选择、判断、简答）

---

## 第一部分：云计算基础（第 1–5 题）

### 第 1 题

**哪种云服务模式提供对底层基础设施最多的控制权？**

A) 软件即服务（SaaS）  
B) 平台即服务（PaaS）  
C) 基础设施即服务（IaaS）  
D) 函数即服务（FaaS）

<details>
<summary>答案</summary>

C）IaaS——提供对 VM、存储及网络的最大控制权。

</details>

---

### 第 2 题

**判断：对于 ML 训练工作负载，预留实例始终比 Spot 实例便宜。**

<details>
<summary>答案</summary>

错误——原文称 Spot 实例可能比预留实例便宜 70–90%，但可能被中断。预留实例相比按需实例提供折扣，原文称可保证容量；对于可中断工作负载，Spot 通常更便宜。

</details>

---

### 第 3 题

**对 ML 数据集使用对象存储（S3/GCS/Blob）的主要好处是什么？**

A) 最快的读写性能  
B) 最低的随机访问延迟  
C) 低成本、大规模扩展能力及持久性  
D) 内置数据库查询能力

<details>
<summary>答案</summary>

C）对象存储为大规模数据设计，原文举例为 11 个 9 的持久性，并可经济地保存大型数据集。

</details>

---

### 第 4 题

**对能够容忍中断的大语言模型训练，选择哪种 GPU 实例更经济？**

A) 按需 P4 实例（AWS）  
B) 预留 P4 实例（AWS）  
C) Spot P4 实例（AWS）  
D) 纯 CPU T2 实例（AWS）

<details>
<summary>答案</summary>

C）Spot P4——原文估计节省 70–90% 成本，适合具备检查点的可中断训练。

</details>

---

### 第 5 题

**VPC（Virtual Private Cloud）的主要用途是什么？**

A) 降低云成本  
B) 隔离并保护网络资源  
C) 加速数据传输  
D) 支持多云部署

<details>
<summary>答案</summary>

B）VPC 提供网络隔离、安全组及对云资源的受控访问。

</details>

---

## 第二部分：云平台专项知识（第 6–10 题）

### 第 6 题

**将托管 ML 服务与云服务商正确匹配：

1. SageMaker
2. Vertex AI
3. Azure Machine Learning**

A) 1=AWS，2=GCP，3=Azure  
B) 1=GCP，2=AWS，3=Azure  
C) 1=Azure，2=GCP，3=AWS  
D) 1=AWS，2=Azure，3=GCP

<details>
<summary>答案</summary>

A）1=AWS（SageMaker），2=GCP（Vertex AI），3=Azure（Azure Machine Learning）。

</details>

---

### 第 7 题

**相比 AWS 与 Azure，GCP 的独特之处是什么？**

A) Kubernetes 服务（GKE）  
B) TPU（张量处理单元）  
C) 对象存储服务  
D) 具备 GPU 的虚拟机

<details>
<summary>答案</summary>

B）TPU——Google Cloud 提供这种专门用于 ML 训练与推理的硬件。

</details>

---

### 第 8 题

**在 AWS 中，使用什么服务规模化编排容器化 ML 工作负载？**

A) EC2（Elastic Compute Cloud）  
B) Lambda（Serverless 函数）  
C) EKS（Elastic Kubernetes Service）  
D) S3（Simple Storage Service）

<details>
<summary>答案</summary>

C）EKS——AWS 的托管 Kubernetes 服务，用于规模化编排容器应用。

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

B）Azure OpenAI Service——提供具备企业功能的 OpenAI 模型托管访问（原文示例 GPT-4、GPT-3.5、DALL-E）。

</details>

---

### 第 10 题

**与 AWS S3 对应的 GCP 服务是什么？**

A) Cloud Storage（GCS）  
B) Persistent Disk  
C) Filestore  
D) Cloud SQL

<details>
<summary>答案</summary>

A）Cloud Storage——GCP 的对象存储服务，与 AWS S3 对应。

</details>

---

## 第三部分：存储与网络（第 11–15 题）

### 第 11 题

**对于高吞吐量 ML 训练数据访问，哪种存储类型提供最佳性能？**

A) 对象存储（S3/GCS）  
B) 块存储（EBS/Persistent Disk）  
C) 使用 NFS 的文件存储  
D) 数据库存储（RDS/Cloud SQL）

<details>
<summary>答案</summary>

B）块存储——原文认为其提供最高 IOPS 和吞吐量，适合快速随机访问的训练工作负载。若需要更高性能，可考虑临时 SSD 或本地 NVMe。

</details>

---

### 第 12 题

**云网络中安全组的用途是什么？**

A) 加密静态数据  
B) 充当控制入站/出站流量的虚拟防火墙  
C) 在实例间负载均衡  
D) 监控安全威胁

<details>
<summary>答案</summary>

B）安全组定义允许进出资源的网络流量规则。

</details>

---

### 第 13 题

**判断：同一可用区内部的数据传输通常免费。**

<details>
<summary>答案</summary>

正确——原文称多数云服务商对同一可用区内传输不收费，但跨可用区及跨区域传输收费。

</details>

---

### 第 14 题

**训练期间，推荐如何保存模型产物与检查点？**

A) 仅本地实例存储  
B) 对象存储（S3/GCS）加定期检查点  
C) 数据库（RDS/Cloud SQL）  
D) 仅保存在内存中

<details>
<summary>答案</summary>

B）对象存储具有持久性、成本效益，可在实例中断时降低数据丢失风险。

</details>

---

### 第 15 题

**使用哪个网络组件将 ML 推理请求分发至多个实例？**

A) 安全组  
B) VPC  
C) 负载均衡器  
D) NAT Gateway

<details>
<summary>答案</summary>

C）负载均衡器（ALB、NLB 或等效服务）将流量分发至多个后端实例，实现高可用性及扩展。

</details>

---

## 第四部分：成本优化与最佳实践（第 16–20 题）

### 第 16 题

**哪种策略最能降低 ML 训练工作负载成本？**

A) 为可靠性仅使用按需实例  
B) 使用 Spot 实例，结合检查点及自动重启  
C) 全部工作负载采用预留实例  
D) 使用可用的最强 GPU 训练

<details>
<summary>答案</summary>

B）Spot 实例相比按需实例可能节省 70–90%（原文示例），正确使用检查点可应对中断。

</details>

---

### 第 17 题

**主要云服务商的入站（Ingress）与出站（Egress）数据费用通常有什么区别？**

A) 入站昂贵、出站免费  
B) 两者都昂贵  
C) 入站免费、出站昂贵  
D) 两者都免费

<details>
<summary>答案</summary>

C）云服务商通常不对上传收费，但对下载收费，尤其是跨区域或传输至互联网。

</details>

---

### 第 18 题

**简答：列举三种优化 ML 工作负载云成本的策略。**

<details>
<summary>参考答案</summary>

1. **使用 Spot 实例：** 对具备检查点的可中断训练（原文示例节省 70–90%）。
2. **合理调整规格：** 监控利用率，选择适当实例，避免过度供应。
3. **自动扩缩容：** 低需求期间缩容，推理高峰期间扩容。
4. **存储生命周期策略：** 将低频访问数据转移至较便宜的存储层（Glacier、Coldline）。
5. **预留实例：** 用于可预测、长期运行的工作负载（原文示例较按需节省 40–60%）。
6. **优化数据传输：** 将数据和计算资源放在一起，减少跨区域与出站费用。

（任意三种有效策略均可。）

</details>

---

### 第 19 题

**实施多云策略的主要原因是什么？**

A) 使用多家服务商使成本最大化  
B) 避免厂商锁定并提高韧性  
C) 使架构更加复杂  
D) 使用多家服务商的免费层

<details>
<summary>答案</summary>

B）多云策略提供灵活性、减少对单一厂商的依赖，并可能改善灾难恢复及合规能力。

</details>

---

### 第 20 题

**判断：为方便起见，直接在应用代码中硬编码云凭据是最佳实践。**

<details>
<summary>答案</summary>

错误——绝不应硬编码凭据。应使用 IAM 角色、服务账号、密钥管理服务（AWS Secrets Manager、GCP Secret Manager、Azure Key Vault），或环境变量。

</details>

---

## 评分指南

### 评分细则

- **答对 18–20 题（90–100%）：** 优秀——已掌握面向 ML 的云计算概念。
- **答对 16–17 题（80–89%）：** 良好——理解扎实，存在少量不足。
- **答对 14–15 题（70–79%）：** 及格——知识足够，复习困难领域。
- **答对少于 14 题（低于 70%）：** 未及格——复习模块并重新测验。

### 下一步

**通过（达到 70%）：**
1. 复习答错的题目。
2. 完成模块 02 实践练习。
3. 可选：完成综合项目。
4. 进入模块 03：Docker 容器化。

**未通过（低于 70%）：**
1. 回顾错题对应的讲义。
2. 重新完成动手练习。
3. 继续学习后重新测验。
4. 需要澄清时在 GitHub Discussions 提问。

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
18. 简答（见详情）
19. B
20. 错误

---

## 自我评估问题

完成测验后思考：

1. 我最熟悉哪个云平台？
2. 我是否理解不同存储及计算选项的成本影响？
3. 我能否为 ML 工作负载设计安全的网络架构？
4. 我是否有信心比较和选择云服务？
5. 进入模块 03 前，我应该复习哪些主题？

---

**复习时长：** 15–30 分钟，用于回顾答案、理解错误。

**准备好进入模块 03 了吗？** 得分达到 70% 且完成练习即可继续！

> 译注：原文保留的折扣比例及服务能力为教学示例，不代表当前报价。预留实例折扣与容量预留并非总是同一概念；同可用区及入站流量也可能因路径和服务产生费用。对象存储的持久性与可用性不同。块存储是否更快取决于访问模式和具体实现。
