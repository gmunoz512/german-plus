import type { MarkId } from './intro/frameGeometry'

const corners: MarkId[] = ['tl', 'tr', 'bl', 'br']
const ticks: MarkId[] = ['t', 'r', 'b', 'l']

/**
 * Hairline rounded frame pinned to the viewport (safe-area aware), black outside,
 * with + marks in the corners and small ticks at the edge midpoints on wider screens.
 * Same proportions as the frame on intergalactic scale.
 */
export default function SiteFrame() {
  return (
    <>
      <div className="site-frame-mask" data-frame-mask aria-hidden />
      <div className="site-frame" data-frame-box aria-hidden>
        {corners.map((id) => (
          <svg
            key={id}
            className={`frame-mark frame-mark-${id}`}
            data-frame-mark={id}
            width="11"
            height="11"
            viewBox="0 0 11 11"
          >
            <path d="M0.5 5.5H10.5M5.5 0.5V10.5" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        ))}
        {ticks.map((id) => (
          <span key={id} className={`frame-tick frame-tick-${id}`} data-frame-mark={id} />
        ))}
      </div>
    </>
  )
}
