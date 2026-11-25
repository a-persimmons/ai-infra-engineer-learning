# 练习 06：托管机器学习服务比较

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 01–02

## 目标

使用各云平台的托管机器学习服务（SageMaker Endpoint、Vertex AI Endpoint、Azure ML Online Endpoint）部署相同模型（之前练习中的 iris-api），并生成结构化取舍矩阵。完成后，你将能够依据实践证据回答经常出现的「使用托管服务还是自建？」问题。

## 为什么重要

托管服务通过牺牲部分灵活性换取更少的运维工作。原文认为，这种取舍通常适合早期产品，有时适合成熟产品，在极大规模或受监管工作负载中往往需要更慎重。真正部署过每种服务的工程师，比只阅读营销页面的人更能为团队提供建议。

## 要求

将 iris-api 部署至三个服务，并产出：

### 1. 可用部署
- AWS **SageMaker Endpoint**，通过 PyTorch 容器打包模型。
- GCP **Vertex AI Endpoint**，使用自定义容器。
- Azure **ML Online Endpoint**，使用托管在线部署。

### 2. 比较矩阵
在 `COMPARISON.md` 中对每个服务进行评估：
- 冷启动延迟（部署后的首次请求）。
- 预热请求 p50/p95 延迟。
- 持续 100 RPS 时每百万次预测成本。
- 空闲成本（实例与无服务器模式比较）。
- 从干净账号到首次成功部署所需时间。
- 日志访问便利性（1 = 易于 grep，5 = 企业级繁琐流程）。
- 指标可用性（原生提供哪些分位数及细分维度）。
- 最大载荷大小。
- A/B 测试原语（内置或自行实现）。
- 多模型服务（每个 Endpoint 提供多个模型服务）。
- 自带 Docker 镜像支持（1 = 高度受限，5 = 完全自定义）。

### 3. 短文（约 500 词）
在 `RECOMMENDATION.md` 中针对假设场景「每天十万请求、十名工程师的金融科技初创公司」，说明你选择哪个方案及理由。保持具体。「视情况而定」不是完整答案，需说明具体条件。

## 分步操作

### 步骤 1——规划（15 分钟）
准备账号。估算成本：每个 Endpoint 在测试中运行约两小时。原文预算合计 10–30 美元。设置账单告警。

### 步骤 2——SageMaker（45 分钟）
- 打包模型：`tar -czf model.tar.gz model.joblib inference.py`。
- 推送至 S3。
- 创建 SageMaker Model、EndpointConfig 与 Endpoint。
- 可使用 Terraform（aws_sagemaker_endpoint）或 boto3 脚本。
- 测试：`boto3.client('sagemaker-runtime').invoke_endpoint(...)`。

### 步骤 3——Vertex AI（45 分钟）
- 打包为自定义容器（暴露 /health、/predict 的 FastAPI 服务）。
- 推送至 Artifact Registry。
- 上传 Model、创建 Endpoint，并将 Model 部署至 Endpoint。
- 测试：`from google.cloud import aiplatform; endpoint.predict(...)`。

### 步骤 4——Azure ML Online（45 分钟）
- 创建 MLflow 格式模型产物（或自定义容器）。
- `az ml model create`、`az ml online-endpoint create`、`az ml online-deployment create`。
- 测试：`az ml online-endpoint invoke --request-file ...`。

### 步骤 5——统一测试框架（30 分钟）
编写 `bench.py`，针对各 Endpoint 发送相同载荷，产出矩阵所需的延迟及成本数据。

### 步骤 6——填写矩阵（30 分钟）
运行每项测试。记录首次调用延迟（部署后立即调用）、预热延迟（十次预热调用后），通过各云平台价格计算器填写成本列。

### 步骤 7——编写建议（30 分钟）
做出明确选择并说明理由。

### 步骤 8——清理所有资源（15 分钟）
Endpoint 在空闲时仍可能产生费用。测试后始终销毁不再需要的资源。

## 交付物

1. 三个已部署 Endpoint（测量后清理）。
2. 可重新运行的 `bench.py` 测试框架。
3. 已填充的 `COMPARISON.md` 矩阵。
4. `RECOMMENDATION.md` 短文，包含具体选择与理由。
5. 可选：五分钟 Loom 或录制演示，讲解矩阵。

## 验证

- [ ] 三个 Endpoint 针对相同输入均返回有效预测。
- [ ] 矩阵各单元格均具有实测或有依据的结果，而非 TBD。
- [ ] 验证清理完成，没有遗留运行中的 Endpoint。
- [ ] 建议至少引用矩阵中的三个具体数字。

## 拓展目标

- 添加 **AWS Bedrock**、**Vertex AI Generative AI**、**Azure OpenAI**，比较托管 LLM Endpoint。
- 添加开源对比行：在同一集群自行部署 BentoML 或 KServe。
- 计算**盈亏平衡点**：请求速率达到多少时，自建成本比托管低 30%？

## 常见陷阱

- **混淆冷启动与预热**——原文将 Cold 定义为 Endpoint 从未接收流量；Warm 指 Endpoint 已供应且容器已加载。两者都要测量。
- **价格计算器低估成本**——可能未包含日志存储、流量出站与辅助实例等费用。以实际账单核对。
- **SageMaker 清理不对称**——删除 Endpoint 停止对应实例计费，但 Model 与 EndpointConfig 仍保留（通常不单独收费，却造成资源堆积）。也应清理它们。
- **不同云平台指标不同**——各云默认暴露不同分位数。通过自己的直方图统一测量口径。

## 参考答案

engineer-solutions 仓库中的参考部署与基准测试。

> 译注：首次请求延迟不一定等于从零实例冷启动的延迟，应分开测量供应时间、模型加载时间与请求延迟。托管服务在大规模及受监管场景中的适用性应根据实际成本、控制能力与合规要求判断。费用为原文预算示例。
