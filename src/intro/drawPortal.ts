export type PortalDrawState = {
  width: number
  height: number
  dpr: number
  phase: number
  breath: number
  pointerX: number
  pointerY: number
  warp: number
  reduced: boolean
}

const TAU = Math.PI * 2

const NEON = [
  { r: 0, g: 246, b: 255 },
  { r: 57, g: 255, b: 74 },
  { r: 255, g: 230, b: 16 },
  { r: 255, g: 36, b: 214 },
] as const

const LAYER_COUNT = 26

export function easeInCubic(t: number): number {
  return t * t * t
}

export function idlePortalRadius(width: number, height: number): number {
  const m = Math.min(width, height)
  return m * (height < 700 ? 0.32 : 0.355)
}

export function coverRadius(width: number, height: number): number {
  return Math.hypot(width, height) * 0.74
}

export function warpClipRadius(
  width: number,
  height: number,
  warp: number,
): number {
  const idle = idlePortalRadius(width, height)
  const cover = coverRadius(width, height)
  return idle + (cover - idle) * easeInCubic(warp)
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2))
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

export function drawPortal(
  ctx: CanvasRenderingContext2D,
  state: PortalDrawState,
): void {
  const { width: w, height: h, dpr, phase, breath, warp, reduced } = state
  const cx = w * 0.5
  const cy = h * 0.5
  const ease = easeInCubic(warp)
  const clipR = Math.max(1, warpClipRadius(w, h, warp))
  const cover = coverRadius(w, h)

  const pointerX = reduced ? 0 : state.pointerX
  const pointerY = reduced ? 0 : state.pointerY

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, clipR, 0, TAU)
  ctx.clip()

  ctx.fillStyle = '#000000'
  ctx.fillRect(cx - clipR - 2, cy - clipR - 2, clipR * 2 + 4, clipR * 2 + 4)

  const pulse = reduced ? 1 : 1 + breath * 0.028
  const boom = 1 + ease * 3.1
  const vStretch = 1 + ease * 2.15

  const layers: { z: number; index: number }[] = []
  for (let i = 0; i < LAYER_COUNT; i++) {
    const z = (i / LAYER_COUNT + phase) % 1
    layers.push({ z, index: i })
  }
  layers.sort((a, b) => b.z - a.z)

  for (const { z, index } of layers) {
    const persp = 0.118 / (0.118 + (1 - z) * 1.18)
    const size = clipR * 2.08 * persp * pulse * boom
    const hw = size * 0.5
    const hh = size * 0.5 * vStretch
    if (hw < 0.6 || hh < 0.6) continue

    const inner = 1 - z
    const px = cx + pointerX * 9 * inner
    const py = cy + pointerY * 7 * inner
    const corner = Math.min(hw, hh) * (0.26 + inner * 0.52)
    const left = px - hw
    const top = py - hh

    ctx.save()
    roundedRectPath(ctx, left, top, hw * 2, hh * 2, corner)
    ctx.clip()
    ctx.fillStyle = '#000000'
    ctx.fill()

    const lineCount = 11 + Math.floor(inner * 32)
    const stagger = ((index * 13) % 7) / 7
    const y0 = py - hh * (1 + ease * 3.4)
    const y1 = py + hh * (1 + ease * 3.4)
    const lw = 0.42 + z * 0.55
    const alpha = 0.28 + z * 0.62

    for (let c = 0; c < NEON.length; c++) {
      const col = NEON[c]
      ctx.beginPath()
      for (let j = c; j < lineCount; j += NEON.length) {
        const x = left + ((j + 0.5 + stagger * 0.35) / lineCount) * hw * 2
        ctx.moveTo(x, y0)
        ctx.lineTo(x, y1)
      }
      if (z > 0.42 && warp < 0.85) {
        ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${alpha * 0.14})`
        ctx.lineWidth = lw + 1.35
        ctx.stroke()
        ctx.beginPath()
        for (let j = c; j < lineCount; j += NEON.length) {
          const x = left + ((j + 0.5 + stagger * 0.35) / lineCount) * hw * 2
          ctx.moveTo(x, y0)
          ctx.lineTo(x, y1)
        }
      }
      ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${alpha})`
      ctx.lineWidth = lw
      ctx.stroke()
    }

    ctx.strokeStyle = `rgba(255,255,255,${0.035 + z * 0.07})`
    ctx.lineWidth = 0.8 + z * 1.1
    roundedRectPath(ctx, left, top, hw * 2, hh * 2, corner)
    ctx.stroke()
    ctx.restore()
  }

  if (warp > 0.12) {
    const rush = (warp - 0.12) / 0.88
    const streakCount = 28
    ctx.save()
    for (let i = 0; i < streakCount; i++) {
      const col = NEON[i % NEON.length]
      const x = cx + ((i + 0.5) / streakCount - 0.5) * clipR * 2.05
      ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${0.08 + rush * 0.38})`
      ctx.lineWidth = 0.55 + rush * 1.1
      ctx.beginPath()
      ctx.moveTo(x, cy - clipR * (1.1 + rush * 2.4))
      ctx.lineTo(x, cy + clipR * (1.1 + rush * 2.4))
      ctx.stroke()
    }
    ctx.restore()
  }

  if (warp > 0) {
    const holeT = Math.max(0, (warp - 0.06) / 0.94)
    const holeR = 6 + easeInCubic(holeT) * cover * 1.12
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(cx + pointerX * 3, cy + pointerY * 3, holeR, 0, TAU)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  ctx.restore()

  if (warp < 0.98) {
    ctx.beginPath()
    ctx.arc(cx, cy, clipR, 0, TAU)
    ctx.strokeStyle = `rgba(0,0,0,${0.72 * (1 - ease)})`
    ctx.lineWidth = 1.15
    ctx.stroke()
  }
}
