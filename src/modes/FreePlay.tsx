import { NoteName } from '@/components/NoteName'
import { KEY_BINDINGS, formatNote, noteForCode, noteText, type LabelMode } from '@/lib/music'

export function FreePlay({
  labelMode,
  baseOctave,
  lastNote,
  history,
}: {
  labelMode: LabelMode
  baseOctave: number
  lastNote: string | null
  history: string[]
}) {
  const lower = KEY_BINDINGS.filter((item) => item.semitone < 12)
  const upper = KEY_BINDINGS.filter((item) => item.semitone >= 12)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl">自由彈奏</h2>
        <p className="mt-1 text-sm text-muted-foreground">這是你的琴。沒有對錯，先把每個音聽熟。按住琴鍵，聲音會延續。</p>
      </div>
      <div className="rounded-2xl bg-card px-4 py-8 text-center ring-1 ring-foreground/10">
        {lastNote ? (
          <>
            <p className="text-sm text-muted-foreground">{lastNote === 'C4' ? '中央 C' : '剛剛彈的音'}</p>
            <p className="mt-2 font-serif text-6xl">
              <NoteName note={lastNote} mode={labelMode} />
            </p>
          </>
        ) : (
          <>
            <p className="font-serif text-3xl">先彈一個音</p>
            <p className="mt-2 text-sm text-muted-foreground">用手指、滑鼠，或下方的電腦鍵盤。</p>
          </>
        )}
        {history.length > 1 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {history.map((note, index) => (
              <span key={`${note}-${index}`}>
                {index > 0 ? ' · ' : ''}
                {noteText(note, labelMode)}
              </span>
            ))}
          </p>
        ) : null}
      </div>
      <details className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
        <summary className="cursor-pointer text-sm font-medium">電腦鍵盤怎麼按</summary>
        <p className="mt-2 text-sm text-muted-foreground">
          字母是電腦按鍵，不是音名。下面一排從 Z 開始，上面一排從 Q 開始，正好高一個八度。用琴鍵旁的「低八度 / 高八度」可以移動。
        </p>
        <div className="mt-3 space-y-3">
          <KeyRow title="下面一排" bindings={lower} baseOctave={baseOctave} labelMode={labelMode} />
          <KeyRow title="上面一排" bindings={upper} baseOctave={baseOctave} labelMode={labelMode} />
        </div>
      </details>
    </div>
  )
}

function KeyRow({
  title,
  bindings,
  baseOctave,
  labelMode,
}: {
  title: string
  bindings: typeof KEY_BINDINGS
  baseOctave: number
  labelMode: LabelMode
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {bindings.map((binding) => {
          const note = noteForCode(binding.code, baseOctave)
          const formatted = note ? formatNote(note, labelMode) : null
          return (
            <span key={binding.code} className="inline-flex items-center gap-1 rounded-lg bg-foreground/5 px-2 py-1 text-xs">
              <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-sans shadow-sm">{binding.label}</kbd>
              {formatted ? `${formatted.name}${formatted.octave}` : '—'}
            </span>
          )
        })}
      </div>
    </div>
  )
}
