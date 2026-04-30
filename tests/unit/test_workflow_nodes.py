# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
from grounded_resume.core.workflow.nodes import parse_jd_node, parse_materials_node
from grounded_resume.core.workflow.state import WorkflowState
from grounded_resume.core.models import RawMaterial, TargetJob, UserInput, UserPreferences, UserProfile


def _build_state() -> WorkflowState:
    return WorkflowState(
        user_input=UserInput(
            profile=UserProfile(name="张三", email="zhangsan@example.com"),
            target_job=TargetJob(
                company_name="Example AI",
                job_title="AI 产品实习生",
                job_description="负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读，需要理解 AIGC 产品并具备基础数据分析意识。",
            ),
            materials=[
                RawMaterial(
                    id="M001",
                    type="project",
                    title="RAG 课程项目",
                    content="我做过一个 RAG 问答助手课程项目，负责整理知识库和测试 prompt 效果。",
                )
            ],
            preferences=UserPreferences(),
        )
    )


def test_parse_jd_node_updates_state_and_serializes() -> None:
    state = _build_state()

    next_state = parse_jd_node(state)

    assert next_state.jd_result is not None
    assert next_state.jd_result.core_capabilities

    dumped = next_state.to_dict()
    restored = WorkflowState.from_dict(dumped)
    assert restored.jd_result is not None
    assert restored.jd_result.core_capabilities


def test_parse_materials_node_updates_state_and_serializes() -> None:
    state = _build_state()

    next_state = parse_materials_node(state)

    assert next_state.material_result is not None
    assert next_state.material_result.facts

    dumped = next_state.to_dict()
    restored = WorkflowState.from_dict(dumped)
    assert restored.material_result is not None
    assert restored.material_result.facts
