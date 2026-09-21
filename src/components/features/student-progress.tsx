"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  loadRecords,
  summarize,
  type ProgressSummary,
} from "@/lib/progress-store";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Trophy,
  Flame,
  Gauge,
  RefreshCw,
} from "lucide-react";

const KIND_LABEL: Record<string, string> = {
  quiz: "Quiz",
  assessment: "Audio assessment",
  game: "Game",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function StudentProgress() {
  const [summary, setSummary] = React.useState<ProgressSummary | null>(null);

  React.useEffect(() => {
    setSummary(summarize(loadRecords()));
  }, []);

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <p className="text-muted-foreground">Loading progress...</p>
        </CardContent>
      </Card>
    );
  }

  const bestSubject =
    summary.subjects.length > 0
      ? summary.subjects.reduce((a, b) => (b.average > a.average ? b : a))
      : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="font-headline flex items-center gap-2">
                <Gauge className="w-5 h-5 text-violet-400" />
                Student Progress Dashboard
              </CardTitle>
              <CardDescription>
                Live view of a student's quiz, assessment and game results —
                quiz results you take are added automatically.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSummary(summarize(loadRecords()))}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        {/* Stat cards */}
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/10 p-4">
            <p className="text-xs text-muted-foreground">Average score</p>
            <p className="text-2xl font-semibold mt-1">{summary.averageScore}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              across {summary.totalAttempts} attempts
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <p className="text-xs text-muted-foreground">Best subject</p>
            <p className="text-2xl font-semibold mt-1">
              {bestSubject ? bestSubject.subject : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {bestSubject ? `${bestSubject.average}% avg` : "Take a quiz"}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <p className="text-xs text-muted-foreground">Practice time</p>
            <p className="text-2xl font-semibold mt-1">
              {summary.minutesPracticed}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                min
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              structured sessions
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" /> Day streak
            </p>
            <p className="text-2xl font-semibold mt-1">
              {summary.streakDays}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                days
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">keep it going</p>
          </div>
        </CardContent>
      </Card>

      {/* AI insight */}
      {summary.insight && (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardContent className="p-5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-violet-100 mb-1">
                AI study insight
              </p>
              <p className="text-sm leading-relaxed text-violet-200/80">
                {summary.insight}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Subject mastery */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">
              Subject mastery
            </CardTitle>
            <CardDescription>
              Average score per subject, latest on top
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.subjects.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No results yet — take a quiz or audio assessment.
              </p>
            )}
            {summary.subjects.map((s) => (
              <div key={s.subject}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">{s.subject}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {s.average}% · {s.attempts} attempts
                    </span>
                    {s.trend !== 0 && (
                      <Badge
                        variant={s.trend > 0 ? "default" : "destructive"}
                        className="gap-0.5"
                      >
                        {s.trend > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {s.trend > 0 ? "+" : ""}
                        {s.trend}%
                      </Badge>
                    )}
                  </span>
                </div>
                <Progress
                  value={s.average}
                  className="h-2"
                  indicatorClassName={
                    s.average >= 80
                      ? "bg-emerald-400"
                      : s.average >= 55
                        ? "bg-violet-400"
                        : "bg-rose-400"
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">
              Recent activity
            </CardTitle>
            <CardDescription>Latest attempts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recent.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing recorded yet.
              </p>
            )}
            {summary.recent.map((r) => {
              const pct = Math.round((r.score / r.total) * 100);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.subject} · {KIND_LABEL[r.kind] ?? r.kind} ·{" "}
                      {fmtDate(r.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {r.score}/{r.total}
                    </span>
                    <Badge
                      variant={pct >= 60 ? "default" : "destructive"}
                      className="gap-0.5"
                    >
                      {pct >= 60 ? (
                        <Trophy className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {pct}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}