# JobMatchAI 静态 Repo Review

## 1. 基本信息

- **项目名**：JobMatch AI / `JobMatch AI – Smart Resume & Job Analyzer`
- **GitHub URL**：https://github.com/wadekarg/JobMatchAI.git
- **主要语言 / 技术栈**：JavaScript、Chrome Extension Manifest V3、Chrome `storage` / `runtime messaging` / `content_scripts`、Shadow DOM UI、pdf.js、mammoth.js、JSZip、多个 LLM Provider REST API。
- **项目形态**：Chrome Extension（MV3）。`manifest.json` 声明 `background.js` 为 module service worker，`directFill.js` 与 `content.js` 注入 `<all_urls>`，`profile.html/profile.js` 作为配置与简历资料管理页。
- **版本与最近活跃情况**：`manifest.json` 版本为 `1.0.5`。本地浅克隆可见最近提交为 `2026-04-04 Overhaul README with new screenshots and consistent feature docs`，说明仓库近期仍有维护迹象；但静态评估未进一步查询远端 issue/PR 活跃度。

## 2. 项目定位

JobMatchAI 定位为面向求职者的浏览器侧求职助手，而不是独立的“简历生成 SaaS”。其核心工作流是：用户先上传已有简历（PDF/DOCX）并解析为结构化 profile；在任意招聘页面提取 JD；调用用户配置的 AI Provider 对简历与 JD 做匹配评分、技能差距分析、ATS 关键词提取、推荐建议；随后可生成 Cover Letter、改写简历 bullet、自动填写申请表，并记录已投递/已保存岗位。

与本项目核心任务相比，它更接近“JD 分析 + 简历局部定制 + 自动申请辅助工具”，而非“基于原始素材生成一份完整第一版实习简历”的端到端系统。它确实支持从真实简历出发进行岗位定制，但主要定制粒度集中在已有 DOCX 的 bullet 替换、技能追加和 Cover Letter 生成。

## 3. 输入能力

| 输入项 | 是否支持 | 静态证据 | 评价 |
|---|---:|---|---|
| 上传已有简历 | 是 | `profile.js` 支持 PDF/DOCX，`extractPDF()` 使用 pdf.js，`extractDOCX()` 使用 mammoth；`handleFile()` 调用 `PARSE_RESUME` | 这是项目最强输入能力，符合“用户原始素材”的一部分，但原始素材形态基本限定为现有简历。 |
| 保存原始 DOCX | 部分支持 | `profile.js` 对 DOCX 保存 `rawResumeBase64`；`background.js` 的 `GENERATE_TAILORED_RESUME` 要求 `resumeFileType === 'docx'` | 只有 DOCX 能被直接编辑并导出定制简历；PDF 可解析但不能生成可编辑 tailored resume。 |
| 结构化用户 Profile | 是 | `buildResumeParsePrompt()` 输出 name/email/skills/experience/education/projects/certifications；Profile 页可编辑 | 能形成后续分析与生成的事实基础。 |
| 多份简历 / 多 profile | 是 | `profileSlots`、`activeProfileSlot`、`slotNames` 三槽机制 | 有利于不同岗位方向切换。 |
| JD 自动提取 | 是 | `content.js` 的 `extractJobDescription()` 覆盖 LinkedIn、Indeed、Glassdoor、Greenhouse、Lever、Workday 及 generic fallback | 对浏览器插件场景实用，但提取质量依赖页面结构。 |
| 岗位元信息提取 | 是 | `extractJobTitle()`、`extractCompany()`、`extractLocation()`、`extractSalary()`、`extractJobId()` | 能为分析、保存、Cover Letter 和文件命名提供上下文。 |
| 用户额外原始素材 | 弱 | Q&A 支持申请表字段答案；自定义 bullet 只接收一段“what you did”描述 | 不支持系统化收集经历 STAR、项目细节、量化成果、课程/竞赛等原始素材。 |
| 中文输入 / 中文简历 | 未明确支持 | Prompt 和 UI 基本为英文；未见语言检测或中文输出要求 | LLM 可能能处理中文，但仓库没有针对中文简历/JD的显式支持、提示词或 UI 文案。 |

