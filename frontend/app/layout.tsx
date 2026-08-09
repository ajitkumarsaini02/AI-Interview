import './globals.css';
import React from 'react';
import Link from 'next/link';
import { Bot, Terminal, ShieldCheck, Sparkles } from 'lucide-react';

import AISettingsModal from '@/components/AISettingsModal';

export const metadata = {
  title: 'AI Technical Interview Agent | 31-Day AI Cohort',
  description: 'Production-quality, multi-turn AI Technical Interviewer personalized to your cohort learning journey.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090b] text-zinc-100 min-h-screen flex flex-col font-sans antialiased selection:bg-indigo-500/30">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-md px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all shrink-0">
                <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-xs sm:text-sm tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                    AI INTERVIEW AGENT
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    COHORT v2.5
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 tracking-wide hidden xs:block">
                  Adaptive Multi-Turn Technical Assessor
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4 text-xs text-zinc-400 font-mono">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>31-Day AI Journey</span>
              </div>
              <AISettingsModal />
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[11px] sm:text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Active Agent</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
