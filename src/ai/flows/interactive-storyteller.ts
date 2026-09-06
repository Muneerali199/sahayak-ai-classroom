'use server';

/**
 * Interactive storyteller: Groq writes a narrator + character story, the
 * Sahayak backend TTS speaks it (single warm voice), Napkin illustrates the
 * key scenes. (Was Gemini multi-speaker TTS + image gen; no Gemini key.)
 */

import {groqJson} from '@/ai/groq';
import {generateNapkinVisual} from '@/ai/napkin';
import {z} from 'zod';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8001';

const GenerateInteractiveStoryInputSchema = z.object({
  prompt: z.string().describe('The creative prompt for the story.'),
  gradeLevel: z.string().describe('The target grade level for the story.'),
  language: z.string().describe('The language for the story, explanation, and audio.'),
});
export type GenerateInteractiveStoryInput = z.infer<typeof GenerateInteractiveStoryInputSchema>;

const StoryStructureSchema = z.object({
  title: z.string().describe('The title of the story.'),
  scenes: z.array(
    z.object({
      sceneText: z.string().describe(
        'The text of the scene. Prefix dialogue with "Narrator:" or the character\'s name followed by a colon.'
      ),
      illustrationPrompt: z.string().optional().describe('An English prompt for a blackboard line drawing of the scene.'),
    })
  ),
});

const GenerateInteractiveStoryOutputSchema = z.object({
  title: z.string(),
  fullStoryText: z.string().describe('The complete story as a single text block for display.'),
  audioDataUri: z.string().describe('A data URI for the audio file of the story.'),
  illustrations: z
    .array(
      z.object({
        sceneText: z.string().describe('The text of the scene associated with this illustration.'),
        imageDataUri: z.string().describe('A data URI for the generated visual aid image.'),
      })
    )
    .describe('A list of illustrations for visually interesting scenes.'),
});
export type GenerateInteractiveStoryOutput = z.infer<typeof GenerateInteractiveStoryOutputSchema>;

export async function generateInteractiveStory(
  input: GenerateInteractiveStoryInput
): Promise<GenerateInteractiveStoryOutput> {
  // 1. Story structure via Groq
  const story = await groqJson({
    system: 'You are a creative storyteller for children. Keep it wholesome, warm and simple.',
    prompt:
      `Create a story for grade ${input.gradeLevel} in ${input.language} (native script) from this prompt: "${input.prompt}".\n` +
      'Rules: exactly one main character besides a Narrator; 4-6 scenes; every line prefixed "Narrator:" or "<CharacterName>:"; ' +
      'for 2-3 visually rich scenes include an English illustrationPrompt (simple blackboard line drawing). ' +
      'Return JSON: {"title": string, "scenes": [{"sceneText": string, "illustrationPrompt": string (optional)}]}',
    schema: StoryStructureSchema,
    maxTokens: 3000,
  });

  const {title, scenes} = story;
  const fullStoryText = scenes.map((s) => s.sceneText).join('\n\n');

  // 2. Audio via backend TTS + illustrations via Napkin (parallel)
  const langMap: Record<string, string> = {
    English: 'en', Hindi: 'hi', Marathi: 'mr', Telugu: 'te', Tamil: 'ta',
    Bengali: 'bn', Gujarati: 'gu', Kannada: 'kn', Malayalam: 'ml', Urdu: 'ur',
    Punjabi: 'pa', Odia: 'or',
  };
  const lang = langMap[input.language] || 'en';

  const [audioDataUri, illustrationResults] = await Promise.all([
    (async () => {
      // Best-effort: no local backend (deployed demo) → no audio, story still
      // renders; the UI hides narration controls when audioDataUri is empty.
      try {
        const res = await fetch(
          `${BACKEND}/api/tts?text=${encodeURIComponent(fullStoryText.slice(0, 2500))}&lang=${encodeURIComponent(lang)}`,
          {signal: AbortSignal.timeout(20000)}
        );
        if (!res.ok) return '';
        const buf = Buffer.from(await res.arrayBuffer());
        return `data:audio/wav;base64,${buf.toString('base64')}`;
      } catch {
        return '';
      }
    })(),
    Promise.all(
      scenes
        .filter((s) => s.illustrationPrompt)
        .slice(0, 3)
        .map(async (s) => {
          try {
            const imageDataUri = await generateNapkinVisual({
              content: s.illustrationPrompt!,
              context: `Storybook illustration for a children's story: ${title}`,
              width: 1100,
            });
            return {sceneText: s.sceneText, imageDataUri};
          } catch (e) {
            console.error('Illustration failed:', e);
            return {sceneText: s.sceneText, imageDataUri: ''};
          }
        })
    ),
  ]);

  const illustrations = illustrationResults.filter((r) => r.imageDataUri);
  return {title, fullStoryText, audioDataUri, illustrations};
}
