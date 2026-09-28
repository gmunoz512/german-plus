export const HOLD_MS = 180
export const FLY_MS = 4000

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Slow start, then a gentle ease-in so the fall accelerates as it approaches. */
export function warpEase(t: number): number {
  const x = clamp(t, 0, 1)
  return x * 0.42 + x * x * 0.58
}
