import { usePrefersReducedMotion } from '../../lib/motion'

/**
 * Platzhalter-Hintergrund für den Titelscreen: rotierende Kugel plus
 * Sternenfeld, komplett aus CSS-Gradienten.
 *
 * TODO (Schritt 6): durch den echten Three.js-Globus mit Posterize-Shader
 * ersetzen. Die Struktur hier bleibt gleich – nur die Kugel wird getauscht.
 */
export function TitleBackdrop() {
  const reduced = usePrefersReducedMotion()

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Sternenfeld: zwei Ebenen aus Punkt-Gradienten */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 12% 22%, #ece7ff 50%, transparent),
            radial-gradient(1.5px 1.5px at 78% 14%, #8ffff4 50%, transparent),
            radial-gradient(1px 1px at 34% 68%, #ece7ff 50%, transparent),
            radial-gradient(1px 1px at 62% 44%, #8d84b8 50%, transparent),
            radial-gradient(1.5px 1.5px at 88% 76%, #ece7ff 50%, transparent),
            radial-gradient(1px 1px at 22% 88%, #2ef2e0 50%, transparent),
            radial-gradient(1px 1px at 50% 8%, #ece7ff 50%, transparent)
          `,
        }}
      />

      {/* Kugel */}
      <div
        className="absolute top-1/2 left-1/2 aspect-square w-[min(90vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[1px]"
        style={{
          background:
            'radial-gradient(circle at 34% 30%, #2ef2e0 0%, #14a99b 18%, #b4552b 42%, #4a3524 62%, #07060f 78%)',
          boxShadow: '0 0 120px 10px rgba(46,242,224,0.14) inset',
          animation: reduced ? undefined : 'title-spin 48s linear infinite',
        }}
      />

      {/* Terminator-Kante: harte Schattenhälfte über der Kugel */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-abyss/80" />

      <style>{`@keyframes title-spin {
        from { background-position: 0% 50%; filter: hue-rotate(0deg); }
        to   { background-position: 200% 50%; filter: hue-rotate(-14deg); }
      }`}</style>
    </div>
  )
}
