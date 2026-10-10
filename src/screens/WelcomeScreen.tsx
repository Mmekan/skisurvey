// src/screens/WelcomeScreen.tsx
// Static screen — no animation. Matches the latest approved mockup
// (sunset red/orange, warm ivory background, lime accent, floating
// subject terms). Explicitly SUBJECT TO CHANGE — not a locked design,
// per the decision to let code follow the mockup for now.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IVORY, setThemeColor } from '../lib/theme'

const FLOATING_TERMS = [
  { text: 'E=mc²', top: '6.4%', left: '64.1%', size: 22, opacity: 0.15, rotate: -12 },
  { text: 'F=ma', top: '15.4%', left: '4.1%', size: 17, opacity: 0.14, rotate: 9 },
  { text: 'dx/dt', top: '11.3%', left: '35.9%', size: 13, opacity: 0.12, rotate: -5 },
  { text: 'π', top: '35.5%', left: '74.4%', size: 34, opacity: 0.12, rotate: 14 },
  { text: '∫', top: '48.6%', left: '5.6%', size: 40, opacity: 0.12, rotate: -8 },
  { text: 'a²+b²=c²', top: '55.7%', left: '59%', size: 15, opacity: 0.14, rotate: 6 },
  { text: '√x', top: '64.6%', left: '12.8%', size: 23, opacity: 0.13, rotate: -18 },
  { text: 'ΔV=IR', top: '69.9%', left: '55.1%', size: 14, opacity: 0.14, rotate: 10 },
  { text: 'Σ', top: '78.8%', left: '75.6%', size: 30, opacity: 0.12, rotate: -10 },
  { text: '½mv²', top: '85.9%', left: '7.7%', size: 15, opacity: 0.14, rotate: 8 },
  { text: 'Python', top: '23.1%', left: '21.8%', size: 17, opacity: 0.14, rotate: -9 },
  { text: 'def main():', top: '30.2%', left: '43.6%', size: 13, opacity: 0.12, rotate: 6 },
  { text: 'Supply & Demand', top: '42.1%', left: '28.2%', size: 12, opacity: 0.12, rotate: -6 },
  { text: 'Separation of Powers', top: '59.9%', left: '33.3%', size: 11, opacity: 0.12, rotate: 4 },
  { text: 'Sonnet', top: '73.5%', left: '38.5%', size: 18, opacity: 0.14, rotate: -11 },
]

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
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-72">
          <img src="/welcome-hero.jpg" alt="" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/60 to-white" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 font-extrabold">
          {FLOATING_TERMS.map((t) => (
            <span
              key={t.text}
              className="absolute"
              style={{
                top: t.top,
                left: t.left,
                fontSize: t.size,
                opacity: t.opacity * 0.7,
                transform: `rotate(${t.rotate}deg)`,
              }}
            >
              {t.text}
            </span>
          ))}
        </div>

        <div className="relative z-10 flex h-full flex-col px-6 pt-6">
          <h1 className="mt-12 text-balance text-[56px] font-black leading-[1.05] tracking-tight text-black">
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

          <div className="h-10" />

          <button
            type="button"
            onClick={() => navigate('/survey')}
            className="mb-3 flex h-16 items-center justify-between rounded-full border-2 border-black bg-orange-500 pl-7 pr-2.5 text-lg font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,0.8)] transition hover:brightness-110 active:translate-y-[3px] active:shadow-[0_1px_0_rgba(0,0,0,0.8)]"
          >
            <span>Step inside</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
          <p className="mb-4 text-center text-sm text-black/60">
            About 10 minutes. Anonymous unless you choose to share your contact at the end.
          </p>
        </div>
      </div>
    </div>
  )
}
