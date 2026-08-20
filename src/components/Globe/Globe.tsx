import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Earth } from './Earth'
import { Axis, OriginMarker } from './Axis'
import { CameraRig } from './CameraRig'
import { ViewOffset } from './ViewOffset'
import { useAppStore } from '../../store/gameStore'
import { usePrefersReducedMotion } from '../../lib/motion'

/**
 * Der Globus. Ziehen dreht, Scrollen zoomt; solange noch keine Adresse
 * gewählt ist, dreht er sich langsam von selbst.
 */
export function Globe() {
  const phase = useAppStore((s) => s.phase)
  const site = useAppStore((s) => s.site)
  const target = useAppStore((s) => s.target)
  const reducedMotion = usePrefersReducedMotion()

  // Sobald jemand selbst dreht, übernimmt er das Kommando über die Kamera.
  const [userControlling, setUserControlling] = useState(false)

  return (
    <Canvas
      camera={{ position: [0, 0.6, 3], fov: 42 }}
      dpr={[1, 2]}
      // Auf schwächerer Hardware lieber weniger Kantenglättung als Ruckeln.
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#07060f']} />

      <ambientLight intensity={1.75} />
      <directionalLight position={[4, 2.5, 3]} intensity={0.85} />
      <directionalLight position={[-3, -1, -2]} intensity={0.35} color="#2ef2e0" />

      <Suspense fallback={null}>
        <Stars radius={60} depth={40} count={1400} factor={3} saturation={0} fade speed={0.4} />

        <Earth revealed={phase === 'revealed'} reducedMotion={reducedMotion} />

        {site && phase === 'located' && (
          <OriginMarker point={site} reducedMotion={reducedMotion} />
        )}

        {site && target && phase === 'revealed' && (
          <Axis
            origin={site}
            target={target.point}
            visible
            reducedMotion={reducedMotion}
            originLabel={site.shortLabel ?? 'Start'}
            targetLabel={target.label ? target.label.split(',')[0] : 'Gegenpunkt'}
          />
        )}
      </Suspense>

      {/* Erst ab der zweiten Phase versetzen – vorher soll der Globus mittig
          stehen, da ist noch nichts zu verdecken. */}
      <ViewOffset enabled={phase !== 'empty'} />

      <CameraRig
        phase={phase}
        point={site}
        userControlling={userControlling}
        reducedMotion={reducedMotion}
      />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        minDistance={1.35}
        maxDistance={7}
        autoRotate={phase === 'empty' && !reducedMotion}
        autoRotateSpeed={0.35}
        onStart={() => setUserControlling(true)}
      />
    </Canvas>
  )
}
