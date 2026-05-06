"""Shared helpers for LLM calls in the generation pipeline."""

from __future__ import annotations

import json
import logging
import re
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from grounded_resume.core.llm_service import LLMService

logger = logging.getLogger(__name__)


def clean_json(text: str) -> str:
    """Strip markdown fences and extract JSON object/array from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    start_obj = text.find("{")
    start_arr = text.find("[")
    starts = [p for p in (start_obj, start_arr) if p != -1]
    if starts:
        start = min(starts)
        end_char = "}" if start == start_obj else "]"
        end = text.rfind(end_char)
        if end != -1 and end >= start:
            text = text[start : end + 1]
    return text.strip()


def call_llm_json(
    llm: LLMService,
    system: str,
    user: str,
    *,
    temperature: float = 0.1,
    max_tokens: int = 4096,
) -> dict[str, Any]:
    """Call LLM and parse JSON response."""
    from grounded_resume.providers.llm import LLMRequest, Message

    full_prompt = user
    request = LLMRequest(
        model=llm.config.model,
        messages=[
            Message(role="system", content=system),
            Message(role="user", content=full_prompt),
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        timeout_s=llm.config.timeout_seconds,
    )
    response = llm.complete(request)
    text = response.text
    logger.info("LLM response preview: %s", text[:300].replace("\n", " "))
    return json.loads(clean_json(text))
