'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Key, Check, X, Bot, Shield, ExternalLink } from 'lucide-react';

export default function AISettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [savedProvider, setSavedProvider] = useState('gemini');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('ai_api_key') || '';
      const storedProv = localStorage.getItem('ai_provider') || 'gemini';
      setApiKey(storedKey);
      setSavedKey(storedKey);
      setProvider(storedProv);
      setSavedProvider(storedProv);
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      if (apiKey.trim()) {
        localStorage.setItem('ai_api_key', apiKey.trim());
        localStorage.setItem('ai_provider', provider);
        setSavedKey(apiKey.trim());
        setSavedProvider(provider);
      } else {
        localStorage.removeItem('ai_api_key');
        localStorage.setItem('ai_provider', 'demo');
        setSavedKey('');
        setSavedProvider('demo');
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai_api_key');
      localStorage.setItem('ai_provider', 'demo');
      setApiKey('');
      setSavedKey('');
      setSavedProvider('demo');
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Trigger Button in Header */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-mono transition-all shadow-sm ${
          savedKey
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
            : 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
        }"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{savedKey ? `Real AI (${savedProvider.toUpperCase()})` : 'AI Config / API Key'}</span>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">AI Engine Settings</h3>
                <p className="text-xs text-zinc-400">Connect Google Gemini, OpenAI, or Groq for live AI answer analysis</p>
              </div>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Select AI Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="gemini">Google Gemini (Recommended - Free API Key)</option>
                  <option value="openai">OpenAI (GPT-4o Mini)</option>
                  <option value="groq">Groq (Llama 3.3 70B Fast)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    API Key
                  </label>
                  {provider === 'gemini' && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Get Free Gemini Key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder={
                      provider === 'gemini' ? 'AIzaSy...' : provider === 'openai' ? 'sk-...' : 'gsk_...'
                    }
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono pr-10"
                  />
                  <Key className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Keys are stored safely in your browser session (`localStorage`) and used for evaluation requests.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                onClick={handleClear}
                className="text-xs text-rose-400 hover:underline px-2 py-1"
              >
                Clear Key
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                >
                  {isSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isSaved ? 'Saved!' : 'Save & Connect AI'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
