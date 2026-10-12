// src/lib/theme.ts
export function setThemeColor(hex: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex)
}

export const CREAM_LIGHT = '#FEF3E0'
export const IVORY = '#FBF2CF'
