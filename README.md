# grounded-resume

> 基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历。

## 项目阶段

- [x] **Baseline 阶段**：已完成 A/B/C/D 四类 baseline 评测，确认现有方案无法完整覆盖核心任务。
- [x] **MVP 工作流设计**：已完成三份设计文档。
- [ ] **MVP 开发**：待启动。

## 仓库结构导航

```
grounded-resume/
├── research/        # Baseline 阶段所有研究产出（评测数据、报告、模板）
├── product/         # 产品文档（需求、设计、技术规格、决策）
├── src/             # 源代码（MVP 核心引擎、管道、API）
├── tests/           # 测试（单元测试、集成测试、评测基准）
├── scripts/         # 工具脚本
└── docs/            # 项目级文档（架构、指南、入门）
```

## 关键文档速查

| 文档 | 路径 | 说明 |
|---|---|---|
| 问题定义 | `product/requirements/问题定义 v1.0.md` | 核心任务定义与产品机会点 |
| Baseline 综合分析 | `research/baseline/reports/Baseline 综合分析报告 v1.0.md` | 四类 baseline 评测结论 |
| **MVP 工作流设计** | **`product/designs/mvp-workflow-v0.1.md`** | **端到端工作流设计** |
| **核心模块设计** | **`product/designs/core-modules-v0.1.md`** | **9 个核心模块职责与接口** |
| **数据结构规格** | **`product/specs/data-structures-v0.1.md`** | **各阶段数据 Schema** |
| 评测框架 | `research/templates/Baseline 评测框架 v0.1.md` | 评测方法论与评分维度 |
| Smoke Test 汇总 | `research/baseline/reports/smoke-summary.md` | 10 个通用 LLM 初评汇总 |
| Deep Test 汇总 | `research/baseline/reports/deep-summary.md` | ChatGPT / DeepSeek / GLM 深度评测汇总 |

## 快速开始（开发者）

1. 阅读 `product/requirements/问题定义 v1.0.md` 了解核心任务定义
2. 查看 `research/baseline/README.md` 浏览 Baseline 评测数据
3. 查看 `product/README.md` 了解产品文档索引

## 贡献指南

见 `docs/guides/CONTRIBUTING.md`（待创建）。
