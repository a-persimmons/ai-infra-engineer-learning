# 练习 09：面向机器学习的 A/B 测试基础设施

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 08

## 目标

构建规范的机器学习 A/B 测试基础设施：分组（一致性哈希）、追踪、曝光日志、下游指标归因与统计分析。运行合成实验，演示完整流程。

## 为什么重要

行业中的许多「A/B 测试」存在缺陷：分组不一致、未测量下游指标、统计分析过于简单。可用的 A/B 测试平台将模型发布从「我们觉得它更好」变成「p=0.003，转化率提升 3.2%」。

## 要求

1. **一致性分组**：同一用户始终获得相同变体。
2. **曝光日志**：每次预测记录变体、user_id 与时间戳。
3. **下游指标归因**：通过 request_id 将预测与下游事件（点击、购买）关联。
4. **统计分析**：正确的双样本检验与置信区间。
5. **实时仪表盘**：显示实验状态、流量分配及当前显著性。
6. **样本量计算器**：开始前确定所需实验时长。

## 分步操作

### 步骤 1——样本量计算器（30 分钟）
```python
# sample_size.py
from scipy.stats import norm

def sample_size_per_arm(p_baseline, mde, alpha=0.05, power=0.80):
    """p_baseline: current conversion rate; mde: minimum detectable effect (relative)"""
    p1 = p_baseline
    p2 = p_baseline * (1 + mde)
    z_alpha = norm.ppf(1 - alpha/2)
    z_beta  = norm.ppf(power)
    p_bar = (p1 + p2) / 2
    n = ((z_alpha * (2 * p_bar * (1 - p_bar)) ** 0.5
        + z_beta * (p1*(1-p1) + p2*(1-p2)) ** 0.5) ** 2) / (p2 - p1) ** 2
    return int(n)

# Example
n = sample_size_per_arm(0.10, mde=0.05)
print(f"need ~{n:,} per arm for +5% lift at baseline 10%")
```

### 步骤 2——一致性分组（30 分钟）
```python
# assignment.py
import hashlib

def assign(user_id: str, experiment: str, weights: dict[str, float]) -> str:
    """Deterministic assignment. Same user_id+experiment always returns same variant."""
    h = int(hashlib.md5(f"{user_id}:{experiment}".encode()).hexdigest(), 16)
    p = (h % 10_000) / 10_000     # uniform [0, 1)
    cumulative = 0
    for variant, w in weights.items():
        cumulative += w
        if p < cumulative:
            return variant
    return list(weights.keys())[-1]

# Usage
v = assign("user-123", "ranker-v2-test", {"control": 0.5, "treatment": 0.5})
```

### 步骤 3——曝光日志（30 分钟）
每次预测记录：
```python
import time, uuid

def predict(user_id, features):
    request_id = uuid.uuid4().hex
    variant = assign(user_id, "ranker-v2-test", {"control": 0.5, "treatment": 0.5})
    
    if variant == "treatment":
        pred = model_v2.predict(features)
    else:
        pred = model_v1.predict(features)
    
    exposure_log.write({
        "ts": time.time(),
        "request_id": request_id,
        "user_id": user_id,
        "experiment": "ranker-v2-test",
        "variant": variant,
        "model_version": "v2" if variant == "treatment" else "v1",
    })
    return {"prediction": pred, "request_id": request_id}
```

### 步骤 4——下游事件归因（30 分钟）
用户点击或购买时，前端或应用传回 `request_id`：
```python
def record_event(user_id, event_type, request_id):
    event_log.write({
        "ts": time.time(),
        "user_id": user_id,
        "event_type": event_type,
        "request_id": request_id,  # links back to the prediction
    })
```

### 步骤 5——分析脚本（45 分钟）
```python
# analyze.py
import pandas as pd
from scipy import stats

exposures = pd.read_parquet("exposures.parquet")
events    = pd.read_parquet("events.parquet")

# Join by request_id
joined = exposures.merge(events[events.event_type == "click"][["request_id"]],
                          on="request_id", how="left", indicator=True)
joined["converted"] = (joined["_merge"] == "both").astype(int)

# Per-variant metrics
summary = joined.groupby("variant").agg(
    exposures=("user_id", "count"),
    conversions=("converted", "sum"),
    rate=("converted", "mean"),
)
print(summary)

# Two-proportion z-test
control = joined[joined.variant == "control"]
treat   = joined[joined.variant == "treatment"]
zstat, pvalue = stats.ttest_ind(control.converted, treat.converted)
ci_lo, ci_hi = stats.norm.interval(0.95,
    loc=treat.converted.mean() - control.converted.mean(),
    scale=((treat.converted.std()**2 / len(treat)) + (control.converted.std()**2 / len(control))) ** 0.5)

print(f"p-value: {pvalue:.4f}, 95% CI: [{ci_lo:.4f}, {ci_hi:.4f}]")
```

### 步骤 6——实时仪表盘（45 分钟）
Grafana 面板：
- 各变体曝光次数（实时）。
- 各变体累计转化率。
- 转化率差异及 95% 置信区间。
- 随时间变化的 p 值。
- 样本充足且 p 小于 0.01 时的「是否提前停止？」指标。

## 交付物

1. 包含六个组件的库（`abtest/`）。
2. 合成测试数据及分析输出。
3. Grafana 仪表盘 JSON。
4. `EXPERIMENT_PLAYBOOK.md`：团队如何设计与运行 A/B 测试。

## 验证

- [ ] 相同 user_id 在多次调用中始终获得相同变体。
- [ ] 样本量计算器针对不同基线返回合理数值。
- [ ] 分析得到正确的 p 值（使用已知输入与 scipy 直接计算结果核对）。
- [ ] 仪表盘显示实时数据。

## 拓展目标

- 添加**多臂老虎机**（Thompson Sampling、UCB），实现自适应流量分配。
- 添加 **CUPED** 方差缩减。
- 构建**护栏指标**系统：关键指标（错误率、延迟）退化超过 X% 时自动停止实验。

## 常见陷阱

- **每次请求随机分组**——同一用户每次调用获得不同变体，破坏比较。
- **延迟曝光导致选择偏差**——只记录产生下游事件的曝光会使结果偏斜。记录每一次曝光。
- **多重比较**——同时运行十个实验时，原文估计在 p 小于 0.05 的条件下出现假阳性的概率约为 50%。使用 Bonferroni 校正或合适的统计检验。
- **偷看结果（Peeking）**——每小时查看 p 值并在显著时停止会提高假阳性率。预先确定样本量；需要提前停止时使用序贯检验。

> 译注：在十个相互独立、零假设均为真的检验中，至少一个假阳性的概率为 1−0.95¹⁰，约 40.1%。仪表盘中的提前停止提示不能代替事先规定的序贯检验规则。
