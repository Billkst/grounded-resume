"""FastAPI application factory."""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

os.environ.pop("all_proxy", None)
os.environ.pop("ALL_PROXY", None)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

from grounded_resume.core.config import DEPLOYMENT_MODE
from grounded_resume.core.llm_service import LLMService

from .ideal_routes import router as ideal_router


def create_app() -> FastAPI:
    app = FastAPI(title="grounded-resume API", version="2.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    llm_service = LLMService()
    app.state.llm_service = llm_service
    app.include_router(ideal_router)
    return app


app = create_app()


@app.get("/config")
def get_config() -> dict[str, object]:
    return {
        "deploymentMode": DEPLOYMENT_MODE,
        "supportedProviders": [
            "openai", "kimi", "glm", "deepseek",
            "claude", "qwen", "gemini", "third_party",
        ],
    }
