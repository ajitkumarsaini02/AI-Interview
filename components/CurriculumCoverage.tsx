'use client';

import React from 'react';

interface CurriculumCoverageProps {
  coveredDays: number[];
}

export const CurriculumCoverage: React.FC<CurriculumCoverageProps> = ({ coveredDays }) => {
  const coveredSet = new Set(coveredDays);

  const modules = [
    { title: 'Vector DB', days: [7, 10] },
    { title: 'RAG Architecture', days: [11, 15] },
    { title: 'Prompt Engineering', days: [1, 6] },
    { title: 'Agentic AI', days: [21, 22] },
    { title: 'MCP Protocol', days: [23, 24] },
    { title: 'Deployment & Ops', days: [28, 31] },
  ];

  return (
    <div className="space-y-2 font-mono">
      <div className="text-[10px] uppercase text-slate-500 dark:text-slateText-muted tracking-wider font-semibold">
        CURRICULUM COVERAGE
      </div>

      <div className="space-y-1.5 text-xs font-sans">
        {modules.map((mod, idx) => {
          const isCovered = mod.days.some((d) => coveredSet.has(d));

          return (
            <div
              key={idx}
              className={`flex items-center justify-between py-1.5 px-3 rounded-lg border ${
                isCovered
                  ? 'bg-blue-500/10 border-blue-500/20 text-slate-900 dark:text-slateText-primary font-medium'
                  : 'bg-slate-50 dark:bg-[#111A30]/60 border-slate-200 dark:border-white/[0.04] text-slate-400 dark:text-slateText-muted'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={isCovered ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slateText-muted'}>
                  {isCovered ? '✓' : '○'}
                </span>
                <span>{mod.title}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
