# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false, reportUntypedBaseClass=false, reportUntypedFunctionDecorator=false, reportUnannotatedClassAttribute=false
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

MaterialType = Literal["education", "project", "competition", "campus", "skill", "work", "other"]
Tone = Literal["conservative", "balanced", "confident"]
HardType = Literal["education", "major", "location", "availability", "language", "tool", "visa", "other"]
EvidenceType = Literal[
    "project_outcome",
    "technical_depth",
    "product_judgment",
    "research_analysis",
    "collaboration",
    "learning_agility",
    "communication",
]
Priority = Literal["critical", "important", "nice_to_have"]
JobLevel = Literal["intern", "junior", "mid", "senior"]
JDSection = Literal["description", "requirements", "preferred", "other"]
FactType = Literal["action", "outcome", "skill_possessed", "skill_used", "knowledge", "trait"]
FactConfidence = Literal["explicit", "inferred_weak", "inferred_strong"]
RoleLevel = Literal["solo", "lead", "core", "participant", "observer"]
MappingType = Literal["direct", "semantic", "inferential", "composite"]
EvidenceStrength = Literal["strong", "moderate", "weak", "insufficient"]
GapType = Literal["missing_evidence", "insufficient_depth", "unclear_scope", "temporal_mismatch"]
GapSeverity = Literal["critical", "major", "minor"]
SectionType = Literal["basic_info", "education", "experience", "skills", "summary", "additional"]
ExpressionLevel = Literal["literal", "conservative", "standard", "emphasized"]
RiskLevel = Literal["safe", "caution", "warning", "redline"]
RewriteOperator = Literal["system", "guardrail", "user"]
RiskType = Literal[
    "fabrication",
    "exaggeration",
    "role_inflation",
    "outcome_inference",
    "scope_ambiguity",
    "temporal_fabrication",
    "keyword_injection",
]
FindingSeverity = Literal["info", "warning", "error"]
RevisionPriority = Literal["mandatory", "suggested"]
Recommendation = Literal["approve", "revise", "reject"]
UserDecisionValue = Literal["approve", "revise", "reject"]
GapUserAction = Literal["accept", "will_supplement", "acknowledge"]
AttachmentType = Literal["evidence_map", "gap_report", "risk_summary", "modification_guide"]


def to_camel(snake: str) -> str:
    parts = snake.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class StrictModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
        alias_generator=to_camel,
        serialize_by_alias=True,
    )


