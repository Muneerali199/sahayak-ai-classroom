'use server';

/**
 * Reading assessment: Groq Whisper transcription + llama analysis.
 * (Audio input, so we transcribe with Groq's audio model instead of Gemini.)
 */

import {z} from 'zod';

const GROQ_URL = 'https://api.groq.com/openai/v1';

const AssessReadingInputSchema = z.object({
  textToRead: z.string().describe('The text that the student was supposed to read.'),
  audioRecordingDataUri: z
    .string()
    .describe("A data URI of the student's audio recording: 'data:<mimetype>;base64,<encoded_data>'."),
  gradeLevel: z.string().describe('The grade level of the student.'),
});
export type AssessReadingInput = z.infer<typeof AssessReadingInputSchema>;

const AssessReadingOutputSchema = z.object({
  transcribedText: z.string().describe("The transcription of the student's audio."),
  fluency: z.string().describe('An assessment of reading fluency (e.g., "Excellent", "Good", "Needs Improvement").'),
  accuracy: z.number().describe('The percentage of words read correctly.'),
  feedback: z.string().describe('Specific feedback for the student to help them improve.'),
  mispronouncedWords: z.array(z.string()).describe('A list of words that were mispronounced.'),
});
export type AssessReadingOutput = z.infer<typeof AssessReadingOutputSchema>;

function groqKey(): string {
  const k = process.env.GROQ_API_KEY;
  if (!k) throw new Error('GROQ_API_KEY is not set');
  return k;
}

async function transcribe(dataUri: string): Promise<string> {
  // data URI → Blob → Whisper
  const res = await fetch(dataUri);
  const blob = await res.blob();
  const form = new FormData();
  form.append('file', blob, 'reading.webm');
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'json');
  const r = await fetch(`${GROQ_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${groqKey()}`},
    body: form,
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Whisper error ${r.status}: ${t.slice(0, 200)}`);
  }
  const j = await r.json();
  return (j.text || '') as string;
}

export async function assessReading(input: AssessReadingInput): Promise<AssessReadingOutput> {
  // 1. Transcribe the reading
  const transcribedText = await transcribe(input.audioRecordingDataUri);

  // 2. Compare + assess with llama
  const res = await fetch(`${GROQ_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey()}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      temperature: 0.3,
      max_tokens: 1200,
      response_format: {type: 'json_object'},
      messages: [
        {
          role: 'user',
          content:
            `You are an expert reading coach. A grade-${input.gradeLevel} student read this text:\n` +
            `"${input.textToRead}"\n\nTheir transcription was:\n"${transcribedText}"\n\n` +
            'Compare them. Return ONLY JSON: {"transcribedText": string (the transcription above), ' +
            '"fluency": "Excellent"|"Good"|"Needs Improvement", "accuracy": number (percent of words read correctly), ' +
            '"feedback": string (kind, specific, for a child), "mispronouncedWords": [string]}',
        },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Groq error ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned no content');
  return AssessReadingOutputSchema.parse(JSON.parse(content));
}
