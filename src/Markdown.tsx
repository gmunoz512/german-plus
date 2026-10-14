import type { ReactNode } from 'react'

// same rule as empsize default (fixation 3, ~45%)
const WORD = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu
function boldLen(w: string): number {
  const n = [...w].length
  if (n <= 3) return 1
  const k = n <= 7 ? Math.round(n * 0.45) : Math.ceil(n * 0.45)
  return Math.max(1, Math.min(n - 1, k))
}
const B = 'font-semibold text-paper [font-family:inherit] [font-size:inherit] [line-height:inherit] [letter-spacing:inherit]'
function bionic(text: string, key: number): ReactNode {
  const parts: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(WORD)) {
    const idx = m.index ?? 0
    if (idx > last) parts.push(text.slice(last, idx))
    const chars = [...m[0]]
    const k = boldLen(m[0])
    parts.push(<strong key={i++} className={B}>{chars.slice(0, k).join('')}</strong>)
    parts.push(chars.slice(k).join(''))
    last = idx + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <span key={key}>{parts}</span>
}
const isLetter = (c: string | undefined) => !!c && /[\p{L}\p{M}]/u.test(c)

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const partial = isLetter(text[m.index - 1]) || isLetter(text[m.index + m[0].length])
    if (m[1] !== undefined)
      out.push(partial ? <strong key={k++} className={B}>{m[1]}</strong> : bionic(m[1], k++))
    else out.push(<em key={k++} className="italic">{m[2]}</em>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\s*\n/)
  return (
    <>
      {blocks.map((block, i) => {
        const b = block.trim()
        if (b.startsWith('### ')) {
          return (
            <h4 key={i} className="pt-2 font-mono lowercase text-title tracking-[0.15em] leading-[1.4] text-paper">
              {inline(b.slice(4))}
            </h4>
          )
        }
        if (b.startsWith('- ')) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-2 marker:text-fog">
              {b.split(/\n(?=- )/).map((li, j) => (
                <li key={j}>{inline(li.replace(/^- /, ''))}</li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{inline(b.replace(/\n/g, ' '))}</p>
      })}
    </>
  )
}
