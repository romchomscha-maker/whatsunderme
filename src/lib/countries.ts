import { NUMERIC_TO_ALPHA2 } from '../data/countryCodes'

/**
 * Ländernamen auf Deutsch.
 *
 * `Intl.DisplayNames` steckt im Browser und kennt die Namen bereits – es
 * braucht nur den Alpha-2-Code. Die Küstenlinien führen aber numerische
 * ISO-Nummern, deshalb die erzeugte Zuordnung dazwischen.
 */

let display: Intl.DisplayNames | null = null

function names(): Intl.DisplayNames | null {
  if (display) return display
  try {
    display = new Intl.DisplayNames(['de'], { type: 'region' })
  } catch {
    display = null // Sehr alte Umgebung: dann bleibt der Code stehen.
  }
  return display
}

/** Deutscher Name zum Alpha-2-Code, sonst der Code selbst. */
export function countryName(alpha2: string | null | undefined): string | null {
  if (!alpha2) return null
  const resolved = names()?.of(alpha2.toUpperCase())
  return resolved && resolved !== alpha2.toUpperCase() ? resolved : alpha2.toUpperCase()
}

/**
 * Deutscher Name zur numerischen ISO-Nummer, wie sie in den Küstenlinien
 * steht. Für die drei Gebiete ohne ISO-Nummer (Nordzypern, Somaliland,
 * Kosovo) greift der übergebene Rückfallname.
 */
export function countryNameFromNumeric(
  numeric: string | number | null | undefined,
  fallback: string | null = null,
): string | null {
  if (numeric === null || numeric === undefined) return fallback
  const alpha2 = NUMERIC_TO_ALPHA2[String(numeric)]
  return alpha2 ? countryName(alpha2) : fallback
}
