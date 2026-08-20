import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Respektiert die Systemeinstellung des Nutzers. Wird überall dort abgefragt,
 * wo Bewegung nicht nur Deko ist (Kamerafahrt, Screenshake, Partikel) und
 * deshalb nicht schon per CSS-Media-Query abgeschaltet werden kann.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
