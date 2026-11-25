# 模块 03 测验：Docker 容器化

**总题数：** 20
**及格分数：** 70%（20 题中答对 14 题）
**时限：** 40 分钟
**题型：** 混合（选择、判断、简答）

---

## 第一部分：Docker 基础（第 1–5 题）

### 第 1 题

**Docker 镜像与 Docker 容器的主要区别是什么？**

A) 镜像是运行实例，容器是模板  
B) 镜像是模板，容器是镜像的运行实例  
C) 二者相同  
D) 镜像比容器小

<details>
<summary>答案</summary>

B）镜像是只读模板；容器是镜像的运行实例（在镜像上增加可读写层）。

</details>

---

### 第 2 题

**判断：Docker 容器共享宿主机操作系统内核。**

<details>
<summary>答案</summary>

正确——容器使用宿主机内核，而虚拟机运行自己的内核，因此容器通常更轻量、启动更快。

</details>

---

### 第 3 题

**哪个 Dockerfile 指令用于指定基础镜像？**

A) BASE  
B) IMAGE  
C) FROM  
D) SOURCE

<details>
<summary>答案</summary>

C）FROM——指定基础镜像，例如 FROM python:3.11。原文称 Dockerfile 必须以 FROM 开始。

</details>

---

### 第 4 题

**`docker run -p 8080:80` 中 -p 参数的用途是什么？**

A) 设置容器优先级  
B) 将宿主机 8080 端口映射至容器 80 端口  
C) 将容器设为私有模式  
D) 启用外部网络端口转发

<details>
<summary>答案</summary>

B）将宿主机 8080 端口映射至容器 80 端口，可通过宿主机访问服务。

</details>

---

### 第 5 题

**使用哪个命令查看运行中容器的日志？**

A) `docker log <container_id>`  
B) `docker logs <container_id>`  
C) `docker print <container_id>`  
D) `docker output <container_id>`

<details>
<summary>答案</summary>

B）`docker logs <container_id>`——显示容器的 STDOUT/STDERR 输出。

</details>

---

## 第二部分：Dockerfile 与镜像构建（第 6–10 题）

### 第 6 题

**推荐使用哪种策略尽量缩短 Docker 镜像重建时间？**

A) 将频繁变更文件放在 Dockerfile 开头  
B) 从最不频繁变更到最频繁变更排列指令  
C) 全部操作使用一个 RUN 指令  
D) 始终使用 --no-cache

<details>
<summary>答案</summary>

B）按变更频率从低到高排列指令，以最大限度利用镜像层缓存。先安装依赖，最后复制代码。

</details>

---

### 第 7 题

**哪些 Dockerfile 指令创建新镜像层？**

A) 仅 FROM 与 RUN  
B) FROM、RUN、COPY、ADD  
C) 全部指令  
D) 仅 RUN

<details>
<summary>答案</summary>

B）原文将 FROM、RUN、COPY、ADD 归为创建镜像层的指令，而 ENV、LABEL、CMD 等不会创建文件系统层。

</details>

---

### 第 8 题

**多阶段构建的主要好处是什么？**

A) 更快构建  
B) 通过排除构建工具减小最终镜像体积  
C) 通过加密提高安全性  
D) 更容易编写 Dockerfile

<details>
<summary>答案</summary>

B）在一个阶段使用编译器等工具构建，再将必需产物复制至最终阶段，原文示例镜像缩小 50–80%。

</details>

---

### 第 9 题

**判断：COPY 与 ADD 的功能完全相同。**

<details>
<summary>答案</summary>

错误——二者都复制文件，但 ADD 具有额外功能（解压 tar、从 URL 下载）。简单复制优先采用 COPY，因为更明确且可预测。

</details>

---

### 第 10 题

**简答：创建哪个文件来排除 Docker 构建上下文中的文件？列举两项 ML 项目应排除的内容。**

<details>
<summary>参考答案</summary>

**文件：** `.dockerignore`。

