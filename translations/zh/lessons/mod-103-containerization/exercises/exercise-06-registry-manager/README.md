# 练习 06：容器镜像仓库管理器

**预计时长：** 32–40 小时
**难度：** 高级
**前置条件：** Docker、Python 3.9+、AWS/GCP/Azure CLI、Docker Registry HTTP API

## 概览

构建生产级容器镜像仓库管理系统，在多个镜像仓库（ECR、GCR、ACR、Docker Hub）之间同步镜像，实现自动化镜像晋升流水线（开发 → 预发布 → 生产）、执行保留策略并提供审计记录。本练习教授多云镜像仓库运维、镜像生命周期管理及自动化部署工作流。

在生产 ML 基础设施中，镜像仓库管理对以下方面至关重要：
- **多区域可用性：** 复制镜像，降低跨区域拉取延迟。
- **灾难恢复：** 跨云服务商备份镜像。
- **合规：** 执行保留策略并维护审计日志。
- **安全：** 晋升前扫描镜像，防止未授权访问。
- **成本优化：** 删除未使用镜像，实施生命周期策略。

## 学习目标

完成本练习后，你将能够：

1. **使用 Docker Registry HTTP API v2** 获取镜像元数据及 Manifest。
2. **跨仓库同步镜像**（ECR ↔ GCR ↔ ACR ↔ Docker Hub）。
3. **实现镜像晋升流水线**，包含审批工作流。
4. **执行保留策略**，依据镜像年龄、标签与使用情况。
5. **追踪镜像血缘**，使用标签及元数据。
6. **生成审计报告**，满足安全及合规需求。
7. **优化仓库费用**，识别并移除未使用镜像。

## 业务背景

**实际业务场景（原文案例）：** ML 平台运行于 AWS（us-east-1、eu-west-1）、GCP（us-central1）及 Azure（eastus）。当前挑战：

- **部署缓慢：** 从 us-east-1 的 ECR 向 eu-west-1 的 EKS 拉取 2.5GB 的 ML 镜像耗时 8 分钟。
- **没有灾难恢复：** 单个镜像仓库故障会阻塞所有部署。
- **费用失控：** ECR 中有 4,500 个镜像（每月 450 美元），70% 未使用。
- **手动晋升：** 工程师手动在环境间标记及推送镜像，容易出错。
- **缺少审计记录：** 无法追踪何时由谁部署了哪些镜像。

你的任务是构建镜像仓库管理器：
- 将镜像同步至区域仓库（将拉取时间缩短至 1 分钟以内）。
- 实现包含审批的自动化开发 → 预发布 → 生产晋升。
- 删除超过 90 天且拉取次数少于 5 次的镜像。
- 维护全部镜像操作的完整审计日志。

## 项目结构

```
exercise-06-registry-manager/
├── README.md                          # This file
├── requirements.txt                   # Python dependencies
├── pyproject.toml                     # Poetry/pip-tools config
├── config/
│   ├── registries.yaml                # Registry configurations
│   ├── promotion_policy.yaml          # Promotion rules
│   └── retention_policy.yaml          # Retention rules
├── src/
│   └── registry_manager/
│       ├── __init__.py
│       ├── registry/
│       │   ├── __init__.py
│       │   ├── base.py                # Abstract registry interface
│       │   ├── ecr.py                 # AWS ECR implementation
│       │   ├── gcr.py                 # Google GCR implementation
│       │   ├── acr.py                 # Azure ACR implementation
│       │   └── dockerhub.py           # Docker Hub implementation
│       ├── sync.py                    # Image synchronization
│       ├── promotion.py               # Promotion pipeline
│       ├── retention.py               # Retention policy enforcement
│       ├── audit.py                   # Audit logging
│       ├── metadata.py                # Image metadata tracking
│       ├── cost_analyzer.py           # Cost optimization
│       └── cli.py                     # Command-line interface
├── tests/
│   ├── test_registry_ecr.py
│   ├── test_registry_gcr.py
│   ├── test_registry_acr.py
│   ├── test_sync.py
│   ├── test_promotion.py
│   ├── test_retention.py
│   └── fixtures/
│       ├── sample_manifests/          # Docker image manifests
│       └── mock_responses/            # API response mocks
├── examples/
│   ├── sync_to_all_regions.py
│   ├── promote_to_production.py
│   └── cleanup_old_images.py
├── benchmarks/
│   ├── measure_sync_performance.sh
│   └── compare_pull_latency.sh
└── docs/
    ├── DESIGN.md                      # Architecture decisions
    ├── REGISTRY_API.md                # Registry API reference
    └── PROMOTION_WORKFLOW.md          # Promotion best practices
```

## 需求

### 功能需求

镜像仓库管理器必须具备：

1. **仓库操作：**
   - 列出仓库与镜像。
   - 获取镜像 Manifest 及元数据。
   - 标记镜像（创建别名）。
   - 删除镜像及标签。
   - 跨仓库复制镜像。

2. **同步：**
   - 将指定镜像同步至目标仓库。
   - 同步具有指定标签的全部镜像（例如 `latest`、`prod-*`）。
   - 验证镜像完整性（校验和验证）。
   - 处理并发同步（限流）。

3. **晋升流水线：**
   - 将镜像从开发晋升至预发布，再到生产环境。
   - 生产晋升必须经过审批。
   - 晋升前运行安全扫描。
   - 使用环境标签标记镜像。
   - 回滚至此前版本。

4. **保留策略：**
   - 删除超过 N 天的镜像。
   - 保留每个镜像最近 N 个版本。
   - 保留具有特定标签的镜像（例如 `prod-*`、`stable`）。
   - 删除最近 M 天内拉取次数少于 N 的镜像。

