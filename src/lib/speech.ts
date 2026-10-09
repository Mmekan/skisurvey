// src/lib/speech.ts
//
// Minimal typing for the Web Speech API — it isn't in TypeScript's default
// lib, so the app declares the shape it actually uses rather than casting
// through `any`. Shared so the mic button and its intro popup agree on what
// "supported" means.

export interface SpeechRecognitionAlternativeLike {
  transcript: string
}

export interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike
  length: number
}

export interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>
}

export interface SpeechRecognitionErrorEventLike {
  error?: string
}

export interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

// iOS Safari has no implementation, so anything gated on this must not
// advertise the mic — a button that looks live and records nothing is the
// worst of both outcomes for a respondent on a deadline.
export function speechSupported(): boolean {
  return getCtor() !== null
}

export function createRecognition(): SpeechRecognitionLike | null {
  const Ctor = getCtor()
  return Ctor ? new Ctor() : null
}