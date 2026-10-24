import timersData from '../data/timers.json'

export type EventKind = 'pvp' | 'event' | 'abyss' | 'boss' | 'reset'
type Schedule =
  | { timeZone: string; type: 'daily'; times: string[] }
  | { timeZone: string; type: 'hourly'; minute: number }
  | { timeZone: string; type: 'weekly'; days: string[]; times: string[] }

export interface GameEvent {
  id: string
  name: string
  kind: EventKind
  description: string
  durationMinutes: number
  portalMinutes: number | null
  schedule: Schedule
}

export interface Occurrence {
  event: GameEvent
  start: number
  end: number
}

export const events = timersData.events as unknown as GameEvent[]
export const timersMeta = timersData.meta

const DAY = 86_400_000
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/** Offset (ms) of a time zone from UTC at a given instant. */
function tzOffset(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(instant)
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value)
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - Math.floor(instant / 1000) * 1000
}

/** UTC instant for a wall-clock time in a time zone (handles DST changes). */
function zoned(y: number, m: number, d: number, hh: number, mm: number, timeZone: string) {
  const guess = Date.UTC(y, m, d, hh, mm)
  const first = guess - tzOffset(guess, timeZone)
  return guess - tzOffset(first, timeZone)
}

/** Calendar date (y, m, d, weekday) of an instant in a time zone. */
function zonedDate(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' }).formatToParts(instant)
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  return { y: Number(get('year')), m: Number(get('month')) - 1, d: Number(get('day')), wd: get('weekday').slice(0, 3).toLowerCase() }
}

/** All starts of one event between `from` and `to`. */
export function occurrences(event: GameEvent, from: number, to: number): Occurrence[] {
  const s = event.schedule
  const out: Occurrence[] = []
  const dur = event.durationMinutes * 60_000
  for (let t = from - DAY; t <= to + DAY; t += DAY) {
    const { y, m, d, wd } = zonedDate(t, s.timeZone)
    let times: string[] = []
    if (s.type === 'daily') times = s.times
    else if (s.type === 'weekly') times = s.days.includes(wd) ? s.times : []
    else times = Array.from({ length: 24 }, (_, h) => `${h}:${s.minute}`)
    for (const hm of times) {
      const [hh, mm] = hm.split(':').map(Number)
      const start = zoned(y, m, d, hh, mm, s.timeZone)
      if (start + Math.max(dur, 60_000) > from && start <= to) out.push({ event, start, end: start + dur })
    }
  }
  // De-duplicate (the day loop can overlap across DST edges) and sort.
  return [...new Map(out.map((o) => [o.start, o])).values()].sort((a, b) => a.start - b.start)
}

/** Next (or current) occurrence of an event. */
export function nextOf(event: GameEvent, now: number) {
  return occurrences(event, now, now + 8 * DAY)[0]
}

/** Upcoming occurrences across all events, soonest first. Hourly events only appear once. */
export function upcoming(now: number, opts: { kinds?: EventKind[]; limit?: number } = {}) {
  const list = events
    .filter((e) => !opts.kinds || opts.kinds.includes(e.kind))
    .map((e) => nextOf(e, now))
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)
  return opts.limit ? list.slice(0, opts.limit) : list
}

export const isLive = (o: Occurrence, now: number) => o.start <= now && now < Math.max(o.end, o.start + 60_000)

export function countdown(ms: number) {
  if (ms <= 0) return 'now'
  const m = Math.ceil(ms / 60_000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

export const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export function dayLabel(t: number, now: number) {
  const a = new Date(t), b = new Date(now)
  const diff = Math.round((new Date(a.toDateString()).getTime() - new Date(b.toDateString()).getTime()) / DAY)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return a.toLocaleDateString([], { weekday: 'long' })
}

export const DAY_NAMES = DAYS

export const kindStyle: Record<EventKind, { label: string; color: string }> = {
  pvp: { label: 'PvP', color: 'var(--color-asmo-400)' },
  event: { label: 'Event', color: 'var(--color-aether-400)' },
  abyss: { label: 'Abyss', color: '#a78bfa' },
  boss: { label: 'Boss', color: 'var(--color-elyos-400)' },
  reset: { label: 'Reset', color: 'var(--color-parch-300)' },
}
