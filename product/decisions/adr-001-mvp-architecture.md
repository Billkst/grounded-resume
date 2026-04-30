# ADR-001: MVP 技术架构与部署策略

> **Status**: Accepted  
> **Date**: 2026-04-29  
> **Deciders**: grounded-resume 核心团队  
> **Affected**: 全部 MVP 开发工作流

---

## 1. 背景与上下文

### 1.1 产品定位

grounded-resume 是一款面向中文实习求职者的**第一版简历生成系统**。核心任务是：

> 基于目标岗位 JD 和用户提供的原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历。

### 1.2 前置决策

本 ADR 建立在以下已完成的产品决策之上：

- **问题定义 v1.0**：核心任务、目标用户、三个断点、产品机会点
- **Baseline 综合分析报告 v1.0**：四类 baseline 评测结论，确认现有方案无法完整覆盖核心任务
- **MVP 工作流设计 v0.1**：8 个阶段的端到端流程
- **核心模块设计 v0.1**：9 个核心模块的职责与接口
- **数据结构规格 v0.1**：各阶段数据 Schema

### 1.3 本 ADR 需要回答的问题

1. 用什么框架编排 9 个核心模块的 workflow？
2. 支持哪些 LLM 基座模型？用户如何选择？ChatGPT OAuth 是否实现？
3. 产品以什么形态部署？前端用什么技术栈？
4. 用户数据（配置、素材、简历）存储在哪里？
5. API Key、OAuth Token 等敏感信息如何保护？
6. MVP 阶段的测试策略是什么？
7. 是否提供云端试用？试用策略是什么？

---

## 2. 决策项 1：AI 编排框架

### 2.1 决策

**采用 LangGraph（Python）作为 workflow 编排框架。**

### 2.2 理由

我们的 MVP workflow 不是简单的函数管道，而是具有**状态累积、条件分支、人机交互、持久化**特征的复杂状态机：

| 特征 | MVP 中的体现 |
|---|---|
| 状态累积 | 阶段 3（证据映射）需要同时访问阶段 1（JD 解析）和阶段 2（素材解析）的结果 |
| 条件分支 | ConservativeMode 根据 `evidence coverage < 30%` 触发不同生成策略 |
| 人机交互 | 用户确认阶段可能需要数分钟甚至数小时 |
| 审计追溯 | 需要知道"阶段 4 为什么把这段素材降级了" |
| 容错恢复 | 用户确认过程中服务重启，需要恢复进度 |

LangGraph 的 5 个核心匹配点：

1. **StateGraph 完美承载数据架构**：`data-structures-v0.1.md` 中定义的 8 个核心数据结构（UserInput → ResumeOutput）正好作为 Graph 的 State 在各个节点间传递
2. **Checkpointing = 天然审计链路**：每个 super-step 自动保存完整状态快照，支持时间旅行调试
3. **Human-in-the-loop 解决用户确认难题**：`interrupt` 机制暂停图执行，用户确认后通过 `Command(resume=...)` 恢复
4. **Conditional Edges 处理分支逻辑**：`add_conditional_edges` 根据 evidence coverage 决定走 normal / conservative / minimal 分支
5. **线程隔离支持多用户**：每个用户的简历生成会话是一个独立的 `thread_id`

### 2.3 排除的备选方案

| 方案 | 排除原因 |
|---|---|
| 纯代码编排（函数链） | 9 个模块 + 分支 + 人机交互 + 持久化，最终会重新实现一个轻量版状态机 |
| OpenAI Agents SDK | 供应商锁定严重，抽象层级过高，对"受约束 workflow"场景束缚控制力 |
| 自定义轻量框架 | LangGraph 已解决 90% 的问题（状态管理、持久化、人机交互），自定义框架维护成本不划算 |

### 2.4 风险与应对

| 风险 | 应对 |
|---|---|
| 学习曲线 | LangGraph 概念（State、Node、Edge、Checkpoint）与模块设计天然对应，学习成本主要是 API 熟悉度 |
| 过度设计 | 我们的 workflow 确实复杂（9 模块、分支、人机交互），LangGraph 的复杂度与问题复杂度匹配 |
| LangChain 生态批评 | LangGraph 是独立的低层编排框架，不强制使用 LangChain 的链式抽象，可只用 `langgraph` + 直接调用 LLM API |

