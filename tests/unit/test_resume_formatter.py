# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
from __future__ import annotations

from grounded_resume.core.models import (
    EvidenceMapping,
    EvidenceMappingResult,
    EvidenceRef,
    GapItem,
    OutputMetadata,
    ResumeBullet,
    ResumeDraft,
    ResumeOutput,
    ResumeSection,
    RiskFlag,
    TargetJob,
)
from grounded_resume.core.output.resume_formatter import ResumeFormatter


def _build_resume() -> ResumeDraft:
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
                                EvidenceRef(mapping_id="EM001", fact_ids=["F001"], source_fragments=[])
                            ],
                            expression_level="conservative",
                            risk_level="safe",
                        )
                ],
            )
        ],
    )


def _build_target_job() -> TargetJob:
    return TargetJob(
        company_name="Example AI",
        job_title="AI 产品实习生",
        job_description="负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读。需要理解 AIGC 产品并具备基础数据分析意识。",
    )


def test_formatter_includes_level_two_declaration() -> None:
    output = ResumeFormatter().format(
        confirmed_resume=_build_resume(),
        evidence_mapping=EvidenceMappingResult(mappings=[], gaps=[], overclaims=[], mapping_confidence=0.5),
        gap_items=[],
        risk_flags=[],
        target_job=_build_target_job(),
    )

    assert isinstance(output, ResumeOutput)
    assert isinstance(output.metadata, OutputMetadata)
    assert any("接近可投版" in attachment.content for attachment in output.attachments)


def test_formatter_includes_evidence_map_attachment() -> None:
    output = ResumeFormatter().format(
        confirmed_resume=_build_resume(),
        evidence_mapping=EvidenceMappingResult(
            mappings=[
                EvidenceMapping(
                    id="EM001",
                    jd_requirement_id="C001",
                    material_fact_ids=["F001"],
                    mapping_type="direct",
                    strength="strong",
                    reasoning="直接匹配",
                    direct_quote="测试",
                )
            ],
            gaps=[],
            overclaims=[],
            mapping_confidence=1.0,
        ),
        gap_items=[],
        risk_flags=[],
        target_job=_build_target_job(),
    )

    assert any(attachment.type == "evidence_map" for attachment in output.attachments)


def test_formatter_includes_gap_report_when_gaps_exist() -> None:
    output = ResumeFormatter().format(
        confirmed_resume=_build_resume(),
        evidence_mapping=EvidenceMappingResult(mappings=[], gaps=[], overclaims=[], mapping_confidence=0.0),
        gap_items=[
            GapItem(
                id="GAP001",
                jd_requirement_id="C001",
                gap_type="missing_evidence",
                description="缺少数据分析经验",
                severity="major",
            )
        ],
        risk_flags=[
            RiskFlag(
                bullet_id="B001",
                risk_type="scope_ambiguity",
                severity="medium",
                description="表述略泛",
                suggested_fix="补充具体动作",
                auto_resolved=False,
            )
        ],
        target_job=_build_target_job(),
    )

    gap_report = next(attachment for attachment in output.attachments if attachment.type == "gap_report")
    assert gap_report.title == "Gap 报告"
    assert "缺少数据分析经验" in gap_report.content
