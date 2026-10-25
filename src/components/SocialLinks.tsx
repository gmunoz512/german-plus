import { ArrowUpRight } from 'lucide-react'

const links = [
  { label: 'linkedin', href: 'https://www.linkedin.com/in/g-mu%C3%B1oz' },
  { label: 'github', href: 'https://github.com/gmunoz512' },
]

/** linkedin + github. the hero dims its arrows, the footer doesn't. */
export default function SocialLinks({ dimArrow = false }: { dimArrow?: boolean }) {
  return (
    <>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-fog hover:text-paper transition-colors duration-200"
        >
          {l.label}
          <ArrowUpRight className={dimArrow ? 'size-3.5 opacity-70' : 'size-3.5'} aria-hidden />
        </a>
      ))}
    </>
  )
}
