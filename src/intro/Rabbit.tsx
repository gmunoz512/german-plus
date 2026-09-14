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
  const breath = Math.sin(now / 920) * 1.4
  const earTwitch = Math.sin(now / 740) * 3.2
  const earTwitchB = Math.sin(now / 810 + 1.2) * 2.2
  const blinkCycle = now % 3800
  const blink =
    blinkCycle > 3620
      ? clamp(1 - Math.abs(blinkCycle - 3710) / 90, 0, 1)
      : 0
  const absorb = clamp(warpT * 1.8, 0, 1)
  const lean = lx * 5.5
  const headTurn = lx * 4.5 + ly * 1.5

  return (
    <svg
      viewBox="0 0 440 560"
      className="block h-auto w-[min(70vw,20rem)] overflow-visible sm:w-[min(46vw,22rem)]"
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}-body`} cx="38%" cy="28%">
          <stop offset="0%" stopColor="#f3efe9" />
          <stop offset="45%" stopColor="#d8d1c8" />
          <stop offset="100%" stopColor="#b7aea4" />
        </radialGradient>
        <radialGradient id={`${id}-head`} cx="40%" cy="30%">
          <stop offset="0%" stopColor="#f6f2ec" />
          <stop offset="55%" stopColor="#ddd6cd" />
          <stop offset="100%" stopColor="#c0b7ad" />
        </radialGradient>
        <radialGradient id={`${id}-ear`} cx="40%" cy="30%">
          <stop offset="0%" stopColor="#e7e1d8" />
          <stop offset="100%" stopColor="#b9b0a6" />
        </radialGradient>
        <radialGradient id={`${id}-pink`} cx="45%" cy="40%">
          <stop offset="0%" stopColor="#f8d5cc" />
          <stop offset="70%" stopColor="#f0b7ab" />
          <stop offset="100%" stopColor="#e59b8e" />
        </radialGradient>
        <radialGradient id={`${id}-iris`} cx="38%" cy="35%">
          <stop offset="0%" stopColor="#e0a04a" />
          <stop offset="45%" stopColor="#b56a28" />
          <stop offset="100%" stopColor="#4c2a12" />
        </radialGradient>
        <radialGradient id={`${id}-belly`} cx="50%" cy="30%">
          <stop offset="0%" stopColor="#fffdf9" />
          <stop offset="100%" stopColor="#efe8df" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <ellipse
        cx="222"
        cy="528"
        rx="92"
        ry="11"
        fill="#1a1a1a"
        opacity={0.08 * (1 - absorb)}
      />

      <g
        opacity={1 - absorb}
        transform={`translate(220 ${318 + breath + absorb * 36}) rotate(${lean}) scale(${1 - absorb * 0.28})`}
      >
        <g transform="translate(-220 -318)">
          {/* back ear (upright) */}
          <g transform={`translate(268 86) rotate(${12 + earTwitchB - ly * 3})`}>
            <ellipse
              cx="0"
              cy="-2"
              rx="26"
              ry="78"
              fill="#c9c1b7"
              filter={`url(#${id}-soft)`}
              opacity="0.45"
            />
            <ellipse cx="0" cy="0" rx="22" ry="74" fill={`url(#${id}-ear)`} />
            <ellipse cx="1" cy="6" rx="11" ry="52" fill={`url(#${id}-pink)`} />
            <FluffArc />
          </g>

          {/* tail */}
          <g transform="translate(128 392)">
            <ellipse
              cx="0"
              cy="0"
              rx="28"
              ry="24"
              fill="#efeae3"
              filter={`url(#${id}-soft)`}
              opacity="0.7"
            />
            <ellipse cx="4" cy="2" rx="20" ry="18" fill="#f6f2ec" />
            <ellipse cx="-6" cy="-4" rx="10" ry="9" fill="#fff" opacity="0.8" />
            <ellipse cx="10" cy="8" rx="8" ry="7" fill="#ddd6cd" />
          </g>

          {/* body */}
          <ellipse
            cx="214"
            cy="372"
            rx="86"
            ry="108"
            fill="#c8c0b6"
            filter={`url(#${id}-soft)`}
            opacity="0.35"
          />
          <ellipse cx="218" cy="368" rx="74" ry="96" fill={`url(#${id}-body)`} />
          <ellipse
            cx="236"
            cy="386"
            rx="42"
            ry="62"
            fill={`url(#${id}-belly)`}
          />
          <ellipse
            cx="188"
            cy="350"
            rx="22"
            ry="36"
            fill="#b7aea4"
            opacity="0.35"
          />

          {/* tufts on chest / hips */}
          <ellipse cx="176" cy="400" rx="14" ry="10" fill="#e8e2da" />
          <ellipse cx="262" cy="408" rx="12" ry="9" fill="#d0c8be" />
          <ellipse cx="198" cy="430" rx="16" ry="9" fill="#ece6de" />

          {/* feet */}
          <g transform="translate(176 458)">
            <ellipse cx="0" cy="0" rx="22" ry="14" fill="#d8d1c8" />
            <ellipse cx="-2" cy="4" rx="18" ry="9" fill="#efeae3" />
            <path
              d="M-12 8 L-14 14 M-2 10 L-2 16 M8 8 L10 14"
              stroke="#cbbfb2"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
          <g transform="translate(250 460)">
            <ellipse cx="0" cy="0" rx="20" ry="13" fill="#cfc7bd" />
            <ellipse cx="2" cy="4" rx="16" ry="8" fill="#e9e3db" />
            <path
              d="M-8 8 L-10 13 M2 10 L2 15 M11 7 L13 13"
              stroke="#cbbfb2"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>

          {/* flopped ear (big, behind cheek) */}
          <g
            transform={`translate(132 168) rotate(${-58 + earTwitch + lx * 4})`}
          >
            <ellipse
              cx="-4"
              cy="4"
              rx="38"
              ry="84"
              fill="#c4bbb1"
              filter={`url(#${id}-soft)`}
              opacity="0.5"
            />
            <ellipse cx="0" cy="0" rx="32" ry="78" fill={`url(#${id}-ear)`} />
            <ellipse cx="2" cy="8" rx="16" ry="54" fill={`url(#${id}-pink)`} />
            <ellipse cx="-18" cy="-20" rx="8" ry="12" fill="#e4ddd4" />
            <ellipse cx="18" cy="-8" rx="7" ry="14" fill="#d0c8be" />
            <ellipse cx="-12" cy="28" rx="9" ry="11" fill="#ece6de" />
            <ellipse cx="16" cy="22" rx="8" ry="13" fill="#ddd5cb" />
            <ellipse cx="0" cy="-62" rx="14" ry="10" fill="#e8e2da" />
          </g>

          {/* far arm */}
          <g transform={`translate(168 338) rotate(${-18 + lx * 6 + ly * 4})`}>
            <ellipse cx="0" cy="18" rx="16" ry="32" fill="#d2cac0" />
            <ellipse cx="2" cy="46" rx="14" ry="12" fill="#e8e2da" />
          </g>

          {/* head */}
          <g
            transform={`translate(222 ${198 + ly * 2}) rotate(${headTurn})`}
          >
            <ellipse
              cx="0"
              cy="8"
              rx="92"
              ry="84"
              fill="#d4cdc4"
              filter={`url(#${id}-soft)`}
              opacity="0.4"
            />
            <ellipse cx="2" cy="6" rx="80" ry="74" fill={`url(#${id}-head)`} />
            {/* crown tufts */}
            <ellipse cx="-28" cy="-54" rx="18" ry="12" fill="#ece6de" />
            <ellipse cx="8" cy="-62" rx="22" ry="14" fill="#f3eee8" />
            <ellipse cx="36" cy="-50" rx="16" ry="11" fill="#e0d9d0" />
            {/* cheeks */}
            <ellipse cx="-58" cy="22" rx="28" ry="24" fill="#eee8e1" />
            <ellipse cx="62" cy="16" rx="26" ry="22" fill="#e6dfd6" />
            <ellipse
              cx="-52"
              cy="28"
              rx="14"
              ry="10"
              fill="#f3c9c0"
              opacity="0.35"
            />
            <ellipse
              cx="56"
              cy="22"
              rx="13"
              ry="9"
              fill="#f3c9c0"
              opacity="0.28"
            />
            {/* muzzle */}
            <ellipse cx="8" cy="32" rx="36" ry="24" fill="#f7f3ee" />

            {/* brows */}
            <path
              d="M-46 -8 Q-28 -22 -8 -10"
              fill="none"
              stroke="#b7aea4"
              strokeWidth="4.2"
              strokeLinecap="round"
            />
            <path
              d="M22 -14 Q42 -26 58 -12"
              fill="none"
              stroke="#b7aea4"
              strokeWidth="3.8"
              strokeLinecap="round"
            />

            <Eye
              irisId={`${id}-iris`}
              x={-32}
              y={8}
              lookX={lx}
              lookY={ly}
              blink={blink}
              rx={23}
              ry={25.5}
              size={1}
            />
            <Eye
              irisId={`${id}-iris`}
              x={40}
              y={4}
              lookX={lx}
              lookY={ly}
              blink={blink}
              rx={20.5}
              ry={23}
              size={0.92}
            />

            {/* nose */}
            <ellipse cx="10" cy="38" rx="9" ry="6.5" fill="#e7b0a8" />
            <ellipse cx="8" cy="36" rx="3.2" ry="2.2" fill="#f6d7d2" />
            {/* smile */}
            <path
              d="M10 45 Q18 54 30 48"
              fill="none"
              stroke="#c9a39c"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
          </g>

          {/* near arm + dandelion */}
          <g transform={`translate(248 318) rotate(${12 + lx * -5})`}>
            <ellipse cx="8" cy="22" rx="17" ry="34" fill="#dcd5cc" />
            <ellipse cx="16" cy="50" rx="15" ry="13" fill="#efeae3" />
            <path
              d="M10 56 L8 62 M18 58 L20 64 M24 54 L28 60"
              stroke="#d2c6b8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>

          <g
            transform={`translate(${292 + lx * -6} ${268 + ly * -4}) rotate(${-8 + lx * -3})`}
          >
            <line
              x1="0"
              y1="48"
              x2="18"
              y2="-38"
              stroke="#6f8f3a"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <g transform="translate(20 -48)">
              <circle cx="0" cy="0" r="22" fill="#f4f1ea" opacity="0.55" />
              {Array.from({ length: 18 }, (_, i) => {
                const a = (i / 18) * Math.PI * 2
                const x2 = Math.cos(a) * 26
                const y2 = Math.sin(a) * 26
                return (
                  <g key={i}>
                    <line
                      x1={Math.cos(a) * 4}
                      y1={Math.sin(a) * 4}
                      x2={x2}
                      y2={y2}
                      stroke="#e8e4dc"
                      strokeWidth="1.15"
                    />
                    <circle
                      cx={x2}
                      cy={y2}
                      r="2.1"
                      fill="#f7f4ee"
                      stroke="#ddd6cc"
                      strokeWidth="0.4"
                    />
                  </g>
                )
              })}
              <circle cx="0" cy="0" r="4.5" fill="#e6d7a8" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

function Eye({
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
  const ox = lookX * 5.2
  const oy = lookY * 4.4
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${1 - blink * 0.92})`}>
      <ellipse
        cx="0"
        cy="0"
        rx={rx + 2}
        ry={ry + 2}
        fill="#8a7f74"
        opacity="0.35"
      />
      <ellipse cx="0" cy="0" rx={rx} ry={ry} fill="#3a2414" />
      <ellipse
        cx={ox}
        cy={oy}
        rx={16 * size}
        ry={18 * size}
        fill={`url(#${irisId})`}
      />
      <ellipse
        cx={ox + 0.5}
        cy={oy + 1}
        rx={8.2 * size}
        ry={10 * size}
        fill="#1a0e08"
      />
      <ellipse
        cx={ox - 5.5}
        cy={oy - 7}
        rx={5.8 * size}
        ry={7.4 * size}
        fill="#fff"
        opacity="0.95"
      />
      <circle
        cx={ox + 4.5}
        cy={oy + 3.5}
        r={2.1 * size}
        fill="#fff"
        opacity="0.75"
      />
    </g>
  )
}

function FluffArc() {
  return (
    <g fill="#e4ddd4">
      <ellipse cx="-14" cy="-40" rx="7" ry="10" />
      <ellipse cx="14" cy="-36" rx="6" ry="11" />
      <ellipse cx="0" cy="-68" rx="10" ry="8" />
      <ellipse cx="-10" cy="20" rx="6" ry="8" />
      <ellipse cx="12" cy="16" rx="6" ry="9" />
    </g>
  )
}
