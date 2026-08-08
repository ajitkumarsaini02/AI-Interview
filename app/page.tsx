'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { CandidateSelector } from '../components/CandidateSelector';
import { InterviewLayout } from '../components/InterviewLayout';
import { FeedbackDashboard } from '../components/FeedbackDashboard';
import { Candidate } from '../types/candidate';
import { CurriculumData } from '../types/curriculum';
import { DifficultyLevel, FinalFeedback } from '../types/interview';

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Theme State Management (Light / Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // View State Management
  const [viewState, setViewState] = useState<'LANDING' | 'INTERVIEW' | 'FEEDBACK'>('LANDING');

  // Session Data
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [coveredDays, setCoveredDays] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [finalFeedback, setFinalFeedback] = useState<FinalFeedback | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Active Turn Display Data
  const [currentQuestionText, setCurrentQuestionText] = useState<string>('');
  const [currentTopicTitle, setCurrentTopicTitle] = useState<string>('');
  const [previousTransition, setPreviousTransition] = useState<string | undefined>(undefined);
  const [adaptiveNote, setAdaptiveNote] = useState<string | undefined>(undefined);
  const [historyMessages, setHistoryMessages] = useState<
    { role: 'interviewer' | 'candidate'; content: string; timestamp: number }[]
  >([]);

  // Theme Initialization & Handler
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  // Fetch candidates & curriculum on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/candidates');
        if (res.ok) {
          const data = await res.json();
          setCandidates(data.candidates || []);
          setCurriculum(data.curriculum || null);
        }
      } catch (err) {
        console.error('Failed to load candidate roster:', err);
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, []);

  // Add Candidate Handler
  const handleCandidateAdded = (newCandidate: Candidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
  };

  // Delete Candidate Handler
  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      const res = await fetch(`/api/candidates?id=${candidateId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.member.id !== candidateId));
      }
    } catch (err) {
      console.error('Failed to delete candidate:', err);
    }
  };

  // Helper to parse question text and transitions from API reply
  const parseReply = (rawReply: string) => {
    const parts = rawReply.split('\n\n');
    if (parts.length >= 2) {
      return {
        transition: parts[0],
        question: parts.slice(1).join('\n\n'),
      };
    }
    return {
      transition: undefined,
      question: rawReply,
    };
  };

  // Start Interview Session Handler
  const handleSelectCandidate = async (candidate: Candidate) => {
    const newSessionId = `sess-${candidate.member.id}-${Date.now()}`;
    setActiveCandidate(candidate);
    setSessionId(newSessionId);
    setViewState('INTERVIEW');
    setLoading(true);
    setError(null);
    setIsCompleted(false);
    setHistoryMessages([]);
    setQuestionCount(1);
    setCoveredDays([7]); // Default initial day
    setCurrentTopicTitle('Vector DBs & Embeddings');
    setAdaptiveNote('Targeting Candidate Focus Areas');

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSessionId,
          candidate,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to initialize interview');
      }

      const data = await res.json();
      const parsed = parseReply(data.reply);

      setCurrentQuestionText(parsed.question);
      setPreviousTransition(parsed.transition);
      setHistoryMessages([
        { role: 'interviewer', content: data.reply, timestamp: Date.now() },
      ]);
    } catch (err: any) {
      console.error('Failed to start interview:', err);
      setError(err.message || 'Error starting interview session');
    } finally {
      setLoading(false);
    }
  };

  // Send Answer Turn Handler
  const handleSendMessage = async (messageText: string) => {
    if (!sessionId || loading) return;

    setLoading(true);
    setError(null);

    setHistoryMessages((prev) => [
      ...prev,
      { role: 'candidate', content: messageText, timestamp: Date.now() },
    ]);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: messageText,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error processing answer turn');
      }

      const data = await res.json();

      if (data.done && data.feedback) {
        setIsCompleted(true);
        setFinalFeedback(data.feedback);
        setViewState('FEEDBACK');
      } else {
        const parsed = parseReply(data.reply);
        setCurrentQuestionText(parsed.question);
        setPreviousTransition(parsed.transition);

        setHistoryMessages((prev) => [
          ...prev,
          { role: 'interviewer', content: data.reply, timestamp: Date.now() },
        ]);

        setQuestionCount((prev) => prev + 1);

        const newCoveredDay = 7 + ((questionCount * 3) % 24);
        setCoveredDays((prev) => (prev.includes(newCoveredDay) ? prev : [...prev, newCoveredDay]));

        const topicTitles = [
          'Vector Databases',
          'RAG Architecture',
          'Prompt Engineering',
          'Agentic AI',
          'MCP Protocol',
          'AI Deployment',
          'Production AI Systems',
        ];
        setCurrentTopicTitle(topicTitles[(questionCount - 1) % topicTitles.length]);

        const adaptiveNotes = [
          'Follow-up generated from previous answer',
          'Targeting missing implementation details',
          'Topic mastered · Moving deeper',
          'Testing misconception gently',
          'Scaling difficulty to Advanced',
        ];
        setAdaptiveNote(adaptiveNotes[(questionCount - 1) % adaptiveNotes.length]);
      }
    } catch (err: any) {
      console.error('Turn error:', err);
      setError(err.message || 'Error processing candidate answer');
    } finally {
      setLoading(false);
    }
  };

  // Reset Session Handler
  const handleReset = () => {
    setActiveCandidate(null);
    setSessionId('');
    setQuestionCount(0);
    setCoveredDays([]);
    setFinalFeedback(null);
    setIsCompleted(false);
    setError(null);
    setViewState('LANDING');
  };

  const scrollToCandidates = () => {
    const el = document.getElementById('candidates');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setViewState('LANDING');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#050816] text-slate-900 dark:text-[#F8FAFC] transition-colors duration-250">
      <Navbar
        activeCandidate={activeCandidate}
        onReset={handleReset}
        onStartInterviewClick={scrollToCandidates}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1">
        {viewState === 'LANDING' && (
          <div className="max-w-[1440px] mx-auto px-8">
            <Hero onStartClick={scrollToCandidates} />
            <CandidateSelector
              candidates={candidates}
              onSelectCandidate={handleSelectCandidate}
              onDeleteCandidate={handleDeleteCandidate}
              onCandidateAdded={handleCandidateAdded}
              loading={dataLoading}
            />
          </div>
        )}

        {viewState === 'INTERVIEW' && activeCandidate && (
          <InterviewLayout
            candidate={activeCandidate}
            questionCount={questionCount}
            coveredDays={coveredDays}
            difficulty={difficulty}
            loading={loading}
            error={error}
            onClearError={() => setError(null)}
            currentQuestionText={currentQuestionText}
            currentTopicTitle={currentTopicTitle}
            previousTransition={previousTransition}
            adaptiveNote={adaptiveNote}
            onSubmitAnswer={handleSendMessage}
            completed={isCompleted}
            historyMessages={historyMessages}
          />
        )}

        {viewState === 'FEEDBACK' && finalFeedback && activeCandidate && (
          <FeedbackDashboard
            feedback={finalFeedback}
            candidate={activeCandidate}
            questionCount={questionCount}
            coveredDays={coveredDays}
            onRestart={handleReset}
          />
        )}
      </main>
    </div>
  );
}
