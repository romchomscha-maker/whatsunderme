import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  /** Kleines Icon/Glyph vor dem Text. */
  glyph?: ReactNode
}

/**
 * Chunky Indie-Button: gekappte Ecken, harter Schattenversatz, rastet beim
 * Klick nach unten ein.
 *
 * Der Schatten liegt als eigenes Element hinter dem Button, weil `clip-path`
 * einen `box-shadow` mit wegschneiden würde.
 */

const FACE: Record<Variant, string> = {
  primary: 'bg-cyan text-abyss border-cyan-bright hover:bg-cyan-bright',
  secondary: 'bg-dusk text-bone border-steel hover:bg-steel',
  ghost: 'bg-transparent text-ash border-steel hover:text-bone hover:border-ash',
  danger: 'bg-danger text-bone border-[#ff8494] hover:brightness-110',
}

const SHADOW: Record<Variant, string> = {
  primary: 'bg-cyan-deep',
  secondary: 'bg-abyss',
  ghost: 'bg-abyss',
  danger: 'bg-[#6d0f1c]',
}

const SIZE: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 tracking-[0.14em]',
  md: 'text-sm px-5 py-2.5 tracking-[0.16em]',
  lg: 'text-base px-8 py-4 tracking-[0.18em]',
}

/** Versatz des Schattens in Pixeln, je Größe. */
const OFFSET: Record<Size, number> = { sm: 3, md: 4, lg: 5 }

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  glyph,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const offset = OFFSET[size]

  return (
    <span
      className={cn(
        'relative inline-grid align-middle isolate',
        block && 'w-full',
        className,
      )}
      style={{ paddingRight: offset, paddingBottom: offset }}
    >
      {/* Schattenplatte */}
      <span
        aria-hidden
        className={cn(
          'clip-bevel-sm pointer-events-none absolute',
          disabled ? 'opacity-30' : 'opacity-100',
          SHADOW[variant],
        )}
        style={{ inset: `${offset}px 0 0 ${offset}px` }}
      />

      <button
        {...rest}
        disabled={disabled}
        className={cn(
          'clip-bevel-sm relative z-10 inline-flex items-center justify-center gap-2',
          'font-display uppercase whitespace-nowrap',
          'border-2 transition-[transform,background-color,filter] duration-100',
          'ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          'active:translate-x-[var(--snap)] active:translate-y-[var(--snap)]',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-none',
          SIZE[size],
          FACE[variant],
        )}
        style={{ '--snap': `${offset}px` } as React.CSSProperties}
      >
        {glyph && <span aria-hidden>{glyph}</span>}
        {children}
      </button>
    </span>
  )
}
