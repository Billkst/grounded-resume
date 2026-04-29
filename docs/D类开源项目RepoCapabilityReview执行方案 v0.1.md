# D 类开源项目 Repo Capability Review 执行方案 v0.1

## 1. 背景

本项目（grounded-resume）的核心任务是：

> **“基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历。”**

为了评估当前开源生态中是否有可直接借鉴或复用的 baseline，我们选取了 6 个与“简历生成 / 简历优化 / JD 匹配”相关的 D 类开源项目，进行静态仓库评估。本轮评估不做代码执行、不做依赖安装、不做 API 调用，仅通过阅读 README、文档、源码和配置文件，判断各项目在产品形态和技术实现上是否支持我们的核心任务。

---

## 2. 评估目标

本轮评估的核心不是评 star 数，也不是评代码质量，而是评估它们是否能完成：

```
JD + 原始素材包 → 可信第一版简历
```

重点判断维度：
- 是否支持从零生成（而非仅优化已有简历）
- 是否支持结构化原始素材输入
- 是否真正将 JD 作为生成依据（而非只做关键词匹配）
- 是否有真实性约束和幻觉治理机制
- 是否支持中文输入和中文简历输出
- 是否有用户确认流程
- 是否接近可投递格式（PDF / DOCX / Markdown）

---

## 3. 评估对象

| 序号 | 项目名 | GitHub URL | 项目形态 |
|---|---|---|---|
| 1 | Resume Matcher | https://github.com/srbhr/resume-matcher | Web App (FastAPI + Next.js) |
| 2 | Resume Tailoring Skill | https://github.com/varunr89/resume-tailoring-skill | Claude Code Skill |
| 3 | Smart Resume Matcher | https://github.com/jellydn/smart-resume-matcher | Web App (React Router + TS) |
| 4 | Claude Code Job Tailor | https://github.com/javiera-vasquez/claude-code-job-tailor | Claude Code 工具 / 工作流 |
| 5 | Resume Optimizer AI | https://github.com/naveennk045/Resume-Optimizer | Web Demo (FastAPI + HTML) |
| 6 | JobMatchAI | https://github.com/wadekarg/JobMatchAI | Chrome Extension |

---

## 4. 评估维度

### 4.1 任务适配度
- 项目定位与我们的核心任务的匹配程度
- 属于：Full Fit / Partial Fit / Reference Only / Task Mismatch / Unknown

### 4.2 输入输出能力
- 是否支持输入目标 JD
- 是否支持输入已有简历
- 是否支持输入原始素材包（零散经历、项目、技能等）
- 是否支持从零生成完整简历
- 是否支持基于 JD 定制
- 是否支持中文
- 导出格式（PDF / DOCX / Markdown / JSON）

### 4.3 真实性约束
- 是否明确禁止虚构经历
- 是否要求基于真实素材
- 是否有证据来源 / provenance 追踪
- 是否有人工确认流程
- 是否有强表述降级机制
- 是否有输出前校验
- 是否有事实一致性检查

### 4.4 JD-grounded 能力
- 是否解析 JD
- 是否提取 JD 关键要求
- 是否将 JD 要求映射到用户经历
- 是否能判断哪些 JD 要求没有素材支撑
- 是否输出 gap / missing evidence
- 是否能避免无证据植入 JD 关键词

### 4.5 可运行性与 Smoke Test 价值
- 项目是否可本地运行
- 依赖是否可控
- 是否有明确输入输出流程
- 是否值得投入时间做 Smoke Test

### 4.6 可借鉴性
- 有哪些设计（数据结构、Prompt 设计、JD 解析、UI 流程、导出方式、真实性约束等）值得本项目参考

---

## 5. 安全策略

本轮评估严格遵守以下安全限制：

1. 可以 clone 第三方 GitHub 仓库。
2. 可以阅读 README、docs、examples、配置文件、源码。
3. **不要运行第三方仓库代码。**
4. **不要安装依赖。**
5. **不要执行 npm install / pip install / docker compose / shell script。**
6. **不要调用任何第三方 API。**
7. **不要提交第三方源码。**
8. 如果仓库不可访问或 clone 失败，记录失败原因，不要编造。

临时 clone 目录：`/tmp/grounded_resume_repo_review/`

该目录已通过 `.gitignore` 排除，不会提交到本仓库。

---

## 6. 适配度定义

| 适配度 | 定义 |
|---|---|
| **Full Fit** | 基本支持 JD + 原始素材 → 完整简历；功能链条完整，可直接作为 baseline 或核心参考 |
| **Partial Fit** | 支持部分任务，但依赖已有简历或只做优化/分析；需要二次开发才能满足核心任务 |
| **Reference Only** | 不适合作为 baseline，但有实现思路、数据结构、Prompt 设计或流程设计可参考 |
| **Task Mismatch** | 与本项目核心任务不匹配；功能方向或技术路线差异过大 |
| **Unknown** | 信息不足，无法判断 |

---

## 7. 输出物

本轮评估共产生以下输出文件：

