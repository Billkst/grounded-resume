# Claude Code Job Tailor 静态仓库评估

## 1. 基本信息

- **项目名**：Claude Code Job Tailor（`package.json` 中包名为 `cc-resume-manager`）
- **GitHub URL**：https://github.com/javiera-vasquez/claude-code-job-tailor
- **主要语言 / 技术栈**：TypeScript、React 19、React-PDF、Vite、Tailwind CSS、Bun、Zod、YAML、Claude Code agents / slash commands。
- **项目形态**：为 Claude Code 设计的简历定制工具 / 插件式工作流，不是独立 SaaS 或独立桌面应用。核心能力依赖 Claude Code agent 执行；仓库内的 TypeScript/Bun 代码主要承担 YAML schema validation、数据转换、实时预览、PDF 生成与开发服务器职责。
- **运行环境要求**：需要 Bun + Claude Code；README 明确要求 `bun install` 后进入 `claude code`，再通过 Claude Code 的 agent 或 slash command 使用。
- **最近活跃情况**：`CHANGELOG.md` 显示持续迭代至 2025-10-27，版本记录包含 1.0.0、0.9.0、0.8.x 等多个近期版本；README badge 指向 GitHub Actions CI。静态证据表明项目近期维护活跃。

## 2. 项目定位

该项目定位为一个“Claude Code 内的岗位定制简历生成与协作编辑工作流”。它的基本流程是：用户先把个人经历、技能、项目、教育、求职信模板等资料写入 `resume-data/sources/` 下的 YAML；随后在 Claude Code 中调用 `@agent-job-tailor` 或 `@agent-job-analysis`，输入 JD 文本、URL、PDF 或 Markdown 文件；agent 解析 JD，生成公司维度的 `metadata.yaml`、`job_analysis.yaml`、`resume.yaml`、`cover_letter.yaml`；再通过 `/tailor company-name` 进入实时预览和交互式修改，最后用 `/generate-pdf` 或 `bun run generate-pdf` 导出 PDF。

因此，它不是一个完全自动化的“上传素材 + 一键产出最终简历”的产品，而是一个基于 Claude Code 的半自动化编排框架：AI agent 负责 JD 分析与素材选择，TypeScript 工具链负责结构化数据校验、预览和 PDF 输出，用户仍需要在 Claude Code 中审阅、确认和迭代。

## 3. 输入能力

| 输入项 | 支持情况 | 静态证据 | 评价 |
|---|---:|---|---|
| 目标岗位 JD 文本 | 强支持 | README 示例允许粘贴 job description；`job-analysis.md` / `job-tailor.md` 要求解析 job posting | 符合核心任务要求 |
| JD URL | 支持 | README 示例写明可输入 URL；agent tools 包含 `WebFetch` / `WebSearch` | 依赖 Claude Code agent 能力，不由本地源码单独完成 |
| JD PDF / Markdown 文件 | 支持但依赖 Claude Code | README 示例写明 `PDF | Markdown file`；agent 可读文件 | 静态仓库提供 prompt 约束，但无独立 PDF 解析模块 |
| 用户原始素材 | 强支持 | `resume-data/sources/resume.example.yaml`、`professional_experience.example.yaml`、`cover_letter.example.yaml` | 采用 YAML 预录入，结构清晰 |
| 非结构化原始简历迁移 | 部分支持 | README 建议让 Claude Code 读取 PDF/Word/text 并迁移到 YAML | 这是辅助 prompt 工作流，不是稳定程序化能力 |
| 经历版本 / 多角度素材 | 支持 | 示例中 `titles`、`summaries`、`achievements` 按 `fullstack_focused`、`ai_ml_focused`、`frontend_ui_focused`、`qa_testing_focused` 分组 | 有利于岗位定制选择 |
| 技能、项目、教育、语言、联系方式 | 支持 | `ResumeSchema`、example YAML 均覆盖 | 简历基础字段较完整 |
| 用户偏好 / 目标限制 | 弱支持 | 可通过 Claude Code 对话调整；无独立偏好 schema | 更偏协作编辑，不是参数化产品 |

## 4. 输出能力

项目的输出能力较完整，且针对投递材料有明确结构：

- **结构化公司材料**：每个公司目录 `resume-data/tailor/[company-name]/` 预期包含：
  - `metadata.yaml`：公司、岗位、主焦点、岗位摘要、技能摘要、模板选择等。
  - `job_analysis.yaml`：JD 解析结果、weighted requirements、job focus array、candidate alignment、section priorities、optimization actions。
  - `resume.yaml`：React-PDF 兼容的岗位定制简历数据。
  - `cover_letter.yaml`：岗位定制求职信。
- **PDF 输出**：`scripts/generate-pdf.ts` 通过 React-PDF、theme registry、metadata 中的 `active_template` 生成 resume / cover letter / both，输出到 `tmp/`。
- **实时预览与编辑**：`/tailor` 命令启动 `bun run tailor-server -C company-name`，开启 Vite 预览、文件监听、自动 validation 与热更新。
- **模板能力**：内置 `modern` 与 `classic` 两套模板，React-PDF 组件化实现；适合生成接近可投递的 PDF 第一版。

