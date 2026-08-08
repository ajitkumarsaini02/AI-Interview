import path from 'path';
import fs from 'fs';
import { Candidate, CandidatesData } from '../types/candidate';
import { AskedQuestion, AnswerEvaluation, FinalFeedback, DifficultyLevel } from '../types/interview';

let Database: any;
let db: any = null;
let isDbAvailable = false;

try {
  Database = require('better-sqlite3');
  const dbPath = path.join(process.cwd(), 'interview.db');
  db = new Database(dbPath, { timeout: 5000 });
  db.pragma('busy_timeout = 5000');
  try {
    db.pragma('journal_mode = WAL');
  } catch (e) {}
  isDbAvailable = true;
} catch (err) {
  console.warn('SQLite initialization skipped (Serverless/Vercel environment):', err);
  isDbAvailable = false;
}

// Initialize Tables if DB available
if (isDbAvailable && db) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        job_role TEXT NOT NULL,
        years_experience INTEGER NOT NULL,
        education TEXT NOT NULL,
        missions_json TEXT NOT NULL,
        signals_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        candidate_name TEXT NOT NULL,
        question_count INTEGER DEFAULT 0,
        covered_days_json TEXT NOT NULL,
        current_difficulty TEXT DEFAULT 'intermediate',
        is_completed INTEGER DEFAULT 0,
        final_feedback_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS interview_turns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        turn_index INTEGER NOT NULL,
        day INTEGER NOT NULL,
        topic TEXT NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        candidate_answer TEXT,
        classification TEXT,
        evaluation_reasoning TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed / sync candidates from candidates.json if missing
    const candidatesJsonPath = path.join(process.cwd(), 'candidates.json');
    if (fs.existsSync(candidatesJsonPath)) {
      const content = fs.readFileSync(candidatesJsonPath, 'utf-8');
      const parsed = JSON.parse(content) as CandidatesData;

      const insert = db.prepare(`
        INSERT OR IGNORE INTO candidates (id, name, job_role, years_experience, education, missions_json, signals_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const syncMany = db.transaction((list: Candidate[]) => {
        for (const c of list) {
          insert.run(
            c.member.id,
            c.member.name,
            c.member.jobRole,
            c.member.yearsExperience,
            c.member.education,
            JSON.stringify(c.missions || []),
            JSON.stringify(c.signals || {})
          );
        }
      });

      syncMany(parsed.candidates);
    }
  } catch (err) {
    console.warn('DB initialization error:', err);
  }
}

// Database Candidate Repository Methods
export function dbGetCandidates(): Candidate[] {
  if (!isDbAvailable || !db) return [];
  const rows = db.prepare('SELECT * FROM candidates ORDER BY created_at DESC').all() as any[];
  return rows.map((r) => ({
    member: {
      id: r.id,
      name: r.name,
      jobRole: r.job_role,
      yearsExperience: r.years_experience,
      education: r.education,
    },
    missions: JSON.parse(r.missions_json || '[]'),
    signals: JSON.parse(r.signals_json || '{}'),
  }));
}

export function dbGetCandidateById(id: string): Candidate | null {
  if (!isDbAvailable || !db) return null;
  const row = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    member: {
      id: row.id,
      name: row.name,
      jobRole: row.job_role,
      yearsExperience: row.years_experience,
      education: row.education,
    },
    missions: JSON.parse(row.missions_json || '[]'),
    signals: JSON.parse(row.signals_json || '{}'),
  };
}

export function dbAddCandidate(candidate: Candidate): void {
  if (!isDbAvailable || !db) return;
  db.prepare(`
    INSERT OR REPLACE INTO candidates (id, name, job_role, years_experience, education, missions_json, signals_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    candidate.member.id,
    candidate.member.name,
    candidate.member.jobRole,
    candidate.member.yearsExperience,
    candidate.member.education,
    JSON.stringify(candidate.missions || []),
    JSON.stringify(candidate.signals || {})
  );
}

export function dbDeleteCandidate(id: string): void {
  if (!isDbAvailable || !db) return;
  db.prepare('DELETE FROM candidates WHERE id = ?').run(id);
}

// Database Session Repository Methods
export interface DbSession {
  sessionId: string;
  candidateId: string;
  candidateName: string;
  questionCount: number;
  coveredDays: number[];
  currentDifficulty: DifficultyLevel;
  isCompleted: boolean;
  finalFeedback?: FinalFeedback;
  askedQuestions: AskedQuestion[];
  evaluations: AnswerEvaluation[];
}

export function dbCreateSession(sessionId: string, candidate: Candidate): DbSession | null {
  if (!isDbAvailable || !db) return null;
  db.prepare(`
    INSERT OR REPLACE INTO sessions (session_id, candidate_id, candidate_name, question_count, covered_days_json, current_difficulty, is_completed)
    VALUES (?, ?, ?, 0, '[]', 'intermediate', 0)
  `).run(sessionId, candidate.member.id, candidate.member.name);

  return {
    sessionId,
    candidateId: candidate.member.id,
    candidateName: candidate.member.name,
    questionCount: 0,
    coveredDays: [],
    currentDifficulty: 'intermediate',
    isCompleted: false,
    askedQuestions: [],
    evaluations: [],
  };
}

export function dbGetSession(sessionId: string): DbSession | null {
  if (!isDbAvailable || !db) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(sessionId) as any;
  if (!row) return null;

  const turns = db.prepare('SELECT * FROM interview_turns WHERE session_id = ? ORDER BY turn_index ASC').all(sessionId) as any[];

  const askedQuestions: AskedQuestion[] = turns.map((t) => ({
    id: `q-${t.turn_index}`,
    day: t.day,
    topic: t.topic,
    questionText: t.question_text,
    type: t.question_type as any,
    difficulty: t.difficulty as any,
  }));

  const evaluations: AnswerEvaluation[] = turns
    .filter((t) => t.candidate_answer)
    .map((t) => ({
      questionIndex: t.turn_index,
      day: t.day,
      topic: t.topic,
      questionText: t.question_text,
      candidateAnswer: t.candidate_answer,
      classification: (t.classification as any) || 'acceptable',
      reasoning: t.evaluation_reasoning || '',
      identifiedStrengths: [],
      identifiedGaps: [],
    }));

  return {
    sessionId: row.session_id,
    candidateId: row.candidate_id,
    candidateName: row.candidate_name,
    questionCount: row.question_count,
    coveredDays: JSON.parse(row.covered_days_json || '[]'),
    currentDifficulty: row.current_difficulty as DifficultyLevel,
    isCompleted: Boolean(row.is_completed),
    finalFeedback: row.final_feedback_json ? JSON.parse(row.final_feedback_json) : undefined,
    askedQuestions,
    evaluations,
  };
}

export function dbUpdateSession(
  sessionId: string,
  updates: {
    questionCount?: number;
    coveredDays?: number[];
    currentDifficulty?: DifficultyLevel;
    isCompleted?: boolean;
    finalFeedback?: FinalFeedback;
  }
): void {
  if (!isDbAvailable || !db) return;
  const session = dbGetSession(sessionId);
  if (!session) return;

  const newQuestionCount = updates.questionCount !== undefined ? updates.questionCount : session.questionCount;
  const newCoveredDays = updates.coveredDays !== undefined ? updates.coveredDays : session.coveredDays;
  const newDifficulty = updates.currentDifficulty !== undefined ? updates.currentDifficulty : session.currentDifficulty;
  const newIsCompleted = updates.isCompleted !== undefined ? (updates.isCompleted ? 1 : 0) : (session.isCompleted ? 1 : 0);
  const newFeedback = updates.finalFeedback !== undefined ? JSON.stringify(updates.finalFeedback) : (session.finalFeedback ? JSON.stringify(session.finalFeedback) : null);

  db.prepare(`
    UPDATE sessions
    SET question_count = ?, covered_days_json = ?, current_difficulty = ?, is_completed = ?, final_feedback_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE session_id = ?
  `).run(newQuestionCount, JSON.stringify(newCoveredDays), newDifficulty, newIsCompleted, newFeedback, sessionId);
}

export function dbRecordTurn(
  sessionId: string,
  turnIndex: number,
  question: AskedQuestion,
  candidateAnswer?: string,
  classification?: string,
  reasoning?: string
): void {
  if (!isDbAvailable || !db) return;
  db.prepare(`
    INSERT INTO interview_turns (session_id, turn_index, day, topic, question_text, question_type, difficulty, candidate_answer, classification, evaluation_reasoning)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    turnIndex,
    question.day,
    question.topic,
    question.questionText,
    question.type,
    question.difficulty,
    candidateAnswer || null,
    classification || null,
    reasoning || null
  );
}
