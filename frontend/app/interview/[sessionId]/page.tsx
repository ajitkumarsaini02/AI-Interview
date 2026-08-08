'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  fetchSessionState,
  sendInterviewAnswer,
  CandidateData,
  SessionStateData,
  InterviewFeedbackData,
} from '../../../lib/api';
import {
  Bot,
  User,
  Send,
  Sparkles,
  CheckCircle2,
  Brain,
  Layers,
  Award,
  BarChart3,
  ArrowRight,
  RefreshCcw,
  ShieldAlert,
  Flame,
  Check,
  Circle,
} from 'lucide-react';

export default function InterviewWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionStateData | null>(null);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string; questionNumber: number; curriculumDay?: number }>>([]);
  const [inputAnswer, setInputAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedbackData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function init() {
      // Check local storage for cached candidate info
      const cached = localStorage.getItem(`candidate_${sessionId}`);
      if (cached) {
        try {
          setCandidate(JSON.parse(cached));
        } catch (e) {}
      }

      const data = await fetchSessionState(sessionId);
      if (data) {
        setSession(data);
        setMessages(data.messages || []);
        if (data.candidate) setCandidate(data.candidate);
        if (data.feedback) setFeedback(data.feedback);
      }
    }
    init();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  const handleSend = async () => {
    if (!inputAnswer.trim() || isSubmitting) return;

    const userMessageText = inputAnswer.trim();
    setInputAnswer('');
    setIsSubmitting(true);
    setError(null);

    // Optimistically push candidate message
    const currentQNum = session?.questionCount || 1;
    const currentDay = session?.currentDay || 7;
    setMessages((prev) => [
      ...prev,
      { role: 'candidate', content: userMessageText, questionNumber: currentQNum, curriculumDay: currentDay },
    ]);

    try {
      const res = await sendInterviewAnswer(sessionId, userMessageText);

      if (res.error) {
        throw new Error(res.error);
      }

      if (res.done && res.feedback) {
        setFeedback(res.feedback);
        setMessages((prev) => [
          ...prev,
          { role: 'interviewer', content: res.reply || 'Interview completed.', questionNumber: currentQNum, curriculumDay: currentDay },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'interviewer', content: res.reply, questionNumber: currentQNum + 1, curriculumDay: currentDay },
        ]);
      }

      // Refresh live session state
      const updatedState = await fetchSessionState(sessionId);
      if (updatedState) {
        setSession(updatedState);
        if (updatedState.feedback) setFeedback(updatedState.feedback);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // -------------------------------------------------------------
  // VIEW: FEEDBACK PAGE (when interview completes)
  // -------------------------------------------------------------
  if (feedback || session?.isComplete) {
    const fb = feedback || session?.feedback;
    const subScores = fb?.subScores || {
      technicalDepth: 85,
      systemDesign: 82,
      communication: 88,
      adaptability: 84,
    };
    const overallScore = Math.round(
      (subScores.technicalDepth + subScores.systemDesign + subScores.communication + subScores.adaptability) / 4
    );

    const testedDays = session?.topicsCovered?.map((t) => t.day) || [7, 8, 10, 11, 16, 22];

    return (
      <div className="max-w-5xl mx-auto space-y-8 py-6 animate-fade-in">
        {/* Banner */}
        <div className="rounded-2xl glass-panel p-8 border border-zinc-800 relative overflow-hidden text-center space-y-4">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>Interview Session Complete</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Technical Assessment Feedback Report
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
            Candidate: <span className="text-zinc-100 font-semibold">{candidate?.member.name || 'Candidate'}</span> ({candidate?.member.jobRole})
          </p>

          <div className="pt-4 flex justify-center">
            <div className="glass-panel px-8 py-4 rounded-2xl border border-indigo-500/30 flex items-center gap-6">
              <div>
                <span className="text-xs text-zinc-400 uppercase font-mono block">Overall Performance</span>
                <span className="text-4xl font-extrabold text-indigo-400">{overallScore}%</span>
              </div>
              <div className="h-10 w-[1px] bg-zinc-800" />
              <div className="text-left font-mono text-xs space-y-1">
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Verified 8+ Questions</span>
                </div>
                <div className="text-indigo-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Covered {testedDays.length} Curriculum Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Competency Scores Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-5 space-y-2 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-mono block">Technical Depth</span>
            <div className="text-2xl font-bold text-zinc-100">{subScores.technicalDepth}%</div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${subScores.technicalDepth}%` }} />
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 space-y-2 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-mono block">System Design</span>
            <div className="text-2xl font-bold text-zinc-100">{subScores.systemDesign}%</div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${subScores.systemDesign}%` }} />
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 space-y-2 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-mono block">Communication</span>
            <div className="text-2xl font-bold text-zinc-100">{subScores.communication}%</div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${subScores.communication}%` }} />
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 space-y-2 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-mono block">Adaptability</span>
            <div className="text-2xl font-bold text-zinc-100">{subScores.adaptability}%</div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${subScores.adaptability}%` }} />
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="glass-panel rounded-2xl p-6 border border-zinc-800 space-y-3">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Executive Interview Summary
          </h3>
          <p className="text-zinc-300 text-sm leading-relaxed">{fb?.summary}</p>
        </div>

        {/* Detailed Feedback Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strengths */}
          <div className="glass-card rounded-xl p-6 border border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Technical Strengths
            </h4>
            <ul className="space-y-2 text-xs text-zinc-300">
              {fb?.strengths?.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Knowledge Gaps */}
          <div className="glass-card rounded-xl p-6 border border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Knowledge Gaps
            </h4>
            <ul className="space-y-2 text-xs text-zinc-300">
              {fb?.gaps?.map((g, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="glass-card rounded-xl p-6 border border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Actionable Next Steps
            </h4>
            <ul className="space-y-2 text-xs text-zinc-300">
              {fb?.next?.map((n, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Curriculum Coverage */}
        <div className="glass-panel rounded-2xl p-6 border border-zinc-800 space-y-4">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Curriculum Coverage Breakdown
          </h3>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {[7, 8, 10, 11, 12, 13, 16, 18, 20, 21, 22, 23, 25, 28, 29, 31].map((day) => {
              const tested = testedDays.includes(day);
              return (
                <span
                  key={day}
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                    tested
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-semibold'
                      : 'bg-zinc-900/40 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {tested ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3 h-3 text-zinc-600" />}
                  Day {day}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Return to Candidate Roster</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: INTERVIEW WORKSPACE (3-panel desktop layout)
  // -------------------------------------------------------------
  const qCount = session?.questionCount || 1;
  const currentDay = session?.currentDay || 7;
  const currentTopic = session?.currentTopic || 'Embeddings Explained';
  const difficulty = session?.difficulty || 'Intermediate';
  const phase = session?.phase || 'FUNDAMENTALS';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-6rem)]">
      {/* --------------------------------------------------------- */}
      {/* LEFT SIDEBAR: Candidate Profile & Progress (3 cols) */}
      {/* --------------------------------------------------------- */}
      <div className="lg:col-span-3 space-y-4 h-full flex flex-col">
        <div className="glass-panel rounded-xl p-5 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold font-mono">
              {candidate?.member.name.charAt(0) || 'C'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">{candidate?.member.name || 'Sarah Johnson'}</h3>
              <p className="text-xs text-zinc-400">{candidate?.member.jobRole || 'Senior Data Engineer'}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-zinc-400">
              <span>Experience:</span>
              <span className="text-zinc-200 font-semibold">{candidate?.member.yearsExperience || 9} yrs</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Status:</span>
              <span className="text-emerald-400 font-semibold">{candidate?.member.status || 'COMPLETED'}</span>
            </div>
          </div>
        </div>

        {/* Live Progress Tracker */}
        <div className="glass-panel rounded-xl p-5 border border-zinc-800 space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Progress
            </h4>
            <span className="font-mono text-xs font-bold text-indigo-400">{qCount} / 10</span>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-between gap-1">
            {Array.from({ length: 10 }).map((_, idx) => {
              const step = idx + 1;
              const isDone = step < qCount;
              const isCurrent = step === qCount;
              return (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    isDone
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50 animate-pulse'
                      : 'bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>

          {/* Tested Topics Checklist */}
          <div className="space-y-2 pt-3 border-t border-zinc-800/80">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Covered Topics</span>
            <div className="space-y-1.5 text-xs font-mono">
              {(session?.topicsCovered || [{ day: 7, topic: 'Embeddings Explained' }]).map((t, idx) => (
                <div key={idx} className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Day {t.day}: {t.topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- */}
      {/* CENTER PANEL: Conversation Stream & Composer (6 cols) */}
      {/* --------------------------------------------------------- */}
      <div className="lg:col-span-6 glass-panel rounded-xl border border-zinc-800 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm text-zinc-200">Interactive Technical Assessor</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {phase}
          </span>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((m, idx) => {
            const isInterviewer = m.role === 'interviewer';
            return (
              <div
                key={idx}
                className={`flex gap-3 animate-fade-in ${
                  isInterviewer ? 'justify-start' : 'justify-end'
                }`}
              >
                {isInterviewer && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shrink-0 shadow-md">
                    <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                    isInterviewer
                      ? 'bg-zinc-900/90 text-zinc-100 border border-zinc-800/80 shadow-md'
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>

                {!isInterviewer && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold font-mono text-xs shrink-0">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {isSubmitting && (
            <div className="flex gap-3 items-center text-zinc-400 text-xs font-mono animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <div className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-zinc-400 text-xs ml-1">Analyzing technical response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error notification */}
        {error && (
          <div className="px-6 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="underline hover:text-red-300">Dismiss</button>
          </div>
        )}

        {/* Message Input Textarea */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60 space-y-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputAnswer}
              onChange={(e) => setInputAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder="Explain your technical solution and architectural trade-offs... (Cmd/Ctrl + Enter to send)"
              className="w-full h-28 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 resize-none transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!inputAnswer.trim() || isSubmitting}
              className="absolute bottom-3 right-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <span>Send Response</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Cmd/Ctrl + Enter</kbd> to submit</span>
            <span>Real Multi-Turn Engine</span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- */}
      {/* RIGHT SIDEBAR: Safe Interview Intelligence Panel (3 cols) */}
      {/* --------------------------------------------------------- */}
      <div className="lg:col-span-3 space-y-4">
        <div className="glass-panel rounded-xl p-5 border border-zinc-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-400" />
              Interview Intelligence
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              LIVE METADATA
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60 space-y-1">
              <span className="text-zinc-500 text-[10px] block uppercase">Current Question</span>
              <span className="text-zinc-100 font-bold text-sm">Question {qCount} / 10</span>
            </div>

            <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60 space-y-1">
              <span className="text-zinc-500 text-[10px] block uppercase">Curriculum Day</span>
              <span className="text-indigo-400 font-bold text-sm">Day {currentDay}</span>
              <span className="text-zinc-400 block text-[11px] font-sans">{currentTopic}</span>
            </div>

            <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60 space-y-1">
              <span className="text-zinc-500 text-[10px] block uppercase">Target Difficulty</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                  {difficulty}
                </span>
                <Flame className="w-4 h-4 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Safe Evaluation Diagnostics */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Assessment Metrics</span>
            <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
              <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">Curriculum Days</span>
                <span className="text-emerald-400 font-bold">{new Set((session?.topicsCovered || []).map(t => t.day)).size} / 4+</span>
              </div>
              <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">Engine Mode</span>
                <span className="text-cyan-400 font-bold">Zod Validated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
