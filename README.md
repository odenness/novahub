# NovaHub

An AION 2 companion for the NOVA legion on Baba (EU): what's on right now, the shop-only pet check, Kanon's guide and every crafting recipe, in one site built for phones first.

## What's in it

| Section | What it does |
|---|---|
| **Today** | A 24-hour dial of today's events in your local time, what's coming up, reset countdowns, a quick pet check and "carry on reading". |
| **Timers** | Every scheduled event with a ring that fills as it gets close, and a bell for a reminder 5 minutes before (while the site is open). The *Field bosses* tab shows live respawns from Nova Meter once the feed is connected. |
| **Pets** | Type a pet's name at the Black Cloud Merchant and get **Buy it** or **Skip it**. Mark pets owned; progress is saved in the browser. |
| **Guide** | Kanon's guide as readable chapters, with an outline and "where you left off". |
| **Crafting** | Recipes grouped by the path you climb (Basics → Artisan → Expert → Dragon Lord). Materials open into their own sub-materials, and every item links to its Baba price on A2-Tracker. |
| **Meter** | Download and install Nova Meter. |

Search (Ctrl K, `/`, or the search button) covers pets, events, recipes and guide headings, and answers in the result: Buy/Skip for pets, next start for events.

## Run

```bash
npm install
npm run dev
```

## Deploy

`npm run build` writes a static site to `dist/`. It uses relative paths and hash routing, so it works on GitHub Pages from any repo. The included workflow (`.github/workflows/deploy.yml`) builds and publishes on every push to `main`: in the repo's Settings → Pages, set the source to **GitHub Actions**.

## Keeping the guide current

`.github/workflows/sync-guide.yml` downloads Kanon's doc every morning (06:17 UTC). If anything changed it commits the new `src/data/guide.json`, new images and a line-level changelog, and the site redeploys. The Guide page then shows a *What's new* panel and marks new lines in gold. Run it on demand from the Actions tab (*Sync Kanon's guide → Run workflow*) or locally with `npm run sync`.

## Live field bosses

Set `VITE_BOSS_FEED_URL` (a repo variable used by the workflow, or a `.env` file locally) to a JSON endpoint shaped like:

```json
{ "bosses": [{ "name": "…", "region": "…", "status": "up", "hp": 0.38, "respawnAt": "2026-10-25T20:15:00Z", "reportedAt": "2026-10-25T19:58:00Z" }] }
```

The endpoint must allow requests from the NovaHub site (CORS). It's polled every minute.

## Data

Files in `src/data/` come from the Daeva Codex sync scripts and the Black Cloud Pet Ledger:

- `guide.json`, images in `public/guide/img/`: Kanon's public guide doc
- `timers.json`: event schedule from Shugo.GG
- `crafting.json`: recipes from aion2hub.com (item icons load from aion2hub)
- `pets.json`, icons in `public/pets/`: aion2.th.gl

`guide-index.json` is generated from `guide.json` before every dev/build run.

Fan-made, not affiliated with NCSOFT.
