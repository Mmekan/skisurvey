// src/screens/WelcomeScreen.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setThemeColor } from '../lib/theme'

export default function WelcomeScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    setThemeColor('#ffffff')
    // Prevent the "jump" that sometimes happens on iOS back navigation
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="flex min-h-dvh justify-center bg-white text-black">
      <div className="relative flex w-full max-w-md flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        
        {/* Title block – no fixed mt-[60px] */}
        <div className="mt-10 flex-1">
          <h1 className="text-balance text-[clamp(2.75rem,11vw,3.5rem)] font-black leading-[1.05] tracking-tight text-black">
            Tell us<br />
            how you<br />
            actually<br />
            <span className="inline-flex items-center">
              <span className="mr-1.5 inline-flex items-center">
                <span className="h-5 w-5 rounded-full border-[3px] border-white bg-orange-500" />
                <span className="-ml-1.5 h-5 w-5 rounded-full border-[3px] border-white bg-[#5798E0]" />
                <span className="-ml-1.5 h-5 w-5 rounded-full border-[3px] border-white bg-[#4FB118]" />
              </span>
              study,
            </span>
          </h1>

          <p className="mt-1 text-2xl font-bold italic text-black/50">
            if you do.
          </p>

          <p className="mt-6 text-base leading-relaxed text-black/70">
            We’re building SKI for Nigerian university students, and we’d rather ask
            than guess.{' '}
            <span className="font-bold text-[#5798E0]">There are no right answers.</span>
          </p>
        </div>

        {/* Bottom section – always stays above the Safari bar */}
        <div className="mt-8 shrink-0 pb-2">
          <button
            type="button"
            onClick={() => navigate('/survey')}
            className="flex h-16 w-full items-center justify-between rounded-full border-2 border-black bg-orange-500 pl-7 pr-2.5 text-lg font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,0.8)] transition active:translate-y-[3px] active:shadow-[0_1px_0_rgba(0,0,0,0.8)]"
          >
            <span>Tap to continue</span>

            {/* Black circle with pulsing white core */}
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-black">
              <span className="absolute h-5 w-5 rounded-full bg-white animate-pulse-scale" />
            </span>
          </button>

          <p className="mt-3 text-center text-sm text-black/60">
            About 10 minutes. Anonymous unless you choose to share your contact at the end.
          </p>
        </div>
      </div>
    </div>
  )
}