5. **审计与报告：**
   - 记录全部镜像操作（谁、做了什么、何时）。
   - 生成合规报告。
   - 追踪镜像血缘（生成镜像的提交/构建）。
   - 成本分析（各仓库的存储费用）。

### 非功能需求

- **性能：** 同一云区域内 3 分钟内同步 1GB 镜像。
- **可靠性：** 使用指数退避重试失败操作。
- **幂等性：** 安全地重复执行同步/晋升操作。
- **安全性：** 使用 IAM 角色，不硬编码凭据。
- **可观测性：** 使用包含关联 ID 的结构化日志。

## 实现任务

### 任务 1：仓库抽象（6–7 小时）

为每种仓库类型构建抽象接口与实现。

```python
# src/registry_manager/registry/base.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime

@dataclass
class ImageManifest:
    """Docker image manifest (OCI format)"""
    digest: str  # sha256:abc123...
    media_type: str  # application/vnd.docker.distribution.manifest.v2+json
    size_bytes: int
    config: Dict  # Image configuration
    layers: List[Dict]  # Layer digests and sizes

@dataclass
class ImageMetadata:
    """Image metadata from registry"""
    repository: str  # my-ml-model
    tag: str  # v1.2.3
    digest: str  # sha256:abc123...
    created_at: datetime
    size_bytes: int
    pushed_at: Optional[datetime] = None
    pull_count: int = 0
    labels: Dict[str, str] = None

    @property
    def full_name(self) -> str:
        return f"{self.repository}:{self.tag}"

class RegistryInterface(ABC):
    """Abstract interface for container registries"""

    @abstractmethod
    def list_repositories(self) -> List[str]:
        """List all repositories in registry"""
        raise NotImplementedError

    @abstractmethod
    def list_tags(self, repository: str) -> List[str]:
        """List all tags for a repository"""
        raise NotImplementedError

    @abstractmethod
    def get_manifest(self, repository: str, tag: str) -> ImageManifest:
        """Get image manifest"""
        raise NotImplementedError

    @abstractmethod
    def get_metadata(self, repository: str, tag: str) -> ImageMetadata:
        """Get image metadata (size, created date, etc.)"""
        raise NotImplementedError

    @abstractmethod
    def tag_image(self, repository: str, source_tag: str, target_tag: str) -> None:
        """Create a new tag pointing to existing image"""
        raise NotImplementedError

    @abstractmethod
    def delete_image(self, repository: str, tag: str) -> None:
        """Delete image tag"""
        raise NotImplementedError

    @abstractmethod
    def delete_by_digest(self, repository: str, digest: str) -> None:
        """Delete image by digest (deletes all tags pointing to it)"""
        raise NotImplementedError

    @abstractmethod
    def image_exists(self, repository: str, tag: str) -> bool:
        """Check if image exists"""
        raise NotImplementedError
```

```python
# src/registry_manager/registry/ecr.py

import boto3
from typing import List, Dict, Optional
from datetime import datetime
from .base import RegistryInterface, ImageManifest, ImageMetadata

class ECRRegistry(RegistryInterface):
    """AWS Elastic Container Registry implementation"""

    def __init__(self, region: str, registry_id: Optional[str] = None):
        """
        Initialize ECR client

        Args:
            region: AWS region (e.g., us-east-1)
            registry_id: AWS account ID (defaults to caller's account)
        """
        self.region = region
        self.registry_id = registry_id
        self.client = boto3.client('ecr', region_name=region)

    def list_repositories(self) -> List[str]:
        """
        List all ECR repositories

        Uses: ecr.describe_repositories()
        """
        # TODO: Paginate through all repositories
        # TODO: Extract repository names
        raise NotImplementedError

    def list_tags(self, repository: str) -> List[str]:
        """
        List all image tags in repository

        Uses: ecr.list_images(repositoryName=...)
        Filter imageIds by imageTag (not digest-only references)
        """
        # TODO: Call list_images API
        # TODO: Extract tags (filter out None/digest-only)
        # TODO: Sort tags by push date (newest first)
        raise NotImplementedError

    def get_manifest(self, repository: str, tag: str) -> ImageManifest:
        """
        Get image manifest

        Uses: ecr.batch_get_image(imageIds=[{'imageTag': tag}])
        Parse imageManifest JSON
        """
        # TODO: Call batch_get_image
        # TODO: Parse manifest JSON
        # TODO: Extract digest, layers, config
        raise NotImplementedError

    def get_metadata(self, repository: str, tag: str) -> ImageMetadata:
        """
        Get image metadata

        Uses: ecr.describe_images(imageIds=[{'imageTag': tag}])
        Returns imageSizeInBytes, imagePushedAt, etc.
        """
        # TODO: Call describe_images
        # TODO: Extract metadata
        # TODO: Get pull count from CloudWatch metrics (if available)
        raise NotImplementedError

    def tag_image(self, repository: str, source_tag: str, target_tag: str) -> None:
        """
        Create new tag pointing to existing image

        Uses: ecr.put_image(repositoryName, imageManifest, imageTag)
        Get manifest from source_tag, put with target_tag
        """
        # TODO: Get manifest of source_tag
        # TODO: Put manifest with target_tag
        raise NotImplementedError

    def delete_image(self, repository: str, tag: str) -> None:
        """
        Delete image tag

        Uses: ecr.batch_delete_image(imageIds=[{'imageTag': tag}])
        """
        # TODO: Call batch_delete_image
        raise NotImplementedError

    def delete_by_digest(self, repository: str, digest: str) -> None:
        """Delete image by digest"""
        # TODO: Call batch_delete_image with imageDigest
        raise NotImplementedError

    def image_exists(self, repository: str, tag: str) -> bool:
        """Check if image exists"""
        try:
            self.get_metadata(repository, tag)
            return True
        except:
            return False
```

**以下仓库需要类似实现：**

