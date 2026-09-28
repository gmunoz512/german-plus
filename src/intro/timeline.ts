import { FLY_MS, HOLD_MS, clamp } from './tunnel'

/*
 * One clock drives the whole sequence (ms since the first frame).
 *
 *   0 ─ wormhole ─ COLLAPSE_AT ─ iris closes to a point ─ point becomes the tan +
 *     ─ a thread of light runs up to the frame ─ the frame traces both ways round
 *     ─ corner marks pop as the line reaches them ─ page rises in ─ END
 *
 * Everything after COLLAPSE_AT is relative (u = t - COLLAPSE_AT).
 */
export const COLLAPSE_WARP = 0.58
export const COLLAPSE_AT = HOLD_MS + COLLAPSE_WARP * FLY_MS // 2500

export const P = {
  collapse: [0, 620],
  dotIn: [240, 620],
  flareIn: [380, 620],
  settle: [620, 900], // bloom → crisp glyph
  plusIn: [640, 880],
  threadUp: [820, 1000],
  threadOut: [960, 1260],
  trace: [980, 2080],
  maskIn: [2000, 2600], // black margins settle in only once the line has closed
  lineCool: [1930, 2530], // freshly drawn line is a touch brighter, then cools to the hairline
  reveal: 1650, // first block starts; page becomes interactive here
  revealStagger: 80,
  revealDur: 700,
  markPop: 320,
  markCool: 600,
} as const

export const REVEAL_BLOCKS = 5
export const END_U = P.reveal + (REVEAL_BLOCKS - 1) * P.revealStagger + P.revealDur // 2670
export const END_MS = COLLAPSE_AT + END_U // ~5170

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
/** iris: already moving when it starts, then accelerates into the point */
export const easeIris = (t: number) => 0.22 * t + 0.78 * t * t * t
/** trace: the scale-tour in-out feel, with a little linear so it leaves the thread with speed */
export const easeTrace = (t: number) => 0.3 * t + 0.7 * easeInOutCubic(t)
