# Resume Tailoring Skill 静态仓库评估

## 1. 基本信息

- **项目名**：Resume Tailoring Skill
- **GitHub URL**：`https://github.com/varunr89/resume-tailoring-skill.git`（README 安装命令与 Support 部分给出）
- **主要语言 / 技术栈**：Markdown 文档为主；Claude Code Skill 形态；包含少量伪代码说明；依赖 Claude Code skills、可选 WebSearch/WebFetch、可选 `document-skills` 插件生成 DOCX/PDF。
- **项目形态**：Claude Code Skill，不是独立 Web 应用、CLI 或库。核心执行逻辑主要由 `skills/resume-tailoring/SKILL.md` 中的工作流提示词驱动，配套 `research-prompts.md`、`matching-strategies.md`、`branching-questions.md`、`multi-job-workflow.md` 与 `docs/` 文档。
- **最近活跃情况**：本地仓库最近一次可见提交为 `2026-02-28 feat: add plugin.json and move SKILL.md to skills/ for marketplace compatibility`。仓库当前更像“技能说明 + 工作流规范 + 测试清单”，未看到可执行源码、自动化测试或发布产物。

## 2. 项目定位

该项目主要解决“用户已有多份 Markdown 简历时，如何基于目标岗位 JD 对简历进行岗位化定制”的问题。它不是从零写简历工具，而是一个 **JD-grounded resume tailoring skill**：先读取用户已有 resume library，解析目标 JD，补充公司/岗位研究，再通过模板生成、经历匹配、置信度评分、差距识别、可选经历访谈和用户 checkpoint，生成定制简历及报告。

从类别上看，它属于：

- **Claude Code Skill / AI 工作流提示词项目**；
- **简历定制与素材重组工具**；
- **以真实性约束为核心的职业材料生成辅助流程**；
- 支持单岗位，也扩展了 3-5 个相似岗位的批处理流程。

其定位与本项目核心任务高度相关，但前提条件较强：它要求用户已经有 Markdown 格式的简历库，而不是只有“原始素材包”或完全没有已有简历。

## 3. 输入能力

| 输入/能力项 | 支持情况 | 依据与说明 |
|---|---:|---|
| 输入目标 JD | **支持** | `SKILL.md` 要求用户提供 job description（文本或 URL）；`research-prompts.md` 专门包含 JD parsing prompt。 |
| 输入已有简历 | **支持，且为核心前提** | README Prerequisites 明确要求 existing resume library，至少 1-2 份 Markdown 简历；Phase 0 扫描 `resumes/*.md`。 |
| 输入原始素材包 | **部分支持** | 不直接定义“素材包”导入格式；可通过 Experience Discovery 访谈补充未文档化经历，并临时写入 library/database。若素材是散乱文本、项目说明、成绩单等，需要用户或 Claude 手动转化。 |
| 从零生成完整简历 | **不支持 / 明确不推荐** | `SKILL.md` 的 DO NOT use for: “Generic resume writing from scratch (user needs existing resume library)”。 |
| 基于 JD 定制简历 | **强支持** | 核心流程围绕 JD parsing、success profile、template、matching、coverage score、gap handling 展开。 |
| 中文支持 | **弱 / 未正式支持** | 文档和 prompt 全为英文；README Roadmap 中有 “Multi-language resume support” 待办，说明多语言支持尚非当前能力。Claude 本身可用中文交互，但该 Skill 没有中文模板、中文 ATS 表达或中英双语约束。 |
| 导出格式 | **Markdown 支持；DOCX/PDF 依赖外部插件** | Phase 4 输出 MD、DOCX、PDF、Report；DOCX/PDF 依赖 `document-skills`，失败时回退 Markdown-only。 |

## 4. 输出能力

项目预期输出包括：

- `{Name}_{Company}_{Role}_Resume.md`：岗位定制 Markdown 简历；
- `{Name}_{Company}_{Role}_Resume.docx`：ATS-friendly Word 简历，依赖 `document-skills:docx`；
- `{Name}_{Company}_{Role}_Resume.pdf`：可选 PDF；
- `{Name}_{Company}_{Role}_Resume_Report.md`：生成报告，包含目标岗位摘要、success profile、content mapping、reframing、source resumes、gaps、interview prep recommendations；
- 多岗位模式下还会输出 `_batch_state.json`、`_aggregate_gaps.md`、`_discovered_experiences.md`、`_batch_summary.md` 及每个岗位子目录。

与我们的目标输出“基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历”相比：

- **岗位定制**：匹配度高。项目以 JD / company / role research 为主线，并要求输出 JD coverage 和 direct match 比例。
- **基于真实经历**：匹配度高。项目明确禁止编造，并要求 source resume、before/after reframing、gap disclosure。
- **接近可投递**：中高。它支持专业 Markdown、DOCX、PDF；但 DOCX/PDF 依赖外部插件，且静态仓库没有实际模板代码或格式测试产物。
- **需用户确认**：匹配度高。workflow 在 success profile、template、content mapping、library update 等关键节点都要求 checkpoint。
- **第一版实习简历**：部分匹配。项目更偏职业人士/PM/TPM/工程岗位通用简历定制，没有专门针对“实习生”的教育、课程项目、低经验候选人、校招 ATS、中文实习简历场景做设计。
- **从原始素材而非已有简历出发**：匹配度不足。它的核心输入是 resume library，而不是任意原始素材包。