```python
# src/registry_manager/registry/gcr.py
class GCRRegistry(RegistryInterface):
    """
    Google Container Registry implementation

    Uses Google Artifact Registry API or Docker Registry HTTP API v2
    Authentication via: gcloud auth print-access-token
    """
    # TODO: Implement using google-cloud-artifact-registry SDK

# src/registry_manager/registry/acr.py
class ACRRegistry(RegistryInterface):
    """
    Azure Container Registry implementation

    Uses Azure SDK or Docker Registry HTTP API v2
    Authentication via: az acr login
    """
    # TODO: Implement using azure-mgmt-containerregistry SDK

# src/registry_manager/registry/dockerhub.py
class DockerHubRegistry(RegistryInterface):
    """
    Docker Hub implementation

    Uses Docker Hub API v2
    Authentication via: username/password or access token
    """
    # TODO: Implement using requests + Docker Hub API
```

**验收标准：**
- [ ] ECR 实现的所有方法正常工作。
- [ ] GCR 实现的所有方法正常工作。
- [ ] ACR 实现的所有方法正常工作。
- [ ] Docker Hub 实现（加分项）。
- [ ] 全部仓库通过通用接口测试。
- [ ] 正确处理错误及重试。

**测试示例：**
```python
def test_ecr_list_repositories():
    ecr = ECRRegistry(region="us-east-1")
    repos = ecr.list_repositories()
    assert isinstance(repos, list)
    assert "my-ml-model" in repos

def test_ecr_get_metadata():
    ecr = ECRRegistry(region="us-east-1")
    metadata = ecr.get_metadata("my-ml-model", "v1.2.3")
    assert metadata.tag == "v1.2.3"
    assert metadata.size_bytes > 0
    assert metadata.digest.startswith("sha256:")
```

---

### 任务 2：镜像同步（6–7 小时）

实现跨仓库镜像同步。

```python
# src/registry_manager/sync.py

from dataclasses import dataclass
from typing import List, Optional
from pathlib import Path
import subprocess
import hashlib
from .registry.base import RegistryInterface, ImageMetadata

@dataclass
class SyncJob:
    """Represents an image sync operation"""
    source_registry: str  # us-east-1-ecr
    target_registry: str  # eu-west-1-ecr
    repository: str  # my-ml-model
    tag: str  # v1.2.3
    verify_checksum: bool = True

@dataclass
class SyncResult:
    """Result of sync operation"""
    job: SyncJob
    success: bool
    duration_seconds: float
    size_bytes: int
    error: Optional[str] = None

    def __str__(self) -> str:
        status = "✅ SUCCESS" if self.success else "❌ FAILED"
        return f"{status} | {self.job.repository}:{self.job.tag} | {self.size_bytes / 1e9:.2f} GB in {self.duration_seconds:.1f}s"

class ImageSynchronizer:
    """Synchronize images between registries"""

    def __init__(self, registries: Dict[str, RegistryInterface]):
        """
        Args:
            registries: {
                "us-east-1-ecr": ECRRegistry(region="us-east-1"),
                "eu-west-1-ecr": ECRRegistry(region="eu-west-1"),
                "us-central1-gcr": GCRRegistry(project="my-project", location="us-central1")
            }
        """
        self.registries = registries

    def sync_image(self, job: SyncJob) -> SyncResult:
        """
        Sync single image from source to target registry

        Strategy:
        1. Check if image already exists in target (skip if digest matches)
        2. Pull image from source using `docker pull`
        3. Re-tag for target registry
        4. Push to target using `docker push`
        5. Verify digest matches
        6. Clean up local image

        Alternative for cloud-native sync (faster):
        - ECR to ECR: Use ECR replication rules or `skopeo copy`
        - GCR to GCR: Use `gcloud container images add-tag`
        """
        import time
        start = time.time()

        try:
            source_reg = self.registries[job.source_registry]
            target_reg = self.registries[job.target_registry]

            # TODO: Get source image metadata
            source_metadata = source_reg.get_metadata(job.repository, job.tag)

            # TODO: Check if already exists in target
            if target_reg.image_exists(job.repository, job.tag):
                target_metadata = target_reg.get_metadata(job.repository, job.tag)
                if target_metadata.digest == source_metadata.digest:
                    return SyncResult(
                        job=job,
                        success=True,
                        duration_seconds=time.time() - start,
                        size_bytes=0,  # No transfer needed
                        error="Image already exists with same digest"
                    )

            # TODO: Pull from source
            source_image = f"{self._get_registry_url(job.source_registry)}/{job.repository}:{job.tag}"
            self._docker_pull(source_image)

            # TODO: Re-tag for target
            target_image = f"{self._get_registry_url(job.target_registry)}/{job.repository}:{job.tag}"
            self._docker_tag(source_image, target_image)

            # TODO: Push to target
            self._docker_push(target_image)

            # TODO: Verify digest
            if job.verify_checksum:
                target_metadata = target_reg.get_metadata(job.repository, job.tag)
                if target_metadata.digest != source_metadata.digest:
                    raise ValueError(f"Digest mismatch: {source_metadata.digest} != {target_metadata.digest}")

            # TODO: Clean up local images
            self._docker_rmi(source_image)
            self._docker_rmi(target_image)

            return SyncResult(
                job=job,
                success=True,
                duration_seconds=time.time() - start,
                size_bytes=source_metadata.size_bytes
            )

        except Exception as e:
            return SyncResult(
                job=job,
                success=False,
                duration_seconds=time.time() - start,
                size_bytes=0,
                error=str(e)
            )

    def sync_repository(
        self,
        repository: str,
        source_registry: str,
        target_registries: List[str],
        tag_filter: Optional[str] = None
    ) -> List[SyncResult]:
        """
        Sync all tags of a repository to multiple target registries

        Args:
            repository: Repository name (e.g., "my-ml-model")
            source_registry: Source registry key
            target_registries: List of target registry keys
            tag_filter: Regex pattern (e.g., "v\\d+\\.\\d+\\.\\d+" for semantic versions)

        Returns:
            List of SyncResults for each tag
        """
        # TODO: List all tags in source repository
        # TODO: Filter tags by pattern if specified
        # TODO: Create SyncJob for each (tag, target_registry) combination
        # TODO: Execute syncs (optionally in parallel using ThreadPoolExecutor)
        # TODO: Return results
        raise NotImplementedError

    def _get_registry_url(self, registry_key: str) -> str:
        """Get registry URL for docker commands"""
        # TODO: Extract registry URL from registry object
        # ECR: 123456789012.dkr.ecr.us-east-1.amazonaws.com
        # GCR: gcr.io/my-project
        # ACR: myregistry.azurecr.io
        raise NotImplementedError

    def _docker_pull(self, image: str) -> None:
        """Pull image using docker CLI"""
        # TODO: Run: docker pull <image>
        # TODO: Handle authentication (assume already logged in via aws ecr get-login-password, etc.)
        raise NotImplementedError

    def _docker_tag(self, source: str, target: str) -> None:
        """Tag image"""
        # TODO: Run: docker tag <source> <target>
        raise NotImplementedError

    def _docker_push(self, image: str) -> None:
        """Push image"""
        # TODO: Run: docker push <image>
        raise NotImplementedError

    def _docker_rmi(self, image: str) -> None:
        """Remove local image"""
        # TODO: Run: docker rmi <image>
        raise NotImplementedError
```

