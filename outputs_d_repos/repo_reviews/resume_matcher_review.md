# Resume Matcher 静态 Repo Review

> 评估对象：`/tmp/grounded_resume_repo_review/resume-matcher/`  
> 评估方式：仅基于静态代码与文档阅读，未运行代码、未进行 Smoke Test。  
> 核心评估标准：是否支持“基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历”。

## 1. 基本信息

- **项目名**：Resume Matcher
- **GitHub URL**：`https://github.com/srbhr/resume-matcher.git`（README 中 clone URL 为 `https://github.com/srbhr/Resume-Matcher.git`，remote 为小写仓库名）
- **主要语言 / 技术栈**：
  - 后端：Python 3.13+、FastAPI、Pydantic、TinyDB、LiteLLM、MarkItDown、pdfminer.six、Playwright
  - 前端：Next.js 16、React 19、TypeScript、Tailwind CSS 4、Vitest
  - AI 提供商：Ollama、OpenAI、Anthropic、Google Gemini、OpenRouter、DeepSeek、OpenAI-compatible API
  - PDF：后端通过 Playwright / headless Chromium 渲染
- **项目形态**：本地优先的 Web App（前后端分离，也支持 Docker 部署）。核心入口是上传 master resume、粘贴 JD、预览修改、确认保存、编辑并导出 PDF。
- **最近活跃情况**：README 明确标注项目处于 active development；本地 Git 最近提交为 `2026-04-17` 的 PR merge（`Merge pull request #758 from srbhr/fix/next-config-invalid-turbopack-flag`）。由于本地仓库可能是浅克隆，更多活跃度信息无法完整判断。

## 2. 项目定位

该项目主要解决“已有简历如何根据目标岗位 JD 进行匹配、改写、评分与导出”的问题。README 的工作流是：上传 master resume（PDF/DOCX）→ 粘贴目标 JD → 获得 AI 改进建议和定制内容 → 用户修改布局与内容 → 导出 PDF；同时提供 cover letter、outreach message、关键词高亮和匹配率。

分类判断：

- **主要类别**：已有简历 + JD 匹配 / 改写 / ATS-like keyword scoring
- **辅助类别**：求职辅助（cover letter、cold outreach）、简历编辑器、PDF 模板导出
- **不是典型“从零生成”项目**：虽然 builder 有空白初始数据与手动编辑能力，但自动定制链路依赖上传并解析已有简历或已有结构化 resume data，不是从原始素材包自动构建完整简历。

## 3. 输入能力

| 输入/能力项 | 支持情况 | 静态依据与说明 |
|---|---:|---|
| 输入目标 JD | 支持 | 后端 `/jobs/upload` 接收 `job_descriptions` 数组并保存原始 JD；前端 `tailor/page.tsx` 提供 JD textarea，少于 50 字会前端拦截。 |
| 输入已有简历 | 支持 | 后端 `/resumes/upload` 支持 PDF/DOC/DOCX，使用 MarkItDown 转 Markdown，再用 LLM 解析为结构化 JSON。前端 upload dialog 限制 PDF/DOC/DOCX、4MB。 |
| 输入原始素材包 | 部分支持 / 不完整 | enrichment 模块会针对已有简历中的弱经历/项目生成问题，让用户补充指标、技术栈、范围、贡献；但没有看到支持上传“原始素材包”（如经历文档、作品集、成绩单、聊天记录等）并自动抽取事实的通用入口。 |
| 从零生成完整简历 | 不作为核心支持 | `resume-builder.tsx` 有空白初始 ResumeData，可手动编辑保存；但 AI 定制流程需要 `master_resume_id`，上传页和 tailor 页围绕 master resume。没有看到“只给素材/JD，自动生成完整简历”的端到端流程。 |
| 基于 JD 定制简历 | 支持 | 后端 `extract_job_keywords` 解析 JD，`generate_resume_diffs` / `improve_resume` 根据 JD 和简历生成修改，`refine_resume` 做关键词注入、AI phrase removal、alignment validation。 |
| 中文支持 | 部分支持 | README 标注 UI 有简体中文，content generation 可选择语言；prompt 模板包含 `zh: Chinese (Simplified)`。但前端关键词匹配工具基于英文 stop words 和 `[a-z0-9-]` 分词，对中文 JD/中文简历关键词匹配能力有限。 |
| 导出格式 | 支持 PDF | README 和前后端均支持 resume/cover letter PDF 导出；未见 DOCX 导出。 |

## 4. 输出能力

项目输出包括：

