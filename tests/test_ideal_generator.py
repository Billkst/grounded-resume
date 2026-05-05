"""Integration tests for ideal resume generator API."""

import pytest
from fastapi.testclient import TestClient

from grounded_resume.api.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["version"] == "2.0.0"


def test_generate_missing_api_key(client):
    """POST /api/generate without API key should return 400."""
    resp = client.post("/api/generate", json={
        "experienceLevel": "new_grad",
        "targetRole": "AI产品经理",
        "background": "test background",
        "jdText": "test JD",
        "llmConfig": {"provider": "deepseek", "model": "deepseek-v4-pro", "apiKey": ""},
    })
    assert resp.status_code == 400
    assert "API Key" in resp.json()["detail"]


def test_get_session_not_found(client):
    """GET /api/generate/nonexistent returns 404."""
    resp = client.get("/api/generate/nonexistent")
    assert resp.status_code == 404


def test_generate_creates_session(client):
    """POST with valid API key returns session_id and status processing."""
    resp = client.post("/api/generate", json={
        "experienceLevel": "new_grad",
        "targetRole": "AI产品经理",
        "background": "test background",
        "jdText": "test JD",
        "llmConfig": {"provider": "deepseek", "model": "deepseek-v4-pro", "apiKey": "sk-fake-key"},
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data
    assert data["status"] == "processing"


def test_poll_processing_session(client):
    """Polling a processing session returns status=processing."""
    # Create session first
    create_resp = client.post("/api/generate", json={
        "experienceLevel": "new_grad",
        "targetRole": "AI产品经理",
        "background": "test",
        "jdText": "test JD",
        "llmConfig": {"provider": "deepseek", "model": "deepseek-v4-pro", "apiKey": "sk-fake"},
    })
    session_id = create_resp.json()["session_id"]

    # Poll it
    resp = client.get(f"/api/generate/{session_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == session_id
    assert data["status"] in ("processing", "failed")
