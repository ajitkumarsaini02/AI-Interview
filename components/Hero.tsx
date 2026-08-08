'use client';

import React from 'react';
import { Play, Sparkles, Brain, Cpu, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onStartClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartClick }) => {
  return (
    <section id="dashboard" className="my-8">
      <div className="relative overflow-hidden rounded-[24px] bg-slate-100 dark:bg-[#0D1426] border border-slate-200 dark:border-white/[0.08] p-8 sm:p-12 shadow-sm dark:shadow-glow-md transition-colors">
        {/* Subtle radial glow background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          {/* Left Content */}
          <div className="space-y-4 max-w-2xl">
            {/* Small Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-[#111A30] border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>✦ Reasoning AI Interview Engine</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slateText-primary tracking-tight leading-[1.1]">
              Evaluate AI Engineering Understanding
            </h1>

            {/* Supporting Text */}
            <p className="text-base text-slate-600 dark:text-slateText-secondary leading-relaxed font-normal">
              InterviewAI conducts dynamic, multi-turn technical interviews tailored to candidate history across RAG, Vector Databases, Embeddings, Agents, and Guardrails.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500 dark:text-slateText-muted font-mono">
              <div className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Adaptive Probing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Real-Time Evaluation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Curriculum Guardrails</span>
              </div>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0">
            <button
              onClick={onStartClick}
              className="btn-gradient px-8 py-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 fill-current text-white" />
              <span>Start Technical Interview</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
