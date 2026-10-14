import { useLayoutEffect, useRef } from 'react'

function pxVar(name: string) {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))
  return Number.isFinite(value) ? value : 0
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

/**
 * 0 when the essay's first line meets the top of the reading area,
 * 100 when its last line meets the bottom. An essay that already fits
 * stays at 100 once the ending is on screen, so scrolling past it does
 * not pull the bar back.
 */
function readProgress(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const height = rect.height
  if (height <= 0) return 0
  const viewTop = pxVar('--frame-top')
  const viewBottom = window.innerHeight - pxVar('--frame-bottom')
  const viewH = Math.max(1, viewBottom - viewTop)
  if (height <= viewH) {
    if (rect.top >= viewBottom) return 0
    if (rect.bottom <= viewBottom) return 1
    return clamp01((viewBottom - rect.top) / height)
  }
  return clamp01((viewTop - rect.top) / (height - viewH))
}

export default function EssayProgress() {
  const rootRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const bar = barRef.current
    const label = labelRef.current
    if (!root || !bar || !label) return

    let frame = 0
    let last = -1
    let observer: ResizeObserver

    const measure = () => {
      frame = 0
      const el = document.querySelector<HTMLElement>('[data-essay-body]')
      if (el) observer.observe(el)
      const ratio = el ? readProgress(el) : 0
      bar.style.transform = `scaleX(${ratio})`
      const pct = Math.round(ratio * 100)
      if (pct === last) return
      last = pct
      label.textContent = `${pct}%`
      root.setAttribute('aria-valuenow', String(pct))
      root.setAttribute('aria-valuetext', `${pct} percent`)
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    observer = new ResizeObserver(schedule)

    measure()
    observer.observe(document.documentElement)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      role="progressbar"
      aria-label="essay reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      aria-valuetext="0 percent"
      className="pointer-events-none fixed inset-x-0 z-50"
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="h-[3px] w-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-[#d4a8f0]"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
      <span
        ref={labelRef}
        aria-hidden="true"
        className="fixed top-[max(8px,env(safe-area-inset-top))] right-[max(12px,env(safe-area-inset-right))] text-[11px] leading-none font-medium tabular-nums tracking-wide text-[#d4a8f0]"
      >
        0%
      </span>
    </div>
  )
}
