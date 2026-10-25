import SectionHeading from './SectionHeading'

export default function About() {
  return (
    <section id="about" className="md:[grid-area:about] py-10 sm:py-12 border-b border-line-soft md:border-b-0">
      <SectionHeading title="about" />
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
  )
}
