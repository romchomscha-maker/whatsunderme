import { useGameStore } from './store/gameStore'
import { TitleScreen } from './components/Screens/TitleScreen'
import { SearchScreen } from './components/Screens/SearchScreen'
import { GlobeScreen } from './components/Screens/GlobeScreen'
import { DrillScreen } from './components/Screens/DrillScreen'
import { ResultScreen } from './components/Screens/ResultScreen'
import { ScreenFx } from './components/ui/ScreenFx'
import { MuteButton } from './components/ui/MuteButton'
import type { ScreenId } from './lib/types'

const SCREENS: Record<ScreenId, () => React.JSX.Element | null> = {
  title: TitleScreen,
  search: SearchScreen,
  globe: GlobeScreen,
  drill: DrillScreen,
  result: ResultScreen,
}

export default function App() {
  const screen = useGameStore((s) => s.screen)
  const leaving = useGameStore((s) => s.leavingScreen)
  const Current = SCREENS[screen]

  return (
    <div className="relative min-h-[100dvh] bg-void">
      {/* `key` erzwingt einen echten Remount – jeder Screen startet sauber. */}
      <Current key={screen} />

      {/* Übergangsblitz: kurzer Cyan-Wisch statt Crossfade zweier Screens. */}
      {leaving && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-45 bg-cyan/12"
          style={{ animation: 'screen-out 0.24s cubic-bezier(0.7,0,0.84,0) both' }}
        />
      )}

      <MuteButton />
      <ScreenFx />
    </div>
  )
}
