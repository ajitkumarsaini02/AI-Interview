'use client';

import React from 'react';

interface ProgressTimelineProps {
  currentQuestionCount: number;
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ currentQuestionCount }) => {
  const steps = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-2 font-mono">
      <div className="text-[10px] uppercase text-slate-500 dark:text-slateText-muted tracking-wider font-semibold">
        INTERVIEW PROGRESS
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {steps.map((step) => {
          const isCurrent = step === currentQuestionCount;
          const isDone = step < currentQuestionCount;

          return (
            <div
              key={step}
              className={`p-2 rounded-xl text-center font-mono font-bold transition-all ${
                isCurrent
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glow-sm scale-105'
                  : isDone
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-100 dark:bg-[#111A30] text-slate-400 dark:text-slateText-muted border border-slate-200 dark:border-white/[0.04]'
              }`}
            >
              {step === 8 ? '08+' : `0${step}`}
            </div>
          );
        })}
      </div>
    </div>
  );
};
