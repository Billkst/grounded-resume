"""Data models for the ideal resume generator pipeline."""

from __future__ import annotations

from typing import Any

from pydantic import Field, field_validator, model_validator

from grounded_resume.core.models.schemas import StrictModel


def _classify_hard_requirement(text: str) -> str:
    """Infer the category of a hard requirement from its text."""
    if any(kw in text for kw in ["学历", "本科", "硕士", "博士", "研究生"]):
        return "education"
    if any(kw in text for kw in ["专业", "计算机", "软件工程", "人工智能", "AI"]):
        return "major"
    if any(kw in text for kw in ["实习", "每周", "到岗", "天", "月", "周"]):
        return "availability"
    if any(kw in text for kw in ["熟悉", "掌握", "精通", "了解", "经验", "能力"]):
        return "skill"
    return "other"


class HardRequirement(StrictModel):
    requirement: str
    category: str = "other"

    @field_validator("category", mode="before")
    @classmethod
    def infer_category(cls, v: Any, info: Any) -> str:
        if isinstance(v, str) and v not in ("education", "major", "skill", "availability", "other"):
            return _classify_hard_requirement(v)
        return v if isinstance(v, str) and v else "other"


class CoreCapability(StrictModel):
    name: str
    weight: int = Field(default=5, ge=1, le=10)
    description: str = ""

    @model_validator(mode="before")
    @classmethod
    def map_llm_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            capability_val = data.pop("capability", None)
            if capability_val is not None and "name" not in data:
                data["name"] = capability_val
            if "weight" not in data:
                data["weight"] = 5
            if "description" not in data:
                data["description"] = ""
        return data


class JobProfile(StrictModel):
    hard_requirements: list[HardRequirement]
    core_capabilities: list[CoreCapability]
    bonus_points: list[str] = []
    ats_keywords_high: list[str] = []
    ats_keywords_medium: list[str] = []
    ideal_candidate_profile: str = ""

    @field_validator("hard_requirements", mode="before")
    @classmethod
    def coerce_hard_requirements(cls, v: Any) -> Any:
        if isinstance(v, list):
            return [
                {"requirement": item} if isinstance(item, str) else item
                for item in v
            ]
        return v


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
    overall_score: int = Field(ge=0, le=100)
    summary: str
    blockers: list[BlockerItem]
    critical_gaps: list[CriticalGapItem]
    expression_tips: list[ExpressionTip]


class LlmConfigInput(StrictModel):
    provider: str = "deepseek"
    model: str = "deepseek-v4-pro"
    api_key: str = ""


class GenerateRequest(StrictModel):
    experience_level: str  # new_grad | 1_3_years | 3_5_years | 5_10_years | 10_plus_years
    target_role: str
    background: str
    jd_text: str = ""
    job_profile_id: str | None = None
    llm_config: LlmConfigInput | None = None


class GenerateResponse(StrictModel):
    session_id: str
    status: str  # processing | completed | failed
    progress: str = ""  # job_profile | generating_resume | analyzing_gaps | done
    ideal_resume: IdealResume | None = None
    gap_report: GapReport | None = None
    error: str | None = None
