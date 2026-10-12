/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, no-empty */
// @ts-nocheck
import { timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

function unauthorized(res: any) {
  return res.status(401).json({ error: 'Unauthorized' })
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) {
    const dummy = Buffer.alloc(Math.max(ab.length, bb.length))
    try { timingSafeEqual(dummy, dummy) } catch {}
    return false
  }
  return timingSafeEqual(ab, bb)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const password = (req.headers['x-admin-password'] as string) || req.body?.password
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return res.status(500).json({ error: 'Server misconfigured' })
  if (typeof password !== 'string' || !safeEqual(password, expected)) return unauthorized(res)

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return res.status(500).json({ error: 'Server misconfigured' })

  const supabase = createClient(url, serviceKey)

  const [rResp, aResp, cResp] = await Promise.all([
    supabase.from('respondents').select('id, created_at, completed_at, source, is_test, device_id').order('created_at', { ascending: false }).limit(500),
    supabase.from('answers').select('respondent_id, question_id, value, answered_at').order('answered_at', { ascending: false }).limit(5000),
    supabase.from('contacts').select('respondent_id, phone, consent_at').limit(500),
  ])

  if (rResp.error) return res.status(500).json({ error: 'Failed to load respondents' })
  if (aResp.error) return res.status(500).json({ error: 'Failed to load answers' })
  if (cResp.error) return res.status(500).json({ error: 'Failed to load contacts' })

  return res.status(200).json({
    respondents: rResp.data,
    answers: aResp.data,
    contacts: cResp.data,
  })
}
