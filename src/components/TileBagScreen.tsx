import { getSortedTileEntries } from "@/lib/getSortedTileEntries"
import { getRemainingTileCount } from "@/lib/getRemainingTileCount"
import { getRemainingTiles } from "@/lib/getRemainingTiles"
import { TILE_DISTRIBUTION, TOTAL_TILES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { Tile } from "./Tile"
import type { Game } from "@/lib/types"

export const UnplayedTilesScreen = ({ game, onBack }: Props) => {
  const remainingTiles = getRemainingTiles(game)
  const remainingCount = getRemainingTileCount(game)
  const playedCount = TOTAL_TILES - remainingCount

  const sortedTiles = getSortedTileEntries(TILE_DISTRIBUTION)

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back">
          <IconArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-base font-semibold">Unplayed tiles</h1>
          <p className="text-xs text-neutral-500">
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
                  <div key={`remaining-${i}`} className="aspect-square w-6">
                    <Tile letter={letter} />
                  </div>
                ))}
                {/* Played tiles (faded) */}
                {Array.from({ length: played }).map((_, i) => (
                  <div key={`played-${i}`} className="aspect-square w-6 opacity-20">
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

type Props = {
  game: Game
  onBack: () => void
}
