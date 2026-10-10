// src/screens/ThankYouScreen.tsx
// Reached when the respondent advances past the last visible question.
// Its existence is what gives the completion event a place to fire from —
// before this existed, finishing the survey was indistinguishable from
// abandoning it (no `completed_at` was ever written).
//
// Follows the same full-screen conventions as the other screens: `h-dvh
// overflow-hidden`, safe-area padding, and a theme-color sync, or this route
// becomes the one page with the iOS notch seam.
import { useEffect } from 'react'
import { CREAM_DARK, CREAM_LIGHT, setThemeColor } from '../lib/theme'

export default function ThankYouScreen() {
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setThemeColor(isDark ? CREAM_DARK : CREAM_LIGHT)
  }, [])

  return (
    <div className="flex h-dvh items-center justify-center overflow-hidden bg-[#F3F7FA]/90 px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-black backdrop-blur-2xl">
      <div className="w-full max-w-md text-center">
        <div aria-hidden="true" className="mb-8 flex justify-center">
          <span className="h-8 w-8 rounded-full border-[3px] border-white bg-orange-500" />
          <span className="-ml-2 h-8 w-8 rounded-full border-[3px] border-white bg-[#5798E0]" />
          <span className="-ml-2 h-8 w-8 rounded-full border-[3px] border-white bg-[#4FB118]" />
        </div>

        <h1 className="text-balance text-4xl font-black leading-tight">
          That&rsquo;s everything. Thank you.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-black/70">
          Your answers are recorded. If you left a number we may reach out to ask a
          couple of follow-up questions, nothing more than that.
        </p>
        <p className="mt-8 text-sm text-black/60">
          There are no right answers here, so nothing you said can be wrong.
        </p>
      </div>
    </div>
  )
}
