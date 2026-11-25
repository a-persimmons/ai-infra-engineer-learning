# 练习 03：云端灾难恢复系统

## 学习目标

完成本练习后，你将能够：
- 设计并实现灾难恢复（DR）策略。
- 构建自动化备份及恢复系统。
- 实现多区域故障转移。
- 测试恢复时间目标（RTO）与恢复点目标（RPO）。
- 创建灾难场景运行手册。

## 概览

生产 ML 系统需要健壮的灾难恢复能力，以应对服务中断、数据丢失及区域故障。本练习构建综合灾难恢复系统，具有自动备份、多区域复制及故障转移能力。

## 前置条件

- 多云或多区域云平台账号。
- 理解 RTO/RPO 概念。
- Kubernetes 知识。
- Terraform 使用经验。
- Python 3.11+。

## 问题描述

构建灾难恢复系统，具备以下能力：

1. **自动备份：** 关键数据与配置。
2. **跨区域复制：** 提供地理冗余。
3. **检测故障：** 自动触发故障转移。
4. **恢复服务：** 尽量减少停机时间。
5. **定期测试：** 灾难恢复流程。
6. **维持合规：** 遵循备份保留策略。

## 需求

### 功能需求

#### FR1：备份管理
- 自动备份：
  - Kubernetes 集群配置（etcd 备份）。
  - 持久卷（ML 模型、数据集）。
  - 数据库（PostgreSQL 导出）。
  - 应用配置（ConfigMap、Secret）。
  - 容器镜像。
- 可配置备份频率（每小时、每天、每周）。
- 保留策略（7 天、30 天、90 天、1 年）。
- 增量备份与全量备份。
- 加密备份。

#### FR2：跨区域复制
- 将备份复制至次要区域。
- 使用异步复制改善性能。
- 完整性验证。
- 带宽限制。
- 监控复制延迟。

#### FR3：自动化故障转移
- 健康检查监控。
- 自动触发故障转移。
- 自动更新 DNS。
- 将流量路由至灾备站点。
- 通知系统。

#### FR4：恢复流程
- 时间点恢复（PITR）。
- 自动化恢复测试。
- 回滚能力。
- 恢复后数据验证。

#### FR5：监控与告警
- 备份成功/失败告警。
- 复制延迟告警。
- 灾难恢复测试结果。
- RTO/RPO 达标情况追踪。

### 非功能需求

#### NFR1：恢复时间目标（RTO）
- 关键服务：低于 1 小时。
- 非关键服务：低于 4 小时。
- 数据服务：低于 30 分钟。

#### NFR2：恢复点目标（RPO）
- 关键数据：低于 15 分钟。
- 标准数据：低于 1 小时。
- 归档数据：低于 24 小时。

#### NFR3：可靠性
- 备份成功率：超过 99.9%。
- 恢复成功率：超过 99%。
- 故障转移时间：低于 5 分钟。

#### NFR4：安全
- 加密备份（AES-256）。
- 恢复操作的访问控制。
- 审计日志。
- 合规要求（SOC 2、HIPAA、GDPR）。

## 实现任务

### 任务 1：备份架构设计（3–4 小时）

设计灾难恢复架构：

