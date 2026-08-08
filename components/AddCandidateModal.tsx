'use client';

import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCandidateAdded: (newCandidate: any) => void;
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  onCandidateAdded,
}) => {
  const [name, setName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState('4');
  const [education, setEducation] = useState('B.S. Computer Science');
  const [focusArea, setFocusArea] = useState('Hybrid Search & Reranking');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !jobRole.trim()) {
      setError('Candidate Name and Job Role are required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          jobRole,
          yearsExperience,
          education,
          focusAreas: [focusArea],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create candidate profile');
      }

      const data = await res.json();
      onCandidateAdded(data.candidate);
      setName('');
      setJobRole('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating candidate profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="navy-card w-full max-w-lg p-6 space-y-6 relative shadow-glow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slateText-primary font-bold text-lg">
            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Add Candidate Profile</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#111A30] text-slate-500 dark:text-slateText-muted hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slateText-secondary font-medium">Candidate Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#050816] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slateText-primary text-xs focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slateText-secondary font-medium">Job Role</label>
            <input
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Senior AI Engineer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#050816] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slateText-primary text-xs focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slateText-secondary font-medium">Years Experience</label>
              <input
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                min="0"
                max="30"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#050816] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slateText-primary text-xs focus:border-blue-500/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slateText-secondary font-medium">Education</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g. M.S. Computer Science"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#050816] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slateText-primary text-xs focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slateText-secondary font-medium">Key Focus Area</label>
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              placeholder="e.g. Reranking & Vector Indexing"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#050816] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slateText-primary text-xs focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#111A30] text-slate-700 dark:text-slateText-secondary hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 font-sans"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding Profile...</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
