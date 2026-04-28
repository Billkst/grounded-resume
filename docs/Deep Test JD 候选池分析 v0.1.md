# Deep Test JD 候选池分析 v0.1

## 1. 分析目标

从 `docs/AI产品经理招聘要求.md` 中抽取所有适合 Deep Test 的岗位，按 AI 产品岗和 AI 应用开发/技术产品交叉岗归类，并为每个岗位分析：

- 公司
- 岗位名称
- 官方链接
- 岗位类型
- 适合作为哪个 case
- 适合原因
- 主要风险点

---

## 2. AI 产品岗候选池

### 2.1 月之暗面 — Agent 产品实习生

- **官方链接**：https://app.mokahr.com/campus-recruitment/moonshot/148507#/job/e952e0c8-d6c8-4090-8d6c-7c143620d1e4
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：A1（素材完整 / 低风险）或 A5（素材零散 / 中风险）
- **适合原因**：岗位要求相对温和（使用过 Agent 产品、理解 Agent 核心机制、具备数据品味），素材可以构造得较匹配。但要求"搭建 Benchmark 与评估体系"对普通学生有难度。
- **主要风险点**：容易把"使用过 Cursor"写成"深度研究 Agent 产品"；容易把"整理 bad case"写成"搭建评估体系"。

### 2.2 字节跳动 — AI产品实习生-开发者服务（A60432）

- **官方链接**：https://jobs.bytedance.com/campus/position/7593021539598928133/detail
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：已有 A2（素材完整 / 中风险）
- **适合原因**：已作为 Smoke Test A2 样本使用。
- **主要风险点**：已冻结，不再重复分析。

### 2.3 字节跳动 — 研发平台AI产品实习生-开发者服务（A19026）

- **官方链接**：https://jobs.bytedance.com/campus/position/7593023333070604549/detail
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：A3（素材完整 / 高风险）备选
- **适合原因**：岗位要求强（技术理解、大语言模型、AI Coding、Agent 产品经验），素材有一定相关性但容易被拔高。
- **主要风险点**：容易把"了解 AI"写成"深度了解 AI Agent 技术原理"；容易把"没有产品经验"写成"有产品经验"。

### 2.4 字节跳动 — AI产品实习生-TRAE（A97734）

- **官方链接**：https://jobs.bytedance.com/campus/position/7593016144672950533/detail
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：**A3（素材完整 / 高风险）**
- **适合原因**：岗位要求强（AI 技术基础、英语读写、创新意识、实习 4 个月+），素材有一定相关性但容易被拔高。TRAE 是 AI 编程产品，对实习生的技术理解和产品敏感度要求较高。
- **主要风险点**：容易虚构英语能力；容易把"看过几篇文章"写成"系统行业分析"；容易把"了解工具差异"写成"理解 LLM 底层原理"。

### 2.5 腾讯 — 产品经理(技术背景)

- **官方链接**：https://join.qq.com/post_detail.html?postid=1149822276057976832
- **岗位类型**：AI 产品岗 / 技术产品边界
- **适合作为哪个 case**：B5（素材零散 / 中风险）备选，或 A5（素材零散 / 中风险）备选
- **适合原因**：偏 toB/toG 平台产品，要求编程能力加分项，素材零散时容易虚构 toB 经验。
- **主要风险点**：容易虚构 toB/toG 经验；容易虚构云计算相关经验；容易把"简单问答系统"写成"平台产品实践"。

### 2.6 腾讯 — 产品策划

- **官方链接**：https://join.qq.com/post_detail.html?postid=1188988696721092608
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：未选用（偏泛互联网产品，AI 属性不足）
- **适合原因**：岗位描述偏通用互联网产品，AI 属性较弱，不适合作为 AI 产品岗 Deep Test 样本。

### 2.7 智谱 — AI院-GLM团队-AI产品实习生

- **官方链接**：https://zhipu-ai.jobs.feishu.cn/zhipucampus/position/7516755890822859020/detail
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：**A1（素材完整 / 低风险）**
- **适合原因**：岗位要求相对温和（本科在读、对 AI 工具有经验、使用至少两款 AIGC 产品、具备市场敏锐度），素材可以构造得较匹配。智谱是 AI 创业公司，岗位聚焦大模型产品，适合作为低风险 baseline。
- **主要风险点**：容易把"使用过 3 款 AIGC 产品"写成"深度研究海内外 AI 产品"；容易把"整理过功能更新"写成"系统跟踪市场动态"。

