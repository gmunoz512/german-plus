import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import Rabbit, { type RabbitPhase } from './Rabbit'
import { markIntroComplete } from './storage'

type RabbitIntroProps = {
  onComplete: () => void
}

const DIG_MS = 720
const SINK_MS = 480
const WARP_MS = 1050

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function standFromY(clientY: number) {
  const h = window.innerHeight
  const y = (clientY - h * 0.12) / (h * 0.76)
  return 1 - clamp(y, 0, 1)
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

export default function RabbitIntro({ onComplete }: RabbitIntroProps) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<RabbitPhase>('idle')
  const [stand, setStand] = useState(0)
  const [now, setNow] = useState(() => performance.now())
  const [phaseElapsed, setPhaseElapsed] = useState(0)
  const [hole, setHole] = useState({ x: 0, y: 0, r: 0, warp: 0 })

  const targetStand = useRef(0)
  const standAmt = useRef(0)
  const phaseRef = useRef<RabbitPhase>('idle')
  const phaseStart = useRef(0)
  const finished = useRef(false)
  const dragging = useRef(false)
  const suppressClick = useRef(false)
  const pointerStart = useRef({ x: 0, y: 0 })
  const rabbitRef = useRef<HTMLButtonElement>(null)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    markIntroComplete()
    onComplete()
  }, [onComplete])

  const holeAnchor = useCallback(() => {
    const el = rabbitRef.current
    if (!el) {
      return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.55 }
    }
    const box = el.getBoundingClientRect()
    return { x: box.left + box.width * 0.52, y: box.top + box.height * 0.86 }
  }, [])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    rabbitRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    let raf = 0
    const tick = (t: number) => {
      const currentPhase = phaseRef.current
      const smoothing = reduced ? 1 : 0.11
      standAmt.current += (targetStand.current - standAmt.current) * smoothing

      let elapsed = t - phaseStart.current
      if (currentPhase === 'idle') elapsed = 0

      if (currentPhase === 'dig' && elapsed >= DIG_MS) {
        phaseStart.current = t
        elapsed = 0
        phaseRef.current = 'sink'
        setPhase('sink')
      } else if (currentPhase === 'sink' && elapsed >= SINK_MS) {
        phaseStart.current = t
        elapsed = 0
        phaseRef.current = 'warp'
        setPhase('warp')
      } else if (currentPhase === 'warp' && elapsed >= WARP_MS) {
        finish()
        return
      }

      const anchor = holeAnchor()
      let r = 0
      let warp = 0
      if (phaseRef.current === 'dig') {
        r = (elapsed / DIG_MS) * 36
      } else if (phaseRef.current === 'sink') {
        r = 36 + (elapsed / SINK_MS) * 22
      } else if (phaseRef.current === 'warp') {
        warp = clamp(elapsed / WARP_MS, 0, 1)
        r = 58 + easeInOutCubic(warp) * Math.max(window.innerWidth, window.innerHeight) * 1.35
      }

      setNow(t)
      setStand(standAmt.current)
      setPhaseElapsed(elapsed)
      setHole({ x: anchor.x, y: anchor.y, r, warp })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [finish, holeAnchor, reduced])

  const beginDig = useCallback(() => {
    if (phaseRef.current !== 'idle' || finished.current) return
    if (reduced) {
      finish()
      return
    }
    phaseStart.current = performance.now()
    phaseRef.current = 'dig'
    setPhase('dig')
  }, [finish, reduced])

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'idle' || reduced) return
    const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen'
    if (isTouch && !dragging.current) return
    if (isTouch) {
      const dx = event.clientX - pointerStart.current.x
      const dy = event.clientY - pointerStart.current.y
      if (Math.hypot(dx, dy) > 8) suppressClick.current = true
    }
    targetStand.current = standFromY(event.clientY)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'idle') return
    dragging.current = true
    suppressClick.current = false
    pointerStart.current = { x: event.clientX, y: event.clientY }
    if (event.pointerType !== 'mouse') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const onRabbitClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (suppressClick.current) {
      event.preventDefault()
      suppressClick.current = false
      return
    }
    beginDig()
  }

  const warping = phase === 'warp'
  const mask =
    hole.r > 1
      ? `radial-gradient(circle at ${hole.x}px ${hole.y}px, transparent ${Math.max(0, hole.r - 70)}px, #000 ${hole.r}px)`
      : undefined

  return (
    <div
      className="fixed inset-0 z-50 touch-none select-none lowercase"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-copy"
    >
      {warping && (
        <TunnelRings x={hole.x} y={hole.y} t={hole.warp} />
      )}

      <div
        className="absolute inset-0 bg-ink"
        style={
          mask
            ? { maskImage: mask, WebkitMaskImage: mask, maskSize: '100% 100%' }
            : undefined
        }
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,165,116,0.08),_transparent_55%)]"
        />

        <p className="pointer-events-none absolute left-6 top-6 font-serif text-xl tracking-tight text-paper normal-case">
          gm
        </p>

        <div className="flex h-full items-center justify-center px-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:gap-16">
            <button
              ref={rabbitRef}
              type="button"
              onClick={onRabbitClick}
              disabled={phase !== 'idle'}
              aria-label="click the rabbit to enter german+"
              className="cursor-pointer rounded-[2rem] bg-transparent p-0 disabled:cursor-default"
            >
              <Rabbit
                stand={stand}
                phase={phase}
                now={now}
                phaseElapsed={phaseElapsed}
              />
            </button>

            <div
              id="intro-copy"
              className={`text-center md:text-left ${phase === 'idle' ? '' : 'opacity-0'} transition-opacity duration-300`}
            >
              <p className="font-serif text-3xl italic tracking-tight text-paper sm:text-4xl">
                click the rabbit
              </p>
              <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-fog">
                {reduced
                  ? 'enter german+'
                  : 'up to stand · down to lounge'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {phase === 'idle' && (
        <button
          type="button"
          onClick={finish}
          className="absolute bottom-6 right-6 z-20 text-xs tracking-wide text-fog transition-colors hover:text-paper"
        >
          skip
        </button>
      )}
    </div>
  )
}

function TunnelRings({ x, y, t }: { x: number; y: number; t: number }) {
  const scale = 0.35 + t * 14
  const spin = t * 70
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
      style={{ perspective: '900px' }}
    >
      <div
        className="absolute"
        style={{
          left: x,
          top: y,
          width: 120,
          height: 80,
          transform: `translate(-50%, -50%) rotateX(62deg) rotate(${spin}deg) scale(${scale})`,
          transformStyle: 'preserve-3d',
          opacity: 1 - t * 0.55,
        }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full border"
            style={{
              width: 28 + i * 26,
              height: 28 + i * 26,
              marginLeft: -(14 + i * 13),
              marginTop: -(14 + i * 13),
              borderColor:
                i % 2 === 0 ? 'rgba(212,165,116,0.45)' : 'rgba(244,241,234,0.16)',
              boxShadow: i === 2 ? '0 0 24px rgba(212,165,116,0.2)' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  )
}
