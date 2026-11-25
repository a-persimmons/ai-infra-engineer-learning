# 练习 11：成本感知 IaC

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 练习 10

## 目标

使用 Infracost 为每个 Terraform PR 添加成本估算。设置各团队月度预算。除非获得豁免，否则阻止将导致超预算的 PR。

## 要求

1. 每个 PR 的 CI 均执行 Infracost。
2. PR 评论显示与 main 相比的成本变化。
3. 每个团队的月度预算定义在 `budgets.yaml` 中。
4. 若 PR 导致月度成本超出预算的 1.1 倍，则 CI 失败。
5. 豁免机制：通过 PR 标签 `cost-approved` 绕过门禁。

## 分步操作

### 步骤 1——安装 Infracost（15 分钟）
```bash
brew install infracost
infracost auth login
infracost --version
```

### 步骤 2——基线成本（15 分钟）
```bash
cd envs/prod
infracost breakdown --path .
```
输出：每项资源的月度成本与总成本。

### 步骤 3——PR 差异（30 分钟）
```bash
git checkout main; cd envs/prod && infracost breakdown --path . --format=json > /tmp/main.json
git checkout PR-branch && infracost diff --path . --compare-to /tmp/main.json
```

### 步骤 4——CI 工作流（45 分钟）
```yaml
on: pull_request
jobs:
  cost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: infracost/actions/setup@v3
        with: { api-key: ${{ secrets.INFRACOST_API_KEY }} }
      - name: Generate Infracost cost estimate baseline
        run: |
          git checkout main
          infracost breakdown --path envs/prod --format=json --out-file=/tmp/baseline.json
      - name: Generate Infracost diff
        run: |
          git checkout ${{ github.event.pull_request.head.sha }}
          infracost diff --path envs/prod --format=json \
              --compare-to=/tmp/baseline.json --out-file=/tmp/diff.json
      - name: Post diff to PR
        uses: infracost/actions/comment@v3
        with: { path: /tmp/diff.json, behavior: update }
```

### 步骤 5——预算执行（45 分钟）
```yaml
# budgets.yaml
ml-platform:
  prod:    50000   # $50K/mo
  staging:  5000
  dev:      2000
```

```python
# enforce_budget.py
import json, yaml, sys, os
budgets = yaml.safe_load(open("budgets.yaml"))
diff = json.load(open("/tmp/diff.json"))

current_total = sum(p["pastTotalMonthlyCost"] or 0 for p in diff["projects"])
proposed_total = sum(p["totalMonthlyCost"] or 0 for p in diff["projects"])
env = os.environ["ENV"]
team = os.environ["TEAM"]
budget = budgets[team][env]

if proposed_total > budget * 1.10:
    print(f"FAIL: would push monthly cost to ${proposed_total:.0f} > budget ${budget * 1.10:.0f}")
    sys.exit(1)
print(f"OK: ${proposed_total:.0f} <= ${budget * 1.10:.0f}")
```

```yaml
      - name: Enforce budget
        if: contains(github.event.pull_request.labels.*.name, 'cost-approved') == false
        env: { ENV: prod, TEAM: ml-platform }
        run: python enforce_budget.py
```

如果添加了 `cost-approved` 标签，PR 仍然可以合并。

## 交付物

1. CI 中的 Infracost。
2. 包含成本变化的 PR 评论。
3. 包含各团队限制的 `budgets.yaml`。
4. 能够阻止合并的预算门禁。
5. 豁免标签演示。

## 验证

- [ ] 每个 PR 都有成本评论。
- [ ] 每月增加 1,000 美元成本的 PR 被阻止，除非添加豁免标签。
- [ ] 豁免标签允许合并。

## 拓展目标

- 添加**预测**：基于过去 30 天与当前 PR 预测月末成本。
- 添加**节省建议**：如果 PR 提议使用 m6i.large，建议评估 m7g.large（原文认为价格更低、性能相同）。
- 添加**资源级成本趋势**仪表盘。

## 常见陷阱

- **Infracost 未使用 --terraform-cloud-token**——缺少 Terraform Cloud 集成时，部分资源可能无法估价。
- **未计入 Spot 价格**——Spot 价格存在波动；Infracost 默认使用按需价格。
- **预算过于严格**——阻碍合理增长。每季度审查预算。

> 译注：m7g 与 m6i 的 CPU 架构不同，迁移前应验证应用兼容性和真实性能；成本估算也不能代替实际账单。
