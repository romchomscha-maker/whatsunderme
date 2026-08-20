import { PLACES } from '../data/places'
import type { Suggestion } from './geocoding'
import type { GeoPoint } from '../lib/types'
import { countryName } from '../lib/countries'

/**
 * Ortssuche ohne Netz.
 *
 * Springt ein, wenn Photon nicht erreichbar ist – etwa auf einer Seite mit
 * strikter Content-Security-Policy, die Anfragen an fremde Hosts blockiert.
 * Findet Orte, keine Hausnummern; dafür funktioniert es immer.
 *
 * Der Index ist nach Einwohnerzahl absteigend gebaut, die Reihenfolge der
 * Treffer ist also schon die Rangfolge – "Berlin" liefert Berlin und nicht
 * Berlin in Ohio.
 */

interface Place {
  name: string
  alias: string
  country: string
  lat: number
  lon: number
  /** Vorberechnete Suchform von Name und Alias. */
  key: string
  aliasKey: string
}

/**
 * Vergleichsform: ohne Diakritika, ohne Groß-/Kleinschreibung, und mit
 * aufgelösten Umlaut-Umschreibungen. Beide Seiten laufen durch dieselbe
 * Funktion, damit "Muenchen", "München" und "Munchen" denselben Schlüssel
 * ergeben.
 */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ae/g, 'a')
    .replace(/oe/g, 'o')
    .replace(/ue/g, 'u')
    .trim()
}

let cache: Place[] | null = null

/** Der Index wird erst beim ersten Zugriff zerlegt, nicht beim Laden der Seite. */
function places(): Place[] {
  if (cache) return cache

  cache = PLACES.split('\n').map((line) => {
    const [name, alias, country, lat, lon] = line.split('\t')
    return {
      name,
      alias,
      country,
      lat: Number(lat) / 1000,
      lon: Number(lon) / 1000,
      key: normalizeName(name),
      aliasKey: alias ? normalizeName(alias) : '',
    }
  })

  return cache
}

const toSuggestion = (p: Place): Suggestion => ({
  lat: p.lat,
  lon: p.lon,
  label: `${p.name}, ${countryName(p.country) ?? p.country}`,
  shortLabel: p.name,
  countryCode: p.country,
})

/** Vorschläge aus dem mitgelieferten Index. */
export function searchOffline(query: string, limit = 6): Suggestion[] {
  const q = normalizeName(query)
  if (q.length < 2) return []

  const starts: Place[] = []
  const contains: Place[] = []

  for (const p of places()) {
    if (p.key.startsWith(q) || p.aliasKey.startsWith(q)) {
      starts.push(p)
      if (starts.length >= limit) break // Reicht: Der Index ist bereits sortiert.
    } else if (contains.length < limit && (p.key.includes(q) || p.aliasKey.includes(q))) {
      contains.push(p)
    }
  }

  return [...starts, ...contains].slice(0, limit).map(toSuggestion)
}

/**
 * Nächstgelegener bekannter Ort. Für Gegenpunkte im Meer die einzige
 * greifbare Antwort: "1.100 km südöstlich von X" sagt mehr als nur
 * Koordinaten.
 */
export function nearestPlace(
  point: GeoPoint,
): { name: string; country: string; distanceKm: number } | null {
  let best: Place | null = null
  let bestDistance = Infinity

  for (const p of places()) {
    // Grobes Vorfiltern über die Winkeldifferenz spart die teure Formel.
    const dLat = Math.abs(p.lat - point.lat)
    if (dLat > 40) continue

    const d = haversineKm(point, p)
    if (d < bestDistance) {
      bestDistance = d
      best = p
    }
  }

  if (!best) return null
  return { name: best.name, country: best.country, distanceKm: bestDistance }
}

/** Großkreisentfernung in Kilometern. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}
