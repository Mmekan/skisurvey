/* eslint-disable @typescript-eslint/no-explicit-any */
export default function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { password } = req.body ?? {}
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return res.status(500).json({ error: 'ADMIN_PASSWORD not set' })
  if (password !== expected) return res.status(401).json({ error: 'Invalid password' })
  return res.status(200).json({ ok: true })
}
