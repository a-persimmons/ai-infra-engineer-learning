# 练习 09：事故响应 Game Day 演练

**时长：** 3 小时
**难度：** 中级
**前置条件：** 全部此前练习（将使用此前构建的所有内容）

## 目标

开展结构化 Game Day：在类生产测试环境中故意注入故障，练习事故响应工作流。测量 MTTD（平均发现时间）、MTTR（平均恢复时间），并产出具体、可行动的事后复盘。

## 为什么重要

真实事故较少发生，但压力很大。Game Day 通过演练形成操作经验，并发现可观测性缺口，而不必打扰正常生产值班。原文认为每季度演练的团队在真实事故中的 MTTR 可缩短 30–50%。

## 要求

在运行中的 iris-api 实验技术栈（包含此前的监控、告警、链路追踪、日志）注入三类事故。针对每项：

1. 注入故障（见下文）。
2. 记录告警触发前的时间（检测时间，用于 MTTD）。
3. 记录识别根因前的时间（TTI，识别耗时）。
4. 记录恢复服务前的时间（恢复时间，用于 MTTR）。
5. 编写事后复盘（模板见下文）。

## 三类事故

### 事故 A：部署后延迟退化
**注入：** 部署新镜像（iris-api:0.3-slow），为每次预测增加 300ms 人工 sleep。

**预期检测：** SlowResponses 警告在约十分钟内触发。

**练习技能：** 识别近期部署是原因；回滚流程。

### 事故 B：下游依赖引起级联故障
**注入：** 通过 NetworkPolicy 阻断 Feature Store 相关网络通信。Backend 在特征查询时超时，返回 504。

**预期检测：** HighErrorRate 严重告警。

**练习技能：** Trace 关联（通过单条 Trace 看出时间消耗的位置），区分「我们故障了」与「下游故障了」。

### 事故 C：资源耗尽
**注入：** 服务仍在处理流量时将 iris-api 的内存限制降至 256Mi。预计 Pod 在约一分钟内被 OOMKilled。

**预期检测：** TargetDown 与重启计数告警。

**练习技能：** 读取 OOMKilled 状态，理解 Pod 级与节点级故障的区别，决定提高限制还是修复内存泄漏。

## 分步操作

### 步骤 1——准备（30 分钟）
- 确保技术栈健康：Prometheus、Grafana、Loki、Tempo、Alertmanager 与 iris-api 均为绿色。
- 打开运行手册。
- 指定记录者（你自己，使用计时器）与响应者（你自己，进行调试）。

### 步骤 2——事故 A：延迟退化（45 分钟）
1. 记录当前时间。部署 iris-api:0.3-slow。
2. 告警触发时记录检测耗时。
3. 识别原因：打开 Grafana → 延迟仪表盘 → 发现峰值 → 关联部署事件 → 查看相关 Pod（发布历史）→ 阅读日志 → 使用 Trace 确认假设。记录 TTI。
4. 恢复：执行 `kubectl rollout undo`。等待延迟恢复正常。记录恢复耗时。

### 步骤 3——事故 B：下游阻断（45 分钟）
1. 应用 NetworkPolicy。
2. 观察 HighErrorRate 告警。
3. 打开 Tempo，找到失败 Trace，查看 Feature Store 调用相关 504，识别其为依赖故障源。
4. 从 iris-api Pod 执行 `kubectl exec` 验证：`curl -v http://feature-store/health` → 连接失败。
5. 移除 NetworkPolicy，验证恢复。

### 步骤 4——事故 C：资源耗尽（45 分钟）
1. 修改 Deployment 的 `resources.limits.memory: 256Mi`。
2. 观察 Pod 重启。
3. 执行 `kubectl get pod -o yaml` → 在 lastState 中查看 OOMKilled。
4. 决定：恢复限制还是调查内存泄漏？本实验中恢复至 1Gi 并确认服务恢复。

### 步骤 5——编写事后复盘（每项 30 分钟）
为每项事故填写：
```markdown
## Incident A: Latency regression from v0.3 deploy

**Date:** 2026-MM-DD
**Duration:** [MTTR minutes]
**Severity:** 2 (degraded service)

### Summary (1 sentence)
A deploy of iris-api v0.3 introduced an unintentional 300ms artificial delay in
every prediction, causing latency SLO violation.

### Timeline
- 14:00 — v0.3 deployed
- 14:08 — `SlowResponses` warning fires (MTTD 8 min)
- 14:09 — Engineer acknowledges, opens dashboard
- 14:14 — Identifies recent deploy as cause via rollout history (TTI 14 min)
- 14:15 — Initiates rollback to v0.2
- 14:18 — Rollout complete, latency normalized (MTTR 18 min)

### Root Cause
v0.3 inadvertently included a debug `time.sleep(0.3)` left over from local
load-test simulation.

### Detection
- What worked: latency dashboard + recent-deploy annotation overlay
- What didn't: no canary deploy that would have caught this at 1% rollout

### Recovery
- Rollback via `kubectl rollout undo` — standard procedure, worked as expected

### Action items (with owner + date)
- AI-1 (alice, by 2026-MM-DD): Enforce canary deploy via Argo Rollouts; new code
  goes to 10% of traffic for 5 minutes with auto-rollback on SLO breach.
- AI-2 (bob, by 2026-MM-DD): Add a pre-commit hook that grep -i "sleep" in
  inference paths and warns.
- AI-3 (alice, by 2026-MM-DD): Reduce MTTD by lowering `SlowResponses` for
  clause from 10m to 3m.
```

## 交付物

1. 每项事故的 MTTD/TTI/MTTR 计时数据。
2. 按上述模板编写的三份事后复盘。
3. `GAMEDAY_SUMMARY.md`：从全部事故中识别的五项主要改进，按优先级排列。
4. 一页纸 `RUNBOOK_UPDATES.md`，记录演练产生的具体运行手册变更。

## 验证

- [ ] 全部三项事故均在目标检测时间内被监控发现。
- [ ] 每项 TTI 均低于 15 分钟（否则存在需要弥补的可观测性缺口）。
- [ ] 全部复盘均有明确行动项、责任人与日期。
- [ ] 宣布练习完成前，至少执行一项行动项。

## 拓展目标

- 添加**事故 D：整个云区域故障**（原文建议通过 NetworkPolicy 隔离整个可用区进行模拟）。
- 在**类生产预发布环境**中开展 Game Day，使用真实值班轮换。
- 使用 **Chaos Mesh** 或 **Gremlin** 安排周期性小型故障演练。

## 常见陷阱

- **工程完美主义**——演练期间会发现许多待修事项。记录下来，不要试图在演练中全部修复。
- **跳过复盘**——原文认为复盘占演练价值的 70%。没有复盘的演练只是一场故障。
- **归咎个人**——复盘应无责。「Alice 破坏了生产环境」应改为「部署流程允许未经测试的代码路径通过」。
- **行动项没有责任人**——模糊行动项难以完成。始终指定责任人和日期。

> 译注：仅在获得授权、可恢复的隔离环境中注入故障。NetworkPolicy 拒绝流量通常表现为超时，不一定是 connection refused；隔离可用区也不等同于模拟整个云区域故障。单次事故耗时不是均值，应对多次演练结果聚合计算 MTTD/MTTR。
