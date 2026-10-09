# CLAUDE.md — SKI Research Survey

This file is read automatically by Claude Code when working in this repo. For the project's full history, the reasoning behind each decision, and what to work on next, see `context.md` in this same folder. For the long-form research spec (thesis, phases, sealed rules, schema, pipeline), see `PROJECT_BIBLE.md`. Read those two before doing any non-trivial work here.

> **The app lives in `ski-survey/`, one level below the workspace root.** If your working directory is `SKI SURVEY/` rather than `SKI SURVEY/ski-survey/`, this file won't auto-load — cd into the app folder first.

## What this project is

A mobile-first research survey (React + Supabase) that tests whether the core thesis behind SKI — an AI audio-visual learning tool for Nigerian university students — is real. SKI itself (the video/Q&A product) is NOT what this repo builds. This repo builds the *survey* that validates it before SKI gets built.

Thesis being tested: *Students can't get course-aligned explanations matched to what they're actually examined on, and can't check whether they understood — so they fail exams despite studying.*

## Tech stack

- React 19 + TypeScript + Vite 8 (`npm run build` = `tsc -b && vite build`, so **type errors fail the build**)
- Tailwind CSS v4 via `@tailwindcss/vite` — CSS-first config in `src/index.css` via `@theme`. There is **no `tailwind.config.js`, no PostCSS config, and no `tailwindcss init`** in this project. See "Tailwind v4 setup" below.
- Supabase (`@supabase/supabase-js` v2) — Postgres + RLS
- react-router-dom v7, `BrowserRouter`, two routes: `/` and `/survey`
- Deploy target: Vercel (not set up yet)

### Commands

```bash
npm run dev       # local dev server, http://localhost:5173
npm run build     # typecheck + production build to dist/
npm run preview   # serve the production build
npm run lint      # eslint
```

### Third-party services and where the credentials live

| Thing | Where | Notes |
|---|---|---|
| Supabase project | `pxrfmjeoqvuwnpiqdepw` | Project URL + publishable key in `.env.local` |
| `.env.local` | project root, gitignored | Vite only reads env files from the **project root** — never from `src/` |
| Mockup artifact | `https://claude.ai/artifact/3fi6XWDcDegXhzjuAky3nw` | Phone + admin screens; the Welcome design follows it |

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are the only two env vars. The key is currently Supabase's newer **publishable** format (`sb_publishable_...`), not a legacy anon JWT — both work identically here. Never commit `.env.local`; never put the `service_role` key anywhere client-side.

### Claude Code skills installed for this project

Installed globally (available to this user on every machine, but **not** carried by the repo — a new account will need them reinstalled): `playwright-cli`, `image-to-code`, `shadcn`, `web-design-guidelines`, `design-taste-frontend`. Playwright CLI is invoked as `npx --yes @playwright/cli@latest …` — there is no global `playwright-cli` binary on this machine.

## Architecture conventions — do not violate these

