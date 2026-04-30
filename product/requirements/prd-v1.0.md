# grounded-resume: Product Requirements Document v1.0

> **Status**: Draft  
> **Date**: 2026-04-30  
> **Product**: grounded-resume — 面向中文实习求职者的第一版简历生成系统  
> **Target Release**: MVP (v1.0)  
> **Related Docs**:
> - `product/requirements/问题定义 v1.0.md`
> - `product/designs/mvp-workflow-v0.1.md`
> - `product/designs/core-modules-v0.1.md`
> - `product/specs/data-structures-v0.1.md`
> - `product/decisions/adr-001-mvp-architecture.md`

---

## 1. Executive Summary

### Problem Statement

投递 AI 产品岗和 AI 应用开发岗的实习求职者，普遍面临"有零散素材但无成型简历"的困境。现有工具（模板网站、ATS 匹配器、通用 LLM）要么无法从零生成、要么容易虚构夸大、要么不理解抽象岗位要求与用户真实经历之间的语义映射关系，导致用户不敢直接用于正式投递。

### Proposed Solution

 grounded-resume 是一款**受约束的 AI 简历生成系统**：基于目标岗位 JD 和用户提供的原始素材，通过"岗位理解 → 素材结构化 → 证据映射 → 受约束生成 → 真实性校验 → 用户确认"的端到端工作流，输出一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历（Level 2）。系统以真实性为底线，以可审计为设计原则，让用户理解"为什么简历这样写"并掌握最终控制权。

### Success Criteria

#### 系统质量指标（开发阶段硬门槛）

开发阶段必须达到的工程指标，通过自动化测试和系统监控验证：

| KPI | Target | Measurement Method |
|---|---|---|
| **Critical JD 要求覆盖率** | ≥ 60% | 系统自动计算：critical 要求中有 evidence mapping 的比例 |
| **红线拦截率** | ≥ 95% | 回归测试：Baseline 12 个样本中，虚构/夸大/角色升级等红线被拦截的比例 |
| **素材事实溯源覆盖率** | 100% | 系统自动校验：每条 ResumeBullet 必须关联至少一个 MaterialFact |
| **端到端生成耗时** | P95 ≤ 5 分钟（优化目标：≤ 3 分钟） | 系统监控：从用户提交到校验完成的服务端处理时间 |

#### 用户体验指标（Beta 阶段验证目标）

需通过种子用户试用验证的目标，不作为开发阶段阻塞发布的硬门槛：

| KPI | Target | Measurement Method |
|---|---|---|
| **用户确认通过率** | ≥ 70% | 用户确认阶段：被认可或轻微修改后保留的 bullet 占总 bullet 的比例 |
| **生成到可投修改成本** | ≤ 15 分钟 | 用户调研：从系统输出到用户认为"可以投递"所需的平均手动修改时间 |
| **重新生成触发率** | ≤ 20% | 用户拒绝 bullet 超过 50% 而触发重新生成建议的会话占比 |

---

## 2. User Experience & Functionality

### 2.1 User Personas

#### Persona A: 种子用户 — "有素材但无从下笔的实习生"

- **背景**：计算机/产品相关专业大三学生，已开始浏览 AI 产品岗实习 JD
- **状态**：有 2-3 段项目经历（课程项目、个人项目）、1 段竞赛经历、教育背景，但没有成型简历
- **痛点**：不知道如何把"整理过知识库""对比过 prompt 输出"这类零散动作，写成岗位认可的表达
- **技术素养**：熟悉 AI 工具（用过 ChatGPT/Kimi），愿意尝试新产品，但对"AI 改简历"的真实性存疑
- **目标**：快速获得第一版接近可投递的简历，且能确认内容真实可信

#### Persona B: 进阶用户 — "需要岗位定制的转岗求职者"

- **背景**：已有通用简历，但投递不同岗位时需要针对性调整
- **状态**：素材相对丰富，但不懂如何围绕特定 JD 重新组织侧重点
- **痛点**：现有工具只能做关键词植入或排版调整，无法理解抽象能力要求（如"数据品味""产品判断"）
- **目标**：基于真实经历生成岗位定制版本，而非通用模板