对于核心任务中的“第一版实习简历”，该项目能输出简历和求职信，但默认示例和 mapping 偏向软件工程、AI、前端、测试等技术岗位，且示例经历为 senior 档位。用于实习简历时，需要用户在 YAML 中提供实习级别标题、总结和项目素材，并让 `job_focus.primary_area` 使用 `junior_engineer` 或类似低年级角色。

## 5. 真实性约束 / 幻觉治理

该项目在 prompt 与 mapping 层面有明确的真实性约束：

- `job-tailor.md` 明确写有 “Ensure content remains truthful while maximizing relevance”、“Preserve data integrity - no fabricated content, only selection and emphasis”。
- `job-tailor.md` 的 System Prompt 中将 **Truthfulness First** 列为第一原则：不得捏造或夸大，只能选择和强调已有内容。
- `resume-data/mapping-rules/resume.yaml` 的 `data_integrity` 规则要求所有被选择内容必须存在于 source resume YAML，禁止 fabricated 或 exaggerated content，关键词必须自然融合。
- `job-analysis.md` 要求 JD 信息直接从 job posting 中提取，不得 fabrication。
- mandatory validation 要求生成文件必须通过 Zod schema 校验。

但需要严谨指出：这里的“真实性治理”主要是 **prompt-level 与 schema-level**，并非强证明式 provenance enforcement。代码中的 Zod 校验可以检查字段类型、必填项、URL、权重和结构，但不能自动证明某条 achievement 是否真的来自 `resume-data/sources/`，也不能自动检测 AI 是否改写后夸大事实。`mapping-rules/resume.yaml` 写了“必须存在于 source resume.yaml”，但静态代码未看到对 source-to-output 文本溯源的强制比对或引用链存储。因此，项目具备较强的真实性意识和操作规范，但 hallucination 防线仍依赖 Claude Code agent 遵守指令和用户人工确认。

## 6. JD-grounded 能力

JD-grounded 是本项目最突出的设计点之一：

- **weighted scoring**：README 与 mapping rules 均强调将 JD 中技能按 1-10 priority 排序，例如 React priority 10、Python priority 7。
- **job focus array**：`job_analysis.yaml` 定义 `job_focus` 数组，每项包含 `primary_area`、`specialties`、`weight`，权重需归一化到 1.0。agent prompt 明确要求抽取 1-3 个 role focuses，并用最高权重的 focus 决定标题、summary 和内容策略。
- **specialty-based selection**：`resume.yaml` mapping 规定按照 JD specialties 对 technical categories、professional achievements、projects 打分，选择最高相关内容。
- **candidate alignment**：`job_analysis.yaml` schema 包含 `strong_matches`、`gaps_to_address`、`transferable_skills`、`emphasis_strategy`，有利于识别匹配项和缺口。
- **optimization actions**：`LEAD_WITH`、`EMPHASIZE`、`QUANTIFY`、`DOWNPLAY` 将 JD 分析结果转为简历编辑策略。
- **ATS 关键词**：agent prompt 要求自然集成关键词；`ats_analysis` 中含 title variations 与 critical phrases。

局限在于：这些 JD-grounded 逻辑大多是 agent prompt 和 YAML mapping 指令，静态源码没有实现独立的 deterministic JD parser 或 scoring engine。实际效果取决于 Claude Code 模型对 prompt 的执行质量。不过，从仓库设计角度看，它对 JD-grounded 简历生成的支持明显强于普通模板填充项目。

## 7. 与本项目核心任务的适配度

核心任务是判断是否支持“基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历”。本项目的适配度评价如下：

- **基于目标岗位 JD**：适配度高。项目围绕 JD analysis、requirements priority、job_focus 和 ATS phrases 构建。
- **基于用户原始素材**：适配度高。要求用户将经历预先写成 YAML，并通过 mapping 规则从源素材选择内容。
- **岗位定制**：适配度高。简历标题、summary、技能类别、经历 bullet、项目和求职信均可按 JD focus 选择和重排。
- **基于真实经历**：适配度中高。prompt 和 mapping 明确禁止捏造，但缺少强制 provenance 校验；需要用户审查确认。
- **接近可投递**：适配度中高。React-PDF 模板、PDF 导出、ATS 优化、预览编辑链路完整；但默认模板和内容质量仍需人工调整。
- **需用户确认的第一版**：适配度高。`/tailor` 命令的协作编辑模式强调 before/after、询问用户是否准确、实时预览与确认，非常符合“第一版而非最终自动投递”。
- **实习简历场景**：适配度中等偏高。schema 支持 `junior_engineer`，但示例与文档主要面向 senior engineer；如果用户素材是学生 / 实习经历，需额外配置 titles、summaries 和项目型经历，否则生成风格可能偏资深。

