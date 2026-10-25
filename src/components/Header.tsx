const nav = [
  { href: '#products', label: 'products' },
  { href: '#thoughts', label: 'thoughts' },
  { href: '#for-fun', label: 'fun builds' },
]

export default function Header({ className }: { className: string }) {
  return (
    <header data-reveal="0" className={`flex items-center justify-between pt-6 pb-3 ${className}`}>
      <a href="#top" className="font-serif text-xl text-paper tracking-tight normal-case">
        gm
      </a>
      <nav className="flex items-center gap-5 text-sm text-fog font-sans">
        {nav.map((n) => (
          <a key={n.href} href={n.href} className="hover:text-paper transition-colors duration-200">
            {n.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
