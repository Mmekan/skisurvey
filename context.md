# context.md — SKI Research Survey

**Purpose:** a complete, self-contained handoff. Someone picking this up cold — on a new machine, a new Claude Code account, or after a long gap — should be able to read this top to bottom and continue without any chat history.

**Last updated:** 2026-10-03
**App location:** `SKI SURVEY/ski-survey/`
**Companion docs:** `CLAUDE.md` (operating rules — auto-loaded by Claude Code) and `PROJECT_BIBLE.md` (long-form research spec: thesis, phases, sealed rules, schema, video pipeline)

---

## Read this first — the three things that matter most

1. **Nothing here is in version control.** `SKI SURVEY/` is not a git repository. A `.gitignore` exists, but nothing is tracked, there is no remote, and there is no backup. Every line of work so far exists in exactly one folder on one machine. `git init` + a first commit is the highest-value action available, and it takes two minutes.
2. **The survey's wording is partly invented.** All 15 `TODO` placeholders in `questions.json` were filled with drafted content because the original 54-question source document was not available in that session. The survey is end-to-end testable, but the wording is **not** verbatim from the real instrument. It must be cross-checked before the survey is fielded with real respondents, or the data will not mean what it appears to mean.
3. **This is a research instrument, not a product.** The thesis is what matters. Phases 0–3 built the instrument; the survey existing and looking good is not evidence the thesis holds. Only data from real students can answer that.

---

## Where the project stands

### By phase

| Phase | Status | Notes |
|---|---|---|
| 0 — Instrument | ✅ Complete | Questions frozen; confirm-or-kill rules written *before* any data existed. This ordering was deliberate. |
| 1 — Data spine | ✅ Complete, verified | Supabase schema + RLS created; fake-insert test passing as of 2026-10-02. |
| 2 — Survey engine | ✅ Complete | Generic renderer, autosave, resume, branching, validation. Building cleanly. |
| 3 — Identity + welcome | ⚠️ Functionally done, **not verified on real devices** | Static `WelcomeScreen.tsx` built. Two fixes (iOS notch seam, mic unmount leak) have never been tested on physical hardware. |
| 4 — Admin dashboard | ❌ Not started | Login, live feed, question explorer, CSV export. |
| 5 — Pilot (5–8 students) | ❌ Not started | In person, timed, unhelped. |
| 6 — Fielding | ❌ Not started | Requires the questions.json wording fix above. |
| 7 — Analysis | ❌ Not started | Requires `completed_at` to be written (bug list item 1). |

### What the app can do right now

Run `npm run dev`, open `localhost:5173`. The Welcome screen renders; "Step inside" navigates to the survey; 29 questions across 10 sections render with working branching (`showIf`), per-answer autosave to Supabase, resume-from-localStorage on reload, inline validation, light/dark mode, and voice dictation on text questions. `npm run build` passes.

### Known limitation, stated plainly

The last screen is a placeholder string — *"Survey complete — thank you screen goes here."* There is no thank-you screen, no completion event, no `completed_at` write, and no contact-row write. This is the single biggest functional gap and it sits directly on the path to Phase 5.

---

## What has been completed, in order

This is the chronological history of the build, so a future session understands *how* the current state came to be — not just what it is.

### 1. Project scaffolding and the Tailwind v4 problem

The repo was created with `npm create vite@latest -- --template react-ts`. The first real obstacle was `npm error could not determine executable to run`, thrown when running `npx tailwindcss init -p`. Tailwind v4 had removed the CLI from the main package.

The fix was to migrate to v4's native model rather than force the old one: `@tailwindcss/vite` in `vite.config.ts`, `@import "tailwindcss"` plus an `@theme` block in `src/index.css`, and **no** `tailwind.config.js`, **no** PostCSS config, **no** init step. All design tokens are CSS custom properties in that `@theme` block.

Two directory-hygiene problems surfaced around the same time. A stray `package.json`/`node_modules` existed in the parent `SKI SURVEY/` folder as well as in `ski-survey/`, so installs were landing in the wrong place — the parent copies were deleted. And `.env.local` had been placed at `src/.env.local`; Vite only reads env files from the project root, so the Supabase variables were silently not loading. It was moved to `ski-survey/.env.local`.

`src/lib/supabase.ts` was also moved from `src/assets/lib/` to `src/lib/`, matching the intended structure. No imports referenced the old location, so it was a clean move.