## 4. 输出能力

| 输出项 | 是否支持 | 静态证据 | 评价 |
|---|---:|---|---|
| JD 匹配分数 | 是 | `buildJobAnalysisPrompt()` 要求 `matchScore`、matching/missing skills、recommendations、insights.keywords | 符合岗位匹配/差距分析需求。 |
| ATS 关键词与推荐 | 是 | README 与 `renderAnalysis()` 渲染 `insights.keywords`、recommendations | 可作为简历定制依据。 |
| Cover Letter | 是 | `buildCoverLetterPrompt()` 生成 3 段、200-250 词求职信 | 与简历任务相关但不是简历主体。 |
| Bullet 改写 | 是 | `buildBulletRewritePrompt()`、`REWRITE_BULLETS`、UI 中逐条显示 original/improved | 支持基于 JD 改写已有经历 bullet。 |
| 单条 bullet 再生成 | 是 | `buildSingleBulletRewritePrompt()` 和 `REWRITE_SINGLE_BULLET` | 用户可排除技能、基于当前编辑再生成，交互较细。 |
| 自定义 bullet | 是但有风险 | `buildCustomBulletPrompt()` 基于用户描述生成，并可插入目标经历/项目 | 有真实性提示，但如果用户描述过粗，仍可能生成过度包装内容。 |
| 完整可下载定制简历 | 部分支持 | `handleGenerateTailoredResume()` 直接修改原 DOCX，替换 bullet、追加 missing skills、插入 custom bullets，下载 `{resume}_{company}.docx` | 对 DOCX 简历可输出近似可投递版本；不支持从零排版生成完整 DOCX，也不支持 PDF 输入直接导出。 |
| 用户确认机制 | 部分支持 | bullet 可编辑、可勾选/排除，生成后提示 “Review the downloaded resume for accuracy before submitting”；AutoFill 有 review warning | 简历生成前有 bullet 层面的确认，但最终 DOCX 没有内置 diff/逐段确认流程。 |

## 5. 真实性约束 / 幻觉治理

项目有一定真实性约束，但属于 prompt-level 与少量流程 guard，不能视为强治理。

正向约束包括：

- `buildBulletRewritePrompt()` 明确要求“Rewrite existing bullets — never fabricate experience, numbers, or results that aren't already implied”。
- `buildSingleBulletRewritePrompt()` 要求“不虚构经验、数字或结果，只在原始内容已暗示时量化”。
- `buildCustomBulletPrompt()` 要求从用户 rough description 生成，且“Never fabricate metrics, results, or experience not implied by the description”。
- `buildTailoredResumePrompt()` 虽然被导出但当前未被 `background.js` 使用；其 prompt 也要求使用真实 profile、不得虚构经历/数字/证书。
- `handleRewriteBullets()` 在没有非空 experience description 时直接报错，避免无素材时让 AI 编经历。
- 下拉框自动填充会校验 AI 返回值是否存在于真实 options 中，不匹配则跳过，属于表单填写场景的幻觉抑制。

主要不足包括：

- 真实性约束主要写在 prompt 中，缺少输出后的事实核查机制。例如 improved bullet 是否引入了原 bullet/profile 中没有的技能、职责、指标，没有程序化校验。
- `missingSkills` 会被追加到技能段：`handleGenerateTailoredResume()` 在找到 skills paragraph 后把 missing skills 直接 append。虽然 README 描述为“Adds the job's missing skills to the skills section”，但这在真实性上存在明显风险：missing skill 的定义恰恰是岗位需要而简历缺失，直接加入技能段可能把用户并未掌握的技能写进简历。
- 自定义 bullet 依赖用户自由文本，不要求证据字段、时间、角色、技术栈、结果等结构化确认。
- `buildResumeParsePrompt()` 仅要求“Extract all information you can find”，未显式要求“不补全、不推断缺失字段”。
- 没有引用溯源或“每条生成内容对应原始素材片段”的机制。

