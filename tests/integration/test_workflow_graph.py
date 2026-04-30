# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
from pathlib import Path
from typing import cast

from langchain_core.runnables.config import RunnableConfig

from grounded_resume.core.models import RawMaterial, TargetJob, UserInput, UserProfile
from grounded_resume.core.workflow.graph import build_workflow_graph
from grounded_resume.core.workflow.state import WorkflowState
from grounded_resume.db import SQLiteStore


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


def test_workflow_graph_persists_checkpoint_state(tmp_path: Path) -> None:
    db_path = tmp_path / "grounded-resume.db"
    store = SQLiteStore(db_path)
    store.initialize()

    graph = build_workflow_graph(checkpointer=store.create_checkpointer())

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
    config = cast(RunnableConfig, cast(object, {"configurable": {"thread_id": "thread-1"}}))
    result = graph.invoke(initial_state.to_dict(), config)

    reloaded_store = SQLiteStore(db_path)
    reloaded_store.initialize()
    reloaded_graph = build_workflow_graph(checkpointer=reloaded_store.create_checkpointer())

    snapshot = reloaded_graph.get_state(config)

    assert snapshot.values == result
