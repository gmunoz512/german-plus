import { useState } from 'react'
import { ArrowUpRight, ChevronDown, ExternalLink } from 'lucide-react'
import RabbitIntro from './intro/RabbitIntro'
import { hasCompletedIntro } from './intro/storage'

const pillars = [
  {
    num: '01',
    title: 'hosts',
    body: 'short-term rental hosts who want guests to experience the neighborhood, not just occupy a unit. upsell local, deepen stays, keep trust close.',
  },
  {
    num: '02',
    title: 'vendors',
    body: 'restaurants, guides, and experience makers listed where demand already lives: next to the stay, with booking that does not feel bolted on.',
  },
  {
    num: '03',
    title: 'guests',
    body: 'guests who want a trip that feels composed, not crowded. discover, book, and wander with less friction and more taste.',
  },
  {
    num: '04',
    title: 'jc',
    body: 'an in-product trip planner. it reads preferences, inventory, and context, then proposes days that feel personal, not generic.',
  },
  {
    num: '05',
    title: 'trust & booking',
    body: 'one loop from discovery to confirmation. clear roles, clear handoffs, and a record everyone can stand behind.',
  },
]

const marsBits = [
  {
    num: '01',
    title: 'spin the globe',
    body: 'a full mars you can drag around. viking mosaic, valles facing you, no toy texture.',
  },
  {
    num: '02',
    title: 'birthday dive',
    body: 'type your full birthday and the camera drops you onto jezero looking up.',
  },
  {
    num: '03',
    title: 'night from mars',
    body: 'same iau constellations as earth, just oriented from the crater. phobos and deimos tagging along.',
  },
  {
    num: '04',
    title: 'real ground',
    body: 'perseverance mastcam-z photos underfoot. built for fun, with real nasa pixels.',
  },
]

function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide bg-accent-soft text-accent lowercase">
      {status}
    </span>
  )
}

