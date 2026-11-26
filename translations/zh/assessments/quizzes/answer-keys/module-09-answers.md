# 模块 109：基础设施即代码 — 参考答案

> [模块测验](../../../lessons/mod-109-infrastructure-as-code/quizzes/module-quiz.md)的详细答案，包含解析、常见错误和课程参考。
>
> **学术诚信：** 请先尝试完成测验，再用于自学。

---

## 问题 1
**问题：** 相比手动管理基础设施，使用基础设施即代码（IaC）的主要好处是什么？

**答案：** C) 基础设施可以进行版本控制并一致地复现

**解析：**
IaC 的决定性优势在于，基础设施定义与应用代码一起存放在源代码管理系统中，支持代码审查、差异历史、回滚和环境的确定性重建。手动点击操作无法保证跨区域、账户或环境的一致复现，也没有记录谁修改了什么的审计轨迹。

**常见错误：**
- 选择 A：由于前期编写代码的工作，首次部署使用 IaC 往往更慢；收益来自长期的可重复性。
- 选择 D：IaC 不取代云服务商，而是将如何在云上供应资源的过程编码化。

**相关资料：** `lessons/mod-109-infrastructure-as-code/01-introduction-to-iac.md`

---

## 问题 2
**问题：** 哪项陈述最准确地描述了 IaC 的声明式方法？

**答案：** B) 描述期望的最终状态，由工具确定如何实现它

**解析：**
Terraform 和 Pulumi 等声明式工具接收期望状态规范，并协调实际状态使其与规范匹配，计算必要的创建、更新及删除操作。这与需要编写确切执行步骤的命令式脚本不同。声明式方法天然提供幂等性：运行同一配置两次会收敛到相同结果。

**常见错误：**
- 选择 A：逐步指令描述的是*命令式*方法，而非声明式方法。
- 选择 D：按顺序运行命令的 Shell 脚本是命令式过程自动化。

**相关资料：** `lessons/mod-109-infrastructure-as-code/01-introduction-to-iac.md`

---

## 问题 3
**问题：** Terraform State（状态）的用途是什么？

**答案：** B) 跟踪受管理基础设施的当前状态

**解析：**
状态文件是 Terraform 的事实来源，将配置块映射到实际资源 ID 和属性。它允许 Terraform 检测漂移、在 `terraform plan` 中计算最小差异，以及为更新构建依赖图。没有状态，Terraform 就无法知道此前创建了哪些资源。

**常见错误：**
- 选择 A：状态不是凭据存储；其中的密钥是泄漏风险，而非功能。
- 选择 C：定义应存在什么资源的是 `.tf` 配置文件，而非状态文件。

**相关资料：** `lessons/mod-109-infrastructure-as-code/03-terraform-state-management.md`

---

## 问题 4
**问题：** 为什么应该使用远程状态后端（如 S3），而不是本地状态？

**答案：** B) 支持团队协作并防止并发修改

**解析：**
远程后端让每个团队成员和 CI 流水线使用同一个权威状态文件，而非每个工程师持有各自不同的本地副本。结合锁机制（例如 S3 后端的 DynamoDB），它将并发 `apply` 操作串行化，避免两个写入者竞争同一状态时造成的损坏。

**常见错误：**
- 选择 A：与本地磁盘相比，远程后端通常会增加延迟，而不是减少延迟。
- 选择 D：远程后端存储状态，但不会自动备份底层云资源。

**相关资料：** `lessons/mod-109-infrastructure-as-code/03-terraform-state-management.md`

---

## 问题 5
**问题：** Terraform 如何确定创建资源的顺序？

**答案：** C) 分析隐式和显式依赖

**解析：**
Terraform 根据资源之间的引用（隐式依赖，例如其他资源引用 `aws_subnet.main.id`）与 `depends_on` 声明（显式依赖）构建有向无环图。随后按照拓扑顺序遍历图，并行执行相互独立的分支。文件顺序和资源名称不会影响执行顺序。

**常见错误：**
- 选择 A 或 B：Terraform 选择执行顺序时不考虑文件排列顺序和资源名称。
- 选择 D：Terraform 从不依赖随机顺序加重试，而是预先计算正确顺序。

**相关资料：** `lessons/mod-109-infrastructure-as-code/02-terraform-fundamentals.md`

