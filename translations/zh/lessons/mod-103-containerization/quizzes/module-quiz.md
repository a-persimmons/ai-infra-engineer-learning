# 模块 03 测验：Docker 容器化

**总题数：** 20  
**及格：** 70%（14/20）  
**时间限制：** 40 分钟  
**类型：** 混合（选择、判断、简答）

---

## 第一部分：Docker 基础（1–5）

### 第 1 题

Docker 镜像与容器的主要区别是什么？

A) 镜像是运行实例，容器是模板  
B) 镜像是模板，容器是镜像的运行实例  
C) 完全相同  
D) 镜像比容器小

<details>
<summary>答案</summary>

B) 镜像是只读模板；容器是镜像的运行实例（镜像上方有可读写层）。

</details>

---

### 第 2 题

判断题：Docker 容器共享宿主操作系统内核。

<details>
<summary>答案</summary>

正确——容器使用宿主内核，不像虚拟机运行自己的内核。这使容器通常比虚拟机更轻量。

</details>

---

### 第 3 题

哪条 Dockerfile 指令指定基础镜像？

A) BASE  
B) IMAGE  
C) FROM  
D) SOURCE

<details>
<summary>答案</summary>

C) FROM——用于指定基础镜像（例如 FROM python:3.11）。

</details>

---

### 第 4 题

`docker run -p 8080:80` 中 `-p` 的用途是什么？

A) 设置容器优先级  
B) 将宿主端口 8080 映射至容器端口 80  
C) 将容器设置为私有模式  
D) 启用到外部网络的端口转发

<details>
<summary>答案</summary>

B) 将宿主端口 8080 映射至容器端口 80，可以通过宿主端口 8080 访问容器的 80 端口服务。

</details>

---

### 第 5 题

使用哪个命令查看运行中容器的日志？

A) `docker log <container_id>`  
B) `docker logs <container_id>`  
C) `docker print <container_id>`  
D) `docker output <container_id>`

<details>
<summary>答案</summary>

B) `docker logs <container_id>`——显示容器 STDOUT/STDERR 输出。

</details>

---

## 第二部分：Dockerfile 与镜像构建（6–10）

### 第 6 题

推荐怎样尽量缩短 Docker 镜像重建时间？

A) 将频繁变化文件放在 Dockerfile 开头  
B) 按变化频率从低到高排列指令  
C) 所有操作仅用一条 RUN 指令  
D) 始终使用 --no-cache

<details>
<summary>答案</summary>

B) 从不常变化到频繁变化排列指令，尽量利用缓存。先安装依赖，最后复制代码。

</details>

---

### 第 7 题

哪条 Dockerfile 指令创建新层？

A) 仅 FROM 与 RUN  
B) FROM、RUN、COPY、ADD  
C) 所有指令均创建层  
D) 仅 RUN

<details>
<summary>答案</summary>

B) FROM、RUN、COPY、ADD——原文认为这些指令修改文件系统并创建层；ENV、LABEL、CMD 等不创建文件系统层。

</details>

---

### 第 8 题

多阶段构建的主要收益是什么？

A) 构建更快  
B) 排除构建工具，减小最终镜像体积  
C) 通过加密提高安全性  
D) 更容易编写 Dockerfile

<details>
<summary>答案</summary>

B) 排除构建工具以减小最终镜像。多阶段构建允许在一个阶段编译并仅将产物复制至最终阶段，原文示例镜像小 50–80%。

</details>

---

### 第 9 题

判断题：COPY 与 ADD 功能完全相同。

<details>
<summary>答案</summary>

错误——二者都复制文件，但 ADD 还有额外功能（解压 tar、从 URL 下载）。简单复制时优先 COPY，行为更明确、可预测。

</details>

---

### 第 10 题

简答：应创建哪个文件来排除 Docker 构建上下文中的文件？举两个 ML 项目中应排除的例子。

<details>
<summary>参考答案</summary>

**文件：** `.dockerignore`。

