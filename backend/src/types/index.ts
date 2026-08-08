export interface CandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
}

export interface CandidateMission {
  day: number;
  title: string;
  passed?: boolean;
  skipped?: boolean;
  attempts?: number;
}

export interface CandidateSignals {
  commitDays: number;
  missionsCompleted: number;
  missionsFirstTry: number;
}

export interface CandidateInput {
  member: CandidateMember;
  missions: CandidateMission[];
  signals: CandidateSignals;
}

export interface RecommendedTopic {
  day: number;
  title: string;
  reason: string;
}

export interface CandidateProfileAnalysis {
  role: string;
  experience: number;
  completedDays: number[];
  failedDays: number[];
  skippedDays: number[];
  highAttemptTopics: Array<{ day: number; title: string; attempts: number }>;
  strongSignals: string[];
  weakSignals: string[];
  recommendedTopics: RecommendedTopic[];
  initialDifficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface EvaluationResult {
  score: number;
  correctness: string;
  technicalDepth: string;
  communication: string;
  missingConcepts: string[];
  misconceptions: string[];
  strengths: string[];
  weaknesses: string[];
  shouldFollowUp: boolean;
  followUpType: 'deep_dive' | 'clarification' | 'diagnostic';
  tier: 'STRONG' | 'PARTIAL' | 'WEAK';
}

export interface QuestionGenerationResult {
  reply: string;
  day: number;
  topic: string;
  objective: string;
  difficulty: string;
  phase: string;
}

export interface SubScores {
  technicalDepth: number;
  systemDesign: number;
  communication: number;
  adaptability: number;
}

export interface FeedbackResult {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
  subScores?: SubScores;
}

export interface TopicCovered {
  day: number;
  topic: string;
}

export interface MessageItem {
  role: string;
  content: string;
  questionNumber: number;
  curriculumDay?: number;
}

export interface SessionState {
  sessionId: string;
  candidateId: string;
  phase: string;
  questionNumber: number;
  topicsCovered: TopicCovered[];
  currentDay: number;
  currentTopic: string;
  difficulty: string;
  previousQuestions: string[];
  previousAnswers: string[];
  evaluations: EvaluationResult[];
  followUpCount: number;
  isComplete: boolean;
}

export interface InterviewResponse {
  reply: string;
  done: boolean;
  feedback?: FeedbackResult;
  error?: string;
}