```python
# src/dr_config.py

from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum
from datetime import timedelta

class BackupType(Enum):
    """Backup types"""
    FULL = "full"
    INCREMENTAL = "incremental"
    DIFFERENTIAL = "differential"

class BackupFrequency(Enum):
    """Backup frequency"""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

@dataclass
class RetentionPolicy:
    """Backup retention policy"""
    hourly_keep: int = 24  # Keep 24 hourly backups
    daily_keep: int = 7    # Keep 7 daily backups
    weekly_keep: int = 4   # Keep 4 weekly backups
    monthly_keep: int = 12  # Keep 12 monthly backups

@dataclass
class BackupTarget:
    """What to backup"""
    name: str
    type: str  # "kubernetes", "database", "storage", "configuration"
    source_location: str
    backup_type: BackupType
    frequency: BackupFrequency
    retention: RetentionPolicy
    encryption_enabled: bool = True
    compression_enabled: bool = True
    priority: int = 1  # 1=critical, 2=high, 3=medium, 4=low

@dataclass
class DRConfig:
    """Disaster recovery configuration"""
    primary_region: str
    secondary_region: str
    backup_storage_bucket: str
    rto_target_minutes: int  # Recovery Time Objective
    rpo_target_minutes: int  # Recovery Point Objective

    backup_targets: List[BackupTarget]
    notification_channels: List[str]  # Email, Slack, PagerDuty

    # Failover settings
    auto_failover_enabled: bool = False
    health_check_interval_seconds: int = 60
    failover_threshold_failures: int = 3

    def validate(self) -> List[str]:
        """
        TODO: Validate DR configuration

        Check:
        - RTO/RPO are reasonable
        - Backup targets don't conflict
        - Regions are valid
        - Storage bucket exists
        """
        pass

# Example configuration
DEFAULT_DR_CONFIG = DRConfig(
    primary_region="us-east-1",
    secondary_region="us-west-2",
    backup_storage_bucket="ml-infra-dr-backups",
    rto_target_minutes=60,
    rpo_target_minutes=15,
    backup_targets=[
        BackupTarget(
            name="kubernetes-etcd",
            type="kubernetes",
            source_location="etcd://cluster",
            backup_type=BackupType.FULL,
            frequency=BackupFrequency.HOURLY,
            retention=RetentionPolicy(hourly_keep=24, daily_keep=7),
            priority=1
        ),
        BackupTarget(
            name="ml-models",
            type="storage",
            source_location="s3://ml-models-prod",
            backup_type=BackupType.INCREMENTAL,
            frequency=BackupFrequency.DAILY,
            retention=RetentionPolicy(daily_keep=30, weekly_keep=12),
            priority=1
        ),
        BackupTarget(
            name="metadata-db",
            type="database",
            source_location="postgresql://metadata-db",
            backup_type=BackupType.FULL,
            frequency=BackupFrequency.HOURLY,
            retention=RetentionPolicy(hourly_keep=48, daily_keep=7),
            priority=1
        ),
    ],
    notification_channels=["email:ops@company.com", "slack:#infrastructure"],
    auto_failover_enabled=False  # Manual failover for safety
)
```

**验收标准：**
- [ ] 已定义 DR 配置模型。
- [ ] 已指定 RTO/RPO 目标。
- [ ] 已配置备份目标。
- [ ] 已定义保留策略。
- [ ] 已实现验证逻辑。

---

### 任务 2：Kubernetes 备份系统（6–7 小时）

实现 Kubernetes 集群备份：

