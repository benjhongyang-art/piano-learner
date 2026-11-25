import type { Clef, LabelMode, Level } from './music.ts'

export type SongStats = {
  plays: number
  clears: number
  bestAccuracy: number
  lastClearedAt?: string
}

export type Progress = {
  version: 1
  sight: {
    attempts: number
    correct: number
    bestStreak: number
    trebleAttempts: number
    trebleCorrect: number
    bassAttempts: number
    bassCorrect: number
  }
  songs: Record<string, SongStats>
  freePlayNotes: number
}

export type Prefs = {
  labelMode: LabelMode
  volume: number
  baseOctave: number
  clef: Clef
  level: Level
  accidentals: boolean
}

const PROGRESS_KEY = 'qinjian-progress-v1'
const PREFS_KEY = 'qinjian-prefs-v1'

export function emptyProgress(): Progress {
  return {
    version: 1,
    sight: {
      attempts: 0,
      correct: 0,
      bestStreak: 0,
      trebleAttempts: 0,
      trebleCorrect: 0,
      bassAttempts: 0,
      bassCorrect: 0,
    },
    songs: {},
    freePlayNotes: 0,
  }
}

export function defaultPrefs(): Prefs {
  return {
    labelMode: 'solfege',
    volume: 80,
    baseOctave: 3,
    clef: 'treble',
    level: 'easy',
    accidentals: false,
  }
}

export function songStats(progress: Progress, songId: string): SongStats {
  return progress.songs[songId] ?? { plays: 0, clears: 0, bestAccuracy: 0 }
}

export function applySight(
  progress: Progress,
  event: { correct: boolean; clef: Clef; streak: number },
): Progress {
  const sight = { ...progress.sight, attempts: progress.sight.attempts + 1 }
  if (event.correct) sight.correct += 1
  if (event.clef === 'treble') {
    sight.trebleAttempts += 1
    if (event.correct) sight.trebleCorrect += 1
  } else {
    sight.bassAttempts += 1
    if (event.correct) sight.bassCorrect += 1
  }
  sight.bestStreak = Math.max(sight.bestStreak, event.streak)
  return { ...progress, sight }
}

export function applyFreeNote(progress: Progress): Progress {
  return { ...progress, freePlayNotes: progress.freePlayNotes + 1 }
}

export function applySongPlay(progress: Progress, songId: string): Progress {
  const prev = songStats(progress, songId)
  return {
    ...progress,
    songs: { ...progress.songs, [songId]: { ...prev, plays: prev.plays + 1 } },
  }
}

export function applySongClear(progress: Progress, songId: string, accuracy: number): Progress {
  const prev = songStats(progress, songId)
  const safe = Math.max(0, Math.min(100, Math.round(accuracy)))
  return {
    ...progress,
    songs: {
      ...progress.songs,
      [songId]: {
        ...prev,
        clears: prev.clears + 1,
        bestAccuracy: Math.max(prev.bestAccuracy, safe),
        lastClearedAt: new Date().toISOString(),
      },
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function loadProgress(): Progress {
  try {
    const raw = globalThis.localStorage?.getItem(PROGRESS_KEY)
    if (!raw) return emptyProgress()
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.sight)) return emptyProgress()
    const sight = parsed.sight
    if (typeof sight.attempts !== 'number' || typeof parsed.freePlayNotes !== 'number') return emptyProgress()
    return parsed as Progress
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress: Progress): void {
  try {
    globalThis.localStorage?.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // Private mode and full storage should not break practice.
  }
}

export function loadPrefs(): Prefs {
  const fallback = defaultPrefs()
  try {
    const raw = globalThis.localStorage?.getItem(PREFS_KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return fallback
    const labelMode = parsed.labelMode === 'letter' || parsed.labelMode === 'solfege' ? parsed.labelMode : fallback.labelMode
    const clef = parsed.clef === 'treble' || parsed.clef === 'bass' ? parsed.clef : fallback.clef
    const level = parsed.level === 'easy' || parsed.level === 'full' ? parsed.level : fallback.level
    const volume = typeof parsed.volume === 'number' ? Math.max(0, Math.min(100, parsed.volume)) : fallback.volume
    const baseOctave = parsed.baseOctave === 2 || parsed.baseOctave === 3 || parsed.baseOctave === 4 ? parsed.baseOctave : fallback.baseOctave
    const accidentals = typeof parsed.accidentals === 'boolean' ? parsed.accidentals : fallback.accidentals
    return { labelMode, volume, baseOctave, clef, level, accidentals }
  } catch {
    return fallback
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    globalThis.localStorage?.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore quota and private-mode failures.
  }
}
