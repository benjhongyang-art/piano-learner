import { ledgerSteps, noteText, staffStep, type Clef, type LabelMode } from '@/lib/music'

const WIDTH = 480
const HEIGHT = 214
const LINE = 14
const MIDDLE_Y = 108
const NOTE_X = 292

const CLEF = {
  treble: { glyph: '\u{1D11E}', size: 112, x: 78, dy: 8 },
  bass: { glyph: '\u{1D122}', size: 72, x: 74, dy: 1 },
} as const

function yFor(step: number): number {
  return MIDDLE_Y - step * (LINE / 2)
}

export function Staff({
  note,
  clef,
  status = 'idle',
  labelMode,
}: {
  note: string
  clef: Clef
  status?: 'idle' | 'good' | 'bad'
  labelMode: LabelMode
}) {
  const step = staffStep(note, clef)
  const y = yFor(step)
  const stemUp = step < 0
  const sharp = note.includes('#')
  const clefLayout = CLEF[clef]
  const anchorStep = clef === 'treble' ? -2 : 2
  const top = yFor(4)
  const bottom = yFor(-4)
  const tone = status === 'good' ? 'text-moss' : status === 'bad' ? 'text-rose' : 'text-foreground'
  const spoken = `${clef === 'treble' ? '高音譜號' : '低音譜號'}，${noteText(note, labelMode)}`

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={spoken} className="mx-auto h-auto w-full max-w-md text-foreground">
      {[-4, -2, 0, 2, 4].map((line) => (
        <line
          key={line}
          x1={28}
          x2={452}
          y1={yFor(line)}
          y2={yFor(line)}
          stroke="currentColor"
          strokeWidth={1.35}
        />
      ))}
      <line x1={138} x2={138} y1={top} y2={bottom} stroke="currentColor" strokeWidth={1.35} />
      <text
        x={clefLayout.x}
        y={yFor(anchorStep) + clefLayout.dy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        style={{ fontFamily: '"Noto Music", sans-serif', fontSize: clefLayout.size }}
      >
        {clefLayout.glyph}
      </text>
      <g className={tone}>
        {ledgerSteps(step).map((line) => (
          <line
            key={line}
            x1={NOTE_X - 20}
            x2={NOTE_X + 20}
            y1={yFor(line)}
            y2={yFor(line)}
            stroke="currentColor"
            strokeWidth={1.5}
          />
        ))}
        {sharp ? <Sharp x={NOTE_X - 30} y={y} /> : null}
        <ellipse cx={NOTE_X} cy={y} rx={9} ry={5.2} transform={`rotate(-18 ${NOTE_X} ${y})`} fill="currentColor" />
        <line
          x1={stemUp ? NOTE_X + 7.8 : NOTE_X - 7.6}
          x2={stemUp ? NOTE_X + 7.8 : NOTE_X - 7.6}
          y1={stemUp ? y - 2 : y + 2}
          y2={stemUp ? y - LINE * 3.4 : y + LINE * 3.4}
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

function Sharp({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="currentColor" fill="none" strokeLinecap="round">
      <line x1={-4} y1={-15} x2={-4} y2={13} strokeWidth={1.7} />
      <line x1={4.5} y1={-17} x2={4.5} y2={11} strokeWidth={1.7} />
      <line x1={-9} y1={-2.5} x2={9} y2={-7} strokeWidth={2.7} />
      <line x1={-9} y1={6} x2={9} y2={1.5} strokeWidth={2.7} />
    </g>
  )
}
