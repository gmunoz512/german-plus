import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

export type OrbitalDrawState = {
  width: number
  height: number
  dpr: number
  /** Normalized pointer -1..1 (desktop) */
  pointerX: number
  pointerY: number
  /** Scroll progress for mobile parallax, roughly 0..1+ */
  scrollY: number
  reducedMotion: boolean
  /** Prefer lighter path on small screens / low power */
  lowPower: boolean
  visible: boolean
  timeMs: number
}

export type OrbitalRenderer = {
  render: (state: OrbitalDrawState) => void
  destroy: () => void
  ready: Promise<void>
}

const BG = 0x0a0a0b
type NamedParts = {
  root: THREE.Object3D
  core: THREE.Object3D | null
  axis: THREE.Object3D | null
  ringGold: THREE.Object3D | null
  ringsGlass: THREE.Object3D[]
}

function findParts(scene: THREE.Object3D): NamedParts {
  let core: THREE.Object3D | null = null
  let axis: THREE.Object3D | null = null
  let ringGold: THREE.Object3D | null = null
  const ringsGlass: THREE.Object3D[] = []

  scene.traverse((obj) => {
    const n = obj.name.toLowerCase()
    if (n === 'core') core = obj
    else if (n === 'axis') axis = obj
    else if (n === 'ring_gold') ringGold = obj
    else if (n.startsWith('ring_glass')) ringsGlass.push(obj)
  })

  ringsGlass.sort((a, b) => a.name.localeCompare(b.name))
  return { root: scene, core, axis, ringGold, ringsGlass }
}

function enhanceMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const mat of mats) {
      if (!(mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial)) {
        continue
      }
      const name = (mat.name || obj.name || '').toLowerCase()
      if (name.includes('core') || name.includes('inner')) {
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity, name.includes('inner') ? 2.4 : 1.35)
        mat.toneMapped = false
      }
      const physical =
        mat instanceof THREE.MeshPhysicalMaterial ? mat : null
      const looksGlass =
        name.includes('glass') ||
        mat.transparent ||
        (physical != null && physical.transmission > 0)
      if (looksGlass) {
        mat.transparent = true
        mat.depthWrite = false
        mat.side = THREE.DoubleSide
        if (physical) {
          physical.transmission = Math.max(physical.transmission, 0.85)
          physical.thickness = Math.max(physical.thickness, 0.15)
          physical.ior = 1.45
        }
        mat.opacity = Math.min(mat.opacity, 0.55)
      }
      if (name.includes('gold')) {
        mat.metalness = Math.max(mat.metalness, 0.92)
        mat.roughness = Math.min(mat.roughness, 0.18)
      }
      mat.needsUpdate = true
    }
  })
}

/**
 * Perspective orbital hero: Draco GLB + optional UnrealBloom.
 * Call render() from rAF; destroy() on unmount.
 */
