"""Data models for the ideal resume generator pipeline."""

from __future__ import annotations

from pydantic import Field

from grounded_resume.core.models.schemas import StrictModel


class HardRequirement(StrictModel):
    requirement: str
    category: str  # education | major | skill | availability | other


class CoreCapability(StrictModel):
    name: str
    weight: int = Field(ge=1, le=10)
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
