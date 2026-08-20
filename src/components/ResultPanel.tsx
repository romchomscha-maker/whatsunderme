import { Panel } from './ui/Panel'
import { Tag } from './ui/Tag'
import { DataList } from './ui/DataList'
import { useAppStore } from '../store/gameStore'
import { formatCoords, formatNumber } from '../lib/format'
import { EARTH_DIAMETER_KM } from '../lib/geo'

/**
 * Was am Gegenpunkt liegt.
 *
 * Die Auskunft hat drei Güteklassen, die auseinandergehalten werden müssen:
 * ein benannter Ort vom Kartendienst, offenes Meer (der Dienst kennt den
 * Punkt, dort ist nichts), oder – wenn kein Dienst antwortet – eine
 * Einschätzung aus den mitgelieferten Küstenlinien. Die letzte wird als
 * Schätzung ausgewiesen, nicht als Auskunft: bei 1:110 Mio. ist die
 * Küstenlinie grob vereinfacht.
 */
export function ResultPanel() {
  const target = useAppStore((s) => s.target)
  const loading = useAppStore((s) => s.loadingTarget)

  if (!target) return null

  const { point, label, elevation, lookup, offline } = target
  const depth = elevation?.meters ?? null
  const knowsPlace = lookup === 'found' && label

  // Ohne Dienst entscheidet die gerechnete Küstenlinie über Land oder Wasser.
  const water = offline ? !offline.isLand : elevation?.isWater === true

  const headline = loading
    ? 'Wird ermittelt …'
    : knowsPlace
      ? label
      : offline
        ? (offline.country ?? 'Offenes Meer')
        : 'Offenes Meer'

  const badge = loading
    ? { tone: 'muted' as const, text: 'Lädt' }
    : water
      ? { tone: 'cyan' as const, text: offline ? 'Wasser (geschätzt)' : 'Im Wasser' }
      : { tone: 'warn' as const, text: offline ? 'Land (geschätzt)' : 'An Land' }

  const heightValue =
    depth === null
      ? loading
        ? '…'
        : 'unbekannt'
      : water
        ? `${formatNumber(Math.abs(depth))} m unter dem Meeresspiegel`
        : `${formatNumber(depth)} m ü. NN`

  const rows = [
    { label: 'Koordinaten', value: formatCoords(point.lat, point.lon), accent: true },
    { label: water ? 'Wassertiefe' : 'Höhe', value: heightValue },
    { label: 'Strecke', value: `${formatNumber(EARTH_DIAMETER_KM)} km` },
  ]

  if (offline?.nearest) {
    rows.splice(1, 0, {
      label: 'Nächster Ort',
      value: `${offline.nearest.name} · ${formatNumber(Math.round(offline.nearest.distanceKm))} km`,
      accent: false,
    })
  }

  return (
    <Panel
      title="Gegenpunkt"
      aside={elevation?.source === 'gebco' ? 'GEBCO' : offline ? 'gerechnet' : undefined}
      hazard={water}
    >
      <Tag tone={badge.tone}>{badge.text}</Tag>

      <h2 className="mt-3 text-xl leading-tight text-bone uppercase">{headline}</h2>

      <DataList className="mt-3" rows={rows} />

      {water && depth !== null && (
        <p className="mt-3 border-t border-steel/60 pt-3 text-xs leading-relaxed text-ash">
          Du kämst {formatNumber(Math.abs(depth))} m unter der Wasseroberfläche
          heraus. Rund 71 % aller Landflächen haben Meer als Gegenpunkt – die
          Erde ist unter dir meistens nass.
        </p>
      )}

      {offline && (
        <p className="mt-3 border-t border-steel/60 pt-3 text-xs leading-relaxed text-ash">
          Die Kartendienste antworten hier nicht. Land oder Wasser ist aus den
          mitgelieferten Küstenlinien gerechnet – nah am Ufer kann das kippen.
          Die Koordinaten stimmen unabhängig davon: sie werden gerechnet, nicht
          abgefragt.
        </p>
      )}
    </Panel>
  )
}
