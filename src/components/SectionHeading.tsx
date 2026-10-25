export default function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <h2 className="font-serif text-heading leading-[1.15] text-paper tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-lg font-mono lowercase text-meta tracking-[0.15em] text-fog">
          {subtitle}
        </p>
      )}
    </>
  )
}