1. **岗位定制简历 JSON / 预览**：`/resumes/improve/preview` 返回 `resume_preview`、`markdownOriginal`、`markdownImproved`、`diff_summary`、`detailed_changes`、warnings 和 refinement stats。
2. **用户确认后保存的定制简历**：`/resumes/improve/confirm` 将预览结果保存为新的 tailored resume，保留 `parent_id` 指向原始 master resume。
3. **PDF 简历**：`/resumes/{resume_id}/pdf` 按模板和排版参数导出。
4. **Cover letter / outreach message**：可按 JD 和简历生成，并支持 PDF 或文本编辑。
5. **匹配视图**：前端 JD comparison 展示 JD 与简历关键词匹配数、匹配率、高亮。

与目标输出的接近度：**较接近“基于已有简历 + JD 的可投递第一版”**。它能生成岗位定制版简历，提供 diff 预览并要求用户确认后保存，且可以导出 PDF。但它不是以“用户原始素材包”为主要输入，也不专门面向“实习简历从零生成”；对无结构素材到完整简历的一步式生成能力不足。

## 5. 真实性约束 / 幻觉治理

| 真实性/治理项 | 支持情况 | 静态依据与评价 |
|---|---:|---|
| 禁止虚构 | 明确支持 | prompt 中有 `CRITICAL TRUTHFULNESS RULES`：禁止新增未在原简历中出现的技能、工具、证书、数字成果、公司名、产品名、技术术语，禁止升级经验级别、改日期。 |
| 基于真实素材 | 部分支持 | 定制流程以 master resume / original resume 为事实来源；enrichment 只允许基于候选人回答新增 bullet。但事实来源主要是已有简历和用户回答，不是通用素材证据库。 |
| 保留证据来源 | 不支持 / 信息不足 | 数据结构没有证据引用、source span、素材 id、原文定位等字段；diff 有 `original` 文本与 `reason`，但不是完整证据链。 |
| 人工确认流程 | 支持 | 前端先调用 preview，再展示 diff modal；确认后才调用 `/improve/confirm` 保存。后端 confirm 还校验 preview hash，要求先预览再确认。 |
| 强表述降级 | 部分支持 | `remove_ai_phrases` 会替换 spearheaded、orchestrated、cutting-edge 等 AI/夸张措辞；但没有系统性“强表述降级”分类器或按证据强弱自动降级机制。 |
| 输出前校验 | 支持 | diff 模式通过 allowlist path、blocked path、original text match、section count、identity field、word count、invented metric warnings 等本地校验；Pydantic 校验 ResumeData schema。 |
| 事实一致性检查 | 部分支持 | `validate_master_alignment` 检查新增 skills/certs/company 是否存在于 master resume，`fix_alignment_violations` 可移除伪造技能/证书/公司；但对 bullet 语义、项目责任、教育要求等复杂事实一致性检查有限。 |

## 6. JD-grounded 能力

1. **是否解析 JD？**  
   支持。`EXTRACT_KEYWORDS_PROMPT` 要求从 JD 中抽取 `required_skills`、`preferred_skills`、`experience_requirements`、`education_requirements`、`key_responsibilities`、`keywords`、`experience_years`、`seniority_level`。

2. **是否提取关键要求？**  
   支持。后端 `extract_job_keywords` 调用 LLM 提取结构化关键词；前端 JD comparison 也有本地关键词抽取，但本地实现偏英文粗分词。

3. **是否映射到用户经历？**  
   部分支持。AI prompt 会要求只在原简历有证据时 weave in keywords；diff path 允许修改 summary、经历 bullet、项目 bullet、技能排序。`analyze_keyword_gaps` 用 master resume 全文判断某个 JD keyword 是否可以注入。但没有看到显式的 JD requirement → resume evidence matrix 输出。

4. **是否判断无素材支撑的 JD 要求？**  
   部分支持。`KeywordGapAnalysis` 区分 `missing_keywords`、`injectable_keywords`、`non_injectable_keywords`，其中 non-injectable 表示 master resume 中找不到支撑。但这主要是 keyword 级别，不是完整岗位要求/职责级别判断。

5. **是否输出 gap / missing evidence？**  
   部分支持。后端 refinement stats 包含关键词注入数量、match percentage；`KeywordGapAnalysis` 有 non-injectable 字段，但前端是否完整呈现这些缺口信息未完全确认。README 展示“suggestions for improvement”和关键词高亮，但不是明确的 evidence gap report。

6. **是否避免无证据植入关键词？**  
   支持较强。prompt 明确要求只加入原简历支持的关键词；`analyze_keyword_gaps` 仅把 master resume 中出现的关键词列为 injectable；diff applier 限制可修改字段，并拒绝不匹配原文的 replace；alignment validation 会移除 fabricated skills/certs/company。但对于 LLM 改写 bullet 中引入的隐性新责任，仍无法完全保证。

## 7. 与本项目核心任务的适配度

