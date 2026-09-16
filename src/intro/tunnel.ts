export const HOLD_MS = 220
export const FLY_MS = 4780
export const INTRO_MS = HOLD_MS + FLY_MS

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Cruise through rings/globe, then ease-in accelerate into the opening. */
export function warpEase(t: number): number {
  const x = clamp(t, 0, 1)
  if (x < 0.7) return (x / 0.7) * 0.58
  const u = (x - 0.7) / 0.3
  return 0.58 + 0.42 * u * u
}

export function readFrozenWarp(): number | null {
  const raw = new URLSearchParams(window.location.search).get('introWarp')
  if (raw == null || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return clamp(n, 0, 0.99)
}
