// src/components/BlurFade.tsx
import { useEffect, useState } from 'react'

export default function BlurFade({ children, id }: { children: React.ReactNode; id: string }) {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [show, setShow] = useState(prefersReduced)
  useEffect(() => {
    if (prefersReduced) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- entrance animation reset
    setShow(false)
    const t = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(t)
  }, [id, prefersReduced])
  if (prefersReduced) return <>{children}</>
  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        filter: show ? 'blur(0px)' : 'blur(6px)',
        transform: show ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 320ms ease, filter 320ms ease, transform 320ms ease',
      }}
    >
      {children}
    </div>
  )
}
