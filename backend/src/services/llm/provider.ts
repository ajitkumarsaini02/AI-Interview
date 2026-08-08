import { z } from 'zod';

export interface LLMProvider {
  name: string;
  generateStructured<T>(prompt: string, systemPrompt: string, schema: z.ZodType<T>): Promise<T>;
}
