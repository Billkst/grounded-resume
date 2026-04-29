# D 类开源项目 Repo Capability Matrix v0.1

## 1. 项目列表

| 项目 | URL | 项目形态 | 主要定位 | 适配度 | 是否建议 Smoke Test |
|---|---|---|---|---|---|
| Resume Matcher | https://github.com/srbhr/resume-matcher | Web App (FastAPI + Next.js) | 已有简历 + JD 匹配 / 改写 / ATS 评分 | Partial Fit | 是 |
| Resume Tailoring Skill | https://github.com/varunr89/resume-tailoring-skill | Claude Code Skill | 已有简历库 + JD 定制（Markdown 库） | Partial Fit | 待定 |
| Smart Resume Matcher | https://github.com/jellydn/smart-resume-matcher | Web App (React Router + TS) | 结构化简历 + JD 定制建议 | Partial Fit | 是 |
| Claude Code Job Tailor | https://github.com/javiera-vasquez/claude-code-job-tailor | Claude Code 工具 / 工作流 | YAML 素材 + JD 定制简历 | Partial Fit | 是 |
| Resume Optimizer AI | https://github.com/naveennk045/Resume-Optimizer | Web Demo (FastAPI + HTML) | 已有 PDF 简历 + JD 优化 | Task Mismatch | 否 |
| JobMatchAI | https://github.com/wadekarg/JobMatchAI | Chrome Extension | 已有简历 + JD 分析 / 改写 / 自动填表 | Partial Fit | 是 |

---

## 2. 能力矩阵

| 项目 | 输入 JD | 输入已有简历 | 输入原始素材包 | 从零生成简历 | JD 定制 | 真实性约束 | 中文支持 | 输出完整简历 | 适配度 |
|---|---|---|---|---|---|---|---|---|---|
| Resume Matcher | ✅ 强 | ✅ PDF/DOCX | ⚠️ 部分（enrichment 问答） | ❌ 不支持 | ✅ 强 | ✅ 较强 | ⚠️ 部分（UI 支持，关键词匹配弱） | ✅ PDF | Partial Fit |
| Resume Tailoring Skill | ✅ 强 | ✅ Markdown 库（必须已有） | ⚠️ 部分（discovery 访谈） | ❌ 不支持 | ✅ 强 | ✅ 强 | ❌ 弱 | ✅ MD/DOCX/PDF | Partial Fit |
| Smart Resume Matcher | ✅ 强 | ✅ JSON / Web Form | ⚠️ 弱（需结构化） | ❌ 不支持 | ✅ 强 | ✅ 较强 | ⚠️ 未明确 | ✅ PDF/DOCX | Partial Fit |
| Claude Code Job Tailor | ✅ 强 | ✅ YAML 预录入 | ⚠️ 部分（YAML 结构化） | ❌ 不支持 | ✅ 强 | ✅ 较强 | ⚠️ 未明确 | ✅ PDF | Partial Fit |
| Resume Optimizer AI | ✅ 弱（纯文本 prompt） | ✅ PDF | ❌ 不支持 | ❌ 不支持 | ⚠️ 弱 | ❌ 弱（prompt 允许推断指标） | ⚠️ 未明确 | ✅ PDF | Task Mismatch |
| JobMatchAI | ✅ 强（自动抽取网页） | ✅ PDF/DOCX | ⚠️ 弱 | ❌ 不支持 | ✅ 强 | ⚠️ 中等（missing skills 会被追加） | ❌ 不支持 | ⚠️ DOCX（仅 DOCX 输入） | Partial Fit |

**图例说明：**
- ✅ 强支持 / 明确支持
- ⚠️ 部分支持 / 弱支持 / 未明确
- ❌ 不支持 / 有明确缺陷

---

## 3. 真实性约束矩阵

