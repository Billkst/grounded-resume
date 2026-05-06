"""API routes for ideal resume generator."""

from __future__ import annotations

import logging
import time
from typing import Any, cast

from fastapi import APIRouter, BackgroundTasks, HTTPException

from grounded_resume.core.config import LLMConfig
from grounded_resume.core.generator import (
    analyze_gaps,
    build_job_profile,
    generate_ideal_resume,
    hash_jd,
)
from grounded_resume.core.ideal_models import (
    GenerateRequest,
    JobProfile,
)
from grounded_resume.core.llm_service import LLMService

from .ideal_session import IdealSessionStore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

session_store = IdealSessionStore()
job_profile_cache: dict[str, dict[str, Any]] = {}


def _build_llm_service(llm_config_input) -> LLMService:
    if llm_config_input is None:
        return LLMService()
    provider = llm_config_input.provider or "deepseek"
    cfg = LLMConfig(
        provider=provider,
        model=llm_config_input.model or "deepseek-v4-pro",
        temperature=0.1,
        max_tokens=8192,
        timeout_seconds=120,
        mode="hybrid",
    )
    # Inject the API key for the selected provider
    api_key = getattr(llm_config_input, "api_key", "")
    if api_key and hasattr(cfg, f"{provider}_api_key"):
        setattr(cfg, f"{provider}_api_key", api_key)
    return LLMService(config=cfg, retry_attempts=2)


@router.post("/generate")
def create_generation(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
) -> dict[str, Any]:
    if not request.llm_config or not request.llm_config.api_key:
        raise HTTPException(
            status_code=400,
            detail="请配置 LLM API Key",
        )

    session_id = session_store.create()

    background_tasks.add_task(
        _run_generation,
        session_id,
        request,
    )
    return {"session_id": session_id, "status": "processing"}


@router.get("/generate/{session_id}")
def get_generation(session_id: str) -> dict[str, Any]:
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    response = {
        "session_id": session_id,
        "status": session["status"],
        "progress": session.get("progress", ""),
    }

    if session["status"] == "completed":
        result = cast(dict[str, Any], session["result"])
        response["ideal_resume"] = result.get("ideal_resume")
        response["gap_report"] = result.get("gap_report")
        response["timing"] = session.get("timing")
    elif session["status"] == "failed":
        response["error"] = session.get("error", "Unknown error")

    return response


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "2.0.0"}


def _run_generation(session_id: str, request: GenerateRequest) -> None:
    overall_start = time.time()
    step_times: dict[str, float] = {}

    try:
        llm = _build_llm_service(request.llm_config)

        # Step 1: Job profile
        t0 = time.time()
        session_store.update_progress(session_id, "job_profile")
        if request.job_profile_id and request.job_profile_id in job_profile_cache:
            job_profile = JobProfile.model_validate(job_profile_cache[request.job_profile_id])
        else:
            job_profile = build_job_profile(llm, request.target_role, request.jd_text)
            if request.jd_text:
                jd_hash = hash_jd(request.jd_text)
                job_profile_cache[jd_hash] = job_profile.model_dump(mode="json", by_alias=True)
        step_times["job_profile"] = round(time.time() - t0, 2)

        # Step 2: Generate ideal resume
        t0 = time.time()
        session_store.update_progress(session_id, "generating_resume")
        ideal_resume_data = generate_ideal_resume(
            llm, job_profile, request.target_role, request.experience_level
        )
        step_times["generating_resume"] = round(time.time() - t0, 2)

        # Step 3: Analyze gaps
        t0 = time.time()
        session_store.update_progress(session_id, "analyzing_gaps")
        gap_report_data = analyze_gaps(
            llm,
            job_profile,
            request.background,
            ideal_resume_data.get("markdown", ""),
            request.experience_level,
        )
        step_times["analyzing_gaps"] = round(time.time() - t0, 2)

        total_seconds = round(time.time() - overall_start, 2)
        timing = {
            "totalSeconds": total_seconds,
            "steps": step_times,
        }

        result = {
            "ideal_resume": ideal_resume_data,
            "gap_report": gap_report_data,
        }
        session_store.complete(session_id, result, timing)
        logger.info("Generation completed: session=%s total=%.1fs", session_id, total_seconds)

    except Exception as exc:
        logger.error("Generation failed: session=%s error=%s", session_id, exc, exc_info=True)
        session_store.fail(session_id, str(exc))
