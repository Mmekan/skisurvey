/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, no-empty */
// @ts-nocheck
import { timingSafeEqual } from 'node:crypto'

const attempts = new Map<string, { count: number; reset: number }>()
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.reset) {
    attempts.set(ip, { count: 1, reset: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_ATTEMPTS
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) {
    // still do constant-time compare on same length buffer to avoid timing leak on length
    const dummy = Buffer.alloc(Math.max(ab.length, bb.length))
    try { timingSafeEqual(dummy, dummy) } catch {}
    return false
  }
  return timingSafeEqual(ab, bb)
}

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many attempts, try again later' })

  const { password } = req.body ?? {}
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return res.status(500).json({ error: 'Server misconfigured' })
  // don't log password, don't echo it in errors
  const ok = typeof password === 'string' && safeEqual(password, expected)
  if (!ok) return res.status(401).json({ error: 'Invalid password' })
  return res.status(200).json({ ok: true })
}
