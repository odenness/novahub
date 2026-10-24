// Syncs Kanon's Aion 2 Bible (public Google Doc) into structured JSON for NovaHub's Guide.
//  - Downloads the HTML export (all tabs), extracts embedded images to public/guide/img
//  - Converts the flat Google Docs HTML into typed blocks, split per chapter
//  - Keeps a changelog of line-level changes per chapter between syncs
//
//   npm run sync          (GUIDE_HTML_FILE=export.html to parse a saved export instead of downloading)
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'node-html-parser'
import sharp from 'sharp'

const DOC_ID = '11u4wLCG1WfL-xSka2Aze0rI9vYRa7mq3N3Gp1bt0AWY'
const EXPORT_URL = `https://docs.google.com/document/d/${DOC_ID}/export?format=html`
const OUT = 'src/data'
const IMG_DIR = 'public/guide/img'
const SNAP_DIR = 'content/snapshots'

const exists = (p) => access(p).then(() => true, () => false)
const sha = (s) => createHash('sha1').update(s).digest('hex')
const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&hellip;/g, '…')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&larr;/g, '←')
    .replace(/&rarr;/g, '→')
    .replace(/&asymp;/g, '≈')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&minus;/g, '−')
    .replace(/&ge;/g, '≥')
    .replace(/&le;/g, '≤')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))

// Google Docs puts formatting in generated classes (.c12{font-weight:700}); build a lookup.
function parseClassStyles(css) {
  const map = {}
  for (const m of css.matchAll(/\.(c\d+)\{([^}]*)\}/g)) {
    const decl = Object.fromEntries(
      m[2]
        .split(';')
        .map((d) => d.split(':').map((x) => x.trim()))
        .filter((d) => d.length === 2),
    )
    map[m[1]] = decl
  }
  return map
}

function styleOf(el, classMap) {
  const out = {}
  for (const c of (el.getAttribute('class') || '').split(/\s+/)) Object.assign(out, classMap[c])
  const inline = el.getAttribute('style')
  if (inline) for (const d of inline.split(';')) {
    const [k, v] = d.split(':').map((x) => x?.trim())
    if (k && v) out[k] = v
  }
  return out
}

const isPlainColor = (c) => !c || /^#(000|000000|fff|ffffff)$/i.test(c) || c === 'transparent' || c === 'inherit'

function unwrapGoogleLink(href) {
  try {
    const u = new URL(href)
    if (u.hostname === 'www.google.com' && u.pathname === '/url') return u.searchParams.get('q') || href
  } catch {}
  return href
}

