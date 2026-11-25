# 第 07 课：GitOps 与 IaC CI/CD

## 学习目标

完成本课后，你将能够：

- 理解用于基础设施管理的 GitOps 原则。
- 为基础设施变更实施 Pull Request 工作流。
- 为 IaC 配置自动化测试（terraform validate、fmt、tflint）。
- 使用 GitHub Actions 创建 Terraform CI/CD 流水线。
- 使用 Atlantis 实现自动化 Terraform 工作流。
- 应用策略即代码（Policy as Code），包括 Sentinel 与 OPA（Open Policy Agent）。
- 实现漂移检测及自动修复。
- 在 CI/CD 中配置安全扫描（tfsec、Checkov）。
- 构建完整的基础设施自动化流水线。

## GitOps 原则

### 什么是 GitOps？

**GitOps** 是一种运维框架，将 Git 作为基础设施与应用部署期望状态的唯一事实来源。

**核心原则：**

1. **声明式：** 以声明方式定义基础设施（Terraform、Pulumi）。
2. **版本化：** 在 Git 中追踪所有变更。
3. **不可变：** 基础设施变更通过新版本表达，而不是未经记录的直接修改。
4. **拉取式：** 自动从 Git 拉取变更。
5. **持续协调（Continuous Reconciliation）：** 持续使实际状态与期望状态保持一致。

```
Traditional:                    GitOps:
Developer → AWS Console         Developer → Git → PR → Approval → CI/CD → AWS
(manual, no history)            (automated, full history, review)
```

### 基础设施 GitOps

```
Git Repository (Source of Truth)
    ↓
Pull Request (Review & Approve)
    ↓
CI/CD Pipeline (Automated Tests)
    ↓
Terraform Apply (Deploy)
    ↓
Production Infrastructure
    ↓
Drift Detection (Monitor)
    ↓
Alert if Drift Detected
```

## Pull Request 工作流

### 基础 PR 工作流

```
1. Developer creates feature branch
   git checkout -b add-gpu-cluster

2. Make infrastructure changes
   Edit terraform files

3. Commit and push
   git add .
   git commit -m "Add GPU training cluster"
   git push origin add-gpu-cluster

4. Create Pull Request on GitHub

5. CI/CD runs automatically:
   - terraform fmt -check
   - terraform validate
   - terraform plan
   - tflint
   - tfsec
   - checkov

6. Reviewers examine:
   - Code changes
   - Terraform plan output
   - Security scan results
   - Cost estimates

7. Approve and merge

8. CD pipeline runs:
   - terraform apply (automatic or manual approval)

9. Infrastructure updated
```

### 分支策略

```
main (production)
├── develop (staging)
│   ├── feature/gpu-cluster
│   ├── feature/add-monitoring
│   └── feature/upgrade-eks
└── hotfix/security-patch
```

**工作流：**
- `feature/*` → `develop` → 在预发布环境测试。
- `develop` → `main` → 部署至生产环境。
- `hotfix/*` → `main` → 紧急修复。

## IaC 自动化测试

### 基础设施测试金字塔

```
        ┌──────────────┐
        │  Manual      │  Manual review, smoke tests
        │  Testing     │
        ├──────────────┤
        │  Integration │  Full terraform apply in test environment
        │  Tests       │
        ├──────────────┤
        │  Static      │  tflint, tfsec, checkov, OPA policies
        │  Analysis    │
        ├──────────────┤
        │  Syntax      │  terraform fmt, terraform validate
        │  Checks      │
        └──────────────┘
```

### terraform fmt

将代码格式化为标准风格：

```bash
# Check formatting (CI)
terraform fmt -check -recursive

# Exit code 0 = formatted
# Exit code 3 = needs formatting

# Auto-format (local)
terraform fmt -recursive
```

### terraform validate

验证语法与配置：

