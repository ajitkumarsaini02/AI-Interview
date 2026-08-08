import { z } from 'zod';
import { LLMProvider } from './provider.js';

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private client: any;

  constructor(apiKey: string) {
    try {
      const OpenAI = require('openai');
      this.client = new OpenAI({ apiKey });
    } catch (err) {
      console.warn('OpenAI SDK initialization warning:', err);
    }
  }

  async generateStructured<T>(prompt: string, systemPrompt: string, schema: z.ZodType<T>): Promise<T> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
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
