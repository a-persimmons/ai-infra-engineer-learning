# 模块 104：Kubernetes — 参考答案

> [模块测验](../../../lessons/mod-104-kubernetes/quizzes/module-quiz.md)的详细答案，包含解析、常见错误和课程参考。
>
> **学术诚信：** 请先尝试完成测验，再用于自学。

---

## 问题 1
**问题：** Kubernetes 控制平面中哪个组件存储集群状态？

**答案：** B) etcd

**解析：**
etcd 是分布式强一致性键值存储，是所有集群状态的唯一事实来源，包括每个 API 对象（Pod、Deployment、Secret、ConfigMap 等）的期望状态和观测状态。控制平面的所有其他组件都通过 API Server 读取和写入数据，API Server 是唯一直接与 etcd 通信的组件。如果丢失 etcd 且没有备份，就意味着集群失去记忆，因此通常将它部署为由 3 或 5 个成员组成的法定人数集群。

**常见错误：**
- 选择 A）API Server：它是所有读写操作的入口，但自身无状态，不会自行持久化数据，而是委托 etcd 存储。
- 选择 C）Scheduler 或 D）Controller Manager：二者是从 API Server 消费状态的协调循环，不负责存储状态。

**相关资料：** `lessons/mod-104-kubernetes/02-k8s-architecture.md`

---

## 问题 2
**问题：** Kubernetes 中最小的可部署单元是什么？

**答案：** C) Pod

**解析：**
Kubernetes 从不调度裸容器。Pod 是调度的原子单元，也是可以通过 API 创建的最小工作负载对象。Pod 封装一个或多个紧密耦合的容器，它们共享网络命名空间（相同 IP，可通过 localhost 通信），并可共享卷，因此始终部署在同一节点上并一起扩缩容。

**常见错误：**
- 选择 A）Container：容器运行在 Pod *内部*，Kubernetes 的调度、网络和生命周期原语操作的是 Pod，而非容器。
- 选择 B）Deployment：Deployment 是通过 ReplicaSet 管理 Pod 的上层控制器，而非最小部署单元本身。
- 选择 D）Node：Node 是承载 Pod 的工作机器，而非被部署的应用单元。

**相关资料：** `lessons/mod-104-kubernetes/03-core-resources.md`

---

## 问题 3
**问题：** 每个工作节点上的哪个组件负责与 API Server 通信？

**答案：** B) kubelet

**解析：**
kubelet 是在每个工作节点上运行的节点代理。它监听 API Server 中分配给自身节点的 Pod，指示容器运行时启动或停止容器、挂载卷、运行探针，并将节点与 Pod 状态报告给 API Server。它是控制平面期望状态与节点实际状态之间的桥梁。

**常见错误：**
- 选择 A）kube-proxy：kube-proxy 为 Service 配置节点网络（iptables/IPVS/eBPF），不管理 Pod 生命周期。
- 选择 C）Container runtime：containerd/CRI-O 实际运行容器，但 kubelet 通过 CRI 驱动它们；运行时不与 API Server 通信。
- 选择 D）etcd：etcd 属于控制平面，而非每个节点上的组件。

**相关资料：** `lessons/mod-104-kubernetes/02-k8s-architecture.md`

---

## 问题 4
**问题：** 判断题：kube-scheduler 负责决定 Pod 运行在哪个节点。

**答案：** 正确

**解析：**
调度器监听 `spec.nodeName` 为空的 Pod，并通过对集群进行过滤（predicates）与评分（priorities）选择合适节点：检查资源请求、节点选择器、污点与容忍、亲和与反亲和、拓扑分布等。选定节点后，它将绑定写回 API Server，随后由目标节点的 kubelet 接管。

**常见错误：**
- 因为认为 kubelet 选择节点而回答错误：kubelet 只处理已经由调度器绑定到自身节点的 Pod。
- 混淆调度与放置约束：nodeSelector 和亲和性规则影响调度器的决策，但做出决定的组件仍然是调度器。

**相关资料：** `lessons/mod-104-kubernetes/02-k8s-architecture.md`

---

## 问题 5
**问题：** 使用什么工具从命令行与 Kubernetes API Server 交互？

**答案：** B) kubectl

