# 模块 103：容器化 — 参考答案

> [模块测验](../../../lessons/mod-103-containerization/quizzes/module-quiz.md)的详细答案，包含解析、常见错误和课程参考。
>
> **学术诚信：** 请先尝试完成测验，再用于自学。

---

## 问题 1
**问题：** Docker 镜像与 Docker 容器的主要区别是什么？

**答案：** B) 镜像是模板；容器是镜像的运行实例

**解析：**
Docker 镜像是一种不可变的只读模板，由堆叠的文件系统层、构建元数据和默认命令组成。当执行 `docker run` 时，Docker 在只读层上添加一个薄的读写层并启动入口点进程，从而创建容器。同一镜像可以启动多个容器，但每个容器都有自己的可写层、进程命名空间和运行时状态。

**常见错误：**
- 选择 A 颠倒了二者的关系：镜像不是运行实例，容器也不是模板。
- 选择 C 忽略了镜像没有运行中的进程或可写层，而容器具备这些内容。
- 选择 D 混淆了产物类型与大小；容器复用镜像层，在磁盘上实际占用的空间甚至可以比镜像本身更小。

**相关资料：** `lessons/mod-103-containerization/01-docker-introduction.md`

---

## 问题 2
**问题：** 判断题：Docker 容器共享宿主操作系统的内核。

**答案：** 正确

**解析：**
容器是隔离的用户空间进程，依赖 Linux 内核的命名空间（PID、mount、network、UTS、IPC、user）实现隔离，并使用 cgroups 限制资源，但它们都在宿主机正在运行的内核上执行。因此容器能在毫秒级启动，内存占用远低于虚拟机，后者需要在虚拟机监控器中启动完整的客户机内核。这也解释了为什么没有底层 Linux 虚拟机时，Linux 容器镜像不能直接在 Windows 内核上原生运行。

**常见错误：**
- 回答错误通常是把容器与拥有独立内核的虚拟机混淆。
- 忽略 macOS/Windows 上的 Docker Desktop 会运行隐藏的 Linux 虚拟机，这使内核看起来是独立的，但实际上容器共享该虚拟机中的内核。

**相关资料：** `lessons/mod-103-containerization/01-docker-introduction.md`

---

## 问题 3
**问题：** Dockerfile 中哪个指令用于指定基础镜像？

**答案：** C) FROM

**解析：**
每个 Dockerfile 都必须以 `FROM` 指令开始（前面可以只有供 `FROM` 使用的 `ARG`），它设置构建阶段的基础镜像。基础镜像决定初始文件系统、默认用户和预装工具；对于 ML 工作，通常类似 `FROM python:3.11-slim` 或 `FROM nvidia/cuda:12.0-base`。多阶段构建使用多个 `FROM` 定义独立阶段，并可有选择地从中复制文件。

**常见错误：**
- 选择 A（`BASE`）或 B（`IMAGE`）：它们根本不是 Dockerfile 指令。
- 选择 D（`SOURCE`）：有时因“源镜像”而猜测该选项，但不存在此指令。

**相关资料：** `lessons/mod-103-containerization/02-dockerfile-ml-apps.md`

---

## 问题 4
**问题：** `docker run -p 8080:80` 中 `-p` 参数的目的是什么？

**答案：** B) 将宿主机端口 8080 映射到容器端口 80

**解析：**
`-p HOST:CONTAINER` 参数通过安装 iptables/NAT 规则，将容器端口发布到宿主机，使到达宿主机 TCP 8080 端口的流量转发到容器的 80 端口。未发布端口时，容器端口只能通过其内部网络访问。顺序十分重要：左侧始终为宿主机端口，右侧为容器端口。

**常见错误：**
- 选择 A 混淆了 `-p`（发布）与优先级或 CPU 参数，例如 `--cpu-shares`。
- 选择 C 虚构了 `-p` 并不存在的“私有模式”。
- 选择 D 在概念上部分正确，但具有误导性：发布端口是使宿主机可访问，而不是直接暴露到外部网络（仍受防火墙规则约束）。

**相关资料：** `lessons/mod-103-containerization/04-docker-networking-volumes.md`

---

## 问题 5
**问题：** 使用什么命令查看运行中容器的日志？

**答案：** B) `docker logs <container_id>`

