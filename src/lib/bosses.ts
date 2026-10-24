import { useEffect, useState } from 'react'

/**
 * Live field boss timers reported by Nova Meter.
 *
 * Set VITE_BOSS_FEED_URL at build time to a JSON endpoint shaped like:
 *   { "bosses": [{ "name": "…", "region": "…", "status": "up" | "down",
 *                  "hp": 0.38, "respawnAt": "ISO", "reportedAt": "ISO" }] }
 * Without it, the Timers page shows how to connect the feed.
 */
export interface FieldBoss { name: string; region: string; status: 'up' | 'down'; hp?: number; respawnAt?: string; reportedAt: string }

export const BOSS_FEED_URL: string | undefined = import.meta.env.VITE_BOSS_FEED_URL

export function useBossFeed() {
  const [bosses, setBosses] = useState<FieldBoss[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!BOSS_FEED_URL) return
    let alive = true
    const load = () =>
      fetch(BOSS_FEED_URL!)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Feed returned ${r.status}`))))
        .then((d) => alive && (setBosses(d.bosses ?? []), setError(null)))
        .catch((e) => alive && setError(String(e.message ?? e)))
    load()
    const id = setInterval(load, 60_000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  return { connected: Boolean(BOSS_FEED_URL), bosses, error }
}