**解析：**
kubectl 是 Kubernetes API 的官方 CLI。它读取 kubeconfig 文件以获取集群端点和凭据，然后向 API Server 发送经过身份验证的 HTTPS 请求，执行 `get`、`apply`、`describe`、`logs` 和 `exec` 等操作。它是运维人员和开发人员的日常工具。

**常见错误：**
- 选择 A）kubeadm：用于初始化和升级集群，不用于日常 API 交互。
- 选择 C）kubelet：kubelet 是节点端守护进程，而非 CLI。
- 选择 D）helm：Helm 是基于 Kubernetes API 的包管理器，不能取代通用 API 访问工具。

**相关资料：** `lessons/mod-104-kubernetes/01-k8s-introduction.md`

---

## 问题 6
**问题：** 哪个控制平面组件运行 ReplicaSet 控制器和 Deployment 控制器等控制器进程？

**答案：** C) Controller Manager

**解析：**
kube-controller-manager 是承载数十个内置控制器（Deployment、ReplicaSet、Node、Job、EndpointSlice、ServiceAccount 等）的单个二进制程序。每个控制器运行一个协调循环：通过 API Server 观测当前状态，将其与 spec 中的期望状态比较，然后采取措施使二者趋于一致。将这些控制器打包到同一进程中可简化领导者选举与配置。

**常见错误：**
- 选择 A）API Server：提供 API 服务，但不运行资源的业务逻辑。
- 选择 B）Scheduler：调度器只处理 Pod 到 Node 的绑定，不处理 ReplicaSet/Deployment 的协调。
- 选择 D）kubelet：按节点运行并操作 Pod，而非上层控制器。

**相关资料：** `lessons/mod-104-kubernetes/02-k8s-architecture.md`

---

## 问题 7
**问题：** Kubernetes 中 Deployment 的主要用途是什么？

**答案：** C) 为 Pod 和 ReplicaSet 提供声明式更新

**解析：**
Deployment 允许声明期望状态（镜像、副本数、标签、策略），控制器驱动集群趋于该状态。它为每个修订版本管理一个 ReplicaSet，从而支持滚动更新、额外副本数与不可用副本数控制、暂停和恢复、历史记录及回滚到先前版本，而无需手动关闭 Pod。

**常见错误：**
- 选择 A）存储配置数据：这是 ConfigMap 与 Secret 的职责。
- 选择 B）管理有状态应用：需要稳定标识及每个 Pod 独立存储的有状态工作负载应使用 StatefulSet。
- 选择 D）将服务暴露给外部流量：暴露流量是 Service 和 Ingress 的职责，而非 Deployment。

**相关资料：** `lessons/mod-104-kubernetes/04-deployments-services.md`

---

## 问题 8
**问题：** 应使用哪种资源确保集群中的每个节点都恰好运行一个 Pod？

**答案：** C) DaemonSet

**解析：**
DaemonSet 保证每个匹配的节点上运行一个 Pod 副本，并在新节点加入集群时自动调度（节点离开时进行清理）。典型用途是节点级代理，例如日志传输器（Fluent Bit）、指标采集器（node-exporter）、CNI 插件和 GPU 设备插件。

**常见错误：**
- 选择 A）Deployment：Deployment 的目标是使一定数量的副本分布在整个集群中，而非每节点一个。
- 选择 B）StatefulSet：提供稳定标识和有序发布，但不会固定每个节点一个 Pod。
- 选择 D）ReplicaSet：只维持总计 N 个 Pod，放置位置由调度器决定。

**相关资料：** `lessons/mod-104-kubernetes/03-core-resources.md`

---

## 问题 9
**问题：** ConfigMap 与 Secret 的区别是什么？

**答案：** A) ConfigMap 用于配置；Secret 用于敏感数据（base64 编码）

**解析：**
两种对象均可将键值数据暴露给 Pod（作为环境变量、文件或 CLI 参数），但 Secret 用于密码、令牌和 TLS 密钥等敏感信息。Secret 在 etcd 中以 base64 编码保存（这是*编码*而非加密，真正保护数据需要启用静态加密），可以通过 KMS Provider 加密，并由 kubelet 采用额外的保护措施处理（tmpfs 挂载，默认不写入磁盘）。

**常见错误：**
- 选择 B）ConfigMap 更大：二者对象大小限制均约为 1 MiB，大小不是区别。
- 选择 C）Secret 访问更快：消费时没有性能差异。
- 选择 D）没有区别：忽视了 RBAC、静态加密及挂载语义对 Secret 的特殊处理。

