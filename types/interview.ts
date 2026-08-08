import { z } from 'zod';
import { Candidate } from './candidate';

export type QuestionType =
  | 'conceptual'
  | 'implementation'
  | 'debugging'
  | 'scenario'
  | 'trade-off'
  | 'architecture'
  | 'system design';

export type DifficultyLevel = 'entry' | 'intermediate' | 'advanced';

export type AnswerClassification =
  | 'strong'
  | 'acceptable'
  | 'weak'
  | 'incorrect'
  | 'incomplete';

export interface AskedQuestion {
  id: string;
  day: number;
  topic: string;
  questionText: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
}

export interface AnswerEvaluation {
  questionIndex: number;
  day: number;
  topic: string;
  questionText: string;
  candidateAnswer: string;
  classification: AnswerClassification;
  reasoning: string;
  identifiedStrengths: string[];
  identifiedGaps: string[];
}

export interface InterviewSession {
  sessionId: string;
  candidateId: string;
  candidateName: string;
  candidate: Candidate;
  questionCount: number;
  askedQuestions: AskedQuestion[];
  coveredDays: number[];
  coveredTopics: string[];
  conversationHistory: { role: 'interviewer' | 'candidate'; content: string; timestamp: number }[];
  answerEvaluations: AnswerEvaluation[];
  strengths: string[];
  gaps: string[];
  difficulty: DifficultyLevel;
  completed: boolean;
  finalFeedback?: FinalFeedback;
  currentTurnPendingQuestion?: AskedQuestion;
  createdTime: number;
  lastUpdatedTime: number;
}

export interface FinalFeedback {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

// API Request/Response Types according to technical-spec.md
export interface InterviewStartRequest {
  sessionId: string;
  candidate: Candidate;
}

export interface InterviewTurnRequest {
  sessionId: string;
  message: string;
}

export interface InterviewInProgressResponse {
  reply: string;
  done: false;
}

export interface InterviewCompletedResponse {
  reply: string;
  done: true;
  feedback: FinalFeedback;
}

export type InterviewResponse = InterviewInProgressResponse | InterviewCompletedResponse;

// Zod Schemas for Validation
export const CandidateMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  jobRole: z.string(),
  yearsExperience: z.number(),
  education: z.string(),
  status: z.string().optional(),
});

export const CandidateMissionSchema = z.object({
  day: z.number(),
  title: z.string(),
  passed: z.boolean().optional(),
  attempts: z.number().optional(),
  skipped: z.boolean().optional(),
});

export const CandidateSignalsSchema = z.object({
  commitDays: z.number(),
  missionsCompleted: z.number(),
  missionsFirstTry: z.number(),
});

export const CandidateSchema = z.object({
  member: CandidateMemberSchema,
  missions: z.array(CandidateMissionSchema),
  signals: CandidateSignalsSchema,
});

export const InterviewApiPayloadSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  candidate: CandidateSchema.optional(),
  message: z.string().optional(),
});

export const EvaluationOutputSchema = z.object({
  classification: z.enum(['strong', 'acceptable', 'weak', 'incorrect', 'incomplete']),
  reasoning: z.string(),
  identifiedStrengths: z.array(z.string()),
  identifiedGaps: z.array(z.string()),
});

export const FinalFeedbackOutputSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  next: z.array(z.string()),
});
