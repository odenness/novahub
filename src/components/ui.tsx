import { motion } from 'motion/react'
import { Bell, BellRing } from 'lucide-react'
import type { ReactNode } from 'react'
import { useReminders } from '../lib/reminders'

export function PageTitle({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-[34px] leading-[1.05] text-parch-50 md:text-[46px]">{title}</h1>
        {lead && <p className="mt-2 text-[15px] leading-relaxed text-parch-300 md:text-base">{lead}</p>}
      </div>
      {children}
    </div>
  )
}

/** Segmented control with a sliding thumb. */
export function Segmented<T extends string>({ value, onChange, options, id }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; id: string }) {
  return (
    <div role="tablist" className="inline-flex rounded-2xl border border-white/[0.07] bg-abyss-850 p-1">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)} className="relative rounded-xl px-3.5 py-1.5 text-sm">
          {o.value === value && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-xl bg-abyss-700" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          <span className={`relative ${o.value === value ? 'text-parch-50' : 'text-parch-500 hover:text-parch-100'}`}>{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export function ReminderBell({ id, name }: { id: string; name: string }) {
  const { has, toggle } = useReminders()
  const on = has(id)
  const Icon = on ? BellRing : Bell
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id) }}
      aria-pressed={on}
      aria-label={on ? `Stop reminders for ${name}` : `Remind me 5 minutes before ${name}`}
      title={on ? 'Reminding you 5 minutes before (while NovaHub is open)' : 'Remind me 5 minutes before'}
      className={`grid size-9 shrink-0 place-items-center rounded-xl ${on ? 'bg-elyos-400/15 text-elyos-300' : 'text-parch-500 hover:bg-white/5 hover:text-parch-100'}`}
    >
      <Icon className="size-[18px]" />
    </motion.button>
  )
}

export function Section({ title, aside, children, className = '' }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[22px] text-parch-50">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}
