from typing import List, Dict, Any, Optional

SYSTEM_PROMPT = """You are a Principal AI Systems Architect and Lead Engineering Interviewer for the 31-Day AI Cohort.

Your goal is to conduct a realistic, rigorous, and highly encouraging multi-turn technical interview personalized to the candidate's cohort journey.

Core Principles:
1. Speak like a senior staff engineer conducting an interactive design/technical discussion, NOT a robotic chatbot or exam parser.
2. Maintain natural flow ("Good point", "Let me push on that trade-off", "Suppose we scale this up...").
3. Adapt difficulty based on candidate experience and answer quality.
4. Base questions directly on the 31-day curriculum objectives.
5. Never output raw internal reasoning or chain-of-thought XML/HTML tags in candidate-facing text.
"""


def build_question_prompt(
    candidate_name: str,
    job_role: str,
    years_experience: int,
    current_day: int,
    current_topic: str,
    objectives: List[str],
    difficulty: str,
    phase: str,
    question_number: int,
    previous_questions: List[str],
) -> str:
    obj_str = "\n".join([f"- {o}" for o in objectives])
    prev_str = "\n".join([f"- {q}" for q in previous_questions]) if previous_questions else "- None"

    return f"""Generate the next technical interview question for candidate {candidate_name} ({job_role}, {years_experience} yrs experience).

Interview Phase: {phase}
Target Question #: {question_number}
Curriculum Day: Day {current_day} - {current_topic}
Difficulty Level: {difficulty}
Curriculum Objectives:
{obj_str}

Previously asked questions (DO NOT repeat these topics/questions):
{prev_str}

Instructions:
- Craft an engaging, natural technical question aligned with {current_topic}.
- Frame the question appropriately for a {job_role}.
- Do NOT prefix the reply string with "Day X:" or robotic headers. Speak like a senior human interviewer.
- Return JSON strictly matching this schema:
{{
  "reply": "<the question to present to the candidate>",
  "day": {current_day},
  "topic": "{current_topic}",
  "objective": "<primary curriculum objective targeted>",
  "difficulty": "{difficulty}",
  "phase": "{phase}"
}}
"""


def build_followup_prompt(
    candidate_name: str,
    previous_question: str,
    candidate_answer: str,
    tier: str,
    missing_concepts: List[str],
    current_day: int,
    current_topic: str,
    difficulty: str,
    phase: str,
    previous_questions: Optional[List[str]] = None,
) -> str:
    prev_list = "\n".join([f"- {q}" for q in (previous_questions or [])]) if previous_questions else "- None"
    missing_str = ", ".join(missing_concepts) if missing_concepts else "None"

    return f"""The candidate ({candidate_name}) just answered the previous technical question.

Previous Question: "{previous_question}"
Candidate Answer: "{candidate_answer}"
Evaluation Tier: {tier}
Missing/Unaddressed Concepts: {missing_str}
Curriculum Day: Day {current_day} - {current_topic}
Interview Phase: {phase}
Difficulty Level: {difficulty}

Previously asked questions (CRITICAL: DO NOT repeat any of these exact questions or phrasing):
{prev_list}

Instructions for {tier} tier:
- STRONG: Provide brief positive feedback ("Great point about...", "Spot on") then challenge them with a deeper production/architectural edge case or scaling scenario.
- PARTIAL: Acknowledge what they got right, then ask a targeted clarifying question about the missing concepts ({missing_str}).
- WEAK: Friendly conceptual pivot or diagnostic hint to help them rebuild their explanation around fundamentals.

Return JSON strictly matching this schema:
{{
  "reply": "<natural interviewer response with follow-up question>",
  "day": {current_day},
  "topic": "{current_topic}",
  "objective": "Follow-up evaluation of {current_topic}",
  "difficulty": "{difficulty}",
  "phase": "{phase}"
}}
"""


