# 练习 07：机器学习基础设施工程师的云环境初始化

**时长：** 3 小时
**难度：** 入门进阶
**前置条件：** 完成练习 01–06；准备好 AWS/GCP/Azure 账号

## 目标

构建 CLI 工具（`cloud-onboard`），在五分钟内为新机器学习工程师初始化云环境。工具供应隔离的沙箱 VPC/网络、配置最小权限 IAM、设置产物存储桶，并生成工程师可以直接用于开发环境的 .env 文件。

完成后，你将拥有经过测试且可运行的 CLI，体现一个反复出现的模式：**将团队入职流程编码化，使第 20 位工程师的入职速度不低于第 2 位。**

## 为什么重要

每个机器学习平台团队通常需要约一天时间帮助新工程师配置云环境。考虑团队规模和人员流动，这是一项实际成本。工程师还可能积累过期凭据、过宽的 IAM 权限与临时创建的存储桶，形成安全与成本隐患。脚本化入职流程能够解决这两类问题，也是简单且具有较高投资回报的机器学习基础设施工具。

## 要求

使用 typer 或 click 构建 Python CLI cloud-onboard，包含以下命令：

```text
cloud-onboard init       --user alice --provider aws --region us-west-2
cloud-onboard status     --user alice
cloud-onboard rotate-key --user alice
cloud-onboard destroy    --user alice
```

### init 必须

1. 验证调用身份具有目标云平台上的管理员权限。
2. 供应逐用户**沙箱 VPC**（或对应资源）：
   - AWS：一个 /24 VPC，含一个公共子网和一个私有子网。
   - GCP：一个 VPC 与一个子网。
   - Azure：一个资源组、VNet 与子网。
3. 为产物创建**逐用户 S3/GCS/Blob 存储桶**，标签为 Owner=<user>。
4. 创建**逐用户 IAM 主体**，权限仅限：
   - 完全访问该用户的存储桶。
   - 读取共享的 team-data 存储桶（假定已存在）。
   - 不具有其他权限。
5. 生成访问凭据并按以下格式写入 `~/.config/ml-onboard/<user>.env`：
   ```
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-west-2
   ML_ARTIFACT_BUCKET=s3://ml-sandbox-alice-2026
   ```
6. 打印可以直接复制到用户 Shell 的配置片段。

### status 必须

展示当前为该用户供应的资源（存储桶名称、IAM 主体 ARN、密钥已使用天数）。

### rotate-key 必须

生成新凭据、使旧凭据失效并更新 .env。

### destroy 必须

移除 init 创建的全部资源。保证幂等性（可以安全地重复执行）。

## 代码骨架

从以下布局开始：

```
cloud-onboard/
├── pyproject.toml
├── src/cloud_onboard/
│   ├── __init__.py
│   ├── cli.py             # typer commands
│   ├── providers/
│   │   ├── __init__.py
│   │   ├── base.py        # abstract Provider class
│   │   ├── aws.py
│   │   ├── gcp.py
│   │   └── azure.py
│   ├── state.py           # writes ~/.config/ml-onboard/<user>.json
│   └── env.py             # writes the .env file
└── tests/
    └── test_aws_init.py   # use moto to mock AWS
```

### 建议的 providers/base.py

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass(frozen=True)
class Provisioned:
    bucket: str
    iam_principal: str
    creds: dict[str, str]

class Provider(ABC):
    @abstractmethod
    def init(self, user: str, region: str) -> Provisioned: ...
    @abstractmethod
    def status(self, user: str) -> dict: ...
    @abstractmethod
    def rotate_key(self, user: str) -> dict[str, str]: ...
    @abstractmethod
    def destroy(self, user: str) -> None: ...