**相关资料：** `lessons/mod-104-kubernetes/03-core-resources.md`

---

## 问题 10
**问题：** 判断题：标签是附加到 Kubernetes 对象、用于组织和选择资源的键值对。

**答案：** 正确

**解析：**
标签是附加到对象 metadata 的任意键值对。它们是 Kubernetes 将组件连接起来的机制：Service 按标签选择 Pod，Deployment 管理的 ReplicaSet 中的 Pod 带有特定标签，NetworkPolicy 根据标签选择器匹配流量。标签用于标识和分组对象，而 Annotation 承载不用于标识的元数据。

**常见错误：**
- 因为将标签与注解混淆而回答错误：注解也是键值对，但*不可被选择器选择*，用于工具元数据。
- 认为标签只供人类使用：选择器使它们成为控制平面工作的关键部分。

**相关资料：** `lessons/mod-104-kubernetes/03-core-resources.md`

---

## 问题 11
**问题：** Pod spec 中哪个字段定义容器需要的最小资源（CPU、内存）？

**答案：** B) resources.requests

**解析：**
调度器使用 `resources.requests` 寻找具有足够可用容量的节点，它也是 kubelet/cgroups 用于保障容器资源的依据。`resources.limits` 是上限，CPU 超出限制会被节流，内存超出限制会触发 OOM Kill。将 requests 设得过低会在资源压力下增加被驱逐风险；将各容器 CPU 和内存的 requests 与 limits 设为相等，可使 Pod 获得 Guaranteed QoS 类别。

**常见错误：**
- 选择 A）resources.limits：limits 是最大值，而不是最低保障。
- 选择 C）resources.minimum 或 D）resources.required：Pod spec 中不存在这两个字段。

**相关资料：** `lessons/mod-104-kubernetes/03-core-resources.md`

---

## 问题 12
**问题：** Kubernetes 中命名空间的目的是什么？

**答案：** B) 为资源提供逻辑隔离与作用域

**解析：**
命名空间将单一集群划分为虚拟子集群，使多个团队或环境能够共享集群。它们限定名称作用域（两个命名空间可以分别拥有名为 `api` 的 Service），是 RBAC 绑定、ResourceQuota、LimitRange 与 NetworkPolicy 的作用范围，并允许一次删除整个租户的对象。命名空间本身不是严格的安全边界，应结合 NetworkPolicy 与 RBAC 使用。

**常见错误：**
- 选择 A）组织网络策略：NetworkPolicy 存在于命名空间中，但命名空间并非专门为组织网络策略而设。
- 选择 C）控制 Pod 调度：调度由节点选择器、亲和性、污点与资源驱动，而非命名空间。
- 选择 D）管理存储类：StorageClass 具有集群级作用域，与命名空间无关。

**相关资料：** `lessons/mod-104-kubernetes/03-core-resources.md`

---

## 问题 13
**问题：** 哪种 Service 类型在每个节点 IP 的静态端口上暴露服务？

**答案：** B) NodePort

**解析：**
NodePort Service 从配置的范围（默认 30000–32767）分配一个端口，并在每个节点 IP 上开放该端口。到达 `<NodeIP>:<NodePort>` 的流量由 kube-proxy 转发至后端 Pod。NodePort 通常用作云 LoadBalancer 的底层连接机制，或用于前方设置了外部负载均衡器的本地集群。

**常见错误：**
- 选择 A）ClusterIP：只能从集群内部访问。
- 选择 C）LoadBalancer：底层通常也开放 NodePort，但题目具体描述的是每节点 IP 加静态端口的模式，这是 NodePort 的定义性行为。
- 选择 D）ExternalName：仅为 DNS CNAME 别名，不暴露任何端口。

**相关资料：** `lessons/mod-104-kubernetes/05-networking-ingress.md`

---

## 问题 14
**问题：** Kubernetes 中默认的 Service 类型是什么？

**答案：** C) ClusterIP

**解析：**
如果在 Service 中省略 `spec.type`，Kubernetes 会分配 ClusterIP。Service 从 Service CIDR 获得一个只在集群内可路由的稳定虚拟 IP，kube-proxy 在匹配选择器的 Endpoints/EndpointSlices 间对连接执行负载均衡。由于大多数服务间流量留在内部，它是合理的默认选择。