---

## 问题 6
**问题：** 在 Terraform 资源中引用名为 `instance_type` 的变量的正确方式是什么？

**答案：** B) `var.instance_type`

**解析：**
HCL 通过 `var.` 命名空间公开输入变量。可以直接使用引用（例如 `instance_type = var.instance_type`），或在模板字符串中使用 `"${var.instance_type}"`。不存在 `variable.` 命名空间，单独的 `$instance_type` 也不是有效 HCL。

**常见错误：**
- 选择 A：`${instance_type}` 缺少 `var.` 前缀；正确的插值语法为 `${var.instance_type}`。
- 选择 C：`variable` 是声明变量的*块*关键字，而非访问变量的命名空间。

**相关资料：** `lessons/mod-109-infrastructure-as-code/02-terraform-fundamentals.md`

---

## 问题 7
**问题：** 何时应在 Terraform 中使用 `for_each` 而不是 `count`？

**答案：** B) 希望从映射或集合创建资源，并需要稳定标识符时

**解析：**
`for_each` 使用映射或集合中的字符串标识符作为资源的键，因此调整顺序或删除一个条目不会导致无关资源被销毁及重建。使用 `count` 索引的资源以整数位置（`[0]`、`[1]` 等）寻址，当底层列表变化时会产生破坏性的资源变更。对于数据库或持久卷等有状态基础设施，稳定标识符尤其重要。

**常见错误：**
- 选择 A：如果恰好只有一个资源，通常两个元参数都不需要使用。
- 选择 D：`for_each` 可用于资源、数据源和模块，并非模块专用。

**相关资料：** `lessons/mod-109-infrastructure-as-code/06-advanced-iac-patterns.md`

---

## 问题 8
**问题：** 要仅在生产环境中供应昂贵的 GPU 实例，应使用哪个 Terraform 资源元参数？

**答案：** B) `count = var.environment == "prod" ? 3 : 0`

**解析：**
将 `count` 与条件表达式结合使用，可以仅在条件为真时创建 N 份资源，否则创建零份。将 `count = 0` 是 Terraform 中“在此环境跳过该资源”的惯用模式。这避免了针对每个环境维护不同配置分支。

**常见错误：**
- 选择 A：`prevent_destroy` 仅阻止删除已创建的资源，不限制资源的创建。
- 选择 D：对 `var.gpu_instances` 使用 `for_each` 本身并不会将创建限制在生产环境，除非输入映射同样根据环境设置。

**相关资料：** `lessons/mod-109-infrastructure-as-code/04-building-ai-infrastructure-terraform.md`

---

## 问题 9
**问题：** `terraform plan` 的作用是什么？

**答案：** B) 预览变更而不实际执行

**解析：**
`terraform plan` 刷新状态，将其与配置比较，并打印将要执行的创建、更新及销毁操作。它不会修改云资源，因此是代码审查和 CI 预检查中使用的安全基础操作。只有 `terraform apply`（或对保存的计划文件执行 apply）才实际实施变更。

**常见错误：**
- 选择 A：这是 `terraform apply` 的职责。
- 选择 C 或 D：格式化由 `terraform fmt` 完成；初始化由 `terraform init` 完成。

**相关资料：** `lessons/mod-109-infrastructure-as-code/02-terraform-fundamentals.md`

---

## 问题 10
**问题：** S3 后端使用 DynamoDB 进行状态锁定的目的是什么？

**答案：** B) 防止可能损坏状态的 Terraform 并发操作

**解析：**
DynamoDB 充当分布式锁管理器：Terraform 读写 S3 后端的状态之前，在 DynamoDB 表中写入一个锁条目，结束后释放该条目。如果另一个操作试图获取锁，它会快速失败，而不是产生竞争。这对团队和 CI 流水线至关重要。

**常见错误：**
- 选择 A：状态加密通过 S3 服务端加密或 KMS 单独配置，而非通过 DynamoDB。
- 选择 D：状态文件版本管理由 S3 版本控制处理，而非 DynamoDB。

**相关资料：** `lessons/mod-109-infrastructure-as-code/03-terraform-state-management.md`

---

## 问题 11
**问题：** Terraform 数据源用于什么？

**答案：** B) 获取现有资源的信息

