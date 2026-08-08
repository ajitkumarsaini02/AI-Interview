import test from 'node:test';
import assert from 'node:assert/strict';
import { getCurriculum, getCandidates } from '../lib/data-loader';
import { analyzeCandidate } from '../lib/candidate-analyzer';
import { sessionStore } from '../lib/session-store';
import { determineNextQuestionPlan, isInterviewComplete } from '../lib/interview-planner';
import { POST } from '../app/api/interview/route';

test('Curriculum and Candidates Data Loading', () => {
  const curriculum = getCurriculum();
  assert.ok(curriculum.days.length === 31, 'Should have 31 days in curriculum');
  assert.ok(curriculum.modules.length === 8, 'Should have 8 modules');

  const candidatesData = getCandidates();
  assert.ok(candidatesData.candidates.length > 0, 'Should load candidates list');
  const sarah = candidatesData.candidates.find((c) => c.member.id === 'CAND-001') || candidatesData.candidates[0];
  assert.equal(sarah.member.name, 'Sarah Johnson');
});

test('Candidate Profile Analysis', () => {
  const candidatesData = getCandidates();
  const sarah = candidatesData.candidates[0];
  const analysis = analyzeCandidate(sarah);

  assert.ok(analysis.completedDays.length > 0, 'Should parse completed days');
  assert.ok(analysis.highAttemptDays.length > 0, 'Should find high attempt days (attempts >= 3)');
  assert.equal(analysis.startingDifficulty, 'advanced', 'Sarah should start at advanced difficulty due to 9 yrs exp');
});

test('Session Store operations', async () => {
  await sessionStore.clear();
  const testSession: any = {
    sessionId: 'test-session-101',
    candidateId: 'CAND-001',
    candidateName: 'Sarah Johnson',
    questionCount: 1,
    coveredDays: [7],
    completed: false,
  };

  await sessionStore.set('test-session-101', testSession);
  const fetched = await sessionStore.get('test-session-101');
  assert.ok(fetched !== null);
  assert.equal(fetched.candidateName, 'Sarah Johnson');

  await sessionStore.delete('test-session-101');
  const deleted = await sessionStore.get('test-session-101');
  assert.equal(deleted, null);
});

test('Interview Completion Logic Guardrails', () => {
  assert.equal(isInterviewComplete(7, [1, 2, 3, 4]), false, 'Should not complete at 7 questions');
  assert.equal(isInterviewComplete(8, [1, 2, 3]), false, 'Should not complete at 3 unique days even with 8 questions');
  assert.equal(isInterviewComplete(8, [1, 2, 3, 4]), true, 'Should complete at 8 questions and 4 unique days');
  assert.equal(isInterviewComplete(10, [1, 7, 12, 22, 28]), true, 'Should complete when questions >= 8 and unique days >= 4');
});

test('Full Multi-Turn API Flow via POST /api/interview', async () => {
  await sessionStore.clear();
  const candidatesData = getCandidates();
  const candidate = candidatesData.candidates[0]; // Sarah Johnson
  const sessionId = 'api-test-session-999';

  // 1. Start Request
  const startReq = new Request('http://localhost:3000/api/interview', {
    method: 'POST',
    body: JSON.stringify({ sessionId, candidate }),
    headers: { 'Content-Type': 'application/json' },
  });

  const startRes = await POST(startReq);
  const startData = await startRes.json();

  assert.equal(startRes.status, 200);
  assert.equal(startData.done, false);
  assert.ok(typeof startData.reply === 'string' && startData.reply.length > 0);

  // 2. Play 8 subsequent turns (candidate answers questions 1 through 8)
  let currentTurnData = startData;
  for (let turn = 1; turn <= 8; turn++) {
    const turnReq = new Request('http://localhost:3000/api/interview', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        message: `This is candidate answer turn ${turn}. I use vector embeddings, ChromaDB indexing, hybrid search with Reciprocal Rank Fusion, and LangChain ReAct agents.`,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const turnRes = await POST(turnReq);
    currentTurnData = await turnRes.json();
    assert.equal(turnRes.status, 200);

    if (turn < 8) {
      assert.equal(currentTurnData.done, false, `Turn ${turn} should not be done yet`);
    }
  }

  // 3. Final Turn Verification (Turn 8 processed answer #8)
  assert.equal(currentTurnData.done, true, 'Turn 8 should mark interview complete (8 questions answered)');
  assert.equal(currentTurnData.reply, 'Interview completed.');
  assert.ok(currentTurnData.feedback, 'Feedback object must be present on completion');
  assert.ok(typeof currentTurnData.feedback.summary === 'string');
  assert.ok(Array.isArray(currentTurnData.feedback.strengths));
  assert.ok(Array.isArray(currentTurnData.feedback.gaps));
  assert.ok(Array.isArray(currentTurnData.feedback.next));

  // Verify session state in store
  const storedSession = await sessionStore.get(sessionId);
  assert.ok(storedSession !== null);
  assert.ok(storedSession.questionCount >= 8, 'Stored question count must be >= 8');
  assert.ok(new Set(storedSession.coveredDays).size >= 4, 'Covered days must be >= 4 unique days');
  assert.equal(storedSession.completed, true);
});

test('API Error Handling', async () => {
  // Invalid payload
  const badReq = new Request('http://localhost:3000/api/interview', {
    method: 'POST',
    body: JSON.stringify({ invalidField: true }),
    headers: { 'Content-Type': 'application/json' },
  });
  const badRes = await POST(badReq);
  assert.equal(badRes.status, 400);

  // Missing session
  const missingSessionReq = new Request('http://localhost:3000/api/interview', {
    method: 'POST',
    body: JSON.stringify({ sessionId: 'non-existent-session-id', message: 'Hello' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const missingRes = await POST(missingSessionReq);
  assert.equal(missingRes.status, 404);
});