```python
# src/backup/kubernetes.py

import subprocess
import boto3
from kubernetes import client, config
from datetime import datetime
from pathlib import Path
from typing import Optional
import json
import yaml

class KubernetesBackup:
    """Backup Kubernetes resources"""

    def __init__(
        self,
        cluster_name: str,
        backup_bucket: str,
        region: str = "us-east-1"
    ):
        self.cluster_name = cluster_name
        self.backup_bucket = backup_bucket
        self.region = region
        self.s3_client = boto3.client('s3', region_name=region)

        # Load kubeconfig
        config.load_kube_config()
        self.core_v1 = client.CoreV1Api()
        self.apps_v1 = client.AppsV1Api()

    def backup_etcd(
        self,
        output_dir: Path
    ) -> Optional[Path]:
        """
        TODO: Backup etcd database

        For managed Kubernetes (EKS, GKE, AKS), etcd is managed by provider.
        Backup via:
        - AWS: EKS snapshots
        - GCP: GKE backup for GKE
        - Azure: AKS snapshots

        For self-managed:
        ```python
        backup_path = output_dir / f"etcd-backup-{datetime.now().isoformat()}.db"

        # Run etcdctl snapshot
        cmd = [
            "etcdctl",
            "--endpoints=https://127.0.0.1:2379",
            "--cacert=/etc/kubernetes/pki/etcd/ca.crt",
            "--cert=/etc/kubernetes/pki/etcd/server.crt",
            "--key=/etc/kubernetes/pki/etcd/server.key",
            "snapshot", "save", str(backup_path)
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            # Upload to S3
            self._upload_to_s3(backup_path, f"etcd/{backup_path.name}")
            return backup_path

        return None
        ```
        """
        pass

    def backup_all_resources(
        self,
        output_dir: Path,
        namespaces: Optional[List[str]] = None
    ) -> Dict[str, int]:
        """
        TODO: Backup all Kubernetes resources

        ```python
        if namespaces is None:
            # Get all namespaces
            ns_list = self.core_v1.list_namespace()
            namespaces = [ns.metadata.name for ns in ns_list.items]

        backup_counts = {}

        for namespace in namespaces:
            ns_dir = output_dir / namespace
            ns_dir.mkdir(parents=True, exist_ok=True)

            # Backup deployments
            deployments = self.apps_v1.list_namespaced_deployment(namespace)
            for deploy in deployments.items:
                self._save_resource(
                    deploy.to_dict(),
                    ns_dir / f"deployment-{deploy.metadata.name}.yaml"
                )

            # Backup services
            services = self.core_v1.list_namespaced_service(namespace)
            for svc in services.items:
                self._save_resource(
                    svc.to_dict(),
                    ns_dir / f"service-{svc.metadata.name}.yaml"
                )

            # Backup ConfigMaps
            configmaps = self.core_v1.list_namespaced_config_map(namespace)
            for cm in configmaps.items:
                self._save_resource(
                    cm.to_dict(),
                    ns_dir / f"configmap-{cm.metadata.name}.yaml"
                )

            # Backup Secrets (encrypted!)
            secrets = self.core_v1.list_namespaced_secret(namespace)
            for secret in secrets.items:
                self._save_resource(
                    secret.to_dict(),
                    ns_dir / f"secret-{secret.metadata.name}.yaml",
                    encrypt=True
                )

            # Count resources
            backup_counts[namespace] = (
                len(deployments.items) +
                len(services.items) +
                len(configmaps.items) +
                len(secrets.items)
            )

        # Upload entire directory to S3
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        self._upload_directory(
            output_dir,
            f"kubernetes/{self.cluster_name}/{timestamp}/"
        )

        return backup_counts
        ```
        """
        pass

    def backup_persistent_volumes(
        self,
        namespace: Optional[str] = None
    ) -> List[str]:
        """
        TODO: Backup PersistentVolumes

        For cloud volumes:
        - Create snapshots using cloud provider APIs
        - AWS: EBS snapshots
        - GCP: Persistent Disk snapshots
        - Azure: Disk snapshots

        ```python
        pvcs = self.core_v1.list_namespaced_persistent_volume_claim(namespace)

        snapshot_ids = []

        for pvc in pvcs.items:
            volume_id = self._get_volume_id(pvc)

            # Create snapshot (cloud-specific)
            snapshot_id = self._create_volume_snapshot(volume_id)
            snapshot_ids.append(snapshot_id)

            # Tag snapshot
            self._tag_snapshot(
                snapshot_id,
                {
                    "Name": f"{pvc.metadata.namespace}/{pvc.metadata.name}",
                    "BackupDate": datetime.now().isoformat(),
                    "Cluster": self.cluster_name
                }
            )

        return snapshot_ids
        ```
        """
        pass

    def restore_resources(
        self,
        backup_path: Path,
        dry_run: bool = False
    ) -> Dict[str, List[str]]:
        """
        TODO: Restore Kubernetes resources from backup

        ```python
        restored = {
            "deployments": [],
            "services": [],
            "configmaps": [],
            "secrets": []
        }

        # Read all YAML files
        for yaml_file in backup_path.rglob("*.yaml"):
            with open(yaml_file) as f:
                resource = yaml.safe_load(f)

            # Determine resource type and restore
            kind = resource.get("kind", "").lower()

            if kind == "deployment":
                if not dry_run:
                    self.apps_v1.create_namespaced_deployment(
                        namespace=resource["metadata"]["namespace"],
                        body=resource
                    )
                restored["deployments"].append(resource["metadata"]["name"])

            # Similar for other resource types...

        return restored
        ```
        """
        pass

    def _save_resource(
        self,
        resource: Dict,
        path: Path,
        encrypt: bool = False
    ) -> None:
        """TODO: Save resource to YAML file, optionally encrypt"""
        pass

    def _upload_to_s3(
        self,
        local_path: Path,
        s3_key: str
    ) -> None:
        """TODO: Upload file to S3"""
        pass

    def _upload_directory(
        self,
        local_dir: Path,
        s3_prefix: str
    ) -> None:
        """TODO: Upload entire directory to S3"""
        pass
```

**验收标准：**
- [ ] 备份全部所需 Kubernetes 资源。
- [ ] 处理 etcd 备份（或托管服务的等效机制）。
- [ ] 创建卷快照。
- [ ] 加密敏感数据。
- [ ] 上传至 S3/GCS/Blob。
- [ ] 实现恢复功能。

---

### 任务 3：数据库备份系统（5–6 小时）

```python
# src/backup/database.py

import subprocess
import psycopg2
from datetime import datetime
from pathlib import Path
from typing import Optional
import gzip
import boto3

class DatabaseBackup:
    """Backup PostgreSQL databases"""

    def __init__(
        self,
        db_host: str,
        db_port: int,
        db_name: str,
        db_user: str,
        db_password: str,
        backup_bucket: str
    ):
        self.db_host = db_host
        self.db_port = db_port
        self.db_name = db_name
        self.db_user = db_user
        self.db_password = db_password
        self.backup_bucket = backup_bucket
        self.s3_client = boto3.client('s3')

    def create_full_backup(
        self,
        output_dir: Path,
        compress: bool = True
    ) -> Optional[Path]:
        """
        TODO: Create full database backup

        ```python
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_file = output_dir / f"{self.db_name}-{timestamp}.sql"

        # Run pg_dump
        env = {
            "PGPASSWORD": self.db_password
        }

        cmd = [
            "pg_dump",
            "-h", self.db_host,
            "-p", str(self.db_port),
            "-U", self.db_user,
            "-F", "c",  # Custom format (for pg_restore)
            "-b",  # Include BLOBs
            "-v",  # Verbose
            "-f", str(backup_file),
            self.db_name
        ]

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise RuntimeError(f"pg_dump failed: {result.stderr}")

        # Compress
        if compress:
            compressed_file = self._compress_file(backup_file)
            backup_file.unlink()  # Remove uncompressed
            backup_file = compressed_file

        # Upload to S3
        s3_key = f"database/{self.db_name}/{backup_file.name}"
        self.s3_client.upload_file(
            str(backup_file),
            self.backup_bucket,
            s3_key
        )

        # Add metadata
        self.s3_client.put_object_tagging(
            Bucket=self.backup_bucket,
            Key=s3_key,
            Tagging={
                'TagSet': [
                    {'Key': 'BackupType', 'Value': 'full'},
                    {'Key': 'Database', 'Value': self.db_name},
                    {'Key': 'Timestamp', 'Value': timestamp}
                ]
            }
        )

        return backup_file
        ```
        """
        pass

    def create_incremental_backup(
        self,
        last_backup_time: datetime,
        output_dir: Path
    ) -> Optional[Path]:
        """
        TODO: Create incremental backup (WAL-based)

        PostgreSQL Write-Ahead Logging (WAL) for incremental backups

        ```python
        # Enable continuous archiving
        # Configure postgresql.conf:
        # wal_level = replica
        # archive_mode = on
        # archive_command = 'cp %p /backup/wal/%f'

        # Collect WAL files since last backup
        wal_files = self._get_wal_files_since(last_backup_time)

        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        incremental_file = output_dir / f"{self.db_name}-incremental-{timestamp}.tar.gz"

        # Tar and compress WAL files
        self._create_archive(wal_files, incremental_file)

        # Upload
        s3_key = f"database/{self.db_name}/incremental/{incremental_file.name}"
        self.s3_client.upload_file(
            str(incremental_file),
            self.backup_bucket,
            s3_key
        )

        return incremental_file
        ```
        """
        pass

    def restore_database(
        self,
        backup_file: Path,
        target_db_name: Optional[str] = None,
        point_in_time: Optional[datetime] = None
    ) -> bool:
        """
        TODO: Restore database from backup

        ```python
        target_db = target_db_name or self.db_name

        # Drop existing database (if exists)
        if self._database_exists(target_db):
            self._drop_database(target_db)

        # Create new database
        self._create_database(target_db)

        # Download from S3 if needed
        if not backup_file.exists():
            s3_key = f"database/{self.db_name}/{backup_file.name}"
            self.s3_client.download_file(
                self.backup_bucket,
                s3_key,
                str(backup_file)
            )

        # Decompress if needed
        if backup_file.suffix == '.gz':
            backup_file = self._decompress_file(backup_file)

        # Run pg_restore
        env = {"PGPASSWORD": self.db_password}

        cmd = [
            "pg_restore",
            "-h", self.db_host,
            "-p", str(self.db_port),
            "-U", self.db_user,
            "-d", target_db,
            "-v",
            str(backup_file)
        ]

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True
        )

        # Point-in-time recovery (if WAL available)
        if point_in_time:
            self._apply_wal_until(target_db, point_in_time)

        return result.returncode == 0
        ```
        """
        pass

    def test_backup(
        self,
        backup_file: Path
    ) -> Dict[str, any]:
        """
        TODO: Test backup integrity

        ```python
        test_db = f"{self.db_name}_test_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        try:
            # Restore to test database
            success = self.restore_database(backup_file, test_db)

            if not success:
                return {"valid": False, "error": "Restore failed"}

            # Verify tables exist
            tables = self._list_tables(test_db)

            # Count rows
            row_counts = {}
            for table in tables:
                count = self._count_rows(test_db, table)
                row_counts[table] = count

            # Drop test database
            self._drop_database(test_db)

            return {
                "valid": True,
                "tables": len(tables),
                "row_counts": row_counts
            }

        except Exception as e:
            return {"valid": False, "error": str(e)}
        ```
        """
        pass

    def _compress_file(self, file_path: Path) -> Path:
        """TODO: Compress file with gzip"""
        pass

    def _decompress_file(self, file_path: Path) -> Path:
        """TODO: Decompress gzip file"""
        pass

    def _database_exists(self, db_name: str) -> bool:
        """TODO: Check if database exists"""
        pass

    def _create_database(self, db_name: str) -> None:
        """TODO: Create database"""
        pass

    def _drop_database(self, db_name: str) -> None:
        """TODO: Drop database"""
        pass
```