### 2. RLS setup — and the debugging session that cost the most

This was the longest and most painful part of the project. The fake-insert verification test kept failing with `42501: new row violates row-level security policy`, and the failure was indistinguishable from a genuine misconfiguration.

Everything reasonable was tried: inspected `pg_policies`, checked table grants, checked role attributes, dropped and recreated tables, tested both the legacy anon JWT and the new publishable key. All failed identically. At the point where no further hypothesis was available, **the entire Supabase project was deleted and recreated from scratch** — a decision made explicitly to stop debugging a potentially-corrupt resource rather than to keep going. The replacement project (`pxrfmjeoqvuwnpiqdepw`) behaved exactly the same, which was the signal that the project itself was never the problem.

The actual cause was found by dropping to raw `curl` and testing without the `Prefer: return=representation` header — which returned `201 Created` immediately. The root cause: **`INSERT ... RETURNING` under RLS also requires the newly inserted row to pass a `SELECT` policy, and this schema deliberately has no `SELECT` policy for the anon role.** Every Supabase-js `.insert().select().single()` call was implicitly requesting `RETURNING`, so it failed on a policy that was correct by design.

The fix, applied everywhere: generate the row's UUID client-side with `crypto.randomUUID()` and insert it explicitly, never calling `.select()`. This is now architecture rule 8 in `CLAUDE.md` and is documented in the test itself, so it cannot be reintroduced without someone having to read why.

### 3. The survey engine

Built as a generic renderer driven entirely by `questions.json`, with four question types (`tap`, `multiSelect`, `text`, `concept`). Branching is data, not code — each question can carry a `showIf` clause evaluated against the answers collected so far.

State is split deliberately: **localStorage holds everything interactive, Supabase is a one-way durable backup.** This is forced by the RLS design — the anon key can write but never read back, so it can never restore a session from the server. Resume therefore works off `localStorage` (three keys: `ski_respondent_id`, `ski_answers`, `ski_question_index`) and Supabase accumulates an append-only record.

All 15 `TODO` placeholders in `questions.json` were filled with drafted content, including a 25-entry Nigerian-university department list, Nigerian degree classifications, and a five-point study-frequency scale. This is bug-listed in `CLAUDE.md` because the drafted wording carries a real risk: several drafted items touch the lecturer-bias area that Phase 0 identified as a trap, and the drafted wording may not match the sealed rules in `PROJECT_BIBLE.md` §10.

### 4. Responsive layout fix

The first working version looked bad on desktop — full-bleed content stretched across a wide monitor. Fixed by wrapping every screen in a centred `w-full max-w-md` column. Verified by screenshot at 1440×900, 900px, 414px, 390px and 375px.

### 5. Accessibility and interface-guidelines pass

Ran the `web-design-guidelines` skill and applied all ten findings. The substantive changes: `ProgressBar` got `role="progressbar"` with `aria-valuenow/min/max` and a "Section N of M" label; the progress bar's decorative segments became `aria-hidden`; textareas got real `aria-label`s; buttons got `hover` states; inline validation messages replaced the disabled-button-with-no-explanation pattern; and safe-area padding was added throughout.

### 6. Dark mode

Added after the guidelines pass. The defining constraint came from the user: *"dark mode makes the color of pages to match page 7 but page 7 becomes light"* — page 7 being the Concept screen, which is styled inverted (`bg-brown`/`text-cream`) relative to every other screen.

The elegant solution was a **token-value swap** in `src/index.css` rather than per-screen overrides:

```css
.dark {
  --color-brown: #FEF3E0;   /* was #4B2E2A */
  --color-cream: #4B2E2A;   /* was #FEF3E0 */
}
```

Because the values swap, every normal screen inverts automatically — and so does the Concept screen, which already used those two tokens the other way round, so it flips to the *light* look while everything around it goes dark. The inversion the user asked for falls out of the mechanism for free.

The corollary rule: don't add `dark:` background overrides for brown/cream on any screen. Add them only for things that don't use those two tokens — hardcoded `bg-white` card surfaces get `dark:bg-ink`, and every hardcoded `shadow-[0_4px_0_#4B2E2A]` literal was converted to `shadow-[0_4px_0_var(--color-brown)]` so shadows swap too.

### 7. The theme toggle — three rejected designs

Worth recording because the reasoning isn't recoverable from the code:

1. **Fixed-position, top-right.** Overlapped the progress bar. Looked like a bug, not a control. Rejected.
2. **Lever-switch** (red knob sliding in a grey track), matching a reference image the user supplied. Rejected — *"I don't like it."*
3. **Rocker switch** with Light/Dark labels. Rejected on size and placement: *"take it away from the home screen, it has no purpose there, and reduce the size a lot more and at the left not right."*

What shipped: a compact `h-6 w-11` pill, left-aligned, in normal flow directly above the Continue row, **only** in `SurveyScreen`. Final refinement — *"let the orange/yellow ball be the same size of the border"* — grew the amber knob from `h-3.5` to `h-5` and removed the `p-0.5` padding so it exactly fills the track.

The toggle defaults to light on first visit with **no** `prefers-color-scheme` detection, and persists to `localStorage` under `ski_theme`.

### 8. The iOS notch seam — a misunderstanding, then the real fix

Two separate issues were conflated here.

**First (resolved): page overflow.** Long option lists — Q2's 25-department picker in particular — pushed the Continue button off-screen. Fixed by making the outer container `h-dvh overflow-hidden` and giving only the question content area `flex-1 overflow-y-auto`, so the progress bar, validation message, toggle, and Back/Continue row stay pinned and reachable regardless of list length.

**Second (the actual reported problem):** *"the page should have one consistent color — like on my iPhone 11 Pro when I look at the notch area I see a color different from the main page at the area where I see time and battery, same thing when I scroll like I want to go past the page."* This is iOS Safari's overscroll rubber-band and notch rendering falling through to white. The fix required all four of: `viewport-fit=cover` on the viewport meta; background colour set on **`html`** rather than only `body`; the `h-dvh` + safe-area padding pattern on every full-screen container; and a new `src/lib/theme.ts` exporting `setThemeColor()` to keep `<meta name="theme-color">` in sync — Welcome resets it to ivory on mount, Survey restores the correct cream based on current dark state, and the toggle updates it live on every change.

**This fix is unverified on real hardware.** Headless Chrome cannot reproduce a notch or a rubber-band bounce.

### 9. The microphone bug

Reported as: *"when I dictate, the mic translates, but after translation the icon behaves like it has stopped recording while it's still recording in the background."*

The cause was a missing unmount cleanup. Navigating to the next question unmounted `TextQuestion`, which removed the mic button from the screen — so it looked stopped — but nothing ever called `.stop()` on the orphaned `SpeechRecognition` object, which kept listening indefinitely with no UI attached. Fixed with a `useEffect` cleanup plus an `onerror` handler that resets the listening state.

The mic itself was also redesigned in this session. It was an emoji button below the field; it rendered inconsistently across platforms and wasted vertical space. It's now a stroke SVG absolutely positioned inside the textarea's bottom-right corner, with the textarea carrying `pr-14` to make room, and an `animate-pulse` when listening.

### 10. Welcome screen visual polish

A long sequence of small, precisely-specified adjustments, each verified by screenshot at 375px:

- Added *"if you do"* to the hero, as a separate italic line beneath it
- Moved the word "study" inline beside the three overlapping colour balls
- Tightened the wordmark line spacing (`leading-[1.2]`)
- Raised the hero text; added a line of space between hero and explainer
- Reduced then re-enlarged the decorative circle so "SKI" sits inside it (`h-56`)
- Redistributed bottom space using two `flex-1` spacers so the CTA sits in the lower-middle
- Reduced the space above the hero (`pt-7` → `pt-6`)

### 11. This handoff (2026-10-03)

Full codebase read and analysed; `CLAUDE.md` rewritten with architecture conventions, current implementations, dependencies, a bug list, and continuation instructions; this file created.

---

## Important decisions and why they were made

### Validate the thesis before building the product

Nothing about SKI itself has been built. The survey exists to confirm or kill the thesis first. Writing product code before the thesis is validated risks spending months building something whose premise turns out to be false — and would make the failure harder to see, because sunk cost makes bad results look like near-misses. **Any pressure to "just start building SKI" should be evaluated against this.**

### Programmatic video, not generative video

Pure end-to-end generative video (Kling/Higgsfield) was rejected: ~$75+ per 30-minute lesson, and formulas and diagrams render wrong often enough to be unacceptable in an education product. The chosen pipeline is Remotion for slides/diagrams/transitions, Manim for mathematical animation, TTS for narration, and Higgsfield strictly for 2–3 atmospheric b-roll clips per lesson. Estimated cost: **under $2 per lesson**.

