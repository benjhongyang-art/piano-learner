import { songs } from '../data/songs.ts'
import {
  KEY_BINDINGS,
  advanceSong,
  buildWhiteKeys,
  formatNote,
  isWithinKeyboard,
  keyLabelForNote,
  ledgerSteps,
  noteForCode,
  pickNext,
  practicePool,
  staffStep,
} from './music.ts'
import { applySight, applySongClear, applySongPlay, emptyProgress } from './storage.ts'

import { describe, expect, it } from 'vitest'

describe('staff positions', () => {
  it('places treble reference notes on the expected lines', () => {
    expect(staffStep('B4', 'treble')).toBe(0)
    expect(staffStep('G4', 'treble')).toBe(-2)
    expect(staffStep('E4', 'treble')).toBe(-4)
    expect(staffStep('F5', 'treble')).toBe(4)
    expect(staffStep('C4', 'treble')).toBe(-6)
    expect(staffStep('G3', 'treble')).toBe(-9)
  })

  it('places bass reference notes on the expected lines', () => {
    expect(staffStep('D3', 'bass')).toBe(0)
    expect(staffStep('F3', 'bass')).toBe(2)
    expect(staffStep('G2', 'bass')).toBe(-4)
    expect(staffStep('A3', 'bass')).toBe(4)
    expect(staffStep('C4', 'bass')).toBe(6)
  })

  it('draws ledger lines only outside the staff', () => {
    expect(ledgerSteps(0)).toEqual([])
    expect(ledgerSteps(4)).toEqual([])
    expect(ledgerSteps(-4)).toEqual([])
    expect(ledgerSteps(7)).toEqual([6])
    expect(ledgerSteps(8)).toEqual([6, 8])
    expect(ledgerSteps(-9)).toEqual([-6, -8])
  })
})

describe('keyboard', () => {
  it('covers C2 to C6 with 29 white keys', () => {
    const keys = buildWhiteKeys()
    expect(keys).toHaveLength(29)
    expect(keys[0]?.note).toBe('C2')
    expect(keys.at(-1)?.note).toBe('C6')
    expect(keys.find((key) => key.note === 'C4')?.black).toBe('C#4')
    expect(keys.find((key) => key.note === 'E4')?.black).toBeUndefined()
  })

  it('maps the computer keyboard across two octaves', () => {
    expect(noteForCode('KeyZ', 3)).toBe('C3')
    expect(noteForCode('KeyQ', 3)).toBe('C4')
    expect(noteForCode('Digit2', 3)).toBe('C#4')
    expect(noteForCode('KeyI', 3)).toBe('C5')
    expect(noteForCode('KeyZ', 2)).toBe('C2')
    expect(noteForCode('KeyI', 4)).toBe('C6')
    expect(noteForCode('KeyI', 5)).toBeNull()
    expect(keyLabelForNote('C4', 3)).toBe('Q')
    expect(keyLabelForNote('C2', 3)).toBeNull()
    expect(new Set(KEY_BINDINGS.map((item) => item.semitone)).size).toBe(KEY_BINDINGS.length)
  })
})

describe('practice and labels', () => {
  it('keeps every practice note on the keyboard', () => {
    for (const clef of ['treble', 'bass'] as const) {
      for (const level of ['easy', 'full'] as const) {
        for (const note of practicePool(clef, level, true)) {
          expect(isWithinKeyboard(note)).toBe(true)
        }
      }
    }
    expect(practicePool('treble', 'easy', false).every((note) => !note.includes('#'))).toBe(true)
    expect(practicePool('treble', 'easy', true).some((note) => note.includes('#'))).toBe(true)
  })

  it('formats solfege with Si and a sharp', () => {
    expect(formatNote('C4', 'solfege')).toEqual({ name: 'Do', octave: 4 })
    expect(formatNote('C#4', 'solfege')).toEqual({ name: 'Do♯', octave: 4 })
    expect(formatNote('B3', 'solfege').name).toBe('Si')
    expect(formatNote('F#5', 'letter')).toEqual({ name: 'F#', octave: 5 })
  })

  it('does not repeat the previous note when it has a choice', () => {
    const pool = ['C4', 'D4', 'E4']
    expect(pickNext(pool, 'C4', () => 0)).not.toBe('C4')
    expect(pickNext(['A3'], 'A3')).toBe('A3')
  })
})

describe('songs and progress', () => {
  it('ships four public-domain beginner songs inside the keyboard', () => {
    expect(songs.map((song) => song.id)).toEqual(['twinkle', 'mary', 'tigers', 'ode'])
    for (const song of songs) {
      expect(song.notes.length).toBeGreaterThan(10)
      for (const note of song.notes) {
        expect(isWithinKeyboard(note.pitch)).toBe(true)
        expect(note.pitch.includes('#')).toBe(false)
      }
    }
    expect(songs[0]?.notes).toHaveLength(42)
    expect(songs[1]?.notes).toHaveLength(26)
    expect(songs[2]?.notes).toHaveLength(32)
    expect(songs[3]?.notes).toHaveLength(30)
    expect(songs[3]?.notes.every((note) => note.lyric === undefined)).toBe(true)
  })

  it('advances a song only to the end', () => {
    expect(advanceSong(0, 3)).toEqual({ index: 1, done: false })
    expect(advanceSong(2, 3)).toEqual({ index: 3, done: true })
  })

  it('tracks sight-reading streaks and song clears', () => {
    let progress = emptyProgress()
    progress = applySight(progress, { correct: true, clef: 'treble', streak: 1 })
    progress = applySight(progress, { correct: false, clef: 'bass', streak: 0 })
    progress = applySight(progress, { correct: true, clef: 'treble', streak: 4 })
    expect(progress.sight).toMatchObject({
      attempts: 3,
      correct: 2,
      bestStreak: 4,
      trebleAttempts: 2,
      trebleCorrect: 2,
      bassAttempts: 1,
      bassCorrect: 0,
    })
    progress = applySongPlay(progress, 'twinkle')
    progress = applySongClear(progress, 'twinkle', 91.4)
    progress = applySongClear(progress, 'twinkle', 80)
    expect(progress.songs.twinkle).toMatchObject({ plays: 1, clears: 2, bestAccuracy: 91 })
  })
})