def build_evaluation_prompt(
    question: str,
    answer: str,
    topic: str,
    day: int,
    objectives: List[str],
) -> str:
    obj_str = "; ".join(objectives)

    return f"""Evaluate the technical response given by the candidate for the question below.

Curriculum Day {day}: {topic}
Objectives: {obj_str}

Question: "{question}"
Candidate Answer: "{answer}"

Evaluate objectively and fairly based on factual correctness, relevance, and candidate understanding:
1. Score from 0 to 10.
   - 8-10 (STRONG, correct): The candidate's answer is accurate, relevant, and demonstrates sound technical understanding of the question (whether concise or detailed).
   - 6-7 (PARTIAL, mostly_correct): The answer covers key points but lacks minor completeness or depth.
   - 4-5 (PARTIAL, partially_correct): The answer shows partial understanding but has notable gaps or minor misconceptions.
   - 0-3 (WEAK, incorrect): Factually wrong, completely off-topic, evasive ("idk", "pass", "skip"), or pure gibberish.
2. Correctness tier (correct, mostly_correct, partially_correct, incorrect).
3. Technical depth (deep, medium, surface, none).
4. Communication (clear, concise, verbose, unclear, evasive).
5. List missing key concepts or misconceptions (if any).
6. Determine overall performance tier:
   - "STRONG" (score >= 8): Clear understanding and correct technical answer.
   - "PARTIAL" (score 6-7): Mostly correct with minor gaps.
   - "WEAK" (score < 6): Incorrect, evasive, or off-topic answer.

Return JSON strictly matching this schema:
{{
  "score": <number 0-10>,
  "correctness": "<string>",
  "technicalDepth": "<string>",
  "communication": "<string>",
  "missingConcepts": ["<string>"],
  "misconceptions": ["<string>"],
  "strengths": ["<string>"],
  "weaknesses": ["<string>"],
  "shouldFollowUp": <true|false>,
  "followUpType": "<deep_dive|clarification|diagnostic>",
  "tier": "<STRONG|PARTIAL|WEAK>"
}}
"""


def build_feedback_prompt(
    candidate_name: str,
    job_role: str,
    evaluations: List[Dict[str, Any]],
    topics_covered: List[Dict[str, Any]],
) -> str:
    eval_lines = []
    for e in evaluations:
        str_list = ", ".join(e.get("strengths", []))
        weak_list = ", ".join(e.get("weaknesses", []))
        eval_lines.append(
            f"Q{e.get('questionNumber')}: Score {e.get('score')}/10 | Depth: {e.get('technicalDepth')} | Strengths: {str_list} | Weaknesses: {weak_list}"
        )
    eval_str = "\n".join(eval_lines)

    topic_lines = [f"- Day {t['day']}: {t['topic']}" for t in topics_covered]
    topic_str = "\n".join(topic_lines)

    return f"""Generate final comprehensive technical interview feedback for candidate {candidate_name} ({job_role}).

Session Performance History:
{eval_str}

Topics Covered:
{topic_str}

Instructions:
- Provide a clear executive summary (3-4 sentences) reflecting their actual session performance.
- List 3-5 key technical strengths demonstrated during the interview (or areas attempted).
- List 2-4 specific knowledge gaps or areas for improvement.
- List 3-4 actionable next steps for their engineering journey.
- Provide subScores (0-100) for technicalDepth, systemDesign, communication, adaptability. Subscores MUST be proportional to the candidate's average score across their session evaluations. If average evaluation score is low (e.g. 2/10), subScores MUST be low (e.g., around 20-30).

Return JSON strictly matching this schema:
{{
  "summary": "<executive summary string>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "next": ["<next step 1>", "<next step 2>", "<next step 3>"],
  "subScores": {{
    "technicalDepth": <number 0-100>,
    "systemDesign": <number 0-100>,
    "communication": <number 0-100>,
    "adaptability": <number 0-100>
  }}
}}
"""
