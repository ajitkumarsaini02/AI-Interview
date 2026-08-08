'use client';

import React from 'react';
import { Candidate } from '../types/candidate';

interface FeedbackHeaderProps {
  candidate: Candidate;
  questionCount: number;
  coveredDaysCount: number;
}

export const FeedbackHeader: React.FC<FeedbackHeaderProps> = ({
  candidate,
  questionCount,
  coveredDaysCount,
}) => {
  return (
    <div className="navy-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-200 dark:border-white/[0.08]">
      <div className="space-y-1">
        <span className="tag-mono text-emerald-600 dark:text-emerald-400 font-semibold block">
          INTERVIEW COMPLETE
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slateText-primary tracking-tight">
          Your technical interview assessment
        </h2>
        <p className="text-slate-600 dark:text-slateText-secondary text-sm font-sans pt-1">
          Detailed evaluation report for {candidate.member.name} ({candidate.member.jobRole}).
        </p>
      </div>

      <div className="flex items-center gap-3 font-mono text-xs">
        <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#050816] border border-slate-200 dark:border-white/[0.08] text-center">
          <div className="text-xl font-bold text-slate-900 dark:text-slateText-primary">{questionCount}</div>
          <div className="text-[10px] text-slate-500 dark:text-slateText-muted uppercase">Questions</div>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#050816] border border-slate-200 dark:border-white/[0.08] text-center">
          <div className="text-xl font-bold text-slate-900 dark:text-slateText-primary">{coveredDaysCount}</div>
          <div className="text-[10px] text-slate-500 dark:text-slateText-muted uppercase">Days Covered</div>
        </div>
      </div>
    </div>
  );
};
