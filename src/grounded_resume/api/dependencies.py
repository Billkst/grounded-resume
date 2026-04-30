# pyright: reportAny=false, reportMissingImports=false, reportUnknownMemberType=false, reportUnknownVariableType=false
from __future__ import annotations

from dataclasses import dataclass, field

from fastapi import Request


@dataclass
class ApiSessionStore:
    sessions: dict[str, dict[str, object]] = field(default_factory=dict)

    def save(self, session_id: str, status: str, result: dict[str, object] | None = None) -> None:
        self.sessions[session_id] = {"status": status, "result": result}

    def get(self, session_id: str) -> dict[str, object] | None:
        return self.sessions.get(session_id)


def get_workflow_graph(request: Request) -> object:
    return request.app.state.workflow_graph


def get_session_store(request: Request) -> ApiSessionStore:
    return request.app.state.session_store
