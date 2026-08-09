'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchCandidates,
  startInterview,
  CandidateData,
} from '../lib/api';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Target,
  BrainCircuit,
  Zap,
  Code2,
} from 'lucide-react';

export default function CandidateSelectionPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCandidates();
        setCandidates(data);
        if (data.length > 0) {
          setSelectedCandidate(data[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load candidates data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleStartInterview = async (cand: CandidateData) => {
    try {
      setStarting(cand.member.id);
      setError(null);

      const sessionId = `session-${cand.member.id.toLowerCase()}-${Date.now().toString(36)}`;
      const res = await startInterview(sessionId, cand);

      if (res.error) {
        throw new Error(res.error);
      }

      // Store in localStorage for quick access
      localStorage.setItem(`candidate_${sessionId}`, JSON.stringify(cand));
      router.push(`/interview/${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize interview session');
      setStarting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-mono text-zinc-400">Loading Candidate Roster & Learning Signals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10 py-2 sm:py-4 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-5 sm:p-8 lg:p-10 border border-zinc-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-3xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Multi-Turn Adaptive AI Evaluation</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Select a Candidate to Begin Technical Assessment
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm lg:text-base leading-relaxed">
            Your personalized technical interview. The AI agent analyzes completed missions, passed/failed topics, and learning signals across the 31-day AI Cohort to conduct a real adaptive technical interview.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline hover:text-red-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Candidate Roster & Focus Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Candidate Roster (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Candidate Cohort Roster ({candidates.length})
            </h2>
            <span className="text-[11px] sm:text-xs text-zinc-500 font-mono hidden xs:inline">Select candidate to inspect strategy</span>
          </div>

          <div className="space-y-4">
            {candidates.map((cand) => {
              const isSelected = selectedCandidate?.member.id === cand.member.id;
              const isStartingThis = starting === cand.member.id;
              const passedCount = cand.missions.filter((m) => m.passed).length;
              const skippedCount = cand.missions.filter((m) => m.skipped).length;
              const failedCount = cand.missions.filter((m) => !m.passed && !m.skipped).length;

              return (
                <div
                  key={cand.member.id}
                  onClick={() => setSelectedCandidate(cand)}
                  className={`cursor-pointer rounded-xl p-4 sm:p-5 transition-all ${
                    isSelected
                      ? 'bg-zinc-900/90 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'glass-card hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="font-bold text-sm sm:text-base text-zinc-100">{cand.member.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {cand.member.status}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">{cand.member.id}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                          {cand.member.jobRole}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-zinc-500" />
                          {cand.member.yearsExperience} yrs exp • {cand.member.education}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartInterview(cand);
                      }}
                      disabled={starting !== null}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                    >
                      {isStartingThis ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Initializing...</span>
                        </>
                      ) : (
                        <>
                          <span>Start Interview</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Signals & Missions Bar */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/40">
                      <span className="text-zinc-500 block text-[10px] uppercase">Passed</span>
                      <span className="text-emerald-400 font-bold text-xs sm:text-sm">{passedCount} missions</span>
                    </div>
                    <div className="bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/40">
                      <span className="text-zinc-500 block text-[10px] uppercase">1st Try Mastery</span>
                      <span className="text-indigo-400 font-bold text-xs sm:text-sm">
                        {cand.signals?.missionsFirstTry || 0} / {cand.signals?.missionsCompleted || 0}
                      </span>
                    </div>
                    <div className="bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/40">
                      <span className="text-zinc-500 block text-[10px] uppercase">Skipped / Failed</span>
                      <span className="text-amber-400 font-bold text-xs sm:text-sm">
                        {skippedCount} skip • {failedCount} fail
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Focus Preview Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              Interview Focus Intelligence
            </h2>
          </div>

          {selectedCandidate ? (
            <div className="rounded-xl glass-panel p-6 space-y-6 border border-zinc-800 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="font-bold text-lg text-zinc-100">{selectedCandidate.member.name}</h3>
                  <p className="text-xs text-zinc-400">{selectedCandidate.member.jobRole}</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-indigo-400 font-bold text-sm">{selectedCandidate.signals?.commitDays || 0}</span>
                  <span className="text-zinc-500 block text-[10px]">Commit Days</span>
                </div>
              </div>

              {/* Strong Areas */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Strong Mastery Areas</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.missions
                    .filter((m) => m.passed && (m.attempts || 1) <= 2)
                    .slice(0, 5)
                    .map((m) => (
                      <span
                        key={m.day}
                        className="px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        Day {m.day}: {m.title}
                      </span>
                    ))}
                </div>
              </div>

              {/* Diagnostic / Probing Areas */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Areas to Diagnostic Probe</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.missions
                    .filter((m) => !m.passed || (m.attempts && m.attempts > 2))
                    .map((m) => (
                      <span
                        key={m.day}
                        className="px-2.5 py-1 rounded-md text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      >
                        Day {m.day}: {m.title} ({m.skipped ? 'Skipped' : `${m.attempts} attempts`})
                      </span>
                    ))}
                  {selectedCandidate.missions.filter((m) => !m.passed || (m.attempts && m.attempts > 2)).length === 0 && (
                    <span className="text-xs text-zinc-500 italic">No major struggles identified</span>
                  )}
                </div>
              </div>

              {/* Planned Assessment Strategy */}
              <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                  <Target className="w-4 h-4" />
                  <span>Targeted Curriculum Coverage</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The agent will structure an 8 to 10 question interview covering embeddings, vector databases, retrieval strategies, RAG architecture, function calling, agent orchestration, and system deployment tailored for a {selectedCandidate.member.jobRole}.
                </p>

                <button
                  onClick={() => handleStartInterview(selectedCandidate)}
                  disabled={starting !== null}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Launch Assessment for {selectedCandidate.member.name.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl glass-panel p-8 text-center text-zinc-500 text-sm">
              Select a candidate from the roster to view personalized focus intelligence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
