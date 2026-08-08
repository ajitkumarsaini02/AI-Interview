import test from 'node:test';
import assert from 'node:assert/strict';
import { getCandidates } from '../lib/data-loader';
import { analyzeCandidate } from '../lib/candidate-analyzer';
import { determineNextQuestionPlan } from '../lib/interview-planner';
import { evaluateAnswer } from '../lib/answer-evaluator';
import { generateQuestion } from '../lib/question-generator';
import { AskedQuestion, AnswerEvaluation } from '../types/interview';

test('Scenario A: Strong Answer -> Deeper Trade-Off / Architecture Follow-Up', async () => {
  const candidatesData = getCandidates();
  const sarah = candidatesData.candidates[0];

  const askedQuestions: AskedQuestion[] = [
    {
      id: 'q-1',
      day: 10,
      topic: 'The Retrieval & Matching Engine',
      questionText: 'How would you implement hybrid search?',
      type: 'implementation',
      difficulty: 'intermediate',
    },
  ];

  const evalResult = await evaluateAnswer(
    sarah,
    askedQuestions[0],
    {
      day: 10,
      title: 'The Retrieval & Matching Engine',
      type: 'SHIP_IT',
      tools: ['SQLite', 'ChromaDB', 'Python'],
      objectives: ['Build query router', 'Implement hybrid retrieval', 'Merge results with RRF'],
    },
    'I build a query router using ChromaDB vector embeddings combined with SQLite BM25 full text search using Reciprocal Rank Fusion (RRF) weighting.'
  );

  assert.equal(evalResult.classification, 'strong');

  const lastEvaluation: AnswerEvaluation = {
    questionIndex: 1,
    day: 10,
    topic: 'The Retrieval & Matching Engine',
    questionText: askedQuestions[0].questionText,
    candidateAnswer: 'I build a query router using ChromaDB vector embeddings combined with SQLite BM25 full text search using Reciprocal Rank Fusion (RRF) weighting.',
    classification: evalResult.classification,
    reasoning: evalResult.reasoning,
    identifiedStrengths: evalResult.identifiedStrengths,
    identifiedGaps: evalResult.identifiedGaps,
  };

  const plan = determineNextQuestionPlan(sarah, askedQuestions, [10], lastEvaluation, 'intermediate');

  assert.equal(plan.isFollowUp, true);
  assert.ok(plan.questionType === 'trade-off' || plan.questionType === 'architecture');
  assert.equal(plan.difficulty, 'advanced', 'Difficulty should upgrade to advanced after strong answer');

  const genResult = await generateQuestion(sarah, plan, askedQuestions, false);
  assert.ok(genResult.reply.length > 0);
  assert.ok(
    genResult.reply.toLowerCase().includes('strong') ||
    genResult.reply.toLowerCase().includes('point') ||
    genResult.reply.toLowerCase().includes('chromadb') ||
    genResult.reply.toLowerCase().includes('rrf')
  );
});

test('Scenario B: Incomplete Answer -> Targeted Clarification', async () => {
  const candidatesData = getCandidates();
  const sarah = candidatesData.candidates[0];

  const askedQuestion: AskedQuestion = {
    id: 'q-1',
    day: 7,
    topic: 'Embeddings Explained',
    questionText: 'How do vector embeddings work?',
    type: 'conceptual',
    difficulty: 'intermediate',
  };

  const lastEvaluation: AnswerEvaluation = {
    questionIndex: 1,
    day: 7,
    topic: 'Embeddings Explained',
    questionText: askedQuestion.questionText,
    candidateAnswer: 'Embeddings convert text into numerical vector arrays.',
    classification: 'incomplete',
    reasoning: 'Mentioned vector arrays but omitted vector dimension size, distance metrics, and model names.',
    identifiedStrengths: ['Understands basic concept of vectors'],
    identifiedGaps: ['Omitted vector dimension size and distance metrics (cosine similarity vs dot product)'],
  };

  const plan = determineNextQuestionPlan(sarah, [askedQuestion], [7], lastEvaluation, 'intermediate');

  assert.equal(plan.isFollowUp, true);
  assert.equal(plan.questionType, 'implementation');
  assert.ok(plan.followUpContext?.gaps.length! > 0);

  const genResult = await generateQuestion(sarah, plan, [askedQuestion], false);
  assert.ok(genResult.reply.length > 0);
  assert.ok(
    genResult.reply.toLowerCase().includes('embeddings') ||
    genResult.reply.toLowerCase().includes('convert') ||
    genResult.reply.toLowerCase().includes('gap') ||
    genResult.reply.toLowerCase().includes('clarify')
  );
});

