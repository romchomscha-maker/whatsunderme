import { useState } from 'react'
import { Screen } from '../ui/Screen'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { Tag } from '../ui/Tag'
import { useGameStore } from '../../store/gameStore'
import type { DrillSite } from '../../lib/types'

/**
 * Provisorische Ziel-Auswahl.
 *
 * TODO (Schritt 2): Das Eingabefeld bekommt echtes Autocomplete über Photon,
 * "Überrasch mich" würfelt einen zufälligen Landpunkt, "Mein Standort" nutzt
 * die Geolocation-API. Bis dahin reicht diese Liste, um den Screen-Fluss
 * durchspielen zu können.
 */
const DEMO_SITES: DrillSite[] = [
  { label: 'München, Marienplatz', shortLabel: 'München', lat: 48.1374, lon: 11.5755, elevation: 519, countryCode: 'DE' },
  { label: 'Hamburg, Landungsbrücken', shortLabel: 'Hamburg', lat: 53.5453, lon: 9.9668, elevation: 4, countryCode: 'DE' },
  { label: 'Zermatt, Wallis', shortLabel: 'Zermatt', lat: 46.0207, lon: 7.7491, elevation: 1608, countryCode: 'CH' },
  { label: 'Reykjavík, Island', shortLabel: 'Reykjavík', lat: 64.1466, lon: -21.9426, elevation: 61, countryCode: 'IS' },
]

export function SearchScreen() {
  const goTo = useGameStore((s) => s.goTo)
  const setSite = useGameStore((s) => s.setSite)
  const [query, setQuery] = useState('')

  const pick = (site: DrillSite) => {
    setSite(site)
    goTo('globe')
  }

  const suggestions = query.trim()
    ? DEMO_SITES.filter((s) => s.label.toLowerCase().includes(query.trim().toLowerCase()))
    : DEMO_SITES

  return (
    <Screen className="justify-start pt-24">
      <div className="w-full max-w-lg">
        <Tag>Ziel wählen</Tag>

        <h2 className="mt-4 text-[clamp(1.8rem,7vw,2.8rem)] text-bone uppercase">
          Wo soll das
          <br />
          <span className="text-cyan">Loch hin?</span>
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-ash">
          Adresse, Ort oder Sehenswürdigkeit. Von dort geht es senkrecht nach
          unten.
        </p>

        <div className="mt-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="z. B. Marienplatz, München"
            aria-label="Adresse suchen"
            className="clip-bevel-sm font-ui w-full border-2 border-steel bg-night px-4 py-3.5 text-base text-bone placeholder:text-ash/60 focus:border-cyan focus:outline-none"
          />
        </div>

        <Panel title="Vorschläge" flush className="mt-4">
          <ul>
            {suggestions.map((site) => (
              <li key={site.label}>
                <button
                  type="button"
                  onClick={() => pick(site)}
                  className="flex w-full items-center justify-between gap-3 border-b border-steel/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-dusk"
                >
                  <span className="text-sm text-bone">{site.label}</span>
                  <span className="font-pixel text-[10px] text-ash tabular">
                    {site.lat.toFixed(2)} / {site.lon.toFixed(2)}
                  </span>
                </button>
              </li>
            ))}
            {suggestions.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ash">
                Nichts gefunden. Echte Suche kommt in Schritt 2.
              </p>
            )}
          </ul>
        </Panel>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            glyph="⚄"
            onClick={() => pick(DEMO_SITES[Math.floor(Math.random() * DEMO_SITES.length)])}
          >
            Überrasch mich
          </Button>
          <Button variant="secondary" glyph="◎" disabled>
            Mein Standort
          </Button>
        </div>

        <div className="mt-8">
          <Button variant="ghost" size="sm" onClick={() => goTo('title')}>
            ← Zurück
          </Button>
        </div>
      </div>
    </Screen>
  )
}