### 2.2 User Stories

#### Story 1: 提交素材与 JD

> **As a** 种子用户  
> **I want to** 粘贴目标岗位 JD 和我的原始经历素材（口语化描述即可）  
> **So that** 系统能基于这些信息开始生成简历

**Acceptance Criteria:**
- [ ] 用户必须提供：姓名、邮箱、目标公司、岗位名称、完整 JD 原文
- [ ] 用户必须提供：至少一段教育背景和一段项目经历素材
- [ ] 素材支持口语化、非结构化文本输入，无需预先格式化
- [ ] 系统对过短 JD（<50 字）和空素材包进行轻量校验并提示
- [ ] 用户可选提供：电话、GitHub、博客、城市、技能自评、竞赛/校园经历

#### Story 2: 查看生成结果与证据来源

> **As a** 种子用户  
> **I want to** 看到系统生成的简历内容，以及每条内容对应的原始素材来源和映射理由  
> **So that** 我能判断内容是否真实、是否理解为什么这样写

**Acceptance Criteria:**
- [ ] 每条 resume bullet 必须展示：生成文本、原始素材片段（高亮）、映射理由（自然语言解释）
- [ ] 证据强度必须可视化标注：强证据（绿色）、中等证据（黄色）、弱证据（橙色）、不足（红色）
- [ ] 系统必须标注表达强度：literal / conservative / standard / emphasized
- [ ] 组合映射（composite）必须明确标注，并解释多个素材如何共同支撑该要求
- [ ] 用户可在三栏布局中浏览：简历表达 | 证据来源 | 映射分析

#### Story 3: 确认、修改或拒绝每条内容

> **As a** 种子用户  
> **I want to** 对每条生成内容选择"认可""修改"或"拒绝"，并看到系统的风险提示  
> **So that** 我作为最终守门人，对投递内容有完全控制权

**Acceptance Criteria:**
- [ ] 用户可对每条 bullet 执行：✅ 认可 / ✏️ 修改 / ❌ 拒绝 / 💬 备注
- [ ] 用户修改后的文本需经过轻量风险校验，如发现新增风险则提示用户
- [ ] 高风险内容（RiskLevel = warning/emphasized/含数字）必须排在确认队列前面
- [ ] 用户拒绝的 bullet 数 > 50% 时，系统提示"是否重新生成"并提供原因选项
- [ ] 红线内容（redline）已被系统拦截，但仍需展示给用户知晓

#### Story 4: 查看能力缺口与修改建议

> **As a** 种子用户  
> **I want to** 知道我的素材与目标岗位之间还有哪些差距，以及如何进一步改进  
> **So that** 我能决定是补充素材、调整目标岗位，还是在面试中主动解释

**Acceptance Criteria:**
- [ ] 系统输出 Gap 报告：列出未满足的 JD 要求、严重程度、建议处理方式
- [ ] 每个 Gap 项提供用户选项：接受缺口 / 后续补充 / 我有但忘写了
- [ ] 系统提供修改建议指南：如何压缩长度、如何调整侧重点、哪些 gap 可在面试中解释
- [ ] 风险提示摘要展示仍存在的 caution/warning 级别风险及修改方向

#### Story 5: 导出最终简历

> **As a** 种子用户  
> **I want to** 获得一份格式规范的 Markdown 简历，以及证据映射表等辅助文档  
> **So that** 我可以基于系统输出快速定稿并投递

**Acceptance Criteria:**
- [ ] 主输出：Markdown 格式简历（后续版本支持 PDF/DOCX）
- [ ] 附件 1：证据映射表（JD 要求 ↔ 简历表达 ↔ 素材来源 ↔ 证据强度）
- [ ] 附件 2：Gap 报告（未满足要求 + 用户决策记录）
- [ ] 附件 3：风险提示摘要
- [ ] 附件 4：修改建议指南（从 Level 2 进化为 Level 3）
- [ ] 输出顶部必须有 Level 2 声明：提醒用户最终确认责任由用户承担