**验收标准：**
- [ ] 在仓库之间同步单个镜像。
- [ ] 同步 Repository 中的全部标签。
- [ ] 已存在相同 Digest 的镜像时跳过同步。
- [ ] 使用校验和验证镜像完整性。
- [ ] 并行同步以提高性能。
- [ ] 正确清理本地镜像。

---

### 任务 3：晋升流水线（7–8 小时）

实现自动化镜像晋升工作流。

```python
# src/registry_manager/promotion.py

from dataclasses import dataclass
from typing import List, Optional, Callable
from enum import Enum
from datetime import datetime
from .registry.base import RegistryInterface
from .sync import ImageSynchronizer, SyncJob

class Environment(Enum):
    DEV = "dev"
    STAGING = "staging"
    PROD = "prod"

@dataclass
class PromotionPolicy:
    """Rules for promoting images"""
    from_env: Environment
    to_env: Environment
    require_approval: bool
    require_security_scan: bool
    require_tests: bool
    auto_rollback_on_failure: bool

@dataclass
class PromotionRequest:
    """Request to promote an image"""
    repository: str
    tag: str
    from_env: Environment
    to_env: Environment
    approved_by: Optional[str] = None
    reason: Optional[str] = None

@dataclass
class PromotionResult:
    """Result of promotion"""
    request: PromotionRequest
    success: bool
    new_tag: str  # e.g., prod-v1.2.3-20240125
    timestamp: datetime
    error: Optional[str] = None

class PromotionPipeline:
    """Manage image promotion across environments"""

    def __init__(
        self,
        registries: Dict[str, RegistryInterface],
        synchronizer: ImageSynchronizer,
        policies: List[PromotionPolicy]
    ):
        self.registries = registries
        self.synchronizer = synchronizer
        self.policies = {(p.from_env, p.to_env): p for p in policies}

    def promote(
        self,
        request: PromotionRequest,
        security_scan_fn: Optional[Callable] = None,
        test_fn: Optional[Callable] = None
    ) -> PromotionResult:
        """
        Promote image from one environment to another

        Workflow:
        1. Validate promotion is allowed (check policy)
        2. Check approval if required
        3. Run security scan if required
        4. Run tests if required
        5. Tag image with environment prefix
        6. Sync to target environment registries
        7. Record promotion in audit log
        8. Optionally rollback on failure

        Args:
            request: Promotion request
            security_scan_fn: Function to run security scan
            test_fn: Function to run tests

        Returns:
            PromotionResult
        """
        try:
            # TODO: Get promotion policy
            policy = self.policies.get((request.from_env, request.to_env))
            if not policy:
                raise ValueError(f"No policy for {request.from_env} → {request.to_env}")

            # TODO: Check approval
            if policy.require_approval and not request.approved_by:
                raise ValueError("Approval required for this promotion")

            # TODO: Run security scan
            if policy.require_security_scan:
                if not security_scan_fn:
                    raise ValueError("Security scan required but no scan function provided")
                scan_result = security_scan_fn(request.repository, request.tag)
                if not scan_result.passed:
                    raise ValueError(f"Security scan failed: {scan_result.message}")

            # TODO: Run tests
            if policy.require_tests:
                if not test_fn:
                    raise ValueError("Tests required but no test function provided")
                test_result = test_fn(request.repository, request.tag)
                if not test_result.passed:
                    raise ValueError(f"Tests failed: {test_result.message}")

            # TODO: Generate new tag with environment prefix
            new_tag = self._generate_env_tag(request.to_env, request.tag)

            # TODO: Tag image in source registry
            source_registry = self._get_registry_for_env(request.from_env)
            source_registry.tag_image(request.repository, request.tag, new_tag)

            # TODO: Sync to target environment registries
            target_registries = self._get_registries_for_env(request.to_env)
            for target_reg_key in target_registries:
                sync_job = SyncJob(
                    source_registry=self._get_registry_key_for_env(request.from_env),
                    target_registry=target_reg_key,
                    repository=request.repository,
                    tag=new_tag
                )
                sync_result = self.synchronizer.sync_image(sync_job)
                if not sync_result.success:
                    raise Exception(f"Sync failed: {sync_result.error}")

            # TODO: Record in audit log
            self._log_promotion(request, new_tag)

            return PromotionResult(
                request=request,
                success=True,
                new_tag=new_tag,
                timestamp=datetime.now()
            )

        except Exception as e:
            # TODO: Rollback if configured
            if policy.auto_rollback_on_failure:
                self._rollback_promotion(request)

            return PromotionResult(
                request=request,
                success=False,
                new_tag="",
                timestamp=datetime.now(),
                error=str(e)
            )

    def rollback(self, repository: str, environment: Environment, to_tag: str) -> PromotionResult:
        """
        Rollback to previous image version

        Steps:
        1. Find current production tag
        2. Verify rollback target exists
        3. Re-tag rollback target as current
        4. Sync to all environment registries
        """
        # TODO: Implement rollback logic
        raise NotImplementedError

    def get_promotion_history(self, repository: str, limit: int = 100) -> List[Dict]:
        """Get promotion history for repository"""
        # TODO: Read from audit log
        raise NotImplementedError

    def _generate_env_tag(self, env: Environment, original_tag: str) -> str:
        """
        Generate environment-specific tag

        Examples:
        - dev-v1.2.3-20240125-abc123
        - staging-v1.2.3-20240126-def456
        - prod-v1.2.3-20240127-ghi789
        """
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        return f"{env.value}-{original_tag}-{timestamp}"

    def _get_registry_for_env(self, env: Environment) -> RegistryInterface:
        """Get primary registry for environment"""
        # TODO: Map environment to registry
        raise NotImplementedError

    def _get_registries_for_env(self, env: Environment) -> List[str]:
        """Get all registries for environment"""
        # TODO: Return list of registry keys for this environment
        raise NotImplementedError

    def _log_promotion(self, request: PromotionRequest, new_tag: str) -> None:
        """Log promotion to audit trail"""
        # TODO: Write to audit log (database or file)
        raise NotImplementedError

    def _rollback_promotion(self, request: PromotionRequest) -> None:
        """Rollback failed promotion"""
        # TODO: Implement rollback
        raise NotImplementedError
```

