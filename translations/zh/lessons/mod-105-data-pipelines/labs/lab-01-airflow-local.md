# 实验 01：使用 docker-compose 在本地运行 Airflow

**时长：** 60 分钟  **前置条件：** Docker + Compose。

## 目标

使用 docker-compose 在本地搭建可用的 Airflow 技术栈（调度器 + Web 服务器 + Worker + Postgres），确认能够编写并执行一个简单 DAG。

## 步骤

### 1. 获取官方快速入门 Compose 文件
```bash
mkdir -p ~/airflow && cd ~/airflow
curl -LfO 'https://airflow.apache.org/docs/apache-airflow/2.9.1/docker-compose.yaml'
echo "AIRFLOW_UID=$(id -u)" > .env
mkdir -p ./dags ./logs ./plugins ./config
```

### 2. 初始化元数据库
```bash
docker compose up airflow-init
```
首次初始化需要约 1–2 分钟；结束时应看到 “Admin user airflow created”。

### 3. 启动完整技术栈
```bash
docker compose up -d
docker compose ps
```
全部六个以上服务都应处于健康状态。

### 4. 打开界面

http://localhost:8080 ，用户名 `airflow` / 密码 `airflow`。系统已预加载若干示例 DAG。

### 5. 添加 hello DAG
```python
# dags/hello.py
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

with DAG("hello", start_date=datetime(2026, 1, 1), schedule=None, catchup=False) as dag:
    BashOperator(task_id="say_hi", bash_command="echo hello from airflow")
```
刷新界面 → 出现 `hello`。手动触发并观察日志。

### 6. CLI 用法
```bash
docker compose exec airflow-worker airflow dags list
docker compose exec airflow-worker airflow dags trigger hello
docker compose exec airflow-worker airflow tasks list hello
```

## 验证

- [ ] `docker compose ps` 显示 scheduler、webserver、worker、triggerer 和 postgres 均健康。
- [ ] `hello` DAG 成功运行。
- [ ] 在界面中可以查看每个任务的日志。

## 清理
```bash
docker compose down -v
```

## 故障排查

- **logs/ 出现 `Permission denied`** — 修正 UID：`echo "AIRFLOW_UID=$(id -u)" > .env` 以及 `chown -R $(id -u):0 logs/`。
- **Web 服务器返回 502** — 调度器尚未完成初始化，等待 30 秒。
- **界面中没有示例 DAG** — 设置 `AIRFLOW__CORE__LOAD_EXAMPLES=true`（官方 Compose 默认配置）。