### 2.3 Non-Goals

以下功能**明确不在 MVP 范围内**，以保护交付节奏：

| 非目标 | 说明 | 后续版本 |
|---|---|---|
| 自由聊天式多轮生成 | MVP 不支持用户通过自然语言对话要求系统重新生成或修改整份简历 | v1.1 |
| 整份简历自动重写 | MVP 不支持基于用户反馈自动重写全部或大部分 bullet | v1.1 |
| 多 JD 对比生成 | MVP 一次只处理一个 JD，不支持同时输入多个 JD 生成通用版 | v1.1 |
| 素材补全建议 | MVP 不主动建议用户补充哪些素材，仅在 Gap 报告中列出缺口 | v1.1 |
| 面试题预测 | 基于 JD 和简历预测面试问题 | v1.2 |
| 自动投递集成 | 与招聘平台 API 集成自动投递 | v2.0 |
| 版本管理与对比 | 保存多个简历版本并支持对比 | v1.2 |
| PDF/DOCX 导出 | MVP 仅输出 Markdown，用户可自行转换 | v1.1 |
| 非中文 JD 支持 | MVP 仅支持中文 JD，非中文返回明确错误提示 | v1.1 |
| 移动端原生 App | MVP 仅提供 Web 应用 | v2.0 |
| 团队协作/企业版 | MVP 仅面向个人用户 | v2.0 |

**MVP 明确支持的用户确认能力**：

- 单条 bullet 的认可、修改、拒绝、备注（见 Story 3 Acceptance Criteria）
- 用户修改后的 bullet 触发轻量风险校验
- 用户拒绝大量 bullet 时，系统收集原因并提示下一步（返回重新映射、重新生成、或用其他素材替代），而非完全阻断流程

---

## 3. AI System Requirements

### 3.1 Tool Requirements

#### 3.1.1 LLM Provider 与模型

系统必须支持多模型接入，用户根据自有 API Key 选择：

| 厂商 | 认证方式 | MVP 支持模型 | 优先级 |
|---|---|---|---|
| **OpenAI** | API Key + OAuth (Device Code) | GPT-5.5, GPT-5.5 Pro, GPT-5.4 mini | P0 |
| **Kimi** | API Key | Kimi K2.6, Kimi K2.5 | P0 |
| **GLM** | API Key | GLM-5.1 | P1 |
| **DeepSeek** | API Key | DeepSeek-V4 Pro | P1 |
| **Claude** | API Key | Claude Opus 4.7 | P1 |
| **Qwen** | API Key | Qwen3.5-Flash | P2 |
| **Gemini** | API Key | Gemini 3.1 Flash Live | P2 |
| **第三方代理** | API Key | 用户自定义 endpoint | P2 |

**关键约束**：
- 所有模型统一使用同一套约束规则，系统不为弱模型做特殊补偿逻辑
- 云端试用版仅支持 Kimi / GLM / DeepSeek（成本控制）
- ChatGPT OAuth 必须实现 Device Code 流程，支持仅有 Plus 订阅无 API Key 的用户

#### 3.1.2 Workflow 编排框架

- **LangGraph (Python)**：承载 9 个核心模块的状态机编排
- 必须支持：状态累积、条件分支（ConservativeMode）、人机交互（interrupt/resume）、Checkpointing 持久化

#### 3.1.3 核心 AI 能力矩阵

| 能力 | 实现方式 | 模型调用点 |
|---|---|---|
| JD 文本分块与分类 | LLM + 规则混合 | JDParser |
| 硬门槛抽取 | 规则 + LLM 辅助 | JDParser |
| 能力要求结构化 | LLM（抽象要求语义理解） | JDParser |
| 素材事实抽取 | LLM + 规则混合 | MaterialParser |
| 语义相似度计算 | Embedding / LLM 判断 | EvidenceMapper |
| 证据映射推理 | LLM（生成 reasoning 文本） | EvidenceMapper |
| 简历 Bullet 生成 | LLM + 强 Prompt 约束 | ConstrainedGenerator |
| 表达风险检测 | 规则库为主，LLM 辅助 | ExpressionGuard / RedlineDetector |
| 真实性校验 | 规则 + LLM 对比 | Validator |

