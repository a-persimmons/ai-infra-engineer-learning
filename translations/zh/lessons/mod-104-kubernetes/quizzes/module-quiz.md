# 模块 04 测验：Kubernetes 基础

**总题数：** 25  
**及格：** 70%（18/25 题）  
**时间限制：** 50 分钟  
**类型：** 混合（选择、判断、简答）

---

## 第一部分：Kubernetes 架构（1–6）

### 第 1 题

Kubernetes 控制平面中哪个组件存储集群状态？

A) API Server  
B) etcd  
C) Scheduler  
D) Controller Manager

<details>
<summary>答案</summary>

B) etcd——分布式键值存储，保存集群数据，包括配置与状态。

</details>

---

### 第 2 题

Kubernetes 中最小可部署单元是什么？

A) Container  
B) Deployment  
C) Pod  
D) Node

<details>
<summary>答案</summary>

C) Pod——可以包含一个或多个共享网络及存储的容器。

</details>

---

### 第 3 题

每个工作节点上负责与 API Server 通信的是哪个组件？

A) kube-proxy  
B) kubelet  
C) Container Runtime  
D) etcd

<details>
<summary>答案</summary>

B) kubelet——节点代理，确保 Pod 内容器按规范运行。

</details>

---

### 第 4 题

判断题：kube-scheduler 负责决定 Pod 在哪个节点运行。

<details>
<summary>答案</summary>

正确——Scheduler 监听尚未分配节点的新 Pod，根据资源需求与约束选择节点。

</details>

---

### 第 5 题

使用哪个工具从命令行与 Kubernetes API Server 交互？

A) kubeadm  
B) kubectl  
C) kubelet  
D) helm

<details>
<summary>答案</summary>

B) kubectl——用于对 Kubernetes 集群执行命令的命令行工具。

</details>

---

### 第 6 题

哪个控制平面组件运行 ReplicaSet、Deployment 等控制器？

A) API Server  
B) Scheduler  
C) Controller Manager  
D) kubelet

<details>
<summary>答案</summary>

C) Controller Manager（kube-controller-manager）——运行协调集群状态的各种控制器。

</details>

---

## 第二部分：核心资源（7–12）

### 第 7 题

Kubernetes Deployment 的主要用途是什么？

A) 保存配置数据  
B) 管理有状态应用  
C) 为 Pod 与 ReplicaSet 提供声明式更新  
D) 将服务暴露给外部流量

<details>
<summary>答案</summary>

C) 为 Pod 和 ReplicaSet 提供声明式更新——Deployment 管理 Pod 期望状态，支持滚动更新及回滚。

</details>

---

### 第 8 题

要保证集群每个节点运行一个 Pod，应使用哪个资源类型？

A) Deployment  
B) StatefulSet  
C) DaemonSet  
D) ReplicaSet

<details>
<summary>答案</summary>

C) DaemonSet——确保全部或指定节点运行一份 Pod，常用于日志代理与监控。

</details>

---

### 第 9 题

ConfigMap 与 Secret 的区别是什么？

A) ConfigMap 用于配置，Secret 用于敏感数据（Base64 编码）  
B) ConfigMap 比 Secret 大  
C) Secret 访问更快  
D) 没有区别

<details>
<summary>答案</summary>

A) ConfigMap 用于配置，Secret 用于敏感数据（Base64 编码）——Secret 专门设计用于敏感信息，Kubernetes 对其进行更谨慎的处理。

</details>

---

### 第 10 题

判断题：Label 是附加到 Kubernetes 对象的键值对，用于组织及选择资源。

<details>
<summary>答案</summary>

正确——Label 使用户能够将组织结构映射到系统对象，Selector 用于识别一组对象。

</details>

---

### 第 11 题

Pod Spec 中哪个字段定义容器所需最低资源（CPU、内存）？

A) resources.limits  
B) resources.requests  
C) resources.minimum  
D) resources.required

<details>
<summary>答案</summary>

B) resources.requests——Request 定义调度所需资源，Limit 定义上限。

</details>

---

### 第 12 题

Kubernetes Namespace 的作用是什么？

A) 组织网络策略  
B) 提供资源逻辑隔离与作用域  
C) 控制 Pod 调度  
D) 管理 StorageClass

<details>
<summary>答案</summary>

B) 提供逻辑隔离与作用域——Namespace 支持在多个用户/团队之间划分集群资源。

</details>

---

## 第三部分：网络与 Service（13–18）

### 第 13 题

哪种 Service 在每个节点 IP 的固定端口暴露服务？

A) ClusterIP  
B) NodePort  
C) LoadBalancer  
D) ExternalName

<details>
<summary>答案</summary>

B) NodePort——通过 `<NodeIP>:<NodePort>` 从集群外部访问服务。

</details>

---

### 第 14 题

Kubernetes 默认 Service 类型是什么？

A) NodePort  
B) LoadBalancer  
C) ClusterIP  
D) ExternalName

<details>
<summary>答案</summary>

