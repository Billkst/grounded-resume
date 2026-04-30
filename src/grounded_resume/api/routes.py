# pyright: reportAny=false, reportAttributeAccessIssue=false, reportCallInDefaultInitializer=false, reportExplicitAny=false, reportIndexIssue=false, reportUnknownArgumentType=false, reportUnknownMemberType=false, reportUnknownParameterType=false, reportUnknownVariableType=false
from __future__ import annotations

from typing import Any, ClassVar, Literal, cast
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from grounded_resume.core.models import (
    EvidenceMappingResult,
    GapItem,
    ResumeDraft,
    RiskFlag,
    TargetJob,
    UserInput,
    UserOverride,
)
from grounded_resume.core.output import ResumeFormatter
from grounded_resume.core.workflow.state import WorkflowState

from .dependencies import ApiSessionStore, get_session_store, get_workflow_graph

router = APIRouter()


class ApiUserDecision(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(populate_by_name=True)

    bullet_id: str = Field(alias="bulletId")
    decision: Literal["approve", "revise", "reject"]
    revised_text: str | None = Field(default=None, alias="revisedText")


class SubmitDecisionsRequest(BaseModel):
    decisions: list[ApiUserDecision]


def _to_camel_key(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)


def _to_api_value(value: object) -> object:
    if isinstance(value, dict):
        return {_to_camel_key(str(key)): _to_api_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_to_api_value(item) for item in value]
    return value


def _session_response(session_id: str, session: dict[str, object]) -> dict[str, object]:
    result = cast(dict[str, object] | None, session.get("result"))
    return {
        "sessionId": session_id,
        "status": str(session["status"]),
        "result": _to_api_value(result) if result is not None else None,
        "finalOutput": _to_api_value(session.get("final_output")),
    }


def _apply_decisions(draft: ResumeDraft, decisions: list[ApiUserDecision]) -> ResumeDraft:
    updated = draft.model_copy(deep=True)
    for decision in decisions:
        for section in updated.sections:
            for index, bullet in enumerate(section.bullets):
                if bullet.id != decision.bullet_id:
                    continue
                if decision.decision == "reject":
                    _ = section.bullets.pop(index)
                    break
                if decision.decision == "revise":
                    if decision.revised_text is not None:
                        bullet.text = decision.revised_text
                    bullet.user_override = UserOverride(
                        approved=True,
                        modified_text=decision.revised_text or bullet.text,
                    )
                    break
                bullet.user_override = UserOverride(approved=True)
                break
    return updated


def _format_resume_markdown(draft: ResumeDraft) -> str:
    lines = [
        "> **本简历为「接近可投版」（Level 2）**",
        "> 已根据目标岗位与现有素材生成，请在投递前核对事实、数字和时间信息。",
        "",
    ]
    for section in sorted(draft.sections, key=lambda item: item.order):
        lines.append(f"## {section.title}")
        lines.append("")
        for bullet in section.bullets:
            lines.append(f"- {bullet.text}")
        lines.append("")
    return "\n".join(lines).rstrip()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


@router.post("/sessions")
def create_session(
    user_input: UserInput,
    workflow_graph: object = Depends(get_workflow_graph),
    session_store: ApiSessionStore = Depends(get_session_store),
) -> dict[str, object]:
    session_id = uuid4().hex
    state = WorkflowState(user_input=user_input)
    result = cast(dict[str, object], cast(Any, workflow_graph).invoke(state.to_dict()))
    session_store.save(session_id, "completed", result)
    return {"sessionId": session_id, "status": "completed"}


@router.get("/sessions/{session_id}")
def get_session(
    session_id: str,
    session_store: ApiSessionStore = Depends(get_session_store),
) -> dict[str, object]:
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return _session_response(session_id, session)


@router.post("/sessions/{session_id}/decisions")
def submit_decisions(
    session_id: str,
    request: SubmitDecisionsRequest,
    session_store: ApiSessionStore = Depends(get_session_store),
) -> dict[str, object]:
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    result = cast(dict[str, object], session["result"])
    confirmed_draft = _apply_decisions(
        ResumeDraft.model_validate(result["draft"]),
        request.decisions,
    )
    mapping_result = EvidenceMappingResult.model_validate(result["mapping_result"])
    target_job = TargetJob.model_validate(
        cast(dict[str, object], result["user_input"])["target_job"]
    )
    output = ResumeFormatter().format(
        confirmed_resume=confirmed_draft,
        evidence_mapping=mapping_result,
        gap_items=[GapItem.model_validate(item) for item in mapping_result.gaps],
        risk_flags=[RiskFlag.model_validate(item) for item in confirmed_draft.risk_flags],
        target_job=target_job,
    )
    final_output = output.model_dump(mode="json", by_alias=False)
    final_output["resume_markdown"] = _format_resume_markdown(confirmed_draft)
    session["final_output"] = final_output
    result["draft"] = confirmed_draft.model_dump(mode="python", by_alias=False)
    return _session_response(session_id, session)