**验收标准：**
- [ ] 在环境间晋升镜像。
- [ ] 强制执行审批要求。
- [ ] 晋升前集成安全扫描。
- [ ] 晋升前运行测试。
- [ ] 生成环境专用标签。
- [ ] 失败时回滚。
- [ ] 维护晋升审计日志。

---

### 任务 4：保留策略引擎（5–6 小时）

根据保留策略实现自动化镜像清理。

```python
# src/registry_manager/retention.py

from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta
from .registry.base import RegistryInterface, ImageMetadata

@dataclass
class RetentionRule:
    """Rule for image retention"""
    name: str
    max_age_days: Optional[int] = None  # Delete if older than N days
    keep_last_n: Optional[int] = None  # Keep last N versions
    min_pull_count: Optional[int] = None  # Delete if <N pulls in last 30 days
    preserve_tags: List[str] = None  # Never delete these tags (e.g., ["prod-*", "latest"])

    def should_delete(self, metadata: ImageMetadata, current_time: datetime) -> bool:
        """
        Determine if image should be deleted based on this rule

        Returns True if image violates ANY condition
        """
        # TODO: Check if tag is preserved
        if self.preserve_tags:
            for pattern in self.preserve_tags:
                if self._tag_matches_pattern(metadata.tag, pattern):
                    return False

        # TODO: Check age
        if self.max_age_days:
            age_days = (current_time - metadata.created_at).days
            if age_days > self.max_age_days:
                return True

        # TODO: Check pull count
        if self.min_pull_count:
            if metadata.pull_count < self.min_pull_count:
                return True

        return False

    def _tag_matches_pattern(self, tag: str, pattern: str) -> bool:
        """Check if tag matches pattern (supports wildcards)"""
        import re
        regex_pattern = pattern.replace("*", ".*")
        return bool(re.match(regex_pattern, tag))

class RetentionPolicyEngine:
    """Enforce image retention policies"""

    def __init__(self, registries: Dict[str, RegistryInterface]):
        self.registries = registries

    def apply_policy(
        self,
        registry_key: str,
        repository: str,
        rule: RetentionRule,
        dry_run: bool = True
    ) -> Dict:
        """
        Apply retention policy to repository

        Args:
            registry_key: Registry to clean up
            repository: Repository name
            rule: Retention rule to apply
            dry_run: If True, only report what would be deleted

        Returns:
            {
                "total_images": 100,
                "to_delete": 45,
                "to_keep": 55,
                "deleted_tags": ["v1.0.0", "v1.0.1", ...],
                "space_freed_mb": 2500.0
            }
        """
        registry = self.registries[registry_key]

        # TODO: List all image tags
        tags = registry.list_tags(repository)

        # TODO: Get metadata for each tag
        all_metadata = []
        for tag in tags:
            metadata = registry.get_metadata(repository, tag)
            all_metadata.append(metadata)

        # TODO: Apply retention rules
        current_time = datetime.now()
        to_delete = []
        to_keep = []

        # Handle keep_last_n rule separately
        if rule.keep_last_n:
            # Sort by created_at, keep newest N
            sorted_metadata = sorted(all_metadata, key=lambda m: m.created_at, reverse=True)
            to_keep = sorted_metadata[:rule.keep_last_n]
            to_delete = sorted_metadata[rule.keep_last_n:]
        else:
            # Apply age/pull_count rules
            for metadata in all_metadata:
                if rule.should_delete(metadata, current_time):
                    to_delete.append(metadata)
                else:
                    to_keep.append(metadata)

        # TODO: Delete images if not dry_run
        deleted_tags = []
        space_freed = 0
        if not dry_run:
            for metadata in to_delete:
                registry.delete_image(repository, metadata.tag)
                deleted_tags.append(metadata.tag)
                space_freed += metadata.size_bytes

        return {
            "total_images": len(all_metadata),
            "to_delete": len(to_delete),
            "to_keep": len(to_keep),
            "deleted_tags": [m.tag for m in to_delete] if dry_run else deleted_tags,
            "space_freed_mb": sum(m.size_bytes for m in to_delete) / (1024 * 1024)
        }

    def apply_to_all_repositories(
        self,
        registry_key: str,
        rule: RetentionRule,
        dry_run: bool = True
    ) -> List[Dict]:
        """Apply retention policy to all repositories in registry"""
        registry = self.registries[registry_key]

        # TODO: List all repositories
        repositories = registry.list_repositories()

        # TODO: Apply policy to each repository
        results = []
        for repo in repositories:
            result = self.apply_policy(registry_key, repo, rule, dry_run)
            result["repository"] = repo
            results.append(result)

        return results
```

