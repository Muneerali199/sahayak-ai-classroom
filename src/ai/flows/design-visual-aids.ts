'use server';

/**
 * Visual aid design, powered by Napkin AI — hand-drawn style diagrams a
 * teacher can copy onto a blackboard. (Was Gemini image generation; there
 * is no Gemini key, and Napkin diagrams look better for classroom charts.)
 */

import {generateNapkinVisual} from '@/ai/napkin';
import {z} from 'zod';

const DesignVisualAidInputSchema = z.object({
  description: z.string().describe('The concept that needs a visual aid.'),
});
export type DesignVisualAidInput = z.infer<typeof DesignVisualAidInputSchema>;

const DesignVisualAidOutputSchema = z.object({
  visualAidDataUri: z.string().describe('A data URI (image/png) of the generated visual aid.'),
});
export type DesignVisualAidOutput = z.infer<typeof DesignVisualAidOutputSchema>;

export async function designVisualAid(input: DesignVisualAidInput): Promise<DesignVisualAidOutput> {
  const visualAidDataUri = await generateNapkinVisual({
    content: input.description,
    context:
      'A clean, blackboard-style teaching diagram for an Indian classroom. Simple labels, large arrows, minimal text.',
    width: 1200,
  });
  return {visualAidDataUri};
}
