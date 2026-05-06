# Ideal Resume Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current constrained-resume workflow with a 3-step LLM pipeline that generates an ideal candidate resume + three-layer gap report.

**Architecture:** New `generator.py` module with three functions (`build_job_profile`, `generate_ideal_resume`, `analyze_gaps`) called by async API routes. Prompts are externalized as YAML files. Frontend replaced with 2-page flow (input → result). Existing LLMService and provider adapters are reused without modification.

**Tech Stack:** Python 3.12+ / FastAPI / Pydantic (StrictModel + camelCase aliases) / existing LLMService / Next.js 14 / TypeScript / Tailwind CSS

---

## File Structure

```
NEW:
  prompts/
  ├── job_profile/base.yaml
  ├── job_profile/deepseek.yaml
  ├── ideal_resume/base.yaml
  ├── ideal_resume/deepseek.yaml
  ├── gap_analysis/base.yaml
  └── gap_analysis/deepseek.yaml

  src/grounded_resume/core/generator.py       ← 3 LLM call functions
  src/grounded_resume/api/ideal_routes.py      ← new async endpoints
  src/grounded_resume/api/ideal_session.py     ← minimal session store

  frontend/app/page.tsx                        ← REPLACED: new input page
  frontend/app/result/page.tsx                 ← REPLACED: new result page
  frontend/components/ideal-input-form.tsx      ← new: input form component
  frontend/components/ideal-result-view.tsx     ← new: result display component
  frontend/lib/ideal-types.ts                  ← new: focused types
  frontend/lib/ideal-api.ts                    ← new: focused API client

REMOVED (old workflow):
  src/grounded_resume/api/tasks.py             ← replaced by generator.py
  src/grounded_resume/core/workflow/           ← LangGraph no longer needed
  src/grounded_resume/core/parsing/            ← not used in new flow
  src/grounded_resume/core/mapping/            ← not used in new flow
  src/grounded_resume/core/generation/         ← not used in new flow
  src/grounded_resume/core/validation/         ← not used in new flow
  src/grounded_resume/core/confirmation/       ← not used in new flow
  src/grounded_resume/core/safety/             ← not used in new flow
  src/grounded_resume/core/output/             ← not used in new flow
  src/grounded_resume/core/prompts/            ← replaced by YAML files
  frontend/components/input-form.tsx           ← replaced by ideal-input-form
  frontend/components/confirmation-board.tsx   ← not used
  frontend/components/evidence-card.tsx        ← not used
  frontend/components/gap-report.tsx           ← replaced
  frontend/components/resume-preview.tsx       ← replaced
  frontend/components/progress-bar.tsx         ← replaced
  frontend/components/page-state.tsx           ← not used
  frontend/app/confirmation/                   ← not used
  frontend/app/login/                          ← not used (MVP no auth)
  frontend/app/settings/                       ← not used (LLM config in-page)

KEPT (reused):
  src/grounded_resume/core/llm_service.py      ← reused as-is
  src/grounded_resume/core/config/             ← reused (LLMConfig)
  src/grounded_resume/core/models/schemas.py   ← kept for StrictModel base
  src/grounded_resume/providers/               ← reused as-is (7 adapters)
  src/grounded_resume/api/main.py              ← modified: register new routes
  src/grounded_resume/api/dependencies.py      ← kept, may trim
  src/grounded_resume/api/middleware.py         ← kept
  frontend/lib/llm-config.ts                   ← kept
  frontend/tailwind.config.ts                  ← kept
```

---

## Task 1: New Pydantic Data Models

**Files:**
- Create: `src/grounded_resume/core/ideal_models.py`

- [ ] **Step 1: Write the models file**

```python
"""Data models for the ideal resume generator pipeline."""

from __future__ import annotations

from grounded_resume.core.models.schemas import StrictModel


class HardRequirement(StrictModel):
    requirement: str
    category: str  # education | major | skill | availability | other


class CoreCapability(StrictModel):
    name: str
    weight: int  # 1-10
    description: str


class JobProfile(StrictModel):
    hard_requirements: list[HardRequirement]
    core_capabilities: list[CoreCapability]
    bonus_points: list[str]
    ats_keywords_high: list[str]
    ats_keywords_medium: list[str]
    ideal_candidate_profile: str  # ~200 chars


class ResumeSection(StrictModel):
    section_type: str  # basic_info | summary | skills | experience | education
    title: str
    content: str  # markdown content for this section


class IdealResume(StrictModel):
    markdown: str  # full resume as markdown
    sections: list[ResumeSection]


class BlockerItem(StrictModel):
    gap: str
    why_fatal: str
    alternative: str


class CriticalGapItem(StrictModel):
    ideal: str
    current: str
    action_path: str
    estimated_time: str


class ExpressionTip(StrictModel):
    from_text: str
    to_text: str
    method: str


class GapReport(StrictModel):
    overall_score: int  # 0-100
    summary: str
    blockers: list[BlockerItem]
    critical_gaps: list[CriticalGapItem]
    expression_tips: list[ExpressionTip]


class GenerateRequest(StrictModel):
    experience_level: str  # new_grad | 1_3_years | 3_5_years | 5_10_years | 10_plus_years
    target_role: str
    background: str
    jd_text: str = ""
    job_profile_id: str | None = None
    llm_config: LlmConfigInput | None = None


class LlmConfigInput(StrictModel):
    provider: str = "deepseek"
    model: str = "deepseek-v4-pro"
    api_key: str = ""


class GenerateResponse(StrictModel):
    session_id: str
    status: str  # processing | completed | failed
    progress: str = ""  # job_profile | generating_resume | analyzing_gaps | done
    ideal_resume: IdealResume | None = None
    gap_report: GapReport | None = None
    error: str | None = None
```

- [ ] **Step 2: Commit**

```bash
git add src/grounded_resume/core/ideal_models.py
git commit -m "feat: add ideal resume generator data models"
```

---

## Task 2: Prompt YAML Templates

**Files:**
- Create: `prompts/job_profile/base.yaml`
- Create: `prompts/job_profile/deepseek.yaml`
- Create: `prompts/ideal_resume/base.yaml`
- Create: `prompts/ideal_resume/deepseek.yaml`
- Create: `prompts/gap_analysis/base.yaml`
- Create: `prompts/gap_analysis/deepseek.yaml`
- Create: `src/grounded_resume/core/prompt_loader.py`

- [ ] **Step 1: Create job profile prompt — base**

Write `prompts/job_profile/base.yaml`:

```yaml
system: |
  你是资深招聘专家和岗位分析师。你擅长从JD中提取硬性门槛、核心能力要求和关键词体系。

user_template: |
  ## 目标岗位
  {target_role}

  ## 岗位JD原文
  {jd_text}

  ## 任务
  请分析上述JD，输出结构化岗位画像JSON。

  ## 要求
  - hard_requirements: 只列硬性门槛（学历、专业、必须技能、到岗时间等），不含加分项
  - core_capabilities: 列出核心能力要求，weight 1-10表示重要程度
  - ats_keywords_high: 高权重ATS关键词（JD中反复出现或明确列为"必须"的）
  - ats_keywords_medium: 中等权重关键词
  - ideal_candidate_profile: 用约200字描述该岗位最理想的候选人画像
  - 禁止将"加分项/优先考虑"写入hard_requirements

output_schema:
  type: object
  properties:
    hard_requirements:
      type: array
      items:
        type: object
        properties:
          requirement: {type: string}
          category: {type: string, enum: [education, major, skill, availability, other]}
        required: [requirement, category]
    core_capabilities:
      type: array
      items:
        type: object
        properties:
          name: {type: string}
          weight: {type: integer, minimum: 1, maximum: 10}
          description: {type: string}
        required: [name, weight, description]
    bonus_points:
      type: array
      items: {type: string}
    ats_keywords_high:
      type: array
      items: {type: string}
    ats_keywords_medium:
      type: array
      items: {type: string}
    ideal_candidate_profile:
      type: string
  required: [hard_requirements, core_capabilities, bonus_points, ats_keywords_high, ats_keywords_medium, ideal_candidate_profile]
```

