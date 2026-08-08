'use client';

import React from 'react';
import { Candidate } from '../types/candidate';
import { ArrowRight, AlertTriangle, Trash2 } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (candidate: Candidate) => void;
  onDelete?: (candidateId: string) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onSelect, onDelete }) => {
  const nameParts = candidate.member.name.split(' ');
  const initials = nameParts.map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const completedCount =
    candidate.missions?.filter((m) => m.passed).length ||
    candidate.signals?.missionsCompleted ||
    0;

  const totalDays = 31;
  const progressRatio = Math.min(1, completedCount / totalDays);
  const progressPercentage = Math.round(progressRatio * 100);

  const maturity = candidate.member.yearsExperience >= 5
    ? 'Advanced'
    : candidate.member.yearsExperience >= 2
    ? 'Intermediate'
    : 'Entry Level';

  const firstTryPassed = candidate.missions?.filter((m) => m.passed && (!m.attempts || m.attempts <= 1)).length || 0;
  const avgScoreNum = candidate.missions && candidate.missions.length > 0
    ? Math.min(9.5, Math.max(6.0, 6.0 + (firstTryPassed / candidate.missions.length) * 3.5)).toFixed(1)
    : '7.5';

  const highAttemptMissions = candidate.missions?.filter((m) => m.attempts && m.attempts >= 3) || [];
  const skippedMissions = candidate.missions?.filter((m) => m.skipped) || [];

  const rawFocusAreas = [
    ...highAttemptMissions.map((m) => m.title.replace(/^Day \d+: /, '')),
    ...skippedMissions.map((m) => m.title.replace(/^Day \d+: /, '')),
  ];

  const focusAreas = Array.from(new Set(rawFocusAreas)).slice(0, 3);
  const defaultFocusAreas =
    focusAreas.length > 0 ? focusAreas : ['Chunking strategy', 'Hybrid Search', 'Reranking'];

  const email = `${candidate.member.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

  return (
    <div className="navy-card p-6 flex flex-col justify-between space-y-5 relative group">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-avatar-gradient flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
              {initials}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slateText-primary">{candidate.member.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slateText-muted font-sans">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-wider uppercase">
              ACTIVE
            </span>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(candidate.member.id);
                }}
                title="Delete candidate profile"
                className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 flex items-center justify-center transition-colors opacity-80 hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-slateText-muted font-sans">Curriculum Progress</span>
            <span className="text-slate-900 dark:text-slateText-primary font-bold">{progressPercentage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-navy-track overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-700 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Boxes */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="navy-elevated p-3 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slateText-muted uppercase tracking-wider block">
              MATURITY
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-slateText-primary truncate">{maturity}</div>
          </div>

          <div className="navy-elevated p-3 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slateText-muted uppercase tracking-wider block">
              AVG SCORE
            </span>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{avgScoreNum} <span className="text-[10px] text-slate-400 dark:text-slateText-muted font-normal">/ 10</span></div>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="space-y-2 pt-1 font-mono text-xs">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-sans font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Focus areas</span>
          </div>

          <div className="flex flex-wrap gap-1.5 font-sans">
            {defaultFocusAreas.map((area, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#111A30] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slateText-secondary text-xs font-mono"
              >
                [{area}]
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Select Action Button */}
      <div className="pt-2">
        <button
          onClick={() => onSelect(candidate)}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#111A30] hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 text-slate-900 dark:text-slateText-primary hover:text-white border border-slate-200 dark:border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm font-sans"
        >
          <span>Select Candidate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
