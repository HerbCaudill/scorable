import { useGameStore } from '@/lib/gameStore'
import { getRemainingTiles, getRemainingTileCount, getSortedTileEntries, TILE_DISTRIBUTION, TOTAL_TILES } from '@/lib/tileBag'
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

      {/* Tile rows - each letter on its own row */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-1">
          {sortedTiles.map(([letter, total]) => {
            const remaining = remainingTiles[letter] || 0
            const played = total - remaining

            return (
              <div key={letter} className="flex gap-1">
                {/* Remaining tiles */}
                {Array.from({ length: remaining }).map((_, i) => (
                  <div key={`remaining-${i}`} className="aspect-square w-8">
                    <Tile letter={letter} />
                  </div>
                ))}
                {/* Played tiles (faded) */}
                {Array.from({ length: played }).map((_, i) => (
                  <div key={`played-${i}`} className="aspect-square w-8 opacity-20">
                    <Tile letter={letter} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
