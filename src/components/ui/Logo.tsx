import { cn } from '../../lib/cn'

/**
 * Wortmarke. Der Versatz-Layer darunter gibt der Schrift Tiefe, ohne dass
 * eine Bilddatei nötig wäre.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('relative select-none', className)}>
      <span
        aria-hidden
        className="font-display absolute inset-0 translate-x-[3px] translate-y-[4px] text-ember uppercase"
      >
        Antipode
      </span>
      <span
        aria-hidden
        className="font-display absolute inset-0 -translate-x-[2px] -translate-y-[2px] text-cyan-deep uppercase"
      >
        Antipode
      </span>
      <h1 className="font-display relative text-bone uppercase">Antipode</h1>
    </div>
  )
}
