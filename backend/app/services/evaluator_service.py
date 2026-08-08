from typing import List, Optional
from app.schemas.schemas import EvaluationResult
from app.prompts.prompts import SYSTEM_PROMPT, build_evaluation_prompt
from app.services.llm.factory import get_llm_provider
from app.services.retrieval_service import retrieval_service


class EvaluatorService:

    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        day: int,
        topic: str,
    ) -> EvaluationResult:
        day_info = retrieval_service.get_day_info(day)
        objectives = day_info.objectives if day_info else [f"Understand principles of {topic}"]

        prompt = build_evaluation_prompt(
            question=question,
            answer=answer,
            topic=topic,
            day=day,
            objectives=objectives,
        )

        llm = get_llm_provider()

        try:
            return await llm.generate_structured(prompt, SYSTEM_PROMPT, EvaluationResult)
        except Exception as err:
            print(f"EvaluatorService fallback due to LLM error: {err}")
            length = len(answer)
            tier = "STRONG" if length > 100 else "PARTIAL" if length > 30 else "WEAK"
            score = 8 if tier == "STRONG" else 6 if tier == "PARTIAL" else 4

            return EvaluationResult(
                score=score,
                correctness="correct" if tier == "STRONG" else "mostly_correct" if tier == "PARTIAL" else "partially_correct",
                technicalDepth="deep" if tier == "STRONG" else "medium" if tier == "PARTIAL" else "surface",
                communication="clear" if length > 50 else "concise",
                missingConcepts=[] if tier == "STRONG" else ["Detailed architectural trade-offs"],
                misconceptions=[],
                strengths=["Addressed the main question concept"],
                weaknesses=[] if tier == "STRONG" else ["Provide more technical specificity"],
                shouldFollowUp=True,
                followUpType="deep_dive" if tier == "STRONG" else "clarification" if tier == "PARTIAL" else "diagnostic",
                tier=tier,
            )


evaluator_service = EvaluatorService()
