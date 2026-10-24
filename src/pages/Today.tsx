import { motion } from 'motion/react'
import { ArrowRight, BookOpen, PawPrint } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dial, DialCentre } from '../components/Dial'
import { ReminderBell, Section } from '../components/ui'
import { useNow, useStored } from '../lib/hooks'
import { events, nextOf, upcoming, isLive, countdown, clock, dayLabel, kindStyle } from '../lib/time'
import { pets, shopOnlyPets } from '../lib/pets'
import chapters from '../data/guide-index.json'

function greeting(now: number) {
  const h = new Date(now).getHours()
  return h < 5 ? 'Late one, Daeva' : h < 12 ? 'Morning, Daeva' : h < 18 ? 'Afternoon, Daeva' : 'Evening, Daeva'
}

export default function Today() {
  const now = useNow(10_000)
  const [selected, setSelected] = useState<string | null>(null)
  const list = upcoming(now, { kinds: ['pvp', 'event', 'abyss', 'boss'] })
  const focus = selected ? nextOf(events.find((e) => e.id === selected)!, now) : list[0]
  const resets = upcoming(now, { kinds: ['reset'] })

  return (
    <div>
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sr-only md:not-sr-only md:mb-2 md:block md:font-display md:text-[46px] md:leading-tight md:text-parch-50">
        {greeting(now)}
      </motion.h1>

      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,440px)_1fr] md:gap-12">
        {/* The dial */}
        <div>
          <motion.div
            className="relative mx-auto aspect-square w-full max-w-[440px]"
            initial={{ opacity: 0, scale: 0.94, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16 }}
          >
            <Dial now={now} selected={selected} onSelect={(id) => setSelected((s) => (s === id ? null : id))} />
            <DialCentre focus={focus} now={now} />
          </motion.div>
          <p className="mt-2 text-center text-[13px] text-parch-500">
            {selected ? <button className="underline decoration-white/20 underline-offset-4" onClick={() => setSelected(null)}>Show everything again</button> : 'Tap a ring to focus on one event. Times are in your local time.'}
          </p>
        </div>

        {/* Coming up */}
        <div className="space-y-8">
          <Section title="Coming up" aside={<Link to="/timers" className="text-sm text-aether-300">All timers</Link>}>
            <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-3xl border border-white/[0.07] bg-abyss-850/60">
              {list.slice(0, 6).map((o) => {
                const live = isLive(o, now)
                const on = selected === o.event.id
                return (
                  <li key={o.event.id}>
                    <div className={`flex items-center gap-3 px-4 py-3 ${on ? 'bg-white/[0.04]' : ''}`}>
                      <button onClick={() => setSelected((s) => (s === o.event.id ? null : o.event.id))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: kindStyle[o.event.kind].color }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] text-parch-50">{o.event.name}</span>
                          <span className="block text-[13px] text-parch-500">
                            {live ? <span className="text-asmo-400">On now, {countdown(o.end - now)} left</span> : <>{dayLabel(o.start, now)} at {clock(o.start)}</>}
                          </span>
                        </span>
                        {!live && <span className="shrink-0 text-[15px] tabular-nums text-aether-300">{countdown(o.start - now)}</span>}
                      </button>
                      <ReminderBell id={o.event.id} name={o.event.name} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Section>

          <div className="grid gap-3 sm:grid-cols-2">
            {resets.map((o) => (
              <div key={o.event.id} className="rounded-3xl border border-white/[0.07] bg-abyss-850/60 px-4 py-3">
                <div className="text-[13px] text-parch-500">{o.event.name}</div>
                <div className="mt-0.5 flex items-baseline justify-between gap-2">
                  <span className="font-display text-2xl tabular-nums text-elyos-300">{countdown(o.start - now)}</span>
                  <span className="text-[13px] text-parch-500">{dayLabel(o.start, now)} {clock(o.start)}</span>
                </div>
              </div>
            ))}
          </div>

          <PetCheck />
          <ContinueReading />
        </div>
      </div>
    </div>
  )
}

/** The question you have at the Black Cloud Merchant, answered from the home page. */
function PetCheck() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const [owned] = useStored<number[]>('nh.ownedPets', [])
  const ownedShop = shopOnlyPets.filter((p) => owned.includes(p.id)).length
  const match = q.trim().length >= 2 ? pets.find((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())) : undefined
  return (
    <Section title="At the merchant?" aside={<Link to="/pets" className="text-sm text-aether-300">{ownedShop}/{shopOnlyPets.length} shop-only owned</Link>}>
      <form onSubmit={(e) => { e.preventDefault(); navigate(`/pets?q=${encodeURIComponent(q)}`) }} className="rounded-3xl border border-white/[0.07] bg-abyss-850/60 p-2">
        <label className="flex items-center gap-3 px-2">
          <PawPrint className="size-5 shrink-0 text-elyos-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type the pet's name" aria-label="Pet name"
            className="h-11 w-full bg-transparent text-[15px] text-parch-50 placeholder:text-parch-500 focus:outline-none" />
        </label>
        {match && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            <div className={`mt-1 rounded-2xl px-4 py-3 ${match.shopOnly ? 'bg-elyos-400/12' : 'bg-white/[0.04]'}`}>
              <div className={`font-display text-xl ${match.shopOnly ? 'text-elyos-300' : 'text-parch-100'}`}>{match.shopOnly ? 'Buy it' : 'Skip it'}</div>
              <div className="text-[14px] text-parch-300">
                {match.name}{match.shopOnly ? " is shop-only, so its soul never drops." : ` drops from ${match.drops.slice(0, 2).join(' and ')}.`}
              </div>
            </div>
          </motion.div>
        )}
      </form>
    </Section>
  )
}

function ContinueReading() {
  const [lastId] = useStored<string | null>('nh.lastChapter', null)
  const c = chapters.find((x) => x.id === lastId) ?? chapters[1]
  return (
    <Link to={`/guide/${c.id}`} className="group flex items-center gap-4 rounded-3xl border border-white/[0.07] bg-abyss-850/60 px-4 py-4 hover:border-white/15">
      <BookOpen className="size-6 shrink-0 text-aether-300" />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-parch-500">{lastId ? 'Carry on reading' : 'Start the guide'}</span>
        <span className="block truncate font-display text-lg text-parch-50">{c.title}</span>
      </span>
      <ArrowRight className="size-5 text-parch-500 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}