**排除示例：**
1. `__pycache__/` 与 `*.pyc`——容器不需要的 Python 字节码。
2. `.git/`——体积较大且不必要的 Git 历史。
3. `data/` 或 `datasets/`——大型训练数据集（可通过数据卷挂载）。
4. `venv/` 或 `.venv/`——虚拟环境（在容器内重新安装）。
5. `*.ipynb`——Jupyter Notebook 开发文件。
6. `README.md`、`docs/`——文档（可选）。

（任意两个有效示例均可。）

</details>

---

## 第三部分：Docker 数据卷与网络（第 11–15 题）

### 第 11 题

**为什么应该使用数据卷而不是在容器内部存储数据？**

A) 数据卷速度更快  
B) 删除容器时容器内的数据丢失  
C) 数据卷更安全  
D) 容器不支持数据存储

<details>
<summary>答案</summary>

B）容器具有临时性；数据卷在容器生命周期之外持久化数据，并支持容器之间共享数据。

</details>

---

### 第 12 题

**哪种 Docker 网络模式使容器直接访问宿主机网络接口？**

A) bridge  
B) none  
C) host  
D) overlay

<details>
<summary>答案</summary>

C）host——移除网络隔离，容器直接使用宿主机网络栈。有利于某些性能场景，但降低隔离性。

</details>

---

### 第 13 题

**将本地目录挂载至容器的正确语法是什么？**

A) `docker run -v /host/path:/container/path image`  
B) `docker run -mount /host/path:/container/path image`  
C) `docker run -d /host/path:/container/path image`  
D) `docker run --volume=/container/path image`

<details>
<summary>答案</summary>

A）`-v` 将宿主机目录映射至容器目录。

</details>

---

### 第 14 题

**判断：默认 bridge 网络上的容器可以使用容器名称进行通信。**

<details>
<summary>答案</summary>

错误——默认 bridge 网络通常使用 IP 地址通信；自定义 bridge 网络支持自动 DNS 解析，允许通过名称通信。

</details>

---

### 第 15 题

**Docker 命名数据卷与 Bind Mount 的主要使用场景有什么区别？**

A) 命名数据卷由 Docker 管理且便于迁移；Bind Mount 依赖宿主机文件系统结构  
B) Bind Mount 比命名数据卷更快  
C) 命名数据卷仅在 Linux 工作  
D) 没有区别

<details>
<summary>答案</summary>

A）命名数据卷由 Docker 管理，原文推荐用于生产；Bind Mount 依赖宿主机文件系统，适合开发。

</details>

---

## 第四部分：GPU 支持与优化（第 16–20 题）

### 第 16 题

**为了在 Docker 容器中访问 GPU，必须安装哪个组件？**

A) 容器内的 CUDA Toolkit  
B) 宿主机的 NVIDIA Container Toolkit  
C) 容器内的 cuDNN  
D) Docker GPU Plugin

<details>
<summary>答案</summary>

B）宿主机的 NVIDIA Container Toolkit 允许 Docker 将 GPU 设备传递给容器。CUDA Toolkit 则可位于容器镜像中。

</details>

---

### 第 17 题

**使用哪个参数将全部 GPU 分配给容器？**

A) `--gpu all`  
B) `--gpus all`  
C) `--nvidia all`  
D) `--cuda all`

<details>
<summary>答案</summary>

B）`--gpus all`，例如 `docker run --gpus all nvidia/cuda:12.0-base nvidia-smi`。

</details>

---

### 第 18 题

**简答：解释减小 ML 应用 Docker 镜像体积的主要策略。**

<details>
<summary>参考答案</summary>

**主要策略：多阶段构建。** 在一个阶段使用所有构建工具（编译器、build-essential 等）构建产物，然后仅将所需产物复制至最小运行时阶段。

**示例：**
```dockerfile
# Stage 1: Build
FROM python:3.11 as builder
RUN pip install --user pytorch torchvision

# Stage 2: Runtime (much smaller)
FROM python:3.11-slim
COPY --from=builder /root/.local /root/.local
```

**其他策略：**
- 使用 slim/alpine 基础镜像。
- 减少镜像层（合并 RUN 命令）。
- 安装后移除构建依赖。
- 使用 .dockerignore 排除不必要文件。
- 避免将大型数据集复制至镜像。

（说明核心概念并提供示例即可。）

</details>

---