- [ ] **Step 2: Create job profile prompt — DeepSeek override**

Write `prompts/job_profile/deepseek.yaml`:

```yaml
temperature: 0.1
reasoning_effort: max
max_tokens: 4096

# DeepSeek 专属：指令前置，禁止项放在前面
system_extra: |
  禁止：
  - 输出Markdown代码块，只输出纯JSON
  - 将加分项或"优先考虑"写入hard_requirements
  - 编造JD中未出现的硬性要求
  - 遗漏JD中明确写出的硬性要求
```

- [ ] **Step 3: Create ideal resume prompt — base**

Write `prompts/ideal_resume/base.yaml`:

```yaml
system: |
  你是顶尖简历撰写专家，专攻{target_role}领域。你服务的客户是该领域最优秀的候选人，你产出的简历必须能通过HR初筛和面试官审视。

user_template: |
  ## 岗位画像
  {job_profile_json}

  ## 目标岗位
  {target_role}

  ## 求职阶段
  {experience_level}

  ## 任务
  基于岗位画像，生成一份该岗位理论上的完美候选人简历。该简历代表"理想目标画像"，不是真实人物。

  ## 硬性约束（不满足则视为不合格输出）
  1. 自我评价必须采用黄金三段式：岗位匹配度（1-2句）+ 核心能力（2-3个关键词+佐证）+ 职业目标（1句）。总字数80-120字。
  2. 项目经历的每条bullet必须包含至少一个量化数字（百分比、人数、天数、金额、次数均可）。
  3. 禁止以"负责..."开头后接纯职责描述。每条bullet必须是：动作动词+方法/工具+量化结果。
  4. 技能section必须分为硬技能和软技能，每条技能附带一句话应用场景证明。
  5. 禁止罗列技能标签（如"熟悉Python、Figma"），必须包含熟练度和项目关联。
  6. 简历必须包含5个section：基本信息、自我评价、技能、项目经历、教育背景。

  ## 错误示例与修正（你必须避免以下错误）

  错误1：无数字的成果描述
  - 错误："运用Prompt工程，设计多组提示词模板，迭代优化后回答准确性与相关性显著提升"
  - 修正："设计12组Prompt模板，通过A/B测试对比GPT-4与Claude输出效果，将回答准确率从65%提升至82%"
  - 原因：错误版本缺少具体数字和对比基准

  错误2：纯职责描述
  - 错误："负责知识库内容整理和问答助手搭建"
  - 修正："基于公开文档与课程资料构建结构化知识库，覆盖50+常见问题，设计多维度问题分类体系，支撑问答助手原型搭建"
  - 原因：错误版本仅为职责罗列，无方法和结果

  错误3：自我评价空洞
  - 错误："我对人工智能充满热情，具备良好的逻辑思维和团队协作能力"
  - 修正："[岗位匹配] 具备Prompt工程与RAG实践经验，熟悉大模型产品化路径，与{target_role}岗位高度匹配。[核心能力] 独立完成基于LangChain的问答助手原型（准确率82%）；通过SQL分析20+家AI岗位JD，归纳核心能力模型。[职业目标] 希望将AI技术理解力与产品化思维结合，参与大模型应用从0到1的落地过程。"
  - 原因：错误版本为性格描述堆砌，适用于任何岗位

  ## 项目经历要求
  - 列出2-3个与JD高度对齐的虚拟项目
  - 每个项目包含：项目名称、角色、时间、2-4条bullets
  - 项目技术栈和成果必须与JD核心能力要求对应

  ## 教育背景要求
  - 根据岗位方向合理设定学校、专业、学历
  - 必须包含：学校名称、专业、学历、起止时间
  - 可列出3-5门相关核心课程

  ## 输出格式
  请直接输出JSON，不要输出Markdown或分析文字。

output_schema:
  type: object
  properties:
    sections:
      type: array
      items:
        type: object
        properties:
          section_type: {type: string, enum: [basic_info, summary, skills, experience, education]}
          title: {type: string}
          content: {type: string}
        required: [section_type, title, content]
  required: [sections]
```

- [ ] **Step 4: Create ideal resume prompt — DeepSeek override**

Write `prompts/ideal_resume/deepseek.yaml`:

```yaml
temperature: 0.1
reasoning_effort: max
max_tokens: 8192

system_extra: |
  禁止：
  - 输出Markdown代码块包裹JSON，只输出纯JSON
  - 写空洞的自我评价（如"热爱学习""团队协作能力强"）
  - bullet中无数字的成果描述
  - 技能只罗列不写应用场景
  - 项目经历没有具体技术栈和方法
```

- [ ] **Step 5: Create gap analysis prompt — base**

Write `prompts/gap_analysis/base.yaml`:

```yaml
system: |
  你是资深职业规划顾问和招聘专家。你擅长对比候选人现状与岗位要求，给出具体可执行的补足建议。

user_template: |
  ## 岗位画像
  {job_profile_json}

  ## 用户简要履历
  {background}

  ## 理想简历（供参考）
  {ideal_resume_markdown}

  ## 求职阶段
  {experience_level}

  ## 任务
  对比用户履历与岗位画像，按三层差距模型输出差距分析报告。

  ## 三层差距模型

  ### 第一层：致命差距（Blockers）
  JD中的硬性门槛，不满足可能在HR初筛被过滤。
  每条包含：缺什么 → 为什么致命 → 有没有替代方案

  ### 第二层：核心差距（Critical Gaps）
  最多5条。只列"如果补上，简历竞争力会明显提升"的差距。
  每条包含：理想版写什么 → 当前状态 → 补足路径（具体到可执行的项目级别） → 预计时间

  ### 第三层：表达优化（Expression Tips）
  用户有的经历但表达不够专业的改进建议。

  ## 评分规则
  - 致命差距：命中1项扣20分
  - 核心差距（核心能力缺失）：每项扣8分
  - 表达差距：每项扣2分
  - 满分100，最低0

  ## 总览卡片
  用一句话回答"用户现在能投吗？如果不能，什么时候能？"

  ## 关键约束
  - 补足路径必须具体到"做什么项目、用什么工具、产出什么"，禁止"提升XX能力"这种虚的建议
  - 核心差距上限5条，超出的只保留最重要的5条
  - 如果致命差距为0且综合分≥80，总览应明确说"可以投递"
  - 使用用户能看懂的自然语言，禁止使用技术术语（如gap_id、mapping等）

  ## 输出格式
  请直接输出JSON，不要输出Markdown或分析文字。

output_schema:
  type: object
  properties:
    overall_score: {type: integer, minimum: 0, maximum: 100}
    summary: {type: string}
    blockers:
      type: array
      items:
        type: object
        properties:
          gap: {type: string}
          why_fatal: {type: string}
          alternative: {type: string}
        required: [gap, why_fatal, alternative]
    critical_gaps:
      type: array
      maxItems: 5
      items:
        type: object
        properties:
          ideal: {type: string}
          current: {type: string}
          action_path: {type: string}
          estimated_time: {type: string}
        required: [ideal, current, action_path, estimated_time]
    expression_tips:
      type: array
      items:
        type: object
        properties:
          from_text: {type: string}
          to_text: {type: string}
          method: {type: string}
        required: [from_text, to_text, method]
  required: [overall_score, summary, blockers, critical_gaps, expression_tips]
```