C) ClusterIP——在集群内部 IP 上暴露服务，通常仅集群内部可访问。

</details>

---

### 第 15 题

判断题：Ingress 资源正常工作需要 Ingress Controller。

<details>
<summary>答案</summary>

正确——Ingress 定义路由规则，但需要 Ingress Controller（如 nginx、Traefik）实现规则。

</details>

---

### 第 16 题

Kubernetes Service 如何发现应路由流量的 Pod？

A) 根据 Pod 名称  
B) 根据 Pod IP 地址  
C) 根据与 Pod Label 匹配的 Label Selector  
D) 仅根据 Namespace

<details>
<summary>答案</summary>

C) 通过匹配 Pod Label 的 Selector——Service 使用 Selector 动态查找匹配的 Pod。

</details>

---

### 第 17 题

使用哪个 Kubernetes 资源将外部 HTTP/HTTPS 路由暴露至集群内部服务？

A) Service  
B) Ingress  
C) NetworkPolicy  
D) Endpoint

<details>
<summary>答案</summary>

B) Ingress——管理服务的外部访问，通常为 HTTP/HTTPS，并可提供 TLS 终止、基于域名的虚拟主机等功能。

</details>

---

### 第 18 题

简答：解释 LoadBalancer 类型 Service 与 Ingress 的区别。

<details>
<summary>参考答案</summary>

**LoadBalancer Service：**
- 创建云负载均衡器（AWS ELB、GCP Load Balancer 等）。
- 原文示例每个 Service 一个负载均衡器，服务多时成本较高。
- 工作在 L4（TCP/UDP）。
- 暴露单个服务简单直接。

**Ingress：**
- 多个服务的统一入口（HTTP/HTTPS 路由）。
- 工作于 L7（应用层）。
- 多个服务共享一个负载均衡器，具有成本效益。
- 支持基于路径、主机的路由及 TLS 终止。
- 需要安装 Ingress Controller。

**场景：**
- LoadBalancer：单个服务需外部访问，或使用非 HTTP 协议。
- Ingress：多个 HTTP/HTTPS 服务，需要路径路由或 TLS 终止。

（核心差异即可。）

</details>

---

## 第四部分：存储与配置（19–22）

### 第 19 题

PersistentVolume（PV）与 PersistentVolumeClaim（PVC）是什么关系？

A) 相同  
B) PV 是存储请求，PVC 是实际存储  
C) PV 是集群存储，PVC 是用户对存储的请求  
D) PV 是云存储，PVC 是本地存储

<details>
<summary>答案</summary>

C) PV 是集群存储（由管理员供应，也可动态供应）；PVC 是用户的存储请求，根据存储需求绑定 PV。

</details>

---

### 第 20 题

哪个 Kubernetes 资源支持动态供应 PV？

A) StorageClass  
B) VolumeClass  
C) PersistentVolume  
D) VolumeProvisioner

<details>
<summary>答案</summary>

A) StorageClass——定义具有不同属性的存储类别（如 SSD 与 HDD、不同性能层级）。

</details>

---

### 第 21 题

判断题：ConfigMap 可以作为数据卷挂载或在 Pod 中暴露为环境变量。

<details>
<summary>答案</summary>

正确——两种方式均可使用，灵活地向应用提供配置。

</details>

---

### 第 22 题

哪个 Kubernetes 资源用于部署需要稳定网络标识与持久化存储的有状态应用？

A) Deployment  
B) StatefulSet  
C) DaemonSet  
D) Job

<details>
<summary>答案</summary>

B) StatefulSet——管理具有唯一网络标识、稳定持久存储及有序部署/扩缩容的有状态应用。

</details>

---

## 第五部分：GPU 与进阶主题（23–25）

### 第 23 题

如何在 Kubernetes Pod Spec 中请求 GPU？

A) 在 resources.requests 中添加 `nvidia.com/gpu: 1`  
B) 在 resources.requests 中添加 `gpu: 1`  
C) 在 resources.requests 中添加 `cuda: 1`  
D) GPU 自动分配

<details>
<summary>答案</summary>

A) 原文答案：在 resources.requests（或 limits）中添加 `nvidia.com/gpu: 1`。示例：
```yaml
resources:
  limits:
    nvidia.com/gpu: 1
```

</details>

---

### 第 24 题

Kubernetes 生态中的 Helm 是什么？

A) 监控工具  
B) Kubernetes 应用包管理器  
C) 容器运行时  
D) 网络插件

<details>
<summary>答案</summary>

B) Kubernetes 应用包管理器——使用 Chart 定义、安装及升级 Kubernetes 应用。

</details>

---

### 第 25 题

简答：什么是 HPA（Horizontal Pod Autoscaler），何时用于 ML 工作负载？

<details>
<summary>参考答案</summary>

**HPA：**
- 根据观测指标自动调整 Deployment/ReplicaSet 等资源的 Pod 数量。
- 监控 CPU 利用率、内存或自定义指标。
- 增加/减少副本以匹配需求。