```bash
terraform init -backend=false
terraform validate

# Output:
# Success! The configuration is valid.

# Or if errors:
# Error: Unsupported argument
#   on main.tf line 5, in resource "aws_instance" "server":
#   5:   invalid_argument = "value"
```

### TFLint

Terraform 的高级静态检查工具。

**安装：**
```bash
# macOS
brew install tflint

# Linux
curl -s https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash

# Verify
tflint --version
```

**.tflint.hcl：**
```hcl
plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "aws" {
  enabled = true
  version = "0.27.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

rule "terraform_deprecated_index" {
  enabled = true
}

rule "terraform_unused_declarations" {
  enabled = true
}

rule "terraform_naming_convention" {
  enabled = true
}

rule "aws_instance_invalid_type" {
  enabled = true
}

rule "aws_instance_previous_type" {
  enabled = true
}
```

**运行 TFLint：**
```bash
# Initialize plugins
tflint --init

# Run linting
tflint

# Output with issues:
# 3 issue(s) found:
#
# Warning: `aws_instance_previous_type` - instance type "t2.micro" is previous generation (main.tf:10)
# Error: `terraform_unused_declarations` - variable "unused_var" is declared but not used (variables.tf:5)
```

### tfsec

Terraform 安全扫描工具。

**安装：**
```bash
# macOS
brew install tfsec

# Linux
curl -s https://raw.githubusercontent.com/aquasecurity/tfsec/master/scripts/install_linux.sh | bash

# Verify
tfsec --version
```

**运行 tfsec：**
```bash
# Scan current directory
tfsec .

# Output:
# Result #1 HIGH S3 Bucket does not have encryption enabled
# ─────────────────────────────────────────────────────────────
#   s3.tf:5-10
# ─────────────────────────────────────────────────────────────
#   5    resource "aws_s3_bucket" "data" {
#   6      bucket = "my-ml-bucket"
#   7      
#   8      # Missing encryption!
#   9    }
# ─────────────────────────────────────────────────────────────

# Scan with specific format
tfsec . --format json
tfsec . --format junit

# Ignore specific issues
tfsec . --exclude aws-s3-enable-bucket-encryption

# Soft fail (don't exit with error)
tfsec . --soft-fail
```

**行内忽略规则：**
```hcl
resource "aws_s3_bucket" "public_site" {
  bucket = "my-public-website"

  #tfsec:ignore:aws-s3-enable-bucket-encryption
  # Public website bucket, encryption not required
}
```

### Checkov

基于策略即代码的安全扫描工具。

**安装：**
```bash
pip install checkov

# Verify
checkov --version
```

**运行 Checkov：**
```bash
# Scan Terraform
checkov -d .

# Scan specific file
checkov -f main.tf

# Skip specific checks
checkov -d . --skip-check CKV_AWS_19,CKV_AWS_20

# Output format
checkov -d . -o json
checkov -d . -o junit

# Only show failed checks
checkov -d . --compact
```

**.checkov.yaml（配置文件）：**
```yaml
branch: main
download-external-modules: true
evaluate-variables: true
external-modules-download-path: .external_modules
framework:
  - terraform
output: cli
quiet: false
soft-fail: false
skip-check:
  - CKV_AWS_19  # Ensure S3 bucket has server-side encryption
  - CKV_AWS_21  # Ensure S3 bucket has versioning enabled
```

**行内抑制规则：**
```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "application-logs"

  #checkov:skip=CKV_AWS_18:Log bucket doesn't need logging
}
```

## GitHub Actions CI/CD 流水线

### 完整 Terraform CI/CD 工作流

