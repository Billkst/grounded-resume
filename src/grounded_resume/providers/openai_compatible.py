from __future__ import annotations

import logging
from collections.abc import Mapping, Sequence
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

logger = logging.getLogger(__name__)


class OpenAICompatibleAdapter:
    def __init__(self, provider_id: str, base_url: str, api_key: str) -> None:
        self.provider_id: str = provider_id
        self.base_url: str = base_url.rstrip("/")
        self.api_key: str = api_key
        self._transport: httpx.BaseTransport | None = None

    def complete(self, request: LLMRequest) -> LLMResponse:
        payload: dict[str, object] = {
            "model": request.model,
            "messages": [
                {"role": message.role, "content": message.content} for message in request.messages
            ],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        use_json_mode = request.response_format == "json"
        if use_json_mode:
            payload["response_format"] = {"type": "json_object"}

        import time

        prompt_length = sum(len(m.content) for m in request.messages)
        logger.info(
            "%s API request: model=%s prompt_len=%d timeout=%d response_format=%s",
            self.provider_id,
            request.model,
            prompt_length,
            request.timeout_s,
            request.response_format,
        )

        start_time = time.time()
        try:
            with httpx.Client(timeout=request.timeout_s, transport=self._transport) as client:
                response = client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
            elapsed = time.time() - start_time
            logger.info(
                "%s API response: status=%d elapsed=%.2fs content_len=%d",
                self.provider_id,
                response.status_code,
                elapsed,
                len(response.text),
            )
        except httpx.TimeoutException as exc:
            elapsed = time.time() - start_time
            logger.error("%s API timeout after %.2fs: %s", self.provider_id, elapsed, exc)
            raise TimeoutError(str(exc)) from exc
        except httpx.HTTPError as exc:
            logger.error("%s API HTTP error: %s", self.provider_id, exc)
            raise ProviderError(str(exc)) from exc

        if response.status_code in {401, 403}:
            raise AuthError(response.text)
        if response.status_code == 429:
            raise RateLimitError(response.text)
        if response.status_code == 408:
            raise TimeoutError(response.text)
        if response.status_code >= 400:
            error_text = response.text
            # Some providers don't support json_object response_format; retry without it
            if use_json_mode and ("response_format" in error_text or "json_object" in error_text):
                logger.warning(
                    "%s rejected json_object mode, retrying without response_format",
                    self.provider_id,
                )
                payload.pop("response_format", None)
                try:
                    with httpx.Client(
                        timeout=request.timeout_s, transport=self._transport
                    ) as client:
                        response = client.post(
                            f"{self.base_url}/chat/completions",
                            headers={
                                "Authorization": f"Bearer {self.api_key}",
                                "Content-Type": "application/json",
                            },
                            json=payload,
                        )
                    elapsed = time.time() - start_time
                    logger.info(
                        "%s API retry response: status=%d elapsed=%.2fs content_len=%d",
                        self.provider_id,
                        response.status_code,
                        elapsed,
                        len(response.text),
                    )
                except httpx.TimeoutException as exc:
                    raise TimeoutError(str(exc)) from exc
                except httpx.HTTPError as exc:
                    raise ProviderError(str(exc)) from exc
                if response.status_code >= 400:
                    raise ProviderError(response.text)
                return self._parse_response(request, response)
            raise ProviderError(error_text)

        return self._parse_response(request, response)

    def _parse_response(self, request: LLMRequest, response: httpx.Response) -> LLMResponse:
        try:
            data_obj = cast(object, response.json())
            if not isinstance(data_obj, dict):
                raise TypeError("response must be an object")
            data = cast(Mapping[str, object], data_obj)

            choices_obj = data.get("choices")
            if not isinstance(choices_obj, list) or not choices_obj:
                raise TypeError("choices must be a non-empty list")
            choices = cast(Sequence[object], choices_obj)

            choice_obj = choices[0]
            if not isinstance(choice_obj, dict):
                raise TypeError("choice must be an object")
            choice = cast(Mapping[str, object], choice_obj)

            message_obj = choice.get("message")
            if not isinstance(message_obj, dict):
                raise TypeError("message must be an object")
            message = cast(Mapping[str, object], message_obj)

            text = message.get("content")
            if not isinstance(text, str):
                raise TypeError("message content must be a string")
            # Support reasoning models (e.g., DeepSeek-R1) that output in reasoning_content
            if not text.strip():
                reasoning_text = message.get("reasoning_content")
                if isinstance(reasoning_text, str) and reasoning_text.strip():
                    text = reasoning_text

            usage_obj = data.get("usage")
            empty_usage: Mapping[str, object] = {}
            if isinstance(usage_obj, dict):
                usage = cast(Mapping[str, object], usage_obj)
            else:
                usage = empty_usage

            input_tokens = usage.get("prompt_tokens")
            output_tokens = usage.get("completion_tokens")
            finish_reason = choice.get("finish_reason")

            return LLMResponse(
                provider_id=self.provider_id,
                model=request.model,
                text=text,
                input_tokens=input_tokens if isinstance(input_tokens, int) else None,
                output_tokens=output_tokens if isinstance(output_tokens, int) else None,
                finish_reason=finish_reason if isinstance(finish_reason, str) else None,
            )
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise ProviderError("Failed to parse provider response") from exc