### 第 19 题

**判断：使用 `nvidia/cuda` 基础镜像，无需 NVIDIA Container Toolkit 就能自动获得 GPU 支持。**

<details>
<summary>答案</summary>

错误——宿主机必须安装 NVIDIA Container Toolkit 才能传递 GPU 设备。nvidia/cuda 镜像包含容器内需要的 CUDA 库，但没有宿主机工具包就无法按此方式使用 GPU。

</details>

---

### 第 20 题

**哪个 Docker Compose 指令用于指定一个服务依赖另一个服务？**

A) requires  
B) depends_on  
C) needs  
D) after

<details>
<summary>答案</summary>

B）depends_on，例如：
```yaml
services:
  web:
    depends_on:
      - db
  db:
    image: postgres
```
原文说明：depends_on 仅控制启动顺序，不保证就绪。使用健康检查实现真正的依赖管理。

</details>

---

## 评分指南

### 评分细则

- **答对 18–20 题（90–100%）：** 优秀——已掌握Docker 容器化。
- **答对 16–17 题（80–89%）：** 良好——理解扎实，存在少量不足。
- **答对 14–15 题（70–79%）：** 及格——知识足够，复习困难领域。
- **答对少于 14 题（低于 70%）：** 未及格——复习模块并重新测验。

### 下一步

**通过（达到 70%）：**
1. 复习答错的题目。
2. 完成模块 03 实践练习。
3. 完成实践评估（构建面向生产的容器）。
4. 进入模块 04：Kubernetes 基础。

**未通过（低于 70%）：**
1. 回顾错题对应的讲义。
2. 练习编写 Dockerfile 及构建镜像。
3. 重新完成动手练习。
4. 继续学习后重新参加测验。

---

## 答案汇总

1. B
2. 正确
3. C
4. B
5. B
6. B
7. B
8. B
9. 错误
10. 简答（见详情）
11. B
12. C
13. A
14. 错误
15. A
16. B
17. B
18. 简答（见详情）
19. 错误
20. B

---

## 核心概念复习

### 如果第一部分（基础）较薄弱：
- 复习第 01 课：Docker 导论。
- 实践：运行容器，探索 docker ps、docker logs、docker exec。
- 理解：镜像与容器、镜像层、Docker 架构。

### 如果第二部分（Dockerfile）较薄弱：
- 复习第 02 课：面向 ML 应用的 Dockerfile。
- 复习第 03 课：镜像优化。
- 实践：编写 Dockerfile、构建镜像、使用多阶段构建。
- 理解：镜像层缓存、指令顺序、.dockerignore。

### 如果第三部分（数据卷/网络）较薄弱：
- 复习第 04 课：Docker 网络与数据卷。
- 实践：挂载数据卷、连接容器、测试网络。
- 理解：数据卷持久性、网络模式、DNS 解析。

### 如果第四部分（GPU/优化）较薄弱：
- 复习第 07 课：Docker GPU 支持。
- 复习第 03 课：镜像优化。
- 实践：构建优化镜像、测试 GPU 访问。
- 理解：NVIDIA Container Toolkit、多阶段构建、体积优化。

---

## 实践应用

通过测验后，展示以下技能：

1. 为 ML 模型**构建生产级 Dockerfile**（小于 500MB、多阶段构建）。
2. **使用 Docker Compose** 运行模型 + 数据库 + 缓存。
3. 在容器中**启用 GPU** 并执行 GPU 加速推理。
4. **推送镜像**至 Docker Hub 或云镜像仓库。
5. 在 README 中**记录成果**及构建说明。

---

**复习时长：** 20–30 分钟，用于回顾答案并理解错误。

**准备进入模块 04？** 得分达到 70% 并完成练习后，即可继续学习 Kubernetes！

> 译注：FROM 引用基础镜像，并非每次都新增文件系统层；Dockerfile 在 FROM 前可以有解析器指令、注释及全局 ARG。容器也可以处于停止状态。命名数据卷不自动跨宿主机迁移。Compose 长格式 depends_on 支持 service_healthy 等条件。Alpine 的 musl 与部分 ML 依赖不兼容。保留原文答案与原始代码块。
