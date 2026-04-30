# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
from grounded_resume.core.models import EvidenceRef, ResumeBullet, ResumeDraft, ResumeSection
from grounded_resume.core.validation.validator import Validator


def _build_complete_draft() -> ResumeDraft:
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
                        id="B001",
                        text="参与整理课程项目知识库。",
                        evidence_refs=[
                            EvidenceRef(mapping_id="EM001", fact_ids=["F001"], source_fragments=["SF001"])
                        ],
                        expression_level="conservative",
                        rewrite_chain=[],
                        risk_level="safe",
                    ),
                    ResumeBullet(
                        id="B002",
                        text="协助测试检索效果并记录结果。",
                        evidence_refs=[
                            EvidenceRef(mapping_id="EM002", fact_ids=["F002"], source_fragments=["SF002"])
                        ],
                        expression_level="conservative",
                        rewrite_chain=[],
                        risk_level="safe",
                    ),
                ],
            )
        ],
    )


def _build_missing_evidence_draft() -> ResumeDraft:
    bullet = ResumeBullet.model_construct(
        id="B001",
        text="参与整理课程项目知识库。",
        evidence_refs=[],
        expression_level="conservative",
        rewrite_chain=[],
        risk_level="safe",
    )
    section = ResumeSection.model_construct(
        id="S001",
        section_type="experience",
        title="项目经历",
        bullets=[bullet],
        order=1,
    )
    return ResumeDraft.model_construct(version=1, sections=[section], generation_log=[], risk_flags=[])


def test_validator_passes_complete_draft() -> None:
    result = Validator.validate(_build_complete_draft())

    assert result.passed is True
    assert result.overall_score.authenticity == 100
    assert result.overall_score.jd_alignment == 60
    assert result.overall_score.expression_quality == 70
    assert result.overall_score.structural_completeness == 100
    assert result.overall_score.modification_cost_estimate == 50
    assert len(result.checks) == 2


def test_validator_fails_when_bullet_has_no_evidence_refs() -> None:
    result = Validator.validate(_build_missing_evidence_draft())

    assert result.passed is False
    assert result.overall_score.authenticity == 0
    assert result.checks[0].passed is False
    assert result.checks[0].findings[0].bullet_id == "B001"
    assert result.checks[1].passed is True