class UserProfile(StrictModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    phone: str | None = None
    github: str | None = None
    blog: str | None = None
    location: str | None = None


class TargetJob(StrictModel):
    company_name: str = Field(min_length=1)
    job_title: str = Field(min_length=1)
    job_description: str
    source_url: HttpUrl | None = None

    @field_validator("job_description")
    @classmethod
    def validate_job_description_length(cls, value: str) -> str:
        if len(value.strip()) < 50:
            raise ValueError("jobDescription must contain at least 50 characters")
        return value


class RawMaterial(StrictModel):
    id: str = Field(min_length=1)
    type: MaterialType
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    timestamp: str | None = None
    source_hint: str | None = None


class UserPreferences(StrictModel):
    tone: Tone = "balanced"
    allow_downgrade: bool = True
    show_gap_analysis: bool = True
    max_bullets: int = Field(default=10, ge=1, le=20)


class UserInput(StrictModel):
    profile: UserProfile
    target_job: TargetJob
    materials: list[RawMaterial] = Field(min_length=1)
    preferences: UserPreferences = Field(default_factory=UserPreferences)


class HardRequirement(StrictModel):
    id: str
    category: HardType
    description: str
    source_text: str
    is_satisfiable_by_evidence: bool


class CapabilityRequirement(StrictModel):
    id: str
    capability: str
    description: str
    evidence_type: EvidenceType
    priority: Priority
    source_text: str
    related_keywords: list[str] = Field(default_factory=list)


class JobContext(StrictModel):
    job_level: JobLevel
    team_focus: list[str] = Field(default_factory=list)
    product_stage: str | None = None
    tech_stack_mentioned: list[str] = Field(default_factory=list)
    culture_signals: list[str] = Field(default_factory=list)


class JDExcerpt(StrictModel):
    id: str
    text: str
    section: JDSection
    line_number: int | None = Field(default=None, ge=1)


class JDParsedResult(StrictModel):
    job_id: str
    hard_requirements: list[HardRequirement] = Field(default_factory=list)
    core_capabilities: list[CapabilityRequirement] = Field(default_factory=list)
    nice_to_have: list[CapabilityRequirement] = Field(default_factory=list)
    derived_context: JobContext
    parser_confidence: float = Field(ge=0, le=1)
    raw_excerpts: list[JDExcerpt] = Field(default_factory=list)


class MaterialFact(StrictModel):
    id: str
    source_material_id: str
    fact_type: FactType
    statement: str
    confidence: FactConfidence
    temporal_scope: str | None = None
    role_indicator: RoleLevel | None = None
    skill_tags: list[str] = Field(default_factory=list)
    topic_tags: list[str] = Field(default_factory=list)
    outcome_tags: list[str] = Field(default_factory=list)


class SourceFragment(StrictModel):
    id: str
    material_id: str
    text: str
    start_offset: int = Field(ge=0)
    end_offset: int = Field(ge=0)


class ParserNote(StrictModel):
    level: Literal["info", "warning", "critical"]
    material_id: str
    message: str


class MaterialParseResult(StrictModel):
    facts: list[MaterialFact] = Field(default_factory=list)
    fragments: list[SourceFragment] = Field(default_factory=list)
    parser_notes: list[ParserNote] = Field(default_factory=list)


class EvidenceMapping(StrictModel):
    id: str
    jd_requirement_id: str
    material_fact_ids: list[str] = Field(min_length=1)
    mapping_type: MappingType
    strength: EvidenceStrength
    reasoning: str
    direct_quote: str


class GapItem(StrictModel):
    id: str
    jd_requirement_id: str
    gap_type: GapType
    description: str
    severity: GapSeverity
    recommendation: str | None = None


class OverclaimItem(StrictModel):
    id: str
    material_fact_id: str
    reason: str
    suggestion: str | None = None


class EvidenceMappingResult(StrictModel):
    mappings: list[EvidenceMapping] = Field(default_factory=list)
    gaps: list[GapItem] = Field(default_factory=list)
    overclaims: list[OverclaimItem] = Field(default_factory=list)
    mapping_confidence: float = Field(ge=0, le=1)


class EvidenceRef(StrictModel):
    mapping_id: str
    fact_ids: list[str] = Field(min_length=1)
    source_fragments: list[str] = Field(default_factory=list)


class RewriteStep(StrictModel):
    step: int = Field(ge=1)
    from_: str = Field(alias="from")
    to: str
    reason: str
    operator: RewriteOperator


class UserOverride(StrictModel):
    approved: bool
    modified_text: str | None = None
    rejection_reason: str | None = None


class ResumeBullet(StrictModel):
    id: str
    text: str
    evidence_refs: list[EvidenceRef] = Field(min_length=1)
    expression_level: ExpressionLevel
    rewrite_chain: list[RewriteStep] = Field(default_factory=list)
    risk_level: RiskLevel
    user_override: UserOverride | None = None


class ResumeSection(StrictModel):
    id: str
    section_type: SectionType
    title: str
    bullets: list[ResumeBullet] = Field(default_factory=list)
    order: int


class GenerationLog(StrictModel):
    step: str
    decision: str
    rationale: str


class RiskFlag(StrictModel):
    bullet_id: str
    risk_type: RiskType
    severity: Literal["low", "medium", "high"]
    description: str
    suggested_fix: str
    auto_resolved: bool


class ResumeDraft(StrictModel):
    version: int = Field(ge=1)
    sections: list[ResumeSection] = Field(default_factory=list)
    generation_log: list[GenerationLog] = Field(default_factory=list)
    risk_flags: list[RiskFlag] = Field(default_factory=list)


class Finding(StrictModel):
    bullet_id: str
    issue: str
    severity: FindingSeverity
    evidence: str | None = None


class CheckResult(StrictModel):
    check_id: str
    check_name: str
    passed: bool
    score: int = Field(ge=0, le=100)
    findings: list[Finding] = Field(default_factory=list)


class ValidationScore(StrictModel):
    authenticity: int = Field(ge=0, le=100)
    jd_alignment: int = Field(ge=0, le=100)
    expression_quality: int = Field(ge=0, le=100)
    structural_completeness: int = Field(ge=0, le=100)
    modification_cost_estimate: int = Field(ge=0, le=100)


class RevisionItem(StrictModel):
    id: str
    bullet_id: str
    original_text: str
    suggested_text: str
    reason: str
    priority: RevisionPriority
    resolved: bool


class ValidationResult(StrictModel):
    passed: bool
    checks: list[CheckResult] = Field(default_factory=list)
    overall_score: ValidationScore
    mandatory_revisions: list[RevisionItem] = Field(default_factory=list)
    suggested_revisions: list[RevisionItem] = Field(default_factory=list)


class EvidencePreview(StrictModel):
    source_material_title: str
    direct_quotes: list[str] = Field(default_factory=list)
    mapping_reasoning: str


class ConfirmationItem(StrictModel):
    id: str
    bullet_id: str
    proposed_text: str
    evidence_preview: EvidencePreview
    risk_notes: list[str] = Field(default_factory=list)
    system_recommendation: Recommendation


class UserDecision(StrictModel):
    confirmation_item_id: str
    decision: UserDecisionValue
    revised_text: str | None = None
    user_comment: str | None = None
    timestamp: datetime


class GapAcknowledgment(StrictModel):
    gap_id: str
    user_action: GapUserAction
    user_comment: str | None = None


class ConfirmationSession(StrictModel):
    session_id: str
    resume_version: int
    items: list[ConfirmationItem] = Field(default_factory=list)
    user_decisions: list[UserDecision] = Field(default_factory=list)
    final_resume: ResumeDraft
    gap_acknowledgments: list[GapAcknowledgment] = Field(default_factory=list)


class OutputMetadata(StrictModel):
    target_job: TargetJob
    generation_timestamp: datetime
    version: str
    confidence: float = Field(ge=0, le=1)
    material_coverage: float = Field(ge=0, le=1)
    gap_count: int = Field(ge=0)


class OutputAttachment(StrictModel):
    type: AttachmentType
    title: str
    content: str


class ResumeOutput(StrictModel):
    resume: ResumeDraft
    metadata: OutputMetadata
    attachments: list[OutputAttachment] = Field(default_factory=list)


__all__ = [
    "AttachmentType",
    "CapabilityRequirement",
    "CheckResult",
    "ConfirmationItem",
    "ConfirmationSession",
    "EvidenceMapping",
    "EvidenceMappingResult",
    "EvidencePreview",
    "EvidenceRef",
    "FactConfidence",
    "FactType",
    "Finding",
    "FindingSeverity",
    "GapAcknowledgment",
    "GapItem",
    "GapSeverity",
    "GapType",
    "GenerationLog",
    "HardRequirement",
    "HttpUrl",
    "JDExcerpt",
    "JDParsedResult",
    "JobContext",
    "MaterialFact",
    "MaterialParseResult",
    "MaterialType",
    "OutputAttachment",
    "OutputMetadata",
    "OverclaimItem",
    "ParserNote",
    "Priority",
    "RawMaterial",
    "Recommendation",
    "RevisionItem",
    "RevisionPriority",
    "RewriteStep",
    "RiskFlag",
    "RiskLevel",
    "RiskType",
    "ResumeBullet",
    "ResumeDraft",
    "ResumeOutput",
    "ResumeSection",
    "RoleLevel",
    "SectionType",
    "SourceFragment",
    "StrictModel",
    "TargetJob",
    "Tone",
    "UserDecision",
    "UserInput",
    "UserOverride",
    "UserPreferences",
    "UserProfile",
    "ValidationResult",
    "ValidationScore",
]
