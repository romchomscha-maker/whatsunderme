/**
 * Baut den mitgelieferten Ortsindex für die Suche ohne Netz.
 *
 * Hintergrund: In manchen Umgebungen (z. B. einer Seite mit strikter
 * Content-Security-Policy) sind Anfragen an fremde Hosts blockiert, dann
 * antwortet Photon nie. Damit die Suche trotzdem etwas findet, liegt ein
 * kompakter Ortsindex bei.
 *
 * Zwei Quellen, weil keine allein reicht:
 *   all-the-cities – hat Einwohnerzahlen, aber anglisierte Namen ("Munich")
 *   cities.json    – hat die Namen in Landessprache ("Köln", "Zülpich"),
 *                    dafür keine Einwohnerzahlen
 * Beide stammen aus der GeoNames-Datenbank und werden über die Koordinaten
 * zusammengeführt.
 *
 *   node scripts/build-places.mjs
 */
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const withPopulation = require('all-the-cities')
const withLocalNames = require('cities.json')

/** Deutschsprachiger Raum – hier lohnt feinere Abdeckung, die App ist deutsch. */
const HOME = new Set(['DE', 'AT', 'CH', 'LI'])
const MIN_POPULATION_HOME = 2000
const MIN_POPULATION_WORLD = 40000

/** Diakritika entfernen – für den Namensabgleich der beiden Quellen. */
const fold = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()

/**
 * Deutsche Namen für Orte, die beide Quellen nur anglisiert kennen.
 * Ohne das findet niemand "München", weil GeoNames dort "Munich" führt.
 *
 * Reine Umlautfragen stehen hier bewusst nicht drin: die Suche vergleicht
 * ohnehin diakritikafrei, "Nürnberg" findet also auch "Nurnberg".
 */
const GERMAN_NAMES = {
  2867714: 'München', 2761369: 'Wien', 3067696: 'Prag', 3169070: 'Rom',
  3173435: 'Mailand', 756135: 'Warschau', 524901: 'Moskau', 2618425: 'Kopenhagen',
  2267057: 'Lissabon', 264371: 'Athen', 2800866: 'Brüssel', 2660646: 'Genf',
  3172394: 'Neapel', 3176959: 'Florenz', 3164603: 'Venedig', 2990440: 'Nizza',
  2973783: 'Straßburg', 2988507: 'Paris', 2643743: 'London', 3117735: 'Madrid',
  3128760: 'Barcelona', 745044: 'Istanbul', 2950159: 'Berlin', 1850147: 'Tokio',
  1816670: 'Peking', 3448439: 'São Paulo', 3435910: 'Buenos Aires',
  2464470: 'Tunis', 360630: 'Kairo', 993800: 'Johannesburg', 1275339: 'Mumbai',
  2147714: 'Sydney', 5128581: 'New York', 5368361: 'Los Angeles',
  4887398: 'Chicago', 6167865: 'Toronto', 3530597: 'Mexiko-Stadt',
  2861650: 'Nürnberg', 2911298: 'Hamburg', 2925533: 'Frankfurt am Main',
  3117732: 'Sevilla', 2988358: 'Marseille', 3169921: 'Turin', 3165524: 'Triest',
  2657896: 'Zürich', 683506: 'Bukarest', 727011: 'Sofia',
  2673730: 'Stockholm', 658225: 'Helsinki', 3143244: 'Oslo', 3054643: 'Budapest',
  1668341: 'Taipeh', 1835848: 'Seoul', 1880252: 'Singapur', 292223: 'Dubai',
}

// Ortsnamen der zweiten Quelle über gerundete Koordinaten auffindbar machen.
const localByPosition = new Map()
for (const city of withLocalNames) {
  const key = `${city.country}:${Number(city.lat).toFixed(2)}:${Number(city.lng).toFixed(2)}`
  if (!localByPosition.has(key)) localByPosition.set(key, city.name)
}

const selected = withPopulation.filter((c) => {
  const min = HOME.has(c.country) ? MIN_POPULATION_HOME : MIN_POPULATION_WORLD
  return c.population >= min
})

