from __future__ import annotations

import importlib
import json
import logging
import time
from collections.abc import Callable
from dataclasses import replace
from typing import cast

from ..providers.gemini_adapter import GeminiAdapter
from ..providers.llm import (
    LLMError,
    LLMProvider,
    LLMRequest,
    LLMResponse,
    ProviderError,
    ProviderRegistry,
    get_default_presets,
)
from ..providers.openai_compatible import OpenAICompatibleAdapter
from .config import LLMConfig

logger = logging.getLogger(__name__)


OPENAI_COMPATIBLE_PROVIDER_IDS: set[str] = {
    "openai",
    "kimi",
    "glm",
    "deepseek",
    "qwen",
    "third_party",
}


class LLMService:
    def __init__(
        self,
        config: LLMConfig | None = None,
        *,
        registry: ProviderRegistry | None = None,
        providers: list[LLMProvider] | None = None,
        retry_attempts: int = 3,
        retry_sleep_s: float = 0.25,
    ) -> None:
        self.config: LLMConfig = config or LLMConfig.from_env()
        self.registry: ProviderRegistry = registry or ProviderRegistry()
        self.retry_attempts: int = retry_attempts
        self.retry_sleep_s: float = retry_sleep_s

        self._register_configured_providers()
        for provider in providers or []:
            self.registry.register(provider)

    def complete(self, request: LLMRequest) -> LLMResponse:
        failures: list[str] = []
        for provider_id in [self.config.provider, *self.config.fallback_providers]:
            try:
                provider = self.registry.get(provider_id)
            except KeyError as exc:
                failures.append(f"{provider_id}: {exc}")
                continue

            try:
                response = self._complete_with_retry(provider, request)
                return self._repair_json_response_if_needed(request, response)
            except LLMError as exc:
                failures.append(f"{provider_id}: {exc}")
                logger.warning("LLM provider failed provider=%s error=%s", provider_id, exc)

        raise ProviderError(f"All LLM providers failed: {'; '.join(failures)}")

    def _complete_with_retry(self, provider: LLMProvider, request: LLMRequest) -> LLMResponse:
        attempts = max(1, self.retry_attempts)
        for attempt in range(1, attempts + 1):
            logger.info(
                "Calling LLM provider=%s model=%s attempt=%s max_tokens=%s temperature=%s",
                provider.provider_id,
                request.model,
                attempt,
                request.max_tokens,
                request.temperature,
            )
            try:
                return provider.complete(request)
            except LLMError:
                if attempt == attempts:
                    raise
                delay: float = self.retry_sleep_s * pow(2.0, attempt - 1)
                time.sleep(delay)

        raise ProviderError("LLM retry loop ended unexpectedly")

    def _register_configured_providers(self) -> None:
        presets = {preset.provider_id: preset for preset in get_default_presets()}
        for provider_id in [self.config.provider, *self.config.fallback_providers]:
            api_key = self.config.api_key_for_provider(provider_id)
            if not api_key:
                logger.info(
                    "Skipping LLM provider=%s because api_key=%s",
                    provider_id,
                    _mask_secret(api_key),
                )
                continue

            preset = presets.get(provider_id)
            if preset is None:
                continue

            if provider_id in OPENAI_COMPATIBLE_PROVIDER_IDS:
                base_url = (
                    self.config.third_party_base_url
                    if provider_id == "third_party"
                    else preset.base_url
                )
                if base_url:
                    self.registry.register(OpenAICompatibleAdapter(provider_id, base_url, api_key))
                    logger.info(
                        "Registered LLM provider=%s api_key=%s",
                        provider_id,
                        _mask_secret(api_key),
                    )
            elif provider_id == "claude":
                self.registry.register(_make_anthropic_adapter(preset.base_url, api_key))
                logger.info(
                    "Registered LLM provider=%s api_key=%s",
                    provider_id,
                    _mask_secret(api_key),
                )
            elif provider_id == "gemini":
                self.registry.register(GeminiAdapter(preset.base_url, api_key))
                logger.info(
                    "Registered LLM provider=%s api_key=%s",
                    provider_id,
                    _mask_secret(api_key),
                )

    def _repair_json_response_if_needed(
        self,
        request: LLMRequest,
        response: LLMResponse,
    ) -> LLMResponse:
        if request.response_format != "json":
            return response
        try:
            json.loads(response.text)
            return response
        except json.JSONDecodeError:
            repaired = _repair_json_text(response.text)
            if repaired is None:
                return response
            logger.info("Repaired invalid JSON response from provider=%s", response.provider_id)
            return replace(response, text=repaired)


def _repair_json_text(text: str) -> str | None:
    candidate = _strip_json_fence(text.strip())
    candidate = _slice_json_object(candidate)
    for repaired in _json_repair_candidates(candidate):
        try:
            return json.dumps(json.loads(repaired), ensure_ascii=False)
        except json.JSONDecodeError:
            continue
    return None


def _strip_json_fence(text: str) -> str:
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return text


def _slice_json_object(text: str) -> str:
    starts = [position for position in (text.find("{"), text.find("[")) if position != -1]
    if not starts:
        return text
    start = min(starts)
    ends = [position for position in (text.rfind("}"), text.rfind("]")) if position != -1]
    if not ends:
        return text[start:]
    return text[start : max(ends) + 1]


def _json_repair_candidates(text: str) -> list[str]:
    candidates = [text]
    if text.startswith("{") and text.count("{") > text.count("}"):
        candidates.append(text + "}" * (text.count("{") - text.count("}")))
    if text.startswith("[") and text.count("[") > text.count("]"):
        candidates.append(text + "]" * (text.count("[") - text.count("]")))
    return candidates


def _mask_secret(secret: str) -> str:
    if not secret:
        return "<missing>"
    if len(secret) <= 8:
        return "****"
    return f"{secret[:4]}...{secret[-4:]}"


def _make_anthropic_adapter(base_url: str, api_key: str) -> LLMProvider:
    module = importlib.import_module("grounded_resume.providers.anthropic_adapter")
    adapter_factory = cast(Callable[[str, str], LLMProvider], module.__dict__["AnthropicAdapter"])
    return adapter_factory(base_url, api_key)
