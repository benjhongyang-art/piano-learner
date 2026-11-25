import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { NoteName } from '@/components/NoteName'
import { Segmented } from '@/components/Segmented'
import { Staff } from '@/components/Staff'
import { pickNext, practicePool, type Clef, type LabelMode, type Level } from '@/lib/music'
import { applySight, type Progress } from '@/lib/storage'

type Feedback = { kind: 'good' | 'bad'; played: string } | null

export function SightReading({
  labelMode,
  clef,
  level,
  accidentals,
  onClef,
  onLevel,
  onAccidentals,
  bestStreak,
  onHighlight,
  onProgress,
  onFlash,
  register,
}: {
  labelMode: LabelMode
  clef: Clef
  level: Level
  accidentals: boolean
  onClef: (clef: Clef) => void
  onLevel: (level: Level) => void
  onAccidentals: (value: boolean) => void
  bestStreak: number
  onHighlight: (note: string | null) => void
  onProgress: (recipe: (progress: Progress) => Progress) => void
  onFlash: (note: string, kind: 'good' | 'bad') => void
  register: (handler: ((note: string) => void) | null) => void
}) {
  const pool = useMemo(() => practicePool(clef, level, accidentals), [clef, level, accidentals])
  const [target, setTarget] = useState(() => pickNext(pool, null))
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [attempts, setAttempts] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [shake, setShake] = useState(0)
  const [misses, setMisses] = useState(0)
  const targetRef = useRef(target)
  const streakRef = useRef(0)
  const missesRef = useRef(0)
  const lockRef = useRef(false)
  const poolRef = useRef(pool)
  const clefRef = useRef(clef)

  useEffect(() => {
    targetRef.current = target
    poolRef.current = pool
    clefRef.current = clef
  }, [target, pool, clef])

  useEffect(() => {
    const onNote = (note: string) => {
      if (lockRef.current) return
      const expected = targetRef.current
      if (note === expected) {
        lockRef.current = true
        missesRef.current = 0
        setMisses(0)
        const nextStreak = streakRef.current + 1
        streakRef.current = nextStreak
        setStreak(nextStreak)
        setAttempts((value) => value + 1)
        setCorrect((value) => value + 1)
        setFeedback({ kind: 'good', played: note })
        onFlash(note, 'good')
        onHighlight(null)
        onProgress((progress) => applySight(progress, { correct: true, clef: clefRef.current, streak: nextStreak }))
        window.setTimeout(() => {
          const next = pickNext(poolRef.current, expected)
          targetRef.current = next
          setTarget(next)
          setFeedback(null)
          lockRef.current = false
        }, 420)
        return
      }
      streakRef.current = 0
      const nextMisses = missesRef.current + 1
      missesRef.current = nextMisses
      setMisses(nextMisses)
      setStreak(0)
      setAttempts((value) => value + 1)
      setFeedback({ kind: 'bad', played: note })
      setShake((value) => value + 1)
      onFlash(note, 'bad')
      onProgress((progress) => applySight(progress, { correct: false, clef: clefRef.current, streak: 0 }))
      if (nextMisses >= 2) onHighlight(expected)
    }
    register(onNote)
    return () => {
      register(null)
      onHighlight(null)
    }
  }, [onFlash, onHighlight, onProgress, register])

  function newRound() {
    streakRef.current = 0
    missesRef.current = 0
    setMisses(0)
    lockRef.current = false
    setAttempts(0)
    setCorrect(0)
    setStreak(0)
    setFeedback(null)
    onHighlight(null)
    const next = pickNext(pool, null)
    targetRef.current = next
    setTarget(next)
  }

  const rate = attempts === 0 ? '—' : `${Math.round((correct / attempts) * 100)}%`
  const hinted = feedback?.kind === 'bad' && misses >= 2

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">識譜練習</h2>
          <p className="mt-1 text-sm text-muted-foreground">看五線譜上的音符，按下同一個琴鍵。答錯會留在這一題。</p>
        </div>
        <Button type="button" variant="outline" className="h-10" onClick={newRound}>
          新的一輪
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="這一輪" value={`${correct}/${attempts}`} hint={rate} />
        <Stat label="連續正確" value={String(streak)} />
        <Stat label="累計最佳" value={String(bestStreak)} />
      </div>
      <div className="rounded-2xl bg-card px-3 py-4 ring-1 ring-foreground/10 sm:px-6">
        <p className="mb-1 text-center text-xs text-muted-foreground">{clef === 'treble' ? '高音譜號' : '低音譜號'}</p>
        <div key={`${target}-${shake}`} className={feedback?.kind === 'bad' ? 'shake' : 'pop'}>
          <Staff note={target} clef={clef} status={feedback?.kind ?? 'idle'} labelMode={labelMode} />
        </div>
        <div aria-live="polite" className="flex min-h-12 items-center justify-center">
          {feedback?.kind === 'good' ? (
            <p className="rounded-full bg-moss/15 px-4 py-1.5 text-sm font-medium text-moss">正確 · 連續 {streak}</p>
          ) : feedback?.kind === 'bad' ? (
            <p className="rounded-full bg-rose/12 px-4 py-1.5 text-sm font-medium text-rose">
              再試一次。你按的是 <NoteName note={feedback.played} mode={labelMode} />
              {hinted ? '。發亮的鍵就是答案。' : ''}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{correct < 3 ? '看譜，按下對應的琴鍵。' : '繼續看下一個音。'}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="譜號"
          value={clef}
          onChange={onClef}
          options={[
            { value: 'treble', label: '高音譜號' },
            { value: 'bass', label: '低音譜號' },
          ]}
        />
        <Segmented
          label="範圍"
          value={level}
          onChange={onLevel}
          options={[
            { value: 'easy', label: '入門' },
            { value: 'full', label: '進階' },
          ]}
        />
        <Button
          type="button"
          variant={accidentals ? 'default' : 'outline'}
          className="h-10"
          aria-pressed={accidentals}
          onClick={() => onAccidentals(!accidentals)}
        >
          {accidentals ? '含黑鍵' : '只有白鍵'}
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-foreground/5 px-2 py-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-serif text-2xl leading-tight">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  )
}
