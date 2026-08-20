import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface DataRow {
  label: ReactNode
  value: ReactNode
  /** Hebt den Wert im Akzent hervor. */
  accent?: boolean
}

/**
 * Label-Wert-Liste für Panels, HUD und Bohrprotokoll.
 *
 * Die Werte brechen bewusst nicht um: eine Koordinate, bei der nur noch das
 * "W" in der zweiten Zeile steht, sieht kaputt aus. Stattdessen schrumpft die
 * Schrift leicht, damit auch der längste Fall (dreistellige Länge) auf einem
 * 390px-Display in eine Zeile passt.
 */
export function DataList({ rows, className }: { rows: DataRow[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm', className)}>
      {rows.map((row, i) => (
        <div key={i} className="col-span-2 grid grid-cols-subgrid items-baseline">
          <dt className="text-ash">{row.label}</dt>
          <dd
            className={cn(
              'tabular text-right text-[13px] whitespace-nowrap',
              row.accent ? 'text-cyan' : 'text-bone',
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
