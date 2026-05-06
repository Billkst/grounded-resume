# grounded-resume MVP 手动验收文档

> 生成时间：2026-04-30
> 版本：v0.1.0
> 对应 Commit：`78678ff` (plan execute complete)

---

## 1. 项目概述

**项目名称**：grounded-resume
**核心目标**：基于目标岗位 JD 和用户原始素材，生成一份岗位定制、基于真实经历、接近可投递且需用户确认的第一版实习简历。

**当前状态**：MVP 后端引擎（Plan A-F）全部实现完毕，前端界面完成 Forensic Atelier 风格 redesign，共 69 个自动化测试通过，前端构建成功。

---

## 2. 快速验证（5 分钟）

在验收开始前，请先运行以下命令确认基础状态：

```bash
# 1. 后端测试
python3 -m pytest -q
# 预期：69 passed

# 2. 后端模块可导入
python3 -c "from grounded_resume import __version__; print(__version__)"
# 预期：0.1.0

# 3. 前端构建
cd frontend && npm run build
# 预期：Compiled successfully, Generating static pages (6/6)

# 4. 前端可启动
cd frontend && npm run dev
# 预期：Ready in Xs, http://localhost:3000
```

---

## 3. 后端验收清单

### 3.1 Plan A：基础设施（Foundation）

| # | 验收项 | 检查方式 | 预期结果 |
|---|---|---|---|
| A1 | 包结构正确 | `ls src/grounded_resume/` | 包含 `core/`, `db/`, `providers/`, `api/` 等目录 |
| A2 | 版本号定义 | `cat src/grounded_resume/__init__.py` | `__version__ = "0.1.0"` |
| A3 | CLI 可执行 | `python3 -m grounded_resume` | 输出 `grounded-resume backend 0.1.0` |
| A4 | Pydantic Schema 完整 | `cat src/grounded_resume/core/models/schemas.py` | 包含 WorkflowState、JobDescription、MaterialEvidence 等 |
| A5 | 字段命名策略 | 查看 schemas.py 中任意模型 | Python 字段为 snake_case，配置 `alias_generator=to_camel` |
| A6 | SQLite 存储可用 | `cat src/grounded_resume/db/sqlite_store.py` | 包含 WorkflowStore 类，支持 CRUD |
| A7 | LLM Provider 合约 | `cat src/grounded_resume/providers/llm.py` | 包含 LLMProvider 抽象基类和结构化输出方法 |

**相关测试**：`pytest tests/unit/test_package.py tests/unit/test_models.py tests/unit/test_db.py tests/unit/test_providers.py`

---

### 3.2 Plan B：解析与映射（Parsing & Mapping）

| # | 验收项 | 检查方式 | 预期结果 |
|---|---|---|---|
| B1 | 文本工具 | `cat src/grounded_resume/core/utils/text.py` | 包含 chunk_text、similarity、normalize 等函数 |
| B2 | JD 解析器 | `python3 -c "from grounded_resume.core.parsing import JDParser; print(JDParser)"` | 成功导入，不报错 |
| B3 | 素材解析器 | `python3 -c "from grounded_resume.core.parsing import MaterialParser; print(MaterialParser)"` | 成功导入，不报错 |
| B4 | 证据映射器 | `cat src/grounded_resume/core/mapping/evidence_mapper.py` | 包含 EvidenceMapper 类，有 `map()` 方法 |
| B5 | 解析-映射流水线 | `pytest tests/integration/test_parse_map_pipeline.py -v` | 1 passed |

**相关测试**：`pytest tests/unit/test_text_utils.py tests/unit/test_jd_parser.py tests/unit/test_material_parser.py tests/unit/test_evidence_mapper.py tests/integration/test_parse_map_pipeline.py`

---

### 3.3 Plan C：生成与安全（Generation & Safety）