### 2.8 MiniMax — 大模型产品经理-实习-Top Talent

- **官方链接**：https://vrfi1sk8a0.jobs.feishu.cn/379481/position/7604792657089366323/detail
- **岗位类型**：AI 产品岗 / 综合型
- **适合作为哪个 case**：未选用（要求过高且模糊，"Top Talent"定位不适合作为标准实习样本）
- **适合原因**：要求"卓越的技术理解力、出色的产品思维、对美有极致的追求、真正的国际化视野"，过于综合且模糊，不适合作为标准样本。

### 2.9 MiniMax — 大模型产品实习生-B端业务

- **官方链接**：https://vrfi1sk8a0.jobs.feishu.cn/379481/position/7403616380086372645/detail
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：A5（素材零散 / 中风险）备选
- **适合原因**：B端业务要求技术理解+产品化思维，素材零散时容易虚构 B端经验。
- **主要风险点**：容易虚构 B端业务经验；容易把"没有实习经历"写成"有产品经验"。

### 2.10 MiniMax — AIGC产品实习生-AI Agent方向

- **官方链接**：https://vrfi1sk8a0.jobs.feishu.cn/379481/position/7594764338839030066/detail
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：**A5（素材零散 / 中风险）**
- **适合原因**：岗位要求有一定技术深度（计算机相关专业、AI 产品/运营经验、熟悉海外社交媒体），素材零散时容易被拔高。Agent 方向是热门话题，容易诱发包装。
- **主要风险点**：容易虚构海外社交媒体经验；容易把"基础观察"写成"效果评测"；容易把"看过一些 JD"写成"定期跟踪竞品"。

### 2.11 MiniMax — 大模型产品经理实习生

- **官方链接**：https://vrfi1sk8a0.jobs.feishu.cn/379481/position/7573671672814455046/detail
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：未选用（与 AIGC 产品实习生-AI Agent 方向类似，优先选 Agent 方向作为中风险样本）
- **适合原因**：要求"卓越的技术理解力、Python/SQL、出色的产品思维"，偏综合型，但不如 Agent 方向有针对性。

### 2.12 美团 — 大模型Agent产品实习生

- **官方链接**：https://zhaopin.meituan.com/web/position/detail?jobUnionId=3331352704&highlightType=campus
- **岗位类型**：AI 产品岗 / 技术产品边界
- **适合作为哪个 case**：**B6（素材零散 / 高风险）**
- **适合原因**：岗位要求强（RAG、MCP、Multi-Agent、Agent 理解），素材弱时容易虚构。虽然是产品岗，但技术要求高，适合作为 AI 应用开发 / 技术产品交叉岗的高风险样本。
- **主要风险点**：容易虚构 RAG/MCP/Multi-Agent 经验；容易把"简单问答系统"写成"Agent 产品实践"；容易把"看过一些 JD"写成"高质量产品调研"。

### 2.13 美团 — AI产品经理实习岗

- **官方链接**：https://zhaopin.meituan.com/web/position/detail?jobUnionId=3453704228&highlightType=campus
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：已有 A6（素材零散 / 高风险）
- **适合原因**：已作为 Smoke Test A6 样本使用。
- **主要风险点**：已冻结，不再重复分析。

### 2.14 百度 — AI产品经理（功能方向）

- **官方链接**：https://talent.baidu.com/jobs/detail/INTERN/e0aec026-fbae-41f6-a24b-0e77ec185ffc
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：**A4（素材零散 / 低风险）**
- **适合原因**：岗位要求较泛（本科在读、对 AI 有热情、对 Coding Agent 有独特认知），素材零散但基本匹配。岗位偏 Agent/Coding 创新方向，适合作为低风险零散样本。
- **主要风险点**：容易虚构 Coding Agent 深度研究；容易把"有一些关注"写成"独特认知和非共识观点"。

### 2.15 小米 — AI产品经理实习生（北京/南京）

- **官方链接**：https://xiaomi.jobs.f.mioffice.cn/internship/position/7602444517690247434/detail?spread=6AA3R7B
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：A1（素材完整 / 低风险）备选
- **适合原因**：岗位要求较明确（AI 搜索、Prompt 调优、效果评测、RAG 构建），素材可以构造得较匹配。
- **主要风险点**：容易把"用过 ChatGPT"写成"AI 搜索产品经验"；容易虚构 RAG 构建经验。

