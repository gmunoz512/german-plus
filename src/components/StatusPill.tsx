export default function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-meta font-medium tracking-wide border border-line text-fog lowercase">
      {status}
    </span>
  )
}
