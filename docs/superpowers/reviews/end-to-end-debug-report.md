# End-to-End Debug Report: A2 示例链路

## Executive Summary

本报告基于代码路径排查与 `scripts/debug/run_a2_pipeline.py` 的实际执行输出，回答 A2 示例从前端提交到后端流水线、确认状态与导出能力的端到端问题。

核心结论：

- 前端确实调用后端 API，主要链路为 `POST /sessions`、`GET /sessions/{id}`、`POST /sessions/{id}/decisions`，没有使用前端 mock 数据替代后端结果。
- 后端确实调用了 LangGraph workflow，但当前 graph 只有 4 个节点：`parse_jd → parse_materials → map_evidence → generate_draft`。
- `JDParser`、`MaterialParser`、`EvidenceMapper`、`ConstrainedGenerator` 确实在 workflow 中执行；`Validator` 可以独立执行，但没有接入 LangGraph workflow。
- 当前生产路径没有接入真实 LLM，也没有使用 `FakeLLM`；`ConstrainedGenerator` 是 rule-based 生成器，不会调用 LLM provider。
- A2 最终只生成 1 条 bullet，是因为 JD 解析只得到 1 个 hard requirement、evidence mapping 结果为空，生成器进入 fallback path。
- evidence mapping 页面为空，是因为实际 `EvidenceMapper` 输出 `mappings=[]`。
- 确认按钮只在本地即时变更 UI，提交后才持久化到后端的 in-memory `ApiSessionStore`；服务重启即丢失。
- gap 按钮是纯前端状态，没有后端 route，因此不持久。
- 当前没有实现导出 / 下载 / 保存功能；前端无入口，后端无 export endpoint。

---

## Q1. 当前 A2 示例从前端提交后，实际调用了哪些后端 API？

实际前端 API chain：

1. `POST /sessions`
   - 用于创建分析会话并触发后端 pipeline。
   - A2 的 JD 与材料由前端提交到后端。
2. `GET /sessions/{id}`
   - 用于读取 session 详情与后端生成结果。
3. `POST /sessions/{id}/decisions`
   - 用于提交用户对 bullet / section 等确认决策。

代码路径证据：

- `frontend/lib/api.ts` 定义真实 `fetch` 封装，`createSession()` 调用 `POST /sessions`，`getSession()` 调用 `GET /sessions/{id}`，`submitSessionDecisions()` 调用 `POST /sessions/{id}/decisions`。
- `frontend/components/input-form.tsx` 在提交表单时调用 `createSession(payload)`，成功后跳转到 `/confirmation?sessionId=...`。
- `src/grounded_resume/api/routes.py` 定义对应后端 routes：`@router.post("/sessions")`、`@router.get("/sessions/{session_id}")`、`@router.post("/sessions/{session_id}/decisions")`。
- 后端 session 数据通过 `src/grounded_resume/api/dependencies.py` 中的 `ApiSessionStore` 保存；该 store 是 in-memory `dict`。

结论：A2 示例从前端提交后确实进入后端，实际调用的后端 API 为：

```text
POST /sessions
GET /sessions/{id}
POST /sessions/{id}/decisions
```

---

## Q2. 是否真的调用了 LangGraph workflow？

是。后端 pipeline 调用了 LangGraph workflow。

实际 workflow 节点为 4 个：

```text
parse_jd → parse_materials → map_evidence → generate_draft
```

代码路径证据：

- `src/grounded_resume/core/workflow/graph.py` 使用 `StateGraph` 构建 LangGraph workflow。
- `src/grounded_resume/core/workflow/graph.py` 中添加的节点只有 `parse_jd`、`parse_materials`、`map_evidence`、`generate_draft`。
- `src/grounded_resume/core/workflow/graph.py` 中的 edge 顺序为 `parse_jd -> parse_materials -> map_evidence -> generate_draft -> END`。
- `src/grounded_resume/api/routes.py` 的 `create_session()` 通过 `workflow_graph.invoke(state.to_dict())` 触发该 workflow。

重要限制：

- graph 中没有 `Validator` 节点。
- graph 中也没有独立的确认、导出或保存节点。