**验收标准：**
- [ ] 创建全量数据库备份。
- [ ] 支持基于 WAL 的增量恢复机制。
- [ ] 从备份恢复。
- [ ] 支持时间点恢复。
- [ ] 测试备份完整性。
- [ ] 压缩及加密。

---

### 任务 4：跨区域复制（5–6 小时）

```python
# src/replication/cross_region.py

import boto3
from typing import Dict, List
from datetime import datetime, timedelta
import hashlib

class CrossRegionReplicator:
    """Replicate backups across regions"""

    def __init__(
        self,
        primary_bucket: str,
        primary_region: str,
        secondary_bucket: str,
        secondary_region: str
    ):
        self.primary_bucket = primary_bucket
        self.primary_region = primary_region
        self.secondary_bucket = secondary_bucket
        self.secondary_region = secondary_region

        self.primary_s3 = boto3.client('s3', region_name=primary_region)
        self.secondary_s3 = boto3.client('s3', region_name=secondary_region)

    def setup_replication(self) -> None:
        """
        TODO: Set up S3 cross-region replication

        ```python
        # Enable versioning (required for replication)
        self.primary_s3.put_bucket_versioning(
            Bucket=self.primary_bucket,
            VersioningConfiguration={'Status': 'Enabled'}
        )

        self.secondary_s3.put_bucket_versioning(
            Bucket=self.secondary_bucket,
            VersioningConfiguration={'Status': 'Enabled'}
        )

        # Create replication role
        role_arn = self._create_replication_role()

        # Configure replication rule
        replication_config = {
            'Role': role_arn,
            'Rules': [
                {
                    'ID': 'ReplicateAll',
                    'Priority': 1,
                    'Filter': {},
                    'Status': 'Enabled',
                    'Destination': {
                        'Bucket': f'arn:aws:s3:::{self.secondary_bucket}',
                        'ReplicationTime': {
                            'Status': 'Enabled',
                            'Time': {'Minutes': 15}
                        },
                        'Metrics': {
                            'Status': 'Enabled',
                            'EventThreshold': {'Minutes': 15}
                        }
                    },
                    'DeleteMarkerReplication': {'Status': 'Enabled'}
                }
            ]
        }

        self.primary_s3.put_bucket_replication(
            Bucket=self.primary_bucket,
            ReplicationConfiguration=replication_config
        )
        ```
        """
        pass

    def check_replication_status(self) -> Dict[str, any]:
        """
        TODO: Check replication status

        ```python
        # Get replication metrics
        response = self.primary_s3.get_bucket_replication(
            Bucket=self.primary_bucket
        )

        # Check for pending objects
        pending = self._count_pending_replication()

        # Check replication lag
        lag_minutes = self._calculate_replication_lag()

        return {
            "status": "healthy" if lag_minutes < 30 else "degraded",
            "pending_objects": pending,
            "replication_lag_minutes": lag_minutes,
            "last_check": datetime.now().isoformat()
        }
        ```
        """
        pass

    def manual_sync(
        self,
        prefix: Optional[str] = None,
        max_objects: int = 1000
    ) -> Dict[str, int]:
        """
        TODO: Manually sync objects (for testing or catch-up)

        ```python
        # List objects in primary
        paginator = self.primary_s3.get_paginator('list_objects_v2')
        pages = paginator.paginate(
            Bucket=self.primary_bucket,
            Prefix=prefix or ''
        )

        synced = 0
        failed = 0

        for page in pages:
            if 'Contents' not in page:
                continue

            for obj in page['Contents']:
                if synced >= max_objects:
                    break

                try:
                    # Check if object exists in secondary
                    if self._object_needs_sync(obj['Key'], obj['ETag']):
                        # Copy object
                        copy_source = {
                            'Bucket': self.primary_bucket,
                            'Key': obj['Key']
                        }

                        self.secondary_s3.copy_object(
                            CopySource=copy_source,
                            Bucket=self.secondary_bucket,
                            Key=obj['Key']
                        )

                        synced += 1

                except Exception as e:
                    failed += 1

        return {
            "synced": synced,
            "failed": failed
        }
        ```
        """
        pass

    def verify_integrity(
        self,
        sample_size: int = 100
    ) -> Dict[str, any]:
        """
        TODO: Verify replicated objects match source

        Compare checksums of random sample
        """
        pass

    def _create_replication_role(self) -> str:
        """TODO: Create IAM role for replication"""
        pass

    def _count_pending_replication(self) -> int:
        """TODO: Count objects pending replication"""
        pass

    def _calculate_replication_lag(self) -> float:
        """TODO: Calculate replication lag in minutes"""
        pass

    def _object_needs_sync(self, key: str, etag: str) -> bool:
        """TODO: Check if object needs syncing"""
        pass
```

