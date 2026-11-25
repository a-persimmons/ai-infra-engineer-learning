# 练习 09：容器运行时故障排查

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 练习 01（Dockerfile）；熟悉 curl、grep、strace

## 目标

仅使用容器原生调试工具（docker logs、docker exec、nsenter、临时调试容器）诊断三个故意设置了故障的运行中容器。完成后，你将拥有一套可靠的方法处理「容器正在运行，但出现了问题」这一常见生产场景。

## 为什么重要

能够在十分钟内修复容器崩溃循环的工程师，与需要呼叫资深同事的工程师之间，技能差异很大程度上来自排查方法。本练习在受控环境中训练这些方法，避免凌晨三点遇到故障时才开始学习。

## 要求

你将获得三个故障容器（也可以自行编写）。对每个容器识别根因并修复。

### Bug 1：应用似乎已经启动，却收不到流量
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY app.py .
RUN pip install fastapi uvicorn
CMD ["uvicorn", "app:app", "--host", "127.0.0.1", "--port", "8000"]
```

### Bug 2：容器启动约十秒后被 OOMKilled
一个将 130 亿参数模型加载到内存限制为 2GB 的 PyTorch 容器。

### Bug 3：容器正在运行，但预测结果严重不一致
一个以 Root 用户运行、以读写方式挂载宿主机数据卷的容器；同一宿主机的另一个容器会定期截断模型文件。

## 分步排查方法

### 步骤 1——容器存活但没有响应
```bash
docker ps                                    # is it Running?
docker logs --tail 50 <id>                   # what did it say?
docker logs --since 5m <id>                  # recent events
docker exec -it <id> sh                      # poke around
docker stats <id> --no-stream                # CPU/mem usage
```

对于 Bug 1，应用仅监听 127.0.0.1，因此端口映射无法访问应用。修复：使用 `--host 0.0.0.0`。

### 步骤 2——容器反复重启
```bash
docker inspect <id> --format '{{.State.ExitCode}} {{.State.Error}}'
docker inspect <id> --format '{{.State.OOMKilled}}'
dmesg | grep -i 'killed process'             # host-level OOM event
docker logs --previous <id>                  # logs from the prior failed instance
```

对于 Bug 2，OOMKilled=true 表明容器因内存限制而被终止。修复：提高内存限制或使用量化模型。

### 步骤 3——行为随时间不一致
这是最难的问题。症状：
- 预测先正确，再错误，然后再次正确。
- 日志显示成功加载，但输出陈旧。
- docker exec 间歇性显示符合预期的文件内容。

排查方法：

1. **比较不同调用之间的文件哈希**：
   ```bash
   docker exec <id> sha256sum /models/current.bin
   sleep 30
   docker exec <id> sha256sum /models/current.bin
   ```
2. **监听文件变化**：
   ```bash
   docker exec <id> ls -la /models/current.bin
   docker exec <id> stat /models/current.bin    # see mtime
   ```
3. **识别还有谁能写入**——检查卷挂载（docker inspect），查找使用同一挂载的其他容器。

对于 Bug 3，宿主机挂载由多个容器共享，其中另一个容器正在修改文件。修复：以只读方式挂载，或在启动时采用 CopyInto 模式创建独立副本。

### 步骤 4——无法使用 docker exec 时
基于 distroless 的镜像没有 Shell。使用：
```bash
kubectl debug -it <pod> --image=busybox --target=<container>
# Or with raw docker:
docker run -it --pid container:<id> --net container:<id> --rm busybox sh
```

### 步骤 5——容器崩溃太快，来不及执行 exec
```bash
docker run --rm -it --entrypoint sh <image>     # override the bad CMD
```

### 步骤 6——最后的手段：在容器内使用 strace
```bash
docker exec -it <id> sh
apt-get install -y strace                       # if missing
strace -p $(pidof python) -f -e trace=network 2>&1 | head -50
```

## 交付物

1. 三个 Bug 各自的书面诊断（根因、证据、修复）。
2. 一份可以放在终端旁边的 `DEBUGGING_CHEATSHEET.md`。
3. 「下一个应添加的 Bug」建议——描述一个可以训练不同技能的第四类故意设置的故障。

## 验证

- [ ] 未查阅答案即修复全部三个 Bug。
- [ ] 诊断包含指向根因的具体命令及其输出，而不仅仅是修复措施。
- [ ] 速查表覆盖上述排查方法及自己的补充内容。

## 拓展目标

- 添加 containers-down.sh 混沌测试脚本，定时随机注入 N 种故障中的一种。记录检测、诊断与修复耗时。
- 使用 Kubernetes **临时调试容器**练习（kubectl debug）。
- 使用 Falco 设置**持续容器安全检测**，复现其一项告警。

## 常见陷阱

- **完全依赖 docker logs**——如果应用将日志写入容器内文件，就不会显示在 docker logs 中。阅读应用日志配置。
- **跳过 docker inspect**——许多异常容器问题可以通过 inspect 输出发现（卷挂载、环境变量、重启策略、退出码）。
- **阅读日志前就重启**——先保存故障证据；在 Kubernetes 中可使用 --previous 查看上一个容器实例的日志。
- **混淆 OOMKilled 与正常退出**——inspect 中有专门的 OOMKilled 字段，不要仅凭退出码猜测。
- **未经考虑就在生产运行 strace**——strace 可能长时间影响运行进程。先在预发布环境练习。

> 译注：只读挂载只能禁止该容器写入，不能阻止另一个有写权限的容器修改共享源文件；应约束全部写入方，使用不可变模型版本或独立副本。Docker logs 没有 Kubernetes logs 的 --previous 选项，同一容器重启后的日志保留情况取决于日志驱动与配置。仅在授权的隔离环境中注入故障。
