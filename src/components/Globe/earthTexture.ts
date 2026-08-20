import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, Geometry, Position } from 'geojson'
import worldData from 'world-atlas/countries-110m.json'
import { latLonToPixel } from '../../lib/geo'

/**
 * Erzeugt die Erdtextur prozedural aus Vektordaten (Natural Earth, 1:110 m,
 * via world-atlas) statt aus einer Bilddatei. Vorteil: die Farben lassen sich
 * an die Palette anpassen und es gibt keine externe Textur zu laden.
 *
 * Die Abbildung ist equirectangular und deckt sich exakt mit
 * `latLonToPixel` / `latLonToVector3` – nur dann sitzen die Marker richtig.
 */

const PALETTE = {
  ocean: '#0e1430',
  oceanDeep: '#080c20',
  land: '#2f6d63',
  landHigh: '#3f8578',
  border: '#0e1430',
  graticule: 'rgba(141, 132, 184, 0.13)',
  equator: 'rgba(46, 242, 224, 0.22)',
}

/**
 * Längengrade einer Ringkette fortlaufend machen: Springt die Kette über die
 * Datumsgrenze, würde sie sonst quer über die ganze Karte gezeichnet.
 */
function unwrapRing(ring: Position[]): Position[] {
  const out: Position[] = []
  let offset = 0
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i]
    if (i > 0) {
      const prevLon = ring[i - 1][0]
      const delta = lon - prevLon
      if (delta > 180) offset -= 360
      else if (delta < -180) offset += 360
    }
    out.push([lon + offset, lat])
  }
  return out
}

function tracePolygon(
  ctx: CanvasRenderingContext2D,
  rings: Position[][],
  width: number,
  height: number,
  shiftPx: number,
) {
  ctx.beginPath()
  for (const ring of rings) {
    const unwrapped = unwrapRing(ring)
    for (let i = 0; i < unwrapped.length; i++) {
      const [lon, lat] = unwrapped[i]
      const [x, y] = latLonToPixel(lat, lon, width, height)
      if (i === 0) ctx.moveTo(x + shiftPx, y)
      else ctx.lineTo(x + shiftPx, y)
    }
    ctx.closePath()
  }
}

function drawGraticule(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.lineWidth = Math.max(1, w / 2048)
  ctx.strokeStyle = PALETTE.graticule

  for (let lon = -180; lon <= 180; lon += 30) {
    const [x] = latLonToPixel(0, lon, w, h)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = latLonToPixel(lat, 0, w, h)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // Äquator etwas kräftiger – hilft beim Einordnen des Gegenpunkts.
  ctx.strokeStyle = PALETTE.equator
  ctx.lineWidth = Math.max(1.5, w / 1024)
  const [, eq] = latLonToPixel(0, 0, w, h)
  ctx.beginPath()
  ctx.moveTo(0, eq)
  ctx.lineTo(w, eq)
  ctx.stroke()
}

/** Zeichnet die Weltkarte in ein Canvas und gibt es zurück. */
export function createEarthCanvas(width = 2048): HTMLCanvasElement {
  const height = width / 2
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Ozean mit leichtem Verlauf zu den Polen – wirkt weniger flach.
  const ocean = ctx.createLinearGradient(0, 0, 0, height)
  ocean.addColorStop(0, PALETTE.oceanDeep)
  ocean.addColorStop(0.5, PALETTE.ocean)
  ocean.addColorStop(1, PALETTE.oceanDeep)
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, width, height)

  drawGraticule(ctx, width, height)

  const topology = worldData as unknown as Topology
  const collection = feature(
    topology,
    topology.objects.countries as GeometryCollection,
  ) as unknown as { features: Feature<Geometry>[] }

  const land = ctx.createLinearGradient(0, 0, 0, height)
  land.addColorStop(0, PALETTE.landHigh)
  land.addColorStop(0.45, PALETTE.land)
  land.addColorStop(1, PALETTE.landHigh)

  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(1, width / 1600)

  for (const f of collection.features) {
    const geom = f.geometry
    const polygons: Position[][][] =
      geom.type === 'Polygon'
        ? [geom.coordinates]
        : geom.type === 'MultiPolygon'
          ? geom.coordinates
          : []

    for (const rings of polygons) {
      // Dreimal zeichnen (links, mittig, rechts): so bleiben Länder, die über
      // die Datumsgrenze reichen, auf beiden Kartenrändern sichtbar.
      for (const shift of [-width, 0, width]) {
        tracePolygon(ctx, rings, width, height, shift)
        ctx.fillStyle = land
        ctx.fill('evenodd')
        ctx.strokeStyle = PALETTE.border
        ctx.stroke()
      }
    }
  }

  return canvas
}
