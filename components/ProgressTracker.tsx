'use client';

import React from 'react';
import { HelpCircle, Calendar, Layers, ShieldCheck, Flame } from 'lucide-react';
import { DifficultyLevel } from '../types/interview';

interface ProgressTrackerProps {
  questionCount: number;
  coveredDays: number[];
  coveredTopics: string[];
  difficulty: DifficultyLevel;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  questionCount,
  coveredDays,
  coveredTopics,
  difficulty,
}) => {
  const uniqueDaysCount = new Set(coveredDays).size;

  // Percentage calculations
  const questionProgress = Math.min(100, Math.round((questionCount / 8) * 100));
  const daysProgress = Math.min(100, Math.round((uniqueDaysCount / 4) * 100));

  const difficultyColors: Record<DifficultyLevel, { bg: string; text: string; border: string }> = {
    entry: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    intermediate: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    advanced: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  };

  const style = difficultyColors[difficulty] || difficultyColors.intermediate;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Metric 1: Question Counter */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-mono flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              Questions Asked
            </span>
            <span className="font-bold text-slate-200 font-mono">{questionCount} / 8+ min</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-cyan-400 transition-all duration-500"
              style={{ width: `${questionProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 2: Unique Days Covered */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Curriculum Days
            </span>
            <span className="font-bold text-slate-200 font-mono">{uniqueDaysCount} / 4+ min</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${daysProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: Adaptive Difficulty Badge */}
        <div className="flex items-center justify-start md:justify-center">
          <div
            className={`px-3 py-1.5 rounded-xl ${style.bg} ${style.border} border text-xs font-mono font-semibold flex items-center gap-2`}
          >
            <Flame className="w-4 h-4 animate-bounce" />
            <span className="capitalize">Difficulty: {difficulty}</span>
          </div>
        </div>

        {/* Metric 4: Guardrail Requirement Status */}
        <div className="flex items-center justify-end text-xs text-slate-400 font-mono gap-2">
          {questionCount >= 8 && uniqueDaysCount >= 4 ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
              Interview Ready to Wrap
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-400 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <Layers className="w-4 h-4 text-indigo-400" />
              Conducting Turn {questionCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