- [ ] **Step 6: Create gap analysis prompt — DeepSeek override**

Write `prompts/gap_analysis/deepseek.yaml`:

```yaml
temperature: 0.1
reasoning_effort: max
max_tokens: 8192

system_extra: |
  禁止：
  - 输出Markdown代码块包裹JSON，只输出纯JSON
  - 补足路径只写"提升XX能力"而不写具体项目
  - 列出超过5条核心差距
  - 使用产品内部术语（gap_id、mapping、evidence等）
  - 对校招生提出需要3年以上工作经验才能完成的补足路径
```

- [ ] **Step 7: Create prompt loader**

Write `src/grounded_resume/core/prompt_loader.py`:

```python
"""Load prompt templates from YAML files with model-specific overrides."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


_PROMPTS_ROOT = Path(__file__).parent.parent.parent.parent / "prompts"


class PromptTemplate:
    def __init__(self, task: str, model_family: str) -> None:
        base = _load_yaml(_PROMPTS_ROOT / task / "base.yaml")
        override = _load_yaml(_PROMPTS_ROOT / task / f"{model_family}.yaml")

        self.system: str = _merge_str(base, override, "system")
        self.system_extra: str = override.get("system_extra", "")
        self.user_template: str = base["user_template"]
        self.temperature: float = override.get("temperature", 0.3)
        self.max_tokens: int = override.get("max_tokens", 4096)
        self.reasoning_effort: str | None = override.get("reasoning_effort")

    def build_system(self) -> str:
        if self.system_extra:
            return self.system_extra + "\n\n" + self.system
        return self.system

    def build_user(self, **variables: str) -> str:
        result = self.user_template
        for key, value in variables.items():
            result = result.replace("{" + key + "}", value)
        return result


def _load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _merge_str(base: dict[str, Any], override: dict[str, Any], key: str) -> str:
    if key in override:
        return override[key]
    return base.get(key, "")


def model_family(provider: str) -> str:
    """Map provider ID to model family for prompt selection."""
    mapping = {
        "openai": "openai",
        "kimi": "openai",  # Kimi uses OpenAI-compatible prompts
        "glm": "openai",
        "deepseek": "deepseek",
        "qwen": "openai",
        "third_party": "openai",
        "claude": "openai",
        "gemini": "openai",
    }
    return mapping.get(provider, "openai")
```

- [ ] **Step 8: Add pyyaml dependency**

Run: `pip install pyyaml` (check if already installed)

```bash
python -c "import yaml; print('ok')"
```

- [ ] **Step 9: Commit**

```bash
git add prompts/ src/grounded_resume/core/prompt_loader.py
git commit -m "feat: add externalized prompt templates with DeepSeek overrides"
```

---

## Task 3: LLM Call Helpers

**Files:**
- Create: `src/grounded_resume/core/llm_helpers.py`

- [ ] **Step 1: Write the JSON extractor and LLM call wrapper**

```python
"""Shared helpers for LLM calls in the generation pipeline."""

from __future__ import annotations

import json
import logging
import re

from grounded_resume.core.llm_service import LLMService
from grounded_resume.providers.llm import LLMRequest, Message

logger = logging.getLogger(__name__)


def clean_json(text: str) -> str:
    """Strip markdown fences and extract JSON object/array from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    start_obj = text.find("{")
    start_arr = text.find("[")
    starts = [p for p in (start_obj, start_arr) if p != -1]
    if starts:
        start = min(starts)
        end_char = "}" if start == start_obj else "]"
        end = text.rfind(end_char)
        if end != -1 and end >= start:
            text = text[start : end + 1]
    return text.strip()


def call_llm_json(
    llm: LLMService,
    system: str,
    user: str,
    *,
    temperature: float = 0.1,
    max_tokens: int = 4096,
) -> dict:
    """Call LLM and parse JSON response."""
    full_prompt = user
    request = LLMRequest(
        model=llm.config.model,
        messages=[
            Message(role="system", content=system),
            Message(role="user", content=full_prompt),
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        timeout_s=llm.config.timeout_seconds,
    )
    response = llm.complete(request)
    text = response.text
    logger.info("LLM response preview: %s", text[:300].replace("\n", " "))
    return json.loads(clean_json(text))
```

- [ ] **Step 2: Commit**

```bash
git add src/grounded_resume/core/llm_helpers.py
git commit -m "feat: add LLM call helper with JSON extraction"
```

---

## Task 4: Job Profile Engine

**Files:**
- Create: `src/grounded_resume/core/generator.py`

- [ ] **Step 1: Write build_job_profile function**

```python
"""Ideal resume generator pipeline — three LLM calls."""

from __future__ import annotations

import hashlib
import json
import logging

from grounded_resume.core.ideal_models import JobProfile
from grounded_resume.core.llm_helpers import call_llm_json
from grounded_resume.core.llm_service import LLMService
from grounded_resume.core.prompt_loader import PromptTemplate, model_family

logger = logging.getLogger(__name__)


def build_job_profile(
    llm: LLMService,
    target_role: str,
    jd_text: str,
) -> JobProfile:
    """Step 1: Parse JD into structured job profile."""
    family = model_family(llm.config.provider)
    prompt = PromptTemplate("job_profile", family)

    system = prompt.build_system()
    user = prompt.build_user(
        target_role=target_role,
        jd_text=jd_text,
    )

    data = call_llm_json(
        llm,
        system,
        user,
        temperature=prompt.temperature,
        max_tokens=prompt.max_tokens,
    )

    profile = JobProfile.model_validate(data)
    logger.info(
        "Job profile built: %d hard reqs, %d capabilities",
        len(profile.hard_requirements),
        len(profile.core_capabilities),
    )
    return profile


def hash_jd(jd_text: str) -> str:
    """Hash JD text for caching."""
    return hashlib.sha256(jd_text.encode()).hexdigest()[:16]
```

- [ ] **Step 2: Commit**

```bash
git add src/grounded_resume/core/generator.py
git commit -m "feat: add job profile engine"
```

---

## Task 5: Ideal Resume Generator

**Files:**
- Modify: `src/grounded_resume/core/generator.py`

- [ ] **Step 1: Add generate_ideal_resume to generator.py**

Append to `src/grounded_resume/core/generator.py`:

```python
def generate_ideal_resume(
    llm: LLMService,
    job_profile: JobProfile,
    target_role: str,
    experience_level: str,
) -> dict:
    """Step 2: Generate ideal candidate resume from job profile."""
    family = model_family(llm.config.provider)
    prompt = PromptTemplate("ideal_resume", family)

    system = prompt.build_system().replace("{target_role}", target_role)
    user = prompt.build_user(
        job_profile_json=json.dumps(
            job_profile.model_dump(mode="json", by_alias=True),
            ensure_ascii=False,
            indent=2,
        ),
        target_role=target_role,
        experience_level=_experience_label(experience_level),
    )

    data = call_llm_json(
        llm,
        system,
        user,
        temperature=prompt.temperature,
        max_tokens=prompt.max_tokens,
    )

    # Build markdown from sections
    sections = data.get("sections", [])
    md = _sections_to_markdown(sections)
    data["markdown"] = md

    logger.info("Ideal resume generated: %d sections", len(sections))
    return data


def _experience_label(level: str) -> str:
    mapping = {
        "new_grad": "实习/应届",
        "1_3_years": "1-3年经验",
        "3_5_years": "3-5年经验",
        "5_10_years": "5-10年经验",
        "10_plus_years": "10年以上经验",
    }
    return mapping.get(level, level)


def _sections_to_markdown(sections: list[dict]) -> str:
    lines: list[str] = []
    for sec in sections:
        lines.append(f"## {sec.get('title', '')}")
        lines.append("")
        lines.append(sec.get("content", ""))
        lines.append("")
    return "\n".join(lines).strip()
```