**解析：**
`docker logs` 通过配置的日志驱动（默认为 json-file）读取容器 PID 1 写入 STDOUT 和 STDERR 的内容。常用参数包括实时跟踪输出的 `-f`、限制历史记录数量的 `--tail N`，以及限制时间范围的 `--since`/`--until`。排查容器为何退出或行为异常时，这是首选工具。

**常见错误：**
- 选择 A（单数 `docker log`）：命令使用复数形式，这个拼写错误经常导致“command not found”。
- 选择 C 或 D：`print` 和 `output` 都不是 Docker 子命令。

**相关资料：** `lessons/mod-103-containerization/01-docker-introduction.md`

---

## 问题 6
**问题：** 最大程度缩短 Docker 镜像重新构建时间的推荐策略是什么？

**答案：** B) 按照变更频率从低到高排列指令

**解析：**
Docker 将每条指令作为一个层进行缓存；缓存命中要求该指令及全部输入与先前构建一致。将稳定步骤（基础镜像、系统软件包、`pip install -r requirements.txt`）放在易变步骤（`COPY . /app`）之前，可以在大多数重新构建中保持缓存命中，只重新执行开销较小的最后几层。调整顺序、最后复制源代码，是提升 ML 迭代速度最显著的单项措施。

**常见错误：**
- 选择 A 恰好相反：将易变文件放在前面会使每次变更都导致缓存失效。
- 选择 C（“一个巨大的 RUN”）：以牺牲缓存能力换取略小的镜像，导致每次重新构建都需要完整重装。
- 选择 D（`--no-cache`）：保证每次构建都处于最差的重新构建时间。

**相关资料：** `lessons/mod-103-containerization/03-image-optimization.md`

---

## 问题 7
**问题：** 哪些 Dockerfile 指令会创建新层？

**答案：** B) FROM、RUN、COPY 和 ADD

**解析：**
改变文件系统的指令会创建层：`FROM` 引入基础镜像层，`RUN`、`COPY`、`ADD` 则将文件系统增量提交为新的只读层。仅操作元数据的指令（例如 `ENV`、`LABEL`、`EXPOSE`、`WORKDIR`、`CMD` 和 `ENTRYPOINT`）更新镜像清单，但不添加文件系统层（现代 BuildKit 将其视为基本没有额外开销）。

**常见错误：**
- 选择 A 遗漏了显然会向镜像写入文件的 `COPY` 和 `ADD`。
- 选择 C 统计过多：仅操作元数据的指令不会产生文件系统层。
- 选择 D 忽略了 `COPY`/`ADD`/`FROM` 也会创建层。

**相关资料：** `lessons/mod-103-containerization/03-image-optimization.md`

---

## 问题 8
**问题：** 多阶段构建的主要好处是什么？

**答案：** B) 通过排除构建工具减小最终镜像

**解析：**
多阶段 Dockerfile 使用一个阶段借助重量级工具（编译器、build-essential、CUDA 开发库）进行编译或安装，最终使用一个精简阶段，仅通过 `COPY --from=builder` 获取运行时产物。仅用于构建的阶段不会进入最终镜像，通常可减小 50–80% 的镜像体积，并通过不将编译器和源代码带入生产环境来缩小攻击面。构建时间通常相近或略慢；收益在于镜像大小与安全性。

**常见错误：**
- 选择 A 混淆了构建速度（并非主要好处）与镜像大小。
- 选择 C 虚构了加密功能：多阶段构建不会加密任何内容。
- 选择 D 恰好相反：多阶段 Dockerfile 通常更难编写。

**相关资料：** `lessons/mod-103-containerization/03-image-optimization.md`

---

## 问题 9
**问题：** 判断题：COPY 和 ADD 指令的功能完全相同。

**答案：** 错误

**解析：**
两者都将本地文件复制到镜像中，但 `ADD` 有两个额外行为：可以从远程 URL 获取文件，并自动将识别出的本地 tar 归档解压到目标位置。这些副作用让 `ADD` 的行为出乎意料且更难审计，因此官方建议默认使用 `COPY`，只在确实需要 tar 解压时使用 `ADD`（URL 下载最好使用 `RUN curl`，以便验证校验和并清理文件）。

