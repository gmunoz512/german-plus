import { useEffect, useRef, useState } from 'react'

const DESKTOP = '(min-width: 768px)'
const REDUCED = '(prefers-reduced-motion: reduce)'

type Mote = { x: number; y: number; vx: number; vy: number; r: number; a: number; phase: number; plus: boolean; warm: boolean }

function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

function pointOnRect(r: DOMRect, d: number) {
  const w = r.width
  const h = r.height
  const p = (((d % 1) + 1) % 1) * 2 * (w + h)
  if (p < w) return { x: r.left + p, y: r.top }
  if (p < w + h) return { x: r.right, y: r.top + p - w }
  if (p < 2 * w + h) return { x: r.right - (p - w - h), y: r.bottom }
  return { x: r.left, y: r.bottom - (p - 2 * w - h) }
}

/** bias x into the empty side margins inside the frame */
function marginX(w: number) {
  const gutter = Math.max(48, w * 0.14)
  if (Math.random() < 0.62) {
    return Math.random() < 0.5 ? Math.random() * gutter : w - Math.random() * gutter
  }
  return Math.random() * w
}

function Field() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const frame = document.querySelector<HTMLElement>('[data-frame-box]')
    const reduced = window.matchMedia(REDUCED).matches

    let w = 0
    let h = 0
    let motes: Mote[] = []
    const seed = () => {
      const count = Math.max(24, Math.round((w * h) / 28000))
      motes = Array.from({ length: count }, (_, i) => ({
        x: marginX(w),
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.1,
        vy: -0.04 - Math.random() * 0.07,
        r: 1.4 + Math.random() * 2.2,
        a: 0.38 + Math.random() * 0.32,
        phase: Math.random() * Math.PI * 2,
        plus: i % 5 === 0,
        warm: Math.random() < 0.6,
      }))
    }
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
      if (reduced) raf = requestAnimationFrame(draw)
    }

    let raf = 0
    let last = 0
    let fade = 0
    const draw = (now: number) => {
      const dt = last ? Math.min(now - last, 50) : 16
      last = now
      fade = reduced ? 1 : Math.min(1, fade + dt / 900)
      ctx.clearRect(0, 0, w, h)

      for (const m of motes) {
        if (!reduced) {
          m.x += m.vx * dt * 0.06
          m.y += m.vy * dt * 0.06
          if (m.y < -12) {
            m.y = h + 12
            m.x = marginX(w)
          }
          if (m.x < -12) m.x = w + 12
          if (m.x > w + 12) m.x = -12
        }
        const twinkle = 0.7 + 0.3 * Math.sin(now / 2200 + m.phase)
        const a = m.a * twinkle * fade
        const c = m.warm ? '255,184,103' : '244,242,236'
        if (m.plus) {
          const s = m.r * 2.4
          ctx.strokeStyle = `rgba(${c},${a})`
          ctx.lineWidth = 1.15
          ctx.beginPath()
          ctx.moveTo(m.x - s, m.y)
          ctx.lineTo(m.x + s, m.y)
          ctx.moveTo(m.x, m.y - s)
          ctx.lineTo(m.x, m.y + s)
          ctx.stroke()
        } else {
          ctx.fillStyle = `rgba(${c},${a})`
          ctx.beginPath()
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (frame) {
        const rect = frame.getBoundingClientRect()
        const d = reduced ? 0.12 : now / 48000
        for (const offset of [0, 0.5]) {
          const p = pointOnRect(rect, d + offset)
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 13)
          g.addColorStop(0, `rgba(255,246,232,${0.95 * fade})`)
          g.addColorStop(0.18, `rgba(255,214,160,${0.8 * fade})`)
          g.addColorStop(0.45, `rgba(255,184,103,${0.3 * fade})`)
          g.addColorStop(1, 'rgba(255,184,103,0)')
          ctx.fillStyle = g
          ctx.fillRect(p.x - 13, p.y - 13, 26, 26)
        }
      }

      if (!reduced) raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)

    const start = () => {
      cancelAnimationFrame(raf)
      last = 0
      raf = requestAnimationFrame(draw)
    }
    const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start())
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
    />
  )
}

export default function Ambient() {
  const desktop = useMedia(DESKTOP)
  return desktop ? <Field /> : null
}
