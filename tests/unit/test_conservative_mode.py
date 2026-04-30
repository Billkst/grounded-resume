# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportAttributeAccessIssue=false, reportUnknownArgumentType=false

from typing import Literal

from grounded_resume.core.models import (
    EvidenceMapping,
    EvidenceMappingResult,
    EvidenceRef,
    GapItem,
    ResumeBullet,
    ResumeDraft,
    ResumeSection,
)
import grounded_resume.core.safety.conservative_mode as conservative_mode


def _draft() -> ResumeDraft:
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
                        text="优化了报表流程",
                        evidence_refs=[EvidenceRef(mapping_id="EM-001", fact_ids=["MF-001"], source_fragments=[])],
                        expression_level="emphasized",
                        rewrite_chain=[],
                        risk_level="safe",
                    ),
                    ResumeBullet(
                        id="B002",
                        text="整理了数据",
                        evidence_refs=[EvidenceRef(mapping_id="EM-002", fact_ids=["MF-002"], source_fragments=[])],
                        expression_level="standard",
                        rewrite_chain=[],
                        risk_level="safe",
                    ),
                    ResumeBullet(
                        id="B003",
                        text="协助团队",
                        evidence_refs=[EvidenceRef(mapping_id="EM-003", fact_ids=["MF-003"], source_fragments=[])],
                        expression_level="conservative",
                        rewrite_chain=[],
                        risk_level="safe",
                    ),
                ],
            )
        ],
    )


def _mapping(
    mapping_id: str,
    strength: Literal["strong", "moderate", "weak", "insufficient"],
    mapping_type: Literal["direct", "semantic", "inferential", "composite"] = "direct",
) -> EvidenceMapping:
    return EvidenceMapping(
        id=mapping_id,
        jd_requirement_id=f"CR-{mapping_id}",
        material_fact_ids=[f"MF-{mapping_id}"],
        mapping_type=mapping_type,
        strength=strength,
        reasoning="reason",
        direct_quote="quote",
    )


def test_apply_keeps_normal_mode_for_high_coverage_strong_evidence() -> None:
    mapping_result = EvidenceMappingResult(
        mappings=[
            _mapping("001", "strong"),
            _mapping("002", "strong"),
        ],
        gaps=[],
        overclaims=[],
        mapping_confidence=1.0,
    )

    result = conservative_mode.ConservativeMode().apply(mapping_result, _draft())

    bullets = [bullet for section in result.sections for bullet in section.bullets]
    assert [bullet.expression_level for bullet in bullets] == ["emphasized", "standard", "conservative"]
    assert [bullet.text for bullet in bullets] == ["优化了报表流程", "整理了数据", "协助团队"]


def test_apply_downgrades_bullets_in_conservative_mode() -> None:
    mapping_result = EvidenceMappingResult(
        mappings=[
            _mapping("001", "moderate", "composite"),
            _mapping("002", "strong", "composite"),
            _mapping("003", "moderate"),
        ],
        gaps=[
            GapItem(
                id="GAP-001",
                jd_requirement_id="CR-004",
                gap_type="missing_evidence",
                description="missing",
                severity="critical",
            )
        ],
        overclaims=[],
        mapping_confidence=0.75,
    )

    result = conservative_mode.ConservativeMode().apply(mapping_result, _draft())

    bullets = [bullet for section in result.sections for bullet in section.bullets]
    assert [bullet.expression_level for bullet in bullets] == ["standard", "conservative", "literal"]
    assert [bullet.text for bullet in bullets] == ["优化了报表流程", "整理了数据", "协助团队"]


def test_apply_minimizes_bullets_when_coverage_is_low() -> None:
    mapping_result = EvidenceMappingResult(
        mappings=[_mapping("001", "weak")],
        gaps=[
            GapItem(
                id="GAP-001",
                jd_requirement_id="CR-004",
                gap_type="missing_evidence",
                description="missing",
                severity="critical",
            )
        ],
        overclaims=[],
        mapping_confidence=0.25,
    )

    result = conservative_mode.ConservativeMode().apply(mapping_result, _draft())

    bullets = [bullet for section in result.sections for bullet in section.bullets]
    assert [bullet.expression_level for bullet in bullets] == ["literal", "literal", "literal"]
    assert [bullet.text for bullet in bullets] == ["", "", ""]
