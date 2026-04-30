# product/

本目录存放 grounded-resume 项目的产品文档，包括需求定义、设计方案、技术规格及决策记录。

## 目录结构

```
product/
├── requirements/     # PRD、需求文档、问题定义
├── designs/          # 工作流设计、交互设计、原型（待补充）
├── specs/            # 技术规格、接口定义（待补充）
└── decisions/        # 执行方案、范围决策、ADR
```

## 文档索引

| 文档 | 路径 | 说明 |
|---|---|---|
| 问题定义 v1.0 | `requirements/问题定义 v1.0.md` | 核心任务定义、目标用户、产品机会点 |
| AI 产品经理招聘要求 | `requirements/AI产品经理招聘要求.md` | 目标岗位 JD 参考 |
| **MVP 工作流设计 v0.1** | **`designs/mvp-workflow-v0.1.md`** | **端到端工作流：输入→解析→映射→生成→校验→确认→输出** |
| **核心模块设计 v0.1** | **`designs/core-modules-v0.1.md`** | **9 个核心模块的职责、接口与交互协议** |
| **数据结构规格 v0.1** | **`specs/data-structures-v0.1.md`** | **JD 解析结果、素材事实、证据映射、简历章节等 Schema** |
| C 类专用 AI 简历工具 Smoke Test 执行方案 | `decisions/C类专用AI简历工具SmokeTest执行方案 v0.1.md` | C 类工具评测执行方案 |
| D 类开源项目 Repo Capability Review 执行方案 | `decisions/D类开源项目RepoCapabilityReview执行方案 v0.1.md` | D 类项目评审执行方案 |
| **ADR-001: MVP 技术架构** | **`decisions/adr-001-mvp-architecture.md`** | **7 项架构决策：LangGraph、多模型、Web 应用、SQLite、安全、测试、云端试用** |
| D 类开源项目 Smoke Test 范围决策 | `decisions/d-repos-smoke-test-scope-decision.md` | 范围决策 |
| A 类工具范围决策 | `decisions/a-tools-scope-decision.md` | 范围决策 |

## 下一阶段

- [x] MVP 工作流设计 v0.1 → `designs/`
- [x] 核心模块设计 v0.1 → `designs/`
- [x] 数据结构规格 v0.1 → `specs/`
- [x] 架构决策记录（ADR）→ `decisions/`
- [ ] MVP 技术实现计划 → `docs/superpowers/plans/`
