import { useEffect, useRef, type PointerEvent, type RefObject } from 'react'
import { attachFallRenderer, type FlyThroughRenderer } from './flyThrough'
import { traceFrame, type MarkId } from './frameGeometry'
import { markIntroComplete, readFrozenTime, readFrozenWarp } from './storage'
import {
  COLLAPSE_AT,
  END_MS,
  END_U,
  P,
  easeInOutCubic,
  easeIris,
  easeOutBack,
  easeOutCubic,
  easeTrace,
  lerp,
  progress,
} from './timeline'
import { FLY_MS, HOLD_MS, clamp, smoothstep } from './tunnel'

type PortalIntroProps = {
  /** the page root: holds [data-reveal] blocks, the [data-intro-plus] glyph and the frame */
  pageRef: RefObject<HTMLDivElement | null>
  /** the page can take clicks / scroll from here on (content is rising in) */
  onInteractive: () => void
  onComplete: (skipped: boolean) => void
}

const ACCENT = [212, 165, 116]
const MARK = [74, 74, 80]
const HERO_LINE = [31, 31, 35]
const LINE_HOT = [92, 88, 84]
const LINE = [42, 42, 46]
const mix = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`

type PlusGeom = { x: number; y: number; arm: number }

let measureCtx: CanvasRenderingContext2D | null = null

/** optical centre + arm length of the rendered + glyph (not its line box) */
function measurePlus(el: HTMLElement): PlusGeom {
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  const size = parseFloat(cs.fontSize) || 48
  measureCtx ??= document.createElement('canvas').getContext('2d')
  const m = measureCtx
    ? ((measureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`),
      measureCtx.measureText('+'))
    : null
  if (!m || !m.actualBoundingBoxRight) {
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.55, arm: size * 0.22 }
  }
  const ascent = m.fontBoundingBoxAscent || r.height * 0.8
  const baseline = r.top + ascent
  const x = r.left + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2
  const y = baseline - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
  const arm = (m.actualBoundingBoxRight + m.actualBoundingBoxLeft) / 2
  return { x, y, arm }
}

/** when (u, ms) the trace tip reaches distance d along a stroke of length half */
function reachTime(d: number, half: number) {
  const target = clamp(d / half, 0, 1)
  let lo = 0
  let hi = 1
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2
    if (easeTrace(mid) < target) lo = mid
    else hi = mid
  }
  return P.trace[0] + lo * (P.trace[1] - P.trace[0])
}

