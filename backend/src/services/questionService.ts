import { QuestionGenerationResult, EvaluationResult } from '../types/index.js';
import { SYSTEM_PROMPT, buildQuestionPrompt, buildFollowupPrompt } from '../prompts/prompts.js';
import { getLLMProvider } from './llm/factory.js';
import { retrievalService } from './retrievalService.js';
import { z } from 'zod';

const QuestionResultSchema = z.object({
  reply: z.string(),
  day: z.number(),
  topic: z.string(),
  objective: z.string(),
  difficulty: z.string(),
  phase: z.string(),
});

export class QuestionService {
  async generateNextQuestion(params: {
    candidateName: string;
    jobRole: string;
    yearsExperience: number;
    currentDay: number;
    currentTopic: string;
    difficulty: string;
    phase: string;
    questionNumber: number;
    previousQuestions: string[];
    isFollowUp?: boolean;
    previousQuestion?: string;
    candidateAnswer?: string;
    lastEvaluation?: EvaluationResult;
  }): Promise<QuestionGenerationResult> {
    const llm = getLLMProvider();
    const dayInfo = retrievalService.getDayInfo(params.currentDay);
    const objectives = dayInfo?.objectives || [`Mastery of ${params.currentTopic}`];

    if (params.isFollowUp && params.previousQuestion && params.candidateAnswer && params.lastEvaluation) {
      const prompt = buildFollowupPrompt({
        candidateName: params.candidateName,
        previousQuestion: params.previousQuestion,
        candidateAnswer: params.candidateAnswer,
        tier: params.lastEvaluation.tier,
        missingConcepts: params.lastEvaluation.missingConcepts,
        currentDay: params.currentDay,
        currentTopic: params.currentTopic,
        difficulty: params.difficulty,
        phase: params.phase,
        previousQuestions: params.previousQuestions,
      });

      try {
        return await llm.generateStructured(prompt, SYSTEM_PROMPT, QuestionResultSchema);
      } catch (err) {
        console.warn('QuestionService followup LLM error, falling back:', err);
      }
    }

    const prompt = buildQuestionPrompt({
      candidateName: params.candidateName,
      jobRole: params.jobRole,
      yearsExperience: params.yearsExperience,
      currentDay: params.currentDay,
      currentTopic: params.currentTopic,
      objectives,
      difficulty: params.difficulty,
      phase: params.phase,
      questionNumber: params.questionNumber,
      previousQuestions: params.previousQuestions,
    });

    try {
      return await llm.generateStructured(prompt, SYSTEM_PROMPT, QuestionResultSchema);
    } catch (err) {
      console.warn('QuestionService question LLM error, falling back:', err);
      return {
        reply: `Regarding ${params.currentTopic}: how would you structure the architecture and handle key trade-offs in a production environment?`,
        day: params.currentDay,
        topic: params.currentTopic,
        objective: objectives[0] || `Mastery of Day ${params.currentDay}`,
        difficulty: params.difficulty,
        phase: params.phase,
      };
    }
  }
}

export const questionService = new QuestionService();
