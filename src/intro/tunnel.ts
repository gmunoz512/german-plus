export const HOLD_MS = 220
export const FLY_MS = 4780
export const INTRO_MS = HOLD_MS + FLY_MS

export const END_Z = 10.2
export const GLOBE_Z = 6.35
export const PANEL_Z = 10.35
export const PANEL_W = 4.15
export const PANEL_H = 2.05

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function minDim(width: number, height: number) {
  return Math.min(width, height)
}

export function focalLength(width: number, height: number) {
  return minDim(width, height) * 0.82
}

export function warpEase(t: number): number {
  const x = clamp(t, 0, 1)
  return x ** 1.42
}

export function camZFromWarp(warp: number): number {
  return END_Z * warpEase(warp)
}

export function panelScale(width: number, height: number, warp: number, camZ: number) {
  const f = focalLength(width, height)
  const depth = Math.max(0.045, PANEL_Z - camZ)
  const approach = f / depth
  const door = smoothstep(0.74, 1, warp) ** 1.55
  return approach * (0.05 + 0.95 * door)
}

export function panelScreenSize(
  width: number,
  height: number,
  warp: number,
  camZ: number,
) {
  const s = panelScale(width, height, warp, camZ)
  return { w: PANEL_W * s, h: PANEL_H * s }
}

export function panelCoversViewport(
  width: number,
  height: number,
  warp: number,
  camZ: number,
) {
  if (warp < 0.9) return false
  const p = panelScreenSize(width, height, warp, camZ)
  return p.w >= width * 1.03 && p.h >= height * 1.03
}

export function readFrozenWarp(): number | null {
  const raw = new URLSearchParams(window.location.search).get('introWarp')
  if (raw == null || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return clamp(n, 0, 0.99)
}