export default function PortalIntro({ pageRef, onInteractive, onComplete }: PortalIntroProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const collapseRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const flareHRef = useRef<HTMLDivElement>(null)
  const flareVRef = useRef<HTMLDivElement>(null)
  const irisRef = useRef<SVGCircleElement>(null)
  const threadRef = useRef<SVGLineElement>(null)
  const threadGlowRef = useRef<SVGLineElement>(null)
  const traceRefs = useRef<Record<string, SVGPathElement | null>>({})
  const pointerTarget = useRef({ x: 0, y: 0 })
  const cbs = useRef({ onInteractive, onComplete })

  useEffect(() => {
    cbs.current = { onInteractive, onComplete }
  }, [onInteractive, onComplete])

  useEffect(() => {
    const page = pageRef.current
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!page || !root || !canvas) return

    const frozenWarp = readFrozenWarp()
    const frozenT = readFrozenTime()
    const debugFrozen = frozenWarp != null || frozenT != null

    const blocks = Array.from(page.querySelectorAll<HTMLElement>('[data-reveal]'))
    const plusEl = page.querySelector<HTMLElement>('[data-intro-plus]')
    const hero = page.querySelector<HTMLElement>('[data-hero]')
    const frameBox = page.querySelector<HTMLElement>('[data-frame-box]')
    const frameMask = page.querySelector<HTMLElement>('[data-frame-mask]')
    const marks = Array.from(page.querySelectorAll<HTMLElement | SVGElement>('[data-frame-mark]'))
    const touched: (HTMLElement | SVGElement)[] = [...blocks, ...marks]
    if (plusEl) touched.push(plusEl)
    if (hero) touched.push(hero)
    if (frameMask) touched.push(frameMask)

    let renderer: FlyThroughRenderer | null = attachFallRenderer(canvas)
    // no webgl / 2d at all: start at the iris, the rest still plays
    let offset = renderer ? 0 : COLLAPSE_AT + P.collapse[1] * 0.45
    let origin = 0
    let raf = 0
    let done = false
    let interactive = false
    let lastD = ''
    const px = { x: 0, y: 0 }

    const prevOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const unlockScroll = () => {
      document.body.style.overflow = prevOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
    window.scrollTo(0, 0)

    const dropRenderer = () => {
      renderer?.destroy()
      renderer = null
    }

    const finish = (skipped: boolean) => {
      if (done) return
      done = true
      cancelAnimationFrame(raf)
      markIntroComplete()
      cbs.current.onComplete(skipped)
    }

    const onLost = (event: Event) => {
      event.preventDefault()
      dropRenderer()
      // jump past the wormhole, keep the rest of the sequence
      offset += Math.max(0, COLLAPSE_AT + P.collapse[1] * 0.6 - (performance.now() - origin + offset))
    }
    canvas.addEventListener('webglcontextlost', onLost)

    const skip = () => {
      if (!debugFrozen) finish(true)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Shift') return
      skip()
    }
    window.addEventListener('pointerdown', skip, { capture: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchmove', skip, { passive: true })

    const failsafe = debugFrozen ? 0 : window.setTimeout(() => finish(false), END_MS + 1500)

    const setD = (d: { left: string; right: string }) => {
      const key = d.left + d.right
      if (key === lastD) return
      lastD = key
      for (const [k, el] of Object.entries(traceRefs.current)) {
        el?.setAttribute('d', k.endsWith('L') ? d.left : d.right)
      }
    }

    const tick = (now: number) => {
      if (done) return
      if (!origin) origin = now
      const t = frozenT ?? now - origin + offset
      const u = t - COLLAPSE_AT
      const w = window.innerWidth
      const h = window.innerHeight
      const mobile = w < 768

      // ── reads first (one layout per frame) ──
      const plus = plusEl ? measurePlus(plusEl) : { x: w / 2, y: h * 0.3, arm: 8 }
      const fr = frameBox?.getBoundingClientRect()
      const radius = frameBox ? parseFloat(getComputedStyle(frameBox).borderTopLeftRadius) || 12 : 12

      // ── wormhole ──
      const collapseK = progress(u, P.collapse)
      const collapseEl = collapseRef.current!
      if (u < P.collapse[1] && renderer) {
        const warp = frozenWarp ?? clamp((t - HOLD_MS) / FLY_MS, 0, 1)
        if (frozenWarp == null) {
          px.x += (pointerTarget.current.x * (1 - collapseK) - px.x) * 0.08
          px.y += (pointerTarget.current.y * (1 - collapseK) - px.y) * 0.08
        }
        renderer.render({
          width: w,
          height: h,
          dpr: Math.min(mobile ? 1.5 : 2, window.devicePixelRatio || 1),
          warp,
          pointerX: px.x,
          pointerY: px.y,
        })
      }
      const irisOn = frozenWarp == null && u >= 0
      if (!irisOn) {
        collapseEl.style.clipPath = ''
        collapseEl.style.transform = ''
        collapseEl.style.visibility = ''
      } else if (collapseK < 1) {
        const e = easeIris(collapseK)
        const far = Math.hypot(Math.max(plus.x, w - plus.x), Math.max(plus.y, h - plus.y)) + 2
        const rs = lerp(far, 0, e)
        const s = lerp(1, 0.5, e)
        collapseEl.style.visibility = ''
        collapseEl.style.transformOrigin = `${plus.x}px ${plus.y}px`
        collapseEl.style.transform = `scale(${s})`
        collapseEl.style.clipPath = `circle(${(rs / s).toFixed(2)}px at ${plus.x}px ${plus.y}px)`
        collapseEl.style.opacity = String(1 - smoothstep(0.82, 1, collapseK))
        const iris = irisRef.current!
        iris.setAttribute('cx', String(plus.x))
        iris.setAttribute('cy', String(plus.y))
        iris.setAttribute('r', String(Math.max(0, rs)))
        iris.style.opacity = String(0.5 * smoothstep(0, 0.25, collapseK) * (1 - smoothstep(0.75, 1, collapseK)))
      } else {
        collapseEl.style.visibility = 'hidden'
        irisRef.current!.style.opacity = '0'
      }
      root.style.background = irisOn && collapseK >= 1 ? 'transparent' : ''
      if (skipRef.current) skipRef.current.style.opacity = u > -300 ? '0' : ''

      // ── point of light → the tan + ──
      const dotA = easeOutCubic(progress(u, P.dotIn))
      const settle = easeInOutCubic(progress(u, P.settle))
      const dot = dotRef.current!
      dot.style.opacity = String(dotA * (1 - settle))
      dot.style.transform = `translate3d(${plus.x - 60}px, ${plus.y - 60}px, 0) scale(${(lerp(0.25, 1, dotA) * lerp(1, 0.3, settle)).toFixed(4)})`

      const flareMax = mobile ? 46 : 84
      const flareLen = lerp(easeOutCubic(progress(u, P.flareIn)) * flareMax, plus.arm, settle)
      const flareA = progress(u, P.flareIn) * (1 - progress(u, [P.settle[0] + 120, P.settle[1]]))
      const fh = flareHRef.current!
      const fv = flareVRef.current!
      fh.style.opacity = fv.style.opacity = String(flareA * 0.9)
      fh.style.transform = `translate3d(${plus.x - 100}px, ${plus.y - 0.5}px, 0) scaleX(${(flareLen / 100).toFixed(4)})`
      fv.style.transform = `translate3d(${plus.x - 0.5}px, ${plus.y - 100}px, 0) scaleY(${(flareLen / 100).toFixed(4)})`
      if (plusEl) plusEl.style.opacity = frozenWarp != null ? '0' : String(easeOutCubic(progress(u, P.plusIn)))

      // ── frame ──
      if (fr) {
        const tr = traceFrame(
          { left: fr.left, top: fr.top, right: fr.right, bottom: fr.bottom, radius },
          plus.x,
        )
        setD(tr)

        // thread: a bead of light runs from the + up to the top edge
        const from = plus.y - plus.arm - 2
        const yTop = lerp(from, tr.start.y, easeOutCubic(progress(u, P.threadUp)))
        const yBot = lerp(from, tr.start.y, easeInOutCubic(progress(u, P.threadOut)))
        const threadOn = u >= P.threadUp[0] && yBot - yTop > 0.5
        for (const line of [threadRef.current!, threadGlowRef.current!]) {
          line.setAttribute('x1', String(tr.start.x))
          line.setAttribute('x2', String(tr.start.x))
          line.setAttribute('y1', String(yBot))
          line.setAttribute('y2', String(yTop))
          line.style.opacity = threadOn ? '' : '0'
        }

        const tk = progress(u, P.trace)
        const s = easeTrace(tk) * tr.half
        const headA = smoothstep(0, 0.04, tk) * (1 - smoothstep(0.86, 1, tk))
        const seg = (len: number) => {
          const l = Math.min(len, s)
          return { a: `${l} ${tr.half + l + 4}`, o: String(l - s) }
        }
        const layers: [string, number, number][] = [
          ['base', 0, 1],
          ['trail', 240, headA],
          ['wake', 90, headA],
          ['glow', 26, headA],
          ['head', 26, headA],
        ]
        for (const [name, len, alpha] of layers) {
          const d = len ? seg(len) : { a: `${tr.half} ${tr.half + 4}`, o: String(tr.half - s) }
          for (const side of ['L', 'R']) {
            const el = traceRefs.current[name + side]
            if (!el) continue
            el.style.strokeDasharray = d.a
            el.style.strokeDashoffset = d.o
            el.style.opacity = u < P.trace[0] ? '0' : String(alpha)
            if (name === 'base') el.style.stroke = mix(LINE_HOT, LINE, progress(u, P.lineCool))
          }
        }

        for (const el of marks) {
          const id = el.dataset.frameMark as MarkId
          const m = u - reachTime(tr.reach[id], tr.half)
          const pop = progress(m, [0, P.markPop])
          el.style.opacity = String(clamp(m / 110, 0, 1))
          el.style.transform = `scale(${lerp(0.2, 1, easeOutBack(pop)).toFixed(4)})`
          el.style.color = mix(ACCENT, MARK, progress(m, [110, P.markCool]))
          if (el.tagName.toLowerCase() === 'span') el.style.background = el.style.color
        }
        if (frameMask) frameMask.style.opacity = String(easeOutCubic(progress(u, P.maskIn)))
      }

      // ── page rises in ──
      blocks.forEach((el) => {
        const i = Number(el.dataset.reveal) || 0
        const p = easeOutCubic(progress(u - (P.reveal + i * P.revealStagger), [0, P.revealDur]))
        el.style.opacity = String(p)
        el.style.transform = p < 1 ? `translate3d(0, ${((1 - p) * 14).toFixed(2)}px, 0)` : ''
        if (i === 2 && hero) {
          hero.style.borderBottomColor = `rgba(${HERO_LINE.join(',')}, ${p})`
        }
      })

      if (!interactive && u >= P.reveal && !debugFrozen) {
        interactive = true
        root.style.pointerEvents = 'none'
        unlockScroll()
        dropRenderer()
        cbs.current.onInteractive()
      }
      root.dataset.introT = String(Math.round(t))
      root.dataset.introPhase =
        u < 0 ? 'wormhole' : u < P.collapse[1] ? 'collapse' : u < P.trace[0] ? 'plus' : u < P.reveal ? 'frame' : 'reveal'

      if (!debugFrozen && u >= END_U) {
        finish(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      if (failsafe) window.clearTimeout(failsafe)
      canvas.removeEventListener('webglcontextlost', onLost)
      window.removeEventListener('pointerdown', skip, { capture: true })
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchmove', skip)
      unlockScroll()
      dropRenderer()
      for (const el of touched) {
        for (const prop of ['opacity', 'transform', 'color', 'background', 'border-bottom-color']) {
          el.style.removeProperty(prop)
        }
      }
    }
  }, [pageRef])

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    pointerTarget.current = {
      x: clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1),
      y: clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1),
    }
  }

  const tracePath = (name: string, side: 'L' | 'R', props: Record<string, string | number>) => (
    <path
      key={name + side}
      ref={(el) => {
        traceRefs.current[name + side] = el
      }}
      fill="none"
      style={{ opacity: 0 }}
      {...props}
    />
  )

  return (
    <div
      ref={rootRef}
      className="group fixed inset-0 z-50 select-none overscroll-none bg-ink"
      role="dialog"
      aria-modal="true"
      aria-label="entering german+"
      data-intro-phase="wormhole"
      onPointerMove={onPointerMove}
    >
      <div ref={collapseRef} className="absolute inset-0" style={{ willChange: 'transform, clip-path' }}>
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full bg-ink" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{ background: 'radial-gradient(ellipse at 50% 48%, transparent 38%, rgba(10,10,11,0.55) 100%)' }}
        />
      </div>

      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <circle ref={irisRef} fill="none" stroke="#d4a574" strokeWidth="1" style={{ opacity: 0 }} />
        <line ref={threadGlowRef} stroke="#d4a574" strokeWidth="4" strokeLinecap="round" opacity="0.18" style={{ opacity: 0 }} />
        <line ref={threadRef} stroke="#f1dcc0" strokeWidth="1.25" strokeLinecap="round" style={{ opacity: 0 }} />
        {(['L', 'R'] as const).map((side) => [
          tracePath('base', side, { stroke: 'var(--frame-line)', strokeWidth: 1 }),
          tracePath('trail', side, { stroke: '#d4a574', strokeWidth: 1, strokeOpacity: 0.16 }),
          tracePath('wake', side, { stroke: '#d4a574', strokeWidth: 1, strokeOpacity: 0.3 }),
          tracePath('glow', side, { stroke: '#d4a574', strokeWidth: 4, strokeOpacity: 0.16, strokeLinecap: 'round' }),
          tracePath('head', side, { stroke: '#f1dcc0', strokeWidth: 1.25, strokeLinecap: 'round' }),
        ])}
      </svg>

      <div
        ref={flareHRef}
        className="pointer-events-none absolute left-0 top-0 h-px w-[200px]"
        style={{ opacity: 0, background: 'linear-gradient(90deg, transparent, rgba(241,220,192,0.95) 50%, transparent)' }}
        aria-hidden
      />
      <div
        ref={flareVRef}
        className="pointer-events-none absolute left-0 top-0 h-[200px] w-px"
        style={{ opacity: 0, background: 'linear-gradient(180deg, transparent, rgba(241,220,192,0.95) 50%, transparent)' }}
        aria-hidden
      />
      <div
        ref={dotRef}
        className="pointer-events-none absolute left-0 top-0 size-[120px] rounded-full"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle, #fffaf2 0, #f6e3c9 4%, rgba(212,165,116,0.6) 9%, rgba(212,165,116,0.16) 26%, rgba(212,165,116,0.05) 45%, transparent 68%)',
        }}
        aria-hidden
      />

      <button
        ref={skipRef}
        type="button"
        className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] z-20 text-xs tracking-wide text-white/30 transition-opacity duration-200 hover:text-white/70"
      >
        skip
      </button>
    </div>
  )
}
