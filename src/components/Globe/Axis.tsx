import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { latLonToVector3 } from '../../lib/geo'
import type { GeoPoint } from '../../lib/types'

/**
 * Der rote Strich: die Gerade von der Adresse durch den Erdmittelpunkt zum
 * Gegenpunkt, plus die Marker an beiden Enden.
 *
 * Die Achse ist als Zylinder gebaut, nicht als Linie – `linewidth` wird von
 * WebGL ignoriert, eine echte Linie wäre also immer hauchdünn.
 */

/** Wie weit die Achse über die Oberfläche hinausragt. */
const OVERSHOOT = 0.16

/** Beschriftung, die am Marker klebt. Bleibt bildschirmgroß, egal wie nah. */
function MarkerLabel({ text, tone }: { text: string; tone: 'origin' | 'target' }) {
  return (
    <Html center distanceFactor={undefined} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div
        className={
          'clip-tag font-pixel translate-y-[-26px] px-2 py-1 text-[9px] whitespace-nowrap uppercase ' +
          (tone === 'origin' ? 'bg-cyan text-abyss' : 'bg-danger text-bone')
        }
        style={{ letterSpacing: '0.14em' }}
      >
        {text}
      </div>
    </Html>
  )
}

function Marker({
  position,
  color,
  pulse,
  label,
  tone,
}: {
  position: THREE.Vector3
  color: string
  pulse: boolean
  label?: string
  tone?: 'origin' | 'target'
}) {
  const ring = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ring.current || !pulse) return
    const t = (clock.elapsedTime % 2) / 2
    const s = 1 + t * 2.2
    ring.current.scale.setScalar(s)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.7
    // Der Ring liegt flach auf der Kugel, zeigt also nach außen.
    ring.current.lookAt(0, 0, 0)
  })

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* Auslaufender Ring, damit der Punkt auch vor buntem Untergrund auffällt */}
      <mesh ref={ring}>
        <ringGeometry args={[0.03, 0.038, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {label && <MarkerLabel text={label} tone={tone ?? 'origin'} />}
    </group>
  )
}

export function Axis({
  origin,
  target,
  visible,
  reducedMotion,
  originLabel,
  targetLabel,
}: {
  origin: GeoPoint
  target: GeoPoint
  visible: boolean
  reducedMotion: boolean
  originLabel?: string
  targetLabel?: string
}) {
  const group = useRef<THREE.Group>(null)
  const cylinder = useRef<THREE.Mesh>(null)

  const { originVec, targetVec, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...latLonToVector3(origin.lat, origin.lon, 1))
    const b = new THREE.Vector3(...latLonToVector3(target.lat, target.lon, 1))
    const dir = a.clone().normalize()

    // Der Zylinder wird entlang Y erzeugt und auf die Achse gedreht.
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)

    return {
      originVec: a,
      targetVec: b,
      quaternion: q,
      length: 2 + OVERSHOOT * 2,
    }
  }, [origin.lat, origin.lon, target.lat, target.lon])

  // Die Achse fährt beim Aufdecken aus dem Mittelpunkt heraus.
  useFrame((_, delta) => {
    if (!group.current || !cylinder.current) return
    const target = visible ? 1 : 0
    const speed = reducedMotion ? 1 : 1 - Math.pow(0.004, delta)
    const next = reducedMotion
      ? target
      : THREE.MathUtils.lerp(cylinder.current.scale.y, target, speed)

    cylinder.current.scale.y = next
    group.current.visible = next > 0.01
  })

  return (
    <group ref={group} visible={false}>
      <mesh ref={cylinder} quaternion={quaternion} scale={[1, 0, 1]}>
        <cylinderGeometry args={[0.008, 0.008, length, 12]} />
        <meshBasicMaterial color="#ff2d46" toneMapped={false} />
      </mesh>

      {/* Weicher Schein um die Achse, damit sie im Inneren nicht untergeht. */}
      <mesh quaternion={quaternion}>
        <cylinderGeometry args={[0.02, 0.02, length, 12]} />
        <meshBasicMaterial
          color="#ff2d46"
          transparent
          opacity={0.22}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      <Marker
        position={originVec}
        color="#2ef2e0"
        pulse={!reducedMotion}
        label={originLabel}
        tone="origin"
      />
      <Marker
        position={targetVec}
        color="#ff2d46"
        pulse={!reducedMotion}
        label={targetLabel}
        tone="target"
      />
    </group>
  )
}

/** Einzelner Marker für die Phase, in der es noch keine Achse gibt. */
export function OriginMarker({
  point,
  reducedMotion,
}: {
  point: GeoPoint
  reducedMotion: boolean
}) {
  const position = useMemo(
    () => new THREE.Vector3(...latLonToVector3(point.lat, point.lon, 1)),
    [point.lat, point.lon],
  )
  return <Marker position={position} color="#2ef2e0" pulse={!reducedMotion} />
}
