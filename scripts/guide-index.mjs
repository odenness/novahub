// Writes a tiny chapter list so the home page doesn't load the whole guide.
import { readFileSync, writeFileSync } from 'node:fs'
const g = JSON.parse(readFileSync(new URL('../src/data/guide.json', import.meta.url)))
const titleCase = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s(/&-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : s)
writeFileSync(new URL('../src/data/guide-index.json', import.meta.url), JSON.stringify(g.chapters.map((c) => ({ id: c.id, number: c.number, title: titleCase(c.title) }))))