- [ ] **Step 2: Commit**

```bash
git add src/grounded_resume/core/generator.py
git commit -m "feat: add ideal resume generator"
```

---

## Task 6: Gap Analysis Engine

**Files:**
- Modify: `src/grounded_resume/core/generator.py`

- [ ] **Step 1: Add analyze_gaps to generator.py**

Append to `src/grounded_resume/core/generator.py`:

```python
def analyze_gaps(
    llm: LLMService,
    job_profile: JobProfile,
    background: str,
    ideal_resume_markdown: str,
    experience_level: str,
) -> dict:
    """Step 3: Analyze gaps between user background and ideal profile."""
    family = model_family(llm.config.provider)
    prompt = PromptTemplate("gap_analysis", family)

    system = prompt.build_system()
    user = prompt.build_user(
        job_profile_json=json.dumps(
            job_profile.model_dump(mode="json", by_alias=True),
            ensure_ascii=False,
            indent=2,
        ),
        background=background,
        ideal_resume_markdown=ideal_resume_markdown,
        experience_level=_experience_label(experience_level),
    )

    data = call_llm_json(
        llm,
        system,
        user,
        temperature=prompt.temperature,
        max_tokens=prompt.max_tokens,
    )

    logger.info(
        "Gap analysis: score=%d, blockers=%d, critical=%d, tips=%d",
        data.get("overall_score", 0),
        len(data.get("blockers", [])),
        len(data.get("critical_gaps", [])),
        len(data.get("expression_tips", [])),
    )
    return data
```

- [ ] **Step 2: Commit**

```bash
git add src/grounded_resume/core/generator.py
git commit -m "feat: add gap analysis engine"
```

---

## Task 7: Session Store

**Files:**
- Create: `src/grounded_resume/api/ideal_session.py`

- [ ] **Step 1: Write session store**

```python
"""Minimal in-memory session store for ideal resume generation."""

from __future__ import annotations

import threading
import time
import uuid
from typing import Any


class IdealSessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create(self) -> str:
        session_id = uuid.uuid4().hex[:12]
        with self._lock:
            self._sessions[session_id] = {
                "status": "processing",
                "progress": "",
                "result": None,
                "error": None,
                "created_at": time.time(),
            }
        return session_id

    def update_progress(self, session_id: str, progress: str) -> None:
        with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id]["progress"] = progress

    def complete(self, session_id: str, result: dict[str, Any]) -> None:
        with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id]["status"] = "completed"
                self._sessions[session_id]["result"] = result
                self._sessions[session_id]["progress"] = "done"

    def fail(self, session_id: str, error: str) -> None:
        with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id]["status"] = "failed"
                self._sessions[session_id]["error"] = error

    def get(self, session_id: str) -> dict[str, Any] | None:
        with self._lock:
            return self._sessions.get(session_id)

    def cleanup_expired(self, ttl_seconds: int = 86400) -> int:
        now = time.time()
        with self._lock:
            expired = [
                sid for sid, s in self._sessions.items()
                if now - s["created_at"] > ttl_seconds
            ]
            for sid in expired:
                del self._sessions[sid]
        return len(expired)
```

- [ ] **Step 2: Commit**

```bash
git add src/grounded_resume/api/ideal_session.py
git commit -m "feat: add ideal session store"
```

---

## Task 8: API Routes

**Files:**
- Create: `src/grounded_resume/api/ideal_routes.py`
- Modify: `src/grounded_resume/api/main.py`

- [ ] **Step 1: Write API routes**

Write `src/grounded_resume/api/ideal_routes.py`:

```python
"""API routes for ideal resume generator."""

from __future__ import annotations

import logging
from typing import cast

from fastapi import APIRouter, BackgroundTasks, HTTPException

from grounded_resume.core.config import LLMConfig
from grounded_resume.core.generator import (
    analyze_gaps,
    build_job_profile,
    generate_ideal_resume,
    hash_jd,
)
from grounded_resume.core.ideal_models import (
    GapReport,
    GenerateRequest,
    GenerateResponse,
    IdealResume,
)
from grounded_resume.core.llm_service import LLMService

from .ideal_session import IdealSessionStore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# Shared store — in production replace with Redis
session_store = IdealSessionStore()
job_profile_cache: dict[str, dict] = {}


def _build_llm_service(llm_config_input) -> LLMService:
    if llm_config_input is None:
        return LLMService()
    cfg = LLMConfig(
        provider=llm_config_input.provider or "deepseek",
        model=llm_config_input.model or "deepseek-v4-pro",
        temperature=0.1,
        max_tokens=8192,
        timeout_seconds=120,
        mode="hybrid",
        **{f"{llm_config_input.provider}_api_key": llm_config_input.api_key},
    )
    return LLMService(config=cfg, retry_attempts=2)


@router.post("/generate")
def create_generation(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
) -> dict:
    if not request.llm_config or not request.llm_config.api_key:
        raise HTTPException(
            status_code=400,
            detail="请配置 LLM API Key",
        )

    session_id = session_store.create()

    background_tasks.add_task(
        _run_generation,
        session_id,
        request,
    )
    return {"session_id": session_id, "status": "processing"}


@router.get("/generate/{session_id}")
def get_generation(session_id: str) -> dict:
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    response = {
        "session_id": session_id,
        "status": session["status"],
        "progress": session.get("progress", ""),
    }

    if session["status"] == "completed":
        result = cast(dict, session["result"])
        response["ideal_resume"] = result.get("ideal_resume")
        response["gap_report"] = result.get("gap_report")
    elif session["status"] == "failed":
        response["error"] = session.get("error", "Unknown error")

    return response


@router.post("/job-profile")
def create_job_profile(request: dict) -> dict:
    """Optional: pre-parse JD and cache the job profile."""
    jd_text = request.get("jd_text", "")
    target_role = request.get("target_role", "")
    llm_config = request.get("llm_config")

    if not jd_text:
        raise HTTPException(status_code=400, detail="jd_text is required")

    jd_hash = hash_jd(jd_text)
    if jd_hash in job_profile_cache:
        return {"profile_id": jd_hash, "status": "completed"}

    session_id = session_store.create()
    # Execute synchronously since this is a single LLM call
    try:
        llm = _build_llm_service(llm_config)
        profile = build_job_profile(llm, target_role, jd_text)
        job_profile_cache[jd_hash] = profile.model_dump(mode="json", by_alias=True)
        session_store.complete(session_id, {"job_profile": job_profile_cache[jd_hash]})
        return {"profile_id": jd_hash, "status": "completed"}
    except Exception as exc:
        session_store.fail(session_id, str(exc))
        raise HTTPException(status_code=500, detail=str(exc))


def _run_generation(session_id: str, request: GenerateRequest) -> None:
    try:
        llm = _build_llm_service(request.llm_config)

        # Step 1: Job profile (or use cached)
        session_store.update_progress(session_id, "job_profile")
        if request.job_profile_id and request.job_profile_id in job_profile_cache:
            job_profile_data = job_profile_cache[request.job_profile_id]
        else:
            job_profile_data = build_job_profile(
                llm, request.target_role, request.jd_text
            ).model_dump(mode="json", by_alias=True)
            if request.jd_text:
                jd_hash = hash_jd(request.jd_text)
                job_profile_cache[jd_hash] = job_profile_data

        # Step 2: Generate ideal resume
        session_store.update_progress(session_id, "generating_resume")
        from grounded_resume.core.ideal_models import JobProfile as JP
        job_profile = JP.model_validate(job_profile_data)
        ideal_resume_data = generate_ideal_resume(
            llm, job_profile, request.target_role, request.experience_level
        )

        # Step 3: Analyze gaps
        session_store.update_progress(session_id, "analyzing_gaps")
        gap_report_data = analyze_gaps(
            llm,
            job_profile,
            request.background,
            ideal_resume_data.get("markdown", ""),
            request.experience_level,
        )

        result = {
            "ideal_resume": ideal_resume_data,
            "gap_report": gap_report_data,
        }
        session_store.complete(session_id, result)
        logger.info("Generation completed: session=%s", session_id)

    except Exception as exc:
        logger.error("Generation failed: session=%s error=%s", session_id, exc, exc_info=True)
        session_store.fail(session_id, str(exc))


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "version": "2.0.0"}
```

