# 练习 05：面向机器学习工作负载的云网络

**时长：** 3 小时
**难度：** 中级
**前置条件：** 实验 01（AWS VPC）；熟悉 mod-109 实验 01–04 的 IaC

## 目标

设计并供应面向机器学习的 VPC：跨三个可用区部署三层子网（公共、私有应用、私有数据），包含隔离的 GPU 节点池、经过 NAT Gateway 的受限出站流量与逐 Namespace 带宽限制，以及 S3/ECR/CloudWatch 的 VPC Endpoint，使数据在私有骨干网络中传输。使用小型测试矩阵验证连通性。

## 为什么重要

机器学习工作负载的网络需求不对称：训练读取大量数据，但出站较少；推理属于具有严格延迟 SLO 的请求/响应模式；实验追踪与指标持续产生低流量。所有流量都经 NAT 的扁平 VPC 在规模较小时可能可用，但 GPU 实例逐渐耗尽 NAT 容量或产生大量 S3 传输费用时便会暴露问题（原文举例为每 GB 0.09 美元的公共互联网传输费用）。

## 要求

Terraform 模块创建：

1. **VPC** `10.20.0.0/16`，跨三个可用区。
2. 每个可用区的**子网层级**：
   - 公共子网 `10.20.{0,1,2}.0/24`——ALB 与 NAT Gateway。
   - 私有应用子网 `10.20.{10,11,12}.0/24`——推理 Pod、控制面。
   - 私有数据子网 `10.20.{20,21,22}.0/24`——训练节点、GPU 节点。
3. 每个可用区的 **NAT Gateway**（高可用），使用标签支持成本归因。
4. **VPC Endpoint**（S3 与 DynamoDB 使用 Gateway 类型；ECR、ECR Docker、CloudWatch Logs、CloudWatch Monitoring、SSM、Secrets Manager 使用 Interface 类型）。
5. 实施最小权限的**安全组**：
   - sg-inference 允许来自 ALB 安全组的 8000 端口入站流量，出站仅允许 S3 VPC Endpoint。
   - sg-training 允许访问 S3 与 Hugging Face IP 范围（通过 Prefix List），无入站流量。
6. 私有数据子网的 **Network ACL**，按照原文要求限制通往 0.0.0.0/0 的出站流量，只允许经 NAT 出站。
7. 通过 tc qdisc（逐 Pod Sidecar）对训练任务出站流量设置**带宽上限**。
8. 整个 VPC 的 **Flow Logs** 写入 CloudWatch。

## 分步操作

### 步骤 1——规划地址空间（15 分钟）
在 `NETWORK.md` 中记录子网。使用 ASCII 或 Excalidraw 图示网络拓扑。

### 步骤 2——Terraform 模块骨架（30 分钟）
```
modules/ml-vpc/
├── main.tf         # VPC + subnets + IGW + NAT + RTs
├── endpoints.tf    # VPC Endpoints
├── security_groups.tf
├── variables.tf
└── outputs.tf
```

### 步骤 3——子网层级与路由（45 分钟）
使用 `aws_subnet`、`aws_route_table`、`aws_route_table_association`。每个层级具有自己的路由表：
- 公共路由表 → 通过 IGW 访问 0.0.0.0/0。
- 私有应用路由表 → 通过同可用区 NAT 访问 0.0.0.0/0。
- 私有数据路由表 → 通过同可用区 NAT 访问 0.0.0.0/0，并路由至 S3 Gateway Endpoint。

### 步骤 4——VPC Endpoint（30 分钟）
S3 与 DynamoDB 使用 Gateway Endpoint（无额外 Endpoint 费用）。其余使用 Interface Endpoint（原文估算每个约 7 美元/月）。

仅将 Interface Endpoint 附加至需要的私有子网，并使用适当的可用区 DNS 配置，使流量尽可能保持在本地可用区。

### 步骤 5——安全组（30 分钟）
编写内联规则。东西向通信使用指向 VPC 自身 CIDR 的 `cidr_blocks` 引用；不要为入站流量使用 0.0.0.0/0。

### 步骤 6——输出（15 分钟）
暴露各层级子网 ID、全部安全组 ID 及 NAT Gateway ID。下游模块使用这些输出。

### 步骤 7——连通性测试（30 分钟）
在每个子网层级启动小型 EC2 实例。验证：
- 公共子网实例可访问互联网。
- 私有应用子网实例可以经 NAT 访问互联网，但仅主动发起出站连接。
- 私有数据子网实例可经 Gateway Endpoint 访问 S3（不产生 NAT 数据处理费用）。
- 推理实例可以访问 S3 推理层前缀，但不能访问训练层前缀。

将测试写成 `scripts/test-connectivity.sh`。

### 步骤 8——成本预测（15 分钟）
编写 `COSTS.md`，估算合成负载下 NAT、Interface Endpoint、Flow Logs 和数据出站流量的月度费用。与不使用 VPC Endpoint 的方案比较。

## 交付物

1. Terraform 模块及应用模块的 `terraform/environments/prod` 根模块。
2. 连通性测试脚本。
3. 包含拓扑图的 `NETWORK.md`。
4. 包含预测与敏感性分析表的 `COSTS.md`。

## 验证

- [ ] terraform apply 成功；全部 VPC 资源在 AWS 控制台可见。
- [ ] 私有数据子网中的 EC2 无公共 IP，且不经过 NAT 路由即可执行 aws s3 cp（通过 VPC Flow Logs 等信息验证）。
- [ ] 私有应用子网中的 EC2 可通过 NAT 执行 pip install。
- [ ] 推理安全组无法访问训练安全组中的目标（通过连接失败验证）。
- [ ] 成本预测与 AWS Pricing Calculator 相同配置的估算差异约在 10% 以内。

## 拓展目标

- 添加 **Transit Gateway**，连接第二个 VPC（模拟生产与预发布之间的连接）。
- 配置 **AWS Network Firewall**，过滤出站 URL（拒绝已知加密货币挖矿域名等）。
- 实现具有共享服务 VPC 的 **Hub-Spoke** 拓扑。
- 添加 **VPC Peering**，连接 CloudHSM VPC 以执行密钥操作。

## 常见陷阱

- **整个 VPC 仅使用一个 NAT**——节省成本，但破坏高可用性。生产环境可为每个可用区配置 NAT；开发环境可使用共享 NAT。
- **忘记 S3 Gateway Endpoint**——S3 流量经 NAT 时会产生逐字节处理费用。
- **默认在所有可用区配置 Interface Endpoint**——按可用区和 Endpoint 收费。限制在实际使用的可用区。
- **私有数据安全组出站允许 0.0.0.0/0**——即使路由表指向 NAT，仍为未来配置修改留下风险。
- **Flow Logs 写入 S3 或 CloudWatch**——CloudWatch 可能更贵，但查询方便。应有意识地选择。

## 参考答案

engineer-solutions 仓库中的 Terraform 参考实现。

> 译注：Network ACL 按 IP、协议、端口判断，不能区分下一跳是否为 NAT；应使用路由表及网络防火墙等实现强制出站路径，并确保无状态 ACL 的返回流量规则正确。S3 Gateway Endpoint 不具有独立安全组，可使用 S3 Prefix List 与 IAM、Bucket Policy、Endpoint Policy 实施约束。Hugging Face 不一定提供稳定的 IP 范围；URL 过滤也受协议与 TLS 检查能力限制。以上费用为原文示例，未经现行价格核验。
