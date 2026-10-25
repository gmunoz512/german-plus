import { Eye, EyeOff } from 'lucide-react'

export default function EyeToggle({ open, label }: { open: boolean; label: string }) {
  return (
    <span className="ml-auto shrink-0 inline-flex h-5 items-center justify-end text-fog transition-colors duration-200 group-hover:text-mist group-active:text-paper">
      <span className="sr-only">{open ? `less about ${label}` : `more about ${label}`}</span>
      {open ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
    </span>
  )
}
