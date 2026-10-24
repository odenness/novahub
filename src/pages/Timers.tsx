import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Radio } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PageTitle, ReminderBell, Segmented } from '../components/ui'
import { useNow, useStored } from '../lib/hooks'
import { events, nextOf, occurrences, isLive, countdown, clock, dayLabel, kindStyle, type GameEvent } from '../lib/time'
import { useBossFeed } from '../lib/bosses'
import { LEAD_MINUTES } from '../lib/reminders'

type Tab = 'schedule' | 'bosses'

export default function Timers() {
  const [tab, setTab] = useStored<Tab>('nh.timersTab', 'schedule')
  return (
    <div>
      <PageTitle title="Timers" lead={`Every time is shown in your local time. Tap the bell and NovaHub pings you ${LEAD_MINUTES} minutes before, while it's open.`}>
        <Segmented id="timers" value={tab} onChange={setTab} options={[{ value: 'schedule', label: 'Schedule' }, { value: 'bosses', label: 'Field bosses' }]} />
      </PageTitle>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {tab === 'schedule' ? <Schedule /> : <FieldBosses />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Schedule() {
  const now = useNow(10_000)
  const { hash } = useLocation()
  const [open, setOpen] = useState<string | null>(hash.slice(1) || null)
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' }) }, [hash])
  const sorted = [...events].map((e) => ({ e, o: nextOf(e, now) })).sort((a, b) => a.o.start - b.o.start)

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {sorted.map(({ e, o }) => {
        const live = isLive(o, now)
        const expanded = open === e.id
        return (
          <motion.li layout key={e.id} id={e.id} className={`overflow-hidden rounded-3xl border bg-abyss-850/60 ${live ? 'border-asmo-400/40' : 'border-white/[0.07]'}`}>
            <div className="flex items-center gap-3 p-4">
              <button onClick={() => setOpen(expanded ? null : e.id)} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <Ring event={e} now={now} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] text-parch-50">{e.name}</span>
                  <span className="block text-[13px] text-parch-500">
                    <span style={{ color: kindStyle[e.kind].color }}>{kindStyle[e.kind].label}</span>
                    {'  '}{live ? <span className="text-asmo-400">on now, {countdown(o.end - now)} left</span> : <>{dayLabel(o.start, now)} at {clock(o.start)}</>}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  {!live && <span className="block font-display text-xl tabular-nums text-aether-300">{countdown(o.start - now)}</span>}
                </span>
                <ChevronDown className={`hidden size-4 shrink-0 text-parch-500 transition-transform sm:block ${expanded ? 'rotate-180' : ''}`} />
              </button>
              {e.kind !== 'reset' && <ReminderBell id={e.id} name={e.name} />}
            </div>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
                    <p className="text-[14px] leading-relaxed text-parch-300">{e.description}</p>
                    <NextTimes event={e} now={now} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        )
      })}
    </ul>
  )
}

/** Small ring that fills as the next start approaches (full ring = starting). */
function Ring({ event, now }: { event: GameEvent; now: number }) {
  const list = occurrences(event, now - 8 * 86_400_000, now + 8 * 86_400_000)
  const next = list.find((o) => o.end > now || o.start > now)!
  const prev = [...list].reverse().find((o) => o.start < next.start)
  const span = prev ? next.start - prev.start : 86_400_000
  const p = isLive(next, now) ? 1 : Math.min(1, Math.max(0, 1 - (next.start - now) / span))
  const r = 16, len = 2 * Math.PI * r
  const color = kindStyle[event.kind].color
  return (
    <svg viewBox="0 0 40 40" className="size-11 shrink-0 -rotate-90" aria-hidden>
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
      <motion.circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={len} initial={{ strokeDashoffset: len }} animate={{ strokeDashoffset: len * (1 - p) }} transition={{ duration: 0.9, ease: 'easeOut' }} />
    </svg>
  )
}

function NextTimes({ event, now }: { event: GameEvent; now: number }) {
  const list = occurrences(event, now, now + 3 * 86_400_000).slice(0, 8)
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {list.map((o) => (
        <span key={o.start} className="rounded-lg bg-white/[0.05] px-2 py-1 text-[13px] tabular-nums text-parch-300">
          {dayLabel(o.start, now) === 'Today' ? '' : dayLabel(o.start, now).slice(0, 3) + ' '}{clock(o.start)}
        </span>
      ))}
    </div>
  )
}

function FieldBosses() {
  const { connected, bosses, error } = useBossFeed()
  const now = useNow(15_000)
  if (!connected)
    return (
      <div className="rounded-3xl border border-dashed border-white/12 px-6 py-10 text-center">
        <Radio className="mx-auto size-8 text-aether-400" />
        <h2 className="mt-3 font-display text-2xl text-parch-50">Live field bosses come from Nova Meter</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-parch-300">
          Players running Nova Meter share the respawn times they see on their world map. Once that feed is connected here, every field boss shows who's up and when the rest respawn.
        </p>
        <Link to="/meter" className="mt-5 inline-block rounded-2xl bg-aether-400 px-5 py-2.5 text-[15px] font-semibold text-abyss-950">Get Nova Meter</Link>
      </div>
    )
  if (error) return <p className="rounded-3xl bg-asmo-400/10 px-5 py-4 text-asmo-400">Couldn't load the boss feed ({error}). It retries every minute.</p>
  if (!bosses) return <p className="px-1 text-parch-500">Loading field bosses…</p>
  if (!bosses.length) return <p className="px-1 text-parch-500">No field boss reports yet. They appear as soon as someone with Nova Meter opens their world map.</p>
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {bosses.map((b) => {
        const at = b.respawnAt ? new Date(b.respawnAt).getTime() : 0
        return (
          <li key={b.name + b.region} className={`rounded-3xl border bg-abyss-850/60 p-4 ${b.status === 'up' ? 'border-asmo-400/40' : 'border-white/[0.07]'}`}>
            <div className="text-[13px] text-parch-500">{b.region}</div>
            <div className="text-[16px] text-parch-50">{b.name}</div>
            {b.status === 'up' ? (
              <div className="mt-2">
                <div className="text-asmo-400">Up now{b.hp != null && `, ${Math.round(b.hp * 100)}% HP`}</div>
                {b.hp != null && <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-asmo-400" style={{ width: `${b.hp * 100}%` }} /></div>}
              </div>
            ) : (
              <div className="mt-2 font-display text-xl text-aether-300">{at ? `${clock(at)} · in ${countdown(at - now)}` : 'Respawn unknown'}</div>
            )}
            <div className="mt-2 text-[12px] text-parch-500">Reported {countdown(now - new Date(b.reportedAt).getTime())} ago</div>
          </li>
        )
      })}
    </ul>
  )
}