**.github/workflows/terraform.yml：**
```yaml
name: Terraform CI/CD

on:
  pull_request:
    paths:
      - 'infrastructure/**'
      - '.github/workflows/terraform.yml'
  push:
    branches:
      - main
      - develop
    paths:
      - 'infrastructure/**'

env:
  TF_VERSION: '1.6.0'
  AWS_REGION: 'us-west-2'

jobs:
  terraform-checks:
    name: Terraform Checks
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infrastructure

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Format Check
        id: fmt
        run: terraform fmt -check -recursive
        continue-on-error: true

      - name: Terraform Init
        id: init
        run: terraform init -backend=false

      - name: Terraform Validate
        id: validate
        run: terraform validate -no-color

      - name: Setup TFLint
        uses: terraform-linters/setup-tflint@v3

      - name: TFLint Init
        run: tflint --init

      - name: Run TFLint
        id: tflint
        run: tflint -f compact
        continue-on-error: true

      - name: Setup tfsec
        uses: aquasecurity/tfsec-action@v1.0.0
        with:
          working_directory: infrastructure
          soft_fail: true

      - name: Run Checkov
        id: checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: infrastructure
          soft_fail: true
          framework: terraform

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const output = `#### Terraform Format and Style 🖌\`${{ steps.fmt.outcome }}\`
            #### Terraform Initialization ⚙️\`${{ steps.init.outcome }}\`
            #### Terraform Validation 🤖\`${{ steps.validate.outcome }}\`
            <details><summary>Validation Output</summary>

            \`\`\`
            ${{ steps.validate.outputs.stdout }}
            \`\`\`

            </details>

            #### TFLint 🔍\`${{ steps.tflint.outcome }}\`

            *Pusher: @${{ github.actor }}, Action: \`${{ github.event_name }}\`, Workflow: \`${{ github.workflow }}\`*`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            })

  terraform-plan:
    name: Terraform Plan
    runs-on: ubuntu-latest
    needs: terraform-checks
    if: github.event_name == 'pull_request'
    defaults:
      run:
        working-directory: infrastructure
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Init
        run: terraform init

      - name: Terraform Plan
        id: plan
        run: terraform plan -no-color -out=tfplan
        continue-on-error: true

      - name: Upload Plan
        uses: actions/upload-artifact@v3
        with:
          name: terraform-plan
          path: infrastructure/tfplan

      - name: Comment Plan
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const output = `#### Terraform Plan 📖\`${{ steps.plan.outcome }}\`

            <details><summary>Show Plan</summary>

            \`\`\`terraform
            ${{ steps.plan.outputs.stdout }}
            \`\`\`

            </details>

            *Action: \`${{ github.event_name }}\`, Workflow: \`${{ github.workflow }}\`*`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            })

      - name: Terraform Plan Status
        if: steps.plan.outcome == 'failure'
        run: exit 1

  terraform-apply:
    name: Terraform Apply
    runs-on: ubuntu-latest
    needs: terraform-plan
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    defaults:
      run:
        working-directory: infrastructure
    environment:
      name: production
      url: https://console.aws.amazon.com/

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Init
        run: terraform init

      - name: Terraform Apply
        run: terraform apply -auto-approve

      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Terraform apply failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 使用 Infracost 估算费用

**添加至工作流：**
```yaml
      - name: Setup Infracost
        uses: infracost/actions/setup@v2
        with:
          api-key: ${{ secrets.INFRACOST_API_KEY }}

      - name: Generate Infracost JSON
        run: infracost breakdown --path=. --format=json --out-file=/tmp/infracost.json

      - name: Post Infracost comment
        uses: infracost/actions/comment@v1
        with:
          path: /tmp/infracost.json
          behavior: update
```

**输出：**
```
Monthly cost estimate: $2,450 → $3,680 (+$1,230/month, +50%)

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Project: infrastructure                                                      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ + aws_instance.gpu_cluster[0-9]                                             ┃
┃   +$1,230  10 x p3.8xlarge (on-demand)                                      ┃
┃                                                                              ┃
┃ ~ aws_s3_bucket.datasets                                                     ┃
┃   ~ Storage (first 50TB)                                                     ┃
┃     +50TB  1,000GB → 51,000GB                                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## 使用 Atlantis 实现 Terraform 自动化

### 什么是 Atlantis？

Atlantis 是一个响应 Pull Request 事件运行 Terraform 的自动化机器人。

**功能：**
- 创建 PR 时运行 terraform plan。
- 在 PR 获得批准并满足 Apply 条件时，执行 terraform apply（取决于实际工作流配置）。
- 变更期间锁定项目。
- 在 PR 中评论 Plan 输出。
- 支持多个环境。

### Atlantis 配置

**atlantis.yaml：**
```yaml
version: 3
automerge: false
delete_source_branch_on_merge: true