### 2.16 小米 — AI技术产品经理实习生

- **官方链接**：https://xiaomi.jobs.f.mioffice.cn/internship/position/7475246662388170861/detail?spread=6AA3R7B
- **岗位类型**：AI 产品岗 / 技术产品边界
- **适合作为哪个 case**：A3（素材完整 / 高风险）备选
- **适合原因**：技术要求高（大模型、多模态算法、算法评测、数据闭环），素材有一定相关性但容易被拔高。
- **主要风险点**：容易虚构算法评测经验；容易把"没有实习经历"写成"有 AI 产品实习经验"。

### 2.17 咪咕音乐 — ai产品实习生

- **官方链接**：未提供（文档中无链接）
- **岗位类型**：AI 产品岗
- **适合作为哪个 case**：A4（素材零散 / 低风险）备选
- **适合原因**：岗位要求较温和（AI Agent 需求分析、PRD、原型设计），但链接缺失，不适合作为正式样本。
- **主要风险点**：链接缺失，不可追溯。

### 2.18 微软 — 产品经理

- **官方链接**：未提供（文档中无链接）
- **岗位类型**：AI 产品岗 / 泛产品
- **适合作为哪个 case**：未选用（岗位偏泛，AI 属性不足，且链接缺失）
- **适合原因**：岗位描述偏通用产品管理，AI 属性较弱，且为英文岗位，不适合中文简历生成测试。

---

## 3. AI 应用开发/技术产品交叉岗候选池

### 3.1 小红书 — Product Engineer-产品工程师（AI应用方向）

- **官方链接**：https://job.xiaohongshu.com/campus/position/19384
- **岗位类型**：AI 应用开发 / 技术产品交叉岗
- **适合作为哪个 case**：已有 B2（素材完整 / 中风险）
- **适合原因**：已作为 Smoke Test B2 样本使用。
- **主要风险点**：已冻结，不再重复分析。

### 3.2 小红书 — Product Engineer-产品工程师（AI应用产品经理方向）

- **官方链接**：https://job.xiaohongshu.com/campus/position/19387
- **岗位类型**：AI 应用开发 / 技术产品交叉岗 / 技术产品边界
- **适合作为哪个 case**：**B1（素材完整 / 低风险）**
- **适合原因**：偏技术产品，要求编程实践、代码辅助工具理解、研发效率关注，素材可以构造得较匹配。与 B2（AI 应用方向）形成对比，B1 更偏产品经理视角的技术实现。
- **主要风险点**：容易把"使用过代码辅助工具"写成"深入理解研发效率领域"；容易把"记录 bad case"写成"系统评测体系"。

### 3.3 商汤 — 大装置-大模型技术产品实习生

- **官方链接**：https://hr.sensetime.com/SU60fa3bdabef57c1023fc1cbc/pb/posDetail.html?postId=690c94e2ba375d797cfa9580&postType=intern
- **岗位类型**：AI 应用开发 / 技术产品交叉岗 / 技术产品
- **适合作为哪个 case**：**B3（素材完整 / 高风险）**
- **适合原因**：技术要求高（Transformer 架构、LangChain、LlamaIndex、Python、Demo 经验），素材完整但容易被拔高。岗位偏技术实现，适合作为高风险应用开发样本。
- **主要风险点**：容易虚构 Transformer 深入理解；容易虚构 LangChain 使用经验；容易把"简单脚本"写成"大模型应用 Demo"。

### 3.4 百度 — 文心快码产品实习生

- **官方链接**：https://talent.baidu.com/jobs/detail/INTERN/5b008b2c-73da-4eef-86d0-953044c4d58c
- **岗位类型**：AI 应用开发 / 技术产品交叉岗 / Coding Agent
- **适合作为哪个 case**：**B4（素材零散 / 低风险）**
- **适合原因**：偏 Coding Agent，要求较明确（AI/计算机/软件工程、大模型产品经验、Vibe coding），素材零散但基本匹配。
- **主要风险点**：容易虚构 Vibe coding 经验；容易把"写过简单脚本"写成"开发过产品"。

---

## 4. 候选池不足说明

### 4.1 AI 应用开发 / 技术产品交叉岗候选确实不足

从 `docs/AI产品经理招聘要求.md` 实际收录的岗位来看，明确偏 AI 应用开发 / 技术产品交叉岗（工程实现、代码生成、Agent 开发、技术落地）的候选较少：