---

## 3. 决策项 2：LLM 基座模型

### 3.1 决策

**采用多模型支持策略：**

1. **用户自选模型**：用户根据自己所拥有的 API Key 选择模型
2. **Provider Preset 系统**：内置 7 家厂商 + 第三方代理的预设配置，一键切换
3. **ChatGPT OAuth 必须实现**：支持 Device Code 流程，让只有 ChatGPT Plus 订阅的用户也能使用
4. **不对弱模型做系统层补偿**：所有模型统一使用同一套约束规则，不在系统层为弱模型增加特殊逻辑

### 3.2 理由

**用户自选模型的必要性**：
- 有的用户只有 Kimi API Key，Kimi 就是唯一选择
- 有的用户有 OpenAI API Key，希望使用 GPT-5.5
- 有的用户只有 ChatGPT Plus 订阅，没有 API Key

**Baseline 测试结论**：
- ChatGPT 是唯一强 baseline（84.7 分，0 红线）
- GLM / DeepSeek 在高风险样本中不稳定（虚构风险高）
- 但 Baseline 测试是 Web 端输入，API 效果可能存在差异

**不对弱模型补偿的判断**：
- 补偿机制增加系统复杂度
- 模型在持续迭代，今天的弱模型明天可能变强
- 通过产品层标注 Baseline 评分 + 强化用户确认引导来应对质量差异

### 3.3 Provider Preset 配置

截至 **2026-04-29** 的最新模型：

| 厂商 | 最新模型 | API 标识 | 发布日期 | 价格（每 1M tokens） |
|---|---|---|---|---|
| **OpenAI** | GPT-5.5 | `gpt-5.5` | 2026-04-23 | $5 / $30 |
| **OpenAI** | GPT-5.5 Pro | `gpt-5.5-pro` | 2026-04-23 | $30 / $180 |
| **OpenAI** | GPT-5.4 mini | `gpt-5.4-mini` | 2026-03-17 | $0.75 / $4.50 |
| **Kimi** | Kimi K2.6 | `kimi-k2.6` | 2026-04-20 | ¥0.95 / ¥4.00 |
| **Kimi** | Kimi K2.5 | `kimi-k2.5` | 2026-01-27 | ¥0.60 / ¥3.00 |
| **GLM** | GLM-5.1 | `glm-5.1` | ~2026-04 | ¥6 / ¥24 |
| **DeepSeek** | DeepSeek-V4 Pro | `deepseek-v4-pro` | 2026-04-24 | ¥1 / ¥2 |
| **Qwen** | Qwen3.5-Flash | `qwen3.5-flash-2026-02-23` | 2026-02-23 | $0.029 / $0.287 |
| **Claude** | Claude Opus 4.7 | `claude-opus-4-7` | 2026-04-16 | $5 / $25 |
| **Gemini** | Gemini 3.1 Flash Live | `gemini-3.1-flash-live-preview` | 2026-03-26 | $0.75 / $4.50 |

### 3.4 ChatGPT OAuth 实现方案

参考 OpenCode 的实现，采用 **Device Code 流程**：

1. 用户点击"ChatGPT 登录"
2. 系统向 OpenAI 请求 device_code
3. 显示 URL + 一次性验证码给用户
4. 用户在手机/其他设备浏览器中输入验证码
5. 系统轮询获取 access_token + refresh_token
6. 保存加密后的 token，后续通过 ChatGPT backend-api 发送请求

**风险应对**：
- 接口稳定性风险：通过抽象层隔离，变化时只改 adapter；社区跟踪 OpenCode 更新
- Token 过期风险：自动刷新机制，refresh_token 同样加密存储

### 3.5 适配器架构

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

每个适配器负责：Prompt 模板转换、输出格式兼容、成本估算、错误映射。

---

## 4. 决策项 3：部署形态与交互方式

### 4.1 决策

**采用 Web 应用形态，前后端分离架构：**

- **前端**：Next.js (App Router) + TypeScript + Tailwind CSS
- **后端**：FastAPI + LangGraph (Python)
- **设计风格**：Editorial/Magazine + Soft/Pastel（杂志编辑感 + 柔和色调）

### 4.2 理由

Web 应用在以下维度全面优于 CLI 和桌面应用：