1. **`src/data/questions.json` is the single source of truth.** Adding or editing a question means editing this file only. Never hardcode a new screen component for a new question — there are only four question *types*, not 30 screens.
2. **Four question components, no more:** `TapQuestion`, `MultiSelect`, `TextQuestion`, `ConceptScreen` (the last is a one-off). Plus `ProgressBar` and `ThemeToggle`, which aren't question types. New questions are data in `questions.json`, never new components.
3. **Supabase is answer-per-row, never a wide table.** `respondents` (session metadata) + `answers` (one row per question) + `contacts` (Q53_54 phone numbers only, separated for consent/retention reasons).
4. **RLS: the anon key can INSERT and UPDATE, never SELECT.** If you touch RLS policies, re-run the fake-insert test (`PROJECT_BIBLE.md` §12) before trusting it again. Admin reads go through `service_role` from a server function only.
5. **`is_test` boolean is required on every respondent row.** Dev-server runs are auto-flagged via `import.meta.env.DEV`; flip it manually for pilot/self-test data so it never pollutes real results.
6. **Concept screen copy stays outcome-level, never mechanism-level.** It may describe what the student experiences (pause a video, ask a question, get tested). It must never describe how SKI is built — no mention of Remotion, Higgsfield, scene manifests, grounding strategy, or any roadmap feature outside the current MVP spine. This is a deliberate IP-protection decision; don't "improve" the copy by adding technical detail.
7. **Branching logic is fixed:** Q21 gates Q23, Q24 gates Q26, Q40 "None" skips Q42+Q43. The concept block must render last, after every problem-diagnosis question — reordering it primes every earlier answer and invalidates the survey. Branching is data (`showIf`), never conditional JSX.
8. **Never call `.select()` on an anon insert into `respondents`/`answers`/`contacts`.** `INSERT ... RETURNING` under RLS requires the new row to also pass a `SELECT` policy, and anon deliberately has none (rule 4). Generate the row's `id` client-side with `crypto.randomUUID()` and insert it explicitly instead of relying on Postgres to generate and return one — see `src/screens/SurveyScreen.tsx`. Getting this wrong looks identical to a real RLS misconfiguration (same `42501` error) and cost a multi-hour debugging detour once already.
9. **Full-screen routes use `h-dvh overflow-hidden` + internal scroll**, never `min-h-screen`, and always carry `pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`. See "The notch seam" below.

## Current implementations

### Routing and screens

`src/App.tsx` — `BrowserRouter`, two routes: `/` → `WelcomeScreen`, `/survey` → `SurveyScreen`. `ThankYouScreen` is **not** a route; it's rendered from inside `SurveyScreen` once the last question is passed. No other routes exist yet.

### `src/screens/WelcomeScreen.tsx` — static, no animation

Purpose-built layout, deliberately not generic:

- Outer `h-dvh overflow-hidden bg-ivory` + safe-area padding (convention 9).
- Centred `w-full max-w-md` column with `px-6 pt-6` — the `max-w-md` cap is what makes it look correct on desktop instead of stretching full-bleed.
- **Bottom space is distributed by two `flex-1` spacer divs** — one above the "Step inside" button and one below the small print. That's how the CTA sits in the lower-middle rather than pinned to the bottom or floating up against the hero. Removing or reordering either spacer visibly re-balances the whole screen.
- Decorative circle: `h-56 w-56`, absolutely positioned `-right-[60px] -top-[50px]`, sunset-red→sunset-orange gradient at `opacity-20`. Sized to sit behind the wordmark.
- `FLOATING_TERMS` — a module-level array of 15 decorative subject terms (`E=mc²`, `def main():`, `Separation of Powers`, …) each with hand-tuned `top`/`left` percentages, font size, opacity (~0.12–0.15) and rotation, in an `aria-hidden` `pointer-events-none` layer.
- Wordmark: "Student / Knowledge / Interface" stacked, right-aligned, `leading-[1.2]`, with S/K/I enlarged to `1.3em` in `font-black text-sunset-red`.
- Hero: `text-[56px] font-black leading-[1.05]`, hard-broken across four lines, with three overlapping colour balls (sunset-red / sunset-orange / lime, `h-6 w-6`, `-ml-2` overlap, `border-[3px] border-ivory`) sitting inline beside the word "study,". "if you do." follows as a separate `text-2xl italic text-ink/50` line.
- Button: `h-16` pill, `pl-7 pr-2.5`, hard `shadow-[0_4px_0_var(--color-ink)]` that depresses on `:active`, with a dark circular arrow badge.
- On mount it calls `setThemeColor(IVORY)` — this screen isn't theme-toggle aware, but the status-bar colour is global, so it must reset or it'd be stuck showing whatever the survey last set.
- The whole screen's design is explicitly **not locked** — code is following the latest mockup.

### `src/screens/SurveyScreen.tsx` — the engine

State lives in `localStorage`, not Supabase — the anon key can write but never read back (rule 4), so Supabase is a one-way durable backup and localStorage is what survives a reload.

