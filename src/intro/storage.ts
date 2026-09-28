const STORAGE_KEY = 'german-plus-intro-complete'

// Returning visitors skip the intro: remembered across visits (localStorage),
// with sessionStorage as a fallback where localStorage is blocked.
// ?introForce=1 always replays it.

function read(store: () => Storage): boolean {
  try {
    return store().getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function write(store: () => Storage) {
  try {
    store().setItem(STORAGE_KEY, '1')
  } catch {
    // private mode / quota
  }
}

export function hasCompletedIntro(): boolean {
  return read(() => localStorage) || read(() => sessionStorage)
}

export function markIntroComplete(): void {
  write(() => localStorage)
  write(() => sessionStorage)
}

function params() {
  return new URLSearchParams(window.location.search)
}

export function shouldPlayIntro(): boolean {
  const q = params()
  if (q.get('introForce') === '1' || q.get('introWarp') != null || q.get('introT') != null) {
    return true
  }
  if (hasCompletedIntro()) return false
  // deep links (#products etc.) go straight to the section
  if (window.location.hash.length > 1) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    markIntroComplete()
    return false
  }
  return true
}

/** debug: freeze the wormhole at a warp value (0..0.99) */
export function readFrozenWarp(): number | null {
  const raw = params().get('introWarp')
  if (raw == null || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(0.99, n))
}

/** debug: freeze the whole sequence at t ms */
export function readFrozenTime(): number | null {
  const raw = params().get('introT')
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(0, n) : null
}
