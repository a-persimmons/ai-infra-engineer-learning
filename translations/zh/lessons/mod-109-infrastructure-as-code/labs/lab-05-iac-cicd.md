# 实验 05：在 CI/CD 中使用基于 PR 的 IaC plan

**时长：** 60 分钟  **前置条件：** 包含 Terraform 代码的 GitHub 仓库；GitHub Secrets 中有 AWS 凭据。

## 目标

建立 CI/CD 工作流，在每个 PR 上执行 `terraform plan`，将执行计划作为 PR 评论发布，仅在合并至 `main` 后执行 `terraform apply`。

## 步骤

### 1. 工作流
```yaml
# .github/workflows/terraform.yml
name: terraform
on:
  pull_request:
    paths: ['terraform/**']
  push:
    branches: [main]
    paths: ['terraform/**']

permissions:
  contents: read
  pull-requests: write
  id-token: write

jobs:
  plan:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: terraform } }
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions
          aws-region: us-west-2
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: 1.7.5 }
      - run: terraform fmt -check -recursive
      - run: terraform init
      - run: terraform validate
      - id: plan
        run: terraform plan -no-color -out=plan.tfplan
        continue-on-error: true
      - name: Show plan
        run: terraform show -no-color plan.tfplan > plan.txt
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('terraform/plan.txt', 'utf8');
            const body = `### Terraform Plan\n\`\`\`\n${plan.slice(0, 60000)}\n\`\`\``;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });
      - if: steps.plan.outcome == 'failure'
        run: exit 1

  apply:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production           # gates on env approval
    defaults: { run: { working-directory: terraform } }
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions
          aws-region: us-west-2
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - run: terraform apply -auto-approve
```

### 2. 在 AWS 端设置 OIDC 信任（一次性）

创建一个信任 GitHub OIDC 提供商的 IAM 角色，并附加最小权限策略。（不在本实验范围内，参见 HashiCorp 指南。）

### 3. 配置 GitHub Environment

Settings → Environments → `production` → Required reviewers（自己或团队）。

### 4. 创建 PR
```bash
git checkout -b lab-05
echo '# trivial change' >> terraform/README.md
git add terraform/README.md && git commit -m "lab: trigger plan"
git push -u origin lab-05
gh pr create --fill
```
观察工作流；Plan 应将执行计划作为 PR 评论发布。

### 5. 合并

合并后，Apply 工作流运行（等待环境审批）。

### 6. 差异告警

若执行计划包含破坏性资源变更，Sentinel/OPA/Conftest 可以使 Plan 检查失败（参见实验 07）。

## 验证

- [ ] 创建 PR → Plan 工作流在 PR 中发布执行计划输出。
- [ ] Plan 失败会导致 PR 检查失败。
- [ ] 合并到 main → Apply 工作流暂停等待批准，随后执行应用操作。

## 清理
```bash
git checkout main && git pull && git branch -D lab-05
```

## 故障排查

- **`Permission denied (publickey)`** — 使用 HTTPS 克隆，或配置 SSH。
- **OIDC 提示 `not authorized to perform sts:AssumeRoleWithWebIdentity`** — AWS 角色信任策略与 GitHub 组织/仓库的声明不匹配。
- **Plan 评论被截断** — GitHub 评论最多 65,536 个字符；截断内容或作为工作流产物上传。