| 项目 | 禁止虚构 | 证据来源 | 人工确认 | 强表述降级 | 输出校验 | gap/missing evidence | 结论 |
|---|---|---|---|---|---|---|---|
| Resume Matcher | ✅ prompt + diff allowlist | ⚠️ diff 有 original/reason，无 source span | ✅ Preview → Confirm | ✅ remove_ai_phrases | ✅ Pydantic schema + preview hash | ⚠️ keyword-level gap | 多层约束，值得借鉴 |
| Resume Tailoring Skill | ✅ NEVER fabricate（核心原则） | ✅ source_resumes 标注 | ✅ 多 checkpoint | ⚠️ 要求 truthfulness rationale | ❌ 无自动校验 | ✅ gap disclosure | 真实性意识最强 |
| Smart Resume Matcher | ✅ NEVER fabricate experience | ✅ originalContent / suggestedContent | ✅ accept/reject/undo | ❌ 未见 | ⚠️ Zod schema | ⚠️ missing skills 列表 | prompt + UI 层约束 |
| Claude Code Job Tailor | ✅ Truthfulness First | ⚠️ mapping-rules 要求来源，无自动比对 | ✅ /tailor 协作编辑 | ⚠️ DOWNPLAY action | ✅ Zod validation | ✅ candidate alignment gaps | prompt + schema 层约束 |
| Resume Optimizer AI | ❌ 允许推断指标 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | 真实性最弱，不建议参考 |
| JobMatchAI | ⚠️ prompt 要求不虚构，但 missing skills 被追加 | ❌ 无 | ⚠️ bullet 可编辑/排除 | ❌ 无 | ❌ 无 | ✅ matchScore + missingSkills | 中等，但有反向风险 |

---

## 4. 初步分层

### 可进入 Smoke Test

| 项目 | 原因 |
|---|---|
| **Resume Matcher** | 功能链条完整（上传简历 → 粘贴 JD → AI 预览 → diff 确认 → 保存 → PDF 导出），真实性治理在代码中有多层实现，值得通过最小样例验证是否实际生效。 |
| **Smart Resume Matcher** | 前后端链路完整，支持 JSON 上传 / Web Form、JD 解析、AI tailoring、side-by-side comparison、accept/reject、PDF/DOCX 导出；支持 Ollama / Browser AI，便于本地烟测。 |
| **Claude Code Job Tailor** | 设计方向高度匹配核心任务，YAML 素材 + JD 定制 + validation + 实时预览链路完整；适合验证 Claude Code workflow 是否能稳定遵循真实性约束。 |
| **JobMatchAI** | Chrome Extension 结构清晰，功能链路具体；JD 抽取、profile 解析、bullet 改写、DOCX 非破坏式生成等模块值得运行时验证。 |

### 仅作为实现参考

| 项目 | 原因 |
|---|---|
| **Resume Tailoring Skill** | 流程设计优秀（success profile、confidence scoring、gap disclosure、branching discovery、reframing rationale、用户 checkpoint），但它是 Claude Code Skill 而非独立应用，无实际可执行源码，运行 smoke test 本质是测试 Claude Code 对 prompt 的遵循程度。建议作为**流程设计参考**吸收，而非实际运行对象。 |
| **Resume Optimizer AI** | 功能极简（仅一个 `/upload/` 端点），prompt 存在鼓励编造指标的风险，不支持用户确认，工程成熟度低。若需参考，仅可作为“最小可用交互链路”或“Markdown-to-PDF”的 Demo 参考。 |

### 不适合作为本项目 baseline

**当前 6 个项目中，没有项目被明确判定为“不适合作为 baseline”但同时“没有任何可借鉴价值”。**

- **Resume Optimizer AI** 最接近“不适合”，但它仍可作为反面教材（避免 prompt 设计缺陷）和最小链路参考。
- 其余 5 个项目均在不同维度上对本项目有参考价值。

---

## 5. 阶段性结论

### 5.1 GitHub 上的开源项目是否已经解决了我们的核心任务？

**没有。**

6 个项目的共同特点是：**全部依赖已有简历**，没有一个项目支持“基于用户原始素材包（零散经历、项目、技能、教育背景等）从零生成第一版实习简历”。

我们的核心任务是：
> “基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历。”

而 D 类开源项目的主流路线是：
> “基于已有简历 + JD，进行匹配分析、关键词改写、排版定制、导出 PDF。”

这两者之间存在本质差距：**从“已有简历优化”到“从零生成第一版”**，中间缺少：
- 原始素材的采集与结构化（非简历文档 → 事实库）
- 实习场景的特殊建模（课程项目、竞赛、科研、社团、低经验补偿）
- 证据链与溯源机制（每条经历的事实来源、用户逐项确认）
- 强真实性校验（自动检测虚构、推断、夸大）

### 5.2 它们主要集中在哪些路线？

| 路线 | 代表项目 |
|---|---|
| **已有简历 + JD 改写 / Tailoring** | Resume Matcher, Smart Resume Matcher, Claude Code Job Tailor, Resume Tailoring Skill |
| **已有简历 + JD 匹配分析 + 自动申请辅助** | JobMatchAI |
| **已有简历 + 简单 LLM 重写** | Resume Optimizer AI |

