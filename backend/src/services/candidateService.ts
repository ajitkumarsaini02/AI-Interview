import { CandidateInput, CandidateProfileAnalysis, RecommendedTopic } from '../types/index.js';

export class CandidateService {
  analyzeProfile(candidate: CandidateInput): CandidateProfileAnalysis {
    const member = candidate.member;
    const missions = candidate.missions || [];
    const signals = candidate.signals;

    const completedDays: number[] = [];
    const failedDays: number[] = [];
    const skippedDays: number[] = [];
    const highAttemptTopics: Array<{ day: number; title: string; attempts: number }> = [];

    for (const m of missions) {
      if (m.passed) {
        completedDays.push(m.day);
      } else if (m.skipped) {
        skippedDays.push(m.day);
      } else {
        failedDays.push(m.day);
      }

      if (m.attempts && m.attempts > 2) {
        highAttemptTopics.push({ day: m.day, title: m.title, attempts: m.attempts });
      }
    }

    const strongSignals: string[] = [];
    const weakSignals: string[] = [];

    if (member.yearsExperience >= 7) {
      strongSignals.push(`Senior experience level (${member.yearsExperience} yrs)`);
    } else if (member.yearsExperience < 3) {
      weakSignals.push(`Junior experience level (${member.yearsExperience} yrs)`);
    }

    const firstTryRate = signals.missionsFirstTry / Math.max(1, signals.missionsCompleted);
    if (firstTryRate > 0.7) {
      strongSignals.push(`High first-try mastery rate (${signals.missionsFirstTry}/${signals.missionsCompleted})`);
    }

    if (highAttemptTopics.length > 0) {
      const daysStr = highAttemptTopics.map(h => `Day ${h.day}`).join(', ');
      weakSignals.push(`Multiple attempt struggles on ${daysStr}`);
    }

    if (skippedDays.length > 0) {
      const daysStr = skippedDays.join(', ');
      weakSignals.push(`Skipped missions on Days: ${daysStr}`);
    }

    const recommendedTopics: RecommendedTopic[] = [];

    // Priority 1: Passed missions
    const passedMissions = missions.filter(m => m.passed);
    for (const m of passedMissions.slice(0, 8)) {
      recommendedTopics.push({
        day: m.day,
        title: m.title,
        reason: `Passed mission with ${m.attempts || 1} attempt(s)`,
      });
    }

    // Priority 2: Failed missions
    const failedMissions = missions.filter(m => !m.passed && !m.skipped);
    for (const m of failedMissions) {
      recommendedTopics.push({
        day: m.day,
        title: m.title,
        reason: 'Failed mission - diagnostic verification opportunity',
      });
    }

    let initialDifficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' = 'Intermediate';
    if (member.yearsExperience >= 8 && signals.missionsFirstTry >= 20) {
      initialDifficulty = 'Advanced';
    } else if (member.yearsExperience < 3) {
      initialDifficulty = 'Beginner';
    }

    return {
      role: member.jobRole,
      experience: member.yearsExperience,
      completedDays,
      failedDays,
      skippedDays,
      highAttemptTopics,
      strongSignals,
      weakSignals,
      recommendedTopics,
      initialDifficulty,
    };
  }
}

export const candidateService = new CandidateService();
