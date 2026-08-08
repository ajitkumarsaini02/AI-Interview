'use client';

import React, { useState, useRef } from 'react';
import { ArrowRight, Loader2, CornerDownLeft } from 'lucide-react';

interface AnswerEditorProps {
  onSubmitAnswer: (answer: string) => Promise<void>;
  loading: boolean;
  completed: boolean;
}

export const AnswerEditor: React.FC<AnswerEditorProps> = ({
  onSubmitAnswer,
  loading,
  completed,
}) => {
  const [answerText, setAnswerText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!answerText.trim() || loading || completed) return;

    const textToSubmit = answerText;
    setAnswerText('');
    await onSubmitAnswer(textToSubmit);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="navy-card p-6 space-y-4">
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slateText-muted border-b border-slate-200 dark:border-white/[0.08] pb-3">
        <span className="uppercase tracking-wider font-semibold text-slate-700 dark:text-slateText-secondary">YOUR ANSWER</span>
        <span>Characters: {answerText.length} | Words: {wordCount}</span>
      </div>

      {completed ? (
        <div className="py-10 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-[#050816] rounded-xl border border-slate-200 dark:border-white/[0.08]">
          Interview Complete — View Final Structured Feedback Assessment Below
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            ref={textareaRef}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={7}
            placeholder="Type your technical response here... Explain architecture trade-offs, chunk size, vector indexing parameters, or step-by-step implementation logic."
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#050816] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slateText-primary text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:opacity-50 resize-none font-mono placeholder:text-slate-400 dark:placeholder:text-slateText-muted leading-relaxed min-h-[220px]"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slateText-muted font-mono">
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>⌘ Enter to submit</span>
            </div>

            <button
              type="submit"
              disabled={loading || !answerText.trim()}
              className="btn-gradient px-6 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 font-sans"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating response...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