| 维度 | Web 应用优势 |
|---|---|
| 用户确认体验 | 可以展示证据来源高亮、映射关系可视化、风险提示卡片 |
| 证据展示 | 原文片段高亮、JD 要求 ↔ 素材 ↔ 简历表达 三栏对比 |
| 用户门槛 | 打开浏览器即用，零安装 |
| 传播性 | 链接分享、SEO、社交传播 |
| 开发效率 | 前端生态成熟，组件丰富 |

### 4.3 技术栈详情

**前端**：
- **框架**：Next.js 14+ (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **UI 组件**：Shadcn/ui（基于 Radix UI）
- **动画**：Framer Motion
- **状态管理**：Zustand（轻量）+ React Query / SWR（服务端状态）
- **字体**：Noto Serif SC（标题）+ Playfair Display（英文装饰）+ 系统字体栈（正文）

**后端**：
- **框架**：FastAPI
- **Workflow**：LangGraph
- **数据验证**：Pydantic（与 FastAPI 天然集成，直接使用 `data-structures-v0.1.md` 中的 Schema）

### 4.4 设计风格

**方向**：Editorial/Magazine + Soft/Pastel

**概念**：把"写简历"这个焦虑场景转化为"编辑一本关于自己的杂志"的仪式感。

**核心设计 token**：

```css
--color-bg-primary: #FDFCF8;      /* 奶油色/象牙白 - 主背景 */
--color-bg-secondary: #F5F3EE;    /* 暖灰 - 卡片背景 */
--color-text-primary: #2D2D2D;    /* 深炭色 - 主标题 */
--color-accent: #C67B5C;          /* 陶土色 - CTA、高亮 */
--color-success: #8B9D83;         /* 鼠尾草绿 - 强证据 */
--color-warning: #D4A373;         /* 琥珀色 - 弱证据/风险 */
--color-danger: #C97B7B;          /* 柔和红 - 虚构/红线 */

--font-display: 'Noto Serif SC', serif;  /* 中文标题 */
--font-display-en: 'Playfair Display', serif;  /* 英文装饰 */
--font-body: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;  /* 正文 */
```

**关键界面**：
- **首页**：杂志封面感，大标题 + 优雅的分步表单
- **确认界面**：三栏布局（简历表达 | 证据来源 | 映射分析），原文高亮，进度指示
- **证据映射表**：表格或卡片形式，颜色编码（绿/黄/橙/红）
- **Gap 报告**：卡片式布局，温和的视觉提示

### 4.5 前后端通信

- **HTTP REST**：单次请求-响应（JD 解析、素材解析、证据映射）
- **WebSocket**：流式生成（简历逐条生成，打字机效果）
- **CORS**：本地模式允许所有来源，云端模式仅允许 Vercel 域名

---

## 5. 决策项 4：数据存储

### 5.1 决策

**采用 SQLite（本地文件）作为 MVP 阶段的数据存储，分层存储策略。**

### 5.2 存储分层

| 数据类型 | 存储方式 | 说明 |
|---|---|---|
| 用户配置（Provider、API Key、OAuth Token） | SQLite + AES-256 加密 | 本地加密存储 |
| LangGraph Checkpoint（workflow 状态） | SQLite | LangGraph 原生 `SqliteSaver` |
| 生成的简历（ResumeDraft、ResumeOutput） | SQLite + 本地文件系统 | Markdown 文件导出 |
| 原始素材（RawMaterial） | SQLite | 文本内容直接存储 |

### 5.3 理由

| 因素 | SQLite 优势 |
|---|---|
| MVP 阶段 | 零配置、零运维、单文件即可运行 |
| LangGraph 兼容 | 官方提供 `SqliteSaver`，checkpoint 持久化开箱即用 |
| 用户隐私 | 本地存储，用户数据不上云，降低隐私合规风险 |
| 迁移路径 | 后续需要云端多用户时，SQLAlchemy 支持无缝切换 PostgreSQL |
| 备份简单 | 单文件 `grounded-resume.db`，用户可自行备份 |

### 5.4 排除 PostgreSQL 的原因

MVP 阶段引入 PostgreSQL 意味着需要：服务器运维、备份策略、连接池管理。对于个人工具属性的产品，这属于过度设计。

---

## 6. 决策项 5：安全策略

### 6.1 决策

**采用三层安全模型。**

### 6.2 三层安全架构

**Layer 1: 传输安全**
- 全站 HTTPS（Vercel 自带 + 后端 Let's Encrypt）
- CORS 限制（本地模式允许所有来源，云端模式仅允许前端域名）

**Layer 2: 存储安全**
- API Key: AES-256-GCM 加密，密钥派生自用户主密码
- OAuth Token: 同上，额外存储 refresh_token 和过期时间
- 用户数据: SQLite 文件权限 600（仅所有者可读写）

**Layer 3: 运行时安全**
- 后端不记录任何 LLM 请求/响应内容（仅记录元信息：时间、模型、token 数）
- API Key 仅在内存中使用，不写入日志
- 用户删除账号时，彻底清除所有数据

### 6.3 密钥管理

```python
from cryptography.fernet import Fernet
import hashlib, base64

def get_user_key(master_password: str) -> bytes:
    """从用户主密码派生加密密钥"""
    key = hashlib.pbkdf2_hmac('sha256', master_password.encode(), b'salt', 100000)
    return base64.urlsafe_b64encode(key)

def encrypt_api_key(api_key: str, master_password: str) -> str:
    key = get_user_key(master_password)
    f = Fernet(key)
    return f.encrypt(api_key.encode()).decode()
```

**注意**：MVP 阶段不实现"忘记密码恢复"，因为主密码即加密密钥，无法重置。

---

## 7. 决策项 6：测试策略

### 7.1 决策

**采用三层测试金字塔（MVP 精简版）。**

### 7.2 测试分层

```
         ┌─────────┐
         │  E2E    │  ← 3-5 个核心流程（Baseline 样本回归）
         │  回归   │     验证：端到端生成质量不退化
         └────┬────┘
              │
         ┌────┴────┐
         │  集成   │  ← 9 个模块的集成测试（mock LLM）
         │  测试   │     验证：workflow 状态流转正确
         └────┬────┘
              │
         ┌────┴────┐
         │  单元   │  ← ExpressionGuard、RedlineDetector 规则
         │  测试   │     验证：降级规则、红线拦截逻辑正确
         └─────────┘
```

### 7.3 测试分配

| 测试类型 | 覆盖范围 | 工具 | 数量目标 |
|---|---|---|---|
| **单元测试** | ExpressionGuard 降级规则、RedlineDetector 红线规则、EvidenceMapper 映射逻辑 | pytest | 30-50 个 case |
| **集成测试** | LangGraph workflow 各节点状态流转、checkpoint 恢复、错误分支 | pytest + mock LLM | 10-15 个 case |
| **回归测试** | 用 Baseline 的 12 个样本输入，验证输出质量评分不下降 | 自定义 eval 脚本 | 12 个 case |

### 7.4 理由

- **MVP 资源有限**：不写前端单元测试（靠集成测试覆盖），重点保证后端核心逻辑
- **质量底线**：回归测试必须跑，确保每次代码变更不会破坏 Baseline 能力
- **快速反馈**：mock LLM 的集成测试在本地 30 秒内跑完，开发体验好
- **真实验证**：回归测试用真实 LLM API（每周跑一次，不是每次 CI），验证实际效果

---

## 8. 决策项 7：云端试用策略

### 8.1 决策

**提供云端试用版，采用"真实 LLM 生成 + 严格限流 + 完全匿名"策略。**

### 8.2 试用版参数

| 限制项 | 策略 | 目的 |
|---|---|---|
| **每日生成次数** | 每个 IP 每天最多 3 次生成 | 防止恶意刷量 |
| **素材字数限制** | 单次素材不超过 2000 字 | 降低 token 消耗 |
| **模型限制** | 试用版仅支持 Kimi / GLM / DeepSeek（国内低成本模型） | 控制成本 |
| **无 OAuth** | 试用版不支持 ChatGPT 登录 | 简化实现、降低成本 |
| **无导出** | 试用版不能导出简历，只能预览 | 激励用户部署本地版 |
| **数据保留** | 7 天后自动清除所有用户数据 | 减少存储成本、保护隐私 |

### 8.3 成本测算

以 **Kimi K2.6** 为例：

| 项目 | 消耗 | 单价 | 单次成本 |
|---|---|---|---|
| JD 解析 | ~2K tokens input | ¥0.95/1M | ¥0.0019 |
| 素材解析 | ~3K tokens input | ¥0.95/1M | ¥0.00285 |
| 生成阶段 | ~2K input + 1K output | ¥0.95/1M + ¥4/1M | ¥0.0059 |
| **单次总计** | **~8K tokens** | - | **~¥0.0107** |

**预算推演**：
- 100 RMB / ¥0.0107 ≈ **9,300 次生成/月**
- 限制每 IP 每天 3 次 → 每 IP 每月最多 90 次
- **可支持约 100-300 个独立 IP 试用**（假设平均每个用户试用 3-10 次）

**结论**：100 RMB/月预算完全可行。

### 8.4 IP 限流方案

```python
from datetime import datetime, timedelta
from collections import defaultdict

class IPRateLimiter:
    def __init__(self):
        self.storage = defaultdict(lambda: {"count": 0, "reset_at": datetime.now() + timedelta(days=1)})
    
    def is_allowed(self, ip: str) -> bool:
        record = self.storage[ip]
        if datetime.now() > record["reset_at"]:
            record["count"] = 0
            record["reset_at"] = datetime.now() + timedelta(days=1)
        if record["count"] >= 3:
            return False
        record["count"] += 1
        return True
```

### 8.5 双模式架构

同一套代码通过 `DEPLOYMENT_MODE` 环境变量切换：

```typescript
// 前端运行时检测
const IS_CLOUD_DEMO = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'cloud'

export const config = {
  showLimitBanner: IS_CLOUD_DEMO,
  enableExport: !IS_CLOUD_DEMO,
  supportedProviders: IS_CLOUD_DEMO 
    ? ['kimi', 'glm', 'deepseek'] 
    : ['openai', 'kimi', 'glm', 'deepseek', 'claude', 'qwen', 'gemini', 'third_party'],
  enableOAuth: !IS_CLOUD_DEMO,
}
```

---

## 9. 技术栈总览

| 层级 | 技术 | 用途 |
|---|---|---|
| **前端框架** | Next.js 14+ (App Router) | React 全栈框架 |
| **前端语言** | TypeScript | 类型安全 |
| **前端样式** | Tailwind CSS + Shadcn/ui |  utility-first CSS + 无锁组件库 |
| **前端状态** | Zustand + React Query | 轻量状态管理 + 服务端状态缓存 |
| **前端动画** | Framer Motion | 声明式动画 |
| **后端框架** | FastAPI | Python Web 框架 |
| **Workflow** | LangGraph | 状态机编排 |
| **数据验证** | Pydantic | Schema 验证（前后端共用） |
| **数据存储** | SQLite | 本地文件数据库 |
| **加密** | cryptography (AES-256-GCM) | API Key / Token 加密 |
| **容器化** | Docker + Docker Compose | 本地一键部署 |
| **前端托管** | Vercel | 自动 CI/CD、全球 CDN |
| **后端托管** | 云服务器（Docker） | Python 环境运行 |

---

## 10. 部署架构图

### 10.1 本地自托管模式

```
用户电脑
├── docker-compose up
│   ├── frontend (Next.js) → http://localhost:3000
│   └── backend (FastAPI + LangGraph) → http://localhost:8000
│       └── SQLite (./data/grounded-resume.db)
└── 用户自有 API Key
```

### 10.2 云端试用模式

```
用户浏览器
    ↓ HTTPS
Vercel（前端 Next.js）
    ↓ HTTPS
云服务器（后端 FastAPI + LangGraph）
    ├── SQLite（云端实例，7 天清数据）
    └── IPRateLimiter（内存级限流）
    ↓
LLM API（Kimi / GLM / DeepSeek，平台承担费用）
```

---

## 11. 附录 A：本地部署命令

### 11.1 Docker Compose 一键部署

```bash
# 步骤 1：克隆仓库
git clone https://github.com/yourname/grounded-resume.git
cd grounded-resume

# 步骤 2：配置 API Key
cp .env.example .env
# 编辑 .env，填入自己的 API Key

# 步骤 3：启动
docker-compose up -d

# 访问 http://localhost:3000
```

### 11.2 无 Docker 纯本地开发

```bash
# 前端（终端 1）
cd frontend && npm install && npm run dev

# 后端（终端 2）
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# 访问 http://localhost:3000
```

---

## 12. 附录 B：Provider Preset 模型列表（2026-04-29）

| 厂商 | 认证方式 | 预设模型 | API 标识 | 发布日期 |
|---|---|---|---|---|
| **OpenAI** | API Key + OAuth | GPT-5.5 | `gpt-5.5` | 2026-04-23 |
| **OpenAI** | API Key + OAuth | GPT-5.5 Pro | `gpt-5.5-pro` | 2026-04-23 |
| **OpenAI** | API Key + OAuth | GPT-5.4 mini | `gpt-5.4-mini` | 2026-03-17 |
| **Kimi** | API Key | Kimi K2.6 | `kimi-k2.6` | 2026-04-20 |
| **Kimi** | API Key | Kimi K2.5 | `kimi-k2.5` | 2026-01-27 |
| **GLM** | API Key | GLM-5.1 | `glm-5.1` | ~2026-04 |
| **GLM** | API Key | GLM-5 | `glm-5` | - |
| **DeepSeek** | API Key | DeepSeek-V4 Pro | `deepseek-v4-pro` | 2026-04-24 |
| **DeepSeek** | API Key | DeepSeek-V4 Flash | `deepseek-v4-flash` | 2026-04-24 |
| **Qwen** | API Key | Qwen3.5-Flash | `qwen3.5-flash-2026-02-23` | 2026-02-23 |
| **Qwen** | API Key | Qwen3-Max | `qwen3-max-2026-01-23` | 2026-01-23 |
| **Claude** | API Key | Claude Opus 4.7 | `claude-opus-4-7` | 2026-04-16 |
| **Gemini** | API Key | Gemini 3.1 Flash Live | `gemini-3.1-flash-live-preview` | 2026-03-26 |
| **第三方代理** | API Key | 自定义 | 用户填写 | - |

---

## 13. 附录 C：成本测算汇总

### 13.1 云端试用版月度预算

| 项目 | 费用 | 说明 |
|---|---|---|
| Vercel Pro | $0 | 免费额度足够 |
| 云服务器（1C2G） | ~50 元/月 | 跑后端 + SQLite |
| LLM API（Kimi/GLM） | ~50 元/月 | 约 5,000 次生成 |
| **总计** | **~100 元/月** | 符合预算上限 |

### 13.2 用户自托管成本

| 项目 | 费用 | 说明 |
|---|---|---|
| 服务器 | 0 元 | 用户自有电脑 |
| LLM API | 用户自负 | 按实际调用量计费 |
| **总计** | **0 元** | 仅需用户自有 API Key |

---

## 14. 附录 D：术语表

| 术语 | 定义 |
|---|---|
| **ADR** | Architecture Decision Record，架构决策记录 |
| **Baseline** | 基线测试，用于评估现有方案的能力边界 |
| **Checkpointing** | LangGraph 的状态持久化机制，每个步骤自动保存 |
| **Device Code** | OAuth 2.0 的一种流程，适用于无浏览器或输入受限的设备 |
| **Human-in-the-loop** | 人机交互，workflow 暂停等待用户输入后恢复 |
| **MVP** | Minimum Viable Product，最小可行产品 |
| **Provider Preset** | 预配置的 LLM 厂商接入模板 |
| **StateGraph** | LangGraph 的核心抽象，定义状态、节点和边 |

---

## 15. 相关文档

| 文档 | 路径 | 说明 |
|---|---|---|
| 问题定义 v1.0 | `product/requirements/问题定义 v1.0.md` | 核心任务定义 |
| Baseline 综合分析报告 | `research/baseline/reports/Baseline 综合分析报告 v1.0.md` | 四类 baseline 评测结论 |
| MVP 工作流设计 | `product/designs/mvp-workflow-v0.1.md` | 端到端工作流 |
| 核心模块设计 | `product/designs/core-modules-v0.1.md` | 9 个模块职责与接口 |
| 数据结构规格 | `product/specs/data-structures-v0.1.md` | 各阶段数据 Schema |

---

*文档版本: v1.0*  
*状态: Accepted*  
*创建日期: 2026-04-29*  
*下次复审: MVP 开发完成时*
