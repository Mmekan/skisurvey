// src/components/questions/MultiSelect.tsx
import type { MultiSelectQuestion } from '../../types/question'

interface Props {
  question: MultiSelectQuestion
  value: string[]
  onChange: (value: string[]) => void
}

export default function MultiSelect({ question, value, onChange }: Props) {
  const toggle = (option: string) => {
    const isOn = value.includes(option)
    if (isOn) {
      onChange(value.filter((v) => v !== option))
      return
    }
    if (value.length >= question.maxPicks) return
    onChange([...value, option])
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight">{question.prompt}</h1>
      <p className="mt-2 text-sm text-brown/70">
        Select up to {question.maxPicks}. {value.length} selected.
        {value.length >= question.maxPicks && (
          <span className="font-semibold text-orange-dark"> Limit reached — remove one to pick another.</span>
        )}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {question.options.map((option) => {
          const isOn = value.includes(option)
          const atLimit = !isOn && value.length >= question.maxPicks
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={isOn}
              disabled={atLimit}
              className={`h-11 rounded-full border-2 border-brown px-4 font-semibold transition disabled:opacity-40 ${
                isOn
                  ? 'translate-y-[2px] bg-amber shadow-[0_1px_0_var(--color-brown)]'
                  : 'bg-white shadow-[0_3px_0_var(--color-brown)] hover:brightness-95 dark:bg-ink dark:hover:brightness-125'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}