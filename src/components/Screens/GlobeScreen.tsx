import { Screen } from '../ui/Screen'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { Tag } from '../ui/Tag'
import { DataList } from '../ui/DataList'
import { useGameStore } from '../../store/gameStore'
import { formatCoords, formatElevation } from '../../lib/format'

/**
 * TODO (Schritt 6): Hier kommt der Three.js-Globus mit Posterize-Shader,
 * Kamerafahrt zum Ziel und einfallendem Marker hin. Das Info-Panel darunter
 * bleibt bestehen.
 */
export function GlobeScreen() {
  const goTo = useGameStore((s) => s.goTo)
  const site = useGameStore((s) => s.site)

  if (!site) return null

  return (
    <Screen>
      <div className="w-full max-w-lg">
        <Tag>Ziel erfasst</Tag>

        <div className="clip-bevel mt-4 flex aspect-square w-full items-center justify-center border-2 border-steel bg-abyss/60">
          <p className="font-pixel text-center text-[10px] tracking-[0.16em] text-steel uppercase">
            Globus
            <br />
            <span className="text-cyan-deep">Schritt 6</span>
          </p>
        </div>

        <Panel title="Bohrort" aside={site.countryCode} className="mt-4">
          <h2 className="text-2xl text-bone uppercase">{site.shortLabel ?? site.label}</h2>
          <DataList
            className="mt-3"
            rows={[
              { label: 'Koordinaten', value: formatCoords(site.lat, site.lon) },
              { label: 'Höhe', value: formatElevation(site.elevation) },
            ]}
          />
        </Panel>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => goTo('search')}>
            ← Anderes Ziel
          </Button>
          <Button size="lg" glyph="▼" onClick={() => goTo('drill')}>
            Bohren
          </Button>
        </div>
      </div>
    </Screen>
  )
}
