import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, ListTree } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { PageTitle } from '../components/ui'
import { useStored } from '../lib/hooks'
import { chapters, chapterSummary, guideImg, guideMeta, headingText, type Block, type Run } from '../lib/guide'

export function GuideIndex() {
  const [lastId] = useStored<string | null>('nh.lastChapter', null)
  const synced = new Date(guideMeta.syncedAt).toLocaleDateString([], { day: 'numeric', month: 'long' })
  return (
    <div>
      <PageTitle title="The guide" lead={<>Kanon's AION 2 guide, chapter by chapter. Copied from the public doc on {synced}; <a className="text-aether-300 underline decoration-aether-300/30 underline-offset-4" href={guideMeta.docUrl} target="_blank" rel="noreferrer">read the original</a>.</>} />
      <ol className="grid gap-3 md:grid-cols-2">
        {chapters.map((c) => (
          <li key={c.id}>
            <Link to={`/guide/${c.id}`} className={`group flex h-full gap-4 rounded-3xl border bg-abyss-850/60 p-4 hover:border-white/15 ${c.id === lastId ? 'border-aether-400/35' : 'border-white/[0.07]'}`}>
              <span className="font-display text-3xl leading-none tabular-nums text-parch-500 group-hover:text-aether-300">{c.number || '·'}</span>
              <span className="min-w-0">
                <span className="block font-display text-[19px] leading-snug text-parch-50">{c.title}</span>
                <span className="mt-1 line-clamp-2 block text-[14px] leading-relaxed text-parch-500">{chapterSummary(c)}</span>
                {c.id === lastId && <span className="mt-2 block text-[13px] text-aether-300">Where you left off</span>}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Chapter() {
  const { id } = useParams()
  const { hash } = useLocation()
  const idx = chapters.findIndex((c) => c.id === id)
  const [, setLast] = useStored<string | null>('nh.lastChapter', null)
  const [tocOpen, setTocOpen] = useState(false)
  useEffect(() => { if (idx >= 0) setLast(chapters[idx].id) }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 260) }, [hash])
  if (idx < 0) return <Navigate to="/guide" replace />
  const c = chapters[idx]
  const prev = chapters[idx - 1], next = chapters[idx + 1]
  const toc = c.blocks.map((b, i) => (b.type === 'heading' && b.level <= 3 ? { i, text: headingText(b.text) } : null)).filter(Boolean) as { i: number; text: string }[]

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
      <article className="min-w-0 max-w-[68ch]">
        <Link to="/guide" className="mb-4 inline-flex items-center gap-1.5 text-sm text-parch-500 hover:text-parch-100"><ArrowLeft className="size-4" /> All chapters</Link>
        <div className="text-[14px] text-aether-300">{c.number ? `Chapter ${c.number}` : 'Before you start'}</div>
        <h1 className="mb-6 font-display text-[34px] leading-[1.1] text-parch-50 md:text-[44px]">{c.title}</h1>

        {toc.length > 2 && (
          <div className="mb-6 lg:hidden">
            <button onClick={() => setTocOpen((o) => !o)} className="flex items-center gap-2 rounded-2xl bg-white/[0.04] px-3.5 py-2 text-sm text-parch-300" aria-expanded={tocOpen}>
              <ListTree className="size-4" /> In this chapter ({toc.length})
            </button>
            {tocOpen && <TocList toc={toc} onPick={() => setTocOpen(false)} />}
          </div>
        )}

        <div className="space-y-4 text-[16px] leading-[1.7] text-parch-100">
          {c.blocks.map((b, i) => <BlockView key={i} b={b} i={i} />)}
        </div>

        <nav className="mt-12 grid gap-3 sm:grid-cols-2" aria-label="Chapters">
          {prev ? <ChapterLink to={prev.id} label="Previous" title={prev.title} back /> : <span />}
          {next && <ChapterLink to={next.id} label="Next" title={next.title} />}
        </nav>
      </article>

      {toc.length > 2 && (
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <div className="mb-2 text-sm text-parch-500">In this chapter</div>
            <TocList toc={toc} />
          </div>
        </aside>
      )}
    </div>
  )
}

function TocList({ toc, onPick }: { toc: { i: number; text: string }[]; onPick?: () => void }) {
  return (
    <ul className="mt-2 space-y-0.5 border-l border-white/10">
      {toc.map((t) => (
        <li key={t.i}>
          <a href={`#b${t.i}`} onClick={(e) => { e.preventDefault(); document.getElementById(`b${t.i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); onPick?.() }}
            className="-ml-px block border-l border-transparent py-1 pl-3 text-[14px] leading-snug text-parch-300 hover:border-aether-400 hover:text-parch-50">
            {t.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

function ChapterLink({ to, label, title, back }: { to: string; label: string; title: string; back?: boolean }) {
  return (
    <Link to={`/guide/${to}`} className={`group rounded-3xl border border-white/[0.07] bg-abyss-850/60 p-4 hover:border-white/15 ${back ? '' : 'sm:text-right'}`}>
      <span className={`flex items-center gap-1.5 text-[13px] text-parch-500 ${back ? '' : 'sm:justify-end'}`}>
        {back && <ArrowLeft className="size-3.5" />}{label}{!back && <ArrowRight className="size-3.5" />}
      </span>
      <span className="mt-1 block font-display text-lg text-parch-50">{title}</span>
    </Link>
  )
}

/** Doc colours were picked for a white page; only keep the ones that read on the dark one. */
function readable(hex?: string) {
  if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex)) return undefined
  const n = parseInt(hex.replace('#', ''), 16)
  const lum = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
  return lum > 0.45 ? (hex.startsWith('#') ? hex : `#${hex}`) : undefined
}

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) => {
        let node: ReactNode = r.t
        if (r.b) node = <strong className="font-semibold text-parch-50">{node}</strong>
        if (r.i) node = <em>{node}</em>
        if (r.u && !r.href) node = <span className="underline decoration-white/30 underline-offset-4">{node}</span>
        if (r.hl) node = <mark className="rounded bg-elyos-400/20 px-0.5 text-elyos-100">{node}</mark>
        if (r.href) node = <a href={r.href} target="_blank" rel="noreferrer" className="text-aether-300 underline decoration-aether-300/30 underline-offset-4">{node}</a>
        const color = readable(r.c)
        return <span key={i} style={color ? { color } : undefined}>{node}</span>
      })}
    </>
  )
}

function BlockView({ b, i }: { b: Block; i: number }) {
  switch (b.type) {
    case 'heading': {
      const cls = b.level <= 2 ? 'pt-6 font-display text-[26px] leading-tight text-parch-50' : 'pt-3 font-display text-[20px] text-elyos-200'
      return <h2 id={`b${i}`} className={`scroll-mt-28 ${cls}`}>{headingText(b.text)}</h2>
    }
    case 'p': {
      const text = b.runs.map((r) => r.t).join('').trim()
      if (!text || text === '—') return null
      return <p><Runs runs={b.runs} /></p>
    }
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul'
      return (
        <Tag className={`space-y-1.5 pl-5 ${b.ordered ? 'list-decimal' : 'list-disc'} marker:text-aether-400`}>
          {b.items.map((it, k) => <li key={k} style={{ marginLeft: it.level * 18 }}><Runs runs={it.runs} /></li>)}
        </Tag>
      )
    }
    case 'image':
      return (
        <motion.img initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} src={guideImg(b.src)} alt="" loading="lazy"
          width={Math.round(b.w * 1.33)} height={Math.round(b.h * 1.33)}
          className="h-auto max-w-full rounded-2xl border border-white/[0.06]" style={{ width: Math.round(b.w * 1.33) }} />
      )
    case 'hr':
      return <hr className="my-6 border-white/10" />
  }
}