**排除示例：**
1. `__pycache__/`、`*.pyc`：容器不需要的 Python 字节码。
2. `.git/`：大型且不必要的 Git 历史。
3. `data/`、`datasets/`：大型训练数据集，应使用数据卷挂载。
4. `venv/`、`.venv/`：虚拟环境，在容器内重新安装。
5. `*.ipynb`：Jupyter Notebook 开发文件。
6. `README.md`、`docs/`：文档（可选）。

（任意两个有效示例均可。）

</details>

---

## 第三部分：Docker 数据卷及网络（11–15）

### 第 11 题

为什么应使用数据卷而非将数据保存在容器内？

A) 数据卷更快  
B) 删除容器时容器内数据丢失  
C) 数据卷更安全  
D) 容器不支持数据存储

<details>
<summary>答案</summary>

B) 容器是临时性的。数据卷可在容器生命周期结束后保留数据，并支持容器间共享数据。

</details>

---

### 第 12 题

哪种 Docker 网络模式允许容器直接访问宿主网络接口？

A) bridge  
B) none  
C) host  
D) overlay

<details>
<summary>答案</summary>

C) host——移除网络隔离，容器直接使用宿主网络栈。有利于某些性能场景，但隔离性降低。

</details>

---

### 第 13 题

将本地目录挂载到容器的正确语法是什么？

A) `docker run -v /host/path:/container/path image`  
B) `docker run -mount /host/path:/container/path image`  
C) `docker run -d /host/path:/container/path image`  
D) `docker run --volume=/container/path image`

<details>
<summary>答案</summary>

A) `docker run -v /host/path:/container/path image`——-v 将宿主目录映射到容器目录。

</details>

---

### 第 14 题

判断题：默认 bridge 网络上的容器可以通过容器名称通信。

<details>
<summary>答案</summary>

错误——默认 bridge 网络上的容器通常需使用 IP 地址；自定义 bridge 网络支持自动 DNS 解析，可以通过名称通信。

</details>

---

### 第 15 题

Docker 命名卷与绑定挂载的主要适用场景有何区别？

A) 命名卷由 Docker 管理且易于迁移；绑定挂载依赖宿主文件系统结构  
B) 绑定挂载比命名卷快  
C) 命名卷仅适用于 Linux  
D) 没有区别

<details>
<summary>答案</summary>

A) 命名卷由 Docker 管理，更便于迁移；绑定挂载依赖宿主文件系统结构。命名卷适合生产，绑定挂载方便开发。

</details>

---

## 第四部分：GPU 支持与优化（16–20）

### 第 16 题

必须安装哪个组件以启用 Docker 容器 GPU 访问？

A) 容器中的 CUDA Toolkit  
B) 宿主机上的 NVIDIA Container Toolkit  
C) 容器中的 cuDNN  
D) Docker GPU Plugin

<details>
<summary>答案</summary>

B) 宿主机上的 NVIDIA Container Toolkit——使 Docker 可以将 GPU 设备传递给容器；CUDA Toolkit 位于容器镜像中。

</details>

---

### 第 17 题

哪个参数用于向容器分配所有 GPU？

A) `--gpu all`  
B) `--gpus all`  
C) `--nvidia all`  
D) `--cuda all`

<details>
<summary>答案</summary>

B) `--gpus all`——示例：`docker run --gpus all nvidia/cuda:12.0-base nvidia-smi`。

</details>

---

### 第 18 题

简答：解释减少 ML 应用 Docker 镜像体积的主要策略。

<details>
<summary>参考答案</summary>

**主要策略：多阶段构建。**

在包含全部构建工具（编译器、build-essential 等）的阶段构建产物，然后仅复制必要产物到最小运行时阶段。

**示例：**
```dockerfile
# Stage 1: Build
FROM python:3.11 as builder
RUN pip install --user pytorch torchvision

# Stage 2: Runtime (much smaller)
FROM python:3.11-slim
COPY --from=builder /root/.local /root/.local
```

