import {
  FOCAL,
  TUNNEL_R,
  apertureRadius,
  camZFromWarp,
  flySpeed,
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

const TAU = Math.PI * 2
const GOLD = { r: 212, g: 165, b: 116 }
const RING_COUNT = 22
const PARTICLE_COUNT = 72

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;

uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uCamZ;
uniform float uAperture;
uniform float uPhase;
uniform float uSpeed;
uniform float uBreath;
uniform vec3 uGold;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float r = length(p);
  float ang = atan(p.y, p.x);
  float minSide = min(uRes.x, uRes.y);
  float feather = mix(2.4, 22.0, clamp(uSpeed, 0.0, 1.0));

  vec3 col = vec3(0.0);
  float weight = 0.0;

  for (int s = 0; s < 3; s++) {
    float cam = uCamZ - float(s) * uSpeed * 0.12;
    float sw = 1.0 - float(s) * 0.22;
    weight += sw;

    for (int i = 0; i < 18; i++) {
      float z = 0.55 + float(i) * 0.68;
      float rel = z - cam;
      float alive = step(0.05, rel) * step(rel, 12.6);
      float scr = (1.92 * 1.08 * minSide) / max(rel, 0.05);
      float depthFade = smoothstep(0.05, 0.9, rel) * smoothstep(13.0, 2.4, rel);
      float prox = smoothstep(3.2, 0.08, rel);
      float halfW = mix(0.9, 6.2, prox) + uBreath * 0.35;
      float d = abs(r - scr);
      float line = smoothstep(halfW, 0.0, d);
      float glow = exp(-(d * d) / max(12.0, halfW * halfW * 14.0));
      vec3 ringCol = mix(uGold * 0.28, uGold, 0.4 + prox * 0.6);
      ringCol = mix(ringCol, vec3(0.96, 0.94, 0.90), prox * 0.35);
      col += ringCol * (line * 0.95 + glow * 0.28) * depthFade * sw * alive;
    }

    float spoke = abs(fract((ang / 6.28318530718) * 12.0 + uPhase * 0.08) - 0.5);
    float spokeBand = smoothstep(0.028, 0.0, spoke);
    float spokeFog = smoothstep(uAperture * 1.02, uAperture * 1.35, r) *
      smoothstep(minSide * 0.92, minSide * 0.18, r);
    col += uGold * spokeBand * spokeFog * sw * 0.1;
  }

  col /= max(weight, 0.001);

  for (int n = 0; n < 32; n++) {
    float id = float(n);
    float pz = 0.35 + hash(id * 13.7) * 11.4;
    float relp = pz - uCamZ;
    float palive = step(0.04, relp) * step(relp, 12.0);
    float pang = hash(id + 19.0) * 6.28318530718 + uPhase * 0.12;
    float prad = (0.12 + hash(id + 4.2) * 0.92) * 1.08;
    float ps = (1.92 * prad * minSide) / max(relp, 0.04);
    vec2 pp = vec2(cos(pang), sin(pang)) * ps;
    float pd = length(p - pp);
    float psize = mix(0.55, 2.4, smoothstep(6.0, 0.1, relp));
    float streak = 1.0 + uSpeed * 18.0;
    vec2 radial = normalize(pp + vec2(0.0001, 0.0));
    vec2 delta = p - pp;
    float along = dot(delta, radial);
    float across = abs(dot(delta, vec2(-radial.y, radial.x)));
    float pdot = smoothstep(psize, 0.0, pd);
    float pstreak = smoothstep(psize * 1.2, 0.0, across) *
      smoothstep(psize * streak, 0.0, abs(along));
    float pglow = mix(pdot, pstreak, clamp(uSpeed * 3.0, 0.0, 1.0));
    float pfog = smoothstep(0.04, 0.7, relp) * smoothstep(12.0, 2.0, relp);
    col += mix(uGold, vec3(0.95, 0.93, 0.88), 0.4) * pglow * pfog * palive * 0.55;
  }

  float rim = abs(r - uAperture);
  float rimGlow = exp(-rim * rim / (feather * feather * 3.2));
  col += mix(uGold, vec3(1.0, 0.97, 0.92), 0.45) * rimGlow * 0.7;

  float haze = exp(-max(0.0, r - uAperture) / (minSide * 0.55));
  col += uGold * haze * 0.04;

  float gn = hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uPhase * 40.0);
  col += (gn - 0.5) * 0.035;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

