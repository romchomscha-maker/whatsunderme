import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Gemeinsamer Rahmen aller Screens inkl. Eintritts-Animation. */
export function Screen({
  children,
  className,
  center = true,
}: {
  children: ReactNode
  className?: string
  center?: boolean
}) {
  return (
    <main
      className={cn(
        'screen-enter relative flex min-h-[100dvh] w-full flex-col',
        center && 'items-center justify-center',
        'px-5 py-16',
        className,
      )}
    >
      {children}
    </main>
  )
}
