import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ChevronRight, ExternalLink, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageTitle, Segmented } from '../components/ui'
import { useStored } from '../lib/hooks'
import { gradeColor, itemIcon, itemInfo, marketUrl, professions, recipeById, recipes, stages, type Grade, type Recipe } from '../lib/crafting'

type Faction = 'elyos' | 'asmodian'
const forFaction = (f: Faction) => (r: Recipe) => !r.faction || r.faction === f

export function ItemIcon({ id, grade, size = 'md' }: { id: string; grade?: Grade; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false)
  const box = size === 'lg' ? 'size-24 rounded-3xl' : size === 'md' ? 'size-11 rounded-xl' : 'size-9 rounded-lg'
  return (
    <span className={`relative grid shrink-0 place-items-center bg-abyss-800 ${box}`} style={grade ? { boxShadow: `inset 0 0 0 1.5px ${gradeColor[grade]}, 0 0 22px -10px ${gradeColor[grade]}` } : { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
      {!failed && <img src={itemIcon(id)} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="size-[84%] object-contain" />}
    </span>
  )
}

function PriceLink({ id, compact }: { id: string; compact?: boolean }) {
  return (
    <a href={marketUrl(id)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
      className={`inline-flex shrink-0 items-center gap-1 rounded-xl text-aether-300 hover:bg-aether-400/10 ${compact ? 'px-2 py-1.5 text-[13px]' : 'border border-aether-400/30 px-3.5 py-2 text-sm'}`}
      aria-label="Check price on Baba at A2-Tracker">
      {compact ? 'Price' : 'Check price on Baba'} <ExternalLink className="size-3.5" />
    </a>
  )
}

export function CraftingIndex() {
  const [prof, setProf] = useStored('nh.craftProf', 'Blacksmithing')
  const [faction, setFaction] = useStored<Faction>('nh.faction', 'elyos')
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState<string[]>([])

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const pool = recipes.filter(forFaction(faction)).filter((r) => (needle ? r.name.toLowerCase().includes(needle) : r.profession === prof))
    return stages.map((s) => {
      const seen = new Set<string>()
      const list = pool.filter((r) => r.stage === s.id).sort((a, b) => a.mastery - b.mastery || a.name.localeCompare(b.name)).filter((r) => !seen.has(r.name) && seen.add(r.name))
      return { ...s, list }
    }).filter((g) => g.list.length)
  }, [prof, faction, q])

  return (
    <div>
      <PageTitle title="Crafting" lead="Every recipe with its materials laid out, from your first Basics to Dragon Lord gear. Prices live on A2-Tracker: tap Price on anything to see what it goes for on Baba." >
        <Segmented id="faction" value={faction} onChange={setFaction} options={[{ value: 'elyos', label: 'Elyos' }, { value: 'asmodian', label: 'Asmodian' }]} />
      </PageTitle>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
          {professions.map((p) => (
            <button key={p} onClick={() => { setProf(p); setQ('') }}
              className={`relative shrink-0 rounded-2xl px-3.5 py-2 text-[15px] ${prof === p && !q ? 'text-parch-50' : 'text-parch-500 hover:text-parch-100'}`}>
              {prof === p && !q && <motion.span layoutId="prof-pill" className="absolute inset-0 rounded-2xl bg-white/[0.07] ring-1 ring-white/[0.08]" />}
              <span className="relative">{p}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-abyss-850/70 px-3 md:ml-auto md:w-72">
          <Search className="size-4 text-parch-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find any recipe" className="h-10 w-full bg-transparent text-[15px] placeholder:text-parch-500 focus:outline-none" />
        </label>
      </div>

      {groups.length === 0 && <p className="text-parch-500">No recipe matches “{q}”.</p>}

      {/* The path: stages in the order you climb them */}
      <ol className="relative space-y-10 border-l border-white/[0.08] pl-5 md:pl-8">
        {groups.map((g) => {
          const open = expanded.includes(g.id) || q
          const shown = open ? g.list : g.list.slice(0, 8)
          return (
            <li key={g.id} className="relative">
              <span className="absolute -left-[27px] top-2 size-3 rounded-full border-2 border-abyss-900 bg-aether-400 md:-left-[39px]" />
              <h2 className="font-display text-[24px] text-parch-50">{g.label}</h2>
              <p className="mb-3 text-[14px] text-parch-500">{g.blurb}</p>
              <ul className="grid gap-2 md:grid-cols-2">
                {shown.map((r) => (
                  <li key={r.id}>
                    <Link to={`/crafting/${r.id}`} className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-abyss-850/60 px-3 py-2.5 hover:border-white/15">
                      <ItemIcon id={r.id} grade={r.grade} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-parch-50">{r.name}</span>
                        <span className="block text-[13px] text-parch-500">
                          <span style={{ color: gradeColor[r.grade] }}>{r.grade}</span>{r.slot ? `, ${r.slot}` : ''}, mastery {r.mastery}{q ? `, ${r.profession}` : ''}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-parch-500 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
              {!open && g.list.length > 8 && (
                <button onClick={() => setExpanded((e) => [...e, g.id])} className="mt-2 rounded-xl px-3 py-1.5 text-sm text-aether-300 hover:bg-white/[0.04]">
                  Show all {g.list.length} {g.label} recipes
                </button>
              )}
            </li>
          )
        })}
      </ol>

      <section className="mt-14 grid gap-3 md:grid-cols-3">
        <Note title="Read prices as a guide">A2-Tracker shows current asking prices on Baba, not completed sales. Check a couple of listings before buying in bulk.</Note>
        <Note title="Splendent combos">Some pieces have a {Math.round((recipes.find((r) => r.comboChance)?.comboChance ?? 0.25) * 100)}% chance to come out as a better Splendent version. Their pages tell you which recipe to craft.</Note>
        <Note title="Craft or buy?">Open the finished item's price next to its materials. If it's listed for less than they cost, buy it.</Note>
      </section>
    </div>
  )
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/[0.07] bg-abyss-850/60 p-4">
      <h3 className="font-display text-lg text-parch-50">{title}</h3>
      <p className="mt-1 text-[14px] leading-relaxed text-parch-300">{children}</p>
    </div>
  )
}

export function CraftingItem() {
  const { id } = useParams()
  const r = id ? recipeById.get(id) : undefined
  const usedIn = useMemo(() => {
    if (!r) return []
    const seen = new Set<string>()
    return recipes.filter((x) => x.components.some((c) => c.id === r.id)).filter((x) => !seen.has(x.name) && seen.add(x.name)).slice(0, 8)
  }, [r])
  if (!r) return <Navigate to="/crafting" replace />
  const info = itemInfo[r.id]
  const where = info?.sources?.find((s) => s.type === 'Crafted at')?.entries[0]
  const comboSrc = r.comboFrom ? recipeById.get(r.comboFrom) : undefined
  const comboOf = recipes.find((x) => x.comboFrom === r.id)

  return (
    <div className="max-w-3xl">
      <Link to="/crafting" className="mb-5 inline-flex items-center gap-1.5 text-sm text-parch-500 hover:text-parch-100"><ArrowLeft className="size-4" /> All recipes</Link>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
          <ItemIcon id={r.id} grade={r.grade} size="lg" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[30px] leading-tight text-parch-50 md:text-[38px]">{r.name}</h1>
          <p className="mt-1 text-[15px] text-parch-300">
            <span style={{ color: gradeColor[r.grade] }}>{r.grade}</span> {r.slot ?? 'item'}, {r.profession} mastery {r.mastery}
            {r.yield > 1 && `, makes ${r.yield}`}
          </p>
          {where && <p className="text-[14px] text-parch-500">Craft at the {where.replace(/ · /g, ', ')}</p>}
        </div>
        {info?.tradable !== false ? <PriceLink id={r.id} /> : <span className="text-[13px] text-parch-500">Can't be traded</span>}
      </div>

      {(comboSrc || comboOf) && (
        <div className="mt-6 flex gap-3 rounded-3xl border border-elyos-400/25 bg-elyos-400/[0.07] p-4">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-elyos-400" />
          <p className="text-[15px] leading-relaxed text-parch-100">
            {comboSrc && <>Crafting <Link className="text-elyos-200 underline decoration-elyos-200/30 underline-offset-4" to={`/crafting/${comboSrc.id}`}>{comboSrc.name}</Link> has a {Math.round((r.comboChance ?? 0) * 100)}% chance to give you this instead.{r.comboOnly && ' This is the only way to get it.'}</>}
            {comboOf && <>Each craft has a {Math.round((comboOf.comboChance ?? 0) * 100)}% chance to come out as <Link className="text-elyos-200 underline decoration-elyos-200/30 underline-offset-4" to={`/crafting/${comboOf.id}`}>{comboOf.name}</Link>.</>}
          </p>
        </div>
      )}

      <h2 className="mb-3 mt-9 font-display text-[24px] text-parch-50">Materials</h2>
      <ul className="space-y-1.5">
        {r.components.map((c) => <MaterialRow key={c.id} id={c.id} name={c.name} qty={c.qty} depth={0} />)}
      </ul>
      <p className="mt-3 text-[13px] text-parch-500">Materials that are crafted themselves open up to show what goes into them. Quantities are for one craft.</p>

      {usedIn.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 font-display text-[24px] text-parch-50">Used to make</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {usedIn.map((x) => (
              <li key={x.id}>
                <Link to={`/crafting/${x.id}`} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-abyss-850/60 px-3 py-2.5 hover:border-white/15">
                  <ItemIcon id={x.id} grade={x.grade} size="sm" />
                  <span className="truncate text-[15px] text-parch-100">{x.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function MaterialRow({ id, name, qty, depth }: { id: string; name: string; qty: number; depth: number }) {
  const sub = recipeById.get(id)
  const [open, setOpen] = useState(false)
  const src = itemInfo[id]?.sources?.find((s) => s.type !== 'Crafted at')
  return (
    <li>
      <div className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${depth ? 'bg-white/[0.025]' : 'border border-white/[0.06] bg-abyss-850/60'}`} style={{ marginLeft: depth * 18 }}>
        <button disabled={!sub} onClick={() => setOpen((o) => !o)} aria-expanded={sub ? open : undefined} className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default">
          <ItemIcon id={id} grade={sub?.grade} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] text-parch-50">{name}</span>
            <span className="block truncate text-[12px] text-parch-500">{sub ? `Crafted, ${sub.profession}` : src ? `${src.type}: ${src.entries[0]}` : 'Material'}</span>
          </span>
          <span className="shrink-0 font-display text-lg tabular-nums text-parch-300">×{qty}</span>
          {sub && <ChevronRight className={`size-4 shrink-0 text-parch-500 transition-transform ${open ? 'rotate-90' : ''}`} />}
        </button>
        <PriceLink id={id} compact />
      </div>
      <AnimatePresence initial={false}>
        {open && sub && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-1.5 space-y-1.5 overflow-hidden">
            {sub.components.map((c) => <MaterialRow key={c.id} id={c.id} name={c.name} qty={c.qty * qty} depth={depth + 1} />)}
            <li style={{ marginLeft: (depth + 1) * 18 }}><Link to={`/crafting/${sub.id}`} className="inline-block px-3 py-1 text-[13px] text-aether-300">Open {sub.name}</Link></li>
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  )
}
