// Groq-backed generation for all dashboard flows. Replaces the Gemini/
// Genkit dependency (no GEMINI_API_KEY available) with the same Groq key
// the backend already uses. Exposes a tiny structured-output helper that
// mimics what `ai.definePrompt` + schema gave us.
import { z } from "zod";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

function groqKey(): string {
  const k = process.env.GROQ_API_KEY;
  if (!k) throw new Error("GROQ_API_KEY is not set (add it to .env.local)");
  return k;
}

export function groqAvailable(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function groqJson<T>(args: {
  system?: string;
  prompt: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const { system, prompt, schema } = args;
  const body = {
    model: MODEL,
    temperature: 0.7,
    max_tokens: args.maxTokens ?? 4096,
    response_format: { type: "json_object" as const },
    messages: [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      {
        role: "user" as const,
        content:
          `${prompt}\n\nReturn ONLY a JSON object matching this shape: ` +
          `${JSON.stringify(describeSchema(schema))}`,
      },
    ],
  };

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no content");
  const parsed = JSON.parse(content);
  return schema.parse(parsed);
}

// Crude JSON shape description for the prompt (zod-to-JSON-schema is not a
// dependency here; the model just needs the keys).
function describeSchema(schema: z.ZodTypeAny): unknown {
  if (schema instanceof z.ZodObject) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(schema.shape)) {
      out[k] = describeSchema(v as z.ZodTypeAny);
    }
    return out;
  }
  if (schema instanceof z.ZodArray) {
    return [describeSchema(schema.element)];
  }
  if (schema instanceof z.ZodString) return "string";
  if (schema instanceof z.ZodNumber) return "number";
  if (schema instanceof z.ZodEnum) return schema.options;
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return describeSchema(schema.unwrap());
  }
  return "any";
}
