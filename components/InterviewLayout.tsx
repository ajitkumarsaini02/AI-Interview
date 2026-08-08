'use client';

import React from 'react';
import { Candidate } from '../types/candidate';
import { DifficultyLevel } from '../types/interview';
import { InterviewSidebar } from './InterviewSidebar';
import { InterviewHeader } from './InterviewHeader';
import { QuestionPanel } from './QuestionPanel';
import { AnswerEditor } from './AnswerEditor';
import { AlertCircle } from 'lucide-react';

interface InterviewLayoutProps {
  candidate: Candidate;
  questionCount: number;
  coveredDays: number[];
  difficulty: DifficultyLevel;
  loading: boolean;
  error: string | null;
  onClearError: () => void;
  currentQuestionText: string;
  currentTopicTitle: string;
  previousTransition?: string;
  adaptiveNote?: string;
  onSubmitAnswer: (answer: string) => Promise<void>;
  completed: boolean;
  historyMessages: { role: 'interviewer' | 'candidate'; content: string; timestamp: number }[];
}

export const InterviewLayout: React.FC<InterviewLayoutProps> = ({
  candidate,
  questionCount,
  coveredDays,
  difficulty,
  loading,
  error,
  onClearError,
  currentQuestionText,
  currentTopicTitle,
  previousTransition,
  adaptiveNote,
  onSubmitAnswer,
  completed,
  historyMessages,
}) => {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8 space-y-6">
      {/* Interview Header */}
      <InterviewHeader
        loading={loading}
        questionNumber={questionCount}
        adaptiveNote={adaptiveNote}
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={onClearError} className="underline hover:text-slate-900 dark:hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* 30% Sidebar / 70% Main Workspace Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Left Sidebar */}
        <InterviewSidebar
          candidate={candidate}
          questionCount={questionCount}
          coveredDays={coveredDays}
          difficulty={difficulty}
        />

        {/* Right Main Area */}
        <div className="space-y-6">
          <QuestionPanel
            questionNumber={questionCount}
            topicTitle={currentTopicTitle}
            difficulty={difficulty}
            questionText={currentQuestionText}
            previousTransition={previousTransition}
          />

          <AnswerEditor
            onSubmitAnswer={onSubmitAnswer}
            loading={loading}
            completed={completed}
          />

          {/* Turn Transcript Audit */}
          {historyMessages.length > 2 && (
            <div className="navy-card p-6 space-y-3 font-mono">
              <div className="text-[10px] uppercase text-slate-500 dark:text-slateText-muted tracking-wider">
                Turn Transcript Audit ({historyMessages.length} Messages)
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto text-xs pr-1">
                {historyMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs ${
                      msg.role === 'interviewer'
                        ? 'bg-slate-50 dark:bg-[#050816] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slateText-secondary'
                        : 'bg-slate-100 dark:bg-[#111A30] border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slateText-primary'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 dark:text-slateText-muted uppercase block mb-1">
                      {msg.role === 'interviewer' ? 'Interviewer Prompt' : 'Candidate Response'}
                    </span>
                    <p className="font-sans leading-relaxed text-xs">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