async function main() {
  await mkdir(OUT, { recursive: true })
  await mkdir(IMG_DIR, { recursive: true })
  await mkdir(SNAP_DIR, { recursive: true })

  let html
  if (process.env.GUIDE_HTML_FILE) {
    html = await readFile(process.env.GUIDE_HTML_FILE, 'utf8')
  } else {
    console.log('Downloading doc export…')
    const res = await fetch(EXPORT_URL)
    if (!res.ok) throw new Error(`Doc export failed: HTTP ${res.status}`)
    html = await res.text()
  }

  const css = html.slice(html.indexOf('<style'), html.indexOf('</style>'))
  const classMap = parseClassStyles(css)
  const body = parse(html.slice(html.indexOf('<body')))

  // --- images ---------------------------------------------------------------
  let imgCount = 0
  async function saveImage(src) {
    const m = src.match(/^data:image\/([a-z+]+);base64,(.*)$/s)
    if (!m) return src
    const buf = Buffer.from(m[2], 'base64')
    // Screenshots are huge PNGs; re-encode as WebP capped at 1600px wide.
    const name = `${sha(buf).slice(0, 12)}.webp`
    const path = join(IMG_DIR, name)
    if (!(await exists(path))) {
      await sharp(buf).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path)
    }
    imgCount++
    return `guide/img/${name}`
  }

  // --- inline runs ----------------------------------------------------------
  async function runsOf(el) {
    const runs = []
    const images = []
    for (const span of el.childNodes) {
      if (span.nodeType === 3) {
        const t = decodeEntities(span.rawText)
        if (t) runs.push({ t })
        continue
      }
      const img = span.querySelector?.('img') || (span.tagName === 'IMG' ? span : null)
      if (img) {
        const st = styleOf(img, classMap)
        images.push({
          src: await saveImage(img.getAttribute('src')),
          w: parseFloat(st.width) || null,
          h: parseFloat(st.height) || null,
        })
        continue
      }
      const st = styleOf(span, classMap)
      const a = span.tagName === 'A' ? span : span.querySelector?.('a')
      const t = decodeEntities(span.text)
      if (!t) continue
      const run = { t }
      if (st['font-weight'] === '700' || st['font-weight'] === 'bold') run.b = 1
      if (st['font-style'] === 'italic') run.i = 1
      if ((st['text-decoration'] || '').includes('underline') && !a) run.u = 1
      if ((st['text-decoration'] || '').includes('line-through')) run.s = 1
      if (!isPlainColor(st['background-color'])) run.hl = st['background-color']
      if (!isPlainColor(st.color)) run.c = st.color
      if (a) run.href = unwrapGoogleLink(decodeEntities(a.getAttribute('href') || ''))
      // merge with previous run when formatting is identical
      const prev = runs[runs.length - 1]
      const same = prev && ['b', 'i', 'u', 's', 'hl', 'c', 'href'].every((k) => prev[k] === run[k])
      if (same) prev.t += run.t
      else runs.push(run)
    }
    return { runs, images }
  }

  const plain = (runs) => runs.map((r) => r.t).join('').replace(/\s+/g, ' ').trim()

  // --- blocks ---------------------------------------------------------------
  const blocks = []
  for (const node of body.querySelector('body').childNodes) {
    if (node.nodeType !== 1) continue
    const tag = node.tagName
    if (/^H[1-6]$/.test(tag)) {
      const { runs } = await runsOf(node)
      const text = plain(runs)
      if (text) blocks.push({ type: 'heading', level: Number(tag[1]), text })
    } else if (tag === 'P') {
      const { runs, images } = await runsOf(node)
      for (const img of images) blocks.push({ type: 'image', ...img })
      if (plain(runs)) blocks.push({ type: 'p', runs })
    } else if (tag === 'UL' || tag === 'OL') {
      const level = Number((node.getAttribute('class') || '').match(/lst-kix_\w+-(\d+)/)?.[1] ?? 0)
      const items = []
      for (const li of node.querySelectorAll('li')) {
        const { runs, images } = await runsOf(li)
        for (const img of images) blocks.push({ type: 'image', ...img })
        if (plain(runs)) items.push({ level, runs })
      }
      const last = blocks[blocks.length - 1]
      if (last?.type === 'list' && last.ordered === (tag === 'OL')) last.items.push(...items)
      else if (items.length) blocks.push({ type: 'list', ordered: tag === 'OL', items })
    } else if (tag === 'HR') {
      blocks.push({ type: 'hr' })
    } else if (tag === 'TABLE') {
      const rows = []
      for (const tr of node.querySelectorAll('tr')) {
        const cells = []
        for (const td of tr.querySelectorAll('td')) {
          const parts = []
          for (const p of td.querySelectorAll('p')) {
            const { runs, images } = await runsOf(p)
            parts.push(...images.map((im) => ({ img: im })), ...(plain(runs) ? [{ runs }] : []))
          }
          cells.push(parts)
        }
        rows.push(cells)
      }
      blocks.push({ type: 'table', rows })
    }
  }

  // --- chapters -------------------------------------------------------------
  const chapterRe = /^CH\s*(\d+)\s*:\s*(.+)$/i
  const chapters = [{ id: 'intro', number: 0, title: 'Introduction', blocks: [] }]
  for (const b of blocks) {
    const text = b.type === 'heading' ? b.text : b.type === 'p' ? plain(b.runs) : ''
    const m = text.match(chapterRe)
    if (m && (b.type === 'heading' || text.length < 60)) {
      const number = Number(m[1])
      const title = m[2].trim().replace(/\s+/g, ' ')
      chapters.push({ id: `ch${number}`, number, title, blocks: [] })
      continue
    }
    if (/^CHAPTER\s*\d+:?$/i.test(text)) continue // stray duplicate label above CH 6
    chapters[chapters.length - 1].blocks.push(b)
  }

  const chapterText = (ch) =>
    ch.blocks
      .flatMap((b) =>
        b.type === 'heading' ? [b.text] : b.type === 'p' ? [plain(b.runs)] : b.type === 'list' ? b.items.map((i) => plain(i.runs)) : [],
      )
      .filter(Boolean)

  const introText = chapterText(chapters[0]).join('\n')
  const lastUpdated = introText.match(/Last Updated:\s*([^\n]+)/)?.[1]?.trim() ?? null
  const updateNote = introText.match(/\*+\s*Update Note[^\n]*/)?.[0]?.replace(/^\*+\s*/, '') ?? null

  // --- changelog ------------------------------------------------------------
  const guidePath = join(OUT, 'guide.json')
  const changelogPath = join(OUT, 'changelog.json')
  const previous = (await exists(guidePath)) ? JSON.parse(await readFile(guidePath, 'utf8')) : null
  const changelog = (await exists(changelogPath)) ? JSON.parse(await readFile(changelogPath, 'utf8')) : []
  const contentHash = sha(JSON.stringify(chapters.map(chapterText)))
  const now = new Date().toISOString()

  if (previous && previous.meta.contentHash !== contentHash) {
    const prevById = Object.fromEntries(previous.chapters.map((c) => [c.id, c]))
    const changes = []
    for (const ch of chapters) {
      const before = prevById[ch.id] ? chapterText(prevById[ch.id]) : []
      const after = chapterText(ch)
      const beforeSet = new Set(before)
      const afterSet = new Set(after)
      const added = after.filter((l) => !beforeSet.has(l))
      const removed = before.filter((l) => !afterSet.has(l))
      if (added.length || removed.length) changes.push({ id: ch.id, title: ch.title, added, removed })
    }
    if (changes.length) changelog.unshift({ syncedAt: now, docLastUpdated: lastUpdated, changes })
    console.log(`Doc changed: ${changes.length} chapter(s) updated`)
  } else if (previous) {
    console.log('No content changes since last sync')
  }

  const meta = {
    docId: DOC_ID,
    docUrl: `https://docs.google.com/document/d/${DOC_ID}/preview`,
    syncedAt: now,
    contentHash,
    lastUpdated,
    updateNote,
    imageCount: imgCount,
  }
  if (!previous || previous.meta.contentHash !== contentHash) {
    await writeFile(join(SNAP_DIR, `${now.slice(0, 16).replace(/[:T]/g, '-')}.txt`), chapters.map((c) => `# ${c.title}\n${chapterText(c).join('\n')}`).join('\n\n'))
  }
  await writeFile(guidePath, JSON.stringify({ meta, chapters }))
  await writeFile(changelogPath, JSON.stringify(changelog.slice(0, 20), null, 1))
  console.log(`Wrote ${chapters.length} chapters, ${blocks.length} blocks, ${imgCount} images`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
