import { useCallback, useRef, useState } from 'react'
import EssayProgress from './EssayProgress'
import Ambient from './Ambient'
import PortalIntro from './intro/PortalIntro'
import { shouldPlayIntro } from './intro/storage'
import SiteFrame from './SiteFrame'
import VenomEdges from './VenomEdges'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Products from './components/Products'
import FunBuilds from './components/FunBuilds'
import Thoughts from './components/Thoughts'
import Footer from './components/Footer'

export default function App() {
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
  const toggleEssay = useCallback(
    (id: string) => setOpenEssay((current) => (current === id ? null : id)),
    [],
  )
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
        {intro !== 'playing' && <VenomEdges />}
        {intro !== 'playing' && <Ambient />}

        <div className="relative z-10 mx-auto w-full max-w-3xl md:max-w-6xl px-6 sm:px-8">
          <Header className={fadeUp()} />

          <main id="top">
            <Hero fadeUp={fadeUp} />

            <div data-reveal="3" className="md:grid md:grid-cols-2 md:gap-x-12 md:items-start md:[grid-template-areas:'about_products'_'thoughts_fun']">
              <About />
              <Products />
              <FunBuilds />
              <Thoughts openEssay={openEssay} onToggle={toggleEssay} />
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </>
  )
}