export default function App() {
  const [stackdOpen, setStackdOpen] = useState(false)
  const [marsOpen, setMarsOpen] = useState(false)
  const [introDone, setIntroDone] = useState(hasCompletedIntro)

  return (
    <>
      {!introDone && (
        <RabbitIntro onComplete={() => setIntroDone(true)} />
      )}
      <div
        className="min-h-svh bg-ink text-mist lowercase"
        {...(!introDone ? { inert: true, 'aria-hidden': true } : {})}
      >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,165,116,0.06),_transparent_55%)]"
      />

      <div className="relative mx-auto w-full max-w-3xl md:max-w-6xl px-6 sm:px-8">
        <header className="flex items-center justify-between pt-6 pb-3 fade-up">
          <a href="#top" className="font-serif text-xl text-paper tracking-tight normal-case">
            gm
          </a>
          <nav className="flex items-center gap-5 text-sm text-fog">
            <a href="#products" className="hover:text-paper transition-colors duration-200">
              products
            </a>
            <a href="#thoughts" className="hover:text-paper transition-colors duration-200">
              thoughts
            </a>
            <a href="#for-fun" className="hover:text-paper transition-colors duration-200">
              fun builds
            </a>
          </nav>
        </header>

        <main id="top">
          <section className="pt-10 sm:pt-14 pb-8 sm:pb-10 border-b border-line-soft">
            <h1 className="fade-up fade-up-delay-1 font-serif text-[clamp(2.75rem,8vw,4.5rem)] leading-[1.05] tracking-tight text-paper text-balance normal-case">
              german+
            </h1>
            <div className="fade-up fade-up-delay-2 mt-4 flex flex-wrap items-center gap-4">
              <a
                href="https://www.linkedin.com/in/g-mu%C3%B1oz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-fog hover:text-paper transition-colors duration-200"
              >
                linkedin
                <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
              </a>
              <a
                href="https://github.com/gmunoz512"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-fog hover:text-paper transition-colors duration-200"
              >
                github
                <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
              </a>
            </div>
          </section>

          <div className="md:grid md:grid-cols-2 md:gap-x-12 md:items-start md:[grid-template-areas:'about_products'_'thoughts_fun']">
          <section id="about" className="md:[grid-area:about] py-10 sm:py-12 border-b border-line-soft md:border-b-0">
            <h2 className="font-serif text-3xl sm:text-4xl text-paper tracking-tight text-balance">
              about
            </h2>
            <div className="mt-4 space-y-4 max-w-xl text-[15px] sm:text-base leading-relaxed text-fog">
              <p>
                i want to eventually bring everything that&apos;s in my head to
                reality. usually i approach everything from first principles,
                breaking things down to a fundamental level.
              </p>
              <p>
                i believe it stemmed from my dad letting me tinker with broken
                washer machines at his laundromat: taking them apart and putting
                them back together to see what was wrong. eventually i
                translated that way of thinking to my work: understanding
                processes at a fundamental level, then building a more efficient
                one to make things smoother. i quantified each idea to decide
                whether it was worth it.
              </p>
              <p>
                on the other hand, i felt the creative itch to scratch,
                following things i was interested in learning about, like space
                and economics. hopefully this is a place for you to get a slice
                of how my brain works.
              </p>
            </div>
          </section>

          <section id="products" className="md:[grid-area:products] py-10 sm:py-12 border-b border-line-soft md:border-b-0 md:border-l md:border-line-soft md:pl-10">
            <h2 className="font-serif text-3xl sm:text-4xl text-paper tracking-tight text-balance">
              products
            </h2>
            <p className="mt-3 max-w-lg text-fog">
              my rabbit holes
            </p>

            <ul className="mt-6 space-y-0">
              <li className="border-t border-line-soft">
                <button
                  type="button"
                  aria-expanded={stackdOpen}
                  onClick={() => setStackdOpen((o) => !o)}
                  className="w-full text-left py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-medium text-paper">stackd</h3>
                    <span className="text-xs text-fog tracking-wider">
                      marketplace
                    </span>
                    <StatusPill status="draft live" />
                    <ChevronDown
                      className={`ml-auto size-4 text-fog transition-transform duration-200 ${
                        stackdOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-fog max-w-xl">
                    three-sided marketplace for str hosts, local experience and
                    restaurant vendors, and guests, with jc, the trip planner,
                    built in.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-accent">
                    {stackdOpen ? "hide what i'm building" : "what i'm building"}
                    <ChevronDown
                      className={`size-3.5 transition-transform duration-200 ${
                        stackdOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </span>
                </button>

                {stackdOpen && (
                  <div className="pb-6 -mx-3 px-3">
                    <div className="rounded-2xl border border-line bg-ink-raised/50 px-5 py-5 sm:px-6">
                      <p className="text-sm text-fog max-w-lg">
                        one marketplace. three sides. an agent that plans inside
                        it, not beside it.
                      </p>
                      <div className="mt-5 space-y-0">
                        {pillars.map((p) => (
                          <article
                            key={p.num}
                            className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-8 py-4 border-t border-line-soft first:border-t-0 first:pt-0"
                          >
                            <span className="font-mono text-xs text-fog pt-1 tabular-nums normal-case">
                              {p.num}
                            </span>
                            <div>
                              <h4 className="text-base font-medium text-paper">
                                {p.title}
                              </h4>
                              <p className="mt-1.5 text-[14px] leading-relaxed text-fog max-w-xl">
                                {p.body}
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                      <a
                        href="https://stackddraft.lovable.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-paper-dim transition-colors duration-200"
                      >
                        open stackd draft
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </div>
                  </div>
                )}
              </li>

              <li className="border-t border-line-soft">
                <button
                  type="button"
                  aria-expanded={marsOpen}
                  onClick={() => setMarsOpen((o) => !o)}
                  className="w-full text-left py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-medium text-paper">mars</h3>
                    <span className="text-xs text-fog tracking-wider">
                      birthday in mars
                    </span>
                    <StatusPill status="live" />
                    <ChevronDown
                      className={`ml-auto size-4 text-fog transition-transform duration-200 ${
                        marsOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-fog max-w-xl">
                    a weekend toy: spin mars, drop your birthday, stand on
                    jezero and look up. no pitch deck energy.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-accent">
                    {marsOpen ? 'hide the fun bits' : 'peek the fun bits'}
                    <ChevronDown
                      className={`size-3.5 transition-transform duration-200 ${
                        marsOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </span>
                </button>

                {marsOpen && (
                  <div className="pb-6 -mx-3 px-3">
                    <div className="rounded-2xl border border-line bg-ink-raised/50 px-5 py-5 sm:px-6">
                      <p className="text-sm text-fog max-w-lg">
                        built for fun. real nasa pixels. your birthday, from
                        another planet.
                      </p>
                      <div className="mt-5 space-y-0">
                        {marsBits.map((p) => (
                          <article
                            key={p.num}
                            className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-8 py-4 border-t border-line-soft first:border-t-0 first:pt-0"
                          >
                            <span className="font-mono text-xs text-fog pt-1 tabular-nums normal-case">
                              {p.num}
                            </span>
                            <div>
                              <h4 className="text-base font-medium text-paper">
                                {p.title}
                              </h4>
                              <p className="mt-1.5 text-[14px] leading-relaxed text-fog max-w-xl">
                                {p.body}
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                      <a
                        href="https://gmunoz512.github.io/mars-sky/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-paper-dim transition-colors duration-200"
                      >
                        open birthday in mars
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </section>

          <section id="for-fun" className="md:[grid-area:fun] py-10 sm:py-12 border-b border-line-soft md:border-b-0 md:border-l md:border-line-soft md:pl-10 md:pt-0">
            <h2 className="font-serif text-3xl sm:text-4xl text-paper tracking-tight text-balance">
              fun builds: github
            </h2>
            <p className="mt-3 max-w-lg text-fog">
              weekend builds, side quests, and interest.. more soon
            </p>

            <ul className="mt-6 space-y-0 border-t border-line-soft">
              <li className="border-b border-line-soft">
                <a
                  href="https://github.com/gmunoz512/stackbnb-60920"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <span className="text-lg font-medium text-paper group-hover:text-accent transition-colors">
                    stackd
                  </span>
                  <ArrowUpRight className="size-4 text-fog group-hover:text-accent transition-colors" aria-hidden />
                </a>
              </li>
              <li className="border-b border-line-soft">
                <a
                  href="https://github.com/gmunoz512/mars-sky"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <span className="text-lg font-medium text-paper group-hover:text-accent transition-colors">
                    birthday in mars
                  </span>
                  <ArrowUpRight className="size-4 text-fog group-hover:text-accent transition-colors" aria-hidden />
                </a>
              </li>
            </ul>
          </section>

          <section id="thoughts" className="md:[grid-area:thoughts] py-10 sm:py-12 border-b border-line-soft md:border-b-0 md:pt-0">
            <h2 className="font-serif text-3xl sm:text-4xl text-paper tracking-tight text-balance">
              behind the veil
            </h2>
            <p className="mt-3 max-w-lg text-fog">
              short writings from building to thoughts on the future of ai
            </p>

            <div className="mt-6 rounded-2xl border border-dashed border-line bg-transparent px-6 py-8 sm:px-8">
              <p className="text-[15px] leading-relaxed text-fog max-w-md">
                nothing published yet. first ones will show up here as the
                draft hardens.
              </p>
              <p className="mt-4 text-xs tracking-[0.18em] text-fog/80">
                coming soon
              </p>
            </div>
          </section>
          </div>
        </main>

        <footer className="py-8 sm:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-serif text-lg text-paper normal-case">german+</p>
            <p className="mt-1 text-sm text-fog">new york · building</p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href="https://www.linkedin.com/in/g-mu%C3%B1oz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-fog hover:text-paper transition-colors duration-200"
            >
              linkedin
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
            <a
              href="https://github.com/gmunoz512"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-fog hover:text-paper transition-colors duration-200"
            >
              github
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          </div>
        </footer>
      </div>
    </div>
    </>
  )
}
