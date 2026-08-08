import { z } from 'zod';
import { LLMProvider } from './provider.js';

export class GroqProvider implements LLMProvider {
  name = 'groq';
  private client: any;

  constructor(apiKey: string) {
    try {
      const { Groq } = require('groq-sdk');
      this.client = new Groq({ apiKey });
    } catch (err) {
      console.warn('Groq SDK initialization warning:', err);
    }
  }

  async generateStructured<T>(prompt: string, systemPrompt: string, schema: z.ZodType<T>): Promise<T> {
    if (!this.client) throw new Error('Groq client not initialized');

    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const data = JSON.parse(content);
    return schema.parse(data);
  }
}
