import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress as SongProgress } from '@/components/ui/progress'
import { NoteName } from '@/components/NoteName'
import { Staff } from '@/components/Staff'
import { songs, type Song } from '@/data/songs'
import { advanceSong, noteText, type LabelMode } from '@/lib/music'
import { applySongClear, applySongPlay, songStats, type Progress } from '@/lib/storage'

export function PlayAlong({
  labelMode,
  progress,
  onHighlight,
  onProgress,
  onPreview,
  onFlash,
  register,
}: {
  labelMode: LabelMode
  progress: Progress
  onHighlight: (note: string | null) => void
  onProgress: (recipe: (progress: Progress) => Progress) => void
  onPreview: (note: string) => void
  onFlash: (note: string, kind: 'good' | 'bad') => void
  register: (handler: ((note: string) => void) | null) => void
}) {
  const [song, setSong] = useState<Song | null>(null)
  const [index, setIndex] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)
  const mistakesRef = useRef(0)
  const doneRef = useRef(false)
  const lockRef = useRef(false)
  const songRef = useRef<Song | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    songRef.current = song
  }, [song])

  useEffect(() => {
    if (!song || done) {
      onHighlight(null)
      register(null)
      return
    }
    onHighlight(song.notes[index]?.pitch ?? null)
    const onNote = (note: string) => {
      const current = songRef.current
      if (!current || doneRef.current || lockRef.current) return
      const expected = current.notes[indexRef.current]
      if (!expected) return
      if (note !== expected.pitch) {
        mistakesRef.current += 1
        setMistakes(mistakesRef.current)
        onFlash(note, 'bad')
        return
      }
      onFlash(note, 'good')
      lockRef.current = true
      const next = advanceSong(indexRef.current, current.notes.length)
      indexRef.current = next.index
      setIndex(next.index)
      if (next.done) {
        doneRef.current = true
        setDone(true)
        const accuracy = Math.round((current.notes.length / (current.notes.length + mistakesRef.current)) * 100)
        onProgress((state) => applySongClear(state, current.id, accuracy))
        onHighlight(null)
      } else {
        onHighlight(current.notes[next.index]?.pitch ?? null)
      }
      window.setTimeout(() => {
        lockRef.current = false
      }, 150)
    }
    register(onNote)
    return () => register(null)
  }, [song, index, done, onFlash, onHighlight, onProgress, register])

  useEffect(() => () => onHighlight(null), [onHighlight])

  useEffect(() => {
    const strip = stripRef.current
    const current = strip?.querySelector<HTMLElement>('[data-current="true"]')
    if (!strip || !current) return
    const delta =
      current.getBoundingClientRect().left -
      strip.getBoundingClientRect().left -
      (strip.clientWidth - current.offsetWidth) / 2
    strip.scrollTo({ left: Math.max(0, strip.scrollLeft + delta), behavior: 'smooth' })
  }, [index, song])

  function start(next: Song) {
    indexRef.current = 0
    mistakesRef.current = 0
    doneRef.current = false
    lockRef.current = false
    setSong(next)
    setIndex(0)
    setMistakes(0)
    setDone(false)
    onProgress((state) => applySongPlay(state, next.id))
  }

  if (!song) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl">跟彈曲目</h2>
          <p className="mt-1 text-sm text-muted-foreground">等待模式：按下發亮的琴鍵，對了才會進到下一個音。</p>
        </div>
        <div className="grid gap-3">
          {songs.map((item) => {
            const stats = songStats(progress, item.id)
            return (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.english}</CardDescription>
                  <CardAction>
                    <Button type="button" className="h-10" onClick={() => start(item)}>
                      開始
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{item.blurb}</p>
                  <p className="text-muted-foreground">{item.credit}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{item.notes.length} 個音</Badge>
                    {stats.clears > 0 ? <Badge>完成 {stats.clears} 次</Badge> : <Badge variant="outline">尚未完成</Badge>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  const total = song.notes.length
  const current = song.notes[Math.min(index, total - 1)]
  const upcoming = song.notes[index + 1]
  const accuracy = Math.round((total / (total + mistakes)) * 100)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">{song.title}</h2>
          <p className="text-sm text-muted-foreground">{song.english}</p>
        </div>
        <Button type="button" variant="outline" className="h-10" onClick={() => setSong(null)}>
          回曲目
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Badge>等待模式</Badge>
        <span className="text-sm text-muted-foreground">{done ? '全部彈完' : `第 ${index + 1} 音，共 ${total} 音`}</span>
      </div>
      <SongProgress value={done ? 100 : (index / total) * 100} aria-label="曲子進度" />
      {done ? (
        <div className="relative overflow-hidden rounded-2xl bg-card px-4 py-10 text-center ring-1 ring-foreground/10">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {['♪', '♫', '♩', '♬', '♪', '♫'].map((mark, markIndex) => (
              <span
                key={markIndex}
                className="float-note absolute text-2xl text-clay"
                style={{ left: `${12 + markIndex * 14}%`, animationDelay: `${markIndex * 0.12}s` }}
              >
                {mark}
              </span>
            ))}
          </div>
          <p className="font-serif text-4xl">完成了</p>
          <p className="mt-3 text-lg">準確率 {accuracy}%</p>
          <p className="mt-1 text-sm text-muted-foreground">{mistakes === 0 ? '一次都沒按錯。' : `按錯 ${mistakes} 次。`}</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button type="button" className="h-11" onClick={() => start(song)}>
              再彈一次
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={() => setSong(null)}>
              回曲目
            </Button>
          </div>
        </div>
      ) : current ? (
        <>
          <div className="rounded-2xl bg-card px-3 py-4 ring-1 ring-foreground/10 sm:px-6">
            <Staff note={current.pitch} clef="treble" labelMode={labelMode} />
            <div className="text-center">
              <p className="font-serif text-5xl">{current.lyric ?? <NoteName note={current.pitch} mode={labelMode} />}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {noteText(current.pitch, labelMode)}
                {upcoming ? ` · 下一個 ${upcoming.lyric ?? noteText(upcoming.pitch, labelMode)}` : ''}
              </p>
            </div>
          </div>
          <div ref={stripRef} className="flex gap-1.5 overflow-x-auto pb-1">
            {song.notes.map((item, itemIndex) => (
              <div
                key={`${item.pitch}-${itemIndex}`}
                data-current={itemIndex === index}
                className={`flex w-12 shrink-0 flex-col items-center rounded-lg px-1 py-1.5 text-xs ${
                  itemIndex === index
                    ? 'bg-primary text-primary-foreground'
                    : itemIndex < index
                      ? 'bg-moss/15 text-moss'
                      : 'bg-foreground/5 text-muted-foreground'
                }`}
              >
                <span>{noteText(item.pitch, labelMode)}</span>
                {item.lyric ? <span className="text-sm">{item.lyric}</span> : null}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" className="h-11" onClick={() => onPreview(current.pitch)}>
              聽這個音
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={() => start(song)}>
              重新開始
            </Button>
          </div>
          {mistakes > 0 ? <p className="text-sm text-muted-foreground">這首目前按錯 {mistakes} 次。</p> : null}
        </>
      ) : null}
    </div>
  )
}