### 3.2 Evaluation Strategy

#### 3.2.1 内部评测指标（自动化）

| 指标 | 定义 | 目标值 | 评测频率 |
|---|---|---|---|
| **硬门槛覆盖率** | 抽取的硬门槛占 JD 中实际硬门槛的比例 | ≥ 90% | 每次代码变更 |
| **Critical 要求覆盖率** | 有 evidence mapping 的 critical 要求占比 | ≥ 60% | 每次代码变更 |
| **红线拦截率** | 虚构/夸大/角色升级/时间虚构/关键词植入被拦截的比例 | ≥ 95% | 每次代码变更 |
| **素材事实溯源率** | 有 EvidenceRef 的 bullet 占总 bullet 比例 | 100% | 每次代码变更 |
| **生成耗时** | 服务端从接收到校验完成的 P95 耗时 | ≤ 180s | 每日监控 |

#### 3.2.2 回归测试套件

- **Baseline 样本回归**：使用 Baseline 阶段 12 个典型样本，验证输出质量评分不下降
- **评分维度**：真实性（40%）、岗位匹配度（30%）、表达质量（20%）、结构完整度（10%）
- **执行频率**：mock LLM 集成测试每次 CI 运行；真实 LLM 回归测试每周运行一次

#### 3.2.3 用户层面验证指标

| 指标 | 测量方式 | 目标值 |
|---|---|---|
| 用户确认通过率 | 用户认可或轻微修改后保留的 bullet 占比 | ≥ 70% |
| 修改到可投时间 | 用户从收到输出到认为"可以投递"的平均时间 | ≤ 15 分钟 |
| 重新生成触发率 | 用户拒绝 bullet 超过 50% 而触发重新生成的会话占比 | ≤ 20% |
| Gap 主动补充率 | 用户在 Gap 报告中选择"后续补充"或"我有但忘写了"的比例 | 追踪基线 |

#### 3.2.4 人工评测机制

- **双盲评分**：每轮迭代抽取 20 个生成样本，由 2 名标注员独立评分，计算 Cohen's Kappa 一致性
- **红线审计**：每月随机抽查 10% 的用户确认会话，检查 redline 是否被正确拦截
- **Bad Case 收集**：用户拒绝 bullet 时填写的理由自动进入 Bad Case 库，用于模型/规则优化

---

## 4. Technical Specifications

### 4.1 Architecture Overview

#### 4.1.1 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  Next.js 14+ (App Router) + TypeScript + Tailwind CSS       │
│  - 输入表单 / 确认界面 / 结果展示                             │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                      API Gateway                             │
│  FastAPI (Python)                                            │
│  - REST API (输入提交 / 状态查询)                             │
│  - WebSocket (流式生成 / 打字机效果)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Workflow Engine                            │
│  LangGraph StateGraph                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │JDParser │  │Material │  │Evidence │  │Constrai-│        │
│  │         │  │Parser   │  │Mapper   │  │ned Gen  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       └─────────────┴─────────────┘           │              │
│                    ┌────────────────────────────┘             │
│                    ▼                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ExprGuard│  │Redline  │  │Conserv. │  │Validator│        │
│  │         │  │Detector │  │Mode     │  │         │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       └─────────────┴─────────────┘           │              │
│                    ┌────────────────────────────┘             │
│                    ▼                                         │
│  ┌─────────┐  ┌─────────┐                                    │
│  │UserConf │  │Formatter│                                    │
│  │         │  │         │                                    │
│  └─────────┘  └─────────┘                                    │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Data & Storage                             │
│  - SQLite (用户数据 / LangGraph Checkpoint)                  │
│  - 本地文件系统 (Markdown 导出)                               │
└─────────────────────────────────────────────────────────────┘
```

#### 4.1.2 数据流

```
UserInput
  ├── UserProfile ──────→ ResumeDraft.sections[basic_info]
  ├── TargetJob ────────→ JDParsedResult ──────→ EvidenceMappingResult
  └── RawMaterial[] ────→ MaterialParseResult.facts[] ───┘
                                                            │
                                                            ▼
                                              ConstrainedGenerator
                                                            │
                                               ┌────────────┼────────────┐
                                               ▼            ▼            ▼
                                         ExpressionGuard  RedlineDetector ConservativeMode
                                               └────────────┬────────────┘
                                                            ▼
                                                       Validator
                                                            ▼
                                                    UserConfirmation (interrupt)
                                                            ▼
                                                       ResumeFormatter
                                                            ▼
                                                      ResumeOutput
