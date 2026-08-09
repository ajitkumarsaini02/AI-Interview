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
    apiKey?: string;
    provider?: string;
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

    const llm = getLLMProvider(params.apiKey, params.provider);

    try {
      return (await llm.generateStructured(prompt, SYSTEM_PROMPT, EvaluationResultSchema)) as EvaluationResult;
    } catch (err) {
      console.warn('EvaluatorService fallback due to LLM error:', err);
      const cleanAnswer = params.answer.toLowerCase().trim();
      const length = cleanAnswer.length;

      const evasivePhrases = ['idk', "don't know", 'dont know', 'no idea', 'pass', 'skip', 'kuch bhi', 'galat', 'dunno', 'nothing', 'na', 'nhi', 'nahi'];
      const isEvasive = evasivePhrases.some(p => cleanAnswer === p || cleanAnswer.startsWith(p + ' ') || cleanAnswer.endsWith(' ' + p));
      const isKeyboardMashing = /^[a-z]{6,}$/.test(cleanAnswer) && !['vector', 'embedding', 'fastapi', 'postgres', 'python'].includes(cleanAnswer);
      const isTooShort = length < 8;

      if (isEvasive || isKeyboardMashing || isTooShort) {
        return {
          score: 1,
          correctness: 'incorrect',
          technicalDepth: 'none',
          communication: 'evasive',
          missingConcepts: ['Core technical concept', 'Direct answer to question'],
          misconceptions: ['Answer was evasive, gibberish, or insufficient to evaluate'],
          strengths: [],
          weaknesses: ['Failed to provide a relevant technical answer'],
          shouldFollowUp: true,
          followUpType: 'diagnostic',
          tier: 'WEAK',
        };
      }

      const domainKeywords = ['vector', 'embedding', 'rag', 'agent', 'mcp', 'latency', 'hnsw', 'index', 'retrieval', 'hybrid', 'sql', 'context', 'chunk', 'python', 'fastapi', 'express', 'react'];
      const hitCount = domainKeywords.filter(k => cleanAnswer.includes(k)).length;

      const tier: 'STRONG' | 'PARTIAL' | 'WEAK' = (length > 90 && hitCount >= 2) ? 'STRONG' : (length > 35 && hitCount >= 1) ? 'PARTIAL' : 'WEAK';
      const score = tier === 'STRONG' ? 8 : tier === 'PARTIAL' ? 6 : (hitCount > 0 ? 4 : 2);

      return {
        score,
        correctness: tier === 'STRONG' ? 'correct' : tier === 'PARTIAL' ? 'mostly_correct' : 'incorrect',
        technicalDepth: tier === 'STRONG' ? 'deep' : tier === 'PARTIAL' ? 'medium' : 'surface',
        communication: length > 50 ? 'clear' : 'concise',
        missingConcepts: tier === 'STRONG' ? [] : ['Detailed architectural trade-offs'],
        misconceptions: tier === 'WEAK' ? ['Answer lacked specific technical domain terminology'] : [],
        strengths: tier === 'WEAK' ? ['Attempted written answer'] : ['Addressed the main question concept'],
        weaknesses: tier === 'STRONG' ? [] : ['Provide more technical specificity'],
        shouldFollowUp: true,
        followUpType: tier === 'STRONG' ? 'deep_dive' : tier === 'PARTIAL' ? 'clarification' : 'diagnostic',
        tier,
      };
    }
  }
}

export const evaluatorService = new EvaluatorService();