**常见错误：**
- 回答正确忽略了 tar 包自动解压功能，当 tar 文件本应原样复制时，这种行为曾造成实际故障。
- 忘记 Hadolint 等检查工具正是因为该差异，会对非 tar 用途的 `ADD` 发出警告。

**相关资料：** `lessons/mod-103-containerization/02-dockerfile-ml-apps.md`

---

## 问题 10
**问题：** 简答题：应该创建什么文件来排除 Docker 构建上下文中的文件？请给出 ML 项目中应排除的两个示例。

**答案：** `.dockerignore`：有效示例包括 `__pycache__/` 和 `*.pyc`（Python 字节码）、`.git/`（仓库历史）、`data/` 或 `datasets/`（应使用卷挂载的大型训练数据）、`.venv/`（宿主机虚拟环境）、`*.ipynb`（Notebook），以及 `*.ckpt`/`*.pt`/`*.bin`（应存放在对象存储中的大型模型权重）。

**解析：**
Docker 客户端在执行任何指令之前，会将整个构建上下文打包为 tar 并发送给守护进程，因此未排除的文件会增加上传时间、构建缓存失效概率，以及在意外被 `COPY` 时的最终镜像大小。`.dockerignore` 位于构建上下文根目录，使用与 `.gitignore` 类似的 glob 语法。对于 ML 项目，排除数据集、检查点、虚拟环境及版本控制元数据，可将上下文从 GB 级缩小至 MB 级，并防止 `.env` 中的密钥泄漏到镜像。

**常见错误：**
- 将文件命名为 `.gitignore` 或 `dockerignore`（缺少前导点）：Docker 会忽略它，并发送整个目录。
- 忘记排除 `node_modules/`、`.venv/` 或大型 `data/` 目录，然后疑惑构建上下文为何达到数 GB。
- 意外排除源代码或 `requirements.txt`，导致 `COPY` 步骤失败。

**相关资料：** `lessons/mod-103-containerization/03-image-optimization.md`

---

## 问题 11
**问题：** 为什么应该使用卷，而不是将数据存储在容器内部？

**答案：** B) 容器删除后，容器内的数据会丢失

**解析：**
容器可写层与容器同生共死，`docker rm` 删除写入镜像只读层之上的所有数据。卷（命名卷或绑定挂载）独立于容器生命周期，在重启和重新创建容器后仍可保留，能够在容器间共享，并由 Docker 或宿主文件系统独立管理。对于数据库或训练检查点等写入密集型工作负载，卷也比写时复制存储驱动明显更快。

**常见错误：**
- 选择 A 作为次要好处是正确的（卷绕过联合文件系统），但不是使用卷的主要理由。
- 选择 C 夸大了安全性；卷并不天然比可写层更安全。
- 选择 D 不符合事实：容器可以存储数据，只是数据不能持久保留。

**相关资料：** `lessons/mod-103-containerization/04-docker-networking-volumes.md`

---

## 问题 12
**问题：** 哪种 Docker 网络模式允许容器直接访问宿主机网络接口？

**答案：** C) host

**解析：**
`--network host` 禁用容器的网络命名空间，使其进程直接绑定宿主机网卡和端口，无须 NAT 或 `-p` 发布。这消除了少量桥接/NAT 性能开销（适用于高吞吐量推理服务），但取消了端口隔离：容器服务与宿主机服务争用端口，二者之间没有防火墙边界。它也仅适用于 Linux；Docker Desktop 通过虚拟机模拟该功能，并存在限制。

**常见错误：**
- 选择 A（`bridge`）：bridge 是默认的带 NAT 的隔离网络，而非直接访问宿主机。
- 选择 B（`none`）：none 完全禁用网络。
- 选择 D（`overlay`）：overlay 用于多宿主机 Swarm/集群网络，而非访问宿主机接口。

**相关资料：** `lessons/mod-103-containerization/04-docker-networking-volumes.md`

---

## 问题 13
**问题：** 将本地目录挂载到容器的正确语法是什么？

**答案：** A) `docker run -v /host/path:/container/path image`

**解析：**
`-v`（或 `--volume`）采用 `SRC:DST[:OPTIONS]` 格式，左侧绝对宿主机路径会创建绑定挂载，而单独的名称会创建或使用命名卷。较新且更详细的 `--mount type=bind,source=/host/path,target=/container/path` 同样有效，由于语义明确，在生产脚本中更受推荐；但选项 B 的 `--mount` 只写了一个连字符，因此无效。

