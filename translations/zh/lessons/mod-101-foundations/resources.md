# 模块 101 — 机器学习基础设施基础参考资料

## 基础书籍

- **Chip Huyen 的《Designing Machine Learning Systems》**。经典机器学习系统教材，本学习路线必读。
- **Andriy Burkov 的《Machine Learning Engineering》**。对 Huyen 教材的实践补充，涵盖更多工程方面的内容。
- **Databricks 的《The Big Book of MLOps》（2023）**。免费 PDF，全面介绍 MLOps。
- **Emmanuel Ameisen 的《Building Machine Learning Powered Applications》**。从产品工程角度理解机器学习。

## 官方文档

- **PyTorch 文档** — [pytorch.org/docs](https://pytorch.org/docs/stable/index.html)。本模块大部分代码使用的框架。
- **TensorFlow 文档** — [tensorflow.org/api_docs](https://www.tensorflow.org/api_docs)。用于对比，目前仍被广泛部署。
- **TorchServe 文档** — [pytorch.org/serve](https://pytorch.org/serve/)。PyTorch 的模型服务框架。
- **TensorFlow Serving 文档** — [tensorflow.org/tfx/serving](https://www.tensorflow.org/tfx/serving)。TensorFlow 的模型服务框架。

## 机器学习生命周期参考资料

- **Google 的 Rules of Machine Learning** — [developers.google.com/machine-learning/guides/rules-of-ml](https://developers.google.com/machine-learning/guides/rules-of-ml)。43 条规则，建议通读一遍。
- **Hidden Technical Debt in Machine Learning Systems**（Sculley 等，NeurIPS 2015）— [论文 PDF](https://papers.nips.cc/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf)。“ML 系统 5% 是机器学习，95% 是胶水代码”的那篇论文。
- **Thoughtworks 的 Continuous Delivery for Machine Learning** — [martinfowler.com/articles/cd4ml.html](https://martinfowler.com/articles/cd4ml.html)。持续交付应用于机器学习时需要掌握的模式。

## 值得阅读的行业文章

- **Meet Michelangelo**（Uber）— [uber.com/blog/michelangelo-machine-learning-platform](https://www.uber.com/blog/michelangelo-machine-learning-platform/)。企业内部机器学习平台的经典参考文章。
- **Open-Sourcing Metaflow**（Netflix）— [netflixtechblog.com/open-sourcing-metaflow-a-human-centric-framework-for-data-science-fa72e04a5d9](https://netflixtechblog.com/open-sourcing-metaflow-a-human-centric-framework-for-data-science-fa72e04a5d9)。以人为中心的框架设计。
- **Scaling Kubernetes to Support 50,000 Services**（Airbnb）— 用于理解平台工程的规模。

## 开发环境

- **uv** — [docs.astral.sh/uv](https://docs.astral.sh/uv/)。现代 Python 包管理器（比 pip 快 10–100 倍）。
- **ruff** — [docs.astral.sh/ruff](https://docs.astral.sh/ruff/)。代码规范检查器与格式化工具。
- **mypy** — [mypy.readthedocs.io](https://mypy.readthedocs.io/)。类型检查器。
- **pre-commit** — [pre-commit.com](https://pre-commit.com/)。钩子框架。
- **Docker Desktop** 或 **Podman** — 本地容器运行时。

## 机器学习框架比较

| 框架 | 最适合的场景 | 说明 |
|---|---|---|
| **PyTorch** | 研究、现代生产环境 | 主流深度学习框架，多数新代码使用 PyTorch。 |
| **TensorFlow** | 移动端/边缘部署、既有生产系统 | 仍被广泛部署，但现在新增代码较少。 |
| **JAX** | 对性能有较高要求的研究 | 函数式，在 LLM 研究中越来越流行。 |
| **ONNX** | 跨框架部署 | 标准交换格式，使部署不依赖特定推理运行时。 |

## 在线课程与教程

- **Andrew Ng 的 Machine Learning Specialization**（Coursera）— 观看人数极多的经典机器学习课程，适合打基础。
- **Fast.ai Practical Deep Learning for Coders** — [course.fast.ai](https://course.fast.ai/)。自顶向下、优先交付的教学方式。
- **Hugging Face Course** — [huggingface.co/learn](https://huggingface.co/learn)。现代化、实践导向、免费。
- **Full Stack Deep Learning** — [fullstackdeeplearning.com](https://fullstackdeeplearning.com/)。免费机器学习系统课程。

## 本课程的交叉参考

- 这是工程师学习路线的第一个模块。其余九个模块（mod-102 至 mod-110）建立在本模块的知识之上。
- 若从零开始学习，初级路线的 mod-001 至 mod-005 涵盖前置知识。
- ML Platform 路线是同级专业方向，在更高抽象层次讨论相同概念。
- 模块 105（数据管道）、106（MLOps）和 110（LLM 基础设施）直接建立在本模块基础之上，进行深入讲解。