结论：确实调用了 LangGraph workflow，但当前 workflow 只覆盖解析、证据映射与草稿生成，不覆盖验证、确认持久化、导出或保存。

---

## Q3. 是否真的执行了 JDParser、MaterialParser、EvidenceMapper、ConstrainedGenerator、Validator？

执行情况如下：

| 组件 | 是否执行 | 是否在 LangGraph workflow 中 | 证据 |
|---|---:|---:|---|
| `JDParser` | 是 | 是 | `parse_jd` 节点输出 1 个 hard requirement |
| `MaterialParser` | 是 | 是 | `parse_materials` 节点输出 5 个 facts、1 个 warning |
| `EvidenceMapper` | 是 | 是 | `map_evidence` 节点输出 `mappings=[]`、`gaps=1`、`overclaims=5` |
| `ConstrainedGenerator` | 是 | 是 | `generate_draft` 节点输出 1 个 section、1 条 fallback bullet |
| `Validator` | 是，可独立执行 | 否 | `scripts/debug/run_a2_pipeline.py` 输出 `passed=true`，但 graph 中没有 Validator 节点 |

结论：

- `JDParser`、`MaterialParser`、`EvidenceMapper`、`ConstrainedGenerator` 确实在 LangGraph workflow 内执行。
- `Validator` 当前没有 wired into workflow；它可以被调试脚本单独调用并得到 `passed=true`，但不是后端 graph 的一部分。

---

## Q4. 当前使用的 LLM provider 是什么？

当前生产路径没有使用任何真实 LLM provider。

代码与执行证据：

- `ConstrainedGenerator` 是 rule-based 生成器。
- A2 实际生成过程没有发起 LLM 调用。
- `src/grounded_resume/core/workflow/nodes.py` 的 `generate_draft_node()` 直接调用 `ConstrainedGenerator().generate(...)`，没有传入 LLM provider。
- `src/grounded_resume/providers/llm.py` 虽定义 `FakeLLMProvider` 与 provider preset，但该文件没有被 workflow nodes 调用。
- 没有观察到 OpenAI、Anthropic、DeepSeek、GLM 或其他 provider 的生产路径接入。

结论：当前 LLM provider 为：

```text
None / not connected
```

---

## Q5. 如果使用 FakeLLM，请明确说明。

当前生产路径没有使用 `FakeLLM`。

准确表述：

```text
No real LLM connected.
No FakeLLM in production path.
Rule-based generation only.
```

结论：A2 端到端链路既没有真实 LLM，也没有 `FakeLLM`；最终 bullet 来自 rule-based `ConstrainedGenerator`。

---

## Q6. A2 的中间结果分别是什么？

以下结果来自实际运行 `scripts/debug/run_a2_pipeline.py` 的输出。

### 6.1 UserInput

`UserInput` 是 A2 示例提交的目标 JD 与用户材料输入。

实际链路中，该输入经前端 `POST /sessions` 发送到后端，并作为 LangGraph workflow 初始 state。

### 6.2 JDParsedResult

`JDParser` 实际输出：

```text
hard_requirements=1
core_capabilities=0
parser_confidence=0.55
```

含义：

- 只识别出 1 个 hard requirement。
- 没有识别出 core capabilities。
- 解析置信度为 `0.55`，偏低。

### 6.3 MaterialParseResult

`MaterialParser` 实际输出：

```text
facts=5
materials_used=materials 1&2
warnings=1
warning="material-3 no action facts"
```

含义：

- 从材料 1 和材料 2 中抽取到 5 个 facts。
- 材料 3 没有抽取到 action facts，因此产生 1 个 warning。

### 6.4 EvidenceMappingResult

`EvidenceMapper` 实际输出：

```text
mappings=[]
gaps=1
overclaims=5
mapping_confidence=0.0
```

含义：

- 没有生成任何有效 evidence mapping。
- 发现 1 个 gap。
- 发现 5 个 overclaims。
- mapping 置信度为 `0.0`。

### 6.5 ResumeDraft

`ConstrainedGenerator` 实际输出：

