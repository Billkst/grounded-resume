# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false, reportImplicitStringConcatenation=false
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from grounded_resume.core.models import (
    CapabilityRequirement,
    EvidenceMapping,
    EvidenceRef,
    MaterialFact,
    OutputMetadata,
    RawMaterial,
    ResumeBullet,
    ResumeDraft,
    ResumeOutput,
    ResumeSection,
    RewriteStep,
    TargetJob,
    UserInput,
    UserProfile,
)


def test_user_input_accepts_minimum_valid_payload() -> None:
    user_input = UserInput(
        profile=UserProfile(name="张三", email="zhangsan@example.com"),
        targetJob=TargetJob(
            companyName="Example AI",
            jobTitle="AI 产品实习生",
            jobDescription="负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读。"
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

    assert user_input.preferences.tone == "balanced"
    assert user_input.preferences.allow_downgrade is True
    assert user_input.preferences.show_gap_analysis is True


def test_target_job_rejects_short_jd() -> None:
    with pytest.raises(ValidationError, match="jobDescription must contain at least 50 characters"):
        TargetJob(companyName="A", jobTitle="B", jobDescription="太短")


def test_raw_material_rejects_empty_content() -> None:
    with pytest.raises(ValidationError):
        RawMaterial(id="M001", type="project", title="项目", content="")


def test_evidence_mapping_requires_fact_reference() -> None:
    with pytest.raises(ValidationError):
        EvidenceMapping(
            id="EM001",
            jdRequirementId="C001",
            materialFactIds=[],
            mappingType="direct",
            strength="strong",
            reasoning="素材明确提到 Python。",
            directQuote="我会 Python。",
        )


def test_resume_bullet_requires_evidence_reference() -> None:
    with pytest.raises(ValidationError):
        ResumeBullet(
            id="B001",
            text="参与整理 AI 产品知识库。",
            evidenceRefs=[],
            expressionLevel="conservative",
            rewriteChain=[],
            riskLevel="safe",
        )


def test_rewrite_step_accepts_from_alias() -> None:
    step = RewriteStep.model_validate(
        {
            "step": 1,
            "from": "我整理过知识库。",
            "to": "参与整理课程项目知识库。",
            "reason": "保守表达用户原始动作。",
            "operator": "system",
        }
    )

    assert step.from_ == "我整理过知识库。"


def test_capability_requirement_accepts_priority() -> None:
    requirement = CapabilityRequirement(
        id="C001",
        capability="产品判断",
        description="能够分析 AI 产品能力边界。",
        evidenceType="product_judgment",
        priority="critical",
        sourceText="对 AI 产品的能力边界有思考。",
        relatedKeywords=["AI 产品", "能力边界"],
    )

    assert requirement.priority == "critical"


def test_material_fact_preserves_source_chain() -> None:
    fact = MaterialFact(
        id="F001",
        sourceMaterialId="M001",
        factType="action",
        statement="用户整理过知识库内容。",
        confidence="explicit",
        skillTags=["RAG"],
        topicTags=["知识库"],
        outcomeTags=["整理"],
    )

    assert fact.source_material_id == "M001"


def test_resume_output_roundtrips_to_json() -> None:
    draft = ResumeDraft(
        version=1,
        sections=[
            ResumeSection(
                id="S001",
                sectionType="experience",
                title="项目经历",
                order=1,
                bullets=[
                    ResumeBullet(
                        id="B001",
                        text="参与整理课程项目知识库。",
                        evidenceRefs=[
                            EvidenceRef(
                                mappingId="EM001",
                                factIds=["F001"],
                                sourceFragments=["SF001"],
                            )
                        ],
                        expressionLevel="conservative",
                        rewriteChain=[
                            RewriteStep(
                                step=1,
                                from_="我整理过知识库。",
                                to="参与整理课程项目知识库。",
                                reason="保守表达用户原始动作。",
                                operator="system",
                            )
                        ],
                        riskLevel="safe",
                    )
                ],
            )
        ],
    )
    target_job = TargetJob(
        companyName="Example AI",
        jobTitle="AI 产品实习生",
        jobDescription="负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读。"
        "需要理解 AIGC 产品并具备基础数据分析意识。",
    )
    output = ResumeOutput(
        resume=draft,
        metadata=OutputMetadata(
            targetJob=target_job,
            generationTimestamp=datetime(2026, 4, 30, tzinfo=UTC),
            version="0.1.0",
            confidence=0.8,
            materialCoverage=0.6,
            gapCount=2,
        ),
        attachments=[],
    )

    restored = ResumeOutput.model_validate_json(output.model_dump_json())

    assert restored.resume.sections[0].bullets[0].evidence_refs[0].fact_ids == ["F001"]