// Nach Einwohnerzahl absteigend: Die Reihenfolge im Index ist damit zugleich
// die Rangfolge der Suche – eine Einwohnerspalte erübrigt sich.
selected.sort((a, b) => b.population - a.population)

let renamed = 0
const rows = selected.map((c) => {
  const [lon, lat] = c.loc.coordinates
  const key = `${c.country}:${lat.toFixed(2)}:${lon.toFixed(2)}`
  const local = localByPosition.get(key)
  const german = GERMAN_NAMES[c.cityId]

  /*
   * Den Namen der zweiten Quelle nur übernehmen, wenn er sich allein durch
   * Diakritika unterscheidet ("Zulpich" → "Zülpich"). Sonst ersetzt der
   * Abgleich sonst gute Namen durch englische Exonyme ("Nurnberg" wurde so
   * zu "Nuremberg").
   */
  const localMatches = local && fold(local) === fold(c.name)

  const display = german ?? (localMatches ? local : c.name)
  // Die abweichende Schreibweise bleibt als Alias suchbar, damit sowohl
  // "München" als auch "Munich" ans Ziel führen.
  const alias = display !== c.name ? c.name : ''
  if (alias) renamed++

  return [
    display,
    alias,
    c.country,
    Math.round(lat * 1000),
    Math.round(lon * 1000),
  ].join('\t')
})

const payload = rows.join('\n')

writeFileSync(
  'src/data/places.ts',
  `/* eslint-disable */
/**
 * ERZEUGT – nicht von Hand bearbeiten.
 * Neu bauen mit: node scripts/build-places.mjs
 *
 * ${rows.length.toLocaleString('de-DE')} Orte aus der GeoNames-Datenbank, nach Einwohnerzahl
 * absteigend sortiert. Spalten: Name, Alias, Land, Breite×1000, Länge×1000.
 * Weltweit ab ${MIN_POPULATION_WORLD.toLocaleString('de-DE')} Einwohnern, im deutschsprachigen Raum ab ${MIN_POPULATION_HOME.toLocaleString('de-DE')}.
 */
export const PLACES = ${JSON.stringify(payload)}
`,
)

const kb = (Buffer.byteLength(payload) / 1024).toFixed(0)
console.log(`${rows.length} Orte, ${kb} kB (${renamed} mit abweichendem Alias)`)
console.log('Probe:', rows.slice(0, 3).map((r) => r.split('\t')[0]).join(', '))

/* ------------------------------------------------------------------------
 * Zweite Ausgabe: Länderkennungen.
 *
 * Die Küstenlinien von world-atlas führen Länder nur mit numerischer
 * ISO-Nummer und englischem Namen. Für deutsche Ländernamen braucht
 * Intl.DisplayNames aber den zweibuchstabigen Code – numerische Codes
 * versteht es nicht. Also wird die Zuordnung hier einmal erzeugt.
 * ---------------------------------------------------------------------- */

const iso = require('iso-3166-1')
const world = require('world-atlas/countries-110m.json')

const numericToAlpha2 = {}
let unmatched = []

for (const geometry of world.objects.countries.geometries) {
  const numeric = String(geometry.id)
  const entry = iso.whereNumeric(numeric.padStart(3, '0'))
  if (entry) numericToAlpha2[numeric] = entry.alpha2
  else unmatched.push(`${numeric} (${geometry.properties?.name})`)
}

writeFileSync(
  'src/data/countryCodes.ts',
  `/* eslint-disable */
/**
 * ERZEUGT – nicht von Hand bearbeiten.
 * Neu bauen mit: node scripts/build-places.mjs
 *
 * Numerische ISO-3166-Nummer → Alpha-2-Code, für die ${Object.keys(numericToAlpha2).length} Länder der
 * mitgelieferten Küstenlinien. Intl.DisplayNames macht daraus deutsche Namen.
 */
export const NUMERIC_TO_ALPHA2: Record<string, string> = ${JSON.stringify(numericToAlpha2, null, 0)}
`,
)

console.log(
  `${Object.keys(numericToAlpha2).length} Länderkennungen` +
    (unmatched.length ? ` – ohne Zuordnung: ${unmatched.join(', ')}` : ''),
)
