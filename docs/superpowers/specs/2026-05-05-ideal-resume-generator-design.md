# 理想简历生成器 产品设计文档

> **Status**: Draft
> **Date**: 2026-05-05
> **Product**: 理想简历生成器 — 一键生成"理想候选人画像简历" + "差距分析报告"

---

## 1. 产品定位

### 核心任务

用户选择求职阶段、目标岗位、粘贴简要履历和JD，系统一键生成两份交付物：

1. **理想版简历**：基于JD反推的"该岗位理想候选人应该长什么样"，不受用户当前真实经历约束
2. **差距分析报告**：对比用户履历 vs 理想候选人画像，按三层差距模型指出用户"还差什么"

### 与当前系统的根本区别

当前grounded-resume v1.0的定位是"约束型真实生成"——只使用用户已有素材，每条bullet必须可溯源。新定位是"理想画像 + 差距分析"——简历代表目标，差距报告告诉用户离目标还有多远。

### 一句话定义

基于目标岗位JD反推理想候选人画像，一键生成完美简历和差距分析报告。

---

## 2. 用户输入

### 输入字段

| 字段 | 类型 | 说明 | 预选值 |
|---|---|---|---|
| experience_level | 枚举 | 实习/应届、1-3年、3-5年、5-10年、10年以上 | 实习/应届 |
| target_role | 文本 | 自由输入，配合快速选择标签 | "AI产品经理（实习）" |
| background | 文本域 | 自由填写，口语化即可，预填placeholder引导 | placeholder示例文本 |
| jd_text | 文本域 | JD原文粘贴 | placeholder引导文本 |

### 快速选择标签（10个）

AI产品经理、产品经理、后端工程师、前端工程师、算法/机器学习工程师、数据分析师、用户运营、UI/UX设计师、项目经理、管培生

交互规则：
- 点击标签 → 输入框同步填入岗位名（+实习/应届后缀如适用），该标签高亮
- 手动修改输入框 → 所有标签取消高亮
- 切换求职阶段 → 匹配标签则保持高亮并更新后缀，否则仅更新后缀

### LLM配置（折叠区）

用户选择厂商/模型并填入API Key，默认DeepSeek V4 Pro。

---

## 3. 系统架构

### 整体结构

```
POST /api/generate             → 202 {session_id}
GET  /api/generate/{session_id} → 200 {status, result} | 202

POST /api/job-profile          → 202 {profile_id}     （可选，JD预解析缓存）
GET  /api/job-profile/{id}     → 200 {job_profile}

传递 job_profile_id 时跳过岗位画像步骤，直接使用已有画像生成简历和差距报告。
```

### 三个核心模块

**模块1：岗位画像引擎**

输入：目标岗位名称 + JD原文
输出：结构化岗位画像JSON
- hard_requirements：硬门槛列表
- core_capabilities：核心能力要求（含权重）
- bonus_points：加分项
- ats_keywords：关键词体系（high/medium）
- ideal_candidate_profile：200字理想候选人概述

**模块2：理想简历生成器**

输入：岗位画像 + 岗位名称 + 经验年限
输出：理想候选人简历Markdown + JSON sections（basic_info / summary / skills / experience / education）
- 人物为虚构的理想人设，不受用户真实素材约束
- 每条经历遵循STAR法则，含可量化结果
- 前端显著标注"该简历为理想目标画像，非当前可投递版本"

**模块3：差距分析引擎**

输入：岗位画像 + 用户简要履历 + 理想简历
输出：三层差距报告

### 三层差距模型

**第一层：致命差距（Blockers）**
- JD硬门槛，不满足则初筛被卡
- 每条包含：缺什么 → 为什么致命 → 替代方案

**第二层：核心差距（Critical Gaps，≤5条）**
- 补上后简历竞争力明显提升的差距
- 每条包含：理想版写什么 → 当前状态 → 补足路径（具体可执行） → 预计时间

**第三层：表达优化（Expression Tips）**
- 用户有的经历但表达不够专业
- 每条包含：原始写法 → 升级写法 → 升级方法

**总览卡片**：综合匹配度百分比 + 一句话建议（"现在能投吗 / 什么时候能投"）

### 去掉的东西

以下当前系统的模块在MVP中全部移除：
- 素材解析（MaterialParser）、证据映射（EvidenceMapper）、约束生成（ConstrainedGenerator）
- 表达检查/红线检测/真实性校验
- 用户确认流程（Confirmation Queue）
- LangGraph工作流编排
- 7厂商适配器等保留但不做大改

---

## 4. LLM调用策略

### 调用链路

```
调用1: 岗位画像（独立，可缓存）
    ↓
调用2 + 调用3: 并行
    ├── 理想简历生成
    └── 差距分析
```

共3次调用，其中2次可并行。总耗时取决于最慢的那次（简历生成），预估30-60秒。

### Prompt管理

外部化存储，独立于代码：

```
prompts/
├── job_profile/
│   ├── base.yaml
│   └── deepseek.yaml
├── ideal_resume/
│   ├── base.yaml
│   └── deepseek.yaml
└── gap_analysis/
    ├── base.yaml
    └── deepseek.yaml
```

每个文件含 system / user_template / output_schema / few_shots 四个区。加载逻辑：先读base，再用模型特定文件覆盖差异。

### DeepSeek V4 Pro适配

- 不设 response_format="json"，改用Prompt内要求JSON + _clean_json() 兜底
- temperature=0.1
- 禁止项前置到Prompt前三分之一
- few-shot紧跟在输出格式要求之后
- reasoning_effort=max

### MVP模型矩阵