**解析：**
数据源（`data` 块）对 Provider 执行只读查询，例如查找最新的 Amazon Linux AMI、按照标签查找已有 VPC，或获取当前账户 ID。其他资源可以引用结果，使配置能够对不归它管理的基础设施做出响应。Terraform 从不会修改数据源。

**常见错误：**
- 选择 A：创建新基础设施的是 `resource` 块，而非 `data` 块。
- 选择 C：敏感数据应存放在 Secrets Manager、SSM Parameter Store 或 Vault 中，而非数据源。

**相关资料：** `lessons/mod-109-infrastructure-as-code/02-terraform-fundamentals.md`

---

## 问题 12
**问题：** Terraform 模块的主要用途是什么？

**答案：** B) 组织和复用基础设施代码

**解析：**
模块是通过输入（变量）与输出公开的、由相关资源组成的可复用集合。它们允许发布具有既定设计约定的构建块（例如“GPU 训练集群”模块），并在各环境和团队间使用，而无需复制粘贴。它们类似编程语言中的函数或包。

**常见错误：**
- 选择 A：模块不会显著加快 Terraform 执行速度，它们改变的是代码组织方式。
- 选择 C 或 D：加密与状态管理属于独立的后端问题。

**相关资料：** `lessons/mod-109-infrastructure-as-code/06-advanced-iac-patterns.md`

---

## 问题 13
**问题：** Pulumi 与 Terraform 的主要区别是什么？

**答案：** B) Pulumi 使用通用编程语言，Terraform 使用 HCL

**解析：**
Pulumi 使用真实的编程语言（Python、TypeScript、Go、C#、Java）描述基础设施，因此可以原生使用循环、类、抽象和单元测试框架。Terraform 使用专为配置设计的 HCL 语言。两者底层均为声明式，并都支持多云部署和状态管理。

**常见错误：**
- 选择 A：Terraform 与云服务商无关，支持数百个 Provider，并非仅支持 AWS。
- 选择 C：Pulumi 确实支持状态管理（通过 Pulumi Cloud 或自管理后端）。
- 选择 D：不论使用哪种宿主语言，两种工具都向用户呈现声明式模型。

**相关资料：** `lessons/mod-109-infrastructure-as-code/05-pulumi-infrastructure-as-software.md`

---

## 问题 14
**问题：** 为什么在 Terraform 中使用竞价实例对 ML 训练工作负载有益？

**答案：** B) 比按需实例最多便宜 90%

**解析：**
竞价实例以大幅折扣使用云上的闲置容量，通常比按需实例便宜 70–90%。如果定期保存检查点，ML 训练任务能够很好地容忍中断，因此天然适合竞价定价。硬件规格和网络性能与对应的按需实例相同，区别仅在于中断方面的保障。

**常见错误：**
- 选择 A 或 D：竞价与按需实例的硬件和网络相同，并不具有更好的性能。
- 选择 C：云服务商可能仅提前两分钟通知就回收竞价容量；中断正是其代价。

**相关资料：** `lessons/mod-109-infrastructure-as-code/04-building-ai-infrastructure-terraform.md`

---

## 问题 15
**问题：** 如何将 Terraform 输出标记为敏感，以防止在 CLI 中显示？

**答案：** B) `output "password" { value = var.password, sensitive = true }`

**解析：**
在输出块中设置 `sensitive = true`，会让 Terraform 在 CLI 输出和计划摘要中遮盖该值，改为打印 `<sensitive>`。该值仍会进入状态文件（因此应加密远程状态），但正常运行时不会显示。输出中没有 `hidden` 或 `encrypted` 参数。

**常见错误：**
- 选择 A：未设置 `sensitive = true` 时，密码会以明文打印。
- 选择 C 或 D：`hidden` 与 `encrypted` 都不是有效的 Terraform 输出参数。

**相关资料：** `lessons/mod-109-infrastructure-as-code/08-security-best-practices.md`

---

## 问题 16
**问题：** Terraform Workspace（工作空间）的目的是什么？

**答案：** B) 使用相同配置管理多个环境（dev、staging、prod）

**解析：**
工作空间允许单一配置根目录维护多个相互隔离的状态文件，每个工作空间一个。切换工作空间（`terraform workspace select staging`）会改变 Terraform 读写的状态文件。注意：工作空间只是多种环境策略之一；为了在生产与非生产环境之间实现更强的影响范围隔离，通常更倾向使用独立后端或目录。

