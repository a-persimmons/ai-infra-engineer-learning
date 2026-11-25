# 练习 09：数据回填策略

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 练习 02（Airflow）与 08（血缘）

## 目标

实现三种回填策略（串行、按日期并行、按分片并行），并针对真实工作负载开展基准测试。增加安全约束——并发上限、依赖感知排序、试运行模式、局部重跑支持——防止意外回填生产数据导致数据库过载。

## 为什么重要

回填是数据工程中风险较高的常规操作。操作不当可能覆盖正确数据、耗尽下游 API 容量，或造成难以察觉的数据缺口。正确执行时，它只是日常维护；错误执行时，可能需要一个季度进行清理。

## 要求

1. 实现并测试三种回填策略。
2. 并发上限可配置。
3. 考虑依赖关系的执行顺序（不要先回填子任务再回填父任务）。
4. 试运行模式：生成执行计划，不写入任何数据。
5. 支持局部重跑：仅回填失败的子区间，无需全部重跑。
6. 为每次回填操作生成审计日志。

## 场景

每日聚合 DAG（`daily_user_activity`）自 2025-01-01 起运行。昨天修复了聚合逻辑中的一个 Bug，需要回填六个月的历史数据。

约束：
- 下游 API 限流为 1,000 req/s。
- 源数据库最多支持 20 个并发连接。
- 每日聚合通常耗时 15 分钟。
- 成本：每天的聚合约 0.10 美元。

## 分步操作

### 步骤 1——串行回填（30 分钟）
```bash
airflow dags backfill daily_user_activity \
  --start-date 2025-01-01 \
  --end-date 2025-06-30 \
  --rerun-failed-tasks
```
逐日串行运行。耗时：180 天 × 15 分钟 = 45 小时。

### 步骤 2——按日期并行（30 分钟）
将 `--max-active-runs` 限制在安全值：
```bash
airflow dags backfill daily_user_activity \
  --start-date 2025-01-01 \
  --end-date 2025-06-30 \
  --conf '{"max_active_runs": 10}'
```
同时运行十天的数据。耗时：180 / 10 × 15 分钟 = 4.5 小时。

但如果十个并发 DAG 各自占用约十个数据库连接，总计 100 个连接，就会超过数据库上限。
将 `--max-active-runs` 降为 2，以保证连接安全。更好的方法如下。

### 步骤 3——按日期并行并隔离 Worker（45 分钟）
使用 Airflow Pool 将回填任务与实时任务隔离：
```python
ingest = BashOperator(
    task_id="ingest",
    bash_command="...",
    pool="backfill_pool",
    pool_slots=1,
)
```
创建 Pool：为回填分配五个槽位，与默认 Pool 分开。

### 步骤 4——按分片并行（60 分钟）
将单个日期的工作按分片拆分（例如按 user_id 范围）：
```python
@task
def aggregate_shard(date: str, shard_id: int, num_shards: int) -> str:
    df = read_shard(date, shard_id, num_shards)
    return write_aggregate(df)

# Dynamic task mapping
shards = aggregate_shard.partial(date="{{ ds }}", num_shards=8).expand(shard_id=range(8))
```
现在一天的数据拆成八个分片并行处理，每天约两分钟；180 天串行约六小时；若五天同时处理，每天八个分片，总计约 36 分钟。

> 译注：以上是理想化耗时估计，需要同时验证数据库连接、API 限流与 Worker 容量。

### 步骤 5——试运行模式（30 分钟）
为自定义回填工具添加 `--dry-run`，打印计划但不执行：
```python
def backfill(start, end, dry_run=False):
    dates = pd.date_range(start, end)
    plan = []
    for date in dates:
        if dependencies_satisfied(date):
            plan.append({"date": str(date), "shards": list_shards(date), "estimated_cost": 0.10})
    if dry_run:
        print(json.dumps(plan, indent=2))
        return
    # actually execute
```

### 步骤 6——局部重跑（30 分钟）
在回填状态文件中追踪每日状态：
```python
# backfill_state.json
{
  "2025-01-01": {"status": "success", "shards_done": 8},
  "2025-01-02": {"status": "failed", "shards_done": 5, "failed_shards": [5,6,7]},
  ...
}
```
重新运行回填时，从失败处继续。

### 步骤 7——审计日志（15 分钟）
每次回填操作均追加到 `audit.jsonl`：
```json
{"ts": "2026-05-22T15:00:00Z", "user": "alice", "command": "backfill daily_user_activity 2025-01-01..2025-06-30", "result": "success", "days_processed": 180}
```

## 交付物

1. 实现各策略的自定义 `backfill.py` CLI。
2. `BENCHMARKS.md`：比较三种策略的实际运行时间。
3. `PLAYBOOK.md`：回填前检查清单（通知频道、再次核对日期范围、先试运行）。
4. 包含至少三次测试回填的审计日志文件。

## 验证

- [ ] 串行回填可以运行（较慢但安全）。
- [ ] 按日期并行遵守 max-active-runs 上限。
- [ ] 按分片并行相比串行达到预计约五倍加速。
- [ ] 试运行生成计划且没有副作用。
- [ ] 局部重跑从失败处继续，不重复执行已成功的日期。
- [ ] 审计日志记录所有操作。

## 拓展目标

- 添加**安全模式**：拒绝回填过去 24 小时的数据（可能仍处于生产处理过程中）。
- 添加**成本预测**：执行前显示预计费用。
- 集成 **Marquez**，将回填操作记录为血缘事件。

## 常见陷阱

- **使自己的数据库过载**——始终从最低并发开始，逐步提高。
- **回填覆盖正确数据**——为回填输出添加明确标记（例如 `_backfilled_at` 列），不要静默覆盖。
- **时区 Bug**——UTC 与本地时间下的 `--start-date 2025-01-01` 产生的日期范围可能不同。始终明确时区。
- **忘记重建下游数据**——回填源数据集不会自动回填下游聚合。记录级联关系或实现自动化。
