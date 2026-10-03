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
    <div className="flex h-dvh justify-center overflow-hidden bg-ivory pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-ink">
      <div className="relative flex w-full max-w-md flex-col px-6 pt-6">
        <div
          aria-hidden="true"
          className="absolute -right-[60px] -top-[50px] h-56 w-56 rounded-full bg-gradient-to-br from-sunset-red to-sunset-orange opacity-20"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 font-extrabold">
          {FLOATING_TERMS.map((t) => (
            <span
              key={t.text}
              className="absolute"
              style={{
                top: t.top,
                left: t.left,
                fontSize: t.size,
                opacity: t.opacity,
                transform: `rotate(${t.rotate}deg)`,
              }}
            >
              {t.text}
            </span>
          ))}
        </div>

        <div className="relative z-10 flex h-full flex-col">
          <div className="self-end text-left text-base font-bold uppercase leading-[1.2] tracking-wide">
            <span className="text-[1.3em] font-black text-sunset-red">S</span>tudent<br />
            <span className="text-[1.3em] font-black text-sunset-red">K</span>nowledge<br />
            <span className="text-[1.3em] font-black text-sunset-red">I</span>nterface
          </div>

          <h1 className="mt-2 text-balance text-[56px] font-black leading-[1.05] tracking-tight">
            Tell us<br />
            how you<br />
            actually<br />
            <span className="mr-1.5 inline-flex items-center align-middle">
              <span className="h-6 w-6 rounded-full border-[3px] border-ivory bg-sunset-red" />
              <span className="-ml-2 h-6 w-6 rounded-full border-[3px] border-ivory bg-sunset-orange" />
              <span className="-ml-2 h-6 w-6 rounded-full border-[3px] border-ivory bg-lime" />
            </span>
            study,
          </h1>
          <p className="text-2xl font-bold italic text-ink/50">if you do.</p>

          <p className="mt-8 text-base leading-relaxed text-ink/70">
            We’re building SKI for Nigerian university students, and we’d rather ask
            than guess. <span className="font-bold text-lime">There are no right answers.</span>
          </p>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => navigate('/survey')}
            className="mb-4 flex h-16 items-center justify-between rounded-full border-2 border-ink bg-gradient-to-br from-sunset-red to-sunset-orange pl-7 pr-2.5 text-lg font-extrabold text-ivory shadow-[0_4px_0_var(--color-ink)] transition hover:brightness-110 active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-ink)]"
          >
            <span>Step inside</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-ivory">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
          <p className="mb-10 text-center text-sm text-ink/60">
            About 10 minutes. Anonymous unless you choose to share your contact at the end.
          </p>

          <div className="flex-1" />
        </div>
      </div>
    </div>
  )
}
