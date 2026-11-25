import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { songs } from '@/data/songs'
import { songStats, type Progress } from '@/lib/storage'

const dateFormat = new Intl.DateTimeFormat('zh-TW', {
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function ProgressPage({
  progress,
  onReset,
}: {
  progress: Progress
  onReset: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const { sight } = progress
  const rate = sight.attempts === 0 ? '—' : `${Math.round((sight.correct / sight.attempts) * 100)}%`
  const untouched = sight.attempts === 0 && progress.freePlayNotes === 0 && songs.every((song) => songStats(progress, song.id).plays === 0)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl">學習紀錄</h2>
        <p className="mt-1 text-sm text-muted-foreground">紀錄只存在這台裝置的瀏覽器裡，不會上傳。</p>
      </div>
      {untouched ? (
        <div className="rounded-2xl bg-card px-4 py-8 text-center ring-1 ring-foreground/10">
          <p className="font-serif text-2xl">還沒有練習紀錄</p>
          <p className="mt-2 text-sm text-muted-foreground">先去識譜練習答幾題，或跟彈一首曲子。</p>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>識譜練習</CardTitle>
            <CardDescription>累計答題</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-serif text-4xl">{rate}</p>
            <p>答對 {sight.correct} / {sight.attempts} 題</p>
            <p className="text-muted-foreground">最佳連續 {sight.bestStreak}</p>
            <p className="text-muted-foreground">
              高音 {pair(sight.trebleCorrect, sight.trebleAttempts)} · 低音 {pair(sight.bassCorrect, sight.bassAttempts)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>自由彈奏</CardTitle>
            <CardDescription>彈過的音</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-4xl">{progress.freePlayNotes}</p>
            <p className="mt-2 text-muted-foreground">每按下一個新的音計一次。</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>跟彈曲目</CardTitle>
          <CardDescription>完成次數與最佳準確率</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {songs.map((song) => {
            const stats = songStats(progress, song.id)
            return (
              <div key={song.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium">{song.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.plays === 0
                      ? '還沒彈過'
                      : stats.clears === 0
                        ? `練過 ${stats.plays} 次，尚未完成`
                        : `完成 ${stats.clears} 次 · 最佳 ${stats.bestAccuracy}% · 練過 ${stats.plays} 次`}
                  </p>
                  {stats.lastClearedAt ? (
                    <p className="text-xs text-muted-foreground">上次完成：{dateFormat.format(new Date(stats.lastClearedAt))}</p>
                  ) : null}
                </div>
                {stats.clears > 0 ? <Badge>已完成</Badge> : <Badge variant="outline">未完成</Badge>}
              </div>
            )
          })}
        </CardContent>
      </Card>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            className="h-10"
            onClick={() => {
              onReset()
              setConfirming(false)
            }}
          >
            確定清除
          </Button>
          <Button type="button" variant="outline" className="h-10" onClick={() => setConfirming(false)}>
            取消
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="h-10" onClick={() => setConfirming(true)} disabled={untouched}>
          清除紀錄
        </Button>
      )}
    </div>
  )
}

function pair(correct: number, attempts: number): string {
  if (attempts === 0) return '—'
  return `${correct}/${attempts}`
}
