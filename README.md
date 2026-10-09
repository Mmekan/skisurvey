# skisurvey

**A SURVEY FOR SKI**

SKI (Student Knowledge Interface) is an AI audio-visual learning tool for Nigerian university students — videos matched by department, course, and topic, where you can pause and ask questions tied to the exact timestamp, get quizzed mid-video, and get tested again when you're starting to forget.

**This repository is the survey, not the product.** It's a research instrument built to confirm or kill the thesis before any product code is written:

> Students can't get course-aligned explanations matched to what they're actually examined on, and can't check whether they understood — so they fail exams despite studying.

The full research spec — thesis, survey design, sealed analysis rules, video pipeline decisions — is in [`PROJECT_BIBLE.md`](PROJECT_BIBLE.md).

## Start here

| Document | What's in it |
|---|---|
| [`context.md`](context.md) | Full history, decisions and *why* they were made, known problems, and the exact next steps |
| [`PROJECT_BIBLE.md`](PROJECT_BIBLE.md) | The research spec: thesis, phases, sealed bias rules, Supabase schema, content pipeline |
| [`CLAUDE.md`](CLAUDE.md) | Operating rules for Claude Code — architecture conventions, bug list, how to continue |

If you're picking this up cold, read `context.md` first.

## Running it

Requires Node 18+.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

You also need a `.env.local` in this folder (gitignored, never committed):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Both values come from Supabase → Project Settings → API. Without them the survey renders but saves nothing.

> **One database setup step:** `supabase-contacts-patch.sql` must be run once in the Supabase SQL Editor. It adds a unique index and two RLS policies that the follow-up phone-number field depends on. Without it that field appears to save and silently doesn't.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · Supabase (Postgres + RLS) · react-router-dom v7

## How it's built

30 questions across 10 sections, driven entirely by `src/data/questions.json`. Adding a question means editing that one file — there are four question *types*, not 30 screens.

- **Branchings are data.** `showIf` clauses, not conditional JSX.
- **Answers are one row per question** (`answers` table), never a wide table.
- **The anon key can write but never read.** So Supabase is a one-way durable record, and `localStorage` is what makes resume work. The app can never restore its own state from the server — that's a consequence of the RLS design, not an oversight.
- **Phones numbers are segregated** into their own `contacts` table so consent-bearing data can be purged without touching real responses.

## Status

Phases 0–3 are complete. The survey runs end to end: branching, per-answer autosave, resume, validation, light/dark mode, and voice dictation. Phases 4–7 (admin dashboard, pilot, fielding, analysis) are untouched.

**Two things to know before fielding it:** the drafted question wording needs cross-checking against the original 54-question source document, and the iOS notch fix plus dictation have never been tested on physical hardware. Both are tracked in `context.md`.

## Data handling

Responses are anonymous by default — no identifying information is collected unless the respondent chooses to leave a phone number at the end. Every response carries an `is_test` flag; pilot and dev data is marked `true` and must be purged before fielding.
