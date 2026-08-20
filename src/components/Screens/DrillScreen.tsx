import { Screen } from '../ui/Screen'
import { Button } from '../ui/Button'
import { Tag } from '../ui/Tag'
import { useGameStore } from '../../store/gameStore'

/**
 * TODO (Schritte 4/5/8): Querschnitt-Canvas mit nicht-linearer Tiefenskala,
 * Bohr-Animation, HUD und Spielmechaniken (Hitze, Bohrkerne).
 */
export function DrillScreen() {
  const goTo = useGameStore((s) => s.goTo)
  const site = useGameStore((s) => s.site)

  if (!site) return null

  return (
    <Screen>
      <div className="w-full max-w-lg text-center">
        <Tag tone="warn">Bohrung läuft</Tag>

        <div className="clip-bevel mt-4 flex min-h-[50dvh] w-full items-center justify-center border-2 border-steel bg-abyss/60">
          <p className="font-pixel text-[10px] tracking-[0.16em] text-steel uppercase">
            Querschnitt
            <br />
            <span className="text-cyan-deep">Schritte 3–5</span>
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => goTo('globe')}>
            ← Abbrechen
          </Button>
          <Button glyph="▲" onClick={() => goTo('result')}>
            Durchbruch
          </Button>
        </div>
      </div>
    </Screen>
  )
}
