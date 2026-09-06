// Napkin AI visual generator — creates diagram PNGs for visual aids and
// worksheets. Same API used to build the OverSphere pitch deck.
// Docs: POST https://api.napkin.ai/v1/visual, poll /v1/visual/:id/status,
// download from generated_files[0].url (auth required, 30-min expiry).

const NAPKIN_API = "https://api.napkin.ai/v1/visual";

function napkinKey(): string {
  const k = process.env.NAPKIN_API_KEY;
  if (!k) throw new Error("NAPKIN_API_KEY is not set (add it to .env.local)");
  return k;
}

export function napkinAvailable(): boolean {
  return Boolean(process.env.NAPKIN_API_KEY);
}

interface NapkinFile {
  url: string;
  width: number;
  height: number;
}

async function napkinJson(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${NAPKIN_API}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${napkinKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "sahayak-dashboard/1.0",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Napkin API ${res.status} on ${path}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

export async function generateNapkinVisual(args: {
  content: string;
  context?: string;
  width?: number;
}): Promise<string> {
  // 1. create request
  const created = (await napkinJson("", {
    method: "POST",
    body: JSON.stringify({
      format: "png",
      content: args.content,
      language: "en-US",
      transparent_background: false,
      color_mode: "light",
      text_extraction_mode: "preserve",
      number_of_visuals: 1,
      width: args.width ?? 1200,
      ...(args.context ? { context: args.context } : {}),
    }),
  })) as { id: string; status: string };

  // 2. poll (visuals usually take 5-30s)
  const deadline = Date.now() + 150_000;
  let status: any = created;
  while (Date.now() < deadline) {
    if (status.status === 'completed') break;
    if (status.status === 'failed') {
      throw new Error(`Napkin generation failed: ${JSON.stringify(status).slice(0, 200)}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
    status = await napkinJson(`/${created.id}/status`);
  }
  if (status.status !== "completed") {
    throw new Error("Napkin generation timed out");
  }

  // 3. download the PNG and return as a data URI (the UI expects data URIs)
  const files = (status.generated_files || []) as NapkinFile[];
  if (!files.length) throw new Error("Napkin returned no files");
  const dl = await fetch(files[0].url, {
    headers: { Authorization: `Bearer ${napkinKey()}`, Accept: "image/png" },
  });
  if (!dl.ok) throw new Error(`Napkin download failed: ${dl.status}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  return `data:image/png;base64,${buf.toString("base64")}`;
}
