# 练习 10：提示词管理与版本控制

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 练习 09

## 目标

构建提示词管理系统：在版本化存储中保存提示词、按环境配置不同值、对提示词变体开展 A/B 测试、使用评估结果作为发布门禁，并在不修改代码的情况下部署。

## 为什么重要

提示词是配置，而不是代码。将其当作配置管理（版本、审查、A/B 测试、回滚），是成熟 LLM 应用避免「提示词变更破坏生产环境却无人察觉」这一反模式的方式。

## 要求

1. 在 Git 中保存提示词（YAML）。
2. 按环境配置不同值（开发环境：详细；生产环境：简洁）。
3. 为每个请求选择变体的 A/B 测试框架。
4. 每次提示词变更均执行的评估套件。
5. 由评估分数控制部署。

## 分步操作

### 步骤 1——提示词 Schema（15 分钟）
```yaml
# prompts/customer_support_v3.yaml
id: customer-support
version: 3
system: |
  You are a helpful customer support agent for {{ company_name }}.
  Always reply in JSON: {"answer": str, "needs_human": bool}.
user_template: |
  Question: {{ question }}
  Context: {{ context | default("") }}
metadata:
  owner: support-team
  reviewed_by: alice@
  reviewed_at: 2026-05-22
```

### 步骤 2——加载器（15 分钟）
```python
import jinja2, yaml
class PromptLoader:
    def __init__(self, repo_path): self.repo = repo_path
    def load(self, prompt_id: str, version: int | str = "latest") -> dict:
        # version "latest" → highest version
        path = f"{self.repo}/{prompt_id}_v{version}.yaml" if version != "latest" else self._latest(prompt_id)
        return yaml.safe_load(open(path))
    def render(self, p, **vars):
        env = jinja2.Environment()
        return {
            "system": env.from_string(p["system"]).render(**vars),
            "user":   env.from_string(p["user_template"]).render(**vars),
        }
```

### 步骤 3——A/B 测试框架（45 分钟）
```python
ABTESTS = {
    "customer-support": [
        {"version": 3, "weight": 0.5},
        {"version": 4, "weight": 0.5},
    ],
}

def pick_variant(prompt_id, user_id):
    h = int(hashlib.md5(f"{user_id}:{prompt_id}".encode()).hexdigest(), 16) / 16**32
    cum = 0
    for variant in ABTESTS[prompt_id]:
        cum += variant["weight"]
        if h < cum: return variant["version"]
    return ABTESTS[prompt_id][-1]["version"]

def chat(prompt_id, user_id, **vars):
    version = pick_variant(prompt_id, user_id)
    p = loader.load(prompt_id, version)
    rendered = loader.render(p, **vars)
    # log: prompt_id, version, user_id for downstream attribution
    response = call_llm(rendered)
    log_attribution(prompt_id, version, user_id, response)
    return response
```

### 步骤 4——评估套件（45 分钟）
```python
# evals/customer_support_v4.yaml
- name: refund_simple
  inputs: { question: "How do I get a refund?" }
  expected:
    must_contain: ["refund"]
    must_not_contain: ["I don't know"]
    json_valid: true
    needs_human_when_unclear: false

- name: escalate_unclear
  inputs: { question: "asdf qwerty zxcv" }
  expected:
    needs_human_when_unclear: true
```

```python
def run_evals(prompt_id, version):
    p = loader.load(prompt_id, version)
    results = []
    for case in load_evals(prompt_id):
        rendered = loader.render(p, **case["inputs"])
        resp = call_llm(rendered)
        results.append(check(resp, case["expected"]))
    return {"pass_rate": mean(r["passed"] for r in results), "details": results}
```

### 步骤 5——CI 门禁（15 分钟）
```yaml
- name: Evaluate prompt changes
  run: |
    for prompt in $(git diff --name-only main HEAD -- prompts/); do
      pass_rate=$(python evaluate.py $prompt | jq .pass_rate)
      if (( $(echo "$pass_rate < 0.9" | bc -l) )); then
        echo "Prompt $prompt eval pass rate $pass_rate < 0.9; blocking."
        exit 1
      fi
    done
```

### 步骤 6——生产部署（15 分钟）
合并新提示词版本后，该版本即可使用；A/B 测试配置（`ABTESTS`）决定流量是否流向它。通过编辑权重进行晋升：
```yaml
- {version: 3, weight: 0.0}
- {version: 4, weight: 1.0}     # full rollout
```

## 交付物

1. 提示词仓库，至少包含两个提示词，每个至少两个版本。
2. 加载器与 A/B 测试框架。
3. 包含至少 10 个用例的评估套件。
4. CI 门禁。
5. `PROMPT_LIFECYCLE.md`：如何新增、测试、晋升与退役提示词。

## 验证

- [ ] 请求日志中可以看到 A/B 变体。
- [ ] 故意设计的劣质提示词无法通过评估门禁。
- [ ] 通过一个 PR（修改权重）将 v4 发布至 100% 流量。
- [ ] 随时间追踪评估通过率。

## 常见陷阱

- **将提示词写在代码字符串中**——埋藏在 Python 字面量内，无法独立审查和管理版本。始终将其外部化。
- **没有评估套件**——「看起来更好」是主观判断，应量化。
- **紧急修复时跳过门禁**——一次「快速修复」可能引入回归。始终执行评估。
