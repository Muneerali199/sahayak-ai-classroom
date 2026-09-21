"use client";

// Lightweight local progress store backing the Student Progress Dashboard.
// Quiz runs and audio assessments write records here; the dashboard reads
// and aggregates them (subject mastery, trends, streaks, AI-style insight).

export type ProgressRecord = {
  id: string;
  subject: string;
  kind: "quiz" | "assessment" | "game";
  score: number;
  total: number;
  date: string; // ISO
  label: string;
};

const KEY = "sahayak-progress-records";

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// Seeded so the demo dashboard tells a story on first open; real quiz /
// assessment results are appended on top of it.
function seed(): ProgressRecord[] {
  return [
    { id: uid(), subject: "Mathematics", kind: "quiz", score: 4, total: 10, date: daysAgo(28), label: "Fractions basics" },
    { id: uid(), subject: "Science", kind: "quiz", score: 7, total: 10, date: daysAgo(25), label: "Photosynthesis" },
    { id: uid(), subject: "Mathematics", kind: "assessment", score: 5, total: 10, date: daysAgo(21), label: "Oral reading: number line" },
    { id: uid(), subject: "English", kind: "game", score: 8, total: 10, date: daysAgo(19), label: "Vocabulary word race" },
    { id: uid(), subject: "Science", kind: "assessment", score: 8, total: 10, date: daysAgo(14), label: "Water cycle narration" },
    { id: uid(), subject: "Mathematics", kind: "quiz", score: 7, total: 10, date: daysAgo(11), label: "Decimals" },
    { id: uid(), subject: "Hindi", kind: "quiz", score: 9, total: 10, date: daysAgo(7), label: "संज्ञा और सर्वनाम" },
    { id: uid(), subject: "Mathematics", kind: "assessment", score: 8, total: 10, date: daysAgo(4), label: "Word problems" },
    { id: uid(), subject: "Science", kind: "quiz", score: 9, total: 10, date: daysAgo(2), label: "Plant life cycle" },
  ];
}

export function loadRecords(): ProgressRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as ProgressRecord[];
    return Array.isArray(parsed) ? parsed : seed();
  } catch {
    return seed();
  }
}

export function recordResult(rec: Omit<ProgressRecord, "id" | "date">): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadRecords();
    all.push({ ...rec, id: uid(), date: new Date().toISOString() });
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // storage unavailable — progress dashboard falls back to seeds
  }
}

export type SubjectStat = {
  subject: string;
  attempts: number;
  average: number; // 0-100
  trend: number; // percentage-point change, recent half vs earlier half
};

export type ProgressSummary = {
  totalAttempts: number;
  averageScore: number; // 0-100
  minutesPracticed: number;
  streakDays: number;
  subjects: SubjectStat[];
  recent: ProgressRecord[];
  focusSubject: SubjectStat | null;
  strongestSubject: SubjectStat | null;
  insight: string;
};

export function summarize(records: ProgressRecord[]): ProgressSummary {
  const totalAttempts = records.length;
  const pct = (r: ProgressRecord) => (r.total > 0 ? (r.score / r.total) * 100 : 0);
  const averageScore = totalAttempts
    ? Math.round(records.reduce((s, r) => s + pct(r), 0) / totalAttempts)
    : 0;

  const bySubject = new Map<string, ProgressRecord[]>();
  for (const r of records) {
    const list = bySubject.get(r.subject) ?? [];
    list.push(r);
    bySubject.set(r.subject, list);
  }

  const subjects: SubjectStat[] = Array.from(bySubject.entries()).map(([subject, list]) => {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const average = Math.round(sorted.reduce((s, r) => s + pct(r), 0) / sorted.length);
    let trend = 0;
    if (sorted.length >= 3) {
      const half = Math.floor(sorted.length / 2);
      const early = sorted.slice(0, half);
      const recent = sorted.slice(half);
      const avg = (xs: ProgressRecord[]) => xs.reduce((s, r) => s + pct(r), 0) / xs.length;
      trend = Math.round(avg(recent) - avg(early));
    }
    return { subject, attempts: sorted.length, average, trend };
  });

  subjects.sort((a, b) => b.average - a.average);

  const uniqueDays = new Set(records.map((r) => r.date.slice(0, 10)));
  let streakDays = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (uniqueDays.has(d.toISOString().slice(0, 10))) streakDays++;
    else if (i > 0) break;
  }

  const recent = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const focusSubject = subjects.length > 1 ? [...subjects].sort((a, b) => a.average - b.average)[0] : null;
  const strongestSubject = subjects[0] ?? null;

  // Deterministic "AI-style" recommendation from the analytics above.
  const parts: string[] = [];
  if (strongestSubject) {
    parts.push(`${strongestSubject.subject} is the strongest area (${strongestSubject.average}% average) — keep it warm with a short weekly recap quiz.`);
  }
  if (focusSubject && focusSubject !== strongestSubject) {
    parts.push(`${focusSubject.subject} needs the most attention (${focusSubject.average}% average${focusSubject.trend !== 0 ? `, ${focusSubject.trend > 0 ? "up" : "down"} ${Math.abs(focusSubject.trend)} pts` : ""}) — try differentiated worksheets at the current level before moving on.`);
  }
  const improving = subjects.filter((s) => s.trend > 0).sort((a, b) => b.trend - a.trend)[0];
  if (improving) parts.push(`Fastest improvement: ${improving.subject} (+${improving.trend} pts).`);
  if (averageScore >= 80) parts.push("Overall mastery is strong — introduce harder application questions.");
  else if (averageScore >= 60) parts.push("Overall progress is steady — mix in audio assessments to check understanding.");
  else if (totalAttempts > 0) parts.push("Scores suggest revisiting fundamentals with visual aids and the interactive storyteller.");

  return {
    totalAttempts,
    averageScore,
    minutesPracticed: totalAttempts * 8,
    streakDays,
    subjects,
    recent,
    focusSubject,
    strongestSubject,
    insight: parts.join(" ") || "Take a quiz or an audio assessment to start building this student's progress profile.",
  };
}