**常见错误：**
- 选择 A）NodePort 或 B）LoadBalancer：这些类型将 Service 暴露到外部，必须显式请求。
- 选择 D）ExternalName：它是特殊用途的 DNS 别名类型，绝不是默认类型。

**相关资料：** `lessons/mod-104-kubernetes/05-networking-ingress.md`

---

## 问题 15
**问题：** 判断题：Ingress 资源必须有 Ingress Controller 才能发挥作用。

**答案：** 正确

**解析：**
Ingress 对象是一份*配置*，即一组主机和路径路由规则。在安装 Ingress Controller（NGINX、Traefik、HAProxy、AWS ALB、GCE、Istio 等）之前，集群中没有组件会处理这些规则；控制器监听 Ingress 资源，并配置实际反向代理或云负载均衡器。GKE 和 EKS 等云发行版可能预装控制器，但它仍然必须存在。

**常见错误：**
- 因为托管集群可以直接工作而回答错误：实际上控制器已经预先安装。
- 将 Ingress 与 LoadBalancer 类型的 Service 混淆：LoadBalancer 不需要另行安装 Ingress Controller，因为云服务商集成随集群提供。

**相关资料：** `lessons/mod-104-kubernetes/05-networking-ingress.md`

---

## 问题 16
**问题：** Kubernetes Service 如何发现应该向哪些 Pod 路由流量？

**答案：** C) 通过标签选择器匹配 Pod 标签

**解析：**
Service 的 `spec.selector` 是标签匹配器。Endpoint 控制器持续监听 Pod，并将匹配且已就绪的 Pod IP 写入 EndpointSlice（或 Endpoints）对象。kube-proxy 读取它并配置节点本地负载均衡。由于绑定是动态的，Pod 可以来去，Service 会自动跟踪当前集合。

**常见错误：**
- 选择 A）按 Pod 名称：Deployment 的 Pod 名称不稳定（每次 ReplicaSet 发布具有随机后缀）。
- 选择 B）按 Pod IP 地址：Pod IP 是临时的，每次重新创建可能改变，静态 IP 连接会持续失效。
- 选择 D）仅按命名空间：命名空间限定选择器作用域，但本身不选择 Pod。

**相关资料：** `lessons/mod-104-kubernetes/05-networking-ingress.md`

---

## 问题 17
**问题：** 使用哪种 Kubernetes 资源将外部 HTTP/HTTPS 路由暴露到集群内部服务？

**答案：** B) Ingress

**解析：**
Ingress 是用于 L7（HTTP/HTTPS）路由的 API，支持基于主机及路径的规则、TLS 终止，以及扇出到多个后端 Service 的单一外部入口。这样可以使用一个外部 IP 或负载均衡器为多个微服务提供入口，而不必为每个 Service 创建 LoadBalancer。

**常见错误：**
- 选择 A）Service：Service 本身可以对外暴露流量（NodePort/LoadBalancer），但它属于 L4，不提供主机、路径路由或共享 TLS 终止。
- 选择 C）NetworkPolicy：NetworkPolicy 限制 Pod 之间的流量，不会暴露资源。
- 选择 D）Endpoint：Endpoints/EndpointSlices 是列出后端 Pod IP 的内部连接机制，不是面向用户的路由。

**相关资料：** `lessons/mod-104-kubernetes/05-networking-ingress.md`

---

## 问题 18
**问题：** 简答题：解释 LoadBalancer 类型的 Service 与 Ingress 之间的区别。

**答案：** LoadBalancer Service 通过云服务商为每个 Service 创建一个外部 L4 负载均衡器（TCP/UDP），而 Ingress 是 L7（HTTP/HTTPS）路由层，可以通过基于主机和路径的规则以及 TLS 终止，将单一外部入口分发到多个后端 Service。

**解析：**
- **LoadBalancer Service：** 云服务商集成创建一个与单个 Service 绑定的外部负载均衡器（AWS NLB/ELB、GCP LB、Azure LB）。位于 L4、与应用协议无关，简单，但每个 Service 都需承担一个负载均衡器的费用。适用于非 HTTP 协议（任意端口上的 gRPC、原始 TCP、UDP）或单个服务暴露。
- **Ingress：** API 与控制器的组合，负责配置 L7 反向代理（NGINX、Envoy、ALB）。一个外部 IP 可以按照 Host 请求头和 URL 路径路由到多个 Service，集中终止 TLS，并应用重写及认证。拥有多个 HTTP 服务时成本效益较高，但需要 Ingress Controller。
- **经验法则：** 多个 HTTP 服务共享入口时使用 Ingress；单个服务或非 HTTP 流量使用 LoadBalancer。实际中，Ingress Controller 本身通常通过 LoadBalancer Service 暴露。

