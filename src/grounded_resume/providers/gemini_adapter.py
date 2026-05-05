from __future__ import annotations

from collections.abc import Mapping
from typing import cast

import httpx

from grounded_resume.providers.llm import (
    AuthError,
    LLMRequest,
    LLMResponse,
    ProviderError,
    RateLimitError,
    TimeoutError,
)


class GeminiAdapter:
    provider_id: str = "gemini"

    def __init__(self, base_url: str, api_key: str) -> None:
        self.base_url: str = base_url.rstrip("/")
        self.api_key: str = api_key

    def complete(self, request: LLMRequest) -> LLMResponse:
        payload = self._build_payload(request)
        url = f"{self.base_url}/models/{request.model}:generateContent?key={self.api_key}"

        try:
            response = httpx.post(
                url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=request.timeout_s,
            )
        except httpx.TimeoutException as exc:
            raise TimeoutError("Gemini request timed out") from exc

        if response.status_code == 401:
            raise AuthError(response.text)
        if response.status_code == 429:
            raise RateLimitError(response.text)
        if response.status_code >= 400:
            raise ProviderError(response.text)

        data = cast(dict[str, object], response.json())
        try:
            candidates = cast(list[object], data["candidates"])
            candidate = cast(dict[str, object], candidates[0])
            content = cast(dict[str, object], candidate["content"])
            parts = cast(list[object], content["parts"])
            first_part = cast(dict[str, object], parts[0])
            text = first_part["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProviderError("Invalid Gemini response") from exc
        if not isinstance(text, str):
            raise ProviderError("Invalid Gemini response")

        usage = data.get("usageMetadata")
        usage_data: Mapping[str, object] = (
            cast(Mapping[str, object], usage) if isinstance(usage, dict) else {}
        )
        input_tokens = usage_data.get("promptTokenCount")
        output_tokens = usage_data.get("candidatesTokenCount")
        finish_reason = candidate.get("finishReason")
        return LLMResponse(
            provider_id=self.provider_id,
            model=request.model,
            text=text,
            input_tokens=input_tokens if isinstance(input_tokens, int) else None,
            output_tokens=output_tokens if isinstance(output_tokens, int) else None,
            finish_reason=finish_reason if isinstance(finish_reason, str) else None,
        )

    def _build_payload(self, request: LLMRequest) -> dict[str, object]:
        contents: list[dict[str, object]] = []
        system_parts: list[dict[str, str]] = []

        for message in request.messages:
            if message.role == "system":
                system_parts.append({"text": message.content})
                continue

            role = "model" if message.role == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": message.content}]})

        payload: dict[str, object] = {
            "contents": contents,
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_tokens,
            },
        }
        if system_parts:
            payload["systemInstruction"] = {"parts": system_parts}

        return payload
