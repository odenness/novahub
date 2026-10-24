import guideRaw from '../data/guide.json'
import changelogRaw from '../data/changelog.json'

export interface Run { t: string; b?: number; i?: number; u?: number; s?: number; c?: string; hl?: string; href?: string }
export type Cell = ({ runs: Run[] } | { img: { src: string; w: number | null; h: number | null } })[]
export type Block =
  | { type: 'p'; runs: Run[] }
  | { type: 'heading'; level: number; text: string }
  | { type: 'image'; src: string; w: number; h: number }
  | { type: 'list'; ordered: boolean; items: { level: number; runs: Run[] }[] }
  | { type: 'hr' }
  | { type: 'table'; rows: Cell[][] }
export interface Chapter { id: string; number: number; title: string; blocks: Block[] }

const titleCase = (s: string) =>
  s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s(/&-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : s

export const guideMeta = guideRaw.meta
export const chapters: Chapter[] = (guideRaw.chapters as unknown as Chapter[]).map((c) => ({ ...c, title: titleCase(c.title) }))
export const headingText = titleCase
/** What changed in Kanon's doc at each sync, newest first (written by scripts/sync-guide.mjs). */
export interface GuideChange { id: string; title: string; added: string[]; removed: string[] }
export interface GuideSync { syncedAt: string; docLastUpdated: string | null; changes: GuideChange[] }
export const changelog = changelogRaw as unknown as GuideSync[]
/** Lines added to a chapter in the latest sync (to highlight them while reading). */
export const latestAdded = (id: string) => new Set(changelog[0]?.changes.find((c) => c.id === id)?.added ?? [])

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