**常见错误：**
- 认为“Ingress 取代 LoadBalancer”：Ingress Controller 通常由 LoadBalancer Service 提供前置入口。
- 混淆 L4 与 L7：LoadBalancer Service 无法执行跨服务的主机、路径路由或共享 TLS 终止。
- 忘记 Ingress 需要控制器才会产生任何作用。

**相关资料：** `lessons/mod-104-kubernetes/05-networking-ingress.md`

---

## 问题 19
**问题：** PersistentVolume（PV）与 PersistentVolumeClaim（PVC）之间是什么关系？

**答案：** C) PV 是集群存储；PVC 是用户对该存储的请求

**解析：**
PersistentVolume 是集群作用域的存储资源，由管理员静态配置或通过 StorageClass 动态创建，代表一份实际存储（EBS 卷、NFS 导出、Ceph RBD 镜像等）。PersistentVolumeClaim 是来自用户或 Pod 的命名空间级请求，指定大小、访问模式与 StorageClass。Kubernetes 将 PVC 绑定到匹配的 PV（或创建新 PV），Pod 挂载 PVC，从而使 Pod 与底层存储后端解耦。

**常见错误：**
- 选择 A）二者相同：它们被有意分离，以将存储消费与供应解耦。
- 选择 B）PV 是请求、PVC 是实际存储：颠倒了两者角色。
- 选择 D）PV 是云存储、PVC 是本地存储：云与本地的区别取决于卷驱动，而非 PV 与 PVC。

**相关资料：** `lessons/mod-104-kubernetes/06-storage-persistence.md`

---

## 问题 20
**问题：** 哪种 Kubernetes 资源支持 PersistentVolume 的动态供应？

**答案：** A) StorageClass

**解析：**
StorageClass 描述一类存储（供应插件、磁盘类型或 IOPS 等参数、回收策略、卷绑定模式）。当 PVC 引用 StorageClass 且不存在匹配的 PV 时，StorageClass 中指定的 CSI 驱动按需创建新卷，并将其绑定到 PVC。这不再需要管理员为每个声明预先创建 PV。

**常见错误：**
- 选择 B）VolumeClass 或 D）VolumeProvisioner：Kubernetes API 中不存在这两种资源。
- 选择 C）PersistentVolume：PV 代表*已经供应*的存储单元，本身不会触发供应。

**相关资料：** `lessons/mod-104-kubernetes/06-storage-persistence.md`

---

## 问题 21
**问题：** 判断题：ConfigMap 可以作为卷挂载，也可以作为 Pod 的环境变量暴露。

**答案：** 正确

**解析：**
ConfigMap 支持多种消费模式：单独的键可以作为 `env` 变量暴露，所有键可通过 `envFrom` 加载，或者整个 ConfigMap 可以作为卷挂载中的文件进行投影。卷挂载形式的优势是 ConfigMap 更新最终会传播到 Pod 文件，而环境变量仅在进程启动时读取一次。

**常见错误：**
- 因为只使用过环境变量形式而回答错误：两种形式都是一等支持的。
- 认为环境变量更新会实时传播：不会；必须重新启动 Pod 才能读取新值。

**相关资料：** `lessons/mod-104-kubernetes/03-core-resources.md`

---

## 问题 22
**问题：** 哪种 Kubernetes 资源专门用于部署需要稳定网络标识及持久存储的有状态应用？

**答案：** B) StatefulSet

**解析：**
StatefulSet 为每个副本提供稳定的有序标识（`web-0`、`web-1`……）、通过 Headless Service 提供稳定 DNS 名称，并使用 `volumeClaimTemplates` 供应专用 PVC，在重新调度时随 Pod 保留。它们按顺序发布和扩缩容，这对于需要稳定对等节点标识的集群数据库、消息代理及共识系统十分关键。

**常见错误：**
- 选择 A）Deployment：将 Pod 视为可互换对象，给予随机名称，没有稳定标识。
- 选择 C）DaemonSet：固定每个节点一个 Pod，并非为有状态集群工作负载设计。
- 选择 D）Job：让 Pod 运行至完成，适用于批处理而非长期运行的有状态服务。

