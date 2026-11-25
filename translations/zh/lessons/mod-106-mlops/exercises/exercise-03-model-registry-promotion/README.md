# 练习 03：模型注册中心与晋升工作流

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 02（MLflow）

## 目标

实现结构化模型晋升流水线：Staging → Production，具备自动质量门禁、人工审批、可追踪的晋升事件与快速回滚。完成后，你将拥有能够接受审计的模型注册工作流。

## 为什么重要

未追踪的模型晋升（「我想是 Alice 上周更新的」）是生产机器学习事故的重要来源。结构化模型注册与晋升工作流能够防止这类事故。

## 要求

1. **三个阶段**：Development（自动注册）、Staging（通过质量门禁自动晋升）、Production（人工审批）。
2. **质量门禁**：相较当前 Production，准确率下降不得超过 0.5 个百分点；必需数据切片的指标下降不得超过 1 个百分点。
3. **审批工作流**：Slack 消息包含批准/拒绝按钮，触发状态转换。
4. **晋升事件日志**：记录每次转换的执行者、时间戳与理由。
5. **回滚 CLI**：`rollback-model <name>` 将 Production 恢复至上一活动版本。

## 分步操作

### 步骤 1——注册中心配置（15 分钟）
参照练习 02。确保已经注册模型，且至少有一个 Staging 版本。

### 步骤 2——训练后自动注册（30 分钟）
```python
# train.py
import mlflow
with mlflow.start_run() as run:
    mlflow.sklearn.log_model(model, "model", registered_model_name="recs-ranker")
# By default, this creates a new version in the registry.
```

### 步骤 3——自动质量门禁（45 分钟）
```python
# promote_to_staging.py
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()
NAME = "recs-ranker"

# Find the latest "None"-stage version (just registered)
candidate = sorted(client.search_model_versions(f"name='{NAME}'"),
                   key=lambda v: int(v.version), reverse=True)[0]
candidate_run = client.get_run(candidate.run_id)
candidate_auc = candidate_run.data.metrics["auc"]

# Find current Production
prod_versions = client.get_latest_versions(NAME, stages=["Production"])
if not prod_versions:
    # No prod yet — promote unconditionally
    client.transition_model_version_stage(NAME, candidate.version, "Staging")
    print(f"v{candidate.version} → Staging (no prior Production)")
else:
    prod_run = client.get_run(prod_versions[0].run_id)
    prod_auc = prod_run.data.metrics["auc"]

    if candidate_auc >= prod_auc - 0.005:
        client.transition_model_version_stage(NAME, candidate.version, "Staging",
                                              archive_existing_versions=True)
        print(f"v{candidate.version} → Staging (auc {candidate_auc:.4f} vs prod {prod_auc:.4f})")
    else:
        print(f"v{candidate.version} REJECTED ({candidate_auc:.4f} < {prod_auc - 0.005:.4f})")
        exit(1)
```

### 步骤 4——考虑数据切片的质量门禁（30 分钟）
将门禁扩展至按切片（国家、年龄范围、分群）统计的指标：
```python
# Run inference on a per-slice evaluation set and check each.
for slice_name, slice_acc in candidate.data.metrics.items():
    if not slice_name.startswith("auc_by_country_"): continue
    prod_slice = prod_metrics.get(slice_name, 0)
    if slice_acc < prod_slice - 0.01:
        print(f"REJECT: {slice_name} regressed: {slice_acc:.3f} vs prod {prod_slice:.3f}")
        exit(1)
```

### 步骤 5——通过 Slack 人工审批（45 分钟）
```python
# promote_to_prod.py — sends Slack approval request, blocks until response
import requests, json, time

def request_approval(model_name, version, justification):
    payload = {
        "channel": "#ml-approvals",
        "text": f"Promote {model_name} v{version} to Production?",
        "attachments": [{
            "callback_id": "promote",
            "actions": [
                {"name": "approve", "text": "Approve", "type": "button", "value": f"{model_name}:{version}:approve"},
                {"name": "reject",  "text": "Reject",  "type": "button", "value": f"{model_name}:{version}:reject"},
            ]
        }]
    }
    requests.post("https://hooks.slack.com/services/...", json=payload)

# Approver clicks → webhook → calls:
def on_approval(model_name, version, decision, actor):
    client.transition_model_version_stage(model_name, version, "Production",
                                          archive_existing_versions=True)
    client.set_model_version_tag(model_name, version, "promoted_by", actor)
    client.set_model_version_tag(model_name, version, "promoted_at", str(int(time.time())))
    audit_log(actor, model_name, version, decision)
```

真实环境中：Slack 交互 Webhook → 小型 FastAPI 服务 → MLflow 客户端调用。

### 步骤 6——审计日志（15 分钟）
```python
def audit_log(actor, model_name, version, decision, reason=""):
    with open("audit.jsonl", "a") as f:
        f.write(json.dumps({
            "ts": int(time.time()),
            "actor": actor,
            "model": model_name,
            "version": version,
            "decision": decision,
            "reason": reason,
        }) + "\n")
```
生产环境：写入数据库，或写入仅具备跨账号写权限的 S3。

### 步骤 7——回滚 CLI（15 分钟）
```python
# rollback.py
def rollback(model_name):
    versions = sorted(client.search_model_versions(f"name='{model_name}'"),
                      key=lambda v: int(v.version), reverse=True)
    archived = [v for v in versions if v.current_stage == "Archived"]
    if not archived:
        print("No archived versions to roll back to")
        return
    prev = archived[0]
    client.transition_model_version_stage(model_name, prev.version, "Production",
                                          archive_existing_versions=True)
    print(f"Rolled back {model_name} to v{prev.version}")
    audit_log("rollback-cli", model_name, prev.version, "rollback")
```

## 交付物

1. `promote_to_staging.py`——自动化。
2. `promote_to_prod.py`——通过 Slack 审批门禁。
3. `rollback.py`——CLI。
4. 包含至少五条事件的 `audit.jsonl`。
5. `MODEL_LIFECYCLE.md`：从训练至退役的流程文档。

## 验证

- [ ] 新训练模型自动注册，并在通过质量门禁后自动晋升至 Staging。
- [ ] 生成包含批准/拒绝操作的 Slack 消息。
- [ ] 批准 → 版本移至 Production；拒绝 → 不发生变化。
- [ ] 审计日志记录每次转换及执行者。
- [ ] 回滚能够正常恢复至前一版本。

## 拓展目标

- 添加 **A/B 测试晋升**：将流量按 50/50 分配给当前 Production 与 Staging，持续 N 天；Staging 胜出时自动晋升。
- 添加**影子模式**：100% 生产流量发送至 Production，同时复制 100% 流量至 Staging；不使用 Staging 的响应。
- 从 MLflow 已弃用的 Stage 迁移至 **Alias**（`@champion`、`@challenger`）。

## 常见陷阱

- **晋升时未归档**——出现两个可见的 Production 版本，下游容易混淆。
- **完全没有质量门禁**——容易意外晋升表现更差的模型。
- **直接编辑注册中心绕过审批**——生产审批人不应拥有注册中心的直接编辑权限；由审批 Bot 执行。
- **Stage 转换已弃用**——MLflow 2.9+ 推荐 Alias（`@champion`）；规划迁移。

> 译注：生产审批还应校验 Slack 请求签名、审批人身份与目标模型版本，防止伪造请求和重复执行。注册中心版本回滚不一定等于已运行服务立即切换，需要与部署系统联动。
