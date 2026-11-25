# 练习 10：模型治理与审计

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** 练习 03（注册中心）；了解合规有帮助

## 目标

为机器学习平台实现模型治理框架：模型卡、决策日志、偏差与公平性审查、审批工作流、审计记录以及季度评审机制。使框架保持实用、轻量，让工程师愿意真正使用。

## 为什么重要

法规（欧盟 AI Act、美国行政命令、银行业 SR 11-7 等行业规范）与客户信任都对模型治理提出要求。过重的治理会降低开发速度，过于宽松的治理则容易被忽略。合适的平衡是让工程师借助模板自主完成治理工作。

## 要求

1. **模型卡模板**：根据 MLflow 元数据自动生成，辅以手动字段。
2. **决策日志**：记录每项架构选择的理由（模型、框架、数据源）。
3. **偏差与公平性检查清单**：至少包含人口统计、地理、时间三个维度。
4. **审批工作流**：区别于技术晋升，治理审批独立于「指标良好」这一条件。
5. **审计记录**：可按模型、日期、审批人查询。
6. **季度评审模板**：用于生产中的模型。

## 分步操作

### 步骤 1——模型卡模板（30 分钟）
```markdown
# Model Card: recs-ranker v3.2

## Intended use
**Primary purpose:** Rank product candidates for homepage display.
**Out of scope:** Search ranking, ad ranking, fraud detection.

## Training data
- **Source:** Production click + purchase events 2024-2026.
- **Volume:** 100M rows, 5M users.
- **Time range:** 2024-01-01 to 2026-05-01.
- **Known biases:** US-skewed (60% of users), recent-skewed (more weight on 2025 events).

## Performance
| Slice | AUC | Precision@10 | Recall@10 |
|---|---|---|---|
| Overall | 0.872 | 0.34 | 0.51 |
| US users | 0.881 | 0.36 | 0.53 |
| Non-US users | 0.842 | 0.28 | 0.47 |
| New users (< 7d) | 0.798 | 0.22 | 0.41 |

## Ethical considerations
- Disparate accuracy across regions; mitigation: per-region threshold tuning.
- Cold-start performance lower; fallback to popularity-based ranker.

## Limitations
- Performance degrades after 30 days without retraining.
- Cannot handle products with no historical interactions.
- Trained without privacy guarantees (no DP).

## Maintenance
- Retraining: weekly, automated.
- Quarterly review: next 2026-08-01.
- Owner: alice@example.com / @ml-recs slack channel.

## Audit references
- Decision log: link
- Bias review: link
- Approval: 2026-05-15 by jane@ (compliance@)
```

### 步骤 2——根据 MLflow 自动生成（45 分钟）
```python
# generate_card.py
import mlflow
import jinja2

def generate(model_name, version):
    client = mlflow.MlflowClient()
    mv = client.get_model_version(model_name, version)
    run = client.get_run(mv.run_id)
    
    template = jinja2.Template(open("templates/model_card.md.j2").read())
    return template.render(
        model_name=model_name,
        version=version,
        metrics=run.data.metrics,
        params=run.data.params,
        tags=run.data.tags,
        run_id=mv.run_id,
        created_at=mv.creation_timestamp,
    )

print(generate("recs-ranker", "12"))
```

### 步骤 3——决策日志（30 分钟）
Markdown 格式的 ADR（Architecture Decision Record，架构决策记录）：
```
docs/decisions/
├── 001-choose-mlflow-over-w&b.md
├── 002-use-redis-for-feature-store.md
├── 003-no-personalization-for-new-users.md
└── ...
```

模板：
```markdown
# ADR-007: Drop demographic features from recs model

**Date:** 2026-05-12  **Status:** Accepted

## Context
Including demographic features (inferred age, gender) improved overall AUC by 0.4pp but introduced disparate performance across age groups and exposed PII risk.

## Decision
Drop demographic features. Use behavioral signals only.

## Consequences
- AUC down 0.4pp.
- Disparate-performance metric down 60%.
- PII exposure surface reduced.
- Simplifies compliance review.

## Alternatives considered
1. Keep features with mitigation (k-anonymity) — rejected, complex + ongoing burden.
2. Selective drop (gender only) — rejected, halfway compromise.
```

