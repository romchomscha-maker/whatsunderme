import { fetchJson, makeCache, makeRateLimiter } from './http'
import { searchOffline } from './offlinePlaces'
import type { DrillSite, GeoPoint } from '../lib/types'

/**
 * Adressen ↔ Koordinaten.
 *
 * Suche läuft über Photon (kein Schlüssel, kein striktes Limit, direkt für
 * Autocomplete gebaut). Die Rückwärtssuche für den Gegenpunkt läuft über
 * Nominatim, das nur ~1 Anfrage/Sekunde erlaubt – deshalb Drossel und Cache.
 */

const PHOTON = 'https://photon.komoot.io/api/'
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    postcode?: string
    city?: string
    district?: string
    county?: string
    state?: string
    country?: string
    countrycode?: string
  }
}

export interface Suggestion extends GeoPoint {
  /** Vollständige Bezeichnung für die Vorschlagsliste. */
  label: string
  /** Kurzform für Überschriften. */
  shortLabel: string
  countryCode?: string
}

/** Baut aus den Photon-Feldern eine lesbare Adresse ohne Dopplungen. */
function buildLabel(p: PhotonFeature['properties']): { label: string; short: string } {
  const street = [p.street, p.housenumber].filter(Boolean).join(' ')
  const place = p.city ?? p.district ?? p.county ?? p.state
  const short = p.name ?? street ?? place ?? 'Unbekannter Ort'

  const parts = [p.name, street, [p.postcode, place].filter(Boolean).join(' '), p.country]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s))

  // "München, München, Deutschland" → "München, Deutschland"
  const deduped = parts.filter((s, i) => parts.findIndex((o) => o === s) === i)
  return { label: deduped.join(', '), short }
}

export interface SearchOutcome {
  results: Suggestion[]
  /** Kam die Antwort aus dem mitgelieferten Index statt aus dem Netz? */
  offline: boolean
}

/**
 * Adressvorschläge für die Eingabe.
 *
 * Erst Photon – das kennt auch Hausnummern. Wenn es nicht erreichbar ist,
 * übernimmt der mitgelieferte Ortsindex. Der findet nur Orte, dafür immer;
 * ohne ihn bliebe die Suche z. B. hinter einer strengen
 * Content-Security-Policy dauerhaft leer.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<SearchOutcome> {
  const q = query.trim()
  if (q.length < 2) return { results: [], offline: false }

  const url = `${PHOTON}?q=${encodeURIComponent(q)}&limit=6&lang=de`

  try {
    const data = await fetchJson<{ features?: PhotonFeature[] }>(url, { signal })
    const seen = new Set<string>()

    const results = (data.features ?? [])
      .filter((f) => Array.isArray(f.geometry?.coordinates))
      .map((f) => {
        const [lon, lat] = f.geometry.coordinates
        const { label, short } = buildLabel(f.properties)
        return { lat, lon, label, shortLabel: short, countryCode: f.properties.countrycode }
      })
      .filter((s) => {
        // Photon liefert gelegentlich denselben Ort mehrfach.
        if (seen.has(s.label)) return false
        seen.add(s.label)
        return true
      })

    // Antwort ohne Treffer: der Ortsindex kennt vielleicht mehr.
    if (results.length === 0) {
      const local = searchOffline(q)
      if (local.length > 0) return { results: local, offline: true }
    }

    return { results, offline: false }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    console.warn('[antipode] Photon nicht erreichbar, nutze den Ortsindex:', err)
    return { results: searchOffline(q), offline: true }
  }
}

// --- Rückwärtssuche ------------------------------------------------------

const reverseCache = makeCache<ReverseResult>('reverse')
const nominatimLimit = makeRateLimiter(1100) // Nominatim: max. 1 Anfrage/Sekunde

export interface ReverseResult {
  /** Ortsbezeichnung, oder null wenn es dort keine gibt. */
  label: string | null
  countryCode?: string
  /**
   * "gefunden"      – es gibt dort einen benannten Ort
   * "leer"          – der Dienst kennt den Punkt nicht: offenes Meer
   * "nicht erreicht" – der Dienst hat nicht geantwortet; wir wissen es nicht
   *
   * Der Unterschied zwischen den letzten beiden ist wichtig: "kein Ergebnis"
   * ist eine Antwort, "keine Verbindung" ist keine.
   */
  status: 'found' | 'empty' | 'failed'
}

/** Schlüssel auf ~1 km gerundet: Nachbarpunkte teilen sich den Cache-Eintrag. */
const cacheKey = (lat: number, lon: number) => `${lat.toFixed(2)},${lon.toFixed(2)}`

interface NominatimResponse {
  error?: string
  name?: string
  display_name?: string
  address?: Record<string, string> & { country_code?: string }
}

/**
 * Was liegt an diesem Punkt? Für offenes Meer liefert Nominatim einen Fehler –
 * das ist kein Problem, sondern die häufigste Antwort: rund 71 % aller
 * Gegenpunkte von Landflächen liegen im Wasser.
 */
export async function reverseGeocode(point: GeoPoint): Promise<ReverseResult> {
  const key = cacheKey(point.lat, point.lon)
  const cached = reverseCache.get(key)
  if (cached) return cached

  const url =
    `${NOMINATIM}?lat=${point.lat}&lon=${point.lon}&format=json&zoom=10&accept-language=de`

  let result: ReverseResult
  try {
    // Hinweis: Nominatim möchte einen aussagekräftigen User-Agent. Browser
    // lassen den Header nicht setzen – dort identifiziert der Referer die App.
    const data = await nominatimLimit(() => fetchJson<NominatimResponse>(url))
    const label = data.error ? null : (data.display_name ?? data.name ?? null)
    result = label
      ? { label, status: 'found', countryCode: data.address?.country_code?.toUpperCase() }
      : { label: null, status: 'empty' }
  } catch (err) {
    console.warn('[antipode] Nominatim nicht erreichbar:', err)
    return { label: null, status: 'failed' }
  }

  // Nur belastbare Antworten cachen. Eine kurze Störung sonst für immer
  // festzuschreiben wäre schlimmer als eine zweite Anfrage.
  reverseCache.set(key, result)
  return result
}

/** Ergänzt einen Vorschlag zu einem vollständigen Bohrort. */
export function toSite(s: Suggestion): DrillSite {
  return {
    lat: s.lat,
    lon: s.lon,
    label: s.label,
    shortLabel: s.shortLabel,
    countryCode: s.countryCode?.toUpperCase(),
    elevation: null,
  }
}
