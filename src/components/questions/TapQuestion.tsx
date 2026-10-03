// src/components/questions/TapQuestion.tsx
import type { TapQuestion as TapQuestionType } from '../../types/question'

interface Props {
  question: TapQuestionType
  value?: string
  onChange: (value: string) => void
}

export default function TapQuestion({ question, value, onChange }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight">{question.prompt}</h1>
      <div className="mt-5 flex flex-col gap-2">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`h-12 rounded-2xl border-2 border-brown px-4 text-left font-semibold transition ${
              value === option
                ? 'translate-y-[3px] bg-amber shadow-[0_1px_0_var(--color-brown)]'
                : 'bg-white shadow-[0_4px_0_var(--color-brown)] hover:brightness-95 dark:bg-ink dark:hover:brightness-125'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}