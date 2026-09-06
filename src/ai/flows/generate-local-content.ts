'use server';

/**
 * Hyper-local content generation, powered by Groq (same key as the backend)
 * instead of Gemini/Genkit.
 */

import {groqJson} from '@/ai/groq';
import {z} from 'zod';

const GenerateLocalContentInputSchema = z.object({
  prompt: z.string().describe('A simple prompt for generating local content.'),
  language: z.string().describe('The target language for the content generation.'),
});
export type GenerateLocalContentInput = z.infer<typeof GenerateLocalContentInputSchema>;

const GenerateLocalContentOutputSchema = z.object({
  content: z.string().describe('The generated content in the specified language.'),
});
export type GenerateLocalContentOutput = z.infer<typeof GenerateLocalContentOutputSchema>;

export async function generateLocalContent(input: GenerateLocalContentInput): Promise<GenerateLocalContentOutput> {
  return groqJson({
    system:
      'You are an expert in generating hyper-local teaching content. Write natural, culturally relevant material in the requested language (Devanagari script where applicable).',
    prompt: `Generate teaching content in ${input.language} based on this prompt: "${input.prompt}". Return it as JSON with a single key "content" (markdown allowed: headings, bullet lists).`,
    schema: GenerateLocalContentOutputSchema,
  });
}
