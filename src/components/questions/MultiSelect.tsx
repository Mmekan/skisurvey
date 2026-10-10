// src/components/questions/MultiSelect.tsx
import type { MultiSelectQuestion } from '../../types/question'

interface Props {
  question: MultiSelectQuestion
  value: string[]
  onChange: (value: string[]) => void
}

// "Other" used to be a dead end: it counted as a pick, satisfied minPicks,
// and stored the literal string "Other" — discarding what the respondent
// actually meant. On Q12/Q15/Q23/Q35 that option exists specifically to
// surface what the fixed options missed, so losing it cost the most signal
// exactly where the sealed Phase 0 rules are looking.
//
// The typed text rides along in the same array slot as "Other: <text>", so
// it still counts as one pick against maxPicks, and analysis can find it
// with startsWith('Other') rather than an exact match.
const OTHER = 'Other'

function isOther(entry: string): boolean {
  return entry === OTHER || entry.startsWith(`${OTHER}:`)
}

export default function MultiSelect({ question, value, onChange }: Props) {
  const hasOther = question.options.includes(OTHER)
  const otherEntry = value.find(isOther)
  const otherText = otherEntry && otherEntry.startsWith(`${OTHER}:`) ? otherEntry.slice(OTHER.length + 1) : ''

  const toggle = (option: string) => {
    // Match the chip being toggled against the stored form, so "Other: x"
    // toggles off the same chip "Other" toggles on.
    const on = isOther(option) ? otherEntry !== undefined : value.includes(option)

    if (on) {
      onChange(value.filter((v) => (isOther(option) ? !isOther(v) : v !== option)))
      return
    }
    if (value.length >= question.maxPicks) return
    onChange([...value, option])
  }

  const setOtherText = (text: string) => {
    const trimmed = text.trim()
    const withoutOther = value.filter((v) => !isOther(v))
    onChange(trimmed ? [...withoutOther, `${OTHER}: ${trimmed}`] : [...withoutOther, OTHER])
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight text-black">{question.prompt}</h1>
      <p className="mt-2 text-sm text-black/70">
        Select up to {question.maxPicks}. {value.length} selected.
        {value.length >= question.maxPicks && (
          <span className="font-semibold text-orange-600"> Limit reached — remove one to pick another.</span>
        )}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {question.options.map((option) => {
          const isOn = isOther(option) ? otherEntry !== undefined : value.includes(option)
          const atLimit = !isOn && value.length >= question.maxPicks
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={isOn}
              disabled={atLimit}
              className={`min-h-11 break-words rounded-full border-2 border-black px-4 py-2.5 text-left font-semibold leading-snug transition disabled:opacity-40 ${
                isOn
                  ? 'translate-y-[2px] bg-[#5798E0] text-white shadow-[0_1px_0_rgba(0,0,0,0.8)]'
                  : 'bg-white/90 text-black shadow-[0_3px_0_rgba(0,0,0,0.8)] hover:brightness-95'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
      {hasOther && otherEntry !== undefined && (
        <textarea
          autoFocus
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          placeholder="Tell us what that is"
          aria-label="Tell us what you mean by other"
          className="mt-4 h-24 w-full rounded-2xl border-2 border-black bg-white/90 p-3 text-base leading-relaxed text-black"
        />
      )}
    </div>
  )
}