The deeper reason: timestamps in Remotion are frame numbers. A scene manifest — `start_ms`, `end_ms`, `concept_id`, `narration_text`, `source_excerpt` — makes timestamp Q&A, mid-video quizzes, and return-visit memory tests all derive from one artifact. Building the manifest correctly makes three Tier-0 features nearly free.

### Ground content on manuals and past questions, not the syllabus

This corrects an earlier wrong assumption. Content should be grounded in what students are **examined** from — course manuals and past questions — not a general syllabus or "the lecturer's standard."

The reasoning is local: large lectures don't work well for many Nigerian students. They already self-teach from manuals and past questions, or pay for private tutorials. A respondent blaming the lecturer's explanation **supports** SKI rather than threatening it. Private tutorials, not the lecture hall, are the real competitor to benchmark against.

### Concept screen describes outcomes, never mechanism

The survey tells respondents what the experience would be like. It never mentions Remotion, Higgsfield, scene manifests, grounding strategy, or any unbuilt roadmap feature.

This is an IP-protection decision. Real protection at this stage comes from execution speed and from the grounding pipeline being genuinely hard to replicate — not from secrecy in a student survey, and not from a provisional patent, which would be too slow and too expensive for weak protection. An earlier draft included a fifth feature ("study recommendations based on your progress") and it was cut because it describes a Tier-3 feature not in the MVP: testing it wastes a data point and gives away an unbuilt idea for free.

### Glyph Portal was cut deliberately

The original welcome-screen concept — a giant S.K.I letterform zooming into a random letter on scroll — was **cut on 2026-10-02** and `GlyphPortal.tsx` was deleted. It would have been the heaviest component in the app, and a jank at question zero risks the whole response. `PROJECT_BIBLE.md` §8 keeps the record so it isn't accidentally rebuilt from a stale spec.

### Answer-per-row, never a wide table

`respondents` + `answers` (one row per question) + `contacts` rather than one row per respondent with 54 columns. A wide table would need a migration for every question added during Phase 0, and the `answers` table's `unique (respondent_id, question_id)` constraint is what makes autosave a clean upsert.

`contacts` is a **separate table on purpose** — so consent-bearing phone numbers are isolable and purgeable under a retention policy. (Which makes bug-list item 2, that `contacts` is never written, a genuine problem rather than a cosmetic one.)

### RLS gives anon write-only access

The anon key can INSERT and UPDATE, never SELECT. Responses are one-way: the client writes, the admin dashboard reads via `service_role` from a server function that bypasses RLS entirely. This means **the app can never verify or restore its own data from the server** — which is exactly why localStorage carries all interactive state.

**Accepted gap:** anon has no identity, so the UPDATE policies aren't scoped to "your own row" — only protected by the client holding an unguessable UUID. Acceptable for MVP; harden with a per-session token if it ever matters.

### Static welcome screen, code follows mockup

The Welcome screen is explicitly **not a locked design**. Code is following the latest approved mockup, subject to change. Its palette (sunset-red/orange/ivory/lime/ink) is separate from the core brand palette used by every other screen.

### Survey distribution stays semi-private

Targeted `?src=` channel links, not open social-media blasts. `SurveyScreen` already reads `?src=` and writes it to `respondents.source`. Two reasons: it keeps the sample interpretable (you can tell which channel produced which responses), and it reduces the chance of the thesis being discussed before the data lands.

---

## Known problems

Full detail, with severity and confidence, is in `CLAUDE.md` §"Bug list". The four that most affect the research:

**1. `completed_at` is never written.** An abandoned response at Q4 looks identical to a completed one in the database. Completion rate is a core survey-quality metric and it cannot be computed until this exists. Blocks meaningful Phase 7 analysis.

**2. The `contacts` table is never written.** Q53_54's phone number is upserted into `answers` like any other answer, because `SurveyScreen` treats every question identically. The table exists specifically so consent-bearing numbers are separable and purgeable. Right now a consented phone number sits in the general answers table where a retention purge would miss it. This is a privacy/consent defect, not a tidiness issue.

**3. Answer changes can desync the question index.** `index` is a raw integer into `visibleQuestions`, which is recomputed from `answers` on every change. Going back and changing a `showIf`-gating answer (Q21 "Never" → "Sometimes" un-gates Q23) shifts the array and can silently skip a question. Reasoned from the code; not yet reproduced in a browser.

