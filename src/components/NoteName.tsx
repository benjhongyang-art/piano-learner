import { formatNote, type LabelMode } from '@/lib/music'

export function NoteName({
  note,
  mode,
  className = '',
}: {
  note: string
  mode: LabelMode
  className?: string
}) {
  const formatted = formatNote(note, mode)
  return (
    <span className={`inline-flex items-baseline gap-0.5 ${className}`}>
      <span>{formatted.name}</span>
      <span className="text-[0.68em] opacity-70">{formatted.octave}</span>
    </span>
  )
}
