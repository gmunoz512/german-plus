import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { attachFallRenderer } from './flyThrough'
import { markIntroComplete, readFrozenWarp } from './storage'
import {
  FADE_START,
  FLY_MS,
  HOLD_MS,
  INTRO_MS,
  clamp,
  overlayOpacity,
} from './tunnel'

type PortalIntroProps = {
  onComplete: () => void
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const [frozenWarp] = useState(readFrozenWarp)
  const finished = useRef(false)
  const reducedRef = useRef(reduced)
  const pointerTarget = useRef({ x: 0, y: 0 })
  const pointerAmt = useRef({ x: 0, y: 0 })
  const originT = useRef(0)

  useEffect(() => {
    reducedRef.current = reduced
  }, [reduced])

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
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = attachFallRenderer(canvas)
    if (!renderer) {
      finish()
      return
    }

    let raf = 0
    originT.current = 0
    const failsafe =
      frozenWarp == null
        ? window.setTimeout(() => finish(), INTRO_MS + 200)
        : 0

    const onLost = (event: Event) => {
      event.preventDefault()
      finish()
    }
    canvas.addEventListener('webglcontextlost', onLost)

    const tick = (now: number) => {
      if (finished.current) return
      if (!originT.current) originT.current = now

      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = Math.min(width < 720 ? 1.5 : 2, window.devicePixelRatio || 1)
      const reduce = reducedRef.current

      let warp = 0
      if (frozenWarp != null) {
        warp = frozenWarp
      } else if (!reduce) {
        const elapsed = now - originT.current
        warp = clamp((elapsed - HOLD_MS) / FLY_MS, 0, 1)
      }

      if (!reduce && frozenWarp == null) {
        pointerAmt.current.x +=
          (pointerTarget.current.x - pointerAmt.current.x) * 0.08
        pointerAmt.current.y +=
          (pointerTarget.current.y - pointerAmt.current.y) * 0.08
      } else {
        pointerAmt.current.x = 0
        pointerAmt.current.y = 0
      }

      renderer.render({
        width,
        height,
        dpr,
        warp,
        pointerX: pointerAmt.current.x,
        pointerY: pointerAmt.current.y,
      })

      const opacity = overlayOpacity(warp)
      const root = rootRef.current
      if (root) {
        root.style.opacity = String(opacity)
        root.dataset.introWarp = warp.toFixed(2)
        root.dataset.introPhase =
          warp <= 0.001 ? 'hold' : warp < FADE_START ? 'fall' : 'fade'
        root.dataset.introRenderer = renderer.kind
        root.dataset.introSkip = opacity < 0.28 ? '1' : '0'
      }

      const field = fieldRef.current
      if (field) {
        const scale = 1 + warpEaseScale(warp)
        field.style.transform = `scale(${scale.toFixed(4)})`
        field.style.opacity = String(0.9 - warp * 0.28)
      }

      if (frozenWarp == null && !reduce && opacity <= 0.01) {
        finish()
        return
      }

      raf = requestAnimationFrame(tick)
    }

    tick(performance.now())
    return () => {
      cancelAnimationFrame(raf)
      if (failsafe) window.clearTimeout(failsafe)
      canvas.removeEventListener('webglcontextlost', onLost)
      renderer.destroy()
    }
  }, [finish, frozenWarp])

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || frozenWarp != null) return
    if (event.pointerType === 'touch') return
    pointerTarget.current = {
      x: clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1),
      y: clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1),
    }
  }

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
      data-intro-renderer="webgl"
      onPointerMove={onPointerMove}
      style={{ opacity: 1 }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full bg-ink"
        aria-hidden
      />
      <div
        ref={fieldRef}
        className="pointer-events-none absolute inset-0 origin-center"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse at 50% 42%, rgba(36,36,40,0.5) 0%, rgba(10,10,11,0) 54%)',
          transform: 'scale(1)',
          opacity: 0.9,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse at 50% 48%, transparent 26%, rgba(10,10,11,0.42) 68%, rgba(10,10,11,0.9) 100%)',
        }}
      />
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

function warpEaseScale(warp: number) {
  return warp * 0.55 + warp * warp * 1.15
}
