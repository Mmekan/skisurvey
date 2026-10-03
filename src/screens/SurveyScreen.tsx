// src/screens/SurveyScreen.tsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import schema from '../data/questions.json'
import type { Question, SurveySchema } from '../types/question'
import { supabase } from '../lib/supabase'
import TapQuestion from '../components/questions/TapQuestion'
import MultiSelect from '../components/questions/MultiSelect'
import TextQuestion from '../components/questions/TextQuestion'
import ConceptScreen from '../components/questions/ConceptScreen'
import ProgressBar from '../components/ProgressBar'
import ThemeToggle from '../components/ThemeToggle'
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
    return arr.length >= q.minPicks
  }
  return typeof value === 'string' && value.trim().length > 0
}

function getValidationMessage(q: Question, value: AnswerValue | undefined): string | null {
  if (isAnswerValid(q, value)) return null
  if (q.type === 'multiSelect') {
    const picked = (value as string[] | undefined)?.length ?? 0
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

  const [answers, setAnswers] = useState<Answers>(() => {
    const saved = localStorage.getItem(ANSWERS_KEY)
    return saved ? JSON.parse(saved) : {}
  })
  const [index, setIndex] = useState<number>(() => {
    const saved = localStorage.getItem(INDEX_KEY)
    return saved ? Number(saved) : 0
  })
  const [respondentId, setRespondentId] = useState<string | null>(() =>
    localStorage.getItem(RESPONDENT_KEY)
  )
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
    supabase
      .from('respondents')
      .insert({
        id,
        source: params.get('src') ?? null,
        is_test: import.meta.env.DEV, // auto-flags dev-server runs; flip manually for pilot data
      })
      .then(({ error }) => {
        if (error) {
          console.error('Could not create respondent row:', error)
          return
        }
        setRespondentId(id)
        localStorage.setItem(RESPONDENT_KEY, id)
      })
  }, [respondentId])

  const visibleQuestions = useMemo(
    () => questions.filter((q) => isQuestionVisible(q, answers)),
    [answers]
  )

  const current = visibleQuestions[index]

  useEffect(() => {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers))
  }, [answers])

  useEffect(() => {
    localStorage.setItem(INDEX_KEY, String(index))
  }, [index])

  const saveAnswer = useCallback(
    async (questionId: string, value: AnswerValue) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
      if (!respondentId) return
      const { error } = await supabase
        .from('answers')
        .upsert(
          { respondent_id: respondentId, question_id: questionId, value },
          { onConflict: 'respondent_id,question_id' }
        )
      if (error) {
        console.error('Autosave failed for', questionId, error)
        setSaveError(true)
      } else {
        setSaveError(false)
      }
    },
    [respondentId]
  )

  const goNext = () => setIndex((i) => Math.min(i + 1, visibleQuestions.length))
  const goBack = () => setIndex((i) => Math.max(i - 1, 0))

  if (!current) {
    return (
      <div className="flex h-dvh items-center justify-center overflow-hidden bg-cream pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-brown">
        <p className="text-xl font-bold">Survey complete — thank you screen goes here.</p>
      </div>
    )
  }

  const canContinue = isAnswerValid(current, answers[current.id])
  const validationMessage = getValidationMessage(current, answers[current.id])

  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-cream pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-brown">
      <div className="flex h-full w-full max-w-md flex-col">
        <ProgressBar sections={sections} currentSectionId={current.section} />
        <div aria-live="polite">
          {saveError && (
            <p className="mx-5 mt-3 rounded-xl bg-orange-dark/10 px-3 py-2 text-sm font-semibold text-orange-dark">
              Couldn’t save your answer. Check your connection.
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-6">
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
        <div className="flex justify-start px-5 pt-2">
          <ThemeToggle />
        </div>
        <div className="flex gap-3 px-5 py-6">
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