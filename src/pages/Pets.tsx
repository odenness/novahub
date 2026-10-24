import { AnimatePresence, motion } from 'motion/react'
import { Check, Coins, Search, X } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageTitle, Segmented } from '../components/ui'
import { useStored } from '../lib/hooks'
import { genera, petIcon, pets, shopOnlyPets, type Pet } from '../lib/pets'

type View = 'shop' | 'all'

export default function Pets() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const setQ = (v: string) => setParams(v ? { q: v } : {}, { replace: true })
  const [view, setView] = useStored<View>('nh.petsView', 'shop')
  const [genus, setGenus] = useStored<string>('nh.petsGenus', '')
  const [owned, setOwned] = useStored<number[]>('nh.ownedPets', [])
  const toggle = (id: number) => setOwned((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]))

  const needle = q.trim().toLowerCase()
  const matches = useMemo(() => (needle.length >= 2 ? pets.filter((p) => p.name.toLowerCase().includes(needle)).slice(0, 4) : []), [needle])
  const list = (view === 'shop' ? shopOnlyPets : pets).filter((p) => !genus || p.genus === genus)
  const ownedShop = shopOnlyPets.filter((p) => owned.includes(p.id)).length

  return (
    <div>
      <PageTitle title="Pets" lead="35 of the 200 pets can only be bought from the Black Cloud Merchant: their souls never drop. Check a name before you spend.">
        <Progress value={ownedShop} total={shopOnlyPets.length} />
      </PageTitle>

      {/* Merchant check */}
      <div className="mb-8 rounded-3xl border border-white/[0.08] bg-abyss-850/70 p-2 md:max-w-2xl">
        <label className="flex items-center gap-3 px-3">
          <Search className="size-5 shrink-0 text-elyos-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a pet name from the shop" aria-label="Check a pet"
            className="h-12 w-full bg-transparent text-[16px] text-parch-50 placeholder:text-parch-500 focus:outline-none" />
          {q && <button onClick={() => setQ('')} aria-label="Clear" className="rounded-lg p-1 text-parch-500"><X className="size-4" /></button>}
        </label>
        <AnimatePresence initial={false}>
          {needle.length >= 2 && (
            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-1.5 overflow-hidden">
              {matches.length === 0 && <li className="px-4 py-3 text-[14px] text-parch-500">No pet called “{q}”. Check the spelling against the shop.</li>}
              {matches.map((p) => <Verdict key={p.id} pet={p} owned={owned.includes(p.id)} onToggle={() => toggle(p.id)} />)}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Collection */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented id="pets" value={view} onChange={setView} options={[{ value: 'shop', label: `Shop-only (${shopOnlyPets.length})` }, { value: 'all', label: `All (${pets.length})` }]} />
        <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
          {['', ...genera].map((g) => (
            <button key={g || 'all'} onClick={() => setGenus(g)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-sm ${genus === g ? 'bg-elyos-400/15 text-elyos-200' : 'text-parch-500 hover:text-parch-100'}`}>
              {g || 'Every genus'}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-3 text-[13px] text-parch-500">Tap a pet to mark it owned. Saved in this browser.</p>
      <motion.ul layout className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        <AnimatePresence>
          {list.map((p) => <PetTile key={p.id} pet={p} owned={owned.includes(p.id)} onToggle={() => toggle(p.id)} />)}
        </AnimatePresence>
      </motion.ul>
    </div>
  )
}

function Verdict({ pet, owned, onToggle }: { pet: Pet; owned: boolean; onToggle: () => void }) {
  return (
    <li className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${pet.shopOnly ? 'bg-elyos-400/12' : 'bg-white/[0.04]'}`}>
      <img src={petIcon(pet)} alt="" className="size-12 shrink-0 rounded-xl bg-abyss-800 object-contain" />
      <div className="min-w-0 flex-1">
        <div className={`font-display text-xl leading-tight ${pet.shopOnly ? 'text-elyos-300' : 'text-parch-100'}`}>{pet.shopOnly ? 'Buy it' : 'Skip it'}</div>
        <div className="text-[14px] text-parch-300">
          {pet.name} <span className="text-parch-500">({pet.genus})</span>
          {pet.shopOnly ? ': shop-only, its soul never drops.' : `: drops from ${pet.drops.slice(0, 2).join(', ')}${pet.drops.length > 2 ? ' and more' : ''}.`}
        </div>
      </div>
      <button onClick={onToggle} aria-pressed={owned} className={`shrink-0 rounded-xl px-3 py-2 text-sm ${owned ? 'bg-elyos-400 text-abyss-950' : 'bg-white/[0.06] text-parch-300'}`}>
        {owned ? 'Owned' : 'Mark owned'}
      </button>
    </li>
  )
}

function PetTile({ pet, owned, onToggle }: { pet: Pet; owned: boolean; onToggle: () => void }) {
  return (
    <motion.li layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.15 }}>
      <motion.button whileTap={{ scale: 0.92 }} onClick={onToggle} aria-pressed={owned} title={pet.shopOnly ? `${pet.name}: shop-only` : `${pet.name}: drops from ${pet.drops[0]}`}
        className={`relative flex w-full flex-col items-center gap-1.5 rounded-2xl border px-1.5 pb-2 pt-2.5 ${owned ? 'border-elyos-400/50 bg-elyos-400/10' : 'border-white/[0.06] bg-abyss-850/60'}`}>
        <img src={petIcon(pet)} alt="" loading="lazy" className={`size-14 object-contain transition ${owned ? '' : 'opacity-55 grayscale-[0.6]'}`} />
        <span className={`line-clamp-2 text-center text-[12px] leading-tight ${owned ? 'text-parch-50' : 'text-parch-300'}`}>{pet.name}</span>
        {pet.shopOnly && <Coins className="absolute left-1.5 top-1.5 size-3.5 text-elyos-400" aria-label="Shop-only" />}
        {owned && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-elyos-400"><Check className="size-3 text-abyss-950" strokeWidth={3} /></span>}
      </motion.button>
    </motion.li>
  )
}

function Progress({ value, total }: { value: number; total: number }) {
  const r = 26, len = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <motion.circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-elyos-400)" strokeWidth="6" strokeLinecap="round" strokeDasharray={len}
          animate={{ strokeDashoffset: len * (1 - value / total) }} initial={false} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </svg>
      <div>
        <div className="font-display text-2xl leading-none text-parch-50">{value}<span className="text-parch-500">/{total}</span></div>
        <div className="text-[13px] text-parch-500">shop-only owned</div>
      </div>
    </div>
  )
}
