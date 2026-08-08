from typing import List, Optional, Dict, Any
from app.schemas.schemas import QuestionGenerationResult, EvaluationResult
from app.prompts.prompts import SYSTEM_PROMPT, build_question_prompt, build_followup_prompt
from app.services.llm.factory import get_llm_provider
from app.services.retrieval_service import retrieval_service


class QuestionService:

    async def generate_next_question(
        self,
        candidate_name: str,
        job_role: str,
        years_experience: int,
        current_day: int,
        current_topic: str,
        difficulty: str,
        phase: str,
        question_number: int,
        previous_questions: List[str],
        is_follow_up: bool = False,
        previous_question: Optional[str] = None,
        candidate_answer: Optional[str] = None,
        last_evaluation: Optional[EvaluationResult] = None,
    ) -> QuestionGenerationResult:
        llm = get_llm_provider()
        day_info = retrieval_service.get_day_info(current_day)
        objectives = day_info.objectives if day_info else [f"Mastery of {current_topic}"]

        if is_follow_up and previous_question and candidate_answer and last_evaluation:
            prompt = build_followup_prompt(
                candidate_name=candidate_name,
                previous_question=previous_question,
                candidate_answer=candidate_answer,
                tier=last_evaluation.tier,
                missing_concepts=last_evaluation.missingConcepts,
                current_day=current_day,
                current_topic=current_topic,
                difficulty=difficulty,
                phase=phase,
                previous_questions=previous_questions,
            )
            try:
                return await llm.generate_structured(prompt, SYSTEM_PROMPT, QuestionGenerationResult)
            except Exception as err:
                print(f"QuestionService followup LLM error, falling back: {err}")

        prompt = build_question_prompt(
            candidate_name=candidate_name,
            job_role=job_role,
            years_experience=years_experience,
            current_day=current_day,
            current_topic=current_topic,
            objectives=objectives,
            difficulty=difficulty,
            phase=phase,
            question_number=question_number,
            previous_questions=previous_questions,
        )

        try:
            return await llm.generate_structured(prompt, SYSTEM_PROMPT, QuestionGenerationResult)
        except Exception as err:
            print(f"QuestionService question LLM error, falling back: {err}")
            return QuestionGenerationResult(
                reply=f"Regarding {current_topic}: how would you structure the architecture and handle key trade-offs in a production environment?",
                day=current_day,
                topic=current_topic,
                objective=objectives[0] if objectives else f"Mastery of Day {current_day}",
                difficulty=difficulty,
                phase=phase,
            )


question_service = QuestionService()
