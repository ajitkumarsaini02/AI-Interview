import { InterviewSession } from '../types/interview';
import { dbGetSession, dbCreateSession, dbUpdateSession, dbRecordTurn } from './db';

export interface SessionStore {
  get(sessionId: string): Promise<InterviewSession | null>;
  set(sessionId: string, session: InterviewSession): Promise<void>;
  delete(sessionId: string): Promise<void>;
  clear(): Promise<void>;
}

class HybridSessionStore implements SessionStore {
  private memoryFallback: Map<string, InterviewSession> = new Map();

  async get(sessionId: string): Promise<InterviewSession | null> {
    const mem = this.memoryFallback.get(sessionId);

    // 1. Try SQLite
    try {
      const dbSess = dbGetSession(sessionId);
      if (dbSess) {
        const fullSession: InterviewSession = {
          sessionId: dbSess.sessionId,
          candidateId: dbSess.candidateId,
          candidateName: dbSess.candidateName,
          candidate: mem?.candidate || {
            member: {
              id: dbSess.candidateId,
              name: dbSess.candidateName,
              jobRole: 'AI Engineer',
              yearsExperience: 4,
              education: 'Degree',
            },
            missions: [],
            signals: { commitDays: 10, missionsCompleted: 5, missionsFirstTry: 4 },
          },
          createdTime: mem?.createdTime || Date.now(),
          startTime: mem?.createdTime || Date.now(),
          lastUpdatedTime: Date.now(),
          questionCount: dbSess.questionCount,
          coveredDays: dbSess.coveredDays || mem?.coveredDays || [],
          coveredTopics: mem?.coveredTopics || [],
          difficulty: dbSess.currentDifficulty || mem?.difficulty || 'intermediate',
          askedQuestions: mem?.askedQuestions || dbSess.askedQuestions || [],
          answerEvaluations: mem?.answerEvaluations || dbSess.evaluations || [],
          strengths: mem?.strengths || [],
          gaps: mem?.gaps || [],
          conversationHistory: mem?.conversationHistory || [],
          currentTurnPendingQuestion: mem?.currentTurnPendingQuestion,
          completed: dbSess.isCompleted || mem?.completed || false,
          finalFeedback: dbSess.finalFeedback || mem?.finalFeedback,
        } as InterviewSession;

        return fullSession;
      }
    } catch (err) {
      console.warn('SQLite dbGetSession failed, fallback to memory:', err);
    }

    return mem || null;
  }

  async set(sessionId: string, session: InterviewSession): Promise<void> {
    const askedQuestions = session.askedQuestions || [];
    const evaluations = session.answerEvaluations || [];

    const safeSession: InterviewSession = {
      ...session,
      askedQuestions,
      answerEvaluations: evaluations,
      strengths: session.strengths || [],
      gaps: session.gaps || [],
      conversationHistory: session.conversationHistory || [],
      coveredTopics: session.coveredTopics || [],
      lastUpdatedTime: Date.now(),
    };

    this.memoryFallback.set(sessionId, safeSession);

    // SQLite update
    try {
      if (session.candidate) {
        const existing = dbGetSession(sessionId);
        if (!existing) {
          dbCreateSession(sessionId, session.candidate);
        }
      }

      dbUpdateSession(sessionId, {
        questionCount: safeSession.questionCount,
        coveredDays: safeSession.coveredDays,
        currentDifficulty: safeSession.difficulty,
        isCompleted: safeSession.completed,
        finalFeedback: safeSession.finalFeedback,
      });

      if (askedQuestions.length > 0) {
        const turnIdx = askedQuestions.length;
        const lastQ = askedQuestions[turnIdx - 1];
        const lastEval = evaluations.find((e) => e.questionIndex === turnIdx);

        if (lastQ) {
          dbRecordTurn(
            sessionId,
            turnIdx,
            lastQ,
            lastEval?.candidateAnswer,
            lastEval?.classification,
            lastEval?.reasoning
          );
        }
      }
    } catch (err) {}
  }

  async delete(sessionId: string): Promise<void> {
    this.memoryFallback.delete(sessionId);
  }

  async clear(): Promise<void> {
    this.memoryFallback.clear();
  }
}

const globalStoreKey = Symbol.for('__interview_hybrid_session_store__');
const globalObj = globalThis as unknown as { [globalStoreKey]?: SessionStore };

if (!globalObj[globalStoreKey]) {
  globalObj[globalStoreKey] = new HybridSessionStore();
}

export const sessionStore: SessionStore = globalObj[globalStoreKey]!;
