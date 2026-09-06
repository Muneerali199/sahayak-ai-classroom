"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  AudioLines,
  BrainCircuit,
  CalendarPlus,
  CheckCircle,
  Gamepad2,
  Languages,
  MessageCircle,
  MonitorPlay,
  Paintbrush,
  Play,
  Presentation,
  Rabbit,
  Radio,
  Signal,
  Sparkles,
  Star,
  UsersRound,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons";

// Scroll-reveal wrapper
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [seen, setSeen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setTimeout(() => setSeen(true), delay * 90);
      },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const usps = [
  {
    n: "01",
    icon: <Signal className="w-5 h-5" />,
    title: "Floor Manager",
    description:
      "A live state machine tracks who owns the conversation. While the teacher speaks, the AI is physically gated — it cannot interrupt. A visible badge shows the floor state in real time.",
  },
  {
    n: "02",
    icon: <BrainCircuit className="w-5 h-5" />,
    title: "Gap Radar",
    description:
      "Every confused sentence is clustered by concept. When two or more students struggle with the same idea, the AI queues a simpler explanation for the next open-floor moment.",
  },
  {
    n: "03",
    icon: <Volume2 className="w-5 h-5" />,
    title: "Whisper Tutor",
    description:
      "One student stuck while the teacher is mid-sentence? The AI sends a simpler explanation to that student's screen only — private, silent, and instant.",
  },
];

const powers = [
  { icon: <Languages className="w-4 h-4" />, title: "Localized Content", description: "Lessons in Hindi, Marathi, Tamil & 20+ languages" },
  { icon: <UsersRound className="w-4 h-4" />, title: "Differentiated Materials", description: "Textbook photo → worksheets per grade level" },
  { icon: <BrainCircuit className="w-4 h-4" />, title: "Instant Knowledge Base", description: "Any concept, explained at the right level" },
  { icon: <Paintbrush className="w-4 h-4" />, title: "Visual Aid Design", description: "Blackboard-ready diagrams from a prompt" },
  { icon: <CalendarPlus className="w-4 h-4" />, title: "Weekly Lesson Planner", description: "A full Monday–Sunday plan in seconds" },
  { icon: <AudioLines className="w-4 h-4" />, title: "Audio Assessments", description: "Hear a student read → fluency & accuracy report" },
  { icon: <Gamepad2 className="w-4 h-4" />, title: "Game Generation", description: "Classroom games from any lesson topic" },
  { icon: <Presentation className="w-4 h-4" />, title: "Audio-Visual Explanations", description: "Spoken lesson + custom visual, together" },
  { icon: <Rabbit className="w-4 h-4" />, title: "Interactive Storyteller", description: "Stories with character voices & illustrations" },
];

const indiaPoints = [
  "20+ Indian languages, including Hinglish & Tamil-English code-switching",
  "Culturally relevant examples — cricket, mangoes, festivals",
  "Neural voices for Hindi, Marathi, Telugu, Malayalam & more",
  "Works on the school's existing laptops and phones",
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Primary School Teacher",
    content:
      "Sahayak sits in my class like a second teacher. It waited for a pause, then explained fractions to Rahul in Hindi — privately. He smiled. I kept teaching.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b4c6?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Rajesh Kumar",
    role: "Mathematics Teacher",
    content:
      "The visual aids and differentiated worksheets save me hours. I photographed one textbook page and got three grade-level versions with diagrams.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Anita Desai",
    role: "English Teacher",
    content:
      "Finally, an AI that understands the Indian classroom. It speaks when it should, stays silent when it must, and whispers to the child who needs help.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
];

