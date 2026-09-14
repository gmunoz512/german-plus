import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import Rabbit from './Rabbit'
import { markIntroComplete } from './storage'

type RabbitIntroProps = {
  onComplete: () => void
}

const WARP_MS = 1450

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - (-2 * t + 2) ** 4 / 2
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
  const [warping, setWarping] = useState(false)
  const [now, setNow] = useState(() => performance.now())
  const [look, setLook] = useState({ x: 0.28, y: 0.12 })
  const [hole, setHole] = useState({ x: 0, y: 0, r: 7, t: 0 })

  const lookTarget = useRef({ x: 0.28, y: 0.12 })
  const lookAmt = useRef({ x: 0.28, y: 0.12 })
  const warpingRef = useRef(false)
  const warpStart = useRef(0)
  const finished = useRef(false)
  const rabbitRef = useRef<HTMLButtonElement>(null)
  const dotRef = useRef<HTMLButtonElement>(null)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    markIntroComplete()
    onComplete()
  }, [onComplete])

  const holeAnchor = useCallback(() => {
    const el = dotRef.current
    if (!el) {
      return { x: window.innerWidth / 2, y: window.innerHeight * 0.62 }
    }
    const box = el.getBoundingClientRect()
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
  }, [])

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
    let raf = 0
    const tick = (t: number) => {
      if (!reduced && !warpingRef.current) {
        lookAmt.current.x += (lookTarget.current.x - lookAmt.current.x) * 0.1
        lookAmt.current.y += (lookTarget.current.y - lookAmt.current.y) * 0.1
      }

      let warpT = 0
      let r = 7
      const anchor = holeAnchor()
      if (warpingRef.current) {
        const elapsed = t - warpStart.current
        warpT = clamp(elapsed / WARP_MS, 0, 1)
        const maxR = Math.hypot(window.innerWidth, window.innerHeight) * 1.05
        r = 7 + easeInOutQuart(warpT) * maxR
        if (elapsed >= WARP_MS) {
          finish()
          return
        }
      }

      setNow(t)
      setLook({ x: lookAmt.current.x, y: lookAmt.current.y })
      setHole({ x: anchor.x, y: anchor.y, r, t: warpT })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [finish, holeAnchor, reduced])

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
    const el = rabbitRef.current
    const origin = el
      ? el.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
    const cx = origin.left + origin.width * 0.52
    const cy = origin.top + origin.height * 0.38
    lookTarget.current = {
      x: clamp((event.clientX - cx) / (window.innerWidth * 0.36), -1, 1),
      y: clamp((event.clientY - cy) / (window.innerHeight * 0.36), -1, 1),
    }
  }

  const mask =
    warping && hole.r > 1
      ? `radial-gradient(circle at ${hole.x}px ${hole.y}px, transparent ${hole.r}px, #000 ${hole.r + 3}px)`
      : undefined

  return (
    <div
      className="fixed inset-0 z-50 select-none lowercase"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-copy"
    >
      {warping && <Tunnel x={hole.x} y={hole.y} r={hole.r} t={hole.t} />}

      <div
        className="absolute inset-0 bg-white"
        style={
          mask
            ? { maskImage: mask, WebkitMaskImage: mask, maskSize: '100% 100%' }
            : undefined
        }
        onPointerMove={onPointerMove}
      >
        <div className="flex h-full flex-col items-center justify-center px-6">
          <button
            ref={rabbitRef}
            type="button"
            onClick={beginWarp}
            disabled={warping}
            aria-label="click the rabbit to enter german+"
            className="cursor-pointer bg-transparent p-0 outline-none disabled:cursor-default focus-visible:[&_svg]:drop-shadow-[0_0_16px_rgba(0,0,0,0.18)]"
          >
            <Rabbit
              lookX={look.x}
              lookY={look.y}
              now={now}
              warpT={hole.t}
            />
          </button>

          <button
            ref={dotRef}
            type="button"
            onClick={beginWarp}
            disabled={warping}
            aria-label="enter german+"
            className="-mt-10 flex size-11 cursor-pointer items-center justify-center rounded-full bg-transparent outline-none disabled:cursor-default"
          >
            <span
              className={`block size-3 rounded-full bg-black ${warping || reduced ? '' : 'intro-dot-pulse'}`}
            />
          </button>

          <p
            id="intro-copy"
            className={`mt-8 font-serif text-xl italic tracking-tight text-zinc-400 sm:text-2xl ${warping ? 'opacity-0' : ''} transition-opacity duration-200`}
          >
            click the rabbit
          </p>
        </div>
      </div>

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

function Tunnel({
  x,
  y,
  r,
  t,
}: {
  x: number
  y: number
  r: number
  t: number
}) {
  const veil = t < 0.38 ? 1 : Math.max(0, 1 - (t - 0.38) / 0.5)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg className="absolute inset-0 h-full w-full">
        <circle cx={x} cy={y} r={Math.max(0, r)} fill="#0a0a0b" opacity={veil} />
        {Array.from({ length: 7 }, (_, i) => {
          const ring = Math.max(0, r * (0.22 + i * 0.12) * (0.55 + t * 0.7))
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={ring}
              fill="none"
              stroke={i % 2 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(10,10,11,0.55)'}
              strokeWidth={i === 0 ? 2.4 : 1.2}
              opacity={Math.max(0, 0.9 - t * 0.95)}
            />
          )
        })}
      </svg>
    </div>
  )
}
