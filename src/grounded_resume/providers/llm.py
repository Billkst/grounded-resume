from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


class LLMError(Exception):
    """Base exception for LLM provider errors."""


class ProviderError(LLMError):
    """Raised when a provider fails to complete a request."""


class AuthError(LLMError):
    """Raised when authentication with a provider fails."""


class RateLimitError(LLMError):
    """Raised when rate limit is exceeded."""


class TimeoutError(LLMError):
    """Raised when a request times out."""


@dataclass(frozen=True)
class Message:
    role: str  # "system" | "user" | "assistant"
    content: str


@dataclass(frozen=True)
class ProviderPreset:
    provider_id: str
    display_name: str
    base_url: str
    default_models: tuple[str, ...]
    auth_modes: tuple[str, ...]


@dataclass
class LLMRequest:
    model: str
    messages: list[Message] = field(default_factory=list)
    temperature: float = 0.0
    max_tokens: int = 4000
    response_format: str = "text"  # "text" | "json"
    timeout_s: int = 120


@dataclass(frozen=True)
class LLMResponse:
    provider_id: str
    model: str
    text: str
    input_tokens: int | None = None
    output_tokens: int | None = None


class LLMProvider(Protocol):
    provider_id: str

    def complete(self, request: LLMRequest) -> LLMResponse:
        raise NotImplementedError


class FakeLLMProvider:
    provider_id = "fake"

    def __init__(self, response_text: str) -> None:
        self.response_text = response_text

    def complete(self, request: LLMRequest) -> LLMResponse:
        return LLMResponse(
            provider_id=self.provider_id,
            model=request.model,
            text=self.response_text,
            input_tokens=len(request.system_prompt) + len(request.user_prompt),
            output_tokens=len(self.response_text),
        )


class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, LLMProvider] = {}

    def register(self, provider: LLMProvider) -> None:
        self._providers[provider.provider_id] = provider

    def get(self, provider_id: str) -> LLMProvider:
        try:
            return self._providers[provider_id]
        except KeyError as exc:
            raise KeyError(f"Unknown LLM provider: {provider_id}") from exc


def get_default_presets() -> tuple[ProviderPreset, ...]:
    return (
        ProviderPreset(
            provider_id="openai",
            display_name="OpenAI",
            base_url="https://api.openai.com/v1",
            default_models=("gpt-5.5", "gpt-5.5-pro", "gpt-5.4-mini"),
            auth_modes=("api_key", "device_code"),
        ),
        ProviderPreset(
            provider_id="kimi",
            display_name="Kimi",
            base_url="https://api.moonshot.cn/v1",
            default_models=("kimi-k2.6", "kimi-k2.5"),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="glm",
            display_name="GLM",
            base_url="https://open.bigmodel.cn/api/paas/v4",
            default_models=("glm-5.1",),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="deepseek",
            display_name="DeepSeek",
            base_url="https://api.deepseek.com/v1",
            default_models=("deepseek-v4-pro",),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="claude",
            display_name="Claude",
            base_url="https://api.anthropic.com/v1",
            default_models=("claude-opus-4-7",),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="qwen",
            display_name="Qwen",
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            default_models=("qwen3.5-flash-2026-02-23",),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="gemini",
            display_name="Gemini",
            base_url="https://generativelanguage.googleapis.com/v1beta",
            default_models=("gemini-3.1-flash-live-preview",),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="third_party",
            display_name="Third-party OpenAI-compatible endpoint",
            base_url="https://example.invalid/v1",
            default_models=("custom",),
            auth_modes=("api_key",),
        ),
    )
