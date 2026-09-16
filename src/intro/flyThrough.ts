import * as THREE from 'three'
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { smoothstep, warpEase } from './tunnel'

export type FlyDrawState = {
  width: number
  height: number
  dpr: number
  warp: number
  pointerX: number
  pointerY: number
  now: number
}

export type FlyThroughRenderer = {
  kind: 'webgl'
  render: (state: FlyDrawState) => void
  coversViewport: () => boolean
  destroy: () => void
}

const BG = 0x141414
const LINE = 0xd6d6d6
const TAU = Math.PI * 2
const CAM_START_Z = 0.28
const CAM_END_Z = -16.85
const GLOBE_Z = -10.05
const GLOBE_R = 1.16
const PANEL_W = 3.35
const PANEL_H = 1.92
const UNIT_SEGMENTS_DESKTOP = 160
const UNIT_SEGMENTS_MOBILE = 96

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCircleGeo(segments: number) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * TAU
    pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  geo.computeBoundingSphere()
  return geo
}

function lineMat(opacity: number) {
  return new THREE.LineBasicMaterial({
    color: LINE,
    transparent: true,
    opacity,
    depthWrite: false,
    fog: true,
  })
}

/**
 * Real WebGL fly-through. Intentionally not a 2D canvas stroke path:
 * a PerspectiveCamera dollies continuously through world-space LineLoops.
 */