**验收标准：**
- [ ] 配置跨区域复制。
- [ ] 监控复制状态。
- [ ] 支持手动同步。
- [ ] 验证完整性。
- [ ] 处理复制故障。

---

### 任务 5：自动化故障转移（5–6 小时）

```python
# src/failover/orchestrator.py

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import boto3
import time

class FailoverOrchestrator:
    """Orchestrate disaster recovery failover"""

    def __init__(self, dr_config: DRConfig):
        self.config = dr_config
        self.primary_healthy = True
        self.failover_in_progress = False

    def check_health(self) -> Dict[str, any]:
        """
        TODO: Check primary region health

        ```python
        checks = {
            "kubernetes": self._check_kubernetes_health(),
            "database": self._check_database_health(),
            "storage": self._check_storage_health(),
            "network": self._check_network_connectivity()
        }

        all_healthy = all(check["healthy"] for check in checks.values())

        return {
            "healthy": all_healthy,
            "checks": checks,
            "timestamp": datetime.now().isoformat()
        }
        ```
        """
        pass

    def initiate_failover(
        self,
        reason: str,
        dry_run: bool = False
    ) -> Dict[str, any]:
        """
        TODO: Initiate failover to secondary region

        Steps:
        1. Verify secondary is healthy
        2. Stop writes to primary
        3. Restore latest backups to secondary
        4. Update DNS to point to secondary
        5. Start services in secondary
        6. Verify functionality
        7. Notify stakeholders

        ```python
        if self.failover_in_progress:
            return {"status": "error", "message": "Failover already in progress"}

        self.failover_in_progress = True
        steps = []

        try:
            # Step 1: Verify secondary
            steps.append(self._verify_secondary_region())

            # Step 2: Stop primary writes
            if not dry_run:
                steps.append(self._stop_primary_writes())

            # Step 3: Restore to secondary
            steps.append(self._restore_to_secondary())

            # Step 4: Update DNS
            if not dry_run:
                steps.append(self._update_dns_to_secondary())

            # Step 5: Start services
            steps.append(self._start_secondary_services())

            # Step 6: Verify
            steps.append(self._verify_secondary_functionality())

            # Step 7: Notify
            steps.append(self._send_notifications(reason))

            return {
                "status": "success",
                "steps": steps,
                "failover_time": datetime.now().isoformat()
            }

        except Exception as e:
            # Rollback if possible
            self._rollback_failover(steps)
            return {
                "status": "failed",
                "error": str(e),
                "completed_steps": steps
            }

        finally:
            self.failover_in_progress = False
        ```
        """
        pass

    def failback(
        self,
        dry_run: bool = False
    ) -> Dict[str, any]:
        """
        TODO: Failback to primary region

        Similar to failover but reverse direction
        """
        pass

    def test_failover(self) -> Dict[str, any]:
        """
        TODO: Test failover procedure (dry run)

        Run all failover steps without actually switching production traffic
        """
        pass

    def _check_kubernetes_health(self) -> Dict[str, bool]:
        """TODO: Check K8s cluster health"""
        pass

    def _check_database_health(self) -> Dict[str, bool]:
        """TODO: Check database health"""
        pass

    def _check_storage_health(self) -> Dict[str, bool]:
        """TODO: Check storage availability"""
        pass

    def _check_network_connectivity(self) -> Dict[str, bool]:
        """TODO: Check network connectivity"""
        pass

    def _verify_secondary_region(self) -> Dict:
        """TODO: Verify secondary region is ready"""
        pass

    def _stop_primary_writes(self) -> Dict:
        """TODO: Stop writes to primary (read-only mode)"""
        pass

    def _restore_to_secondary(self) -> Dict:
        """TODO: Restore latest backups to secondary"""
        pass

    def _update_dns_to_secondary(self) -> Dict:
        """
        TODO: Update Route53/Cloud DNS to point to secondary

        ```python
        # Update Route53 record
        route53 = boto3.client('route53')

        response = route53.change_resource_record_sets(
            HostedZoneId=self.config.hosted_zone_id,
            ChangeBatch={
                'Changes': [
                    {
                        'Action': 'UPSERT',
                        'ResourceRecordSet': {
                            'Name': self.config.service_domain,
                            'Type': 'A',
                            'TTL': 60,
                            'ResourceRecords': [
                                {'Value': self.config.secondary_lb_ip}
                            ]
                        }
                    }
                ]
            }
        )

        # Wait for DNS propagation
        time.sleep(120)

        return {"status": "success", "change_id": response['ChangeInfo']['Id']}
        ```
        """
        pass

    def _start_secondary_services(self) -> Dict:
        """TODO: Start services in secondary region"""
        pass

    def _verify_secondary_functionality(self) -> Dict:
        """TODO: Verify secondary is functioning"""
        pass

    def _send_notifications(self, reason: str) -> Dict:
        """TODO: Send notifications via email/Slack/PagerDuty"""
        pass

    def _rollback_failover(self, completed_steps: List[Dict]) -> None:
        """TODO: Rollback failover if it fails"""
        pass
```