- [ ] **Step 2: Modify main.py to register new routes**

Edit `src/grounded_resume/api/main.py`. Replace the existing router registration:

```python
# Remove these lines:
# from .routes import router
# app.include_router(router)

# Add:
from .ideal_routes import router as ideal_router
app.include_router(ideal_router)
```

Remove the workflow graph building:

```python
# Remove:
# app.state.workflow_graph = build_workflow_graph(
#     llm_service=_LLMServiceAdapter(llm_service)
# )

# Remove the _LLMServiceAdapter class entirely
```

Remove the websocket router (not needed in MVP):

```python
# Remove:
# from grounded_resume.api.websocket import router as websocket_router
# app.include_router(websocket_router)
```

Remove the config endpoint's cloud provider restriction (all providers available):

```python
# Keep /config endpoint but simplify
@app.get("/config")
def get_config() -> dict[str, object]:
    return {
        "deploymentMode": DEPLOYMENT_MODE,
        "supportedProviders": [
            "openai", "kimi", "glm", "deepseek",
            "claude", "qwen", "gemini", "third_party",
        ],
    }
```

- [ ] **Step 3: Verify app starts**

```bash
cd src && python -c "from grounded_resume.api.main import app; print('App created OK')"
```

Expected: `App created OK`

- [ ] **Step 4: Commit**

```bash
git add src/grounded_resume/api/ideal_routes.py src/grounded_resume/api/main.py
git commit -m "feat: add ideal resume generation API routes"
```

---

## Task 9: Frontend — Types & API Client

**Files:**
- Create: `frontend/lib/ideal-types.ts`
- Create: `frontend/lib/ideal-api.ts`

- [ ] **Step 1: Write types**

Write `frontend/lib/ideal-types.ts`:

```typescript
export type ExperienceLevel = 'new_grad' | '1_3_years' | '3_5_years' | '5_10_years' | '10_plus_years';

export interface LlmConfigInput {
  provider: string;
  model: string;
  apiKey: string;
}

export interface GenerateRequest {
  experienceLevel: ExperienceLevel;
  targetRole: string;
  background: string;
  jdText: string;
  jobProfileId?: string;
  llmConfig: LlmConfigInput;
}

export interface ResumeSection {
  sectionType: 'basic_info' | 'summary' | 'skills' | 'experience' | 'education';
  title: string;
  content: string;
}

export interface IdealResume {
  markdown: string;
  sections: ResumeSection[];
}

export interface BlockerItem {
  gap: string;
  whyFatal: string;
  alternative: string;
}

export interface CriticalGapItem {
  ideal: string;
  current: string;
  actionPath: string;
  estimatedTime: string;
}

export interface ExpressionTip {
  fromText: string;
  toText: string;
  method: string;
}

export interface GapReport {
  overallScore: number;
  summary: string;
  blockers: BlockerItem[];
  criticalGaps: CriticalGapItem[];
  expressionTips: ExpressionTip[];
}

export interface GenerateResponse {
  session_id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: string;
  ideal_resume?: IdealResume;
  gap_report?: GapReport;
  error?: string;
}
```

- [ ] **Step 2: Write API client**

Write `frontend/lib/ideal-api.ts`:

```typescript
import type { GenerateRequest, GenerateResponse } from './ideal-types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function createGeneration(input: GenerateRequest): Promise<{ session_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || 'Request failed');
  }
  return res.json();
}

export async function getGeneration(sessionId: string): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/generate/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function pollGeneration(
  sessionId: string,
  onUpdate: (resp: GenerateResponse) => void,
  onError: (err: Error) => void,
  intervalMs = 1500,
) {
  const timer = setInterval(async () => {
    try {
      const resp = await getGeneration(sessionId);
      onUpdate(resp);
      if (resp.status === 'completed' || resp.status === 'failed') {
        clearInterval(timer);
      }
    } catch (err) {
      clearInterval(timer);
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }, intervalMs);
  return () => clearInterval(timer);
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/ideal-types.ts frontend/lib/ideal-api.ts
git commit -m "feat: add frontend types and API client for ideal generator"
```

---

## Task 10: Frontend — Input Page

**Files:**
- Create: `frontend/components/ideal-input-form.tsx`
- Modify: `frontend/app/page.tsx` (full replacement)
- Modify: `frontend/app/layout.tsx` (remove auth/settings links if present)

- [ ] **Step 1: Write input form component**

