import { useGameStore } from '../../store/gameStore'

/**
 * Immer sichtbar. Das Spiel startet grundsätzlich stumm – Browser blocken
 * Audio ohne vorherige Nutzer-Interaktion ohnehin (Autoplay-Policy).
 */
export function MuteButton() {
  const muted = useGameStore((s) => s.muted)
  const toggleMute = useGameStore((s) => s.toggleMute)
  const markInteracted = useGameStore((s) => s.markInteracted)

  return (
    <button
      type="button"
      onClick={() => {
        markInteracted()
        toggleMute()
      }}
      aria-pressed={muted}
      aria-label={muted ? 'Ton einschalten' : 'Ton ausschalten'}
      title={muted ? 'Ton einschalten' : 'Ton ausschalten'}
      className="clip-bevel-sm font-pixel fixed top-3 right-3 z-40 flex items-center gap-2 border-2 border-steel bg-night/80 px-2.5 py-1.5 text-[10px] tracking-[0.16em] text-ash uppercase backdrop-blur-sm transition-colors hover:border-cyan hover:text-cyan"
    >
      <span aria-hidden className={muted ? 'text-ash' : 'text-cyan'}>
        {muted ? '◼' : '◗'}
      </span>
      {muted ? 'Ton aus' : 'Ton an'}
    </button>
  )
}
