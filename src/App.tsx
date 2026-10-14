import { useCallback, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { Markdown, inline } from './Markdown'
import { essays } from './essays'
import EssayProgress from './EssayProgress'
import PortalIntro from './intro/PortalIntro'
import { shouldPlayIntro } from './intro/storage'
import SiteFrame from './SiteFrame'

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

const scaleBits = [
  {
    num: '01',
    title: 'true scale',
    body: 'ceres to the observable universe, 48 stops. each one sits next to the last at real relative size.',
  },
  {
    num: '02',
    title: 'drag it around',
    body: 'spin planets, stars, galaxies and nebulae in 3d. flares rise and sink back into the hottest stars.',
  },
  {
    num: '03',
    title: 'real pixels',
    body: 'hubble, webb and eso images where they exist, hand-built renders where they don\'t.',
  },
  {
    num: '04',
    title: 'still growing',
    body: 'the last slide slowly expands, because the universe does too.',
  },
]

const empsizeBits = [
  {
    num: '01',
    title: 'safari and chrome',
    body: 'works in safari on iphone, ipad and mac, plus chrome.',
  },
  {
    num: '02',
    title: 'one big switch',
    body: 'tap the icon, flip it on for the site you are on.',
  },
  {
    num: '03',
    title: 'tune the bold',
    body: 'choose how much of each word gets bolded.',
  },
  {
    num: '04',
    title: 'stays out of the way',
    body: 'leaves code, inputs and links alone. no tracking, no network.',
  },
]

const safekeepBits = [
  {
    num: '01',
    title: 'press and hold',
    body: 'the voice note lives inside a live photo copy of your picture. hold the photo, hear the moment.',
  },
  {
    num: '02',
    title: 'from messages',
    body: 'an imessage app: copy a voice note in the thread, add it to a photo without leaving the chat.',
  },
  {
    num: '03',
    title: 'from voice memos',
    body: 'share a memo to safekeep and pick the photo it belongs to.',
  },
  {
    num: '04',
    title: 'original untouched',
    body: 'your original photo is never changed. safekeep only saves a new copy.',
  },
]

function EyeToggle({ open, label }: { open: boolean; label: string }) {
  return (
    <span className="ml-auto -my-[6px] -mr-[6px] shrink-0 inline-flex size-8 items-center justify-center rounded-full text-fog transition-colors duration-200 group-hover:text-mist group-hover:bg-paper/5 group-active:bg-paper/10">
      <span className="sr-only">{open ? `less about ${label}` : `more about ${label}`}</span>
      {open ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-meta font-medium tracking-wide border border-line text-fog lowercase">
      {status}
    </span>
  )
}

export default function App() {
  const [stackdOpen, setStackdOpen] = useState(false)
  const [marsOpen, setMarsOpen] = useState(false)
  const [scaleOpen, setScaleOpen] = useState(false)
  const [safekeepOpen, setSafekeepOpen] = useState(false)
  const [empsizeOpen, setEmpsizeOpen] = useState(false)
  const [openEssay, setOpenEssay] = useState<string | null>(null)
  const [playIntro] = useState(shouldPlayIntro)
  const [intro, setIntro] = useState<'playing' | 'interactive' | 'done'>(() =>
    playIntro ? 'playing' : 'done',
  )
  const [introSkipped, setIntroSkipped] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const onIntroInteractive = useCallback(() => setIntro('interactive'), [])
  const onIntroComplete = useCallback((skipped: boolean) => {
    setIntroSkipped(skipped)
    setIntro('done')
  }, [])
  // the css entrance only when the intro isn't choreographing the page itself
  const fadeUp = (delay = '') => (playIntro ? '' : `fade-up ${delay}`)

  return (
    <>
      {intro !== 'done' && (
        <PortalIntro
          pageRef={pageRef}
          onInteractive={onIntroInteractive}
          onComplete={onIntroComplete}
        />
      )}
    <div
      ref={pageRef}
      className={`framed-page min-h-svh bg-ink text-mist lowercase ${
        intro !== 'done' ? 'intro-pending' : ''
      } ${introSkipped ? 'intro-skipped' : ''}`}
      {...(intro === 'playing' ? { inert: true, 'aria-hidden': true } : {})}
    >
      <SiteFrame />
      {openEssay ? <EssayProgress key={openEssay} /> : null}
      <div
        aria-hidden
        data-reveal="0"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,184,103,0.13),_transparent_55%)]"
      />

      <div className="relative mx-auto w-full max-w-3xl md:max-w-6xl px-6 sm:px-8">
        <header data-reveal="0" className={`flex items-center justify-between pt-6 pb-3 ${fadeUp()}`}>
          <a href="#top" className="font-serif text-xl text-paper tracking-tight normal-case">
            gm
          </a>
          <nav className="flex items-center gap-5 text-sm text-fog font-sans">
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
          <section data-hero className="pt-10 sm:pt-14 pb-8 sm:pb-10 border-b border-line-soft">
            <h1 className={`${fadeUp('fade-up-delay-1')} font-serif text-display leading-[1.05] tracking-tight text-paper text-balance normal-case`}>
              <span data-reveal="1" className="inline-block">german</span>
              <span data-intro-plus className="text-accent">+</span>
            </h1>
            <div data-reveal="2" className={`${fadeUp('fade-up-delay-2')} mt-4 flex flex-wrap items-center gap-4`}>
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

          <div data-reveal="3" className="md:grid md:grid-cols-2 md:gap-x-12 md:items-start md:[grid-template-areas:'about_products'_'thoughts_fun']">
          <section id="about" className="md:[grid-area:about] py-10 sm:py-12 border-b border-line-soft md:border-b-0">
            <h2 className="font-serif text-heading leading-[1.15] text-paper tracking-tight text-balance">
              about
            </h2>
            <div className="mt-4 space-y-4 max-w-xl text-base leading-[1.55] text-body">
              <p>
                i want to eventually bring everything in my head into reality. my default is first principles: strip a problem down to its fundamentals and rebuild from there.
              </p>
              <p>
                i think that instinct started at my dad&apos;s laundromat, where he let me tinker with broken washing machines, taking them apart and piecing them back together to diagnose what went wrong. over time that became how i work: understand a process at its most granular level, then engineer a leaner one that runs smoother. before committing to an idea, i quantify it to see whether it&apos;s actually worth pursuing.
              </p>
              <p>
                the other half of me has a creative itch i can&apos;t ignore, so i chase whatever i&apos;m curious about, from space to economics. hopefully this is a place where you get a glimpse of how my brain works.
              </p>
            </div>
          </section>

          <section id="products" className="md:[grid-area:products] py-10 sm:py-12 border-b border-line-soft md:border-b-0 md:border-l md:border-line-soft md:pl-10">
            <h2 className="font-serif text-heading leading-[1.15] text-paper tracking-tight text-balance">
              products
            </h2>
            <p className="mt-3 max-w-lg font-mono lowercase text-meta tracking-[0.15em] text-fog">
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
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] whitespace-nowrap">stackd</h3>
                    <StatusPill status="draft live" />
                    <EyeToggle open={stackdOpen} label="stackd" />
                  </div>
                  <p className="mt-2 text-base leading-[1.55] text-body max-w-xl">
                    three-sided marketplace for str hosts, local experience and
                    restaurant vendors, and guests, with jc, the trip planner,
                    built in.
                  </p>
                </button>

                {stackdOpen && (
                  <div className="pb-6 -mx-3 px-3">
                    <div className="rounded-2xl border border-line bg-ink-raised/50 px-5 py-5 sm:px-6">
                      <p className="text-sm leading-[1.55] text-body max-w-lg">
                        one marketplace. three sides. an agent that plans inside
                        it, not beside it.
                      </p>
                      <div className="mt-5 space-y-0">
                        {pillars.map((p) => (
                          <article
                            key={p.num}
                            className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-8 py-4 border-t border-line-soft first:border-t-0 first:pt-0"
                          >
                            <span className="font-mono lowercase text-meta tracking-[0.15em] text-fog pt-1 tabular-nums">
                              {p.num}
                            </span>
                            <div>
                              <h4 className="text-base leading-[1.55] font-medium text-paper">
                                {p.title}
                              </h4>
                              <p className="mt-1.5 text-sm leading-[1.55] text-body max-w-xl">
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
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] whitespace-nowrap">mars</h3>
                    <StatusPill status="live" />
                    <EyeToggle open={marsOpen} label="mars" />
                  </div>
                  <p className="mt-2 text-base leading-[1.55] text-body max-w-xl">
                    a weekend toy: spin mars, drop your birthday, stand on
                    jezero and look up. no pitch deck energy.
                  </p>
                </button>

                {marsOpen && (
                  <div className="pb-6 -mx-3 px-3">
                    <div className="rounded-2xl border border-line bg-ink-raised/50 px-5 py-5 sm:px-6">
                      <p className="text-sm leading-[1.55] text-body max-w-lg">
                        built for fun. real nasa pixels. your birthday, from
                        another planet.
                      </p>
                      <div className="mt-5 space-y-0">
                        {marsBits.map((p) => (
                          <article
                            key={p.num}
                            className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-8 py-4 border-t border-line-soft first:border-t-0 first:pt-0"
                          >
                            <span className="font-mono lowercase text-meta tracking-[0.15em] text-fog pt-1 tabular-nums">
                              {p.num}
                            </span>
                            <div>
                              <h4 className="text-base leading-[1.55] font-medium text-paper">
                                {p.title}
                              </h4>
                              <p className="mt-1.5 text-sm leading-[1.55] text-body max-w-xl">
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
              <li className="border-t border-line-soft">
                <button
                  type="button"
                  aria-expanded={scaleOpen}
                  onClick={() => setScaleOpen((o) => !o)}
                  className="w-full text-left py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] whitespace-nowrap">intergalactic scale</h3>
                    <StatusPill status="live" />
                    <EyeToggle open={scaleOpen} label="intergalactic scale" />
                  </div>
                  <p className="mt-2 text-base leading-[1.55] text-body max-w-xl">
                    swipe from a dwarf planet to the edge of the observable
                    universe, one object at a time, all at true scale.
                  </p>
                </button>

                {scaleOpen && (
                  <div className="pb-6 -mx-3 px-3">
                    <div className="rounded-2xl border border-line bg-ink-raised/50 px-5 py-5 sm:px-6">
                      <p className="text-sm leading-[1.55] text-body max-w-lg">
                        a slideshow of space, smallest to biggest. each slide puts
                        one object next to the one before it at true size, from a
                        dwarf planet up to the whole observable universe, so you
                        can actually feel how big things get.
                      </p>
                      <div className="mt-5 space-y-0">
                        {scaleBits.map((p) => (
                          <article
                            key={p.num}
                            className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-8 py-4 border-t border-line-soft first:border-t-0 first:pt-0"
                          >
                            <span className="font-mono lowercase text-meta tracking-[0.15em] text-fog pt-1 tabular-nums">
                              {p.num}
                            </span>
                            <div>
                              <h4 className="text-base leading-[1.55] font-medium text-paper">
                                {p.title}
                              </h4>
                              <p className="mt-1.5 text-sm leading-[1.55] text-body max-w-xl">
                                {p.body}
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                      <figure className="mt-5 border-l border-accent/60 pl-4">
                        <p className="font-mono lowercase text-meta tracking-[0.15em] text-fog">fun fact</p>
                        <blockquote className="mt-1.5 text-base leading-[1.55] text-body max-w-lg">
                          “if the sun were the size of a hot tub, earth would be
                          the size of a sesame seed.”
                        </blockquote>
                        <figcaption className="mt-2 font-mono lowercase text-meta tracking-[0.15em] text-fog">
                          — neil degrasse tyson &amp; lindsey nyx walker, <cite className="not-italic">lost in space: 5,000 facts for navigating the universe</cite>
                        </figcaption>
                      </figure>
                      <a
                        href="https://gmunoz512.github.io/intergalactic-scale/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-paper-dim transition-colors duration-200"
                      >
                        open intergalactic scale
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </div>
                  </div>
                )}
              </li>
              <li className="border-t border-line-soft">
                <button
                  type="button"
                  aria-expanded={safekeepOpen}
                  onClick={() => setSafekeepOpen((o) => !o)}
                  className="w-full text-left py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] whitespace-nowrap">safekeep</h3>
                    <StatusPill status="testflight beta" />
                    <EyeToggle open={safekeepOpen} label="safekeep" />
                  </div>
                  <p className="mt-2 text-base leading-[1.55] text-body max-w-xl">
                    add a voice note to a photo, remember it forever.
                  </p>
                </button>

                {safekeepOpen && (
                  <div className="pb-6 -mx-3 px-3">
                    <div className="rounded-2xl border border-line bg-ink-raised/50 px-5 py-5 sm:px-6">
                      <div className="flex items-start gap-4">
                        <img
                          src={`${import.meta.env.BASE_URL}safekeep-icon.png`}
                          alt="safekeep app icon"
                          width={56}
                          height={56}
                          loading="lazy"
                          className="size-14 shrink-0 rounded-[14px] border border-line"
                        />
                        <p className="text-sm leading-[1.55] text-body max-w-lg">
                          a native iphone app (swiftui, ios 16+). it saves a voice
                          note into a live photo copy of your picture, so you can
                          press and hold to hear it.
                        </p>
                      </div>
                      <div className="mt-5 space-y-0">
                        {safekeepBits.map((p) => (
                          <article
                            key={p.num}
                            className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-8 py-4 border-t border-line-soft first:border-t-0 first:pt-0"
                          >
                            <span className="font-mono lowercase text-meta tracking-[0.15em] text-fog pt-1 tabular-nums">
                              {p.num}
                            </span>
                            <div>
                              <h4 className="text-base leading-[1.55] font-medium text-paper">
                                {p.title}
                              </h4>
                              <p className="mt-1.5 text-sm leading-[1.55] text-body max-w-xl">
                                {p.body}
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                      <p className="mt-5 text-sm leading-[1.55] text-body">
                        in testflight (beta) for now. no app store link yet.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-5 text-sm">
                        <a href={`${import.meta.env.BASE_URL}safekeep/privacy/`} className="inline-flex items-center gap-1 text-fog hover:text-paper transition-colors duration-200">
                          privacy
                          <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
                        </a>
                        <a href={`${import.meta.env.BASE_URL}safekeep/support/`} className="inline-flex items-center gap-1 text-fog hover:text-paper transition-colors duration-200">
                          support
                          <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </li>
              <li id="empsize" className="border-t border-line-soft scroll-mt-6">
                <button
                  type="button"
                  aria-expanded={empsizeOpen}
                  onClick={() => setEmpsizeOpen((o) => !o)}
                  className="w-full text-left py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] whitespace-nowrap">empsize</h3>
                    <StatusPill status="testflight beta" />
                    <EyeToggle open={empsizeOpen} label="empsize" />
                  </div>
                  <p className="mt-2 text-base leading-[1.55] text-body max-w-xl">
                    bolds the start of every word so your eyes glide through text.
                  </p>
                </button>

                {empsizeOpen && (
                  <div className="pb-6 -mx-3 px-3">
                    <div className="rounded-2xl border border-line bg-ink-raised/50 px-5 py-5 sm:px-6">
                      <div className="flex items-start gap-4">
                        <img
                          src={`${import.meta.env.BASE_URL}empsize-icon.png`}
                          alt="empsize app icon"
                          width={56}
                          height={56}
                          loading="lazy"
                          className="size-14 shrink-0 rounded-[14px] border border-line"
                        />
                        <p className="text-sm leading-[1.55] text-body max-w-lg">
                          a safari and chrome extension. it bolds the first part of each
                          word on any page, so you read with less effort.
                        </p>
                      </div>
                      <div className="mt-5 space-y-0">
                        {empsizeBits.map((p) => (
                          <article
                            key={p.num}
                            className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-8 py-4 border-t border-line-soft first:border-t-0 first:pt-0"
                          >
                            <span className="font-mono lowercase text-meta tracking-[0.15em] text-fog pt-1 tabular-nums">
                              {p.num}
                            </span>
                            <div>
                              <h4 className="text-base leading-[1.55] font-medium text-paper">
                                {p.title}
                              </h4>
                              <p className="mt-1.5 text-sm leading-[1.55] text-body max-w-xl">
                                {p.body}
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                      <p className="mt-5 text-sm leading-[1.55] text-body">
                        in testflight (beta) for now. no app store link yet.
                      </p>
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </section>

          <section id="for-fun" className="md:[grid-area:fun] py-10 sm:py-12 border-b border-line-soft md:border-b-0 md:border-l md:border-line-soft md:pl-10 md:pt-0">
            <h2 className="font-serif text-heading leading-[1.15] text-paper tracking-tight text-balance">
              fun builds: github
            </h2>
            <p className="mt-3 max-w-lg font-mono lowercase text-meta tracking-[0.15em] text-fog">
              weekend builds, side quests, and interests.. more soon
            </p>

            <ul className="mt-6 space-y-0">
              <li className="border-t border-line-soft">
                <a
                  href="https://github.com/gmunoz512/stackbnb-60920"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <span className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] group-hover:text-accent transition-colors">
                    stackd
                  </span>
                  <ArrowUpRight className="size-4 text-fog group-hover:text-accent transition-colors" aria-hidden />
                </a>
              </li>
              <li className="border-t border-line-soft">
                <a
                  href="https://github.com/gmunoz512/safekeep"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <span className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] group-hover:text-accent transition-colors">
                    safekeep
                  </span>
                  <ArrowUpRight className="size-4 text-fog group-hover:text-accent transition-colors" aria-hidden />
                </a>
              </li>
              <li className="border-t border-line-soft">
                <a
                  href="https://github.com/gmunoz512/focus-reader"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <span className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] group-hover:text-accent transition-colors">
                    empsize
                  </span>
                  <ArrowUpRight className="size-4 text-fog group-hover:text-accent transition-colors" aria-hidden />
                </a>
              </li>
              <li className="border-t border-line-soft">
                <a
                  href="https://github.com/gmunoz512/mars-sky"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <span className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] group-hover:text-accent transition-colors">
                    birthday in mars
                  </span>
                  <ArrowUpRight className="size-4 text-fog group-hover:text-accent transition-colors" aria-hidden />
                </a>
              </li>
              <li className="border-t border-line-soft">
                <a
                  href="https://github.com/gmunoz512/intergalactic-scale"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <span className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] group-hover:text-accent transition-colors">
                    intergalactic scale
                  </span>
                  <ArrowUpRight className="size-4 text-fog group-hover:text-accent transition-colors" aria-hidden />
                </a>
              </li>
              <li className="border-t border-line-soft">
                <a
                  href="#empsize"
                  onClick={() => setEmpsizeOpen(true)}
                  className="flex items-center justify-between gap-4 py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
                >
                  <span className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] group-hover:text-accent transition-colors">
                    empsize
                  </span>
                  <ArrowDown className="size-4 text-fog group-hover:text-accent transition-colors" aria-hidden />
                </a>
              </li>
            </ul>
          </section>

          <section id="thoughts" className="md:[grid-area:thoughts] py-10 sm:py-12 border-b border-line-soft md:border-b-0 md:pt-0">
            <h2 className="font-serif text-heading leading-[1.15] text-paper tracking-tight text-balance">
              behind the veil
            </h2>
            <p className="mt-3 max-w-lg font-mono lowercase text-meta tracking-[0.15em] text-fog">
              short writings
            </p>

            <ul className="mt-6 space-y-0">
              {essays.map((essay) => {
                const isOpen = openEssay === essay.id
                return (
                  <li key={essay.id} className="border-t border-line-soft">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenEssay((current) =>
                          current === essay.id ? null : essay.id,
                        )
                      }
                      className="w-full text-left py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
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
          </div>
        </main>

        <footer data-reveal="4" className="py-8 sm:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-serif text-xl text-paper tracking-tight normal-case">german<span className="text-accent">+</span></p>
            <p className="mt-1 font-mono lowercase text-meta tracking-[0.15em] text-fog">new york · building</p>
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
