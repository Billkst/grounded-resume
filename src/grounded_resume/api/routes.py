# pyright: reportAny=false, reportAttributeAccessIssue=false, reportCallInDefaultInitializer=false, reportExplicitAny=false, reportIndexIssue=false, reportUnknownArgumentType=false, reportUnknownMemberType=false, reportUnknownParameterType=false, reportUnknownVariableType=false
from __future__ import annotations

from typing import Any, cast
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from grounded_resume.core.models import UserInput
from grounded_resume.core.workflow.state import WorkflowState

from .dependencies import ApiSessionStore, get_session_store, get_workflow_graph

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


@router.post("/sessions")
def create_session(
    user_input: UserInput,
    workflow_graph: object = Depends(get_workflow_graph),
    session_store: ApiSessionStore = Depends(get_session_store),
) -> dict[str, str]:
    session_id = uuid4().hex
    state = WorkflowState(user_input=user_input)
    result = cast(dict[str, object], cast(Any, workflow_graph).invoke(state.to_dict()))
    session_store.save(session_id, "completed", result)
    return {"session_id": session_id, "status": "completed"}


@router.get("/sessions/{session_id}")
def get_session(
    session_id: str,
    session_store: ApiSessionStore = Depends(get_session_store),
) -> dict[str, str]:
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "status": str(session["status"])}
