const STORAGE_KEY = 'german-plus-intro-complete'

// Session-scoped so a refresh in the same tab does not replay the cinematic.
// A new tab/window still sees the intro. This matches the previous german+ pattern.

export function hasCompletedIntro(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markIntroComplete(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // private mode / quota — intro may replay this session
  }
}

export function shouldPlayIntro(): boolean {
  const params = new URLSearchParams(window.location.search)
  if (params.get('introForce') === '1' || params.get('introWarp') != null) {
    return true
  }
  if (hasCompletedIntro()) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    markIntroComplete()
    return false
  }
  return true
}

export function readFrozenWarp(): number | null {
  const raw = new URLSearchParams(window.location.search).get('introWarp')
  if (raw == null || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(0.99, n))
}
