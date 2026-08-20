import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createEarthCanvas } from './earthTexture'

/**
 * Die Erdkugel.
 *
 * Sobald `revealed` gesetzt ist, wird das Material durchscheinend, damit die
 * Achse durch das Innere sichtbar wird. Der Übergang läuft weich über mehrere
 * Frames statt hart umzuschalten.
 */

const OPAQUE = 1
const TRANSLUCENT = 0.4

export function Earth({
  revealed,
  reducedMotion,
}: {
  revealed: boolean
  reducedMotion: boolean
}) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const wireframe = useRef<THREE.LineSegments>(null)

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(createEarthCanvas(2048))
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [])

  // Gitternetz, das erst beim Aufdecken erscheint: Ohne es würde die fast
  // durchsichtige Kugel ihre Form verlieren.
  const grid = useMemo(() => new THREE.WireframeGeometry(new THREE.SphereGeometry(1.001, 24, 16)), [])

  useFrame((_, delta) => {
    if (!material.current) return
    const target = revealed ? TRANSLUCENT : OPAQUE
    const speed = reducedMotion ? 1 : 1 - Math.pow(0.002, delta)

    material.current.opacity = reducedMotion
      ? target
      : THREE.MathUtils.lerp(material.current.opacity, target, speed)

    const seeThrough = material.current.opacity < 0.995

    /*
     * Undurchsichtig und durchscheinend brauchen gegensätzliche Einstellungen:
     *
     *  undurchsichtig – nur Vorderseiten, mit Tiefenpuffer. Ohne das zeichnet
     *    die abgewandte Hälfte über die zugewandte und man schaut versehentlich
     *    auf die Rückseite der Erde.
     *  durchscheinend – beide Seiten, ohne Tiefenpuffer, damit sich vordere und
     *    hintere Hälfte überlagern und die Achse dazwischen sichtbar bleibt.
     */
    if (material.current.transparent !== seeThrough) {
      material.current.transparent = seeThrough
      material.current.depthWrite = !seeThrough
      material.current.side = seeThrough ? THREE.DoubleSide : THREE.FrontSide
      material.current.needsUpdate = true
    }

    if (wireframe.current) {
      const mat = wireframe.current.material as THREE.LineBasicMaterial
      const gridTarget = revealed ? 0.13 : 0
      mat.opacity = reducedMotion
        ? gridTarget
        : THREE.MathUtils.lerp(mat.opacity, gridTarget, speed)
      wireframe.current.visible = mat.opacity > 0.01
    }
  })

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 96, 64]} />
        <meshStandardMaterial
          ref={material}
          map={texture}
          roughness={0.92}
          metalness={0}
          transparent={false}
          opacity={1}
          side={THREE.FrontSide}
          depthWrite
        />
      </mesh>

      <lineSegments ref={wireframe} geometry={grid} visible={false}>
        <lineBasicMaterial color="#8ffff4" transparent opacity={0} />
      </lineSegments>

      {/* Atmosphäre: schwacher Cyan-Saum an der Kante. */}
      <mesh scale={1.035}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial
          color="#2ef2e0"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
