from abc import ABC, abstractmethod
from typing import Type, TypeVar, Any
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class LLMProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        system_prompt: str,
        schema: Type[T]
    ) -> T:
        pass
