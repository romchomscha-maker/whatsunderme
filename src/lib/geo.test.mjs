/**
 * Prüft die Geometrie gegen bekannte Punkte. Läuft ohne Test-Framework:
 *   node --experimental-strip-types src/lib/geo.test.mjs
 */
import assert from 'node:assert/strict'
import { antipode, latLonToVector3, latLonToPixel, normalizeLon } from './geo.ts'

const close = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b} erwartet`)

// --- Gegenpunkte ---------------------------------------------------------
// Deutschland landet im Südpazifik südöstlich von Neuseeland.
{
  const a = antipode({ lat: 48.1374, lon: 11.5755 })
  close(a.lat, -48.1374)
  close(a.lon, -168.4245)
}
// Nullmeridian und Datumsgrenze sind die beiden Randfälle.
close(antipode({ lat: 0, lon: 0 }).lon, 180)
close(antipode({ lat: 0, lon: 180 }).lon, 0)
close(antipode({ lat: 0, lon: -180 }).lon, 0)
// Zweimal gespiegelt ergibt wieder den Ausgangspunkt.
{
  const p = { lat: 51.5074, lon: -0.1278 }
  const back = antipode(antipode(p))
  close(back.lat, p.lat)
  close(back.lon, p.lon, 1e-9)
}

// --- Kartesische Umrechnung ---------------------------------------------
{
  const [x, y, z] = latLonToVector3(0, 0, 1)
  close(x, 1)
  close(y, 0)
  close(z, 0)
}
{
  const [x, y, z] = latLonToVector3(90, 0, 1) // Nordpol
  close(x, 0, 1e-15)
  close(y, 1)
  close(z, 0, 1e-15)
}
{
  const [, y] = latLonToVector3(-90, 0, 1) // Südpol
  close(y, -1)
}
{
  const [x, , z] = latLonToVector3(0, 90, 1) // 90° Ost
  close(x, 0, 1e-15)
  close(z, -1)
}
// Jeder Punkt liegt auf der Einheitskugel.
for (const [lat, lon] of [[48.1, 11.6], [-33.9, 151.2], [64.1, -21.9], [0, 179.9]]) {
  const [x, y, z] = latLonToVector3(lat, lon, 1)
  close(Math.hypot(x, y, z), 1, 1e-12)
}
// Der Gegenpunkt muss exakt der gespiegelte Vektor sein – das ist die
// eigentliche Zusicherung: der rote Strich geht durch den Mittelpunkt.
for (const [lat, lon] of [[48.1374, 11.5755], [-12.5, 130.8], [0, 0], [37.8, -122.4]]) {
  const v = latLonToVector3(lat, lon, 1)
  const a = antipode({ lat, lon })
  const w = latLonToVector3(a.lat, a.lon, 1)
  for (let i = 0; i < 3; i++) close(w[i], -v[i], 1e-12)
}

// --- Texturkoordinaten ---------------------------------------------------
{
  const [px, py] = latLonToPixel(0, 0, 3600, 1800)
  close(px, 1800)
  close(py, 900) // Mitte der Karte
}
{
  const [px, py] = latLonToPixel(90, -180, 3600, 1800)
  close(px, 0)
  close(py, 0) // oben links
}
{
  const [px, py] = latLonToPixel(-90, 180, 3600, 1800)
  close(px, 3600)
  close(py, 1800) // unten rechts
}

// --- Normalisierung ------------------------------------------------------
close(normalizeLon(190), -170)
close(normalizeLon(-190), 170)
close(normalizeLon(0), 0)
close(normalizeLon(-180), -180)

console.log('geo.ts: alle Prüfungen bestanden ✓')
