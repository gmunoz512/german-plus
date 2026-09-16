import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { attachTunnelRenderer } from './drawTunnel'
import { markIntroComplete } from './storage'
import {
  FLY_MS,
  HOLD_MS,
  INTRO_MS,
  camZFromWarp,
  clamp,
  panelCoversViewport,
  readFrozenWarp,
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
  const [frozenWarp] = useState(readFrozenWarp)
  const finished = useRef(false)
  const reducedRef = useRef(reduced)
  const pointerTarget = useRef({ x: 0, y: 0 })
  const pointerAmt = useRef({ x: 0, y: 0 })
  const phaseRef = useRef(0)
  const lastT = useRef(0)
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

    const renderer = attachTunnelRenderer(canvas)
    let raf = 0
    originT.current = 0
    lastT.current = 0
    const failsafe =
      frozenWarp == null
        ? window.setTimeout(() => finish(), INTRO_MS + 200)
        : 0

    const tick = (now: number) => {
      if (finished.current) return
      if (!originT.current) originT.current = now
      const dt = lastT.current ? Math.min(0.05, (now - lastT.current) / 1000) : 0
      lastT.current = now

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
        const rush = 0.035 + warp * 0.55
        phaseRef.current += dt * rush
      } else {
        pointerAmt.current.x = 0
        pointerAmt.current.y = 0
      }

      const pointerFade = 1 - warp
      const breath = reduce
        ? 0
        : Math.sin((now / 1000) * ((Math.PI * 2) / 5.4))

      renderer.render({
        width,
        height,
        dpr,
        warp,
        phase: phaseRef.current,
        breath,
        pointerX: pointerAmt.current.x * pointerFade,
        pointerY: pointerAmt.current.y * pointerFade,
      })

      const root = rootRef.current
      if (root) {
        root.style.backgroundColor = 'transparent'
        root.dataset.introWarp = warp.toFixed(2)
        root.dataset.introPhase = warp > 0 ? 'warp' : 'idle'
        root.dataset.introRenderer = renderer.kind
        root.dataset.introSkip = warp > 0.72 ? '1' : '0'
      }

      if (frozenWarp == null && !reduce) {
        const camZ = camZFromWarp(warp)
        if (warp >= 1 || panelCoversViewport(width, height, warp, camZ)) {
          finish()
          return
        }
      }

      raf = requestAnimationFrame(tick)
    }

    tick(performance.now())
    return () => {
      cancelAnimationFrame(raf)
      if (failsafe) window.clearTimeout(failsafe)
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
      className="group fixed inset-0 z-50 select-none overscroll-none bg-[#1a1a1a]"
      role="dialog"
      aria-modal="true"
      aria-label="entering german+"
      data-intro-phase="idle"
      data-intro-warp="0.00"
      data-intro-skip="0"
      onPointerMove={onPointerMove}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
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
