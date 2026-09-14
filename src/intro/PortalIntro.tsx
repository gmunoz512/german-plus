import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { drawPortal, idlePortalRadius } from './drawPortal'
import { markIntroComplete } from './storage'

type PortalIntroProps = {
  onComplete: () => void
}

const WARP_MS = 1350
const BREATH_PERIOD = 5.6

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function layoutFromWindow() {
  const width = window.innerWidth
  const height = window.innerHeight
  return {
    cx: width * 0.5,
    cy: height * 0.5,
    r: idlePortalRadius(width, height),
  }
}

export default function PortalIntro({ onComplete }: PortalIntroProps) {
  const reduced = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [warping, setWarping] = useState(false)
  const [layout, setLayout] = useState(layoutFromWindow)

  const pointerTarget = useRef({ x: 0, y: 0 })
  const pointerAmt = useRef({ x: 0, y: 0 })
  const phaseRef = useRef(0)
  const lastT = useRef(0)
  const warpingRef = useRef(false)
  const warpStart = useRef(0)
  const finished = useRef(false)
  const reducedRef = useRef(reduced)

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
    const prevOverflow = document.body.style.overflow
    const prevBg = document.body.style.background
    document.body.style.overflow = 'hidden'
    document.body.style.background = '#fff'
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.background = prevBg
    }
  }, [])

  useEffect(() => {
    const onResize = () => setLayout(layoutFromWindow())
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    const tick = (now: number) => {
      const dt = lastT.current ? Math.min(0.05, (now - lastT.current) / 1000) : 0
      lastT.current = now

      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const nextW = Math.floor(width * dpr)
      const nextH = Math.floor(height * dpr)
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW
        canvas.height = nextH
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
      }

      const reduce = reducedRef.current
      if (!reduce && !warpingRef.current) {
        pointerAmt.current.x += (pointerTarget.current.x - pointerAmt.current.x) * 0.1
        pointerAmt.current.y += (pointerTarget.current.y - pointerAmt.current.y) * 0.1
      } else if (reduce) {
        pointerAmt.current.x = 0
        pointerAmt.current.y = 0
      }

      let warp = 0
      if (warpingRef.current) {
        warp = clamp((now - warpStart.current) / WARP_MS, 0, 1)
        if (warp >= 1) {
          finish()
          return
        }
      }

      if (!reduce) {
        phaseRef.current += dt * (0.042 + warp * 2.15)
      }

      const breath = reduce ? 0 : Math.sin((now / 1000) * (Math.PI * 2) / BREATH_PERIOD)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        drawPortal(ctx, {
          width,
          height,
          dpr,
          phase: phaseRef.current,
          breath,
          pointerX: pointerAmt.current.x,
          pointerY: pointerAmt.current.y,
          warp,
          reduced: reduce,
        })
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [finish])

  const beginWarp = useCallback(() => {
    if (warpingRef.current || finished.current) return
    if (reduced) {
      finish()
      return
    }
    warpingRef.current = true
    warpStart.current = performance.now()
    setWarping(true)
  }, [finish, reduced])

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (warpingRef.current || reduced) return
    if (event.pointerType === 'touch') return
    const ox = layout.cx
    const oy = layout.cy
    pointerTarget.current = {
      x: clamp((event.clientX - ox) / (window.innerWidth * 0.34), -1, 1),
      y: clamp((event.clientY - oy) / (window.innerHeight * 0.34), -1, 1),
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 select-none lowercase overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-copy"
      data-intro-phase={warping ? 'warp' : 'idle'}
      onPointerMove={onPointerMove}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      />

      <button
        type="button"
        onClick={beginWarp}
        disabled={warping}
        aria-label="enter german+"
        className="absolute cursor-pointer rounded-full bg-transparent p-0 outline-none disabled:cursor-default"
        style={{
          left: layout.cx - layout.r,
          top: layout.cy - layout.r,
          width: layout.r * 2,
          height: layout.r * 2,
        }}
      />

      <button
        id="intro-copy"
        type="button"
        onClick={beginWarp}
        disabled={warping}
        className={`absolute left-1/2 -translate-x-1/2 cursor-pointer bg-transparent font-serif text-xl italic tracking-tight text-zinc-400 outline-none sm:text-2xl ${
          warping ? 'pointer-events-none opacity-0' : ''
        } transition-opacity duration-200`}
        style={{ top: layout.cy + layout.r + 22 }}
      >
        enter
      </button>

      {!warping && (
        <button
          type="button"
          onClick={finish}
          className="absolute bottom-6 right-6 z-20 text-xs tracking-wide text-zinc-400 transition-colors hover:text-zinc-700"
        >
          skip
        </button>
      )}
    </div>
  )
}