## 5. 真实性约束 / 幻觉治理

| 机制 | 支持情况 | 具体表现 | 评估 |
|---|---:|---|---|
| 明确禁止编造经历 | **强支持** | README Design Philosophy 与 `SKILL.md` Core Principle 均写明 “NEVER fabricate experience”。 | 核心约束清晰，是该项目最大优点之一。 |
| 来源追踪 | **支持** | library database 中 bullet 带 `source_resumes`；报告列出 Source Resumes Used。 | 有助于回溯事实来源，但主要是提示词规范，不是程序级强制。 |
| 置信度评分 | **支持** | Direct/Transferable/Adjacent/Impact 加权评分；按 DIRECT、TRANSFERABLE、ADJACENT、WEAK/GAP 分层。 | 能降低过度匹配风险，适合做 JD-grounded 解释。 |
| Gap 透明披露 | **强支持** | 低于阈值时要求 GAP IDENTIFIED，提供 omit、cover letter、discovery 等选项。 | 对“不硬凑经历”有明确流程约束。 |
| Reframing 前后对照 | **支持** | 要展示 original、reframed、changes、truthfulness rationale。 | 能治理“改写过头”，但仍依赖模型自律。 |
| 用户 checkpoint | **强支持** | success profile、template、content mapping、最终保存均需用户确认。 | 与“需用户确认的第一版”高度一致。 |
| 访谈式补充经历 | **支持** | branching-questions 按 yes/indirect/adjacent/personal/no 分支追问。 | 有助于发现真实但未文档化经历。 |
| 自动事实校验 | **不支持** | 未见对公司、时间、学历、项目成果进行外部或结构化校验的代码。 | 真实性主要靠用户确认与来源引用，不是强校验系统。 |
| 防止指标夸大 | **部分支持** | 要求询问 metrics，强调 truthfulness；但没有检测数字合理性的机制。 | 仍可能生成未经证实的量化表达，需要人工审阅。 |
| 隐私/敏感信息治理 | **弱** | 文档没有系统讨论简历隐私、PII 处理、数据留存风险。 | 作为开源 skill 文档可接受，但实际产品化不足。 |

## 6. JD-grounded 能力

1. **是否解析 JD 的显性要求？**  
   支持。`research-prompts.md` 要求提取 explicit requirements、must-have / nice-to-have、technical keywords、role archetype。

2. **是否解析 JD 的隐性偏好？**  
   支持。JD parsing prompt 包含 implicit preferences、cultural signals、hidden requirements、red flags；Phase 1 还结合公司文化和 role benchmarking 形成 success profile。

3. **是否将 JD 要求映射到用户经历？**  
   强支持。Phase 3 按 template slot 从 library 抽取候选 bullets，使用 direct/transferable/adjacent/impact 加权评分，并展示 top matches。

4. **是否能识别差距而不是强行生成？**  
   强支持。匹配低于 60% 时进入 gap handling，低于 45% 为 GAP；建议 discovery、omit、cover letter 或 best available with disclosure。

5. **是否能根据 JD 调整简历结构与叙事？**  
   支持。Phase 2 会生成针对 success profile 的 section order、role consolidation、title reframing、bullet allocation，并要求用户批准。

6. **是否输出 JD 覆盖度或匹配解释？**  
   支持。多个阶段展示 direct matches、transferable、adjacent、gaps、overall JD coverage；报告中也包含 content mapping summary 和 remaining gaps。

综合判断：该项目的 JD-grounded 设计非常完整，尤其强调“成功画像 → 模板 → 内容匹配 → 覆盖度/差距报告”的链路。不过它是提示词/流程级实现，没有实际代码证明评分算法一致性或可重复性。

## 7. 与本项目核心任务的适配度

**选择：中高适配，但不能直接作为完整解决方案。**

理由：

- 它很好地覆盖了“目标岗位 JD → 定制简历 → 用户确认”的流程；
- 它有较强真实性约束，强调 source resume、gap、reframing rationale，非常契合“基于真实经历”；
- 它能生成第一版可审阅简历，并包含用户 checkpoint；
- 但它不支持真正“从零生成”，明确要求已有 Markdown resume library；
- 它没有专门面向“实习简历”的输入模型，例如课程项目、科研、竞赛、实习、社团、技能栈、GPA、作品链接等结构化字段；
- 它对“原始素材包”的支持主要依赖对话访谈，缺少批量读取原始材料、抽取经历事实、建立证据库的机制；
- 它是 Claude Code Skill，而非可嵌入的独立模块，不能直接调用 API 生成简历。