| # | 验收项 | 检查方式 | 预期结果 |
|---|---|---|---|
| C1 | 安全规则表 | `cat src/grounded_resume/core/config/safety_rules.py` | 包含风险分类、表达层级、禁止词表等配置 |
| C2 | 约束生成器 | `cat src/grounded_resume/core/generation/constrained_generator.py` | 包含 ConstrainedGenerator 类 |
| C3 | 表达守卫 | `cat src/grounded_resume/core/safety/expression_guard.py` | 包含 ExpressionGuard，检查表达强度 |
| C4 | 红线检测器 | `cat src/grounded_resume/core/safety/redline_detector.py` | 包含 RedlineDetector，识别夸大/虚假信息 |
| C5 | 保守模式 | `cat src/grounded_resume/core/safety/conservative_mode.py` | 包含 ConservativeMode，降级表达策略 |
| C6 | 验证器 | `cat src/grounded_resume/core/validation/validator.py` | 包含 ResumeValidator，多维度打分 |
| C7 | 生成-验证流水线 | `pytest tests/integration/test_generate_validate_pipeline.py -v` | 1 passed |

**相关测试**：`pytest tests/unit/test_safety_rules.py tests/unit/test_constrained_generator.py tests/unit/test_expression_guard.py tests/unit/test_redline_detector.py tests/unit/test_conservative_mode.py tests/unit/test_validator.py tests/integration/test_generate_validate_pipeline.py`

---

### 3.4 Plan D：确认与输出（Confirmation & Output）

| # | 验收项 | 检查方式 | 预期结果 |
|---|---|---|---|
| D1 | 确认队列 | `cat src/grounded_resume/core/confirmation/user_confirmation.py` | 包含 ConfirmationQueue，管理 bullet 确认状态 |
| D2 | 用户决策应用 | `cat src/grounded_resume/core/confirmation/user_confirmation.py` | 支持 accept/reject/modify/will_supplement/acknowledge |
| D3 | Markdown 格式化器 | `cat src/grounded_resume/core/output/resume_formatter.py` | 包含 ResumeMarkdownFormatter |
| D4 | 输出附件 | `cat src/grounded_resume/core/output/__init__.py` 及周边 | 支持 evidence_map、risk_summary、modification_guide |
| D5 | 确认-输出流水线 | `pytest tests/integration/test_confirmation_output_pipeline.py -v` | 1 passed |

**相关测试**：`pytest tests/unit/test_user_confirmation.py tests/unit/test_resume_formatter.py tests/integration/test_confirmation_output_pipeline.py`

---

### 3.5 Plan E：工作流与 API（Workflow & API）

| # | 验收项 | 检查方式 | 预期结果 |
|---|---|---|---|
| E1 | 依赖就绪 | `cat src/grounded_resume/core/workflow/__init__.py` | 已配置 LangGraph、FastAPI 依赖 |
| E2 | 工作流状态与节点 | `cat src/grounded_resume/core/workflow/state.py` 和 `nodes.py` | 定义 WorkflowState、各节点函数 |
| E3 | LangGraph 图 | `cat src/grounded_resume/core/workflow/graph.py` | 使用 StateGraph 构建完整工作流图 |
| E4 | Checkpoint 持久化 | `pytest tests/integration/test_workflow_graph.py -v` | 2 passed（含 checkpoint 测试） |
| E5 | FastAPI REST 路由 | `cat src/grounded_resume/api/routes.py` | 包含 POST /api/v1/resume、GET /api/v1/resume/{id} 等 |
| E6 | WebSocket 进度 | `cat src/grounded_resume/api/websocket.py` | 包含 WebSocket endpoint，实时推送进度 |
| E7 | API 集成测试 | `pytest tests/integration/test_api_routes.py tests/integration/test_api_websocket.py -v` | 3 passed |

**相关测试**：`pytest tests/unit/test_workflow_nodes.py tests/integration/test_workflow_graph.py tests/integration/test_api_routes.py tests/integration/test_api_websocket.py`

---

### 3.6 测试覆盖汇总

```bash
pytest -q --tb=short
```

**预期结果**：
```
69 passed
```

**测试分布**：
- 单元测试：47 个（覆盖 models、db、providers、parsing、mapping、safety、generation、validation、confirmation、output、workflow）
- 集成测试：5 个（parse_map、generate_validate、confirmation_output、workflow_graph、api_routes/websocket）
- 冒烟测试：17 个（分散在各模块中）

---

## 4. 前端验收清单

### 4.1 构建与工具链

