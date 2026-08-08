import { CandidateProfileAnalysis, SessionState, EvaluationResult } from '../types/index.js';

export interface NextStepResult {
  nextPhase: string;
  nextDay: number;
  nextTopic: string;
  nextDifficulty: string;
  isFollowUp: boolean;
  isFinished: boolean;
}

export class PlannerService {
  determineInitialState(
    sessionId: string,
    candidateId: string,
    profile: CandidateProfileAnalysis
  ): SessionState {
    const initialDay = profile.completedDays.length > 0 ? profile.completedDays[0] : 7;
    const initialTopic = profile.recommendedTopics.length > 0 ? profile.recommendedTopics[0].title : 'Embeddings Explained';

    return {
      sessionId,
      candidateId,
      phase: 'INTRO',
      questionNumber: 0,
      topicsCovered: [],
      currentDay: initialDay,
      currentTopic: initialTopic,
      difficulty: profile.initialDifficulty,
      previousQuestions: [],
      previousAnswers: [],
      evaluations: [],
      followUpCount: 0,
      isComplete: false,
    };
  }

  getNextStep(
    state: SessionState,
    profile: CandidateProfileAnalysis,
    lastEvaluation?: EvaluationResult
  ): NextStepResult {
    const qCount = state.questionNumber;
    const uniqueDays = new Set(state.topicsCovered.map(t => t.day)).size;

    // Completion criteria: >= 8 questions AND >= 4 unique curriculum days
    if (qCount >= 8 && uniqueDays >= 4) {
      if (qCount >= 10 || state.phase === 'FINAL CHALLENGE' || (qCount >= 8 && lastEvaluation && lastEvaluation.tier === 'STRONG')) {
        return {
          nextPhase: 'FEEDBACK',
          nextDay: state.currentDay,
          nextTopic: state.currentTopic,
          nextDifficulty: state.difficulty,
          isFollowUp: false,
          isFinished: true,
        };
      }
    }

    let isFollowUp = false;
    let nextPhase = state.phase;
    let nextDifficulty = state.difficulty;

    if (lastEvaluation) {
      if (lastEvaluation.tier === 'STRONG') {
        if (nextDifficulty === 'Beginner') nextDifficulty = 'Intermediate';
        else if (nextDifficulty === 'Intermediate') nextDifficulty = 'Advanced';
        else if (nextDifficulty === 'Advanced') nextDifficulty = 'Expert';

        if (state.followUpCount < 1) {
          isFollowUp = true;
          nextPhase = 'ADAPTIVE FOLLOW-UP';
        }
      } else if (lastEvaluation.tier === 'WEAK') {
        if (nextDifficulty === 'Expert') nextDifficulty = 'Advanced';
        else if (nextDifficulty === 'Advanced') nextDifficulty = 'Intermediate';
        else if (nextDifficulty === 'Intermediate') nextDifficulty = 'Beginner';

        if (state.followUpCount < 1) {
          isFollowUp = true;
          nextPhase = 'ADAPTIVE FOLLOW-UP';
        }
      } else if (lastEvaluation.tier === 'PARTIAL') {
        if (state.followUpCount < 1) {
          isFollowUp = true;
          nextPhase = 'ADAPTIVE FOLLOW-UP';
        }
      }
    }

    let nextDay = state.currentDay;
    let nextTopic = state.currentTopic;

    if (!isFollowUp) {
      if (qCount < 2) {
        nextPhase = 'FUNDAMENTALS';
      } else if (qCount < 5) {
        nextPhase = 'APPLIED';
      } else if (qCount < 7) {
        nextPhase = 'SYSTEM DESIGN';
      } else {
        nextPhase = 'FINAL CHALLENGE';
      }

      const testedDays = state.topicsCovered.map(t => t.day);
      const remainingRecs = profile.recommendedTopics.filter(r => !testedDays.includes(r.day));

      if (remainingRecs.length > 0) {
        nextDay = remainingRecs[0].day;
        nextTopic = remainingRecs[0].title;
      } else {
        const candidateDays = [...profile.completedDays, ...profile.failedDays];
        const nextUntested = candidateDays.find(d => !testedDays.includes(d));
        if (nextUntested) {
          nextDay = nextUntested;
          nextTopic = `Day ${nextUntested} Mastery`;
        } else {
          const coreDays = [7, 8, 10, 11, 16, 22, 23, 28, 31];
          const cycleDay = coreDays.find(d => !testedDays.includes(d)) || coreDays[qCount % coreDays.length];
          nextDay = cycleDay;
          nextTopic = `Day ${cycleDay} Architecture`;
        }
      }
    }

    return {
      nextPhase,
      nextDay,
      nextTopic,
      nextDifficulty,
      isFollowUp,
      isFinished: false,
    };
  }
}

export const plannerService = new PlannerService();
