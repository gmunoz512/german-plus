import SocialLinks from './SocialLinks'

export default function Hero({ fadeUp }: { fadeUp: (delay?: string) => string }) {
  return (
    <section data-hero className="pt-10 sm:pt-14 pb-8 sm:pb-10 border-b border-line-soft">
      <h1 className={`${fadeUp('fade-up-delay-1')} font-serif text-display leading-[1.05] tracking-tight text-paper text-balance normal-case`}>
        <span data-reveal="1" className="inline-block">german</span>
        <span data-intro-plus className="text-accent">+</span>
      </h1>
      <div data-reveal="2" className={`${fadeUp('fade-up-delay-2')} mt-4 flex flex-wrap items-center gap-4`}>
        <SocialLinks dimArrow />
      </div>
    </section>
  )
}
