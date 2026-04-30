from grounded_resume.core.safety.redline_detector import RedlineDetector
from grounded_resume.core.models import EvidenceRef, ResumeBullet, ResumeDraft, ResumeSection


def test_detect_marks_numeric_claim_as_redline() -> None:
    draft = ResumeDraft(
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
                        text="提升 30% 转化率。",
                        evidence_refs=[
                            EvidenceRef(mapping_id="EM001", fact_ids=["F001"])
                        ],
                        expression_level="conservative",
                        risk_level="safe",
                    )
                ],
            )
        ],
    )

    result = RedlineDetector().detect(draft, [])

    assert result is not draft
    assert result.sections[0].bullets[0].risk_level == "redline"
    assert result.risk_flags[0].bullet_id == "B001"
    assert result.risk_flags[0].risk_type == "outcome_inference"
    assert result.risk_flags[0].severity == "high"


def test_detect_keeps_non_numeric_claim_safe() -> None:
    draft = ResumeDraft(
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
                        text="参与优化转化流程。",
                        evidence_refs=[
                            EvidenceRef(mapping_id="EM001", fact_ids=["F001"])
                        ],
                        expression_level="conservative",
                        risk_level="safe",
                    )
                ],
            )
        ],
    )

    result = RedlineDetector().detect(draft, [])

    assert result.sections[0].bullets[0].risk_level == "safe"
    assert result.risk_flags == []
