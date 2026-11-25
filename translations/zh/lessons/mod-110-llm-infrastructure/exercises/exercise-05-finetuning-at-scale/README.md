# 练习 05：规模化微调（LoRA + QLoRA + 分布式训练）

**时长：** 4 小时
**难度：** 高级
**前置条件：** 实验 04（LoRA 基础）；多 GPU 环境

## 目标

将微调工作流从单 GPU LoRA 扩展至 130 亿参数模型的多 GPU QLoRA。追踪实验，保存 Adapter，并通过 vLLM 的 LoRA 热切换提供服务。

## 要求

1. 在单 GPU 上训练 LoRA（基线）。
2. 在单 GPU 上使用 QLoRA（4-bit）训练更大的模型。
3. 使用多 GPU DDP 训练更大的模型。
4. 通过 MLflow 管理 Adapter 检查点。
5. 通过 vLLM 的 `--enable-lora` 提供已训练 Adapter 的服务。

## 分步操作

### 步骤 1——单 GPU LoRA 基线（45 分钟）
按照实验 04 操作。选择 30–70 亿参数模型（Phi-3-mini 或 Llama-3.2-3B），使用约 500 条指令样本。

### 步骤 2——130 亿参数模型的 QLoRA（60 分钟）
```python
from transformers import BitsAndBytesConfig
bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                          bnb_4bit_compute_dtype=torch.bfloat16, bnb_4bit_use_double_quant=True)
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3-13B-Instruct",
                                              quantization_config=bnb, device_map="auto")
```
4-bit 的 130 亿参数模型可放入约 10GB 显存中（fp16 约需 26GB）。现在可尝试在单块 24GB 消费级 GPU 上训练。

### 步骤 3——跨 2–4 块 GPU 的 DDP（60 分钟）
```bash
accelerate config    # configure for multi-GPU
accelerate launch finetune.py
```
使用 Hugging Face 的 `accelerate`：
```python
from accelerate import Accelerator
accelerator = Accelerator()
model, opt, train_loader = accelerator.prepare(model, opt, train_loader)
for batch in train_loader:
    with accelerator.accumulate(model):
        loss = model(**batch).loss
        accelerator.backward(loss)
        opt.step(); opt.zero_grad()
```
在多块 GPU 上近似线性扩展。

### 步骤 4——在 MLflow 中追踪（15 分钟）
```python
mlflow.log_params({"base_model": "Llama-3-13B", "lora_r": 16, "lora_alpha": 32, "batch_size": 2})
mlflow.log_metric("train_loss", loss, step=global_step)
mlflow.log_artifact("./adapter/")    # at end of training
```

### 步骤 5——Adapter 晋升（15 分钟）
在 MLflow Model Registry 中注册 Adapter 目录。根据评估集困惑度晋升至 Staging。

### 步骤 6——通过 vLLM 提供服务（30 分钟）
```bash
vllm serve meta-llama/Llama-3-13B-Instruct \
  --enable-lora \
  --lora-modules my-adapter=/path/to/adapter \
  --max-loras 4
```
```python
client.chat.completions.create(model="my-adapter", messages=[...])
```

## 交付物

1. 三次训练运行记录（LoRA、QLoRA、DDP）。
2. 所有运行的 MLflow 追踪记录。
3. 已提供服务且输出不同于基础模型的 Adapter。

## 验证

- [ ] QLoRA 能在单 GPU 中容纳 130 亿参数模型。
- [ ] N 块 GPU 达到约 N 倍加速。
- [ ] 已提供服务的 Adapter 相较基础模型具有可测量的行为变化。

## 常见陷阱

- **Adapter 的 target_modules 错误**——不同架构使用不同模块名称；打印模型以查找。
- **bf16 与 GradScaler**——bf16 不需要 GradScaler，fp16 则需要。
- **保存完整模型而非 Adapter**——原文指出 `model.save_pretrained()` 保存合并后的权重；使用 `peft_model.save_pretrained()` 仅保存 Adapter。

> 译注：具体显存需求与保存行为取决于模型、训练配置和对象类型；PEFT 的模型对象默认可仅保存 Adapter。
