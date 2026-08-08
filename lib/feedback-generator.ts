import OpenAI from 'openai';
import { FinalFeedback, FinalFeedbackOutputSchema, InterviewSession } from '../types/interview';

export async function generateFinalFeedback(session: InterviewSession): Promise<FinalFeedback> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });

      const evaluationsSummary = session.answerEvaluations
        .map(
          (evalItem, idx) =>
            `Q${idx + 1} (Day ${evalItem.day} - ${evalItem.topic}): Grade: ${evalItem.classification.toUpperCase()}.\nQuestion: ${evalItem.questionText}\nCandidate Answer: ${evalItem.candidateAnswer}\nReasoning: ${evalItem.reasoning}\nStrengths: ${evalItem.identifiedStrengths.join(', ') || 'None'}\nGaps: ${evalItem.identifiedGaps.join(', ') || 'None'}`
        )
        .join('\n\n');

      const prompt = `You are a Principal AI Architect generating structured final interview feedback for a technical candidate.

Candidate Profile:
- Name: ${session.candidateName}
- Target Role: ${session.candidate.member.jobRole} (${session.candidate.member.yearsExperience} yrs exp)

Interview Performance Data (${session.questionCount} questions asked across ${session.coveredDays.length} curriculum days):
${evaluationsSummary}

All Identified Strengths:
${session.strengths.join('; ') || 'Demonstrated core foundational knowledge.'}

All Identified Gaps:
${session.gaps.join('; ') || 'Minor edge-case refinements needed.'}

Instructions:
Generate detailed, evidence-based, actionable final feedback in JSON format adhering strictly to this structure:
{
  "summary": "2-3 sentences summarizing performance, technical depth, and overall recommendation.",
  "strengths": [
    "Specific, concrete technical strength referencing curriculum topics (e.g. 'Strong understanding of ChromaDB vector indexing and metadata filtering from Day 9').",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "gaps": [
    "Specific technical gap with exact curriculum concepts (e.g. 'Struggled to explain Reciprocal Rank Fusion (RRF) weighting logic in hybrid search from Day 10').",
    "Specific gap 2"
  ],
  "next": [
    "Actionable practice step (e.g. 'Revise hybrid retrieval and RRF weighting. Practice explaining how BM25 and dense vector search results are merged.').",
    "Actionable step 2"
  ]
}

DO NOT return generic feedback like 'Improve your AI knowledge'. Provide specific tools, day titles, and concepts from the interview.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const validated = FinalFeedbackOutputSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      }
    } catch (error) {
      console.warn('OpenAI feedback generation call failed, using fallback feedback generator:', error);
    }
  }

  return fallbackGenerateFeedback(session);
}

function fallbackGenerateFeedback(session: InterviewSession): FinalFeedback {
  const strongEvals = session.answerEvaluations.filter((e) => e.classification === 'strong');
  const acceptableEvals = session.answerEvaluations.filter((e) => e.classification === 'acceptable');
  const weakEvals = session.answerEvaluations.filter((e) => e.classification === 'weak' || e.classification === 'incorrect' || e.classification === 'incomplete');

  const uniqueStrengths = Array.from(new Set(session.strengths.filter((s) => s.length > 0)));
  const uniqueGaps = Array.from(new Set(session.gaps.filter((g) => g.length > 0)));

  const summary = `${session.candidateName} completed a ${session.questionCount}-question technical interview covering ${session.coveredDays.length} curriculum days. Performance was solid in ${strongEvals.length + acceptableEvals.length} out of ${session.questionCount} areas, demonstrating practical engineering capabilities with some areas for deeper mastery.`;

  const strengths = uniqueStrengths.length >= 2
    ? uniqueStrengths
    : [
        `Demonstrated working knowledge across ${session.coveredDays.length} curriculum days (${session.coveredTopics.slice(0, 3).join(', ')})`,
        `Solid communication and problem-solving structure for ${session.candidate.member.jobRole} level`,
      ];

  const gaps = uniqueGaps.length >= 1
    ? uniqueGaps
    : [
        `Needs further practice detailing architectural trade-offs and edge-case handling under production loads`,
      ];

  const next = gaps.map((gap) => `Review ${gap.toLowerCase()} by re-implementing hands-on exercises from relevant curriculum days.`);
  if (next.length === 0) {
    next.push(`Practice explaining production deployment and observability patterns (Docker, Kubernetes, and Prometheus monitoring).`);
  }

  return {
    summary,
    strengths,
    gaps,
    next,
  };
}
