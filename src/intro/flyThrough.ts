import * as THREE from 'three'
import { smoothstep, warpEase } from './tunnel'

export type FlyDrawState = {
  width: number
  height: number
  dpr: number
  warp: number
  pointerX: number
  pointerY: number
}

export type FlyThroughRenderer = {
  kind: 'webgl' | 'canvas2d'
  render: (state: FlyDrawState) => void
  destroy: () => void
}

const BG = 0x0a0a0b
const TAU = Math.PI * 2
const CAM_START_Z = 0.55
const CAM_END_Z = -15.2
const CAM_START_Y = 0.05
const CAM_END_Y = -0.38
const FOV_START = 47
const FOV_END = 60
const DEPTH_SPAN = 13.6

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeSoftDiscTexture(size: number, inner = 0.22) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const c = size / 2
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(inner, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.62, 'rgba(255,255,255,0.12)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function scatterInTube(
  rng: () => number,
  count: number,
  radius: number,
  z0: number,
  z1: number,
) {
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const a = rng() * TAU
    const rad = Math.sqrt(rng()) * radius
    pos[i * 3] = Math.cos(a) * rad
    pos[i * 3 + 1] = (rng() - 0.5) * radius * 1.05
    pos[i * 3 + 2] = z0 + rng() * (z1 - z0)
  }
  return pos
}

function wrapZ(pos: Float32Array, camZ: number) {
  const near = camZ + 0.7
  const far = camZ - DEPTH_SPAN
  const span = near - far
  for (let i = 2; i < pos.length; i += 3) {
    let z = pos[i]
    if (z > near) z -= span * Math.ceil((z - near) / span)
    else if (z < far) z += span * Math.ceil((far - z) / span)
    pos[i] = z
  }
}

type DustField = {
  pos: Float32Array
  points: THREE.Points
}

/**
 * PerspectiveCamera dolly through a charcoal void.
 * Depth comes from fog, size-attenuated dust, and soft haze sprites —
 * no LineLoops, meridians, orbitals, or opening panel.
 */
export function attachFlyThrough(
  canvas: HTMLCanvasElement,
): FlyThroughRenderer | null {
  const mobile =
    window.innerWidth < 720 || window.matchMedia('(pointer: coarse)').matches
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: !mobile,
      stencil: false,
      depth: true,
      powerPreference: mobile ? 'low-power' : 'high-performance',
      failIfMajorPerformanceCaveat: false,
    })
  } catch {
    return null
  }
  if (!renderer.getContext()) {
    renderer.dispose()
    return null
  }

  renderer.setClearColor(BG, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.autoClear = true

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(BG)
  scene.fog = new THREE.Fog(BG, 0.55, 7.4)

  const camera = new THREE.PerspectiveCamera(FOV_START, 1, 0.04, 36)
  camera.position.set(0, CAM_START_Y, CAM_START_Z)

  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const textures: THREE.Texture[] = []
  const fields: DustField[] = []

  const moteTex = makeSoftDiscTexture(64, 0.2)
  if (moteTex) textures.push(moteTex)

  const rng = mulberry32(0x51e7)

  const addPoints = (
    count: number,
    radius: number,
    size: number,
    color: number,
    opacity: number,
  ) => {
    const pos = scatterInTube(
      rng,
      count,
      radius,
      CAM_END_Z - 0.8,
      CAM_START_Z + 0.35,
    )
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometries.push(geo)
    const mat = new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      map: moteTex,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: true,
    })
    materials.push(mat)
    const points = new THREE.Points(geo, mat)
    scene.add(points)
    fields.push({ pos, points })
  }

  addPoints(
    mobile ? 170 : 340,
    1.45,
    mobile ? 0.055 : 0.048,
    0xddd9d1,
    0.7,
  )
  addPoints(mobile ? 55 : 90, 0.95, mobile ? 0.09 : 0.078, 0xd4a574, 0.28)
  addPoints(mobile ? 36 : 64, 2.05, mobile ? 0.12 : 0.1, 0xb8b8c0, 0.34)

  const lookTarget = new THREE.Vector3()
  let lastW = 0
  let lastH = 0
  let lastDpr = 0

  const applyPose = (state: FlyDrawState) => {
    const t = warpEase(state.warp)
    const fall = smoothstep(0.06, 1, t)
    const z = THREE.MathUtils.lerp(CAM_START_Z, CAM_END_Z, t)
    const y =
      THREE.MathUtils.lerp(CAM_START_Y, CAM_END_Y, fall) +
      state.pointerY * 0.07 * (1 - state.warp)
    const x = state.pointerX * 0.11 * (1 - state.warp)
    camera.position.set(x, y, z)
    lookTarget.set(x * 0.16, y - 0.2 - fall * 0.32, z - 3.1)
    camera.up.set(Math.sin(fall * Math.PI) * 0.018, 1, 0)
    camera.lookAt(lookTarget)
    camera.fov = THREE.MathUtils.lerp(FOV_START, FOV_END, fall * fall)
    camera.updateProjectionMatrix()
  }

  return {
    kind: 'webgl',
    render(state) {
      const { width, height, dpr } = state
      if (width !== lastW || height !== lastH || dpr !== lastDpr) {
        renderer.setPixelRatio(dpr)
        renderer.setSize(width, height, false)
        camera.aspect = width / Math.max(1, height)
        lastW = width
        lastH = height
        lastDpr = dpr
      }

      applyPose(state)
      for (const field of fields) {
        wrapZ(field.pos, camera.position.z)
        field.points.geometry.attributes.position.needsUpdate = true
      }

      renderer.render(scene, camera)
    },
    destroy() {
      renderer.dispose()
      for (const geo of geometries) geo.dispose()
      for (const mat of materials) mat.dispose()
      for (const tex of textures) tex.dispose()
    },
  }
}