**常见错误：**
- 选择 B 使用 `-mount`（单连字符），该参数不存在；正确的长参数为 `--mount`。
- 选择 C 混淆了 `-d`（后台运行）与卷挂载。
- 选择 D 只提供容器路径而没有源路径，这会挂载匿名卷，而非宿主机目录。

**相关资料：** `lessons/mod-103-containerization/04-docker-networking-volumes.md`

---

## 问题 14
**问题：** 判断题：默认 bridge 网络上的容器可以使用容器名称相互通信。

**答案：** 错误

**解析：**
默认 `bridge` 网络是为兼容性保留的旧式网络，不提供容器名称的内嵌 DNS；容器必须通过 IP 地址通信（或使用已弃用的 `--link` 参数）。使用 `docker network create` 创建的自定义桥接网络则包含内部 DNS 解析器，可以自动将容器名称（以及 `--network-alias` 的值）映射到 IP。这就是文档建议为多容器应用始终创建自定义网络、Compose 默认也这样做的原因。

**常见错误：**
- 回答正确是最常见错误，因为 Compose 的使用经验使人认为 DNS 在所有地方都能直接工作；实际上 Compose 在后台创建了自定义网络。
- 忘记默认 bridge 与自定义 bridge 在这一方面的行为有很大区别。

**相关资料：** `lessons/mod-103-containerization/04-docker-networking-volumes.md`

---

## 问题 15
**问题：** Docker 命名卷与绑定挂载的主要适用场景有何区别？

**答案：** A) 命名卷由 Docker 管理且可移植；绑定挂载依赖宿主机文件系统结构

**解析：**
命名卷位于 `/var/lib/docker/volumes/<name>` 下（或由 NFS/EBS 等卷驱动管理），通过 `docker volume` 命令创建、备份和删除，便于在宿主机间移植，是生产状态数据的首选。绑定挂载将任意宿主机路径直接挂载到容器内，便于开发（实时重载源代码），但将容器与宿主机的目录布局、文件所有权及 SELinux/AppArmor 标签耦合。

**常见错误：**
- 选择 B 过于绝对：绑定挂载并非总是更快，性能取决于存储驱动及操作系统。
- 选择 C 不正确：命名卷适用于 Docker 运行的每个平台。
- 选择 D 忽略了有意义的运维差异。

**相关资料：** `lessons/mod-103-containerization/04-docker-networking-volumes.md`

---

## 问题 16
**问题：** 为了在 Docker 容器中使用 GPU，必须安装哪个组件？

**答案：** B) 宿主机上的 NVIDIA Container Toolkit

**解析：**
NVIDIA Container Toolkit（原 `nvidia-docker2`）在宿主机上安装运行时钩子，在请求 `--gpus` 时将宿主机的 NVIDIA 驱动库和设备文件注入容器。宿主机仍需要匹配的 NVIDIA 驱动内核模块，容器镜像必须包含与该驱动兼容的用户空间 CUDA/cuDNN 库。但没有该工具包，Docker 就无法向容器暴露 `/dev/nvidia*` 和 CUDA 运行时。

**常见错误：**
- 选择 A 或 C 混淆了容器内应安装的内容（CUDA Toolkit、cuDNN）与宿主机上负责设备透传的组件。
- 选择 D（“Docker GPU Plugin”）虚构了不存在的组件；该工具包注册为 OCI 运行时钩子，而非 Docker 插件。

**相关资料：** `lessons/mod-103-containerization/07-gpu-docker.md`

---

## 问题 17
**问题：** 使用哪个参数向容器分配所有 GPU？

**答案：** B) `--gpus all`

**解析：**
`--gpus`（复数）是与 NVIDIA Container Toolkit 一同引入的现代 Docker CLI 参数；`all` 暴露宿主机上的所有 GPU。也可请求指定设备（`--gpus '"device=0,1"'`）、数量（`--gpus 2`）或能力（`--gpus 'all,capabilities=compute,utility'`）。较旧的 `--runtime=nvidia` 加 `NVIDIA_VISIBLE_DEVICES=all` 环境变量仍能工作，但被视为旧式用法。

