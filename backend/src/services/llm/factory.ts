import { LLMProvider } from './provider.js';
import { DemoProvider } from './demoProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { OpenAIProvider } from './openaiProvider.js';
import { GroqProvider } from './groqProvider.js';

let currentProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (currentProvider) return currentProvider;

  const isDemo = (process.env.DEMO_MODE || '').toLowerCase() === 'true' || process.env.DEMO_MODE === '1';
  const providerName = (process.env.LLM_PROVIDER || '').toLowerCase();

  if (!isDemo) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if ((providerName === 'gemini' || !providerName) && geminiKey) {
      currentProvider = new GeminiProvider(geminiKey);
      return currentProvider;
    }

    if ((providerName === 'openai' || !providerName) && openaiKey) {
      currentProvider = new OpenAIProvider(openaiKey);
      return currentProvider;
    }

    if ((providerName === 'groq' || !providerName) && groqKey) {
      currentProvider = new GroqProvider(groqKey);
      return currentProvider;
    }
  }

  currentProvider = new DemoProvider();
  return currentProvider;
}
