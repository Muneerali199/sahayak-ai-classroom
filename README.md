# 🎓 Sahayak Live — Multi-Agent Voice Co-Teacher

> A voice AI co-teacher that sits **inside** a live digital classroom, listens on the same audio channel as the students, **waits for the right moment to speak**, and helps without ever interrupting the teacher.

[![Architecture](https://img.shields.io/badge/Architecture-LangGraph%20StateGraph-8B5CF6)](#-architecture)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2015%20%2B%20React-TS-blue)](#-quick-start)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20WebSockets-00C853)](#-quick-start)
[![Voice](https://img.shields.io/badge/Voice-Piper%20neural%20TTS%20%2B%20Agora%20RTC-orange)](#-live-classroom-audio)
[![License](https://img.shields.io/badge/License-MIT-green)](#-license)

Built on [Sahayak-Teacher](https://github.com/Muneerali199/sahayak-teacher) with a new multi-agent LangGraph backend. Designed for **PS31**.

---

## 🏆 The USP — Three Things No Competitor Has

### 1. 🚦 The Floor Manager (Turn-Taking State Machine)
A dedicated agent models the classroom "conversation floor" as a live state machine:
`TEACHER_TALKING` → AI stays silent · `STUDENT_TALKING` → AI stays silent · `OPEN_FLOOR` → AI may speak

The AI is **physically gated** by this — it cannot interrupt the teacher. A visible badge shows the floor state in real-time so judges **see** the AI waiting politely.

### 2. 📡 Gap Radar (Live Common-Misunderstanding Clustering)
Continuously scans student utterances for confusion signals and **clusters them by concept**. When 2+ students struggle with the same concept, it fires a **"Common Gap Detected"** alert and queues a simpler explanation for the next open-floor moment.

### 3. 🤫 Whisper Tutor (Dual-Mode AI: Broadcast + Private)
The same AI is simultaneously a class co-teacher (broadcasts to everyone) **and** a per-student private tutor. When one student is confused but the teacher is mid-sentence, the AI sends a targeted simpler explanation to **only that student's screen** — without interrupting the class.

### 4. 🧠 An 8-in-1 Lesson Studio (Demo Showcase)
A full **teacher dashboard at `/dashboard`** with **nine working, live-output features** (text, audio **and** visual aids) — every single one callable in a live demo with real generated output, not placeholders.

---

## 🧠 The 9 Agents

| Agent | Job |
|---|---|
| **Lesson Context** | Rolling summary of the ongoing lesson topic and concepts |
| **Floor Manager** ⭐ | Turn-taking FSM — gates every AI action on floor state |
| **Gap Radar** ⭐ | Clusters student confusion by concept, fires common-gap alerts |
| **Differentiation Engine** | Per-student comprehension profiling (beginner/intermediate/advanced) |
| **Explainer** | Generates calibrated explanations at 3 difficulty levels |
| **Replier** | Answers direct student questions & greetings conversationally when the floor is open |
| **Quizmaster** | Spoken quizzes — asks out loud, names a student, listens, evaluates |
| **Code-Switch** | Detects Hinglish/Tamil-English mixing, makes AI reply in matching language |
| **Insights** | Post-class: per-student gaps, common gaps, who needs support, next steps |

**Orchestrator:** LangGraph `StateGraph` — `Ingest → Lesson Context → Code-Switch → Gap Radar → Differentiation → Floor Manager → Router (Quiz → Whisper → Reply) → Action`

---

## 🧰 The Dashboard — 9 Working Lesson Powers

Every flow below runs **live against real APIs** at `http://localhost:9002/dashboard` and returns generated output (text, spoken audio, and diagram images) — demo-ready.

| # | Feature | What it does | Powered by |
|---|---|---|---|
| 1 | **Localized Content** | Lesson rewritten in any language incl. Marathi/Hindi/Tamil | Groq `gpt-oss-120b` JSON mode |
| 2 | **Differentiated Materials** | Upload a textbook photo → worksheets per grade level | Groq `qwen/qwen3.6-27b` **vision** + Napkin diagrams |
| 3 | **Instant Knowledge Base** | Explain any concept in a grade-calibrated way | Groq `gpt-oss-120b` |
| 4 | **Visual Aid Design** | Turns any content into a **diagram PNG** | Napkin AI |
| 5 | **Weekly Lesson Planner** | Full Monday–Sunday week plan | Groq `gpt-oss-120b` |
| 6 | **Audio Assessments** | Record a student reading → fluency/accuracy/mispronunciations | Groq **Whisper** (STT) + `gpt-oss-120b` |
| 7 | **Game Generation** | Classroom game from any lesson topic | Groq `gpt-oss-120b` |
| 8 | **Audio-Visual Explanation** | A topic → spoken audio **+** a visual aid | Groq + Piper TTS (backend) + Napkin |
| 9 | **Interactive Storyteller** | A prompt → story, per-scene narration audio **+** illustrations | Groq + Piper TTS + Napkin |

> The dashboard used to depend on Genkit + a Gemini key. It was rewritten so a **single Groq key** powers all text/vision/audio and a **single Napkin key** powers all diagrams — no Gemini required. See [`src/ai/`](#dashboard--bookkeeping-powers).

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and `npm`
- Python 3.11+ (the Agora server SDK ships 3.11 wheels — `scripts/setup_piper.sh` creates a dedicated `piper-venv/`)
- A free **Groq** API key → https://console.groq.com/keys (drives the entire backend + dashboard)
- A free **Napkin** API key → https://napkin.ai (drives visual aids & worksheet diagrams)

### 1. Backend (the multi-agent brain)

```bash
cd backend/classroom
pip install -r requirements.txt   # or use a venv
cp .env.example .env              # fill in at least GROQ_API_KEY
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

Verify: `curl http://127.0.0.1:8001/api/health`

> **Optional — human-like voice (recommended):** the AI speaks with a **local neural TTS**
> (Piper) so it sounds human instead of robotic. Run `bash scripts/setup_piper.sh` once
> (creates `piper-venv/` + downloads the Amy voice and 5 Indian-language voices).
> Without it, the backend falls back to macOS `say`. No API key needed either way.

### 2. Frontend (the classroom + dashboard UI)

```bash
npm install
cp .env.local.example .env.local  # after creating it (see below)
npm run dev                       # http://localhost:9002
```

Create `.env.local` in the repo root:

```ini
# Same Groq key as the backend — powers every dashboard text/vision/audio flow
GROQ_API_KEY=your_groq_key

# Napkin AI — visual aids + worksheet diagrams for the dashboard
NAPKIN_API_KEY=your_napkin_key

# Skip Google sign-in during local demos (enter as "Demo Teacher")
NEXT_PUBLIC_DEMO_LOGIN=1
```

> **Optional — live classroom audio (Agora RTC):** teacher + students share one live
> audio channel so the whole class hears the same mic (and the AI voice plays through
> the room speaker). One-time setup:
> `pip install --break-system-packages --user agora-token-builder`, then
> `agora login` → `agora project create sahayak-live --feature rtc` →
> `agora project env write` and paste `AGORA_APP_ID` / `AGORA_APP_CERTIFICATE` into
> `backend/classroom/.env`. The frontend just clicks the **Live Audio** toggle.

### 3. Go Live (classroom)

1. Open `http://localhost:9002/classroom`
2. Enter your name, select **Teacher**, click **Start Live Classroom**
3. Allow microphone access
4. Start teaching — the AI listens and helps at the right moments (**teacher's channel mic is OFF by default**; click **Talk to Class** when you want the class to hear you)
5. Open another browser tab as a student: `http://localhost:9002/classroom/<room-code>?role=student&name=Rahul`
6. Click **Live Audio** in the header (or the in-page **Join Audio**) to share the classroom audio channel — the AI's voice comes through the same speaker

### 4. Dashboard demo

Open `http://localhost:9002/dashboard` → pick any of the **9 lesson powers** → watch it generate real output (text, audio, and diagram images).

---

## 🔑 API Keys (backend — any ONE works)

Add to `backend/classroom/.env`:

```ini
GROQ_API_KEY=           # https://console.groq.com/keys   <- recommended (fast, free)
MISTRAL_API_KEY=        # https://console.mistral.ai
GEMINI_API_KEY=         # https://aistudio.google.com/apikey (optional)
```

Priority: **Groq → Mistral → Gemini → local Ollama** (fully offline, final fallback). Automatic fallback on errors.

---

## 🔌 Live Classroom Audio Pipeline

The AI doesn't just write chat bubbles — it **speaks on the classroom audio channel** like a real co-teacher.

```
Piper TTS ──▶ agora_voice_bridge.py ──▶ Agora RTC channel ──▶ students' browser audio
                      ▲                        ▲
               backend agora_voice.py    frontend use-agora.ts
               (spawns/respawns bridge,   (Live Audio toggle, AI volume, mic toggle)
                mints tokens, monitors    │
                speech start/stop)        ▼
                                    AI_VOICE events over WebSocket
```

- **`scripts/agora_voice_bridge.py`** — runs inside the Piper venv and publishes synthesized speech as custom PCM (`push_audio_pcm_data`, 16 kHz mono) into the Agora channel. Speaks JSON commands on stdin, reports status on stdout. Handles lead pacing, keep-alive dithering, per-channel locks.
- **`backend/classroom/agora_voice.py`** — the backend's bridge controller: spawns the bridge, respawns it if it hangs, mints tokens, sends `{"cmd":"speak"}` on AI replies, and relays `AI_VOICE` start/stop events to the room.
- **`src/hooks/use-agora.ts`** — the frontend Agora client: joins the channel, renders AI audio, the **Talk to Class** mic toggle (default off), AI ducking, and an AI online/offline presence indicator.
- **Auto-ducking:** while the AI speaks, the teacher's mic (if on) is ducked, and speech recognition pauses so the AI doesn't hear itself.
- **Volume:** the AI publishes at a calibrated gain (`AGORA_AI_VOLUME`, default `0.35` ≈ −9 dB) and the browser plays it at `NEXT_PUBLIC_AGORA_AI_VOLUME` (`40` default) — loud enough to be heard, never ear-blasting.

> **Why the voice was "static/noisy" (and how it was fixed):** the famous background-noise bug had three root causes, all now solved:
> 1. **Sender starvation** — when the PCM feeder under-ran, the receiver fell back to loss concealment (audible static). Fixed with lead pacing (`LEAD_MS = 250`) so data always sits ahead of playback.
> 2. **Track churn** — the AI's track being repeatedly (un)published between utterances triggered renegotiation noise. Fixed with a permanent keep-alive track that feeds a **−50 dB dither** (inaudible) instead of digital silence, keeping level monitors happy.
> 3. **The teacher's mic re-broadcasting the speaker output** — created a feedback loop of the AI's own audio. Fixed by making the teacher's channel mic **off by default** with an explicit **Talk to Class** toggle.

---

## 🎬 3-Minute Demo Script

**Subject: Math — Fractions.** Students: Aarav (advanced), Priya (intermediate), Rahul (beginner).

1. **Teacher** explains adding fractions with different denominators
2. **Rahul** says "I don't understand, why can't I just add the tops and bottoms?"
3. **Gap Radar** lights up: "1 individual gap detected"
4. **Rahul** asks again: "I'm still confused about common denominators"
5. **Gap Radar**: "2 individual gaps" → **Whisper Tutor** sends private explanation to Rahul's screen only (teacher not interrupted)
6. **Teacher** clicks **"Quiz Priya"** → **Quizmaster** asks Priya a question out loud
7. **Priya** answers → **Quizmaster** evaluates and gives feedback
8. **Teacher** clicks **"End Class"** → **Insights** generates: Rahul needs support on common denominators; class gap: LCM; recommended next lesson

**Money line:** *"Every AI tool helps teachers plan lessons. Ours sits next to them in class."*

---

## 📡 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Status + configured providers |
| `GET` | `/api/rooms` | List active rooms |
| `GET` | `/api/rooms/{id}` | Room detail + participants |
| `WS` | `/ws/classroom/{room_id}` | Realtime classroom connection |
| `POST` | `/api/rooms/{id}/end` | End session + generate insights |
| `GET` | `/api/rooms/{id}/insights` | Get post-class insights |
| `GET` | `/api/rooms/{id}/state` | Debug: current classroom state |
| `GET` | `/api/tts?text=...&lang=en-IN` | Human-like speech audio (WAV) |
| `POST` | `/api/agora/token` | Mint an Agora RTC token for the live audio channel |

---

## 🏗️ Architecture

```
Next.js 15 Frontend                    Python FastAPI + LangGraph Backend
┌──────────────────────┐               ┌──────────────────────────────┐
│ /classroom (lobby)   │─── WebSocket──│ /ws/classroom/{room_id}      │
│ /classroom/[id]      │               │                              │
│   - Floor badge      │               │  ClassroomOrchestrator       │
│   - Transcript       │               │  (LangGraph StateGraph):     │
│   - Agent swarm      │               │                              │
│   - Teacher controls │               │  Ingest → Context →          │
│   - Whisper toasts   │               │  CodeSwitch → GapRadar →     │
│   - Live audio (mic) │── Agora RTC ──│  Differentiation →           │
│     → shared channel │               │  FloorManager → Router →     │
│ /dashboard           │─── REST ─────│  Action                      │
│   - 9 lesson powers  │               │  (9 agents via llm_client)   │
│   (Groq + Napkin)    │               │  Groq + Mistral + Ollama     │
└──────────────────────┘               │                              │
                    │                  │  Piper TTS ──▶ ± agora       │
                    │  AI_VOICE events │  voice bridge ──▶ RTC        │
                    └──────────────────│  (agora_voice.py)            │
                                       └──────────────────────────────┘
```

---

## 📁 Project Structure

```
sahayak-live/
├── src/                              # Next.js 15 frontend
│   ├── app/
│   │   ├── classroom/                # live classroom
│   │   │   ├── page.tsx              #   lobby (create/join room)
│   │   │   └── [id]/page.tsx         #   room view (floor badge, mic toggle, AI_VOICE)
│   │   ├── dashboard/page.tsx        # 9 lesson powers + Go Live CTA
│   │   └── login/page.tsx            # Google sign-in (bypassed by demo login)
│   ├── ai/                           # dashboard generation layer
│   │   ├── groq.ts                   #   Groq JSON-mode helper (all text/vision/audio flows)
│   │   ├── napkin.ts                 #   Napkin AI diagram generator (PNG data URI)
│   │   ├── dev.ts / genkit.ts        #   Genkit dev harness (kept for tooling)
│   │   └── flows/                    #   9 server actions (create-differentiated-materials,
│   │                                 #     design-visual-aids, interactive-storyteller, ...)
│   ├── components/
│   │   ├── features/                 #   the 9 dashboard feature UIs
│   │   ├── ui/                       #   shadcn/ui primitives
│   │   └── auth/protected-route.tsx  #   demo-login bypass (NEXT_PUBLIC_DEMO_LOGIN)
│   ├── context/                      # auth context
│   ├── hooks/
│   │   ├── use-websocket.ts          # WebSocket hook
│   │   ├── use-agora.ts              # live classroom audio + mic toggle + ducking
│   │   └── use-speech-recognition.ts # Web Speech API hook
│   └── lib/tts.ts                    # text-to-speech manager
├── backend/classroom/                # multi-agent backend
│   ├── main.py                       # FastAPI + WebSocket room manager + AI_VOICE events
│   ├── orchestrator.py               # LangGraph StateGraph
│   ├── state.py                      # ClassroomState schema
│   ├── room.py                       # Room registry + participants
│   ├── llm_client.py                 # Groq/Mistral/Gemini/Ollama router + fallback
│   ├── tts.py                        # human-like TTS (Piper) + text humanizer
│   ├── agora_voice.py                # Agora bridge controller (spawn/respawn/token/events)
│   ├── requirements.txt
│   ├── .env.example
│   └── agents/
│       ├── floor_manager.py          # ⭐ turn-taking FSM
│       ├── lesson_context.py         # rolling lesson summary
│       ├── gap_radar.py              # ⭐ confusion clustering
│       ├── differentiation.py        # per-student levels
│       ├── explainer.py              # 3-level explanations
│       ├── replier.py                # direct Q&A / greeting replies
│       ├── quizmaster.py             # spoken quizzes
│       ├── code_switch.py            # multilingual detection
│       └── insights.py               # post-class summary
├── scripts/
│   ├── setup_piper.sh                # creates piper-venv/ + downloads neural voices
│   ├── agora_voice_bridge.py         # publishes Piper TTS into Agora (custom PCM)
│   ├── voice_sub_test.py             # Agora subscriber used for audio verification
│   └── voice_web_probe.html          # browser-side audio capture harness
└── docs/                             # business model, pitch deck, pitch script
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind, Framer Motion, ShadCN UI |
| Backend | Python, FastAPI, uvicorn, WebSockets + server-minted Agora tokens |
| Orchestration | LangGraph StateGraph |
| LLM (classroom) | Groq `gpt-oss-120b`, Mistral, Gemini (optional), Ollama (offline fallback) |
| LLM (dashboard) | Groq `gpt-oss-120b` (text/JSON), Groq `qwen/qwen3.6-27b` (vision), Groq **Whisper** (STT) |
| Visuals | Napkin AI (diagram PNGs for visual aids + worksheets) |
| Speech → text | Web Speech API (SpeechRecognition) + Groq Whisper (dashboard recordings) |
| Voice (TTS) | **Piper local neural TTS** (en + hi/te/ml/mr) + macOS `say` fallback |
| Live audio | Agora RTC (`agora-rtc-sdk-ng`, `agora-token-builder`, Python server SDK bridge) |

---

## 🐛 Troubleshooting

| Symptom | Fix |
|---|---|
| Dashboard 500 "GROQ_API_KEY is not set" | Add `GROQ_API_KEY=` to **root `.env.local`** and restart `npm run dev` |
| Dashboard 500 "NAPKIN_API_KEY is not set" | Add `NAPKIN_API_KEY=` to root `.env.local` |
| Dashboard redirects to `/login` | Set `NEXT_PUBLIC_DEMO_LOGIN=1` in `.env.local` (demo bypass) |
| Differentiated Materials returns invalid JSON | qwen's vision+JSON restriction is handled by a think/fence stripper — re-run; if persistent, check `qwen/qwen3.6-27b` availability in the Groq console |
| AI voice garbled / static mid-speech | Root causes were sender starvation & track churn — if it recurs, verify `LEAD_MS` and the keep-alive dither in `scripts/agora_voice_bridge.py` (see [audio pipeline](#-live-classroom-audio-pipeline)) |
| AI has no audio in the room | Click **Live Audio** to join the channel; confirm `AGORA_APP_ID`/`AGORA_APP_CERTIFICATE` are set, and the bridge (Piper venv) is installed |
| `AgoraService` import fails | The bridge needs Python 3.11 — recreate via `bash scripts/setup_piper.sh` |
| `curl /api/health` shows no providers | Backend `.env` missing keys; restart backend after adding |

---

## 📊 PS31 Requirement Coverage

| Requirement | Solution |
|---|---|
| Real-time participation | WebSocket transcript loop |
| Awareness of teacher/student roles | Role-tagged participants |
| Appropriate turn-taking | **Floor Manager FSM** (visible badge) |
| Contextual answers | **Lesson Context** agent (rolling summary) |
| Different explanation levels | **Differentiation Engine** + **Explainer** (3 levels) |
| Spoken quizzes | **Quizmaster** agent (TTS + STT) |
| Multilingual / code-switched | **Code-Switch** agent (Hinglish, Tamil-English, etc.) |
| Student identification | Firebase Auth + room identity + per-student profiles |
| Post-class summaries | **Insights** agent + summary page |
| Teacher control / override | Mute toggle, End Class, quiz controls |

---

## 🚀 Market & Business Model

The combination of **live voice + floor management + private whispering + confusion clustering is genuinely novel** — no production product, funded startup, or published prototype ships it together (Khanmigo, MagicSchool, Century Tech and Robyn are the closest, and none do all four).

- **Market:** AI-in-education is $6.9B → $41B by 2030 (41% CAGR); India K-12 EdTech $6.5B → $29B (~28% CAGR).
- **Model:** Per-classroom SaaS at ₹15,000–60,000/yr (India) / $360–1,200/yr (US), 85–95% gross margin (inference via Groq is near-free).
- **Moats:** voice-first physical presence, a proprietary dataset of Indian classroom interactions, hardware lock-in, and Hindi/Tamil/Telugu/Marathi/Bengali voice coverage no competitor serves.

Full research + pricing + go-to-market: **[docs/business-model.md](docs/business-model.md)**

---

## 📊 Pitch Materials

- **Slide deck (7 slides):** `docs/pitch-deck.html` — open in any browser, navigate with arrow keys / Prev-Next. Includes problem, solution, market, USP, technical architecture (Mermaid diagram + tech stack), business model and ask.
- **Pitch script:** `docs/pitch-script.md` — 60-second elevator pitch, slide-by-slide script, judge Q&A.
- **Business model:** `docs/business-model.md` — market research, pricing, GTM, moats.

---

## 🚀 Live Deployment

The site is deployed on Vercel: **https://sahayak-live-virid.vercel.app**

- Landing page (purple theme + aurora video hero) at `/`
- Full product demo video at `/demo` — a 60-second walkthrough with real generated output
- Dashboard (Groq + Napkin keys configured as Vercel env vars) at `/dashboard`

**Embed the demo video anywhere** (e.g. Commudle submission):

```html
<iframe src="https://sahayak-live-virid.vercel.app/demo" width="600" height="400" allow="autoplay; fullscreen" allowfullscreen></iframe>
```

Security: strict CSP + `X-Frame-Options`/`frame-ancestors` deny framing on all routes except `/demo` (which allows embeds), HSTS, nosniff, referrer-policy, and a locked-down permissions policy (mic only). Secrets stay server-side in Vercel env vars — nothing is committed.

---

## 📄 License

MIT. Built on [Sahayak-Teacher](https://github.com/Muneerali199/sahayak-teacher) by Muneer Ali.