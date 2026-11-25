# 练习 04：机器学习产物的跨区域复制

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 01–03；具有管理员权限的 AWS 或 GCP 账号

## 目标

构建 `artifact-replicator` 工具，使模型产物与训练数据集在两个云区域之间保持同步，以实现灾难恢复和更低延迟的推理。完成后，你将拥有一个具备幂等性、冲突检测、带宽控制及逐产物完整性验证能力的复制工具。

## 为什么重要

在一个区域训练的模型通常需要在另一个区域提供服务（延迟、监管、灾难恢复等原因）。手写的 `aws s3 sync` 定时任务可能遗漏复制了一半的对象、耗尽带宽配额，并静默忽略完整性问题。健壮的复制工具是机器学习平台团队早期交付的实际工具之一。

## 要求

将 `artifact-replicator` 构建为具有以下命令的 Python 工具：

```text
artifact-replicator status   # show source vs dest manifest diff
artifact-replicator sync     # one-shot replication
artifact-replicator watch    # continuous replication with rate limit
artifact-replicator verify   # validate all replicated objects via SHA256
```

### 功能需求

1. 可配置源与目标存储桶（S3、GCS、Azure Blob 的任意组合）。
2. 只复制**新增或变化的对象**（基于清单，而非每次完整扫描）。
3. **逐对象原子性**：不得暴露部分写入的对象；采用先写临时对象再提交的模式。
4. **带宽限制**（可配置 MB/s，默认 50）。
5. **并发限制**（可配置，默认四个并行传输）。
6. **完整性**：在两端计算并验证 SHA256，不匹配时明确报告失败。
7. **恢复**：中断后从此前进度继续运行。

### 非功能需求

8. **结构化 JSON 日志**：记录每次传输的对象键、大小、耗时与吞吐量。
9. **Prometheus 指标**：`bytes_transferred_total`、`objects_failed_total`、`replication_lag_seconds`。
10. **传输中 TLS 加密**（由云服务商 SDK 处理）。

## 建议结构

```
artifact-replicator/
├── pyproject.toml
├── src/replicator/
│   ├── cli.py
│   ├── backends/        # s3.py, gcs.py, azure.py implementing the same interface
│   ├── manifest.py      # local DB tracking what's been replicated
│   ├── transfer.py      # the per-object replication logic
│   └── limits.py        # bandwidth + concurrency throttling
└── tests/
```

### 后端接口

```python
class StorageBackend(Protocol):
    def list(self, prefix: str = "") -> Iterator[ObjectMeta]: ...
    def get_stream(self, key: str) -> Iterator[bytes]: ...
    def put_stream(self, key: str, stream: Iterator[bytes], size: int) -> str: ...
    def head(self, key: str) -> ObjectMeta | None: ...
    def delete(self, key: str) -> None: ...
```

## 分步操作

### 步骤 1——项目及后端接口（30 分钟）
编写 Protocol，使用 boto3 实现 S3 后端。实现 list、head、get_stream、put_stream。

### 步骤 2——清单（30 分钟）
使用 SQLite 数据库追踪 `(key, src_etag, src_size, src_mtime, dst_etag, dst_size, dst_mtime, last_synced_at)`。使用 SQLAlchemy 或原生 `sqlite3`。

### 步骤 3——差异计算（30 分钟）
`status` 命令比较源对象列表与清单，并输出：
- 新增对象（存在于源端，但不在清单中）。
- 已更新对象（自上次同步以来 ETag 变化）。
- 缺失对象（在清单中，但源端已删除）。
- 已同步对象（无需操作）。

### 步骤 4——原子传输（45 分钟）
```python
def replicate_one(src: Backend, dst: Backend, key: str, rate_limit: int):
    src_meta = src.head(key)
    if not src_meta: return
    temp_key = f".tmp-replication/{uuid.uuid4()}/{key}"
    sha = hashlib.sha256()
    def streamed():
        for chunk in src.get_stream(key):
            sha.update(chunk)
            yield chunk
    dst_etag = dst.put_stream(temp_key, streamed(), src_meta.size)
    dst.rename(temp_key, key)         # atomic per-object
    return ReplicationResult(sha=sha.hexdigest(), etag=dst_etag)
```

### 步骤 5——并发与限速（30 分钟）
使用 `concurrent.futures.ThreadPoolExecutor` 实现并行。使用令牌桶限流器（aiolimiter 或自行实现）控制带宽。

### 步骤 6——验证命令（30 分钟）
重新下载每个已复制的对象，计算 SHA256，并与清单比较。失败时记录日志并以非零退出码退出。

### 步骤 7——监听模式（30 分钟）
`watch` 每隔 N 秒（默认 60 秒）轮询源端并复制增量。拓展目标是使用 S3 事件通知实现真正的推送式复制。

### 步骤 8——测试（30 分钟）
- 单元测试：模拟后端，验证清单计算。
- 集成测试：使用 moto 或 LocalStack 测试 AWS。
- 属性测试：随机生成对象大小，验证校验和一致。

## 交付物

1. 满足全部十项需求的 CLI。
2. 使用 moto/LocalStack 的测试套件。
3. `BENCHMARKS.md`，记录 1,000 个对象工作负载的吞吐量。
4. 简短的 `OPERATIONS.md`，描述如何通过 cron 或 systemd timer 运行该工具。

## 验证

- [ ] `artifact-replicator status` 准确显示存储桶间差异。
- [ ] `sync` 复制 1,000 个随机文件；再次运行报告「0 个新增，0 个更新」。
- [ ] 复制中途终止进程并重启后能够正确完成。
- [ ] `verify` 能发现故意损坏的目标对象。
- [ ] 带宽限制器将传输速度限制在配置的 MB/s 内（通过 iftop 验证）。
- [ ] 所有指标均在 Prometheus 中可见。

## 拓展目标

- 添加带冲突解决机制的**双向复制**（最后写入者获胜，或按键使用用户提供的冲突解决器）。
- 使用 **S3 事件通知**（经由 SQS）替代轮询，实现推送式复制。
- 添加**静态加密验证**：检查目标对象是否使用配置的 KMS Key。

## 常见陷阱

- **aws s3 sync 的语义不等同于正确性保证**——它比较修改时间，而修改时间并非权威内容标识，还可能受时钟等因素影响。使用 ETag 或内容哈希。
- **列举超大存储桶每次需要 O(N)**——利用清单避免每轮完整列举。
- **跨云传输费用**——跨区域或跨云复制产生传输费用；针对每月支出持续告警，而非偶尔检查。
- **流式传输内存膨胀**——不要在内存中累积数据块，而应真正迭代数据流。

> 译注：对象存储通常没有文件系统式原子 rename，需根据提供商采用完整对象提交或复制等机制。ETag 不一定是内容哈希；清单本身也不能发现未扫描的新增对象，需配合事件或增量索引。aiolimiter 适用于 asyncio，不应直接在多个线程间共享其异步实例。
