/*
 * One clock drives the whole sequence (ms since the first frame).
 *
 *   a point of light blooms and becomes the tan + ─ a thread of light runs up
 *   to the frame ─ the frame traces both ways round ─ corner marks pop as the
 *   line reaches them ─ the + catches a glint ─ page rises in ─ END
 */
export const P = {
  dotIn: [240, 905],
  flareIn: [485, 905],
  settle: [905, 1395], // bloom → crisp glyph
  plusIn: [940, 1360],
  threadUp: [1255, 1570],
  threadOut: [1500, 2025],
  trace: [1535, 3460],
  lineCool: [3200, 3800], // freshly drawn line is a touch brighter, then cools to the hairline
  maskIn: [3200, 3800], // black margins settle in only once the line has closed
  shine: [3460, 3980],
  reveal: 3760, // first block starts; page becomes interactive here
  revealStagger: 80,
  revealDur: 700,
  markPop: 320,
  markCool: 600,
} as const

export const REVEAL_BLOCKS = 5
export const END_MS = P.reveal + (REVEAL_BLOCKS - 1) * P.revealStagger + P.revealDur // 4780

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export const progress = (u: number, [a, b]: readonly [number, number]) =>
  clamp((u - a) / (b - a), 0, 1)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
export const easeOutBack = (t: number) => {
  const c1 = 1.9
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}
/** trace: the scale-tour in-out feel, with a little linear so it leaves the thread with speed */
export const easeTrace = (t: number) => 0.3 * t + 0.7 * easeInOutCubic(t)
