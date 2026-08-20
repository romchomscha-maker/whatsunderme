import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, Geometry, Position } from 'geojson'
import worldData from 'world-atlas/countries-110m.json'
import type { GeoPoint } from '../lib/types'

/**
 * Land oder Wasser – berechnet aus den mitgelieferten Küstenlinien statt
 * abgefragt.
 *
 * Nötig, weil Nominatim nicht überall erreichbar ist. Ohne diese Prüfung
 * bliebe die eigentliche Antwort ("kommst du im Meer raus?") in solchen
 * Umgebungen leer.
 *
 * Auflösung ist 1:110 Mio. – die Küstenlinie ist also grob vereinfacht.
 * Nahe am Ufer kann das Ergebnis kippen, deshalb wird es in der Oberfläche
 * als Schätzung ausgewiesen und nicht als Auskunft.
 */

/** Ab dieser Entfernung zur Küste ist die grobe Linie unzuverlässig. */
export const COARSE_MARGIN_KM = 25

/**
 * Ringe, die sich einmal um die ganze Erde ziehen, sind an den Polen offen:
 * Die Antarktis-Kontur endet bei −84,7° und lässt den Pol selbst außen vor.
 * Ein Punkt weiter südlich gälte damit als Wasser – betrifft die Gegenpunkte
 * von Nordnorwegen, Sibirien und Alaska. Deshalb wird der Ring über den Pol
 * geschlossen.
 */
function closeOverPole(ring: Position[]): Position[] {
  /*
   * Nicht über die Eckwerte entscheiden: Fidschi reicht ebenfalls von −180
   * bis 180, weil es die Datumsgrenze überlappt – über den Pol geschlossen
   * würde daraus eine Kappe über der halben Südhalbkugel. Ein echter
   * Polarring belegt dagegen jeden Längengradbereich.
   */
  const SECTORS = 36 // 10° je Abschnitt
  const covered = new Array<boolean>(SECTORS).fill(false)
  let north = -Infinity
  let south = Infinity

  for (const [lon, lat] of ring) {
    const sector = Math.min(SECTORS - 1, Math.floor(((lon + 180) / 360) * SECTORS))
    covered[sector] = true
    if (lat > north) north = lat
    if (lat < south) south = lat
  }

  if (!covered.every(Boolean)) return ring

  const pole = north < 0 ? -90 : south > 0 ? 90 : null
  if (pole === null) return ring // Zieht sich über beide Halbkugeln: nicht anfassen.

  // Den doppelten Schlusspunkt entfernen, dann über den Pol zurückführen.
  const first = ring[0]
  const last = ring[ring.length - 1]
  const open =
    first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : ring

  return [...open, [180, pole], [-180, pole]]
}

let cache: Array<{ name: string; id: string | null; polygons: Position[][][] }> | null = null

function countries() {
  if (cache) return cache

  const topology = worldData as unknown as Topology
  const collection = feature(
    topology,
    topology.objects.countries as GeometryCollection,
  ) as unknown as { features: Array<Feature<Geometry, { name?: string }> & { id?: string }> }

  cache = collection.features.map((f) => ({
    name: f.properties?.name ?? 'Land',
    // Numerische ISO-Nummer; daraus wird später der deutsche Ländername.
    id: f.id ?? null,
    polygons: (f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.type === 'MultiPolygon'
        ? f.geometry.coordinates
        : []
    ).map((rings) => rings.map(closeOverPole)),
  }))

  return cache
}

/**
 * Strahlverfahren: Ein Strahl vom Punkt nach Osten schneidet den Rand eines
 * Polygons ungerade oft, wenn der Punkt innen liegt.
 */
function ringContains(ring: Position[], lon: number, lat: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/** Erster Ring ist die Außenkontur, weitere sind Löcher (z. B. Binnenseen). */
function polygonContains(rings: Position[][], lon: number, lat: number): boolean {
  if (!rings.length || !ringContains(rings[0], lon, lat)) return false
  for (let i = 1; i < rings.length; i++) {
    if (ringContains(rings[i], lon, lat)) return false
  }
  return true
}

export interface LandResult {
  isLand: boolean
  /** Englischer Name aus den Küstenlinien, als Rückfall. */
  country: string | null
  /** Numerische ISO-Nummer des Landes, für die Übersetzung ins Deutsche. */
  countryId: string | null
}

/** Liegt der Punkt an Land? Wenn ja, in welchem Land? */
export function classifyPoint({ lat, lon }: GeoPoint): LandResult {
  for (const country of countries()) {
    for (const rings of country.polygons) {
      if (polygonContains(rings, lon, lat)) {
        return { isLand: true, country: country.name, countryId: country.id }
      }
    }
  }
  return { isLand: false, country: null, countryId: null }
}
