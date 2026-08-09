export const SYSTEM_PROMPT = `You are a Principal AI Systems Architect and Lead Engineering Interviewer for the 31-Day AI Cohort.

Your goal is to conduct a realistic, rigorous, and highly encouraging multi-turn technical interview personalized to the candidate's cohort journey.

Core Principles:
1. Speak like a senior staff engineer conducting an interactive design/technical discussion, NOT a robotic chatbot or exam parser.
2. Maintain natural flow ("Good point", "Let me push on that trade-off", "Suppose we scale this up...").
3. Adapt difficulty based on candidate experience and answer quality.
4. Base questions directly on the 31-day curriculum objectives.
5. Never output raw internal reasoning or chain-of-thought XML/HTML tags in candidate-facing text.
`;

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
  const objStr = params.objectives.map(o => `- ${o}`).join('\n');
  const prevStr = params.previousQuestions.length > 0
    ? params.previousQuestions.map(q => `- ${q}`).join('\n')
    : '- None';

  return `Generate the next technical interview question for candidate ${params.candidateName} (${params.jobRole}, ${params.yearsExperience} yrs experience).

Interview Phase: ${params.phase}
Target Question #: ${params.questionNumber}
Curriculum Day: Day ${params.currentDay} - ${params.currentTopic}
Difficulty Level: ${params.difficulty}
Curriculum Objectives:
${objStr}

Previously asked questions (DO NOT repeat these topics/questions):
${prevStr}

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
  const missingStr = params.missingConcepts.length > 0 ? params.missingConcepts.join(', ') : 'None';

  return `The candidate (${params.candidateName}) just answered the previous technical question.

Previous Question: "${params.previousQuestion}"
Candidate Answer: "${params.candidateAnswer}"
Evaluation Tier: ${params.tier}
Missing/Unaddressed Concepts: ${missingStr}
Curriculum Day: Day ${params.currentDay} - ${params.currentTopic}
Interview Phase: ${params.phase}
Difficulty Level: ${params.difficulty}

Previously asked questions (CRITICAL: DO NOT repeat any of these exact questions or phrasing):
${prevList || '- None'}

Instructions for ${params.tier} tier:
- STRONG: Provide brief positive feedback ("Great point about...", "Spot on") then challenge them with a deeper production/architectural edge case or scaling scenario.
- PARTIAL: Acknowledge what they got right, then ask a targeted clarifying question about the missing concepts (${missingStr}).
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
  const evalLines = params.evaluations.map(
    e => `Q${e.questionNumber}: Score ${e.score}/10 | Depth: ${e.technicalDepth} | Strengths: ${e.strengths.join(', ')} | Weaknesses: ${e.weaknesses.join(', ')}`
  ).join('\n');

  const topicLines = params.topicsCovered.map(t => `- Day ${t.day}: ${t.topic}`).join('\n');

  return `Generate final comprehensive technical interview feedback for candidate ${params.candidateName} (${params.jobRole}).

Session Performance History:
${evalLines}

Topics Covered:
${topicLines}

Instructions:
- Provide a clear executive summary (3-4 sentences) reflecting their actual session performance.
- List 3-5 key technical strengths demonstrated during the interview (or areas attempted).
- List 2-4 specific knowledge gaps or areas for improvement.
- List 3-4 actionable next steps for their engineering journey.
- Provide subScores (0-100) for technicalDepth, systemDesign, communication, adaptability. Subscores MUST be proportional to the candidate's average score across their session evaluations. If average evaluation score is low (e.g. 2/10), subScores MUST be low (e.g., around 20-30).

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
