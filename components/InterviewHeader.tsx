'use client';

import React from 'react';
import { InterviewStatus } from './InterviewStatus';

interface InterviewHeaderProps {
  loading: boolean;
  questionNumber: number;
  adaptiveNote?: string;
}

export const InterviewHeader: React.FC<InterviewHeaderProps> = ({
  loading,
  questionNumber,
  adaptiveNote,
}) => {
  const formattedCount = questionNumber < 10 ? `0${questionNumber}` : `${questionNumber}`;

  return (
    <div className="navy-card px-6 py-4 flex items-center justify-between">
      <InterviewStatus loading={loading} adaptiveNote={adaptiveNote} />

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="text-slate-500 dark:text-slateText-muted uppercase text-[10px]">PROGRESS:</span>
        <span className="font-bold text-slate-900 dark:text-slateText-primary">Question {formattedCount} / 08+</span>
      </div>
    </div>
  );
};
