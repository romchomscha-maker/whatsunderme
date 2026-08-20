import type { GeoPoint } from './types'

/**
 * Geometrie der Erde.
 *
 * Alle Umrechnungen hier müssen exakt zur UV-Abbildung von Three.js'
 * SphereGeometry passen, sonst sitzt der Marker neben dem Ort. Herleitung
 * steht bei `latLonToVector3`.
 */

/** Mittlerer Erdradius in Kilometern (IUGG). */
export const EARTH_RADIUS_KM = 6371

/** Durchmesser = Länge der Bohrachse durch den Mittelpunkt. */
export const EARTH_DIAMETER_KM = EARTH_RADIUS_KM * 2

/**
 * Der Gegenpunkt: einmal quer durch den Mittelpunkt.
 * Breitengrad spiegeln, Längengrad um 180° drehen.
 */
export function antipode({ lat, lon }: GeoPoint): GeoPoint {
  return {
    lat: -lat,
    lon: lon > 0 ? lon - 180 : lon + 180,
  }
}

/**
 * Kugelkoordinaten → kartesisch, passend zur UV-Abbildung von
 * THREE.SphereGeometry mit einer equirectangularen Textur.
 *
 * SphereGeometry legt den Vertex bei (u, v) auf
 *   x = -r·cos(u·2π)·sin(v·π),  y = r·cos(v·π),  z = r·sin(u·2π)·sin(v·π)
 * und setzt uv = (u, 1−v). Die Textur bildet den Längengrad linear auf u ab
 * (u = (lon+180)/360) und den Breitengrad auf 1−v (v = (90−lat)/180).
 *
 * Eingesetzt und vereinfacht bleibt:
 *   x =  r·cos(lat)·cos(lon)
 *   y =  r·sin(lat)
 *   z = −r·cos(lat)·sin(lon)
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius = 1,
): [number, number, number] {
  const phi = (lat * Math.PI) / 180
  const lambda = (lon * Math.PI) / 180
  return [
    radius * Math.cos(phi) * Math.cos(lambda),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(lambda),
  ]
}

/**
 * Position in der equirectangularen Textur, in Pixeln.
 * Gleiche Abbildung wie oben – hier wird die Textur damit gezeichnet.
 */
export function latLonToPixel(
  lat: number,
  lon: number,
  width: number,
  height: number,
): [number, number] {
  return [((lon + 180) / 360) * width, ((90 - lat) / 180) * height]
}

/** Bringt einen Längengrad zurück in den Bereich [-180, 180). */
export function normalizeLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180
}
