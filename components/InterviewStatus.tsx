'use client';

import React from 'react';

interface InterviewStatusProps {
  loading: boolean;
  statusText?: string;
  adaptiveNote?: string;
}

export const InterviewStatus: React.FC<InterviewStatusProps> = ({
  loading,
  statusText,
  adaptiveNote,
}) => {
  const currentStatus = loading
    ? statusText || 'Evaluating response...'
    : 'Interviewer listening';

  const dotColor = loading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111A30] border border-white/[0.08] text-xs font-mono">
        <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
        <span className="text-slateText-primary font-semibold font-sans">{currentStatus}</span>
      </div>

      {adaptiveNote && !loading && (
        <span className="hidden sm:inline-block text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          {adaptiveNote}
        </span>
      )}
    </div>
  );
};
