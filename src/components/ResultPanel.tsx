import { Panel } from './ui/Panel'
import { Tag } from './ui/Tag'
import { DataList } from './ui/DataList'
import { useAppStore } from '../store/gameStore'
import { formatCoords, formatNumber } from '../lib/format'
import { EARTH_DIAMETER_KM } from '../lib/geo'

/**
 * Was am Gegenpunkt liegt.
 *
 * Drei Fälle, die sauber auseinandergehalten werden müssen: ein benannter Ort,
 * offenes Meer (der Dienst kennt den Punkt, dort ist schlicht nichts), und
 * "keine Antwort". Im letzten Fall wird nichts behauptet – weder Land noch
 * Wasser –, sonst steht am Ende eine erfundene Auskunft auf dem Schirm.
 */
export function ResultPanel() {
  const target = useAppStore((s) => s.target)
  const loading = useAppStore((s) => s.loadingTarget)

  if (!target) return null

  const { point, label, elevation, lookup } = target
  const depth = elevation?.meters ?? null
  const water = elevation?.isWater === true
  const knowsPlace = lookup === 'found' && label
  const unreachable = !loading && lookup === 'failed' && elevation?.source === null

  const headline = loading
    ? 'Wird ermittelt …'
    : knowsPlace
      ? label
      : unreachable
        ? 'Nicht ermittelbar'
        : 'Offenes Meer'

  const badge = loading
    ? { tone: 'muted' as const, text: 'Lädt' }
    : unreachable
      ? { tone: 'muted' as const, text: 'Keine Daten' }
      : water
        ? { tone: 'cyan' as const, text: 'Im Wasser' }
        : knowsPlace
          ? { tone: 'warn' as const, text: 'An Land' }
          : { tone: 'cyan' as const, text: 'Im Wasser' }

  const heightValue =
    depth === null
      ? loading
        ? '…'
        : 'unbekannt'
      : water
        ? `${formatNumber(Math.abs(depth))} m unter dem Meeresspiegel`
        : `${formatNumber(depth)} m ü. NN`

  return (
    <Panel
      title="Gegenpunkt"
      aside={elevation?.source === 'gebco' ? 'GEBCO' : undefined}
      hazard={water}
    >
      <Tag tone={badge.tone}>{badge.text}</Tag>

      <h2 className="mt-3 text-xl leading-tight text-bone uppercase">{headline}</h2>

      <DataList
        className="mt-3"
        rows={[
          { label: 'Koordinaten', value: formatCoords(point.lat, point.lon), accent: true },
          { label: water ? 'Wassertiefe' : 'Höhe', value: heightValue },
          { label: 'Strecke', value: `${formatNumber(EARTH_DIAMETER_KM)} km` },
        ]}
      />

      {water && depth !== null && (
        <p className="mt-3 border-t border-steel/60 pt-3 text-xs leading-relaxed text-ash">
          Du kämst {formatNumber(Math.abs(depth))} m unter der Wasseroberfläche
          heraus. Rund 71 % aller Landflächen haben Meer als Gegenpunkt – die
          Erde ist unter dir meistens nass.
        </p>
      )}

      {unreachable && (
        <p className="mt-3 border-t border-steel/60 pt-3 text-xs leading-relaxed text-ash">
          Die Kartendienste antworten gerade nicht. Die Koordinaten stimmen
          trotzdem – sie werden hier gerechnet, nicht abgefragt.
        </p>
      )}
    </Panel>
  )
}
