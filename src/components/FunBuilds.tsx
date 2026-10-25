import { ArrowUpRight } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { funBuilds } from '../data/funBuilds'

export default function FunBuilds() {
  return (
    <section id="for-fun" className="md:[grid-area:fun] py-10 sm:py-12 border-b border-line-soft md:border-b-0 md:border-l md:border-line-soft md:pl-10 md:pt-0">
      <SectionHeading title="fun builds: github" subtitle="weekend builds, side quests, and interests.. more soon" />
      <ul className="mt-6 space-y-0">
        {funBuilds.map((b) => (
          <li key={b.href} className="border-t border-line-soft">
            <a
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 py-5 group hover:bg-ink-raised/40 -mx-3 px-3 rounded-lg transition-colors duration-200"
            >
              <span className="font-mono lowercase text-title tracking-[0.15em] font-normal text-paper leading-[1.4] group-hover:text-accent transition-colors">
                {b.name}
              </span>
              <ArrowUpRight className="size-4 text-fog group-hover:text-accent transition-colors" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
