from __future__ import annotations

from typing import cast

import httpx

from .llm import (
    AuthError,
    LLMRequest,
    LLMResponse,
    ProviderError,
    RateLimitError,
    TimeoutError,
)


class AnthropicAdapter:
    provider_id: str = "claude"

    def __init__(self, base_url: str, api_key: str) -> None:
        self.base_url: str = base_url.rstrip("/")
        self.api_key: str = api_key

    def complete(self, request: LLMRequest) -> LLMResponse:
        system_prompts = [message.content for message in request.messages if message.role == "system"]
        messages = [
            {"role": message.role, "content": message.content}
            for message in request.messages
            if message.role != "system"
        ]
        body: dict[str, object] = {
            "model": request.model,
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "messages": messages,
        }
        if system_prompts:
            body["system"] = "\n\n".join(system_prompts)

        try:
            with httpx.Client(timeout=request.timeout_s) as client:
                response = client.post(
                    f"{self.base_url}/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
        except httpx.TimeoutException as exc:
            raise TimeoutError(str(exc)) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(str(exc)) from exc

        if response.status_code == 401:
            raise AuthError(response.text)
        if response.status_code == 429:
            raise RateLimitError(response.text)
        if response.status_code >= 400:
            raise ProviderError(response.text)

        payload_obj = cast(object, response.json())
        if not isinstance(payload_obj, dict):
            raise ProviderError("Invalid Anthropic response")
        payload = cast(dict[str, object], payload_obj)

        content_obj = payload.get("content")
        text = ""
        if isinstance(content_obj, list) and content_obj:
            content_items = cast(list[object], content_obj)
            first_content = content_items[0]
            if isinstance(first_content, dict):
                content_block = cast(dict[str, object], first_content)
                text_obj = content_block.get("text")
                if isinstance(text_obj, str):
                    text = text_obj

        usage_obj = payload.get("usage")
        usage = cast(dict[str, object], usage_obj) if isinstance(usage_obj, dict) else {}
        model_obj = payload.get("model")
        finish_reason_obj = payload.get("stop_reason")
        input_tokens_obj = usage.get("input_tokens")
        output_tokens_obj = usage.get("output_tokens")

        return LLMResponse(
            provider_id=self.provider_id,
            model=model_obj if isinstance(model_obj, str) else request.model,
            text=text,
            input_tokens=input_tokens_obj if isinstance(input_tokens_obj, int) else None,
            output_tokens=output_tokens_obj if isinstance(output_tokens_obj, int) else None,
            finish_reason=finish_reason_obj if isinstance(finish_reason_obj, str) else None,
        )
