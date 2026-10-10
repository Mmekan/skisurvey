// src/lib/confetti.ts — tiny canvas confetti, no dependency
function burst(opts: {
  origin: { x: number; y: number }
  baseDeg: number
  spread: number
  count: number
  vel: number
  colors: string[]
  gravity: number
  scalar?: number
}): () => void {
  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.inset = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  ctx.scale(dpr, dpr)
  const base = (opts.baseDeg * Math.PI) / 180
  const particles = Array.from({ length: opts.count }, () => {
    const off = (Math.random() * opts.spread - opts.spread / 2) * (Math.PI / 180)
    const a = base + off
    const ox = opts.origin.x * innerWidth
    const oy = opts.origin.y * innerHeight
    return {
      x: ox,
      y: oy,
      vx: Math.cos(a) * opts.vel * (0.5 + Math.random() * 0.5),
      vy: Math.sin(a) * opts.vel * (0.5 + Math.random() * 0.5),
      color: opts.colors[Math.floor(Math.random() * opts.colors.length)],
      life: 200,
      decay: 0.9 + Math.random() * 0.08,
      size: (opts.scalar ?? 1) * (6 + Math.random() * 6),
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
    }
  })
  let raf = 0
  let t = 0 as unknown as ReturnType<typeof setTimeout>
  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    let alive = false
    for (const p of particles) {
      if (p.life <= 0) continue
      alive = true
      p.x += p.vx
      p.y += p.vy
      p.vx *= p.decay
      p.vy = p.vy * p.decay + opts.gravity
      p.rot += p.vr
      p.life--
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.globalAlpha = Math.max(0, p.life / 60)
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      ctx.restore()
    }
    if (alive) raf = requestAnimationFrame(frame)
    else canvas.remove()
  }
  raf = requestAnimationFrame(frame)
  t = setTimeout(() => {
    cancelAnimationFrame(raf)
    canvas.remove()
  }, 3500)
  return () => {
    cancelAnimationFrame(raf)
    clearTimeout(t)
    canvas.remove()
  }
}

export function fireworks(): () => void {
  const colors = ['#D16F2E', '#5798E0', '#4FB118', '#F9A136', '#FFFFFF']
  const cleanups: Array<() => void> = []
  cleanups.push(burst({ origin: { x: 0.3, y: 0.75 }, baseDeg: 315, spread: 40, count: 80, vel: 30, colors, gravity: 0.18 }))
  const t1 = setTimeout(() => cleanups.push(burst({ origin: { x: 0.7, y: 0.75 }, baseDeg: 225, spread: 40, count: 80, vel: 30, colors, gravity: 0.18 })), 180)
  const t2 = setTimeout(() => cleanups.push(burst({ origin: { x: 0.5, y: 0.65 }, baseDeg: 270, spread: 60, count: 100, vel: 32, colors, gravity: 0.18 })), 380)
  return () => {
    clearTimeout(t1)
    clearTimeout(t2)
    cleanups.forEach((c) => c())
  }
}

export function sideCannons(): () => void {
  const colors = ['#D16F2E', '#5798E0', '#4FB118']
  const cleanups: Array<() => void> = []
  cleanups.push(burst({ origin: { x: 0.5, y: 0 }, baseDeg: 90, spread: 55, count: 70, vel: 34, colors, gravity: 0.25, scalar: 1.1 }))
  cleanups.push(burst({ origin: { x: 0.5, y: 1 }, baseDeg: 270, spread: 55, count: 70, vel: 34, colors, gravity: -0.02, scalar: 1.1 }))
  return () => cleanups.forEach((c) => c())
}
