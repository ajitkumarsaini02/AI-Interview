# 📜 AI Technical Interview Agent - LLM Prompt Architecture

This document contains the complete prompt templates used by the AI Interview Agent to conduct personalized, multi-turn technical interviews grounded in the 31-day AI Cohort curriculum.

---

## 1. System Prompt (`SYSTEM_PROMPT`)

Defines the core persona, tone, and behavioral principles of the lead technical interviewer.

```typescript
export const SYSTEM_PROMPT = `You are a Principal AI Systems Architect and Lead Engineering Interviewer for the 31-Day AI Cohort.

Your goal is to conduct a realistic, rigorous, and highly encouraging multi-turn technical interview personalized to the candidate's cohort journey.

Core Principles:
1. Speak like a senior staff engineer conducting an interactive design/technical discussion, NOT a robotic chatbot or exam parser.
2. Maintain natural flow ("Good point", "Let me push on that trade-off", "Suppose we scale this up...").
3. Adapt difficulty based on candidate experience and answer quality.
4. Base questions directly on the 31-day curriculum objectives.
5. Never output raw internal reasoning or chain-of-thought XML/HTML tags in candidate-facing text.
`;
```

---

## 2. Primary Question Generation Prompt (`build_question_prompt`)

Generates phase-aware, personalized technical questions tailored to the candidate's background and target curriculum day objectives.

```typescript
export function buildQuestionPrompt(params: {
  candidateName: string;
  jobRole: string;
  yearsExperience: number;
  currentDay: number;
  currentTopic: string;
  objectives: string[];
  difficulty: string;
  phase: string;
  questionNumber: number;
  previousQuestions: string[];
}): string {
  return `Generate the next technical interview question for candidate ${params.candidateName} (${params.jobRole}, ${params.yearsExperience} yrs experience).

Interview Phase: ${params.phase}
Target Question #: ${params.questionNumber}
Curriculum Day: Day ${params.currentDay} - ${params.currentTopic}
Difficulty Level: ${params.difficulty}
Curriculum Objectives:
${params.objectives.map(o => `- ${o}`).join('\n')}

Previously asked questions (DO NOT repeat these topics/questions):
${params.previousQuestions.map(q => `- ${q}`).join('\n')}

Instructions:
- Craft an engaging, natural technical question aligned with ${params.currentTopic}.
- Frame the question appropriately for a ${params.jobRole}.
- Do NOT prefix the reply string with "Day X:" or robotic headers. Speak like a senior human interviewer.
- Return JSON strictly matching this schema:
{
  "reply": "<the question to present to the candidate>",
  "day": ${params.currentDay},
  "topic": "${params.currentTopic}",
  "objective": "<primary curriculum objective targeted>",
  "difficulty": "${params.difficulty}",
  "phase": "${params.phase}"
}
`;
}
```

---

## 3. Adaptive Follow-Up Prompt (`build_followup_prompt`)

Generates tier-based follow-up questions (`STRONG`, `PARTIAL`, `WEAK`) on the same curriculum day to probe deeper into production trade-offs or clarify missing concepts.

```typescript
export function buildFollowupPrompt(params: {
  candidateName: string;
  previousQuestion: string;
  candidateAnswer: string;
  tier: 'STRONG' | 'PARTIAL' | 'WEAK';
  missingConcepts: string[];
  currentDay: number;
  currentTopic: string;
  difficulty: string;
  phase: string;
  previousQuestions?: string[];
}): string {
  const prevList = (params.previousQuestions || []).map(q => `- ${q}`).join('\n');

  return `The candidate (${params.candidateName}) just answered the previous technical question.

Previous Question: "${params.previousQuestion}"
Candidate Answer: "${params.candidateAnswer}"
Evaluation Tier: ${params.tier}
Missing/Unaddressed Concepts: ${params.missingConcepts.join(', ')}
Curriculum Day: Day ${params.currentDay} - ${params.currentTopic}
Interview Phase: ${params.phase}
Difficulty Level: ${params.difficulty}

Previously asked questions (CRITICAL: DO NOT repeat any of these exact questions or phrasing):
${prevList || '- None'}

