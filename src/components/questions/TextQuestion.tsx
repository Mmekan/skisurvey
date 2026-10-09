// src/components/questions/TextQuestion.tsx
import { useEffect, useRef, useState } from 'react'
import type { TextQuestion as TextQuestionType } from '../../types/question'
import { createRecognition, type SpeechRecognitionLike } from '../../lib/speech'
import MicIntro from './MicIntro'

interface Props {
  question: TextQuestionType
  value?: string
  onChange: (value: string) => void
}

export default function TextQuestion({ question, value, onChange }: Props) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  // Navigating to the next/previous question unmounts this component. Without
  // this, an in-progress recognition session is never told to stop — the mic
  // button disappears (looks stopped) but the browser keeps listening in the
  // background indefinitely, orphaned from any UI.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = createRecognition()
    if (!recognition) return // unsupported browser — button stays inert, not shown as broken

    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onChange(value ? `${value} ${transcript}` : transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <div className="relative flex h-full flex-col">
      <h1 className="text-2xl font-extrabold leading-tight">{question.prompt}</h1>
      <div className="relative mt-4 flex-1">
        <textarea
          value={value ?? ''}
          onChange={(e) => {
            // A phone number that arrived with letters in it can't be called
            // and can't be dialed back into the input by a validation rule —
            // filter at the gate instead of validating after the fact.
            onChange(
              question.inputMode === 'tel'
                ? e.target.value.replace(/[^0-9+()\- ]/g, '')
                : e.target.value
            )
          }}
          placeholder={question.placeholder}
          aria-label={question.prompt}
          inputMode={question.inputMode}
          className={`h-full min-h-[9rem] w-full resize-none rounded-2xl border-2 border-brown bg-white p-4 text-base leading-relaxed text-brown dark:bg-ink ${
            question.mic ? 'pr-14' : ''
          }`}
        />
        {question.mic && (
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? 'Stop voice input' : 'Answer by voice'}
            aria-pressed={listening}
            className={`absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-brown transition hover:brightness-95 dark:hover:brightness-125 ${
              listening ? 'bg-amber' : 'bg-white dark:bg-ink'
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={listening ? 'animate-pulse' : ''}
            >
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-brown/70">{(value ?? '').length} characters</span>
        {question.allowNone && (
          <button
            type="button"
            onClick={() => onChange(question.noneLabel ?? 'None')}
            className="text-sm font-semibold text-orange-dark underline hover:text-brown"
          >
            {question.noneLabel ?? 'None'}
          </button>
        )}
      </div>
      {question.mic && <MicIntro />}
    </div>
  )
}