## 6. JD-grounded 能力

JD-grounded 能力较强，且贯穿多个功能：

- `content.js` 针对主流求职网站和 ATS 实现 JD/标题/公司/地点/薪资提取，并在 `analyzeJob()` 中把 JD、title、company 发送给 background。
- `background.js` 对过长 JD 做截断：分析上限 8000 字符，Cover Letter 上限 6000 字符，bullet rewrite prompt 内部取 3000 字符；同时返回 `jdTruncated` / `truncated` 用于 UI 提醒。
- `buildJobAnalysisPrompt()` 将 resume profile 与 `<job_description>` 一起输入，输出 matchScore、matchingSkills、missingSkills、recommendations、strengths/gaps/keywords。
- `buildCoverLetterPrompt()` 明确要求使用 exact company/job title，并引用 JD 与 matching skills。
- `buildBulletRewritePrompt()` 和单条 bullet prompt 都将 JD 片段与 missing skills 注入，要求自然编织 JD keywords。
- UI 支持对每条 bullet 的 missing skill chips 进行排除，体现了一定用户控制。

限制是：JD-grounding 更偏关键词/技能匹配和语言迁移，缺少对岗位职责层级、实习岗位能力要求、候选人经历证据之间的细粒度映射；也没有生成“为什么这条 bullet 对应该 JD 要求”的解释或 provenance。

## 7. 与本项目核心任务的适配度

核心任务为：**“基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历”。**

综合判断：**中等适配，偏工具组件可借鉴，不是完整可直接采用方案。**

适配点：

- 支持“目标岗位 JD”：能自动抽取网页 JD，并用于匹配分析、Cover Letter、bullet rewrite。
- 支持“用户原始素材”的一种形式：用户上传已有 PDF/DOCX 简历，解析为结构化 profile。
- 支持“岗位定制”：基于 JD 改写 bullet、追加关键词/技能、生成 tailored DOCX。
- 支持“需用户确认”：bullet 可编辑、可勾选、可排除技能，生成后提示 review。
- 支持“接近可投递”：对于原始 DOCX，能保留原文档并下载一份新 DOCX。

不适配点：

- 它不是“第一版实习简历生成器”，而是“已有简历优化器”。如果用户只有原始经历素材而没有成熟简历，它缺少素材采集、经历筛选、简历结构生成、实习场景模板等能力。
- 生成完整简历依赖原始 DOCX 的结构匹配；PDF 只能解析，无法导出 tailored resume。
- 真实性治理不足，尤其是把 `missingSkills` 直接加入 skills section 与核心任务“基于真实经历”存在冲突。
- 没有中文明确支持；对中文 JD/中文素材/中文简历输出不可保证。
- 没有面向“实习简历”的专门策略，如教育/课程/项目优先级、校园经历、无正式工作经验处理。

## 8. 是否值得实际运行 Smoke Test

**值得，但不是最高优先级。**

建议运行 Smoke Test 的原因：

- 仓库是完整 Chrome Extension，结构清晰，README 提供本地加载路径；功能链路具体，值得验证真实可用性。
- 关键风险在运行时行为：JD 抽取质量、DOCX bullet 匹配替换成功率、AI Provider CORS/鉴权、表单自动填充准确度，这些无法仅靠静态分析判断。
- `handleGenerateTailoredResume()` 对 DOCX XML 的替换依赖文本匹配，实际简历中的 bullet 被拆 run、符号、格式差异都可能导致替换失败，需真实样例验证。

建议 Smoke Test 范围：

1. 加载 unpacked extension，配置一个可用 AI Provider。
2. 上传英文 DOCX 简历，确认解析字段是否完整。
3. 打开 Greenhouse/Lever/LinkedIn 岗位页，测试 JD/title/company 抽取与 match analysis。
4. 运行 Improve Resume Bullets，检查是否出现虚构技能/指标。
5. 生成 Tailored Resume，检查替换数量、格式保留、skills section 是否不当追加未掌握技能。
6. 用中文简历或中文 JD 做一次非阻塞验证，确认是否退化。