type OffscreenGL = {
  canvas: HTMLCanvasElement
  render: (state: TunnelDrawState) => void
  destroy: () => void
}

function createOffscreenWebGL(): OffscreenGL | null {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  })
  if (!gl) return null

  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return null
  }
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return null
  }

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  const aPos = gl.getAttribLocation(program, 'aPos')
  const uRes = gl.getUniformLocation(program, 'uRes')
  const uCenter = gl.getUniformLocation(program, 'uCenter')
  const uCamZ = gl.getUniformLocation(program, 'uCamZ')
  const uAperture = gl.getUniformLocation(program, 'uAperture')
  const uPhase = gl.getUniformLocation(program, 'uPhase')
  const uSpeed = gl.getUniformLocation(program, 'uSpeed')
  const uBreath = gl.getUniformLocation(program, 'uBreath')
  const uGold = gl.getUniformLocation(program, 'uGold')

  return {
    canvas,
    render(state) {
      const { width, height, dpr, warp, phase, breath, pointerX, pointerY } =
        state
      const w = Math.max(1, Math.floor(width * dpr))
      const h = Math.max(1, Math.floor(height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }

      const camZ = camZFromWarp(warp)
      const aperture = apertureRadius(width, height, camZ, breath) * dpr
      const cx = (width * 0.5 + pointerX * 18) * dpr
      const cy = (height * 0.5 - pointerY * 14) * dpr
      const speed = flySpeed(warp)

      gl.viewport(0, 0, w, h)
      gl.disable(gl.BLEND)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(uRes, w, h)
      gl.uniform2f(uCenter, cx, cy)
      gl.uniform1f(uCamZ, camZ)
      gl.uniform1f(uAperture, aperture)
      gl.uniform1f(uPhase, phase)
      gl.uniform1f(uSpeed, speed)
      gl.uniform1f(uBreath, breath)
      gl.uniform3f(uGold, GOLD.r / 255, GOLD.g / 255, GOLD.b / 255)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    destroy() {
      gl.deleteBuffer(buf)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a})`
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function makeParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    z: 0.35 + ((i * 47) % 114) / 10,
    ang: (i * 2.399) % TAU,
    rad: 0.12 + ((i * 13) % 92) / 100,
    size: 0.6 + ((i * 7) % 18) / 10,
  }))
}

function drawTunnel2d(
  ctx: CanvasRenderingContext2D,
  state: TunnelDrawState,
  particles: ReturnType<typeof makeParticles>,
) {
  const { width, height, warp, phase, breath, pointerX, pointerY } = state
  const camZ = camZFromWarp(warp)
  const aperture = apertureRadius(width, height, camZ, breath)
  const cx = width * 0.5 + pointerX * 18
  const cy = height * 0.5 + pointerY * 14
  const speed = flySpeed(warp)
  const m = Math.min(width, height)

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  const samples = speed > 0.04 ? 4 : 1
  for (let s = 0; s < samples; s++) {
    const cam = camZ - s * speed * 0.11
    const sw = 1 - s * 0.18
    ctx.save()
    ctx.globalAlpha = sw

    for (let i = RING_COUNT - 1; i >= 0; i--) {
      const z = 0.55 + i * 0.58
      const rel = z - cam
      if (rel < 0.045 || rel > 12.5) continue
      const scr = (FOCAL * TUNNEL_R * m) / rel
      if (scr < aperture * 0.92) continue
      const depthFade =
        smoothstep(0.045, 0.85, rel) * smoothstep(13, 2.4, rel)
      const prox = smoothstep(3.2, 0.08, rel)
      const lw = (0.9 + prox * 4.6 + breath * 0.3) * (1 + speed * 0.6)
      ctx.beginPath()
      ctx.arc(cx, cy, scr, 0, TAU)
      ctx.strokeStyle = rgba(
        GOLD.r,
        GOLD.g,
        GOLD.b,
        (0.2 + prox * 0.6) * depthFade,
      )
      ctx.lineWidth = lw + 7
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, scr, 0, TAU)
      ctx.strokeStyle = rgba(244, 241, 234, (0.28 + prox * 0.55) * depthFade)
      ctx.lineWidth = lw
      ctx.stroke()
    }

    ctx.strokeStyle = rgba(GOLD.r, GOLD.g, GOLD.b, 0.1 * sw)
    ctx.lineWidth = 1
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU + phase * 0.08
      ctx.beginPath()
      ctx.moveTo(
        cx + Math.cos(a) * aperture * 1.04,
        cy + Math.sin(a) * aperture * 1.04,
      )
      ctx.lineTo(cx + Math.cos(a) * m * 0.72, cy + Math.sin(a) * m * 0.72)
      ctx.stroke()
    }

    for (const p of particles) {
      const relp = p.z - cam
      if (relp < 0.04 || relp > 12) continue
      const pang = p.ang + phase * 0.12
      const ps = (FOCAL * p.rad * TUNNEL_R * m) / relp
      const px = cx + Math.cos(pang) * ps
      const py = cy + Math.sin(pang) * ps
      const pfog = smoothstep(0.04, 0.7, relp) * smoothstep(12, 2, relp)
      const psize = p.size * (1 + smoothstep(6, 0.1, relp) * 1.6)
      ctx.fillStyle = rgba(244, 241, 234, 0.5 * pfog)
      if (speed > 0.12) {
        const streak = psize + speed * 16
        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(Math.atan2(py - cy, px - cx))
        ctx.globalAlpha = 0.4 * pfog * sw
        const grad = ctx.createLinearGradient(-streak, 0, streak, 0)
        grad.addColorStop(0, 'rgba(212,165,116,0)')
        grad.addColorStop(0.5, 'rgba(244,241,234,0.9)')
        grad.addColorStop(1, 'rgba(212,165,116,0)')
        ctx.fillStyle = grad
        ctx.fillRect(-streak, -psize * 0.35, streak * 2, psize * 0.7)
        ctx.restore()
      } else {
        ctx.beginPath()
        ctx.arc(px, py, psize, 0, TAU)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  const rim = ctx.createRadialGradient(
    cx,
    cy,
    Math.max(0, aperture - 18),
    cx,
    cy,
    aperture + 28 + speed * 20,
  )
  rim.addColorStop(0, 'rgba(0,0,0,0)')
  rim.addColorStop(0.72, 'rgba(212,165,116,0)')
  rim.addColorStop(0.9, rgba(GOLD.r, GOLD.g, GOLD.b, 0.42))
  rim.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = rim
  ctx.fillRect(0, 0, width, height)
}

function punchAperture(ctx: CanvasRenderingContext2D, state: TunnelDrawState) {
  const { width, height, warp, breath, pointerX, pointerY } = state
  const camZ = camZFromWarp(warp)
  const aperture = apertureRadius(width, height, camZ, breath)
  const cx = width * 0.5 + pointerX * 18
  const cy = height * 0.5 + pointerY * 14
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(cx, cy, Math.max(1, aperture), 0, TAU)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
}

export function attachTunnelRenderer(display: HTMLCanvasElement): Renderer {
  const webgl = createOffscreenWebGL()
  const particles = makeParticles()

  return {
    kind: webgl ? 'webgl' : 'canvas2d',
    render(state) {
      const { width, height, dpr } = state
      const w = Math.max(1, Math.floor(width * dpr))
      const h = Math.max(1, Math.floor(height * dpr))
      if (display.width !== w || display.height !== h) {
        display.width = w
        display.height = h
        display.style.width = `${width}px`
        display.style.height = `${height}px`
      }

      const ctx = display.getContext('2d', { alpha: true })
      if (!ctx) return

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      if (webgl) {
        webgl.render(state)
        ctx.drawImage(webgl.canvas, 0, 0, width, height)
      } else {
        drawTunnel2d(ctx, state, particles)
      }

      punchAperture(ctx, state)
    },
    destroy() {
      webgl?.destroy()
    },
  }
}
