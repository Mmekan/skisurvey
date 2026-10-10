// src/screens/WelcomeScreen.tsx
// Static screen — no animation. Matches the latest approved mockup
// (sunset red/orange, warm ivory background, lime accent, floating
// subject terms). Explicitly SUBJECT TO CHANGE — not a locked design,
// per the decision to let code follow the mockup for now.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IVORY, setThemeColor } from '../lib/theme'

export default function WelcomeScreen() {
  const navigate = useNavigate()

  // This screen isn't theme-toggle aware (no purpose for dark mode here),
  // but the status bar color is global, so reset it to Welcome's own ivory
  // whenever this screen is the one on top — otherwise it'd be stuck
  // showing whatever the survey screen last set it to.
  useEffect(() => {
    setThemeColor(IVORY)
  }, [])

  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-transparent pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-black">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="relative z-10 flex h-full flex-col px-6 pt-10 pb-2">
          <h1 className="mt-20 text-balance text-[56px] font-black leading-[1.05] tracking-tight text-black">
            Tell us<br />
            how you<br />
            actually<br />
            <span className="mr-1.5 inline-flex items-center align-middle">
              <span className="h-6 w-6 rounded-full border-[3px] border-white bg-orange-500" />
              <span className="-ml-2 h-6 w-6 rounded-full border-[3px] border-white bg-[#5798E0]" />
              <span className="-ml-2 h-6 w-6 rounded-full border-[3px] border-white bg-[#4FB118]" />
            </span>
            study,
          </h1>
          <p className="text-2xl font-bold italic text-black/50">if you do.</p>

          <p className="mt-6 text-base leading-relaxed text-black/70">
            We’re building SKI for Nigerian university students, and we’d rather ask
            than guess. <span className="font-bold text-[#5798E0]">There are no right answers.</span>
          </p>

          <div className="flex-1 min-h-10" />

          <button
            type="button"
            onClick={() => navigate('/survey')}
            className="mb-2 flex h-16 items-center justify-between rounded-full border-2 border-black bg-orange-500 pl-7 pr-2.5 text-lg font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,0.8)] transition hover:brightness-110 active:translate-y-[3px] active:shadow-[0_1px_0_rgba(0,0,0,0.8)]"
          >
            <span>Step inside</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
          <p className="mb-2 text-center text-sm text-black/60">
            About 10 minutes. Anonymous unless you choose to share your contact at the end.
          </p>
        </div>
      </div>
    </div>
  )
}
