import { EvaluationResult } from '../types/index.js';
import { SYSTEM_PROMPT, buildEvaluationPrompt } from '../prompts/prompts.js';
import { getLLMProvider } from './llm/factory.js';
import { retrievalService } from './retrievalService.js';
import { z } from 'zod';

const EvaluationResultSchema = z.object({
  score: z.number().min(0).max(10),
  correctness: z.string(),
  technicalDepth: z.string(),
  communication: z.string(),
  missingConcepts: z.array(z.string()).default([]),
  misconceptions: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  shouldFollowUp: z.boolean().default(true),
  followUpType: z.enum(['deep_dive', 'clarification', 'diagnostic']).default('clarification'),
  tier: z.enum(['STRONG', 'PARTIAL', 'WEAK']).default('PARTIAL'),
});

export class EvaluatorService {
  async evaluateAnswer(params: {
    question: string;
    answer: string;
    day: number;
    topic: string;
  }): Promise<EvaluationResult> {
    const dayInfo = retrievalService.getDayInfo(params.day);
    const objectives = dayInfo?.objectives || [`Understand principles of ${params.topic}`];

    const prompt = buildEvaluationPrompt({
      question: params.question,
      answer: params.answer,
      topic: params.topic,
      day: params.day,
      objectives,
    });

    const llm = getLLMProvider();

    try {
      return (await llm.generateStructured(prompt, SYSTEM_PROMPT, EvaluationResultSchema)) as EvaluationResult;
    } catch (err) {
      console.warn('EvaluatorService fallback due to LLM error:', err);
      const len = params.answer.length;
      const tier: 'STRONG' | 'PARTIAL' | 'WEAK' = len > 100 ? 'STRONG' : len > 30 ? 'PARTIAL' : 'WEAK';
      const score = tier === 'STRONG' ? 8 : tier === 'PARTIAL' ? 6 : 4;

      return {
        score,
        correctness: tier === 'STRONG' ? 'correct' : tier === 'PARTIAL' ? 'mostly_correct' : 'partially_correct',
        technicalDepth: tier === 'STRONG' ? 'deep' : tier === 'PARTIAL' ? 'medium' : 'surface',
        communication: len > 50 ? 'clear' : 'concise',
        missingConcepts: tier === 'STRONG' ? [] : ['Detailed architectural trade-offs'],
        misconceptions: [],
        strengths: ['Addressed the main question concept'],
        weaknesses: tier === 'STRONG' ? [] : ['Provide more technical specificity'],
        shouldFollowUp: true,
        followUpType: tier === 'STRONG' ? 'deep_dive' : tier === 'PARTIAL' ? 'clarification' : 'diagnostic',
        tier,
      };
    }
  }
}

export const evaluatorService = new EvaluatorService();
