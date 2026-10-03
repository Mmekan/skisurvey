// src/components/questions/ConceptScreen.tsx
import type { ConceptQuestion } from '../../types/question'

interface Props {
  question: ConceptQuestion
}

export default function ConceptScreen({ question }: Props) {
  return (
    <div className="-mx-5 -mt-6 min-h-full bg-brown px-5 pt-10 text-cream">
      <h1 className="text-3xl font-extrabold leading-tight">{question.prompt}</h1>
      <p className="mt-5 text-lg font-semibold">Imagine a platform where you can:</p>
      <ul className="mt-4 flex flex-col gap-4">
        {question.body.map((line) => (
          <li key={line} className="text-lg font-semibold leading-snug">
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-6 rounded-2xl border-2 border-amber p-4 text-base">
        There’s no right answer. Tell us what’s wrong with it too.
      </p>
    </div>
  )
}