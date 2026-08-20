import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Verschiebt den Bildmittelpunkt der Kamera, damit der Globus nicht unter der
 * Bedienung liegt.
 *
 * Ohne das endet die Achse genau dort, wo auf dem Desktop die Panels stehen –
 * und der Austrittspunkt, also die eigentliche Antwort, wäre verdeckt.
 *
 * `setViewOffset` rendert einen versetzten Ausschnitt: ein negatives `x`
 * schiebt den Inhalt nach rechts, ein negatives `y` nach unten.
 */
export function ViewOffset({ enabled }: { enabled: boolean }) {
  const { camera, size } = useThree()

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    if (!enabled) {
      cam.clearViewOffset()
      return
    }

    // Nur im Überlagerungsmodus nötig. Schmal hat der Globus seinen eigenen
    // Bereich über der Bedienung, da ist nichts zu verdecken.
    const wide = size.width >= 768
    if (!wide) {
      cam.clearViewOffset()
      return
    }

    const shiftX = Math.min(size.width * 0.2, 240)
    cam.setViewOffset(size.width, size.height, -shiftX, 0, size.width, size.height)

    return () => cam.clearViewOffset()
  }, [camera, size.width, size.height, enabled])

  return null
}
