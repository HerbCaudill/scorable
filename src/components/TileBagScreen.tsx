import { useGameStore } from '@/lib/gameStore'
import {
  getRemainingTiles,
  getRemainingTileCount,
  getSortedTileEntries,
  TILE_DISTRIBUTION,
  TOTAL_TILES,
} from '@/lib/tileBag'
import { Button } from '@/components/ui/button'
import { IconArrowLeft } from '@tabler/icons-react'
import { Tile } from './Tile'

type Props = {
  onBack: () => void
}

export const UnplayedTilesScreen = ({ onBack }: Props) => {
  const { currentGame } = useGameStore()

  if (!currentGame) return null

  const remainingTiles = getRemainingTiles(currentGame)
  const remainingCount = getRemainingTileCount(currentGame)
  const playedCount = TOTAL_TILES - remainingCount

  const sortedTiles = getSortedTileEntries(TILE_DISTRIBUTION)

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <IconArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Unplayed Tiles</h1>
          <p className="text-sm text-neutral-500">
            {remainingCount} tiles remaining · {playedCount} played
          </p>
        </div>
      </div>

      {/* Tile grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="@container grid grid-cols-7 gap-5">
          {sortedTiles.map(([letter, total]) => {
            const remaining = remainingTiles[letter] || 0
            const played = total - remaining
            const isEmpty = remaining === 0

            return (
              <div key={letter} className="flex flex-col gap-3">
                {/* Tile */}
                <div className={`aspect-square w-full ${isEmpty ? 'opacity-30' : ''}`}>
                  <Tile letter={letter} />
                </div>

                <div className="flex flex-col items-center gap-1">
                  {/* Count remaining */}
                  <span className={`text-xs font-semibold ${isEmpty ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {remaining}
                  </span>

                  {/* Visual indicator: filled dots for remaining, empty for played */}
                  <div className="flex flex-wrap justify-center gap-0.5 px-2">
                    {Array.from({ length: remaining }).map((_, i) => (
                      <div key={`remaining-${i}`} className="size-1.5 rounded-full bg-amber-500" />
                    ))}
                    {Array.from({ length: played }).map((_, i) => (
                      <div key={`played-${i}`} className="size-1.5 rounded-full border border-neutral-300" />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
