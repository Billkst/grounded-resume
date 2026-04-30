# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
from __future__ import annotations

from grounded_resume.core.confirmation.user_confirmation import UserConfirmation
from grounded_resume.core.models import (
    EvidenceMapping,
    EvidenceMappingResult,
    EvidenceRef,
    ResumeBullet,
    ResumeDraft,
    ResumeSection,
    TargetJob,
    ValidationResult,
    ValidationScore,
)
from grounded_resume.core.output.resume_formatter import ResumeFormatter


def test_full_confirmation_output_pipeline() -> None:
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
                        text="负责整理课程项目知识库并测试 prompt 效果。",
                        evidence_refs=[
                            EvidenceRef(mapping_id="EM001", fact_ids=["F001"], source_fragments=["SF001"])
                        ],
                        expression_level="conservative",
                        risk_level="safe",
                    )
                ],
            )
        ],
    )

    validation = ValidationResult(
        passed=True,
        checks=[],
        overall_score=ValidationScore(
            authenticity=92,
            jd_alignment=84,
            expression_quality=88,
            structural_completeness=90,
            modification_cost_estimate=12,
        ),
    )

    session = UserConfirmation.build_session(draft, validation)
    confirmed_draft = UserConfirmation.apply_decision(session.final_resume, "B001", "approve")

    output = ResumeFormatter().format(
        confirmed_resume=confirmed_draft,
        evidence_mapping=EvidenceMappingResult(
            mappings=[
                EvidenceMapping(
                    id="EM001",
                    jd_requirement_id="C001",
                    material_fact_ids=["F001"],
                    mapping_type="direct",
                    strength="strong",
                    reasoning="与 JD 要求直接匹配",
                    direct_quote="负责整理课程项目知识库并测试 prompt 效果。",
                )
            ],
            gaps=[],
            overclaims=[],
            mapping_confidence=1.0,
        ),
        gap_items=[],
        risk_flags=[],
        target_job=TargetJob(
            company_name="Example AI",
            job_title="AI 产品实习生",
            job_description=(
                "负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读。"
                "需要理解 AIGC 产品并具备基础数据分析意识。"
                "熟悉 Python 和 SQL。"
            ),
        ),
    )

    assert output.metadata.gap_count == 0
    assert len(output.attachments) == 4
    assert {attachment.type for attachment in output.attachments} == {
        "evidence_map",
        "gap_report",
        "risk_summary",
        "modification_guide",
    }
