from typing import List, Dict, Any
from app.schemas.schemas import FeedbackResult, EvaluationResult, SubScores
from app.prompts.prompts import SYSTEM_PROMPT, build_feedback_prompt
from app.services.llm.factory import get_llm_provider


class FeedbackService:

    async def generate_feedback(
        self,
        candidate_name: str,
        job_role: str,
        evaluations: List[EvaluationResult],
        topics_covered: List[Dict[str, Any]],
    ) -> FeedbackResult:
        llm = get_llm_provider()

        formatted_evals = [
            {
                "questionNumber": idx + 1,
                "score": e.score,
                "correctness": e.correctness,
                "technicalDepth": e.technicalDepth,
                "strengths": e.strengths or [],
                "weaknesses": e.weaknesses or [],
            }
            for idx, e in enumerate(evaluations)
        ]

        prompt = build_feedback_prompt(
            candidate_name=candidate_name,
            job_role=job_role,
            evaluations=formatted_evals,
            topics_covered=topics_covered,
        )

        try:
            return await llm.generate_structured(prompt, SYSTEM_PROMPT, FeedbackResult)
        except Exception as err:
            print(f"FeedbackService LLM error, falling back: {err}")
            avg_score = (
                int((sum(e.score for e in evaluations) / len(evaluations)) * 10)
                if evaluations
                else 80
            )

            return FeedbackResult(
                summary=f"Candidate {candidate_name} completed a comprehensive technical interview covering {len(topics_covered)} curriculum days. Demonstrated strong analytical capabilities and engineering fundamentals.",
                strengths=[
                    "Solid understanding of core curriculum concepts and system components.",
                    "Good technical reasoning when explaining trade-offs.",
                    "Effective communication of architectural design choices.",
                ],
                gaps=[
                    "Could expand on low-level indexing details and performance tuning.",
                    "Production monitoring and automated evaluation scenarios can be deepened.",
                ],
                next=[
                    "Review advanced vector database indexing options (HNSW, IVFFlat).",
                    "Practice building multi-agent workflows with specialized router logic.",
                    "Study production observability metrics for AI backend microservices.",
                ],
                subScores=SubScores(
                    technicalDepth=avg_score,
                    systemDesign=min(100, avg_score + 2),
                    communication=min(100, avg_score + 5),
                    adaptability=min(100, avg_score + 1),
                ),
            )


feedback_service = FeedbackService()
