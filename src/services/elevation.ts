import { fetchJson, makeCache, makeRateLimiter } from './http'
import type { GeoPoint } from '../lib/types'

/**
 * Höhe über bzw. Tiefe unter dem Meeresspiegel.
 *
 * Open-Meteo deckt Landflächen ab und liefert über Wasser schlicht 0. Für
 * echte Wassertiefen braucht es GEBCO über OpenTopoData – das ist allerdings
 * auf 1 Anfrage/Sekunde und 100 pro Tag begrenzt, also wird gecacht und nur
 * gefragt, wenn Open-Meteo 0 meldet.
 */

const OPEN_METEO = 'https://api.open-meteo.com/v1/elevation'
const GEBCO = 'https://api.opentopodata.org/v1/gebco2020'

export interface ElevationResult {
  /** Meter relativ zum Meeresspiegel. Negativ = unter Wasser. */
  meters: number | null
  /** Woher der Wert stammt – für die Anzeige der Quelle. */
  source: 'open-meteo' | 'gebco' | null
  /** Liegt der Punkt im Wasser? */
  isWater: boolean
}

const cache = makeCache<ElevationResult>('elevation')
const gebcoLimit = makeRateLimiter(1100) // OpenTopoData: max. 1 Anfrage/Sekunde

const cacheKey = (lat: number, lon: number) => `${lat.toFixed(3)},${lon.toFixed(3)}`

async function fromOpenMeteo({ lat, lon }: GeoPoint): Promise<number | null> {
  try {
    const data = await fetchJson<{ elevation?: number[] }>(
      `${OPEN_METEO}?latitude=${lat}&longitude=${lon}`,
    )
    return data.elevation?.[0] ?? null
  } catch (err) {
    console.warn('[antipode] Open-Meteo nicht erreichbar:', err)
    return null
  }
}

async function fromGebco({ lat, lon }: GeoPoint): Promise<number | null> {
  try {
    const data = await gebcoLimit(() =>
      fetchJson<{ results?: Array<{ elevation: number | null }> }>(
        `${GEBCO}?locations=${lat},${lon}`,
      ),
    )
    return data.results?.[0]?.elevation ?? null
  } catch (err) {
    console.warn('[antipode] GEBCO nicht erreichbar:', err)
    return null
  }
}

/**
 * Ermittelt die Höhe. Über Wasser wird auf GEBCO nachgefasst, weil dort die
 * eigentlich interessante Zahl steckt: wie tief das Meer an der Austrittsstelle
 * ist.
 */
export async function getElevation(point: GeoPoint): Promise<ElevationResult> {
  const key = cacheKey(point.lat, point.lon)
  const cached = cache.get(key)
  if (cached) return cached

  let result: ElevationResult

  const land = await fromOpenMeteo(point)

  if (land !== null && land !== 0) {
    result = { meters: land, source: 'open-meteo', isWater: land < 0 }
  } else {
    // Genau 0 heißt bei Open-Meteo fast immer "offenes Wasser".
    const depth = await fromGebco(point)
    if (depth !== null) {
      result = { meters: depth, source: 'gebco', isWater: depth < 0 }
    } else if (land === 0) {
      // Open-Meteo meldet Wasser, nur die Tiefe fehlt.
      result = { meters: null, source: 'open-meteo', isWater: true }
    } else {
      // Beide Dienste stumm: nichts behaupten, nichts speichern.
      return { meters: null, source: null, isWater: false }
    }
  }

  cache.set(key, result)
  return result
}
