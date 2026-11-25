# 练习 10：端到端迷你项目（模块 101 综合项目）

**时长：** 6 小时
**难度：** 入门进阶
**前置条件：** 模块 101 全部此前练习

## 目标

将练习 01–09 的全部内容整合为一个连贯的迷你平台：

1. **云环境初始化脚本**（练习 07）启动沙箱环境。
2. **面向生产的模型 API**（练习 08）在本地 Docker 中运行。
3. **测试套件**（练习 09）作为 CI 工作流的门禁。
4. 将镜像**推送**至云产物镜像仓库。
5. **kind 集群**运行相同镜像，配置 Service 与 HPA。
6. **Prometheus + Grafana** 抓取指标并展示部署仪表盘。
7. **简单负载测试**验证端到端流程。

交付一个单独的仓库，使用 make up 生成以上全部内容，使用 make down 清理。这是模块 101 的「我能够交付服务」能力证明。

## 为什么重要

此前每项练习分别产生一个组件，本练习负责组装。能够掌握完整技术栈——从云账号到运行中的 Pod，再到可用的仪表盘——的工程师，能够更快解决跨层问题（原文举例为三倍）。

## 要求

### 仓库布局

```
mini-platform/
├── README.md                   # this overview, with the demo flow
├── Makefile                    # the orchestration entry point
├── infra/
│   ├── onboard.sh              # wraps `cloud-onboard init`
│   └── kind-config.yaml
├── app/                        # from exercise 08
│   ├── src/model_serve/
│   ├── tests/
│   ├── Dockerfile
│   └── docker-compose.yml
├── deploy/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── servicemonitor.yaml
├── monitoring/
│   ├── values.yaml             # kube-prometheus-stack overrides
│   └── grafana-dashboard.json
└── loadtest/
    ├── locustfile.py
    └── README.md
```

### Make 目标

```text
make help          # print available targets
make up            # full bring-up: cluster, prom stack, app, port-forwards
make test          # run app tests (pytest)
make image         # build + push image to your cloud registry
make load          # run locust against the deployed service
make dashboard     # open grafana
make down          # destroy everything (cluster, cloud sandbox, local images)
```

### make up 必须依次产生：

1. 正在运行的 kind 集群。
2. 集群中安装的 NGINX Ingress Controller。
3. 已安装的 kube-prometheus-stack。
4. 已部署的模型 API（两个副本 + HPA + ServiceMonitor）。
5. 端口转发：应用 :8080、Grafana :3000、Prometheus :9090。
6. 最终打印包含全部 URL 的摘要。

端到端目标：**从 make up 到可用演示耗时低于五分钟**。

## 分步操作

### 步骤 1——编排组装过程（45 分钟）
编写具有正确依赖关系的 Makefile（make up 依赖 make image）。
在嵌入的 Shell 中使用 set -euo pipefail。

### 步骤 2——集成云环境初始化（30 分钟）
封装练习 07 中的 cloud-onboard CLI。添加 Makefile 目标，运行工具并 source 生成的 .env。

### 步骤 3——应用测试门禁（15 分钟）
make image 必须依赖 make test。推送未经测试的代码属于流程错误。

### 步骤 4——集群与 Ingress（45 分钟）
使用带额外端口映射的 kind（参照 mod-101 实验 03）。安装 NGINX Ingress：
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/kind/deploy.yaml
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=controller -n ingress-nginx --timeout=2m
```

### 步骤 5——应用部署（45 分钟）
使用上述清单。采用 git rev-parse --short HEAD 生成镜像标签，使每个提交对应的镜像拥有可追踪的标签。

### 步骤 6——可观测性（60 分钟）
通过 Helm 安装 kube-prometheus-stack（参照 mod-101 实验 05）。为应用创建 ServiceMonitor。导入 Grafana 仪表盘 JSON（自行编写或改编 mod-101 实验 05 的版本）。

### 步骤 7——负载测试（30 分钟）
编写 Locustfile，以可控负载访问 /v1/predict 和 /v1/predict/batch。向终端打印吞吐量及延迟分位数。

### 步骤 8——演示流程（30 分钟）
在 README 中编写演示脚本：
```text
1. make up                 # 4 min
2. open http://localhost:3000   # grafana dashboard
3. make load               # 30s of load
4. observe HPA scaling pods
5. make down               # 1 min
```

### 步骤 9——完善（45 分钟）
- make help 列出目标及描述。
- 保证幂等性——重新执行 make up 不会破坏环境。
- 失败时提供清晰的错误消息及下一条可尝试的命令。
- README 包含施加负载后 Grafana 仪表盘的截图。

## 交付物

1. 采用上述布局的单个仓库，在安装 Docker、kind、kubectl、helm、python3 后可以在新电脑上运行（原文预计五分钟完成准备）。
2. README.md 包含演示流程及三至五张截图。
3. 每个 PR 上运行 make test 的 CI 工作流。
4. RUNBOOK.md，涵盖常见故障的恢复方法（集群无法启动、镜像拉取失败、HPA 不扩缩容）。

## 验证

- [ ] 在全新检出的仓库上，make up 在六分钟内成功（相对目标允许一分钟余量）。
- [ ] make up 后，curl http://localhost:8080/v1/predict ... 返回有效预测。
- [ ] make load 产生至少 200 req/s；Grafana 显示流量峰值，HPA 将 Pod 从两个扩容至至少四个。
- [ ] make down 不留下本练习的孤立资源（通过 docker ps -a、kubectl get all 与云账号检查）。
- [ ] CI 在 PR 上运行 make test。
- [ ] README 截图真实（在自己的验证过程中采集）。

## 拓展目标

- **使用真实云集群替换 kind**（通过 Terraform 供应 EKS / GKE / AKS）。
- **添加特征存储**（由独立进程填充 Redis 缓存），演示 p95 延迟改善。
- **添加金丝雀部署**，使用 Argo Rollouts（mod-106 实验 05）——make canary 发布 v2 镜像，指标退化时自动回滚。
- **添加合成正确性监控**，每分钟使用已知输入调用 /v1/predict，响应意外变化时发出告警（漂移金丝雀）。

## 常见陷阱

- **kind 中看不到镜像**——忘记 kind load docker-image。在 make up 中的 make image 之后添加此命令。
- **HPA 从不扩缩容**——未安装 metrics-server，或者 Deployment 缺少资源请求配置。
- **make down 未销毁云资源**——可能产生实际费用。应调用 cloud-onboard destroy 与 terraform destroy 清理本练习所创建的资源。
- **超出五分钟目标**——kube-prometheus-stack 通常是最慢的一步。预拉取镜像：在宿主机上 docker pull，再在集群创建后 kind load。
- **演示第一次可用，第二次失败**——此前运行在云账号中遗留状态。至少测试三次完整的 make down → make up 循环。

## 参考答案

engineer-solutions 仓库中的参考实现。**先自行构建，再查看答案**——整合工作本身就是学习目标。

---

## 本练习的位置

完成练习 10，意味着你已经端到端展示了课程后续内容所依赖的核心能力。模块 102–110 将进一步深入云原生基础能力、MLOps、GPU、监控、IaC 与 LLM 专用模式。综合项目（项目 101–103）将这些能力扩展至生产规模。

> 译注：Make 默认 Shell 不一定支持 pipefail，可显式选择 Bash。Git 短 SHA 不能区分未提交的代码变更。所有资源清理应限定在本实验的隔离范围内；五分钟启动与吞吐量目标需以实际环境验证。
