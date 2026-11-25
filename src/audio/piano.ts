import * as Tone from 'tone'

export type AudioStatus = 'loading' | 'ready' | 'synth'

const SAMPLE_FILES = [
  'C2', 'Ds2', 'Fs2', 'A2',
  'C3', 'Ds3', 'Fs3', 'A3',
  'C4', 'Ds4', 'Fs4', 'A4',
  'C5', 'Ds5', 'Fs5', 'A5',
  'C6',
] as const

let output: Tone.Volume | null = null
let sampler: Tone.Sampler | null = null
let synth: Tone.PolySynth | null = null
let loadPromise: Promise<AudioStatus> | null = null
let status: AudioStatus = 'loading'
let volumePercent = 80

function dbFromPercent(percent: number): number {
  if (percent <= 0) return -Infinity
  return -36 + (percent / 100) * 34
}

function applyVolume() {
  if (!output) return
  output.volume.value = dbFromPercent(volumePercent)
}

function samplePitch(file: string): string {
  return file.replace('s', '#')
}

function attack(note: string, velocity: number) {
  const time = Tone.now()
  if (sampler) sampler.triggerAttack(note, time, velocity)
  else synth?.triggerAttack(note, time, velocity)
}

function release(note: string) {
  const time = Tone.now()
  if (sampler) sampler.triggerRelease(note, time)
  else synth?.triggerRelease(note, time)
}

async function setup(): Promise<AudioStatus> {
  output = new Tone.Volume(dbFromPercent(volumePercent)).toDestination()
  let failed = false
  sampler = new Tone.Sampler({
    urls: Object.fromEntries(SAMPLE_FILES.map((file) => [samplePitch(file), `${file}.mp3`])),
    baseUrl: `${import.meta.env.BASE_URL}samples/`,
    attack: 0,
    release: 0.45,
    onerror: () => {
      failed = true
    },
  }).connect(output)

  try {
    await Tone.loaded()
  } catch {
    failed = true
  }

  if (failed || !sampler.loaded) {
    sampler.dispose()
    sampler = null
    const filter = new Tone.Filter(2200, 'lowpass').connect(output)
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.004, decay: 0.28, sustain: 0.12, release: 0.9 },
      volume: -8,
    }).connect(filter)
    status = 'synth'
    return status
  }

  status = 'ready'
  return status
}

export function loadPiano(): Promise<AudioStatus> {
  if (!loadPromise) loadPromise = setup()
  return loadPromise
}

export function audioStatus(): AudioStatus {
  return status
}

export function unlockAudio(): void {
  void Tone.start()
}

export function setVolume(percent: number): void {
  volumePercent = Math.max(0, Math.min(100, percent))
  applyVolume()
}

export function noteOn(note: string, velocity = 0.84): void {
  void Tone.start()
  if (status === 'loading') return
  attack(note, velocity)
}

export function noteOff(note: string): void {
  if (status === 'loading') return
  release(note)
}

export function preview(note: string): void {
  noteOn(note, 0.78)
  window.setTimeout(() => noteOff(note), 700)
}
