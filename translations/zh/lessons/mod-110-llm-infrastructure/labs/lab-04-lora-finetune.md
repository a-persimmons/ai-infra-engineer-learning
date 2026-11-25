# 实验 04：使用 LoRA 微调小型模型

**时长：** 90 分钟  **前置条件：** 显存 ≥16GB 的 GPU；PyTorch + Transformers + PEFT。

## 目标

使用 LoRA 在小型指令数据集上微调一个 10–30 亿参数的 LLM，对比基础模型与微调模型的输出。

## 步骤

### 1. 安装
```bash
pip install 'torch>=2.3' 'transformers>=4.42' 'peft>=0.11' 'datasets>=2.20' 'accelerate>=0.31' 'bitsandbytes>=0.43'
```

### 2. 选择基础模型与数据集

- 基础模型：`microsoft/Phi-3-mini-4k-instruct`（38 亿参数；使用 QLoRA 时可尝试在 16GB 显存中运行）。
- 数据集：`HuggingFaceH4/no_robots` 或小型自定义 JSONL。

### 3. 训练脚本
```python
# finetune.py
import torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer       # pip install trl

BASE = "microsoft/Phi-3-mini-4k-instruct"

bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                          bnb_4bit_compute_dtype=torch.bfloat16)
tok = AutoTokenizer.from_pretrained(BASE)
model = AutoModelForCausalLM.from_pretrained(BASE, quantization_config=bnb,
                                              device_map="auto", trust_remote_code=True)
model = prepare_model_for_kbit_training(model)

lora = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05,
                  target_modules=["qkv_proj","o_proj"], task_type="CAUSAL_LM")
model = get_peft_model(model, lora)
model.print_trainable_parameters()        # << 1% of total

ds = load_dataset("HuggingFaceH4/no_robots", split="train[:500]")

def fmt(ex):
    return {"text": f"<|user|>\n{ex['prompt']}\n<|assistant|>\n{ex['messages'][1]['content']}<|end|>"}

ds = ds.map(fmt)

args = TrainingArguments(
    output_dir="./lora-phi3",
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    num_train_epochs=1,
    learning_rate=2e-4,
    fp16=False, bf16=True,
    logging_steps=10,
    save_strategy="epoch",
)
trainer = SFTTrainer(model=model, train_dataset=ds, tokenizer=tok, args=args,
                     dataset_text_field="text", max_seq_length=512)
trainer.train()
model.save_pretrained("./lora-phi3-adapter")
```

### 4. 运行
```bash
python finetune.py
```
在单块 A10/A40/L4/3090 上约需 30–45 分钟。

### 5. 对比基础模型与微调模型
```python
from peft import PeftModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

BASE = "microsoft/Phi-3-mini-4k-instruct"
tok = AutoTokenizer.from_pretrained(BASE)
base = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.bfloat16, device_map="auto")
ft   = PeftModel.from_pretrained(base, "./lora-phi3-adapter")

def gen(model, prompt):
    inp = tok(prompt, return_tensors="pt").to(model.device)
    out = model.generate(**inp, max_new_tokens=200)
    return tok.decode(out[0], skip_special_tokens=True)

prompt = "Explain why distributed systems are hard, in 3 paragraphs."
print("== base ==\n", gen(base, prompt))
print("\n== fine-tuned ==\n", gen(ft, prompt))
```

### 6. 合并 Adapter 以提供模型服务
```python
merged = ft.merge_and_unload()
merged.save_pretrained("./phi3-merged")
```
现在可以通过 vLLM（实验 01）提供 `./phi3-merged` 的服务，不需要 PEFT 运行时。

## 验证

- [ ] 训练报告显示可训练参数比例低于 1%。
- [ ] Loss 随训练步数增加而下降。
- [ ] 微调后的输出与基础模型在定性上有所不同（风格向训练数据靠近）。
- [ ] 合并后的模型成功加载并提供服务。

## 清理
```bash
rm -rf lora-phi3 lora-phi3-adapter phi3-merged
```

## 故障排查

- **`Cannot import bitsandbytes`** — 原文环境假定 Linux + CUDA；macOS 用户可以采用非 4-bit 的全精度 LoRA 方案。
- **训练期间 OOM** — 降低 `per_device_train_batch_size`；提高 `gradient_accumulation_steps` 保持有效批大小。
- **找不到 `target_modules`** — 不同模型架构使用不同模块名；打印 `model` 来查找。