因此，它更适合作为我们系统中“JD-grounded 定制与真实性治理”的参考蓝图，而不是直接复用为 D 类项目核心实现。

## 8. 是否值得实际运行 Smoke Test

**选择：值得有限 Smoke Test，但优先级为中等。**

说明：

- 值得运行的原因：该 Skill 的流程与我们目标高度相关，尤其是 checkpoint、gap handling、confidence scoring、experience discovery；用一份目标 JD + 1-2 份 Markdown 简历跑通，可以验证 Claude Code Skill 实际是否能稳定遵循这些约束。
- 限制：它不是独立应用，运行 smoke test 本质上是测试 Claude Code 对 `SKILL.md` 的遵循程度，而不是测试项目内代码质量；DOCX/PDF 还依赖外部 `document-skills` 插件。
- 若测试，应设计为“静态 prompt 流程 smoke test”：准备一份实习 JD、一份已有简历 Markdown、若干原始素材补充，观察是否能产生 Markdown 简历、mapping report、gap disclosure，并检查是否编造。
- 不建议投入重型工程测试，因为仓库没有可执行源码、单元测试或服务接口，静态评估已足以判断其主要能力边界。

## 9. 可借鉴点

1. **Truth-preserving optimization 原则**：明确“不编造，只重构与强调真实经历”，适合成为我们项目的核心安全原则。
2. **多阶段 checkpoint**：在 success profile、结构模板、内容映射、最终保存前让用户确认，能显著降低误投风险。
3. **JD success profile 设计**：把 JD、公司文化、类似岗位画像合成为 success profile，比简单关键词匹配更适合高质量简历生成。
4. **Confidence-scored matching**：Direct / Transferable / Adjacent / Impact 的分解评分可借鉴为解释型匹配模型。
5. **Gap-first 处理**：不满足岗位要求时透明展示 gap，并提供 discovery、omit、cover letter 等选项，而不是硬凑。
6. **Reframing 可解释化**：保留 original → reframed 和 truthfulness rationale，有助于用户审查。
7. **Branching discovery 访谈**：通过追问规模、指标、上下文、挑战、结果，能从用户口述素材中抽取可用经历。
8. **生成报告而非只生成简历**：Report 记录 source、coverage、gaps、reframing、interview prep，便于后续确认和迭代。
9. **多岗位批处理思路**：共享 discovery、逐岗位定制，对于用户同时申请多个相似实习岗位也有参考价值。

## 10. 主要缺陷

1. **不支持从零生成**：这是最关键缺陷。`SKILL.md` 明确排除 generic resume writing from scratch；没有已有 resume library 时不适用。
2. **原始素材包 ingestion 不足**：没有定义如何读取项目文档、成绩单、作品集、GitHub、科研材料、实习证明等原始素材，也没有 evidence schema。
3. **实现形态偏文档化**：仓库主要是 Markdown workflow 和伪代码，缺少真实 parser、matcher、generator、评分函数、测试脚本。
4. **评分不可验证**：confidence score 是提示词规则，不是可重复的算法实现；不同模型/会话可能输出不一致。
5. **中文/多语言能力未落地**：README Roadmap 将 Multi-language resume support 标为待办；对中文 JD、中文简历、双语简历没有专门约束。
6. **实习生场景不足**：文档示例偏 PM/TPM/职业转换/内部转岗；对低经验候选人、课程项目、校园经历、竞赛/科研、第一段实习等没有专门设计。
7. **格式生成依赖外部插件**：DOCX/PDF 并非仓库自身能力，失败时只能回退 Markdown。
8. **事实校验弱**：虽然强调 truthfulness，但没有自动验证时间线、公司名、学历、项目归属、量化指标真实性。
9. **隐私与数据治理不足**：简历库与 batch state 会保存大量个人信息，但文档没有充分说明安全边界。
10. **“接近可投递”的质量缺少客观验证**：测试清单是人工 checklist，没有样例输入输出、golden files 或 ATS 兼容性验证。

## 11. 初步结论

Resume Tailoring Skill 是一个与本项目目标高度相关的 Claude Code Skill，最有价值之处在于它将岗位 JD、已有简历库、真实性约束、差距识别、用户确认和多格式输出组织成了清晰的端到端工作流。它对“基于目标 JD 定制已有简历”的支持较强，也明确要求不编造经历，适合作为我们设计 JD-grounded 简历生成链路和幻觉治理机制的重要参考。

但它不能直接满足“基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历”的完整任务。主要原因是：它依赖已有 Markdown resume library，不支持真正从零生成；它没有原始素材包抽取与证据管理；它不是独立应用或可调用代码库；对中文和实习生场景支持也不足。

**初步评级：可借鉴价值高，直接复用价值中等。** 建议将其作为流程设计参考，重点吸收 success profile、confidence scoring、gap disclosure、branching discovery、reframing rationale 和用户 checkpoint；若用于本项目，需要补充“原始素材 → 结构化事实库 → 用户确认 → 简历生成”的前置模块，并为实习生和中文场景设计专门模板与真实性校验机制。
