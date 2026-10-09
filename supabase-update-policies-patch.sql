-- SKI survey — UPDATE policies for anon (required for autosave + completed_at)
-- Run in Supabase → SQL Editor. Idempotent and safe to re-run.
--
-- Why this is needed:
--   PROJECT_BIBLE §12 specifies `anon update respondent` and `anon update
--   answer`, but only the INSERT policies were ever verified in the live
--   database (the Phase 1 fake-insert test only exercised INSERT). Probed
--   on 2026-10-07 with return=representation, which rolls back cleanly:
--     - PATCH respondents -> 200 [] (zero rows = policy absent)
--     - PATCH answers     -> 200 [] (zero rows = policy absent)
--
--   Consequences until this runs:
--     * `completed_at` never writes (every respondent shows null) — which
--       blocks completion-rate analysis in Phase 7.
--     * Re-answering a question silently keeps the old value (the new
--       insert-or-update client path reaches its update leg and affects
--       zero rows without raising an error — RLS blocks unmatched
--       operations silently; same class of trap as the contacts patch).
--
-- `contacts` already has its UPDATE/DELETE policies (applied 2026-10-06).

drop policy if exists "anon update respondent" on respondents;
create policy "anon update respondent" on respondents
  for update to anon using (true) with check (true);

drop policy if exists "anon update answer" on answers;
create policy "anon update answer" on answers
  for update to anon using (true) with check (true);

-- ── Verification ──────────────────────────────────────────────────────
-- Run after. Expect these rows (contacts' three should also be present):
--
  -- select tablename, policyname, cmd from pg_policies
  --  where schemaname = 'public'
  --  order by tablename, cmd;
--
--   answers   | anon insert answer  | INSERT
--   answers   | anon update answer  | UPDATE   <-- new
--   contacts  | anon delete contact | DELETE
--   contacts  | anon insert contact | INSERT
--   contacts  | anon update contact | UPDATE
--   respondents | anon insert respondent | INSERT
--   respondents | anon update respondent | UPDATE  <-- new
--
-- No SELECT policies for anon should exist anywhere — that is by design
-- (CLAUDE.md rule 4).

