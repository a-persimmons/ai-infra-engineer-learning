# 模块 07：GPU 计算与分布式训练 — 学习资源

## 官方文档

### NVIDIA CUDA
- [CUDA C++ 编程指南](https://docs.nvidia.com/cuda/cuda-c-programming-guide/) - 全面的 CUDA 编程参考
- [CUDA C++ 最佳实践指南](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/) - 性能优化指南
- [CUDA Toolkit 文档](https://docs.nvidia.com/cuda/) - 完整 CUDA 文档
- [cuDNN 开发者指南](https://docs.nvidia.com/deeplearning/cudnn/developer-guide/) - 深度学习基础算子

### PyTorch 分布式训练
- [PyTorch 分布式训练概览](https://pytorch.org/tutorials/beginner/dist_overview.html) - 分布式训练导论
- [DistributedDataParallel](https://pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html) - DDP API 参考
- [DDP 教程](https://pytorch.org/tutorials/intermediate/ddp_tutorial.html) - DDP 分步指南
- [PyTorch CUDA 语义](https://pytorch.org/docs/stable/notes/cuda.html) - PyTorch 如何使用 CUDA

### NVIDIA 深度学习
- [深度学习性能指南](https://docs.nvidia.com/deeplearning/performance/) - 优化最佳实践
- [混合精度训练](https://docs.nvidia.com/deeplearning/performance/mixed-precision-training/) - AMP 指南
- [NCCL 文档](https://docs.nvidia.com/deeplearning/nccl/) - 集合通信库

## 书籍

### GPU 计算
1. **《Programming Massively Parallel Processors》（大规模并行处理器编程）**，作者：David Kirk and Wen-mei Hwu
   - 全面介绍 GPU 编程
   - CUDA 基础与高级技术
   - [可在 Amazon 获取](https://www.amazon.com/Programming-Massively-Parallel-Processors-Hands/dp/0124159923)

2. **《Professional CUDA C Programming》（专业 CUDA C 编程）**，作者：John Cheng, Max Grossman, Ty McKercher
   - 实用 CUDA 编程指南
   - 真实场景中的优化技术
   - [可在 O'Reilly 获取](https://www.oreilly.com/library/view/professional-cuda-c/9781118739310/)

### 分布式训练
3. **《Distributed Machine Learning Patterns》（分布式机器学习模式）**，作者：Yuan Tang
   - 现代分布式 ML 模式
   - 实际实现
   - [可在 Manning 获取](https://www.manning.com/books/distributed-machine-learning-patterns)

4. **《Deep Learning at Scale》（大规模深度学习）**，作者：Suneeta Mall
   - 扩展深度学习系统
   - 基础设施考量
   - [可在 Manning 获取](https://www.manning.com/books/deep-learning-at-scale)

## 研究论文

### 基础论文
- [使用深度卷积神经网络进行 ImageNet 分类](https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html) - AlexNet（开启了深度学习的 GPU 革命）
- [精确的大规模小批量 SGD](https://arxiv.org/abs/1706.02677) - 大批量训练

### 分布式训练
- [PyTorch Distributed：加速数据并行训练的经验](https://arxiv.org/abs/2006.15704) - DDP 实现细节
- [Horovod：快速而简便的分布式深度学习](https://arxiv.org/abs/1802.05799) - Uber 的分布式训练框架
- [ZeRO：面向万亿参数模型训练的内存优化](https://arxiv.org/abs/1910.02054) - DeepSpeed ZeRO

### 模型并行
- [Megatron-LM：使用模型并行训练数十亿参数语言模型](https://arxiv.org/abs/1909.08053) - Transformer 的张量并行
- [GPipe：使用流水线并行高效训练巨型神经网络](https://arxiv.org/abs/1811.06965) - 流水线并行
- [PipeDream：面向 DNN 训练的通用流水线并行](https://arxiv.org/abs/1806.03377) - 高级流水线策略

### 内存优化
- [以次线性内存成本训练深度网络](https://arxiv.org/abs/1604.06174) - 梯度检查点
- [FlashAttention：快速且内存高效的精确注意力](https://arxiv.org/abs/2205.14135) - 内存高效的注意力机制
- [FlashAttention-2：以更好的并行性加速注意力计算](https://arxiv.org/abs/2307.08691) - 改进的 Flash Attention

### 混合精度
- [混合精度训练](https://arxiv.org/abs/1710.03740) - AMP 基础
- [面向深度学习的 FP8 格式](https://arxiv.org/abs/2209.05433) - 下一代精度格式

## 在线课程

### NVIDIA 深度学习学院
- [CUDA C/C++ 加速计算基础](https://courses.nvidia.com/courses/course-v1:DLI+C-AC-01+V1/)
- [深度学习基础](https://courses.nvidia.com/courses/course-v1:DLI+C-FX-01+V1/)
- [跨多个 GPU 扩展工作负载](https://courses.nvidia.com/courses/course-v1:DLI+C-MG-01+V1/)

### Coursera
- [CUDA 并行编程](https://www.coursera.org/specializations/gpu-programming) - 约翰斯·霍普金斯大学
- [高性能计算](https://www.coursera.org/specializations/computational-thinking) - 科罗拉多大学博尔德分校

### Fast.ai
- [面向程序员的实用深度学习](https://course.fast.ai/) - 包含 GPU 优化技术
- [从深度学习基础到 Stable Diffusion](https://course.fast.ai/Lessons/part2.html) - 高级主题

## 工具与程序库

### PyTorch 生态系统
- **PyTorch** - https://pytorch.org/
- **PyTorch Lightning** - https://lightning.ai/ - 高级训练框架
- **Accelerate** - https://huggingface.co/docs/accelerate/ - 简化分布式训练
- **torchrun** - 内置分布式训练启动器

### 分布式训练框架
- **DeepSpeed** - https://www.deepspeed.ai/ - Microsoft 的训练优化库
- **Megatron-LM** - https://github.com/NVIDIA/Megatron-LM - NVIDIA 的大模型训练工具
- **Horovod** - https://horovod.ai/ - Uber 的分布式深度学习框架
- **Alpa** - https://alpa.ai/ - 自动化模型并行

### 内存优化
- **Flash Attention** - https://github.com/Dao-AILab/flash-attention
- **xFormers** - https://github.com/facebookresearch/xformers - 内存高效的运算
- **bitsandbytes** - https://github.com/TimDettmers/bitsandbytes - 8 位优化器
- **Apex** - https://github.com/NVIDIA/apex - NVIDIA 的混合精度工具

### 性能分析与监控
- **NVIDIA Nsight Systems** - https://developer.nvidia.com/nsight-systems
- **NVIDIA Nsight Compute** - https://developer.nvidia.com/nsight-compute
- **PyTorch Profiler** - PyTorch 内置
- **TensorBoard** - https://www.tensorflow.org/tensorboard - 可视化
- **Weights & Biases** - https://wandb.ai/ - 实验追踪
- **nvidia-ml-py** - https://pypi.org/project/nvidia-ml-py3/ - nvidia-smi 的 Python 绑定

### 基础设施
- **Ray** - https://ray.io/ - 分布式计算框架
- **Kubernetes** - https://kubernetes.io/ - 容器编排
- **Kubeflow** - https://kubeflow.org/ - Kubernetes 上的机器学习
- **MLflow** - https://mlflow.org/ - ML 生命周期管理

## 博客文章与教程

### NVIDIA
- [NVIDIA 开发者博客](https://developer.nvidia.com/blog/) - 最新 GPU 计算见解
- [混合精度训练教程](https://developer.nvidia.com/automatic-mixed-precision)
- [多 GPU 编程模型](https://developer.nvidia.com/blog/cuda-pro-tip-write-flexible-kernels-grid-stride-loops/)

### PyTorch
- [PyTorch 性能调优指南](https://pytorch.org/tutorials/recipes/recipes/tuning_guide.html)
- [分布式训练系列教程](https://pytorch.org/tutorials/beginner/ddp_series_intro.html)
- [PyTorch 博客](https://pytorch.org/blog/) - PyTorch 官方更新

### Hugging Face
- [训练大语言模型](https://huggingface.co/blog/bloom-megatron-deepspeed)
- [单 GPU 高效训练](https://huggingface.co/docs/transformers/perf_train_gpu_one)
- [多 GPU 训练](https://huggingface.co/docs/transformers/perf_train_gpu_many)

### DeepSpeed
- [DeepSpeed 快速入门](https://www.deepspeed.ai/getting-started/)
- [ZeRO 教程](https://www.deepspeed.ai/tutorials/zero/)
- [Megatron-DeepSpeed](https://github.com/microsoft/Megatron-DeepSpeed)

## 社区与论坛

### 讨论论坛
- [PyTorch 论坛 — 分布式训练](https://discuss.pytorch.org/c/distributed/) - PyTorch 官方讨论
- [NVIDIA 开发者论坛](https://forums.developer.nvidia.com/) - CUDA 与 GPU 计算
- [r/MachineLearning](https://reddit.com/r/MachineLearning) - 机器学习社区
- [r/CUDA](https://reddit.com/r/CUDA) - CUDA 编程

### GitHub 组织
- [PyTorch](https://github.com/pytorch/pytorch)
- [NVIDIA](https://github.com/NVIDIA)
- [DeepSpeed](https://github.com/microsoft/DeepSpeed)
- [Hugging Face](https://github.com/huggingface)

## 视频内容

### 会议演讲
- [GTC（GPU 技术大会）](https://www.nvidia.com/en-us/on-demand/session-library/) - NVIDIA 年度大会
- [PyTorch 大会](https://pytorch.org/ecosystem/conferences/) - PyTorch 开发者峰会
- [ICML/NeurIPS/ICLR](https://slideslive.com/) - 机器学习会议录像

### YouTube 频道
- [NVIDIA 开发者](https://www.youtube.com/c/NVIDIADeveloper) - GPU 计算教程
- [PyTorch](https://www.youtube.com/c/PyTorch) - PyTorch 官方频道
- [Weights & Biases](https://www.youtube.com/c/WeightsBiases) - 机器学习工程演讲
- [Two Minute Papers](https://www.youtube.com/c/K%C3%A1rolyZsolnai) - AI 研究摘要

## 硬件参考

### GPU 规格
- [NVIDIA GPU 规格](https://www.nvidia.com/en-us/data-center/resources/ai-inferencing-technical-overview/) - 数据中心 GPU
- [CUDA GPUs](https://developer.nvidia.com/cuda-gpus) - 计算能力查询
- [GPU 基准测试](https://lambdalabs.com/gpu-benchmarks) - 性能对比

### 架构白皮书
- [NVIDIA Hopper 架构](https://resources.nvidia.com/en-us-tensor-core) - H100
- [NVIDIA Ampere 架构](https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf) - A100
- [NVIDIA Volta 架构](https://images.nvidia.com/content/volta-architecture/pdf/volta-architecture-whitepaper.pdf) - V100

## 基准测试与数据集

### ML 基准测试
- [MLPerf Training](https://mlcommons.org/en/training-normal-20/) - 行业标准 ML 基准测试
- [DAWNBench](https://dawn.cs.stanford.edu/benchmark/) - 训练速度与成本
- [Papers With Code](https://paperswithcode.com/sota) - 最先进水平的基准测试

### 性能分析数据集
- [ImageNet](https://www.image-net.org/) - 标准视觉基准测试
- [GLUE](https://gluebenchmark.com/) - NLP 基准测试套件
- [SQuAD](https://rajpurkar.github.io/SQuAD-explorer/) - 问答任务

## 速查表

### 快速参考
- [CUDA C++ 语法](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#programming-interface) - 语言扩展
- [PyTorch 分布式训练速查表](https://pytorch.org/tutorials/beginner/dist_overview.html#comparison-table) - API 对比
- [GPU 显存优化](https://huggingface.co/docs/transformers/performance) - 快速优化技巧

### 命令行工具
```bash
# Essential GPU commands
nvidia-smi                          # GPU status
nvidia-smi -l 1                     # Monitor in real-time
nvidia-smi --query-gpu=...          # Query specific metrics
nvtop                               # Interactive monitoring
watch -n 1 nvidia-smi               # Refresh every second

# CUDA info
nvcc --version                      # CUDA compiler version
nvidia-smi --query-gpu=compute_cap  # Compute capability

# PyTorch distributed
torchrun --nproc_per_node=4         # Launch 4 processes
python -m torch.distributed.launch  # Legacy launcher
```

## 实践环境

### 云平台
- **Google Colab** - https://colab.research.google.com/ - 免费 GPU Notebook
- **Kaggle Kernels** - https://www.kaggle.com/code - 免费 P100 GPU
- **AWS EC2** - https://aws.amazon.com/ec2/instance-types/p4/ - P4d 实例
- **Google Cloud** - https://cloud.google.com/compute/docs/gpus - A100 实例
- **Azure** - https://azure.microsoft.com/en-us/products/virtual-machines/gpu - ND-series

### 学术资源
- [NCSA GPU 集群](https://www.ncsa.illinois.edu/) - 高校资源
- [XSEDE](https://www.xsede.org/) - NSF 超级计算资源
- [Google TRC](https://sites.research.google/trc/) - TPU 研究云

## 高级主题

### 新兴技术
- **FP8 训练** - 下一代精度格式
- **稀疏训练** - 使用稀疏梯度进行训练
- **混合专家模型** - 条件激活网络
- **联邦学习** - 跨设备分布式训练

### 研究方向
- [Papers With Code — 分布式训练](https://paperswithcode.com/task/distributed-training)
- [高效深度学习](https://efficientdlsystems.github.io/) - MIT 课程
- [斯坦福 CS149](https://gfxcourses.stanford.edu/cs149/fall21) - 并行计算

## 跟进最新进展

### 新闻简报
- [NVIDIA 开发者简报](https://developer.nvidia.com/newsletter)
- [PyTorch 简报](https://pytorch.org/get-started/locally/)
- [ImportAI](https://jack-clark.net/) - Jack Clark 撰写的 AI 新闻
- [The Batch](https://www.deeplearning.ai/the-batch/) - DeepLearning.AI 周报

### 播客
- [TWIML AI Podcast](https://twimlai.com/) - ML/AI 访谈
- [Gradient Dissent](https://www.gradient-dissent.com/) - Weights & Biases 播客
- [The NVIDIA AI Podcast](https://blogs.nvidia.com/ai-podcast/) - AI 创新

---

## 推荐学习路线

### 初级（第 1–2 周）
1. 从 NVIDIA DLI 的《加速计算基础》入手
2. 阅读 PyTorch CUDA 语义文档
3. 完成本模块第 01–03 课
4. 实践：将单 GPU 训练转换为多 GPU 训练

### 中级（第 3–4 周）
1. 深入学习 DDP 系列教程
2. 研读 Megatron-LM 论文
3. 完成本模块第 04–06 课
4. 实践：使用 DDP 实现数据并行

### 高级（第 5–6 周）
1. 研读 ZeRO 和 Flash Attention 论文
2. 使用 DeepSpeed 进行实验
3. 完成本模块第 07–08 课
4. 实践：优化大模型训练

### 专家级（持续学习）
1. 阅读分布式训练领域的最新论文
2. 参与开源贡献（PyTorch、DeepSpeed）
3. 参加 GTC 与 PyTorch 大会
4. 构建生产级 ML 基础设施

---

**持续学习，紧跟快速发展的 GPU 计算领域！**