**常见错误：**
- 选择 A：多云部署由 Provider 处理，而非工作空间。
- 选择 C：工作空间不使操作并行化，而是隔离状态。

**相关资料：** `lessons/mod-109-infrastructure-as-code/06-advanced-iac-patterns.md`

---

## 问题 17
**问题：** 面向基础设施的 GitOps 的一项关键原则是什么？

**答案：** B) 基础设施变更通过 Git 拉取请求和自动化流水线进行

**解析：**
GitOps 将 Git 仓库作为基础设施期望状态的唯一事实来源。每项变更都是一个 Pull Request：经过审查、批准、合并，再由自动化流水线或控制器协调到云端。这提供可审计性、同行评审以及通过还原 commit 轻松回滚的能力。

**常见错误：**
- 选择 A：直接通过控制台进行变更正是 GitOps 所禁止的操作，会导致配置漂移。
- 选择 D：GitOps 控制的是*谁可以合并*，而非谁能成为团队成员；任何人都可以通过 PR 提议变更。

**相关资料：** `lessons/mod-109-infrastructure-as-code/07-gitops-iac-cicd.md`

---

## 问题 18
**问题：** `terraform fmt` 命令有什么作用？

**答案：** B) 将代码格式化为规范样式

**解析：**
`terraform fmt` 按照 Terraform 规范样式重写 `.tf` 文件，包括统一缩进、参数块中 `=` 符号的对齐和标准化空格。它类似 IaC 领域的 `gofmt` 或 `prettier`。在 CI 中运行（使用 `terraform fmt -check`）可以避免代码审查中产生无意义的格式变更。

**常见错误：**
- 选择 A：语法验证使用 `terraform validate`。
- 选择 C 或 D：计划使用 `terraform plan` 生成；初始化使用 `terraform init`。

**相关资料：** `lessons/mod-109-infrastructure-as-code/02-terraform-fundamentals.md`

---

## 问题 19
**问题：** 哪个生命周期元参数可以防止关键资源被意外销毁？

**答案：** B) `prevent_destroy = true`

**解析：**
在 `lifecycle` 块中设置 `prevent_destroy = true`，若变更集包含对该资源的销毁操作，Terraform 会在计划阶段报错。这是数据库、KMS 密钥、存有数据的 S3 存储桶等有状态基础设施的护栏。若有意删除受保护资源，必须移除该标志并重新生成计划。

**常见错误：**
- 选择 A：`create_before_destroy` 改变替换时的*顺序*，不会阻止删除。
- 选择 C：`ignore_changes` 抑制特定属性的漂移检测，与删除无关。
- 选择 D：`destroy = false` 不是有效的生命周期参数。

**相关资料：** `lessons/mod-109-infrastructure-as-code/08-security-best-practices.md`

---

## 问题 20
**问题：** 为什么 ML 训练使用的 EC2 实例应该使用 IAM 角色而不是硬编码凭据？

**答案：** B) IAM 角色提供自动轮换的临时凭据

**解析：**
实例配置文件通过 EC2 实例元数据服务提供短期 STS 凭据，SDK 会在凭据过期前自动刷新。磁盘上不存在可能通过日志、快照或被入侵的容器泄漏的长期密钥。这是 AWS 对运行在 EC2、ECS、EKS 或 Lambda 上的所有工作负载推荐的模式。

**常见错误：**
- 选择 A 或 D：IAM 角色不改变运行时性能或价格。
- 选择 C：AWS 允许在 EC2 上使用访问密钥，但强烈建议不要这样做。

**相关资料：** `lessons/mod-109-infrastructure-as-code/08-security-best-practices.md`

---

## 问题 21
**问题：** Terraform 状态文件可能包含敏感数据。最佳实践是什么？

**答案：** B) 使用加密的远程状态（例如使用 KMS 的 S3）

**解析：**
S3 远程状态结合服务端加密（SSE-KMS）、存储桶版本控制和通过 IAM 策略实施的访问控制，可在同一配置中实现保密性、可恢复性和团队协作。Terraform Cloud / Enterprise 后端提供同等保障。状态绝不应存放在 Git 或未加密的共享存储中。

