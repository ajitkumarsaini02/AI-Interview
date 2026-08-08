import json
import asyncio
from typing import Type, TypeVar
from pydantic import BaseModel
from .provider import LLMProvider

T = TypeVar("T", bound=BaseModel)


class GeminiProvider(LLMProvider):
    name = "gemini"

    def __init__(self, api_key: str):
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self.genai = genai
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    async def generate_structured(
        self,
        prompt: str,
        system_prompt: str,
        schema: Type[T]
    ) -> T:
        full_prompt = f"{system_prompt}\n\n{prompt}\n\nReturn JSON ONLY matching the requested schema."
        
        def _generate():
            return self.model.generate_content(
                full_prompt,
                generation_config={"response_mime_type": "application/json"}
            )

        response = await asyncio.to_thread(_generate)
        text = response.text
        data = json.loads(text)
        return schema.model_validate(data)

