'use client';

import React from 'react';
import { CurriculumData } from '../types/curriculum';
import { BookOpen, CheckCircle, Target, Lock } from 'lucide-react';

interface CurriculumMatrixProps {
  curriculum: CurriculumData | null;
  coveredDays: number[];
  currentDayNumber?: number;
}

export const CurriculumMatrix: React.FC<CurriculumMatrixProps> = ({
  curriculum,
  coveredDays,
  currentDayNumber,
}) => {
  if (!curriculum) return null;

  const coveredSet = new Set(coveredDays);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            Curriculum Coverage Matrix
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {coveredSet.size} / 31 Days Evaluated
        </span>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {curriculum.modules.map((mod) => {
          const moduleDays = curriculum.days.filter(
            (d) => d.day >= mod.days[0] && d.day <= mod.days[1]
          );

          return (
            <div key={mod.n} className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <div className="text-xs font-mono font-semibold text-slate-300 mb-2">
                Module {mod.n}: {mod.title}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {moduleDays.map((d) => {
                  const isCovered = coveredSet.has(d.day);
                  const isCurrent = currentDayNumber === d.day;

                  return (
                    <div
                      key={d.day}
                      className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 glow-cyan font-medium'
                          : isCovered
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                          : 'bg-slate-900/60 border border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isCurrent ? (
                          <Target className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                        ) : isCovered ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <span className="truncate">
                          Day {d.day}: {d.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