```

#### 4.1.3 核心设计原则

1. **单向数据流**：模块间通过不可变数据对象传递，不共享可变状态
2. **失败传播**：模块失败时返回错误对象而非抛出异常，由编排器决定重试或降级
3. **审计链路**：每个模块输出保留对上游数据的引用 ID，确保端到端溯源
4. **并行执行**：JDParser 和 MaterialParser 无依赖，可并行执行

### 4.2 Integration Points

#### 4.2.1 LLM Provider 集成

```
┌─────────────────────────────────────────┐
│         LLM Provider Manager            │
│  - 路由分发   - 负载均衡   - 错误恢复    │
└──────────┬─────────────┬────────────────┘
           │             │
    ┌──────▼──────┐ ┌───▼─────┐
    │  Provider   │ │ Provider│
    │  Registry   │ │ Config  │
    │  (可用模型)  │ │ (用户配置)│
    └──────┬──────┘ └────┬────┘
           │             │
    ┌──────▼─────────────▼──────┐
    │      Adapter Layer         │
    │ ┌─────┐ ┌─────┐ ┌─────┐  │
    │ │GPT  │ │Kimi │ │GLM  │  │
    │ │适配器│ │适配器│ │适配器│  │
    │ └─────┘ └─────┘ └─────┘  │
    └───────────────────────────┘
