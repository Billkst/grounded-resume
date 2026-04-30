# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
from grounded_resume.core.models import RawMaterial, TargetJob, UserInput, UserProfile
from grounded_resume.core.workflow.graph import build_workflow_graph
from grounded_resume.core.workflow.state import WorkflowState


def test_workflow_graph_runs_end_to_end() -> None:
    graph = build_workflow_graph()

    user_input = UserInput(
        profile=UserProfile(name="张三", email="zhangsan@example.com"),
        target_job=TargetJob(
            company_name="Example AI",
            job_title="AI 产品实习生",
            job_description=(
                "负责 AI 产品调研，竞品分析，用户反馈整理，要求本科及以上在读。"
                "熟悉 Python，并理解基础数据分析。"
            ),
        ),
        materials=[
            RawMaterial(
                id="M001",
                type="project",
                title="RAG",
                content="用 Python 整理知识库。",
            )
        ],
    )

    initial_state = WorkflowState(user_input=user_input)
    result = graph.invoke(initial_state.to_dict())

    assert result["draft"] is not None
