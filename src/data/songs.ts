export type SongNote = { pitch: string; lyric?: string }

export type Song = {
  id: string
  title: string
  english: string
  credit: string
  blurb: string
  notes: SongNote[]
}

function tune(title: string, rows: Array<[string, string?]>): SongNote[] {
  return rows.flatMap(([pitches, lyrics]) => {
    const notes = pitches.trim().split(/\s+/)
    const words = lyrics ? Array.from(lyrics) : []
    if (lyrics && words.length !== notes.length) {
      throw new Error(`${title}：「${lyrics}」有 ${words.length} 個字，但有 ${notes.length} 個音`)
    }
    return notes.map((pitch, index) => ({ pitch, lyric: words[index] }))
  })
}

export const songs: Song[] = [
  {
    id: 'twinkle',
    title: '小星星',
    english: 'Twinkle Twinkle Little Star',
    credit: '法國民歌，旋律已進入公共領域',
    blurb: '反覆出現 Do 和 Sol，適合當第一首。',
    notes: tune('小星星', [
      ['C4 C4 G4 G4 A4 A4 G4', '一閃一閃亮晶晶'],
      ['F4 F4 E4 E4 D4 D4 C4', '滿天都是小星星'],
      ['G4 G4 F4 F4 E4 E4 D4', '掛在天上放光明'],
      ['G4 G4 F4 F4 E4 E4 D4', '好像許多小眼睛'],
      ['C4 C4 G4 G4 A4 A4 G4', '一閃一閃亮晶晶'],
      ['F4 F4 E4 E4 D4 D4 C4', '滿天都是小星星'],
    ]),
  },
  {
    id: 'mary',
    title: '瑪麗有隻小羔羊',
    english: 'Mary Had a Little Lamb',
    credit: '英美兒歌，旋律與歌詞概念已進入公共領域',
    blurb: '鄰近的音來回走，用來練找旁邊的鍵。',
    notes: tune('瑪麗有隻小羔羊', [
      ['E4 D4 C4 D4 E4 E4 E4', '瑪麗有隻小羔羊'],
      ['D4 D4 D4 E4 G4 G4', '小羔羊小羔羊'],
      ['E4 D4 C4 D4 E4 E4 E4', '瑪麗有隻小羔羊'],
      ['E4 D4 D4 E4 D4 C4', '毛色白白如雪'],
    ]),
  },
  {
    id: 'tigers',
    title: '兩隻老虎',
    english: 'Frère Jacques',
    credit: '法國民歌，旋律已進入公共領域',
    blurb: '最後一句會走到中央 C 下面的 Sol。',
    notes: tune('兩隻老虎', [
      ['C4 D4 E4 C4', '兩隻老虎'],
      ['C4 D4 E4 C4', '兩隻老虎'],
      ['E4 F4 G4', '跑得快'],
      ['E4 F4 G4', '跑得快'],
      ['G4 A4 G4 F4 E4 C4', '一隻沒有耳朵'],
      ['G4 A4 G4 F4 E4 C4', '一隻沒有尾巴'],
      ['C4 G3 C4', '真奇怪'],
      ['C4 G3 C4', '真奇怪'],
    ]),
  },
  {
    id: 'ode',
    title: '歡樂頌',
    english: 'Ode to Joy',
    credit: '貝多芬《第九號交響曲》主題，旋律已進入公共領域',
    blurb: '句子比較長。連續兩個一樣的音要分開按。',
    notes: tune('歡樂頌', [
      ['E4 E4 F4 G4 G4 F4 E4 D4'],
      ['C4 C4 D4 E4 E4 D4 D4'],
      ['E4 E4 F4 G4 G4 F4 E4 D4'],
      ['C4 C4 D4 E4 D4 C4 C4'],
    ]),
  },
]

export function songById(id: string): Song | undefined {
  return songs.find((song) => song.id === id)
}
