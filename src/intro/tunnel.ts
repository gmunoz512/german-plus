export const HOLD_MS = 180
export const FLY_MS = 4000
export const INTRO_MS = HOLD_MS + FLY_MS
export const FADE_START = 0.68

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function easeOutCubic(t: number) {
  const x = clamp(t, 0, 1)
  return 1 - (1 - x) ** 3
}

/** Slow start, then a gentle ease-in so the fall accelerates as it approaches. */
export function warpEase(t: number): number {
  const x = clamp(t, 0, 1)
  return x * 0.42 + x * x * 0.58
}

export function overlayOpacity(warp: number): number {
  if (warp <= FADE_START) return 1
  return 1 - easeOutCubic((warp - FADE_START) / (1 - FADE_START))
}
