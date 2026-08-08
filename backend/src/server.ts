import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { CandidateInput, SessionState, EvaluationResult, InterviewResponse } from './types/index.js';
import { candidateService } from './services/candidateService.js';
import { plannerService } from './services/plannerService.js';
import { questionService } from './services/questionService.js';
import { evaluatorService } from './services/evaluatorService.js';
import { feedbackService } from './services/feedbackService.js';

// Load .env
const rootEnv = path.resolve(process.cwd(), '..', '.env');
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory active session cache
const activeSessions: Map<string, {
  state: SessionState;
  candidate: CandidateInput;
  messages: Array<{ role: string; content: string; questionNumber: number; curriculumDay?: number }>;
  evaluations: EvaluationResult[];
  lastQuestion: string;
  feedback?: any;
}> = new Map();

// Main Interview Endpoint
app.post('/api/interview', async (req: Request, res: Response): Promise<any> => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Payload must be a JSON object' });
  }

  // 1. Start Session Request
  if (body.candidate) {
    const { sessionId, candidate } = body;
    if (!sessionId || !candidate || !candidate.member) {
      return res.status(400).json({ error: 'Invalid start payload' });
    }

    const profile = candidateService.analyzeProfile(candidate);
    const initialState = plannerService.determineInitialState(sessionId, candidate.member.id, profile);

    const firstQ = await questionService.generateNextQuestion({
      candidateName: candidate.member.name,
      jobRole: candidate.member.jobRole,
      yearsExperience: candidate.member.yearsExperience,
      currentDay: initialState.currentDay,
      currentTopic: initialState.currentTopic,
      difficulty: initialState.difficulty,
      phase: 'FUNDAMENTALS',
      questionNumber: 1,
      previousQuestions: [],
    });

    initialState.questionNumber = 1;
    initialState.phase = 'FUNDAMENTALS';
    initialState.previousQuestions.push(firstQ.reply);
    initialState.topicsCovered.push({ day: firstQ.day, topic: firstQ.topic });

    const welcomeReply = `Welcome ${candidate.member.name}. Let's begin your technical interview.\n\n${firstQ.reply}`;

    activeSessions.set(sessionId, {
      state: initialState,
      candidate,
      messages: [{ role: 'interviewer', content: welcomeReply, questionNumber: 1, curriculumDay: firstQ.day }],
      evaluations: [],
      lastQuestion: firstQ.reply,
    });

    return res.json({ reply: welcomeReply, done: false });
  }

  // 2. Turn Request
  if (body.message && body.sessionId) {
    const { sessionId, message } = body;
    const sessionData = activeSessions.get(sessionId);

    if (!sessionData) {
      return res.status(404).json({ error: `Session not found for sessionId: ${sessionId}` });
    }

    const { state, candidate, evaluations, lastQuestion } = sessionData;

    if (state.isComplete && sessionData.feedback) {
      return res.json({
        reply: 'Interview completed.',
        done: true,
        feedback: sessionData.feedback,
      });
    }

    // 1. Record candidate message
    sessionData.messages.push({
      role: 'candidate',
      content: message,
      questionNumber: state.questionNumber,
      curriculumDay: state.currentDay,
    });
    state.previousAnswers.push(message);

    // 2. Evaluate answer
    const evaluation = await evaluatorService.evaluateAnswer({
      question: lastQuestion,
      answer: message,
      day: state.currentDay,
      topic: state.currentTopic,
    });
    evaluations.push(evaluation);
    state.evaluations.push(evaluation);

    // 3. State machine update
    const profile = candidateService.analyzeProfile(candidate);
    const nextStep = plannerService.getNextStep(state, profile, evaluation);

    // 4. Completion check
    if (nextStep.isFinished) {
      state.isComplete = true;
      const feedback = await feedbackService.generateFeedback({
        candidateName: candidate.member.name,
        jobRole: candidate.member.jobRole,
        evaluations: state.evaluations,
        topicsCovered: state.topicsCovered,
      });
      sessionData.feedback = feedback;

      return res.json({
        reply: 'Interview completed.',
        done: true,
        feedback,
      });
    }

    // 5. Generate Next Question or Followup
    const nextQNum = state.questionNumber + 1;
    state.questionNumber = nextQNum;
    state.phase = nextStep.nextPhase;
    state.currentDay = nextStep.nextDay;
    state.currentTopic = nextStep.nextTopic;
    state.difficulty = nextStep.nextDifficulty;

    if (nextStep.isFollowUp) {
      state.followUpCount += 1;
    } else {
      state.followUpCount = 0;
    }

    const nextQResult = await questionService.generateNextQuestion({
      candidateName: candidate.member.name,
      jobRole: candidate.member.jobRole,
      yearsExperience: candidate.member.yearsExperience,
      currentDay: nextStep.nextDay,
      currentTopic: nextStep.nextTopic,
      difficulty: nextStep.nextDifficulty,
      phase: nextStep.nextPhase,
      questionNumber: nextQNum,
      previousQuestions: state.previousQuestions,
      isFollowUp: nextStep.isFollowUp,
      previousQuestion: lastQuestion,
      candidateAnswer: message,
      lastEvaluation: evaluation,
    });

    state.previousQuestions.push(nextQResult.reply);
    if (!state.topicsCovered.some(t => t.day === nextQResult.day)) {
      state.topicsCovered.push({ day: nextQResult.day, topic: nextQResult.topic });
    }

    sessionData.lastQuestion = nextQResult.reply;
    sessionData.messages.push({
      role: 'interviewer',
      content: nextQResult.reply,
      questionNumber: nextQNum,
      curriculumDay: nextQResult.day,
    });

    return res.json({ reply: nextQResult.reply, done: false });
  }

  return res.status(400).json({ error: 'Invalid request payload. Must provide candidate for start or message for turn.' });
});

