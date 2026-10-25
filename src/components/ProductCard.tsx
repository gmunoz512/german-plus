import { ArrowUpRight, ExternalLink } from 'lucide-react'
import type { Product } from '../data/products'
import EyeToggle from './EyeToggle'
import StatusPill from './StatusPill'

const base = import.meta.env.BASE_URL
const smallLink = 'inline-flex items-center gap-1 text-fog hover:text-paper transition-colors duration-200'

type Props = { product: Product; open: boolean; onToggle: () => void }

export default function ProductCard({ product: p, open, onToggle }: Props) {
  const introText = <p className="text-sm leading-[1.55] text-body max-w-lg">{p.intro}</p>

  return (
    <li
      id={p.anchor ? p.id : undefined}
      className={p.anchor ? 'border-t border-line-soft scroll-mt-6' : 'border-t border-line-soft'}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="block w-[calc(100%+1.5rem)] text-left py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] whitespace-nowrap">{p.name}</h3>
          <StatusPill status={p.status} />
          <EyeToggle open={open} label={p.name} />
        </div>
        <p className="mt-2 text-base leading-[1.55] text-body max-w-xl">{p.summary}</p>
      </button>

      {open && (
        <div className="pb-6 -mx-3 px-3">
          <div className="rounded-2xl border border-line bg-ink-raised/50 px-5 py-5 sm:px-6">
            {p.icon ? (
              <div className="flex items-start gap-4">
                <img
                  src={`${base}${p.id}-icon.png`}
                  alt={`${p.name} app icon`}
                  width={56}
                  height={56}
                  loading="lazy"
                  className="size-14 shrink-0 rounded-[14px] border border-line"
                />
                {introText}
              </div>
            ) : (
              introText
            )}

            <div className="mt-5 space-y-0">
              {p.bits.map((b) => (
                <article
                  key={b.num}
                  className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-8 py-4 border-t border-line-soft first:border-t-0 first:pt-0"
                >
                  <span className="font-mono lowercase text-meta tracking-[0.15em] text-fog pt-1 tabular-nums">
                    {b.num}
                  </span>
                  <div>
                    <h4 className="text-base leading-[1.55] font-medium text-paper">{b.title}</h4>
                    <p className="mt-1.5 text-sm leading-[1.55] text-body max-w-xl">{b.body}</p>
                  </div>
                </article>
              ))}
            </div>

            {p.funFact && (
              <figure className="mt-5 border-l border-accent/60 pl-4">
                <p className="font-mono lowercase text-meta tracking-[0.15em] text-fog">{p.funFact.label}</p>
                <blockquote className="mt-1.5 text-base leading-[1.55] text-body max-w-lg">{p.funFact.quote}</blockquote>
                <figcaption className="mt-2 font-mono lowercase text-meta tracking-[0.15em] text-fog">
                  — {p.funFact.author}, <cite className="not-italic">{p.funFact.source}</cite>
                </figcaption>
              </figure>
            )}

            {p.cta && (
              <a
                href={p.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-paper-dim transition-colors duration-200"
              >
                {p.cta.label}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}

            {p.beta && (
              <>
                <p className="mt-5 text-sm leading-[1.55] text-body">
                  in testflight (beta) for now.{' '}
                  <a href={`mailto:gmunoz512@icloud.com?subject=${p.id}`} className="text-paper underline decoration-line underline-offset-4 hover:decoration-paper transition-colors duration-200">reach out</a>{' '}
                  if you want the app.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-5 text-sm">
                  <a href={`${base}${p.id}/privacy/`} className={smallLink}>
                    privacy
                    <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
                  </a>
                  <a href={`${base}${p.id}/support/`} className={smallLink}>
                    support
                    <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
                  </a>
                  <a href={p.beta.github} target="_blank" rel="noopener noreferrer" className={smallLink}>
                    github
                    <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
