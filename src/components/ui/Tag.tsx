import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'cyan' | 'warn' | 'danger' | 'muted'

const TONE: Record<Tone, string> = {
  cyan: 'bg-cyan-deep text-cyan-bright',
  warn: 'bg-warn text-abyss',
  danger: 'bg-danger text-bone',
  muted: 'bg-dusk text-ash',
}

/** Angeschrägtes Label für Statuswerte und Kategorien. */
export function Tag({
  children,
  tone = 'cyan',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'clip-tag font-pixel inline-block py-1 pr-4 pl-2 text-[10px] tracking-[0.16em] uppercase',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