```

- 每个适配器负责：Prompt 模板转换、输出格式兼容、成本估算、错误映射
- 支持用户自定义 Provider（第三方代理）

#### 4.2.2 OAuth 集成（ChatGPT）

- **流程**：Device Code Flow
  1. 用户点击"ChatGPT 登录"
  2. 系统向 OpenAI 请求 device_code
  3. 显示 URL + 一次性验证码给用户
  4. 用户在浏览器中输入验证码
  5. 系统轮询获取 access_token + refresh_token
  6. 加密存储 token，后续通过 ChatGPT backend-api 发送请求

#### 4.2.3 数据库与存储

| 数据类型 | 存储方式 | Schema |
|---|---|---|
| 用户配置（Provider、API Key、OAuth Token） | SQLite + AES-256-GCM 加密 | `UserPreferences` |
| LangGraph Checkpoint（workflow 状态） | SQLite (`SqliteSaver`) | LangGraph 原生状态 |
| 生成的简历（ResumeDraft、ResumeOutput） | SQLite + 本地文件系统 | `ResumeOutput` |
| 原始素材（RawMaterial） | SQLite | `RawMaterial` |

**迁移路径**：SQLite → PostgreSQL（后续多用户云端版时通过 SQLAlchemy 无缝切换）

### 4.3 Security & Privacy

#### 4.3.1 三层安全模型

**Layer 1: 传输安全**
- 全站 HTTPS（Vercel 自带 / Let's Encrypt）
- CORS：本地模式允许所有来源，云端模式仅允许前端域名

**Layer 2: 存储安全**
- API Key / OAuth Token：AES-256-GCM 加密，密钥派生自用户主密码
- KDF：PBKDF2-HMAC-SHA256 或 Argon2id，符合 OWASP 推荐参数
- 每条加密使用随机 salt（≥16 bytes）和随机 nonce（12 bytes，GCM 规范）
- 存储格式：JSON 结构化（salt + nonce + KDF 参数 + 密文 + 版本号）
- 用户数据文件权限：600（仅所有者可读写）

**Layer 3: 运行时安全**
- 后端不记录 LLM 请求/响应内容（仅记录元信息：时间、模型、token 数）
- API Key 仅在内存中使用，不写入日志
- 用户删除账号时彻底清除所有数据
- MVP 阶段不实现"忘记密码恢复"（主密码即加密密钥，无法重置）

#### 4.3.2 隐私合规

- **数据最小化**：仅采集生成简历所必需的信息
- **本地优先**：MVP 为本地部署工具，用户数据不上传至产品服务器
- **云端试用匿名化**：不收集用户真实身份信息，7 天后自动清除数据
- **用户知情权**：明确告知用户哪些数据被存储、用于什么目的

---

## 5. Risks & Roadmap

### 5.1 Phased Rollout

#### Phase 1: v0.1 Alpha — 核心工作流验证

**目标**：验证核心工作流是否可行，建立系统质量基线

**功能范围**：
- 核心 8 阶段工作流（输入 → 解析 → 映射 → 生成 → 校验 → 确认 → 输出）
- 9 个核心模块全部实现
- 1-2 家 LLM Provider（建议优先 Kimi + 1 家备用，降低集成复杂度）
- API Key 认证方式（OAuth 暂不实现）
- 最小可用 Web UI：输入表单 + 确认界面 + Markdown/JSON 输出
- 本地开发环境运行（Docker 可选，不做一键部署硬要求）
- SQLite 本地存储
- A2/B2/A6 模块 eval（ExpressionGuard / RedlineDetector / ConservativeMode 的自动化测试）

**成功标准**：
- 系统质量指标全部达成（Critical 覆盖率 ≥ 60%、红线拦截率 ≥ 95%、溯源率 100%、P95 ≤ 5 分钟）
- 12 个 Baseline 样本回归测试全部通过，评分不下降
- 核心模块单元测试覆盖 30-50 个 case

**时间线**：6-8 周

#### Phase 2: v1.0 Beta — 产品化与多模型支持

**目标**：补齐产品化能力，支持多模型，开放种子用户试用

**功能范围**（在 v0.1 Alpha 基础上增量交付）：
- 扩展至 7 家 LLM Provider（OpenAI / Kimi / GLM / DeepSeek / Claude / Qwen / Gemini）
- ChatGPT OAuth（Device Code 流程）
- 完整 Web UI：Editorial/Magazine 设计风格、证据可视化、三栏确认布局
- Docker Compose 一键本地部署
- 云端试用版（IP 限流 + 匿名化 + 7 天数据清除）
- Security Spec 审计通过
- 3-5 名种子用户端到端试用，收集用户体验指标基线

**成功标准**：
- 所有系统质量指标保持达标
- 用户体验指标达成或明确未达成原因（确认通过率 ≥ 70%、修改成本 ≤ 15 分钟）
- 无重大安全漏洞

**时间线**：10-12 周（含 v0.1 Alpha 的 6-8 周）

#### Phase 3: v1.1 — 迭代优化与体验提升

**目标**：基于 MVP 反馈优化生成质量，降低用户修改成本

**新增功能**：
- 多轮生成：用户基于第一版反馈做第二轮生成
- PDF/DOCX 导出
- 素材补全建议：系统主动建议用户补充哪些素材
- 用户确认界面优化：更直观的证据可视化

**成功标准**：
- 用户确认通过率从 70% 提升至 ≥ 80%
- 修改到可投时间从 15 分钟降至 ≤ 10 分钟

**时间线**：4 周

#### Phase 3: v1.2 — 扩展场景

**目标**：覆盖更多用户场景，提升产品粘性

**新增功能**：
- 多 JD 对比：同时输入多个 JD 生成通用版简历
- 版本管理：保存多个简历版本并支持对比
- 面试题预测：基于 JD 和简历预测可能面试问题
- 扩展岗位：从 AI 产品/开发岗扩展至其他技术岗

**成功标准**：
- 周活跃用户（WAU）达到可衡量基线
- 非 AI 岗位样本的生成质量评分 ≥ 75 分

**时间线**：6 周

#### Phase 4: v2.0 — 平台化

**目标**：从工具进化为求职工作流平台

**新增功能**：
- 自动投递集成（招聘平台 API）
- 团队协作/企业版
- 移动端原生 App
- 云端多用户版（PostgreSQL + 用户体系）

**时间线**：TBD（视前期数据决定）

### 5.2 Technical Risks

| 风险 | 严重性 | 可能性 | 缓解措施 |
|---|---|---|---|
| **LLM 输出不稳定** | 高 | 高 | 强化 Prompt 约束 + ExpressionGuard/RedlineDetector 规则兜底 + 用户确认作为最终守门人 |
| **LangGraph 学习曲线导致开发延迟** | 中 | 中 | 提前进行技术预研（2-3 天原型验证）；团队内部分享 LangGraph 核心概念 |
| **弱模型（GLM/DeepSeek）虚构风险高** | 高 | 高 | 不弱模型做系统层补偿，通过产品层标注 Baseline 评分 + 强化用户确认引导 |
| **ChatGPT OAuth 接口变更** | 中 | 中 | 抽象层隔离 adapter；社区跟踪 OpenCode 更新；提供 API Key 作为备选 |
| **云端试用成本超支** | 中 | 低 | 严格 IP 限流（每 IP 每天 3 次）；仅支持低成本国内模型；100 元/月预算上限 |
| **SQLite 性能瓶颈（并发/数据量）** | 低 | 低 | MVP 为本地单用户工具，并发压力极小；后续版本预留 PostgreSQL 迁移路径 |
| **加密实现漏洞** | 高 | 低 | 单独创建 Security Spec；必须经过代码审查；遵循 SEC-001 ~ SEC-007 约束 |
| **用户不信任 AI 生成内容** | 高 | 中 | 100% 素材溯源 + 证据来源展示 + 映射理由透明 + Gap 诚实披露 + 用户最终控制权 |

---

## 6. Appendix

### 6.1 术语表

| 术语 | 定义 |
|---|---|
| **Baseline** | 基线测试，用于评估现有方案的能力边界 |
| **Bullet** | 简历中的单条内容项，通常以项目符号开头 |
| **Checkpointing** | LangGraph 的状态持久化机制，每个步骤自动保存 |
| **Composite Mapping** | 多个弱素材事实组合支撑一个 JD 要求的映射方式 |
| **Evidence Mapping** | JD 要求与素材事实之间的结构化关联关系 |
| **Expression Level** | 表达强度：literal / conservative / standard / emphasized |
| **Gap** | 用户素材未能满足的 JD 要求 |
| **Level 2 (接近可投版)** | MVP 的目标输出：经过校验但仍需用户确认的简历版本 |
| **Level 3 (确认投递版)** | 用户在 Level 2 基础上完成确认和修改后的最终版本 |
| **Redline** | 涉及真实性底线的严重风险（虚构、夸大、角色升级等） |
| **Rewrite Chain** | 记录文本从原始素材到最终简历的每次变更及理由 |

### 6.2 相关文档索引

| 文档 | 路径 | 说明 |
|---|---|---|
| 问题定义 v1.0 | `product/requirements/问题定义 v1.0.md` | 核心任务定义、产品机会点、AI 适用性论证 |
| MVP 工作流设计 v0.1 | `product/designs/mvp-workflow-v0.1.md` | 端到端 8 阶段工作流详细设计 |
| 核心模块设计 v0.1 | `product/designs/core-modules-v0.1.md` | 9 个核心模块职责、接口、交互协议 |
| 数据结构规格 v0.1 | `product/specs/data-structures-v0.1.md` | 各阶段数据 Schema（TypeScript 接口定义） |
| ADR-001 技术架构 | `product/decisions/adr-001-mvp-architecture.md` | 7 项架构决策：LangGraph、多模型、Web 应用、SQLite、安全、测试、云端试用 |
| Baseline 综合分析报告 | `research/baseline/reports/Baseline 综合分析报告 v1.0.md` | 四类 baseline 评测结论 |

---

*文档版本: v1.0*  
*状态: Draft*  
*下次复审: MVP 开发启动前*