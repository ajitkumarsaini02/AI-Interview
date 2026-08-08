from typing import List, Dict, Any
from app.schemas.schemas import CandidateInput


class CandidateProfileAnalysis:

    def __init__(
        self,
        role: str,
        experience: int,
        completed_days: List[int],
        failed_days: List[int],
        skipped_days: List[int],
        high_attempt_topics: List[Dict[str, Any]],
        strong_signals: List[str],
        weak_signals: List[str],
        recommended_topics: List[Dict[str, Any]],
        initial_difficulty: str,
    ):
        self.role = role
        self.experience = experience
        self.completedDays = completed_days
        self.failedDays = failed_days
        self.skippedDays = skipped_days
        self.highAttemptTopics = high_attempt_topics
        self.strongSignals = strong_signals
        self.weakSignals = weak_signals
        self.recommendedTopics = recommended_topics
        self.initialDifficulty = initial_difficulty


class CandidateService:

    def analyze_profile(self, candidate: CandidateInput) -> CandidateProfileAnalysis:
        member = candidate.member
        missions = candidate.missions or []
        signals = candidate.signals

        completed_days: List[int] = []
        failed_days: List[int] = []
        skipped_days: List[int] = []
        high_attempt_topics: List[Dict[str, Any]] = []

        for m in missions:
            if m.passed:
                completed_days.append(m.day)
            elif m.skipped:
                skipped_days.append(m.day)
            else:
                failed_days.append(m.day)

            if m.attempts and m.attempts > 2:
                high_attempt_topics.append({"day": m.day, "title": m.title, "attempts": m.attempts})

        strong_signals: List[str] = []
        weak_signals: List[str] = []

        if member.yearsExperience >= 7:
            strong_signals.append(f"Senior experience level ({member.yearsExperience} yrs)")
        elif member.yearsExperience < 3:
            weak_signals.append(f"Junior experience level ({member.yearsExperience} yrs)")

        first_try_rate = signals.missionsFirstTry / max(1, signals.missionsCompleted)
        if first_try_rate > 0.7:
            strong_signals.append(f"High first-try mastery rate ({signals.missionsFirstTry}/{signals.missionsCompleted})")

        if high_attempt_topics:
            days_str = ", ".join([f"Day {h['day']}" for h in high_attempt_topics])
            weak_signals.append(f"Multiple attempt struggles on {days_str}")

        if skipped_days:
            days_str = ", ".join(map(str, skipped_days))
            weak_signals.append(f"Skipped missions on Days: {days_str}")

        recommended_topics: List[Dict[str, Any]] = []

        # Priority 1: Passed missions
        passed_missions = [m for m in missions if m.passed]
        for m in passed_missions[:8]:
            recommended_topics.append({
                "day": m.day,
                "title": m.title,
                "reason": f"Passed mission with {m.attempts or 1} attempt(s)",
            })

        # Priority 2: Failed missions
        failed_missions = [m for m in missions if not m.passed and not m.skipped]
        for m in failed_missions:
            recommended_topics.append({
                "day": m.day,
                "title": m.title,
                "reason": "Failed mission - diagnostic verification opportunity",
            })

        initial_difficulty = "Intermediate"
        if member.yearsExperience >= 8 and signals.missionsFirstTry >= 20:
            initial_difficulty = "Advanced"
        elif member.yearsExperience < 3:
            initial_difficulty = "Beginner"

        return CandidateProfileAnalysis(
            role=member.jobRole,
            experience=member.yearsExperience,
            completed_days=completed_days,
            failed_days=failed_days,
            skipped_days=skipped_days,
            high_attempt_topics=high_attempt_topics,
            strong_signals=strong_signals,
            weak_signals=weak_signals,
            recommended_topics=recommended_topics,
            initial_difficulty=initial_difficulty,
        )


candidate_service = CandidateService()