```text
sections=1
bullets=1
generation_path="fallback"
bullet="负责整理知识库内容；设计过问题分类；对比过不同 prompt 的回答差异"
```

含义：

- 生成 1 个简历 section。
- 只生成 1 条 bullet。
- 因为 `mappings=[]`，生成器进入 fallback path。

### 6.6 ValidationResult

`Validator` 实际输出：

```text
passed=true
```

但需要强调：

- `Validator` 不在 LangGraph workflow 中。
- 该结果来自调试脚本独立执行，不代表后端 session graph 自动执行了 validator 节点。

### 6.7 ConfirmationSession

确认状态实际行为：

```text
storage=ApiSessionStore
storage_type=in-memory
persist_route=POST /sessions/{id}/decisions
button_state=local before submit
lost_on_restart=true
```

含义：

- bullet / section 等确认按钮先更新前端 local state。
- 只有提交 decision 时才调用 `POST /sessions/{id}/decisions`。
- 后端保存到 in-memory `ApiSessionStore`。
- 进程重启后状态丢失。

### 6.8 ResumeOutput

最终输出：

```text
sections=1
bullets=1
bullet="负责整理知识库内容；设计过问题分类；对比过不同 prompt 的回答差异"
export_available=false
save_available=false
```

含义：

- 当前最终可见简历结果只有 1 条 bullet。
- 没有导出功能。
- 没有保存功能。

---

## Q7. 为什么最终只生成 1 条 bullet？

直接原因：`EvidenceMapper` 没有产生任何 mapping，`ConstrainedGenerator` 进入 fallback path。

实际输出链路：

```text
JDParser: hard_requirements=1, core_capabilities=0, parser_confidence=0.55
MaterialParser: facts=5, warnings=1
EvidenceMapper: mappings=[], gaps=1, overclaims=5, mapping_confidence=0.0
ConstrainedGenerator: sections=1, bullets=1, fallback bullet
```

关键点：

- JD 解析结果本身很少：只有 1 个 hard requirement，0 个 core capabilities。
- Evidence mapping 完全失败：`mappings=[]`。
- 生成器缺少可 grounded 的 requirement-to-fact 映射，只能使用 fallback 规则拼接材料 facts。
- fallback path 当前只生成 1 条 bullet。

因此最终只有：

```text
负责整理知识库内容；设计过问题分类；对比过不同 prompt 的回答差异
```

---

## Q8. 为什么 evidence mapping 页面为空？

因为后端实际返回的 evidence mapping 结果为空：

```text
mappings=[]
```

同时调试脚本显示：

```text
gaps=1
overclaims=5
mapping_confidence=0.0
```

这说明不是前端把 mapping 隐藏了，而是后端 `EvidenceMapper` 没有生成任何可展示 mapping。

根因包括：

- `JDParser` 只输出 1 个 hard requirement，且没有 core capabilities。
- 材料 facts 与 JD requirement 没有形成有效匹配。
- mapper 将 5 个材料 facts 判定为 overclaims 或无法对齐，最终 `mapping_confidence=0.0`。

结论：evidence mapping 页面为空是后端数据结果为空导致的，前端展示的是实际空结果。

---

## Q9. 为什么确认按钮不更新状态？

需要区分“前端本地状态”和“后端持久状态”。

当前行为：

- `frontend/components/confirmation-board.tsx` 使用 `useState` 保存 `decisions` 和 `revisions`；按钮点击只调用 `selectDecision()` 更新本地 state。
- 只有提交确认决策时，才调用：

```text
POST /sessions/{id}/decisions
```

- `frontend/components/confirmation-board.tsx` 的提交按钮才调用 `onSubmit(buildPayload())`。
- `frontend/lib/api.ts` 的 `submitSessionDecisions()` 将 payload 发送到 `POST /sessions/{id}/decisions`。
- `src/grounded_resume/api/routes.py` 的 `submit_decisions()` 把 decision 应用到 draft，并把 `final_output` 写回 session dict。
- `src/grounded_resume/api/dependencies.py` 的 `ApiSessionStore` 是 in-memory store。

因此出现“不更新状态”的常见原因：

