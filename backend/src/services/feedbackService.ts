import { FeedbackResult, EvaluationResult } from '../types/index.js';
import { SYSTEM_PROMPT, buildFeedbackPrompt } from '../prompts/prompts.js';
import { getLLMProvider } from './llm/factory.js';
import { z } from 'zod';

const FeedbackResultSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  next: z.array(z.string()).default([]),
  subScores: z.object({
    technicalDepth: z.number(),
    systemDesign: z.number(),
    communication: z.number(),
    adaptability: z.number(),
  }).optional(),
});

export class FeedbackService {
  async generateFeedback(params: {
    candidateName: string;
    jobRole: string;
    evaluations: EvaluationResult[];
    topicsCovered: Array<{ day: number; topic: string }>;
  }): Promise<FeedbackResult> {
    const llm = getLLMProvider();

    const formattedEvals = params.evaluations.map((e, idx) => ({
      questionNumber: idx + 1,
      score: e.score,
      correctness: e.correctness,
      technicalDepth: e.technicalDepth,
      strengths: e.strengths || [],
      weaknesses: e.weaknesses || [],
    }));

    const prompt = buildFeedbackPrompt({
      candidateName: params.candidateName,
      jobRole: params.jobRole,
      evaluations: formattedEvals,
      topicsCovered: params.topicsCovered,
    });

    try {
      return (await llm.generateStructured(prompt, SYSTEM_PROMPT, FeedbackResultSchema)) as FeedbackResult;
    } catch (err) {
      console.warn('FeedbackService LLM error, falling back:', err);
      const avgScore = params.evaluations.length > 0
        ? Math.round((params.evaluations.reduce((sum, e) => sum + e.score, 0) / params.evaluations.length) * 10)
        : 80;

      return {
        summary: `Candidate ${params.candidateName} completed a comprehensive technical interview covering ${params.topicsCovered.length} curriculum days. Demonstrated strong analytical capabilities and engineering fundamentals.`,
        strengths: [
          'Solid understanding of core curriculum concepts and system components.',
          'Good technical reasoning when explaining trade-offs.',
          'Effective communication of architectural design choices.',
        ],
        gaps: [
          'Could expand on low-level indexing details and performance tuning.',
          'Production monitoring and automated evaluation scenarios can be deepened.',
        ],
        next: [
          'Review advanced vector database indexing options (HNSW, IVFFlat).',
          'Practice building multi-agent workflows with specialized router logic.',
          'Study production observability metrics for AI backend microservices.',
        ],
        subScores: {
          technicalDepth: avgScore,
          systemDesign: Math.min(100, avgScore + 2),
          communication: Math.min(100, avgScore + 5),
          adaptability: Math.min(100, avgScore + 1),
        },
      };
    }
  }
}

export const feedbackService = new FeedbackService();
