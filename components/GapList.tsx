'use client';

import React from 'react';

interface GapListProps {
  gaps: string[];
}

export const GapList: React.FC<GapListProps> = ({ gaps }) => {
  const displayItems = gaps.length > 0
    ? gaps
    : ['RRF weighting', 'Reranking thresholds'];

  return (
    <div className="navy-card p-6 space-y-4">
      <div className="text-xs font-mono uppercase text-amber-600 dark:text-amber-400 font-bold tracking-wider">
        KNOWLEDGE GAPS
      </div>

      <ul className="space-y-2.5 text-xs text-slate-900 dark:text-slateText-primary font-sans">
        {displayItems.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#050816] border border-slate-200 dark:border-white/[0.06]">
            <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">⚠</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
