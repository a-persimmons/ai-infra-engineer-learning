# 练习 05：Pulumi 高级模式

**时长：** 3 小时
**难度：** 中级
**前置条件：** 实验 04（Pulumi 导论）

## 目标

利用 Pulumi 在编程语言方面的优势：依据数据动态生成资源、通过 ComponentResource 实现可复用抽象、跨 Stack 引用，以及使用 CrossGuard 实现策略即代码。

## 为什么重要

Pulumi 相较 Terraform 的价值在于使用真正的 Python/TypeScript：循环、条件、类和包。以符合语言习惯的方式使用 Pulumi，原文认为基础设施代码可以比等价 Terraform 少 30–50%。

## 要求

1. **动态生成**：读取包含 N 个租户的 YAML 配置，创建 N 个 Namespace、配额与 ResourceQuota，无需手动重复编写。
2. **ComponentResource**：将「机器学习服务技术栈」（Deployment + Service + Ingress + HPA + ServiceMonitor）封装为单一可复用类型。
3. **跨 Stack 引用**：网络 Stack 输出 VPC ID，应用 Stack 使用该值。
4. **策略即代码**：在 preview 时执行 `aws:rds-must-encrypt`、`k8s:no-privileged-containers`。
5. **Stack 输出作为各层之间的「API」**。

## 分步操作

### 步骤 1——项目初始化（15 分钟）
```bash
mkdir pulumi-advanced && cd pulumi-advanced
pulumi new aws-python -y --name pulumi-advanced
```

### 步骤 2——动态租户（30 分钟）
```python
import yaml, pulumi
from pulumi_kubernetes.core.v1 import Namespace, ResourceQuota

tenants = yaml.safe_load(open("tenants.yaml"))

for t in tenants:
    ns = Namespace(t["name"], metadata={"name": t["name"], "labels": {"tier": t["tier"]}})
    ResourceQuota(f"{t['name']}-quota",
        metadata={"namespace": ns.metadata["name"]},
        spec={"hard": t["quota"]},
        opts=pulumi.ResourceOptions(depends_on=[ns]),
    )
```

```yaml
# tenants.yaml
- { name: team-a, tier: gold,   quota: { requests.cpu: "10",  requests.memory: 20Gi, pods: "30" }}
- { name: team-b, tier: silver, quota: { requests.cpu: "5",   requests.memory: 10Gi, pods: "15" }}
- { name: team-c, tier: bronze, quota: { requests.cpu: "2",   requests.memory: 4Gi,  pods: "5"  }}
```

通过编辑 YAML 添加租户，无需新增代码。

### 步骤 3——ComponentResource（45 分钟）
```python
class MLService(pulumi.ComponentResource):
    def __init__(self, name, *, image, replicas=2, hpa_max=10, opts=None):
        super().__init__("custom:ml:Service", name, None, opts)
        child_opts = pulumi.ResourceOptions(parent=self)
        
        self.deployment = Deployment(name, ..., opts=child_opts)
        self.service    = Service(name, ..., opts=child_opts)
        self.ingress    = Ingress(name, ..., opts=child_opts)
        self.hpa        = HorizontalPodAutoscaler(name, ..., opts=child_opts)
        # ServiceMonitor if CRD installed
        
        self.register_outputs({
            "url": self.ingress.spec["rules"][0]["host"],
            "service_dns": self.service.metadata["name"].apply(lambda n: f"{n}.default.svc.cluster.local"),
        })

# Use:
recs = MLService("recs", image="iris-api:v3.2")
fraud = MLService("fraud", image="fraud-detector:v1.5", replicas=4, hpa_max=20)
```

### 步骤 4——Stack 引用（30 分钟）
网络 Stack：
```python
# pulumi-network/__main__.py
vpc = awsx.ec2.Vpc("vpc", ...)
pulumi.export("vpc_id", vpc.vpc_id)
pulumi.export("private_subnets", vpc.private_subnet_ids)
```

应用 Stack：
```python
# pulumi-app/__main__.py
net = pulumi.StackReference("org/pulumi-network/prod")
vpc_id = net.get_output("vpc_id")
private_subnets = net.get_output("private_subnets")

cluster = aws.eks.Cluster("ml", vpc_config={
    "subnet_ids": private_subnets,
})
```

### 步骤 5——CrossGuard 策略（30 分钟）
```ts
// policy-pack/index.ts
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";

new PolicyPack("ml-policies", {
    policies: [{
        name: "rds-must-encrypt",
        description: "RDS instances must have storage encryption.",
        enforcementLevel: "mandatory",
        validateResource: validateResourceOfType(aws.rds.Instance, (i, args, report) => {
            if (!i.storageEncrypted) report("RDS instance must have storage_encrypted=true.");
        }),
    }, {
        name: "k8s-no-privileged",
        enforcementLevel: "mandatory",
        validateResource: validateResourceOfType(k8s.core.v1.Pod, (p, _, report) => {
            for (const c of p.spec.containers ?? []) {
                if (c.securityContext?.privileged === true) report(`Container ${c.name} is privileged.`);
            }
        }),
    }],
});
```

应用至项目：`pulumi policy enable org/ml-policies`。Preview 阻止不合规资源。

### 步骤 6——测试（15 分钟）
```python
# tests/test_components.py
import pulumi
class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, args):
        return [args.name + "_id", args.inputs]
    def call(self, args):
        return {}

pulumi.runtime.set_mocks(MyMocks())

# Test that MLService creates the expected children
def test_ml_service_creates_4_resources():
    s = MLService("test", image="my-img:1.0")
    # ... assertions on s.deployment, s.service, s.ingress, s.hpa
```

## 交付物

1. 通过 YAML 驱动的可用多租户部署。
2. ComponentResource 演示。
3. 具有引用关系的两个 Stack。
4. 至少包含三条策略的策略包。
5. `PULUMI_PATTERNS.md`：记录各种技术的适用时机。

## 验证

- [ ] 在 YAML 中添加租户后，执行 `pulumi up` 会增加对应 K8s 资源。
- [ ] ComponentResource 在 `pulumi stack graph` 中呈现为单一组件节点。
- [ ] 违反策略时阻止 preview，并提供清晰提示。
- [ ] Stack 引用能够工作，且没有循环依赖。

## 拓展目标

- 构建 **Provider**（自定义资源类型），与内部服务集成。
- 使用 **Automation API**，从自己的应用以编程方式驱动 Pulumi。
- 与等价 Terraform 项目比较，记录代码行数差异。

## 常见陷阱

- **`apply` 与原始值**——Pulumi Output 是异步值。使用 `.apply(lambda x: ...)` 处理其值。
- **ComponentResource 子资源缺少 parent 选项**——子资源在图中成为顶级节点，生命周期关系错误。
- **CrossGuard 策略对遗留系统过于严格**——迁移期间可采用提示性执行级别。
