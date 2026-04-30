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
        return {
            **state,
            "jd_result": {"requirements": []},
            "material_result": {"facts": [], "fragments": []},
            "mapping_result": {
                "mappings": [],
                "gaps": [
                    {
                        "id": "GAP001",
                        "jd_requirement_id": "C001",
                        "gap_type": "missing_evidence",
                        "description": "缺少数据分析经验",
                        "severity": "major",
                    }
                ],
                "overclaims": [],
                "mapping_confidence": 0.5,
            },
            "draft": {
                "version": 1,
                "sections": [
                    {
                        "id": "S001",
                        "section_type": "experience",
                        "title": "项目经历",
                        "order": 1,
                        "bullets": [
                            _build_bullet("B_SAFE", "参与整理课程项目知识库。", "safe"),
                            _build_bullet("B_CAUTION", "协助分析用户反馈。", "caution"),
                            _build_bullet("B_WARNING", "主导数据分析体系建设。", "warning"),
                        ],
                    }
                ],
            },
        }


def _build_bullet(bullet_id: str, text: str, risk_level: str) -> dict[str, object]:
    return {
        "id": bullet_id,
        "text": text,
        "evidence_refs": [
            {
                "mapping_id": "EM001",
                "fact_ids": ["F001"],
                "source_fragments": ["SF001"],
            }
        ],
        "expression_level": "conservative",
        "rewrite_chain": [],
        "risk_level": risk_level,
    }


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
    assert isinstance(payload["sessionId"], str)
    assert payload["sessionId"]
    assert fake_graph.last_state is not None
    assert fake_graph.last_state["user_input"]["profile"]["name"] == "张三"

    detail_response = client.get(f"/sessions/{payload['sessionId']}")

    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert detail_payload["sessionId"] == payload["sessionId"]
    assert detail_payload["status"] == "completed"
    assert detail_payload["result"]["draft"]["version"] == 1


def test_sessions_cors_preflight_allows_localhost_frontend() -> None:
    client = TestClient(create_app())

    response = client.options(
        "/sessions",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_submit_session_decisions_returns_final_resume_markdown() -> None:
    app = create_app()
    app.dependency_overrides[get_workflow_graph] = lambda: _FakeGraph()
    client = TestClient(app)
    create_response = client.post("/sessions", json=_build_user_input())
    session_id = create_response.json()["sessionId"]

    response = client.post(
        f"/sessions/{session_id}/decisions",
        json={
            "decisions": [
                {"bulletId": "B_SAFE", "decision": "approve"},
                {
                    "bulletId": "B_CAUTION",
                    "decision": "revise",
                    "revisedText": "协助整理并分析 20 条用户反馈。",
                },
                {"bulletId": "B_WARNING", "decision": "reject"},
            ]
        },
    )

    assert response.status_code == 200
    payload = response.json()
    resume_markdown = payload["finalOutput"]["resumeMarkdown"]
    assert "参与整理课程项目知识库。" in resume_markdown
    assert "协助整理并分析 20 条用户反馈。" in resume_markdown
    assert "主导数据分析体系建设。" not in resume_markdown


def test_submit_session_decisions_for_missing_session_returns_404() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/sessions/missing/decisions",
        json={"decisions": [{"bulletId": "B_SAFE", "decision": "approve"}]},
    )

    assert response.status_code == 404
