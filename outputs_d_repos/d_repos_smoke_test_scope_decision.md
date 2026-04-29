# D 类开源项目 Smoke Test 范围收敛说明 v0.1

## 1. 背景

D 类开源项目 Repo Capability Review v0.1 已完成。本轮对 6 个与“简历生成 / 简历优化 / JD 匹配”相关的开源项目进行了静态仓库评估，评估方式为仅阅读 README、文档、源码和配置文件，不做代码执行、不做依赖安装、不做 API 调用。

评估核心标准是：判断各项目是否支持"基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历"。

---

## 2. 已评估项目

| 序号 | 项目名 | GitHub URL | 项目形态 | 适配度 |
|---|---|---|---|---|
| 1 | Resume Matcher | https://github.com/srbhr/resume-matcher | Web App (FastAPI + Next.js) | Partial Fit |
| 2 | Resume Tailoring Skill | https://github.com/varunr89/resume-tailoring-skill | Claude Code Skill | Partial Fit |
| 3 | Smart Resume Matcher | https://github.com/jellydn/smart-resume-matcher | Web App (React Router + TS) | Partial Fit |
| 4 | Claude Code Job Tailor | https://github.com/javiera-vasquez/claude-code-job-tailor | Claude Code 工具 / 工作流 | Partial Fit |
| 5 | Resume Optimizer AI | https://github.com/naveennk045/Resume-Optimizer | Web Demo (FastAPI + HTML) | Task Mismatch |
| 6 | JobMatchAI | https://github.com/wadekarg/JobMatchAI | Chrome Extension | Partial Fit |

---

## 3. 核心发现

静态评估的核心发现如下：

- **全部依赖已有简历**：6 个项目中，没有一个支持"基于用户零散原始素材包从零生成第一版实习简历"。所有项目的核心输入都是一份已经写好的完整简历（PDF、DOCX、Markdown、YAML 或 JSON）。
- **主流路线是"已有简历 + JD 优化 / 匹配 / 改写"**：D 类项目的主流价值主张是"让你的已有简历更好地匹配目标岗位"，而不是"帮你从无到有写出第一份简历"。
- **与本项目核心任务存在任务形态差异**：我们的核心任务是"JD + 原始素材包 → 可信第一版实习简历"，而 D 类项目的主流形态是"已有简历 + JD → 优化版简历"。两者在输入形态、任务目标、用户假设上均存在本质差异。
- **开源生态尚未覆盖本项目核心任务**：在 GitHub 上搜索到的与"AI 简历"相关的开源项目，几乎全部被"已有简历优化"这一范式所占据，"原始素材 → 第一版实习简历"方向存在明显市场空白。

---

## 4. 为什么不做实际 Smoke Test

基于上述发现，本阶段决定 D 类开源项目**不进入实际 Smoke Test**，具体原因如下：

### 4.1 运行前必须人工构造 base resume

D 类项目的所有入口都要求用户先提供一份已有简历。如果要运行 Smoke Test，测试人员必须先人工构造一份 base resume（PDF、DOCX、YAML 或 JSON 格式）。这意味着 Smoke Test 的准备工作本身就变成了"写简历"，而非"测系统"。

### 4.2 这会改变任务定义

一旦引入 base resume，Smoke Test 的评估目标就从"原始素材 → 第一版实习简历"变成了"已有简历 → JD 优化"。这与本项目核心任务的定义发生了偏离，测试结果无法回答"系统是否能从零生成第一版实习简历"这一关键问题。

### 4.3 会引入人工变量

人工构造的 base resume 质量、结构、内容丰富度会直接影响 D 类项目的输出质量。不同的测试人员可能构造出差异极大的 base resume，导致测试结果不可复现、不可比较。这会破坏与 B 类通用 LLM、C 类工具的公平对比基础。

### 4.4 部署 / 运行成本高

6 个项目涉及多种技术栈和运行环境：
- Resume Matcher：FastAPI + Next.js + uv + npm，需要配置 AI Provider
- Smart Resume Matcher：React Router + pnpm，需要配置 AI Provider
- Claude Code Job Tailor：Bun + Claude Code，依赖 Claude Code 环境
- JobMatchAI：Chrome Extension，需要浏览器加载和配置 AI Provider
- Resume Tailoring Skill：Claude Code Skill，无独立可执行代码
- Resume Optimizer AI：FastAPI + Groq API key

为每个项目配置运行环境、解决依赖冲突、申请 API key，时间成本远高于评估收益。

### 4.5 新增结论有限

静态评估已经回答了本轮评估的核心问题：
- 这些项目是否支持从零生成？**不支持。**
- 这些项目是否支持原始素材包输入？**不支持或仅弱支持。**
- 这些项目的真实性约束如何？**大部分停留在 prompt 层。**
- 这些项目是否适合作为本项目 baseline？**不适合直接作为 baseline，但有参考价值。**

实际运行这些项目，最多只能验证"已有简历优化"的质量，而无法验证"从零生成第一版实习简历"的能力。新增信息对核心任务的决策帮助有限。

---

## 5. D 类项目的保留价值

虽然 D 类项目不进入实际 Smoke Test，但它们在静态评估中展现出的设计元素对本项目仍有重要参考价值：

| 项目 | 保留价值 |
|---|---|
| **Resume Matcher** | diff preview、confirm 两阶段提交、keyword gap analysis（missing / injectable / non-injectable）、enrichment 问答机制、remove_ai_phrases、preview hash 校验。 |
| **Smart Resume Matcher** | 结构化简历 JSON schema、accept/reject/undo 交互、side-by-side comparison、Zod schema 约束、多 AI provider 支持、PDF/DOCX 导出闭环。 |
| **Claude Code Job Tailor** | YAML 作为单一事实源、weighted scoring（1-10）、job focus array、optimization action codes（LEAD_WITH / EMPHASIZE / QUANTIFY / DOWNPLAY）、validation-first workflow、实时预览 + 协作确认。 |
| **Resume Tailoring Skill** | truthfulness 核心原则、confidence scoring（Direct / Transferable / Adjacent）、gap disclosure、branching discovery 访谈、reframing rationale、多 checkpoint 流程。 |
| **JobMatchAI** | 浏览器端 JD 自动抽取（多站点 selector + fallback）、profile 解析（PDF.js + mammoth.js）、bullet 级用户确认（编辑 / 排除 / 再生成）、DOCX 非破坏式生成、多 provider AI 调用抽象。 |
| **Resume Optimizer AI** | 作为**反面教材**参考：prompt 允许推断指标的真实性风险、最小交互链路的工程缺陷、无用户确认流程的问题。 |

---

## 6. 阶段性结论

**D 类开源项目不进入实际 Smoke Test。**

D 类阶段以 Repo Capability Review（6 份 repo review + 1 份 capability matrix + 1 份执行方案）作为最终交付物。评估结论已充分说明：

1. 开源生态在"原始素材 → 第一版实习简历"方向存在市场空白；
2. D 类项目不适合作为本项目直接 baseline；
3. D 类项目在 JD 解析、真实性约束设计、用户确认流程、PDF 导出等方面提供了可借鉴的设计元素。

这些结论将直接输入到 Baseline 综合分析报告中，用于支撑本项目的差异化定位和技术路线决策。
