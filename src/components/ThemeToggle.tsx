// src/components/ThemeToggle.tsx
// Light/dark toggle. Defaults to light on first visit (no system-preference
// detection, per the decision to always start light); the choice persists
// in localStorage after that. Dark mode is driven by a `.dark` class on
// <html> which swaps the --color-brown/--color-cream token values in
// src/index.css, rather than this component touching any page's colors
// directly.
//
// Rocker-style Light/Dark switch, styled to match the app's own buttons
// (thick border, hard drop-shadow, amber accent) rather than a generic
// gray rocker control.
import { useEffect, useState } from 'react'
import { CREAM_DARK, CREAM_LIGHT, setThemeColor } from '../lib/theme'

const THEME_KEY = 'ski_theme'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    setThemeColor(dark ? CREAM_DARK : CREAM_LIGHT)
  }, [dark])

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setDark((d) => !d)}
      className="flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-brown bg-white transition hover:brightness-95 dark:bg-ink dark:hover:brightness-125"
    >
      <span
        aria-hidden="true"
        className={`h-5 w-5 rounded-full bg-amber shadow-[0_1px_0_var(--color-brown)] transition-transform duration-200 ${
          dark ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
