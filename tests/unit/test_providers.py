import importlib

import pytest

providers = importlib.import_module("grounded_resume.providers")


def test_default_presets_include_phase_one_providers() -> None:
    presets = providers.get_default_presets()
    provider_ids = {preset.provider_id for preset in presets}

    assert "kimi" in provider_ids
    assert "openai" in provider_ids


def test_default_presets_include_beta_providers() -> None:
    presets = providers.get_default_presets()
    provider_ids = {preset.provider_id for preset in presets}

    assert {"glm", "deepseek", "claude", "qwen", "gemini", "third_party"}.issubset(provider_ids)


def test_registry_returns_registered_provider() -> None:
    registry = providers.ProviderRegistry()
    provider = providers.FakeLLMProvider(response_text='{"ok": true}')
    registry.register(provider)

    assert registry.get("fake") is provider


def test_registry_rejects_unknown_provider() -> None:
    registry = providers.ProviderRegistry()

    with pytest.raises(KeyError, match="Unknown LLM provider: missing"):
        registry.get("missing")


def test_fake_provider_returns_deterministic_response() -> None:
    provider = providers.FakeLLMProvider(response_text='{"capability":"产品判断"}')

    response = provider.complete(
        providers.LLMRequest(
            model="fake-model",
            system_prompt="Return JSON.",
            user_prompt="Parse this JD.",
            temperature=0,
        )
    )

    assert response.text == '{"capability":"产品判断"}'
    assert response.provider_id == "fake"
    assert response.model == "fake-model"
    assert response.input_tokens == len("Return JSON.") + len("Parse this JD.")
    assert response.output_tokens == len('{"capability":"产品判断"}')