**验收标准：**
- [ ] 删除超过 N 天的镜像。
- [ ] 保留每个 Repository 的最近 N 个版本。
- [ ] 删除拉取次数较低的镜像。
- [ ] 保留指定标签（prod-*、latest）。
- [ ] 使用 Dry-run 模式预览删除操作。
- [ ] 报告节省的空间。

---

### 任务 5：审计与成本分析（4–5 小时）

实现审计日志及成本优化工具。

```python
# src/registry_manager/audit.py

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
import json
from pathlib import Path

@dataclass
class AuditEvent:
    """Represents an auditable event"""
    timestamp: datetime
    event_type: str  # sync, promote, delete, tag
    user: str  # Who performed action
    registry: str
    repository: str
    tag: str
    details: dict
    correlation_id: str  # For tracing related events

class AuditLogger:
    """Log all registry operations for compliance"""

    def __init__(self, log_file: Path):
        self.log_file = log_file

    def log_event(self, event: AuditEvent) -> None:
        """Write event to audit log"""
        # TODO: Append to JSONL file (one JSON object per line)
        # TODO: Include structured fields for querying
        raise NotImplementedError

    def query_events(
        self,
        repository: Optional[str] = None,
        event_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[AuditEvent]:
        """Query audit log"""
        # TODO: Read log file
        # TODO: Filter by criteria
        # TODO: Return matching events
        raise NotImplementedError

    def generate_compliance_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict:
        """
        Generate compliance report

        Returns:
            {
                "period": "2024-01-01 to 2024-01-31",
                "total_events": 1523,
                "by_type": {
                    "sync": 800,
                    "promote": 45,
                    "delete": 678
                },
                "by_user": {
                    "alice@example.com": 234,
                    "bob@example.com": 189
                },
                "security_events": [
                    "Production promotion without approval attempt blocked"
                ]
            }
        """
        # TODO: Aggregate events by type, user, repository
        # TODO: Identify security-relevant events
        raise NotImplementedError
```

```python
# src/registry_manager/cost_analyzer.py

from dataclasses import dataclass
from typing import Dict, List
from .registry.base import RegistryInterface

@dataclass
class RegistryCosts:
    """Cost breakdown for a registry"""
    registry_name: str
    storage_gb: float
    storage_cost_usd: float  # Based on pricing tier
    data_transfer_gb: float
    data_transfer_cost_usd: float
    total_cost_usd: float

class CostAnalyzer:
    """Analyze registry storage costs"""

    # Pricing (approximate, update with actual rates)
    PRICING = {
        "ecr": {"storage_per_gb": 0.10, "data_transfer_per_gb": 0.09},
        "gcr": {"storage_per_gb": 0.10, "data_transfer_per_gb": 0.12},
        "acr": {"storage_per_gb": 0.10, "data_transfer_per_gb": 0.09}
    }

    def __init__(self, registries: Dict[str, RegistryInterface]):
        self.registries = registries

    def analyze_costs(self, registry_key: str) -> RegistryCosts:
        """
        Calculate storage costs for registry

        Steps:
        1. List all repositories
        2. Get size of each image
        3. Sum total storage
        4. Calculate cost based on pricing
        """
        registry = self.registries[registry_key]

        # TODO: List all repositories
        repositories = registry.list_repositories()

        # TODO: Calculate total storage
        total_size_bytes = 0
        for repo in repositories:
            tags = registry.list_tags(repo)
            for tag in tags:
                metadata = registry.get_metadata(repo, tag)
                total_size_bytes += metadata.size_bytes

        total_size_gb = total_size_bytes / (1024 ** 3)

        # TODO: Calculate costs
        registry_type = self._get_registry_type(registry_key)
        pricing = self.PRICING.get(registry_type, self.PRICING["ecr"])

        storage_cost = total_size_gb * pricing["storage_per_gb"]

        # TODO: Estimate data transfer (would need actual metrics)
        data_transfer_gb = 0  # Placeholder
        data_transfer_cost = 0

        return RegistryCosts(
            registry_name=registry_key,
            storage_gb=total_size_gb,
            storage_cost_usd=storage_cost,
            data_transfer_gb=data_transfer_gb,
            data_transfer_cost_usd=data_transfer_cost,
            total_cost_usd=storage_cost + data_transfer_cost
        )

    def find_cost_savings(self, registry_key: str) -> List[Dict]:
        """
        Identify cost optimization opportunities

        Returns:
            [
                {
                    "opportunity": "Delete 45 images older than 90 days",
                    "savings_usd_monthly": 125.40,
                    "repositories_affected": ["my-ml-model", "legacy-api"]
                },
                {
                    "opportunity": "Delete duplicate images (same digest, different tags)",
                    "savings_usd_monthly": 45.20
                }
            ]
        """
        # TODO: Analyze old images
        # TODO: Find duplicate images (same digest)
        # TODO: Find unused images (zero pulls)
        # TODO: Calculate potential savings
        raise NotImplementedError

    def _get_registry_type(self, registry_key: str) -> str:
        """Determine registry type from key"""
        if "ecr" in registry_key.lower():
            return "ecr"
        elif "gcr" in registry_key.lower():
            return "gcr"
        elif "acr" in registry_key.lower():
            return "acr"
        return "ecr"
```

