// src/components/ProgressBar.tsx
import type { Section } from '../types/question'

interface Props {
  sections: Section[]
  currentSectionId: string
}

export default function ProgressBar({ sections, currentSectionId }: Props) {
  const currentIndex = sections.findIndex((s) => s.id === currentSectionId)

  return (
    <div
      className="flex gap-1 px-5 pt-5"
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={sections.length}
      aria-label={`Section ${currentIndex + 1} of ${sections.length}`}
    >
      {sections.map((section, i) => (
        <span
          key={section.id}
          aria-hidden="true"
          className={`h-2 flex-1 rounded-full ${
            i < currentIndex ? 'bg-orange' : i === currentIndex ? 'bg-amber' : 'bg-brown/20'
          }`}
        />
      ))}
    </div>
  )
}