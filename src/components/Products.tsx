import { useState } from 'react'
import { products } from '../data/products'
import ProductCard from './ProductCard'
import SectionHeading from './SectionHeading'

export default function Products() {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  return (
    <section id="products" className="md:[grid-area:products] py-10 sm:py-12 border-b border-line-soft md:border-b-0 md:border-l md:border-line-soft md:pl-10">
      <SectionHeading title="products" subtitle="my rabbit holes" />
      <ul className="mt-6 space-y-0">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} open={!!open[p.id]} onToggle={() => toggle(p.id)} />
        ))}
      </ul>
    </section>
  )
}
