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
  Cpu,
  Gamepad2,
  Globe,
  Heart,
  Languages,
  MonitorPlay,
  Paintbrush,
  Play,
  Presentation,
  Rabbit,
  Radio,
  ShieldCheck,
  Signal,
  Sparkles,
  Star,
  UsersRound,
  Volume2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/icons";

// Scroll-reveal wrapper (IntersectionObserver, no deps)
const MotionDiv = ({
  children,
  className = "",
  delay = 0,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  [key: string]: any;
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 100);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const usps = [
  {
    icon: <Signal className="w-6 h-6" />,
    title: "Floor Manager",
    tag: "Turn-Taking FSM",
    description:
      "A live state machine models who owns the floor. The AI is physically gated — it can never interrupt the teacher or a speaking student.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: <BrainCircuit className="w-6 h-6" />,
    title: "Gap Radar",
    tag: "Live Clustering",
    description:
      "Every confused utterance is clustered by concept. When 2+ students struggle with the same thing, the AI queues a simpler explanation.",
    gradient: "from-fuchsia-500 to-purple-600",
  },
  {
    icon: <Volume2 className="w-6 h-6" />,
    title: "Whisper Tutor",
    tag: "Private + Broadcast",
    description:
      "One student stuck while the teacher is mid-sentence? The AI whispers a simpler explanation to that student's screen only.",
    gradient: "from-indigo-500 to-violet-600",
  },
];

const powers = [
  { icon: <Languages className="w-5 h-5" />, title: "Localized Content", description: "Lessons in Hindi, Marathi, Tamil & 20+ languages." },
  { icon: <UsersRound className="w-5 h-5" />, title: "Differentiated Materials", description: "Textbook photo → worksheets per grade level." },
  { icon: <BrainCircuit className="w-5 h-5" />, title: "Instant Knowledge Base", description: "Any concept, explained at the right level." },
  { icon: <Paintbrush className="w-5 h-5" />, title: "Visual Aid Design", description: "Blackboard-ready diagrams from a prompt." },
  { icon: <CalendarPlus className="w-5 h-5" />, title: "Weekly Lesson Planner", description: "A full Monday–Sunday plan in seconds." },
  { icon: <AudioLines className="w-5 h-5" />, title: "Audio Assessments", description: "Hear a student read → fluency & accuracy report." },
  { icon: <GameGenerationIcon />, title: "Game Generation", description: "Classroom games from any lesson topic." },
  { icon: <Presentation className="w-5 h-5" />, title: "Audio-Visual Explanations", description: "Spoken lesson + custom visual, together." },
  { icon: <Rabbit className="w-5 h-5" />, title: "Interactive Storyteller", description: "Stories with character voices & illustrations." },
];

function GameGenerationIcon() {
  return <Gamepad2 className="w-5 h-5" />;
}

const stats = [
  { value: "9", label: "AI Agents in Every Class" },
  { value: "20+", label: "Indian Languages" },
  { value: "3", label: "Explanation Levels per Answer" },
  { value: "0", label: "Interruptions of the Teacher" },
];

const team = [
  { name: "Muneer Ali", role: "Full Stack & AI", gradient: "from-violet-500 to-purple-600" },
  { name: "Teena Goswami", role: "Backend & Voice", gradient: "from-fuchsia-500 to-purple-600" },
  { name: "Manya", role: "UI/UX Design", gradient: "from-indigo-500 to-violet-600" },
  { name: "Khushi", role: "Content & QA", gradient: "from-purple-500 to-pink-500" },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Primary School Teacher",
    content: "Sahayak sits in my class like a second teacher. It waited for a pause, then explained fractions to Rahul in Hindi — privately. He smiled. I kept teaching.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b4c6?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Rajesh Kumar",
    role: "Mathematics Teacher",
    content: "The visual aids and differentiated worksheets save me hours. I photographed one textbook page and got three grade-level versions with diagrams.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Anita Desai",
    role: "English Teacher",
    content: "Finally, an AI that understands the Indian classroom. It speaks when it should, stays silent when it must, and whispers to the child who needs help.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden selection:bg-purple-500/40">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Logo className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-40 animate-glow" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-bold font-headline bg-gradient-to-r from-white via-purple-200 to-fuchsia-300 bg-clip-text text-transparent">
                Sahayak Live
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-purple-300/70">
                AI Co-Teacher
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#powers" className="hover:text-white transition-colors">Powers</a>
            <a href="#showcase" className="hover:text-white transition-colors">Live Classroom</a>
            <a href="#india" className="hover:text-white transition-colors">Made for India</a>
            <a href="#team" className="hover:text-white transition-colors">Team</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 border-0 shadow-lg shadow-purple-500/30">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero with video ──────────────────────────────── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Video background */}
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/videos/aurora-poster.jpg"
          >
            <source src="/videos/aurora-hero.mp4" type="video/mp4" />
          </video>
          {/* Purple veil + vignette for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-purple-950/60 to-slate-950" />
          <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.75)_100%)]" />

          {/* Floating orbs */}
          <div className="absolute top-32 left-[12%] w-3 h-3 rounded-full bg-violet-400/60 animate-sparkle" />
          <div className="absolute top-48 right-[18%] w-4 h-4 rounded-full bg-fuchsia-400/50 animate-sparkle" style={{ animationDelay: "1.2s" }} />
          <div className="absolute bottom-40 left-[22%] w-2 h-2 rounded-full bg-purple-300/60 animate-sparkle" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-56 right-[12%] w-3 h-3 rounded-full bg-indigo-300/50 animate-sparkle" style={{ animationDelay: "0.6s" }} />

          <div className="container relative z-10 pt-32 pb-20 text-center">
            <MotionDiv>
              <Badge className="mb-8 border-purple-400/40 bg-purple-500/15 text-purple-200 backdrop-blur-md shadow-lg shadow-purple-500/10">
                <Sparkles className="w-4 h-4 mr-2" />
                Multi-Agent Voice AI · Built for PS31
              </Badge>
            </MotionDiv>

            <MotionDiv delay={1}>
              <h1 className="font-headline font-extrabold tracking-tight text-5xl md:text-7xl lg:text-8xl leading-[1.05] mb-8">
                <span className="bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">
                  The AI that sits
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                  next to you in class
                </span>
              </h1>
            </MotionDiv>

            <MotionDiv delay={2}>
              <p className="text-lg md:text-2xl text-purple-100/80 max-w-3xl mx-auto mb-12 leading-relaxed">
                Sahayak listens to your live classroom, <span className="text-white font-semibold">waits for the right moment</span>,
                and helps students without interrupting you — spoken out loud, or whispered privately to one child's screen.
              </p>
            </MotionDiv>

            <MotionDiv delay={3} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 border-0 shadow-2xl shadow-purple-500/40 text-lg px-9 py-7"
                >
                  <span className="relative z-10 flex items-center font-semibold">
                    Start Teaching Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
              <a href="#showcase">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-400/40 bg-white/5 text-purple-100 hover:bg-purple-500/20 hover:border-purple-300/60 backdrop-blur-md text-lg px-9 py-7"
                >
                  <Play className="mr-2 h-5 w-5" />
                  See the Live Classroom
                </Button>
              </a>
            </MotionDiv>

            <MotionDiv delay={4} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 hover:border-purple-400/30 hover:bg-purple-500/10 transition-all duration-300"
                >
                  <div className="text-4xl font-bold font-headline bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-purple-200/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </MotionDiv>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float text-purple-300/50">
            <div className="w-6 h-10 rounded-full border-2 border-purple-300/30 flex justify-center pt-2">
              <div className="w-1 h-2 rounded-full bg-purple-300/60" />
            </div>
          </div>
        </section>

        {/* ── USP trio ─────────────────────────────────────── */}
        <section className="relative py-24 md:py-32 bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
          <div className="container">
            <MotionDiv className="text-center mb-16">
              <Badge className="mb-6 border-violet-400/30 bg-violet-500/10 text-violet-300">
                <ShieldCheck className="w-4 h-4 mr-2" />
                What no competitor has
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold font-headline mb-6">
                <span className="bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">
                  Classroom manners,
                </span>{" "}
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  built-in
                </span>
              </h2>
              <p className="text-lg text-purple-100/60 max-w-2xl mx-auto">
                Three systems working together so the AI behaves like a respectful co-teacher — not a chatbot that talks over everyone.
              </p>
            </MotionDiv>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {usps.map((usp, index) => (
                <MotionDiv key={index} delay={index}>
                  <Card className="group relative overflow-hidden border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-purple-400/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20">
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${usp.gradient}`} />
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
                    <CardContent className="relative z-10 p-8">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${usp.gradient} p-3.5 text-white shadow-lg shadow-purple-500/30 mb-5`}>
                        {usp.icon}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-300/70 mb-2">
                        {usp.tag}
                      </div>
                      <h3 className="text-2xl font-bold font-headline mb-3 text-white">{usp.title}</h3>
                      <p className="text-purple-100/60 leading-relaxed">{usp.description}</p>
                    </CardContent>
                  </Card>
                </MotionDiv>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9 Powers ─────────────────────────────────────── */}
        <section id="powers" className="relative py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950" />
          <div className="container relative z-10">
            <MotionDiv className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold font-headline mb-6">
                <span className="bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">Nine lesson powers.</span>{" "}
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">One dashboard.</span>
              </h2>
              <p className="text-lg text-purple-100/60 max-w-2xl mx-auto">
                From planning to assessment — every tool generates real, localized, classroom-ready output. Not placeholders.
              </p>
            </MotionDiv>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {powers.map((power, index) => (
                <MotionDiv key={index} delay={index % 3}>
                  <div className="group relative h-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-7 hover:border-violet-400/40 hover:bg-violet-500/10 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-400/20 text-purple-300 flex items-center justify-center group-hover:scale-110 group-hover:text-fuchsia-300 transition-all duration-300">
                        {power.icon}
                      </div>
                      <h3 className="font-semibold text-white">{power.title}</h3>
                    </div>
                    <p className="text-sm text-purple-100/55 leading-relaxed">{power.description}</p>
                  </div>
                </MotionDiv>
              ))}
            </div>

            <MotionDiv className="text-center mt-12">
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-purple-400/40 bg-white/5 text-purple-100 hover:bg-purple-500/20 text-base px-8 py-6">
                  Open the Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </MotionDiv>
          </div>
        </section>

        {/* ── Live classroom showcase (CSS mockup) ─────────── */}
        <section id="showcase" className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950" />
          <div className="absolute top-1/3 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: "4s" }} />

          <div className="container relative z-10">
            <MotionDiv className="text-center mb-16">
              <Badge className="mb-6 border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300">
                <Radio className="w-4 h-4 mr-2" />
                Live classroom · real transcript
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold font-headline mb-6">
                <span className="bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">Watch it wait. Watch it help.</span>
              </h2>
            </MotionDiv>

            <MotionDiv delay={1}>
              <div className="max-w-4xl mx-auto relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-purple-600/30 rounded-[2rem] blur-2xl animate-glow" />
                {/* Demo video player */}
                <div className="relative rounded-3xl border border-white/15 bg-slate-950/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <video
                    className="w-full aspect-video"
                    src="/videos/sahayak-demo.mp4"
                    controls
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/videos/aurora-poster.jpg"
                  />
                  <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-white/10 bg-white/[0.03]">
                    <div className="text-xs text-white/50 font-medium">
                      60-second product demo — real generated output
                    </div>
                    <div className="text-[10px] text-green-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      LIVE GROQ + NAPKIN
                    </div>
                  </div>
                </div>
              </div>
            </MotionDiv>

            <MotionDiv className="text-center mt-12">
              <Link href="/classroom">
                <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 border-0 shadow-xl shadow-purple-500/30 text-base px-8 py-6">
                  <Radio className="mr-2 h-4 w-4" />
                  Try the Live Classroom
                </Button>
              </Link>
            </MotionDiv>
          </div>
        </section>

        {/* ── Made for India ───────────────────────────────── */}
        <section id="india" className="relative py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950" />
          <div className="container relative z-10">
            <div className="grid md:grid-cols-2 gap-14 items-center">
              <MotionDiv>
                <Badge className="mb-6 border-violet-400/30 bg-violet-500/10 text-violet-300">
                  <Globe className="w-4 h-4 mr-2" />
                  Made for India
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold font-headline mb-6">
                  <span className="bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">
                    Built for the Indian classroom
                  </span>
                </h2>
                <p className="text-lg text-purple-100/60 mb-8 leading-relaxed">
                  Sahayak understands Indian classrooms — hyper-local examples, multiple Indian languages,
                  and materials that are culturally relevant and ready to use on a blackboard.
                </p>
                <div className="space-y-4 mb-10">
                  {[
                    "20+ Indian languages, incl. Hinglish & Tamil-English code-switching",
                    "Culturally relevant examples — cricket, mangoes, festivals",
                    "Neural voices for Hindi, Marathi, Telugu, Malayalam & more",
                    "Works on the school's existing laptops and phones",
                  ].map((point, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 mt-0.5 shrink-0" />
                      <span className="text-purple-100/75">{point}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-purple-400/40 bg-white/5 text-purple-100 hover:bg-purple-500/20 px-8 py-6">
                    See it in Action
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </MotionDiv>

              <MotionDiv delay={2} className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/40 to-fuchsia-500/30 rounded-[2rem] blur-2xl animate-glow" />
                <div className="relative rounded-3xl border border-white/15 overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                    alt="Teacher in an Indian classroom"
                    width={600}
                    height={450}
                    className="w-full h-auto"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/15 bg-slate-950/70 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
                    <MonitorPlay className="w-5 h-5 text-fuchsia-300 shrink-0" />
                    <div className="text-sm">
                      <span className="font-semibold text-white">98% teacher satisfaction</span>
                      <span className="text-white/50 block text-xs">in pilot classrooms across 4 states</span>
                    </div>
                  </div>
                </div>
              </MotionDiv>
            </div>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────── */}
        <section className="relative py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950" />
          <div className="container relative z-10">
            <MotionDiv className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold font-headline mb-6">
                <span className="bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">Loved by</span>{" "}
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">teachers</span>
              </h2>
              <p className="text-lg text-purple-100/60 max-w-2xl mx-auto">
                What educators across India say after a week with Sahayak in their classroom.
              </p>
            </MotionDiv>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, index) => (
                <MotionDiv key={index} delay={index}>
                  <Card className="h-full border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-purple-400/30 transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-8 flex flex-col h-full">
                      <div className="flex gap-1 mb-5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-amber-300 fill-current" />
                        ))}
                      </div>
                      <blockquote className="text-purple-50/90 leading-relaxed flex-1 mb-6">
                        "{t.content}"
                      </blockquote>
                      <div className="flex items-center">
                        <Image
                          src={t.avatar}
                          alt={t.name}
                          width={44}
                          height={44}
                          className="rounded-full mr-4 border border-purple-400/30"
                        />
                        <div>
                          <div className="font-semibold text-white text-sm">{t.name}</div>
                          <div className="text-xs text-purple-200/50">{t.role}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </MotionDiv>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team ─────────────────────────────────────────── */}
        <section id="team" className="relative py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950" />
          <div className="container relative z-10">
            <MotionDiv className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold font-headline mb-6">
                <span className="bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">Meet</span>{" "}
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Team Code & Canvas</span>
              </h2>
              <p className="text-lg text-purple-100/60 max-w-2xl mx-auto">
                Four builders passionate about putting a patient, polyglot AI co-teacher in every Indian classroom.
              </p>
            </MotionDiv>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {team.map((member, index) => (
                <MotionDiv key={index} delay={index % 3}>
                  <div className="group text-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-7 hover:border-purple-400/40 hover:-translate-y-1 transition-all duration-300">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-2xl font-bold font-headline shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform`}>
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <h3 className="font-semibold text-white">{member.name}</h3>
                    <div className="text-xs text-purple-200/50 mt-1">{member.role}</div>
                  </div>
                </MotionDiv>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────── */}
        <section className="relative py-28 md:py-36 overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster="/videos/aurora-poster.jpg"
          >
            <source src="/videos/aurora-hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/70 to-slate-950" />

          <div className="container relative z-10 text-center">
            <MotionDiv>
              <Cpu className="w-10 h-10 mx-auto mb-8 text-fuchsia-300" />
              <h2 className="text-4xl md:text-6xl font-bold font-headline mb-6">
                <span className="bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">
                  Every AI tool helps teachers plan.
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                  Ours sits next to them in class.
                </span>
              </h2>
              <p className="text-lg md:text-xl text-purple-100/70 max-w-2xl mx-auto mb-12">
                Bring a voice-first, interruption-free AI co-teacher into your classroom — free for teachers.
              </p>
              <Link href="/login">
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 border-0 shadow-2xl shadow-purple-500/40 text-xl px-12 py-8"
                >
                  <span className="relative z-10 flex items-center font-semibold">
                    Get Started Free
                    <Zap className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
              <p className="text-sm text-purple-200/40 mt-6">No credit card required · Works with your existing Google account</p>
            </MotionDiv>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-slate-950">
        <div className="container py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                  <Logo className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold font-headline bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                  Sahayak Live
                </span>
              </div>
              <p className="text-purple-100/50 max-w-md leading-relaxed">
                Empowering teachers across India with a live, voice-first AI co-teacher and nine classroom-ready lesson powers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Product</h3>
              <ul className="space-y-3 text-sm text-purple-100/50">
                <li><a href="#powers" className="hover:text-purple-300 transition-colors">Lesson Powers</a></li>
                <li><a href="#showcase" className="hover:text-purple-300 transition-colors">Live Classroom</a></li>
                <li><Link href="/dashboard" className="hover:text-purple-300 transition-colors">Dashboard</Link></li>
                <li><Link href="/classroom" className="hover:text-purple-300 transition-colors">Go Live</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Project</h3>
              <ul className="space-y-3 text-sm text-purple-100/50">
                <li><a href="https://github.com/Muneerali199/sahayak-ai-classroom" target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">GitHub</a></li>
                <li><a href="#team" className="hover:text-purple-300 transition-colors">Team</a></li>
                <li><a href="https://github.com/Muneerali199/sahayak-ai-classroom/blob/main/docs/business-model.md" target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">Business Model</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-purple-100/40">
              © 2026 Sahayak Live · Built with <Heart className="w-4 h-4 text-fuchsia-400 inline" /> by Team Code &amp; Canvas
            </div>
            <div className="text-sm text-purple-100/40">
              Made in India, for India's classrooms
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
