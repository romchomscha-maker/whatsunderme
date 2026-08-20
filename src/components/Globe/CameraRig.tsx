import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { latLonToVector3 } from '../../lib/geo'
import type { GeoPoint } from '../../lib/types'
import type { Phase } from '../../store/gameStore'

/**
 * Führt die Kamera. Zwei Einstellungen:
 *
 *  gesetzt    – frontal auf die Adresse, nah genug um den Ort zu erkennen
 *  aufgedeckt – seitlich versetzt, damit die Achse als Strecke sichtbar ist
 *               und nicht als einzelner Punkt genau auf uns zu zeigt
 *
 * Sobald der Nutzer selbst dreht, hört die Führung auf – niemand mag es,
 * wenn ihm die Kamera unter den Fingern weggezogen wird.
 */

const DISTANCE = { located: 2.5, revealed: 3.3 }

/** Seitlicher Versatz beim Aufdecken. 0° wäre frontal, 90° exakt quer. */
const REVEAL_ANGLE = (62 * Math.PI) / 180

export function CameraRig({
  phase,
  point,
  userControlling,
  reducedMotion,
}: {
  phase: Phase
  point: GeoPoint | null
  userControlling: boolean
  reducedMotion: boolean
}) {
  const { camera, size } = useThree()
  const settled = useRef(false)

  /**
   * Das Sichtfeld gilt senkrecht. Auf einem hochkant schmalen Ausschnitt ist
   * die Breite der begrenzende Faktor – ohne Ausgleich ragt die Kugel seitlich
   * aus dem Bild und die Marker liegen außerhalb.
   */
  const aspect = size.width / Math.max(size.height, 1)
  const fit = aspect < 1 ? 1 / aspect : 1

  const desired = useMemo(() => {
    if (!point) return null

    const dir = new THREE.Vector3(...latLonToVector3(point.lat, point.lon, 1)).normalize()
    if (phase !== 'revealed') return dir.multiplyScalar(DISTANCE.located * fit)

    // Eine Achse, die senkrecht auf der Bohrachse steht – um sie herum kippen
    // wir die Kamera zur Seite.
    const up = new THREE.Vector3(0, 1, 0)
    let perp = new THREE.Vector3().crossVectors(dir, up)
    if (perp.lengthSq() < 1e-6) {
      // Der Punkt liegt fast auf einem Pol: andere Referenz nehmen.
      perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0))
    }
    perp.normalize()

    return dir
      .clone()
      .multiplyScalar(Math.cos(REVEAL_ANGLE))
      .addScaledVector(perp, Math.sin(REVEAL_ANGLE))
      .normalize()
      .multiplyScalar(DISTANCE.revealed * fit)
  }, [phase, point, fit])

  // Bei jedem Phasenwechsel darf die Kamera wieder selbst fahren.
  useEffect(() => {
    settled.current = false
  }, [phase, point, fit])

  useFrame((_, delta) => {
    if (!desired || userControlling || settled.current) return

    if (reducedMotion) {
      camera.position.copy(desired)
      settled.current = true
      return
    }

    // Rahmenratenunabhängiges Einschwingen mit weichem Auslauf.
    camera.position.lerp(desired, 1 - Math.pow(0.006, delta))
    camera.lookAt(0, 0, 0)

    if (camera.position.distanceTo(desired) < 0.005) settled.current = true
  })

  return null
}
