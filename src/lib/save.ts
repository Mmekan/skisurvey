// src/lib/save.ts
//
// All writes go through SECURITY DEFINER functions on the server. Probed
// on the live database (2026-10-08): anon's INSERT works but its UPDATE
// and DELETE match ZERO rows — while the policy catalog, grants, triggers
// and table OIDs all look correct, and a brand-new scratch table fails the
// same way. PostgREST reports 204 either way, so every write looked
// successful while silently no-oping: corrections kept the old value,
// completed_at never set, and clearing a phone left the consenting number
// in the table.
//
// Running as the table owner bypasses row filtering entirely, so no write
// in this app can be silently swallowed again.

import { supabase } from './supabase'

type RpcError = { message: string }

function err(label: string, e: unknown): RpcError {
  const m = (e as RpcError)?.message
  console.error(`${label} failed:`, m ?? e)
  return { message: m ?? 'save failed' }
}

/** Upsert one answer row. Uses the unique (respondent_id, question_id) key. */
export async function saveAnswer(respondentId: string, questionId: string, value: unknown): Promise<RpcError | null> {
  const { error } = await supabase.rpc('save_answer', {
    p_respondent_id: respondentId,
    p_question_id: questionId,
    p_value: value as never,
  })
  return error ? err(`save_answer(${questionId})`, error) : null
}

/** Consent-bearing phone number. `null` deletes the row rather than
 *  leaving a stale number behind — a withdrawn consent has to actually
 *  withdraw, and the old DELETE policy could not do that. */
export async function saveContact(respondentId: string, phone: string): Promise<RpcError | null> {
  const trimmed = phone.trim()
  if (!trimmed) {
    const { error } = await supabase.rpc('clear_contact', { p_respondent_id: respondentId })
    return error ? err('clear_contact', error) : null
  }
  const { error } = await supabase.rpc('save_contact', {
    p_respondent_id: respondentId,
    p_phone: trimmed,
  })
  return error ? err('save_contact', error) : null
}

/** Fires once when the respondent advances past the last question. */
export async function markCompleted(respondentId: string): Promise<RpcError | null> {
  const { error } = await supabase.rpc('mark_completed', { p_respondent_id: respondentId })
  return error ? err('mark_completed', error) : null
}
