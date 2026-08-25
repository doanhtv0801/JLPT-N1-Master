# JLPT N1 Master

**Master Japanese. Aim for 180/180.**

JLPT N1 Master is a mastery-oriented study platform for the JLPT N1 vocabulary, built around a
7-dimension mastery model instead of a binary "learned / not learned" flashcard flag. This is the
**Phase 1 MVP**: authentication scaffolding, dashboard, vocabulary explorer, a guided learning
flow, a spaced-repetition review engine, a quiz engine, and statistics — running entirely on a
local demo dataset with zero required configuration.

> This is an internal study tool. It is not affiliated with the Japan Foundation, JEES, or any
> official JLPT body, and nothing in the app claims to be the official JLPT word list or an
> official JLPT score prediction.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it — no environment variables, no
database, and no API keys are required. The app starts in **Demo Mode** with a realistic seeded
learner profile (a 42-day streak, words at every mastery stage, due reviews, mistakes, activity
history) so the dashboard is compelling from the very first load.

## The mastery model

Real command of a word isn't one bit of state. Each vocabulary entry tracks the learner across
six independent dimensions, each scored 0–100:

- **Reading** — can you read the kanji correctly?
- **Meaning** — do you know what it means?
- **Context** — can you infer it from a sentence?
- **Synonym** — can you distinguish it from near-synonyms?
- **Collocation** — do you know which words it naturally pairs with?
- **Production** — can you actually use it in your own sentence?

These roll up into a weighted overall score and one of eight discrete mastery levels (Unseen →
Recognized → Reading Known → Meaning Known → Context Understood → Synonyms Distinguished → Can
Produce → Mastered), gated sequentially — you can't be marked "Mastered" on a word you've never
produced a sentence with. The scoring, level-gating, and diminishing-returns update formulas live
in `src/services/mastery.ts` and are unit tested in `src/services/mastery.test.ts`.

## Feature tour (Phase 1)

- **Dashboard** — streak, vocabulary mastery %, reviews due, an internal (explicitly
  non-official) JLPT score estimate, a daily mission, a weakness breakdown across the six
  dimensions, recently studied words, and a GitHub-style activity heatmap.
- **Vocabulary Explorer** (`/vocabulary`) — search, filter by topic/status, sort, and switch
  between table and card views over the full demo corpus.
- **Vocabulary Detail** (`/vocabulary/[id]`) — reading, meanings (EN/VI), Japanese definition,
  example sentences, collocations, synonyms with nuance notes, confusing/similar words,
  antonyms, and a per-dimension mastery breakdown, with audio playback via the browser's speech
  synthesis.
- **Learn** (`/learn`, `/learn/session`) — a 7-step progressive-disclosure flow per new word
  (word → pronunciation → meaning → example → collocations → synonyms → quick recall check),
  ending in a real quiz question that starts feeding the word into spaced repetition.
- **Review** (`/review`, `/review/session`) — a spaced-repetition queue (FSRS-lite scheduling)
  that mixes question types (reading, meaning, context, synonym, collocation, confusing-word,
  and free-text production) based on each word's weakest dimension.
- **Statistics** — XP trend and mastery-distribution charts, weakness analysis, and the same
  honestly-labeled JLPT estimate as the dashboard.
- **Settings / Profile** — daily targets, theme, translation language, and a one-click "reset
  demo data" action.

Phases 2–4 from the full product spec (Synonym Battle, Collocation Master, Kanji Network,
Reading/Listening practice, Mock Tests, AI-adaptive learning) are intentionally out of scope for
this build.

## Demo data, honestly

The seeded corpus contains **400 real, hand-curated N1 words** — genuine readings, natural example
sentences, real collocations, and cross-referenced synonym/antonym/confusing-word clusters (e.g.
促進↔推進, 懸念/危惧/憂慮, 対応/適応/適用, 遵守↔違反, 縮小↔拡充, 検証↔立証, 曖昧↔明瞭, 屈する↔抗う,
隆盛↔衰退, 昇格↔降格, 依存↔自立, 頭角/秀でる/卓越/傑出/逸材, 露見↔隠蔽, 厳格↔寛容/寛大, 熟練↔未熟,
寡黙↔饒舌, 信頼↔猜疑) — not generated filler.
The UI's corpus-size badges reflect that actual number; nowhere does the app claim this is the
official JLPT N1 word list or a complete N1 corpus. `src/data/vocabulary.ts` also exports an
aspirational `VOCABULARY_CORPUS_TARGET` constant for future content growth, which is never
conflated with the current size.

Demo learner progress (`src/lib/demo-seed.ts`) is deterministic: 15 words seeded near "Mastered,"
14 "Mature" (some intentionally due for review right now), 10 "Young/learning," and the
remaining 361 left completely unseen (plenty of headroom for the Learn flow) — plus a 42-day
activity streak ending today.

