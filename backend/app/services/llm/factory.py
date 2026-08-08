import os
from .provider import LLMProvider
from .demo_provider import DemoProvider
from .gemini_provider import GeminiProvider
from .openai_provider import OpenAIProvider
from .groq_provider import GroqProvider

_current_provider: LLMProvider | None = None


def get_llm_provider() -> LLMProvider:
    global _current_provider
    if _current_provider is not None:
        return _current_provider

    is_demo = os.getenv("DEMO_MODE", "").lower() in ("true", "1")
    provider_name = os.getenv("LLM_PROVIDER", "").lower()

    if not is_demo:
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        groq_key = os.getenv("GROQ_API_KEY")

        if (provider_name == "gemini" or not provider_name) and gemini_key:
            _current_provider = GeminiProvider(gemini_key)
            return _current_provider

        if (provider_name == "openai" or not provider_name) and openai_key:
            _current_provider = OpenAIProvider(openai_key)
            return _current_provider

        if (provider_name == "groq" or not provider_name) and groq_key:
            _current_provider = GroqProvider(groq_key)
            return _current_provider

    _current_provider = DemoProvider()
    return _current_provider
