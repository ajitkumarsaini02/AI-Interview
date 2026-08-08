from typing import List, Dict, Any, Optional
from app.schemas.schemas import EvaluationResult
from .candidate_service import CandidateProfileAnalysis


class SessionState:

    def __init__(
        self,
        session_id: str,
        candidate_id: str,
        phase: str,
        question_number: int,
        topics_covered: List[Dict[str, Any]],
        current_day: int,
        current_topic: str,
        difficulty: str,
        previous_questions: List[str],
        previous_answers: List[str],
        evaluations: List[EvaluationResult],
        follow_up_count: int = 0,
        is_complete: bool = False,
    ):
        self.sessionId = session_id
        self.candidateId = candidate_id
        self.phase = phase
        self.questionNumber = question_number
        self.topicsCovered = topics_covered
        self.currentDay = current_day
        self.currentTopic = current_topic
        self.difficulty = difficulty
        self.previousQuestions = previous_questions
        self.previousAnswers = previous_answers
        self.evaluations = evaluations
        self.followUpCount = follow_up_count
        self.isComplete = is_complete


class PlannerService:

    def determine_initial_state(
        self,
        session_id: str,
        candidate_id: str,
        profile: CandidateProfileAnalysis
    ) -> SessionState:
        initial_day = profile.completedDays[0] if profile.completedDays else 7
        initial_topic = profile.recommendedTopics[0]["title"] if profile.recommendedTopics else "Embeddings Explained"

        return SessionState(
            session_id=session_id,
            candidate_id=candidate_id,
            phase="INTRO",
            question_number=0,
            topics_covered=[],
            current_day=initial_day,
            current_topic=initial_topic,
            difficulty=profile.initialDifficulty,
            previous_questions=[],
            previous_answers=[],
            evaluations=[],
            follow_up_count=0,
            is_complete=False,
        )

    def get_next_step(
        self,
        state: SessionState,
        profile: CandidateProfileAnalysis,
        last_evaluation: Optional[EvaluationResult] = None
    ) -> Dict[str, Any]:
        q_count = state.questionNumber
        unique_days = len(set(t["day"] for t in state.topicsCovered))

        # Completion criteria: >= 8 questions AND >= 4 unique curriculum days
        if q_count >= 8 and unique_days >= 4:
            if q_count >= 10 or state.phase == "FINAL CHALLENGE" or (q_count >= 8 and last_evaluation and last_evaluation.tier == "STRONG"):
                return {
                    "nextPhase": "FEEDBACK",
                    "nextDay": state.currentDay,
                    "nextTopic": state.currentTopic,
                    "nextDifficulty": state.difficulty,
                    "isFollowUp": False,
                    "isFinished": True,
                }

        is_follow_up = False
        next_phase = state.phase
        next_difficulty = state.difficulty

        if last_evaluation:
            if last_evaluation.tier == "STRONG":
                if next_difficulty == "Beginner":
                    next_difficulty = "Intermediate"
                elif next_difficulty == "Intermediate":
                    next_difficulty = "Advanced"
                elif next_difficulty == "Advanced":
                    next_difficulty = "Expert"

                if state.followUpCount < 1:
                    is_follow_up = True
                    next_phase = "ADAPTIVE FOLLOW-UP"

            elif last_evaluation.tier == "WEAK":
                if next_difficulty == "Expert":
                    next_difficulty = "Advanced"
                elif next_difficulty == "Advanced":
                    next_difficulty = "Intermediate"
                elif next_difficulty == "Intermediate":
                    next_difficulty = "Beginner"

                if state.followUpCount < 1:
                    is_follow_up = True
                    next_phase = "ADAPTIVE FOLLOW-UP"

            elif last_evaluation.tier == "PARTIAL":
                if state.followUpCount < 1:
                    is_follow_up = True
                    next_phase = "ADAPTIVE FOLLOW-UP"

        next_day = state.currentDay
        next_topic = state.currentTopic

        if not is_follow_up:
            if q_count < 2:
                next_phase = "FUNDAMENTALS"
            elif q_count < 5:
                next_phase = "APPLIED"
            elif q_count < 7:
                next_phase = "SYSTEM DESIGN"
            else:
                next_phase = "FINAL CHALLENGE"

            tested_days = [t["day"] for t in state.topicsCovered]
            remaining_recs = [r for r in profile.recommendedTopics if r["day"] not in tested_days]

            if remaining_recs:
                next_day = remaining_recs[0]["day"]
                next_topic = remaining_recs[0]["title"]
            else:
                candidate_days = profile.completedDays + profile.failedDays
                next_untested = next((d for d in candidate_days if d not in tested_days), None)
                if next_untested:
                    next_day = next_untested
                    next_topic = f"Day {next_untested} Mastery"
                else:
                    core_days = [7, 8, 10, 11, 16, 22, 23, 28, 31]
                    cycle_day = next((d for d in core_days if d not in tested_days), None) or core_days[q_count % len(core_days)]
                    next_day = cycle_day
                    next_topic = f"Day {cycle_day} Architecture"

        return {
            "nextPhase": next_phase,
            "nextDay": next_day,
            "nextTopic": next_topic,
            "nextDifficulty": next_difficulty,
            "isFollowUp": is_follow_up,
            "isFinished": False,
        }


planner_service = PlannerService()
