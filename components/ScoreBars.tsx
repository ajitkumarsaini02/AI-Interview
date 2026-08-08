'use client';

import React from 'react';

interface ScoreBarsProps {
  strengthsCount: number;
  gapsCount: number;
}

export const ScoreBars: React.FC<ScoreBarsProps> = ({ strengthsCount, gapsCount }) => {
  const baseRatio = Math.max(0.65, Math.min(0.92, (strengthsCount + 1) / Math.max(1, strengthsCount + gapsCount + 1)));

  const scoreCards = [
    { label: 'Technical Depth', score: Math.min(9.5, Math.max(7.5, (baseRatio * 9.2))).toFixed(1) },
    { label: 'Reasoning', score: Math.min(9.8, Math.max(7.8, (baseRatio * 9.0 + 0.4))).toFixed(1) },
    { label: 'Implementation', score: Math.max(6.8, (baseRatio * 8.6)).toFixed(1) },
    { label: 'System Design', score: Math.min(9.4, Math.max(7.5, (baseRatio * 9.1))).toFixed(1) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {scoreCards.map((card, idx) => {
        const pct = Math.round((parseFloat(card.score) / 10) * 100);

        return (
          <div key={idx} className="navy-card p-5 space-y-2">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slateText-muted uppercase tracking-wider block font-semibold">
              {card.label}
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slateText-primary">
              {card.score} <span className="text-xs text-slate-400 dark:text-slateText-muted font-normal">/ 10</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-navy-track overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-700 rounded-full"
                style={{ width: `${pct}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
