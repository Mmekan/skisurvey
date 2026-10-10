// src/components/questions/TapQuestion.tsx
import type { TapQuestion as TapQuestionType } from '../../types/question'

interface Props {
  question: TapQuestionType
  value?: string
  onChange: (value: string) => void
}

// Selecting "Other" with nowhere to type meant the respondent's actual
// answer was discarded and only the literal string "Other" was stored —
// dead data on a question that often exists precisely to capture what
// the fixed options missed.
const OTHER = 'Other'

export default function TapQuestion({ question, value, onChange }: Props) {
  const hasOther = question.options.includes(OTHER)
  const otherText = hasOther && value?.startsWith(`${OTHER}:`) ? value.slice(OTHER.length + 1) : ''
  const pickedOther = hasOther && (value === OTHER || otherText !== '' || value?.startsWith(`${OTHER}:`))

  const select = (option: string) => {
    if (option === OTHER && value !== undefined) {
      // Selecting Other opens the field; don't clobber a half-typed answer
      // when the respondent taps the chip again (e.g. to dismiss the keyboard).
      onChange(otherText ? `${OTHER}: ${otherText}` : OTHER)
      return
    }
    onChange(option)
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight">{question.prompt}</h1>
      <div className="mt-5 flex flex-col gap-2">
        {question.options.map((option) => {
          const isOn = option === OTHER ? pickedOther : value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => select(option)}
              aria-pressed={isOn}
              className={`min-h-12 break-words rounded-2xl border-2 border-black px-4 py-3 text-left font-semibold leading-snug transition ${
                isOn
                  ? 'translate-y-[3px] bg-[#5798E0] text-white shadow-[0_1px_0_rgba(0,0,0,0.8)]'
                  : 'bg-white/90 text-black shadow-[0_4px_0_rgba(0,0,0,0.8)] hover:brightness-95'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
      {pickedOther && (
        <textarea
          autoFocus
          value={otherText}
          onChange={(e) =>
            onChange(e.target.value.trim() ? `${OTHER}: ${e.target.value.trim()}` : OTHER)
          }
          placeholder="Tell us what that is"
          aria-label="Tell us what you mean by other"
          className="mt-3 h-24 w-full rounded-2xl border-2 border-black bg-white/90 p-3 text-base leading-relaxed text-black"
        />
      )}
    </div>
  )
}