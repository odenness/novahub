import { Anvil, BookOpen, Gauge, Hourglass, PawPrint, Sun, type LucideIcon } from 'lucide-react'

export interface NavItem { to: string; label: string; icon: LucideIcon; blurb: string; mobile: 'tab' | 'more' }

/** Order matters: page transitions slide left/right by position in this list. */
export const nav: NavItem[] = [
  { to: '/', label: 'Today', icon: Sun, blurb: "What's on right now", mobile: 'tab' },
  { to: '/timers', label: 'Timers', icon: Hourglass, blurb: 'Events, sieges and resets', mobile: 'tab' },
  { to: '/pets', label: 'Pets', icon: PawPrint, blurb: 'Merchant check and collection', mobile: 'tab' },
  { to: '/guide', label: 'Guide', icon: BookOpen, blurb: "Kanon's guide, chapter by chapter", mobile: 'tab' },
  { to: '/crafting', label: 'Crafting', icon: Anvil, blurb: 'Recipes and where to price them', mobile: 'more' },
  { to: '/meter', label: 'Meter', icon: Gauge, blurb: 'Nova Meter, the damage meter', mobile: 'more' },
]

export function sectionOf(pathname: string) {
  const i = nav.findIndex((n) => n.to !== '/' && pathname.startsWith(n.to))
  return i === -1 ? 0 : i
}
