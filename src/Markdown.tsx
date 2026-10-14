import type { ReactNode } from 'react'

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined) out.push(<strong key={k++} className="font-semibold text-paper">{m[1]}</strong>)
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