## Tech stack

- **Next.js 16** (App Router, Turbopack, TypeScript, strict mode)
- **Tailwind CSS v4** with hand-written shadcn-style UI primitives on top of Radix UI
  (the `shadcn` CLI and Google Fonts both require network access this environment didn't have
  during development, so components are hand-authored and fonts are system-stack based —
  see [Notes on offline-safety](#notes-on-offline-safety) below)
- **Zustand** (with `persist`) as the client-side demo repository, backed by `localStorage`
- **Zod** for form/input validation
- **Recharts** for statistics charts (lazy-loaded, client-only)
- **Vitest** for unit tests
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) — full schema and repository written,
  but inactive unless configured (see below)

## Architecture

```
src/
  app/            Next.js routes, grouped by (marketing) / (auth) / (app)
  components/
    ui/           Hand-written shadcn-style primitives (button, card, dialog, ...)
    features/     App-specific composed components (mastery rings, question cards, ...)
    layout/       Shell, sidebar, header, theme, auth gate
  types/          Domain types (vocabulary, mastery, srs, quiz, user, statistics)
  schemas/        Zod validation schemas
  data/           The 400-word vocabulary corpus + topic labels
  services/       Pure, unit-tested business logic (mastery, SRS, quiz, scoring, weakness, streak)
  repositories/   LearningRepository interface + demo (Zustand) and Supabase implementations
  ai/             Provider-agnostic AiService interface + deterministic mock provider
  lib/            Store, demo seed data, TTS abstraction, utilities
  hooks/          useLearningStats, useMounted
  supabase/       Client/server Supabase setup + schema.sql
```

The demo repository and the Supabase repository both implement the same `LearningRepository`
interface (`src/repositories/types.ts`), so swapping demo data for a real backend later is a
configuration change, not a rewrite.

## Running in Demo Mode vs. with Supabase

**Demo Mode (default, no configuration needed).** All learning state lives in a Zustand store
persisted to `localStorage` under the key `jlpt-n1-master-demo`. `getLearningRepository()`
(`src/repositories/index.ts`) returns the demo repository whenever Supabase environment variables
aren't set. There is no login wall in this mode — `AuthGate` renders the app directly.

**With Supabase.** Copy `.env.example` to `.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and run `src/supabase/schema.sql` in your project's SQL editor
(it defines profiles, vocabulary + examples/collocations/relations, kanji, per-user
`user_vocabulary` progress, quiz/review sessions, mistakes, daily activity/missions, weakness
scores, score predictions, and row-level security so every learner only ever sees their own
progress). `isSupabaseConfigured()` will then flip the app over to real auth and the Supabase
repository. Note: this path is structurally complete but has not been exercised against a live
Supabase project in this build — treat it as a solid starting point, not as pre-verified.

## Environment variables

See `.env.example` for the full list with explanations. Every variable is optional; the app is
fully functional with none of them set.

## Scripts

```bash
npm run dev         # start the dev server (Turbopack)
npm run build        # production build
npm run start        # run the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run test         # vitest run (unit tests: mastery, SRS, quiz scoring, JLPT estimate, streaks)
```

All four checks (lint, typecheck, test, build) currently pass clean.

## Notes on offline-safety

This project was built in a network-restricted sandbox, which surfaced two real-world
constraints worth knowing about if you deploy it somewhere similarly locked down:

- The `shadcn` CLI calls out to `ui.shadcn.com` to fetch component source — this build never
  depends on that call. Every primitive in `src/components/ui/` is hand-written directly against
  `@radix-ui/react-*` + `class-variance-authority`, following standard shadcn patterns.
- `next/font/google` fetches font files from `fonts.googleapis.com` at build time. This build
  uses system font stacks defined in `src/app/globals.css` instead (`--font-sans` / `--font-jp` /
  `--font-mono`), so `npm run build` succeeds with zero external network access.

Both are safe, standard patterns — not a compromise specific to this environment — and mean this
app is self-hostable without any third-party build-time dependency.

## Deploying to Vercel

This is a standard Next.js App Router project — connect the repo in the Vercel dashboard (or run
`vercel`) and it will build and deploy with no special configuration. Add the Supabase/AI
environment variables in the Vercel project settings only if/when you move off Demo Mode.

## Roadmap (not in this build)

Phase 2 (Synonym Battle, Collocation Master, Confusing Words drills, Kanji Network, a dedicated
weakness engine, mistake notebook), Phase 3 (Reading/Listening practice, full Mock Tests, the
"180 Project" long-term tracker), and Phase 4 (AI-adaptive learning using a real provider,
"Real Japanese" native-content practice, advanced scoring) are all designed for in the codebase's
layering (the `LearningRepository` and `AiService` abstractions exist specifically so these can
be added without reworking the core) but are not implemented here.