- Keys: `ski_respondent_id`, `ski_answers`, `ski_question_index`.
- `isQuestionVisible()` evaluates `showIf` — a question with `showIf` stays hidden until its gating question is answered (`undefined` → hidden), then matches on `valueIn` or `valueNotIn`.
- `isAnswerValid()` / `getValidationMessage()` drive the disabled Continue button and the inline hint. MultiSelect's message counts down (`"Pick 2 more to continue."`).
- The respondent row is created **once**, on first load, with a client-side `crypto.randomUUID()` and `source` pulled from the `?src=` query param. Never `.select()` it — see rule 8.
- `saveAnswer()` upserts into `answers` with `onConflict: 'respondent_id,question_id'`. A failed save sets `saveError`, which renders a "Check your connection" banner in an `aria-live="polite"` region.
- Layout: outer `h-dvh overflow-hidden`; **only** the question area (`flex-1 overflow-y-auto px-5 pt-6`) scrolls. ProgressBar, save-error banner, validation message, ThemeToggle row, and the Back/Continue row all sit outside it, so a long list like Q2's 25-department picker never pushes Continue off-screen.
- On mount it restores `<meta name="theme-color">` to light or dark cream based on the current `.dark` state.
- **Completion (fixed 2026-10-03):** `hasCompleted = index >= visibleQuestions.length` triggers a one-shot `update({ completed_at })` on the respondent row and renders `ThankYouScreen`. Before this, `completed_at` was never written, so an abandoned response at Q4 was indistinguishable from a finished one and completion rate could not be computed.
- **Q53_54 writes to `contacts`, not `answers` (fixed 2026-10-03):** `saveAnswer` special-cases `CONTACT_QUESTION_ID` so the phone number never lands in the general answers table — that's the whole point of `contacts` being separate (purge consent data without touching real responses). Writes are debounced 600ms because the field saves on every keystroke, and the unmount cleanup **flushes** any pending write rather than cancelling it, so closing the tab inside the debounce window can't silently drop a consented number. Clearing the field deletes the row.
- ⚠️ **This depends on `supabase-contacts-patch.sql` having been run.** The schema originally had no unique index on `contacts(respondent_id)` and no anon UPDATE/DELETE policy, so the upsert and the delete would have silently affected zero rows (RLS blocks unmatched operations *without* raising an error — the write looks like it saved and didn't). The patch adds all three.

### `src/screens/ThankYouScreen.tsx`

Reached when the respondent advances past the last visible question. Centred `max-w-md`, three overlapping colour balls echoing the Welcome screen, and the same full-screen conventions every other route uses (`h-dvh overflow-hidden`, safe-area padding, `setThemeColor()`).

### Question components

| File | Renders | Notes |
|---|---|---|
| `TapQuestion.tsx` | One-of-N buttons | `aria-pressed`; selected state depresses (`translate-y-[3px]` + reduced shadow) |
| `MultiSelect.tsx` | Wrap-pill chips | Enforces `maxPicks` by disabling unselected chips at the limit and saying so; live "N selected" counter |
| `TextQuestion.tsx` | Textarea + optional mic | See below |
| `ConceptScreen.tsx` | Inverted `bg-brown text-cream` block | Full-bleed via `-mx-5 -mt-6`. **This is the screen that flips light in dark mode** — see below |

`TextQuestion.tsx` specifics:
- Mic is a stroke SVG absolutely positioned in the textarea's bottom-right; the textarea gets `pr-14` to make room. It was an emoji button before — it rendered inconsistently across platforms and wasted vertical space.
- Web Speech API is read off `window.SpeechRecognition || window.webkitSpeechRecognition` with a hand-written `SpeechRecognitionLike` interface (it's not in TS's default lib). If neither exists the button stays inert rather than looking broken.
- **`useEffect` cleanup calls `recognitionRef.current?.stop()` on unmount — do not remove it.** Navigating to the next question while dictating unmounts this component; without the cleanup the mic button vanishes (so it *looks* stopped) while the browser keeps listening indefinitely, orphaned from any UI. This was a real reported bug.
- Character counter and the optional "None" shortcut (`allowNone`/`noneLabel`, used by Q40 to gate Q42+Q43) sit under the textarea; `promptChips` render tap-to-insert helper chips.

`ProgressBar.tsx` exposes `role="progressbar"` with `aria-valuenow/min/max` and a "Section N of M" label; segments are individually `aria-hidden`.

### `ThemeToggle.tsx`

A compact `h-6 w-11` switch, **left-aligned**, in its own row directly above the Back/Continue row — only in `SurveyScreen`. Not on Welcome (no purpose there), and not a global fixed-position overlay (an earlier version of that overlapped the progress bar and looked like a stray UI bug). Toggles a `.dark` class on `<html>`, persists to `localStorage` under `ski_theme`, defaults to light on first visit with **no** OS `prefers-color-scheme` detection, and updates `<meta name="theme-color">` live.

### `src/lib/theme.ts`

`setThemeColor(hex)` plus the three exported constants `CREAM_LIGHT` (`#FEF3E0`), `CREAM_DARK` (`#4B2E2A`), `IVORY` (`#FBF2CF`). Thin, but it's the one place browser-chrome colour is decided.

## Design system

All tokens live in `src/index.css` under Tailwind v4's `@theme` block:

```css
/* Core — every screen except Welcome */
--color-brown: #4B2E2A;        --color-orange: #D16F2E;      /* fails WCAG for small text */
--color-orange-dark: #A34E1A;  /* small text and labels */
--color-amber: #F9A136;        --color-cream: #FEF3E0;

/* Welcome screen only — separate, newer, explicitly subject to change */
--color-sunset-red: #E6412A;   --color-sunset-orange: #F5891E;
--color-ivory: #FBF2CF;        --color-lime: #5C8A1F;  --color-ink: #3D1810;

--font-sans: "DM Sans", system-ui, sans-serif;
```

These generate utilities directly (`bg-brown`, `text-orange-dark`, `bg-sunset-red`, …). DM Sans itself is loaded via Google Fonts `<link>` tags in `index.html` — without those the `--font-sans` token silently falls back to system fonts.

Wordmark is "S.K.I" in DM Sans Black with hard colour bands. No logo file exists yet.

### Dark mode is a token-value swap, not per-screen overrides

```css
.dark {
  color-scheme: dark;
  --color-brown: #FEF3E0;   /* was #4B2E2A */
  --color-cream: #4B2E2A;   /* was #FEF3E0 */
}
```

Because the values swap rather than the classes changing, every normal screen (`bg-cream`/`text-brown`) inverts automatically — **and so does the Concept screen**, which already used those two tokens the other way round (`bg-brown`/`text-cream`) and therefore flips to the light look while everything around it goes dark. That inversion is the intended behaviour, matching the explicit product rule that dark mode makes every page match page 7 (the Concept screen) and page 7 becomes light. Don't fight it with per-screen `dark:` overrides on brown/cream. Add `dark:` overrides only for things that *don't* use those two tokens — hardcoded `bg-white` card surfaces get `dark:bg-ink`, and every hardcoded `shadow-[0_4px_0_#4B2E2A]` literal was converted to `shadow-[0_4px_0_var(--color-brown)]` so it swaps too.

### The notch seam (iOS)

Fixed 2026-10-02. iOS Safari was rendering white in the notch/status-bar area and during overscroll rubber-band, breaking the "one continuous flow" feel. All four of these are required together:

1. `viewport-fit=cover` in `index.html`'s viewport meta.
2. Background colour set on **`html`**, not just `body`.
3. Every full-screen container: `h-dvh overflow-hidden` + `pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`.
4. `<meta name="theme-color">` kept in sync per screen via `setThemeColor()`.

Miss any one and that route becomes the one page with the seam again. **This is still unverified on a physical iPhone** — headless Chrome can't reproduce it (see the bug list).

### Tailwind v4 setup

```ts
// vite.config.ts
plugins: [react(), tailwindcss()]   // from '@tailwindcss/vite'
```

v4 removed the CLI from the main `tailwindcss` package, so `npx tailwindcss init -p` fails with `npm error could not determine executable to run`. There is no init step — `@import "tailwindcss"` at the top of `src/index.css` is the whole setup.

## Bug list

Ordered by severity. "Confirmed" means observed in this app; "Suspected" means reasoned from the code but not reproduced. **Do not treat this list as a work backlog without confirming with the user first** — several items are deliberate trade-offs, not defects.

### Open

1. **The mic button silently does nothing on browsers without Web Speech support.** The guard returns early instead of rendering a broken-looking control, but the button is still *shown*. For a study app where Q9/Q10/Q36/Q49/Q52 are all required typed answers, that's a meaningful fraction of the target audience. *New evidence 2026-10-07: the MicIntro popup DID appear on the user's iPhone (so `webkitSpeechRecognition` exists there — the old "iOS Safari has no support" premise is wrong for their iOS version), and the button became inert only after granting mic permission. Leading hypothesis: Web Speech's recognition service requires a secure context, and the survey was reached via a port-forwarded non-localhost origin, so recognition starts and never yields. Verify over https before the pilot. Fix if it persists on https: `{question.mic && speechSupported() && ...}` plus dropping the `pr-14` textarea padding when there's no mic.*

2. **`supabase-update-policies-patch.sql` has not been run yet.** `anon update respondent` and `anon update answer` were specified in PROJECT_BIBLE §12 but never verified in the live database — probed 2026-10-07 and both are absent (zero-row updates). Until the patch runs: re-answering a question hits the update leg and silently affects zero rows (RLS blocks unmatched operations without raising an error), and `completed_at` never writes, so every respondent shows null and Phase 7 completion-rate analysis stays blocked. The INSERT policies are fine (verified), `contacts` is fine (patched 2026-10-06).

3. **StrictMode double-inserts a respondent row in dev.** The respondent-creation `useEffect` guards on `respondentId`, which has not updated yet when React re-invokes it, so a second `crypto.randomUUID()` insert fires ~9ms after the first. Two rows land in `respondents`; the second overwrites `ski_respondent_id`, leaving an orphaned empty row. *Confirmed 2026-10-06 from duplicate 400s in the console. Dev-only — StrictMode does not double-invoke in a production build — and both rows carry `is_test: true`, so they are purgeable. Pre-existing, not introduced by any recent change.*

### Fixed 2026-10-07

- **Autosave never reached Supabase — every answer save failed 42501.** supabase-js `.upsert()` sends `Prefer: resolution=merge-duplicates`, which forces a `RETURNING` check against a SELECT policy anon deliberately doesn't have; probed on all three tables (even `contacts`, which has every write policy) and every variant fails, including DO-NOTHING. The "Check your connection" banner was the visible tip — behind it, no answers had ever landed in the `answers` table. Replaced with insert-then-update (unique violation `23505` falls back to a PATCH), with an existence cache so steady-state typing stays one round trip. Same fix applied to `saveContact`. *Verified in a browser: fresh insert → 201; re-answer → straight PATCH 204; after reload → 409 caught → PATCH 204; banner absent in all three. Persistence of updates takes effect once the update-policies patch above is run.*
- **Phone field accepted letters.** Q53_54 now carries `inputMode: tel` (numeric keypad) and filters to phone characters on input. *Verified: "call me: 0803 ABC 4567!" becomes "  0803  4567".*

### Fixed 2026-10-06

Each verified in a browser at 375x812 after the fix.

- **Unguarded `localStorage` reads white-screened `/survey`.** Previously reproduced: a malformed `ski_answers` value left an empty body with no recovery, which is a lost response during fielding. All reads and writes now go through `readKey`/`readJson`/`writeKey`. *Verified: corrupt `ski_answers` plus a non-numeric `ski_question_index` now render normally.*
- **Question index desync.** `index` was a raw integer into a re-filtered array, so changing a gating answer could silently move the respondent to a different question. The current question is now tracked by **id** (`ski_question_id`); the integer is kept only as a fallback for saves made before this existed. *Verified: with `currentId=Q36` and a stale `storedIndex=5` it renders Q36; un-gating Q23 while positioned on Q24 leaves the respondent on Q24 and re-syncs the index 12 to 13.*
- **`isAnswerValid` never checked `maxPicks`.** Now enforces the upper bound with a specific message. *Verified: 5 picks on a max-3 question disables Continue and reads "Remove 2 to continue - up to 3 allowed."*
- **No deduplication.** Added `respondents.device_id`, a stable anonymous UUID under the localStorage key `ski_device_id` that survives a cleared survey store. *Requires `supabase-device-id-patch.sql`; the client retries the insert without the column if that has not been run, so deploy ordering is not fatal.*
- **Dead Vite scaffolding deleted.** `src/App.css` and `src/assets/{hero.png,react.svg,vite.svg}`; `src/assets/` is now empty.

### Previously fixed - keep these alive

- **The INSERT ... RETURNING + RLS trap.** `.insert().select()` throws `42501` on this schema even when everything is configured correctly, because `RETURNING` requires the new row to pass a `SELECT` policy and anon deliberately has none. It cost hours once and looks identical to a genuine misconfiguration. *Fixed - client-side UUIDs. Keep rule 8 above alive so it is not reintroduced.*

### Unverified - cannot be tested in this environment

3. **The iOS notch/overscroll fix has never been checked on a real iPhone.** Every fix was written and reasoned about; verification was via headless Chrome screenshots, which do not reproduce the notch or the rubber-band bounce. The original symptom was reported on an iPhone 11 Pro and has not been confirmed fixed. *Unverified.*
4. **Dictation has never been tested on real hardware.** The unmount leak was diagnosed from a behaviour report and fixed by inspection; the Web Speech API path itself has only ever run in desktop Chromium.

## Continuing development

### Start of session

1. Read this file, then `context.md` (history, decisions, next steps), then skim `PROJECT_BIBLE.md` for the research spec.
2. `cd` into `ski-survey/`, then `npm run dev`.
3. Check `context.md` §"Exact next steps" — it reflects the last agreed state of the work. Don't assume the previous session's last message was the plan.

### Before writing any code

- Adding or changing a question → edit `src/data/questions.json` only.
- Touching RLS → re-run the fake-insert test in `PROJECT_BIBLE.md` §12 first, and again after.
- Adding a full-screen route → copy the whole `h-dvh overflow-hidden` + safe-area + `setThemeColor()` pattern, or it becomes the one page with the notch seam.
- Adding a colour → check whether it needs a `.dark` counterpart. Hardcoded hexes don't swap; `var(--color-*)` references do.

### Before calling anything done

- `npm run build` must pass (`tsc -b` runs first, so type errors block it).
- Check the change at 375px width (iPhone 11 Pro), not just desktop — the target user is on a phone.
- `npx --yes @playwright/cli@latest resize 375 812`, then `npx --yes @playwright/cli@latest screenshot --filename=check.png`. Delete the screenshot after.
- If you changed anything in the notch/status-bar chain, say plainly that it still needs a real-device check.

### Where the phases stand

Check `context.md` §"Where the project stands" and `PROJECT_BIBLE.md` §3 for the authoritative phase. As of 2026-10-03 the app is functionally complete through Phase 3 minus real-device testing; Phases 4–7 are untouched.

## Do not

- Do not add real-time or per-user video generation anywhere in this survey's copy or code — the product is a pre-generated library, not generate-on-demand.
- Do not add consent-collection fields beyond what's in the current schema without checking `PROJECT_BIBLE.md` — consent handling was a deliberate decision.
- Do not build study rooms, webcam monitoring, or a raffle. These are cut from scope, not deferred.
- Do not skip the `is_test` flag on any script, seed, or test data you write.
- Do not reintroduce Glyph Portal (the animated zoom-into-a-letter welcome screen) without being explicitly asked — it was deliberately removed in favour of the static `WelcomeScreen.tsx`. See `PROJECT_BIBLE.md` §8.
- Do not "improve" the Concept screen copy by adding technical detail — outcome-level only, per rule 6.
- Do not commit `.env.local`, and never introduce a `service_role` key on the client.
