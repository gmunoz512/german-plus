function params() {
  return new URLSearchParams(window.location.search)
}

export function shouldPlayIntro(): boolean {
  const q = params()
  if (q.get('introForce') === '1' || q.get('introT') != null) {
    return true
  }
  // deep links (#products etc.) go straight to the section
  if (window.location.hash.length > 1) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return true
}

/** debug: freeze the whole sequence at t ms */
export function readFrozenTime(): number | null {
  const raw = params().get('introT')
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(0, n) : null
}
