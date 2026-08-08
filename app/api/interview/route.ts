import { NextResponse } from 'next/server';
import {
  InterviewApiPayloadSchema,
  AskedQuestion,
  InterviewSession,
  AnswerEvaluation,
} from '../../../types/interview';
import { sessionStore } from '../../../lib/session-store';
import { analyzeCandidate } from '../../../lib/candidate-analyzer';
import { determineNextQuestionPlan, isInterviewComplete } from '../../../lib/interview-planner';
import { evaluateAnswer } from '../../../lib/answer-evaluator';
import { generateQuestion } from '../../../lib/question-generator';
import { generateFinalFeedback } from '../../../lib/feedback-generator';
import { getCurriculum } from '../../../lib/data-loader';

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const parseResult = InterviewApiPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { sessionId, candidate, message } = parseResult.data;

    let session = await sessionStore.get(sessionId);

    // Scenario A: Start Request (or re-init session when candidate profile is provided)
    if (candidate) {
      const analysis = analyzeCandidate(candidate);
      const plan = determineNextQuestionPlan(
        candidate,
        [],
        [],
        undefined,
        analysis.startingDifficulty
      );

      const genResult = await generateQuestion(candidate, plan, [], true);

      const firstQuestion: AskedQuestion = {
        id: `q-1-${Date.now()}`,
        day: plan.targetDay.day,
        topic: plan.targetDay.title,
        questionText: genResult.questionText,
        type: plan.questionType,
        difficulty: plan.difficulty,
      };

      const newSession: InterviewSession = {
        sessionId,
        candidateId: candidate.member.id,
        candidateName: candidate.member.name,
        candidate,
        questionCount: 1,
        askedQuestions: [firstQuestion],
        coveredDays: [plan.targetDay.day],
        coveredTopics: [plan.targetDay.title],
        conversationHistory: [
          { role: 'interviewer', content: genResult.reply, timestamp: Date.now() },
        ],
        answerEvaluations: [],
        strengths: [],
        gaps: [],
        difficulty: plan.difficulty,
        completed: false,
        currentTurnPendingQuestion: firstQuestion,
        createdTime: Date.now(),
        lastUpdatedTime: Date.now(),
      };

      await sessionStore.set(sessionId, newSession);

      return NextResponse.json({
        reply: genResult.reply,
        done: false,
      });
    }

    // Scenario B: Interactive Turn Request (message provided)
    if (!session) {
      return NextResponse.json(
        {
          error: `Session not found for sessionId: '${sessionId}'. Initial request must include 'candidate' object.`,
        },
        { status: 404 }
      );
    }

    if (session.completed) {
      const feedback = await generateFinalFeedback(session);
      return NextResponse.json({
        reply: 'Interview completed.',
        done: true,
        feedback,
      });
    }

    const candidateAnswer = message !== undefined ? message : '';
    const pendingQuestion =
      session.currentTurnPendingQuestion ||
      session.askedQuestions[session.askedQuestions.length - 1];
    const curriculum = getCurriculum();
    const currentCurriculumDay =
      curriculum.days.find((d) => d.day === pendingQuestion.day) || curriculum.days[0];

    // 1. Record candidate answer in history
    session.conversationHistory.push({
      role: 'candidate',
      content: candidateAnswer,
      timestamp: Date.now(),
    });

    // 2. Evaluate answer
    const evalResult = await evaluateAnswer(
      session.candidate,
      pendingQuestion,
      currentCurriculumDay,
      candidateAnswer
    );

    const evaluation: AnswerEvaluation = {
      questionIndex: session.questionCount,
      day: pendingQuestion.day,
      topic: pendingQuestion.topic,
      questionText: pendingQuestion.questionText,
      candidateAnswer,
      classification: evalResult.classification,
      reasoning: evalResult.reasoning,
      identifiedStrengths: evalResult.identifiedStrengths,
      identifiedGaps: evalResult.identifiedGaps,
    };

    session.answerEvaluations.push(evaluation);
    session.strengths.push(...evalResult.identifiedStrengths);
    session.gaps.push(...evalResult.identifiedGaps);

    // 3. Check Interview Completion (questionCount >= 8 && unique coveredDays >= 4)
    const isDone = isInterviewComplete(session.questionCount, session.coveredDays);

    if (isDone) {
      session.completed = true;
      const feedback = await generateFinalFeedback(session);
      await sessionStore.set(sessionId, session);

      return NextResponse.json({
        reply: 'Interview completed.',
        done: true,
        feedback,
      });
    }

    // 4. Determine Next Question Plan & Adapt Difficulty
    const plan = determineNextQuestionPlan(
      session.candidate,
      session.askedQuestions,
      session.coveredDays,
      evaluation,
      session.difficulty
    );

    session.difficulty = plan.difficulty;

    // 5. Generate Next Question
    const genResult = await generateQuestion(
      session.candidate,
      plan,
      session.askedQuestions,
      false
    );

    const nextQuestion: AskedQuestion = {
      id: `q-${session.questionCount + 1}-${Date.now()}`,
      day: plan.targetDay.day,
      topic: plan.targetDay.title,
      questionText: genResult.questionText,
      type: plan.questionType,
      difficulty: plan.difficulty,
    };

    // 6. Update Session State
    session.questionCount += 1;
    if (!session.coveredDays.includes(plan.targetDay.day)) {
      session.coveredDays.push(plan.targetDay.day);
    }
    if (!session.coveredTopics.includes(plan.targetDay.title)) {
      session.coveredTopics.push(plan.targetDay.title);
    }
    session.askedQuestions.push(nextQuestion);
    session.currentTurnPendingQuestion = nextQuestion;
    session.conversationHistory.push({
      role: 'interviewer',
      content: genResult.reply,
      timestamp: Date.now(),
    });

    await sessionStore.set(sessionId, session);

    return NextResponse.json({
      reply: genResult.reply,
      done: false,
    });
  } catch (error: any) {
    console.error('API /api/interview Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error processing interview step',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