**ML 工作负载场景：**
1. **推理服务：** 根据请求速率或延迟扩缩容。
2. **可变流量：** 自动处理流量高峰（例如高峰 10 个 Pod，低峰 2 个）。
3. **成本优化：** 低需求时减少 Pod 以节省费用。

**示例：**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-model-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-model
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**原文建议不用于：**
- 训练作业（采用固定副本或 Job）。
- 需要稳定 Pod 标识的有状态应用。

（核心概念与应用示例即可。）

</details>

---

## 评分指南

- **23–25 题正确（92–100%）：** 优秀，掌握 Kubernetes 基础。
- **20–22 题正确（80–88%）：** 很好，理解扎实，少量不足。
- **18–19 题正确（72–76%）：** 及格，复习薄弱领域。
- **低于 18 题（低于 72%）：** 未通过，复习后重测。

### 下一步

**通过（达到原文 70%）：**
1. 复习错题。
2. 完成模块 04 实践练习。
3. 完成实践考核（生产 Kubernetes 部署）。
4. 进入模块 05：数据管道与编排。

**未通过：**
1. 复习错题对应讲义。
2. 使用 kubectl 与本地集群实践。
3. 部署示例应用并排查问题。
4. 补充学习后重测。

## 答案汇总

1. B（etcd）
2. C（Pod）
3. B（kubelet）
4. 正确
5. B（kubectl）
6. C（Controller Manager）
7. C（声明式更新）
8. C（DaemonSet）
9. A（配置与敏感数据）
10. 正确
11. B（resources.requests）
12. B（逻辑隔离）
13. B（NodePort）
14. C（ClusterIP）
15. 正确
16. C（Label Selector）
17. B（Ingress）
18. 简答
19. C（PV 存储、PVC 请求）
20. A（StorageClass）
21. 正确
22. B（StatefulSet）
23. A（nvidia.com/gpu）
24. B（包管理器）
25. 简答

## 重点复习概念

### 第一部分（架构）
- 复习第 02 课：Kubernetes 架构。
- 探索集群：`kubectl get nodes`、`kubectl get componentstatuses`。
- 理解：控制平面、工作节点、etcd、Scheduler、Controller Manager。

### 第二部分（核心资源）
- 复习第 03 课：核心资源；第 04 课：Deployment 与 Service。
- 实践：创建 Deployment、调整副本、使用 ConfigMap/Secret。
- 理解：Pod 生命周期、Label 与 Selector、资源 Request/Limit。

### 第三部分（网络）
- 复习第 05 课：网络与 Ingress。
- 实践：创建 Service（ClusterIP、NodePort），搭建 Ingress。
- 理解：Service 类型、Selector、Ingress 路由、DNS。

### 第四部分（存储）
- 复习第 06 课：存储与持久化。
- 实践：创建 PVC、在 Pod 中使用数据卷、部署 StatefulSet。
- 理解：PV/PVC 绑定、StorageClass、数据卷类型。

### 第五部分（进阶）
- 复习第 08 课：Helm 包管理器；第 09 课：GPU 调度；原文所列第 10 课：监控与可观测性。
- 实践：安装 Helm Chart、请求 GPU 资源、搭建 HPA。
- 理解：Helm Chart、GPU 设备插件、自动扩缩容。

## 实践应用

通过测验后，展示以下技能：
1. **部署多层 ML 应用**（前端、模型服务器、数据库）。
2. **配置 HPA**，基于 CPU/内存自动扩缩容。
3. **搭建 Ingress**，使用 TLS 实现外部访问。
4. **使用 Helm** 打包及部署应用。
5. **请求 GPU 资源**并部署 GPU 加速工作负载。
6. **实现监控**，使用 kubectl top 与基础 Prometheus。
7. **记录部署过程**，在 README 中提供故障排查指南。

## 额外实践

### 动手实验
- [Kubernetes 基础教程](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [Play with Kubernetes](https://labs.play-with-k8s.com/)——免费浏览器 Kubernetes 实验环境。
- [Katacoda Kubernetes 场景](https://www.katacoda.com/courses/kubernetes)——原文交互教程。

### 认证准备
- [Certified Kubernetes Application Developer（CKAD）](https://www.cncf.io/certification/ckad/)——侧重应用部署。
- [Certified Kubernetes Administrator（CKA）](https://www.cncf.io/certification/cka/)——侧重集群管理。

**复习时间：** 30–40 分钟。

**准备进入模块 05 了吗？** 达到及格分数并完成练习后，可以继续学习数据管道！

> 译注：Secret 的 Base64 不是加密，Namespace 本身也不提供完整安全隔离。GPU 扩展资源通常通过 limits 指定，若同时配置 requests 和 limits 则须相等；第 23 题原答案不够严谨。HPA 可支持某些 StatefulSet，需评估状态管理。kubectl get componentstatuses 已弃用，Katacoda 为原文历史资源；链接未逐一核实。原文模块 104 的讲义实际共 9 课。代码块保持原样。
