-- SKI survey — schema patch required by the contacts/completed_at fixes
-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- Why this is needed:
--   1. `contacts` had no unique constraint on respondent_id, so a
--      respondent could end up with several phone rows. One number per
--      respondent is the intent.
--   2. `contacts` had an INSERT policy for anon but no UPDATE or DELETE
--      policy. The app now upserts (which does an UPDATE on conflict) and
--      deletes the row when someone clears the field. Without these two
--      policies Postgres rejects those operations silently — RLS blocks
--      unmatched operations without raising an error, so the write simply
--      affects zero rows and the change looks like it saved when it didn't.

-- 1. One contact row per respondent.
create unique index if not exists idx_contacts_respondent_id
  on contacts(respondent_id);

-- 2. Let anon update a contact (needed for the upsert's ON CONFLICT path).
--
-- Postgres has no `create policy if not exists` — re-running a bare
-- `create policy` throws "policy already exists". Drop first, so this file
-- is genuinely re-runnable as its header claims.
drop policy if exists "anon update contact" on contacts;
create policy "anon update contact" on contacts
  for update to anon using (true) with check (true);

-- 3. Let anon delete a contact (needed when a respondent clears the field).
drop policy if exists "anon delete contact" on contacts;
create policy "anon delete contact" on contacts
  for delete to anon using (true);


-- ── Verification ──────────────────────────────────────────────────────
-- Run this after the patch. Expect 3 rows, one per policy:
--
--   select policyname, cmd from pg_policies
--    where tablename = 'contacts' and schemaname = 'public'
--    order by policyname;
--
--   anon delete contact | DELETE
--   anon insert contact | INSERT
--   anon update contact | UPDATE
--
-- And expect one row for the index:
--
--   select indexname from pg_indexes
--    where tablename = 'contacts' and indexname = 'idx_contacts_respondent_id';
--
-- A missing UPDATE or DELETE policy is the failure mode that matters: the
-- app will report success while writing nothing.