/**
 * Post-Processing über der ganzen App: Film-Grain, Scanlines, Vignette.
 * Alles bei ~5 % Deckkraft – man soll es spüren, nicht sehen.
 * Die Deckkraft steckt in index.css, damit sie an einer Stelle justierbar ist.
 */
export function ScreenFx() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50">
      <div className="fx-vignette absolute inset-0" />
      <div className="fx-scanlines absolute inset-0" />
      <div className="fx-grain absolute -inset-[10%]" />
    </div>
  )
}
