import { z } from 'zod';
import { LLMProvider } from './provider.js';

export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  private model: any;

  constructor(apiKey: string) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } catch (err) {
      console.warn('Gemini SDK initialization warning:', err);
    }
  }

  async generateStructured<T>(prompt: string, systemPrompt: string, schema: z.ZodType<T>): Promise<T> {
    if (!this.model) {
      throw new Error('GeminiProvider not initialized');
    }

    const fullPrompt = `${systemPrompt}\n\n${prompt}\n\nReturn JSON ONLY matching the requested schema.`;
    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const text = result.response.text();
    const data = JSON.parse(text);
    return schema.parse(data);
  }
}
