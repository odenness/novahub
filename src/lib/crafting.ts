import craftRaw from '../data/crafting.json'

export type Grade = 'Common' | 'Rare' | 'Epic' | 'Unique'
export interface Component { id: string; name: string; qty: number }
export interface Recipe {
  id: string; name: string; grade: Grade; profession: string; mastery: number; yield: number
  slot: string | null; stage: 'base' | 'artisan' | 'expert' | 'dragonlord'; faction: 'elyos' | 'asmodian' | null
  components: Component[]; comboFrom: string | null; comboChance: number | null; comboOnly: boolean
}
interface ItemInfo { name: string; tradable?: boolean; requiresLevel?: number; sources?: { type: string; entries: string[] }[] }

export const recipes = craftRaw.recipes as unknown as Recipe[]
export const itemInfo = craftRaw.items as unknown as Record<string, ItemInfo>
export const recipeById = new Map(recipes.map((r) => [r.id, r]))
export const professions = ['Blacksmithing', 'Tailoring', 'Jewelcrafting', 'Alchemy', 'Cooking']
export const stages = [
  { id: 'base', label: 'Basics', blurb: 'Starter gear and consumables you can make from gathered materials.' },
  { id: 'artisan', label: 'Artisan', blurb: 'Splendent Orichalcum gear: the first proper crafted set.' },
  { id: 'expert', label: 'Expert', blurb: 'Upgrades of the Artisan pieces with better base stats.' },
  { id: 'dragonlord', label: 'Dragon Lord', blurb: 'Endgame Unique gear, built on top of Expert pieces.' },
] as const

export const gradeColor: Record<Grade, string> = {
  Common: 'var(--color-grade-common)', Rare: 'var(--color-grade-rare)', Epic: 'var(--color-grade-epic)', Unique: 'var(--color-grade-unique)',
}

export const itemIcon = (id: string) => `https://aion2hub.com/api/icon/items/${id}`

/** a2-tracker market page for an item on Baba (EU). */
export const A2_SERVER = 2318
export const marketUrl = (id: string) => `https://a2-tracker.com/item/${id}?server=${A2_SERVER}&locale=en-US`
