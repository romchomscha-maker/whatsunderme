import { Globe } from './components/Globe/Globe'
import { AddressSearch } from './components/AddressSearch'
import { ResultPanel } from './components/ResultPanel'
import { Button } from './components/ui/Button'
import { Panel } from './components/ui/Panel'
import { DataList } from './components/ui/DataList'
import { ScreenFx } from './components/ui/ScreenFx'
import { useAppStore } from './store/gameStore'
import { formatCoords, formatElevation } from './lib/format'

/**
 * Eine Seite, drei Zustände: Adresse wählen → berechnen → Gegenpunkt ablesen.
 *
 * Der Globus liegt vollflächig im Hintergrund, die Bedienung schwebt darüber.
 * Auf schmalen Displays rutscht die Bedienung unter den Globus, damit man
 * beides gleichzeitig sieht.
 */
export default function App() {
  const phase = useAppStore((s) => s.phase)
  const site = useAppStore((s) => s.site)
  const origin = useAppStore((s) => s.origin)
  const reveal = useAppStore((s) => s.reveal)
  const reset = useAppStore((s) => s.reset)

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-abyss md:block">
      {/*
        Schmal: Globus oben, Bedienung darunter – nebeneinander wäre beides zu
        klein. Breit: Globus vollflächig im Hintergrund, Bedienung schwebt in
        einer Spalte darüber.
      */}
      <div className="relative h-[44dvh] shrink-0 md:absolute md:inset-0 md:h-auto">
        <Globe />
      </div>

      {/* `pointer-events-none` nur im Überlagerungsmodus, damit man breit
          zwischen den Panels weiterhin am Globus drehen kann. */}
      <div className="relative flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:pointer-events-none md:absolute md:inset-0 md:justify-between md:overflow-hidden md:p-6">
        <header className="pointer-events-auto flex w-full flex-col gap-3 md:max-w-md">
          <div>
            <h1 className="font-display text-2xl leading-none text-bone uppercase md:text-3xl">
              Was ist <span className="text-cyan">unter mir?</span>
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-ash md:text-sm">
              Adresse eingeben, senkrecht durch die Erde schauen – und sehen, wo
              du auf der anderen Seite wieder rauskommst.
            </p>
          </div>

          <AddressSearch />

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void reveal()} disabled={!site || phase === 'revealed'}>
              Berechnen
            </Button>
            {phase === 'revealed' && (
              <Button variant="ghost" size="sm" onClick={reset}>
                Zurücksetzen
              </Button>
            )}
          </div>
        </header>

        <footer className="pointer-events-auto flex w-full flex-col gap-3 md:max-w-md">
          {site && phase !== 'empty' && (
            <Panel title="Startpunkt" aside={site.countryCode}>
              <h2 className="truncate text-lg leading-tight text-bone uppercase">
                {site.shortLabel ?? site.label}
              </h2>
              <DataList
                className="mt-2"
                rows={[
                  { label: 'Koordinaten', value: formatCoords(site.lat, site.lon) },
                  {
                    label: 'Höhe',
                    value: origin?.elevation
                      ? formatElevation(origin.elevation.meters)
                      : '…',
                  },
                ]}
              />
            </Panel>
          )}

          <ResultPanel />

          {phase === 'empty' && (
            <p className="font-pixel text-[9px] tracking-[0.18em] text-ash/60 uppercase">
              Ziehen zum Drehen · Scrollen zum Zoomen
            </p>
          )}
        </footer>
      </div>

      <ScreenFx />
    </div>
  )
}