// GET Session State
app.get('/api/interview/:session_id', (req: Request, res: Response): any => {
  const sessionData = activeSessions.get(req.params.session_id);
  if (!sessionData) {
    return res.status(404).json({ error: 'Session not found' });
  }

  return res.json({
    sessionId: req.params.session_id,
    candidate: sessionData.candidate,
    questionCount: sessionData.state.questionNumber,
    currentDay: sessionData.state.currentDay,
    currentTopic: sessionData.state.currentTopic,
    difficulty: sessionData.state.difficulty,
    phase: sessionData.state.phase,
    topicsCovered: sessionData.state.topicsCovered,
    messages: sessionData.messages,
    isComplete: sessionData.state.isComplete,
    feedback: sessionData.feedback,
    evaluations: sessionData.evaluations.map((e, idx) => ({
      questionNumber: idx + 1,
      score: e.score,
      tier: e.tier,
      technicalDepth: e.technicalDepth,
    })),
  });
});

// GET Candidates
app.get('/api/candidates', (req: Request, res: Response): any => {
  const possiblePaths = [
    path.resolve(process.cwd(), '..', 'data', 'candidates.json'),
    path.resolve(process.cwd(), 'data', 'candidates.json'),
    path.resolve(__dirname, '..', '..', '..', 'data', 'candidates.json'),
    path.resolve(__dirname, '..', '..', 'candidates.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return res.json(data);
    }
  }
  return res.status(404).json({ error: 'candidates.json file not found' });
});

// GET Curriculum
app.get('/api/curriculum', (req: Request, res: Response): any => {
  const possiblePaths = [
    path.resolve(process.cwd(), '..', 'data', 'curriculum.json'),
    path.resolve(process.cwd(), 'data', 'curriculum.json'),
    path.resolve(__dirname, '..', '..', '..', 'data', 'curriculum.json'),
    path.resolve(__dirname, '..', '..', 'curriculum.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return res.json(data);
    }
  }
  return res.status(404).json({ error: 'curriculum.json file not found' });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    backend: 'TypeScript Express',
  });
});

const PORT = parseInt(process.env.PORT || '4000', 10);

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Starting TypeScript Express backend on http://localhost:${PORT}`);
  });
}

export default app;
