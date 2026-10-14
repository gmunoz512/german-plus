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

type Streak = { edge: number; reverse: boolean; start: number; dur: number }

const STREAK_TAIL = 110

function edgeEnds(r: DOMRect, edge: number) {
  const tl = { x: r.left, y: r.top }
  const tr = { x: r.right, y: r.top }
  const br = { x: r.right, y: r.bottom }
  const bl = { x: r.left, y: r.bottom }
  return [
    [tl, tr],
    [tr, br],
    [br, bl],
    [bl, tl],
  ][edge]
}

const easeOut = (t: number) => 1 - (1 - t) ** 3

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
      const count = Math.max(18, Math.round((w * h) / 37000))
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
    let streak: Streak | null = null
    let nextStreak = performance.now() + 1500
    let lastEdge = -1
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

      if (frame && !reduced) {
        if (!streak && now >= nextStreak) {
          let edge = Math.floor(Math.random() * 4)
          if (edge === lastEdge) edge = (edge + 1 + Math.floor(Math.random() * 3)) % 4
          lastEdge = edge
          streak = { edge, reverse: Math.random() < 0.5, start: now, dur: 800 + Math.random() * 400 }
        }
        if (streak) {
          const t = (now - streak.start) / streak.dur
          if (t >= 1) {
            streak = null
            nextStreak = now + 6000 + Math.random() * 4000
          } else {
            const [from, to] = edgeEnds(frame.getBoundingClientRect(), streak.edge)
            const [a0, b0] = streak.reverse ? [to, from] : [from, to]
            const len = Math.hypot(b0.x - a0.x, b0.y - a0.y)
            const k = easeOut(t)
            const ux = (b0.x - a0.x) / len
            const uy = (b0.y - a0.y) / len
            const hx = a0.x + ux * len * k
            const hy = a0.y + uy * len * k
            const tail = Math.min(STREAK_TAIL * (1 - k * 0.6), len * k)
            const tx = hx - ux * tail
            const ty = hy - uy * tail
            const alpha = (1 - Math.max(0, (t - 0.7) / 0.3)) * Math.min(1, t / 0.08)

            const g = ctx.createLinearGradient(hx, hy, tx, ty)
            g.addColorStop(0, `rgba(255,214,160,${0.85 * alpha})`)
            g.addColorStop(1, 'rgba(255,184,103,0)')
            ctx.strokeStyle = g
            ctx.lineWidth = 1.6
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(hx, hy)
            ctx.lineTo(tx, ty)
            ctx.stroke()

            const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 8)
            glow.addColorStop(0, `rgba(255,248,236,${alpha})`)
            glow.addColorStop(0.3, `rgba(255,214,160,${0.7 * alpha})`)
            glow.addColorStop(1, 'rgba(255,184,103,0)')
            ctx.fillStyle = glow
            ctx.fillRect(hx - 8, hy - 8, 16, 16)
          }
        }
        canvas.dataset.streak = streak ? '1' : ''
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
