import { useEffect, useRef, useState } from 'react'
import { attachOrbital } from './attachOrbital'

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
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

function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none), (pointer: coarse)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    const onChange = () => setCoarse(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return coarse
}

type OrbitalHeroProps = {
  className?: string
  /** Extra class for the canvas wrapper sizing */
  canvasClassName?: string
}

/**
 * Interactive orbital GLB hero.
 * Desktop: pointer parallax + idle spin.
 * Mobile / coarse pointer: idle spin + scroll parallax (parent should be sticky).
 */
export default function OrbitalHero({ className = '', canvasClassName = '' }: OrbitalHeroProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const coarse = useIsCoarsePointer()
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  const pointer = useRef({ x: 0, y: 0 })
  const scrollAmt = useRef(0)
  const visible = useRef(true)
  const reducedRef = useRef(reduced)
  const coarseRef = useRef(coarse)

  useEffect(() => {
    reducedRef.current = reduced
  }, [reduced])

  useEffect(() => {
    coarseRef.current = coarse
  }, [coarse])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry?.isIntersecting ?? true
      },
      { root: null, threshold: 0.05, rootMargin: '40px' },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const el = rootRef.current
      if (!el) return
      // How far the hero has scrolled through the viewport (0 at top, grows as it leaves)
      const rect = el.getBoundingClientRect()
      const viewH = window.innerHeight || 1
      // Normalize: 0 when fully in upper half, up to ~1 as it moves up
      const progress = Math.max(0, Math.min(1.4, (viewH * 0.35 - rect.top) / viewH))
      scrollAmt.current = coarseRef.current ? progress : progress * 0.35
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!canvas || !root) return

    const api = attachOrbital(canvas)
    if (!api) {
      setFailed(true)
      return
    }

    let raf = 0
    let alive = true
    const start = performance.now()

    api.ready
      .then(() => {
        if (alive) setReady(true)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })

    const onPointer = (e: PointerEvent) => {
      if (coarseRef.current) return
      const rect = root.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
      pointer.current.x = Math.max(-1, Math.min(1, nx))
      pointer.current.y = Math.max(-1, Math.min(1, ny))
    }

    const onLeave = () => {
      pointer.current.x = 0
      pointer.current.y = 0
    }

    // Listen on window so moving near the hero still tilts (editorial feel)
    window.addEventListener('pointermove', onPointer, { passive: true })
    root.addEventListener('pointerleave', onLeave)

    const tick = () => {
      if (!alive) return
      const rect = root.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width))
      const h = Math.max(1, Math.floor(rect.height))
      const dprCap = coarseRef.current ? 1.5 : 2
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap)

      api.render({
        width: w,
        height: h,
        dpr,
        pointerX: reducedRef.current ? 0 : pointer.current.x,
        pointerY: reducedRef.current ? 0 : pointer.current.y,
        scrollY: scrollAmt.current,
        reducedMotion: reducedRef.current,
        lowPower: coarseRef.current || w < 480,
        visible: visible.current,
        timeMs: performance.now() - start,
      })

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      root.removeEventListener('pointerleave', onLeave)
      api.destroy()
    }
  }, [])

  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`

  return (
    <div
      ref={rootRef}
      className={`relative isolate overflow-hidden ${className}`}
      aria-hidden
    >
      {(failed || !ready) && (
        <img
          src={`${base}orbital-preview.png`}
          alt=""
          className={`absolute inset-0 m-auto max-h-full max-w-full object-contain opacity-90 transition-opacity duration-500 ${
            ready && !failed ? 'opacity-0 pointer-events-none' : ''
          }`}
          decoding="async"
        />
      )}
      <canvas
        ref={canvasRef}
        className={`block h-full w-full touch-none ${canvasClassName}`}
        style={{
          opacity: ready && !failed ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
    </div>
  )
}
