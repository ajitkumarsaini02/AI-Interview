const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined 
  ? process.env.NEXT_PUBLIC_API_URL 
  : (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');

export interface CandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
}

export interface CandidateMission {
  day: number;
  title: string;
  passed?: boolean;
  skipped?: boolean;
  attempts?: number;
}

export interface CandidateSignals {
  commitDays: number;
  missionsCompleted: number;
  missionsFirstTry: number;
}

export interface CandidateData {
  member: CandidateMember;
  missions: CandidateMission[];
  signals: CandidateSignals;
}

export interface InterviewFeedbackData {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
  subScores?: {
    technicalDepth: number;
    systemDesign: number;
    communication: number;
    adaptability: number;
  };
}

export interface InterviewResponse {
  reply: string;
  done: boolean;
  feedback?: InterviewFeedbackData;
  error?: string;
}

export interface SessionStateData {
  sessionId: string;
  candidate: CandidateData;
  questionCount: number;
  currentDay: number;
  currentTopic: string;
  difficulty: string;
  phase: string;
  topicsCovered: Array<{ day: number; topic: string }>;
  messages: Array<{ role: string; content: string; questionNumber: number; curriculumDay?: number }>;
  isComplete: boolean;
  feedback?: InterviewFeedbackData;
  evaluations?: Array<{ questionNumber: number; score: number; tier: string; technicalDepth: string }>;
}

export async function fetchCandidates(): Promise<CandidateData[]> {
  try {
    const res = await fetch(`${API_URL}/api/candidates`);
    if (!res.ok) throw new Error('Failed to fetch candidates');
    const data = await res.json();
    return data.candidates || [];
  } catch (err) {
    console.error('API fetchCandidates error:', err);
    return [];
  }
}

function getSavedAIConfig() {
  if (typeof window === 'undefined') return {};
  const apiKey = localStorage.getItem('ai_api_key') || undefined;
  const provider = localStorage.getItem('ai_provider') || undefined;
  return { apiKey, provider };
}

export async function startInterview(sessionId: string, candidate: CandidateData): Promise<InterviewResponse> {
  const config = getSavedAIConfig();
  const res = await fetch(`${API_URL}/api/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, candidate, ...config }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function sendInterviewAnswer(sessionId: string, message: string): Promise<InterviewResponse> {
  const config = getSavedAIConfig();
  const res = await fetch(`${API_URL}/api/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message, ...config }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSessionState(sessionId: string): Promise<SessionStateData | null> {
  try {
    const res = await fetch(`${API_URL}/api/interview/${sessionId}`);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error('API fetchSessionState error:', err);
    return null;
  }
}