没有项目走“原始素材包 → 结构化事实库 → 实习简历生成”的路线。

### 5.3 它们最大的共同缺陷是什么？

1. **全部依赖已有简历**：这是最大的共同缺陷。没有一个项目支持用户只提供零散素材就生成完整简历。
2. **实习生场景未特化**：所有项目面向通用职场简历，未针对学生/实习/校招场景设计（课程项目优先级、校园经历、竞赛/科研、低经验叙事策略）。
3. **中文支持普遍薄弱**：只有 Resume Matcher 明确标注 UI 多语言支持，但关键词匹配仍以英文为主；其余项目基本没有中文适配。
4. **真实性约束停留在 prompt 层**：除 Resume Matcher 有代码级 diff allowlist 和 preview hash 外，其余项目主要靠 prompt 约束，缺少程序化的事实校验、证据溯源、增量检测。
5. **JD-grounded 不够深入**：大部分项目把 JD 作为 prompt 上下文或关键词来源，缺少“JD 要求 → 用户经历证据 → 缺口分析 → 用户补充”的闭环映射。

### 5.4 我们的项目机会点是否仍然成立？

**仍然成立，且机会点更加明确。**

- **市场空白确认**：GitHub 上的开源项目全部集中在“已有简历优化”，而“原始素材 → 第一版实习简历”是一个明显的市场空白。
- **差异化定位清晰**：我们的核心差异化是“从零生成第一版”，而不是“优化已有简历”。
- **可借鉴基础充足**：D 类项目虽然没有解决核心任务，但它们在 JD 解析、真实性约束设计、用户确认流程、PDF 导出等方面提供了大量可借鉴的设计元素。
- **技术路线可行**：现有项目证明了“JD + LLM + 简历生成”的技术路线可行，我们只需补上“原始素材结构化”和“实习场景特化”两个关键模块。

### 5.5 下一步应该实际运行哪些项目？

建议按优先级排序运行 Smoke Test：

| 优先级 | 项目 | Smoke Test 目标 |
|---|---|---|
| **P1** | Smart Resume Matcher | 验证结构化简历 JSON + JD 文本 → tailoring 建议 → accept/reject → PDF/DOCX 导出的完整链路；重点检查是否编造未给出的技能/指标。 |
| **P1** | Resume Matcher | 验证 PDF/DOCX 简历上传 + JD 粘贴 → diff 预览 → 确认保存 → PDF 导出；重点检查 non-injectable keywords 是否有效阻止无证据植入。 |
| **P2** | JobMatchAI | 验证 Chrome Extension 加载 → DOCX 简历上传 → JD 网页抽取 → match analysis → bullet 改写 → tailored DOCX 下载；重点检查 missing skills 是否被不当追加。 |
| **P2** | Claude Code Job Tailor | 验证 Bun 安装 → YAML 素材录入 → `@agent-job-tailor` 执行 → validation → PDF 生成；重点检查 agent 是否遵守真实性约束和 weighted scoring。 |
| **P3** | Resume Tailoring Skill | 不做传统 smoke test，改为“静态 prompt 流程验证”：准备实习 JD + 已有 Markdown 简历，观察 Claude Code 对 SKILL.md 的遵循程度。 |
| **不推荐** | Resume Optimizer AI | 静态评估已足够，无需运行。 |

---

## 6. Smoke Test 范围收敛决策

**本阶段不实际运行 D 类项目，不做 base resume 适配。**

原因：
1. **任务形态差异**：D 类项目全部依赖已有简历，运行前必须人工构造 base resume，这会将 Smoke Test 目标从"原始素材 → 第一版实习简历"改变为"已有简历 → JD 优化"，偏离核心任务。
2. **人工变量风险**：人工构造的 base resume 质量会直接影响输出，破坏与 B 类通用 LLM、C 类工具的公平对比基础。
3. **部署成本高**：6 个项目涉及 FastAPI、Next.js、React Router、Bun、Chrome Extension、Claude Code 等多种技术栈，配置运行环境和 API key 的时间成本远超评估收益。
4. **新增结论有限**：静态评估已充分回答核心问题——开源生态尚未覆盖"从零生成第一版实习简历"的任务，实际运行最多只能验证"已有简历优化"质量，对核心任务决策帮助有限。

D 类项目的价值以**静态参考**形式保留，具体可借鉴点详见 `d_repos_smoke_test_scope_decision.md`。
