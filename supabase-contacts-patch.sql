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
create policy "anon update contact" on contacts
  for update to anon using (true) with check (true);

-- 3. Let anon delete a contact (needed when a respondent clears the field).
create policy "anon delete contact" on contacts
  for delete to anon using (true);
