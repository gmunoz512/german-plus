const FUR = '#c5c5ce'
const FUR_DEEP = '#9d9da8'
const FUR_LIGHT = '#e2e2e8'
const INNER_EAR = '#d4a574'
const NOSE = '#c98990'
const EYE = '#141416'

export type RabbitPhase = 'idle' | 'dig' | 'sink' | 'warp'

type RabbitProps = {
  stand: number
  phase: RabbitPhase
  now: number
  phaseElapsed: number
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function Rabbit({ stand, phase, now, phaseElapsed }: RabbitProps) {
  const t = clamp(stand, 0, 1)
  const dig = phase === 'dig'
  const sink = phase === 'sink' || phase === 'warp'
  const sinkT = phase === 'sink' ? clamp(phaseElapsed / 480, 0, 1) : phase === 'warp' ? 1 : 0
  const digT = dig ? clamp(phaseElapsed / 720, 0, 1) : sink ? 1 : 0

  const bob = dig ? Math.sin(now / 45) * 7 : phase === 'idle' ? Math.sin(now / 900) * 1.6 : 0
  const pawDig = dig ? Math.sin(now / 38) * 28 : 0
  const wobble = dig ? Math.sin(now / 52) * 5 : 0
  const earIdle = phase === 'idle' ? Math.sin(now / 640) * 3.5 : 0

  const bodyRot = lerp(74, -6, t) + wobble
  const headRot = -bodyRot + lerp(-8, 4, t)
  const hipX = lerp(188, 180, t)
  const hipY = lerp(292, 268, t) + bob + sinkT * 90
  const frontLegRot = lerp(62, 10, t) + pawDig
  const hindLegRot = lerp(48, 16, t) - pawDig * 0.35
  const shadowRx = lerp(92, 48, t)
  const shadowOp = lerp(0.28, 0.18, t) * (1 - sinkT)
  const scale = 1 - sinkT * 0.72
  const rabbitOp = 1 - sinkT

  const holeRx = lerp(0, 54, digT) * (1 + sinkT * 0.55)
  const holeRy = lerp(0, 16, digT) * (1 + sinkT * 0.8)

  return (
    <svg
      viewBox="0 0 360 380"
      className="block h-auto w-[min(72vw,22rem)] overflow-visible sm:w-[min(48vw,26rem)]"
      aria-hidden
    >
      <ellipse
        cx={lerp(200, 180, t)}
        cy="338"
        rx={shadowRx}
        ry="11"
        fill="#000"
        opacity={shadowOp}
      />

      {holeRx > 0.5 && (
        <g opacity={phase === 'warp' ? 0 : 1}>
          <ellipse cx="186" cy="336" rx={holeRx} ry={holeRy} fill="#050506" />
          <ellipse
            cx="186"
            cy="336"
            rx={holeRx * 0.72}
            ry={holeRy * 0.62}
            fill="#0a0a0b"
            stroke="#d4a574"
            strokeOpacity="0.35"
            strokeWidth="1.2"
          />
        </g>
      )}

      {dig &&
        Array.from({ length: 11 }, (_, i) => {
          const a = -Math.PI * 0.85 + (i / 10) * Math.PI * 0.9
          const dist = 18 + digT * (36 + (i % 4) * 14)
          const x = 186 + Math.cos(a) * dist
          const y = 328 + Math.sin(a) * dist * 0.45 - digT * 22
          const r = 3.2 + (i % 3)
          return (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx={r}
              ry={r * 0.7}
              fill={i % 2 ? FUR_DEEP : '#6f6f78'}
              opacity={0.85 - digT * 0.5}
              transform={`rotate(${a * 40} ${x} ${y})`}
            />
          )
        })}

      <g
        opacity={rabbitOp}
        transform={`translate(${hipX} ${hipY}) scale(${scale})`}
      >
        <g transform={`rotate(${bodyRot})`}>
          <ellipse cx="-30" cy="10" rx="13" ry="12" fill={FUR_LIGHT} />
          <ellipse cx="-26" cy="10" rx="7" ry="7" fill={FUR} />

          <g transform={`translate(-10 12) rotate(${hindLegRot})`}>
            <ellipse cx="0" cy="26" rx="13" ry="28" fill={FUR_DEEP} />
            <ellipse cx="8" cy="50" rx="16" ry="8" fill={FUR} />
          </g>

          <ellipse cx="2" cy="-46" rx="36" ry="58" fill={FUR} />
          <ellipse cx="14" cy="-44" rx="20" ry="42" fill={FUR_LIGHT} opacity="0.7" />

          <g transform={`translate(12 -18) rotate(${frontLegRot})`}>
            <ellipse cx="0" cy="22" rx="11" ry="24" fill={FUR} />
            <ellipse cx="7" cy="44" rx="14" ry="7" fill={FUR_LIGHT} />
          </g>
          <g transform={`translate(-2 -10) rotate(${frontLegRot * 0.85 + 8})`}>
            <ellipse cx="0" cy="20" rx="10" ry="22" fill={FUR_DEEP} />
            <ellipse cx="6" cy="40" rx="13" ry="6.5" fill={FUR} />
          </g>

          <g transform={`translate(10 -118) rotate(${headRot})`}>
            <g transform={`translate(-20 -36) rotate(${-16 + earIdle})`}>
              <path
                d="M0 8 C 14 0 18 -72 2 -108 C -14 -72 -12 0 0 8Z"
                fill={FUR}
              />
              <path
                d="M0 4 C 7 -2 8 -62 1 -92 C -7 -62 -6 -2 0 4Z"
                fill={INNER_EAR}
              />
            </g>
            <g transform={`translate(18 -40) rotate(${12 - earIdle * 0.6})`}>
              <path
                d="M0 8 C 12 -6 14 -68 0 -102 C -16 -70 -12 2 0 8Z"
                fill={FUR_DEEP}
              />
              <path
                d="M1 2 C 6 -6 6 -58 0 -86 C -7 -58 -6 -4 1 2Z"
                fill={INNER_EAR}
              />
            </g>

            <circle cx="0" cy="0" r="46" fill={FUR} />
            <ellipse cx="10" cy="10" rx="28" ry="24" fill={FUR_LIGHT} opacity="0.55" />

            <ellipse cx="-6" cy="18" rx="11" ry="7" fill={NOSE} opacity="0.28" />
            <ellipse cx="22" cy="16" rx="11" ry="7" fill={NOSE} opacity="0.28" />

            <ellipse cx="-4" cy="-2" rx="9" ry="11" fill="#f4f1ea" />
            <ellipse cx="20" cy="-4" rx="7.5" ry="9.5" fill="#f4f1ea" />
            <ellipse cx="-2.5" cy="-1" rx="5.2" ry="6.4" fill={EYE} />
            <ellipse cx="21" cy="-3" rx="4.4" ry="5.6" fill={EYE} />
            <circle cx="-0.6" cy="-3.2" r="1.7" fill="#f4f1ea" />
            <circle cx="22.6" cy="-5" r="1.4" fill="#f4f1ea" />

            <ellipse cx="12" cy="14" rx="7" ry="5.5" fill={NOSE} />
            <path
              d="M12 18 Q8 24 4 22"
              fill="none"
              stroke={EYE}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M12 18 Q16 24 20 22"
              fill="none"
              stroke={EYE}
              strokeWidth="1.6"
              strokeLinecap="round"
            />

            <line
              x1="22"
              y1="16"
              x2="52"
              y2="10"
              stroke={FUR_DEEP}
              strokeWidth="1"
              opacity="0.55"
            />
            <line
              x1="22"
              y1="18"
              x2="50"
              y2="20"
              stroke={FUR_DEEP}
              strokeWidth="1"
              opacity="0.45"
            />
            <line
              x1="20"
              y1="20"
              x2="48"
              y2="28"
              stroke={FUR_DEEP}
              strokeWidth="1"
              opacity="0.4"
            />
          </g>
        </g>
      </g>
    </svg>
  )
}
