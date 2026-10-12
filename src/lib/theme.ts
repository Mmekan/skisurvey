// src/lib/theme.ts
export function setThemeColor(hex: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex)
}