**适配度：Partial Fit**

理由：

- 符合的部分：项目可以输入目标 JD 和已有简历，生成岗位定制简历；有较强真实性 prompt、diff allowlist、preview/confirm、PDF 导出，输出形态接近“需用户确认的第一版可投递简历”。
- 不完全符合的部分：核心链路依赖“已有 master resume”，而不是“用户原始素材包”；没有通用素材 ingestion、证据引用、从零构建实习简历的端到端流程；JD-grounded gap 输出和 evidence mapping 只到关键词层面。
- 对“实习简历”的专门适配不足：没有看到针对学生/实习场景的经历挖掘、课程项目、竞赛、校园活动、技能证据等专门建模。

## 8. 是否值得实际运行 Smoke Test

**选择：是**

建议 Smoke Test 的判断标准：

- 它静态上已经具备核心闭环：上传简历 → 粘贴 JD → AI 预览定制 → diff 确认 → 保存 → 导出 PDF。
- 真实性治理在代码中有多层实现，值得通过最小样例验证是否实际生效：例如 JD 要求不存在技能，检查是否被 non-injectable 或拒绝注入；JD 含 prompt injection，检查 sanitizer 是否有效；确认流程是否必须先 preview。
- 但 Smoke Test 应以“已有简历 + JD 改写”场景为主，不应把它当作“原始素材包从零生成”能力来测。

## 9. 可借鉴点

1. **Preview → Confirm 两阶段提交**：前端展示 diff，后端用 preview hash 校验确认 payload，适合“需用户确认的第一版简历”。
2. **Diff-based LLM 输出**：让 LLM 输出 targeted changes，而不是整份简历，随后本地 allowlist path + original text match 应用变更，显著降低幻觉和结构破坏风险。
3. **多档改写策略**：`nudge`、`keywords`、`full` 对应不同激进程度，可用于让用户控制定制强度。
4. **事实保护层**：保留 personalInfo、恢复原始日期精度、保留原始技能/证书/语言/奖项、保护 custom sections，对简历场景很实用。
5. **关键词 gap 判断**：把 JD keywords 分成 missing / injectable / non-injectable，是构建 evidence gap 的基础。
6. **AI phrase removal**：用本地 blacklist 替换 AI 味/夸张表达，能改善可投递文本质量。
7. **Enrichment 问答机制**：先识别弱经历，再向用户追问 metrics、scope、tools、ownership，适合补齐实习简历素材。
8. **本地优先与多 LLM provider**：支持 Ollama 和多云厂商，便于隐私和部署灵活性。

## 10. 主要缺陷

1. **强依赖已有简历**：核心自动定制流程围绕 master resume，上传入口支持 PDF/DOCX 简历；没有看到从多源原始素材自动生成完整简历的主流程。
2. **不能真正从零生成**：builder 可手动创建空白简历，但 AI 生成链路需要 master resume 和 `master_resume_id`；这与“基于原始素材包生成第一版实习简历”存在差距。
3. **证据链不足**：没有 source attribution、证据片段 ID、素材引用、claim-to-evidence 映射，无法让用户逐条确认每个 bullet 的事实来源。
4. **真实性校验仍偏浅层**：技能、证书、公司名和日期保护较强，但对 bullet 中新增责任、复杂成就、职责范围、项目规模等语义级虚构只能依赖 prompt 和有限 warning。
5. **JD-grounded gap 输出不够产品化**：代码层有 non-injectable keywords，但未看到完整“岗位要求—已有证据—缺口—需用户补充”的用户可见报告。
6. **中文/非英文关键词匹配有限**：LLM 内容生成支持中文，但前端本地 keyword matcher 主要按英文字符分词，中文 JD 高亮/匹配率可能不可靠。
7. **输出格式有限**：明确支持 PDF，未见 DOCX/Markdown/LaTeX 等常见简历导出格式。
8. **实习场景缺少专门模型**：未见对学生背景、课程项目、竞赛、科研、社团、低经验候选人的专门采集与排序策略。

## 11. 初步结论

Resume Matcher 是一个成熟度较高的“已有简历 + JD 定制改写”Web App，具备上传简历、解析 JD、生成定制简历、diff 预览、用户确认、PDF 导出的完整闭环。它在真实性约束方面有可借鉴的工程设计，尤其是 diff-based 修改、字段保护、preview hash、关键词注入前的 master resume 支撑判断。对我们的核心任务而言，它是 **Partial Fit**：适合作为“JD-grounded 改写与确认流程”的参考，不足以直接承担“基于原始素材包从零生成实习简历”的完整任务。若后续使用，应重点借鉴其防幻觉与确认机制，同时补齐素材证据链、从零结构化生成、中文关键词匹配和实习场景采集能力。
