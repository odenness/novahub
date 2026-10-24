import { Download, Radio, Swords, Trophy, PawPrint, ScrollText } from 'lucide-react'
import { PageTitle } from '../components/ui'

const RELEASES = 'https://github.com/odenness/nova-meter/releases/latest'

const features = [
  { icon: Swords, title: 'In the fight', text: 'DPS, rDPS, nDPS and HPS for every player. The boss bar shows HP left and time to kill, and on bosses that enrage it tells you whether your party will beat the timer.' },
  { icon: Trophy, title: 'Nova Rating', text: 'Each boss parse is rated 0 to 100 against the same class on that boss, adjusted for your Combat Power. 50 is typical; 95 is the top 5%.' },
  { icon: Radio, title: 'Field boss timers', text: "Open your world map and every field boss is listed: who's up, and when the rest respawn. Set a pop-up reminder, or post live timers to your guild's Discord." },
  { icon: PawPrint, title: 'Pet farming', text: 'Pet levels and souls come straight from the game. Put pets on a target farm and watch them count up under the meter.' },
  { icon: ScrollText, title: 'Expeditions and history', text: 'Every dungeon visit becomes one run with clear time, deaths and each boss. Your fastest clear per difficulty is marked.' },
]

const steps = [
  { title: 'Install Npcap', text: 'Get it from npcap.com and keep the defaults. Leave "Restrict Npcap driver\'s access to Administrators only" unticked.', href: 'https://npcap.com/#download' },
  { title: 'Run the Nova Meter installer', text: 'If Windows says it protected your PC, choose More info, then Run anyway. The installer isn\'t code-signed yet.' },
  { title: 'Play in borderless windowed mode', text: 'Start the meter before or after you log in. Ctrl+Shift+L locks it (click-through) and Ctrl+Shift+H hides it.' },
]

export default function Meter() {
  return (
    <div>
      <PageTitle title="Nova Meter" lead="A free, read-only damage meter overlay for AION 2. It also feeds the live field boss timers on NovaHub.">
        <a href={RELEASES} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-aether-400 px-5 py-3 text-[15px] font-semibold text-abyss-950 hover:bg-aether-300">
          <Download className="size-5" /> Download for Windows
        </a>
      </PageTitle>

      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <li key={f.title} className="rounded-3xl border border-white/[0.07] bg-abyss-850/60 p-5">
            <f.icon className="size-6 text-aether-300" />
            <h2 className="mt-3 font-display text-xl text-parch-50">{f.title}</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-parch-300">{f.text}</p>
          </li>
        ))}
      </ul>

      <h2 className="mb-4 mt-12 font-display text-[26px] text-parch-50">Install in three steps</h2>
      <ol className="grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-3xl border border-white/[0.07] bg-abyss-850/60 p-5">
            <span className="font-display text-3xl text-elyos-400">{i + 1}</span>
            <h3 className="mt-2 text-[16px] font-semibold text-parch-50">{s.title}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-parch-300">{s.text}</p>
            {s.href && <a href={s.href} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-aether-300">Open npcap.com</a>}
          </li>
        ))}
      </ol>

      <div className="mt-12 max-w-2xl rounded-3xl border border-white/[0.07] p-5">
        <h2 className="font-display text-xl text-parch-50">What it reads, and what it doesn't</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-parch-300">
          Nova Meter reads a copy of the game's network traffic through Npcap. It never touches the game, its files or its memory, and never sends anything to the game servers. Fights and settings stay on your PC. The only things it shares are boss timers: with your Discord webhook if you add one, and with the NOVA guild board for legion members (you can switch that off).
        </p>
      </div>
    </div>
  )
}
