'use server';

/**
 * Differentiated worksheet creation. Photo understanding + multi-level
 * worksheets via Groq (llama-3.3 supports images), with a Napkin diagram
 * appended to each worksheet version for the demo.
 */

import {groqJson} from '@/ai/groq';
import {generateNapkinVisual, napkinAvailable} from '@/ai/napkin';
import {z} from 'zod';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';
const VISION_MODEL = 'qwen/qwen3.6-27b';

const CreateDifferentiatedMaterialsInputSchema = z.object({
  textbookPagePhotoDataUri: z.string().describe(
    "A photo of a textbook page, as a data URI: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  gradeLevels: z.string().describe('The grade levels for the worksheets, e.g. "1st, 2nd, and 3rd"'),
});
export type CreateDifferentiatedMaterialsInput = z.infer<typeof CreateDifferentiatedMaterialsInputSchema>;

const CreateDifferentiatedMaterialsOutputSchema = z.object({
  worksheetVersions: z.array(z.string()).describe('Multiple worksheet versions tailored to different grade levels.'),
});
export type CreateDifferentiatedMaterialsOutput = z.infer<typeof CreateDifferentiatedMaterialsOutputSchema>;

export async function createDifferentiatedMaterials(
  input: CreateDifferentiatedMaterialsInput
): Promise<CreateDifferentiatedMaterialsOutput> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set');

  // 1. Read the textbook photo (vision) and produce the worksheets.
  //    qwen3.6 is the only Groq model that accepts image input here; it does
  //    NOT support response_format=json_object alongside vision, so we ask for
  //    JSON in the prompt and strip any think block / code fence afterwards.
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${key}`},
    body: JSON.stringify({
      model: VISION_MODEL,
      temperature: 0.6,
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `You are an expert teacher creating differentiated worksheets for grade levels: ${input.gradeLevels}. ` +
                'Look at this textbook page and create one worksheet version per grade level — simpler language and fewer questions for younger grades. ' +
                'Return ONLY JSON with no commentary: {"worksheetVersions": [string, ...]} where each string is a complete worksheet in markdown.',
            },
            {type: 'image_url', image_url: {url: input.textbookPagePhotoDataUri}},
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Groq vision error ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  let content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned no content');
  // qwen likes to prepend a <think> block and wrap the JSON in ```json fences —
  // strip both so the schema parse below gets a bare JSON object.
  content = content.replace(/<\/?think>/g, '').replace(/```json|```/g, '');
  const parsed = CreateDifferentiatedMaterialsOutputSchema.parse(
    JSON.parse(content.slice(content.indexOf('{'), content.lastIndexOf('}') + 1))
  );

  // 2. Decorate each worksheet with a Napkin diagram (best-effort — a Napkin
  // hiccup must never fail the worksheet itself).
  if (napkinAvailable()) {
    parsed.worksheetVersions = await Promise.all(
      parsed.worksheetVersions.map(async (v, i) => {
        try {
          const diagram = await generateNapkinVisual({
            content: v.slice(0, 900),
            context: `Worksheet #${i + 1} for grade levels ${input.gradeLevels}. A clean classroom diagram.`,
            width: 1100,
          });
          return `${v}\n\n### 📊 Diagram\n\n![worksheet diagram](${diagram})`;
        } catch (e) {
          console.error('Napkin diagram failed for worksheet', i + 1, e);
          return v;
        }
      })
    );
  }

  return parsed;
}