| 厂商 | 模型 | 优先级 | 推理强度 |
|---|---|---|---|
| DeepSeek | V4 Pro | P0 主力 | max |
| OpenAI | GPT-5.5 Pro | P1 | max |
| Kimi | K2.6 | P1 | max |
| GLM | GLM-5.1 | P1 | max |
| Claude | Opus 4.7 | P1 | max |
| Qwen | Qwen3.5-Flash | P2 | max |
| Gemini | Gemini 3.1 Flash Live | P2 | max |

DeepSeek V4 Pro优先调试到评分达标，其他模型后续加对应yaml覆写。

---

## 5. 数据模型

### API输入

```
POST /api/generate
{
  "experience_level": "new_grad | 1-3_years | 3-5_years | 5-10_years | 10+_years",
  "target_role": "string",
  "background": "string (free text)",
  "jd_text": "string (JD原文)",
  "job_profile_id": "string (optional)",
  "llm_config": {
    "provider": "deepseek",
    "model": "deepseek-v4-pro",
    "api_key": "string"
  }
}
```

### API输出

```
{
  "session_id": "uuid",
  "status": "completed",
  "ideal_resume": {
    "markdown": "完整Markdown简历文本",
    "sections": [
      {"type": "basic_info", "title": "基本信息", "content": "..."},
      {"type": "summary", "title": "自我评价", "content": "..."},
      {"type": "skills", "title": "技能", "content": "..."},
      {"type": "experience", "title": "项目经历", "content": "..."},
      {"type": "education", "title": "教育背景", "content": "..."}
    ]
  },
  "gap_report": {
    "overall_score": 52,
    "summary": "该岗位有1项硬门槛风险...",
    "blockers": [
      {"gap": "...", "why_fatal": "...", "alternative": "..."}
    ],
    "critical_gaps": [
      {"ideal": "...", "current": "...", "action_path": "...", "estimated_time": "..."}
    ],
    "expression_tips": [
      {"from": "...", "to": "...", "method": "..."}
    ]
  }
}
```

### 存储

最小化持久化，不建用户系统：
- sessions表：id、status、result（JSON）、TLL 24小时自动清除
- job_profiles表：id、jd_hash、profile（JSON）、TLL 7天

---

## 6. 前端设计

### 页面结构（2个页面）

**页面1：输入页（`/`）**

```
┌──────────────────────────────────────────┐
│  一键生成完美简历                          │
│                                          │
│  求职阶段: [实习/应届 ▼]                    │
│                                          │
│  目标岗位: [AI产品经理（实习）]              │
│  快速选择: [●AI产品经理] [产品经理] [后端]... │
│                                          │
│  我的履历:                                │
│  ┌────────────────────────────────────┐  │
│  │ placeholder引导文本                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  岗位JD:                                 │
│  ┌────────────────────────────────────┐  │
│  │ placeholder引导文本                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  LLM配置: [折叠]                          │
│  [生成简历]                               │
└──────────────────────────────────────────┘
```

**页面2：结果页（`/result`）**

```
┌──────────────────────────────────────────┐
│  理想版简历                    [导出Markdown] │
│  ⚠️ 该简历为理想目标画像，非当前可投递版本     │
│  ┌────────────────────────────────────┐  │
│  │  完整简历内容...                     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ──────── 差距分析报告 ────────             │
│  综合匹配度：52%                           │
│  🔴 致命差距                              │
│  🟡 核心差距                              │
│  🟢 表达优化                              │
│                         [导出差距报告]      │
└──────────────────────────────────────────┘
```

### 交互联锁规则

- 点击快速选择标签 → 输入框填入 + 该标签高亮
- 手动修改输入框 → 所有标签取消高亮
- 切换求职阶段 → 输入框后缀更新，匹配标签则保持高亮
- 异步加载 → 生成按钮变为进度指示（分析岗位需求 → 生成理想简历 → 分析差距 → 完成），每完成一步该节点亮起，轮询GET接口直到status=completed

---

## 7. 测试与验收标准

### 自动化门槛

| 指标 | 目标 | 验证方式 |
|---|---|---|
| API异步流程完整性 | 正常输入返回completed，异常输入返回failed | pytest |
| JSON Schema合规 | ideal_resume 5 section + gap_report 3层结构 | pytest |
| 前端构建 | npm run build 通过 | CI |
| E2E核心路径 | 输入→生成→结果展示 | Playwright |

### 质量验收（3样本 × 5维度人工评分）

| 样本 | JD类型 |
|---|---|
| 样本1 | 字节AI产品实习（素材丰富） |
| 样本2 | 小红书AI应用产品工程师（素材中等） |
| 样本3 | 美团AI Agent产品实习（素材稀疏） |

| 维度 | 满分 | 合格线 |
|---|---|---|
| 理想简历-岗位对齐度 | 5 | ≥4 |
| 理想简历-表达具象度 | 5 | ≥4 |
| 理想简历-结构完整度 | 5 | ≥4 |
| 差距报告-致命差距准确度 | 5 | ≥4 |
| 差距报告-补足路径可执行性 | 5 | ≥4 |

通过标准：每个样本5项均≥4分。

### 对照基准

同3个样本直接丢给ChatGPT网页端，输出"理想简历+差距分析"，人工对比。目标：系统在5个维度上不低于ChatGPT，至少3个维度优于ChatGPT。

---

## 8. 非目标

MVP明确不做：
- 用户系统和登录
- 多轮对话编辑
- 用户确认/逐条审核流程
- PDF/DOCX导出（仅Markdown）
- 简历版本管理
- 移动端原生App
- 多JD对比生成

---

*文档版本: v1.0*
*状态: Draft*
*下次复审: 实施前*
