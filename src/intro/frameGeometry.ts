/**
 * The frame is traced as two strokes that leave one point on the top edge
 * (straight above the +) and run round opposite ways, meeting at the 180°-opposite
 * point on the bottom edge. Both strokes are exactly half the perimeter.
 */
export type FrameRect = { left: number; top: number; right: number; bottom: number; radius: number }

export type MarkId = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'r' | 'b' | 'l'

export type FrameTrace = {
  left: string
  right: string
  half: number
  /** distance along its stroke at which the tip reaches each mark */
  reach: Record<MarkId, number>
  start: { x: number; y: number }
}

export function traceFrame(rect: FrameRect, startX: number): FrameTrace {
  // centre-line of a 1px css border
  const x0 = rect.left + 0.5
  const y0 = rect.top + 0.5
  const x1 = rect.right - 0.5
  const y1 = rect.bottom - 0.5
  const r = Math.max(0, Math.min(rect.radius - 0.5, (x1 - x0) / 2, (y1 - y0) / 2))
  const q = (Math.PI * r) / 2
  const sx = Math.max(x0 + r + 1, Math.min(x1 - r - 1, startX))
  const mx = x0 + x1 - sx
  const xm = (x0 + x1) / 2
  const ym = (y0 + y1) / 2
  const side = y1 - y0 - 2 * r
  const topL = sx - x0 - r // start → top-left arc
  const topR = x1 - r - sx // start → top-right arc

  const right = `M${sx} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${mx}`
  const left = `M${sx} ${y0}H${x0 + r}A${r} ${r} 0 0 0 ${x0} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 0 ${x0 + r} ${y1}H${mx}`

  const reach: Record<MarkId, number> = {
    tl: topL + q / 2,
    tr: topR + q / 2,
    bl: topL + q + side + q / 2,
    br: topR + q + side + q / 2,
    l: topL + q + (ym - y0 - r),
    r: topR + q + (ym - y0 - r),
    t: Math.abs(xm - sx),
    b: xm <= mx ? topL + 2 * q + side + (xm - x0 - r) : topR + 2 * q + side + (x1 - r - xm),
  }

  return { left, right, half: topL + topR + 2 * q + side, reach, start: { x: sx, y: y0 } }
}
