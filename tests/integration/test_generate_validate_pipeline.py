# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
from grounded_resume.core.generation.constrained_generator import ConstrainedGenerator
from grounded_resume.core.models import (
    EvidenceMapping,
    EvidenceMappingResult,
    MaterialFact,
    RawMaterial,
    ResumeDraft,
    TargetJob,
    UserInput,
    UserProfile,
)
from grounded_resume.core.safety.conservative_mode import ConservativeMode
from grounded_resume.core.safety.expression_guard import ExpressionGuard
from grounded_resume.core.safety.redline_detector import RedlineDetector
from grounded_resume.core.validation.validator import Validator


def test_full_generate_validate_pipeline() -> None:
    mapping_result = EvidenceMappingResult(
        mappings=[
            EvidenceMapping(
                id="EM001",
                jd_requirement_id="C001",
                material_fact_ids=["F001"],
                mapping_type="direct",
                strength="weak",
                reasoning="弱证据映射",
                direct_quote="负责 30% 转化率优化",
            ),
            EvidenceMapping(
                id="EM002",
                jd_requirement_id="C002",
                material_fact_ids=["F002"],
                mapping_type="composite",
                strength="strong",
                reasoning="组合证据映射",
                direct_quote="参与课程项目知识整理",
            ),
        ],
        gaps=[],
        overclaims=[],
        mapping_confidence=0.5,
    )

    user_input = UserInput(
        profile=UserProfile(name="张三", email="zhangsan@example.com"),
        target_job=TargetJob(
            company_name="Example AI",
            job_title="AI 产品实习生",
            job_description=(
                "负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读。"
                "需要理解 AIGC 产品并具备基础数据分析意识。"
                "熟悉 Python 和 SQL。"
            ),
        ),
        materials=[
            RawMaterial(
                id="M001",
                type="project",
                title="RAG 项目",
                content="我做过一个 RAG 问答助手课程项目，用 Python 整理知识库并测试 prompt 效果。",
            )
        ],
    )

    generator = ConstrainedGenerator()
    expression_guard = ExpressionGuard()
    redline_detector = RedlineDetector()
    conservative_mode = ConservativeMode()

    draft = generator.generate(mapping_result, user_input)
    draft = expression_guard.guard(draft)
    material_facts = [
        MaterialFact(
            id="F001",
            source_material_id="M001",
            fact_type="skill_used",
            statement="使用 Python 整理知识库。",
            confidence="explicit",
        ),
        MaterialFact(
            id="F002",
            source_material_id="M001",
            fact_type="outcome",
            statement="测试 prompt 效果。",
            confidence="inferred_weak",
        ),
    ]
    draft = redline_detector.detect(draft, material_facts)
    draft = conservative_mode.apply(mapping_result, draft)
    validation_result = Validator.validate(draft)

    assert isinstance(draft, ResumeDraft)
    assert draft.sections[0].bullets[0].expression_level == "conservative"
    assert draft.sections[0].bullets[0].text == "参与 30% 转化率优化"
    assert draft.sections[0].bullets[0].risk_level == "redline"
    assert len(draft.sections[0].bullets[0].rewrite_chain) >= 1
    assert draft.risk_flags
    assert validation_result.passed is True
