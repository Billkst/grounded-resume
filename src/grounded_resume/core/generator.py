"""Ideal resume generator pipeline — three LLM calls."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

from grounded_resume.core.ideal_models import (
    GapReport,
    IdealResume,
    JobProfile,
    ResumeSection,
)
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

    data = _normalize_job_profile(data)
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
) -> dict[str, Any]:
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

    # Build markdown from sections, validate through model for camelCase output
    raw_sections = data.get("sections", [])
    md = _sections_to_markdown(raw_sections)
    sections = [ResumeSection.model_validate(s) for s in raw_sections]
    ideal = IdealResume(
        markdown=md,
        sections=sections,
    )
    logger.info("Ideal resume generated: %d sections", len(sections))
    return ideal.model_dump(mode="json", by_alias=True)


def analyze_gaps(
    llm: LLMService,
    job_profile: JobProfile,
    background: str,
    ideal_resume_markdown: str,
    experience_level: str,
) -> dict[str, Any]:
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

    data = _normalize_gap_report(data)
    report = GapReport.model_validate(data)

    logger.info(
        "Gap analysis: score=%d, blockers=%d, critical=%d, tips=%d",
        report.overall_score,
        len(report.blockers),
        len(report.critical_gaps),
        len(report.expression_tips),
    )
    return report.model_dump(mode="json", by_alias=True)


def _experience_label(level: str) -> str:
    mapping = {
        "new_grad": "实习/应届",
        "1_3_years": "1-3年经验",
        "3_5_years": "3-5年经验",
        "5_10_years": "5-10年经验",
        "10_plus_years": "10年以上经验",
    }
    return mapping.get(level, level)


def _normalize_gap_report(data: dict[str, Any]) -> dict[str, Any]:
    """Normalize LLM gap analysis output to match GapReport model fields."""
    # Map common LLM field name variations
    if "totalScore" in data and "overall_score" not in data:
        data["overall_score"] = data.pop("totalScore")
    if "overview" in data and "summary" not in data:
        data["summary"] = data.pop("overview")

    # Normalize blockers
    for key in ("blockerGaps", "blockers", "blocker_gaps"):
        if key in data and "blockers" not in data:
            data["blockers"] = data.pop(key)
            break
    for item in data.get("blockers", []):
        if isinstance(item, dict):
            if "missing" in item and "gap" not in item:
                item["gap"] = item.pop("missing")
            if "fatalReason" in item and "why_fatal" not in item:
                item["why_fatal"] = item.pop("fatalReason")

    # Normalize critical gaps
    for item in data.get("critical_gaps", data.get("criticalGaps", [])):
        if isinstance(item, dict):
            if "path" in item and "action_path" not in item:
                item["action_path"] = item.pop("path")
            if "estimated_time" not in item:
                item["estimated_time"] = item.get("estimated_time", "")

    # Normalize expression tips (may be strings or dicts)
    tips = data.get("expression_tips", data.get("expressionTips", []))
    normalized_tips = []
    for tip in tips:
        if isinstance(tip, str):
            normalized_tips.append({
                "from_text": tip,
                "to_text": "",
                "method": "",
            })
        elif isinstance(tip, dict):
            if "from_text" not in tip and "fromText" in tip:
                tip["from_text"] = tip.pop("fromText")
            if "to_text" not in tip and "toText" in tip:
                tip["to_text"] = tip.pop("toText")
            normalized_tips.append(tip)
    data["expression_tips"] = normalized_tips

    # Ensure required fields exist and strip extras
    allowed = {"overall_score", "summary", "blockers", "critical_gaps", "expression_tips"}
    data = {k: v for k, v in data.items() if k in allowed}
    data.setdefault("overall_score", 50)
    data.setdefault("summary", "")
    data.setdefault("blockers", [])
    data.setdefault("critical_gaps", [])
    return data


def _normalize_job_profile(data: dict[str, Any]) -> dict[str, Any]:
    """Strip extra fields LLM may return, keep only JobProfile model fields."""
    allowed = {
        "hard_requirements", "core_capabilities", "bonus_points",
        "ats_keywords_high", "ats_keywords_medium", "ideal_candidate_profile",
    }
    return {k: v for k, v in data.items() if k in allowed}


def _sections_to_markdown(sections: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for sec in sections:
        lines.append(f"## {sec.get('title', '')}")
        lines.append("")
        content = sec.get("content", "")
        if isinstance(content, list):
            for item in content:
                if isinstance(item, str):
                    lines.append(f"- {item}")
                elif isinstance(item, dict):
                    lines.append(f"- {item.get('text', str(item))}")
        elif isinstance(content, str):
            lines.append(content)
        else:
            lines.append(str(content))
        lines.append("")
    return "\n".join(lines).strip()