projects:
  - name: production
    dir: environments/production
    workspace: default
    terraform_version: v1.6.0
    autoplan:
      when_modified: ["*.tf", "*.tfvars"]
      enabled: true
    apply_requirements: ["approved", "mergeable"]
    workflow: production

  - name: staging
    dir: environments/staging
    workspace: default
    terraform_version: v1.6.0
    autoplan:
      when_modified: ["*.tf", "*.tfvars"]
      enabled: true
    apply_requirements: ["approved"]
    workflow: default

workflows:
  production:
    plan:
      steps:
        - init
        - plan:
            extra_args: ["-lock=false"]
    apply:
      steps:
        - run: echo "Applying production changes"
        - apply

  default:
    plan:
      steps:
        - init
        - plan
    apply:
      steps:
        - apply
```

### Atlantis 命令

在 Pull Request 中发表评论执行以下命令：

```
atlantis plan                    # Run terraform plan
atlantis plan -p production      # Plan specific project
atlantis apply                   # Run terraform apply
atlantis apply -p production     # Apply specific project
atlantis unlock                  # Unlock if stuck
```

### Atlantis 部署

**Docker Compose：**
```yaml
version: '3'
services:
  atlantis:
    image: ghcr.io/runatlantis/atlantis:latest
    ports:
      - "4141:4141"
    environment:
      ATLANTIS_REPO_ALLOWLIST: github.com/myorg/ml-infrastructure
      ATLANTIS_GH_USER: atlantis-bot
      ATLANTIS_GH_TOKEN: ${GITHUB_TOKEN}
      ATLANTIS_GH_WEBHOOK_SECRET: ${WEBHOOK_SECRET}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_DEFAULT_REGION: us-west-2
    volumes:
      - ~/.aws:/root/.aws:ro
      - ./atlantis-data:/atlantis-data
    command: server
```

## 策略即代码（Policy as Code）

### Open Policy Agent（OPA）

**安装：**
```bash
brew install opa
```

**policy/deny_public_s3.rego：**
```rego
package terraform

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_s3_bucket"
  
  not resource.change.after.acl == "private"
  
  msg := sprintf(
    "S3 bucket '%s' must have private ACL (found: %s)",
    [resource.address, resource.change.after.acl]
  )
}

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_s3_bucket_public_access_block"
  
  resource.change.after.block_public_acls == false
  
  msg := sprintf(
    "S3 bucket '%s' must block public ACLs",
    [resource.address]
  )
}
```

**policy/require_tags.rego：**
```rego
package terraform

required_tags := ["Environment", "Project", "ManagedBy"]

deny[msg] {
  resource := input.resource_changes[_]
  resource.mode == "managed"
  
  # Check if tags exist
  not resource.change.after.tags
  
  msg := sprintf(
    "Resource '%s' is missing tags",
    [resource.address]
  )
}

deny[msg] {
  resource := input.resource_changes[_]
  resource.mode == "managed"
  
  # Check each required tag
  tag := required_tags[_]
  not resource.change.after.tags[tag]
  
  msg := sprintf(
    "Resource '%s' is missing required tag: %s",
    [resource.address, tag]
  )
}
```

**运行 OPA：**
```bash
# Generate plan JSON
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json

# Test policy
opa eval -i tfplan.json -d policy/ "data.terraform.deny"