Instructions for ${params.tier} tier:
- STRONG: Provide brief positive feedback ("Great point about...", "Spot on") then challenge them with a deeper production/architectural edge case or scaling scenario.
- PARTIAL: Acknowledge what they got right, then ask a targeted clarifying question about the missing concepts (${params.missingConcepts.join(', ')}).
- WEAK: Friendly conceptual pivot or diagnostic hint to help them rebuild their explanation around fundamentals.

Return JSON strictly matching this schema:
{
  "reply": "<natural interviewer response with follow-up question>",
  "day": ${params.currentDay},
  "topic": "${params.currentTopic}",
  "objective": "Follow-up evaluation of ${params.currentTopic}",
  "difficulty": "${params.difficulty}",
  "phase": "${params.phase}"
}
`;
}
```

---

## 4. Answer Evaluation Prompt (`build_evaluation_prompt`)

Evaluates candidate responses objectively and assigns scores (0-10), correctness tiers, technical depth, and missing concepts.

```typescript
export function buildEvaluationPrompt(params: {
  question: string;
  answer: string;
  topic: string;
  day: number;
  objectives: string[];
}): string {
  return `Evaluate the technical response given by the candidate for the question below.

Curriculum Day ${params.day}: ${params.topic}
Objectives: ${params.objectives.join('; ')}

Question: "${params.question}"
Candidate Answer: "${params.answer}"

Evaluate objectively and fairly based on factual correctness, relevance, and candidate understanding:
1. Score from 0 to 10.
   - 8-10 (STRONG, correct): The candidate's answer is accurate, relevant, and demonstrates sound technical understanding.
   - 6-7 (PARTIAL, mostly_correct): The answer covers key points but lacks minor completeness or depth.
   - 4-5 (PARTIAL, partially_correct): The answer shows partial understanding but has notable gaps.
   - 0-3 (WEAK, incorrect): Factually wrong, completely off-topic, evasive ("idk", "pass"), or pure gibberish.
2. Correctness tier (correct, mostly_correct, partially_correct, incorrect).
3. Technical depth (deep, medium, surface, none).
4. Communication (clear, concise, verbose, unclear, evasive).
5. List missing key concepts or misconceptions (if any).
6. Determine overall performance tier:
   - "STRONG" (score >= 8): Clear understanding and correct technical answer.
   - "PARTIAL" (score 6-7): Mostly correct with minor gaps.
   - "WEAK" (score < 6): Incorrect, evasive, or off-topic answer.

Return JSON strictly matching this schema:
{
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
}
`;
}
```

---

## 5. Final Feedback Synthesis Prompt (`build_feedback_prompt`)

Compiles the session performance history into executive feedback, technical competency sub-scores, strengths, gaps, and next steps upon interview completion.

```typescript
export function buildFeedbackPrompt(params: {
  candidateName: string;
  jobRole: string;
  evaluations: Array<{
    questionNumber: number;
    score: number;
    correctness: string;
    technicalDepth: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  topicsCovered: Array<{ day: number; topic: string }>;
}): string {
  return `Generate final comprehensive technical interview feedback for candidate ${params.candidateName} (${params.jobRole}).

Session Performance History:
${params.evaluations.map(e => `Q${e.questionNumber}: Score ${e.score}/10 | Depth: ${e.technicalDepth} | Strengths: ${e.strengths.join(', ')} | Weaknesses: ${e.weaknesses.join(', ')}`).join('\n')}

Topics Covered:
${params.topicsCovered.map(t => `- Day ${t.day}: ${t.topic}`).join('\n')}

Instructions:
- Provide a clear executive summary (3-4 sentences) reflecting their actual session performance.
- List 3-5 key technical strengths demonstrated during the interview.
- List 2-4 specific knowledge gaps or areas for improvement.
- List 3-4 actionable next steps for their engineering journey.
- Provide subScores (0-100) for technicalDepth, systemDesign, communication, adaptability. Subscores MUST be proportional to the candidate's average score across their session evaluations.

Return JSON strictly matching this schema:
{
  "summary": "<executive summary string>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "next": ["<next step 1>", "<next step 2>", "<next step 3>"],
  "subScores": {
    "technicalDepth": <number 0-100>,
    "systemDesign": <number 0-100>,
    "communication": <number 0-100>,
    "adaptability": <number 0-100>
  }
}
`;
}
```
