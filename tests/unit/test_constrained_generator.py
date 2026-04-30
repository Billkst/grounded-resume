# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
from grounded_resume.core.generation.constrained_generator import ConstrainedGenerator
from grounded_resume.core.models import (
    EvidenceMapping,
    EvidenceMappingResult,
    RawMaterial,
    ResumeDraft,
    TargetJob,
    UserInput,
    UserProfile,
)


def _build_user_input() -> UserInput:
    return UserInput(
        profile=UserProfile(name="张三", email="zhangsan@example.com"),
        target_job=TargetJob(
            company_name="Example AI",
            job_title="AI 产品实习生",
            job_description="负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读，"
            "需要理解 AIGC 产品并具备基础数据分析意识。",
        ),
        materials=[
            RawMaterial(
                id="M001",
                type="project",
                title="RAG 课程项目",
                content="我做过一个 RAG 问答助手课程项目，负责整理知识库和测试 prompt 效果。",
            )
        ],
    )


def test_generator_creates_draft_with_evidence_refs() -> None:
    generator = ConstrainedGenerator()
    mapping_result = EvidenceMappingResult(
        mappings=[
            EvidenceMapping(
                id="EM001",
                jd_requirement_id="C001",
                material_fact_ids=["F001"],
                mapping_type="direct",
                strength="strong",
                reasoning="直接匹配",
                direct_quote="用 Python 分析数据",
            )
        ],
        gaps=[],
        overclaims=[],
        mapping_confidence=1.0,
    )

    draft = generator.generate(mapping_result, _build_user_input())

    assert isinstance(draft, ResumeDraft)
    assert len(draft.sections) >= 1
    assert any(len(section.bullets) > 0 for section in draft.sections)
    first_bullet = draft.sections[0].bullets[0]
    assert len(first_bullet.evidence_refs) >= 1


def test_generator_applies_expression_level_by_strength() -> None:
    generator = ConstrainedGenerator()
    mapping_result = EvidenceMappingResult(
        mappings=[
            EvidenceMapping(
                id="EM001",
                jd_requirement_id="C001",
                material_fact_ids=["F001"],
                mapping_type="direct",
                strength="weak",
                reasoning="弱匹配",
                direct_quote="接触过 Python",
            )
        ],
        gaps=[],
        overclaims=[],
        mapping_confidence=0.3,
    )

    draft = generator.generate(mapping_result, _build_user_input())

    first_bullet = draft.sections[0].bullets[0]
    assert first_bullet.expression_level in ("conservative", "literal")