| # | 验收项 | 检查方式 | 预期结果 |
|---|---|---|---|
| F1 | 工具链配置 | `cat frontend/package.json` | Next.js 14.2.3、React 18、Tailwind CSS 3.4.3 |
| F2 | PostCSS 配置 | `cat frontend/postcss.config.js` | 包含 tailwindcss 和 autoprefixer 插件 |
| F3 | Tailwind 配置 | `cat frontend/tailwind.config.ts` | 包含自定义颜色、字体族配置 |
| F4 | 构建成功 | `cd frontend && npm run build` | Compiled successfully，6 静态页面 |
| F5 | 静态导出 | `ls frontend/dist/` | 包含 index.html、confirmation.html、result.html、_next/ |

### 4.2 设计系统（Wave 1）

| # | 验收项 | 检查方式 | 预期结果 |
|---|---|---|---|
| D1 | 暗色主题 | 打开首页 | 背景为近黑色 (#11100E)，文字为米白色 |
| D2 | 字体加载 | 检查页面字体 | 标题使用 Newsreader（衬线），正文使用 IBM Plex Sans Condensed |
| D3 | 配色系统 | 检查各页面 | 看到 ink、paper、bone、graphite、oxidized-cyan、brass、verdict-red 等颜色 |
| D4 | Noise Texture | 仔细观察背景 | 有细微的噪点纹理，不喧宾夺主 |
| D5 | 全局样式 | `cat frontend/app/globals.css` | 包含 @tailwind 指令、CSS 变量、::selection 样式、reduced-motion 媒体查询 |

### 4.3 首页（Wave 2a）

| # | 验收项 | 检查方式 | 预期结果 |
|---|---|---|---|
| H1 | 布局结构 | 打开首页 | 左右分栏：左侧品牌区（~40%），右侧表单区（~60%） |
| H2 | 品牌标题 | 查看左侧 | "grounded" 为米白色大字号，"resume" 为 brass 色斜体 |
| H3 | 步骤指示器 | 查看左侧中部 | 01 输入素材（高亮 cyan）、02 确认提取、03 获取结果 |
| H4 | 系统状态 | 查看左侧底部 | 绿色圆点 + "System Operational" 胶囊 |
| H5 | 表单卡片 | 查看右侧 | 深灰半透明卡片，顶部 cyan 装饰线，标题 "档案录入" |
| H6 | 输入框样式 | 点击输入框 | 透明背景、细下划线、focus 时 cyan 流光效果 |
| H7 | 证据素材卡 | 查看表单下方 | 深色档案袋样式，带编号 "01" 和 "Evidence #001" |
| H8 | CTA 按钮 | 查看右下角 | "生成简历" 按钮为 brass 色背景，hover 有发光效果 |
| H9 | 入场动画 | 刷新页面 | 元素有 stagger fade-in + translateY 动画 |

### 4.4 确认页（Wave 2b）

| # | 验收项 | 检查方式 | 预期结果 |
|---|---|---|---|
| C1 | 案件档案头部 | 打开确认页 | 左上角 "Case File" + cyan 圆点，大标题 "CONFIRMATION REVIEW" |
| C2 | 指标栏 | 查看右上角 | Target / Coverage (cyan) / Confidence (brass) / Evidence (绿/黄/红) |
| C3 | 证据卡片 | 查看主体 | 深灰卡片，顶部 Evidence ID + 风险标签（安全=绿，警告=黄） |
| C4 | 三栏布局 | 查看卡片内部 | 左：简历表达 + 表达层级标签；中：证据来源（cyan 竖线引用）；右：映射分析 + 操作按钮 |
| C5 | 操作按钮 | 悬停按钮 | 认可(brass 边框)、修改(cyan 边框)、拒绝(verdict-red 边框)，hover 有背景变化 |
| C6 | 悬停效果 | 悬停卡片 | 卡片有微妙抬升、边框变亮、阴影加深 |

### 4.5 结果页（Wave 2c）

| # | 验收项 | 检查方式 | 预期结果 |
|---|---|---|---|
| R1 | 指挥板头部 | 打开结果页 | "生成报告" 大标题，右侧 4 个指标卡片（置信度/覆盖率/Gap 数/版本） |
| R2 | 侧边导航 | 查看左侧 | 垂直导航栏，当前项 brass 色左边框 + 背景高亮 |
| R3 | 简历预览 | 点击"简历预览" | 中央显示浅色纸张卡片（bg-paper），带阴影，浮在深色桌面上 |
| R4 | 纸张效果 | 查看简历卡片 | 顶部 "Level 2 Declaration" 绿色徽章 + "AI-Assisted · User Verified" |
| R5 | Markdown 渲染 | 查看简历内容 | 标题用 font-display，正文用 font-serif，层次清晰 |
| R6 | Gap 报告 | 点击"Gap 报告" | 显示审计发现卡片，左侧有 severity 色条（红/琥珀/绿） |
| R7 | Gap 操作 | 查看 Gap 卡片 | 三个按钮：接受缺口（绿）、后续补充（琥珀）、已知悉（灰） |
| R8 | 已接受状态 | 点击"接受缺口" | 卡片透明度降低，显示打勾图标 + 绿色状态条 |
| R9 | 其他附件 | 切换"证据映射"/"风险摘要"/"修改指南" | 内容在 bg-graphite 卡片中显示，排版清晰 |

---

## 5. 端到端流程验收

### 5.1 后端工作流（命令行）

```bash
# 启动 API 服务器
python3 -m uvicorn grounded_resume.api.main:app --reload --port 8000

# 测试健康检查
curl http://localhost:8000/health
# 预期：{"status":"ok","version":"0.1.0"}

# 创建会话（触发完整工作流）
curl -X POST http://localhost:8000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "name": "张某某",
      "email": "zhang@example.com"
    },
    "targetJob": {
      "companyName": "字节跳动",
      "jobTitle": "AI产品经理实习生",
      "jobDescription": "负责AI产品功能设计与迭代，要求具备用户调研和数据分析能力，熟悉Python和SQL"
    },
    "materials": [
      {
        "id": "M001",
        "type": "project",
        "title": "AI产品分析",
        "content": "参与了5-6款AI产品的功能更新，输出结构化分析报告"
      }
    ]
  }'

# 查询会话状态（用上一步返回的 session_id）
curl http://localhost:8000/sessions/{session_id}
```

**预期**：
- `POST /sessions` 返回 `{"session_id":"xxx","status":"completed"}`
- `GET /sessions/{session_id}` 返回 `{"session_id":"xxx","status":"completed"}`

**注意**：`jobDescription` 必须 ≥ 50 字符，否则 Pydantic 校验会返回 422。请求体字段名使用 camelCase（如 `targetJob`、`companyName`），因为 Schema 配置了 `alias_generator`。

### 5.2 前端端到端（浏览器）

1. 打开 `frontend/dist/index.html`（需通过 HTTP 服务器访问，如 `python3 -m http.server`）
2. 填写表单字段，点击"生成简历"
3. 跳转到确认页，查看证据卡片，点击"认可"/"修改"/"拒绝"
4. 跳转到结果页，查看简历预览、Gap 报告、附件

**当前限制**：前端目前使用 mock 数据，未连接后端 API。点击"生成简历"不会真正触发后端工作流。

---

## 6. 文件清单核对

### 6.1 后端核心文件（39 个）

```
src/grounded_resume/
├── __init__.py                    # 版本号
├── __main__.py                    # CLI 入口
├── api/
│   ├── __init__.py
│   ├── main.py                    # FastAPI 应用主入口
│   ├── routes.py                  # REST API 路由
│   ├── websocket.py               # WebSocket 进度推送
│   └── dependencies.py            # FastAPI 依赖注入
├── core/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py             # Pydantic 数据模型
│   ├── config/
│   │   ├── __init__.py
│   │   └── safety_rules.py        # 安全规则配置
│   ├── generation/
│   │   ├── __init__.py
│   │   └── constrained_generator.py
│   ├── safety/
│   │   ├── __init__.py
│   │   ├── expression_guard.py
│   │   ├── redline_detector.py
│   │   └── conservative_mode.py
│   ├── validation/
│   │   ├── __init__.py
│   │   └── validator.py
│   ├── confirmation/
│   │   ├── __init__.py
│   │   └── user_confirmation.py
│   ├── output/
│   │   ├── __init__.py
│   │   └── resume_formatter.py
│   ├── mapping/
│   │   ├── __init__.py
│   │   └── evidence_mapper.py
│   ├── parsing/
│   │   ├── __init__.py
│   │   ├── jd_parser.py
│   │   └── material_parser.py
│   ├── utils/
│   │   ├── __init__.py
│   │   └── text.py
│   └── workflow/
│       ├── __init__.py
│       ├── state.py
│       ├── nodes.py
│       └── graph.py
├── db/
│   ├── __init__.py
│   └── sqlite_store.py
└── providers/
    ├── __init__.py
    └── llm.py
```

### 6.2 测试文件（23 个）

```
tests/
├── integration/
│   ├── test_api_routes.py
│   ├── test_api_websocket.py
│   ├── test_confirmation_output_pipeline.py
│   ├── test_generate_validate_pipeline.py
│   ├── test_parse_map_pipeline.py
│   └── test_workflow_graph.py
└── unit/
    ├── test_package.py
    ├── test_models.py
    ├── test_db.py
    ├── test_providers.py
    ├── test_text_utils.py
    ├── test_jd_parser.py
    ├── test_material_parser.py
    ├── test_evidence_mapper.py
    ├── test_safety_rules.py
    ├── test_constrained_generator.py
    ├── test_expression_guard.py
    ├── test_redline_detector.py
    ├── test_conservative_mode.py
    ├── test_validator.py
    ├── test_user_confirmation.py
    ├── test_resume_formatter.py
    └── test_workflow_nodes.py
```

### 6.3 前端文件（10 个核心文件）

```
frontend/
├── tailwind.config.ts             # 设计令牌（颜色/字体）
├── postcss.config.js              # PostCSS 配置
├── next.config.js                 # Next.js 配置（静态导出）
├── app/
│   ├── layout.tsx                 # 根布局（字体加载）
│   ├── globals.css                # 全局样式（暗色主题/noise/动画）
│   ├── page.tsx                   # 首页（左右分栏）
│   ├── confirmation/
│   │   └── page.tsx               # 确认审查页
│   └── result/
│       └── page.tsx               # 结果报告页
├── components/
│   ├── input-form.tsx             # 档案录入表单
│   ├── confirmation-board.tsx     # 证据审查面板
│   ├── evidence-card.tsx          # 证据引用卡片
│   ├── resume-preview.tsx         # 简历纸张预览
│   └── gap-report.tsx             # Gap 审计报告
└── lib/
    ├── types.ts                   # TypeScript 类型定义
    └── mock-data.ts               # Mock 数据
```

---

## 7. 已知问题与注意事项

| # | 问题 | 影响 | 建议处理方式 |
|---|---|---|---|
| 1 | 前端未连接后端 API | 前端使用 mock 数据，点击按钮不会触发真实工作流 | 属于 MVP Phase 2 范围，当前仅做界面验证 |
| 2 | LLM Provider 为 Mock | 后端 `providers/llm.py` 使用 mock 实现，未接入真实 OpenAI/DeepSeek | 需配置 API Key 后替换为真实 Provider |
| 3 | 静态导出路径限制 | Next.js `output: 'export'` 下 `file://` 协议无法加载 JS，需通过 HTTP 服务器访问 | 部署时使用 nginx/vercel 等正常服务 |
| 4 | 无真实数据持久化 | SQLite store 实现完整，但当前工作流主要使用内存状态 | 生产环境需确认 SQLite 文件路径和权限 |
| 5 | 前端无错误边界 | 若后端返回异常格式，前端可能显示原始错误 | Phase 2 添加 Error Boundary 和 Toast 提示 |

---

## 8. 验收签字

| 验收人 | 日期 | 结果 | 备注 |
|---|---|---|---|
| | | □ 通过 / □ 不通过 | |

---

## 附录：参考文档

- 问题定义：`product/requirements/问题定义 v1.0.md`
- MVP 工作流设计：`product/designs/mvp-workflow-v0.1.md`
- 核心模块设计：`product/designs/core-modules-v0.1.md`
- 数据结构规格：`product/specs/data-structures-v0.1.md`
- 技术架构 ADR：`product/decisions/adr-001-mvp-architecture.md`
- 执行计划：`docs/superpowers/plans/`（overview.md + plan-a.md ~ plan-f.md）