test('Scenario C: Incorrect Answer -> Diagnostic / Corrective Follow-Up', async () => {
  const candidatesData = getCandidates();
  const sarah = candidatesData.candidates[0];

  const askedQuestion: AskedQuestion = {
    id: 'q-1',
    day: 9,
    topic: 'Building & Populating the Vector Database',
    questionText: 'How do you handle vector retrieval accuracy?',
    type: 'conceptual',
    difficulty: 'advanced',
  };

  const lastEvaluation: AnswerEvaluation = {
    questionIndex: 1,
    day: 9,
    topic: 'Building & Populating the Vector Database',
    questionText: askedQuestion.questionText,
    candidateAnswer: 'Increasing top-k to 1000 always improves RAG accuracy without any downsides.',
    classification: 'incorrect',
    reasoning: 'Incorrectly claimed top-k=1000 improves accuracy without context clutter or LLM hallucination.',
    identifiedStrengths: [],
    identifiedGaps: ['Flawed understanding of context window limits and retrieval noise'],
  };

  const plan = determineNextQuestionPlan(sarah, [askedQuestion], [9], lastEvaluation, 'advanced');

  assert.equal(plan.isFollowUp, true);
  assert.equal(plan.questionType, 'scenario');
  assert.equal(plan.difficulty, 'intermediate', 'Difficulty should step down after incorrect answer');

  const genResult = await generateQuestion(sarah, plan, [askedQuestion], false);
  assert.ok(genResult.reply.length > 0);
});

test('Scenario D: Mastery Demonstration -> Move to Harder Topic', async () => {
  const candidatesData = getCandidates();
  const sarah = candidatesData.candidates[0];

  const askedQuestions: AskedQuestion[] = [
    {
      id: 'q-1',
      day: 7,
      topic: 'Embeddings Explained',
      questionText: 'Explain embeddings.',
      type: 'conceptual',
      difficulty: 'intermediate',
    },
    {
      id: 'q-2',
      day: 7,
      topic: 'Embeddings Explained',
      questionText: 'How would you measure embedding distance?',
      type: 'implementation',
      difficulty: 'advanced',
    },
  ];

  const lastEvaluation: AnswerEvaluation = {
    questionIndex: 2,
    day: 7,
    topic: 'Embeddings Explained',
    questionText: askedQuestions[1].questionText,
    candidateAnswer: 'Sentence transformers convert text to 768-dim embeddings evaluated using cosine similarity.',
    classification: 'strong',
    reasoning: 'Complete mastery of embedding dimensions and metrics.',
    identifiedStrengths: ['Mastery of vector space'],
    identifiedGaps: [],
  };

  const plan = determineNextQuestionPlan(sarah, askedQuestions, [7], lastEvaluation, 'intermediate');

  assert.equal(plan.isFollowUp, false, 'Should move to new topic after demonstrated mastery');
  assert.notEqual(plan.targetDay.day, 7, 'Target day must change');
});

test('Scenario E: Learning Signal Weakness -> Target Probing', async () => {
  const candidatesData = getCandidates();
  const sarah = candidatesData.candidates[0];
  const analysis = analyzeCandidate(sarah);

  assert.ok(analysis.highAttemptDays.length > 0, 'Sarah has high attempt days');
  const targetWeakDay = analysis.highAttemptDays[0].day;

  const plan = determineNextQuestionPlan(sarah, [], [], undefined, 'advanced');

  assert.equal(plan.targetDay.day, targetWeakDay, 'Should target candidate high attempt day first');
  assert.equal(plan.isWeaknessProbing, true, 'Should mark as weakness probing');
});

test('Scenario F: Irrelevant or Non-Responsive Answer -> Re-frame & Change Question', async () => {
  const candidatesData = getCandidates();
  const sarah = candidatesData.candidates[0];

  const askedQuestion: AskedQuestion = {
    id: 'q-1',
    day: 10,
    topic: 'The Retrieval & Matching Engine',
    questionText: 'How do you configure hybrid search RRF weights in ChromaDB?',
    type: 'implementation',
    difficulty: 'intermediate',
  };

  // Candidate gives completely irrelevant answer (e.g. food recipe or random text)
  const evalResult = await evaluateAnswer(
    sarah,
    askedQuestion,
    {
      day: 10,
      title: 'The Retrieval & Matching Engine',
      type: 'SHIP_IT',
      tools: ['SQLite', 'ChromaDB', 'Python'],
      objectives: ['Build query router', 'Implement hybrid retrieval', 'Merge results with RRF'],
    },
    'I prefer baking chocolate chip cookies on weekends with extra butter and sugar.'
  );

  assert.ok(evalResult.classification === 'incomplete' || evalResult.classification === 'weak');
  assert.ok(evalResult.identifiedGaps.some((g) => g.toLowerCase().includes('off-topic') || g.toLowerCase().includes('non-responsive') || g.toLowerCase().includes('lacks')));

  const lastEvaluation: AnswerEvaluation = {
    questionIndex: 1,
    day: 10,
    topic: 'The Retrieval & Matching Engine',
    questionText: askedQuestion.questionText,
    candidateAnswer: 'I prefer baking chocolate chip cookies on weekends with extra butter and sugar.',
    classification: evalResult.classification,
    reasoning: evalResult.reasoning,
    identifiedStrengths: evalResult.identifiedStrengths,
    identifiedGaps: evalResult.identifiedGaps,
  };

  const plan = determineNextQuestionPlan(sarah, [askedQuestion], [10], lastEvaluation, 'intermediate');

  const genResult = await generateQuestion(sarah, plan, [askedQuestion], false);

  assert.ok(genResult.reply.length > 0);
  assert.ok(
    genResult.reply.toLowerCase().includes('off-topic') ||
    genResult.reply.toLowerCase().includes('non-responsive') ||
    genResult.reply.toLowerCase().includes('re-frame') ||
    genResult.reply.toLowerCase().includes('foundational') ||
    genResult.reply.toLowerCase().includes('purpose')
  );
});
