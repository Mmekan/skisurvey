import { useEffect, useMemo, useState } from 'react'
import schema from '../data/questions.json'

type Respondent = { id: string; created_at: string; completed_at: string | null; source: string | null; is_test: boolean; device_id: string | null }
type Answer = { respondent_id: string; question_id: string; value: unknown; answered_at: string }
type Contact = { respondent_id: string; phone: string; consent_at: string }
type Data = { respondents: Respondent[]; answers: Answer[]; contacts: Contact[] }

const PASS_KEY = 'ski_admin_pass'

export default function AdminScreen() {
  const [pass, setPass] = useState(() => sessionStorage.getItem(PASS_KEY) || '')
  const [authed, setAuthed] = useState(false)
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [tab, setTab] = useState<'feed' | 'explorer'>('feed')
  const [showTest, setShowTest] = useState(true)
  const [loginErr, setLoginErr] = useState<string | null>(null)

  const login = async () => {
    setLoginErr(null)
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pass }) })
    const j = await r.json()
    if (!r.ok) return setLoginErr(j.error || 'Login failed')
    sessionStorage.setItem(PASS_KEY, pass)
    setAuthed(true)
  }

  const load = async () => {
    setErr(null)
    const r = await fetch('/api/admin/data', { headers: { 'x-admin-password': pass } })
    const j = await r.json()
    if (!r.ok) return setErr(j.error || 'Load failed')
    setData(j)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (authed) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  useEffect(() => {
    const saved = sessionStorage.getItem(PASS_KEY)
    if (saved) {
      fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: saved }) })
        .then((r) => r.ok && setAuthed(true))
        .catch(() => {})
    }
  }, [])

  const filtered = useMemo(() => {
    if (!data) return null
    if (showTest) return data
    return { ...data, respondents: data.respondents.filter((r) => !r.is_test) }
  }, [data, showTest])

  const answersByRespondent = useMemo(() => {
    if (!filtered) return new Map<string, number>()
    const m = new Map<string, number>()
    for (const a of filtered.answers) m.set(a.respondent_id, (m.get(a.respondent_id) || 0) + 1)
    return m
  }, [filtered])

  const exportCsv = () => {
    if (!filtered) return
    const rows = [['respondent_id', 'is_test', 'source', 'completed_at', 'question_id', 'value']]
    const rMap = new Map(filtered.respondents.map((r) => [r.id, r]))
    for (const a of filtered.answers) {
      const r = rMap.get(a.respondent_id)
      const v = Array.isArray(a.value) ? (a.value as string[]).join(' | ') : String(a.value ?? '')
      rows.push([a.respondent_id, String(r?.is_test ?? ''), r?.source ?? '', r?.completed_at ?? '', a.question_id, `"${v.replace(/"/g, '""')}"`])
    }
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ski-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!authed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm rounded-3xl border-2 border-black bg-white p-6 shadow-[0_6px_0_rgba(0,0,0,0.8)]">
          <h1 className="text-xl font-black">Admin</h1>
          <p className="mt-1 text-sm text-black/60">Enter the shared password.</p>
          <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="Password" className="mt-4 w-full rounded-2xl border-2 border-black bg-white px-4 py-3 text-base" />
          {loginErr && <p className="mt-2 text-sm font-semibold text-red-600">{loginErr}</p>}
          <button onClick={login} className="mt-4 h-12 w-full rounded-2xl border-2 border-black bg-orange-500 font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.8)]">Enter</button>
        </div>
      </div>
    )
  }

  const total = filtered?.respondents.length ?? 0
  const completed = filtered?.respondents.filter((r) => r.completed_at).length ?? 0

  return (
    <div className="min-h-dvh bg-white text-black">
      <div className="mx-auto max-w-4xl px-5 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black">SKI Admin</h1>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={showTest} onChange={(e) => setShowTest(e.target.checked)} /> show test</label>
            <button onClick={load} className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-sm font-semibold">Reload</button>
            <button onClick={exportCsv} className="rounded-full border-2 border-black bg-[#5798E0] px-3 py-1.5 text-sm font-bold text-white">Export CSV</button>
            <button onClick={() => { sessionStorage.removeItem(PASS_KEY); setAuthed(false); setData(null) }} className="text-sm underline">Logout</button>
          </div>
        </div>

        <div className="mt-2 flex gap-2 text-sm">
          <span className="rounded-full bg-black px-3 py-1 font-semibold text-white">{total} respondents</span>
          <span className="rounded-full border-2 border-black bg-white px-3 py-1 font-semibold">{completed} completed ({total ? Math.round((completed / total) * 100) : 0}%)</span>
        </div>

        {err && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{err}</p>}

        <div className="mt-6 flex gap-2 border-b-2 border-black">
          <button onClick={() => setTab('feed')} className={`px-4 py-2 text-sm font-bold ${tab === 'feed' ? 'border-b-4 border-orange-500' : 'text-black/60'}`}>Live Feed</button>
          <button onClick={() => setTab('explorer')} className={`px-4 py-2 text-sm font-bold ${tab === 'explorer' ? 'border-b-4 border-orange-500' : 'text-black/60'}`}>Explorer</button>
        </div>

        {tab === 'feed' && filtered && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b-2 border-black text-xs uppercase tracking-wide text-black/60"><th className="py-2 pr-3">ID</th><th className="py-2 pr-3">Source</th><th className="py-2 pr-3">When</th><th className="py-2 pr-3">Completed</th><th className="py-2 pr-3">Answers</th><th className="py-2">Test</th></tr></thead>
              <tbody>
                {filtered.respondents.map((r) => (
                  <tr key={r.id} className="border-b border-black/10">
                    <td className="py-2 pr-3 font-mono text-xs">{r.id.slice(0, 8)}</td>
                    <td className="py-2 pr-3">{r.source || '-'}</td>
                    <td className="py-2 pr-3 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-3 text-xs">{r.completed_at ? new Date(r.completed_at).toLocaleString() : '-'}</td>
                    <td className="py-2 pr-3">{answersByRespondent.get(r.id) || 0}</td>
                    <td className="py-2">{r.is_test ? 'yes' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.respondents.length && <p className="py-8 text-center text-sm text-black/60">No respondents yet.</p>}
          </div>
        )}

        {tab === 'explorer' && filtered && (
          <div className="mt-4 space-y-6">
            {(schema as unknown as { questions: { id: string; prompt: string; type: string; options?: string[] }[] }).questions.map((q) => {
              const vals = filtered.answers.filter((a) => a.question_id === q.id)
              if (!vals.length) return <div key={q.id} className="rounded-2xl border-2 border-black p-4"><p className="text-sm font-bold">{q.id}: {q.prompt}</p><p className="mt-1 text-xs text-black/60">No answers yet.</p></div>
              const counts = new Map<string, number>()
              for (const a of vals) {
                const v = a.value
                const keys = Array.isArray(v) ? (v as string[]) : [String(v)]
                for (const k of keys) counts.set(k, (counts.get(k) || 0) + 1)
              }
              return (
                <div key={q.id} className="rounded-2xl border-2 border-black p-4">
                  <p className="text-sm font-bold">{q.id}: {q.prompt} <span className="font-normal text-black/60">({vals.length})</span></p>
                  <div className="mt-3 space-y-1">
                    {Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([opt, c]) => (
                      <div key={opt} className="flex items-center justify-between gap-3 text-sm"><span className="break-words">{opt.slice(0, 120)}</span><span className="shrink-0 rounded-full bg-black px-2 py-0.5 text-xs font-bold text-white">{c}</span></div>
                    ))}
                  </div>
                  {q.type === 'text' && (
                    <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-orange-600">Show verbatims ({vals.length})</summary><ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm leading-relaxed">{vals.slice(0, 100).map((a, i) => <li key={i} className="rounded-xl bg-black/5 px-3 py-2">{String(a.value).slice(0, 300)}</li>)}</ul></details>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
