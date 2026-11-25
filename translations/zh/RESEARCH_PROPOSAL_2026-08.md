# 课程提案：AI 基础设施工程师——2026-08

由 `aicg org research --apply` 生成。限制：

- `max_modules_per_run`：1
- `max_exercises_per_run`：3
- `max_projects_per_run`：0
- `min_evidence_count`：每项至少 3 条招聘信息

## 理由

本轮不新增内容。对过去 90 天（自 2026-05-04 起）的 30 条招聘信息进行抽样，覆盖前沿实验室、超大规模云服务商、平台企业与普通企业，共识别出 24 项不同要求。

所有达到或超过 0.30 连续性偏好频率阈值的要求——Python、Docker、Kubernetes（含 CRD/Operator/GPU 调度）、AWS/GCP/Azure、Terraform、CI/CD、Prometheus/Grafana 与 OpenTelemetry（含值班与 SLO）、PyTorch DDP/FSDP/DeepSpeed 分布式训练、使用 vLLM/SGLang/TensorRT-LLM 的 LLM 服务（连续批处理、PagedAttention、限流）、使用生产级向量数据库的 RAG、MLflow/Feast、Airflow/Spark/Kafka、LLM 护栏与提示词注入防御、LLM 成本路由与语义缓存、量化、多云/混合云、密钥管理——均已由现有模块或练习覆盖。参见 JOB_REQUIREMENTS.md 的覆盖映射。

低于阈值的要求（MCP 为 0.13、Ray/KubeRay 为 0.17、SLURM/HPC 为 0.20、容器沙箱为 0.07、深入 AI FinOps 为 0.13）要么属于 30 级以上路线（高级工程师/架构师/性能工程师），要么是值得关注但暂不足以扩充课程的新兴要求。这是成熟、持续演进的课程在没有市场信号超过严格偏好阈值时的预期结果。

## 已接受

### 模块

_无。_

### 练习

_无。_

### 项目

_无。_

## 已拒绝

_无。_

---

## 审批

**本提案不会自动向课程添加任何内容。**

如果批准部分或全部已接受的项目，请合并此 PR。合并后，运行 `aicg org promote-plan --role <role>`（或等待下一次每周审计），将过滤后的增量变更应用至 `curriculum-plan.json`，并创建内容骨架。

如果全部拒绝，请关闭 PR。无需进一步操作；下一次研究运行将重新提出仍有就业市场依据的项目。
