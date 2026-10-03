// src/lib/theme.ts
// Keeps the browser/OS chrome (iOS status bar, Android address bar) in sync
// with whatever color the current screen is actually showing. Needed because
// dark mode here is a manual class toggle, not prefers-color-scheme, so a
// static <meta name="theme-color"> in index.html can't track it on its own.
export function setThemeColor(hex: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex)
}

export const CREAM_LIGHT = '#FEF3E0'
export const CREAM_DARK = '#4B2E2A'
export const IVORY = '#FBF2CF'
