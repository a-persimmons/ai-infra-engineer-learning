# 练习 12：LLM 评估基础设施

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 10

## 目标

使用 LLM-as-Judge 和基于参考答案的指标，为 LLM 应用构建可复现的评分框架。随时间追踪分数，并对回归告警。

## 为什么重要

LLM 应用可能悄然退化——模型升级、提示词变更或检索漂移均可能引起这种情况。如果没有持续评分，你只能从客户投诉中发现回归；有了评分机制，就能在 CI 中捕获问题。

## 要求

1. 包含至少 100 个样本、覆盖五个类别的评分集。
2. 多种评分方式：基于参考答案（BLEU、精确匹配）、LLM-as-Judge、正则表达式断言。
3. 每个 PR 均执行评分，并每晚对生产环境运行评分。
4. 持久化分数并建立趋势仪表盘。
5. 分数下降超过 2 个百分点时触发回归告警。

## 分步操作

### 步骤 1——评分集设计（45 分钟）
```yaml
# scoring/cases.yaml
- id: greet_001
  category: greeting
  input: "Hello"
  expected_contains: ["hello", "hi", "greetings"]
  expected_json_keys: ["answer"]
  expected_needs_human: false

- id: refund_simple_001
  category: support
  input: "How do I get a refund?"
  reference_answer: "Visit the order page, click 'Request Refund', and select the item."
  llm_judge_criteria: "Does the response correctly explain the refund process?"

- id: escalate_001
  category: support
  input: "I want to speak to a manager about my account being hacked"
  expected_needs_human: true
  llm_judge_criteria: "Does the response escalate appropriately?"
```

构建至少 100 个样本，在正常路径、边缘情况、对抗性输入和歧义之间保持均衡。

### 步骤 2——评分方法（60 分钟）
```python
def score_contains(response, expected):
    text = response["answer"].lower()
    return all(s in text for s in expected)

def score_json_schema(response, expected_keys):
    return set(response.keys()) >= set(expected_keys)

def score_llm_judge(response, criteria):
    judge = OpenAI()
    r = judge.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role":"system","content":"You are an evaluator. Reply with only YES or NO."},
            {"role":"user","content":f"Criteria: {criteria}\nResponse: {response}\nDoes the response meet the criteria?"},
        ],
        max_tokens=5, temperature=0,
    )
    return r.choices[0].message.content.strip().upper() == "YES"

def score_case(app, case):
    resp = app(case["input"])
    scores = {}
    if "expected_contains" in case:
        scores["contains"] = score_contains(resp, case["expected_contains"])
    if "expected_json_keys" in case:
        scores["json_schema"] = score_json_schema(resp, case["expected_json_keys"])
    if "llm_judge_criteria" in case:
        scores["llm_judge"] = score_llm_judge(resp, case["llm_judge_criteria"])
    return {"case_id": case["id"], "scores": scores, "passed": all(scores.values())}
```

### 步骤 3——评分运行器（30 分钟）
```python
def run_scoring(app, scoring_set_path):
    cases = yaml.safe_load(open(scoring_set_path))
    results = [score_case(app, c) for c in cases]
    pass_rate = sum(r["passed"] for r in results) / len(results)
    return {"timestamp": time.time(), "pass_rate": pass_rate, "n": len(results), "details": results}
```

### 步骤 4——持久化结果（15 分钟）
将每次运行存入 S3 或数据库：
```python
import boto3
s3.put_object(Bucket="scoring-runs", Key=f"runs/{run_id}.json", Body=json.dumps(result))
```

### 步骤 5——趋势仪表盘（30 分钟）
通过 Athena 查询 S3，并使用 Grafana：
```sql
SELECT date_trunc('day', from_unixtime(timestamp)) AS day,
       AVG(pass_rate) AS pass_rate,
       category
FROM scoring_runs
GROUP BY 1, category
ORDER BY 1 DESC;
```

### 步骤 6——CI 集成（15 分钟）
```yaml
- name: Run scoring
  run: |
    pass_rate=$(python run_scoring.py | jq .pass_rate)
    if (( $(echo "$pass_rate < 0.85" | bc -l) )); then
      echo "Scoring pass rate $pass_rate < 0.85; blocking."
      exit 1
    fi
```

### 步骤 7——夜间任务与回归告警（15 分钟）
定时任务对生产环境运行评分。如果 7 天滚动通过率下降超过 2 个百分点，则告警。

## 交付物

1. 评分集（至少 100 个用例）。
2. 评分运行器及评分函数。
3. CI 集成。
4. 夜间任务。
5. 趋势仪表盘。
6. `SCORING_PHILOSOPHY.md`：衡量哪些内容、不衡量哪些内容，以及何时扩充评分集。

## 验证

- [ ] 对相同代码重复执行评分，得到可复现的分数。
- [ ] CI 阻止评分发生回归的 PR。
- [ ] 仪表盘显示数周内的趋势。
- [ ] 合成回归测试触发告警。

## 常见陷阱

- **LLM-as-Judge 偏差**——同一模型对自身输出评分可能偏高。使用不同模型担任评判者。
- **评分集偏差**——仅根据简单用例构建，会遗漏生产环境中的异常情况。从真实日志挖掘用例。
- **使用单个数字表示通过率**——掩盖某些类别的全面退化。按类别分段追踪。
- **LLM 响应的非确定性**——使用 temperature=0；即便如此，原文仍预期存在 1–2% 的波动。
