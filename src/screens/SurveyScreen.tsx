// src/screens/SurveyScreen.tsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import schema from '../data/questions.json'
import type { Question, SurveySchema } from '../types/question'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { saveAnswer as rpcSaveAnswer, saveContact as rpcSaveContact, markCompleted } from '../lib/save'
import TapQuestion from '../components/questions/TapQuestion'
import MultiSelect from '../components/questions/MultiSelect'
import TextQuestion from '../components/questions/TextQuestion'
import ConceptScreen from '../components/questions/ConceptScreen'
import ProgressBar from '../components/ProgressBar'
// import ThemeToggle from '../components/ThemeToggle' // hidden for now — the
// switch took a row of its own above Continue and cramped the question area on
// a 375px screen. Dark mode itself still works; only the control is hidden.
import ThankYouScreen from './ThankYouScreen'
import { CREAM_DARK, CREAM_LIGHT, setThemeColor } from '../lib/theme'

const { sections, questions } = schema as unknown as SurveySchema

type AnswerValue = string | string[]
type Answers = Record<string, AnswerValue>

// Resume state lives in localStorage, not Supabase — the anon key can
// write but never read back (see CLAUDE.md on RLS). Supabase is the
// durable one-way backup; localStorage is what survives a reload.
const RESPONDENT_KEY = 'ski_respondent_id'
const ANSWERS_KEY = 'ski_answers'
const INDEX_KEY = 'ski_question_index'
// The current question is tracked by id, not by array position. Position
// shifts the moment a showIf gate opens or closes, so a bare index silently
// moves the respondent to a *different* question (bug 2). The id is the
// identity; INDEX_KEY is only a fallback for saves made before this existed.
const QUESTION_ID_KEY = 'ski_question_id'
// Survives a cleared survey (unlike RESPONDENT_KEY) so a respondent who wipes
// localStorage mid-survey can be collapsed back into one row at analysis time
// instead of counting as two people (bug 1).
const DEVICE_KEY = 'ski_device_id'

// Every localStorage read goes through here. A single malformed key used to
// white-screen /survey with no recovery — during fielding that is a lost
// response, not a cosmetic bug (bug 5).
function readKey(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as T) : fallback
  } catch {
    return fallback
  }
}

function getDeviceId(): string | null {
  try {
    const existing = localStorage.getItem(DEVICE_KEY)
    if (existing) return existing
    const fresh = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, fresh)
    return fresh
  } catch {
    return null
  }
}

// Writes go through here for the same reason reads do: a full or blocked
// localStorage would otherwise throw out of a passive effect. A null value
// clears the key — clearing is load-bearing, not incidental: a stale
// question id left behind after the survey completes would resume a finished
// respondent at a question instead of the thank-you screen.
function writeKey(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* non-fatal — resume degrades, the survey keeps running */
  }
}

// Q53_54 is the only question that writes to `contacts` instead of
// `answers` — it's the consent-bearing phone number, and the table is
// separate precisely so it can be purged on its own schedule.
const CONTACT_QUESTION_ID = 'Q53_54'

function isQuestionVisible(q: Question, answers: Answers): boolean {
  if (!q.showIf) return true
  const answer = answers[q.showIf.questionId]
  if (answer === undefined) return false // gating question not yet answered — hide until it is
  const value = Array.isArray(answer) ? answer[0] : answer
  if (q.showIf.valueIn) return q.showIf.valueIn.includes(value)
  if (q.showIf.valueNotIn) return !q.showIf.valueNotIn.includes(value)
  return true
}

function isAnswerValid(q: Question, value: AnswerValue | undefined): boolean {
  if (!q.required) return true
  if (q.type === 'concept') return true
  if (q.type === 'multiSelect') {
    const arr = (value as string[] | undefined) ?? []
    // The UI can't exceed maxPicks, but restored or hand-edited localStorage
    // can — and the answer is what reaches Supabase, so validate the value
    // rather than trusting the control that produced it.
    return arr.length >= q.minPicks && arr.length <= q.maxPicks
  }
  return typeof value === 'string' && value.trim().length > 0
}

function getValidationMessage(q: Question, value: AnswerValue | undefined): string | null {
  if (isAnswerValid(q, value)) return null
  if (q.type === 'multiSelect') {
    const picked = (value as string[] | undefined)?.length ?? 0
    if (picked > q.maxPicks) {
      return `Remove ${picked - q.maxPicks} to continue — up to ${q.maxPicks} allowed.`
    }
    const remaining = q.minPicks - picked
    return `Pick ${remaining} more to continue.`
  }
  return 'This question is required.'
}