Write `frontend/components/ideal-input-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { ExperienceLevel } from '@/lib/ideal-types';
import type { LLMConfig } from '@/lib/llm-config';
import { DEFAULT_LLM_CONFIG, readLLMConfig } from '@/lib/llm-config';

const QUICK_ROLES = [
  'AI产品经理',
  '产品经理',
  '后端工程师',
  '前端工程师',
  '算法/机器学习工程师',
  '数据分析师',
  '用户运营',
  'UI/UX设计师',
  '项目经理',
  '管培生',
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'new_grad', label: '实习/应届' },
  { value: '1_3_years', label: '1-3年' },
  { value: '3_5_years', label: '3-5年' },
  { value: '5_10_years', label: '5-10年' },
  { value: '10_plus_years', label: '10年以上' },
];

const BG_PLACEHOLDER = `例如：
- 2023-2027 XX大学 计算机科学 本科
- 用Python做过一个课程项目：电影推荐系统
- 熟悉ChatGPT、Claude等AI工具
- 参加过校内黑客松，做过XX小程序
- 在XX公司做过3个月产品实习生，主要做竞品分析和用户调研
（越详细越好，口语化描述即可）`;

const JD_PLACEHOLDER = '直接粘贴目标岗位的完整JD即可，系统会自动分析';

interface Props {
  onGenerate: (data: {
    experienceLevel: ExperienceLevel;
    targetRole: string;
    background: string;
    jdText: string;
    llmConfig: LLMConfig;
  }) => void;
  loading: boolean;
}

export default function IdealInputForm({ onGenerate, loading }: Props) {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('new_grad');
  const [targetRole, setTargetRole] = useState('AI产品经理');
  const [activeTag, setActiveTag] = useState('AI产品经理');
  const [background, setBackground] = useState('');
  const [jdText, setJdText] = useState('');
  const [showLlm, setShowLlm] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);

  const suffix = experienceLevel === 'new_grad' ? '（实习）' : '';

  const handleTagClick = (role: string) => {
    setActiveTag(role);
    setTargetRole(role + suffix);
  };

  const handleRoleInput = (value: string) => {
    setTargetRole(value);
    setActiveTag(''); // deselect any tag
  };

  const handleExperienceChange = (level: ExperienceLevel) => {
    setExperienceLevel(level);
    if (activeTag) {
      setTargetRole(activeTag + (level === 'new_grad' ? '（实习）' : ''));
    } else if (level === 'new_grad' && !targetRole.includes('（实习）')) {
      setTargetRole(targetRole + '（实习）');
    } else if (level !== 'new_grad') {
      setTargetRole(targetRole.replace('（实习）', ''));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      experienceLevel,
      targetRole: targetRole.replace('（实习）', ''),
      background,
      jdText,
      llmConfig,
    });
  };

  const isValid = targetRole.trim() && jdText.trim() && llmConfig.apiKey;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">求职阶段</label>
        <select
          value={experienceLevel}
          onChange={(e) => handleExperienceChange(e.target.value as ExperienceLevel)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {EXPERIENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Target Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">目标岗位</label>
        <input
          type="text"
          value={targetRole + (activeTag ? '' : suffix)}
          onChange={(e) => handleRoleInput(e.target.value)}
          placeholder="输入目标岗位，如 AI产品经理"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {QUICK_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleTagClick(role)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                activeTag === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">我的履历</label>
        <textarea
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder={BG_PLACEHOLDER}
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        />
      </div>

      {/* JD */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">岗位JD</label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder={JD_PLACEHOLDER}
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        />
      </div>

      {/* LLM Config (collapsed) */}
      <div>
        <button
          type="button"
          onClick={() => setShowLlm(!showLlm)}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          {showLlm ? '收起 LLM 配置' : 'LLM 配置'}
        </button>
        {showLlm && (
          <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs text-gray-600 mb-1">厂商</label>
              <select
                value={llmConfig.provider}
                onChange={(e) => setLlmConfig({ ...llmConfig, provider: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="kimi">Kimi</option>
                <option value="glm">GLM</option>
                <option value="claude">Claude</option>
                <option value="qwen">Qwen</option>
                <option value="gemini">Gemini</option>
                <option value="third_party">第三方代理</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">模型</label>
              <input
                type="text"
                value={llmConfig.model}
                onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">API Key</label>
              <input
                type="password"
                value={llmConfig.apiKey}
                onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full py-3 px-6 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? '生成中...' : '生成简历'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Replace home page**

Write `frontend/app/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import IdealInputForm from '@/components/ideal-input-form';
import { createGeneration } from '@/lib/ideal-api';
import type { ExperienceLevel } from '@/lib/ideal-types';
import type { LLMConfig } from '@/lib/llm-config';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (data: {
    experienceLevel: ExperienceLevel;
    targetRole: string;
    background: string;
    jdText: string;
    llmConfig: LLMConfig;
  }) => {
    setLoading(true);
    setError('');

    try {
      const resp = await createGeneration({
        experienceLevel: data.experienceLevel,
        targetRole: data.targetRole,
        background: data.background,
        jdText: data.jdText,
        llmConfig: {
          provider: data.llmConfig.provider,
          model: data.llmConfig.model,
          apiKey: data.llmConfig.apiKey,
        },
      });

      router.push(`/result?session=${resp.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          一键生成完美简历
        </h1>
        <p className="text-center text-gray-500 mb-10">
          输入目标岗位JD和你的简要履历，系统自动生成理想版简历和差距分析报告
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <IdealInputForm onGenerate={handleGenerate} loading={loading} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/ideal-input-form.tsx frontend/app/page.tsx
git commit -m "feat: replace home page with ideal generator input form"
```

---

## Task 11: Frontend — Result Page

**Files:**
- Create: `frontend/components/ideal-result-view.tsx`
- Modify: `frontend/app/result/page.tsx` (full replacement)

- [ ] **Step 1: Write result view component**

Write `frontend/components/ideal-result-view.tsx`:

```tsx
'use client';

import type { IdealResume, GapReport } from '@/lib/ideal-types';

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadGapReport(report: GapReport) {
  const lines = [
    '# 差距分析报告',
    '',
    `**综合匹配度：${report.overallScore}%**`,
    '',
    `> ${report.summary}`,
    '',
    '---',
    '',
    '## 🔴 致命差距',
    ...report.blockers.map((b) => `- **缺什么**：${b.gap}\n  - 致命原因：${b.whyFatal}\n  - 替代方案：${b.alternative}`),
    '',
    '## 🟡 核心差距',
    ...report.criticalGaps.map((g) => `- **理想状态**：${g.ideal}\n  - **当前状态**：${g.current}\n  - **补足路径**：${g.actionPath}\n  - **预计时间**：${g.estimatedTime}`),
    '',
    '## 🟢 表达优化',
    ...report.expressionTips.map((t) => `- **原写法**：${t.fromText}\n  → **升级为**：${t.toText}\n  → **方法**：${t.method}`),
  ];
  downloadMarkdown(lines.join('\n\n'), '差距分析报告.md');
}

interface Props {
  idealResume: IdealResume;
  gapReport: GapReport;
}

export default function IdealResultView({ idealResume, gapReport }: Props) {
  return (
    <div className="space-y-10">
      {/* Ideal Resume */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">理想版简历</h2>
          <button
            onClick={() => downloadMarkdown(idealResume.markdown, '理想版简历.md')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
          >
            导出 Markdown
          </button>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
          ⚠️ 该简历为理想目标画像，代表"该岗位理论上的完美候选人"，非您当前可投递版本。请参照下方差距报告了解您与目标的差距。
        </div>

        <div className="p-6 rounded-lg border border-gray-200 bg-white prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
            {idealResume.markdown}
          </pre>
        </div>
      </section>

      {/* Gap Report */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">差距分析报告</h2>
          <button
            onClick={() => downloadGapReport(gapReport)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition"
          >
            导出差距报告
          </button>
        </div>

        {/* Overall */}
        <div className="p-6 rounded-lg bg-gray-50 border border-gray-200 mb-6">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-3xl font-bold text-gray-900">{gapReport.overallScore}%</span>
            <span className="text-sm text-gray-500">综合匹配度</span>
          </div>
          <p className="text-sm text-gray-700">{gapReport.summary}</p>
        </div>

        {/* Blockers */}
        {gapReport.blockers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-700 mb-3">🔴 致命差距</h3>
            <div className="space-y-3">
              {gapReport.blockers.map((b, i) => (
                <div key={i} className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <p className="text-sm font-medium text-red-800 mb-2">缺什么：{b.gap}</p>
                  <p className="text-sm text-red-700 mb-1">致命原因：{b.whyFatal}</p>
                  <p className="text-sm text-red-600">替代方案：{b.alternative}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Gaps */}
        {gapReport.criticalGaps.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-amber-700 mb-3">🟡 核心差距</h3>
            <div className="space-y-3">
              {gapReport.criticalGaps.map((g, i) => (
                <div key={i} className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                  <p className="text-sm font-medium text-amber-800 mb-2">理想状态：{g.ideal}</p>
                  <p className="text-sm text-amber-700 mb-1">当前状态：{g.current}</p>
                  <p className="text-sm text-amber-700 mb-1">补足路径：{g.actionPath}</p>
                  <p className="text-xs text-amber-600">预计时间：{g.estimatedTime}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expression Tips */}
        {gapReport.expressionTips.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-3">🟢 表达优化</h3>
            <div className="space-y-2">
              {gapReport.expressionTips.map((t, i) => (
                <div key={i} className="p-3 rounded-lg border border-green-200 bg-green-50">
                  <p className="text-sm text-green-800">
                    <span className="line-through text-green-600">{t.fromText}</span>
                    {' → '}
                    <span className="font-medium">{t.toText}</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">方法：{t.method}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Replace result page**

Write `frontend/app/result/page.tsx`:

```tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { pollGeneration } from '@/lib/ideal-api';
import type { IdealResume, GapReport, GenerateResponse } from '@/lib/ideal-types';
import IdealResultView from '@/components/ideal-result-view';

const PROGRESS_LABELS: Record<string, string> = {
  job_profile: '分析岗位需求',
  generating_resume: '生成理想简历',
  analyzing_gaps: '分析差距',
  done: '完成',
};

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');
  const [status, setStatus] = useState<string>('processing');
  const [progress, setProgress] = useState('');
  const [idealResume, setIdealResume] = useState<IdealResume | null>(null);
  const [gapReport, setGapReport] = useState<GapReport | null>(null);
  const [error, setError] = useState('');
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/');
      return;
    }

    const stop = pollGeneration(
      sessionId,
      (resp: GenerateResponse) => {
        if (stoppedRef.current) return;
        setStatus(resp.status);
        setProgress(resp.progress);
        if (resp.status === 'completed') {
          if (resp.ideal_resume) setIdealResume(resp.ideal_resume);
          if (resp.gap_report) setGapReport(resp.gap_report);
        } else if (resp.status === 'failed') {
          setError(resp.error || '生成失败');
        }
      },
      (err) => setError(err.message),
    );

    return () => {
      stoppedRef.current = true;
      stop();
    };
  }, [sessionId, router]);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {status === 'processing' && (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-lg text-gray-700">
                {PROGRESS_LABELS[progress] || '处理中...'}
              </span>
            </div>
            <div className="flex justify-center gap-8 mt-8">
              {['job_profile', 'generating_resume', 'analyzing_gaps', 'done'].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    progress === step ? 'bg-blue-600 animate-pulse' :
                    PROGRESS_LABELS[progress] && 
                    ['job_profile', 'generating_resume', 'analyzing_gaps', 'done'].indexOf(step) < 
                    ['job_profile', 'generating_resume', 'analyzing_gaps', 'done'].indexOf(progress)
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-xs text-gray-500">{PROGRESS_LABELS[step]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center py-20">
            <div className="p-6 rounded-lg bg-red-50 border border-red-200 inline-block">
              <p className="text-red-700 mb-4">{error || '生成失败，请重试'}</p>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                返回首页
              </button>
            </div>
          </div>
        )}

        {status === 'completed' && idealResume && gapReport && (
          <IdealResultView idealResume={idealResume} gapReport={gapReport} />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/ideal-result-view.tsx frontend/app/result/page.tsx
git commit -m "feat: add result page with ideal resume and gap report display"
```

---

## Task 12: Backend — Clean Up Old Modules

**Files:**
- Remove: old workflow modules
- Modify: `src/grounded_resume/api/routes.py` (trim to minimum)
- Modify: `src/grounded_resume/api/dependencies.py` (trim to minimum)

- [ ] **Step 1: Remove directories**

```bash
rm -rf src/grounded_resume/core/workflow
rm -rf src/grounded_resume/core/parsing
rm -rf src/grounded_resume/core/mapping
rm -rf src/grounded_resume/core/generation
rm -rf src/grounded_resume/core/validation
rm -rf src/grounded_resume/core/confirmation
rm -rf src/grounded_resume/core/safety
rm -rf src/grounded_resume/core/output
rm -rf src/grounded_resume/core/prompts
rm -rf src/grounded_resume/core/standards
rm -f src/grounded_resume/api/websocket.py
rm -f src/grounded_resume/api/tasks.py
```

- [ ] **Step 2: Trim routes.py**

Keep only `routes.py` with the minimal residue needed (will be deleted when old frontend pages removed):

```python
"""Deprecated routes — will be removed."""
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health() -> dict:
    return {"status": "ok", "version": "0.1.0"}
```

Actually, since `ideal_routes.py` already has `/api/health`, we can delete `routes.py` entirely and remove its import from `main.py`.

```bash
rm -f src/grounded_resume/api/routes.py
```

- [ ] **Step 3: Verify backend starts cleanly**

```bash
cd src && python -c "from grounded_resume.api.main import app; print('OK')"
```

Expected: `OK` (no import errors)

- [ ] **Step 4: Commit**

```bash
git add -A src/grounded_resume/
git commit -m "refactor: remove old workflow modules, keep only ideal generator"
```

---

## Task 13: Frontend — Clean Up Old Pages

**Files:**
- Remove: `frontend/app/confirmation/`
- Remove: `frontend/app/login/`
- Remove: `frontend/app/settings/`
- Remove: old components not used by new flow
- Modify: `frontend/app/layout.tsx` (remove auth/settings nav)

- [ ] **Step 1: Remove old pages and unused components**

```bash
rm -rf frontend/app/confirmation
rm -rf frontend/app/login
rm -rf frontend/app/settings
rm -f frontend/components/input-form.tsx
rm -f frontend/components/confirmation-board.tsx
rm -f frontend/components/evidence-card.tsx
rm -f frontend/components/gap-report.tsx
rm -f frontend/components/resume-preview.tsx
rm -f frontend/components/progress-bar.tsx
rm -f frontend/components/page-state.tsx
```

- [ ] **Step 2: Check layout.tsx**

Read `frontend/app/layout.tsx` and remove any auth/settings links if present. The layout should be minimal — just metadata and children.

- [ ] **Step 3: Verify frontend builds**

```bash
cd frontend && npm run build
```

Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "refactor: remove old frontend pages, keep only input + result"
```

---

## Task 14: Integration Test

**Files:**
- Create: `tests/test_ideal_generator.py`

- [ ] **Step 1: Write integration test with mock LLM**

Write `tests/test_ideal_generator.py`:

```python
"""Integration tests for ideal resume generator (mock LLM)."""
import json
import pytest
from fastapi.testclient import TestClient

from grounded_resume.api.main import app


@pytest.fixture
def client():
    return TestClient(app)


MOCK_JOB_PROFILE = {
    "hard_requirements": [
        {"requirement": "本科及以上学历", "category": "education"},
        {"requirement": "计算机相关专业", "category": "major"},
    ],
    "core_capabilities": [
        {"name": "Prompt Engineering", "weight": 8, "description": "能够设计高质量prompt"},
    ],
    "bonus_points": ["有开源项目经验"],
    "ats_keywords_high": ["Prompt", "RAG", "Agent"],
    "ats_keywords_medium": ["Python", "LangChain"],
    "ideal_candidate_profile": "该岗位的理想候选人应具备...",
}

MOCK_RESUME = {
    "sections": [
        {"section_type": "basic_info", "title": "基本信息", "content": "张三 | AI产品经理实习生"},
        {"section_type": "summary", "title": "自我评价", "content": "具备Prompt工程与RAG实践经验..."},
        {"section_type": "skills", "title": "技能", "content": "硬技能：Python..."},
        {"section_type": "experience", "title": "项目经历", "content": "## RAG问答助手\n- ..."},
        {"section_type": "education", "title": "教育背景", "content": "XX大学 计算机科学 本科"},
    ],
    "markdown": "## 基本信息\n张三...\n## 自我评价\n...",
}

MOCK_GAP_REPORT = {
    "overall_score": 52,
    "summary": "该岗位有1项硬门槛风险，建议补齐后投递",
    "blockers": [
        {"gap": "计算机相关专业", "why_fatal": "JD硬性要求", "alternative": "如有GitHub高星项目可替代"},
    ],
    "critical_gaps": [
        {
            "ideal": "独立完成LangChain多轮对话Agent",
            "current": "只做过RAG问答助手",
            "action_path": "用LangChain做多Agent协作demo，发布到HuggingFace",
            "estimated_time": "2-3周",
        },
    ],
    "expression_tips": [
        {"from_text": "整理过知识库", "to_text": "构建结构化知识体系", "method": "用动词+方法+产出结构"},
    ],
}


class FakeLLMService:
    class config:
        provider = "deepseek"
        model = "deepseek-v4-pro"
        timeout_seconds = 120

    class registry:
        def list_providers(self):
            return ["deepseek"]

    def __init__(self, *args, **kwargs):
        self.call_count = 0

    def complete(self, request):
        self.call_count += 1
        # Route based on prompt content
        text = json.dumps(
            MOCK_JOB_PROFILE if self.call_count == 1
            else MOCK_RESUME if self.call_count == 2
            else MOCK_GAP_REPORT,
            ensure_ascii=False,
        )
        from grounded_resume.providers.llm import LLMResponse
        return LLMResponse(text=text, model=request.model)


def test_generate_endpoint_requires_api_key(client):
    resp = client.post("/api/generate", json={
        "experienceLevel": "new_grad",
        "targetRole": "AI产品经理",
        "background": "test",
        "jdText": "test JD",
        "llmConfig": {"provider": "deepseek", "model": "v4-pro", "apiKey": ""},
    })
    assert resp.status_code == 400
    assert "API Key" in resp.json()["detail"]


def test_session_not_found(client):
    resp = client.get("/api/generate/nonexistent")
    assert resp.status_code == 404


def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
```

- [ ] **Step 2: Run tests**

```bash
python -m pytest tests/test_ideal_generator.py -v
```

Expected: 3 tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/test_ideal_generator.py
git commit -m "test: add integration tests for ideal generator API"
```

---

## Task 15: E2E Smoke Test

**Files:**
- Create: `frontend/e2e/ideal-generator.spec.ts`

- [ ] **Step 1: Write E2E test**

Write `frontend/e2e/ideal-generator.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('ideal generator input page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('一键生成完美简历');
  await expect(page.locator('select')).toBeVisible();
  await expect(page.locator('input[type="text"]').first()).toBeVisible();
  await expect(page.getByText('AI产品经理')).toBeVisible();
});

test('quick role tags work', async ({ page }) => {
  await page.goto('/');
  await page.getByText('后端工程师').click();
  const input = page.locator('input[type="text"]').first();
  await expect(input).toHaveValue('后端工程师（实习）');
});

test('experience level changes suffix', async ({ page }) => {
  await page.goto('/');
  await page.getByText('AI产品经理').click();
  const input = page.locator('input[type="text"]').first();
  await expect(input).toHaveValue('AI产品经理（实习）');
  await page.selectOption('select', '1_3_years');
  await expect(input).toHaveValue('AI产品经理');
});

test('generate button disabled without API key', async ({ page }) => {
  await page.goto('/');
  await page.locator('textarea').first().fill('test background');
  await page.locator('textarea').last().fill('test JD');
  const btn = page.getByText('生成简历');
  await expect(btn).toBeDisabled();
});
```

- [ ] **Step 2: Run E2E tests**

```bash
cd frontend && npx playwright test e2e/ideal-generator.spec.ts
```

Expected: 4 tests pass

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/ideal-generator.spec.ts
git commit -m "test: add E2E smoke tests for ideal generator"
```

---

## Task 16: Quality Verification with DeepSeek V4 Pro

**Files:**
- Create: `tests/quality_verification.py` (manual run script)

- [ ] **Step 1: Create quality verification script**

Write `tests/quality_verification.py`:

```python
"""Manual quality verification — run against real DeepSeek V4 Pro.

Usage:
    GROUNDED_RESUME_DEEPSEEK_API_KEY=sk-xxx python tests/quality_verification.py
"""

import json
import os
import sys

from grounded_resume.core.config import LLMConfig
from grounded_resume.core.generator import (
    build_job_profile,
    generate_ideal_resume,
    analyze_gaps,
)
from grounded_resume.core.ideal_models import JobProfile
from grounded_resume.core.llm_service import LLMService


TEST_SAMPLES = [
    {
        "id": "sample_1",
        "target_role": "AI产品经理",
        "experience_level": "new_grad",
        "jd_text": """【岗位】AI产品经理实习生
【要求】
1. 本科及以上学历，计算机、AI相关专业优先
2. 熟悉大模型能力，有Prompt Engineering经验
3. 了解Agent、RAG等AI产品形态
4. 每周至少实习4天，至少3个月
5. 有产品实习经验优先""",
        "background": """
2023-2027 XX大学 计算机科学 本科
用Python做过课程项目：电影推荐系统
经常使用ChatGPT、Claude等AI工具
参加过一次校内黑客松
没有实习经历
""",
    },
]


def main():
    api_key = os.environ.get("GROUNDED_RESUME_DEEPSEEK_API_KEY")
    if not api_key:
        print("Set GROUNDED_RESUME_DEEPSEEK_API_KEY")
        sys.exit(1)

    config = LLMConfig(
        provider="deepseek",
        model="deepseek-v4-pro",
        temperature=0.1,
        max_tokens=8192,
        timeout_seconds=120,
        mode="hybrid",
        deepseek_api_key=api_key,
    )
    llm = LLMService(config=config)

    for sample in TEST_SAMPLES:
        print(f"\n{'='*60}")
        print(f"Sample: {sample['id']} — {sample['target_role']}")
        print(f"{'='*60}")

        # Step 1
        print("\n[1/3] Building job profile...")
        profile = build_job_profile(llm, sample["target_role"], sample["jd_text"])
        print(json.dumps(profile.model_dump(mode="json", by_alias=True), ensure_ascii=False, indent=2)[:500])

        # Step 2
        print("\n[2/3] Generating ideal resume...")
        resume_data = generate_ideal_resume(llm, profile, sample["target_role"], sample["experience_level"])
        md = resume_data.get("markdown", "")
        print(md[:500])

        # Step 3
        print("\n[3/3] Analyzing gaps...")
        gap_data = analyze_gaps(llm, profile, sample["background"], md, sample["experience_level"])
        print(f"Score: {gap_data.get('overall_score')}")
        print(f"Summary: {gap_data.get('summary')}")
        print(f"Blockers: {len(gap_data.get('blockers', []))}")
        print(f"Critical gaps: {len(gap_data.get('critical_gaps', []))}")
        print(f"Expression tips: {len(gap_data.get('expression_tips', []))}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run quality verification against DeepSeek**

(Manual step with API key)
```bash
GROUNDED_RESUME_DEEPSEEK_API_KEY=sk-xxx python tests/quality_verification.py
```

- [ ] **Step 3: Rate output against quality criteria**

For each sample, score 5 dimensions (each 0-5, pass ≥4):

| Dimension | Sample 1 | Pass? |
|---|---|---|
| 理想简历-岗位对齐度 | /5 | |
| 理想简历-表达具象度 | /5 | |
| 理想简历-结构完整度 | /5 | |
| 差距报告-致命差距准确度 | /5 | |
| 差距报告-补足路径可执行性 | /5 | |

- [ ] **Step 4: Compare with ChatGPT baseline**

Run the same 3 samples through ChatGPT web, compare scores.

- [ ] **Step 5: Commit**

```bash
git add tests/quality_verification.py
git commit -m "test: add quality verification script for DeepSeek V4 Pro"
```

---

## Final Verification Checklist

- [ ] Backend starts: `make dev-backend`
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Integration tests: `python -m pytest tests/test_ideal_generator.py -v`
- [ ] E2E tests: `cd frontend && npx playwright test e2e/ideal-generator.spec.ts`
- [ ] Quality samples pass against DeepSeek V4 Pro
- [ ] Full verify: `make verify`

---

*Plan version: v1.0*
*Spec reference: docs/superpowers/specs/2026-05-05-ideal-resume-generator-design.md*