**验收标准：**
- [ ] 在审计记录中保存全部仓库操作。
- [ ] 按条件查询审计日志。
- [ ] 生成合规报告。
- [ ] 计算仓库存储费用。
- [ ] 识别成本节省机会。

---

### 任务 6：CLI 界面（4–5 小时）

构建综合命令行界面。

```python
# src/registry_manager/cli.py

import click
from pathlib import Path
from typing import Optional
import yaml
from .registry import ECRRegistry, GCRRegistry, ACRRegistry
from .sync import ImageSynchronizer, SyncJob
from .promotion import PromotionPipeline, PromotionRequest, Environment
from .retention import RetentionPolicyEngine, RetentionRule
from .cost_analyzer import CostAnalyzer

@click.group()
def cli():
    """Container Registry Manager - Multi-cloud registry operations"""
    pass

@cli.command()
@click.argument('config_file', type=click.Path(exists=True))
def list_repos(config_file: str):
    """List all repositories in registries"""
    # TODO: Load config
    # TODO: Initialize registries
    # TODO: List repositories in each registry
    # TODO: Print results
    pass

@cli.command()
@click.option('--source', required=True, help='Source registry (e.g., us-east-1-ecr)')
@click.option('--target', required=True, multiple=True, help='Target registries')
@click.option('--repository', required=True, help='Repository name')
@click.option('--tag', required=True, help='Image tag')
@click.option('--config', type=click.Path(exists=True), default='config/registries.yaml')
def sync(source: str, target: tuple, repository: str, tag: str, config: str):
    """Sync image to target registries"""
    # TODO: Load registries from config
    # TODO: Create ImageSynchronizer
    # TODO: Sync to each target
    # TODO: Print results
    pass

@cli.command()
@click.option('--repository', required=True, help='Repository name')
@click.option('--tag', required=True, help='Image tag')
@click.option('--from-env', type=click.Choice(['dev', 'staging', 'prod']), required=True)
@click.option('--to-env', type=click.Choice(['dev', 'staging', 'prod']), required=True)
@click.option('--approved-by', help='Approver email (required for prod promotions)')
@click.option('--reason', help='Promotion reason')
@click.option('--config', type=click.Path(exists=True), default='config/registries.yaml')
def promote(repository: str, tag: str, from_env: str, to_env: str,
            approved_by: Optional[str], reason: Optional[str], config: str):
    """Promote image to next environment"""
    # TODO: Load config
    # TODO: Create PromotionPipeline
    # TODO: Execute promotion
    # TODO: Print result
    pass

@cli.command()
@click.option('--registry', required=True, help='Registry to clean up')
@click.option('--repository', help='Specific repository (or all if not specified)')
@click.option('--max-age-days', type=int, help='Delete images older than N days')
@click.option('--keep-last-n', type=int, help='Keep last N versions')
@click.option('--dry-run/--no-dry-run', default=True, help='Preview deletions without executing')
@click.option('--config', type=click.Path(exists=True), default='config/registries.yaml')
def cleanup(registry: str, repository: Optional[str], max_age_days: Optional[int],
            keep_last_n: Optional[int], dry_run: bool, config: str):
    """Clean up old images based on retention policy"""
    # TODO: Load config
    # TODO: Create RetentionRule
    # TODO: Apply policy
    # TODO: Print results (what was/would be deleted)
    pass

@cli.command()
@click.option('--registry', required=True, help='Registry to analyze')
@click.option('--config', type=click.Path(exists=True), default='config/registries.yaml')
def costs(registry: str, config: str):
    """Analyze registry storage costs"""
    # TODO: Load config
    # TODO: Create CostAnalyzer
    # TODO: Calculate costs
    # TODO: Find savings opportunities
    # TODO: Print report
    pass

@cli.command()
@click.option('--repository', help='Filter by repository')
@click.option('--event-type', help='Filter by event type')
@click.option('--start-date', help='Start date (YYYY-MM-DD)')
@click.option('--end-date', help='End date (YYYY-MM-DD)')
@click.option('--output', type=click.Path(), help='Output file for report')
def audit(repository: Optional[str], event_type: Optional[str],
          start_date: Optional[str], end_date: Optional[str], output: Optional[str]):
    """Query audit log"""
    # TODO: Create AuditLogger
    # TODO: Query events
    # TODO: Print or export results
    pass

if __name__ == '__main__':
    cli()
```

**配置文件示例：**

```yaml
# config/registries.yaml

registries:
  us-east-1-ecr:
    type: ecr
    region: us-east-1
    environment: prod

  eu-west-1-ecr:
    type: ecr
    region: eu-west-1
    environment: prod

  us-central1-gcr:
    type: gcr
    project: my-ml-project
    location: us-central1
    environment: dev

  eastus-acr:
    type: acr
    registry_name: mymlregistry
    environment: staging

promotion_policies:
  - from_env: dev
    to_env: staging
    require_approval: false
    require_security_scan: true
    require_tests: true

  - from_env: staging
    to_env: prod
    require_approval: true
    require_security_scan: true
    require_tests: true
    auto_rollback_on_failure: true

retention_policies:
  dev:
    max_age_days: 30
    preserve_tags: ["latest"]

  staging:
    keep_last_n: 10
    preserve_tags: ["latest", "staging-*"]

  prod:
    keep_last_n: 20
    preserve_tags: ["prod-*", "latest", "stable"]
```

