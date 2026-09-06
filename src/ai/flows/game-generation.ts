'use server';

/**
 * Educational game generation, via Groq.
 */

import {groqJson} from '@/ai/groq';
import {z} from 'zod';

const GenerateGameInputSchema = z.object({
  topic: z.string().describe('The educational topic for the game.'),
  gradeLevel: z.string().describe('The target grade level for the game.'),
});
export type GenerateGameInput = z.infer<typeof GenerateGameInputSchema>;

const GenerateGameOutputSchema = z.object({
  title: z.string().describe('The title of the educational game.'),
  description: z.string().describe('A brief description of the game and its learning objectives.'),
  rules: z.array(z.string()).describe('A list of rules on how to play the game.'),
  materials: z.array(z.string()).describe('A list of materials needed to play the game (if any).'),
});
export type GenerateGameOutput = z.infer<typeof GenerateGameOutputSchema>;

export async function generateGame(input: GenerateGameInput): Promise<GenerateGameOutput> {
  return groqJson({
    system:
      'You are a creative game designer specializing in educational games for children in low-resource classrooms.',
    prompt:
      `Create a fun, simple classroom game for topic "${input.topic}" and grade ${input.gradeLevel}. ` +
      'It must be easy to set up with everyday materials. Return JSON: {"title": string, "description": string, "rules": [string], "materials": [string]}',
    schema: GenerateGameOutputSchema,
  });
}
