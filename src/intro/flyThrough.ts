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
  kind: 'webgl'
  render: (state: FlyDrawState) => void
  destroy: () => void
}

const BG = 0x0a0a0b
const TAU = Math.PI * 2
const CAM_START_Z = 0.42
const CAM_END_Z = -16.4
const CAM_START_Y = 0.06
const CAM_END_Y = -0.42
const FOV_START = 46
const FOV_END = 58
const DEPTH_SPAN = 14.5

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
    pos[i * 3 + 1] = (rng() - 0.5) * radius * 1.15
    pos[i * 3 + 2] = z0 + rng() * (z1 - z0)
  }
  return pos
}

function wrapZ(pos: Float32Array, camZ: number) {
  const near = camZ + 0.85
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
  scene.fog = new THREE.Fog(BG, 1.05, 8.8)

  const camera = new THREE.PerspectiveCamera(FOV_START, 1, 0.05, 40)
  camera.position.set(0, CAM_START_Y, CAM_START_Z)

  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const textures: THREE.Texture[] = []
  const fields: DustField[] = []

  const moteTex = makeSoftDiscTexture(64, 0.18)
  const hazeTex = makeSoftDiscTexture(128, 0.08)
  if (moteTex) textures.push(moteTex)
  if (hazeTex) textures.push(hazeTex)

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
      CAM_END_Z - 1.2,
      CAM_START_Z + 0.6,
    )
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometries.push(geo)
    const mat = new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      map: moteTex,
      alphaMap: moteTex,
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
    mobile ? 140 : 280,
    2.55,
    mobile ? 0.028 : 0.022,
    0xcbc7bf,
    0.42,
  )
  addPoints(mobile ? 50 : 90, 1.85, mobile ? 0.05 : 0.04, 0xd4a574, 0.16)
  addPoints(mobile ? 28 : 48, 3.1, mobile ? 0.07 : 0.055, 0x9a9aa3, 0.22)

  if (hazeTex) {
    const hazeCount = mobile ? 6 : 8
    const hazeMat = new THREE.SpriteMaterial({
      map: hazeTex,
      color: 0x1c1c20,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.NormalBlending,
      fog: true,
    })
    materials.push(hazeMat)
    for (let i = 0; i < hazeCount; i++) {
      const sprite = new THREE.Sprite(hazeMat)
      const z = -1.1 - i * 1.85
      const s = 3.4 + (i % 3) * 0.55
      sprite.position.set((rng() - 0.5) * 0.55, (rng() - 0.5) * 0.4, z)
      sprite.scale.set(s * 1.35, s, 1)
      scene.add(sprite)
    }
  }

  const lookTarget = new THREE.Vector3()
  let lastW = 0
  let lastH = 0
  let lastDpr = 0

  const applyPose = (state: FlyDrawState) => {
    const t = warpEase(state.warp)
    const fall = smoothstep(0.08, 1, t)
    const z = THREE.MathUtils.lerp(CAM_START_Z, CAM_END_Z, t)
    const y =
      THREE.MathUtils.lerp(CAM_START_Y, CAM_END_Y, fall) +
      state.pointerY * 0.07 * (1 - state.warp)
    const x = state.pointerX * 0.11 * (1 - state.warp)
    camera.position.set(x, y, z)
    lookTarget.set(x * 0.18, y - 0.22 - fall * 0.28, z - 3.2)
    camera.up.set(Math.sin(fall * Math.PI) * 0.02, 1, 0)
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
