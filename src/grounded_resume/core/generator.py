"""Ideal resume generator pipeline — three LLM calls."""

from __future__ import annotations

import hashlib
import json
import logging

from grounded_resume.core.ideal_models import JobProfile
from grounded_resume.core.llm_helpers import call_llm_json
from grounded_resume.core.llm_service import LLMService
from grounded_resume.core.prompt_loader import PromptTemplate, model_family

logger = logging.getLogger(__name__)


def build_job_profile(
    llm: LLMService,
    target_role: str,
    jd_text: str,
) -> JobProfile:
    """Step 1: Parse JD into structured job profile."""
    family = model_family(llm.config.provider)
    prompt = PromptTemplate("job_profile", family)

    system = prompt.build_system()
    user = prompt.build_user(
        target_role=target_role,
        jd_text=jd_text,
    )

    data = call_llm_json(
        llm,
        system,
        user,
        temperature=prompt.temperature,
        max_tokens=prompt.max_tokens,
    )

    profile = JobProfile.model_validate(data)
    logger.info(
        "Job profile built: %d hard reqs, %d capabilities",
        len(profile.hard_requirements),
        len(profile.core_capabilities),
    )
    return profile


def hash_jd(jd_text: str) -> str:
    """Hash JD text for caching."""
    return hashlib.sha256(jd_text.encode()).hexdigest()[:16]


def generate_ideal_resume(
    llm: LLMService,
    job_profile: JobProfile,
    target_role: str,
    experience_level: str,
) -> dict:
    """Step 2: Generate ideal candidate resume from job profile."""
    family = model_family(llm.config.provider)
    prompt = PromptTemplate("ideal_resume", family)

    system = prompt.build_system().replace("{target_role}", target_role)
    user = prompt.build_user(
        job_profile_json=json.dumps(
            job_profile.model_dump(mode="json", by_alias=True),
            ensure_ascii=False,
            indent=2,
        ),
        target_role=target_role,
        experience_level=_experience_label(experience_level),
    )

    data = call_llm_json(
        llm,
        system,
        user,
        temperature=prompt.temperature,
        max_tokens=prompt.max_tokens,
    )

    # Build markdown from sections
    sections = data.get("sections", [])
    md = _sections_to_markdown(sections)
    data["markdown"] = md

    logger.info("Ideal resume generated: %d sections", len(sections))
    return data


def analyze_gaps(
    llm: LLMService,
    job_profile: JobProfile,
    background: str,
    ideal_resume_markdown: str,
    experience_level: str,
) -> dict:
    """Step 3: Analyze gaps between user background and ideal profile."""
    family = model_family(llm.config.provider)
    prompt = PromptTemplate("gap_analysis", family)

    system = prompt.build_system()
    user = prompt.build_user(
        job_profile_json=json.dumps(
            job_profile.model_dump(mode="json", by_alias=True),
            ensure_ascii=False,
            indent=2,
        ),
        background=background,
        ideal_resume_markdown=ideal_resume_markdown,
        experience_level=_experience_label(experience_level),
    )

    data = call_llm_json(
        llm,
        system,
        user,
        temperature=prompt.temperature,
        max_tokens=prompt.max_tokens,
    )

    logger.info(
        "Gap analysis: score=%d, blockers=%d, critical=%d, tips=%d",
        data.get("overall_score", 0),
        len(data.get("blockers", [])),
        len(data.get("critical_gaps", [])),
        len(data.get("expression_tips", [])),
    )
    return data


def _experience_label(level: str) -> str:
    mapping = {
        "new_grad": "实习/应届",
        "1_3_years": "1-3年经验",
        "3_5_years": "3-5年经验",
        "5_10_years": "5-10年经验",
        "10_plus_years": "10年以上经验",
    }
    return mapping.get(level, level)


def _sections_to_markdown(sections: list[dict]) -> str:
    lines: list[str] = []
    for sec in sections:
        lines.append(f"## {sec.get('title', '')}")
        lines.append("")
        lines.append(sec.get("content", ""))
        lines.append("")
    return "\n".join(lines).strip()
