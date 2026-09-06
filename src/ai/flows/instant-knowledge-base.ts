'use server';

/**
 * Instant knowledge base — simple explanations with analogies, via Groq.
 * (The original audio-question path used Gemini audio understanding; the
 * dashboard UI sends text questions, so text-in/text-out covers the demo.)
 */

import {groqJson} from '@/ai/groq';
import {z} from 'zod';

const ExplainConceptInputSchema = z
  .object({
    question: z.string().optional().describe('The complex question from the student as text.'),
    audioQuestionDataUri: z.string().optional().describe('Unused (audio path not wired in the UI).'),
    localLanguage: z.string().describe('The local language of the explanation.'),
  })
  .refine((d) => d.question || d.audioQuestionDataUri, {
    message: 'Either a text question or an audio recording must be provided.',
  });
export type ExplainConceptInput = z.infer<typeof ExplainConceptInputSchema>;

const ExplainConceptOutputSchema = z.object({
  explanation: z.string().describe('A simple, accurate explanation in the local language with easy analogies.'),
});
export type ExplainConceptOutput = z.infer<typeof ExplainConceptOutputSchema>;

export async function explainConcept(input: ExplainConceptInput): Promise<ExplainConceptOutput> {
  return groqJson({
    system:
      'You are an expert teacher specializing in explaining complex concepts to students in simple terms, with easy-to-understand analogies from everyday life.',
    prompt: `A student asked: "${input.question}". Write a simple, accurate explanation in ${input.localLanguage} (use its native script) with one everyday analogy. Return JSON: {"explanation": string}.`,
    schema: ExplainConceptOutputSchema,
  });
}