**验收标准：**
- [ ] 实现健康检查。
- [ ] 自动化故障转移流程。
- [ ] 实现故障回切流程。
- [ ] 自动更新 DNS。
- [ ] 发送通知。
- [ ] 具备回滚能力。

---

### 任务 6：灾难恢复测试框架（4–5 小时）

```python
# src/testing/dr_test.py

from typing import Dict, List
from datetime import datetime
import schedule
import time

class DRTestFramework:
    """Test disaster recovery procedures"""

    def __init__(self, dr_config: DRConfig):
        self.config = dr_config
        self.test_results = []

    def run_full_dr_test(self) -> Dict[str, any]:
        """
        TODO: Run complete DR test

        ```python
        results = {
            "test_date": datetime.now().isoformat(),
            "tests": {},
            "overall_status": "pass"
        }

        # Test backup creation
        results["tests"]["backup"] = self._test_backup_creation()

        # Test restore
        results["tests"]["restore"] = self._test_restore_procedure()

        # Test replication
        results["tests"]["replication"] = self._test_replication()

        # Test failover (dry run)
        results["tests"]["failover"] = self._test_failover_procedure()

        # Test RTO/RPO compliance
        results["tests"]["rto_rpo"] = self._test_rto_rpo_compliance()

        # Determine overall status
        if any(test["status"] == "fail" for test in results["tests"].values()):
            results["overall_status"] = "fail"

        # Save results
        self.test_results.append(results)

        # Generate report
        self._generate_test_report(results)

        return results
        ```
        """
        pass

    def schedule_regular_tests(self) -> None:
        """
        TODO: Schedule regular DR tests

        ```python
        # Weekly backup test
        schedule.every().monday.at("02:00").do(self._test_backup_creation)

        # Monthly restore test
        schedule.every().month.at("03:00").do(self._test_restore_procedure)

        # Quarterly full DR test
        schedule.every(3).months.do(self.run_full_dr_test)

        # Run scheduler
        while True:
            schedule.run_pending()
            time.sleep(60)
        ```
        """
        pass

    def _test_backup_creation(self) -> Dict:
        """
        TODO: Test backup creation

        Create backups and verify:
        - Backup completes successfully
        - Backup file exists
        - Backup is uploaded to storage
        - Backup metadata is correct
        """
        pass

    def _test_restore_procedure(self) -> Dict:
        """
        TODO: Test restore from backup

        Restore to test environment and verify:
        - Restore completes successfully
        - Data integrity maintained
        - All resources restored
        - Application functions correctly
        """
        pass

    def _test_replication(self) -> Dict:
        """
        TODO: Test cross-region replication

        Verify:
        - Replication is active
        - Replication lag < threshold
        - All objects replicated
        - Integrity verified
        """
        pass

    def _test_failover_procedure(self) -> Dict:
        """
        TODO: Test failover (dry run)

        Run failover without switching production:
        - Secondary region can be activated
        - DNS can be updated
        - Services start correctly
        - Health checks pass
        """
        pass

    def _test_rto_rpo_compliance(self) -> Dict:
        """
        TODO: Test RTO/RPO compliance

        Measure actual RTO and RPO vs targets
        """
        pass

    def _generate_test_report(self, results: Dict) -> None:
        """TODO: Generate HTML test report"""
        pass
```