```

## 交付物

1. 至少在一个云平台上能够端到端演示的 CLI。
2. 使用 moto（或对应云平台的等效工具）编写**测试**，使 CI 不需要真实云凭据。
3. 项目根目录中的简短 README.md，包含安装与快速开始说明。
4. 描述此版本的 CHANGELOG.md。

## 分步操作

### 步骤 1——骨架（20 分钟）
按照上述布局设置项目。使用 typer 接入 CLI，确保 cloud-onboard --help 可用。

### 步骤 2——状态文件（15 分钟）
实现 state.py：读写 `~/.config/ml-onboard/<user>.json`，追踪已创建的资源。幂等性依赖这些记录。

### 步骤 3——AWS Provider（60 分钟）
使用 boto3 实现 providers/aws.py。建议顺序：

1. 创建 VPC 与子网（参考 aws_vpc Terraform 模块结构）。
2. 创建具有版本管理、加密和标签的 S3 存储桶。
3. 创建 IAM 用户，附加限定于存储桶的内联策略，创建访问密钥。
4. 将所有创建的 ARN 持久化至状态文件。

### 步骤 4——env 写入器（15 分钟）
实现 env.py：以 0600 权限写入 .env；绝不要将密钥记录到 stdout。

### 步骤 5——使用 moto 测试（30 分钟）
```python
import moto, pytest
from cloud_onboard.providers.aws import AWSProvider

@pytest.fixture
def aws_mock():
    with moto.mock_aws():
        yield

def test_init_creates_bucket_and_iam(aws_mock):
    p = AWSProvider()
    out = p.init(user="alice", region="us-west-2")
    assert out.bucket.startswith("ml-sandbox-alice")
    assert "alice" in out.iam_principal
```

### 步骤 6——destroy 幂等性（20 分钟）
实现 destroy，使资源部分不存在时也能够连续运行两次而不报错。

### 步骤 7——轮换与状态（20 分钟）
密钥最长使用 90 天；超过 80 天时 status 发出警告。编写测试。

### 步骤 8——完善（20 分钟）
- --dry-run 参数打印计划操作，但不调用任何云 API。
- 缺少凭据时提供友好的错误消息。
- 详细模式（-v）记录每次 API 调用。

## 验证

通过练习需要满足全部条件：

- [ ] cloud-onboard init --user testuser --provider aws --region us-west-2 无错误完成。
- [ ] init 后，aws s3 ls 显示用户的存储桶。
- [ ] init 后，IAM 主体存在且仅具有规定的权限策略。
- [ ] 检查 ~/.config/ml-onboard/testuser.env，包含有效凭据且文件权限为 0600。
- [ ] cloud-onboard status --user testuser 返回有效 JSON。
- [ ] cloud-onboard rotate-key --user testuser 颁发新密钥并使旧密钥失效。
- [ ] cloud-onboard destroy --user testuser 移除全部已创建资源，连续执行两次均成功。
- [ ] pytest 通过（基于 moto 的单元测试）。

## 拓展目标

- 添加 cloud-onboard audit，扫描团队成员拥有但未纳入管理的存储桶和密钥。
- 实现 GCP Provider，验证 CLI 在两种云平台上的使用方式一致。
- 添加 OPA/Conftest 策略，当 IAM 策略授予规定存储桶范围之外的权限时使 CI 失败。
- 添加 --ttl 7d 选项，在 TTL 到期后自动销毁资源。

## 常见陷阱

- **IAM 最终一致性**——新创建的主体可能需要 5–10 秒才能使用。添加短暂重试。
- **硬编码区域**——从环境变量或 CLI 读取区域，不要硬编码。
- **日志记录密钥**——设置 logging.getLogger("botocore").setLevel(logging.WARNING)。详细 SDK 日志可能暴露敏感信息。
- **仅依赖状态文件实现幂等性**——还应尝试创建并处理 AlreadyExists；云资源被外部修改时状态文件可能失真。

## 参考答案

参考实现位于 [ai-infra-engineer-solutions/modules/mod-101-foundations/exercise-07-cloud-onboarding/](https://github.com/ai-infra-curriculum/ai-infra-engineer-solutions/tree/main/modules/mod-101-foundations/exercise-07-cloud-onboarding)。**先自己完成练习**——熟练编写正确的 IAM 策略才是真正的学习目标。

> 译注：生产环境优先采用 SSO、角色与短期凭据，避免为人员创建长期访问密钥。仅在授权的沙箱账号中执行创建与销毁，验证资源归属，避免输出真实密钥。原文的 TTL 及轮换需要实际调度或强制机制才能生效。
