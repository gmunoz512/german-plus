import SocialLinks from './SocialLinks'
import VenomButton from '../VenomButton'

export default function Footer() {
  return (
    <footer data-reveal="4" className="py-8 sm:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-4">
          <p className="font-serif text-xl text-paper tracking-tight normal-case">german<span className="text-accent">+</span></p>
          <VenomButton />
        </div>
        <p className="mt-1 font-mono lowercase text-meta tracking-[0.15em] text-fog">new york · building</p>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <SocialLinks />
      </div>
    </footer>
  )
}
