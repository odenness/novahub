import Fuse from 'fuse.js'
import { motion } from 'motion/react'
import { BookOpen, CornerDownLeft, Hourglass, Anvil, Search as SearchIcon, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pets, petIcon } from '../lib/pets'
import { chapters, headingText } from '../lib/guide'
import { recipes, itemIcon } from '../lib/crafting'
import { events, nextOf, countdown, clock, isLive } from '../lib/time'
import { nav } from '../lib/nav'

type Hit =
  | { kind: 'pet'; title: string; to: string; pet: (typeof pets)[number] }
  | { kind: 'event'; title: string; to: string; eventId: string }
  | { kind: 'guide'; title: string; to: string; sub: string }
  | { kind: 'recipe'; title: string; to: string; sub: string; id: string }
  | { kind: 'page'; title: string; to: string; sub: string }

function buildIndex(): Hit[] {
  const out: Hit[] = []
  for (const n of nav) out.push({ kind: 'page', title: n.label, to: n.to, sub: n.blurb })
  for (const p of pets) out.push({ kind: 'pet', title: p.name, to: `/pets?q=${encodeURIComponent(p.name)}`, pet: p })
  for (const e of events) out.push({ kind: 'event', title: e.name, to: `/timers#${e.id}`, eventId: e.id })
  for (const c of chapters) {
    out.push({ kind: 'guide', title: c.title, to: `/guide/${c.id}`, sub: c.number ? `Chapter ${c.number}` : 'Guide' })
    c.blocks.forEach((b, i) => {
      if (b.type === 'heading') out.push({ kind: 'guide', title: headingText(b.text), to: `/guide/${c.id}#b${i}`, sub: c.title })
    })
  }
  const seen = new Set<string>()
  for (const r of recipes) {
    if (seen.has(r.name)) continue
    seen.add(r.name)
    out.push({ kind: 'recipe', title: r.name, to: `/crafting/${r.id}`, sub: `${r.profession} · ${r.grade}`, id: r.id })
  }
  return out
}

const groupLabel: Record<Hit['kind'], string> = { page: 'Go to', pet: 'Pets', event: 'Timers', guide: 'Guide', recipe: 'Crafting' }

export default function Palette({ onClose }: { onClose: () => void }) {
  const index = useMemo(buildIndex, [])
  const fuse = useMemo(() => new Fuse(index, { keys: ['title', 'sub'], threshold: 0.32, ignoreLocation: true }), [index])
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const now = Date.now()

  const hits = useMemo<Hit[]>(() => {
    if (!q.trim()) return index.filter((h) => h.kind === 'page')
    return fuse.search(q, { limit: 14 }).map((r) => r.item)
  }, [q, fuse, index])

  useEffect(() => { setActive(0) }, [q])
  useEffect(() => { inputRef.current?.focus() }, [])

  const go = (h: Hit) => { navigate(h.to); onClose() }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && hits[active]) go(hits[active])
  }

  return (
    <motion.div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[8vh] md:pt-[14vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-abyss-950/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        role="dialog" aria-label="Search NovaHub"
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-abyss-850 shadow-2xl shadow-black/50"
        initial={{ y: -16, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: -10, scale: 0.98 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
          <SearchIcon className="size-5 shrink-0 text-aether-400" />
          <input
            ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="A pet, an event, a recipe, a guide topic…"
            className="h-14 w-full bg-transparent text-base text-parch-50 placeholder:text-parch-500 focus:outline-none"
          />
          <button onClick={onClose} className="rounded-lg p-1.5 text-parch-500 hover:text-parch-100" aria-label="Close search"><X className="size-5" /></button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2">
          {hits.length === 0 && <li className="px-3 py-8 text-center text-sm text-parch-500">Nothing matches “{q}”. Try a shorter word, like part of a pet or item name.</li>}
          {hits.map((h, i) => (
            <li key={h.kind + h.to}>
              {(i === 0 || hits[i - 1].kind !== h.kind) && <div className="px-3 pb-1 pt-3 text-xs text-parch-500">{groupLabel[h.kind]}</div>}
              <button
                onMouseEnter={() => setActive(i)} onClick={() => go(h)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${i === active ? 'bg-white/[0.07]' : ''}`}
              >
                <HitIcon h={h} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-parch-50">{h.title}</span>
                  <HitSub h={h} now={now} />
                </span>
                {i === active && <CornerDownLeft className="size-4 shrink-0 text-parch-500" />}
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  )
}

function HitIcon({ h }: { h: Hit }) {
  const box = 'grid size-9 shrink-0 place-items-center rounded-xl bg-abyss-800'
  if (h.kind === 'pet') return <img src={petIcon(h.pet)} alt="" className="size-9 shrink-0 rounded-xl bg-abyss-800 object-contain p-0.5" />
  if (h.kind === 'recipe') return <img src={itemIcon(h.id)} alt="" referrerPolicy="no-referrer" className="size-9 shrink-0 rounded-xl bg-abyss-800 object-contain p-1" />
  const Icon = h.kind === 'event' ? Hourglass : h.kind === 'guide' ? BookOpen : (nav.find((n) => n.to === h.to)?.icon ?? Anvil)
  return <span className={box}><Icon className="size-[18px] text-aether-300" /></span>
}

/** The useful answer, right in the result: Buy/Skip for pets, next start for events. */
function HitSub({ h, now }: { h: Hit; now: number }) {
  const cls = 'block truncate text-[13px]'
  if (h.kind === 'pet')
    return h.pet.shopOnly
      ? <span className={`${cls} text-elyos-300`}>Buy it: shop-only, never drops</span>
      : <span className={`${cls} text-parch-500`}>Skip: drops from {h.pet.drops[0]}</span>
  if (h.kind === 'event') {
    const e = events.find((x) => x.id === h.eventId)!
    const o = nextOf(e, now)
    if (!o) return null
    return isLive(o, now)
      ? <span className={`${cls} text-asmo-400`}>On now</span>
      : <span className={`${cls} text-parch-500`}>Next at {clock(o.start)}, in {countdown(o.start - now)}</span>
  }
  return <span className={`${cls} text-parch-500`}>{h.sub}</span>
}
