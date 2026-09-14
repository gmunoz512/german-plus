import { useCallback, useEffect, useRef, useState } from 'react'
import { markIntroComplete } from './storage'

type RabbitIntroProps = {
  onComplete: () => void
}

const RABBIT_SRC = `${import.meta.env.BASE_URL}intro/rabbit.jpg`

const LOOK_MS = 700
const CROUCH_MS = 550
const DIG_MS = 1300
const ENTER_MS = 1100
const ZOOM_MS = 1550
const BLACK_MS = 400
const TOTAL_MS = LOOK_MS + CROUCH_MS + DIG_MS + ENTER_MS + ZOOM_MS + BLACK_MS

const LOOK_END = LOOK_MS
const CROUCH_END = LOOK_END + CROUCH_MS
const DIG_END = CROUCH_END + DIG_MS
const ENTER_END = DIG_END + ENTER_MS
const ZOOM_END = ENTER_END + ZOOM_MS

const HOLE_TOP = '93%'
const CAM_ORIGIN = '50% 82%'
const RABBIT_ORIGIN = '50% 92%'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function easeInCubic(t: number) {
  return t * t * t
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
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

type Dirt = { id: number; x: number; y: number; vx: number; vy: number; r: number; born: number }

type Frame = {
  rot: number
  tx: number
  ty: number
  scaleX: number
  scaleY: number
  opacity: number
  hole: number
  zoom: number
  veil: number
  playing: boolean
  elapsed: number
  phase: 'idle' | 'look' | 'crouch' | 'dig' | 'enter' | 'zoom' | 'black'
}

const IDLE: Frame = {
  rot: 0,
  tx: 0,
  ty: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
  hole: 0,
  zoom: 0,
  veil: 0,
  playing: false,
  elapsed: 0,
  phase: 'idle',
}

function poseAt(ms: number): Frame {
  const elapsed = clamp(ms, 0, TOTAL_MS)
  let rot = 0
  let ty = 0
  let scaleX = 1
  let scaleY = 1
  let opacity = 1
  let hole = 0
  let zoom = 0
  let veil = 0
  let phase: Frame['phase'] = 'look'

  if (elapsed <= LOOK_END) {
    const t = easeOutCubic(elapsed / LOOK_MS)
    rot = t * 11
    ty = t * 10
    phase = 'look'
  } else if (elapsed <= CROUCH_END) {
    const t = easeInOutCubic((elapsed - LOOK_END) / CROUCH_MS)
    rot = 11 + t * 5
    ty = 10 + t * 18
    scaleX = 1 + t * 0.08
    scaleY = 1 - t * 0.16
    hole = t * 36
    phase = 'crouch'
  } else if (elapsed <= DIG_END) {
    const t = (elapsed - CROUCH_END) / DIG_MS
    const bob = Math.sin(elapsed / 42) * 7
    const jitter = Math.sin(elapsed / 31) * 3.2
    rot = 16 + jitter
    ty = 28 + bob
    scaleX = 1.08
    scaleY = 0.84
    hole = lerp(36, 88, easeOutCubic(t))
    phase = 'dig'
  } else if (elapsed <= ENTER_END) {
    const t = easeInCubic((elapsed - DIG_END) / ENTER_MS)
    rot = 18 + t * 22
    ty = 28 + t * 90
    scaleX = lerp(1.08, 0.22, t)
    scaleY = lerp(0.84, 0.16, t)
    opacity = 1 - t
    hole = lerp(88, 168, t)
    phase = 'enter'
  } else if (elapsed <= ZOOM_END) {
    const t = (elapsed - ENTER_END) / ZOOM_MS
    rot = 40
    ty = 118
    scaleX = 0.22
    scaleY = 0.16
    opacity = 0
    hole = lerp(168, 240, easeOutCubic(clamp(t * 1.4, 0, 1)))
    zoom = easeInCubic(t)
    veil = easeInCubic(clamp((t - 0.12) / 0.65, 0, 1))
    phase = 'zoom'
  } else {
    rot = 40
    ty = 118
    scaleX = 0.22
    scaleY = 0.16
    opacity = 0
    hole = 240
    zoom = 1
    veil = 1
    phase = 'black'
  }

  return {
    rot,
    tx: 0,
    ty,
    scaleX,
    scaleY,
    opacity,
    hole,
    zoom,
    veil,
    playing: true,
    elapsed,
    phase,
  }
}

export default function RabbitIntro({ onComplete }: RabbitIntroProps) {
  const reduced = useReducedMotion()
  const [frame, setFrame] = useState<Frame>(IDLE)
  const [dirt, setDirt] = useState<Dirt[]>([])
  const playing = useRef(false)
  const startAt = useRef(0)
  const finished = useRef(false)
  const rabbitRef = useRef<HTMLButtonElement>(null)

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
    let raf = 0
    const tick = (now: number) => {
      if (!playing.current || startAt.current <= 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const elapsed = now - startAt.current
      const next = poseAt(elapsed)
      setFrame(next)

      if (elapsed >= LOOK_END && elapsed <= ENTER_END) {
        setDirt((prev) => {
          const live = prev
            .map((p) => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + 0.18,
            }))
            .filter((p) => now - p.born < 520)
          if (elapsed < DIG_END && Math.random() < 0.55) {
            const a = -Math.PI * 0.85 + Math.random() * Math.PI * 0.9
            live.push({
              id: now + Math.random(),
              x: (Math.random() - 0.5) * 36,
              y: 0,
              vx: Math.cos(a) * (1.2 + Math.random() * 2.2),
              vy: -2.4 - Math.random() * 3.4,
              r: 2 + Math.random() * 3.4,
              born: now,
            })
          }
          return live.slice(-28)
        })
      } else if (elapsed > ENTER_END) {
        setDirt([])
      }

      if (elapsed >= TOTAL_MS) {
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [finish])

  const begin = useCallback(() => {
    if (playing.current || finished.current) return
    if (reduced) {
      finish()
      return
    }
    playing.current = true
    startAt.current = performance.now()
    setFrame(poseAt(0))
  }, [finish, reduced])

  const holePx = frame.hole
  const cam = 1 + frame.zoom * 7.5
  const maxCover = Math.hypot(window.innerWidth, window.innerHeight)
  const zoomHole = frame.zoom > 0 ? lerp(holePx, maxCover * 1.15, frame.zoom) : holePx

  return (
    <div
      className="fixed inset-0 z-50 select-none lowercase"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-copy"
      data-intro-phase={frame.playing ? frame.phase : 'idle'}
    >
      <div
        className="absolute inset-0 bg-white"
        data-intro-phase={frame.playing ? frame.phase : 'idle'}
        style={{
          transform: frame.zoom > 0 ? `scale(${cam})` : undefined,
          transformOrigin: CAM_ORIGIN,
        }}
      >
        <div className="flex h-full flex-col items-center justify-center px-6">
          <div className="relative flex flex-col items-center">
            {zoomHole > 1 && (
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 z-20 rounded-full bg-black"
                style={{
                  width: zoomHole * 2,
                  height: zoomHole * 2,
                  top: HOLE_TOP,
                  transform: 'translate(-50%, -35%)',
                  boxShadow:
                    frame.zoom > 0
                      ? '0 0 0 2px rgba(255,255,255,0.18) inset'
                      : '0 0 0 1px rgba(0,0,0,0.35)',
                }}
              />
            )}

            <button
              ref={rabbitRef}
              type="button"
              onClick={begin}
              disabled={frame.playing}
              aria-label="click the rabbit to enter german+"
              className="relative z-10 cursor-pointer bg-transparent p-0 outline-none disabled:cursor-default focus-visible:opacity-90"
            >
              <img
                src={RABBIT_SRC}
                alt=""
                draggable={false}
                className="pointer-events-none block h-auto w-[min(86vw,26rem)] select-none sm:w-[min(52vw,28rem)]"
                style={{
                  transformOrigin: RABBIT_ORIGIN,
                  transform: `translate(${frame.tx}px, ${frame.ty}px) rotate(${frame.rot}deg) scale(${frame.scaleX}, ${frame.scaleY})`,
                  opacity: frame.opacity,
                }}
              />
            </button>

            {dirt.length > 0 && (
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-[5%] left-1/2 z-30 h-0 w-0"
              >
                {dirt.map((p) => (
                  <span
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                      left: p.x,
                      top: p.y,
                      width: p.r,
                      height: p.r * 0.75,
                      background: p.r > 3.2 ? '#6b5a4a' : '#8a7a68',
                      opacity: 0.75,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <p
            id="intro-copy"
            className={`mt-2 font-serif text-xl italic tracking-tight text-zinc-400 sm:text-2xl ${frame.playing ? 'opacity-0' : ''} transition-opacity duration-300`}
          >
            click the rabbit
          </p>
        </div>
      </div>

      {frame.veil > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-40 bg-black"
          style={{ opacity: frame.veil }}
        />
      )}

      {!frame.playing && (
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
