from __future__ import annotations

from fastapi import APIRouter, WebSocket

router = APIRouter()


@router.websocket("/ws/sessions/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()
    for stage in ["jd_parsing", "material_parsing", "mapping", "generation", "validation"]:
        await websocket.send_json({"stage": stage, "session_id": session_id})
    await websocket.close()
