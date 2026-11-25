# 练习 08：模型部署策略

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 03、07；Kubernetes 集群

## 目标

实现并比较四种模型部署策略：滚动更新、蓝绿部署、金丝雀发布与影子部署。在真实模型服务上运行每种策略，测量发布耗时、发生问题时的影响范围及运维复杂度。

## 为什么重要

选择与模型风险特征不匹配的部署策略可能造成服务中断。掌握四种策略及各自适用时机，有助于更快地发布更新并缩小故障影响范围。

## 四种策略

| 策略 | 风险 | 速度 | 复杂度 |
|---|---|---|---|
| 滚动更新 | 中（部分用户立即使用新版本） | 快 | 低 |
| 蓝绿部署 | 低（快速切换、快速回滚） | 慢（需要双倍容量） | 中 |
| 金丝雀 | 低（逐步发布） | 慢 | 中 |
| 影子部署 | 原文称为零（不直接影响用户响应） | 不适用——仅验证 | 高 |

## 要求

针对每种策略实现可用的 Kubernetes 清单与脚本，用于触发发布、观察进度及回滚。

## 分步操作

### 步骤 1——配置（15 分钟）
在镜像仓库中准备 iris-api v1 和 v2 镜像。v2 包含一个故意设置但不明显的行为变化（例如始终返回类别 0）。

### 步骤 2——滚动更新（30 分钟）
```yaml
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```
```bash
kubectl set image deployment/iris-api api=iris-api:v2
kubectl rollout status deployment/iris-api
```

观察：任意时刻可能有部分 Pod 提供 v1 服务，其余提供 v2 服务。旧 Pod 逐渐排空。

### 步骤 3——蓝绿部署（45 分钟）
两个 Deployment，一个 Service。
```yaml
# Service points at app=iris-api, color=blue
apiVersion: v1
kind: Service
metadata: { name: iris-api }
spec:
  selector: { app: iris-api, color: blue }
  ports: [{ port: 80, targetPort: 8000 }]

---
# Blue deployment (v1)
spec:
  replicas: 4
  template:
    metadata: { labels: { app: iris-api, color: blue } }
    spec: { containers: [{ image: iris-api:v1, ... }] }

---
# Green deployment (v2)
spec:
  replicas: 4
  template:
    metadata: { labels: { app: iris-api, color: green } }
    spec: { containers: [{ image: iris-api:v2, ... }] }
```
以原子配置变更切换流量：
```bash
kubectl patch svc iris-api --type=merge -p '{"spec":{"selector":{"app":"iris-api","color":"green"}}}'
# Verify; if bad:
kubectl patch svc iris-api --type=merge -p '{"spec":{"selector":{"app":"iris-api","color":"blue"}}}'
```

### 步骤 4——使用 Argo Rollouts 金丝雀发布（参照 mod-106 实验 05）（60 分钟）
使用 `Rollout` 替换 Deployment：
```yaml
spec:
  replicas: 4
  strategy:
    canary:
      canaryService: iris-canary
      stableService: iris-stable
      steps:
        - setWeight: 10
        - pause: { duration: 60s }
        - setWeight: 25
        - pause: { duration: 60s }
        - analysis: { templates: [{templateName: success-rate}] }
        - setWeight: 50
        - pause: { duration: 60s }
        - setWeight: 100
```

### 步骤 5——影子部署（45 分钟）
将 100% 真实流量路由至 v1（线上服务），同时复制 100% 请求至 v2（影子版本）。比较预测结果，但只向用户返回 v1 响应。

通过 Python 代理实现的草图：
```python
@app.post("/predict")
async def predict(req: Request):
    body = await req.json()
    primary, shadow = await asyncio.gather(
        forward_to("http://iris-v1:8000/predict", body),
        forward_to("http://iris-v2:8000/predict", body, ignore_errors=True),
    )
    # Log shadow result for offline comparison
    metrics_log(body, primary, shadow)
    return primary
```
也可以使用 Istio 流量镜像：
```yaml
http:
  - route:
      - destination: { host: iris-api, subset: v1 }
        weight: 100
    mirror: { host: iris-api, subset: v2 }
    mirror_percentage: { value: 100 }
```

### 步骤 6——测量（30 分钟）
针对每种策略，记录：
- 从 `apply` 至「完成发布」的耗时。
- v2 存在缺陷时的影响范围：发现 Bug 前有多少真实用户受到影响。
- 回滚耗时。
- 运维复杂度（YAML 行数、涉及的服务）。

填写 `STRATEGY_COMPARISON.md`。

## 交付物

1. 四种策略的可用清单。
2. 各策略的回滚流程文档。
3. 包含实测数据的 `STRATEGY_COMPARISON.md`。
4. `WHEN_TO_USE.md`：决策树（高风险模型 → 先影子部署再金丝雀；常规 Bug 修复 → 滚动更新等）。

## 验证

- [ ] 四种策略在你的集群上均能端到端运行。
- [ ] 从用户视角看，蓝绿切换近乎瞬时。
- [ ] 金丝雀在每个步骤自动暂停。
- [ ] 影子部署记录两种预测以供离线比较，且不影响用户。
- [ ] 已验证每种策略的回滚流程。

## 拓展目标

- 根据实时 SLO 指标添加**自动回滚**（参照 Argo Rollouts AnalysisTemplate）。
- 实现**多区域**蓝绿部署，使用 DNS 切换流量。
- 添加**持久化影子比较**：每周生成报告，展示 v2 与 v1 存在分歧的位置。

## 常见陷阱

- **滚动更新设置 `maxUnavailable > 0`**——发布期间容量可能短暂下降，用户延迟升高。
- **有状态工作负载使用蓝绿部署**——双数据库？Schema 迁移？复杂度很高。蓝绿部署宜优先用于无状态应用。
- **金丝雀没有基于指标的门禁**——只是慢速滚动发布，需要分析机制，否则增加了无益的复杂度。
- **影子版本影响 v1 性能**——影子请求共享资源；限制并发，并在 v2 变慢时进行熔断。

> 译注：影子部署不是零风险，仍需考虑资源竞争、隐私及写操作副作用；蓝绿切换和回滚速度也受路由传播、连接与状态兼容性影响。