**4. `questions.json` wording is drafted, not verbatim.** See the second item under "Read this first". This is the one that would most damage the research if overlooked, because the survey would run and produce data that doesn't mean what the sealed Phase-0 rules assume it means.

### Also outstanding

- **No deduplication.** Clearing localStorage mid-survey creates a second `respondents` row with no way to merge them.
- **`localStorage` parsing is unguarded.** One corrupted key white-screens the app with no recovery path.
- **Dictation is a no-op on unsupported browsers** (notably iOS Safari) but the button still renders. Several required questions depend on typing.
- **Test debris in the repo root:** `final-check.png` and `.playwright-cli/` (console logs, page YAML). Neither is gitignored.
- **Dead Vite scaffolding:** `src/App.css`, `src/assets/{hero.png,react.svg,vite.svg}` — nothing imports them.
- **`README.md` is still the Vite template default.**

---

## Exact next steps

In order. Items 1–3 are prerequisites for real work; 4 onward is the Phase 3 → Phase 5 path.

**1. Put this in version control. (Highest value, ~2 minutes.)**

```bash
cd "C:/REACT/SKI SURVEY/ski-survey"
git init
# add .playwright-cli/ and screenshot debris to .gitignore first
git add .
git commit -m "SKI survey: Phase 0-3 complete, docs"
```

Then create a private GitHub repo and push. This must happen before the account migration, not after — the whole point of migrating is that the work survives, and right now it survives only as loose files in one folder.

**2. Delete test debris.** `final-check.png` and `.playwright-cli/`. Gitignore both patterns so they don't come back.

**3. Clean up dead scaffolding.** Delete `src/App.css`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`. Replace `README.md` with something that says what this project actually is — the Vite default will actively mislead whoever picks this up next.

**4. Fix the two data-integrity bugs** (`CLAUDE.md` bug list items 1 and 2). Write `completed_at` when the survey finishes, and route Q53_54's phone number to `contacts` instead of `answers`. Both need a completion screen to exist first, so build that screen as part of this step.

**5. Verify on real hardware.** On the iPhone 11 Pro: check the notch and status-bar area matches the page colour, check the overscroll bounce, and check dictation actually works. None of this can be tested headless.

**6. Test on a low-end Android over mobile data.** This is Phase 3's actual "done when" criterion and hasn't been done. Nigerian students are on mobile data and low-end devices — every KB of payload is friction.

**7. Cross-check `questions.json` against the original 54-question document.** Do this **before any pilot or fielding.** Pay particular attention to Q12 and Q15, which touch the lecturer-related options that Phase 0 identified as bias traps. If the drafted wording lets a rule pass that the sealed rule intended to fail, the study's conclusions are wrong.

**8. Run the Phase 5 pilot** — 5–8 students, in person, timed, unhelped. Success criteria are already written in `PROJECT_BIBLE.md` §11: median under 12 minutes, 6 of 8 finish, nobody asks "what does this mean?" Purge pilot rows before fielding (`is_test` flag exists for exactly this).

---

## Migration checklist for a new Claude Code account

Claude Code sessions are not portable. Everything below must be re-established by hand on the new account:

- [ ] `CLAUDE.md` and `context.md` and `PROJECT_BIBLE.md` are present in the repo (they auto-load / are one read away)
- [ ] `npm install` — dependencies are not portable, `node_modules` is not committed
- [ ] `.env.local` recreated from Supabase → Project Settings → API. **Never commit it.** Project ref `pxrfmjeoqvuwnpiqdepw`
- [ ] Skills reinstalled globally: `npx skills add <owner/repo@skill> -g -y` for `playwright-cli`, `image-to-code`, `shadcn`, `web-design-guidelines`, `design-taste-frontend`
- [ ] Working directory is `ski-survey/`, not the parent — `CLAUDE.md` only auto-loads from the repo root Claude Code is launched in
- [ ] Supabase dashboard access to the project

Then: verify with `npm run build`, then `npm run dev`, then load `/` and `/survey` and confirm a write reaches the `answers` table.

---

## If something is unclear

The authority order is: **`CLAUDE.md` for how to work here, `PROJECT_BIBLE.md` for what the research is, this file for why things are the way they are.** When they disagree on the research, `PROJECT_BIBLE.md` wins — this file records context and reasoning, it does not override the research spec.