1. 用户只点击按钮，但没有触发提交到 `POST /sessions/{id}/decisions`。
2. 页面刷新或重新拉取时，前端只依赖后端 session state，而本地未提交状态丢失。
3. 后端进程重启后，in-memory `ApiSessionStore` 清空，已提交状态也丢失。
4. 当前确认状态没有数据库级持久化。

结论：确认按钮不是完整持久状态系统；它依赖前端 local state + 手动提交到 in-memory backend store。

---

## Q10. 为什么 gap 按钮状态不持久？

因为 gap acknowledgment 是纯前端状态，没有后端 route。

当前证据：

```text
Gap acknowledgment: frontend-only, no backend route
```

代码路径证据：

- `frontend/components/gap-report.tsx` 使用 `useState<Record<string, GapUserAction | null>>` 保存 gap action。
- `frontend/components/gap-report.tsx` 的 `handleAction()` 只调用 `setActions(...)`，没有调用 API。
- `frontend/lib/api.ts` 的 `SubmitDecisionsPayload` 虽有可选 `gapAcknowledgments?: GapAcknowledgment[]` 字段，但后端 `src/grounded_resume/api/routes.py` 的 `SubmitDecisionsRequest` 只接收 `decisions: list[ApiUserDecision]`。
- `src/grounded_resume/api/routes.py` 没有 gap acknowledgment route。

与普通 confirmation decision 不同，gap 按钮没有对应的后端 API，例如：

```text
POST /sessions/{id}/gaps/{gap_id}/acknowledgements
```

或统一 decision payload 中的 gap acknowledgment 字段。

因此：

- 刷新页面后 gap 按钮状态会丢失。
- 重新进入 session 后无法从后端恢复 gap acknowledgment。
- 后端也无法审计用户是否已经确认某个 gap。

结论：gap 按钮状态不持久的根因是未设计 / 未实现后端持久化接口。

---

## Q11. 为什么没有导出 / 保存功能？

因为当前功能未实现。

实际证据：

- 前端没有 export / download 入口。
- 前端没有 save resume 的完整功能入口。
- 后端没有 export endpoint。
- 后端没有保存最终 resume artifact 的持久化 endpoint。

当前不存在类似 API：

```text
GET /sessions/{id}/export
POST /sessions/{id}/export
POST /sessions/{id}/resume-output
POST /resumes
```

结论：没有导出 / 保存功能不是 bug，而是当前产品与后端 API 尚未实现该能力。

---

## Root Cause Analysis

### 1. Pipeline graph 与产品预期不一致

产品预期看起来包含：解析、证据映射、受约束生成、验证、确认、导出 / 保存。

但实际 LangGraph workflow 只有：

```text
parse_jd → parse_materials → map_evidence → generate_draft
```

缺失：

- `Validator` graph node
- confirmation state graph integration
- export / save stage

### 2. A2 输入与规则解析器匹配不足

A2 实际中间结果显示：

```text
JDParser: 1 hard requirement, 0 core capabilities, parser_confidence=0.55
EvidenceMapper: mappings=[], mapping_confidence=0.0
```

这会导致后续生成器缺少 grounded evidence，只能 fallback。

### 3. 生成器不是 LLM，而是 rule-based fallback

当前没有真实 LLM provider，也没有生产路径 `FakeLLM`。

因此生成质量受限于规则解析、规则匹配与 fallback 模板。A2 的 1 条 bullet 是规则路径的结果，不是 LLM 推理结果。

### 4. 状态模型不完整

确认状态与 gap acknowledgment 分裂：

- confirmation decisions 可通过 `POST /sessions/{id}/decisions` 存到后端。
- gap acknowledgment 仅存在前端。
- 后端 store 是 in-memory，无法跨进程重启持久化。

### 5. 输出 artifact 生命周期未实现

当前只有 session 内的 draft 展示，没有最终 resume artifact 的保存、导出、下载或版本管理。

---

## Recommended Fixes (Prioritized)

### P0: 明确并修复 workflow contract

1. 将 `Validator` 接入 LangGraph workflow：

