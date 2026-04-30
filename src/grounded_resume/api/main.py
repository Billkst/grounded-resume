"""FastAPI application factory."""

# pyright: reportMissingImports=false

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from grounded_resume.core.workflow.graph import build_workflow_graph

from .dependencies import ApiSessionStore
from .routes import router
from grounded_resume.api.websocket import router as websocket_router


def create_app() -> FastAPI:
    app = FastAPI(title="grounded-resume API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.workflow_graph = build_workflow_graph()
    app.state.session_store = ApiSessionStore()
    app.include_router(router)
    app.include_router(websocket_router)
    return app


app = create_app()
