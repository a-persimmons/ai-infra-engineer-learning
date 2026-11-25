# 练习 10：多环境晋升流水线

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 03（模块）

## 目标

构建晋升流水线：代码 → 开发 → 预发布 → 生产，支持基于 PR 的审批、环境专属配置，以及回归时自动恢复。既适用于 Terraform IaC，也适用于应用部署。

## 要求

1. 单一 Terraform 代码库，包含 dev/staging/prod 环境。
2. PR 触发受影响环境的 plan。
3. 合并至 main 时自动对 dev 执行 apply。
4. 通过标签触发 staging 的 apply。
5. 通过标签与人工审批触发 prod 的 apply。
6. 每个环境具有纳入版本管理的 `values.tfvars` 文件。

## 分步操作

### 步骤 1——项目布局（15 分钟）
```
infra/
├── modules/             (from exercise 03)
└── envs/
    ├── dev/
    │   ├── main.tf       # composes modules
    │   ├── backend.tf    # state for dev
    │   └── terraform.tfvars
    ├── staging/
    └── prod/
```

### 步骤 2——各环境专属 tfvars（30 分钟）
```hcl
# envs/dev/terraform.tfvars
region              = "us-west-2"
cluster_size        = "small"
node_count          = 2
db_instance_type    = "db.t4g.small"
multi_az            = false

# envs/prod/terraform.tfvars
region              = "us-west-2"
cluster_size        = "large"
node_count          = 6
db_instance_type    = "db.m6g.xlarge"
multi_az            = true
```

### 步骤 3——分支与标签策略（15 分钟）

- `main` 分支始终反映 `dev` 状态。
- `staging-v*` 标签部署至 staging。
- `prod-v*` 标签在审批后部署至 prod。

### 步骤 4——PR 时执行 plan（45 分钟）
```yaml
on: pull_request
jobs:
  plan:
    strategy:
      matrix: { env: [dev, staging, prod] }
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: envs/${{ matrix.env }} } }
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123:role/gh-actions-${{ matrix.env }}
          aws-region: us-west-2
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - run: terraform plan -no-color -out=plan.tfplan
      - uses: actions/upload-artifact@v4
        with: { name: plan-${{ matrix.env }}, path: envs/${{ matrix.env }}/plan.tfplan }
      - name: Comment PR
        run: |
          terraform show -no-color plan.tfplan > plan.txt
          gh pr comment ${{ github.event.pull_request.number }} \
            --body "### Plan for ${{ matrix.env }}\n\`\`\`\n$(cat plan.txt | head -200)\n\`\`\`"
```

### 步骤 5——合并时执行 apply（dev）（30 分钟）
```yaml
on:
  push: { branches: [main], paths: ['envs/dev/**', 'modules/**'] }
jobs:
  apply-dev:
    runs-on: ubuntu-latest
    environment: dev    # has 0 reviewers required
    steps:
      - ...
      - run: cd envs/dev && terraform init && terraform apply -auto-approve
```

### 步骤 6——标签触发 apply（staging）（30 分钟）
```yaml
on:
  push: { tags: ['staging-v*'] }
jobs:
  apply-staging:
    runs-on: ubuntu-latest
    environment: staging  # 1 reviewer required
    steps:
      - ...
      - run: cd envs/staging && terraform init && terraform apply -auto-approve
```

### 步骤 7——经审批执行 apply（prod）（15 分钟）
```yaml
on:
  push: { tags: ['prod-v*'] }
jobs:
  apply-prod:
    runs-on: ubuntu-latest
    environment: prod  # 2 reviewers + 1 hour wait
    steps:
      - ...
      - run: cd envs/prod && terraform init && terraform apply -auto-approve
```
在 GitHub Settings → Environments → prod 中配置必要审批人及等待计时器。

### 步骤 8——失败时自动恢复（15 分钟）
如果 apply 后的冒烟测试失败：
```yaml
- name: Smoke test
  run: ./scripts/smoke-test.sh ${{ matrix.env }}
- name: Revert on failure
  if: failure()
  run: |
    git revert HEAD --no-edit
    git push origin main
    terraform plan -out=revert.tfplan
    terraform apply -auto-approve revert.tfplan
```

## 交付物

1. 共享模块的三个环境。
2. 为各环境生成 plan 的 PR 工作流。
3. 每个环境具有适当审批机制的 apply 工作流。
4. 冒烟测试与自动恢复。
5. `PROMOTION_FLOW.md`，记录变更的生命周期。

## 验证

- [ ] PR 评论显示每个环境的 plan。
- [ ] 合并至 main 只对 dev 执行 apply。
- [ ] staging 标签触发 staging apply，并设有一名审批人的门禁。
- [ ] prod 标签需要两名审批人及一小时等待。
- [ ] 合成冒烟测试失败时触发自动恢复。

## 常见陷阱

- **两个环境使用相同状态**——可能造成灾难性后果。严格采用独立环境后端配置。
- **晋升漂移**——staging 与 prod 随时间产生差异。每季度审查。
- **没有冒烟测试**——apply 成功，但应用已损坏。始终从外部测试。
- **绕过审批**——工程师将自己添加为审批人。使用独立审批角色。

> 译注：GitHub 环境审批功能与仓库套餐有关，内置 Required reviewers 通常只要求其中一人批准；如需两人同时批准，应另设门禁。基础设施回滚也不保证数据或资源可以恢复。