export default function SurveyScreen() {
  // Unlike Welcome, this screen tracks dark mode, so restore whichever
  // status-bar color actually matches the current .dark state — otherwise
  // arriving here from Welcome would leave the status bar stuck on ivory.
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setThemeColor(isDark ? CREAM_DARK : CREAM_LIGHT)
  }, [])

  const [answers, setAnswers] = useState<Answers>(() => readJson<Answers>(ANSWERS_KEY, {}))
  const [storedIndex, setStoredIndex] = useState<number>(() => {
    const n = Number(readKey(INDEX_KEY))
    return Number.isFinite(n) && n > 0 ? n : 0
  })
  const [currentId, setCurrentId] = useState<string | null>(() => readKey(QUESTION_ID_KEY))
  const [respondentId, setRespondentId] = useState<string | null>(() => readKey(RESPONDENT_KEY))
  const [saveError, setSaveError] = useState(false)

  // Create the respondent row once, on first load only.
  //
  // IMPORTANT: never call .select() on an anon insert into these tables.
  // INSERT ... RETURNING requires the new row to also pass a SELECT
  // policy, and anon deliberately has none (see CLAUDE.md rule 9). That
  // combination throws the exact same 42501 error as a real RLS
  // misconfiguration, which cost a multi-hour debugging detour once
  // already. Generate the id client-side instead and skip .select().
  useEffect(() => {
    if (respondentId) return
    const id = crypto.randomUUID()
    const params = new URLSearchParams(window.location.search)
    const device_id = getDeviceId()
    const base = {
      id,
      source: params.get('src') ?? null,
      is_test: import.meta.env.DEV, // auto-flags dev-server runs; flip manually for pilot data
    }

    void (async () => {
      let { error } = await supabase
        .from('respondents')
        .insert({ ...base, ...(device_id ? { device_id } : {}) })

      // device_id only exists if supabase-device-id-patch.sql has been run.
      // If it hasn't, the insert fails outright — and a failed respondent
      // insert is silent, because every later save bails on a missing
      // respondentId. Retry without the column so schema/client ordering can
      // never cost a response.
      if (error && device_id) {
        ;({ error } = await supabase.from('respondents').insert(base))
      }

      if (error) {
        console.error('Could not create respondent row:', error)
        return
      }
      setRespondentId(id)
      writeKey(RESPONDENT_KEY, id)
    })()
  }, [respondentId])

  const visibleQuestions = useMemo(
    () => questions.filter((q) => isQuestionVisible(q, answers)),
    [answers]
  )

  // Resolve position from identity: find the question we're actually on,
  // rather than trusting a number that may now point somewhere else.
  const index = useMemo(() => {
    if (currentId) {
      const i = visibleQuestions.findIndex((q) => q.id === currentId)
      if (i !== -1) return i
      // The question we were on is now gated away by an answer change. Fall
      // back to the recorded position, clamped so it can never run off the
      // end of the list.
      return Math.min(storedIndex, Math.max(visibleQuestions.length - 1, 0))
    }
    return Math.min(storedIndex, visibleQuestions.length)
  }, [visibleQuestions, currentId, storedIndex])

  const current = visibleQuestions[index]

  // The respondent is complete once they advance past the last visible
  // question. Without this write, an abandoned response at Q4 was
  // indistinguishable from a finished one and completion rate — a core
  // survey-quality metric — could not be computed.
  const hasCompleted = index >= visibleQuestions.length

  useEffect(() => {
    if (!hasCompleted || !respondentId) return
    void markCompleted(respondentId)
  }, [hasCompleted, respondentId])

  useEffect(() => {
    writeKey(ANSWERS_KEY, JSON.stringify(answers))
  }, [answers])

  // Persist the question *id* alongside the position. The id is what restores
  // correctly when branching has changed the shape of the list since the
  // respondent last looked; the index is only a fallback for legacy saves.
  useEffect(() => {
    writeKey(INDEX_KEY, String(index))
    writeKey(QUESTION_ID_KEY, currentId)
  }, [index, currentId])

  // Phone-number writes are debounced because this field saves on every
  // keystroke, and each one is a delete plus an insert — unthrottled, a
  // slow connection produces a burst of requests and the last keystroke
  // isn't guaranteed to be the last write to land.
const contactTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingContact = useRef<string | null>(null)

  const saveContact = useCallback(async (id: string, phone: string) => {
    // Clearing the field must actually remove the row — a stale number left
    // behind after someone deletes it is a consent/privacy problem, not a
    // cosmetic one. Anon's DELETE matched zero rows, so that guarantee only
    // exists now that the write runs as the table owner via the RPC.
    const error = await rpcSaveContact(id, phone)
    if (error) {
      console.error('Autosave failed for contact:', error.message)
      setSaveError(true)
    } else {
      setSaveError(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      // Flush rather than cancel: if the respondent typed a number and
      // closed the tab inside the debounce window, dropping the pending
      // write would silently lose a consented contact.
      if (contactTimer.current) clearTimeout(contactTimer.current)
      if (pendingContact.current && respondentId) {
        void saveContact(respondentId, pendingContact.current)
      }
    }
  }, [respondentId, saveContact])

  const saveAnswer = useCallback(
    async (questionId: string, value: AnswerValue) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
      if (!respondentId) return

      // The contact goes to `contacts`, never `answers` — a consented phone
      // number must stay purgeable without touching a real response.
      if (questionId === CONTACT_QUESTION_ID) {
        pendingContact.current = value as string
        if (contactTimer.current) clearTimeout(contactTimer.current)
        contactTimer.current = setTimeout(() => {
          pendingContact.current = null
          void saveContact(respondentId, value as string)
        }, 600)
        return
      }

      const error = await rpcSaveAnswer(respondentId, questionId, value)
      if (error) {
        console.error('Autosave failed for', questionId, error.message)
        setSaveError(true)
      } else {
        setSaveError(false)
      }
    },
    [respondentId, saveContact]
  )

  const moveTo = (next: number) => {
    const clamped = Math.max(0, Math.min(next, visibleQuestions.length))
    setStoredIndex(clamped)
    // Past the end this is null — which is what marks the survey complete.
    setCurrentId(visibleQuestions[clamped]?.id ?? null)
  }

  const goNext = () => moveTo(index + 1)
  const goBack = () => moveTo(index - 1)

  if (hasCompleted) {
    return <ThankYouScreen />
  }

  const canContinue = isAnswerValid(current, answers[current.id])
  const validationMessage = getValidationMessage(current, answers[current.id])

  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-cream pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-brown">
      <div className="flex h-full w-full max-w-md flex-col">
        <ProgressBar sections={sections} currentSectionId={current.section} />
        <div aria-live="polite">
          {!isSupabaseConfigured && (
            <p className="mx-5 mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              Survey unavailable — configuration missing.
            </p>
          )}
          {saveError && (
            <p className="mx-5 mt-3 rounded-xl bg-orange-dark/10 px-3 py-2 text-sm font-semibold text-orange-dark">
              Couldn’t save your answer. Check your connection.
            </p>
          )}
        </div>
        {/* overflow-x-hidden: ConceptScreen bleeds full-width with -mx-5, which
          makes its content wider than this padded column — without the clip,
          the scroll area accepts horizontal drags and the concept block slides
          side to side. The bleed itself still renders edge to edge. */}
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-5 pt-6">
          {current.type === 'tap' && (
            <TapQuestion
              question={current}
              value={answers[current.id] as string | undefined}
              onChange={(v) => saveAnswer(current.id, v)}
            />
          )}
          {current.type === 'multiSelect' && (
            <MultiSelect
              question={current}
              value={(answers[current.id] as string[] | undefined) ?? []}
              onChange={(v) => saveAnswer(current.id, v)}
            />
          )}
          {current.type === 'text' && (
            <TextQuestion
              question={current}
              value={answers[current.id] as string | undefined}
              onChange={(v) => saveAnswer(current.id, v)}
            />
          )}
          {current.type === 'concept' && <ConceptScreen question={current} />}
        </div>
        {validationMessage && (
          <p className="mx-5 mb-1 text-sm font-semibold text-orange-dark">{validationMessage}</p>
        )}
        {/* <div className="flex justify-start px-5 pt-2">
          <ThemeToggle />
        </div> */}
        <div className="flex gap-3 px-5 pt-4 pb-6">
          {index > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="h-14 flex-shrink-0 rounded-2xl border-2 border-brown bg-white px-6 font-semibold shadow-[0_4px_0_var(--color-brown)] transition hover:brightness-95 active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-brown)] dark:bg-ink dark:hover:brightness-125"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className="h-14 flex-1 rounded-2xl border-2 border-brown bg-amber font-bold shadow-[0_4px_0_var(--color-brown)] transition hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-brown)] disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100 disabled:active:translate-y-0"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}