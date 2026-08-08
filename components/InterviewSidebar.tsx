'use client';

import React from 'react';
import { Candidate } from '../types/candidate';
import { DifficultyLevel } from '../types/interview';
import { ProgressTimeline } from './ProgressTimeline';
import { CurriculumCoverage } from './CurriculumCoverage';

interface InterviewSidebarProps {
  candidate: Candidate;
  questionCount: number;
  coveredDays: number[];
  difficulty: DifficultyLevel;
}

export const InterviewSidebar: React.FC<InterviewSidebarProps> = ({
  candidate,
  questionCount,
  coveredDays,
  difficulty,
}) => {
  const nameParts = candidate.member.name.split(' ');
  const initials = nameParts.map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="navy-card p-6 space-y-6">
      {/* Candidate Profile Summary */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="w-10 h-10 rounded-xl bg-avatar-gradient flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
          {initials}
        </div>
        <div className="overflow-hidden">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slateText-primary truncate">{candidate.member.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slateText-muted font-sans truncate">{candidate.member.jobRole}</p>
        </div>
      </div>

      {/* Progress Timeline */}
      <ProgressTimeline currentQuestionCount={questionCount} />

      {/* Curriculum Coverage */}
      <CurriculumCoverage coveredDays={coveredDays} />

      {/* Difficulty Level Indicator */}
      <div className="pt-4 border-t border-slate-200 dark:border-white/[0.08] flex justify-between items-center text-xs font-mono">
        <span className="text-slate-500 dark:text-slateText-muted uppercase text-[10px]">DIFFICULTY</span>
        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111A30] border border-slate-200 dark:border-white/[0.08] text-purple-600 dark:text-purple-300 capitalize font-bold">
          {difficulty.toUpperCase()}
        </span>
      </div>
    </aside>
  );
};