**常见错误：**
- 选择 A（单数 `--gpu`）：参数是复数形式，单数形式会被忽略或报错。
- 选择 C/D：`--nvidia` 和 `--cuda` 都不是 Docker 参数。

**相关资料：** `lessons/mod-103-containerization/07-gpu-docker.md`

---

## 问题 18
**问题：** 简答题：解释减小 ML 应用 Docker 镜像体积的主要策略。

**答案：** 使用多阶段构建：在 `builder` 阶段安装或编译重量级依赖，然后通过 `COPY --from=builder` 仅将运行时产物复制到精简的最终阶段（如 `python:3.11-slim`、`nvidia/cuda:*-runtime`，而非 `*-devel`）。辅以 `.dockerignore`、合并 `RUN` 命令并在同一层清理 apt/pip 缓存、选择最小的可行基础镜像，以及避免将大型数据集和模型权重放入镜像（在运行时挂载卷或从对象存储拉取）。

**解析：**
ML 镜像膨胀的原因可以预见：完整的 Python/CUDA 开发镜像、pip 构建缓存、apt 列表、意外复制的数据集，以及推理时根本不需要的编译工具链。多阶段构建通过从最终镜像物理排除构建工具，解决最大的体积来源，并天然适合与 `runtime` 类型的基础镜像结合使用。良好的层管理（在同一个 `RUN` 中执行 `apt-get update && install ... && rm -rf /var/lib/apt/lists/*`）和严格的 `.dockerignore` 可以弥补剩余问题。

**常见错误：**
- 仅提到“使用 Alpine”：Alpine 经常导致 Python wheel 不兼容（musl 与 glibc 的区别），很少适合 ML 工作负载；`*-slim` 通常才是正确选择。
- 忘记在单独的 `RUN` 中执行 `RUN apt-get clean` 无法缩小镜像，因为前一层已经提交缓存。
- 将数据集或模型权重复制到镜像而非挂载，抵消了其他所有体积优化成果。

**相关资料：** `lessons/mod-103-containerization/03-image-optimization.md`

---

## 问题 19
**问题：** 判断题：使用 `nvidia/cuda` 基础镜像，无须 NVIDIA Container Toolkit 即可自动获得 GPU 支持。

**答案：** 错误

**解析：**
`nvidia/cuda` 镜像包含 CUDA 用户空间库（libcudart、`cudnn` 变体中的 cuDNN 等），使容器内部应用能够链接 CUDA。但除非宿主机运行时注入设备文件及匹配的宿主机驱动，否则它们无法访问 GPU。使用 `--gpus` 运行容器时，NVIDIA Container Toolkit 正是负责这一注入操作。没有该工具包，容器内的 `nvidia-smi` 会因“command not found”或“no devices”而失败。

**常见错误：**
- 回答正确假设基础镜像能够自给自足，混淆了用户空间 CUDA 与内核驱动访问，而 Docker 本身无法在二者间建立桥接。
- 忘记宿主机 NVIDIA 驱动版本也必须与镜像内置 CUDA 版本兼容。

**相关资料：** `lessons/mod-103-containerization/07-gpu-docker.md`

---

## 问题 20
**问题：** Docker Compose 中哪个指令允许指定一个服务依赖另一个服务？

**答案：** B) `depends_on`

**解析：**
`depends_on` 控制服务启动和停止的顺序，在 Compose v2+ 中也可使用长格式的 `condition: service_healthy` 等待所依赖服务的健康检查报告健康。简短列表形式仅保证依赖容器已启动，并不保证容器内部应用已经准备好接受连接。对于数据库和消息队列，应始终将 `depends_on` 与健康检查或应用内部的重试逻辑结合。

**常见错误：**
- 选择 A（`requires`）或 C（`needs`）：这些不是 Compose 键；needs 是 GitHub Actions 的关键字，经常被误选。
- 选择 D（`after`）：有时源于对 systemd 单元语法的猜测，但 Compose 使用 `depends_on`。
- 即使选择了 `depends_on`，学习者也常忘记不使用 `condition: service_healthy` 就不会等待服务就绪。

**相关资料：** `lessons/mod-103-containerization/05-docker-compose.md`

---
