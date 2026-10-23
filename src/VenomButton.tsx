/*
 * Footer CTA built on Venom Button by exteestudio (MIT, see src/venom/engine.js for the full notice).
 * The WebGL2 scene only boots once the button scrolls into view, pauses while off-screen, and falls
 * back to a plain pill on touch devices, without WebGL2, or with reduced motion.
 */
import { useEffect, useRef, useState } from 'react'
import './venom/venom.css'

const LABEL = 'let’s build'
const MAILTO = 'mailto:gmunoz512@icloud.com'

// matched to the footer wordmark (font-serif text-xl tracking-tight) and the palette in index.css
// scene runs at 0.8x (pill ~67x22, goo/tendrils/overlay shrink with it); sizes below are pre-scale
const STYLE = {
  scale: 0.8,
  fontFamily: '"Instrument Serif", ui-serif, Georgia, serif',
  fontWeight: 400,
  letterSpacingEm: -0.025,
  labelSize: 22.5, // renders at 18px
  halfHeight: 14,
  padX: 8,
  liftH: 5,
  gooColor: '#ffb867',   // --color-accent
  labelColor: '#070503', // --color-ink
  floorColor: '#070503', // --color-ink (page background)
}

type Engine = { start(): void; stop(): void; destroy(): void }

function wantsFallback() {
  if (typeof window === 'undefined') return true
  const mq = (q: string) => window.matchMedia(q).matches
  if (mq('(prefers-reduced-motion: reduce)') || mq('(hover: none)') || mq('(pointer: coarse)')) return true
  try {
    return !document.createElement('canvas').getContext('webgl2')
  } catch {
    return true
  }
}

export default function VenomButton() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [fallback, setFallback] = useState(wantsFallback)

  useEffect(() => {
    if (fallback) return
    const root = rootRef.current!, canvas = canvasRef.current!, button = buttonRef.current!
    let engine: Engine | null = null
    let visible = false
    let cancelled = false
    let booting = false

    const onActivate = () => { window.location.href = MAILTO }
    button.addEventListener('venom:activate', onActivate)

    const boot = async () => {
      booting = true
      const { mountVenom } = await import('./venom/engine.js')
      if (cancelled) return
      engine = mountVenom(root, { canvas, button, label: LABEL, ...STYLE }) as Engine | null
      if (!engine) { setFallback(true); return }
      if (visible) engine.start()
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !booting) void boot()
      if (engine) { if (visible) engine.start(); else engine.stop() }
    }, { rootMargin: '120px 0px' })
    io.observe(root)

    return () => {
      cancelled = true
      io.disconnect()
      button.removeEventListener('venom:activate', onActivate)
      engine?.destroy()
    }
  }, [fallback])

  if (fallback) {
    return <a href={MAILTO} className="venom-fallback font-serif text-xl tracking-tight normal-case">{LABEL}</a>
  }

  return (
    <span className="venom-slot font-serif text-xl tracking-tight normal-case">
      <span className="venom-sizer" aria-hidden="true">{LABEL}</span>
      <div ref={rootRef} className="venom-root">
        <canvas ref={canvasRef} className="venom-stage" aria-hidden="true" />
        <button ref={buttonRef} type="button" className="venom-hit" aria-label={LABEL}>{LABEL}</button>
      </div>
    </span>
  )
}
