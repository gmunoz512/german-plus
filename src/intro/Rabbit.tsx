import { useId } from 'react'

type RabbitProps = {
  lookX: number
  lookY: number
  now: number
  warpT: number
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function Rabbit({ lookX, lookY, now, warpT }: RabbitProps) {
  const rawId = useId()
  const id = `r${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  const lx = clamp(lookX, -1, 1)
  const ly = clamp(lookY, -1, 1)
  const breath = Math.sin(now / 940) * 1.5
  const earA = Math.sin(now / 760) * 2.8
  const earB = Math.sin(now / 880 + 0.8) * 2.2
  const cycle = now % 4000
  const blink =
    cycle > 3820 ? clamp(1 - Math.abs(cycle - 3910) / 90, 0, 1) : 0
  const absorb = clamp(warpT * 1.85, 0, 1)
  const lean = lx * 4.8

  return (
    <svg
      viewBox="40 20 400 500"
      className="block h-auto w-[min(78vw,22rem)] overflow-visible sm:w-[min(50vw,24rem)]"
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}-body`} cx="42%" cy="30%">
          <stop offset="0%" stopColor="#efeae3" />
          <stop offset="55%" stopColor="#d5cec5" />
          <stop offset="100%" stopColor="#b4aba1" />
        </radialGradient>
        <radialGradient id={`${id}-head`} cx="42%" cy="32%">
          <stop offset="0%" stopColor="#f7f3ee" />
          <stop offset="50%" stopColor="#e2dbd2" />
          <stop offset="100%" stopColor="#c3bab0" />
        </radialGradient>
        <radialGradient id={`${id}-ear`} cx="40%" cy="25%">
          <stop offset="0%" stopColor="#efe9e1" />
          <stop offset="100%" stopColor="#b9b0a6" />
        </radialGradient>
        <radialGradient id={`${id}-pink`} cx="50%" cy="40%">
          <stop offset="0%" stopColor="#fadfd8" />
          <stop offset="55%" stopColor="#f0b8ac" />
          <stop offset="100%" stopColor="#e3988c" />
        </radialGradient>
        <radialGradient id={`${id}-iris`} cx="36%" cy="34%">
          <stop offset="0%" stopColor="#e8ae58" />
          <stop offset="40%" stopColor="#c47a2e" />
          <stop offset="100%" stopColor="#4a2810" />
        </radialGradient>
        <radialGradient id={`${id}-belly`} cx="50%" cy="20%">
          <stop offset="0%" stopColor="#fffefb" />
          <stop offset="100%" stopColor="#efe6db" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.8" />
        </filter>
      </defs>

      <g
        opacity={1 - absorb}
        transform={`translate(236 ${340 + breath + absorb * 40}) rotate(${lean}) scale(${1 - absorb * 0.3})`}
      >
        <g transform="translate(-236 -340)">
          {/* upright ear */}
          <g transform={`translate(292 108) rotate(${16 + earB - ly * 2})`}>
            <path
              d="M0 70 C -28 58 -32 -10 -14 -88 C -4 -108 12 -108 20 -88 C 36 -10 28 58 0 70Z"
              fill="#c9c0b6"
              filter={`url(#${id}-soft)`}
              opacity="0.45"
            />
            <path
              d="M0 66 C -22 54 -26 -6 -10 -80 C -2 -96 12 -96 18 -80 C 30 -6 22 54 0 66Z"
              fill={`url(#${id}-ear)`}
            />
            <path
              d="M2 46 C -8 36 -10 -2 -2 -58 C 2 -68 10 -68 12 -58 C 16 -2 12 36 2 46Z"
              fill={`url(#${id}-pink)`}
            />
          </g>

          {/* tail */}
          <g transform="translate(148 400)">
            <ellipse
              cx="-2"
              cy="0"
              rx="26"
              ry="22"
              fill="#ddd6cd"
              filter={`url(#${id}-soft)`}
              opacity="0.55"
            />
            <ellipse cx="2" cy="2" rx="18" ry="16" fill="#f4f0ea" />
            <ellipse cx="-6" cy="-4" rx="8" ry="7" fill="#fff" />
          </g>

          {/* flopped ear — big, out to the left */}
          <g transform={`translate(148 178) rotate(${-62 + earA + lx * 3})`}>
            <path
              d="M4 72 C -40 50 -52 -20 -24 -96 C -8 -118 20 -116 34 -92 C 58 -18 44 52 4 72Z"
              fill="#c6bdb3"
              filter={`url(#${id}-soft)`}
              opacity="0.5"
            />
            <path
              d="M6 66 C -32 46 -42 -16 -18 -88 C -4 -106 20 -104 32 -84 C 52 -14 40 48 6 66Z"
              fill={`url(#${id}-ear)`}
            />
            <path
              d="M8 44 C -12 30 -16 -8 -4 -62 C 4 -76 16 -74 22 -58 C 30 -6 22 32 8 44Z"
              fill={`url(#${id}-pink)`}
            />
          </g>

          {/* body */}
          <ellipse
            cx="228"
            cy="378"
            rx="82"
            ry="102"
            fill="#c5bdb3"
            filter={`url(#${id}-soft)`}
            opacity="0.32"
          />
          <ellipse cx="232" cy="372" rx="70" ry="90" fill={`url(#${id}-body)`} />
          <ellipse cx="248" cy="392" rx="38" ry="58" fill={`url(#${id}-belly)`} />
          <ellipse
            cx="198"
            cy="356"
            rx="20"
            ry="34"
            fill="#a89f95"
            opacity="0.28"
          />

          {/* back foot */}
          <ellipse cx="188" cy="458" rx="20" ry="12" fill="#d2cbc2" />
          <ellipse cx="188" cy="462" rx="16" ry="7" fill="#efeae3" />
          {/* front foot */}
          <ellipse cx="258" cy="460" rx="18" ry="11" fill="#c8c0b6" />
          <ellipse cx="260" cy="463" rx="14" ry="6.5" fill="#ebe5dd" />

          {/* far arm */}
          <g transform={`translate(186 328) rotate(${-24 + ly * 5})`}>
            <ellipse cx="4" cy="20" rx="14" ry="30" fill="#d0c8be" />
            <ellipse cx="10" cy="48" rx="13" ry="11" fill="#e8e2da" />
          </g>

          {/* head */}
          <g
            transform={`translate(228 ${188 + ly * 2}) rotate(${lx * 5 + ly * 1.2})`}
          >
            <ellipse
              cx="2"
              cy="10"
              rx="96"
              ry="86"
              fill="#d8d1c8"
              filter={`url(#${id}-soft)`}
              opacity="0.38"
            />
            <ellipse cx="4" cy="8" rx="84" ry="76" fill={`url(#${id}-head)`} />
            <ellipse cx="-22" cy="-52" rx="20" ry="12" fill="#f3eee8" />
            <ellipse cx="18" cy="-58" rx="24" ry="14" fill="#f8f5f0" />
            <ellipse cx="48" cy="-42" rx="16" ry="11" fill="#e6dfd6" />
            <ellipse cx="-62" cy="20" rx="30" ry="26" fill="#f0ebe4" />
            <ellipse cx="68" cy="14" rx="28" ry="24" fill="#e8e1d8" />
            <ellipse
              cx="-54"
              cy="26"
              rx="14"
              ry="10"
              fill="#f4c9c0"
              opacity="0.32"
            />
            <ellipse
              cx="60"
              cy="20"
              rx="13"
              ry="9"
              fill="#f4c9c0"
              opacity="0.24"
            />
            <ellipse cx="10" cy="36" rx="38" ry="26" fill="#fbf8f4" />

            <path
              d="M-50 -6 Q-30 -22 -8 -8"
              fill="none"
              stroke="#b9b0a6"
              strokeWidth="4.4"
              strokeLinecap="round"
            />
            <path
              d="M26 -12 Q46 -26 64 -10"
              fill="none"
              stroke="#b9b0a6"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <Eye
              id={`${id}-el`}
              irisId={`${id}-iris`}
              x={-34}
              y={8}
              lookX={lx}
              lookY={ly}
              blink={blink}
              rx={24}
              ry={26.5}
              size={1}
            />
            <Eye
              id={`${id}-er`}
              irisId={`${id}-iris`}
              x={42}
              y={4}
              lookX={lx}
              lookY={ly}
              blink={blink}
              rx={21.5}
              ry={24}
              size={0.94}
            />

            <ellipse cx="12" cy="40" rx="9.5" ry="7" fill="#e6a9a1" />
            <ellipse cx="9" cy="38" rx="3.4" ry="2.3" fill="#f8d8d3" />
            <path
              d="M12 48 Q22 58 36 50"
              fill="none"
              stroke="#c49b94"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>

          {/* near arm holding stem */}
          <g transform={`translate(262 312) rotate(${8 - lx * 4})`}>
            <ellipse cx="6" cy="24" rx="15" ry="32" fill="#d8d1c8" />
            <ellipse cx="14" cy="52" rx="14" ry="12" fill="#f0ebe4" />
          </g>

          {/* dandelion — to the right of the face, not on the eye */}
          <g
            transform={`translate(${328 + lx * -5} ${236 + ly * -3}) rotate(${-14 - lx * 4})`}
          >
            <line
              x1="-6"
              y1="92"
              x2="10"
              y2="-8"
              stroke="#6a8a36"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            <g transform="translate(12 -18)">
              {Array.from({ length: 20 }, (_, i) => {
                const a = (i / 20) * Math.PI * 2 + 0.15
                const x2 = Math.cos(a) * 28
                const y2 = Math.sin(a) * 28
                return (
                  <g key={i}>
                    <line
                      x1={Math.cos(a) * 3}
                      y1={Math.sin(a) * 3}
                      x2={x2}
                      y2={y2}
                      stroke="#ded8cf"
                      strokeWidth="1.2"
                    />
                    <circle cx={x2} cy={y2} r="2.3" fill="#f7f4ee" />
                  </g>
                )
              })}
              <circle cx="0" cy="0" r="5" fill="#e4d39a" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

function Eye({
  id,
  irisId,
  x,
  y,
  lookX,
  lookY,
  blink,
  rx,
  ry,
  size,
}: {
  id: string
  irisId: string
  x: number
  y: number
  lookX: number
  lookY: number
  blink: number
  rx: number
  ry: number
  size: number
}) {
  const ox = lookX * 5.4
  const oy = lookY * 4.6
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${1 - blink * 0.92})`}>
      <clipPath id={id}>
        <ellipse cx="0" cy="0" rx={rx} ry={ry} />
      </clipPath>
      <ellipse cx="0" cy="2" rx={rx + 3} ry={ry + 2} fill="#c9b8a8" opacity="0.4" />
      <ellipse cx="0" cy="0" rx={rx} ry={ry} fill="#2f1c10" />
      <g clipPath={`url(#${id})`}>
        <ellipse
          cx={ox}
          cy={oy}
          rx={17 * size}
          ry={19 * size}
          fill={`url(#${irisId})`}
        />
        <ellipse
          cx={ox}
          cy={oy + 1}
          rx={8.4 * size}
          ry={10.2 * size}
          fill="#140a06"
        />
        <ellipse
          cx={ox - 6}
          cy={oy - 7.5}
          rx={6.2 * size}
          ry={8 * size}
          fill="#fff"
        />
        <circle
          cx={ox + 5}
          cy={oy + 4}
          r={2.2 * size}
          fill="#fff"
          opacity="0.8"
        />
      </g>
    </g>
  )
}
