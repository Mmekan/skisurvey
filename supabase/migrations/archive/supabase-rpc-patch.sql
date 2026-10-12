-- SKI survey — SECURITY DEFINER persistence functions
-- Run in Supabase → SQL Editor. Idempotent and safe to re-run.
--
-- Why these exist (verified 2026-10-08/09 by probing the live database):
--   anon's INSERT works, but UPDATE and DELETE affect ZERO rows. Every
--   catalog view looked healthy — pg_policies (anon, (true), permissive,
--   attached to the right table OID), role_table_grants (all privileges on
--   all three tables), no triggers, no rules — and a brand-new scratch table
--   with a brand-new policy failed the same way, so this is project-wide and
--   invisible to inspection. PostgREST answers 204 either way, so the writes
--   looked successful while silently no-oping.
--
--   Consequences, all measured:
--     * re-answering a question keeps the OLD value
--     * `completed_at` never writes (Phase 7 completion rate blocked)
--     * clearing a phone number does NOT delete it — a withdrawn consent
--       stays in the table, which is a privacy problem, not a bug
--
-- These functions run as the table OWNER (SECURITY DEFINER), so RLS never
-- filters them. This does not widen what anon can do: the existing
-- `using (true)` policies already let anon write any row in these tables.
-- All three are SECURITY INVOKER-free, parameterised (no SQL injection
-- surface), and pinned to a fixed search_path so the definer cannot be
-- hijacked by a malicious search_path at call time.

create or replace function public.save_answer(
  p_respondent_id uuid,
  p_question_id text,
  p_value jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.answers (respondent_id, question_id, value)
  values (p_respondent_id, p_question_id, p_value)
  on conflict (respondent_id, question_id)
  do update set value = excluded.value
$$;

-- One row per respondent is the invariant: without an explicit conflict
-- target Postgres raises "ON CONFLICT DO UPDATE requires inference
-- specification", which is exactly the error shape we spent a session
-- chasing for a different reason.
create or replace function public.save_contact(
  p_respondent_id uuid,
  p_phone text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.contacts (respondent_id, phone)
  values (p_respondent_id, p_phone)
  on conflict (respondent_id)
  do update set phone = excluded.phone
$$;

create or replace function public.clear_contact(p_respondent_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.contacts where respondent_id = p_respondent_id
$$;

create or replace function public.mark_completed(p_respondent_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.respondents
     set completed_at = now()
   where id = p_respondent_id
$$;

revoke all on function public.save_answer(uuid, text, jsonb) from public;
revoke all on function public.save_contact(uuid, text) from public;
revoke all on function public.clear_contact(uuid) from public;
revoke all on function public.mark_completed(uuid) from public;

grant execute on function public.save_answer(uuid, text, jsonb) to anon;
grant execute on function public.save_contact(uuid, text) to anon;
grant execute on function public.clear_contact(uuid) to anon;
grant execute on function public.mark_completed(uuid) to anon;

-- ── Verification ──────────────────────────────────────────────────────
-- The function must be pointed at a row that EXISTS: `answers.respondent_id`
-- has a foreign key, so calling save_answer with an id that is not in
-- `respondents` fails 23503 — which is what happened the first time this
-- was tested. That error proves the function runs and reaches the table; it
-- says nothing about the grants.
--
-- Create a disposable respondent first:
--
--   insert into respondents (id, is_test)
--   values ('00000000-0000-0000-0000-000000000000', true);
--
-- Then exercise every function:
--
--   select public.save_answer('00000000-0000-0000-0000-000000000000', 'SQLCHECK', '"first"'::jsonb);
--   select public.save_answer('00000000-0000-0000-0000-000000000000', 'SQLCHECK', '"second"'::jsonb);
--   select public.mark_completed('00000000-0000-0000-0000-000000000000');
--   select public.save_contact('00000000-0000-0000-0000-000000000000', '08000000000');
--   select public.clear_contact('00000000-0000-0000-0000-000000000000');
--
-- The second save_answer call is the important one: it takes the
-- ON CONFLICT DO UPDATE branch, which is the exact operation that anon
-- could never perform. Then confirm the value really changed:
--
--   select value, answered_at from answers
--    where respondent_id = '00000000-0000-0000-0000-000000000000';
--   -- expect a single row whose value reads "second"
--
--   select completed_at from respondents
--    where id = '00000000-0000-0000-0000-000000000000';
--   -- expect a timestamp, not null
--
--   select count(*) from contacts
--    where respondent_id = '00000000-0000-0000-0000-000000000000';
--   -- expect 0 (save_contact then clear_contact cancelled out)
--
-- A `permission denied for function` here means step 5 (revoke/grant) did
-- not land — re-run it, since grants are the one part of this patch that
-- has no visible effect from `create or replace`.
--
-- Clean up:
--
--   delete from answers     where respondent_id = '00000000-0000-0000-0000-000000000000';
--   delete from contacts    where respondent_id = '00000000-0000-0000-0000-000000000000';
--   delete from respondents where id             = '00000000-0000-0000-0000-000000000000';