综合判断：该项目与核心任务高度相关，尤其适合作为 Claude Code 内的原型 / 工作流参考；若作为通用“实习简历生成器”直接采用，还需要补充实习场景的数据模板、低经验叙事策略和更强的 source grounding 机制。

## 8. 是否值得实际运行 Smoke Test

**值得，但不是第一优先级的纯程序 smoke test；更适合做 Claude Code workflow smoke test。**

理由：

- 项目必须在 Bun + Claude Code 环境中使用，核心生成能力来自 Claude Code agent，不运行 agent 只能验证 schema / PDF 管线，不能验证 JD-grounded 生成质量。
- 本地代码的可测部分较明确：`bun install`、`bun run validate:all -C tech-corp`、`bun run generate-pdf -C tech-corp`、`/tailor tech-corp`。
- 若要评估核心任务，Smoke Test 应该使用一份真实实习 JD + 一份学生 YAML 素材，调用 `@agent-job-tailor` 生成四个公司文件，再检查是否遵守真实性、JD 匹配和 validation。

建议运行条件：已有 Claude Code 可用额度、允许安装 Bun 依赖、能接受 agent 修改仓库内 YAML 文件。静态评估阶段无需运行代码，本次 review 未运行任何代码。

## 9. 可借鉴点

1. **YAML 作为用户素材单一事实源**：用户先结构化写入经历，生成时只选择和强调已有素材，降低自由生成幻觉风险。
2. **job_focus array + weights**：用多个岗位焦点和归一化权重表达 JD 的复合需求，比单一岗位标签更灵活。
3. **requirements priority 1-10**：将 JD 技能重要性显式化，便于解释为什么某些经历被选中。
4. **candidate alignment schema**：强制输出 strong matches、gaps、transferable skills 和 emphasis strategy，适合做用户确认界面。
5. **optimization action codes**：`LEAD_WITH`、`EMPHASIZE`、`QUANTIFY`、`DOWNPLAY` 是简洁有效的编辑指令抽象。
6. **validation-first workflow**：所有生成 YAML 必须通过 Zod schema；CLI 提供 `validate:all` 与分文件验证。
7. **实时预览 + 协作确认**：`/tailor` 模式将 AI 编辑、schema 校验、PDF 预览和用户确认放在同一工作流中。
8. **模板与数据分离**：YAML 数据、Zod schema、React-PDF 模板分层清晰，便于替换模板或扩展字段。

## 10. 主要缺陷

1. **核心生成逻辑主要在 Claude Code prompt 中，不是可独立调用的库或服务**：离开 Claude Code 环境后，项目只能做 validation、预览和 PDF 生成，不能独立完成 JD 解析与简历定制。
2. **真实性约束缺乏强制溯源校验**：虽然 prompt 多次禁止 fabrication，但源码未见对 output bullet 与 source YAML 的自动比对、引用标注或证据链保存。
3. **mapping rules 是指导性 YAML，不是完整可执行 scoring engine**：weighted scoring 和 specialty matching 的算法主要以自然语言形式描述，实际执行由 agent 完成，稳定性取决于模型。
4. **实习场景不是默认重点**：示例数据和文案偏 Senior AI / Frontend Engineer，学生、校招、实习、低经验素材的模板和策略不足。
5. **用户前置成本较高**：需要把素材整理成较规范的 YAML，还要理解 Claude Code、Bun、company folder、validation 等概念。
6. **输出质量仍需人工编辑**：项目自身也强调 collaborative editing；生成结果不能视为无需审查的最终简历。
7. **schema 校验偏结构，不校验内容质量**：Zod 能检查格式，但不能判断 bullet 是否有力、是否过度包装、是否真正匹配 JD。
8. **隐私与本地数据风险需用户自担**：项目会处理个人联系方式、经历和岗位材料；虽然开源本地运行有优势，但 Claude Code agent 的上下文使用仍需用户理解。

## 11. 初步结论

Claude Code Job Tailor 是一个与目标任务高度相关的 Claude Code 原生简历定制工作流。它明确支持输入 JD 和用户 YAML 素材，能生成岗位分析、定制简历、求职信和 PDF，并通过 weighted scoring、job focus array、candidate alignment、validation 和实时预览机制，使输出较接近“可投递前的第一版”。

对核心评估标准的结论是：**基本支持，而且设计方向非常匹配；但其支持方式是 Claude Code agent 驱动的半自动化流程，而非独立、确定性的简历生成应用。** 真实性约束在 prompt 和 schema 层较强，但没有完全程序化的 provenance enforcement，因此必须保留用户确认环节。若用于“实习简历”场景，建议补充 internship-oriented source schema 示例、学生项目 / 课程 / 竞赛经历 mapping，以及输出内容到原始素材的引用或 diff 审核机制。

总体评级：**值得进一步 Smoke Test 和借鉴，尤其适合作为本项目的架构参考与 prompt/schema 参考；不建议无改造地作为最终产品内核。**
