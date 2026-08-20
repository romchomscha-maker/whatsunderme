import { Logo } from '../ui/Logo'
import { Button } from '../ui/Button'
import { Screen } from '../ui/Screen'
import { useGameStore } from '../../store/gameStore'
import { TitleBackdrop } from './TitleBackdrop'

export function TitleScreen() {
  const goTo = useGameStore((s) => s.goTo)

  return (
    <Screen>
      <TitleBackdrop />

      <div className="relative flex flex-col items-center gap-8 text-center">
        <p className="font-pixel text-[10px] tracking-[0.42em] text-cyan-dim uppercase">
          Ein Loch, quer durch den Planeten
        </p>

        <Logo className="anim-flicker text-[clamp(2.5rem,15vw,7.5rem)] leading-none" />

        <p className="font-ui max-w-sm text-sm leading-relaxed text-ash">
          Gib eine Adresse ein. Bohr senkrecht nach unten. Sieh, durch welche
          Schichten du fährst – und wo du auf der anderen Seite der Erde wieder
          rauskommst.
        </p>

        <Button
          size="lg"
          onClick={() => goTo('search')}
          className="mt-2 [animation:pulse-soft_2.4s_ease-in-out_infinite]"
        >
          Press Start
        </Button>

        <p className="font-pixel text-[9px] tracking-[0.2em] text-ash/70 uppercase">
          6.371 km bis zur Mitte
        </p>
      </div>
    </Screen>
  )
}
