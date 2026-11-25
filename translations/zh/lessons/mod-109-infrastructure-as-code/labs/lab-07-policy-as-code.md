# 实验 07：使用 OPA Conftest 实现策略即代码

**时长：** 60 分钟  **前置条件：** 已安装 Conftest（`brew install conftest`）。

## 目标

编写 Rego 策略，在危险 Terraform 执行计划进入 Apply 之前将其识别出来（例如公开 S3 存储桶、缺少标签、实例规格过大），并将策略集成到 CI。

## 步骤

### 1. 生成执行计划
```bash
terraform plan -out=plan.tfplan
terraform show -json plan.tfplan > plan.json
```

### 2. Conftest 策略目录
```bash
mkdir -p policies
```

### 3. 策略 1：禁止公开 S3 存储桶
```rego
# policies/s3.rego
package main

deny[msg] {
  resource := input.planned_values.root_module.resources[_]
  resource.type == "aws_s3_bucket"
  resource.values.acl == "public-read"
  msg := sprintf("Bucket %v has acl=public-read", [resource.address])
}
```

### 4. 策略 2：必需标签
```rego
# policies/tags.rego
package main

required_tags := ["Environment", "Owner", "CostCenter"]

deny[msg] {
  resource := input.planned_values.root_module.resources[_]
  resource.type == "aws_instance"
  missing := [t | t := required_tags[_]; not resource.values.tags[t]]
  count(missing) > 0
  msg := sprintf("Instance %v missing tags: %v", [resource.address, missing])
}
```

### 5. 策略 3：禁止规格过大的实例
```rego
# policies/instance_size.rego
package main

forbidden := {"x1.32xlarge", "x1e.32xlarge", "u-24tb1.metal"}

deny[msg] {
  resource := input.planned_values.root_module.resources[_]
  resource.type == "aws_instance"
  forbidden[resource.values.instance_type]
  msg := sprintf("Instance %v uses forbidden type %v", [resource.address, resource.values.instance_type])
}
```

### 6. 使用 Conftest 检查执行计划
```bash
conftest test --policy policies plan.json
```
通过的计划以退出码 0 结束；失败的计划以非零退出码结束，并附带拒绝信息。

### 7. 测试策略（针对策略的测试驱动开发）
```rego
# policies/s3_test.rego
package main

test_public_bucket_denied {
  deny["Bucket aws_s3_bucket.x has acl=public-read"] with input as {
    "planned_values": {"root_module": {"resources": [{
      "address": "aws_s3_bucket.x", "type": "aws_s3_bucket",
      "values": {"acl": "public-read"}}]}}
  }
}
```
```bash
conftest verify --policy policies
```

### 8. CI 集成

将以下内容追加到 Terraform 工作流（实验 05）：
```yaml
      - run: terraform show -json plan.tfplan > plan.json
      - uses: instrumenta/conftest-action@master
        with: { files: plan.json, policy: policies }
```

## 验证

- [ ] `conftest test` 阻止含有 `public-read` 存储桶的 Terraform 计划。
- [ ] `conftest test` 阻止包含缺少必需标签实例的计划。
- [ ] `conftest verify` 对策略本身运行单元测试。

## 清理
```bash
rm -rf policies plan.tfplan plan.json
```

## 故障排查

- **所有资源均通过** — 不同 Terraform 版本的 Plan JSON 结构可能变化；通过 `jq '.planned_values.root_module.resources[0]' plan.json` 检查。
- **`undefined function deny`** — Rego 模块名必须与 `package main` 匹配，规则必须采用 `deny[msg] { ... }` 格式（原文使用旧版语法）。
- **策略对既有系统过于严格** — 过渡规则可以使用 `warn` 替代 `deny`。
