export const HOLD_MS = 380
export const FLY_MS = 4620
export const INTRO_MS = HOLD_MS + FLY_MS

export const END_Z = 12
export const FOCAL = 1.92
export const OPEN_R = 1
export const TUNNEL_R = 1.08

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function warpEase(t: number): number {
  const x = clamp(t, 0, 1)
  // Cinematic ease-in: long crawl, then a committed rush through the opening.
  return x ** 2.7
}

export function camZFromWarp(warp: number): number {
  return END_Z * warpEase(warp)
}

export function minDim(width: number, height: number): number {
  return Math.min(width, height)
}

export function apertureRadius(
  width: number,
  height: number,
  camZ: number,
  breath: number,
): number {
  const rel = Math.max(0.018, END_Z - camZ)
  return (FOCAL * OPEN_R * minDim(width, height) * (1 + breath * 0.012)) / rel
}

export function coverRadius(width: number, height: number): number {
  return Math.hypot(width, height) * 0.5 + 12
}

export function apertureCoversViewport(
  width: number,
  height: number,
  camZ: number,
  breath: number,
): boolean {
  return apertureRadius(width, height, camZ, breath) >= coverRadius(width, height)
}

export function flySpeed(warp: number): number {
  const x = clamp(warp, 0, 1)
  // Derivative-ish of x^2.7, normalized to ~0–1 for blur/streaks.
  return clamp(2.7 * x ** 1.7, 0, 1.35)
}

export function readFrozenWarp(): number | null {
  const raw = new URLSearchParams(window.location.search).get('introWarp')
  if (raw == null || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return clamp(n, 0, 0.99)
}