const team = [
  { name: "Muneer Ali", role: "Full Stack & AI" },
  { name: "Teena Goswami", role: "Backend & Voice" },
  { name: "Manya", role: "UI/UX Design" },
  { name: "Khushi", role: "Content & QA" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0714] text-white overflow-x-hidden selection:bg-violet-500/40">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.07] bg-[#0B0714]/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Logo className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Sahayak</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/70 mt-0.5">
              Live
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#powers" className="hover:text-white transition-colors">Powers</a>
            <a href="#classroom" className="hover:text-white transition-colors">Live Classroom</a>
            <a href="#india" className="hover:text-white transition-colors">India</a>
            <a href="#team" className="hover:text-white transition-colors">Team</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-white text-[#0B0714] hover:bg-violet-100 font-semibold border-0">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero: real classroom footage ─────────────────── */}
        <section className="relative min-h-[92vh] flex items-end overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/videos/hero-classroom-poster.jpg"
          >
            <source src="/videos/hero-classroom.mp4" type="video/mp4" />
          </video>
          {/* cinematic grade: dark base + violet wash */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0714] via-[#0B0714]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0714] via-transparent to-[#0B0714]/60" />
          <div className="absolute inset-0 bg-violet-900/20 mix-blend-multiply" />

          <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-40 w-full">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300 mb-6">
                Multi-agent voice AI · Indian classrooms
              </p>
            </Reveal>
            <Reveal delay={1}>
              <h1 className="font-bold tracking-tight text-5xl md:text-7xl leading-[1.04] max-w-3xl">
                The AI that sits
                <br />
                next to you
                <br />
                <span className="text-violet-400">in class.</span>
              </h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="mt-8 text-lg text-white/70 max-w-xl leading-relaxed">
                Sahayak listens to your live classroom, waits for the right
                moment, and helps students — spoken out loud, or whispered
                privately to one child&apos;s screen. It never interrupts you.
              </p>
            </Reveal>
            <Reveal delay={3} className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/login">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-500 border-0 text-base px-7 py-6 font-semibold shadow-xl shadow-violet-900/40">
                  Start Teaching Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#classroom">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 backdrop-blur-md text-base px-7 py-6">
                  <Play className="mr-2 h-4 w-4" />
                  Watch it work
                </Button>
              </a>
            </Reveal>

            <Reveal delay={4}>
              <div className="mt-16 flex flex-wrap gap-x-10 gap-y-3 text-sm text-white/50">
                <span><strong className="text-white font-semibold">9</strong> AI agents in every class</span>
                <span><strong className="text-white font-semibold">20+</strong> Indian languages</span>
                <span><strong className="text-white font-semibold">0</strong> interruptions of the teacher</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── USP: three systems ───────────────────────────── */}
        <section className="relative border-t border-white/[0.07]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300 mb-4">
                What no competitor has
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Classroom manners,
                <br />
                built in.
              </h2>
              <p className="mt-5 text-white/60 text-lg leading-relaxed">
                Three systems working together so the AI behaves like a
                respectful co-teacher — not a chatbot that talks over everyone.
              </p>
            </Reveal>

            <div className="mt-16 grid md:grid-cols-3 gap-px bg-white/[0.07] rounded-2xl overflow-hidden border border-white/[0.07]">
              {usps.map((u, i) => (
                <Reveal key={u.n} delay={i} className="bg-[#100A1E]">
                  <div className="p-8 h-full hover:bg-[#150E27] transition-colors">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-400/20 text-violet-300 flex items-center justify-center">
                        {u.icon}
                      </div>
                      <span className="text-sm font-mono text-violet-300/40">{u.n}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{u.title}</h3>
                    <p className="text-white/55 leading-relaxed text-[15px]">{u.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live classroom: real screenshot ──────────────── */}
        <section id="classroom" className="relative border-t border-white/[0.07] bg-[#0D0818]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="grid md:grid-cols-12 gap-12 items-center">
              <Reveal className="md:col-span-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300 mb-4">
                  Live classroom
                </p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                  Watch it wait.
                  <br />
                  Watch it help.
                </h2>
                <p className="mt-5 text-white/60 text-lg leading-relaxed">
                  The teacher teaches. A student asks &ldquo;explain
              photosynthesis&rdquo; — and Sahayak answers out loud, in a human
              voice, on the same audio channel. The lesson context updates
              itself.
                </p>
                <ul className="mt-8 space-y-3 text-[15px]">
                  {[
                    "Speaks on the Agora audio channel like a real co-teacher",
                    "Turn-taking badge — students see when the AI may talk",
                    "Agent swarm visible live: context, gap radar, quizmaster",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-white/70">
                      <CheckCircle className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="/classroom">
                  <Button size="lg" className="mt-10 bg-violet-600 hover:bg-violet-500 border-0 font-semibold px-7 py-6">
                    Try the Live Classroom
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </Reveal>

              <Reveal delay={1} className="md:col-span-7">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <Image
                    src="/images/classroom-live.png"
                    alt="Sahayak live classroom — AI answering a photosynthesis question"
                    width={1792}
                    height={1120}
                    className="w-full h-auto"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0714]/50 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 rounded-full bg-violet-600/90 px-3 py-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      AI SPEAKING
                    </span>
                    <span className="rounded-full bg-black/60 backdrop-blur px-3 py-1 text-white/80 border border-white/10">
                      real session · localhost
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Demo video strip */}
            <Reveal className="mt-20">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#100A1E]">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
                  <span className="text-sm font-medium text-white/70">Full product demo — narrated</span>
                  <span className="text-xs text-white/40">2:40</span>
                </div>
                <video
                  className="w-full aspect-video"
                  src="/videos/sahayak-demo.mp4"
                  controls
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 9 powers ──────────────────────────────────────── */}
        <section id="powers" className="relative border-t border-white/[0.07]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal className="flex flex-wrap items-end justify-between gap-6 mb-14">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300 mb-4">
                  The dashboard
                </p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                  Nine lesson powers.
                  <br />
                  One dashboard.
                </h2>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/40">
                  Open the dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.07] rounded-2xl overflow-hidden border border-white/[0.07]">
              {powers.map((p, i) => (
                <Reveal key={p.title} delay={i % 3} className="bg-[#0B0714]">
                  <div className="group p-7 h-full hover:bg-[#130C24] transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-400/20 text-violet-300 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                        {p.icon}
                      </div>
                      <h3 className="font-semibold text-[15px]">{p.title}</h3>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">{p.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* two real outputs */}
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <Reveal>
                <figure className="rounded-2xl overflow-hidden border border-white/10">
                  <Image src="/images/hindi-lesson.png" alt="Hindi lesson generated live by Groq" width={1600} height={1000} className="w-full h-auto" />
                  <figcaption className="px-5 py-3 text-xs text-white/50 bg-[#100A1E] border-t border-white/[0.07]">
                    Localized content — a full Hindi lesson, generated live from one prompt
                  </figcaption>
                </figure>
              </Reveal>
              <Reveal delay={1}>
                <figure className="rounded-2xl overflow-hidden border border-white/10">
                  <Image src="/images/story.png" alt="Interactive story with illustrations and narration" width={1280} height={720} className="w-full h-auto" />
                  <figcaption className="px-5 py-3 text-xs text-white/50 bg-[#100A1E] border-t border-white/[0.07]">
                    Interactive storyteller — illustrations + spoken narration
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Made for India: real footage ──────────────────── */}
        <section id="india" className="relative border-t border-white/[0.07] bg-[#0D0818]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="grid md:grid-cols-2 gap-14 items-center">
              <Reveal className="order-2 md:order-1">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <video
                    className="w-full aspect-video object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/videos/india-boy-poster.jpg"
                  >
                    <source src="/videos/india-boy.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute bottom-4 left-4 rounded-full bg-black/60 backdrop-blur px-4 py-1.5 text-xs text-white/80 border border-white/10">
                    Every classroom, every child
                  </div>
                </div>
              </Reveal>
              <Reveal delay={1} className="order-1 md:order-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300 mb-4">
                  Made for India
                </p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                  Built for the
                  <br />
                  Indian classroom.
                </h2>
                <p className="mt-5 text-white/60 text-lg leading-relaxed">
                  Hyper-local examples, many Indian languages, and materials
                  that are ready to use on a blackboard — not translated
                  Silicon Valley content.
                </p>
                <ul className="mt-8 space-y-4">
                  {indiaPoints.map((t) => (
                    <li key={t} className="flex items-start gap-3 text-white/70">
                      <CheckCircle className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Testimonials ──────────────────────────────────── */}
        <section className="relative border-t border-white/[0.07]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal className="mb-14">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300 mb-4">
                Loved by teachers
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                What a week in class
                <br />
                sounds like.
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i}>
                  <figure className="h-full rounded-2xl border border-white/10 bg-[#100A1E] p-7 flex flex-col">
                    <div className="flex gap-1 mb-5">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="w-3.5 h-3.5 text-amber-300 fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-white/80 leading-relaxed flex-1 text-[15px]">
                      &ldquo;{t.content}&rdquo;
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <Image src={t.avatar} alt={t.name} width={40} height={40} className="rounded-full border border-white/10" />
                      <div>
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs text-white/40">{t.role}</div>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team ──────────────────────────────────────────── */}
        <section id="team" className="relative border-t border-white/[0.07] bg-[#0D0818]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300 mb-4">
                Team Code &amp; Canvas
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Four builders,
                <br />
                one classroom.
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {team.map((m, i) => (
                <Reveal key={m.name} delay={i}>
                  <div className="rounded-2xl border border-white/10 bg-[#100A1E] p-6 text-center hover:border-violet-400/30 transition-colors">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-violet-500/15 border border-violet-400/30 flex items-center justify-center font-bold text-violet-200">
                      {m.name.split(" ").map((w) => w[0]).join("")}
                    </div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-white/40 mt-1">{m.role}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────── */}
        <section className="relative border-t border-white/[0.07]">
          <div className="mx-auto max-w-6xl px-6 py-28">
            <Reveal className="rounded-3xl bg-gradient-to-br from-violet-700 via-violet-800 to-[#1B1038] border border-violet-400/20 px-8 py-16 md:px-16 text-center relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <MessageCircle className="w-8 h-8 mx-auto mb-6 text-violet-200" />
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                  Every AI tool helps
                  <br />
                  teachers plan. Ours sits
                  <br />
                  next to them in class.
                </h2>
                <Link href="/login">
                  <Button size="lg" className="mt-10 bg-white text-[#0B0714] hover:bg-violet-100 border-0 text-lg px-10 py-7 font-semibold shadow-2xl">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="mt-6 text-sm text-violet-200/70">
                  No credit card required · Works with your existing Google account
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Logo className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">Sahayak</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/70 mt-0.5">Live</span>
              </div>
              <p className="text-sm text-white/40 max-w-sm leading-relaxed">
                A voice-first AI co-teacher for Indian classrooms. Team Code &amp; Canvas · PS31.
              </p>
            </div>
            <div className="flex gap-16 text-sm">
              <div>
                <h3 className="font-semibold mb-3 text-white/80">Product</h3>
                <ul className="space-y-2 text-white/40">
                  <li><a href="#powers" className="hover:text-violet-300 transition-colors">Lesson Powers</a></li>
                  <li><a href="#classroom" className="hover:text-violet-300 transition-colors">Live Classroom</a></li>
                  <li><Link href="/dashboard" className="hover:text-violet-300 transition-colors">Dashboard</Link></li>
                  <li><Link href="/demo" className="hover:text-violet-300 transition-colors">Demo Video</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-white/80">Project</h3>
                <ul className="space-y-2 text-white/40">
                  <li><a href="https://github.com/Muneerali199/sahayak-ai-classroom" target="_blank" rel="noreferrer" className="hover:text-violet-300 transition-colors">GitHub</a></li>
                  <li><a href="#team" className="hover:text-violet-300 transition-colors">Team</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/[0.07] flex flex-col md:flex-row justify-between gap-3 text-xs text-white/30">
            <span>© 2026 Sahayak Live</span>
            <span className="flex items-center gap-1.5">
              <MonitorPlay className="w-3.5 h-3.5" /> Made in India, for India&apos;s classrooms
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