**验收标准：**
- [ ] 完整的灾难恢复测试套件。
- [ ] 定期调度测试。
- [ ] 测试 RTO/RPO 达标情况。
- [ ] 报告测试结果。
- [ ] 自动执行测试。

---

## 交付物

1. **备份系统**
   - Kubernetes 备份。
   - 数据库备份。
   - 存储备份。
   - 配置备份。

2. **复制**
   - 跨区域复制。
   - 完整性验证。

3. **故障转移**
   - 自动化故障转移。
   - DNS 更新。
   - 健康检查。

4. **测试**
   - 灾难恢复测试框架。
   - 定时测试。
   - 达标情况报告。

5. **文档**
   - 运行手册。
   - 恢复流程。
   - 测试报告。

---

## 评分标准

| 标准 | 权重 |
|---|---|
| **完整性** | 30% |
| **RTO/RPO 达标情况** | 25% |
| **自动化** | 20% |
| **测试** | 15% |
| **文档** | 10% |

**及格：** 70% 以上。
**优秀：** 90% 以上。

---

## 预计时长

- 任务 1：3–4 小时。
- 任务 2：6–7 小时。
- 任务 3：5–6 小时。
- 任务 4：5–6 小时。
- 任务 5：5–6 小时。
- 任务 6：4–5 小时。
- 测试：5–6 小时。
- 文档：3–4 小时。

**合计：** 36–44 小时。

---

**本练习培养构建可靠、具有韧性及适当灾难恢复能力的 ML 基础设施所需的关键技能。**

> 译注：RTO/RPO 及成功率均为原文练习目标，不是实际保障。PostgreSQL 的时间点恢复通常需要基础备份与连续 WAL 归档。托管 Kubernetes 不一定允许直接访问 etcd；应采用服务商支持的备份机制。故障转移需要防止双主写入、数据冲突和误触发，DNS 更新也受缓存及 TTL 影响。灾备副本应具备独立的权限保护及不可变保留策略。备份加密不等同于满足全部合规要求。原始代码及 TODO 保留，未执行真实故障转移。
