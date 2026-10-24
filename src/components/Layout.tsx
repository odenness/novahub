import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Ellipsis, Search as SearchIcon, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { nav, sectionOf } from '../lib/nav'
import { countdown, isLive, upcoming, clock, kindStyle } from '../lib/time'
import { useNow } from '../lib/hooks'
import { useSearch } from './Search'

export function Mark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="12" fill="none" stroke="var(--color-aether-400)" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="12" fill="none" stroke="var(--color-elyos-400)" strokeWidth="2.5" strokeDasharray="14 62" strokeDashoffset="-6" strokeLinecap="round" />
      <path d="M16 8v8l5 3" stroke="var(--color-parch-100)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** Desktop: floating glass bar; the active pill slides between items. */
function TopBar() {
  const { open } = useSearch()
  const { pathname } = useLocation()
  const active = sectionOf(pathname)
  return (
    <header className="sticky top-0 z-50 px-3 pt-3 md:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-3 rounded-[22px] border border-white/[0.08] bg-abyss-900/75 px-2 py-2 shadow-[0_18px_50px_-25px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2.5 rounded-xl px-2 py-1">
          <Mark />
          <span className="font-display text-xl leading-none text-parch-50">NovaHub</span>
        </Link>
        <nav className="relative ml-2 hidden flex-1 items-center gap-1 md:flex" aria-label="Main">
          {nav.map((n, i) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className="relative rounded-2xl px-3.5 py-2 text-[15px]">
              {i === active && (
                <motion.span layoutId="top-pill" className="absolute inset-0 rounded-2xl bg-white/[0.08] ring-1 ring-white/[0.08]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
              )}
              <span className={`relative flex items-center gap-2 transition-colors ${i === active ? 'text-parch-50' : 'text-parch-300 hover:text-parch-50'}`}>
                <n.icon className={`size-4 ${i === active ? 'text-aether-400' : ''}`} />
                {n.label}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="flex-1 md:hidden" />
        <button
          onClick={open}
          className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-abyss-800/70 px-3 py-2 text-sm text-parch-300 hover:text-parch-50"
          aria-label="Search"
        >
          <SearchIcon className="size-4" />
          <span className="hidden lg:inline">Search</span>
          <kbd className="hidden rounded-md border border-white/10 px-1.5 text-[11px] text-parch-500 lg:inline">Ctrl K</kbd>
        </button>
      </div>
    </header>
  )
}

/** One line under the header: what's live, or what's next. Always one tap from Timers. */
function LiveStrip() {
  const now = useNow(15_000)
  const list = upcoming(now, { kinds: ['pvp', 'event', 'abyss', 'boss'] })
  const live = list.filter((o) => isLive(o, now))
  const next = list.find((o) => !isLive(o, now))
  return (
    <div className="mx-auto mt-2 max-w-6xl px-3 md:px-6">
      <Link to="/timers" className="flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-1.5 text-[13px] text-parch-300 hover:bg-white/[0.03]">
        {live.slice(0, 2).map((o) => (
          <span key={o.event.id} className="flex shrink-0 items-center gap-1.5 text-parch-50">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-asmo-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-asmo-400" />
            </span>
            {o.event.name} on now
          </span>
        ))}
        {next && (
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: kindStyle[next.event.kind].color }} />
            {next.event.name} at {clock(next.start)}
            <span className="text-aether-300">in {countdown(next.start - now)}</span>
          </span>
        )}
      </Link>
    </div>
  )
}

