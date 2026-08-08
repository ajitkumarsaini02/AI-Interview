import json
from typing import Type, TypeVar
from pydantic import BaseModel
from .provider import LLMProvider

T = TypeVar("T", bound=BaseModel)


class GroqProvider(LLMProvider):
    name = "groq"

    def __init__(self, api_key: str):
        from groq import AsyncGroq
        self.client = AsyncGroq(api_key=api_key)

    async def generate_structured(
        self,
        prompt: str,
        system_prompt: str,
        schema: Type[T]
    ) -> T:
        response = await self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        data = json.loads(content)
        return schema.model_validate(data)