## 9. 可借鉴点

- **浏览器端 JD 抽取与 ATS 兼容策略**：`content.js` 的多站点 selector + generic fallback 可作为 JD 获取模块参考。
- **LLM Provider 抽象**：`aiService.js` 支持 Anthropic/OpenAI/Gemini/Groq/Cerebras/OpenRouter/Mistral/DeepSeek/Cohere 等，且有统一 `callAI()`、重试、错误包装。
- **用户本地数据策略**：简历、API key、Q&A、分析缓存均使用 `chrome.storage.local`，没有自建后端，隐私边界清晰。
- **分阶段求职辅助 UX**：先分析匹配，再生成 Cover Letter / bullet rewrite / tailored resume，符合用户审核流程。
- **细粒度 bullet 控制**：每条 bullet 可编辑、排除、单独再生成、选择是否纳入最终 DOCX。
- **表单填充的确定性兜底**：`directFill.js` 和 `deterministicMatcher.js` 对 Q&A、EEO、work authorization、dropdown option 做规则匹配，减少不必要 LLM 调用。
- **原 DOCX 非破坏式生成**：保存原 DOCX base64，输出新文件，不修改用户原始简历。

## 10. 主要缺陷

- **不是真正的完整简历生成器**：主要改写已有 bullet 和编辑原 DOCX，缺少从零生成实习简历结构的能力。
- **真实性风险较高**：missing skills 被直接追加到技能段；缺少对 AI 输出与原始经历的自动比对、证据链、用户逐项事实确认。
- **PDF 输出链路不完整**：PDF 可上传解析，但 tailored resume 生成要求 DOCX；对大量用户的 PDF 简历不闭环。
- **中文支持缺失**：UI、prompt、默认 Q&A、输出风格均为英文；没有中文语言参数、中文模板或双语处理。
- **Prompt 偏泛化**：`buildJobAnalysisPrompt()` 没有明确要求严格区分“已具备/未具备/可迁移”；`buildResumeParsePrompt()` 没有强约束不得推断缺失字段。
- **DOCX 修改脆弱**：通过 XML 文本包含关系替换 paragraph，可能受 Word run 拆分、符号、换行、格式影响；插入 custom bullet 的逻辑是复制/替换段落 XML，格式与位置可靠性需实测。
- **JD 截断可能影响分析**：长 JD 只取前 8000/6000/3000 字符，若关键要求在后部会丢失。
- **没有面向实习场景的特殊建模**：对学生项目、课程、科研、社团、竞赛、低工作经验候选人没有专门流程。
- **用户确认仍偏弱**：最终生成 DOCX 前没有完整 diff 页面；skills 追加等高风险变更没有逐项确认。

## 11. 初步结论

JobMatchAI 是一个功能完成度较高的 Chrome MV3 求职辅助扩展，强项在于“上传已有简历 → 抽取网页 JD → 匹配评分/技能差距 → 改写 bullet → 下载定制 DOCX → 自动填表”的浏览器端工作流。它与本项目核心任务有明显交集，尤其值得借鉴 JD 抽取、profile 解析、多 provider AI 调用、bullet 级用户确认、DOCX 非破坏式生成等模块。

但若按“基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历”严格评估，该项目只能算**部分满足**：它要求用户已有简历，且最好是 DOCX；输出主要是对原简历的局部改写，而非面向实习申请的完整第一版简历生成；真实性约束主要依赖 prompt，且存在将 missing skills 直接写入技能段的反向风险。因此，本项目更适合作为参考实现或组件来源，不宜直接作为核心任务的主方案。

**建议评级：中等相关 / 值得借鉴 / 需要重构真实性治理与完整简历生成流程后才能用于核心任务。**