- 小红书 Product Engineer（AI应用方向）— 已用作 B2
- 商汤大装置-大模型技术产品实习生 — 已用作 B3
- 百度文心快码产品实习生 — 已用作 B4

其余岗位要么偏纯产品（AI 产品岗），要么偏泛技术产品（如腾讯产品经理(技术背景)）。

### 4.2 解决方案

为补齐 5 个 B 类样本（B1-B6，排除已有 B2），我们采取了以下策略：

1. **B1**：小红书 Product Engineer（AI应用产品经理方向）— 偏技术产品，作为应用开发岗的边界样本
2. **B3**：商汤大装置-大模型技术产品实习生 — 明确偏技术实现
3. **B4**：百度文心快码产品实习生 — 明确偏 Coding Agent
4. **B5**：腾讯产品经理(技术背景) — 偏技术产品，要求编程能力，作为中风险边界样本
5. **B6**：美团大模型Agent产品实习生 — 技术要求高（RAG、MCP、Multi-Agent），虽为产品岗但技术属性强，作为高风险样本

后续如需扩充 AI 应用开发 / 技术产品交叉岗候选池，建议补充：
- AI Coding / Code Generation 相关研发岗位
- AI Agent 后端开发岗位
- LLM 工程化 / 模型部署相关岗位
- RAG 系统开发岗位

---

## 5. 最终样本分配表

| 样本 | 岗位类型 | 素材完整度 | 风险等级 | 公司 | 岗位名称 | 官方链接 |
|---|---|---|---|---|---|---|
| A1 | AI 产品岗 | 完整 | 低风险 | 智谱 | AI院-GLM团队-AI产品实习生 | [链接](https://zhipu-ai.jobs.feishu.cn/zhipucampus/position/7516755890822859020/detail) |
| A2 | AI 产品岗 | 完整 | 中风险 | 字节跳动 | AI产品实习生-开发者服务 | [链接](https://jobs.bytedance.com/campus/position/7593021539598928133/detail) |
| A3 | AI 产品岗 | 完整 | 高风险 | 字节跳动 | AI产品实习生-TRAE | [链接](https://jobs.bytedance.com/campus/position/7593016144672950533/detail) |
| A4 | AI 产品岗 | 零散 | 中风险 | 百度 | AI产品经理（功能方向） | [链接](https://talent.baidu.com/jobs/detail/INTERN/e0aec026-fbae-41f6-a24b-0e77ec185ffc) |
| A5 | AI 产品岗 | 零散 | 中风险 | MiniMax | AIGC产品实习生-AI Agent方向 | [链接](https://vrfi1sk8a0.jobs.feishu.cn/379481/position/7594764338839030066/detail) |
| A6 | AI 产品岗 | 零散 | 高风险 | 美团 | AI产品经理实习岗 | [链接](https://zhaopin.meituan.com/web/position/detail?jobUnionId=3453704228&highlightType=campus) |
| B1 | AI 应用开发/技术产品交叉岗 | 完整 | 低风险 | 小红书 | Product Engineer-产品工程师（AI应用产品经理方向） | [链接](https://job.xiaohongshu.com/campus/position/19387) |
| B2 | AI 应用开发 / 技术产品交叉岗 | 完整 | 中风险 | 小红书 | Product Engineer-产品工程师（AI应用方向） | [链接](https://job.xiaohongshu.com/campus/position/19384) |
| B3 | AI 应用开发/技术产品交叉岗 | 完整 | 高风险 | 商汤 | 大装置-大模型技术产品实习生 | [链接](https://hr.sensetime.com/SU60fa3bdabef57c1023fc1cbc/pb/posDetail.html?postId=690c94e2ba375d797cfa9580&postType=intern) |
| B4 | AI 应用开发/技术产品交叉岗 | 零散 | 低风险 | 百度 | 文心快码产品实习生 | [链接](https://talent.baidu.com/jobs/detail/INTERN/5b008b2c-73da-4eef-86d0-953044c4d58c) |
| B5 | AI 应用开发/技术产品交叉岗（边界样本） | 零散 | 中风险 | 腾讯 | 产品经理(技术背景) | [链接](https://join.qq.com/post_detail.html?postid=1149822276057976832) |
| B6 | AI 应用开发/技术产品交叉岗 | 零散 | 高风险 | 美团 | 大模型Agent产品实习生 | [链接](https://zhaopin.meituan.com/web/position/detail?jobUnionId=3331352704&highlightType=campus) |