```
outputs_d_repos/
├── repo_reviews/
│   ├── resume_matcher_review.md
│   ├── resume_tailoring_skill_review.md
│   ├── smart_resume_matcher_review.md
│   ├── claude_code_job_tailor_review.md
│   ├── resume_optimizer_ai_review.md
│   └── jobmatchai_review.md
└── repo_capability_matrix.md

docs/
└── D类开源项目RepoCapabilityReview执行方案 v0.1.md
```

---

## 8. 执行过程

### 8.1 信息收集
- 并行 clone 6 个仓库到 `/tmp/grounded_resume_repo_review/`
- 并行读取每个仓库的 README、关键源码、配置文件
- 使用 Plan 代理制定详细执行计划

### 8.2 深度分析
- 并行启动 6 个 Deep 代理，每个代理负责一个仓库的静态深度分析
- 每个代理按照统一的 11 个章节撰写 repo review
- 代理只读取文件，不运行任何代码

### 8.3 汇总整合
- 收集所有 6 份 repo review
- 验证每份 review 的完整性和质量
- 基于 6 份 review 撰写 capability matrix
- 撰写执行方案文档

### 8.4 自检与提交
- 运行自检脚本，确认所有文件存在
- 确认没有第三方源码被提交
- Git commit

---

## 9. 主要发现

### 9.1 开源项目的共同特点
- **全部依赖已有简历**：6 个项目中，没有一个支持“基于零散原始素材从零生成第一版实习简历”。
- **面向通用职场简历**：没有项目专门针对学生/实习/校招场景做设计。
- **中文支持薄弱**：仅 Resume Matcher 有 UI 多语言，关键词匹配仍以英文为主。
- **真实性约束以 prompt 为主**：仅 Resume Matcher 有代码级 diff allowlist 和 preview hash。

### 9.2 核心任务的空白点
- **原始素材采集与结构化**：缺失“非简历文档 → 事实库”的通用入口。
- **实习场景特化**：缺失课程项目、竞赛、科研、社团、低经验补偿策略。
- **证据链与溯源**：缺失“每条经历的事实来源、用户逐项确认”机制。
- **强真实性校验**：缺失自动检测虚构、推断、夸大的程序化机制。

### 9.3 可借鉴的设计元素
- **Resume Matcher**：diff-based 修改、preview → confirm 两阶段、keyword gap analysis、enrichment 问答。
- **Resume Tailoring Skill**：success profile、confidence scoring、branching discovery、gap disclosure、多 checkpoint。
- **Smart Resume Matcher**：side-by-side comparison、accept/reject/undo、Zod schema、多 provider 支持。
- **Claude Code Job Tailor**：weighted scoring、job focus array、candidate alignment、validation-first workflow。
- **JobMatchAI**：浏览器端 JD 抽取、profile 解析、多 provider AI 调用、bullet 级用户确认、DOCX 非破坏式生成。

---

## 10. 阶段性结论

### 10.1 GitHub 上的开源项目是否已经解决了我们的核心任务？

**没有。** 6 个项目的共同特点是全部依赖已有简历，没有一个项目支持“基于用户原始素材包从零生成第一版实习简历”。

### 10.2 它们主要集中在哪些路线？

- **已有简历 + JD 改写 / Tailoring**：Resume Matcher, Smart Resume Matcher, Claude Code Job Tailor, Resume Tailoring Skill
- **已有简历 + JD 匹配分析 + 自动申请辅助**：JobMatchAI
- **已有简历 + 简单 LLM 重写**：Resume Optimizer AI

### 10.3 它们最大的共同缺陷是什么？

1. 全部依赖已有简历
2. 实习生场景未特化
3. 中文支持普遍薄弱
4. 真实性约束停留在 prompt 层
5. JD-grounded 不够深入

### 10.4 我们的项目机会点是否仍然成立？

**仍然成立，且机会点更加明确。** 市场空白确认：GitHub 上的开源项目全部集中在“已有简历优化”，而“原始素材 → 第一版实习简历”是一个明显的市场空白。

### 10.5 下一步应该实际运行哪些项目？

| 优先级 | 项目 | Smoke Test 目标 |
|---|---|---|
| P1 | Smart Resume Matcher | 验证结构化简历 JSON + JD 文本 → tailoring 建议 → accept/reject → PDF/DOCX 导出 |
| P1 | Resume Matcher | 验证 PDF/DOCX 简历上传 + JD 粘贴 → diff 预览 → 确认保存 → PDF 导出 |
| P2 | JobMatchAI | 验证 Extension 加载 → DOCX 上传 → JD 网页抽取 → match analysis → bullet 改写 |
| P2 | Claude Code Job Tailor | 验证 Bun 安装 → YAML 素材录入 → agent 执行 → validation → PDF 生成 |
| P3 | Resume Tailoring Skill | 静态 prompt 流程验证，观察 Claude Code 对 SKILL.md 的遵循程度 |
| 不推荐 | Resume Optimizer AI | 静态评估已足够，无需运行 |
