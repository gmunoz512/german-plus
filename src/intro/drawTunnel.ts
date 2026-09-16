import {
  GLOBE_Z,
  camZFromWarp,
  focalLength,
  panelScreenSize,
  smoothstep,
} from './tunnel'

export type TunnelDrawState = {
  width: number
  height: number
  dpr: number
  warp: number
  phase: number
  breath: number
  pointerX: number
  pointerY: number
}

type Renderer = {
  kind: 'webgl' | 'canvas2d'
  render: (state: TunnelDrawState) => void
  destroy: () => void
}

type Vec3 = { x: number; y: number; z: number }

const TAU = Math.PI * 2
const BG = '#1a1a1a'
const LINE = { r: 214, g: 214, b: 214 }
const RING_COUNT = 18
const RING_SPACING = 0.62
const RING_RADIUS = 2.55
const GLOBE_R = 1

function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a})`
}

function rotX(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c }
}

function rotY(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c }
}

function rotZ(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z }
}

function project(
  p: Vec3,
  camZ: number,
  cx: number,
  cy: number,
  focal: number,
) {
  const z = p.z - camZ
  if (z < 0.06) return null
  const s = focal / z
  return { x: cx + p.x * s, y: cy + p.y * s, z }
}

function strokeWorldCircle(
  ctx: CanvasRenderingContext2D,
  center: Vec3,
  radius: number,
  orient: (p: Vec3) => Vec3,
  camZ: number,
  cx: number,
  cy: number,
  focal: number,
  segments: number,
) {
  let drawing = false
  ctx.beginPath()
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * TAU
    const local = orient({ x: Math.cos(a) * radius, y: 0, z: Math.sin(a) * radius })
    const p = { x: local.x + center.x, y: local.y + center.y, z: local.z + center.z }
    const pr = project(p, camZ, cx, cy, focal)
    if (!pr) {
      drawing = false
      continue
    }
    if (!drawing) {
      ctx.moveTo(pr.x, pr.y)
      drawing = true
    } else {
      ctx.lineTo(pr.x, pr.y)
    }
  }
  ctx.stroke()
}

function drawTunnelRings(
  ctx: CanvasRenderingContext2D,
  camZ: number,
  cx: number,
  cy: number,
  focal: number,
  warp: number,
  phase: number,
) {
  const appear = smoothstep(0.02, 0.14, warp)
  const fadeOut = 1 - smoothstep(0.48, 0.58, warp)
  if (appear <= 0 || fadeOut <= 0) return

  for (let i = RING_COUNT - 1; i >= 0; i--) {
    const z = 1.15 + i * RING_SPACING
    const depth = z - camZ
    if (depth < 0.08 || depth > 11) continue
    const r = (RING_RADIUS * focal) / depth
    const fade = smoothstep(0.08, 0.7, depth) * smoothstep(10.5, 2.2, depth)
    const alpha = (0.1 + fade * 0.22) * appear * fadeOut
    if (alpha < 0.01 || r < 2) continue
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, TAU)
    ctx.strokeStyle = rgba(LINE.r, LINE.g, LINE.b, alpha)
    ctx.lineWidth = depth < 1.2 ? 0.9 : 0.65
    ctx.stroke()
  }

  if (warp < 0.16) {
    const arcR = focal * (0.42 + warp * 0.9)
    ctx.beginPath()
    ctx.arc(cx, cy, arcR, phase * 0.2, phase * 0.2 + 1.7)
    ctx.strokeStyle = rgba(LINE.r, LINE.g, LINE.b, 0.14 * (1 - warp / 0.16))
    ctx.lineWidth = 0.7
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx + 40, cy - 30, arcR * 0.72, 2.4, 3.4)
    ctx.stroke()
  }
}

function drawGlobe(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  focal: number,
  warp: number,
  phase: number,
  minSide: number,
) {
  const vis =
    smoothstep(0.46, 0.52, warp) * (1 - smoothstep(0.62, 0.7, warp))
  if (vis <= 0.01) return

  const targetR = minSide * (0.17 + 0.08 * smoothstep(0.48, 0.62, warp))
  const depth = (GLOBE_R * focal) / targetR
  const fakeCam = GLOBE_Z - depth
  const center: Vec3 = { x: 0, y: 0.04, z: GLOBE_Z }
  const spin = phase * 0.4

  ctx.save()
  ctx.globalAlpha = vis
  ctx.lineWidth = 0.7
  ctx.strokeStyle = rgba(LINE.r, LINE.g, LINE.b, 0.16)

  for (let i = 0; i < 5; i++) {
    const yaw = (i / 5) * TAU + spin + 0.18
    strokeWorldCircle(
      ctx,
      center,
      GLOBE_R,
      (p) => rotY(rotX(p, Math.PI / 2), yaw),
      fakeCam,
      cx,
      cy,
      focal,
      72,
    )
  }
  for (let i = 1; i < 4; i++) {
    const phi = -Math.PI / 2 + (i / 4) * Math.PI
    const r = Math.cos(phi) * GLOBE_R
    const y = Math.sin(phi) * GLOBE_R
    strokeWorldCircle(
      ctx,
      { x: center.x, y: center.y + y, z: center.z },
      Math.abs(r),
      (p) => rotY(p, spin),
      fakeCam,
      cx,
      cy,
      focal,
      64,
    )
  }

  ctx.strokeStyle = rgba(LINE.r, LINE.g, LINE.b, 0.4)
  ctx.lineWidth = 0.9
  const orbitals = [
    { r: 1.3, r2: 1.4, rx: 0.48, rz: 0.22 },
    { r: 1.55, r2: 0, rx: 0.4, rz: -0.18 },
    { r: 1.78, r2: 0, rx: 0.58, rz: 0.12 },
  ]
  for (const o of orbitals) {
    const orient = (p: Vec3) => rotZ(rotX(p, o.rx), o.rz + spin * 0.12)
    strokeWorldCircle(ctx, center, o.r, orient, fakeCam, cx, cy, focal, 120)
    if (o.r2) {
      strokeWorldCircle(ctx, center, o.r2, orient, fakeCam, cx, cy, focal, 120)
    }
  }
  ctx.restore()
}

function drawPassingRings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  warp: number,
  minSide: number,
  width: number,
  height: number,
) {
  const vis =
    smoothstep(0.62, 0.68, warp) * (1 - smoothstep(0.8, 0.9, warp))
  if (vis <= 0.01) return

  const grow = 0.7 + smoothstep(0.62, 0.82, warp) * 1.65
  const driftX = -width * 0.06 * smoothstep(0.62, 0.8, warp)
  const driftY = height * (0.12 + 0.18 * smoothstep(0.62, 0.8, warp))

  ctx.save()
  ctx.globalAlpha = vis
  ctx.strokeStyle = rgba(LINE.r, LINE.g, LINE.b, 0.28)
  ctx.lineWidth = 0.85
  ctx.translate(cx + driftX, cy + driftY)

  const rings = [
    { rx: minSide * 0.42, ry: minSide * 0.16, rot: -0.55, scale: 1 },
    { rx: minSide * 0.5, ry: minSide * 0.18, rot: -0.38, scale: 1.12 },
    { rx: minSide * 0.58, ry: minSide * 0.2, rot: -0.72, scale: 1.28 },
  ]
  for (const ring of rings) {
    ctx.save()
    ctx.rotate(ring.rot)
    ctx.scale(grow * ring.scale, grow * ring.scale)
    ctx.beginPath()
    ctx.ellipse(0, 0, ring.rx, ring.ry, 0, 0, TAU)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(0, 0, ring.rx * 1.06, ring.ry * 1.08, 0, 0, TAU)
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  warp: number,
  width: number,
) {
  const alpha =
    smoothstep(0.07, 0.14, warp) * (1 - smoothstep(0.42, 0.54, warp))
  if (alpha <= 0.01) return

  const size = Math.max(13, Math.min(18, width * 0.028))
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = rgba(232, 232, 232, 0.92)
  ctx.font = `400 ${size}px Inter, ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('german+', cx, cy)

  const underlineW = Math.max(28, size * 2.4)
  ctx.strokeStyle = rgba(232, 232, 232, 0.7)
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(cx - underlineW / 2, cy + size * 0.85)
  ctx.lineTo(cx + underlineW / 2, cy + size * 0.85)
  ctx.stroke()
  ctx.restore()
}

function drawDotGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  warp: number,
) {
  const alpha = smoothstep(0.72, 0.84, warp) * (1 - smoothstep(0.94, 1, warp)) * 0.22
  if (alpha <= 0.01) return
  const step = 11
  ctx.fillStyle = rgba(210, 210, 210, alpha)
  const cols = Math.ceil(width / step)
  const rows = Math.ceil(height / step)
  for (let y = 0; y < rows; y++) {
    const rowOffset = y % 2 === 0 ? 0 : step * 0.5
    for (let x = 0; x < cols; x++) {
      ctx.fillRect(x * step + rowOffset, y * step, 1.1, 1.1)
    }
  }
}

function drawWhitePanel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  warp: number,
  camZ: number,
) {
  if (warp < 0.74) return
  const { w, h } = panelScreenSize(width, height, warp, camZ)
  const x = cx - w / 2
  const y = cy - h / 2
  const alpha = smoothstep(0.74, 0.8, warp)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}

export function attachTunnelRenderer(display: HTMLCanvasElement): Renderer {
  return {
    kind: 'canvas2d',
    render(state) {
      const { width, height, dpr, warp, phase, pointerX, pointerY } = state
      const w = Math.max(1, Math.floor(width * dpr))
      const h = Math.max(1, Math.floor(height * dpr))
      if (display.width !== w || display.height !== h) {
        display.width = w
        display.height = h
        display.style.width = `${width}px`
        display.style.height = `${height}px`
      }

      const ctx = display.getContext('2d', { alpha: false })
      if (!ctx) return

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, width, height)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const camZ = camZFromWarp(warp)
      const focal = focalLength(width, height)
      const cx = width * 0.5 + pointerX * 10 * (1 - warp)
      const cy = height * 0.5 + pointerY * 8 * (1 - warp)

      const minSide = Math.min(width, height)
      drawTunnelRings(ctx, camZ, cx, cy, focal, warp, phase)
      drawTitle(ctx, cx, cy, warp, width)
      drawGlobe(ctx, cx, cy, focal, warp, phase, minSide)
      drawPassingRings(ctx, cx, cy, warp, minSide, width, height)
      drawDotGrid(ctx, width, height, warp)
      drawWhitePanel(ctx, width, height, cx, cy, warp, camZ)
    },
    destroy() {
      // display canvas is owned by React
    },
  }
}
