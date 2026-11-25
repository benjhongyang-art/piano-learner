import { useCallback, useEffect, useRef, useState } from 'react'
import { Piano, type KeyFlash } from '@/components/Piano'
import { Segmented } from '@/components/Segmented'
import { audioStatus, loadPiano, noteOff, noteOn, preview, setVolume, unlockAudio, type AudioStatus } from '@/audio/piano'
import type { Clef, LabelMode, Level } from '@/lib/music'
import {
  applyFreeNote,
  emptyProgress,
  loadPrefs,
  loadProgress,
  savePrefs,
  saveProgress,
  type Progress,
} from '@/lib/storage'
import { FreePlay } from '@/modes/FreePlay'
import { PlayAlong } from '@/modes/PlayAlong'
import { ProgressPage } from '@/modes/ProgressPage'
import { SightReading } from '@/modes/SightReading'

const MODES = ['free', 'sight', 'songs', 'progress'] as const
type Mode = (typeof MODES)[number]

const TABS: { id: Mode; label: string }[] = [
  { id: 'free', label: '自由彈奏' },
  { id: 'sight', label: '識譜練習' },
  { id: 'songs', label: '跟彈曲目' },
  { id: 'progress', label: '學習紀錄' },
]

function readMode(): Mode {
  const value = window.location.hash.replace('#', '')
  return MODES.includes(value as Mode) ? (value as Mode) : 'free'
}

