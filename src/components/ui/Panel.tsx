import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Kleine Überschrift in der Titelleiste. */
  title?: ReactNode
  /** Rechts in der Titelleiste, z. B. ein Statuswert. */
  aside?: ReactNode
  /** Warnstreifen-Kante oben – für Gefahren-/Hitze-Panels. */
  hazard?: boolean
  /** Ohne Innenabstand, wenn der Inhalt selbst bis an den Rand geht. */
  flush?: boolean
}

/** Gerätekasten-Optik: gekappte Ecken, sichtbarer Rahmen, Nietenreihe. */
export function Panel({
  title,
  aside,
  hazard = false,
  flush = false,
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <div
      {...rest}
      className={cn(
        'clip-bevel relative border-2 border-steel bg-night/90 backdrop-blur-sm',
        className,
      )}
    >
      {hazard && <div aria-hidden className="hazard-stripes h-1.5 w-full opacity-80" />}

      {(title || aside) && (
        <div className="flex items-center justify-between gap-3 border-b-2 border-steel bg-dusk/70 px-3 py-1.5">
          <span className="font-pixel text-[10px] tracking-[0.18em] text-cyan uppercase">
            {title}
          </span>
          {aside && <span className="font-ui text-ash text-[11px] tabular">{aside}</span>}
        </div>
      )}

      {/* Nietenreihe als Deko am unteren Rand. Bei `flush` weggelassen –
          dort geht der Inhalt bis an die Kante und die Nieten lägen darauf. */}
      {!flush && (
        <div
          aria-hidden
          className="rivets pointer-events-none absolute inset-x-3 bottom-1.5 h-[7px] opacity-40"
        />
      )}

      <div className={cn(!flush && 'p-4 pb-6')}>{children}</div>
    </div>
  )
}
