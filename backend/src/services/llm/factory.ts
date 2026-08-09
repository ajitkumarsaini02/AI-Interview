import { LLMProvider } from './provider.js';
import { DemoProvider } from './demoProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { OpenAIProvider } from './openaiProvider.js';
import { GroqProvider } from './groqProvider.js';

let currentProvider: LLMProvider | null = null;

export function getLLMProvider(customKey?: string, customProvider?: string): LLMProvider {
  const geminiKey = customKey || process.env.GEMINI_API_KEY;
  const openaiKey = customKey || process.env.OPENAI_API_KEY;
  const groqKey = customKey || process.env.GROQ_API_KEY;
  const providerName = (customProvider || process.env.LLM_PROVIDER || '').toLowerCase();

  if (geminiKey && (providerName === 'gemini' || !providerName || providerName === 'demo')) {
    try {
      return new GeminiProvider(geminiKey);
    } catch (err) {
      console.warn('Failed to initialize GeminiProvider:', err);
    }
  }

  if (openaiKey && (providerName === 'openai' || !providerName || providerName === 'demo')) {
    try {
      return new OpenAIProvider(openaiKey);
    } catch (err) {
      console.warn('Failed to initialize OpenAIProvider:', err);
    }
  }

  if (groqKey && (providerName === 'groq' || !providerName || providerName === 'demo')) {
    try {
      return new GroqProvider(groqKey);
    } catch (err) {
      console.warn('Failed to initialize GroqProvider:', err);
    }
  }

  return new DemoProvider();
}
