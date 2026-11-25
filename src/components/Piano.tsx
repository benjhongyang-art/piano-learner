import { useEffect, useRef, type PointerEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  buildWhiteKeys,
  formatNote,
  keyLabelForNote,
  noteForCode,
  noteText,
  type LabelMode,
} from '@/lib/music'
import { cn } from '@/lib/utils'

export type KeyFlash = { note: string; kind: 'good' | 'bad'; id: number }

const WHITE_KEYS = buildWhiteKeys()

export function Piano({
  labelMode,
  baseOctave,
  onBaseOctave,
  volume,
  onVolume,
  statusLabel,
  highlight,
  flash,
  pressed,
  onPress,
  onRelease,
}: {
  labelMode: LabelMode
  baseOctave: number
  onBaseOctave: (octave: number) => void
  volume: number
  onVolume: (volume: number) => void
  statusLabel: string
  highlight: string | null
  flash: KeyFlash | null
  pressed: ReadonlySet<string>
  onPress: (note: string) => void
  onRelease: (note: string) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, { note: string; playing: boolean; timer?: number; x: number; y: number }>())
  const heldCodes = useRef(new Map<string, string>())

  useEffect(() => {
    const frame = requestAnimationFrame(() => centerPitch('C4', false))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!highlight) return
    centerPitch(highlight, !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [highlight])

  function centerPitch(pitch: string, smooth: boolean) {
    const scroller = scrollerRef.current
    const target = scroller?.querySelector<HTMLElement>(`[data-pitch="${CSS.escape(pitch)}"]`)
    if (!scroller || !target) return
    const delta =
      target.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left -
      (scroller.clientWidth - target.offsetWidth) / 2
    scroller.scrollTo({ left: Math.max(0, scroller.scrollLeft + delta), behavior: smooth ? 'smooth' : 'auto' })
  }

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }
      const note = noteForCode(event.code, baseOctave)
      if (!note || heldCodes.current.has(event.code)) return
      event.preventDefault()
      heldCodes.current.set(event.code, note)
      onPress(note)
    }
    const up = (event: KeyboardEvent) => {
      const note = heldCodes.current.get(event.code)
      if (!note) return
      heldCodes.current.delete(event.code)
      onRelease(note)
    }
    const blur = () => {
      for (const note of heldCodes.current.values()) onRelease(note)
      heldCodes.current.clear()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      blur()
    }
  }, [baseOctave, onPress, onRelease])

  useEffect(() => {
    const map = pointers.current
    return () => {
      for (const entry of map.values()) {
        if (entry.timer) window.clearTimeout(entry.timer)
        if (entry.playing) onRelease(entry.note)
      }
      map.clear()
    }
  }, [onRelease])

  function pointerDown(event: PointerEvent<HTMLButtonElement>, note: string) {
    event.preventDefault()
    const id = event.pointerId
    if (event.pointerType === 'touch') {
      const timer = window.setTimeout(() => {
        const entry = pointers.current.get(id)
        if (!entry || entry.playing) return
        entry.playing = true
        onPress(note)
      }, 45)
      pointers.current.set(id, { note, playing: false, timer, x: event.clientX, y: event.clientY })
      return
    }
    event.currentTarget.setPointerCapture(id)
    pointers.current.set(id, { note, playing: true, x: event.clientX, y: event.clientY })
    onPress(note)
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const entry = pointers.current.get(event.pointerId)
    if (!entry || entry.playing) return
    const dx = event.clientX - entry.x
    const dy = event.clientY - entry.y
    if (dx * dx + dy * dy > 64) {
      if (entry.timer) window.clearTimeout(entry.timer)
      pointers.current.delete(event.pointerId)
    }
  }

  function pointerUp(event: PointerEvent<HTMLButtonElement>, tapped: boolean) {
    const entry = pointers.current.get(event.pointerId)
    if (!entry) return
    pointers.current.delete(event.pointerId)
    if (entry.timer) window.clearTimeout(entry.timer)
    if (entry.playing) {
      onRelease(entry.note)
      return
    }
    if (tapped && event.pointerType === 'touch') {
      onPress(entry.note)
      window.setTimeout(() => onRelease(entry.note), 160)
    }
  }

  const low = formatNote(noteForCode('KeyZ', baseOctave) ?? 'C3', labelMode)
  const high = formatNote(noteForCode('KeyI', baseOctave) ?? 'C5', labelMode)

  return (
    <section className="bg-[#2a231e] px-2 pt-2 text-[#f6efe4] shadow-[0_-12px_40px_rgba(40,30,20,0.16)] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-1 pb-2 text-xs">
        <label className="flex shrink-0 items-center gap-2">
          <span>音量</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            aria-label="音量"
            onChange={(event) => onVolume(Number(event.target.value))}
            className="h-1 w-16 accent-[#e08a3c] sm:w-24"
          />
        </label>
        <span className="min-w-0 truncate text-[#f6efe4]/75">{statusLabel}</span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <span className="hidden text-[#f6efe4]/75 md:inline">
            電腦鍵盤 {low.name}{low.octave}–{high.name}{high.octave}
          </span>
          <Button type="button" size="sm" variant="secondary" className="h-8" disabled={baseOctave <= 2} onClick={() => onBaseOctave(baseOctave - 1)}>
            低八度
          </Button>
          <Button type="button" size="sm" variant="secondary" className="h-8" disabled={baseOctave >= 4} onClick={() => onBaseOctave(baseOctave + 1)}>
            高八度
          </Button>
        </div>
      </div>
      <div ref={scrollerRef} className="piano-scroll mx-auto max-w-6xl overflow-x-auto rounded-md bg-black/35">
        <div className="flex h-[158px] sm:h-[188px]" style={{ width: `max(100%, ${WHITE_KEYS.length * 46}px)` }}>
          {WHITE_KEYS.map((key) => (
            <div key={key.note} className="relative h-full min-w-0 flex-1">
              <KeyButton
                note={key.note}
                kind="white"
                labelMode={labelMode}
                baseOctave={baseOctave}
                pressed={pressed.has(key.note)}
                highlighted={highlight === key.note}
                flash={flash?.note === key.note ? flash.kind : null}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
              />
              {key.black ? (
                <KeyButton
                  note={key.black}
                  kind="black"
                  labelMode={labelMode}
                  baseOctave={baseOctave}
                  pressed={pressed.has(key.black)}
                  highlighted={highlight === key.black}
                  flash={flash?.note === key.black ? flash.kind : null}
                  onPointerDown={pointerDown}
                  onPointerMove={pointerMove}
                  onPointerUp={pointerUp}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function KeyButton({
  note,
  kind,
  labelMode,
  baseOctave,
  pressed,
  highlighted,
  flash,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  note: string
  kind: 'white' | 'black'
  labelMode: LabelMode
  baseOctave: number
  pressed: boolean
  highlighted: boolean
  flash: 'good' | 'bad' | null
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, note: string) => void
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerUp: (event: PointerEvent<HTMLButtonElement>, tapped: boolean) => void
}) {
  const formatted = formatNote(note, labelMode)
  const hint = keyLabelForNote(note, baseOctave)
  const state = flash === 'good' ? 'good' : flash === 'bad' ? 'bad' : pressed ? 'pressed' : highlighted ? 'next' : 'idle'

  return (
    <button
      type="button"
      data-pitch={note}
      tabIndex={-1}
      aria-label={`${noteText(note, labelMode)}${hint ? `，鍵盤 ${hint}` : ''}`}
      aria-pressed={pressed || highlighted}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => onPointerDown(event, note)}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => onPointerUp(event, true)}
      onPointerCancel={(event) => onPointerUp(event, false)}
      className={cn(
        'touch-none overflow-hidden select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#e08a3c]',
        kind === 'white' ? 'absolute inset-0 rounded-b-md border-x border-b border-[#d9d0c4]' : 'absolute top-0 right-0 z-20 h-[58%] w-[64%] translate-x-1/2 rounded-b-md',
        kind === 'white' && state === 'idle' && 'bg-[linear-gradient(#fffefb,#f3ece3)] text-[#4d453e]',
        kind === 'white' && state === 'pressed' && 'bg-[#ffd7a3] text-[#3a2a1c]',
        kind === 'white' && state === 'next' && 'bg-[#fff1df] text-[#6a3d12] shadow-[inset_0_0_0_3px_#e08a3c]',
        kind === 'white' && state === 'good' && 'bg-[#b7e4c7] text-[#145c32]',
        kind === 'white' && state === 'bad' && 'bg-[#f6c1c1] text-[#7f1d1d]',
        kind === 'black' && state === 'idle' && 'bg-[linear-gradient(#3a342f,#161311)] text-[#f6efe4]',
        kind === 'black' && state === 'pressed' && 'bg-[#6d5340] text-[#fff7ec]',
        kind === 'black' && state === 'next' && 'bg-[#4a3424] text-[#ffe7c2] shadow-[inset_0_0_0_2px_#e08a3c]',
        kind === 'black' && state === 'good' && 'bg-[#1f7a4a] text-white',
        kind === 'black' && state === 'bad' && 'bg-[#9a3030] text-white',
      )}
    >
      {highlighted && !flash ? (
        <span className="pulse-dot absolute top-1.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-[#e08a3c]" />
      ) : null}
      <span
        className={cn(
          'pointer-events-none absolute inset-x-0 flex flex-col items-center leading-none',
          kind === 'white' ? 'bottom-2 gap-1' : 'bottom-1.5 gap-0.5',
        )}
      >
        {hint && kind === 'white' ? <span className="hidden text-[10px] text-[#8a7d70] md:block">{hint}</span> : null}
        <span className={kind === 'white' ? 'text-[13px] font-medium' : 'text-[10px]'}>{formatted.name}</span>
        {kind === 'white' ? <span className="text-[10px] text-[#8a7d70]">{formatted.octave}</span> : null}
      </span>
    </button>
  )
}