# Output (if violations):
# [
#   "S3 bucket 'aws_s3_bucket.data' must have private ACL (found: public-read)",
#   "Resource 'aws_instance.web' is missing required tag: Environment"
# ]
```

**集成 OPA 的 GitHub Actions：**
```yaml
      - name: OPA Policy Check
        run: |
          terraform plan -out=tfplan
          terraform show -json tfplan > tfplan.json
          
          # Run OPA
          violations=$(opa eval -i tfplan.json -d policy/ "data.terraform.deny" --format raw)
          
          if [ "$violations" != "[]" ]; then
            echo "Policy violations found:"
            echo "$violations"
            exit 1
          fi
```

### Sentinel（HashiCorp）

Sentinel 是 HashiCorp 的策略即代码框架（原文针对 Terraform Cloud/Enterprise 集成）。

**sentinel.hcl：**
```hcl
policy "require-tags" {
  source            = "./require-tags.sentinel"
  enforcement_level = "hard-mandatory"
}

policy "restrict-instance-types" {
  source            = "./restrict-instance-types.sentinel"
  enforcement_level = "soft-mandatory"
}

policy "cost-limit" {
  source            = "./cost-limit.sentinel"
  enforcement_level = "advisory"
}
```

**require-tags.sentinel：**
```python
import "tfplan/v2" as tfplan

required_tags = ["Environment", "Project", "Owner"]

resources_without_tags = filter tfplan.resource_changes as address, rc {
  rc.mode is "managed" and
  rc.change.actions is not ["delete"] and
  any required_tags as tag {
    rc.change.after.tags[tag] else null is null
  }
}

main = rule {
  length(resources_without_tags) is 0
}
```

## 漂移检测（Drift Detection）

### 漂移检测脚本

```bash
#!/bin/bash
# drift-detection.sh

set -e

echo "Running drift detection..."

# Initialize
terraform init

# Refresh state
terraform refresh

# Plan with detailed diff
terraform plan -detailed-exitcode -out=drift.tfplan

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✓ No drift detected"
  exit 0
elif [ $EXIT_CODE -eq 1 ]; then
  echo "✗ Terraform command error"
  exit 1
elif [ $EXIT_CODE -eq 2 ]; then
  echo "⚠ Drift detected!"
  
  # Show drift
  terraform show drift.tfplan
  
  # Send alert (Slack, email, PagerDuty, etc.)
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 Infrastructure drift detected in production!"}' \
    $SLACK_WEBHOOK_URL
  
  exit 2
fi
```

### 定时漂移检测（GitHub Actions）

```yaml
name: Drift Detection

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  detect-drift:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      
      - name: Terraform Init
        run: terraform init
      
      - name: Detect Drift
        id: drift
        run: |
          terraform plan -detailed-exitcode -no-color
        continue-on-error: true
      
      - name: Alert on Drift
        if: steps.drift.outcome == 'failure'
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              text: "🚨 Infrastructure drift detected!",
              attachments: [{
                color: 'danger',
                text: 'Drift detected in production infrastructure. Please investigate.'
              }]
            }
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 自动修复

```yaml
      - name: Auto-Remediate Drift
        if: steps.drift.outcome == 'failure' && github.event_name == 'schedule'
        run: |
          # Only auto-remediate specific resources
          terraform apply -auto-approve -target=aws_security_group_rule.ssh
```

## 完整 ML 基础设施 CI/CD

### 多环境流水线

