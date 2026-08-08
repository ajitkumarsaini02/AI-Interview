import fs from 'fs';
import path from 'path';
import { CurriculumData } from '../types/curriculum';
import { CandidatesData, Candidate } from '../types/candidate';
import { dbGetCandidates, dbGetCandidateById, dbAddCandidate, dbDeleteCandidate } from './db';

let cachedCurriculum: CurriculumData | null = null;
let cachedCandidatesMemory: Candidate[] | null = null;

export function getCurriculum(): CurriculumData {
  if (cachedCurriculum) return cachedCurriculum;

  const filePath = path.join(process.cwd(), 'curriculum.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  cachedCurriculum = JSON.parse(fileContent) as CurriculumData;
  return cachedCurriculum;
}

export function getCandidates(): CandidatesData {
  // If in-memory candidate additions exist, include them
  const baseCandidates = loadBaseCandidates();
  if (cachedCandidatesMemory && cachedCandidatesMemory.length > 0) {
    const combinedMap = new Map<string, Candidate>();
    for (const c of cachedCandidatesMemory) combinedMap.set(c.member.id, c);
    for (const c of baseCandidates) {
      if (!combinedMap.has(c.member.id)) combinedMap.set(c.member.id, c);
    }
    return { candidates: Array.from(combinedMap.values()) };
  }
  return { candidates: baseCandidates };
}

function loadBaseCandidates(): Candidate[] {
  try {
    const sqliteList = dbGetCandidates();
    if (sqliteList && sqliteList.length > 0) return sqliteList;
  } catch (err) {}

  const filePath = path.join(process.cwd(), 'candidates.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return (JSON.parse(fileContent) as CandidatesData).candidates;
}

function saveCandidatesToJson(candidates: Candidate[]): void {
  try {
    const filePath = path.join(process.cwd(), 'candidates.json');
    fs.writeFileSync(filePath, JSON.stringify({ candidates }, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write candidates to candidates.json:', err);
  }
}

export function getCandidateById(candidateId: string): Candidate | null {
  const data = getCandidates();
  return data.candidates.find((c) => c.member.id === candidateId) || null;
}

export function addCandidate(candidate: Candidate): CandidatesData {
  if (!cachedCandidatesMemory) cachedCandidatesMemory = [];
  cachedCandidatesMemory.unshift(candidate);

  try {
    dbAddCandidate(candidate);
  } catch (err) {}

  const currentData = getCandidates();
  saveCandidatesToJson(currentData.candidates);
  return currentData;
}

export function deleteCandidate(candidateId: string): CandidatesData {
  if (cachedCandidatesMemory) {
    cachedCandidatesMemory = cachedCandidatesMemory.filter((c) => c.member.id !== candidateId);
  }

  try {
    dbDeleteCandidate(candidateId);
  } catch (err) {}

  const currentData = getCandidates();
  saveCandidatesToJson(currentData.candidates);
  return currentData;
}