**相关资料：** `lessons/mod-104-kubernetes/06-storage-persistence.md`

---

## 问题 23
**问题：** 如何在 Kubernetes Pod 规范中请求 GPU 资源？

**答案：** A) 将 `nvidia.com/gpu: 1` 添加到 resources.requests（或 limits）

**解析：**
GPU 通过 Device Plugin API 暴露，NVIDIA 插件公布扩展资源名 `nvidia.com/gpu`。在 `resources.limits`（以及/或 `requests`）中以整数请求整块 GPU；默认插件不支持小数 GPU，不过存在 MIG 和时间切片选项。随后调度器只会将 Pod 放置在公布了足够该资源的节点上。

```yaml
resources:
  limits:
    nvidia.com/gpu: 1
```

**常见错误：**
- 选择 B）`gpu: 1` 或 C）`cuda: 1`：不是已注册的扩展资源名，调度器不会按预期分配 GPU。
- 选择 D）GPU 自动分配：必须安装设备插件，*并且*显式请求资源。

**相关资料：** `lessons/mod-104-kubernetes/08-gpu-scheduling.md`

---

## 问题 24
**问题：** Helm 在 Kubernetes 生态系统中是什么？

**答案：** B) Kubernetes 应用的包管理器

**解析：**
Helm 将一组相关的 Kubernetes Manifest 打包成 *Chart*，即具有版本、可参数化并通过 `values.yaml` 配置的模板。`helm install`/`upgrade`/`rollback` 将渲染后的 Manifest 作为单次 Release 应用或回滚，Chart 还可以发布至仓库（OCI 注册中心、ChartMuseum）以供复用。它是共享复杂 Kubernetes 应用及进行版本管理的标准方式。

**常见错误：**
- 选择 A）监控工具：监控属于 Prometheus/Grafana/OpenTelemetry 的领域。
- 选择 C）容器运行时：运行时包括 containerd、CRI-O 等。
- 选择 D）网络插件：CNI（Calico、Cilium、Flannel）负责网络。

**相关资料：** `lessons/mod-104-kubernetes/07-helm-package-manager.md`

---

## 问题 25
**问题：** 简答题：什么是 Horizontal Pod Autoscaler（HPA），何时应将它用于 ML 工作负载？

**答案：** HPA 是根据观测到的指标（CPU、内存、自定义或外部指标）与目标值之间的关系，自动增减 Deployment、ReplicaSet 或 StatefulSet 副本数的控制器。对于 ML 工作负载，它适用于请求负载不断变化的推理服务，而非训练任务。

**解析：**
- **作用：** HPA 控制器定期查询指标（默认 CPU/内存，以及通过指标适配器 API 提供的自定义或外部指标），计算使使用量达到目标值所需的副本数，并在配置的 `minReplicas`/`maxReplicas` 范围内更新工作负载的 `replicas` 字段。
- **适合的 ML 场景：**
  - QPS、延迟或队列深度全天变化的在线推理服务：根据 CPU/GPU 利用率、请求速率或正在处理的请求数自动扩缩模型服务器 Pod。
  - 批式请求队列：通过外部指标根据队列深度扩缩工作进程。
  - 成本控制：夜间缩容至 `minReplicas`，流量激增时扩容吸收压力。
- **不适合的场景：**
  - 训练任务：使用 `Job`/`Indexed Job` 或固定并行度的专用训练 Operator。
  - 需要稳定标识的有状态系统：StatefulSet 可以作为 HPA 目标，但扩缩数据库分片或副本涉及 HPA 无法理解的正确性问题。
  - GPU 受限且瓶颈为显存的推理：HPA 应结合自定义 GPU 指标，而不是只依赖 CPU。

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

**常见错误：**
- 将 HPA（副本数）与 VPA（单个 Pod 的资源规格）或 Cluster Autoscaler（节点数）混淆。
- 对 GPU 推理使用基于 CPU 的 HPA：CPU 利用率很少是真正瓶颈，应改用自定义 GPU 或延迟指标。
- 对训练 Job 应用 HPA：Job 以完成次数为目标，而非维持稳态副本数。

**相关资料：** `lessons/mod-104-kubernetes/09-monitoring-troubleshooting.md`

---
