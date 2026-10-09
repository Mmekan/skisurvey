// src/components/questions/MicIntro.tsx
//
// A one-time explainer for dictation, shown over the first mic question the
// respondent meets. Dictation is the fastest way to collect a long verbatim
// answer on a phone, but the mic button is a bare icon with no affordance —
// and the target user is typing a paragraph on mobile data. So: teach it once,
// then never again.
//
// Two deliberate constraints:
//   1. Only shows where Web Speech actually exists. Advertising a mic that
//      silently does nothing (iOS Safari) is worse than saying nothing.
//   2. Says "clear words", not "correct English". This is a Nigerian student
//      survey, not a writing test — asking for simplicity rather than
//      formality is both easier to answer and the actual research intent.
import { useEffect, useRef, useState } from 'react'
import { speechSupported } from '../../lib/speech'

const SEEN_KEY = 'ski_mic_intro_seen'

export default function MicIntro() {
  // Decided once on mount: a respondent who has already seen this, or who is on
  // a browser with no Web Speech implementation, never gets it.
  const [visible, setVisible] = useState(
    () => !localStorage.getItem(SEEN_KEY) && speechSupported()
  )
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (visible) closeRef.current?.focus()
  }, [visible])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, '1')
    setVisible(false)
  }

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-brown/60 px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-intro-title"
    >
      <div className="w-full max-w-sm rounded-3xl border-2 border-brown bg-cream p-5 text-brown shadow-[0_6px_0_var(--color-brown)] dark:bg-ink dark:text-cream">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-brown bg-amber">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          </span>
          <h2 id="mic-intro-title" className="text-xl font-extrabold leading-tight">
            Too long to type? Use the mic.
          </h2>
        </div>

        <ul className="mt-4 space-y-2 text-[0.95rem] leading-relaxed">
          <li>Tap the mic once and start speaking. Tap it again to stop.</li>
          <li>
            It cleans up your words as you go, so &ldquo;um so i just uh read the
            manual&rdquo; comes out as a proper sentence.
          </li>
          <li>
            Speak in your own <strong>simple, clear words</strong> — short
            sentences are recorded most accurately. Use whatever words you
            normally use.
          </li>
          <li>You can type some, then talk, then type more.</li>
        </ul>

        <button
          ref={closeRef}
          type="button"
          onClick={dismiss}
          className="mt-5 h-12 w-full rounded-2xl border-2 border-brown bg-amber font-bold shadow-[0_4px_0_var(--color-brown)] transition active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-brown)]"
        >
          Got it
        </button>
      </div>
    </div>
  )
}