import { useEffect, useRef, type RefObject } from 'react'
import { traceFrame, type MarkId } from './frameGeometry'
import { markIntroComplete, readFrozenTime } from './storage'
import {
  END_MS,
  P,
  clamp,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  easeTrace,
  lerp,
  progress,
  smoothstep,
} from './timeline'

type PortalIntroProps = {
  /** the page root: holds [data-reveal] blocks, the [data-intro-plus] glyph and the frame */
  pageRef: RefObject<HTMLDivElement | null>
  /** the page can take clicks / scroll from here on (content is rising in) */
  onInteractive: () => void
  onComplete: (skipped: boolean) => void
}

const ACCENT = [255, 184, 103]
const MARK = [138, 104, 72]
const HERO_LINE = [50, 38, 30]
const LINE_HOT = [176, 128, 84]
const LINE = [90, 67, 52]
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
  const skipRef = useRef<HTMLButtonElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const flareHRef = useRef<HTMLDivElement>(null)
  const flareVRef = useRef<HTMLDivElement>(null)
  const glintRef = useRef<HTMLDivElement>(null)
  const threadRef = useRef<SVGLineElement>(null)
  const threadGlowRef = useRef<SVGLineElement>(null)
  const traceRefs = useRef<Record<string, SVGPathElement | null>>({})
  const cbs = useRef({ onInteractive, onComplete })

  useEffect(() => {
    cbs.current = { onInteractive, onComplete }
  }, [onInteractive, onComplete])

  useEffect(() => {
    const page = pageRef.current
    const root = rootRef.current
    if (!page || !root) return

    const frozenT = readFrozenTime()
    const debugFrozen = frozenT != null

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

    let origin = 0
    let raf = 0
    let done = false
    let interactive = false
    let lastD = ''

    const prevOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const unlockScroll = () => {
      document.body.style.overflow = prevOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
    window.scrollTo(0, 0)

    const finish = (skipped: boolean) => {
      if (done) return
      done = true
      cancelAnimationFrame(raf)
      markIntroComplete()
      cbs.current.onComplete(skipped)
    }

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
      const u = frozenT ?? now - origin
      const w = window.innerWidth
      const h = window.innerHeight
      const mobile = w < 768

      // ── reads first (one layout per frame) ──
      const plus = plusEl ? measurePlus(plusEl) : { x: w / 2, y: h * 0.3, arm: 8 }
      const fr = frameBox?.getBoundingClientRect()
      const radius = frameBox ? parseFloat(getComputedStyle(frameBox).borderTopLeftRadius) || 12 : 12

      root.style.background = u >= P.settle[0] ? 'transparent' : ''
      if (skipRef.current) skipRef.current.style.opacity = u > P.trace[0] ? '0' : ''

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
      if (plusEl) {
        plusEl.style.opacity = String(easeOutCubic(progress(u, P.plusIn)))
      }

      const shine = Math.sin(Math.PI * progress(u, P.shine))
      const glint = glintRef.current!
      glint.style.opacity = String(shine * 0.85)
      glint.style.transform = `translate3d(${plus.x - 40}px, ${plus.y - 40}px, 0) scale(${lerp(0.6, 1.15, progress(u, P.shine)).toFixed(4)}) rotate(${(progress(u, P.shine) * 45).toFixed(2)}deg)`
      if (plusEl) {
        plusEl.style.textShadow = shine > 0.01 ? `0 0 ${(14 * shine).toFixed(1)}px rgba(255,184,103,${(0.75 * shine).toFixed(3)})` : ''
      }

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
        cbs.current.onInteractive()
      }
      root.dataset.introT = String(Math.round(u))
      root.dataset.introPhase = u < P.trace[0] ? 'plus' : u < P.reveal ? 'frame' : 'reveal'

      if (!debugFrozen && u >= END_MS) {
        finish(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      if (failsafe) window.clearTimeout(failsafe)
      window.removeEventListener('pointerdown', skip, { capture: true })
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchmove', skip)
      unlockScroll()
      for (const el of touched) {
        for (const prop of ['opacity', 'transform', 'color', 'background', 'border-bottom-color', 'text-shadow']) {
          el.style.removeProperty(prop)
        }
      }
    }
  }, [pageRef])

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
      data-intro-phase="plus"
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <line ref={threadGlowRef} stroke="#ffb867" strokeWidth="4" strokeLinecap="round" opacity="0.18" style={{ opacity: 0 }} />
        <line ref={threadRef} stroke="#f4f2ec" strokeWidth="1.25" strokeLinecap="round" style={{ opacity: 0 }} />
        {(['L', 'R'] as const).map((side) => [
          tracePath('base', side, { stroke: 'var(--frame-line)', strokeWidth: 1 }),
          tracePath('trail', side, { stroke: '#ffb867', strokeWidth: 1, strokeOpacity: 0.16 }),
          tracePath('wake', side, { stroke: '#ffb867', strokeWidth: 1, strokeOpacity: 0.3 }),
          tracePath('glow', side, { stroke: '#ffb867', strokeWidth: 4, strokeOpacity: 0.16, strokeLinecap: 'round' }),
          tracePath('head', side, { stroke: '#f4f2ec', strokeWidth: 1.25, strokeLinecap: 'round' }),
        ])}
      </svg>

      <div
        ref={flareHRef}
        className="pointer-events-none absolute left-0 top-0 h-px w-[200px]"
        style={{ opacity: 0, background: 'linear-gradient(90deg, transparent, rgba(244,242,236,0.95) 50%, transparent)' }}
        aria-hidden
      />
      <div
        ref={flareVRef}
        className="pointer-events-none absolute left-0 top-0 h-[200px] w-px"
        style={{ opacity: 0, background: 'linear-gradient(180deg, transparent, rgba(244,242,236,0.95) 50%, transparent)' }}
        aria-hidden
      />
      <div
        ref={dotRef}
        className="pointer-events-none absolute left-0 top-0 size-[120px] rounded-full"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle, #fffaf2 0, #f6e3c9 4%, rgba(255,184,103,0.6) 9%, rgba(255,184,103,0.16) 26%, rgba(255,184,103,0.05) 45%, transparent 68%)',
        }}
        aria-hidden
      />

      <div
        ref={glintRef}
        className="pointer-events-none absolute left-0 top-0 size-[80px]"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle, rgba(255,240,220,0.9) 0, rgba(255,184,103,0.35) 12%, transparent 45%), linear-gradient(90deg, transparent 20%, rgba(255,214,170,0.7) 50%, transparent 80%) center / 100% 1px no-repeat, linear-gradient(180deg, transparent 20%, rgba(255,214,170,0.7) 50%, transparent 80%) center / 1px 100% no-repeat',
        }}
        aria-hidden
      />

      <button
        ref={skipRef}
        type="button"
        className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] z-20 text-xs tracking-wide text-paper/35 transition-opacity duration-200 hover:text-paper/75"
      >
        skip
      </button>
    </div>
  )
}
