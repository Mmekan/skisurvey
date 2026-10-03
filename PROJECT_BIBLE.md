# SKI — Project Bible

Everything about this project lives here. If you're picking this up on a new machine, a new Claude account, or just after a long break — read this top to bottom and you're caught up. Nothing in this doc depends on chat history existing anywhere.

Last compiled: 2026-10-02

---

## 1. The idea, in one sentence

SKI (Student Knowledge Interface) is an AI audio-visual learning tool for Nigerian university students: AI-generated videos tailored by department, course, and topic, where students can pause and ask questions tied to the exact timestamp, get quizzed mid-video, and get tested again on return visits.

## 2. The thesis being tested

> Students can't get course-aligned explanations matched to what they're actually examined on, and can't check whether they understood — so they fail exams despite studying.

Right now, nothing about SKI is built. The current active project is a **research survey** that confirms or kills this thesis before any product code gets written. This is the correct order — do not let "build the product" jump ahead of "validate the thesis."

## 3. Status as of last update

Keep this section current. Update it yourself or tell Claude/Claude Code to update it whenever a phase changes state.

| Phase | Status |
|---|---|
| 0 — Instrument (28 questions locked, rules sealed) | ✅ Done |
| 1 — Data spine (Supabase schema + RLS) | ✅ Schema + RLS created and **confirmed passing** (2026-10-02) — see §12 for the corrected test and the RETURNING/SELECT-policy gotcha that cost significant debugging time |
| 2 — Survey engine (React app, generic renderer) | ✅ Running locally. `questions.json`/`question.ts` schema, all 6 renderer components, and `SurveyScreen.tsx` (autosave, resume, branching via `showIf`) built and building cleanly. Responsive layout fixed (centered max-w-md column instead of full-bleed stretch on desktop); web-interface-guidelines pass applied (progress bar exposed to screen readers, form labels, hover states, inline validation messages, safe-area padding). Light/dark mode added — see CLAUDE.md "Dark mode" |
| 3 — Identity + static welcome | In progress — `WelcomeScreen.tsx` built as a **static** page (no animation) matching the latest approved mockup (sunset-red/orange, ivory, lime palette — see §6), explicitly marked subject to change. Glyph Portal (§8) was deliberately removed on 2026-10-02 — do not reintroduce without being asked. Real low-end-Android testing (§11 Phase 3 "done when") not yet done |
| 4 — Admin dashboard | Not started |
| 5 — Pilot (5–8 real students) | Not started |
| 6 — Fielding (distribution) | Not started |
| 7 — Analysis | Not started |

## 4. Product scope — feature tiers