export function attachOrbital(canvas: HTMLCanvasElement): OrbitalRenderer | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    })
  } catch {
    return null
  }

  renderer.setClearColor(BG, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = false

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40)
  camera.position.set(0, 0.15, 4.6)

  const hemi = new THREE.HemisphereLight(0xc8c0ff, 0x1a1210, 0.55)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff2e0, 0.85)
  key.position.set(2.2, 3.2, 2.8)
  scene.add(key)
  const rim = new THREE.PointLight(0xb8a0ff, 1.1, 12, 2)
  rim.position.set(-1.4, 0.2, 2.2)
  scene.add(rim)
  const coreFill = new THREE.PointLight(0xd8c8ff, 2.4, 6, 2)
  coreFill.position.set(0, 0, 0)
  scene.add(coreFill)

  const pivot = new THREE.Group()
  scene.add(pivot)
  const tilt = new THREE.Group()
  pivot.add(tilt)

  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`

  // Three r186+ resolves Draco via import.meta.url (Vite bundles wasm/js).
  const draco = new DRACOLoader()
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)

  let parts: NamedParts | null = null
  let composer: EffectComposer | null = null
  let bloomPass: UnrealBloomPass | null = null
  let useBloom = true
  let lastW = 0
  let lastH = 0
  let lastDpr = 0
  let destroyed = false

  const glassBaseRot: THREE.Euler[] = []
  const goldBase = new THREE.Euler()
  const axisBase = new THREE.Euler()

  const ready = new Promise<void>((resolve, reject) => {
    loader.load(
      `${base}orbital.glb`,
      (gltf) => {
        if (destroyed) {
          resolve()
          return
        }
        const model = gltf.scene
        model.scale.setScalar(1.05)
        enhanceMaterials(model)
        parts = findParts(model)
        tilt.add(model)

        if (parts.ringGold) goldBase.copy(parts.ringGold.rotation)
        if (parts.axis) axisBase.copy(parts.axis.rotation)
        for (const g of parts.ringsGlass) {
          glassBaseRot.push(g.rotation.clone())
        }

        // Frame model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z) || 1
        const fit = 2.35 / maxDim
        model.scale.setScalar(fit)

        resolve()
      },
      undefined,
      (err) => {
        console.error('orbital glb load failed', err)
        reject(err)
      },
    )
  })

  const ensureComposer = (w: number, h: number, dpr: number, lowPower: boolean) => {
    const wantBloom = !lowPower
    if (!wantBloom) {
      useBloom = false
      composer = null
      bloomPass = null
      return
    }
    useBloom = true
    if (!composer) {
      composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.55, 0.55, 0.82)
      composer.addPass(bloomPass)
    }
    bloomPass?.setSize(w, h)
    composer?.setSize(w, h)
    composer?.setPixelRatio(dpr)
  }

  const smooth = {
    px: 0,
    py: 0,
    scroll: 0,
  }

  const render = (state: OrbitalDrawState) => {
    if (destroyed) return

    const { width, height, dpr, pointerX, pointerY, scrollY, reducedMotion, lowPower, visible, timeMs } =
      state

    if (!visible) return
    if (width < 2 || height < 2) return

    const wantBloom = !lowPower
    if (width !== lastW || height !== lastH || dpr !== lastDpr || wantBloom !== useBloom) {
      lastW = width
      lastH = height
      lastDpr = dpr
      renderer.setPixelRatio(dpr)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      ensureComposer(width, height, dpr, lowPower)
    }

    const lerp = reducedMotion ? 1 : 0.08
    smooth.px += (pointerX - smooth.px) * lerp
    smooth.py += (pointerY - smooth.py) * lerp
    smooth.scroll += (scrollY - smooth.scroll) * (reducedMotion ? 1 : 0.06)

    const t = timeMs * 0.001
    const motion = reducedMotion ? 0.08 : 1

    // Idle spin + pointer tilt on the whole rig
    pivot.rotation.y = t * 0.22 * motion + smooth.px * 0.35
    pivot.rotation.x = Math.sin(t * 0.31) * 0.06 * motion + smooth.py * -0.28
    pivot.rotation.z = Math.sin(t * 0.17) * 0.04 * motion

    // Scroll parallax (mobile / general): slight rise + yaw
    tilt.position.y = -smooth.scroll * 0.35
    tilt.rotation.y = smooth.scroll * 0.55
    tilt.rotation.x = smooth.scroll * 0.12

    if (parts) {
      if (parts.ringGold) {
        parts.ringGold.rotation.x = goldBase.x + t * 0.35 * motion + smooth.py * 0.2
        parts.ringGold.rotation.y = goldBase.y + t * 0.18 * motion + smooth.px * 0.25
        parts.ringGold.rotation.z = goldBase.z + Math.sin(t * 0.4) * 0.08 * motion
      }
      parts.ringsGlass.forEach((ring, i) => {
        const baseE = glassBaseRot[i] ?? ring.rotation
        const dir = i % 2 === 0 ? 1 : -1
        const speed = 0.28 + i * 0.09
        ring.rotation.x = baseE.x + t * speed * 0.4 * dir * motion + smooth.py * (0.12 + i * 0.04)
        ring.rotation.y = baseE.y + t * speed * dir * motion + smooth.px * (0.18 + i * 0.05)
        ring.rotation.z = baseE.z + Math.sin(t * (0.5 + i * 0.1)) * 0.1 * motion
      })
      if (parts.axis) {
        parts.axis.rotation.y = axisBase.y + t * 0.12 * motion
      }
      if (parts.core) {
        const pulse = 1 + Math.sin(t * 1.6) * 0.015 * motion
        parts.core.scale.setScalar(pulse)
      }
    }

    // Soft camera sway from pointer
    camera.position.x = smooth.px * 0.25
    camera.position.y = 0.15 + smooth.py * 0.15 - smooth.scroll * 0.2
    camera.lookAt(0, -smooth.scroll * 0.15, 0)

    if (useBloom && composer) {
      composer.render()
    } else {
      renderer.render(scene, camera)
    }
  }

  const destroy = () => {
    destroyed = true
    composer?.dispose()
    composer = null
    bloomPass = null
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) m?.dispose?.()
      }
    })
    draco.dispose()
    renderer.dispose()
  }

  return { render, destroy, ready }
}