/** Mobile: thumb-reach tab bar. The glowing bar slides to the active tab; More opens a sheet. */
function TabBar() {
  const { pathname } = useLocation()
  const active = sectionOf(pathname)
  const [more, setMore] = useState(false)
  const tabs = nav.filter((n) => n.mobile === 'tab')
  const extra = nav.filter((n) => n.mobile === 'more')
  const moreActive = extra.some((n) => nav.indexOf(n) === active)
  useEffect(() => setMore(false), [pathname])

  return (
    <>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-abyss-900/85 backdrop-blur-xl md:hidden" aria-label="Main">
        <div className="mx-auto flex max-w-md">
          {tabs.map((n) => {
            const on = nav.indexOf(n) === active
            return (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className="relative flex flex-1 flex-col items-center gap-1 pb-1 pt-2.5">
                {on && <motion.span layoutId="tab-glow" className="absolute top-0 h-[3px] w-9 rounded-b-full bg-aether-400 shadow-[0_0_14px_2px_rgba(95,224,208,0.55)]" transition={{ type: 'spring', stiffness: 520, damping: 36 }} />}
                <motion.span animate={{ y: on ? -1 : 0, scale: on ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                  <n.icon className={`size-[22px] ${on ? 'text-aether-300' : 'text-parch-500'}`} />
                </motion.span>
                <span className={`text-[11px] ${on ? 'text-parch-50' : 'text-parch-500'}`}>{n.label}</span>
              </NavLink>
            )
          })}
          <button onClick={() => setMore(true)} className="relative flex flex-1 flex-col items-center gap-1 pb-1 pt-2.5" aria-haspopup="dialog">
            {moreActive && <motion.span layoutId="tab-glow" className="absolute top-0 h-[3px] w-9 rounded-b-full bg-aether-400 shadow-[0_0_14px_2px_rgba(95,224,208,0.55)]" />}
            <Ellipsis className={`size-[22px] ${moreActive ? 'text-aether-300' : 'text-parch-500'}`} />
            <span className={`text-[11px] ${moreActive ? 'text-parch-50' : 'text-parch-500'}`}>More</span>
          </button>
        </div>
      </nav>
      <AnimatePresence>{more && <MoreSheet items={extra} onClose={() => setMore(false)} />}</AnimatePresence>
    </>
  )
}

function MoreSheet({ items, onClose }: { items: typeof nav; onClose: () => void }) {
  const { open } = useSearch()
  return (
    <motion.div className="fixed inset-0 z-[60] md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-abyss-950/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        role="dialog" aria-label="More"
        className="pb-safe absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-white/10 bg-abyss-850 px-4 pt-3"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => (info.offset.y > 90 || info.velocity.y > 500) && onClose()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-xl">More</span>
          <button onClick={onClose} className="rounded-xl p-2 text-parch-500" aria-label="Close"><X className="size-5" /></button>
        </div>
        <ul className="mb-3 space-y-1.5">
          {items.map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} className="flex items-center gap-4 rounded-2xl bg-white/[0.03] px-4 py-3.5 active:bg-white/[0.07]">
                <n.icon className="size-6 text-aether-300" />
                <span>
                  <span className="block text-[16px] text-parch-50">{n.label}</span>
                  <span className="block text-[13px] text-parch-500">{n.blurb}</span>
                </span>
              </NavLink>
            </li>
          ))}
          <li>
            <button onClick={() => { onClose(); open() }} className="flex w-full items-center gap-4 rounded-2xl bg-white/[0.03] px-4 py-3.5 text-left active:bg-white/[0.07]">
              <SearchIcon className="size-6 text-aether-300" />
              <span>
                <span className="block text-[16px] text-parch-50">Search</span>
                <span className="block text-[13px] text-parch-500">Pets, events, recipes and guide topics</span>
              </span>
            </button>
          </li>
        </ul>
      </motion.div>
    </motion.div>
  )
}

/** Pages slide in the direction of travel through the nav order. */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const section = sectionOf(pathname)
  const prev = useRef(section)
  const dir = section === prev.current ? 0 : section > prev.current ? 1 : -1
  useEffect(() => { prev.current = section }, [section])
  const reduce = useReducedMotion()
  const dx = reduce ? 0 : 28 * dir
  useEffect(() => window.scrollTo({ top: 0 }), [pathname])
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: dx, y: dir === 0 && !reduce ? 8 : 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: -dx / 2 }}
        transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar />
      <LiveStrip />
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-4 md:px-6 md:pb-16">
        {children}
      </main>
      <footer className="mx-auto hidden max-w-6xl px-6 pb-10 text-[13px] text-parch-500 md:block">
        NovaHub is fan-made for the NOVA legion on Baba and isn't affiliated with NCSOFT. Guide by Kanon, event times from Shugo.GG, recipes and icons from aion2hub.com, pets from aion2.th.gl, market prices on A2-Tracker.
      </footer>
      <TabBar />
    </>
  )
}
