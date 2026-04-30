# pyright: reportAny=false, reportIndexIssue=false, reportMissingImports=false, reportUnknownArgumentType=false, reportUnknownMemberType=false, reportUnknownVariableType=false

from __future__ import annotations

from fastapi.testclient import TestClient

from grounded_resume.api.main import create_app
from grounded_resume.api.dependencies import get_workflow_graph
from grounded_resume.core.models import RawMaterial, TargetJob, UserInput, UserProfile


class _FakeGraph:
    def __init__(self) -> None:
        self.last_state: dict[str, object] | None = None

    def invoke(self, state: dict[str, object]) -> dict[str, object]:
        self.last_state = state
        return {**state, "draft": {"version": 1}}


def _build_user_input() -> dict[str, object]:
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
    return user_input.model_dump(mode="python", by_alias=True)


def test_health_endpoint_returns_ok_and_version() -> None:
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0"}


def test_post_sessions_runs_workflow_and_returns_session_status() -> None:
    app = create_app()
    fake_graph = _FakeGraph()
    app.dependency_overrides[get_workflow_graph] = lambda: fake_graph
    client = TestClient(app)

    response = client.post("/sessions", json=_build_user_input())

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "completed"
    assert isinstance(payload["session_id"], str)
    assert payload["session_id"]
    assert fake_graph.last_state is not None
    assert fake_graph.last_state["user_input"]["profile"]["name"] == "张三"

    detail_response = client.get(f"/sessions/{payload['session_id']}")

    assert detail_response.status_code == 200
    assert detail_response.json() == {"session_id": payload["session_id"], "status": "completed"}
