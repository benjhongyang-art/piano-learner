export type Clef = 'treble' | 'bass'
export type LabelMode = 'letter' | 'solfege'
export type Level = 'easy' | 'full'

export const KEYBOARD_LOW = 'C2'
export const KEYBOARD_HIGH = 'C6'

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}
const SOLFEGE: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

const NOTE_RE = /^([A-G])(#)?(\d)$/

export type ParsedNote = {
  letter: string
  accidental: '' | '#'
  octave: number
  midi: number
  name: string
}

export function midiToNote(midi: number): string {
  const name = NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${name}${octave}`
}

export function parseNote(note: string): ParsedNote {
  const match = NOTE_RE.exec(note)
  if (!match) throw new Error(`無效的音名：${note}`)
  const letter = match[1] ?? 'C'
  const accidental = match[2] === '#' ? '#' : ''
  const octave = Number(match[3])
  const midi = (octave + 1) * 12 + (SEMITONE[letter] ?? 0) + (accidental === '#' ? 1 : 0)
  return { letter, accidental, octave, midi, name: midiToNote(midi) }
}

export function noteToMidi(note: string): number {
  return parseNote(note).midi
}

export function isBlack(note: string): boolean {
  return parseNote(note).accidental === '#'
}

export function formatNote(note: string, mode: LabelMode): { name: string; octave: number } {
  const parsed = parseNote(note)
  const sharp = parsed.accidental === '#' ? (mode === 'letter' ? '#' : '♯') : ''
  const name = mode === 'letter' ? `${parsed.letter}${sharp}` : `${SOLFEGE[parsed.letter] ?? parsed.letter}${sharp}`
  return { name, octave: parsed.octave }
}

export function noteText(note: string, mode: LabelMode): string {
  const formatted = formatNote(note, mode)
  return `${formatted.name}${formatted.octave}`
}

export type WhiteKey = { note: string; black?: string }

export function buildWhiteKeys(start = KEYBOARD_LOW, end = KEYBOARD_HIGH): WhiteKey[] {
  const low = noteToMidi(start)
  const high = noteToMidi(end)
  const keys: WhiteKey[] = []
  for (let midi = low; midi <= high; midi += 1) {
    const note = midiToNote(midi)
    if (isBlack(note)) continue
    const blackMidi = midi + 1
    const blackName = midiToNote(blackMidi)
    const black = blackMidi <= high && isBlack(blackName) ? blackName : undefined
    keys.push(black ? { note, black } : { note })
  }
  return keys
}

export function isWithinKeyboard(note: string): boolean {
  const midi = noteToMidi(note)
  return midi >= noteToMidi(KEYBOARD_LOW) && midi <= noteToMidi(KEYBOARD_HIGH)
}

const MIDDLE_STEP: Record<Clef, number> = {
  treble: 4 * 7 + 6,
  bass: 3 * 7 + 1,
}

export function diatonic(note: string): number {
  const parsed = parseNote(note)
  return parsed.octave * 7 + LETTERS.indexOf(parsed.letter as (typeof LETTERS)[number])
}

export function staffStep(note: string, clef: Clef): number {
  return diatonic(note) - MIDDLE_STEP[clef]
}

export function ledgerSteps(step: number): number[] {
  const lines: number[] = []
  if (step >= 6) {
    for (let line = 6; line <= step; line += 2) lines.push(line)
  } else if (step <= -6) {
    for (let line = -6; line >= step; line -= 2) lines.push(line)
  }
  return lines
}

const RANGE: Record<Level, Record<Clef, [string, string]>> = {
  easy: { treble: ['C4', 'G5'], bass: ['C3', 'C4'] },
  full: { treble: ['A3', 'C6'], bass: ['G2', 'E4'] },
}

export function practicePool(clef: Clef, level: Level, accidentals: boolean): string[] {
  const [start, end] = RANGE[level][clef]
  const notes: string[] = []
  for (let midi = noteToMidi(start); midi <= noteToMidi(end); midi += 1) {
    const note = midiToNote(midi)
    if (!accidentals && isBlack(note)) continue
    notes.push(note)
  }
  return notes
}

export function pickNext(pool: readonly string[], previous: string | null, rand: () => number = Math.random): string {
  if (pool.length === 0) throw new Error('沒有可練習的音')
  const start = Math.floor(rand() * pool.length)
  for (let offset = 0; offset < pool.length; offset += 1) {
    const choice = pool[(start + offset) % pool.length]
    if (choice && choice !== previous) return choice
  }
  return pool[start] ?? ''
}

export type KeyBinding = { code: string; label: string; semitone: number }

export const KEY_BINDINGS: readonly KeyBinding[] = [
  { code: 'KeyZ', label: 'Z', semitone: 0 },
  { code: 'KeyS', label: 'S', semitone: 1 },
  { code: 'KeyX', label: 'X', semitone: 2 },
  { code: 'KeyD', label: 'D', semitone: 3 },
  { code: 'KeyC', label: 'C', semitone: 4 },
  { code: 'KeyV', label: 'V', semitone: 5 },
  { code: 'KeyG', label: 'G', semitone: 6 },
  { code: 'KeyB', label: 'B', semitone: 7 },
  { code: 'KeyH', label: 'H', semitone: 8 },
  { code: 'KeyN', label: 'N', semitone: 9 },
  { code: 'KeyJ', label: 'J', semitone: 10 },
  { code: 'KeyM', label: 'M', semitone: 11 },
  { code: 'KeyQ', label: 'Q', semitone: 12 },
  { code: 'Digit2', label: '2', semitone: 13 },
  { code: 'KeyW', label: 'W', semitone: 14 },
  { code: 'Digit3', label: '3', semitone: 15 },
  { code: 'KeyE', label: 'E', semitone: 16 },
  { code: 'KeyR', label: 'R', semitone: 17 },
  { code: 'Digit5', label: '5', semitone: 18 },
  { code: 'KeyT', label: 'T', semitone: 19 },
  { code: 'Digit6', label: '6', semitone: 20 },
  { code: 'KeyY', label: 'Y', semitone: 21 },
  { code: 'Digit7', label: '7', semitone: 22 },
  { code: 'KeyU', label: 'U', semitone: 23 },
  { code: 'KeyI', label: 'I', semitone: 24 },
]

export function noteForCode(code: string, baseOctave: number): string | null {
  const binding = KEY_BINDINGS.find((item) => item.code === code)
  if (!binding) return null
  const midi = (baseOctave + 1) * 12 + binding.semitone
  if (midi < noteToMidi(KEYBOARD_LOW) || midi > noteToMidi(KEYBOARD_HIGH)) return null
  return midiToNote(midi)
}

export function keyLabelForNote(note: string, baseOctave: number): string | null {
  const offset = noteToMidi(note) - (baseOctave + 1) * 12
  return KEY_BINDINGS.find((item) => item.semitone === offset)?.label ?? null
}

export function advanceSong(index: number, total: number): { index: number; done: boolean } {
  const next = index + 1
  if (next >= total) return { index: total, done: true }
  return { index: next, done: false }
}