export function attachFlyThrough(
  canvas: HTMLCanvasElement,
): FlyThroughRenderer | null {
  const mobile =
    window.innerWidth < 720 ||
    window.matchMedia('(pointer: coarse)').matches
  const antialias = !mobile
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias,
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
  scene.fog = new THREE.Fog(BG, 1.35, 7.4)

  const camera = new THREE.PerspectiveCamera(48, 1, 0.055, 42)
  camera.position.set(0, 0.04, CAM_START_Z)

  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const segments = mobile ? UNIT_SEGMENTS_MOBILE : UNIT_SEGMENTS_DESKTOP
  const unitCircle = makeCircleGeo(segments)
  geometries.push(unitCircle)

  const rng = mulberry32(0x51e7)

  const addLoop = (
    parent: THREE.Object3D,
    opacity: number,
    setup: (line: THREE.LineLoop) => void,
  ) => {
    const mat = lineMat(opacity)
    materials.push(mat)
    const line = new THREE.LineLoop(unitCircle, mat)
    setup(line)
    parent.add(line)
    return line
  }

  const tunnel = new THREE.Group()
  scene.add(tunnel)

  const ringCount = mobile ? 9 : 11
  for (let i = 0; i < ringCount; i++) {
    const z = -1.15 - i * 0.72
    const radius = (mobile ? 1.58 : 2.02) + (i % 4) * 0.05
    const tiltX = (0.04 + (i % 4) * 0.03) * (i % 2 ? -1 : 1)
    const opacity = 0.28 + (i % 3) * 0.05
    addLoop(tunnel, opacity, (line) => {
      line.scale.setScalar(radius)
      line.position.set(0, 0, z)
      line.rotation.set(tiltX, 0, 0)
    })
    if (i % 2 === 1) {
      addLoop(tunnel, opacity * 0.55, (line) => {
        line.scale.setScalar(radius * 1.04)
        line.position.set(0, 0, z - 0.04)
        line.rotation.set(tiltX, 0, 0)
      })
    }
  }

  // Opening beat: a faint near ring the camera immediately flies through.
  addLoop(tunnel, 0.22, (line) => {
    line.scale.setScalar(mobile ? 1.95 : 2.85)
    line.position.z = -0.55
  })

  const globe = new THREE.Group()
  globe.position.set(0.12, -0.08, GLOBE_Z)
  globe.rotation.set(0.28, 0.35, 0.1)
  scene.add(globe)

  const meridians = mobile ? 5 : 6
  for (let i = 0; i < meridians; i++) {
    addLoop(globe, 0.36, (line) => {
      line.scale.setScalar(GLOBE_R)
      line.rotation.y = (i / meridians) * Math.PI
    })
  }
  const parallelCount = 3
  for (let i = 1; i <= parallelCount; i++) {
    const phi = -Math.PI / 2 + (i / (parallelCount + 1)) * Math.PI
    const r = Math.abs(Math.cos(phi) * GLOBE_R)
    const y = Math.sin(phi) * GLOBE_R
    addLoop(globe, 0.32, (line) => {
      line.scale.setScalar(r)
      line.rotation.x = Math.PI / 2
      line.position.y = y
    })
  }

  const orbitals = new THREE.Group()
  globe.add(orbitals)
  const orbitDefs = [
    { rx: 1.32, ry: 1.38, e: [0.52, 0.18, 0.22], o: 0.42 },
    { rx: 1.36, ry: 1.42, e: [0.52, 0.18, 0.22], o: 0.24 },
    { rx: 1.58, ry: 1.52, e: [0.38, -0.2, -0.12], o: 0.36 },
    { rx: 1.82, ry: 1.64, e: [0.62, 0.08, 0.14], o: 0.32 },
    { rx: 2.08, ry: 1.72, e: [0.72, -0.16, 0.3], o: 0.28 },
    { rx: 2.28, ry: 1.9, e: [0.48, 0.28, -0.2], o: 0.22 },
  ]
  for (const o of orbitDefs) {
    addLoop(orbitals, o.o, (line) => {
      line.scale.set(o.rx, o.ry, 1)
      line.rotation.set(o.e[0], o.e[1], o.e[2])
    })
  }

  const flyPast = new THREE.Group()
  scene.add(flyPast)
  const pastDefs = [
    { z: -12.35, rx: 3.4, ry: 1.15, e: [1.02, 0.18, -0.55], y: -0.45 },
    { z: -12.5, rx: 3.55, ry: 1.22, e: [1.02, 0.18, -0.55], y: -0.45 },
    { z: -13.4, rx: 3.9, ry: 1.28, e: [0.92, -0.12, -0.4], y: -0.65 },
    { z: -14.5, rx: 4.35, ry: 1.4, e: [1.12, 0.08, -0.72], y: -0.85 },
    { z: -15.5, rx: 4.8, ry: 1.55, e: [0.98, 0.22, -0.5], y: -1.0 },
  ]
  for (const p of pastDefs) {
    addLoop(flyPast, 0.34, (line) => {
      line.scale.set(p.rx, p.ry, 1)
      line.rotation.set(p.e[0], p.e[1], p.e[2])
      line.position.set(0.15, p.y, p.z)
    })
  }

  const dustCount = mobile ? 120 : 280
  const dustPos = new Float32Array(dustCount * 3)
  for (let i = 0; i < dustCount; i++) {
    const a = rng() * TAU
    const rad = Math.sqrt(rng()) * 2.7
    dustPos[i * 3] = Math.cos(a) * rad
    dustPos[i * 3 + 1] = (rng() - 0.5) * 2.4
    dustPos[i * 3 + 2] = -0.2 - rng() * 18.5
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  geometries.push(dustGeo)
  const dustMat = new THREE.PointsMaterial({
    color: 0xcfcfcf,
    size: mobile ? 0.018 : 0.014,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: true,
  })
  materials.push(dustMat)
  scene.add(new THREE.Points(dustGeo, dustMat))

  const panelGeo = new THREE.PlaneGeometry(PANEL_W, PANEL_H)
  geometries.push(panelGeo)
  const panelMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    fog: false,
    depthTest: true,
    depthWrite: true,
    transparent: true,
    opacity: 0,
  })
  materials.push(panelMat)
  const panel = new THREE.Mesh(panelGeo, panelMat)
  panel.visible = false
  scene.add(panel)

  const lookTarget = new THREE.Vector3()
  const forward = new THREE.Vector3()
  let lastCover = false
  let lastW = 0
  let lastH = 0
  let lastDpr = 0

  let composer: EffectComposer | null = null
  let afterimage: AfterimagePass | null = null
  if (!mobile) {
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    afterimage = new AfterimagePass(0.74)
    composer.addPass(afterimage)
  }

  const applyPose = (state: FlyDrawState) => {
    const t = warpEase(state.warp)
    const z = THREE.MathUtils.lerp(CAM_START_Z, CAM_END_Z, t)
    const past = smoothstep(0.46, 0.86, t)
    const y = 0.04 + past * 1.35
    const x =
      0.03 +
      Math.sin(t * Math.PI) * 0.08 * past +
      state.pointerX * 0.14 * (1 - state.warp)
    const camY = y + state.pointerY * 0.08 * (1 - state.warp)
    camera.position.set(x, camY, z)

    lookTarget.set(x * 0.2, camY - 0.55 * past - 0.04, z - 3.4)
    camera.up.set(Math.sin(past * Math.PI) * 0.03, 1, 0)
    camera.lookAt(lookTarget)
    camera.fov = 46 + 12 * past * past
    camera.updateProjectionMatrix()
  }

  const placePanel = (warp: number) => {
    const door = smoothstep(0.7, 1, warp)
    if (door <= 0.001) {
      panel.visible = false
      panelMat.opacity = 0
      lastCover = false
      return
    }
    panel.visible = true
    panelMat.opacity = smoothstep(0.7, 0.78, warp)
    const dist = THREE.MathUtils.lerp(6.8, 0.42, door ** 1.28)
    const scale = THREE.MathUtils.lerp(0.09, 2.55, door ** 1.18)
    camera.getWorldDirection(forward)
    panel.position.copy(camera.position).addScaledVector(forward, dist)
    panel.quaternion.copy(camera.quaternion)
    panel.scale.set(scale, scale, 1)
    panel.updateMatrixWorld(true)
  }

  const coversViewport = () => {
    if (!panel.visible || panelMat.opacity < 0.95) return false
    const hw = (PANEL_W * panel.scale.x) / 2
    const hh = (PANEL_H * panel.scale.y) / 2
    const corners = [
      new THREE.Vector3(-hw, -hh, 0),
      new THREE.Vector3(hw, -hh, 0),
      new THREE.Vector3(hw, hh, 0),
      new THREE.Vector3(-hw, hh, 0),
    ]
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const corner of corners) {
      corner.applyMatrix4(panel.matrixWorld).project(camera)
      if (corner.z < -1 || corner.z > 1) return false
      minX = Math.min(minX, corner.x)
      maxX = Math.max(maxX, corner.x)
      minY = Math.min(minY, corner.y)
      maxY = Math.max(maxY, corner.y)
    }
    lastCover = minX <= -1.03 && maxX >= 1.03 && minY <= -1.03 && maxY >= 1.03
    return lastCover
  }

  return {
    kind: 'webgl',
    render(state) {
      const { width, height, dpr, warp, now } = state
      if (width !== lastW || height !== lastH || dpr !== lastDpr) {
        renderer.setPixelRatio(dpr)
        renderer.setSize(width, height, false)
        composer?.setPixelRatio(dpr)
        composer?.setSize(width, height)
        camera.aspect = width / Math.max(1, height)
        lastW = width
        lastH = height
        lastDpr = dpr
      }

      globe.rotation.y = 0.35 + now * 0.00022
      orbitals.rotation.z = now * 0.00008
      orbitals.rotation.x = Math.sin(now * 0.00015) * 0.04

      applyPose(state)
      globe.visible = Math.abs(camera.position.z - GLOBE_Z) < 4.8
      flyPast.visible = camera.position.z < GLOBE_Z + 0.6
      placePanel(warp)
      if (afterimage) {
        afterimage.damp = warp > 0.7 ? 0.08 : 0.58
      }
      if (composer) composer.render()
      else renderer.render(scene, camera)
    },
    coversViewport,
    destroy() {
      afterimage?.dispose()
      composer?.dispose()
      renderer.dispose()
      for (const geo of geometries) geo.dispose()
      for (const mat of materials) mat.dispose()
    },
  }
}

export function titleOpacity(warp: number) {
  return (
    smoothstep(0.05, 0.12, warp) * (1 - smoothstep(0.26, 0.36, warp))
  )
}
