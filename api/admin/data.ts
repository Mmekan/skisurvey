/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'

function unauthorized(res: any) {
  return res.status(401).json({ error: 'Unauthorized' })
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const password = (req.headers['x-admin-password'] as string) || req.body?.password
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return res.status(500).json({ error: 'ADMIN_PASSWORD not set' })
  if (password !== expected) return unauthorized(res)

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return res.status(500).json({ error: 'Supabase env not set' })

  const supabase = createClient(url, serviceKey)

  const [rResp, aResp, cResp] = await Promise.all([
    supabase.from('respondents').select('id, created_at, completed_at, source, is_test, device_id').order('created_at', { ascending: false }).limit(500),
    supabase.from('answers').select('respondent_id, question_id, value, answered_at').order('answered_at', { ascending: false }).limit(5000),
    supabase.from('contacts').select('respondent_id, phone, consent_at').limit(500),
  ])

  if (rResp.error) return res.status(500).json({ error: rResp.error.message })
  if (aResp.error) return res.status(500).json({ error: aResp.error.message })
  if (cResp.error) return res.status(500).json({ error: cResp.error.message })

  return res.status(200).json({
    respondents: rResp.data,
    answers: aResp.data,
    contacts: cResp.data,
  })
}
