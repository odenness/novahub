import { motion } from 'motion/react'
import { useMemo } from 'react'
import { events, occurrences, isLive, countdown, clock, kindStyle, type Occurrence } from '../lib/time'

const C = 200 // centre
/** Angle by local clock time, so days with a clock change (23 or 25 hours) still fit the dial. */
const angle = (t: number, dayStart: number) => {
  if (t <= dayStart) return -90
  const d = new Date(t)
  const sameDay = d.toDateString() === new Date(dayStart).toDateString()
  const h = sameDay ? d.getHours() + d.getMinutes() / 60 : 24
  return (h / 24) * 360 - 90
}
const pt = (deg: number, r: number) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)]

function arc(a0: number, a1: number, r: number) {
  const [x0, y0] = pt(a0, r)
  const [x1, y1] = pt(Math.max(a1, a0 + 1.2), r)
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`
}

/**
 * Today on one 24-hour dial, in the viewer's local time.
 * Each scheduled event gets its own track; hourly events are ticks on the inner ring; resets are gold notches.
 */
export function Dial({ now, selected, onSelect }: { now: number; selected: string | null; onSelect: (id: string) => void }) {
  const dayStart = new Date(new Date(now).toDateString()).getTime()
  const dayEnd = new Date(new Date(dayStart + 30 * 3_600_000).toDateString()).getTime() // next local midnight

  const { tracks, hourly, resets } = useMemo(() => {
    const tracks: { id: string; occ: Occurrence[] }[] = []
    const hourly: Occurrence[] = []
    const resets: Occurrence[] = []
    for (const e of events) {
      const occ = occurrences(e, dayStart, dayEnd).filter((o) => o.start < dayEnd)
      if (!occ.length) continue
      if (e.kind === 'reset') resets.push(...occ)
      else if (e.schedule.type === 'hourly') hourly.push(...occ)
      else tracks.push({ id: e.id, occ })
    }
    return { tracks, hourly, resets }
  }, [dayStart, dayEnd])

  const nowA = angle(now, dayStart)
  const rOuter = 150
  const step = Math.min(14, 64 / Math.max(tracks.length, 1))

  return (
    <svg viewBox="0 0 400 400" className="h-auto w-full touch-manipulation" role="img" aria-label="Today's events on a 24-hour clock">
      <defs>
        <radialGradient id="dial-bg">
          <stop offset="0%" stopColor="var(--color-abyss-800)" />
          <stop offset="100%" stopColor="var(--color-abyss-900)" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={172} fill="url(#dial-bg)" stroke="rgba(255,255,255,0.06)" />

      {/* hour ticks + labels */}
      {Array.from({ length: 24 }, (_, h) => {
        const a = (h / 24) * 360 - 90
        const major = h % 6 === 0
        const [x0, y0] = pt(a, 166)
        const [x1, y1] = pt(a, major ? 158 : 162)
        const [lx, ly] = pt(a, 186)
        return (
          <g key={h}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(236,230,245,0.25)" strokeWidth={major ? 1.6 : 0.8} />
            {major && <text x={lx} y={ly} fill="var(--color-parch-500)" fontSize="11" textAnchor="middle" dominantBaseline="middle">{String(h).padStart(2, '0')}</text>}
          </g>
        )
      })}

      {/* elapsed part of the day, dimmed */}
      <path d={arc(-90, nowA, 168)} stroke="rgba(95,224,208,0.18)" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* event tracks */}
      {tracks.map((t, i) => {
        const r = rOuter - i * step
        const e = t.occ[0].event
        const color = kindStyle[e.kind].color
        const dim = selected && selected !== t.id
        return (
          <g key={t.id} opacity={dim ? 0.28 : 1} className="cursor-pointer" onClick={() => onSelect(t.id)}>
            <circle cx={C} cy={C} r={r} fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth={step - 4} />
            {t.occ.map((o) => {
              const past = o.end < now
              return (
                <path key={o.start} d={arc(angle(o.start, dayStart), angle(Math.min(o.end, dayEnd), dayStart), r)}
                  stroke={color} strokeWidth={step - 5} strokeLinecap="round" fill="none" opacity={past ? 0.3 : 1}
                  className={isLive(o, now) ? 'animate-pulse' : ''} />
              )
            })}
            {/* fat invisible hit area */}
            <circle cx={C} cy={C} r={r} fill="none" stroke="transparent" strokeWidth={step} />
          </g>
        )
      })}

      {/* hourly ticks */}
      {hourly.map((o) => {
        const a = angle(o.start, dayStart)
        const r = rOuter - tracks.length * step + 2
        const [x0, y0] = pt(a, r)
        const [x1, y1] = pt(a, r - 6)
        return <line key={o.event.id + o.start} x1={x0} y1={y0} x2={x1} y2={y1} stroke={kindStyle[o.event.kind].color} strokeOpacity={o.start < now ? 0.25 : 0.7} strokeWidth="1.5" />
      })}

      {/* resets */}
      {resets.map((o) => {
        const [x, y] = pt(angle(o.start, dayStart), 168)
        return <circle key={o.event.id + o.start} cx={x} cy={y} r={4.5} fill="var(--color-elyos-400)" stroke="var(--color-abyss-900)" strokeWidth="2" />
      })}

      {/* now hand */}
      <g transform={`rotate(${nowA} ${C} ${C})`}>
        <motion.g initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.25 }}>
          <line x1={C + 100} y1={C} x2={C + 174} y2={C} stroke="var(--color-parch-50)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={C + 174} cy={C} r="5" fill="var(--color-parch-50)" stroke="var(--color-abyss-900)" strokeWidth="2" />
        </motion.g>
      </g>
    </svg>
  )
}

export function DialCentre({ focus, now }: { focus: Occurrence | undefined; now: number }) {
  if (!focus) return null
  const live = isLive(focus, now)
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="w-[46%] text-center">
        <div className="text-[13px] text-parch-300 md:text-sm" style={{ color: live ? 'var(--color-asmo-400)' : undefined }}>
          {live ? 'On now' : `Next at ${clock(focus.start)}`}
        </div>
        <motion.div key={focus.event.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-1 font-display text-[clamp(18px,5vw,26px)] leading-tight text-parch-50">
          {focus.event.name}
        </motion.div>
        <div className="mt-1 font-display text-[clamp(28px,9vw,48px)] leading-none tabular-nums text-aether-300">
          {live ? countdown(focus.end - now) + ' left' : countdown(focus.start - now)}
        </div>
      </div>
    </div>
  )
}
