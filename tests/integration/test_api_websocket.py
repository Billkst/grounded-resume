# pyright: reportAny=false, reportIndexIssue=false, reportMissingImports=false, reportUnknownArgumentType=false, reportUnknownMemberType=false, reportUnknownVariableType=false

from __future__ import annotations

from fastapi.testclient import TestClient

from grounded_resume.api.main import create_app


def test_session_progress_websocket_emits_ordered_stages() -> None:
    client = TestClient(create_app())

    with client.websocket_connect("/ws/sessions/test-001") as websocket:
        stages = [websocket.receive_json()["stage"] for _ in range(5)]

    assert stages == [
        "jd_parsing",
        "material_parsing",
        "mapping",
        "generation",
        "validation",
    ]