**额外策略：**
- 使用 slim/alpine 基础镜像。
- 减少层数（合并 RUN 命令）。
- 安装后移除构建依赖。
- 使用 .dockerignore 排除不必要文件。
- 避免将大型数据集复制到镜像。

（核心概念及示例即可。）

</details>

---

### 第 19 题

判断题：使用 `nvidia/cuda` 基础镜像可以自动支持 GPU，无需 NVIDIA Container Toolkit。

<details>
<summary>答案</summary>

错误——必须在宿主机安装 NVIDIA Container Toolkit，才能传递 GPU 设备。nvidia/cuda 镜像包含容器内部所需 CUDA 库，但缺少宿主机 Toolkit 时无法按此方案运行。

</details>

---

### 第 20 题

哪条 Docker Compose 配置指令指定服务间依赖？

A) requires  
B) depends_on  
C) needs  
D) after

<details>
<summary>答案</summary>

B) depends_on——示例：
```yaml
services:
  web:
    depends_on:
      - db
  db:
    image: postgres
```

说明：原文指出 depends_on 只控制启动顺序，不保证就绪。可结合健康检查管理依赖。

</details>

---

## 评分指南

- **18–20 题正确（90–100%）：** 优秀，掌握 Docker 容器化。
- **16–17 题正确（80–89%）：** 很好，理解扎实，少量不足。
- **14–15 题正确（70–79%）：** 及格，复习薄弱领域。
- **低于 14 题（低于 70%）：** 未通过，复习后重测。

### 下一步

**通过（达到 70%）：**
1. 复习错题。
2. 完成模块 03 实践练习。
3. 完成实践考核（构建生产级容器）。
4. 进入模块 04：Kubernetes 基础。

**未通过（低于 70%）：**
1. 复习错题对应讲义。
2. 练习编写 Dockerfile 和构建镜像。
3. 重新完成动手练习。
4. 补充学习后重测。

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
10. 简答
11. B
12. C
13. A
14. 错误
15. A
16. B
17. B
18. 简答
19. 错误
20. B

## 重点复习概念

### 第一部分（基础）
- 复习第 01 课：Docker 导论。
- 实践：运行容器，探索 docker ps、docker logs、docker exec。
- 理解：镜像与容器、镜像层、Docker 架构。

### 第二部分（Dockerfile）
- 复习第 02 课：面向 ML 应用的 Dockerfile；第 03 课：镜像优化。
- 实践：编写 Dockerfile、构建镜像、使用多阶段构建。
- 理解：镜像层缓存、指令顺序、.dockerignore。

### 第三部分（数据卷/网络）
- 复习第 04 课：Docker 网络与数据卷。
- 实践：挂载数据卷、连接容器、测试网络。
- 理解：数据卷持久化、网络模式、DNS 解析。

### 第四部分（GPU/优化）
- 复习第 07 课：Docker GPU 支持；第 03 课：镜像优化。
- 实践：构建优化镜像，测试 GPU 访问。
- 理解：NVIDIA Container Toolkit、多阶段构建、体积优化。

## 实践应用

通过测验后，展示以下技能：
1. 为 ML 模型构建生产级 Dockerfile（小于 500MB，多阶段）。
2. 使用 Docker Compose 运行模型 + 数据库 + 缓存。
3. 在容器中启用 GPU 并运行 GPU 加速推理。
4. 推送镜像到 Docker Hub 或云仓库。
5. 在 README 中记录工作及构建说明。

**复习时间：** 20–30 分钟，用于查看答案、理解错误。

**准备进入模块 04 了吗？** 达到 70% 并完成练习后，继续学习 Kubernetes！

> 译注：FROM 引用已有基础镜像层，并非必然创建新文件系统层；Docker Desktop 的 Linux 容器共享虚拟机内核。Compose 长语法 depends_on 可配合 service_healthy 等条件。命名卷不自动跨宿主机迁移。原始代码块保留，性能及体积目标需实测。
