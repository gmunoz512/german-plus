/* Page-wide click/tap venom: goo tendrils reach in from the screen borders. Lazy-loaded, never blocks input. */
import { useEffect } from 'react'

export default function VenomEdges() {
  useEffect(() => {
    // phone only: never load the script on desktop / mouse devices
    const phone = matchMedia('(pointer: coarse) and (hover: none)').matches && innerWidth <= 820
    if (!phone || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let api: { destroy(): void } | null = null
    let cancelled = false
    import('./venom/edges.js').then(({ mountEdges }) => {
      if (cancelled) return
      try { api = mountEdges({ color: '#ffb867', maxDpr: 3 }) } catch { api = null }
    })
    return () => { cancelled = true; api?.destroy() }
  }, [])
  return null
}
