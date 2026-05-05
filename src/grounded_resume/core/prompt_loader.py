"""Load prompt templates from YAML files with model-specific overrides."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


_PROMPTS_ROOT = Path(__file__).parent.parent.parent.parent / "prompts"


class PromptTemplate:
    def __init__(self, task: str, model_family: str) -> None:
        base = _load_yaml(_PROMPTS_ROOT / task / "base.yaml")
        override = _load_yaml(_PROMPTS_ROOT / task / f"{model_family}.yaml")

        self.system: str = _merge_str(base, override, "system")
        self.system_extra: str = override.get("system_extra", "")
        self.user_template: str = base["user_template"]
        self.temperature: float = override.get("temperature", 0.3)
        self.max_tokens: int = override.get("max_tokens", 4096)
        self.reasoning_effort: str | None = override.get("reasoning_effort")

    def build_system(self) -> str:
        if self.system_extra:
            return self.system_extra + "\n\n" + self.system
        return self.system

    def build_user(self, **variables: str) -> str:
        result = self.user_template
        for key, value in variables.items():
            result = result.replace("{" + key + "}", value)
        return result


def _load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _merge_str(base: dict[str, Any], override: dict[str, Any], key: str) -> str:
    if key in override:
        return override[key]
    return base.get(key, "")


def model_family(provider: str) -> str:
    """Map provider ID to model family for prompt selection."""
    mapping = {
        "openai": "openai",
        "kimi": "openai",
        "glm": "openai",
        "deepseek": "deepseek",
        "qwen": "openai",
        "third_party": "openai",
        "claude": "openai",
        "gemini": "openai",
    }
    return mapping.get(provider, "openai")