```text
parse_jd → parse_materials → map_evidence → generate_draft → validate_draft
```

2. 在 API response 中明确返回：
   - `jd_parsed_result`
   - `material_parse_result`
   - `evidence_mapping_result`
   - `resume_draft`
   - `validation_result`

3. 在调试报告或 UI 中显示每个 stage 是否执行、是否 skipped、是否 fallback。

### P0: 修复 evidence mapping 可观测性

1. evidence mapping 页面不要只展示 `mappings`，还应展示：
   - `gaps`
   - `overclaims`
   - `mapping_confidence`
   - 空 mapping 原因
2. 当 `mappings=[]` 时，显示明确空状态：

```text
未找到可直接支持 JD 要求的材料证据。当前发现 1 个 gap、5 个 overclaims。
```

### P1: 改善 A2 解析与 mapping 规则

1. 调整 `JDParser`，避免 A2 JD 只得到 1 个 hard requirement、0 个 core capabilities。
2. 调整 `EvidenceMapper` 匹配规则，使材料 facts 可以与 JD capability 建立弱映射或解释性 gap。
3. 为 A2 增加 regression fixture，断言：
   - parser confidence 不低于目标阈值。
   - mappings 不应无解释地为空。
   - fallback path 必须在 response 中显式标记。

### P1: 明确 LLM provider 策略

选择一种并在配置中显式化：

1. 保持 rule-based：UI 和文档明确“当前无 LLM”。
2. 接入真实 LLM provider：配置 provider、model、timeout、错误处理和调用日志。
3. 仅测试使用 `FakeLLM`：确保 production path 不引用，并在测试中显式命名。

### P1: 统一确认与 gap 状态持久化

1. 将 gap acknowledgment 纳入后端 decision model。
2. 增加或扩展 API：

```text
POST /sessions/{id}/decisions
```

支持 payload 包含：

```text
bullet decisions
section decisions
gap acknowledgements
```

3. API response 返回完整 confirmation session，前端从后端 state hydration。

### P2: 用持久化存储替换 in-memory ApiSessionStore

1. 开发环境可保留 in-memory，但 UI 应提示“重启会丢失”。
2. MVP 应至少使用 SQLite / Postgres / 文件存储之一持久化：
   - session input
   - intermediate results
   - decisions
   - final resume output

### P2: 实现导出 / 保存功能

1. 前端增加导出 / 保存入口。
2. 后端增加 endpoint，例如：

```text
POST /sessions/{id}/resume-output
GET /sessions/{id}/export?format=markdown
GET /sessions/{id}/export?format=docx
```

3. 明确导出内容来源：只导出用户确认后的 bullet，还是允许导出 draft。

---

## Appendix: Actual A2 Pipeline Output

以下为 `scripts/debug/run_a2_pipeline.py` 的实际关键信息摘要。

```text
JDParser:
  hard_requirements: 1
  core_capabilities: 0
  parser_confidence: 0.55

MaterialParser:
  facts: 5
  materials_used: materials 1&2
  warnings: 1
  warning: material-3 no action facts

EvidenceMapper:
  mappings: []
  gaps: 1
  overclaims: 5
  mapping_confidence: 0.0

ConstrainedGenerator:
  sections: 1
  bullets: 1
  generation_path: fallback
  bullet: 负责整理知识库内容；设计过问题分类；对比过不同 prompt 的回答差异

Validator:
  passed: true
  workflow_node: false
```

端到端状态摘要：

```text
Frontend API chain:
  POST /sessions
  GET /sessions/{id}
  POST /sessions/{id}/decisions

Backend workflow:
  LangGraph: true
  nodes: parse_jd → parse_materials → map_evidence → generate_draft
  validator_node: false

LLM:
  real_provider: none
  fake_llm_in_production: false
  generation: rule-based only

Confirmation state:
  buttons: local state before submit
  persisted_decisions: POST /sessions/{id}/decisions
  backend_store: in-memory ApiSessionStore
  gap_acknowledgement: frontend-only

Export / Save:
  frontend_export: not implemented
  backend_export_endpoint: not implemented
  persistent_resume_save: not implemented
```