**验收标准：**
- [ ] 为全部主要操作提供 CLI 命令。
- [ ] 从 YAML 加载配置。
- [ ] 清晰的进度提示。
- [ ] 详细错误信息。
- [ ] 支持 Dry-run 模式。

---

## 测试要求

### 单元测试

```python
# tests/test_sync.py

def test_sync_image_success():
    """Test successful image sync"""
    source_ecr = ECRRegistry(region="us-east-1")
    target_ecr = ECRRegistry(region="eu-west-1")

    synchronizer = ImageSynchronizer({
        "source": source_ecr,
        "target": target_ecr
    })

    job = SyncJob(
        source_registry="source",
        target_registry="target",
        repository="my-ml-model",
        tag="v1.2.3"
    )

    result = synchronizer.sync_image(job)
    assert result.success
    assert result.size_bytes > 0

def test_sync_skips_existing():
    """Test sync skips if image already exists with same digest"""
    # TODO: Mock registries
    # TODO: Set up scenario where target already has image
    # TODO: Verify sync is skipped
    pass
```

### 集成测试

```bash
# tests/integration/test_promotion_workflow.sh

#!/bin/bash
set -e

echo "Testing full promotion workflow..."

# Build test image
docker build -t test-app:v1.0.0 test-fixtures/app

# Tag for dev
docker tag test-app:v1.0.0 123456789012.dkr.ecr.us-east-1.amazonaws.com/test-app:dev-v1.0.0

# Push to dev
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/test-app:dev-v1.0.0

# Promote dev → staging
python -m registry_manager.cli promote \
    --repository test-app \
    --tag dev-v1.0.0 \
    --from-env dev \
    --to-env staging

# Verify image exists in staging
aws ecr describe-images \
    --repository-name test-app \
    --image-ids imageTag=staging-v1.0.0-* \
    --region us-east-1

echo "✅ Promotion workflow test passed!"
```

## 预期结果

完成本练习后，应达到以下目标：

| 指标 | 目标 | 实测 |
|---|---|---|
| **同步时间（1GB，同一区域）** | 低于 3 分钟 | ________ |
| **同步时间（1GB，跨区域）** | 低于 5 分钟 | ________ |
| **保留策略执行时间** | 100 个镜像低于 10 秒 | ________ |
| **费用节省** | 减少超过 30% | ________% |

## 验证

提交以下内容以供审查：

1. 全部 6 项任务的**完整实现**。
2. 覆盖率超过 75% 的**测试套件**。
3. **工作流示例：**
   - 将 Repository 同步至 3 个目标仓库。
   - 将镜像从开发晋升至预发布，再到生产。
   - 应用保留策略并测量节省量。
4. **性能基准测试：**
   - 同步性能（不同镜像大小）。
   - 保留策略执行时间。
5. 仓库的**成本分析报告**。
6. **文档：**
   - `DESIGN.md`：架构。
   - `REGISTRY_API.md`：API 参考。
   - `PROMOTION_WORKFLOW.md`：最佳实践。

## 额外挑战

1. **镜像签名（4–5 小时）：** 集成 Sigstore/Cosign，实现镜像签名与验证。
2. **多架构支持（3–4 小时）：** 处理 AMD64/ARM64 多架构镜像。
3. **Kubernetes Operator（6–8 小时）：** 作为监听 ImagePolicy CRD 的 Kubernetes Operator 部署。
4. **Webhook 集成（2–3 小时）：** 通过 GitHub/GitLab Webhook 触发晋升。
5. **Grafana 仪表盘（3–4 小时）：** 构建展示仓库指标及费用的仪表盘。

## 资源

- [Docker Registry HTTP API V2](https://docs.docker.com/registry/spec/api/)
- [AWS ECR API 参考](https://docs.aws.amazon.com/AmazonECR/latest/APIReference/)
- [GCR/Artifact Registry 文档](https://cloud.google.com/artifact-registry/docs)
- [Azure ACR 文档](https://learn.microsoft.com/en-us/azure/container-registry/)
- [Skopeo——镜像复制工具](https://github.com/containers/skopeo)
- [Crane——容器镜像仓库工具](https://github.com/google/go-containerregistry/tree/main/cmd/crane)

## 交付物检查清单

- [ ] 仓库抽象（base.py、ecr.py、gcr.py、acr.py）。
- [ ] 镜像同步（sync.py）。
- [ ] 晋升流水线（promotion.py）。
- [ ] 保留策略引擎（retention.py）。
- [ ] 审计日志（audit.py）。
- [ ] 成本分析器（cost_analyzer.py）。
- [ ] CLI 界面（cli.py）。
- [ ] 综合测试套件（覆盖率超过 75%）。
- [ ] 配置文件（registries.yaml、策略）。
- [ ] `DESIGN.md`——架构文档。
- [ ] `REGISTRY_API.md`——API 参考。
- [ ] `PROMOTION_WORKFLOW.md`——最佳实践。
- [ ] 性能基准测试。
- [ ] 成本分析报告。

---

**预计完成时长（原文）：** 32–40 小时。

**实践技能：**
- 多云镜像仓库管理。
- Docker Registry HTTP API。
- 镜像同步及复制。
- 晋升流水线与工作流。
- 保留策略及生命周期管理。
- 审计日志与合规。
- 成本优化。

> 译注：GCR 是原文使用的旧服务名称，新建 GCP 项目宜评估 Artifact Registry。不同仓库的拉取计数、删除标签与 Manifest 的语义存在差异，不能直接将低拉取次数等同于未使用；清理前须核对部署引用、回滚版本、镜像索引及共享层，默认采用 Dry-run 和审批。镜像晋升应基于不可变 Digest，验证签名与来源，而非仅依赖可变标签。费用与性能目标为原文案例，并非实测结果。原始代码块及 TODO 保留，未操作真实镜像仓库。
