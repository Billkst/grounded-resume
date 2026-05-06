from __future__ import annotations

import os
from typing import Literal, cast

from pydantic import BaseModel, Field, model_validator

from .safety_rules import (
    DEGREE_DOWNGRADE_TABLE,
    REDLINE_PATTERNS,
    ROLE_LIMITS,
    VERB_DOWNGRADE_TABLE,
    detect_unsupported_number,
    get_downgraded_verb,
)

DEPLOYMENT_MODE = os.environ.get("DEPLOYMENT_MODE", "local")
ENABLE_AUTH = os.environ.get("ENABLE_AUTH", "false").lower() == "true"


class LLMConfig(BaseModel):
    provider: str = "openai"
    model: str = "gpt-4o-mini"
    openai_api_key: str = ""
    kimi_api_key: str = ""
    glm_api_key: str = ""
    deepseek_api_key: str = ""
    qwen_api_key: str = ""
    third_party_api_key: str = ""
    claude_api_key: str = ""
    gemini_api_key: str = ""
    third_party_base_url: str = ""
    timeout_seconds: int = 120
    max_tokens: int = 4000
    temperature: float = 0.2
    mode: Literal["rule", "hybrid", "llm"] = "hybrid"
    fallback_providers: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def use_rule_mode_without_selected_api_key(self) -> LLMConfig:
        if self.mode != "rule" and not self.api_key_for_provider(self.provider):
            self.mode = "rule"
        return self

    def api_key_for_provider(self, provider_id: str) -> str:
        key_attr = f"{provider_id}_api_key"
        return cast(str, getattr(self, key_attr, ""))

    @classmethod
    def from_env(cls) -> LLMConfig:
        return cls(
            provider=os.environ.get("LLM_PROVIDER", "openai"),
            model=os.environ.get("LLM_MODEL", "gpt-4o-mini"),
            openai_api_key=os.environ.get("OPENAI_API_KEY", ""),
            kimi_api_key=os.environ.get("KIMI_API_KEY", ""),
            glm_api_key=os.environ.get("GLM_API_KEY", ""),
            deepseek_api_key=os.environ.get("DEEPSEEK_API_KEY", ""),
            qwen_api_key=os.environ.get("QWEN_API_KEY", ""),
            claude_api_key=os.environ.get("CLAUDE_API_KEY", ""),
            gemini_api_key=os.environ.get("GEMINI_API_KEY", ""),
        )


__all__ = [
    "DEPLOYMENT_MODE",
    "ENABLE_AUTH",
    "LLMConfig",
    "DEGREE_DOWNGRADE_TABLE",
    "REDLINE_PATTERNS",
    "ROLE_LIMITS",
    "VERB_DOWNGRADE_TABLE",
    "detect_unsupported_number",
    "get_downgraded_verb",
]
