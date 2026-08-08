import { CurriculumDay, CurriculumData } from '../types/curriculum';
import { Candidate } from '../types/candidate';
import { DifficultyLevel, QuestionType, AskedQuestion, AnswerEvaluation } from '../types/interview';
import { getCurriculum } from './data-loader';
import { analyzeCandidate } from './candidate-analyzer';

export interface NextQuestionPlan {
  targetDay: CurriculumDay;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  isFollowUp: boolean;
  isWeaknessProbing?: boolean;
  followUpContext?: {
    previousQuestion: string;
    previousAnswer: string;
    classification: string;
    gaps: string[];
    strengths: string[];
  };
}

export function determineNextQuestionPlan(
  candidate: Candidate,
  askedQuestions: AskedQuestion[],
  coveredDays: number[],
  lastEvaluation?: AnswerEvaluation,
  currentDifficulty: DifficultyLevel = 'intermediate'
): NextQuestionPlan {
  const curriculum: CurriculumData = getCurriculum();
  const analysis = analyzeCandidate(candidate);

  const questionCount = askedQuestions.length;
  const uniqueDaysCount = new Set(coveredDays).size;
  const remainingQuestions = 8 - questionCount;
  const neededUniqueDays = 4 - uniqueDaysCount;

  // Rule: Force new unique day if remaining questions equals or is less than needed unique days
  const mustPickNewDay = remainingQuestions <= neededUniqueDays;

  // Scenario D: Mastery check - if last answer was STRONG and we already answered 2 questions on this day, force move to harder topic
  const lastDayQuestionsCount = lastEvaluation
    ? askedQuestions.filter((q) => q.day === lastEvaluation.day).length
    : 0;

  const demonstratedMastery = lastEvaluation?.classification === 'strong' && lastDayQuestionsCount >= 2;

  // Decide if we should do a follow-up on the same day/topic
  let isFollowUp = false;
  if (!mustPickNewDay && !demonstratedMastery && lastEvaluation && questionCount < 8) {
    if (lastDayQuestionsCount < 2) {
      isFollowUp = true;
    }
  }

  let targetDayNumber: number;
  let isWeaknessProbing = false;

  if (isFollowUp && lastEvaluation) {
    targetDayNumber = lastEvaluation.day;
  } else {
    // Pick a new day that hasn't been covered yet (or least covered)
    const usedDaysSet = new Set(coveredDays);

    // Scenario E: Target learning signal weakness (high attempts >= 3)
    const candidateHighAttemptUnused = analysis.highAttemptDays.find((h) => !usedDaysSet.has(h.day));

    // Candidate skipped days second
    const candidateSkippedUnused = analysis.skippedDays.find((d) => !usedDaysSet.has(d));

    // Candidate completed days third
    const candidateCompletedUnused = analysis.completedDays.find((d) => !usedDaysSet.has(d));

    // Any curriculum day fourth
    const anyCurriculumUnused = curriculum.days.find((cd) => !usedDaysSet.has(cd.day))?.day;

    if (candidateHighAttemptUnused) {
      targetDayNumber = candidateHighAttemptUnused.day;
      isWeaknessProbing = true;
    } else if (candidateSkippedUnused) {
      targetDayNumber = candidateSkippedUnused;
      isWeaknessProbing = true;
    } else if (candidateCompletedUnused) {
      targetDayNumber = candidateCompletedUnused;
    } else if (anyCurriculumUnused !== undefined) {
      targetDayNumber = anyCurriculumUnused;
    } else {
      // Fallback: pick any day from curriculum
      targetDayNumber = curriculum.days[questionCount % curriculum.days.length].day;
    }
  }

  const targetDay = curriculum.days.find((d) => d.day === targetDayNumber) || curriculum.days[0];

  // Adjust difficulty based on last answer classification & mastery
  let difficulty = currentDifficulty;
  if (lastEvaluation) {
    if (lastEvaluation.classification === 'strong') {
      difficulty = currentDifficulty === 'entry' ? 'intermediate' : 'advanced';
    } else if (lastEvaluation.classification === 'incorrect') {
      difficulty = currentDifficulty === 'advanced' ? 'intermediate' : 'entry';
    } else if (lastEvaluation.classification === 'weak') {
      difficulty = currentDifficulty === 'advanced' ? 'intermediate' : currentDifficulty;
    }
  }

  // Determine question type based on answer classification, difficulty, and scenarios
  let questionType: QuestionType = 'conceptual';

  if (isFollowUp && lastEvaluation) {
    switch (lastEvaluation.classification) {
      case 'strong':
        // Scenario A: Deeper trade-off / architecture question
        questionType = difficulty === 'advanced' ? 'trade-off' : 'architecture';
        break;
      case 'acceptable':
        questionType = 'implementation';
        break;
      case 'weak':
        // Scenario C/B: Diagnostic / debugging question
        questionType = 'debugging';
        break;
      case 'incorrect':
        // Scenario C: Test the misconception in a scenario
        questionType = 'scenario';
        break;
      case 'incomplete':
        // Scenario B: Targeted clarification on missing info
        questionType = 'implementation';
        break;
    }
  } else {
    // Rotation of types for new questions
    const typesByDifficulty: Record<DifficultyLevel, QuestionType[]> = {
      entry: ['conceptual', 'implementation', 'scenario'],
      intermediate: ['implementation', 'debugging', 'trade-off', 'scenario'],
      advanced: ['trade-off', 'architecture', 'system design', 'debugging'],
    };
    const available = typesByDifficulty[difficulty];
    questionType = available[questionCount % available.length];
  }

  let followUpContext;
  if (isFollowUp && lastEvaluation) {
    followUpContext = {
      previousQuestion: lastEvaluation.questionText,
      previousAnswer: lastEvaluation.candidateAnswer,
      classification: lastEvaluation.classification,
      gaps: lastEvaluation.identifiedGaps,
      strengths: lastEvaluation.identifiedStrengths,
    };
  }

  return {
    targetDay,
    questionType,
    difficulty,
    isFollowUp,
    isWeaknessProbing,
    followUpContext,
  };
}

export function isInterviewComplete(questionCount: number, coveredDays: number[]): boolean {
  const uniqueDays = new Set(coveredDays).size;
  return questionCount >= 8 && uniqueDays >= 4;
}
