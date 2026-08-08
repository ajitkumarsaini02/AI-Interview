import { Candidate } from '../types/candidate';
import { DifficultyLevel } from '../types/interview';

export interface CandidateAnalysis {
  completedDays: number[];
  skippedDays: number[];
  highAttemptDays: { day: number; attempts: number; title: string }[];
  firstTryRatio: number;
  startingDifficulty: DifficultyLevel;
  profileSummary: string;
}

export function analyzeCandidate(candidate: Candidate): CandidateAnalysis {
  const completedDays: number[] = [];
  const skippedDays: number[] = [];
  const highAttemptDays: { day: number; attempts: number; title: string }[] = [];

  for (const mission of candidate.missions || []) {
    if (mission.passed) {
      completedDays.push(mission.day);
    }
    if (mission.skipped) {
      skippedDays.push(mission.day);
    }
    if (mission.attempts && mission.attempts >= 3) {
      highAttemptDays.push({
        day: mission.day,
        attempts: mission.attempts,
        title: mission.title,
      });
    }
  }

  // Sort high attempt days descending by attempt count
  highAttemptDays.sort((a, b) => b.attempts - a.attempts);

  const completedCount = candidate.signals?.missionsCompleted || completedDays.length || 1;
  const firstTryCount = candidate.signals?.missionsFirstTry || 0;
  const firstTryRatio = firstTryCount / Math.max(1, completedCount);

  let startingDifficulty: DifficultyLevel = 'intermediate';
  if (candidate.member.yearsExperience >= 8 || firstTryRatio >= 0.75) {
    startingDifficulty = 'advanced';
  } else if (candidate.member.yearsExperience <= 2 && firstTryRatio < 0.5) {
    startingDifficulty = 'entry';
  }

  const profileSummary = `${candidate.member.name} (${candidate.member.jobRole}, ${candidate.member.yearsExperience} yrs exp, ${candidate.member.education}). Completed ${completedCount} missions (${firstTryCount} first-try), skipped ${skippedDays.length} missions.`;

  return {
    completedDays,
    skippedDays,
    highAttemptDays,
    firstTryRatio,
    startingDifficulty,
    profileSummary,
  };
}
