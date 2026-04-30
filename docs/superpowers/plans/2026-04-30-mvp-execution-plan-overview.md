# grounded-resume MVP 执行计划总览

> **For agentic workers:** 本目录包含 grounded-resume MVP（v0.1 Alpha + v1.0 Beta）的完整执行计划。
> 
> 每个计划都是独立的、可执行的、可验证的。计划之间通过数据契约（Plan A 的 Pydantic Schema）解耦。

---

## 计划拆分总览

| 计划 | 目标 | 范围 | 产出 | 依赖 |
|---|---|---|---|---|
| **Plan A: 数据模型与基础设施** | 建立共享数据契约和基础设施 | Pydantic v2 Schema、SQLite 存储、LLM Provider 抽象接口、Python 项目配置 | 可导入的 `core.models`、`core.db`、`core.providers` | 无 |
| **Plan B: 解析与映射层** | 实现 JD 解析、素材解析、证据映射 | `JDParser`、`MaterialParser`、`EvidenceMapper` + FakeLLM 测试 | 3 个可独立测试的模块 | Plan A |
| **Plan C: 生成与校验层** | 实现安全生成和校验 | `ConstrainedGenerator`、`ExpressionGuard`、`RedlineDetector`、`ConservativeMode`、`Validator` | 5 个可独立测试的模块 | Plan A, Plan B |
| **Plan D: 用户确认与输出层** | 实现确认会话和简历格式化 | `UserConfirmation`、`ResumeFormatter`、Markdown 导出 | 确认会话管理器 + Markdown/附件生成 | Plan A, B, C |
| **Plan E: 工作流编排与 API** | 将模块编排成后端服务 | LangGraph `StateGraph`、节点/边、FastAPI REST、WebSocket、Checkpointing | 可运行的后端服务 | Plan A, B, C, D |
| **Plan F: Web 前端** | 构建用户界面 | Next.js、输入表单、三栏确认布局、证据可视化、结果展示 | 可运行的前端应用 | Plan E（API 契约）|

## 依赖关系图

```text
Plan A (数据模型与基础设施)
  └── Plan B (解析与映射层)
        └── Plan C (生成与校验层)
              └── Plan D (用户确认与输出层)
                    └── Plan E (工作流编排与 API)
                          └── Plan F (Web 前端)
```

## 执行顺序建议

1. **先执行 Plan A** - 所有后续计划的数据基础
2. **再执行 Plan B** - 核心解析能力
3. **再执行 Plan C** - 核心生成与校验能力
4. **再执行 Plan D** - 用户确认与输出
5. **再执行 Plan E** - 将模块串联成服务
6. **最后执行 Plan F** - 前端界面

## 文件列表

| 文件 | 说明 |
|---|---|
| `2026-04-30-plan-a-data-models-infrastructure.md` | Plan A 完整详细计划 |
| `2026-04-30-plan-b-parsing-mapping.md` | Plan B 概要计划 |
| `2026-04-30-plan-c-generation-validation.md` | Plan C 概要计划 |
| `2026-04-30-plan-d-confirmation-output.md` | Plan D 概要计划 |
| `2026-04-30-plan-e-workflow-api.md` | Plan E 概要计划 |
| `2026-04-30-plan-f-web-frontend.md` | Plan F 概要计划 |

## 关键成功指标（MVP 阶段）

| 指标 | 目标 | 验证方式 |
|---|---|---|
| Critical JD 要求覆盖率 | ≥ 60% | 系统自动计算 |
| 红线拦截率 | ≥ 95% | 回归测试：Baseline 12 样本 |
| 素材事实溯源覆盖率 | 100% | 系统自动校验 |
| 端到端生成耗时 | P95 ≤ 5 分钟 | 系统监控 |
| 单元测试覆盖 | 30-50 个 case | pytest 运行 |
| 集成测试覆盖 | 10-15 个 case | pytest 运行 |

## 执行选项

**1. Subagent-Driven（推荐）** - 每个 Task 派遣独立的 subagent 执行，主 agent 在 Task 间审查，快速迭代

**2. Inline Execution** - 在当前 session 中使用 executing-plans 技能批量执行，带检查点审查

**请选择执行方式。**
