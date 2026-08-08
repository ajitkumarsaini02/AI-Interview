'use client';

import React from 'react';
import { FinalFeedback } from '../types/interview';
import { Candidate } from '../types/candidate';
import { FeedbackHeader } from './FeedbackHeader';
import { ScoreBars } from './ScoreBars';
import { StrengthList } from './StrengthList';
import { GapList } from './GapList';
import { NextSteps } from './NextSteps';
import { RotateCcw } from 'lucide-react';

interface FeedbackDashboardProps {
  feedback: FinalFeedback;
  candidate: Candidate;
  questionCount: number;
  coveredDays: number[];
  onRestart: () => void;
}

export const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({
  feedback,
  candidate,
  questionCount,
  coveredDays,
  onRestart,
}) => {
  return (
    <section className="max-w-[1440px] mx-auto px-8 py-12 space-y-8">
      {/* Header Banner */}
      <FeedbackHeader
        candidate={candidate}
        questionCount={questionCount}
        coveredDaysCount={new Set(coveredDays).size}
      />

      {/* Overall Assessment Text Card */}
      <div className="navy-card p-6 space-y-3">
        <div className="text-xs font-mono uppercase text-slate-500 dark:text-slateText-muted tracking-wider font-semibold">
          OVERALL ASSESSMENT
        </div>
        <p className="text-slate-900 dark:text-slateText-primary text-sm sm:text-base leading-relaxed bg-slate-50 dark:bg-[#050816] p-6 rounded-xl border border-slate-200 dark:border-white/[0.06] font-sans">
          {feedback.summary}
        </p>
      </div>

      {/* 4 Score Cards */}
      <ScoreBars
        strengthsCount={feedback.strengths.length}
        gapsCount={feedback.gaps.length}
      />

      {/* 3 Column Grid: STRENGTHS | KNOWLEDGE GAPS | NEXT STEPS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StrengthList strengths={feedback.strengths} />
        <GapList gaps={feedback.gaps} />
        <NextSteps steps={feedback.next} />
      </div>

      {/* CTA Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onRestart}
          className="btn-gradient px-8 py-4 rounded-xl text-xs font-bold flex items-center gap-2 font-sans"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start Another Interview</span>
        </button>
      </div>
    </section>
  );
};
