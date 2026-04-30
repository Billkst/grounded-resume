# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false
from __future__ import annotations

from grounded_resume.core.confirmation.user_confirmation import UserConfirmation
from grounded_resume.core.models import (
    ConfirmationSession,
    EvidenceRef,
    ResumeBullet,
    ResumeDraft,
    ResumeSection,
    ValidationResult,
    ValidationScore,
)


def _build_draft() -> ResumeDraft:
    return ResumeDraft(
        version=1,
        sections=[
            ResumeSection(
                id="S001",
                section_type="experience",
                title="项目经历",
                order=1,
                bullets=[
                    ResumeBullet(
                        id="B_SAFE",
                        text="参与整理课程项目知识库。",
                        evidence_refs=[
                            EvidenceRef(mapping_id="EM001", fact_ids=["F001"], source_fragments=["SF001"])
                        ],
                        expression_level="conservative",
                        rewrite_chain=[],
                        risk_level="safe",
                    ),
                    ResumeBullet(
                        id="B_WARN",
                        text="主导优化课程项目检索效果。",
                        evidence_refs=[
                            EvidenceRef(mapping_id="EM002", fact_ids=["F002"], source_fragments=["SF002"])
                        ],
                        expression_level="standard",
                        rewrite_chain=[],
                        risk_level="warning",
                    ),
                ],
            )
        ],
    )


def _build_validation() -> ValidationResult:
    return ValidationResult(
        passed=True,
        checks=[],
        overall_score=ValidationScore(
            authenticity=90,
            jd_alignment=80,
            expression_quality=85,
            structural_completeness=88,
            modification_cost_estimate=20,
        ),
    )


def test_build_session_sorts_by_risk_priority() -> None:
    session = UserConfirmation.build_session(_build_draft(), _build_validation())

    assert isinstance(session, ConfirmationSession)
    assert [item.bullet_id for item in session.items] == ["B_WARN", "B_SAFE"]
    assert [item.system_recommendation for item in session.items] == ["revise", "approve"]


def test_apply_decision_approve_keeps_bullet_and_marks_override() -> None:
    draft = _build_draft()

    updated = UserConfirmation.apply_decision(draft, "B_SAFE", "approve")

    bullet = updated.sections[0].bullets[0]
    assert bullet.id == "B_SAFE"
    assert bullet.user_override is not None
    assert bullet.user_override.approved is True


def test_apply_decision_reject_removes_bullet() -> None:
    draft = _build_draft()

    updated = UserConfirmation.apply_decision(draft, "B_WARN", "reject")

    assert [bullet.id for bullet in updated.sections[0].bullets] == ["B_SAFE"]