### 步骤 4——偏差与公平性检查清单（30 分钟）
```markdown
# Pre-launch bias review: recs-ranker v3.2

## Demographic
- [x] Per-country accuracy difference < 5pp? (computed: 3.9pp, US vs non-US)
- [x] Per-age-bracket accuracy difference < 5pp? (computed: 4.2pp, 18-25 vs 55+)

## Geographic
- [x] Performance equitable across 5 largest markets? (yes)

## Temporal
- [x] Performance stable across day-of-week, weekday vs weekend?
- [x] Recency bias: model doesn't only recommend last-7-days items?

## Coverage
- [x] Min items recommended per user > 5? (yes, 8 by design)
- [x] Cold-start strategy documented? (yes, fallback to popularity ranker)

## Sign-offs
- ML lead: alice@ (date)
- Compliance: jane@ (date)
- Product: bob@ (date)
```

### 步骤 5——审批工作流（30 分钟）
进入 Production 前进行两项并行审批：

1. **技术审批**（练习 03 的质量门禁）——自动执行。
2. **治理审批**——人工执行，要求：
   - 已发布模型卡。
   - 已完成偏差审查清单。
   - 重大选择已有决策日志。
   - 明确记录责任人。

Slack Bot 提示完成两项审批；在两项均通过前阻止晋升至 Production。

### 步骤 6——审计记录（30 分钟）
SQLite 或其他数据库：
```sql
CREATE TABLE governance_events (
    ts TIMESTAMP, model_name TEXT, version TEXT,
    event TEXT, actor TEXT, justification TEXT, attachments TEXT
);
```
追加每个事件（注册、晋升、退役、偏差审查完成）。

```python
def audit_query(model_name=None, since=None):
    # Return chronological events; support filtering by model, date range
    ...
```

### 步骤 7——季度评审模板（15 分钟）
```markdown
## Q2 2026 Review: recs-ranker

### Production performance
- Availability: 99.6% (target 99.5%) ✅
- Latency p95: 142ms (target 200ms) ✅
- Click-through: 8.4% (vs Q1 8.1%) ✅

### Incidents
- 2026-04-22: 18-min outage (auth dep). MTTR met.
- 2026-05-15: predictions for users in DE wildly off — root cause: training set excluded EU registrations after GDPR scrubbing. Fixed in v3.3.

### Drift
- Feature `amount_30d`: PSI 0.08 — within bounds.
- Feature `country`: distribution stable.

### Retraining cadence
- Currently weekly; consider biweekly to reduce cost.

### Action items for Q3
- [ ] Add per-country accuracy alerts (driven by incident above).
- [ ] Re-validate bias checklist.
- [ ] Refresh model card based on Q2 incidents.
```

## 交付物

1. 模型卡模板及至少两份生成的模型卡。
2. 包含至少五份 ADR 的决策日志目录。
3. 偏差审查清单及一份已完成的示例。
4. 审批工作流（脚本或 Webhook）。
5. 具有可查询历史记录的审计记录。
6. 季度评审模板及一份示例。

## 验证

- [ ] 从 MLflow 自动生成的模型卡具有实用价值。
- [ ] ADR 遵循模板；团队可以快速找到过去的任意决策。
- [ ] 如果 v3.2 已完成偏差清单，则可以发现原文示例中的第二季度欧盟地区 Bug。
- [ ] 审计查询返回指定模型的正确事件。

## 拓展目标

- 添加**法规映射**：哪些字段满足哪些框架的哪些条款（EU AI Act、NIST AI RMF、ISO 42001）。
- 将**可解释性输出**（SHAP 特征归因）作为模型的标准配套产物。
- 构建**治理仪表盘**：一览所有生产模型的治理状态。

## 常见陷阱

- **繁重审批容易被忽略**——保持审批轻量，重视审计记录。
- **模型卡与实际表现不符**——生成的模型卡反映训练时指标，生产表现可能变化。每季度刷新。
- **仅进行一次偏差审查**——数据会漂移。每季度重新执行。
- **事故期间无法查询审计日志**——在演练日测试访问能力。如果只有一人知道如何查询，就不是有效的团队审计机制。

> 译注：法规和合规要求因司法辖区、行业及时间而变化；原文所举法规并非经过本次翻译核验的最新适用要求。
