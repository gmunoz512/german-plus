import { useCallback, useEffect, useRef, useState } from 'react'
import { markIntroComplete, readFrozenWarp } from './storage'

type PortalIntroProps = {
  onComplete: () => void
}

const HOLD_MS = 280
const FADE_MS = 1100
const INTRO_MS = HOLD_MS + FADE_MS

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function easeOutCubic(t: number) {
  const x = clamp(t, 0, 1)
  return 1 - (1 - x) ** 3
}

function opacityFromElapsed(elapsed: number) {
  if (elapsed <= HOLD_MS) return 1
  return 1 - easeOutCubic((elapsed - HOLD_MS) / FADE_MS)
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export default function PortalIntro({ onComplete }: PortalIntroProps) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [frozenWarp] = useState(readFrozenWarp)
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    markIntroComplete()
    onComplete()
  }, [onComplete])

  useEffect(() => {
    if (reduced && frozenWarp == null) finish()
  }, [reduced, frozenWarp, finish])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && frozenWarp == null) finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish, frozenWarp])

  useEffect(() => {
    let raf = 0
    let origin = 0
    const failsafe =
      frozenWarp == null
        ? window.setTimeout(() => finish(), INTRO_MS + 200)
        : 0

    const tick = (now: number) => {
      if (finished.current) return
      if (!origin) origin = now

      const opacity =
        frozenWarp != null
          ? 1 - frozenWarp
          : opacityFromElapsed(now - origin)

      const root = rootRef.current
      if (root) {
        root.style.opacity = String(clamp(opacity, 0, 1))
        root.dataset.introWarp = (1 - clamp(opacity, 0, 1)).toFixed(2)
        root.dataset.introPhase = opacity >= 0.999 ? 'hold' : 'fade'
        root.dataset.introSkip = opacity < 0.28 ? '1' : '0'
      }

      if (frozenWarp == null && opacity <= 0.01) {
        finish()
        return
      }

      raf = requestAnimationFrame(tick)
    }

    tick(performance.now())
    return () => {
      cancelAnimationFrame(raf)
      if (failsafe) window.clearTimeout(failsafe)
    }
  }, [finish, frozenWarp])

  return (
    <div
      ref={rootRef}
      className="group fixed inset-0 z-50 select-none overscroll-none bg-ink"
      role="dialog"
      aria-modal="true"
      aria-label="entering german+"
      data-intro-phase="hold"
      data-intro-warp="0.00"
      data-intro-skip="0"
      style={{ opacity: 1 }}
    >
      {frozenWarp == null && (
        <button
          type="button"
          onClick={finish}
          className="absolute bottom-6 right-6 z-20 text-xs tracking-wide text-white/30 transition-opacity duration-200 hover:text-white/70 group-data-[intro-skip=1]:pointer-events-none group-data-[intro-skip=1]:opacity-0"
        >
          skip
        </button>
      )}
    </div>
  )
}
