# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
from grounded_resume.core.mapping.evidence_mapper import EvidenceMapper
from grounded_resume.core.models import RawMaterial, TargetJob, UserInput, UserProfile
from grounded_resume.core.parsing.jd_parser import JDParser
from grounded_resume.core.parsing.material_parser import MaterialParser


def test_full_parse_map_pipeline() -> None:
    user_input = UserInput(
        profile=UserProfile(name="张三", email="zhangsan@example.com"),
        target_job=TargetJob(
            company_name="Example AI",
            job_title="AI 产品实习生",
            job_description=(
                "负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读。"
                "需要理解 AIGC 产品并具备基础数据分析意识。"
                "需要具备产品判断能力。"
                "熟悉 Python 和 SQL。"
            ),
        ),
        materials=[
            RawMaterial(
                id="M001",
                type="project",
                title="RAG 项目",
                content="我做过一个 RAG 问答助手课程项目，用 Python 整理知识库和测试 prompt 效果。",
            )
        ],
    )

    jd_result = JDParser().parse(user_input.target_job.job_description)
    material_result = MaterialParser().parse(user_input.materials)
    mapping_result = EvidenceMapper().map(jd_result, material_result)

    assert len(jd_result.core_capabilities) >= 2
    assert len(material_result.facts) >= 1
    assert len(mapping_result.mappings) >= 1
    assert all(m.jd_requirement_id for m in mapping_result.mappings)
    assert all(g.jd_requirement_id for g in mapping_result.gaps)