**常见错误：**
- 选择 A：将状态提交到 Git 会将明文密钥暴露在仓库历史中。
- 选择 C：仅使用本地状态阻碍协作，并且容易丢失。
- 选择 D：通过电子邮件发送状态会使密钥不受控制地传播，也没有锁定机制。

**相关资料：** `lessons/mod-109-infrastructure-as-code/03-terraform-state-management.md`

---

## 问题 22
**问题：** 在 IaC 工作流中，tfsec 与 Checkov 有什么作用？

**答案：** B) 扫描基础设施代码中的安全问题和错误配置

**解析：**
tfsec 和 Checkov 是静态分析工具，解析 Terraform（以及其他 IaC）并标记不安全的模式，例如公开的 S3 存储桶、未加密的卷、过于宽松的安全组或缺少日志。它们在 CI 中运行仅需数秒，可在问题演变为生产事故之前发现问题。两者都包含数百条与 CIS、PCI 等标准对应的规则。

**常见错误：**
- 选择 A：格式化是 `terraform fmt` 的职责。
- 选择 C：文档由 terraform-docs 等工具生成。
- 选择 D：两种工具都不部署基础设施，只进行分析。

**相关资料：** `lessons/mod-109-infrastructure-as-code/08-security-best-practices.md`

---

## 问题 23
**问题：** 应使用哪个 Terraform 资源根据负载自动扩缩 ML 推理服务器？

**答案：** B) `aws_autoscaling_group`

**解析：**
Auto Scaling Group 依据 CloudWatch 指标（CPU、请求数、自定义 GPU 利用率、SQS 队列深度等）触发的扩缩容策略，管理一组 EC2 实例。它自动维持最小、最大及期望容量。对于容器化推理，可以在其上使用 ECS 或 EKS，但 EC2 底层计算自动扩缩容的基础机制是 ASG。

**常见错误：**
- 选择 A：单独的 `aws_instance` 是没有扩缩容逻辑的一台虚拟机。
- 选择 C：Lambda 会自动扩缩容，但不适合长期运行的 GPU 推理服务器。
- 选择 D：`aws_ecs_task` 定义单一任务；ECS 扩缩容需要服务及扩缩容策略。

**相关资料：** `lessons/mod-109-infrastructure-as-code/04-building-ai-infrastructure-terraform.md`

---

## 问题 24
**问题：** `terraform import` 有什么作用？

**答案：** B) 将现有基础设施纳入 Terraform 管理

**解析：**
`terraform import`（或较新 Terraform 中的 `import` 块）在你指定的 Terraform 地址下将实际云资源记录到状态中。仍需编写匹配的 `resource` 块，使后续计划不显示差异（较新版本也支持生成配置）。这就是将手动点击创建的资源纳入 IaC 的方式。

**常见错误：**
- 选择 A：Provider 插件通过 `terraform init` 安装。
- 选择 C：通过 `terraform init` 或 `get` 从注册表获取模块。
- 选择 D：变量文件会自动加载（`terraform.tfvars`），或通过 `-var-file` 加载。

**相关资料：** `lessons/mod-109-infrastructure-as-code/06-advanced-iac-patterns.md`

---

## 问题 25
**问题：** 哪个工具能够在应用 Terraform 变更前估算基础设施成本？

**答案：** B) Infracost

**解析：**
Infracost 解析 Terraform 计划并查询云定价 API，生成拟议变更的美元成本估算。它集成到 Pull Request 中，使审查者可以在合并前看到例如“两台 p3.8xlarge 实例每月增加 1,240 美元”。这样成本就成为代码审查中的一等信号。

**常见错误：**
- 选择 A：`terraform plan` 显示资源变更，不显示价格。
- 选择 C：`terraform validate` 仅检查语法及内部一致性。
- 选择 D：tfsec 扫描安全配置错误，而非成本。

**相关资料：** `lessons/mod-109-infrastructure-as-code/07-gitops-iac-cicd.md`

---

## 问题 26
**问题：** 场景 1——多环境 ML 基础设施。需要独立的 dev（1× t3.large）、staging（2× p3.2xlarge）和 prod（4× p3.8xlarge）环境，共享同一代码库。使用 Terraform 管理这些环境的最佳方法是什么？

