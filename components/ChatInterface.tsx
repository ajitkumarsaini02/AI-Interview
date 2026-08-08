'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Loader2, AlertCircle, CornerDownLeft } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: number;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  onClearError: () => void;
  completed: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  loading,
  error,
  onClearError,
  completed,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loading || completed) return;

    const messageText = inputMessage;
    setInputMessage('');
    await onSendMessage(messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const wordCount = inputMessage.trim() ? inputMessage.trim().split(/\s+/).length : 0;

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[650px] relative overflow-hidden">
      {/* Chat Workspace Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>AI Lead Technical Evaluator</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Agent Active
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Adaptive Technical Assessment Stream
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Evaluating answer & synthesizing question...</span>
          </div>
        )}
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => {
          const isInterviewer = msg.role === 'interviewer';

          return (
            <div
              key={msg.id || index}
              className={`flex items-start gap-4 ${isInterviewer ? '' : 'flex-row-reverse'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isInterviewer
                    ? 'bg-slate-900 border border-indigo-500/30 text-indigo-400'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isInterviewer ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-5 shadow-lg ${
                  isInterviewer
                    ? 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-slate-800/60 text-[11px] font-mono text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {isInterviewer ? 'AI Technical Lead' : 'Candidate Response'}
                  </span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator Pill in Stream */}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 rounded-tl-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs font-mono text-slate-400 ml-2">Analyzing technical depth...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="mx-6 mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-rose-400 hover:text-white font-mono underline ml-3 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Panel */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/90">
        {completed ? (
          <div className="text-center py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-mono flex items-center justify-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Interview Complete — View Structured Final Assessment Below</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Type your technical response here... (Explain architecture, trade-offs, code logic, or step-by-step reasoning)"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 resize-none placeholder:text-slate-500"
              />

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="absolute right-3 bottom-3 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md glow-indigo"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Submit</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Sub-bar Metadata & Hints */}
            <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 px-1">
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3 text-slate-400" />
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Cmd/Ctrl + Enter</kbd> to submit
              </span>
              <span>{wordCount} words | {inputMessage.length} chars</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
