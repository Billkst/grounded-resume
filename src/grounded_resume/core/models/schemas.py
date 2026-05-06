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