| Tier | Features | Status |
|---|---|---|
| **Tier 0 — Spine (non-negotiable)** | Grounded content pipeline, timestamp Q&A, mid-video quizzes, return-visit memory test | This is the entire v1 |
| **Tier 1 — Cheap, high leverage** | Lock-in timer + end-of-session Q&A, flashcards/notes per topic, past-question drip, course-scoped sticky notes | After v1 proves out |
| **Tier 2 — Real cost, needs users** | Nigerian-language delivery (Efik, Ibibio, Yoruba, Hausa, Igbo), study rooms, WhatsApp access, photo Q&A | Needs scale first |
| **Tier 3 — Cut or deferred** | Webcam focus monitoring (**cut entirely** — trust cost too high), raffle, novels/comics (copyright risk — public domain or owned content only), smart recommendations, attendance game, study planner (**separate project**, don't rebuild inside SKI) | Do not build |

All three of timestamp Q&A, mid-video quizzes, and return tests derive from **one artifact**: the scene manifest (see §5). Building the manifest correctly makes all three nearly free.

## 5. Content/video pipeline decisions

**Rejected approach:** pure generative video (Kling/Higgsfield end-to-end). A 30-minute lesson would cost $75+ and risks rendering wrong formulas/diagrams — unacceptable for an education product.

**Chosen approach — programmatic video:**

| Tool | Role |
|---|---|
| **Remotion** | Main renderer — slides, text, diagrams, transitions. Timestamps are literally frame numbers. Free for individuals/small orgs, commercial use allowed |
| **Manim** | Math/physics/algorithm animation (3Blue1Brown's library, Python) |
| **TTS** (OpenAI/Azure/Kokoro) | Narration voice. Returns word-level timings |
| **Higgsfield API** | Atmospheric b-roll only — 2–3 short clips per lesson max, never the core content |

Estimated cost: **under $2 per 30-minute lesson**, vs $75+ for all-generative.

**Scene manifest** — the whole product hinges on this. Per scene: `start_ms`, `end_ms`, `concept_id`, `narration_text`, `source_excerpt`. Student pauses at a timestamp → retrieve that scene's grounded context → answer is accurate because it's anchored to real source material.

**Pipeline:** syllabus topic → grounding docs → lesson outline → script with scene markers → per-scene visual spec (JSON) → Remotion/Manim render + TTS → scene manifest → Supabase.

**Grounding rule (important, corrects an earlier wrong assumption):** Content should be grounded on **course manuals and past questions students are examined from**, not a general syllabus or "the lecturer's standard." For many Nigerian students, large lectures don't work well — students already self-teach from manuals/past questions or pay for private tutorials. A student saying "the lecturer's explanation was the problem" *supports* SKI, it doesn't threaten it. Private tutorials are SKI's real competitor to benchmark against, not the lecture hall.

**Format constraints:**
- 25–30 minutes max per full lesson, split into parts if needed
- Segmented into 8–10 minute chunks (15 min absolute max) with a test between segments
- No face on camera — faceless, at most an obviously-AI-generated face; strictly work-focused
- Adjustable video quality (good enough to see, low data use) — Nigerian students are on mobile data, every KB is friction

**Higgsfield API facts** (verified Sep 2026): self-serve, 50+ video/image models (Seedance, Kling, Wan, MiniMax, LTX, PixVerse, Recraft, Ideogram, Grok, plus Higgsfield's own Soul 2/Soul Cinema/DoP), pay-per-generation in USD, no subscription. Kling 2.5 = $0.042/sec, Soul 2 image = $0.0032/image. Balance expires 1 year after top-up. **Outputs stored only 7 days — must download to own storage immediately.** Commercial use permitted. 20 concurrent requests on first key.

**Multilingual (later-stage, not current build):** English + Efik, Ibibio, Yoruba, Hausa, Igbo. Plan: pay students hourly to record voice data for a custom voice model.

## 6. Brand & design system

| Token | Value |
|---|---|
| Brown | `#4B2E2A` |
| Orange | `#D16F2E` (fails WCAG for small text on cream — 3.2:1 contrast) |
| Orange, dark | `#A34E1A` (use for small text/labels instead) |
| Amber | `#F9A136` |
| Cream | `#FEF3E0` |
| Font | DM Sans (loaded via Google Fonts `<link>` tags in `index.html`, variable weight 400–900) |

Wordmark: "S.K.I" in DM Sans Black, hard color bands. No logo file exists yet.

**Mockup artifact** (phone + admin screens, interactive): `https://claude.ai/artifact/3fi6XWDcDegXhzjuAky3nw`

**Second palette — Welcome screen only (added 2026-10-02):** the latest approved Welcome mockup uses a different, warmer palette than the rest of the survey. Both palettes live side by side in `src/index.css`'s `@theme` block; this second set is scoped to `WelcomeScreen.tsx` only, every other screen still uses the brown/orange/amber/cream set above.

| Token | Value |
|---|---|
| Sunset red | `#E6412A` |
| Sunset orange | `#F5891E` |
| Ivory | `#FBF2CF` |
| Lime | `#5C8A1F` |
| Ink | `#3D1810` |

This is explicitly **subject to change** — the Welcome screen design isn't locked, code is just following the latest mockup for now.

## 7. Competitive / IP notes

**Acadeva** exists (gitblind.noratr.app/Acadeva, verified Oct 2026): "We connect students to verified school news, study materials, timetables, updates, and creator content." This is a content/distribution platform — not a generated-video-plus-timestamp-Q&A product. Different shape of company, not a direct clone risk today.

**Working IP-protection policy:**
- The concept-validation screen in the survey describes the *experience* only (pause a video, ask a question, get tested) — never the *mechanism* (no mention of Remotion, Higgsfield, scene manifests, grounding strategy, or unbuilt roadmap features).
- Survey distribution stays semi-private — targeted `?src=` channel links, not open social media blasts.
- Real protection at this stage comes from execution speed and the grounding pipeline being genuinely hard to replicate, not from NDAs or secrecy on a student survey. A provisional patent is not worth pursuing for a feature set like this — too slow, too expensive, weak protection.

**Final concept screen copy** (outcome-level, matches current Tier 0 scope exactly):

> **One idea we want your honest take on.**
> Imagine a platform where you can:
> - Learn from videos matched to your exact course and topic
> - Pause and ask a question about exactly what you just watched
> - Get tested on what you just learned, right after you learn it
> - Come back later and get quizzed on what you're starting to forget
>
> *There's no right answer. Tell us what's wrong with it too.*

(Earlier draft included a 5th item — "get study recommendations based on your progress" — cut because it's a Tier 3 feature not in the MVP; testing it wastes a data point and gives away an unbuilt idea for free.)

## 8. Glyph Portal — REMOVED, do not reintroduce without being asked

This was the original welcome-screen plan: a giant "S.K.I" letterform that zoomed into a randomly-picked letter (S/K/I) on scroll, with a "Step inside" link to skip the animation, a reduced-motion fallback, and a kill switch (it would have been the heaviest component in the app — a jank at question zero costs the whole response).

**Deliberately cut on 2026-10-02.** `WelcomeScreen.tsx` is now fully static, no animation, matching the sunset/ivory mockup in §6. `GlyphPortal.tsx` was deleted from the codebase. This section is kept only as a historical record of the decision — if Glyph Portal ever comes back, it must be an explicit ask, not a rebuild from this old spec.

## 9. The research survey — 29 locked questions

Branching: Q21 gates Q23, Q24 gates Q26, Q40 "None" skips Q42+Q43. Concept block (Q45 → Q45_why → Q45_missing → Q46 → Q49) renders **last**, after all problem-diagnosis questions — asking about SKI first would prime every earlier answer. A student who skips all branches sees ~24 of 30 total screens. Estimated 10–12 minutes (unverified — pilot will measure it).

**8 required typed answers:** Q9, Q10, Q20, Q36, Q43, Q45_why, Q49, Q52. (This line and the branching note above had drifted out of sync with the table below after the Q45 restructure — fixed now; table was always correct.)

| # | Section | Asks | Type |
|---|---|---|---|
| Q1 | About you | Level (100 Level / 200 Level / 300 Level / 400 Level / 500 Level+ / Postgraduate / Other) | Tap |
| Q2 | About you | Department (picker, not free text) | Tap |
| Q5 | About you | Academic performance | Tap |
| Q9 | How you study | A recent topic you struggled with + what you did about it | Typed, **required** |
| Q10 | How you study | What eventually helped | Typed, **required** |
| Q12 | How you study | What you do when you don't understand (includes lecturer-related options) | Pick up to 3 |
| Q13 | How you study | What you do when stuck (added: "private tutorial/lesson", "re-read manual/notes") | Tap |
| Q15 | Understanding | *(exact wording not preserved — check original 54-question source doc)* | Pick up to 3 |
| Q16 | Understanding | *(exact wording not preserved)* | Typed, optional |
| Q20 | Understanding | How you know you actually understand something | Typed, **required** |
| Q21 | YouTube/AI | How often you use YouTube for studying | Tap — gates Q23 |
| Q23 | YouTube/AI | What frustrates you about YouTube for studying (options: not aligned to course, can't ask about exact part, no way to test myself, can't find exact topic, videos too long, data consumption, too much irrelevant info, don't know what to watch next, ads/distractions, other) | Multi-select |
| Q24 | YouTube/AI | How often you use AI tools for studying | Tap — gates Q26 |
| Q26 | YouTube/AI | Problems you've had using AI for studying | Typed, optional |
| Q27 | YouTube/AI | What you wish AI did better for students | Typed, optional |
| Q32 | Exams | *(exact wording not preserved)* | Typed, optional |
| Q35 | Exams | Biggest exam-prep problems (options: not enough time, too much material, don't know what to prioritize, don't understand topics, forgetting what I studied, lack of practice questions, poor study discipline, anxiety/stress, poor materials, other) | Pick up to 3 |
| Q36 | One thing | "If you could fix one thing about how you study, a problem you'd solve or something you'd change, what would it be?" *(merged with original Q38)* | Typed, **required** |
| Q40 | What you use now | Name a platform/app, "None" button skips Q42+Q43 | Short text |
| Q42 | What you use now | *(exact wording not preserved — about that platform)* | Typed, optional |
| Q43 | What you use now | "If you stopped using it tomorrow, what would you miss most?" *(merged with original Q41)* | Typed, **required** |
| — | SKI idea | Concept screen (see §7 for final copy) | — |
| Q45 | SKI idea | Pick 2 of 8 SKI features you'd use most (shared 8-feature list, see `questions.json`) | Pick exactly 2 |
| Q45_why | SKI idea | Why you picked those two | Typed, **required** |
| Q45_missing | SKI idea | One feature you wish was on the list | Typed, optional |
| Q46 | SKI idea | Which single one of the 8 feels least useful | Tap |
| Q49 | SKI idea | What SKI would get wrong | Typed, **required** |
| Q50 | Paying | One-tap warm-up (would you pay, roughly) | Tap |
| Q52 | Paying | What would make you actually pay | Typed, **required** |
| Q53/54 | Follow-up | Opt-in to interview + contact info, consent line above the contact box only | Optional |

**Dropped from the original 54:** Q3/Q4 (little variation, tag source in link instead), Q6–Q8/Q22/Q25 (tick-lists everyone ticks), Q11/Q14/Q17/Q19/Q33/Q34 (frequency scales already covered elsewhere), Q18/Q28–31 (tests a feature — lock-in timer — not the thesis; second survey material), Q37/Q44/Q47/Q51 (redundant with kept questions; Q51 price bands are weak evidence since people can't predict what they'd pay).

**Where exact wording is missing above:** the full original 54-question document is the source of truth for verbatim phrasing — this bible preserves purpose, type, and options, not every word.

**All 15 `TODO` placeholders in `questions.json` were filled in on 2026-10-02 with reasonable drafted content**, since the original 54-question source doc wasn't available in this session. This includes: the Q2 department list, Q5 performance tiers (Nigerian degree classification), Q12/Q13 options, Q15/Q16 prompt + options, the Q21/Q24 frequency scales (`Never`/`Rarely`/`Sometimes`/`Often`/`Every time I study`), Q32/Q42 prompts, and Q50 pay-willingness options. **None of this is verbatim from the real source** — it's a best-effort placeholder so the survey is testable end-to-end. Before fielding (Phase 6), cross-check every one of these against the actual 54-question doc, especially Q12/Q15 (the bible previously flagged these as having lecturer-related and understanding-check options that may carry Phase-0 bias-trap implications — see §10).

**Revised during Phase 2 implementation (2026-10-02):** Q45 was split into a 2-pick multi-select plus two follow-ups (`Q45_why` required, `Q45_missing` optional) to get richer signal than a single tap; Q46 was narrowed to one "least useful" pick instead of a second multi-pick; Q48 was cut entirely as redundant once Q45/Q45_why/Q46/Q49 covered the same ground. `questions.json` is the current source of truth for this block — update this table, not the other way around, if they ever diverge again.

**No consent column/screen exists currently.** Only Q53/54 has a consent line (for contact info). This was a deliberate decision, not an oversight — revisit before fielding if a general participation consent line is wanted.

## 10. Phase 0 — sealed rules (bias-tested, written before any data exists)

| Rule | Confirms thesis if | Kills/redirects if |
|---|---|---|
| **Q23** | 2+ of "not aligned to my course," "can't ask about exact part," "no way to test myself" in top 3 (among YouTube users) | None of them in top 3 → thesis dead. Exactly 1 → weak, read long answers |
| **Lecturer test** | — | 1-in-3+ of Q9 typed answers or Q12 top-3 picks name the lecturer's method → ground content on manuals/past questions, not syllabus (already the plan — see §5) |
| **Q10** | Sealed prediction: dominated by "a person explaining it" → timestamp Q&A is the make-or-break feature, videos are what it hangs on | Dominated by "material" → lean harder on manual-grounded video quality instead |
| **Q35** | 2+ "Core" options (don't understand topics, forgetting, lack of practice questions, poor materials) in top 3 → SKI aimed right | "Don't know what to prioritize"/"too much material" #1 → move exam-focused/planner features up roadmap. "Not enough time"/"anxiety"/"discipline" #1 → rethink the exam-season pitch entirely |
| **Q52** | Answers cluster on specific features → price around that feature | Cluster on price point → consider freemium. Cluster on proof/trust → need a free trial before monetizing |
| **Q49** | — | "AI explains wrong" → need visible sourcing in the product. "Won't cover my course" → coverage matters more than polish. "I won't use it, same as YouTube" → move habit/retention features earlier in roadmap. "Data cost" → offline-friendly delivery over rich production |

**Bias traps already caught during Phase 0 (don't repeat these):**
- A rule where every possible answer has a "SKI fix" can't fail — it isn't a test. (Caught on first Q23 draft.)
- Defending a bad hypothetical result instead of letting it count against the thesis is a reflex, not a research habit.
- An imported premise ("the lecturer is the standard to match") can be wrong for this specific context — check local knowledge before sealing a rule.
- Self-report questions undercount sensitive topics (e.g., Q9 never directly asks about the lecturer) — set thresholds lower to compensate.
- Thresholds must match realistic sample size (don't seal "3 in 4" when N≈40 means you'd never observe it).
- The founder's own survey answers may not be typical — mark any self-completed run `is_test` and treat the gap between prediction and real data as the valuable finding, not noise.

## 11. Build phase roadmap (0–7)

| # | Phase | Goal | Done when | Trap to avoid |
|---|---|---|---|---|
| 0 | Instrument | 28 questions frozen, written confirm-or-kill rules | Every gold question has a written rule before any data exists | Designing UI before questions are frozen |
| 1 | Data spine | Supabase schema, RLS, `is_test` field | Fake partial response inserts cleanly via anon key; anon key cannot read any row back | One wide table — use answer-per-row |
| 2 | Survey engine | Generic renderer driven by `questions.json`; autosave; resume; branching | Adding a question = editing JSON only | Hardcoding 29 screens — there are ~6 question types |
| 3 | Identity + static welcome | DM Sans, palette, static welcome screen matching mockup (no animation — Glyph Portal cut, see §8) | Tested on a real low-end Android on mobile data, not desktop Chrome | N/A — static screen has no animation-jank risk |
| 4 | Admin | Login, live feed, question explorer, filters, CSV export | "What frustrates 100-level students about YouTube?" answerable in 30 seconds | Building charts before knowing data shapes — ship CSV first |
| 5 | Pilot | 5–8 students, in person, timed, unhelped | Median under 12 min, 6/8 finish, nobody asks "what does this mean?" | Sending to friends and asking "is it good?" is not a pilot. Purge pilot rows before launch |
| 6 | Fielding | Domain, per-channel `?src=` links, incentive decision, dedupe | N hit, spread across 3+ departments, 2+ levels | All responses from your own coursemates is surveying yourself |
| 7 | Analysis | Theme-code long answers, test against Phase 0 rules, ~10 follow-up interviews | One sentence: thesis held, shifted, or died | Producing a deck instead of a decision |

**Timing constraint:** semester starts November, serious coursework from late November. Phases 0–5 fit before then. Phase 6 (fielding) should not happen during exam season — rushed or zero responses.

**Sample size reality:** 20–30 thoughtful typed responses is genuinely informative for themes. 100+ needed for trustworthy percentages. Either way, this is a convenience sample from one or two schools — directional, not representative. Say so in any write-up.

## 12. Supabase schema (current, final)

```sql
create extension if not exists pgcrypto;

create table respondents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  source text,                              -- from ?src= link, tracks which channel
  is_test boolean not null default false    -- flip true for pilot/dev/self-test data
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  respondent_id uuid not null references respondents(id) on delete cascade,
  question_id text not null,       -- 'Q9', 'Q23', etc — matches questions.json
  value jsonb not null,
  answered_at timestamptz not null default now(),
  unique (respondent_id, question_id)   -- lets autosave upsert
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  respondent_id uuid not null references respondents(id) on delete cascade,
  phone text not null,
  consent_at timestamptz not null default now()
);

create index idx_answers_question_id on answers(question_id);
create index idx_answers_respondent_id on answers(respondent_id);
```

**RLS:**

```sql
alter table respondents enable row level security;
alter table answers enable row level security;
alter table contacts enable row level security;

create policy "anon insert respondent" on respondents for insert to anon with check (true);
create policy "anon update respondent" on respondents for update to anon using (true) with check (true);
create policy "anon insert answer" on answers for insert to anon with check (true);
create policy "anon update answer" on answers for update to anon using (true) with check (true);
create policy "anon insert contact" on contacts for insert to anon with check (true);

-- No SELECT policy anywhere for anon. Admin dashboard (Phase 4) reads via
-- service_role key from a server function, which bypasses RLS entirely.
```

**Known accepted gap:** anon has no identity, so UPDATE policies aren't scoped to "your own row" — only by the client holding a UUID it can't easily guess. Acceptable for MVP; harden with a per-session token later if it ever matters.

**Project was fully recreated on 2026-10-02.** The original project (ref `naccceacrvxhnahtxrhq`) was deleted after an extended RLS debugging session that turned out to be a red herring (see the gotcha below — the real bug was never the project or policies). Current project ref is `pxrfmjeoqvuwnpiqdepw`. `VITE_SUPABASE_ANON_KEY` in `.env.local` is currently Supabase's newer **publishable key** format (`sb_publishable_...`), not the legacy anon JWT — both work identically for this app (just pass whichever one the dashboard's Project Settings → API page shows as the client-side key).

**Fake-insert verification test** (run this after any RLS change):

**Known gotcha (cost ~2 hours of debugging on 2026-10-02, do not repeat):** `.insert(...).select().single()` will **always** throw `42501 "new row violates row-level security policy"` on this schema, even when the insert itself is perfectly valid and the policies are correct. This is because `INSERT ... RETURNING` under RLS also requires the new row to satisfy a `SELECT` policy — and this schema deliberately has **no SELECT policy for anon** (see above). The fix is to generate the id client-side and never call `.select()` on an anon insert into these tables. The test below reflects this; so does the real app code in `src/screens/SurveyScreen.tsx`.

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const respondentId = crypto.randomUUID()
const { error: e1 } = await supabase
  .from('respondents').insert({ id: respondentId, source: 'test', is_test: true })
console.log('insert respondent error:', e1) // should be null

const { error: e2 } = await supabase.from('answers').insert([
  { respondent_id: respondentId, question_id: 'Q1', value: '"200"' },
  { respondent_id: respondentId, question_id: 'Q9', value: '"test answer"' }
])
console.log('insert answers error:', e2) // should be null

const { data: readBack, error: e3 } = await supabase.from('respondents').select('*')
console.log('read back:', readBack, e3) // should be empty array or RLS error — never the test row
```

## 13. Supabase alternatives considered (and rejected)

| Option | Why not chosen |
|---|---|
| Firebase/Firestore | NoSQL — answer-per-row model gets clunkier; different security-rules mental model to learn from scratch |
| PocketBase | Self-hosted — one more thing to deploy/maintain vs managed Supabase+Vercel |
| Appwrite | Smaller ecosystem, less Postgres-native tooling |
| Neon + custom auth | Would mean hand-building auth/admin login Supabase gives for free |

Decision: stay on Supabase — already known, Postgres+RLS+realtime+auth+storage in one, no migration benefit.

## 14. React/Vite project setup

```bash
npm create vite@latest ski-survey -- --template react-ts
cd ski-survey
npm install
npm install @supabase/supabase-js react-router-dom
npm install tailwindcss @tailwindcss/vite
```

**Tailwind v4 — CSS-first config, no `tailwind.config.js`, no PostCSS, no `init` command.**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`src/index.css` — theme tokens defined directly in CSS via `@theme`, replacing what used to be `tailwind.config.js`:
```css
@import "tailwindcss";

@theme {
  --color-brown: #4B2E2A;
  --color-orange: #D16F2E;
  --color-orange-dark: #A34E1A;
  --color-amber: #F9A136;
  --color-cream: #FEF3E0;
  --font-sans: "DM Sans", system-ui, sans-serif;
}
```
This auto-generates `bg-brown`, `text-orange-dark`, `bg-amber`, `bg-cream`, `font-sans`, etc. — no separate config file to maintain. (In the current codebase this block also carries the Welcome-only palette from §6 — `sunset-red`, `sunset-orange`, `ivory`, `lime`, `ink` — plus a `body` rule setting the cream background, brown text, and `font-sans` app-wide.)

`index.html` also needs the DM Sans Google Fonts `<link>` tags in `<head>` (preconnect to `fonts.googleapis.com`/`fonts.gstatic.com`, then the stylesheet link) — without these the `--font-sans` token falls back to system fonts.

`.env.local` (never commit):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Folder structure — see `CLAUDE.md` §"Folder structure" (kept there since Claude Code references it directly on every session).

## 15. Claude Code skills installed for this project

Installed via `npx skills add <owner/repo@skill> -g -y` (global — available in every Claude Code session on this machine, not repo-scoped).

| Skill | Source | What it's for |
|---|---|---|
| `playwright-cli` | microsoft/playwright-cli | Automate browser interactions, test web pages, run Playwright tests — use for e2e-testing the survey flow (Phases 2/3/5) |
| `image-to-code` | leonxlnx/taste-skill | Given a design image/mockup, analyze it deeply and implement matching UI — use against the mockup artifact in §6 when building real screens |
| `shadcn` | shadcn-ui/ui | Add/manage shadcn/ui components — relevant once question-type components need polished form controls |
| `web-design-guidelines` | vercel-labs/agent-skills | Reviews UI code against web interface best practices (accessibility, UX conventions) — run before the Phase 5 pilot |
| `design-taste-frontend` | leonxlnx/taste-skill | General design-taste guidance for frontend work — use for the visual polish pass in Phase 3 |

Socket flagged `playwright-cli` and `shadcn` with 1 alert each (still rated Safe / Low-Med risk by Gen/Snyk) — not blocking, just worth a glance before leaning on them heavily.

## 16. How to resume this project cold

1. Read this file top to bottom.
2. Check §3 (Status) for the real current phase.
3. If code exists already, open `CLAUDE.md` in the repo root — it has the operating rules Claude Code needs.
4. If Phase 1's fake-insert test (§12) hasn't been confirmed passing, run it before writing any more app code — don't trust unverified RLS.
5. Next undone phase in §11 is the next thing to work on. Don't skip ahead to Phase 2+ work if Phase 0/1 items are still open.

**To make this portable:** commit both `CLAUDE.md` and `PROJECT_BIBLE.md` to the repo and push to a remote (GitHub, etc.). A local-only copy does not survive a PC change — only something in version control, or saved somewhere outside this chat, does.
