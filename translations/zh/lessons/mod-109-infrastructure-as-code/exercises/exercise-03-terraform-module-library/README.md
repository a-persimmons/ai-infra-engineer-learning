# 练习 03：构建可复用的 Terraform 模块库

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 01；实验 01–02

## 目标

构建内部 Terraform 模块库：三个设计良好的模块（VPC、EKS、RDS），具备版本管理、文档、示例和测试。发布至私有注册中心，使其他团队通过 `source = "..."` 使用模块，而非复制粘贴。

## 为什么重要

没有模块库，每个团队都会自己编写 VPC，导致漂移累积、安全漏洞增多、新人上手需要数周。有了模块库，每个新项目只需使用 `module "vpc" { source = "company/vpc"; version = "~> 2" }`。

## 要求

1. 一个仓库内包含三个布局一致的模块。
2. 语义化版本管理及发布标签。
3. 使用 `terraform-docs` 自动生成每个模块的文档。
4. 每个模块至少包含一个可以端到端运行的**示例**。
5. 使用 **Terratest**（Go）或 **Kitchen-Terraform** 进行集成测试。
6. CI 工作流：每个 PR 均执行 lint、格式检查、文档检查与测试。

## 分步操作

### 步骤 1——仓库布局（15 分钟）
```
terraform-modules/
├── vpc/
│   ├── main.tf, variables.tf, outputs.tf, versions.tf
│   ├── README.md (auto-generated)
│   ├── examples/
│   │   └── basic/
│   └── test/
│       └── vpc_test.go
├── eks/
├── rds/
└── .github/workflows/test.yml
```

### 步骤 2——模块规范（30 分钟）

每个模块包含：

- `versions.tf`：Terraform 与 Provider 的版本要求。
- `variables.tf`：每项输入均包含说明、类型、可选默认值与验证规则。
- `outputs.tf`：每项输出均包含说明。
- `main.tf`：资源与局部值。
- `README.md`：由 `terraform-docs` 自动生成。

验证示例：
```hcl
variable "cidr_block" {
  type        = string
  description = "VPC CIDR block"
  validation {
    condition     = can(cidrnetmask(var.cidr_block))
    error_message = "Must be a valid CIDR."
  }
  validation {
    condition     = tonumber(split("/", var.cidr_block)[1]) <= 22
    error_message = "VPC CIDR must be /22 or larger to fit subnet plan."
  }
}
```

### 步骤 3——VPC 模块（45 分钟）
参照实验 01。进一步完善模块：标签、可选 NAT 数量、多可用区。

### 步骤 4——EKS 模块（45 分钟）
参照实验 02。添加通过变量配置的托管节点组、可配置的 IRSA 支持，以及 OIDC Provider URL 输出。

### 步骤 5——RDS 模块（30 分钟）
PostgreSQL：可选多可用区、自动备份、参数组、静态加密、凭据 Secret ARN 输出。

### 步骤 6——terraform-docs（15 分钟）
```bash
brew install terraform-docs
echo 'formatter: "markdown table"' > .terraform-docs.yml
terraform-docs markdown table --output-file README.md --output-mode inject vpc/
```
README 自动包含输入与输出表格。在 CI 中重新运行，如果 README 已过时则阻止 PR。

### 步骤 7——示例（15 分钟）
```
vpc/examples/basic/main.tf:
  module "vpc" {
    source = "../../"
    name   = "example"
    cidr_block = "10.0.0.0/16"
    azs        = ["us-west-2a", "us-west-2b"]
  }
```
这是「如何使用模块」的参考，也可以执行 terraform apply 作为冒烟测试。

### 步骤 8——Terratest（30 分钟）
```go
// vpc/test/vpc_test.go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestVPC(t *testing.T) {
    opts := &terraform.Options{
        TerraformDir: "../examples/basic",
        NoColor: true,
    }
    defer terraform.Destroy(t, opts)
    terraform.InitAndApply(t, opts)
    
    vpcId := terraform.Output(t, opts, "vpc_id")
    assert.Regexp(t, "^vpc-", vpcId)
}
```

### 步骤 9——版本管理与标签（15 分钟）
每个模块采用语义化版本。为仓库添加标签：`vpc/v1.0.0`、`eks/v1.0.0` 等。也可以每次发布采用一个全局标签。

使用者固定版本：
```hcl
module "vpc" {
  source  = "git::ssh://git@github.com/company/terraform-modules.git//vpc?ref=vpc/v1.0.0"
}
```

### 步骤 10——CI 工作流（15 分钟）
```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform fmt -check -recursive
      - run: for d in vpc eks rds; do terraform -chdir=$d init -backend=false; terraform -chdir=$d validate; done
      - run: terraform-docs markdown table vpc/ | diff - vpc/README.md
  test:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
      - run: cd vpc/test && go test -timeout 30m
```

## 交付物

1. 按约定布局组织的三个模块。
2. 自动生成的 README。
3. 可运行的示例。
4. 至少 VPC 模块通过 Terratest。
5. 验证每个 PR 的 CI 工作流。

## 验证

- [ ] 每个模块均通过 `terraform validate`。
- [ ] `terraform-docs` 输出与 README 一致。
- [ ] 示例可以正常创建和销毁资源。
- [ ] Terratest 通过。

## 拓展目标

- 发布至**私有 Terraform 注册中心**（Terraform Cloud、Spacelift 或自托管方案）。
- 添加**模块组合**：由 VPC、EKS 与 RDS 组成更高层级的 `ml-platform` 模块。
- 添加**策略门禁**（Sentinel / OPA），强制团队使用这些模块部署。

## 常见陷阱

- **模块与单个账号紧耦合**——硬编码 ARN 或账号 ID。始终参数化。
- **没有版本管理**——使用者跟踪 main，每次提交都可能破坏兼容性。始终添加版本标签。
- **文档漂移**——自动生成文档，否则容易无人维护。
