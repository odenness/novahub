import guideRaw from '../data/guide.json'

export interface Run { t: string; b?: number; i?: number; u?: number; c?: string; hl?: string; href?: string }
export type Block =
  | { type: 'p'; runs: Run[] }
  | { type: 'heading'; level: number; text: string }
  | { type: 'image'; src: string; w: number; h: number }
  | { type: 'list'; ordered: boolean; items: { level: number; runs: Run[] }[] }
  | { type: 'hr' }
export interface Chapter { id: string; number: number; title: string; blocks: Block[] }

const titleCase = (s: string) =>
  s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s(/&-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : s

export const guideMeta = guideRaw.meta
export const chapters: Chapter[] = (guideRaw.chapters as unknown as Chapter[]).map((c) => ({ ...c, title: titleCase(c.title) }))
export const headingText = titleCase
export const guideImg = (src: string) => `${import.meta.env.BASE_URL}${src}`

/** Short plain-text summary of a chapter for cards and search. */
export function chapterSummary(c: Chapter, len = 140) {
  const text = c.blocks
    .flatMap((b) => (b.type === 'p' ? [b.runs.map((r) => r.t).join('')] : b.type === 'list' ? b.items.map((i) => i.runs.map((r) => r.t).join('')) : []))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > len ? text.slice(0, len).replace(/\s\S*$/, '') + '…' : text
}
