'use client';

import React from 'react';
import { DifficultyLevel } from '../types/interview';

interface QuestionPanelProps {
  questionNumber: number;
  topicTitle: string;
  difficulty: DifficultyLevel;
  questionText: string;
  previousTransition?: string;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
  questionNumber,
  topicTitle,
  difficulty,
  questionText,
  previousTransition,
}) => {
  const formattedNumber = questionNumber < 10 ? `0${questionNumber}` : `${questionNumber}`;

  return (
    <div className="navy-card p-8 space-y-6">
      {/* Uppercase Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-b border-slate-200 dark:border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs tracking-wider">
            QUESTION {formattedNumber}
          </span>
          <span className="text-slate-400 dark:text-slateText-muted">•</span>
          <span className="text-slate-900 dark:text-slateText-primary font-bold uppercase tracking-wider font-mono">
            {topicTitle} · {difficulty.toUpperCase()}
          </span>
        </div>

        <span className="tag-mono text-slate-500 dark:text-slateText-muted">REASONING PROMPT</span>
      </div>

      {/* Optional Transition Context Note */}
      {previousTransition && (
        <div className="text-xs font-mono text-slate-700 dark:text-slateText-secondary bg-slate-100 dark:bg-[#111A30] p-4 rounded-xl border border-slate-200 dark:border-white/[0.06]">
          <span className="text-blue-600 dark:text-blue-400 font-bold mr-2">INTERVIEWER NOTE:</span>
          {previousTransition}
        </div>
      )}

      {/* Large Readable Technical Question Prompt */}
      <div className="space-y-4 max-w-4xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slateText-primary leading-snug tracking-tight font-sans">
          &ldquo;{questionText}&rdquo;
        </h2>
      </div>
    </div>
  );
};
