import { Screen } from '../ui/Screen'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { Tag } from '../ui/Tag'
import { useGameStore } from '../../store/gameStore'
import { formatCoords } from '../../lib/format'

/**
 * TODO (Schritt 7): Antipoden-Auflösung per Reverse-Geocoding, Wassertiefe,
 * Bohrprotokoll aller durchfahrenen Schichten und Teilen-Button.
 */
export function ResultScreen() {
  const goTo = useGameStore((s) => s.goTo)
  const site = useGameStore((s) => s.site)

  if (!site) return null

  // Antipodenformel – die eigentliche Auflösung folgt in Schritt 7.
  const antiLat = -site.lat
  const antiLon = site.lon > 0 ? site.lon - 180 : site.lon + 180

  return (
    <Screen>
      <div className="w-full max-w-lg">
        <Tag tone="cyan">Durchbruch</Tag>

        <h2 className="mt-4 text-[clamp(1.8rem,7vw,2.8rem)] text-bone uppercase">
          Du bist
          <br />
          <span className="text-cyan">durch.</span>
        </h2>

        <Panel title="Antipode" className="mt-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-ash">Start</dt>
            <dd className="text-right text-bone tabular">
              {formatCoords(site.lat, site.lon)}
            </dd>
            <dt className="text-ash">Austritt</dt>
            <dd className="text-right text-cyan tabular">
              {formatCoords(antiLat, antiLon)}
            </dd>
            <dt className="text-ash">Strecke</dt>
            <dd className="text-right text-bone tabular">12.742 km</dd>
          </dl>
        </Panel>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => goTo('search')} glyph="↻">
            Nochmal bohren
          </Button>
          <Button variant="secondary" disabled glyph="⧉">
            Teilen
          </Button>
        </div>
      </div>
    </Screen>
  )
}