type Speck = { x: number; y: number; z0: number; c: string; s: number }

/** Canvas 2D starfield-style fall if WebGL is unavailable. */
export function attachFall2D(
  canvas: HTMLCanvasElement,
): FlyThroughRenderer | null {
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return null

  const rng = mulberry32(0x51e7)
  const mobile = window.innerWidth < 720
  const count = mobile ? 140 : 240
  const specks: Speck[] = []
  const colors = ['#d8d4cc', '#d4a574', '#a8a8b0']
  for (let i = 0; i < count; i++) {
    specks.push({
      x: (rng() - 0.5) * 2.2,
      y: (rng() - 0.5) * 1.6,
      z0: 0.12 + rng() * 0.88,
      c: colors[i % 17 === 0 ? 1 : i % 5 === 0 ? 2 : 0],
      s: 0.55 + rng() * 1.1,
    })
  }

  const wrapDepth = (z: number) => {
    const min = 0.08
    const span = 0.92
    let u = (z - min) % span
    if (u < 0) u += span
    return min + u
  }

  return {
    kind: 'canvas2d',
    render(state) {
      const { width, height, dpr, warp, pointerX, pointerY } = state
      const w = Math.max(1, Math.floor(width * dpr))
      const h = Math.max(1, Math.floor(height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }

      const t = warpEase(warp)
      ctx.fillStyle = '#0a0a0b'
      ctx.fillRect(0, 0, w, h)

      const cx = w * 0.5 + pointerX * w * 0.03 * (1 - warp)
      const cy = h * 0.48 + pointerY * h * 0.02 * (1 - warp) + t * h * 0.03
      const k = Math.min(w, h) * (0.42 + t * 0.12)

      const well = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        Math.max(w, h) * 0.62,
      )
      well.addColorStop(0, 'rgba(32,32,36,0.35)')
      well.addColorStop(0.45, 'rgba(10,10,11,0)')
      well.addColorStop(1, 'rgba(10,10,11,0.55)')
      ctx.fillStyle = well
      ctx.fillRect(0, 0, w, h)

      const shift = t * 2.35
      for (const p of specks) {
        const z = wrapDepth(p.z0 - shift)
        const x = cx + (p.x / z) * k
        const y = cy + (p.y / z) * k
        const r = (p.s * (mobile ? 1.15 : 0.95) * dpr) / z
        if (r < 0.3) continue
        ctx.beginPath()
        ctx.fillStyle = p.c
        ctx.globalAlpha = Math.min(0.85, 0.18 + (1 - z) * 0.7)
        ctx.arc(x, y, r, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
    destroy() {
      specks.length = 0
    },
  }
}

export function attachFallRenderer(
  canvas: HTMLCanvasElement,
): FlyThroughRenderer | null {
  return attachFlyThrough(canvas) ?? attachFall2D(canvas)
}
