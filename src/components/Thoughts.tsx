import { Markdown, inline } from '../Markdown'
import { essays } from '../essays'
import EyeToggle from './EyeToggle'
import SectionHeading from './SectionHeading'

type Props = {
  openEssay: string | null
  onToggle: (id: string) => void
}

export default function Thoughts({ openEssay, onToggle }: Props) {
  return (
    <section id="thoughts" className="md:[grid-area:thoughts] py-10 sm:py-12 border-b border-line-soft md:border-b-0 md:pt-0">
      <SectionHeading title="behind the veil" subtitle="short writings" />
      <ul className="mt-6 space-y-0">
        {essays.map((essay) => {
          const isOpen = openEssay === essay.id
          return (
            <li key={essay.id} className="border-t border-line-soft">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => onToggle(essay.id)}
                className="block w-[calc(100%+1.5rem)] text-left py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-start gap-3">
                  <h3 className="font-mono lowercase text-title tracking-[0.15em] font-normal leading-[1.4] text-paper text-pretty">
                    {essay.title}
                  </h3>
                  <EyeToggle open={isOpen} label={essay.title} />
                </div>
                <p className="mt-1 font-mono lowercase text-meta tracking-[0.15em] text-fog whitespace-nowrap">{essay.date}</p>
                {!isOpen && (
                  <p className="mt-2 text-base leading-[1.55] text-body max-w-xl">
                    {inline(essay.paragraphs[0])}
                  </p>
                )}
              </button>

              {isOpen && (
                <div className="pb-6 -mx-3 px-3">
                  <article className="rounded-2xl border border-line bg-ink-raised/50 px-5 py-5 sm:px-6">
                    <div data-essay-body className="space-y-4 max-w-xl text-base leading-[1.55] text-body">
                      {essay.markdown ? (
                        <Markdown source={essay.markdown} />
                      ) : (
                        essay.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))
                      )}
                    </div>
                  </article>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
