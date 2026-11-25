# 能力评估

本目录保存跨多个模块的**学习路线级**评估。各模块的测验位于对应模块的 `lessons/mod-NNN-*/quizzes/` 目录。

## 目录结构

```
assessments/
├── quizzes/              Track-level quizzes; per-module quizzes are in lessons/
│   └── answer-keys/      Answer key index
├── coding-challenges/    Multi-module coding challenges
├── practical-exams/      Midterm and final practical exams
└── rubrics/              Grading rubrics for projects and exams
```

## 各模块测验（正式位置）

每个模块都有独立测验文件。正式位置为 `lessons/mod-NNN-*/quizzes/module-quiz.md`。模块 02 还包含 `mid-module-quiz.md` 和 `final-quiz.md`，覆盖不同的课程范围。

| 模块 | 路径 |
|---|---|
| 101 | `lessons/mod-101-foundations/quizzes/module-quiz.md` |
| 102 | `lessons/mod-102-cloud-computing/quizzes/` （期中、期末、模块测验） |
| 103 | `lessons/mod-103-containerization/quizzes/module-quiz.md` |
| 104 | `lessons/mod-104-kubernetes/quizzes/module-quiz.md` |
| 105 | `lessons/mod-105-data-pipelines/quizzes/module-quiz.md` |
| 106 | `lessons/mod-106-mlops/quizzes/module-quiz.md` |
| 107 | `lessons/mod-107-gpu-computing/quizzes/module-quiz.md` |
| 108 | `lessons/mod-108-monitoring-observability/quizzes/module-quiz.md` |
| 109 | `lessons/mod-109-infrastructure-as-code/quizzes/module-quiz.md` |
| 110 | `lessons/mod-110-llm-infrastructure/quizzes/module-quiz.md` |

## 本目录中的学习路线级评估

| 文件 | 用途 |
|---|---|
| `coding-challenges/challenge-01-model-api.md` | 跨模块编程挑战：构建涵盖 Docker、Kubernetes 和监控的模型 API。 |
| `practical-exams/midterm-practical-exam.md` | 学习路线期中实践考试，覆盖模块 101–105。 |
| `rubrics/project-assessment-rubric.md` | 用于评定学习路线末尾三个项目的评分标准。 |

## 评分

本仓库中的每个测验和考试都有各自的通过阈值（通常为 80%）。项目评分标准见 `rubrics/project-assessment-rubric.md`。
