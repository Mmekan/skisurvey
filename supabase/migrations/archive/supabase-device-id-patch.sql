-- SKI survey — device_id on respondents (bug list #1: no deduplication)
-- Run in Supabase → SQL Editor. Idempotent and safe to re-run.
--
-- Why this is needed:
--   Clearing localStorage mid-survey and returning creates a SECOND
--   `respondents` row. There was no identifier that survives a cleared
--   browser store, so there was no way to collapse the two back into one
--   person — which inflates N and splits a single respondent's answers
--   across two rows at analysis time.
--
--   The client now generates a stable anonymous id under the localStorage
--   key `ski_device_id` and sends it with the respondent insert. Unlike
--   `ski_respondent_id`, that key is never cleared by the app, so it
--   survives exactly the failure this is meant to catch.
--
--   This is a grouping key for analysis, not a consent or identity field.
--   It is a random UUID with no device serial, IP or hardware detail — it
--   cannot identify who the respondent is, only that two rows came from
--   the same browser. Nothing is collected that wasn't already implied by
--   the anonymous response itself.
--
-- No RLS change is required: the existing anon INSERT policy on
-- `respondents` is `with check (true)`, so the new column is covered
-- as-is. Existing rows keep a NULL device_id, which is fine — grouping
-- simply won't apply to rows written before this ran.

alter table respondents
  add column if not exists device_id text;

create index if not exists idx_respondents_device_id
  on respondents(device_id);

-- ── Verification ──────────────────────────────────────────────────────
-- Expect one row:
--
--   select column_name from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'respondents'
--      and column_name = 'device_id';
--
-- And one row:
--
--   select indexname from pg_indexes
--    where tablename = 'respondents'
--      and indexname = 'idx_respondents_device_id';
--
-- Then, after a test run through the survey, expect a non-null value:
--
--   select id, device_id, source, is_test, completed_at
--     from respondents
--    order by created_at desc
--    limit 5;
--
-- ── Deploy order ──────────────────────────────────────────────────────
-- Run this BEFORE deploying code that sends device_id. If the code lands
-- first the client detects the missing column and silently retries without
-- it, so ordering is not fatal — but running it first means dedup is live
-- from the moment the new client starts.