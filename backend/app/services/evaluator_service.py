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
            clean_answer = answer.lower().strip()
            length = len(clean_answer)

            evasive_phrases = ["idk", "don't know", "dont know", "no idea", "pass", "skip", "kuch bhi", "galat", "dunno", "nothing", "na", "nhi", "nahi"]
            is_evasive = any(p == clean_answer or clean_answer.startswith(p + " ") or clean_answer.endswith(" " + p) for p in evasive_phrases)
            is_keyboard_mashing = bool(re.match(r'^[a-z]{6,}$', clean_answer)) and clean_answer not in ["vector", "embedding", "fastapi", "postgres", "python"]
            is_too_short = length < 8

            if is_evasive or is_keyboard_mashing or is_too_short:
                return EvaluationResult(
                    score=1,
                    correctness="incorrect",
                    technicalDepth="none",
                    communication="evasive",
                    missingConcepts=["Core technical concept", "Direct answer to question"],
                    misconceptions=["Answer was evasive, gibberish, or insufficient to evaluate"],
                    strengths=[],
                    weaknesses=["Failed to provide a relevant technical answer"],
                    shouldFollowUp=True,
                    followUpType="diagnostic",
                    tier="WEAK",
                )

            domain_keywords = ["vector", "embedding", "rag", "agent", "mcp", "latency", "hnsw", "index", "retrieval", "hybrid", "sql", "context", "chunk", "python", "fastapi", "express", "react"]
            hit_count = sum(1 for k in domain_keywords if k in clean_answer)

            tier = "STRONG" if (length > 90 and hit_count >= 2) else "PARTIAL" if (length > 35 and hit_count >= 1) else "WEAK"
            score = 8 if tier == "STRONG" else 6 if tier == "PARTIAL" else (4 if hit_count > 0 else 2)

            return EvaluationResult(
                score=score,
                correctness="correct" if tier == "STRONG" else "mostly_correct" if tier == "PARTIAL" else "incorrect",
                technicalDepth="deep" if tier == "STRONG" else "medium" if tier == "PARTIAL" else "surface",
                communication="clear" if length > 50 else "concise",
                missingConcepts=[] if tier == "STRONG" else ["Detailed architectural trade-offs"],
                misconceptions=["Answer lacked specific technical domain terminology"] if tier == "WEAK" else [],
                strengths=["Attempted written answer"] if tier == "WEAK" else ["Addressed the main question concept"],
                weaknesses=[] if tier == "STRONG" else ["Provide more technical specificity"],
                shouldFollowUp=True,
                followUpType="deep_dive" if tier == "STRONG" else "clarification" if tier == "PARTIAL" else "diagnostic",
                tier=tier,
            )


evaluator_service = EvaluatorService()