```yaml
name: ML Infrastructure CI/CD

on:
  pull_request:
    paths:
      - 'infrastructure/**'
  push:
    branches:
      - develop
      - main

jobs:
  validate:
    name: Validate & Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: hashicorp/setup-terraform@v2
      
      - name: Terraform Format
        run: terraform fmt -check -recursive
      
      - name: Terraform Init
        run: terraform init -backend=false
      
      - name: Terraform Validate
        run: terraform validate
      
      - name: TFLint
        uses: terraform-linters/setup-tflint@v3
      - run: tflint --init && tflint
      
      - name: tfsec
        uses: aquasecurity/tfsec-action@v1.0.0
      
      - name: Checkov
        uses: bridgecrewio/checkov-action@master

  plan-staging:
    name: Plan (Staging)
    needs: validate
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infrastructure/environments/staging
    
    steps:
      - uses: actions/checkout@v3
      - uses: hashicorp/setup-terraform@v2
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      
      - run: terraform init
      - run: terraform plan -out=tfplan
      
      - uses: actions/upload-artifact@v3
        with:
          name: staging-plan
          path: infrastructure/environments/staging/tfplan

  apply-staging:
    name: Apply (Staging)
    needs: plan-staging
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infrastructure/environments/staging
    environment:
      name: staging
    
    steps:
      - uses: actions/checkout@v3
      - uses: hashicorp/setup-terraform@v2
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      
      - run: terraform init
      - run: terraform apply -auto-approve

  plan-production:
    name: Plan (Production)
    needs: validate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infrastructure/environments/production
    
    steps:
      - uses: actions/checkout@v3
      - uses: hashicorp/setup-terraform@v2
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      
      - run: terraform init
      - run: terraform plan -out=tfplan
      
      - name: Infracost
        uses: infracost/actions/setup@v2
      - run: infracost breakdown --path=. --format=json --out-file=/tmp/infracost.json
      
      - uses: actions/upload-artifact@v3
        with:
          name: production-plan
          path: infrastructure/environments/production/tfplan

  apply-production:
    name: Apply (Production)
    needs: plan-production
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infrastructure/environments/production
    environment:
      name: production
      url: https://console.aws.amazon.com/
    
    steps:
      - uses: actions/checkout@v3
      - uses: hashicorp/setup-terraform@v2
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      
      - run: terraform init
      - run: terraform apply -auto-approve
      
      - name: Notify Success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'Production infrastructure updated successfully'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 最佳实践

- **使用 GitOps：** 将 Git 作为期望配置的唯一事实来源。
- **自动化测试：** 对每个 PR 运行检查。
- **强制审查：** 不合并未经审查的基础设施变更。
- **费用估算：** 在 PR 中展示费用影响。
- **安全扫描：** 使用 tfsec、Checkov 与 OPA 策略。
- **漂移检测：** 定期执行漂移检查。
- **环境保护：** 生产环境需要审批。
- **通知：** 对故障与漂移发出告警。
- **状态锁：** 防止并发修改。
- **回滚计划：** 明确如何撤销变更。

## 核心要点

- GitOps 为基础设施提供版本控制与审查机制。
- 自动化测试帮助尽早发现错误。
- GitHub Actions 可以实现完整的 Terraform CI/CD。
- Atlantis 在 Pull Request 工作流中自动化 Terraform 操作。
- 策略即代码（OPA、Sentinel）用于强制落实标准。
- 漂移检测有助于识别未经管理的手动变更。
- 安全扫描（tfsec、Checkov）十分重要。
- 多环境流水线隔离变更。
- 费用估算帮助基础设施决策。

## 下一步

- **第 08 课：** 安全最佳实践与合规。

---

**下一课：** [08-security-best-practices.md](08-security-best-practices.md)

> 译注：以 PR 触发 Terraform Plan/Apply 的 CI/CD 方案不一定满足严格 GitOps 定义中的拉取式持续协调。Atlantis 的 Apply 通常需要明确命令及相应审批条件。漂移检测不能阻止手动变更；自动修复也可能覆盖事故处置期间的必要修改，生产环境应设置审批门禁。较新 tfsec 功能已逐步整合进 Trivy；OPA Rego 语法也随版本演进。CI 应采用短期凭据、最小权限、可信工作流及依赖版本固定，并避免将敏感 Plan 内容公开到 PR。原始代码块与英文注释保持不变，未实际执行基础设施变更。
