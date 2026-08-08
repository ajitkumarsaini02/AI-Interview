'use client';

import React from 'react';
import { Bot, Sun, Moon, ArrowRight, RefreshCw, LayoutDashboard, User, Settings } from 'lucide-react';
import { Candidate } from '../types/candidate';

interface NavbarProps {
  activeCandidate?: Candidate | null;
  onReset?: () => void;
  onStartInterviewClick?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeCandidate,
  onReset,
  onStartInterviewClick,
  isDarkMode = true,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0B1020]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] h-[72px] transition-colors">
      <div className="max-w-[1440px] mx-auto px-8 h-full flex items-center justify-between">
        {/* Left Branding (Clickable Logo -> Returns to Home Page) */}
        <button
          onClick={onReset}
          className="flex items-center gap-3 text-left focus:outline-none group transition-opacity hover:opacity-90"
          title="Return to Home Page"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-glow-sm group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slateText-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                InterviewAI
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold tracking-wide uppercase">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slateText-muted hidden sm:block font-sans">
              Adaptive AI Technical Interviewer
            </p>
          </div>
        </button>

        {/* Center Navigation Tabs */}
        {!activeCandidate && (
          <nav className="hidden md:flex items-center gap-2 p-1.5 rounded-full bg-slate-100 dark:bg-[#0D1426] border border-slate-200 dark:border-white/[0.08] text-xs font-medium transition-colors">
            <a
              href="#dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-sm font-semibold transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </a>
            <a
              href="#candidates"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-600 dark:text-slateText-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <User className="w-3.5 h-3.5 text-slate-400 dark:text-slateText-muted" />
              <span>Candidate Roster</span>
            </a>
            <a
              href="#syllabus"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-600 dark:text-slateText-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400 dark:text-slateText-muted" />
              <span>Syllabus</span>
            </a>
          </nav>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#0D1426] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slateText-secondary hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all hover:scale-105"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {activeCandidate ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0D1426] border border-slate-200 dark:border-white/[0.08] text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-500 dark:text-slateText-muted font-mono text-[11px]">ACTIVE:</span>
                <span className="font-semibold text-slate-900 dark:text-slateText-primary">{activeCandidate.member.name}</span>
              </div>
              <button
                onClick={onReset}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-[#111A30] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slateText-secondary hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 dark:text-slateText-muted" />
                <span>Change Candidate</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onStartInterviewClick}
              className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <span>Select Candidate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
