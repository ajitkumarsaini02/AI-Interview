'use client';

import React, { useState } from 'react';
import { Candidate } from '../types/candidate';
import { CandidateCard } from './CandidateCard';
import { AddCandidateModal } from './AddCandidateModal';
import { Search, UserPlus, Layers, Cpu, Server, Terminal, ShieldCheck, Activity, Brain } from 'lucide-react';

interface CandidateSelectorProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onDeleteCandidate?: (candidateId: string) => void;
  onCandidateAdded?: (candidate: Candidate) => void;
  loading: boolean;
}

export const CandidateSelector: React.FC<CandidateSelectorProps> = ({
  candidates,
  onSelectCandidate,
  onDeleteCandidate,
  onCandidateAdded,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.member.jobRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.member.education.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL' ||
      c.member.jobRole.toLowerCase().includes(roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  const cohortModules = [
    { name: 'Prompt Engineering', days: 'Days 1–4', pct: 100, topics: '4 topics', icon: Brain },
    { name: 'Vector DBs', days: 'Days 5–8', pct: 100, topics: '5 topics', icon: Layers },
    { name: 'RAG Architecture', days: 'Days 9–13', pct: 80, topics: '5 topics', icon: Cpu },
    { name: 'Agentic AI', days: 'Days 14–18', pct: 75, topics: '4 topics', icon: Server },
    { name: 'MCP Protocol', days: 'Days 19–21', pct: 60, topics: '3 topics', icon: Terminal },
    { name: 'AI Deployment', days: 'Days 22–25', pct: 50, topics: '4 topics', icon: ShieldCheck },
    { name: 'Production AI Systems', days: 'Days 26–31', pct: 40, topics: '6 topics', icon: Activity },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Candidate Selection Section */}
      <section id="candidates" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slateText-primary tracking-tight">
              Select Candidate Profile
            </h2>
            <p className="text-slate-600 dark:text-slateText-secondary text-sm mt-1 font-normal">
              Choose a candidate, add a new candidate, or start an adaptive technical interview.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slateText-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate or role..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#0D1426] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-slate-900 dark:text-slateText-primary placeholder:text-slate-400 dark:placeholder:text-slateText-muted focus:border-blue-500/50 transition-colors shadow-sm"
              />
            </div>

            {/* Add Candidate Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-glow-sm shrink-0 font-sans"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {['ALL', 'Data Engineer', 'AI Engineer', 'Backend', 'Analyst'].map((filter) => (
            <button
              key={filter}
              onClick={() => setRoleFilter(filter)}
              className={`px-4 py-2 rounded-full transition-all ${
                roleFilter === filter
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-glow-sm'
                  : 'bg-white dark:bg-[#0D1426] text-slate-600 dark:text-slateText-secondary hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              [ {filter} ]
            </button>
          ))}
        </div>

        {/* 3-Column Responsive Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-[20px] bg-slate-200 dark:bg-[#0D1426]/50 border border-slate-200 dark:border-white/[0.08] animate-pulse"></div>
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-16 navy-card space-y-3">
            <p className="text-slate-600 dark:text-slateText-secondary text-sm font-mono">No matching candidate profiles found.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-2 font-sans"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add First Candidate</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.member.id}
                candidate={candidate}
                onSelect={onSelectCandidate}
                onDelete={onDeleteCandidate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCandidateAdded={(newCand) => {
          if (onCandidateAdded) onCandidateAdded(newCand);
        }}
      />

      {/* 31-Day Cohort Syllabus Section */}
      <section id="syllabus" className="space-y-6 pt-8 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="tag-mono text-blue-600 dark:text-blue-400 font-semibold block mb-1">
              CURRICULUM ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slateText-primary tracking-tight">
              31-Day AI Cohort Syllabus
            </h2>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0D1426] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-slate-600 dark:text-slateText-secondary shadow-sm">
            6 / 7 Modules Completed
          </div>
        </div>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cohortModules.map((mod, idx) => (
            <div key={idx} className="navy-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#111A30] text-blue-600 dark:text-blue-400 flex items-center justify-center border border-slate-200 dark:border-white/[0.06]">
                  <mod.icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slateText-muted">{mod.days}</span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slateText-primary">{mod.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slateText-muted font-mono">{mod.topics}</p>
              </div>

              <div className="space-y-1 pt-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-500 dark:text-slateText-muted">
                  <span>Coverage</span>
                  <span className="text-slate-900 dark:text-slateText-primary font-bold">{mod.pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-navy-track overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    style={{ width: `${mod.pct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