**答案：** B) 使用 Terraform 工作空间，并为每个环境提供变量文件

**解析：**
通过 `environment` 变量参数化的单一配置，结合各工作空间专用的 `.tfvars`（或各环境独立的后端目录），使代码保持 DRY，同时允许每个环境使用不同实例数量和类型。以环境为键的映射变量（`{dev = {...}, staging = {...}, prod = {...}}`）让一个 `aws_instance` 块能按工作空间正确展开。为了更强的生产环境隔离，许多团队采用各环境独立的状态后端，而不只依靠工作空间，两者都是同一参数化原则的有效实现。

**常见错误：**
- 选择 A：三个复制粘贴的项目必然产生漂移；Bug 修复需要应用三次，且最终会产生差异。
- 选择 C：硬编码值使得每次部署时不修改源码就无法实现环境差异。
- 选择 D：混合手动供应与 Terraform 会导致状态与实际情况漂移，违背 IaC 的初衷。

**相关资料：** `lessons/mod-109-infrastructure-as-code/06-advanced-iac-patterns.md`

---

## 问题 27
**问题：** 场景 2——状态文件损坏。两名工程师同时运行 `terraform apply`，导致生产 GPU 集群状态与现实不一致。应采取什么步骤恢复，并防止今后再次发生？

**答案：** 停止所有 Terraform 操作，从较早的 S3 版本恢复状态，验证并刷新状态，然后强制使用状态锁及仅允许流水线执行 apply。

**解析：**
首要任务是停止进一步写入，再通过 S3 对象版本控制恢复状态（执行 `aws s3api list-object-versions`，随后执行 `get-object --version-id`）。运行 `terraform plan` 确认恢复后的状态与实际情况匹配，并使用 `terraform refresh`（或针对性导入）协调真正存在的漂移。结构性修复措施是在 S3 后端启用 DynamoDB 锁表，开启 S3 版本控制和 KMS 加密，并将所有 apply 操作交给需要 PR 批准的 CI/CD 流水线（Atlantis、GitHub Actions），从而避免两个人再次竞争同一个状态。

**常见错误：**
- 跳过“停止一切”步骤并继续 apply，这可能加重损坏。
- 恢复后忘记启用 DynamoDB 锁定，没有它同样的事故会再次发生。
- 事故前未启用 S3 版本控制，导致没有历史状态可供恢复。
- 仅依赖团队纪律，而不是流水线门禁及自动化锁定。

**相关资料：** `lessons/mod-109-infrastructure-as-code/03-terraform-state-management.md`

---

## 问题 28
**问题：** 场景 3——密钥管理。EC2 上的 ML 推理服务需要数据库密码、外部 ML API 密钥及 S3 访问权限。应如何在 Terraform 配置中安全管理这些密钥？

**答案：** 将数据库密码和 API 密钥存放于 AWS Secrets Manager，为 S3 访问使用 IAM 实例配置文件（而非访问密钥），通过实例角色在运行时检索密钥，并确保 tfvars 不进入 Git，同时加密远程状态。

**解析：**
密码、API 密钥等应放在托管密钥存储（AWS Secrets Manager 或 SSM Parameter Store）中，以便集中轮换和审计；Terraform 创建密钥资源，但密钥值通过安全 CI 的 `TF_VAR_*` 注入，绝不提交到 Git。对于 AWS API 访问（S3），使用通过实例配置文件附加的 IAM 角色，它提供短期、轮换的凭据，磁盘上不留静态密钥。实例的 user-data 使用 `aws secretsmanager get-secret-value` 获取运行时密钥。结合 `.gitignore` 中针对 `*.tfvars` 的条目及 KMS 加密的 S3 远程状态，形成完整保护闭环。

**常见错误：**
- 直接在 `.tf` 文件中硬编码密钥，或将包含密钥的 `terraform.tfvars` 提交到 Git。
- 将长期 AWS 访问密钥嵌入 user-data 或环境变量，而不是使用实例配置文件。
- 仅将密钥作为实例上的明文环境变量存储，没有轮换策略。
- Terraform 状态文件未加密；即使密钥存放在外部，引用其值时也可能进入状态文件。

**相关资料：** `lessons/mod-109-infrastructure-as-code/08-security-best-practices.md`

---
