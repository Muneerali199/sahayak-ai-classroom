'use server';

/**
 * Audio-visual explanation: Groq writes the script, the Sahayak backend's
 * proven multilingual TTS (Piper/edge-tts) speaks it, and Napkin draws the
 * visual aid. (Was Gemini TTS + Gemini image gen; no Gemini key available.)
 */

import {groqJson} from '@/ai/groq';
import {generateNapkinVisual} from '@/ai/napkin';
import {z} from 'zod';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8001';

const GenerateAudioVisualExplanationInputSchema = z.object({
  topic: z.string().describe('The topic to explain.'),
  language: z.string().describe('The language for the explanation and audio.'),
});
export type GenerateAudioVisualExplanationInput = z.infer<
  typeof GenerateAudioVisualExplanationInputSchema
>;

const GenerateAudioVisualExplanationOutputSchema = z.object({
  explanation: z.string().describe('The text explanation of the topic.'),
  audioDataUri: z.string().describe("A data URI for the audio file: 'data:audio/wav;base64,<data>'."),
  visualAidDataUri: z.string().describe('A data URI for the visual aid image.'),
});
export type GenerateAudioVisualExplanationOutput = z.infer<
  typeof GenerateAudioVisualExplanationOutputSchema
>;

export async function generateAudioVisualExplanation(
  input: GenerateAudioVisualExplanationInput
): Promise<GenerateAudioVisualExplanationOutput> {
  // 1. Script via Groq
  const {explanation, imagePrompt} = await groqJson({
    system: 'You are an expert educator writing short spoken lessons for children.',
    prompt:
      `Write a clear, simple explanation of "${input.topic}" in ${input.language} (native script), under 120 words, ` +
      'ending with a one-line recap. Also propose an English image prompt for a simple blackboard diagram of it. ' +
      'Return JSON: {"explanation": string, "imagePrompt": string}',
    schema: z.object({explanation: z.string(), imagePrompt: z.string()}),
  });

  // 2. Audio via the backend's multilingual TTS + visual via Napkin (parallel)
  const langMap: Record<string, string> = {
    English: 'en', Hindi: 'hi', Marathi: 'mr', Telugu: 'te', Tamil: 'ta',
    Bengali: 'bn', Gujarati: 'gu', Kannada: 'kn', Malayalam: 'ml', Urdu: 'ur',
    Punjabi: 'pa', Odia: 'or',
  };
  const lang = langMap[input.language] || 'en';

  const [audioDataUri, visualAidDataUri] = await Promise.all([
    (async () => {
      const res = await fetch(
        `${BACKEND}/api/tts?text=${encodeURIComponent(explanation)}&lang=${encodeURIComponent(lang)}`
      );
      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return `data:audio/wav;base64,${buf.toString('base64')}`;
    })(),
    generateNapkinVisual({
      content: imagePrompt,
      context: `Blackboard-style teaching diagram for the topic: ${input.topic}.`,
      width: 1200,
    }).catch(() => ''),
  ]);

  return {explanation, audioDataUri, visualAidDataUri};
}
