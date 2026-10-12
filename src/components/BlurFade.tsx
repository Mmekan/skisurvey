// src/components/BlurFade.tsx
export default function BlurFade({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <div key={id} className="animate-blur-fade">
      {children}
    </div>
  )
}