export default function App() {
  const stored = useState(loadPrefs)[0]
  const [mode, setMode] = useState<Mode>(readMode)
  const [labelMode, setLabelMode] = useState<LabelMode>(stored.labelMode)
  const [volume, setVolumeState] = useState(stored.volume)
  const [baseOctave, setBaseOctave] = useState(stored.baseOctave)
  const [clef, setClef] = useState<Clef>(stored.clef)
  const [level, setLevel] = useState<Level>(stored.level)
  const [accidentals, setAccidentals] = useState(stored.accidentals)
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [pressed, setPressed] = useState<ReadonlySet<string>>(() => new Set())
  const [highlight, setHighlight] = useState<string | null>(null)
  const [flash, setFlash] = useState<KeyFlash | null>(null)
  const [lastNote, setLastNote] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [audio, setAudio] = useState<AudioStatus>('loading')
  const counts = useRef(new Map<string, number>())
  const noteHandlerRef = useRef<(note: string) => void>(() => {})
  const modeRef = useRef(mode)
  const flashSerial = useRef(0)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    void loadPiano().then((next) => setAudio(next || audioStatus()))
  }, [])

  useEffect(() => {
    setVolume(volume)
  }, [volume])

  useEffect(() => {
    savePrefs({ labelMode, volume, baseOctave, clef, level, accidentals })
  }, [labelMode, volume, baseOctave, clef, level, accidentals])

  useEffect(() => {
    const sync = () => {
      const next = readMode()
      modeRef.current = next
      setMode(next)
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const updateProgress = useCallback((recipe: (current: Progress) => Progress) => {
    setProgress((current) => {
      const next = recipe(current)
      saveProgress(next)
      return next
    })
  }, [])

  const register = useCallback((handler: ((note: string) => void) | null) => {
    noteHandlerRef.current = handler ?? (() => {})
  }, [])

  const onHighlight = useCallback((note: string | null) => {
    setHighlight(note)
  }, [])

  const onFlash = useCallback((note: string, kind: 'good' | 'bad') => {
    const id = flashSerial.current + 1
    flashSerial.current = id
    setFlash({ note, kind, id })
    window.setTimeout(() => {
      setFlash((current) => (current?.id === id ? null : current))
    }, 320)
  }, [])

  const press = useCallback((note: string) => {
    const next = (counts.current.get(note) ?? 0) + 1
    counts.current.set(note, next)
    if (next !== 1) return
    noteOn(note)
    setPressed(new Set(counts.current.keys()))
    setLastNote(note)
    setHistory((items) => [...items, note].slice(-8))
    if (modeRef.current === 'free') updateProgress(applyFreeNote)
    noteHandlerRef.current(note)
  }, [updateProgress])

  const release = useCallback((note: string) => {
    const next = (counts.current.get(note) ?? 0) - 1
    if (next > 0) counts.current.set(note, next)
    else counts.current.delete(note)
    if (next <= 0) noteOff(note)
    setPressed(new Set(counts.current.keys()))
  }, [])

  function selectMode(next: Mode) {
    modeRef.current = next
    if (window.location.hash === `#${next}`) setMode(next)
    else window.location.hash = next
  }

  function resetProgress() {
    const fresh = emptyProgress()
    saveProgress(fresh)
    setProgress(fresh)
  }

  const statusLabel = audio === 'loading' ? '正在準備琴聲…' : audio === 'synth' ? '改用合成音色' : '取樣鋼琴'

  return (
    <div className="flex h-dvh flex-col" onPointerDown={unlockAudio}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo />
          <div className="min-w-0">
            <h1 className="font-serif text-xl leading-none">琴鍵入門</h1>
            <p className="mt-1 hidden text-xs text-muted-foreground sm:block">給初學者的鋼琴練習</p>
          </div>
        </div>
        <Segmented
          label="音符名稱"
          value={labelMode}
          onChange={setLabelMode}
          options={[
            { value: 'letter', label: '音名 C D E', short: 'C D E' },
            { value: 'solfege', label: '唱名 Do Re Mi', short: 'Do Re Mi' },
          ]}
        />
      </header>
      <nav aria-label="練習模式" className="px-4 pb-3">
        <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1 rounded-xl bg-foreground/5 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={mode === tab.id}
              className={`min-h-11 rounded-lg px-1 text-[13px] font-medium sm:text-sm ${
                mode === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
              onClick={() => selectMode(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-2">
          {mode === 'free' ? <FreePlay labelMode={labelMode} baseOctave={baseOctave} lastNote={lastNote} history={history} /> : null}
          {mode === 'sight' ? (
            <SightReading
              key={`${clef}-${level}-${accidentals}`}
              labelMode={labelMode}
              clef={clef}
              level={level}
              accidentals={accidentals}
              onClef={setClef}
              onLevel={setLevel}
              onAccidentals={setAccidentals}
              bestStreak={progress.sight.bestStreak}
              onHighlight={onHighlight}
              onProgress={updateProgress}
              onFlash={onFlash}
              register={register}
            />
          ) : null}
          {mode === 'songs' ? (
            <PlayAlong
              labelMode={labelMode}
              progress={progress}
              onHighlight={onHighlight}
              onProgress={updateProgress}
              onPreview={preview}
              onFlash={onFlash}
              register={register}
            />
          ) : null}
          {mode === 'progress' ? <ProgressPage progress={progress} onReset={resetProgress} /> : null}
          <p className="px-1 py-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            琴聲取樣：Salamander Grand Piano，Alexander Holm，CC BY 3.0
          </p>
        </div>
      </main>
      <Piano
        labelMode={labelMode}
        baseOctave={baseOctave}
        onBaseOctave={setBaseOctave}
        volume={volume}
        onVolume={setVolumeState}
        statusLabel={statusLabel}
        highlight={highlight}
        flash={flash}
        pressed={pressed}
        onPress={press}
        onRelease={release}
      />
    </div>
  )
}

function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
      <rect width="36" height="36" rx="10" fill="#c65a2e" />
      <rect x="8" y="9" width="6" height="18" rx="1.2" fill="#fffaf3" />
      <rect x="15" y="9" width="6" height="18" rx="1.2" fill="#fffaf3" />
      <rect x="22" y="9" width="6" height="18" rx="1.2" fill="#fffaf3" />
      <rect x="12.2" y="9" width="3.4" height="10" rx="0.8" fill="#2a211c" />
      <rect x="19.2" y="9" width="3.4" height="10" rx="0.8" fill="#2a211c" />
    </svg>
  )
}
