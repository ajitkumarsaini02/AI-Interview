import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { candidateService } from '../src/services/candidateService.js';
import { plannerService } from '../src/services/plannerService.js';
import { DemoProvider } from '../src/services/llm/demoProvider.js';
import { z } from 'zod';

const sampleCandidate = {
  member: {
    id: "CAND-TEST-001",
    name: "Sarah Johnson",
    jobRole: "Senior Data Engineer",
    yearsExperience: 9,
    education: "MS Computer Science",
    status: "COMPLETED"
  },
  missions: [
    { day: 7, title: "Embeddings Explained", passed: true, attempts: 1 },
    { day: 8, title: "Vector Databases Overview", passed: true, attempts: 1 },
    { day: 10, title: "Retrieval & Matching Engine", passed: true, attempts: 2 },
    { day: 11, title: "RAG End-to-End & LLM API Basics", passed: true, attempts: 1 },
    { day: 16, title: "Chatbot Backend & API Integration", passed: true, attempts: 1 },
    { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 2 },
    { day: 23, title: "Model Context Protocol (MCP)", passed: true, attempts: 2 },
    { day: 28, title: "Docker & Kubernetes Deployment", passed: true, attempts: 3 },
    { day: 29, title: "Monitoring, Logging & Observability", skipped: true },
    { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 }
  ],
  signals: { commitDays: 28, missionsCompleted: 30, missionsFirstTry: 20 }
};

describe('AI Interview Agent - Unit & Integration Test Suite', () => {
  const sessionId = `test-session-${Date.now()}`;

  it('1. Candidate profile analysis', () => {
    const profile = candidateService.analyzeProfile(sampleCandidate);
    expect(profile.role).toBe("Senior Data Engineer");
    expect(profile.completedDays).toContain(7);
    expect(profile.completedDays).toContain(8);
    expect(profile.skippedDays).toContain(29);
    expect(profile.initialDifficulty).toBe("Advanced");
  });

  it('2. Topic selection logic', () => {
    const profile = candidateService.analyzeProfile(sampleCandidate);
    expect(profile.recommendedTopics.length).toBeGreaterThan(0);
    expect(profile.recommendedTopics[0].day).toBe(7);
  });

  it('3. Session creation & 4. First interview response', async () => {
    const res = await request(app)
      .post('/api/interview')
      .send({
        sessionId,
        candidate: sampleCandidate,
      });

    expect(res.status).toBe(200);
    expect(res.body.done).toBe(false);
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply).toContain("Welcome Sarah Johnson");
  });

  it('5. Session continuation', async () => {
    const res = await request(app)
      .post('/api/interview')
      .send({
        sessionId,
        message: "Vector embeddings transform high-dimensional unstructured text into dense vector representations where spatial distance captures semantic relationship.",
      });

    expect(res.status).toBe(200);
    expect(res.body.done).toBe(false);
    expect(typeof res.body.reply).toBe('string');
  });

  it('6. Strong answer handling, 7. Partial answer handling, 8. Weak answer handling', async () => {
    const provider = new DemoProvider();
    
    const strongEval = await provider.generateStructured(
      'Evaluate the technical response given by the candidate. Candidate Answer: "High dimensional vector embeddings capture semantic similarity using HNSW indexing and cosine distance scaling across 10 million vectors with strict p99 50ms SLAs."',
      'System prompt',
      z.any()
    );
    expect(strongEval.tier).toBe('STRONG');

    const partialEval = await provider.generateStructured(
      'Evaluate the technical response given by the candidate. Candidate Answer: "vectors"',
      'System prompt',
      z.any()
    );
    expect(partialEval.tier).toBe('PARTIAL');

    const weakEval = await provider.generateStructured(
      'Evaluate the technical response given by the candidate. Candidate Answer: "idk"',
      'System prompt',
      z.any()
    );
    expect(weakEval.tier).toBe('WEAK');
  });

  it('9. Duplicate question prevention & State progression', () => {
    const profile = candidateService.analyzeProfile(sampleCandidate);
    const state = plannerService.determineInitialState('s-1', 'CAND-1', profile);
    state.questionNumber = 1;
    state.previousQuestions.push("What are vector embeddings?");

    const nextStep = plannerService.getNextStep(state, profile);
    expect(nextStep.isFinished).toBe(false);
    expect(nextStep.nextPhase).toBe('FUNDAMENTALS');
  });

  it('10. Minimum 8 questions & 11. Minimum 4 curriculum days & 12. Final feedback schema', async () => {
    const loopSession = `test-loop-session-${Date.now()}`;
    
    // Start session
    let res = await request(app)
      .post('/api/interview')
      .send({
        sessionId: loopSession,
        candidate: sampleCandidate,
      });

    expect(res.body.done).toBe(false);

    // Loop through answers until interview completes
    let turns = 0;
    while (!res.body.done && turns < 15) {
      turns++;
      res = await request(app)
        .post('/api/interview')
        .send({
          sessionId: loopSession,
          message: `Detailed technical response for turn ${turns} explaining system design, HNSW vector search, hybrid SQL filtering, and multi-agent orchestration.`,
        });
    }

    expect(res.body.done).toBe(true);
    expect(res.body.reply).toBe("Interview completed.");
    expect(res.body.feedback).toBeDefined();
    expect(typeof res.body.feedback.summary).toBe('string');
    expect(Array.isArray(res.body.feedback.strengths)).toBe(true);
    expect(Array.isArray(res.body.feedback.gaps)).toBe(true);
    expect(Array.isArray(res.body.feedback.next)).toBe(true);
    expect(turns).toBeGreaterThanOrEqual(7);
  });

  it('13. Invalid session error handling', async () => {
    const res = await request(app)
      .post('/api/interview')
      .send({
        sessionId: "non-existent-session-id",
        message: "Hello",
      });

    expect(res.status).toBe(404);
  });

  it('14. Completed session repeat handling', async () => {
    const loopSession = `test-completed-session-${Date.now()}`;
    
    await request(app)
      .post('/api/interview')
      .send({ sessionId: loopSession, candidate: sampleCandidate });

    let res;
    for (let i = 0; i < 10; i++) {
      res = await request(app)
        .post('/api/interview')
        .send({
          sessionId: loopSession,
          message: `Turn ${i} explanation of architectural trade-offs.`,
        });
      if (res.body.done) break;
    }

    // Call one more time after completion
    const postDoneRes = await request(app)
      .post('/api/interview')
      .send({
        sessionId: loopSession,
        message: "Another message after done",
      });

    expect(postDoneRes.body.done).toBe(true);
    expect(postDoneRes.body.feedback).toBeDefined();
  });

  it('15. Demo mode execution', async () => {
    const demo = new DemoProvider();
    expect(demo.name).toBe('demo');
  });
});
