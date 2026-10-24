import { useEffect, useRef } from 'react'
import { useStored } from './hooks'
import { events, nextOf, clock } from './time'

export const LEAD_MINUTES = 5

/** Which events the viewer wants a heads-up for (saved in this browser). */
export function useReminders() {
  const [ids, setIds] = useStored<string[]>('nh.reminders', [])
  const toggle = async (id: string) => {
    if (!ids.includes(id) && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission().catch(() => undefined)
    }
    setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }
  return { ids, has: (id: string) => ids.includes(id), toggle }
}

/** Fires a browser notification LEAD_MINUTES before each followed event, while the site is open. */
export function ReminderEngine() {
  const { ids } = useReminders()
  const fired = useRef(new Set<string>())
  useEffect(() => {
    if (!ids.length || !('Notification' in window)) return
    const tick = () => {
      if (Notification.permission !== 'granted') return
      const now = Date.now()
      for (const e of events.filter((x) => ids.includes(x.id))) {
        const o = nextOf(e, now)
        if (!o) continue
        const key = `${e.id}:${o.start}`
        const lead = o.start - now
        if (lead > 0 && lead <= LEAD_MINUTES * 60_000 && !fired.current.has(key)) {
          fired.current.add(key)
          new Notification(`${e.name} at ${clock(o.start)}`, { body: e.description.split('.')[0] + '.', tag: key })
        }
      }
    }
    tick()
    const id = setInterval(tick, 20_000)
    return () => clearInterval(id)
  }, [ids])
  return null
}
